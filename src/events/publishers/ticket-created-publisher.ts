import { Publisher, Subjects, TicketCreatedEvent } from '@om_tickets/common';

export default class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
}
