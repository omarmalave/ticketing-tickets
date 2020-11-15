import request from 'supertest';
import app from '../../app';
import Ticket from '../../models/ticket';
import natsWrapper from '../../nats-wrapper';
import { buildCookie } from '../../test/util';

it('has a route handler listening to /api/tickets for post requets', async () => {
  const response = await request(app).post('/api/tickets').send({});
  expect(response.status).not.toEqual(404);
});

it('can only be accessed is the user is signed in', async () => {
  await request(app).post('/api/tickets').send({}).expect(401);
});

it('returns an status other than 401 if the user is signed in', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', buildCookie())
    .send({});
  expect(response.status).not.toEqual(401);
});

it('returns an error if an invalid title is provided', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', buildCookie())
    .send({ title: '', price: 10 })
    .expect(400);

  await request(app)
    .post('/api/tickets')
    .set('Cookie', buildCookie())
    .send({ price: 10 })
    .expect(400);
});

it('return an error if an invalid price is provided', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', buildCookie())
    .send({ title: 'title', price: -5168 })
    .expect(400);

  await request(app)
    .post('/api/tickets')
    .set('Cookie', buildCookie())
    .send({ title: 'title' })
    .expect(400);
});

it('creates a ticket with valid inputs', async () => {
  let tickets = await Ticket.find({});
  expect(tickets.length).toEqual(0);

  await request(app)
    .post('/api/tickets')
    .set('Cookie', buildCookie())
    .send({ title: 'title', price: 20 })
    .expect(201);

  tickets = await Ticket.find({});
  expect(tickets.length).toEqual(1);
  expect(tickets[0].price).toEqual(20);
  expect(tickets[0].title).toEqual('title');
});

it('publishes an event', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', buildCookie())
    .send({ title: 'title', price: 20 })
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
