-- ==============================================================================
-- MIGRATION: 003_criar_tabela_cartoes.sql
-- Requisitos Atendidos:
--   - [RF0027] Cadastro de múltiplos cartões e definição de cartão preferencial
--   - [RN0024] Composição dos campos do cartão (número, titular, bandeira, CVV)
--   - [RN0025] Validação de bandeiras permitidas no sistema
-- ==============================================================================

CREATE TABLE IF NOT EXISTS cartoes (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,

    -- RN0024: Composição obrigatória do cartão
    numero VARCHAR(20) NOT NULL,
    nome_impresso VARCHAR(100) NOT NULL,
    bandeira VARCHAR(50) NOT NULL,
    codigo_seguranca VARCHAR(4) NOT NULL,
    validade VARCHAR(7) NOT NULL,

    -- RF0027: Cartão preferencial do cliente
    preferencial BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Chave Estrangeira com a tabela de clientes
    CONSTRAINT fk_cartoes_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE CASCADE,

    -- RN0025: Restrição de bandeiras permitidas
    CONSTRAINT chk_bandeira_permitida
        CHECK (bandeira IN ('Visa', 'Mastercard', 'Elo', 'Hipercard', 'American Express'))
);
