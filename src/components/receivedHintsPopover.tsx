import classnames from "classnames";
import { uniq } from "lodash";
import React, { CSSProperties, PropsWithChildren, useState } from "react";
import Popover from "react-popover";
import { ReceivedHintsView } from "~/components/receivedHintsView";
import { useUserPreferences } from "~/hooks/userPreferences";
import {
  IColor,
  IColorHintAction,
  IHintAction,
  INumberHintAction,
  isColorHintAction,
  isNumberHintAction,
  ITurn,
} from "~/lib/state";

export function TombstoneHintMark(
  props: PropsWithChildren<{
    classnames?: string;
    style?: CSSProperties;
    onActivationChange: (b: boolean) => void;
    heightFactor?: number;
  }>
) {
  const heightFactor = props.heightFactor || 1;
  const verticalRadiusPercent = 100.0 / heightFactor / 2;
  const heightPercent = heightFactor * 20;
  return (
    <div
      className={classnames("absolute top-0 bg-hints flex justify-center flex-column items-center")}
      style={{
        ...props.style,
        borderBottomRightRadius: `50%  ${verticalRadiusPercent}%`,
        borderBottomLeftRadius: `50%  ${verticalRadiusPercent}%`,
        width: "20%",
        height: `${heightPercent}%`,
      }}
      onClick={stopEventPropagation}
      onMouseDown={stopEventPropagation}
      onMouseEnter={() => {
        props.onActivationChange(true);
      }}
      onMouseLeave={() => props.onActivationChange(false)}
      onMouseUp={stopEventPropagation}
    >
      {props.children}
    </div>
  );

  function stopEventPropagation(e) {
    e.stopPropagation();
  }
}

function ColorDot(props: { color: IColor }) {
  return (
    <div
      style={{
        width: "60%",
        height: "80%",
        marginTop: "20%",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <div
        className={`bg-${props.color}`}
        style={{
          borderRadius: "50%",
          aspectRatio: "1/1",
        }}
      />
    </div>
  );
}

function ColorHintMark(props: { hintActions: IHintAction[]; onActivationChange: (activate: boolean) => void }) {
  const colors = uniq(props.hintActions.filter(isColorHintAction).map((a) => a.value));
  return (
    <TombstoneHintMark
      heightFactor={colors.length}
      style={{ right: "2%" }}
      onActivationChange={props.onActivationChange}
    >
      {colors.map((c: IColor, index) => (
        <ColorDot key={index} color={c} />
      ))}
    </TombstoneHintMark>
  );
}

function NumberHintMark(props: { onActivationChange: (activate: boolean) => void; hintAction: INumberHintAction }) {
  const fontSize = "100cqh";
  return (
    <TombstoneHintMark style={{ right: "24%" }} onActivationChange={props.onActivationChange}>
      <div
        className={`light-gray fs-normal sans-serif tc bg-transparent number-hint-mark`}
        style={{ height: "80%", width: "100%" }}
      >
        <div style={{ fontSize: fontSize }}>{props.hintAction.value}</div>
      </div>
    </TombstoneHintMark>
  );
}

export function CornerMark(props: { onActivationChange: (b: boolean) => void }) {
  return (
    <div
      className={"absolute right-0 br--left top-0 br--bottom br-100 bg-hints"}
      style={{ width: "20%", height: "20%" }}
      onMouseEnter={() => {
        props.onActivationChange(true);
      }}
      onMouseLeave={() => props.onActivationChange(false)}
    />
  );
}

function HiddenMark() {
  return (
    <div className={"absolute top-0 left-0 bg-hints-hidden"} style={{ width: "100%", height: "20%" }}>
      <br />
    </div>
  );
}

function HintsPopover(
  props: PropsWithChildren<{
    hints: ITurn<IHintAction>[];
    open: boolean;
    large?: boolean;
    closePopover: () => void;
  }>
) {
  if (props.hints === undefined || props.hints.length === 0) {
    return null;
  }
  const childCount = React.Children.toArray(props.children).length;
  if (childCount != 1) {
    console.error("Exactly one child should provided");
  }
  return (
    <Popover
      body={<ReceivedHintsView hints={props.hints} />}
      className="z-999"
      isOpen={props.open}
      onOuterAction={props.closePopover}
    >
      {props.children}
    </Popover>
  );
}

function isColorHintTurn(turn: ITurn<IHintAction>): turn is ITurn<IColorHintAction> {
  return isColorHintAction(turn.action);
}
function isNumberHintTurn(turn: ITurn<IHintAction>): turn is ITurn<INumberHintAction> {
  return isNumberHintAction(turn.action);
}

function CodedHintMarks(props: {
  hints: ITurn<IHintAction>[];
  allHintsOpen: boolean;
  onActivationChange: (shouldActivate: boolean) => void;
}) {
  const [colorHintsOpen, setColorHintsOpen] = useState(false);
  const [numberHintsOpen, setNumberHintsOpen] = useState(false);
  const allHintsOpen = props.allHintsOpen && !numberHintsOpen && !colorHintsOpen;

  const colorHints = props.hints.filter(isColorHintTurn);
  const numberHints = props.hints.filter(isNumberHintTurn);

  return (
    <>
      <HintsPopover closePopover={() => props.onActivationChange(false)} hints={props.hints} open={allHintsOpen}>
        <HiddenMark />
      </HintsPopover>
      <HintsPopover closePopover={() => setColorHintsOpen(false)} hints={colorHints} open={colorHintsOpen}>
        <ColorHintMark
          hintActions={colorHints.map((t) => t.action)}
          onActivationChange={(activateColor) => {
            if (activateColor && allHintsOpen) {
              return;
            }
            setNumberHintsOpen(false);
            setColorHintsOpen(activateColor);
          }}
        />
      </HintsPopover>
      <HintsPopover closePopover={() => setNumberHintsOpen(false)} hints={numberHints} open={numberHintsOpen}>
        {numberHints.length > 0 ? (
          <NumberHintMark
            hintAction={numberHints[0].action}
            onActivationChange={(activateNumber) => {
              if (activateNumber && allHintsOpen) {
                return;
              }
              setColorHintsOpen(false);
              setNumberHintsOpen(activateNumber);
            }}
          />
        ) : null}
      </HintsPopover>
    </>
  );
}
export function ReceivedHints(props: {
  hints: ITurn<IHintAction>[];
  allHintsOpen: boolean;
  onActivationChange: (shouldActivate: boolean) => void;
}) {
  const hints = props.hints || [];
  const [userPreferences] = useUserPreferences();
  if (userPreferences.codedHintMarkers) {
    return (
      <CodedHintMarks allHintsOpen={props.allHintsOpen} hints={hints} onActivationChange={props.onActivationChange} />
    );
  }

  return (
    <HintsPopover closePopover={() => props.onActivationChange(false)} hints={hints} open={props.allHintsOpen}>
      <CornerMark onActivationChange={props.onActivationChange} />
    </HintsPopover>
  );
}
