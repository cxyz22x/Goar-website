import "../services/storage.js";
import { composeMediaService } from "./templates/service.js";

document.body.insertAdjacentHTML("afterbegin", composeMediaService());
await import("../data/watch-bridge.js");
await import("../data/music-bridge.js");
const services = [
  () => import("./watch/services/tunnel.js"),
  () => import("./watch/interactions/tv-mode.js"),
  () => import("./watch/services/tmdb.js"),
  () => import("./watch/views/cards.js"),
  () => import("./watch/services/video-sources.js"),
  () => import("./watch/views/hero.js"),
  () => import("./watch/views/kids.js"),
  () => import("./watch/views/music-catalogue.js"),
  () => import("./watch/views/home.js"),
  () => import("./watch/services/providers.js"),
  () => import("./watch/views/catalogue-tabs.js"),
  () => import("./watch/views/grid.js"),
  () => import("./watch/views/category-bar.js"),
  () => import("./watch/views/region.js"),
  () => import("./watch/views/live.js"),
  () => import("./watch/interactions/navigation.js"),
  () => import("./watch/views/watchlist.js"),
  () => import("./watch/interactions/search.js"),
  () => import("./watch/views/detail-modal.js"),
  () => import("./watch/interactions/watch-boot.js"),
  () => import("./music/services/foundation.js"),
  () => import("./music/services/wisp.js"),
  () => import("./music/services/catalog-search.js"),
  () => import("./music/services/player-engines.js"),
  () => import("./music/services/search.js"),
  () => import("./music/services/local-files.js"),
  () => import("./music/views/components.js"),
  () => import("./music/views/pages.js"),
  () => import("./music/interactions/queue.js"),
  () => import("./music/interactions/now-playing.js"),
  () => import("./music/interactions/bootstrap.js"),
  () => import("./games/controller.js"),
];
for (const load of services) await load();
