-- =============================================================================
-- MIGRATION 006: CRIAÇÃO DA TABELA DE TROCAS / DEVOLUÇÕES (Logística Reversa)
-- Atende: RF0038, RN0035, RN0036
-- =============================================================================

CREATE TABLE IF NOT EXISTS trocas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    pedido_id INT REFERENCES pedidos(id) ON DELETE SET NULL,
    pedido_codigo VARCHAR(50) NOT NULL,
    cliente_id INT REFERENCES clientes(id) ON DELETE CASCADE,
    cliente_nome VARCHAR(255) NOT NULL,
    produto_nome VARCHAR(255) NOT NULL,
    valor_troca NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    motivo TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'TROCA SOLICITADA'
        CHECK (status IN ('TROCA SOLICITADA', 'TROCA ACEITA', 'TROCA NEGADA', 'ITEM ENVIADO', 'ITEM RECEBIDO', 'TROCA PROCESSADA')),
    data_solicitacao DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Carga inicial com as trocas que estavam mockadas para testes na apresentação
INSERT INTO trocas (codigo, pedido_codigo, cliente_id, cliente_nome, produto_nome, valor_troca, motivo, status, data_solicitacao)
VALUES 
    ('TRO-5001', 'PED-1004', 1, 'Carlos Henrique Silva', 'Filtro de Ar do Motor de Alto Fluxo', 62.00, 'Comprei a versão incorreta, incompatível com meu veículo.', 'TROCA SOLICITADA', '2026-08-12'),
    ('TRO-5002', 'PED-1001', 1, 'Carlos Henrique Silva', 'Pastilha de Freio Cerâmica Traseira', 180.00, 'Produto veio com avaria na embalagem e quebra no material cerâmico.', 'TROCA ACEITA', '2026-08-16')
ON CONFLICT (codigo) DO NOTHING;
