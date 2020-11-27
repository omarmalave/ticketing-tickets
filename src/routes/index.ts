import express, { Request, Response } from 'express';
import Ticket from '../models/ticket';

const indexTicketRouter = express.Router();

indexTicketRouter.get('/api/tickets', async (req: Request, res: Response) => {
  const tickets = await Ticket.find({ orderId: undefined });

  res.send(tickets);
});

export default indexTicketRouter;
