// Cadastro das regionais. Preserve a classificação das localidades
// (distrito, vila e aldeia) e os links/coordenadas do Google Maps.
const filiais = [
  {
    num: 6, nome: "Ji-Paraná", sigla: "JPA", regional: "Comercial Regional Ji-Paraná",
    gerente: "Núbia Petsch", supervisor: "Aline Touro", operacional: "Gilmax Faria",
    cidades: [
      { nome: "Ji-Paraná", addrs: [
        { label: "Matriz", end: "Av. Marechal Rondon, 1758 - Centro - CEP 76900-136" },
        { label: "Filial", end: "Rua Manoel Franco, 809 - Nova Brasília - CEP 76908-442" },
        { end: "R. Menezes Filho, 2231 - 2 de Abril, Ji-Paraná - RO, 76900-801", maps: "https://maps.app.goo.gl/e4gf7hHd4zTG21sa7" }
      ]},
      { nome: "Ikoloehj - Terra Indígena Igarapé Lourdes", aldeia: true, mapsUrl: "https://maps.app.goo.gl/1orMHaBpAMKndJzm6" }
    ]
  },
  {
    num: 7, nome: "Machadinho D'Oeste", sigla: "MDO", regional: "Comercial Regional Machadinho D'Oeste",
    gerente: "Jéssica Brandão", supervisor: "Davi Silva", operacional: "Rildo Pandolfi",
    cidades: [
      { nome: "Machadinho D'Oeste", addrs: [{ end: "Av. Tancredo Neves - Machadinho D'Oeste, RO, 76868-000" }] },
      { nome: "Cujubim", addrs: [{ end: "Av. Cujubim, 2222 - Centro - CEP 76864-000" }] },
      { nome: "Vale do Anari", addrs: [{ end: "Av. Acyr Jose Damasceno, 4118 - Centro - CEP 76867-000" }] },
      { nome: "5° BEC", distrito: true },
      { nome: "Estrela Azul", distrito: true }
    ]
  },
  {
    num: 8, nome: "Rolim de Moura", sigla: "RMM", regional: "Comercial Regional Rolim de Moura",
    gerente: "Adoniel Bonato", supervisor: "Eduardo Conte", operacional: "Adriano Nunes",
    cidades: [
      { nome: "Rolim de Moura", addrs: [{ end: "Rua Guaporé, 4762 - Centro - CEP 76940-000" }] },
      { nome: "Santa Luzia D'Oeste", addrs: [{ end: "Av. Brasil, 2571 - Centro - CEP 76950-000" }] },
      { nome: "Novo Horizonte D'Oeste", addrs: [{ end: "Av. Manoel Francisco de Lima Filho, 4979 - Centro - CEP 76956-000" }] },
      { nome: "São Felipe D'Oeste", addrs: [{ end: "Av. Capitão Silvio, 61 - Centro - CEP 76977-000" }] },
      { nome: "Primavera de Rondônia" },
      { nome: "Jardinópolis", distrito: true },
      { nome: "Querência do Norte", distrito: true },
      { nome: "Novo Paraíso", distrito: true },
      { nome: "Nova Estrela", distrito: true }
    ]
  },
  {
    num: 9, nome: "Jaru", sigla: "JRU", regional: "Comercial Regional de Jaru",
    gerente: "Josiane Andrade", supervisor: "Juciana Reis", operacional: "Alexandre Aparecido",
    cidades: [
      { nome: "Jaru", addrs: [{ end: "Av. Padre Adolpho Rohl, 1996 - Setor 1 - CEP 76890-000" }] },
      { nome: "Theobroma", addrs: [{ end: "Av. Senador Olavo Pires, 2070 - Centro - CEP 76866-000" }] }
    ]
  },
  {
    num: 10, nome: "Ouro Preto D'Oeste", sigla: "OPO", regional: "Comercial Regional Ouro Preto",
    gerente: "Amauri Schmoller", supervisor: "Anny Sampaio", operacional: "Edinaldo Miranda",
    cidades: [
      { nome: "Ouro Preto D'Oeste", addrs: [{ end: "Rua Ana Neri, 528 - Jardim Tropical - CEP 76920-000" }] },
      { nome: "Vale do Paraíso", addrs: [{ end: "Av. Paraná, Nº 2250 - Centro - CEP 76923-000" }] },
      { nome: "Rondominas", distrito: true, addrs: [{ end: "Rua Jorge Marcelino, 2450 - CEP 76920-000" }] },
      { nome: "Nova União" },
      { nome: "Mirante da Serra" },
      { nome: "Tarilândia", distrito: true }
    ]
  },
  {
    num: 11, nome: "Nova Brasilândia D'Oeste", sigla: "NBO", regional: "Comercial Regional Nova Brasilândia",
    gerente: "Bruno Messias da Silva", supervisor: "Ezequias Rodrigues Pereira", operacional: "Kariny Nunes",
    cidades: [
      { nome: "Nova Brasilândia D'Oeste", addrs: [{ end: "Av. Juscelino Kubitschek, 3105 - Centro - CEP 76958-000" }] },
      { nome: "Migrantenópolis", distrito: true, addrs: [{ end: "Av. 25 de Agosto, 3282 - Centro - CEP 76956-000" }] },
      { nome: "Santa de Guaporé", distrito: true }
    ]
  },
  {
    num: 12, nome: "Presidente Médici", sigla: "PRM", regional: "Comercial Regional Presidente Médici",
    gerente: "Nayara Thiely", supervisor: "Esther Esthefanne", operacional: "Moises Eller",
    cidades: [
      { nome: "Presidente Médici", addrs: [{ end: "Rua José Vidal, 2648 - Centro - CEP 76916-000" }] },
      { nome: "Castanheiras" },
      { nome: "Nova Londrina", distrito: true },
      { nome: "Novo Riachuelo", distrito: true, vila: true },
      { nome: "Estrela de Rondônia", distrito: true },
      { nome: "Bandeira Branca", distrito: true }
    ]
  },
  {
    num: 14, nome: "Alvorada D'Oeste", sigla: "ALV", regional: "Comercial Regional Alvorada D'Oeste",
    gerente: "Jaqueline Borges", supervisor: "Vanderlaine Tressman", operacional: "Humberto Serapião",
    cidades: [
      { nome: "Alvorada D'Oeste", addrs: [{ end: "Rua José de Alencar, 4906 - Centro - CEP 76930-000" }] },
      { nome: "Urupá", addrs: [{ end: "Av. Moacir de Paula Vieira, 3546 - Centro - CEP 76929-000" }] },
      { nome: "Teixeirópolis", addrs: [{ end: "Av. Afonso Pena, 2975 - Centro - CEP 76928-000" }] },
      { nome: "Terra Boa", distrito: true },
      { nome: "Tancredópolis", distrito: true },
      { nome: "Nova Aliança", distrito: true }
    ]
  },
  {
    num: 15, nome: "Alta Floresta D'Oeste", sigla: "ALF", regional: "Comercial Regional Alta Floresta D'Oeste",
    gerente: "Fábio Vivan", supervisor: "João Carrocia", operacional: "Elizeu Soares",
    cidades: [
      { nome: "Alta Floresta D'Oeste", addrs: [{ end: "Av. Brasil, 4122 - Centro - CEP 76954-000" }] },
      { nome: "Alto Alegre dos Parecis", addrs: [{ end: "Av. Tancredo Neves, 3957 - Centro - CEP 76952-000" }] },
      { nome: "Porto Rolim do Guaporé", distrito: true, coords: { lat: -13.082662568611886, lng: -62.27765015218594 } },
      { nome: "Flor da Serra", distrito: true, coords: { lat: -12.45814097354041, lng: -61.91597268397865 } },
      { nome: "Vila Marcão", distrito: true, coords: { lat: -12.131928874544526, lng: -61.992563963387276 } },
      { nome: "Nova Geaza", distrito: true, coords: { lat: -11.919807043248976, lng: -62.316585070080436 } },
      { nome: "Filadélfia", distrito: true, coords: { lat: -12.437128377466966, lng: -62.044181685642734 } },
      { nome: "São Luiz", distrito: true, coords: { lat: -12.673640428203525, lng: -61.94656436825894 } },
      { nome: "Santo Antônio", distrito: true, coords: { lat: -12.0875977636009, lng: -62.105479083911476 } },
      { nome: "Izidolândia", distrito: true, coords: { lat: -12.604709074994528, lng: -62.17565385559942 } },
      { nome: "São Luis", aldeia: true, coords: { lat: -12.005116485630248, lng: -62.48762833612213 } },
      { nome: "Serrinha", aldeia: true, coords: { lat: -12.082446949064465, lng: -62.601808815734394 } },
      { nome: "Jatobá", aldeia: true, coords: { lat: -12.194613387045633, lng: -62.60859680355927 } }
    ]
  },
  {
    num: 18, nome: "São Francisco do Guaporé", sigla: "SFG", regional: "Comercial Regional São Francisco D'Oeste",
    gerente: "Graziele Gonçalves", supervisor: "Murilo Candido", operacional: "---",
    cidades: [
      { nome: "São Miguel do Guaporé", addrs: [{ end: "Rua São Miguel, 2355 - Cristo Rei - CEP 76932-000" }] },
      { nome: "Seringueiras", addrs: [{ end: "Av. Flamboyant, 272 - Centro - CEP 76900-000" }] },
      { nome: "São Francisco do Guaporé", addrs: [{ end: "Rua Chico Mendes, 3926 - Centro - CEP 76935-000" }] },
      { nome: "São Domingos", distrito: true },
      { nome: "Costa Marques" }
    ]
  }
];
