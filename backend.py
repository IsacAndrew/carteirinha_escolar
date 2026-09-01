import json
import csv
import os
import re
import uuid
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image
from pydantic import BaseModel

load_dotenv()

PASTA_PROJETO = Path(__file__).resolve().parent
PASTA_DADOS = PASTA_PROJETO / "dados"
PASTA_ARQUIVOS = PASTA_DADOS / "arquivos"
ARQUIVO_LOCAL = PASTA_DADOS / "local.json"
ARQUIVO_ALUNOS_TXT = PASTA_DADOS / "alunos.txt"
PASTA_BUILD = PASTA_PROJETO / "frontend" / "dist"
PASTA_DADOS.mkdir(exist_ok=True)
PASTA_ARQUIVOS.mkdir(exist_ok=True)

app = FastAPI(title="Carteirinha Escolar")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["*"], allow_headers=["*"])


class Registro(BaseModel):
    dados: dict[str, Any]


def cliente_supabase():
    # Conectar no Supabase
    endereco = os.getenv("SUPABASE_URL", "").strip()
    chave = os.getenv("SUPABASE_SERVICE_KEY", "").strip()
    if not endereco or not chave:
        return None
    from supabase import create_client
    return create_client(endereco, chave)


def carregar_local():
    # Carregar dados locais
    if not ARQUIVO_LOCAL.exists():
        dados = {"alunos": [], "modelos": [], "overrides": []}
        ARQUIVO_LOCAL.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")
        return dados
    return json.loads(ARQUIVO_LOCAL.read_text(encoding="utf-8"))


def salvar_local(dados):
    # Salvar dados locais
    ARQUIVO_LOCAL.write_text(json.dumps(dados, ensure_ascii=False, indent=2), encoding="utf-8")


def salvar_txt_alunos(alunos):
    # Atualizar o TXT dos alunos
    campos = ["id", "nome", "ra", "rm", "serie", "turma"]
    campos_extras = sorted({campo for aluno in alunos for campo in aluno if campo not in campos})
    campos.extend(campos_extras)
    with ARQUIVO_ALUNOS_TXT.open("w", encoding="utf-8-sig", newline="") as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=campos, delimiter=";", extrasaction="ignore")
        escritor.writeheader()
        escritor.writerows(alunos)


def listar_registros(tabela: str):
    # Listar registros
    cliente = cliente_supabase()
    if cliente:
        registros = cliente.table(tabela).select("*").execute().data
        if tabela == "alunos":
            return [{**(registro.get("dados") or {}), **{campo: valor for campo, valor in registro.items() if campo != "dados"}} for registro in registros]
        return registros
    return carregar_local()[tabela]


def salvar_registro(tabela: str, registro: dict):
    # Salvar registro
    registro["id"] = registro.get("id") or str(uuid.uuid4())
    cliente = cliente_supabase()
    if cliente:
        if tabela == "alunos":
            existente = cliente.table("alunos").select("*").eq("id", registro["id"]).execute().data
            anterior = existente[0] if existente else {}
            completo = {**(anterior.get("dados") or {}), **registro}
            principais = {campo: completo.get(campo) for campo in ["id", "nome", "ra", "turma", "foto", "modelo_id"]}
            principais["dados"] = {campo: valor for campo, valor in completo.items() if campo not in principais}
            salvo = cliente.table("alunos").upsert(principais).execute().data[0]
            return {**(salvo.get("dados") or {}), **{campo: valor for campo, valor in salvo.items() if campo != "dados"}}
        return cliente.table(tabela).upsert(registro).execute().data[0]
    dados = carregar_local()
    indice = next((i for i, item in enumerate(dados[tabela]) if item["id"] == registro["id"]), None)
    if indice is None:
        dados[tabela].append(registro)
    else:
        dados[tabela][indice] = {**dados[tabela][indice], **registro}
    salvar_local(dados)
    if tabela == "alunos":
        salvar_txt_alunos(dados["alunos"])
    return dados[tabela][-1] if indice is None else dados[tabela][indice]


def excluir_registro(tabela: str, registro_id: str):
    # Excluir registro
    cliente = cliente_supabase()
    if cliente:
        cliente.table(tabela).delete().eq("id", registro_id).execute()
        return
    dados = carregar_local()
    dados[tabela] = [item for item in dados[tabela] if item["id"] != registro_id]
    salvar_local(dados)


@app.get("/api/status")
def status():
    return {"banco": "supabase" if cliente_supabase() else "local"}


@app.get("/api/{tabela}")
def listar(tabela: str):
    if tabela not in {"alunos", "modelos", "overrides"}:
        raise HTTPException(404)
    return listar_registros(tabela)


@app.post("/api/{tabela}")
def salvar(tabela: str, registro: Registro):
    if tabela not in {"alunos", "modelos", "overrides"}:
        raise HTTPException(404)
    return salvar_registro(tabela, registro.dados)


@app.delete("/api/{tabela}/{registro_id}")
def excluir(tabela: str, registro_id: str):
    if tabela not in {"alunos", "modelos", "overrides"}:
        raise HTTPException(404)
    excluir_registro(tabela, registro_id)
    return {"ok": True}


@app.post("/api/arquivos")
async def enviar_arquivo(arquivo: UploadFile = File(...)):
    # Salvar foto ou imagem
    identificador = str(uuid.uuid4())
    caminho_original = PASTA_ARQUIVOS / f"{identificador}-{Path(arquivo.filename or 'imagem').name}"
    caminho_original.write_bytes(await arquivo.read())
    caminho_final = PASTA_ARQUIVOS / f"{identificador}.webp"
    try:
        with Image.open(caminho_original) as imagem:
            imagem = imagem.convert("RGB")
            imagem.thumbnail((1400, 1400))
            imagem.save(caminho_final, "WEBP", quality=86)
        caminho_original.unlink(missing_ok=True)
    except Exception:
        caminho_final = caminho_original
    return {"url": f"/arquivos/{caminho_final.name}"}


@app.post("/api/importar-txt")
async def importar_txt(arquivo: UploadFile = File(...)):
    # Importar alunos do TXT
    texto = (await arquivo.read()).decode("utf-8-sig", errors="replace")
    linhas = [linha for linha in texto.splitlines() if linha.strip()]
    if not linhas:
        return []
    separador = max([";", "\t", "|", ","], key=lambda item: linhas[0].count(item))
    apelidos = {
        "nome_do_aluno": "nome", "nome_aluno": "nome", "serie_ano": "serie", "série": "serie",
        "cpf_do_aluno": "cpf", "rg_do_aluno": "rg", "telefone_do_aluno": "telefone",
        "e_mail_do_aluno": "email", "email_do_aluno": "email", "endereco_do_aluno": "endereco",
        "nome_da_mae": "nome_mae", "nome_do_pai": "nome_pai", "autorizados_a_retirada_do_aluno": "autorizados_retirada"
    }
    cabecalho_original = [re.sub(r"\W+", "_", valor.strip().lower()).strip("_") for valor in linhas[0].split(separador)]
    cabecalho = [apelidos.get(campo, campo) for campo in cabecalho_original]
    importados = []
    for linha in linhas[1:]:
        valores = [valor.strip() for valor in linha.split(separador)]
        aluno = {campo: valores[indice] if indice < len(valores) else "" for indice, campo in enumerate(cabecalho)}
        aluno["id"] = aluno.get("id") or str(uuid.uuid4())
        importados.append(salvar_registro("alunos", aluno))
    return importados


app.mount("/arquivos", StaticFiles(directory=PASTA_ARQUIVOS), name="arquivos")

if PASTA_BUILD.exists():
    app.mount("/assets", StaticFiles(directory=PASTA_BUILD / "assets"), name="assets")


@app.get("/{caminho:path}")
def frontend(caminho: str):
    arquivo = PASTA_BUILD / caminho
    if caminho and arquivo.is_file():
        return FileResponse(arquivo)
    if not (PASTA_BUILD / "index.html").exists():
        raise HTTPException(503, "Execute o build do frontend.")
    return FileResponse(PASTA_BUILD / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "5050")))
