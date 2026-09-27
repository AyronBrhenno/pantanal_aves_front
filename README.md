# Front-end — Diário de Aves do Pantanal

## Descrição

Single Page Application (SPA) em **HTML, CSS e JavaScript puro** (sem frameworks) que
consome a API **pantanal-aves-api** para catalogar espécies de aves e registrar
avistamentos de campo no Pantanal mato-grossense.

A interface apresenta:

- Um painel de estatísticas gerais (total de espécies, total de avistamentos e a
  espécie mais avistada), obtido em `GET /estatisticas`;
- Um formulário para cadastrar novas espécies (`POST /especie`);
- Uma busca por nome popular (`GET /especie`);
- Um grid de **cards**, um por espécie, com:
  - remoção da espécie (`DELETE /especie`);
  - expansão da lista de avistamentos daquela espécie (`GET /especie`);
  - remoção de um avistamento específico (`DELETE /avistamento`);
  - um modal para registrar um novo avistamento (`POST /avistamento`).

## Instruções de instalação

### 1. Pré-requisito

A API **pantanal-aves-api** precisa estar rodando em `http://127.0.0.1:5000`
(veja o README daquele repositório).

### 2. Clonar o repositório

```bash
git clone https://github.com/AyronBrhenno/pantanal-aves-front.git
cd pantanal-aves-front
```

### 3. Executar

Não é necessário instalar nada nem rodar um servidor local: basta abrir o arquivo
`index.html` diretamente no navegador (duplo clique ou `Arquivo > Abrir`).

> Se preferir, também é possível servir os arquivos com qualquer servidor estático
> (por exemplo, a extensão *Live Server* do VS Code), mas isso é opcional.

## Estrutura de arquivos

```
pantanal-aves-front/
├── index.html   # estrutura da SPA
├── styles.css   # estilo visual (tema Pantanal)
├── scripts.js   # consumo da API e lógica da interface
└── README.md
```
