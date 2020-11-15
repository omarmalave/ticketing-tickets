import express, { Request, Response } from 'express';
import {
  BadRequestError,
  NotAuthorizedError,
  NotFoundError,
  RequireAuth,
  ValidateRequest,
} from '@om_tickets/common';
import { body } from 'express-validator';
import Ticket from '../models/ticket';
import TicketUpdatedPublisher from '../events/publishers/ticket-updated-publisher';
import natsWrapper from '../nats-wrapper';

const updateTicketRouter = express.Router();

const validations = [
  body('title').notEmpty().withMessage('Please enter a valid title'),
  body('price')
    .isFloat({ gt: 0 })
    .withMessage('Price must be provided and must be greater than 0'),
];

updateTicketRouter.put(
  '/api/tickets/:id',
  validations,
  ValidateRequest,
  RequireAuth,
  async (req: Request, res: Response) => {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      throw new NotFoundError();
    }

    if (ticket.orderId) {
      throw new BadRequestError('Cannot edit a reserved ticket');
    }

    if (ticket.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    const { title, price } = req.body;

    ticket.set({
      title,
      price,
    });
    await ticket.save();

    new TicketUpdatedPublisher(natsWrapper.client).publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      version: ticket.version,
    });
    res.send(ticket);
  },
);

export default updateTicketRouter;
