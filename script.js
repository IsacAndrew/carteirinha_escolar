(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const campos = {
    foto: $("foto"),
    nome: $("nome"),
    serieTurma: $("serieTurma"),
    ra: $("ra"),
    nascimento: $("nascimento"),
    cpf: $("cpf"),
    mae: $("mae"),
    pai: $("pai"),
    autorizados: $("autorizados"),
  };

  const saida = {
    nome: $("outNome"),
    ra: $("outRa"),
    nascimento: $("outNascimento"),
    cpf: $("outCpf"),
    mae: $("outMae"),
    pai: $("outPai"),
    serieTurma: $("outSerieTurma"),
    autorizados: $("outAutorizados"),
  };

  const fotoArea = $("fotoArea");
  const zoomCampo = $("zoomCampo");
  const zoomInput = $("zoom");
  const cartao = $("cartao");
  const btnImprimir = $("btnImprimir");
  const btnLimpar = $("btnLimpar");
  const btnSalvar = $("btnSalvar");
  const buscaSalvas = $("buscaSalvas");
  const filtroAutorizado = $("filtroAutorizado");
  const listaSalvas = $("listaSalvas");
  const listaVazia = $("listaVazia");
  const btnCarregar = $("btnCarregar");
  const btnRemover = $("btnRemover");
  const btnExportarJson = $("btnExportarJson");
  const btnImportarJson = $("btnImportarJson");
  const importarJsonInput = $("importarJsonInput");
  const autorizadosOpcoes = $("autorizadosOpcoes");
  const opcaoAutorizadoSozinho = $("opcaoAutorizadoSozinho");
  const btnConfig = $("btnConfig");
  const toast = $("toast");
  const configWrap = btnConfig.closest(".config-wrap");
  const configMenu = $("configMenu");

  let fotoObjectUrl = null;
  let fotoImg = null;
  let fotoDataUrl = null;
  let autorizadoSozinhoSelecionado = false;
  let idSelecionadoNaLista = null;

  const foto = {
    zoom: 1,
    panXFrac: 0,
    panYFrac: 0,
    arrastando: false,
    inicioX: 0,
    inicioY: 0,
    panXFracInicio: 0,
    panYFracInicio: 0,
  };

  function modeloComFaixa() {
    return autorizadoSozinhoSelecionado;
  }

  function aplicarModelo() {
    const prefixo = modeloComFaixa() ? "carteirinha_faixa" : "carteirinha_sem_faixa";
    document.querySelector(".frente").style.backgroundImage = `url("modelos_de_carteirinha/${prefixo}_frente.png")`;
    document.querySelector(".verso").style.backgroundImage = `url("modelos_de_carteirinha/${prefixo}_verso.png")`;
  }

  function escalaBase() {
    if (!fotoImg) return 1;
    const tamanho = fotoArea.clientWidth;
    return Math.max(
      tamanho / fotoImg.naturalWidth,
      tamanho / fotoImg.naturalHeight
    );
  }

  function limitarPan(tamanho, escala) {
    const largura = fotoImg.naturalWidth * escala;
    const altura = fotoImg.naturalHeight * escala;
    const maxXFrac = Math.max(0, (largura - tamanho) / 2) / tamanho;
    const maxYFrac = Math.max(0, (altura - tamanho) / 2) / tamanho;
    foto.panXFrac = Math.min(maxXFrac, Math.max(-maxXFrac, foto.panXFrac));
    foto.panYFrac = Math.min(maxYFrac, Math.max(-maxYFrac, foto.panYFrac));
  }

  function atualizarFoto() {
    if (!fotoImg) return;
    const tamanho = fotoArea.clientWidth;
    const escala = escalaBase() * foto.zoom;
    limitarPan(tamanho, escala);
    const panXpx = foto.panXFrac * tamanho;
    const panYpx = foto.panYFrac * tamanho;
    fotoImg.style.transform =
      `translate(-50%, -50%) translate(${panXpx}px, ${panYpx}px) scale(${escala})`;
  }

  function iniciarNovaFoto(img) {
    fotoImg = img;
    foto.zoom = 1;
    foto.panXFrac = 0;
    foto.panYFrac = 0;
    zoomInput.value = "1";
    zoomCampo.hidden = false;
    fotoArea.classList.add("tem-foto");
    atualizarFoto();
  }

  function pointerDown(ev) {
    if (!fotoImg) return;
    foto.arrastando = true;
    foto.inicioX = ev.clientX;
    foto.inicioY = ev.clientY;
    foto.panXFracInicio = foto.panXFrac;
    foto.panYFracInicio = foto.panYFrac;
    fotoArea.classList.add("arrastando");
    fotoArea.setPointerCapture(ev.pointerId);
  }

  function pointerMove(ev) {
    if (!foto.arrastando) return;
    const tamanho = fotoArea.clientWidth;
    foto.panXFrac = foto.panXFracInicio + (ev.clientX - foto.inicioX) / tamanho;
    foto.panYFrac = foto.panYFracInicio + (ev.clientY - foto.inicioY) / tamanho;
    atualizarFoto();
  }

  function pointerUp(ev) {
    if (!foto.arrastando) return;
    foto.arrastando = false;
    fotoArea.classList.remove("arrastando");
    if (fotoArea.hasPointerCapture && fotoArea.hasPointerCapture(ev.pointerId)) {
      fotoArea.releasePointerCapture(ev.pointerId);
    }
  }

  fotoArea.addEventListener("pointerdown", pointerDown);
  fotoArea.addEventListener("pointermove", pointerMove);
  fotoArea.addEventListener("pointerup", pointerUp);
  fotoArea.addEventListener("pointercancel", pointerUp);

  fotoArea.addEventListener("wheel", (ev) => {
    if (!fotoImg) return;
    ev.preventDefault();
    const passo = ev.deltaY < 0 ? 0.05 : -0.05;
    foto.zoom = Math.min(3, Math.max(1, foto.zoom + passo));
    zoomInput.value = foto.zoom.toFixed(2);
    atualizarFoto();
  }, { passive: false });

  zoomInput.addEventListener("input", () => {
    foto.zoom = parseFloat(zoomInput.value);
    atualizarFoto();
  });

  window.addEventListener("resize", atualizarFoto);
  function prepararFotoParaImpressao() {
    atualizarFoto();
    requestAnimationFrame(() => {
      atualizarFoto();
      setTimeout(atualizarFoto, 30);
    });
  }

  window.addEventListener("beforeprint", prepararFotoParaImpressao);
  if (window.matchMedia) {
    window.matchMedia("print").addEventListener?.("change", (ev) => {
      if (ev.matches) prepararFotoParaImpressao();
    });
  }

  const STORAGE_KEY = "carteirinhasEscolaresSalvas";

  function obterCarteirinhasSalvas() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (erro) {
      return [];
    }
  }

  function guardarCarteirinhasSalvas(lista) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  function limparParaArquivo(texto) {
    return String(texto || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function codigoTurmaParaArquivo(turma) {
    const texto = limparParaArquivo(turma).toUpperCase();
    if (!texto) return "TURMA";

    if (/ENSINO\s+MEDIO/.test(texto)) {
      const numero = (texto.match(/(\d+)/) || ["", ""])[1];
      return numero ? `${numero}EM` : "EM";
    }

    if (/ENSINO\s+FUNDAMENTAL\s+II/.test(texto)) {
      const numero = (texto.match(/(\d+)/) || ["", ""])[1];
      return numero ? `${numero}EFII` : "EFII";
    }

    if (/ENSINO\s+FUNDAMENTAL\s+I/.test(texto) || /EDUCACAO\s+INFANTIL\s+I/.test(texto)) {
      const numero = (texto.match(/(\d+)/) || ["", ""])[1];
      const letra = (texto.match(/\b([A-Z])\b/) || ["", ""])[1];
      if (numero && letra) return `${numero}${letra}`;
      if (numero) return `${numero}A`;
      return "EFI";
    }

    const primeiroBloco = texto.split(/[-–]/)[0].trim();
    const parte = primeiroBloco.replace(/[^A-Z0-9]/g, "");
    return parte || "TURMA";
  }

  function gerarNomeArquivoCarteirinha(dados) {
    const nome = limparParaArquivo(dados.nome || "Aluno").replace(/\s+/g, "_");
    const turma = codigoTurmaParaArquivo(dados.serieTurma || dados.turma || "");
    return `${nome}_${turma}`.replace(/_+/g, "_").replace(/^_|_$/g, "") || "carteirinha";
  }

  function nomeDaCarteirinha(dados) {
    return dados.nome || "Carteirinha sem nome";
  }

  function escapeHtml(texto) {
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function carteirinhasFiltradas() {
    const termo = buscaSalvas.value.trim().toLowerCase();
    const filtro = filtroAutorizado.value;

    return obterCarteirinhasSalvas().filter((item) => {
      if (filtro === "autorizado" && !item.autorizadoSozinho) return false;
      if (filtro === "nao-autorizado" && item.autorizadoSozinho) return false;

      if (!termo) return true;
      const alvo = [item.nome, item.ra, item.serieTurma, item.serie, item.turma, item.mae, item.pai]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return alvo.includes(termo);
    });
  }

  function renderizarLista() {
    const lista = carteirinhasFiltradas();

    const aindaExiste = lista.some((item) => item.id === idSelecionadoNaLista);
    if (!aindaExiste) idSelecionadoNaLista = null;

    listaSalvas.innerHTML = "";
    listaVazia.hidden = lista.length !== 0;

    lista.forEach((item) => {
      const linha = document.createElement("button");
      linha.type = "button";
      linha.className = "item-salvo" + (item.id === idSelecionadoNaLista ? " selecionado" : "");

      const subtitulo = [item.serieTurma || [item.serie, item.turma].filter(Boolean).join(" "), item.ra]
        .filter(Boolean)
        .join(" · ");

      linha.innerHTML =
        `<span class="item-salvo-nome">${escapeHtml(nomeDaCarteirinha(item))}</span>` +
        (subtitulo ? `<span class="item-salvo-info">${escapeHtml(subtitulo)}</span>` : "");

      linha.addEventListener("click", () => {
        idSelecionadoNaLista = item.id;
        renderizarLista();
      });

      listaSalvas.appendChild(linha);
    });

    btnCarregar.disabled = !idSelecionadoNaLista;
    btnRemover.disabled = !idSelecionadoNaLista;
  }

  function obterFotoComoDataUrl(arquivo) {
    return new Promise((resolve, reject) => {
      if (!arquivo) {
        resolve(fotoDataUrl || null);
        return;
      }
      const leitor = new FileReader();
      leitor.onload = () => resolve(leitor.result);
      leitor.onerror = reject;
      leitor.readAsDataURL(arquivo);
    });
  }

  function dadosAtuais() {
    return {
      id: idSelecionadoNaLista || String(Date.now()),
      nome: campos.nome.value,
      serieTurma: campos.serieTurma.value,
      ra: campos.ra.value,
      nascimento: campos.nascimento.value,
      cpf: campos.cpf.value,
      mae: campos.mae.value,
      pai: campos.pai.value,
      autorizados: campos.autorizados.value,
      autorizadoSozinho: autorizadoSozinhoSelecionado,
      foto: fotoDataUrl,
      zoom: foto.zoom,
      panXFrac: foto.panXFrac,
      panYFrac: foto.panYFrac,
      atualizadoEm: new Date().toISOString()
    };
  }

  let toastTimer = null;

  function mostrarToast(mensagem) {
    toast.textContent = mensagem;
    toast.classList.add("visivel");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove("visivel");
    }, 2600);
  }

  function dadosParaExportacao() {
    const temDadosNoFormulario = Object.values(campos).some((campo) => !!campo.value.trim?.() || campo.value !== "");

    if (temDadosNoFormulario) {
      return dadosAtuais();
    }

    if (idSelecionadoNaLista) {
      const dados = obterCarteirinhasSalvas().find((item) => item.id === idSelecionadoNaLista);
      if (dados) return dados;
    }

    return { carteirinhas: obterCarteirinhasSalvas() };
  }

  function exportarCarteirinhaJson() {
    const dados = dadosParaExportacao();
    const nomeArquivo = Array.isArray(dados)
      ? "carteirinhas_exportadas"
      : (dados && Array.isArray(dados.carteirinhas)
        ? "carteirinhas_exportadas"
        : gerarNomeArquivoCarteirinha(dados));

    const conteudo = JSON.stringify(dados, null, 2);
    const blob = new Blob([conteudo], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${nomeArquivo}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    mostrarToast("Carteirinha exportada em JSON.");
  }

  function normalizarDadosImportados(item, index = 0) {
    if (!item || typeof item !== "object") return null;

    return {
      id: item.id || `${Date.now()}-${index}`,
      nome: item.nome || "",
      serieTurma: item.serieTurma || [item.serie, item.turma].filter(Boolean).join(" ") || "",
      ra: item.ra || "",
      nascimento: item.nascimento || "",
      cpf: item.cpf || "",
      mae: item.mae || "",
      pai: item.pai || "",
      autorizados: item.autorizados || "",
      autorizadoSozinho: !!item.autorizadoSozinho,
      foto: item.foto || null,
      zoom: Number(item.zoom) || 1,
      panXFrac: Number(item.panXFrac) || 0,
      panYFrac: Number(item.panYFrac) || 0,
      atualizadoEm: item.atualizadoEm || new Date().toISOString()
    };
  }

  function importarCarteirinhaJson(arquivo) {
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = () => {
      try {
        const texto = String(leitor.result || "");
        const dados = JSON.parse(texto);
        const listaRaw = Array.isArray(dados)
          ? dados
          : dados && Array.isArray(dados.carteirinhas)
            ? dados.carteirinhas
            : [dados];

        const listaImportada = listaRaw
          .map(normalizarDadosImportados)
          .filter(Boolean);

        if (!listaImportada.length) {
          throw new Error("Arquivo JSON sem carteirinhas válidas.");
        }

        const listaAtual = obterCarteirinhasSalvas();
        const mapa = new Map(listaAtual.map((item) => [item.id, item]));

        listaImportada.forEach((item) => {
          mapa.set(item.id, item);
        });

        guardarCarteirinhasSalvas([...mapa.values()]);
        idSelecionadoNaLista = listaImportada[0].id;
        renderizarLista();
        mostrarToast(`${listaImportada.length} carteirinha(s) importada(s) com sucesso!`);
      } catch (erro) {
        console.error(erro);
        alert("Arquivo inválido. Envie um JSON exportado pela própria aplicação.");
      } finally {
        importarJsonInput.value = "";
      }
    };
    leitor.onerror = () => {
      alert("Não foi possível ler o arquivo JSON.");
      importarJsonInput.value = "";
    };
    leitor.readAsText(arquivo);
  }

  async function salvarCarteirinha() {
    const arquivo = campos.foto.files[0];
    if (arquivo) fotoDataUrl = await obterFotoComoDataUrl(arquivo);

    const dados = dadosAtuais();
    idSelecionadoNaLista = dados.id;
    const lista = obterCarteirinhasSalvas();
    const indice = lista.findIndex((item) => item.id === dados.id);
    if (indice >= 0) lista[indice] = dados;
    else lista.push(dados);

    try {
      guardarCarteirinhasSalvas(lista);
    } catch (erro) {
      alert("Não foi possível salvar. A foto pode ser grande demais para o armazenamento do navegador.");
      return;
    }

    idSelecionadoNaLista = dados.id;
    renderizarLista();
    mostrarToast("Carteirinha salva com sucesso!");
  }

  function aplicarFotoSalva(dataUrl) {
    fotoArea.innerHTML = "";
    fotoImg = null;
    fotoArea.classList.remove("tem-foto");
    zoomCampo.hidden = true;
    if (fotoObjectUrl) {
      URL.revokeObjectURL(fotoObjectUrl);
      fotoObjectUrl = null;
    }
    fotoDataUrl = dataUrl || null;
    if (!dataUrl) return;

    const img = document.createElement("img");
    img.onload = () => {
      iniciarNovaFoto(img);
      foto.zoom = Number.isFinite(foto._zoomSalvo) ? foto._zoomSalvo : 1;
      foto.panXFrac = Number.isFinite(foto._panXSalvo) ? foto._panXSalvo : 0;
      foto.panYFrac = Number.isFinite(foto._panYSalvo) ? foto._panYSalvo : 0;
      zoomInput.value = foto.zoom.toFixed(2);
      atualizarFoto();
      delete foto._zoomSalvo;
      delete foto._panXSalvo;
      delete foto._panYSalvo;
    };
    img.src = dataUrl;
    fotoArea.appendChild(img);
  }

  function removerCarteirinha() {
    const id = idSelecionadoNaLista;
    if (!id) return;

    const lista = obterCarteirinhasSalvas();
    const dados = lista.find((item) => item.id === id);
    if (!dados) return;

    if (!confirm(`Remover a carteirinha de ${nomeDaCarteirinha(dados)}?`)) return;

    guardarCarteirinhasSalvas(lista.filter((item) => item.id !== id));

    Object.values(campos).forEach((campo) => {
      campo.value = "";
    });
    autorizadoSozinhoSelecionado = false;
    autorizadosOpcoes.hidden = true;
    fotoArea.innerHTML = "";
    fotoImg = null;
    fotoArea.classList.remove("tem-foto");
    zoomCampo.hidden = true;
    zoomInput.value = "1";
    if (fotoObjectUrl) {
      URL.revokeObjectURL(fotoObjectUrl);
      fotoObjectUrl = null;
    }
    fotoDataUrl = null;
    idSelecionadoNaLista = null;

    renderizarLista();
    atualizarPreview();
  }

  function carregarCarteirinha() {
    const id = idSelecionadoNaLista;
    if (!id) return;
    const dados = obterCarteirinhasSalvas().find((item) => item.id === id);
    if (!dados) return;

    campos.nome.value = dados.nome || "";
    campos.serieTurma.value =
      dados.serieTurma || [dados.serie, dados.turma].filter(Boolean).join(" ") || "";
    campos.ra.value = dados.ra || "";
    campos.nascimento.value = dados.nascimento || "";
    campos.cpf.value = dados.cpf || "";
    campos.mae.value = dados.mae || "";
    campos.pai.value = dados.pai || "";
    campos.autorizados.value = dados.autorizados || "";
    autorizadoSozinhoSelecionado = !!dados.autorizadoSozinho;
    idSelecionadoNaLista = dados.id;

    foto._zoomSalvo = Number(dados.zoom) || 1;
    foto._panXSalvo = Number(dados.panXFrac) || 0;
    foto._panYSalvo = Number(dados.panYFrac) || 0;
    aplicarFotoSalva(dados.foto);
    atualizarPreview();
    fecharConfigMenu();
  }

  function formatarData(valorISO) {
    if (!valorISO) return "";
    const [ano, mes, dia] = valorISO.split("-");
    if (!ano || !mes || !dia) return "";
    return `${dia}/${mes}/${ano}`;
  }

  function formatarCpf(valor) {
    const digitos = valor.replace(/\D/g, "").slice(0, 11);
    let saida = digitos;
    if (digitos.length > 9) {
      saida = digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    } else if (digitos.length > 6) {
      saida = digitos.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    } else if (digitos.length > 3) {
      saida = digitos.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    }
    return saida;
  }

  function formatarRa(valor) {
    const alfanumerico = valor.toUpperCase().replace(/[^0-9A-Z]/g, "");
    let base = "";
    let digitoVerificador = "";

    for (const caractere of alfanumerico) {
      if (base.length < 9) {
        if (/[0-9]/.test(caractere)) base += caractere;
      } else if (!digitoVerificador) {
        digitoVerificador = caractere;
        break;
      }
    }

    return digitoVerificador ? `${base}-${digitoVerificador}` : base;
  }

  function ajustarFonte(el, tamanhoMaximoCqw, minimo) {
    el.style.fontSize = tamanhoMaximoCqw + "cqw";
    if (!el.textContent) return;

    const container = el.closest(".linha-dado") || el.parentElement;
    let tamanho = tamanhoMaximoCqw;
    let tentativas = 0;

    while (
      tentativas < 40 &&
      tamanho > minimo &&
      (el.scrollWidth > container.clientWidth || el.scrollHeight > container.clientHeight)
    ) {
      tamanho -= 0.08;
      el.style.fontSize = tamanho + "cqw";
      tentativas++;
    }
  }

  // pequena animação de brilho no valor da carteirinha ao ser atualizado
  function pulsar(el) {
    if (!el) return;
    el.classList.remove("pulsar");
    void el.offsetWidth;
    el.classList.add("pulsar");
  }

  function atualizarPreview() {
    saida.nome.textContent = campos.nome.value.trim();
    saida.ra.textContent = campos.ra.value.trim();
    saida.nascimento.textContent = formatarData(campos.nascimento.value);
    saida.cpf.textContent = campos.cpf.value.trim();
    saida.mae.textContent = campos.mae.value.trim();
    saida.pai.textContent = campos.pai.value.trim();
    saida.autorizados.textContent = campos.autorizados.value.trim();

    saida.serieTurma.textContent = campos.serieTurma.value.trim();

    Object.values(saida).forEach((span) => {
      const linha = span.closest(".linha-dado") || span.closest(".autorizados-area");
      if (!linha) return;
      linha.style.visibility = span.textContent ? "visible" : "hidden";
    });

    ajustarFonte(saida.nome, 2.55, 1.3);
    ajustarFonte(saida.ra, 2.55, 1.5);
    ajustarFonte(saida.nascimento, 2.55, 1.5);
    ajustarFonte(saida.cpf, 2.55, 1.5);
    ajustarFonte(saida.mae, 2.55, 1.0);
    ajustarFonte(saida.pai, 2.55, 1.0);
    ajustarFonte(saida.serieTurma, 2.55, 1.3);
    ajustarFonte(saida.autorizados, 1.75, 1.0);
    aplicarModelo();
  }

  function mostrarOpcoesAutorizados() {
    autorizadosOpcoes.hidden = false;
  }

  campos.autorizados.addEventListener("focus", mostrarOpcoesAutorizados);

  opcaoAutorizadoSozinho.addEventListener("mousedown", (ev) => {
    ev.preventDefault();
    autorizadoSozinhoSelecionado = true;
    campos.autorizados.value = "Saida Autorizada";
    autorizadosOpcoes.hidden = true;
    atualizarPreview();
    pulsar(saida.autorizados);
  });

  campos.autorizados.addEventListener("input", () => {
    if (campos.autorizados.value !== "Saida Autorizada" || !autorizadoSozinhoSelecionado) {
      autorizadoSozinhoSelecionado = false;
    }
    atualizarPreview();
    pulsar(saida.autorizados);
  });

  document.addEventListener("click", (ev) => {
    if (!ev.target.closest(".autorizados-campo")) autorizadosOpcoes.hidden = true;
  });

  function ligarCampoComPulso(campo, span) {
    campo.addEventListener("input", () => {
      atualizarPreview();
      pulsar(span);
    });
  }

  ligarCampoComPulso(campos.nome, saida.nome);
  campos.serieTurma.addEventListener("change", () => {
    atualizarPreview();
    pulsar(saida.serieTurma);
  });
  ligarCampoComPulso(campos.nascimento, saida.nascimento);
  ligarCampoComPulso(campos.mae, saida.mae);
  ligarCampoComPulso(campos.pai, saida.pai);

  campos.ra.addEventListener("input", () => {
    campos.ra.value = formatarRa(campos.ra.value);
    atualizarPreview();
    pulsar(saida.ra);
  });

  campos.cpf.addEventListener("input", () => {
    campos.cpf.value = formatarCpf(campos.cpf.value);
    atualizarPreview();
    pulsar(saida.cpf);
  });

  campos.foto.addEventListener("change", () => {
    const arquivo = campos.foto.files[0];
    fotoArea.innerHTML = "";
    fotoImg = null;
    fotoArea.classList.remove("tem-foto");
    zoomCampo.hidden = true;
    if (fotoObjectUrl) {
      URL.revokeObjectURL(fotoObjectUrl);
      fotoObjectUrl = null;
    }
    if (!arquivo) {
      fotoDataUrl = null;
      return;
    }

    fotoDataUrl = null;
    fotoObjectUrl = URL.createObjectURL(arquivo);
    const img = document.createElement("img");
    img.onload = () => iniciarNovaFoto(img);
    img.src = fotoObjectUrl;
    fotoArea.appendChild(img);
  });

  // ---------- menu de configurações (barra superior) ----------

  function abrirConfigMenu() {
    configWrap.classList.add("aberto");
    btnConfig.setAttribute("aria-expanded", "true");
  }

  function fecharConfigMenu() {
    configWrap.classList.remove("aberto");
    btnConfig.setAttribute("aria-expanded", "false");
  }

  btnConfig.addEventListener("click", (ev) => {
    ev.stopPropagation();
    if (configWrap.classList.contains("aberto")) fecharConfigMenu();
    else abrirConfigMenu();
  });

  document.addEventListener("click", (ev) => {
    const caminho = ev.composedPath ? ev.composedPath() : [];
    const cliqueDentro = caminho.some(
      (el) => el instanceof Element && el.classList && el.classList.contains("config-wrap")
    );
    if (!cliqueDentro) fecharConfigMenu();
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") fecharConfigMenu();
  });

  btnSalvar.addEventListener("click", salvarCarteirinha);

  buscaSalvas.addEventListener("input", renderizarLista);
  filtroAutorizado.addEventListener("change", renderizarLista);

  btnCarregar.addEventListener("click", carregarCarteirinha);
  btnRemover.addEventListener("click", removerCarteirinha);
  btnExportarJson.addEventListener("click", exportarCarteirinhaJson);
  btnImportarJson.addEventListener("click", () => importarJsonInput.click());
  importarJsonInput.addEventListener("change", (ev) => {
    const arquivo = ev.target.files?.[0];
    if (arquivo) importarCarteirinhaJson(arquivo);
  });

  btnImprimir.addEventListener("click", () => {
    window.print();
  });

  btnLimpar.addEventListener("click", () => {
    Object.values(campos).forEach((campo) => {
      campo.value = "";
    });
    autorizadoSozinhoSelecionado = false;
    autorizadosOpcoes.hidden = true;
    fotoArea.innerHTML = "";
    fotoImg = null;
    fotoArea.classList.remove("tem-foto");
    zoomCampo.hidden = true;
    zoomInput.value = "1";
    if (fotoObjectUrl) {
      URL.revokeObjectURL(fotoObjectUrl);
      fotoObjectUrl = null;
    }
    fotoDataUrl = null;
    idSelecionadoNaLista = null;
    renderizarLista();
    atualizarPreview();
  });

  renderizarLista();
  atualizarPreview();
})();
