/*
  Configuração
*/
const API_URL = 'http://127.0.0.1:5000';

const mapaBadge = {
    'Não avaliado': 'badge-neutro',
    'Pouco preocupante': 'badge-ok',
    'Quase ameaçada': 'badge-atencao',
    'Vulnerável': 'badge-alerta',
    'Em perigo': 'badge-perigo',
};

/*
  Estatísticas gerais (GET /estatisticas)
*/
async function carregarEstatisticas() {
    try {
        const resposta = await fetch(`${API_URL}/estatisticas`);
        const dados = await resposta.json();

        document.getElementById('statEspecies').textContent = dados.total_especies;
        document.getElementById('statAvistamentos').textContent = dados.total_avistamentos;
        document.getElementById('statDestaque').textContent = dados.especie_mais_avistada
            ? `${dados.especie_mais_avistada.nome_popular} (${dados.especie_mais_avistada.total_avistamentos})`
            : '—';
    } catch (erro) {
        console.error('Falha ao carregar estatísticas:', erro);
    }
}

/*
  Listagem de espécies (GET /especies)
*/
async function carregarEspecies() {
    const grid = document.getElementById('gridEspecies');
    try {
        const resposta = await fetch(`${API_URL}/especies`);
        const dados = await resposta.json();
        renderizarCards(dados.especies);
    } catch (erro) {
        grid.innerHTML = '<p class="empty erro">Não foi possível conectar à API. Ela está rodando em http://127.0.0.1:5000 ?</p>';
        console.error('Falha ao carregar espécies:', erro);
    }
}

function renderizarCards(especies) {
    const grid = document.getElementById('gridEspecies');
    grid.innerHTML = '';

    if (!especies.length) {
        grid.innerHTML = '<p class="empty">Nenhuma espécie cadastrada ainda. Cadastre a primeira ao lado!</p>';
        return;
    }

    especies.forEach((especie) => grid.appendChild(criarCard(especie)));
}

function criarCard(especie) {
    const template = document.getElementById('cardTemplate');
    const clone = template.content.cloneNode(true);

    clone.querySelector('.card-nome').textContent = especie.nome_popular;
    clone.querySelector('.card-cientifico').textContent =
        especie.nome_cientifico || 'Nome científico não informado';
    clone.querySelector('.card-familia').textContent =
        especie.familia ? `Família: ${especie.familia}` : 'Família não informada';
    clone.querySelector('.card-total').textContent =
        `${especie.total_avistamentos} avistamento(s) registrado(s)`;

    const badge = clone.querySelector('.badge');
    badge.textContent = especie.status_conservacao;
    badge.classList.add(mapaBadge[especie.status_conservacao] || 'badge-neutro');

    const listaAvistamentos = clone.querySelector('.card-avistamentos');
    const botaoToggle = clone.querySelector('.btn-toggle');

    botaoToggle.addEventListener('click', async () => {
        const estaAberta = !listaAvistamentos.hidden;
        if (estaAberta) {
            listaAvistamentos.hidden = true;
            botaoToggle.textContent = 'Ver avistamentos';
            return;
        }
        botaoToggle.textContent = 'Carregando...';
        await preencherAvistamentos(especie.nome_popular, listaAvistamentos);
        listaAvistamentos.hidden = false;
        botaoToggle.textContent = 'Ocultar avistamentos';
    });

    clone.querySelector('.btn-add')
        .addEventListener('click', () => abrirModalAvistamento(especie.nome_popular));

    clone.querySelector('.btn-remove')
        .addEventListener('click', () => removerEspecie(especie.nome_popular));

    return clone;
}

/*
  Detalhe de uma espécie, com seus avistamentos (GET /especie)
*/
async function preencherAvistamentos(nomePopular, container) {
    try {
        const resposta = await fetch(`${API_URL}/especie?nome_popular=${encodeURIComponent(nomePopular)}`);
        const dados = await resposta.json();

        if (!resposta.ok) {
            container.innerHTML = `<p class="erro">${dados.mensagem}</p>`;
            return;
        }

        if (!dados.avistamentos.length) {
            container.innerHTML = '<p class="empty-mini">Nenhum avistamento registrado ainda.</p>';
            return;
        }

        const lista = document.createElement('ul');
        dados.avistamentos.forEach((avistamento) => {
            const item = document.createElement('li');

            const info = document.createElement('div');
            info.innerHTML = `
                <strong>${avistamento.local}</strong> — ${avistamento.data_avistamento}<br>
                <span class="mini-info">
                    ${avistamento.observador || 'Observador não informado'} ·
                    ${avistamento.quantidade} indivíduo(s) ·
                    ${avistamento.condicoes_climaticas || 'clima não informado'}
                </span>
            `;

            const botaoRemover = document.createElement('button');
            botaoRemover.className = 'btn-mini-danger';
            botaoRemover.textContent = 'x';
            botaoRemover.title = 'Remover avistamento';
            botaoRemover.addEventListener('click', () =>
                removerAvistamento(avistamento.id, nomePopular, container));

            item.appendChild(info);
            item.appendChild(botaoRemover);
            lista.appendChild(item);
        });

        container.innerHTML = '';
        container.appendChild(lista);
    } catch (erro) {
        container.innerHTML = '<p class="erro">Não foi possível carregar os avistamentos.</p>';
        console.error(erro);
    }
}

/*
  Cadastro de espécie (POST /especie)
*/
document.getElementById('formEspecie').addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const nomePopular = document.getElementById('inputNomePopular').value.trim();
    if (!nomePopular) {
        alert('Informe o nome popular da espécie.');
        return;
    }

    const formData = new FormData();
    formData.append('nome_popular', nomePopular);
    formData.append('nome_cientifico', document.getElementById('inputNomeCientifico').value.trim());
    formData.append('familia', document.getElementById('inputFamilia').value.trim());
    formData.append('status_conservacao', document.getElementById('inputStatus').value);

    try {
        const resposta = await fetch(`${API_URL}/especie`, { method: 'POST', body: formData });
        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.mensagem);
            return;
        }

        document.getElementById('formEspecie').reset();
        await Promise.all([carregarEspecies(), carregarEstatisticas()]);
    } catch (erro) {
        alert('Não foi possível cadastrar a espécie. Verifique se a API está no ar.');
        console.error(erro);
    }
});

/*
  Remoção de espécie (DELETE /especie)
*/
async function removerEspecie(nomePopular) {
    if (!confirm(`Remover "${nomePopular}" e todos os seus avistamentos?`)) return;

    try {
        const resposta = await fetch(
            `${API_URL}/especie?nome_popular=${encodeURIComponent(nomePopular)}`,
            { method: 'DELETE' }
        );
        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.mensagem);
            return;
        }

        await Promise.all([carregarEspecies(), carregarEstatisticas()]);
    } catch (erro) {
        alert('Não foi possível remover a espécie.');
        console.error(erro);
    }
}

/*
  Busca de espécie (GET /especie)
*/
document.getElementById('btnBuscar').addEventListener('click', async () => {
    const nomePopular = document.getElementById('inputBusca').value.trim();
    if (!nomePopular) return;

    try {
        const resposta = await fetch(`${API_URL}/especie?nome_popular=${encodeURIComponent(nomePopular)}`);
        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.mensagem);
            return;
        }

        renderizarCards([dados]);
    } catch (erro) {
        alert('Não foi possível realizar a busca.');
        console.error(erro);
    }
});

document.getElementById('btnLimparBusca').addEventListener('click', () => {
    document.getElementById('inputBusca').value = '';
    carregarEspecies();
});

/*
  Modal de avistamento (POST /avistamento)
*/
const modal = document.getElementById('modalAvistamento');
let especieAtualModal = null;

function abrirModalAvistamento(nomePopular) {
    especieAtualModal = nomePopular;
    document.getElementById('modalEspecieNome').textContent = nomePopular;
    document.getElementById('formAvistamento').reset();
    document.getElementById('inputQuantidade').value = 1;
    modal.showModal();
}

document.getElementById('btnCancelarAvistamento').addEventListener('click', () => modal.close());

document.getElementById('formAvistamento').addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const formData = new FormData();
    formData.append('nome_popular', especieAtualModal);
    formData.append('local', document.getElementById('inputLocal').value.trim());
    formData.append('data_avistamento', document.getElementById('inputData').value.trim());
    formData.append('observador', document.getElementById('inputObservador').value.trim());
    formData.append('quantidade', document.getElementById('inputQuantidade').value || '1');
    formData.append('condicoes_climaticas', document.getElementById('inputClima').value.trim());

    try {
        const resposta = await fetch(`${API_URL}/avistamento`, { method: 'POST', body: formData });
        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.mensagem);
            return;
        }

        modal.close();
        await Promise.all([carregarEspecies(), carregarEstatisticas()]);
    } catch (erro) {
        alert('Não foi possível registrar o avistamento.');
        console.error(erro);
    }
});

/*
  Remoção de avistamento (DELETE /avistamento)
*/
async function removerAvistamento(id, nomePopular, container) {
    if (!confirm('Remover este avistamento?')) return;

    try {
        const resposta = await fetch(`${API_URL}/avistamento?id=${id}`, { method: 'DELETE' });
        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.mensagem);
            return;
        }

        await Promise.all([
            preencherAvistamentos(nomePopular, container),
            carregarEspecies(),
            carregarEstatisticas(),
        ]);
    } catch (erro) {
        alert('Não foi possível remover o avistamento.');
        console.error(erro);
    }
}

/*
  Carregamento inicial da página
*/
carregarEstatisticas();
carregarEspecies();
