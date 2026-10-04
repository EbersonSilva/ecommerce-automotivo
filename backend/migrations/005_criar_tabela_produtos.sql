-- =============================================================================
-- MIGRATION 005: CRIAÇÃO DA TABELA DE PRODUTOS E CARGA INICIAL
-- Atende: RF0031, RF0032, RN0031 (Consulta de Produtos e Controle de Estoque)
-- =============================================================================

CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    fabricante VARCHAR(100) NOT NULL,
    preco NUMERIC(10, 2) NOT NULL CHECK (preco > 0),
    preco_custo NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    estoque INT NOT NULL DEFAULT 0 CHECK (estoque >= 0),
    estoque_minimo INT NOT NULL DEFAULT 5 CHECK (estoque_minimo >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
    descricao TEXT,
    imagem TEXT,
    compatibilidade TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CARGA INICIAL DE PRODUTOS DO CATÁLOGO COM ESTOQUES DEFINIDOS
INSERT INTO produtos (codigo, nome, categoria, fabricante, preco, preco_custo, estoque, estoque_minimo, status, descricao, imagem, compatibilidade)
VALUES
    (
        'PEC-0001',
        'Pastilha de Freio Cerâmica Traseira',
        'Freios',
        'Cobreq',
        189.90,
        95.00,
        25,
        5,
        'Ativo',
        'Pastilha de freio de cerâmica de alta performance, proporcionando frenagens mais silenciosas e menor emissão de poeira nas rodas.',
        '/products/pastilha-freio.webp',
        ARRAY['Civic 2016-2021', 'Corolla 2018-2022', 'Cruze 2017-2023']
    ),
    (
        'PEC-0002',
        'Filtro de Óleo Sintético Multiviscoso',
        'Filtros',
        'Fram',
        45.50,
        18.00,
        4,
        10,
        'Ativo',
        'Filtro de óleo de alta eficiência projetado para reter até 99% das impurezas do motor, prolongando a vida útil do lubrificante sintético.',
        '/products/filtro-oleo.webp',
        ARRAY['Gol G5/G6/G7', 'Uno 2010-2020', 'Onix 2013-2021', 'HB20 2012-2022']
    ),
    (
        'PEC-0003',
        'Filtro de Ar do Motor de Alto Fluxo',
        'Filtros',
        'Tecfil',
        62.00,
        25.00,
        18,
        5,
        'Ativo',
        'Elemento filtrante de alto fluxo com tecnologia microplissada para maior captação de ar sem comprometer a retenção de micropartículas.',
        '/products/filtro-ar.webp',
        ARRAY['Renegade 2016-2023', 'Compass 2017-2023', 'Toro 2016-2023']
    ),
    (
        'PEC-0004',
        'Disco de Freio Ventilado Dianteiro (Par)',
        'Freios',
        'Fremax',
        340.00,
        170.00,
        8,
        3,
        'Ativo',
        'Par de discos de freio com acabamento anticorrosivo carbono plus, garantindo dissipação térmica rápida e frenagens seguras em altas velocidades.',
        '/products/disco-freio.webp',
        ARRAY['Golf TSI 2014-2020', 'Jetta 2015-2022', 'Audi A3 2014-2021']
    ),
    (
        'PEC-0005',
        'Vela de Ignição Iridium Laser (Jogo 4un)',
        'Ignição',
        'NGK',
        220.00,
        110.00,
        15,
        4,
        'Ativo',
        'Velas com ponta ultrafina de Iridium que proporcionam ignição instantânea, queima de combustível eficiente e máxima economia.',
        '/products/vela-ignicao.webp',
        ARRAY['Civic 1.5/2.0', 'Corolla 2.0 Dynamic Force', 'Kicks 1.6 2017-2023']
    ),
    (
        'PEC-0006',
        'Amortecedor Dianteiro Pressurizado a Gás',
        'Suspensão',
        'Monroe',
        420.00,
        210.00,
        6,
        2,
        'Ativo',
        'Amortecedor OESpectrum com tecnologia de válvulas de resposta rápida para estabilidade máxima em curvas e conforto em pisos irregulares.',
        '/products/amortecedor-dianteiro.webp',
        ARRAY['Onix Plus 2020-2024', 'Tracker 2021-2024', 'HB20 2020-2024']
    )
ON CONFLICT (codigo) DO NOTHING;
