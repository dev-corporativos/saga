# Saga - Microserviços de Pedido, Pagamento e Entrega

Este projeto demonstra uma arquitetura de microserviços utilizando o padrão SAGA (coreografado) para orquestrar o ciclo de vida de um pedido: criação do pedido, processamento do pagamento e execução da entrega, com compensações em caso de falhas.


## **Descrição do Problema**
- **Cenário:** Em um sistema de delivery, a criação de um pedido dispara uma cadeia de operações distribuídas (pagamento e entrega). Cada serviço tem seu próprio banco de dados, e precisamos garantir consistência eventual e respostas resilientes a falhas.
- **Desafio:** Coordenar estados entre serviços independentes sem transações distribuídas (2PC), adotando comunicação assíncrona via eventos e compensações em caso de falhas.
- **Objetivo:** Implementar uma SAGA coreografada com RabbitMQ, onde cada serviço reage a eventos e executa ações (e compensações) para manter o sistema consistente.

### Problema Simulado
- O **pagamento tem 80% de chance de sucesso** (20% de falha)
- Quando o pagamento falha, é necessário **reverter** (compensar) o pedido criado
- Quando o pagamento é bem-sucedido, a entrega deve ser processada
- Todo o fluxo deve ser **consistente** e **rastreável**

## **Arquitetura da Solução**
- **Estilo:** Microserviços + SAGA coreografada (event-driven)
- **Mensageria:** RabbitMQ (`fanout` Exchange `saga.events`) com filas dedicadas por serviço
- **Persistência:** Um banco PostgreSQL por serviço (isolamento de dados)

![Arquitetura](diagrama.png)

### Componentes

#### 1. **Serviço de Pedidos** (porta 3001)
- **Responsabilidade**: Gerenciar o ciclo de vida dos pedidos
- **Banco de Dados**: PostgreSQL (porta 5433)
- **Endpoints**:
  - `POST /pedidos` - Criar novo pedido
  - `GET /pedidos` - Listar todos os pedidos
- **Estados**: PENDENTE → ENVIADO → ENTREGUE / CANCELADO

#### 2. **Serviço de Pagamentos** (porta 3002)
- **Responsabilidade**: Processar pagamentos com 80% de taxa de sucesso
- **Banco de Dados**: PostgreSQL (porta 5434)
- **Estados**: PENDENTE → CONCLUIDO / CANCELADO

#### 3. **Serviço de Entregas** (porta 3003)
- **Responsabilidade**: Gerenciar entregas baseado no status do pagamento
- **Banco de Dados**: PostgreSQL (porta 5435)
- **Estados**: PENDENTE → ENTREGUE / CANCELADO

#### 4. **RabbitMQ** (portas 5672, 15672)
- **Responsabilidade**: Message broker para comunicação assíncrona entre serviços
- **Exchange**: `saga.events` (fanout)
- **Queues**:
  - `pagamento.events` - Eventos para o serviço de pagamento
  - `entrega.events` - Eventos para o serviço de entrega
  - `pedido.events` - Eventos para o serviço de pedido
  - `pedido.compensation` - Eventos de compensação

---

## **Fluxo do SAGA (com Compensações)**
Padrão coreografado: não há um orquestrador central. Cada serviço reage a eventos do Exchange `saga.events` publicados pelos demais.

### Cenário 1: Fluxo de Sucesso (Pagamento Aprovado)

```
1. Cliente → POST /pedidos
   └─> [Pedido Service] Cria pedido com status PENDENTE
       └─> Publica evento: PedidoCriado
           │
           ▼
2. [Pagamento Service] Recebe PedidoCriado
   └─> Cria pagamento com status PENDENTE
       └─> Simula processamento (80% sucesso)
           └─> Atualiza pagamento para CONCLUIDO
               └─> Publica evento: PagamentoConcluido
                   │
                   ├──────────────────────────────────┐
                   ▼                                  ▼
3a. [Pedido Service]                    3b. [Entrega Service]
    └─> Recebe PagamentoConcluido           └─> Recebe PagamentoConcluido
        └─> Atualiza pedido                     └─> Cria entrega (PENDENTE)
            para ENVIADO                            └─> Atualiza para ENVIADO
                                                        └─> Publica: EntregaConcluida
                                                            │
                                                            ▼
4. [Pedido Service] Recebe EntregaConcluida
   └─> Atualiza pedido para ENTREGUE

RESULTADO: Pedido ENTREGUE 
```

### Cenário 2: Fluxo de Compensação (Pagamento Recusado) 

```
1. Cliente → POST /pedidos
   └─> [Pedido Service] Cria pedido com status PENDENTE
       └─> Publica evento: PedidoCriado
           │
           ▼
2. [Pagamento Service] Recebe PedidoCriado
   └─> Cria pagamento com status PENDENTE
       └─> Simula processamento (20% falha)
           └─> Atualiza pagamento para CANCELADO
               └─> Publica evento: PagamentoCancelado
                   │
                   ├──────────────────────────────────┐
                   ▼                                  ▼
3a. [Pedido Service]                    3b. [Entrega Service]
    └─> Recebe PagamentoCancelado           └─> Recebe PagamentoCancelado
        └─> COMPENSAÇÃO:                        └─> Cria entrega (PENDENTE)
            Atualiza pedido                         └─> Atualiza para CANCELADO
            para CANCELADO                              └─> Publica: EntregaCancelada
            └─> Publica: PedidoCancelado

RESULTADO: Pedido CANCELADO (Compensação executada) 
```
---

## Instruções de Execução

Você pode testar usando:

   - Insomnia
   - Postman
   - Thunder Client
   - Curl

### Pré-requisitos

- **Docker** e **Docker Compose** instalados
- **Node.js** 18+ (para desenvolvimento local)
- Portas disponíveis: 3001, 3002, 3003, 5672, 15672, 5433, 5434, 5435

### Executando o Projeto

#### 1. Clone o repositório
```bash
git clone https://github.com/dev-corporativos/saga.git
cd saga
```

#### 2. Inicie todos os serviços com Docker Compose
```bash
docker-compose up --build
```

Este comando irá:
- Criar e iniciar todos os containers
- Configurar as redes e volumes
- Inicializar os bancos de dados PostgreSQL
- Configurar o RabbitMQ
- Iniciar os 3 microserviços

#### 3. Verifique se os serviços estão rodando

Aguarde até ver as mensagens de inicialização:
```
[Pedido Service] Servidor rodando na porta 3001
[Pagamento Service] Servidor rodando na porta 3002
[Entrega Service] Servidor rodando na porta 3003
```

#### 4. Acesse a interface de gerenciamento do RabbitMQ

Abra no navegador: http://localhost:15672
- **Usuário**: guest
- **Senha**: guest

Aqui você pode monitorar:
- Exchanges criados
- Filas e suas mensagens
- Conexões ativas
- Taxa de mensagens

### Testando o Sistema

#### Criar um Pedido
```bash
curl -X POST http://localhost:3001/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "produto": "Notebook Dell",
    "quantidade": 1,
    "valor": 3500.00
  }'
```

**Resposta esperada:**
```json
{
  "pedidoId": "uuid-gerado",
  "status": "PENDENTE",
  "message": "[Pedido Service] Pedido criado com sucesso."
}
```

#### Listar Todos os Pedidos
```bash
curl http://localhost:3001/pedidos
```

#### Monitorar os Logs

Acompanhe o fluxo do SAGA em tempo real:
```bash
docker-compose logs -f pedido-service pagamento-service entrega-service
```

Você verá logs como:
```
pedido-service      | [Pedido Service] Evento publicado: { type: 'PedidoCriado', ... }
pagamento-service   | [Pagamento Service] Evento de pedido recebido: ...
pagamento-service   | [Pagamento Service] Pagamento aprovado para o pedido ...
entrega-service     | [Entrega Service] Evento de pagamento concluído recebido: ...
```

### Parando os Serviços

```bash
docker-compose down
```

Para remover também os volumes (dados dos bancos):
```bash
docker-compose down -v
```

## **Tecnologias Utilizadas**
- **Linguagem/Runtime:** Node.js, TypeScript 
- **Framework Web:** Express 
- **Mensageria:** RabbitMQ (imagem `rabbitmq:3.12-management`), `amqplib`
- **Banco de Dados:** PostgreSQL 17 (um por serviço)
- **Containers:** Docker + Docker Compose

## Equipe de Desenvolvimento
| Nome | Matrícula |
| ----------------- | ----------- |
| [Robério Júnior](https://github.com/roberio-junior) | 20241038060010 |
| [Jardson Alan](https://github.com/jardsonalan) | 20241038060006 |
| [Ian Galvão](https://github.com/Barr0ca) | 20241038060011 |
| [José Lucas](https://github.com/uluscaz-ifrn) | 20241038060003 |



