-- =============================================================================
-- MIGRATION 004: CRIAÇÃO DAS TABELAS DE CUPONS, PEDIDOS E ITENS DE PEDIDO
-- Atende: RF0031, RF0033, RF0034, RF0035, RF0036, RF0038, RN0033, RN0034, RN0035, RN0036
-- =============================================================================

-- 1. TABELA DE CUPONS (Promocionais e Troca)
CREATE TABLE IF NOT EXISTS cupons (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Promocional', 'Troca')),
    valor NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Utilizado', 'Expirado')),
    descricao TEXT,
    cliente_id INT REFERENCES clientes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE PEDIDOS
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    cliente_id INT NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    cliente_nome VARCHAR(255),
    data_pedido DATE DEFAULT CURRENT_DATE,
    valor_subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    valor_frete NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    valor_desconto_cupons NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    valor_total NUMERIC(10, 2) NOT NULL CHECK (valor_total >= 0),
    forma_pagamento TEXT NOT NULL,
    endereco_entrega TEXT NOT NULL,
    endereco_cobranca TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'EM PROCESSAMENTO' 
        CHECK (status IN ('EM PROCESSAMENTO', 'PAGAMENTO APROVADO', 'PAGAMENTO RECUSADO', 'EM TRANSPORTE', 'ENTREGUE', 'CANCELADO', 'TROCA SOLICITADA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE ITENS DO PEDIDO
CREATE TABLE IF NOT EXISTS itens_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id VARCHAR(50) NOT NULL,
    nome_produto VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL CHECK (quantidade > 0),
    preco_unitario NUMERIC(10, 2) NOT NULL CHECK (preco_unitario >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CARGA INICIAL DE CUPONS DE TESTE PARA A APRESENTAÇÃO
-- Insere cupons promocionais e de troca para o cliente ID 1
INSERT INTO cupons (codigo, tipo, valor, status, descricao, cliente_id)
VALUES 
    ('BEMVINDO10', 'Promocional', 10.00, 'Ativo', 'Cupom Promocional de Boas-Vindas (R$ 10)', 1),
    ('PROMO20', 'Promocional', 20.00, 'Ativo', 'Cupom Promocional Especial (R$ 20)', 1),
    ('TROCA-100', 'Troca', 100.00, 'Ativo', 'Cupom de Troca de Devolução (R$ 100)', 1),
    ('TROCA-50', 'Troca', 50.00, 'Ativo', 'Cupom de Troca Parcial (R$ 50)', 1),
    ('TROCA-300', 'Troca', 300.00, 'Ativo', 'Cupom de Troca Grande (R$ 300)', 1)
ON CONFLICT (codigo) DO NOTHING;
