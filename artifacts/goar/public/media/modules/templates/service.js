import { shellHeader } from "./shell/header.js";
import { homeView } from "./home/view.js";
import { watchView } from "./watch/view.js";
import { musicView } from "./music/view.js";
import { gamesView } from "./games/view.js";
import { localFileInput } from "./music/file-input.js";
import { gamePlayer } from "./games/player.js";
import { appDock } from "./shell/app-dock.js";
export function composeMediaService() {
  return shellHeader + homeView + watchView + musicView + gamesView + localFileInput + gamePlayer + appDock;
}
