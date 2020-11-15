import { Publisher, Subjects, TicketUpdatedEvent } from '@om_tickets/common';

export default class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly subject = Subjects.TicketUpdated;
}
