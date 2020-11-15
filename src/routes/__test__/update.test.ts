import request from 'supertest';
import app from '../../app';
import Ticket from '../../models/ticket';
import natsWrapper from '../../nats-wrapper';
import { buildCookie, createTicket } from '../../test/util';
import { mongoId } from '../../../../orders/src/test/util';

it('returns a 404 if the provided id does not exist', async () => {
  const id = mongoId();

  await request(app)
    .put(`/api/tickets/${id}`)
    .set('Cookie', buildCookie())
    .send({
      title: 'title',
      price: 20,
    })
    .expect(404);
});

it('returns a 401 if the user is not authenticated', async () => {
  const id = mongoId();

  await request(app)
    .put(`/api/tickets/${id}`)
    .send({
      title: 'title',
      price: 20,
    })
    .expect(401);
});

it('returns a 401 if the user does not owns the ticket', async () => {
  const ticket = await createTicket();

  await request(app)
    .put(`/api/tickets/${ticket.id}`)
    .set('Cookie', buildCookie())
    .send({
      title: 'another title',
      price: 21,
    })
    .expect(401);
});

it('returns a 400 if the user provides an invalid title or price', async () => {
  const userId = mongoId();
  const ticket = await createTicket({ userId });

  // invalid title
  await request(app)
    .put(`/api/tickets/${ticket.id}`)
    .set('Cookie', buildCookie(userId))
    .send({
      title: '',
      price: 21,
    })
    .expect(400);

  // invalid price
  await request(app)
    .put(`/api/tickets/${ticket.id}`)
    .set('Cookie', buildCookie(userId))
    .send({
      title: 'title',
      price: -10,
    })
    .expect(400);
});

it('updates the ticket provided valid inputs', async () => {
  const userId = mongoId();
  const ticket = await createTicket({ userId });

  await request(app)
    .put(`/api/tickets/${ticket.id}`)
    .set('Cookie', buildCookie(userId))
    .send({
      title: 'new title',
      price: 21,
    })
    .expect(200);

  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket).not.toBeNull();
  expect(updatedTicket!.title).toEqual('new title');
  expect(updatedTicket!.price).toEqual(21);
});

it('publishes an event', async () => {
  const userId = mongoId();
  const ticket = await createTicket({ userId });

  await request(app)
    .put(`/api/tickets/${ticket.id}`)
    .set('Cookie', buildCookie(userId))
    .send({
      title: 'new title',
      price: 21,
    })
    .expect(200);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});

it('rejects updates if the ticket is reserved', async () => {
  const userId = mongoId();
  const ticket = await createTicket({ userId });
  ticket.set({ orderId: mongoId() });
  await ticket.save();

  await request(app)
    .put(`/api/tickets/${ticket.id}`)
    .set('Cookie', buildCookie(userId))
    .send({
      title: 'new title',
      price: 21,
    })
    .expect(400);
});
