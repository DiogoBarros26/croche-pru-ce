// ===== Configurações =====
// A lista `fios` vem do arquivo fios.js
const fioPorCodigo = {};
for (const fio of fios) {
    fioPorCodigo[fio.codigo] = fio;
}
const FUNDO = "8001"; // quadrado vazio conta como Branco
const MAXIMO = 200;

let fioAtual = fios[0];
let pintando = false;
let linhas = 0;
let colunas = 0;

const grade = document.getElementById("grade");
const paleta = document.getElementById("paleta");
const fioAtualTexto = document.getElementById("fio-atual");

// ===== Funções =====
function nomeDoFio(fio) {
    return fio.nome + " (" + fio.codigo + ")";
}

function pintar(celula) {
    celula.dataset.codigo = fioAtual.codigo;
    celula.style.background = fioAtual.hex;
}

function limitar(valor) {
    const numero = parseInt(valor, 10);
    if (isNaN(numero) || numero < 1) return 1;
    if (numero > MAXIMO) return MAXIMO;
    return numero;
}

// ===== Paleta de fios =====
// Fica recolhida: abre ao clicar no botão e fecha ao escolher um fio
const botaoFio = document.getElementById("botao-fio");
const amostra = document.getElementById("amostra");

function mostrarFioAtual() {
    fioAtualTexto.textContent = nomeDoFio(fioAtual);
    amostra.style.background = fioAtual.hex;
}

for (const fio of fios) {
    const bolinha = document.createElement("div");
    bolinha.classList.add("cor");
    bolinha.style.background = fio.hex;
    bolinha.title = nomeDoFio(fio);
    paleta.appendChild(bolinha);

    bolinha.addEventListener("click", function () {
        fioAtual = fio;
        const anterior = document.querySelector(".selecionada");
        if (anterior) {
            anterior.classList.remove("selecionada");
        }
        bolinha.classList.add("selecionada");
        mostrarFioAtual();
        paleta.classList.add("escondida");
    });
}
paleta.firstChild.classList.add("selecionada");
mostrarFioAtual();

botaoFio.addEventListener("click", function () {
    paleta.classList.toggle("escondida");
});

// Clicar fora da paleta também fecha
document.addEventListener("click", function (evento) {
    if (!document.getElementById("escolha-fio").contains(evento.target)) {
        paleta.classList.add("escondida");
    }
});

// ===== Grade =====
// Lista os quadrados pintados como { "carreira-coluna": codigo do fio },
// contando a partir do canto de baixo à esquerda (onde começa a carreira 1).
function lerPintados() {
    const pintados = {};
    for (let linha = 0; linha < linhas; linha++) {
        for (let coluna = 0; coluna < colunas; coluna++) {
            const codigo = grade.children[linha * colunas + coluna].dataset.codigo;
            if (codigo) {
                pintados[(linhas - linha) + "-" + coluna] = codigo;
            }
        }
    }
    return pintados;
}

// Guarda o desenho no navegador pra não perder no F5.
// Se o desenho mudou, as carreiras marcadas como feitas não valem mais.
function salvarDesenho() {
    try {
        const novo = JSON.stringify(lerPintados());
        if (novo !== localStorage.getItem("desenho")) {
            localStorage.removeItem("feitas");
        }
        localStorage.setItem("desenho", novo);
    } catch (erro) {}
}

// Cria a grade com o tamanho escolhido. O que já estava pintado é mantido.
function criarGrade(novasLinhas, novasColunas, pintados = lerPintados()) {
    linhas = novasLinhas;
    colunas = novasColunas;
    grade.innerHTML = "";
    grade.style.gridTemplateColumns = "repeat(" + colunas + ", var(--tam))";

    ajustarTamanho();

    for (let linha = 0; linha < linhas; linha++) {
        for (let coluna = 0; coluna < colunas; coluna++) {
            const celula = document.createElement("div");
            celula.classList.add("celula");
            const codigo = pintados[(linhas - linha) + "-" + coluna];
            if (codigo && fioPorCodigo[codigo]) {
                celula.dataset.codigo = codigo;
                celula.style.background = fioPorCodigo[codigo].hex;
            }
            grade.appendChild(celula);
        }
    }
}

// Quadrados menores quando a grade é grande, para caber na largura
// e na altura da tela (sobrando espaço para o botão de gerar receita)
function ajustarTamanho() {
    const larguraDisponivel = Math.min(window.innerWidth - 70, 1100);
    const alturaDisponivel = window.innerHeight - grade.getBoundingClientRect().top - 100;
    const porLargura = Math.floor(larguraDisponivel / colunas) - 1;
    const porAltura = Math.floor(alturaDisponivel / linhas) - 1;
    const tamanho = Math.max(8, Math.min(30, porLargura, porAltura));
    grade.style.setProperty("--tam", tamanho + "px");
}

window.addEventListener("resize", ajustarTamanho);

// Um ouvinte só na grade inteira, em vez de um por quadrado.
// "pointer" vale para mouse, dedo e caneta de mesa digitalizadora.
grade.addEventListener("pointerdown", function (evento) {
    if (evento.target.classList.contains("celula")) {
        evento.preventDefault();
        guardarParaDesfazer();
        pintando = true;
        pintar(evento.target);
    }
});

// No toque e na caneta o evento fica preso ao primeiro quadrado,
// então procuramos qual quadrado está embaixo do dedo agora
grade.addEventListener("pointermove", function (evento) {
    if (!pintando) return;
    const embaixo = document.elementFromPoint(evento.clientX, evento.clientY);
    if (embaixo && embaixo.classList.contains("celula")) {
        pintar(embaixo);
    }
});

// Ao soltar, para de pintar e salva o desenho
function pararDePintar() {
    if (pintando) {
        pintando = false;
        salvarDesenho();
    }
}
document.addEventListener("pointerup", pararDePintar);
document.addEventListener("pointercancel", pararDePintar);

// ===== Tamanho =====
document.getElementById("criar").addEventListener("click", function () {
    const campoLinhas = document.getElementById("linhas");
    const campoColunas = document.getElementById("colunas");
    campoLinhas.value = limitar(campoLinhas.value);
    campoColunas.value = limitar(campoColunas.value);
    guardarParaDesfazer();
    criarGrade(Number(campoLinhas.value), Number(campoColunas.value));
    salvarDesenho(); // se a grade diminuiu, o que ficou de fora sai do salvo

    // Guarda o tamanho no navegador pra não voltar pro padrão no F5
    try {
        localStorage.setItem("linhas", campoLinhas.value);
        localStorage.setItem("colunas", campoColunas.value);
    } catch (erro) {}
});

// ===== Limpar grade =====
// Pede um segundo clique pra confirmar, pra ela não apagar o desenho sem querer
const botaoLimpar = document.getElementById("limpar");
let esperaLimpar = null;

function voltarBotaoLimpar() {
    clearTimeout(esperaLimpar);
    botaoLimpar.classList.remove("confirmando");
    botaoLimpar.textContent = "Limpar grade";
}

botaoLimpar.addEventListener("click", function () {
    if (!botaoLimpar.classList.contains("confirmando")) {
        botaoLimpar.classList.add("confirmando");
        botaoLimpar.textContent = "Tem certeza? Clique de novo";
        esperaLimpar = setTimeout(voltarBotaoLimpar, 3000);
        return;
    }

    voltarBotaoLimpar();
    guardarParaDesfazer();
    criarGrade(linhas, colunas, {});
    salvarDesenho();
    document.getElementById("receita").textContent = "";
});

// ===== Desfazer =====
// Antes de cada mudança (pincelada, tamanho, limpar, foto) guardamos
// uma cópia da grade. Ctrl+Z ou o botão voltam pra cópia anterior.
const botaoDesfazer = document.getElementById("desfazer");
const historico = [];

function guardarParaDesfazer() {
    historico.push({ linhas: linhas, colunas: colunas, pintados: lerPintados() });
    if (historico.length > 50) historico.shift(); // guarda só as últimas 50
    botaoDesfazer.disabled = false;
}

function desfazer() {
    const anterior = historico.pop();
    if (!anterior) return;
    botaoDesfazer.disabled = historico.length === 0;

    document.getElementById("linhas").value = anterior.linhas;
    document.getElementById("colunas").value = anterior.colunas;
    try {
        localStorage.setItem("linhas", anterior.linhas);
        localStorage.setItem("colunas", anterior.colunas);
    } catch (erro) {}
    criarGrade(anterior.linhas, anterior.colunas, anterior.pintados);
    salvarDesenho();
    if (document.getElementById("receita").textContent) gerarReceita();
}

botaoDesfazer.addEventListener("click", desfazer);

document.addEventListener("keydown", function (evento) {
    // Dentro dos campos de número, o Ctrl+Z continua desfazendo o que foi digitado
    if (evento.target.tagName === "INPUT") return;
    if ((evento.ctrlKey || evento.metaKey) && !evento.shiftKey && evento.key.toLowerCase() === "z") {
        evento.preventDefault();
        desfazer();
    }
});

// ===== Salvar PNG =====
// Desenha o gráfico numa imagem, com o número de cada carreira do lado direito
// e o número dos pontos embaixo. Serve pro PNG e pro PDF.
function desenharGrafico() {
    const tam = Math.max(12, Math.min(30, Math.floor(2000 / Math.max(linhas, colunas))));
    const margem = 36; // espaço para os números
    const tela = document.createElement("canvas");
    tela.width = colunas * tam + margem + 1;
    tela.height = linhas * tam + margem + 1;
    const pincel = tela.getContext("2d");

    pincel.fillStyle = "#ffffff";
    pincel.fillRect(0, 0, tela.width, tela.height);

    // Quadrados
    for (let linha = 0; linha < linhas; linha++) {
        for (let coluna = 0; coluna < colunas; coluna++) {
            pincel.fillStyle = fioPorCodigo[corDaCelula(linha, coluna)].hex;
            pincel.fillRect(coluna * tam, linha * tam, tam, tam);
        }
    }

    // Linhas da grade (mais fortes a cada 10, pra facilitar a contagem)
    for (let i = 0; i <= colunas; i++) {
        pincel.fillStyle = i % 10 === 0 ? "#888888" : "#cccccc";
        pincel.fillRect(i * tam, 0, 1, linhas * tam + 1);
    }
    for (let i = 0; i <= linhas; i++) {
        pincel.fillStyle = (linhas - i) % 10 === 0 ? "#888888" : "#cccccc";
        pincel.fillRect(0, i * tam, colunas * tam + 1, 1);
    }

    // Números: carreiras à direita (1 embaixo) e pontos embaixo
    pincel.fillStyle = "#4a4060";
    pincel.font = Math.min(12, tam - 2) + "px sans-serif";
    pincel.textBaseline = "middle";
    pincel.textAlign = "left";
    for (let linha = 0; linha < linhas; linha++) {
        const carreira = linhas - linha;
        if (tam >= 16 || carreira % 5 === 0 || carreira === 1) {
            pincel.fillText(carreira, colunas * tam + 6, linha * tam + tam / 2);
        }
    }
    pincel.textAlign = "center";
    pincel.textBaseline = "top";
    for (let coluna = 0; coluna < colunas; coluna++) {
        const ponto = coluna + 1;
        if (tam >= 16 || ponto % 5 === 0 || ponto === 1) {
            pincel.fillText(ponto, coluna * tam + tam / 2, linhas * tam + 8);
        }
    }
    return tela;
}

function baixarArquivo(arquivo, nome) {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(arquivo);
    link.download = nome;
    link.click();
    setTimeout(function () {
        URL.revokeObjectURL(link.href);
    }, 1000);
}

function salvarPng() {
    desenharGrafico().toBlob(function (arquivo) {
        baixarArquivo(arquivo, "grafico-croche.png");
    });
}

// ===== Receita em PDF =====
// Folha A4: o gráfico em cima e a receita embaixo, com um quadradinho
// do lado de cada carreira pra ela marcar à caneta se imprimir.
// Usa a biblioteca jsPDF (carregada no index.html).
function salvarPdf() {
    if (!window.jspdf) {
        alert("Não deu pra criar o PDF: precisa de internet na primeira vez.");
        return;
    }
    const pdf = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
    const larguraFolha = 210;
    const alturaFolha = 297;
    const borda = 15;
    const larguraUtil = larguraFolha - borda * 2;
    let y = borda;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor("#7d63b5");
    pdf.text("Meu gráfico", borda, y + 6);
    y += 14;

    // Gráfico do tamanho que couber na folha, sem esticar
    const grafico = desenharGrafico();
    const escala = Math.min(larguraUtil / grafico.width, (alturaFolha - y - borda) / grafico.height);
    const larguraGrafico = grafico.width * escala;
    const alturaGrafico = grafico.height * escala;
    pdf.addImage(grafico.toDataURL("image/png"), "PNG",
        (larguraFolha - larguraGrafico) / 2, y, larguraGrafico, alturaGrafico, undefined, "FAST");
    y += alturaGrafico + 10;

    // Receita: se não couber, continua na próxima folha
    const alturaLinha = 5.5;
    function novaFolhaSePrecisar(espaco) {
        if (y + espaco > alturaFolha - borda) {
            pdf.addPage();
            y = borda;
        }
    }

    // Se sobrar pouco espaço embaixo do gráfico, a receita começa na folha seguinte
    novaFolhaSePrecisar(60);
    pdf.setFontSize(15);
    pdf.text("Receita", borda, y + 5);
    y += 12;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor("#4a4060");
    pdf.setDrawColor("#8cc7a0");
    for (const frase of linhasDaReceita()) {
        const pedacos = pdf.splitTextToSize(frase, larguraUtil - 8);
        novaFolhaSePrecisar(pedacos.length * alturaLinha + 1);
        pdf.rect(borda, y - 3.4, 4, 4); // quadradinho pra marcar
        pdf.text(pedacos, borda + 7, y);
        y += pedacos.length * alturaLinha + 1;
    }

    baixarArquivo(pdf.output("blob"), "receita-croche.pdf");
}

document.getElementById("salvar-png").addEventListener("click", salvarPng);

// ===== Foto → gráfico =====
// Diminui a foto pro tamanho da grade (mantendo a largura escolhida e
// calculando a altura pela proporção da foto) e troca cada pedacinho
// pelo fio de cor mais parecida. Depois já gera a receita.

// Converte a cor pra "Lab", um jeito de medir cor parecido com o olho humano
function paraLab(r, g, b) {
    function linear(c) {
        c = c / 255;
        return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    const R = linear(r), G = linear(g), B = linear(b);
    const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
    const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
    const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
    function f(t) {
        return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    }
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

function distancia(a, b) {
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

// Lhama e Unicórnio são mesclados, a cor da tela não representa o fio
const MESCLADOS = ["9278", "9534"];
const fiosLisos = fios
    .filter(function (fio) { return !MESCLADOS.includes(fio.codigo); })
    .map(function (fio) {
        const r = parseInt(fio.hex.slice(1, 3), 16);
        const g = parseInt(fio.hex.slice(3, 5), 16);
        const b = parseInt(fio.hex.slice(5, 7), 16);
        return { codigo: fio.codigo, lab: paraLab(r, g, b) };
    });

function fioMaisParecido(lab, opcoes) {
    let melhor = opcoes[0];
    for (const opcao of opcoes) {
        if (distancia(lab, opcao.lab) < distancia(lab, melhor.lab)) {
            melhor = opcao;
        }
    }
    return melhor.codigo;
}

// Diminui a foto aos poucos (metade por vez) pra não perder detalhe
function diminuirFoto(imagem, largura, altura) {
    let tela = document.createElement("canvas");
    tela.width = imagem.width;
    tela.height = imagem.height;
    tela.getContext("2d").drawImage(imagem, 0, 0);

    while (tela.width / 2 > largura && tela.height / 2 > altura) {
        const menor = document.createElement("canvas");
        menor.width = Math.round(tela.width / 2);
        menor.height = Math.round(tela.height / 2);
        menor.getContext("2d").drawImage(tela, 0, 0, menor.width, menor.height);
        tela = menor;
    }

    const final = document.createElement("canvas");
    final.width = largura;
    final.height = altura;
    const pincel = final.getContext("2d");
    pincel.imageSmoothingQuality = "high";
    pincel.drawImage(tela, 0, 0, largura, altura);
    return pincel.getImageData(0, 0, largura, altura).data;
}

// Acha as cores principais da imagem (o laranja de um detalhe pequeno
// também ganha vaga, porque procuramos cores DIFERENTES, não as mais usadas)
function acharCoresPrincipais(cores, quantas) {
    // Começa pela cor média e vai pegando a cor mais distante das já escolhidas
    const media = [0, 0, 0];
    for (const cor of cores) {
        media[0] += cor[0] / cores.length;
        media[1] += cor[1] / cores.length;
        media[2] += cor[2] / cores.length;
    }
    const centros = [media];
    while (centros.length < quantas) {
        let maisLonge = null;
        let maiorDistancia = -1;
        for (const cor of cores) {
            let perto = Infinity;
            for (const centro of centros) {
                perto = Math.min(perto, distancia(cor, centro));
            }
            if (perto > maiorDistancia) {
                maiorDistancia = perto;
                maisLonge = cor;
            }
        }
        if (maiorDistancia <= 0) break; // a imagem tem menos cores que o pedido
        centros.push(maisLonge.slice());
    }

    // Ajusta cada cor principal pro meio do grupo de cores parecidas com ela
    for (let volta = 0; volta < 15; volta++) {
        const somas = centros.map(function () { return [0, 0, 0, 0]; });
        for (const cor of cores) {
            const soma = somas[maisPerto(cor, centros)];
            soma[0] += cor[0];
            soma[1] += cor[1];
            soma[2] += cor[2];
            soma[3]++;
        }
        for (let i = 0; i < centros.length; i++) {
            if (somas[i][3] > 0) {
                centros[i] = [somas[i][0] / somas[i][3], somas[i][1] / somas[i][3], somas[i][2] / somas[i][3]];
            }
        }
    }
    return centros;
}

function maisPerto(cor, centros) {
    let melhor = 0;
    for (let i = 1; i < centros.length; i++) {
        if (distancia(cor, centros[i]) < distancia(cor, centros[melhor])) {
            melhor = i;
        }
    }
    return melhor;
}

// Cada quadrado da grade olha vários pontinhos da foto (DETALHE × DETALHE)
// e fica com a cor que mais aparece, em vez da média. Assim um contorno
// escuro misturado com azul não vira um cinza que não existe no desenho.
const DETALHE = 6;

// Recebe os pontinhos da foto e devolve o código do fio de cada quadrado
// (null = parte transparente, fica de fundo)
function fiosDosQuadrados(dados, novasColunas, novasLinhas, maximoDeCores) {
    const largura = novasColunas * DETALHE;
    const total = largura * novasLinhas * DETALHE;

    const labs = new Array(total);
    const amostra = [];
    const pulo = Math.max(1, Math.floor(total / 20000)); // olha no máximo uns 20 mil pontinhos
    for (let i = 0; i < total; i++) {
        if (dados[i * 4 + 3] < 128) continue;
        labs[i] = paraLab(dados[i * 4], dados[i * 4 + 1], dados[i * 4 + 2]);
        if (i % pulo === 0) amostra.push(labs[i]);
    }
    if (amostra.length === 0) return [];

    const centros = acharCoresPrincipais(amostra, maximoDeCores);
    const codigos = centros.map(function (centro) {
        return fioMaisParecido(centro, fiosLisos);
    });

    const resultado = [];
    for (let linha = 0; linha < novasLinhas; linha++) {
        for (let coluna = 0; coluna < novasColunas; coluna++) {
            const votos = {};
            for (let y = 0; y < DETALHE; y++) {
                for (let x = 0; x < DETALHE; x++) {
                    const i = (linha * DETALHE + y) * largura + coluna * DETALHE + x;
                    const voto = labs[i] ? codigos[maisPerto(labs[i], centros)] : "fundo";
                    votos[voto] = (votos[voto] || 0) + 1;
                }
            }
            let vencedor = "fundo";
            for (const voto in votos) {
                if (votos[voto] > (votos[vencedor] || 0)) vencedor = voto;
            }
            resultado.push(vencedor === "fundo" ? null : vencedor);
        }
    }
    return limparPontinhos(resultado, novasColunas, novasLinhas);
}

// Tira os pontinhos escuros soltos que sobram do contorno do desenho:
// quadrado sozinho (nenhum vizinho da mesma cor), na beirada entre duas
// cores, e mais escuro que a cor em volta. O brilho do olho é claro, então fica.
function limparPontinhos(quadrados, largura, altura) {
    function claridade(codigo) {
        if (!codigo) return 100; // fundo = branco
        return fiosLisos.find(function (fio) { return fio.codigo === codigo; }).lab[0];
    }

    const limpo = quadrados.slice();
    for (let linha = 0; linha < altura; linha++) {
        for (let coluna = 0; coluna < largura; coluna++) {
            const cor = quadrados[linha * largura + coluna];
            if (!cor) continue;

            const vizinhos = {};
            let sozinho = true;
            for (let y = linha - 1; y <= linha + 1; y++) {
                for (let x = coluna - 1; x <= coluna + 1; x++) {
                    if (y < 0 || x < 0 || y >= altura || x >= largura) continue;
                    if (y === linha && x === coluna) continue;
                    const vizinho = quadrados[y * largura + x];
                    if (vizinho === cor) sozinho = false;
                    vizinhos[vizinho] = (vizinhos[vizinho] || 0) + 1;
                }
            }
            if (!sozinho || Object.keys(vizinhos).length < 2) continue;

            let maisComum = null;
            for (const vizinho in vizinhos) {
                if (maisComum === null || vizinhos[vizinho] > vizinhos[maisComum]) maisComum = vizinho;
            }
            maisComum = maisComum === "null" ? null : maisComum;
            if (claridade(cor) < claridade(maisComum)) {
                limpo[linha * largura + coluna] = maisComum;
            }
        }
    }
    return limpo;
}

function fotoParaGrafico(imagem) {
    const campoColunas = document.getElementById("colunas");
    campoColunas.value = limitar(campoColunas.value);
    const novasColunas = Number(campoColunas.value);
    const novasLinhas = limitar(Math.round(novasColunas * imagem.height / imagem.width));
    const campoCores = document.getElementById("cores-foto");
    campoCores.value = Math.max(2, Math.min(20, parseInt(campoCores.value, 10) || 8));
    const maximoDeCores = Number(campoCores.value);

    const dados = diminuirFoto(imagem, novasColunas * DETALHE, novasLinhas * DETALHE);
    const quadrados = fiosDosQuadrados(dados, novasColunas, novasLinhas, maximoDeCores);

    const pintados = {};
    for (let i = 0; i < quadrados.length; i++) {
        if (!quadrados[i]) continue;
        const linha = Math.floor(i / novasColunas);
        const coluna = i % novasColunas;
        pintados[(novasLinhas - linha) + "-" + coluna] = quadrados[i];
    }

    document.getElementById("linhas").value = novasLinhas;
    try {
        localStorage.setItem("linhas", novasLinhas);
        localStorage.setItem("colunas", novasColunas);
    } catch (erro) {}
    guardarParaDesfazer();
    criarGrade(novasLinhas, novasColunas, pintados);
    salvarDesenho();
    gerarReceita();
}

const arquivoFoto = document.getElementById("arquivo-foto");

document.getElementById("usar-foto").addEventListener("click", function () {
    arquivoFoto.click();
});

arquivoFoto.addEventListener("change", function () {
    const arquivo = arquivoFoto.files[0];
    if (!arquivo) return;
    const imagem = new Image();
    imagem.onload = function () {
        fotoParaGrafico(imagem);
        URL.revokeObjectURL(imagem.src);
    };
    imagem.src = URL.createObjectURL(arquivo);
    arquivoFoto.value = ""; // permite escolher a mesma foto de novo
});

// ===== Receita =====
function corDaCelula(linha, coluna) {
    const celula = grade.children[linha * colunas + coluna];
    return celula.dataset.codigo || FUNDO;
}

function coresDaCarreira(linha, numeroCarreira) {
    const lista = [];
    for (let coluna = 0; coluna < colunas; coluna++) {
        lista.push(corDaCelula(linha, coluna));
    }
    if (numeroCarreira % 2 === 0) {
        lista.reverse();
    }
    return lista;
}

function agrupar(lista) {
    const grupos = [];
    let corDoGrupo = lista[0];
    let quantidade = 0;

    for (const cor of lista) {
        if (cor === corDoGrupo) {
            quantidade++;
        } else {
            grupos.push(quantidade + " " + nomeDoFio(fioPorCodigo[corDoGrupo]));
            corDoGrupo = cor;
            quantidade = 1;
        }
    }
    grupos.push(quantidade + " " + nomeDoFio(fioPorCodigo[corDoGrupo]));

    return grupos.join(", ");
}

// Uma frase por carreira, da 1 (embaixo) até a última
function linhasDaReceita() {
    const frases = [];
    for (let linha = linhas - 1; linha >= 0; linha--) {
        const carreira = linhas - linha;
        const lista = coresDaCarreira(linha, carreira);
        frases.push("Carreira " + carreira + ": " + agrupar(lista));
    }
    return frases;
}

// Cada carreira ganha uma caixinha pra marcar quando terminar.
// As marcadas ficam guardadas no navegador, pra ela continuar outro dia.
function lerFeitas() {
    try {
        return JSON.parse(localStorage.getItem("feitas")) || [];
    } catch (erro) {
        return [];
    }
}

function gerarReceita() {
    const receita = document.getElementById("receita");
    const feitas = lerFeitas();
    receita.innerHTML = "";

    linhasDaReceita().forEach(function (frase, i) {
        const carreira = i + 1;
        const linha = document.createElement("label");
        linha.classList.add("carreira");

        const caixa = document.createElement("input");
        caixa.type = "checkbox";
        caixa.checked = feitas.includes(carreira);
        linha.classList.toggle("feita", caixa.checked);

        caixa.addEventListener("change", function () {
            linha.classList.toggle("feita", caixa.checked);
            const marcadas = lerFeitas().filter(function (n) { return n !== carreira; });
            if (caixa.checked) marcadas.push(carreira);
            try {
                localStorage.setItem("feitas", JSON.stringify(marcadas));
            } catch (erro) {}
        });

        const texto = document.createElement("span");
        texto.textContent = frase;

        linha.appendChild(caixa);
        linha.appendChild(texto);
        receita.appendChild(linha);
    });
}

// Mostra a receita com as caixinhas na tela e baixa o PDF
document.getElementById("gerar").addEventListener("click", function () {
    gerarReceita();
    salvarPdf();
});

// ===== Modo noturno =====
// A escolha fica guardada no navegador. Na primeira vez, segue o modo do computador.
const botaoNoturno = document.getElementById("botao-noturno");

function aplicarModo(noturno) {
    document.body.classList.toggle("noturno", noturno);
    botaoNoturno.textContent = noturno ? "☀️" : "🌙";
    botaoNoturno.title = noturno ? "Modo dia" : "Modo noturno";
}

let modoSalvo = null;
try {
    modoSalvo = localStorage.getItem("modo");
} catch (erro) {}

if (modoSalvo) {
    aplicarModo(modoSalvo === "noturno");
} else {
    aplicarModo(window.matchMedia("(prefers-color-scheme: dark)").matches);
}

botaoNoturno.addEventListener("click", function () {
    const noturno = !document.body.classList.contains("noturno");
    aplicarModo(noturno);
    try {
        localStorage.setItem("modo", noturno ? "noturno" : "dia");
    } catch (erro) {}
});

// ===== Começo =====
// Se tiver um tamanho salvo, usa ele no lugar do padrão (30)
try {
    const linhasSalvas = localStorage.getItem("linhas");
    const colunasSalvas = localStorage.getItem("colunas");
    if (linhasSalvas) document.getElementById("linhas").value = limitar(linhasSalvas);
    if (colunasSalvas) document.getElementById("colunas").value = limitar(colunasSalvas);
} catch (erro) {}

// Se tiver um desenho salvo, pinta ele de volta
let desenhoSalvo = {};
try {
    desenhoSalvo = JSON.parse(localStorage.getItem("desenho")) || {};
} catch (erro) {}

criarGrade(
    limitar(document.getElementById("linhas").value),
    limitar(document.getElementById("colunas").value),
    desenhoSalvo
);

// Se ela já tinha marcado carreiras, mostra a receita de novo com as marcas
if (lerFeitas().length > 0) {
    gerarReceita();
}
