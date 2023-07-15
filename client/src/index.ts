import { Client } from "colyseus.js";

const client = new Client("ws://localhost:2567");

async function main() {
  const playerListEl = document.getElementById("player-list")!;
  const talkBtnEl = document.getElementById("btn-talk")!;

  const room = await client.joinOrCreate<any>("my_room");

  // listen to player changes
  room.state.players.onAdd((player, sessionId) => {
    const playerEl = document.createElement("li");
    playerEl.id = "player-" + sessionId;
    playerEl.innerText = `Player ${sessionId}`;

    // highlight current player
    if (sessionId === room.sessionId) {
      playerEl.innerText += " (You)";
      playerEl.classList.add("you");
    }

    playerListEl.appendChild(playerEl);

    // listen to "pushing" changes (including current player)
    player.listen("pushing", (isPushing) => {
      if (isPushing) {
        playerEl.classList.add("pushing");

      } else {
        playerEl.classList.remove("pushing");
      }
    });
  });

  room.state.players.onRemove((player, sessionId) => {
    const playerEl = document.getElementById('player-' + sessionId);
    if (!playerEl) { return console.warn("player not found", sessionId); }
    playerListEl.removeChild(playerEl);
  });

  room.onMessage("talk", ([sessionId, payload]) => {
    const playerEl = document.getElementById('player-' + sessionId);
    if (!playerEl) { return console.warn("player not found", sessionId); }
    playerEl.classList.add("talking");

    // create audio element and play it
    // when finished playing, remove audio object and remove "talking" class
    const audio = new Audio();

    const onAudioEnded = () => {
      playerEl.classList.remove("talking");
      audio.remove();
    };

    audio.autoplay = true;
    audio.src = URL.createObjectURL(new Blob([payload], { type: "audio/webm" }));
    audio.onended = () => onAudioEnded();
    audio.play().catch((e) => {
      console.error(e);
      onAudioEnded();
    });
  });

  // push to talk
  let recorder: MediaRecorder | undefined;
  let recorderLimitTimeout: number;
  talkBtnEl.addEventListener("pointerdown", () => {
    // restart recording data
    room.send("push");

    // update UI
    talkBtnEl.innerText = "Talking...";
    talkBtnEl.classList.add("talking");

    // setup MediaRecorder
    recorder = new MediaRecorder(mediaStream);
    recorder.ondataavailable = (event) => {
      console.log("recording available, sending...");
      talkBtnEl.innerText = "Push to talk";
      talkBtnEl.classList.remove("talking");

      event.data.arrayBuffer().then((buffer) => {
        room.sendBytes("talk", new Uint8Array(buffer));
      });
    };

    console.log("start recording");
    recorder.start();

    // force finish recording in 10 seconds.
    recorderLimitTimeout = setTimeout(() => recorder?.stop(), 10 * 1000);
  });

  talkBtnEl.addEventListener("pointerup", () => {
    if (recorder) {
      console.log("stop recording");
      recorder.stop();
      recorder = undefined;
      clearTimeout(recorderLimitTimeout);
    }
  });
}

let mediaStream: MediaStream;
function getLocalStream() {
  navigator.mediaDevices
    .getUserMedia({ video: false, audio: true })
    .then((stream) => {
      mediaStream = stream;
    })
    .catch((err) => {
      console.error(`you got an error: ${err}`);
    });
}

main();
getLocalStream();