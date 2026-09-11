CREATE TABLE IF NOT EXISTS enderecos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL,

    tipo_endereco VARCHAR(20) NOT NULL,
    tipo_residencia VARCHAR(50) NOT NULL,
    tipo_logradouro VARCHAR(50) NOT NULL,
    logradouro VARCHAR(150) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cep VARCHAR(8) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    pais VARCHAR(50) NOT NULL,
    observacoes TEXT,

    CONSTRAINT fk_enderecos_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_tipo_endereco
        CHECK (tipo_endereco IN ('COBRANCA', 'ENTREGA')),

    CONSTRAINT chk_cep_apenas_numeros
        CHECK (cep ~ '^[0-9]{8}$')
);