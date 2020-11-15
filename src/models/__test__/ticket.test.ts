import { Error } from 'mongoose';
import Ticket from '../ticket';
import { createTicket } from '../../test/util';

it('implements optimistic concurrency control', async () => {
  const ticket = await createTicket();

  const firstInstance = await Ticket.findById(ticket.id);
  const secondInstance = await Ticket.findById(ticket.id);

  firstInstance!.set({ price: 124 });
  secondInstance!.set({ price: 2165 });

  await firstInstance!.save();

  await expect(secondInstance!.save()).rejects.toThrow(Error.VersionError);
});

it('increments the version number on multiple saves', async () => {
  const ticket = await createTicket();
  expect(ticket.version).toEqual(0);

  await ticket.save();
  expect(ticket.version).toEqual(1);

  await ticket.save();
  expect(ticket.version).toEqual(2);
});
