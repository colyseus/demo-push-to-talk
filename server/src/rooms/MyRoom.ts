import { Room, Client } from "@colyseus/core";
import { MyRoomState, Player } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
  maxClients = 4;

  onCreate (options: any) {
    this.setState(new MyRoomState());

    this.onMessage("push", (client, _) => {
      const player = this.state.players.get(client.sessionId);
      player.pushing = true;
    });

    this.onMessage("talk", (client, payload) => {
      const player = this.state.players.get(client.sessionId);
      player.pushing = false;

      this.broadcast("talk", [client.sessionId, payload], { except: client });
    });
  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    this.state.players.set(client.sessionId, new Player());
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
