import { ProjectionUpdateSchema } from "beast-contracts/projection";
import { publishEvent } from "../data/EventPublisher";

export class ProjectionSubscriptionServer {
  constructor() {
    this.subscribers = new Map(); // subscriberId → callback
  }

  subscribe(subscriberId, callback) {
    this.subscribers.set(subscriberId, callback);

    publishEvent("projection.subscription.added", {
      id: crypto.randomUUID(),
      subscriberId,
      addedAt: new Date().toISOString()
    });
  }

  unsubscribe(subscriberId) {
    this.subscribers.delete(subscriberId);

    publishEvent("projection.subscription.removed", {
      id: crypto.randomUUID(),
      subscriberId,
      removedAt: new Date().toISOString()
    });
  }

  deliver(updateEnvelope) {
    const valid = ProjectionUpdateSchema.safeParse(updateEnvelope);
    if (!valid.success) throw new Error("Invalid projection update envelope");

    const { entity, projection } = valid.data;

    const deliveryPacket = {
      id: crypto.randomUUID(),
      entity,
      projection,
      deliveredAt: new Date().toISOString()
    };

    for (const [subscriberId, callback] of this.subscribers.entries()) {
      callback(deliveryPacket);
    }

    publishEvent("projection.subscription.delivered", deliveryPacket);
    return deliveryPacket;
  }
}
