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

// Guarda o desenho no navegador pra não perder no F5
function salvarDesenho() {
    try {
        localStorage.setItem("desenho", JSON.stringify(lerPintados()));
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

// Um ouvinte só na grade inteira, em vez de um por quadrado
grade.addEventListener("mousedown", function (evento) {
    if (evento.target.classList.contains("celula")) {
        evento.preventDefault();
        pintando = true;
        pintar(evento.target);
    }
});

grade.addEventListener("mouseover", function (evento) {
    if (pintando && evento.target.classList.contains("celula")) {
        pintar(evento.target);
    }
});

// Ao soltar o mouse, para de pintar e salva o desenho
document.addEventListener("mouseup", function () {
    if (pintando) {
        pintando = false;
        salvarDesenho();
    }
});

// ===== Tamanho =====
document.getElementById("criar").addEventListener("click", function () {
    const campoLinhas = document.getElementById("linhas");
    const campoColunas = document.getElementById("colunas");
    campoLinhas.value = limitar(campoLinhas.value);
    campoColunas.value = limitar(campoColunas.value);
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
    criarGrade(linhas, colunas, {});
    salvarDesenho();
    document.getElementById("receita").textContent = "";
});

// ===== Salvar PNG =====
// Desenha o gráfico numa imagem, com o número de cada carreira do lado direito
// e o número dos pontos embaixo, e baixa como arquivo .png
function salvarPng() {
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

    tela.toBlob(function (arquivo) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(arquivo);
        link.download = "grafico-croche.png";
        link.click();
        setTimeout(function () {
            URL.revokeObjectURL(link.href);
        }, 1000);
    });
}

document.getElementById("salvar-png").addEventListener("click", salvarPng);

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

function gerarReceita() {
    let texto = "";
    for (let linha = linhas - 1; linha >= 0; linha--) {
        const carreira = linhas - linha;
        const lista = coresDaCarreira(linha, carreira);
        texto += "Carreira " + carreira + ": " + agrupar(lista) + "\n";
    }
    document.getElementById("receita").textContent = texto;
}

document.getElementById("gerar").addEventListener("click", gerarReceita);

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
