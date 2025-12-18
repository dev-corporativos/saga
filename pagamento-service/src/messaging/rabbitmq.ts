import * as amqp from "amqplib";
import { config } from "../config";
import { listenToPedidosEvents } from "../events/pagamento.consumer";

let channel: any;
let connection: any;

export const initializeRabbitMQ = async (): Promise<void> => {
  try {
    connection = await amqp.connect(config.rabbitmq.url);
    const ch = await connection.createChannel();
    channel = ch as unknown as amqp.Channel;

    await channel.assertExchange("saga.events", "fanout", { durable: true });

    await channel.assertQueue("pagamento.events", { durable: true });

    await channel.bindQueue("pagamento.events", "saga.events", "");

    console.log("[Pagamento Service] RabbitMQ conectado.");

    listenToPedidosEvents();
  } catch (error) {
    console.error("[Pagamento Service] Erro ao conectar ao RabbitMQ:", error);
    setTimeout(initializeRabbitMQ, 5000);
    throw error;
  }
};

export const getChannel = (): amqp.Channel => {
  if (!channel) {
    throw new Error("[Pagamento Service] RabbitMQ não inicializado.");
  }
  return channel;
};

export const getConnection = (): amqp.Channel => {
  if (!connection) {
    throw new Error("[Pagamento Service] RabbitMQ não inicializado.");
  }
  return connection;
};
