import React, { useState } from "react";
import { useRouter } from "next/router";
import generateName from "project-name-generator";

import { useGame, useSelfPlayer } from "../hooks/game";

import Button, { IButtonSize } from "~/components/ui/button";
import PlayerName from "~/components/playerName";

const Emojis = ["🐶", "🦊", "🐸", "🦋", "🐯", "🐱"];

interface Props {
  onJoinGame: Function;
  onStartGame: Function;
}

export default function Lobby(props: Props) {
  const { onJoinGame, onStartGame } = props;

  const game = useGame();
  const selfPlayer = useSelfPlayer();

  const gameFull = game.players.length === game.playersCount;
  const canJoin = !selfPlayer && !gameFull;
  const availableEmojis = Emojis.filter(
    e => !game.players.find(p => p.emoji === e)
  );

  const router = useRouter();
  const [name, setName] = useState(generateName().dashed);
  const [emoji, setEmoji] = useState(availableEmojis[0]);

  const shareLink = `${window.location.origin}/play?gameId=${router.query.gameId}`;
  const inputRef = React.createRef<HTMLInputElement>();
  function copy() {
    inputRef.current.select();
    document.execCommand("copy");
  }

  return (
    <div className="flex flex-column ph3 pv2 h-100">
      {game.players.length > 0 && (
        <div className="mb2">
          <h2 className="ttu f5 flex items-center">
            Players
            <span className="ml2 f7 gray">
              · {game.players.length} / {game.options.playersCount}
            </span>
          </h2>
          <div className="flex flex-column justify-center mb2 ttu">
            {game.players.map((player, i) => (
              <div key={i} className="mb1">
                <PlayerName player={player} explicit={true} />
              </div>
            ))}
          </div>
        </div>
      )}
      {game.players.length === 0 && (
        <h2 className="mb2 ttu f5">Game is empty</h2>
      )}

      {canJoin && (
        <form
          className="flex items-center w-100 flex-grow-1"
          onSubmit={e => {
            e.preventDefault();
            onJoinGame({ name, emoji });
          }}
        >
          <select
            className="w3 h2 bg-white br2 tc indent ba b--yellow mr2 pl1"
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
          >
            {availableEmojis.map((emoji, i) => (
              <option key={i} value={emoji}>
                {emoji}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="flex-grow-1 h2 bg-white pv2 ph3 br2 ba b--yellow mr2"
            style={{ width: "12rem" }}
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Button>Join</Button>
        </form>
      )}

      {selfPlayer && (
        <div className="w-100 flex-grow-1">
          <Button disabled={!gameFull} onClick={onStartGame}>
            Start game
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between mt4">
        <div className="flex flex-column mr2">
          <span className="ttu f7 mb1">Share this game</span>
          <a href={shareLink} target="_blank" className="gray f7 flex-1">
            {shareLink}
          </a>
        </div>
        <input
          className="fixed"
          style={{ top: -100, left: -100 }}
          ref={inputRef}
          type="text"
          value={shareLink}
          readOnly
        />
        <Button size={IButtonSize.SMALL} onClick={copy}>
          Copy
        </Button>
      </div>
    </div>
  );
}
