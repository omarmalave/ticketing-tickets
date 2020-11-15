import { OrderCreatedEvent } from '@om_tickets/common';
import OrderStatus from '@om_tickets/common/build/messaging/types/order-status';
import { Message } from 'node-nats-streaming';
import OrderCreatedListener from '../order-created-listener';
import natsWrapper from '../../../nats-wrapper';
import Ticket from '../../../models/ticket';
import { createTicket } from '../../../test/util';
import { mongoId } from '../../../../../orders/src/test/util';

const setup = async () => {
  const listener = new OrderCreatedListener(natsWrapper.client);

  const ticket = await createTicket();

  const data: OrderCreatedEvent['data'] = {
    id: mongoId(),
    version: 0,
    status: OrderStatus.Created,
    expiresAt: new Date().toISOString(),
    ticket: {
      id: ticket.id,
      price: ticket.price,
    },
    userId: mongoId(),
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, ticket, data, msg };
};

it('sets the orderId of the ticket', async () => {
  const { listener, ticket, msg, data } = await setup();

  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket!.orderId).toEqual(data.id);
});

it('acks the message', async () => {
  const { listener, msg, data } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});

it('publishes a ticket updated event', async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(natsWrapper.client.publish).toHaveBeenCalled();

  const ticketUpdatedData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1],
  );

  expect(data.id).toEqual(ticketUpdatedData.orderId);
});
