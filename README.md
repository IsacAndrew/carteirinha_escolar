# Carteirinha Escolar

## Iniciar

Dê dois cliques em `iniciar_sistema.bat`. O sistema abre em `http://127.0.0.1:5050`.

Na primeira execução, o launcher cria o ambiente Python, instala as dependências e compila o frontend. Python e Node.js precisam estar instalados; depois do primeiro build, Node.js deixa de ser necessário para o uso normal.

## Supabase

1. Crie um projeto e execute `supabase.sql` no SQL Editor.
2. Crie um bucket privado chamado `fotos-alunos`.
3. Copie `.env.example` para `.env`.
4. Preencha `SUPABASE_URL` e `SUPABASE_SERVICE_KEY`.

Sem essas variáveis, o sistema funciona em modo local e cria `dados/local.json`. A chave de serviço fica somente no backend.

## Desenvolvimento

Frontend:

```text
cd frontend
npm install
npm run dev
```

Backend:

```text
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python backend.py
```

O frontend de desenvolvimento abre em `http://localhost:5173` e encaminha as chamadas ao backend na porta 5050.

## Estrutura

- `backend.py`: API, modo local, Supabase, arquivos e entrega do build.
- `frontend/src`: interface React e editor visual.
- `supabase.sql`: tabelas iniciais.
- `ESPECIFICACAO_MESTRE.md`: regras funcionais fechadas.
- `iniciar_sistema.bat`: inicialização local.

## TXT

A primeira linha deve conter os nomes dos campos. O separador pode ser ponto e vírgula, tabulação, barra vertical ou vírgula.

```text
nome;ra;turma
Ana Souza;1024;6º A
João Lima;1025;6º A
```

