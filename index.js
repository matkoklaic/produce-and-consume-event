const fs = require("fs");
const { Kafka } = require("@confluentinc/kafka-javascript").KafkaJS;

require('dotenv').config();

async function produce(topic, config) {
    const key = "key";
    const value = "value";

    // create a new producer instance
    const producer = new Kafka().producer(config);

    // connect the producer to the broker
    await producer.connect();

    // send a single message
    const produceRecord = await producer.send({
        topic,
        messages: [{ key, value }],
    });
    console.log(
        `\n\n Produced message to topic ${topic}: key = ${key}, value = ${value}, ${JSON.stringify(
            produceRecord,
            null,
            2
        )} \n\n`
    );

    // disconnect the producer
    await producer.disconnect();
}

async function consume(topic, config) {
    // setup graceful shutdown
    const disconnect = () => {
        consumer.commitOffsets().finally(() => {
            consumer.disconnect();
        });
    };
    process.on("SIGTERM", disconnect);
    process.on("SIGINT", disconnect);

    // set the consumer's group ID, offset and initialize it
    config["group.id"] = "nodejs-group-1";
    config["auto.offset.reset"] = "earliest";
    const consumer = new Kafka().consumer(config);

    // connect the consumer to the broker
    await consumer.connect();

    // subscribe to the topic
    await consumer.subscribe({ topics: [topic] });

    // consume messages from the topic
    consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            console.log(
                `Consumed message from topic ${topic}, partition ${partition}: key = ${message.key.toString()}, value = ${message.value.toString()}`
            );
        },
    });
}

async function main() {
    const config = {
        'bootstrap.servers': process.env.BOOTSTRAP_SERVERS,
        'security.protocol': process.env.SECURITY_PROTOCOL,
        'sasl.mechanisms': process.env.SASL_MECHANISMS,
        'sasl.username': process.env.SASL_USERNAME,
        'sasl.password': process.env.SASL_PASSWORD,
        'session.timeout.ms': process.env.SESSION_TIMEOUT_MS,
        'client.id': process.env.CLIENT_ID,
    };
    const topic = "game_requests";

    await produce(topic, config);
    await consume(topic, config);
}

main();