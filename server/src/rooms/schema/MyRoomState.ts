import { Schema, type, MapSchema } from "@colyseus/schema";

export class Player extends Schema {
  @type("boolean") pushing = false;
}

export class MyRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}
