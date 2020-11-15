import express, { Request, Response } from 'express';
import { RequireAuth, ValidateRequest } from '@om_tickets/common';
import { body } from 'express-validator';
import Ticket from '../models/ticket';
import TicketCreatedPublisher from '../events/publishers/ticket-created-publisher';
import natsWrapper from '../nats-wrapper';

const createTicketRouter = express.Router();

const validations = [
  body('title').not().isEmpty().withMessage('Title is required'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
];

createTicketRouter.post(
  '/api/tickets',
  RequireAuth,
  validations,
  ValidateRequest,
  async (req: Request, res: Response) => {
    const { title, price } = req.body;

    const ticket = Ticket.build({ title, price, userId: req.currentUser!.id });
    await ticket.save();
    new TicketCreatedPublisher(natsWrapper.client).publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      version: ticket.version,
    });

    res.status(201).send(ticket);
  },
);

export default createTicketRouter;
