import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Stage, Layer, Rect, Ellipse, Text, Image as ImagemKonva, Transformer, Line } from 'react-konva'
import { CreditCard, Users, LayoutTemplate, Plus, Save, Trash2, Upload, Printer, Lock, Unlock, Copy, Image as ImageIcon, Type, Circle, Square, Minus, MousePointer2 } from 'lucide-react'
import './styles.css'

const API = '/api'
const LARGURA = 560
const ALTURA = 353
const objetoBase = { x: 60, y: 60, largura: 140, altura: 52, rotacao: 0, bloqueado: false, preenchimento: '#2f6fed', borda: 'transparent', espessura: 2, raio: 0 }
const CAMPOS_ALUNO = [
  ['nome', 'Nome do aluno'], ['ra', 'RA'], ['rm', 'RM'], ['serie', 'Série'], ['turma', 'Turma'],
  ['data_nascimento', 'Data de nascimento'], ['cpf', 'CPF do aluno'], ['rg', 'RG do aluno'],
  ['telefone', 'Telefone do aluno'], ['email', 'E-mail do aluno'], ['cep', 'CEP do aluno'],
  ['endereco', 'Endereço do aluno'], ['numero', 'Número'], ['complemento', 'Complemento'],
  ['bairro', 'Bairro'], ['cidade', 'Cidade'], ['estado', 'Estado'],
  ['nome_mae', 'Nome da mãe'], ['rg_mae', 'RG da mãe'], ['cpf_mae', 'CPF da mãe'],
  ['telefone_mae', 'Telefone da mãe'], ['email_mae', 'E-mail da mãe'], ['cep_mae', 'CEP da mãe'],
  ['nome_pai', 'Nome do pai'], ['rg_pai', 'RG do pai'], ['cpf_pai', 'CPF do pai'],
  ['telefone_pai', 'Telefone do pai'], ['email_pai', 'E-mail do pai'], ['cep_pai', 'CEP do pai'],
  ['responsavel', 'Responsável legal'], ['telefone_responsavel', 'Telefone do responsável'],
  ['autorizado_sair_sozinho', 'Autorizado a sair sozinho'], ['autorizados_retirada', 'Autorizados à retirada'],
  ['matricula', 'Matrícula'], ['validade', 'Validade'], ['unidade', 'Unidade'], ['turno', 'Turno']
]
const ROTULOS_CAMPOS = Object.fromEntries(CAMPOS_ALUNO)

async function api(caminho, opcoes) {
  const resposta = await fetch(`${API}${caminho}`, opcoes)
  if (!resposta.ok) throw new Error(await resposta.text())
  return resposta.json()
}

function usarImagem(url) {
  const [imagem, definirImagem] = useState(null)
  useEffect(() => {
    if (!url) return definirImagem(null)
    const novaImagem = new Image()
    novaImagem.crossOrigin = 'anonymous'
    novaImagem.onload = () => definirImagem(novaImagem)
    novaImagem.src = url
  }, [url])
  return imagem
}

function ObjetoImagem({ objeto, propriedades }) {
  const imagem = usarImagem(objeto.url)
  return <ImagemKonva image={imagem} {...propriedades} cornerRadius={(objeto.raio / 100) * Math.min(objeto.largura, objeto.altura) / 2} />
}

function Objeto({ objeto, selecionado, aoSelecionar, aoMudar }) {
  const referencia = useRef()
  const transformador = useRef()
  useEffect(() => {
    if (selecionado && referencia.current && transformador.current) {
      transformador.current.nodes([referencia.current])
      transformador.current.getLayer().batchDraw()
    }
  }, [selecionado])
  const propriedades = {
    ref: referencia, x: objeto.x, y: objeto.y, width: objeto.largura, height: objeto.altura,
    rotation: objeto.rotacao || 0, draggable: !objeto.bloqueado, onClick: aoSelecionar, onTap: aoSelecionar,
    onDragEnd: evento => aoMudar({ ...objeto, x: evento.target.x(), y: evento.target.y() }),
    onTransformEnd: () => {
      const no = referencia.current
      aoMudar({ ...objeto, x: no.x(), y: no.y(), rotacao: no.rotation(), largura: Math.max(12, no.width() * no.scaleX()), altura: Math.max(12, no.height() * no.scaleY()) })
      no.scaleX(1); no.scaleY(1)
    }
  }
  let visual
  if (objeto.tipo === 'texto' || objeto.tipo === 'campo') visual = <Text {...propriedades} text={objeto.texto || objeto.campo || 'Texto'} fontSize={objeto.tamanhoFonte || 22} fontFamily="Inter" fill={objeto.cor || '#162033'} align={objeto.alinhamento || 'left'} verticalAlign="middle" wrap="word" />
  else if (objeto.tipo === 'elipse') visual = <Ellipse {...propriedades} radiusX={objeto.largura / 2} radiusY={objeto.altura / 2} width={undefined} height={undefined} x={objeto.x + objeto.largura / 2} y={objeto.y + objeto.altura / 2} fill={objeto.preenchimento} stroke={objeto.borda} strokeWidth={objeto.espessura} />
  else if (objeto.tipo === 'linha') visual = <Line {...propriedades} width={undefined} height={undefined} points={[0, objeto.altura / 2, objeto.largura / 2, objeto.curva ?? 0, objeto.largura, objeto.altura / 2]} tension={0.5} stroke={objeto.preenchimento} strokeWidth={objeto.espessura || 4} lineCap="round" />
  else if (objeto.tipo === 'imagem' || objeto.tipo === 'foto') visual = <ObjetoImagem objeto={objeto} propriedades={propriedades} />
  else visual = <Rect {...propriedades} fill={objeto.preenchimento} stroke={objeto.borda} strokeWidth={objeto.espessura} cornerRadius={(objeto.raio / 100) * Math.min(objeto.largura, objeto.altura) / 2} />
  return <>{visual}{selecionado && !objeto.bloqueado && <Transformer ref={transformador} rotateEnabled enabledAnchors={['top-left','top-right','bottom-left','bottom-right']} />}</>
}

function Editor({ modelo, aoSalvar }) {
  const [lado, definirLado] = useState('frente')
  const [objetos, definirObjetos] = useState(modelo?.[lado] || [])
  const [selecionados, definirSelecionados] = useState([])
  const [menu, definirMenu] = useState(null)
  const [nome, definirNome] = useState(modelo?.nome || 'Novo modelo')
  const entradaImagem = useRef()
  useEffect(() => { definirObjetos(modelo?.[lado] || []) }, [modelo, lado])

  function trocarLado(novoLado) {
    modelo[lado] = objetos
    definirLado(novoLado)
  }
  function adicionar(tipo, extra = {}) {
    const novo = { ...objetoBase, id: crypto.randomUUID(), tipo, ...extra }
    definirObjetos([...objetos, novo]); definirSelecionados([novo.id])
  }
  function atualizar(novo) { definirObjetos(objetos.map(item => item.id === novo.id ? novo : item)) }
  function objetoSelecionado() { return objetos.find(item => item.id === selecionados[0]) }
  function salvar() { aoSalvar({ ...modelo, nome, [lado]: objetos, [lado === 'frente' ? 'verso' : 'frente']: modelo[lado === 'frente' ? 'verso' : 'frente'] || [] }) }
  function excluir() { definirObjetos(objetos.filter(item => !selecionados.includes(item.id))); definirSelecionados([]); definirMenu(null) }
  function duplicar() { const originais = objetos.filter(item => selecionados.includes(item.id)); definirObjetos([...objetos, ...originais.map(item => ({ ...item, id: crypto.randomUUID(), x: item.x + 14, y: item.y + 14 }))]); definirMenu(null) }
  function importarImagem(evento) {
    const arquivo = evento.target.files[0]; if (!arquivo) return
    const leitor = new FileReader()
    leitor.onload = () => adicionar('imagem', { url: leitor.result, x: 0, y: 0, largura: LARGURA, altura: ALTURA, bloqueado: true })
    leitor.readAsDataURL(arquivo)
  }
  const selecionado = objetoSelecionado()
  return <div className="editor">
    <div className="barra-editor">
      <div className="segmentado"><button className={lado==='frente'?'ativo':''} onClick={()=>trocarLado('frente')}>Frente</button><button className={lado==='verso'?'ativo':''} onClick={()=>trocarLado('verso')}>Verso</button></div>
      <input className="nome-modelo" value={nome} onChange={e=>definirNome(e.target.value)} aria-label="Nome do modelo" />
      <button className="primario" onClick={salvar}><Save size={16}/> Salvar</button>
    </div>
    <div className="corpo-editor">
      <aside className="ferramentas">
        <button onClick={()=>adicionar('texto',{texto:'Texto',preenchimento:'transparent'})}><Type/>Texto</button>
        <button onClick={()=>adicionar('campo',{campo:'nome',texto:ROTULOS_CAMPOS.nome,preenchimento:'transparent'})}><MousePointer2/>Campo</button>
        <button onClick={()=>adicionar('foto',{campo:'foto',url:'',preenchimento:'#dfe5ee'})}><ImageIcon/>Foto</button>
        <button onClick={()=>adicionar('retangulo')}><Square/>Retângulo</button>
        <button onClick={()=>adicionar('elipse')}><Circle/>Elipse</button>
        <button onClick={()=>adicionar('linha',{altura:70,curva:0})}><Minus/>Linha</button>
        <button onClick={()=>entradaImagem.current.click()}><Upload/>Imagem</button>
        <input hidden ref={entradaImagem} type="file" accept="image/*" onChange={importarImagem}/>
      </aside>
      <main className="area-prancheta" onContextMenu={e=>{e.preventDefault(); if(selecionado) definirMenu({x:e.clientX,y:e.clientY})}}>
        <div className="prancheta">
          <Stage width={LARGURA} height={ALTURA} onMouseDown={e=>{ if(e.target===e.target.getStage()) definirSelecionados([])}}>
            <Layer>{objetos.map(objeto=><Objeto key={objeto.id} objeto={objeto} selecionado={selecionados.includes(objeto.id)} aoSelecionar={e=>definirSelecionados(e.evt.shiftKey?[...new Set([...selecionados,objeto.id])]:[objeto.id])} aoMudar={atualizar}/>)}</Layer>
          </Stage>
        </div>
      </main>
      <aside className="propriedades">{selecionado ? <>
        <div className="titulo-painel">{selecionado.tipo}</div>
        {selecionado.tipo==='texto'&&<label>Texto<textarea autoFocus value={selecionado.texto||''} onChange={e=>atualizar({...selecionado,texto:e.target.value})}/></label>}
        {selecionado.tipo==='campo'&&<label>Campo<select value={selecionado.campo} onChange={e=>atualizar({...selecionado,campo:e.target.value,texto:ROTULOS_CAMPOS[e.target.value]})}>{CAMPOS_ALUNO.map(([valor,rotulo])=><option key={valor} value={valor}>{rotulo}</option>)}</select></label>}
        {(selecionado.tipo==='texto'||selecionado.tipo==='campo')&&<label>Tamanho<input type="range" min="8" max="72" value={selecionado.tamanhoFonte||22} onChange={e=>atualizar({...selecionado,tamanhoFonte:+e.target.value})}/></label>}
        <label>Cor<input type="color" value={selecionado.preenchimento==='transparent'?'#162033':selecionado.preenchimento} onChange={e=>atualizar({...selecionado,preenchimento:e.target.value,cor:e.target.value})}/></label>
        <label>Arredondamento<input type="range" min="0" max="100" value={selecionado.raio||0} onChange={e=>atualizar({...selecionado,raio:+e.target.value})}/></label>
        {selecionado.tipo==='linha'&&<><label>Curva<input type="range" min="-100" max="100" value={selecionado.curva||0} onChange={e=>atualizar({...selecionado,curva:+e.target.value})}/></label><label>Espessura<input type="range" min="1" max="30" value={selecionado.espessura||4} onChange={e=>atualizar({...selecionado,espessura:+e.target.value})}/></label></>}
        <button onClick={()=>atualizar({...selecionado,bloqueado:!selecionado.bloqueado})}>{selecionado.bloqueado?<Unlock/>:<Lock/>}{selecionado.bloqueado?'Desbloquear':'Bloquear'}</button>
      </>:<div className="vazio">Nenhuma seleção</div>}</aside>
    </div>
    {menu&&<div className="menu-contexto" style={{left:menu.x,top:menu.y}} onMouseLeave={()=>definirMenu(null)}><button onClick={duplicar}><Copy/>Duplicar</button><button onClick={()=>{atualizar({...selecionado,bloqueado:!selecionado.bloqueado});definirMenu(null)}}>{selecionado.bloqueado?<Unlock/>:<Lock/>}{selecionado.bloqueado?'Desbloquear':'Bloquear'}</button><button onClick={excluir}><Trash2/>Excluir</button></div>}
  </div>
}

function Alunos({ alunos, modelos, recarregar }) {
  const [selecionado, definirSelecionado] = useState(null)
  const [busca, definirBusca] = useState('')
  const entradaTxt = useRef()
  const filtrados = alunos.filter(a=>`${a.nome} ${a.ra} ${a.turma}`.toLowerCase().includes(busca.toLowerCase()))
  const modeloAtual = modelos.find(modelo=>modelo.id===selecionado?.modelo_id) || modelos.find(modelo=>modelo.padrao) || modelos[0]
  const camposModelo = [...(modeloAtual?.frente||[]), ...(modeloAtual?.verso||[])]
    .filter(objeto=>objeto.tipo==='campo')
    .map(objeto=>objeto.campo)
    .filter((campo,indice,lista)=>campo && lista.indexOf(campo)===indice)
  async function salvar(evento) {
    evento.preventDefault()
    const alteracoes = Object.fromEntries(new FormData(evento.currentTarget))
    const dados = { ...selecionado, ...alteracoes, id: selecionado?.id }
    await api('/alunos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dados})}); definirSelecionado(null); recarregar()
  }
  async function importar(evento) { const corpo=new FormData(); corpo.append('arquivo',evento.target.files[0]); await api('/importar-txt',{method:'POST',body:corpo}); recarregar() }
  return <div className="pagina-dupla"><section className="painel-lista"><div className="acoes"><input placeholder="Buscar" value={busca} onChange={e=>definirBusca(e.target.value)}/><button onClick={()=>definirSelecionado({})}><Plus/>Novo</button><button onClick={()=>entradaTxt.current.click()}><Upload/>TXT</button><input hidden type="file" ref={entradaTxt} accept=".txt,.csv" onChange={importar}/></div><div className="lista">{filtrados.map(aluno=><button className={selecionado?.id===aluno.id?'selecionado':''} key={aluno.id} onClick={()=>definirSelecionado(aluno)}><span>{aluno.nome||'Sem nome'}</span><small>{aluno.serie||aluno.turma||aluno.ra}</small></button>)}</div></section><section className="painel-form">{selecionado&&<form key={`${selecionado.id||'novo'}-${modeloAtual?.id||''}`} onSubmit={salvar}><label>Modelo<select name="modelo_id" value={selecionado.modelo_id||modeloAtual?.id||''} onChange={e=>definirSelecionado({...selecionado,modelo_id:e.target.value})}>{modelos.map(m=><option key={m.id} value={m.id}>{m.nome}</option>)}</select></label>{camposModelo.map(campo=><label key={campo}>{ROTULOS_CAMPOS[campo]||campo}{campo==='autorizado_sair_sozinho'?<select name={campo} defaultValue={selecionado[campo]||''}><option value=""></option><option value="Sim">Sim</option><option value="Não">Não</option></select>:campo==='autorizados_retirada'?<textarea name={campo} defaultValue={selecionado[campo]||''}/>:<input name={campo} defaultValue={selecionado[campo]||''}/>}</label>)}<div className="acoes-form"><button type="button" onClick={()=>definirSelecionado(null)}>Cancelar</button><button className="primario"><Save/>Salvar</button></div></form>}</section></div>
}

function Modelos({ modelos, recarregar }) {
  const [modelo, definirModelo] = useState(modelos[0] || null)
  useEffect(()=>{if(!modelo&&modelos.length) definirModelo(modelos[0])},[modelos])
  async function salvar(dados) { const salvo=await api('/modelos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dados})}); definirModelo(salvo); recarregar() }
  function novo(){definirModelo({nome:'Novo modelo',frente:[],verso:[],padrao:modelos.length===0})}
  return <div className="modelos"><aside className="lista-modelos"><button className="novo" onClick={novo}><Plus/>Novo</button>{modelos.map(item=><button key={item.id} className={modelo?.id===item.id?'selecionado':''} onClick={()=>definirModelo(item)}><span>{item.nome}</span>{item.padrao&&<small>Padrão</small>}</button>)}</aside>{modelo?<Editor key={modelo.id||'novo'} modelo={{...modelo}} aoSalvar={salvar}/>:<button className="centro-novo" onClick={novo}><Plus/>Novo</button>}</div>
}

function CartaoVisual({ modelo, aluno, lado }) {
  const objetos=(modelo?.[lado]||[]).map(item=>item.tipo==='campo'?{...item,texto:aluno?.[item.campo]||item.campo}:item.tipo==='foto'?{...item,url:aluno?.foto||item.url}:item)
  return <div className="cartao-mini"><Stage width={LARGURA} height={ALTURA}><Layer>{objetos.map(objeto=><Objeto key={objeto.id} objeto={{...objeto,bloqueado:true}} selecionado={false} aoSelecionar={()=>{}} aoMudar={()=>{}}/>)}</Layer></Stage></div>
}

function Carteirinhas({ alunos, modelos }) {
  const [ids, definirIds] = useState([])
  const [serie, definirSerie] = useState('')
  const series = [...new Set(alunos.map(aluno=>aluno.serie).filter(Boolean))].sort()
  const alunosFiltrados = serie ? alunos.filter(aluno=>aluno.serie===serie) : alunos
  const selecionados=alunos.filter(a=>ids.includes(a.id)); const aluno=selecionados[0]
  const modelo=modelos.find(m=>m.id===aluno?.modelo_id)||modelos.find(m=>m.padrao)||modelos[0]
  function imprimir(){window.print()}
  const paginas=[]; for(let i=0;i<selecionados.length;i+=4) paginas.push(selecionados.slice(i,i+4))
  return <div className="carteirinhas"><section className="selecao-impressao"><div className="filtro-serie"><label>Série<select value={serie} onChange={e=>{definirSerie(e.target.value);definirIds([])}}><option value="">Todas</option>{series.map(valor=><option key={valor} value={valor}>{valor}</option>)}</select></label></div><div className="acoes"><button onClick={()=>definirIds(alunosFiltrados.map(a=>a.id))}>Todos</button><button onClick={()=>definirIds([])}>Limpar</button><button className="primario" disabled={!ids.length} onClick={imprimir}><Printer/>Imprimir</button></div><div className="lista check">{alunosFiltrados.map(a=><label key={a.id}><input type="checkbox" checked={ids.includes(a.id)} onChange={e=>definirIds(e.target.checked?[...ids,a.id]:ids.filter(id=>id!==a.id))}/><span>{a.nome}</span><small>{a.serie||a.turma}</small></label>)}</div></section><section className="preview">{aluno&&modelo?<><CartaoVisual modelo={modelo} aluno={aluno} lado="frente"/><CartaoVisual modelo={modelo} aluno={aluno} lado="verso"/></>:<div className="vazio">Nenhuma seleção</div>}</section><div className="folhas-impressao">{paginas.map((pagina,indice)=><div className={`folha grade-${pagina.length}`} key={indice}>{pagina.map(alunoPagina=>{const modeloPagina=modelos.find(m=>m.id===alunoPagina.modelo_id)||modelos.find(m=>m.padrao)||modelos[0];return <div className="bloco-impressao" key={alunoPagina.id}><CartaoVisual modelo={modeloPagina} aluno={alunoPagina} lado="frente"/><div className="dobra"/><div className="verso-impresso"><CartaoVisual modelo={modeloPagina} aluno={alunoPagina} lado="verso"/></div></div>})}</div>)}</div></div>
}

function App(){
  const [pagina, definirPagina]=useState('carteirinhas'); const [alunos,definirAlunos]=useState([]); const [modelos,definirModelos]=useState([]); const [banco,definirBanco]=useState('local')
  async function carregar(){const [a,m,s]=await Promise.all([api('/alunos'),api('/modelos'),api('/status')]);definirAlunos(a);definirModelos(m);definirBanco(s.banco)}
  useEffect(()=>{carregar().catch(console.error)},[])
  return <div className="app"><header><nav><button className={pagina==='carteirinhas'?'ativo':''} onClick={()=>definirPagina('carteirinhas')}><CreditCard/>Carteirinhas</button><button className={pagina==='alunos'?'ativo':''} onClick={()=>definirPagina('alunos')}><Users/>Alunos</button><button className={pagina==='modelos'?'ativo':''} onClick={()=>definirPagina('modelos')}><LayoutTemplate/>Modelos</button></nav><span className="estado">{banco}</span></header>{pagina==='carteirinhas'&&<Carteirinhas alunos={alunos} modelos={modelos}/>} {pagina==='alunos'&&<Alunos alunos={alunos} modelos={modelos} recarregar={carregar}/>} {pagina==='modelos'&&<Modelos modelos={modelos} recarregar={carregar}/>}</div>
}

createRoot(document.getElementById('root')).render(<App/>)
