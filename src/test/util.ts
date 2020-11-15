import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import Ticket from '../models/ticket';

const mongoId = () => new Types.ObjectId().toHexString();

const buildCookie = (userId?: string) => {
  const id = userId || mongoId();
  const payload = { id, email: 'test@test.com' };
  const token = jwt.sign(payload, process.env.JWT_KEY!);
  const session = { jwt: token };
  const sessionJson = JSON.stringify(session);
  const base64 = Buffer.from(sessionJson).toString('base64');

  return [`express:sess=${base64}`];
};

const createTicket = async (opt?: {
  title?: string;
  price?: number;
  userId?: string;
  orderId?: string;
}) => {
  const title = opt?.title || 'title';
  const price = opt?.price || 20;
  const userId = opt?.userId || mongoId();

  const ticket = Ticket.build({ title, price, userId });
  await ticket.save();

  return ticket;
};

export { buildCookie, createTicket };
