/* eslint-disable jsx-a11y/alt-text */
"use client";

import Player from "./Player";

/* eslint-disable @next/next/no-img-element */
const WrapPlayer = ({ mockShowPlayer, url, play, showPlayerMobile }: any) => {
  return (
    <div
      className={`w-full bottom-0 left-0 right-0 sm:hidden block ${
        showPlayerMobile ? "hidden" : ""
      } ${mockShowPlayer ? "inline-block" : "hidden"}`}
    >
      <Player play={play} url={url} />
    </div>
  );
};

export default WrapPlayer;
