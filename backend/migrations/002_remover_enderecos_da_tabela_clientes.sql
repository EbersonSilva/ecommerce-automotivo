-- Remover campos de endereço legados da tabela clientes
-- Estes campos foram movidos para a tabela enderecos (RN0021, RN0022)

ALTER TABLE clientes DROP COLUMN IF EXISTS endereco;
ALTER TABLE clientes DROP COLUMN IF EXISTS cidade;
ALTER TABLE clientes DROP COLUMN IF EXISTS estado;
ALTER TABLE clientes DROP COLUMN IF EXISTS cep;
