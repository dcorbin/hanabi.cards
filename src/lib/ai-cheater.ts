import { last, sortBy } from "lodash";
import { commitAction, MaxHints } from "~/lib/actions";
import { isCardDangerous, isCardEverPlayable, isCriticalCard } from "~/lib/ai";
import IGameState, { ICard } from "~/lib/state";

function canPlay(game: IGameState, card: ICard) {
  const topCard = last(game.playedCards.filter((playedCard) => playedCard.color === card.color));

  if (topCard) {
    return topCard.number + 1 === card.number;
  }

  return card.number === 1;
}

function cardIdentity(cardA, cardB) {
  return cardA.color === cardB.color && cardA.number === cardB.number;
}

function canSafelyDiscard(game: IGameState, card: ICard) {
  if (isCriticalCard(card, game) && isCardEverPlayable(card, game)) return false;

  if (game.playedCards.find((playedCard) => cardIdentity(card, playedCard))) {
    return true;
  }

  return false;
}

function canDiscard(game: IGameState, card: ICard) {
  if (isCriticalCard(card, game) && isCardEverPlayable(card, game)) return false;
  return !isCardDangerous(card, game);
}

export function cheat(game: IGameState): IGameState {
  const currentPlayer = game.players[game.currentPlayer];
  const canDiscardCards = game.tokens.hints < MaxHints;

  const playableCards = currentPlayer.hand.filter((card) => canPlay(game, card));
  const [playableCard] = sortBy(
    sortBy(playableCards, (card) => card.number),
    (card) => isCriticalCard(card, game)
  );
  if (playableCard) {
    return commitAction(game, {
      action: "play",
      card: playableCard,
      cardIndex: currentPlayer.hand.indexOf(playableCard),
      from: game.currentPlayer,
    });
  }

  const [safelyDiscardableCard] = currentPlayer.hand.filter((card) => canSafelyDiscard(game, card));
  if (safelyDiscardableCard && canDiscardCards) {
    return commitAction(game, {
      action: "discard",
      card: safelyDiscardableCard,
      cardIndex: currentPlayer.hand.indexOf(safelyDiscardableCard),
      from: game.currentPlayer,
    });
  }

  const discardableCards = currentPlayer.hand.filter((card) => canDiscard(game, card));
  const [discardableCard] = sortBy(discardableCards, (card) => -card.number);
  if (discardableCard && canDiscardCards) {
    return commitAction(game, {
      action: "discard",
      card: discardableCard,
      cardIndex: currentPlayer.hand.indexOf(discardableCard),
      from: game.currentPlayer,
    });
  }

  if (game.tokens.hints) {
    return commitAction(game, {
      action: "hint",
      from: game.currentPlayer,
      to: (game.currentPlayer + 1) % game.players.length,
      type: "number",
      value: 1,
    });
  }

  const [despairDiscardedCard] = sortBy(currentPlayer.hand, [
    // highest number
    (card) => -card.number,
    // if multiple, the color where pile is lowest
    // not perfect since usually you look at played cards and others game
    (card) => game.playedCards.filter((c) => c.color === card.color).length,
  ]);

  // TODO one day, optimize game end

  return commitAction(game, {
    action: "discard",
    card: despairDiscardedCard,
    cardIndex: currentPlayer.hand.indexOf(despairDiscardedCard),
    from: game.currentPlayer,
  });
}
