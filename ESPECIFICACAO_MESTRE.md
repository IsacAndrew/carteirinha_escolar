# Especificação-mestre — Carteirinha Escolar

## Regra central

O sistema trabalha com `aluno + modelo = carteirinha`. O aluno é o registro canônico. O modelo guarda objetos editáveis em JSON. Uma personalização individual é um override e nunca altera o modelo dos demais alunos.

## Interface

- Interface operacional, compacta e sem textos instrutivos, slogans ou títulos genéricos.
- Navegação: `Carteirinhas`, `Alunos`, `Modelos`.
- Ações nomeadas de forma curta: `Novo`, `Importar`, `Salvar`, `Visualizar`, `Imprimir`.
- Nenhuma legenda permanente de atalhos.
- Menu contextual próprio dentro do editor.

## Dados

- Supabase Postgres para alunos, modelos e overrides.
- Supabase Storage para fotos, fundos e imagens.
- O frontend nunca recebe a chave privilegiada.
- Sem credenciais, o backend usa um arquivo local para permitir execução imediata.
- Campos do aluno são dinâmicos: os usados no modelo geram o formulário de cadastro.
- Importação TXT aceita cabeçalho com `;`, tabulação, `|` ou vírgula.

## Modelo

- Frente e verso pertencem ao mesmo modelo e têm objetos independentes.
- Prancheta proporcional a 85,60 × 53,98 mm.
- Objetos: texto, campo dinâmico, foto, retângulo, elipse, linha curva e imagem.
- Cada objeto guarda posição, tamanho, rotação, camada, aparência, bloqueio e conteúdo.
- Seleção simples, múltipla por caixa, movimentação, redimensionamento, rotação, duplicação, exclusão e ordem de camada.
- Bordas arredondadas de 0 a 100.
- Linha curva com ponto de controle editável.
- Imagem importada pode ser fundo bloqueado ou elemento.
- Limpeza assistida seleciona retângulos e preenche cada área com uma cor escolhida/amostrada; o resultado vira fundo. Detecção automática fica preparada como extensão, sem simular IA local.
- Modelos podem ser padrão ou exclusivos de um aluno.
- `Editar`, `Visualizar` e `Opções` são modos separados.

## Carteirinha

- O formulário mostra apenas os campos dinâmicos exigidos pelo modelo.
- A foto pertence ao aluno e pode ser reenquadrada sem alterar o quadro do modelo.
- Textos podem reduzir automaticamente para caber ou quebrar linha.
- Alterações específicas de um aluno são salvas como override.

## Impressão

- A4, dimensões físicas fixas, sem posicionamento manual.
- Frente normal em cima e verso rotacionado 180° embaixo.
- Frente e verso formam um bloco indivisível, com espaço de dobra.
- Até quatro blocos por página.
- 1: centralizado; 2: lado a lado; 3: dois em cima e um centralizado embaixo; 4: grade 2 × 2.
- A quinta carteirinha inicia nova página e a regra se repete.
- Seleção por alunos, turma ou várias turmas.

## Arquitetura

- React + Vite no frontend.
- FastAPI em um único `backend.py`, servindo `frontend/dist` em `127.0.0.1:5050`.
- Código organizado por domínio, nomes em português e comentários curtos.
- Launcher cria ambiente Python, instala dependências, compila o frontend quando necessário e abre o navegador.
- Preparado para Render sem caminhos absolutos.

