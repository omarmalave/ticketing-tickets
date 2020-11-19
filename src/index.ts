import pino from 'pino';
import { connect } from 'mongoose';
import app from './app';
import natsWrapper from './nats-wrapper';
import OrderCreatedListener from './events/listeners/order-created-listener';
import OrderCancelledListener from './events/listeners/order-cancelled-listener';

const log = pino();

const connectToMongo = async () => {
  const { MONGO_URI } = process.env;

  if (!MONGO_URI) {
    throw new Error('MONGO_URI must be defined');
  }

  await connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });
  log.info('Connected to MongoDB');
};

const connectToNats = async () => {
  const { NATS_CLUSTER_ID, NATS_URL, NATS_CLIENT_ID } = process.env;

  if (!NATS_CLIENT_ID) {
    throw new Error('NATS_CLIENT_ID must be defined');
  }
  if (!NATS_CLUSTER_ID) {
    throw new Error('NATS_CLUSTER_ID must be defined');
  }
  if (!NATS_URL) {
    throw new Error('NATS_URL must be defined');
  }

  await natsWrapper.connect(NATS_CLUSTER_ID, NATS_CLIENT_ID, NATS_URL);
  natsWrapper.client.on('close', () => {
    log.info('nats connection closed');
    process.exit();
  });
  process.on('SIGINT', () => natsWrapper.client.close());
  process.on('SIGTERM', () => natsWrapper.client.close());
  log.info('Connected to NATS');
};

const start = async () => {
  const { JWT_KEY } = process.env;

  if (!JWT_KEY) {
    throw new Error('JWT_KEY must be defined');
  }

  try {
    await connectToMongo();
    await connectToNats();

    new OrderCreatedListener(natsWrapper.client).listen();
    new OrderCancelledListener(natsWrapper.client).listen();
  } catch (err) {
    log.error(err);
  }

  app.listen(3000, () => {
    log.error('Listening on port: 3000');
  });
};

start();
