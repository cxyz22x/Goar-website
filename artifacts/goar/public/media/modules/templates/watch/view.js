import { watchHeader } from "./header.js";
import { watchCategoryBar, watchHero, watchCatalogueMount, watchGrid, watchFooter, detailModal, videoPlayer } from "./components.js";
export const watchView = "<section id=\"view-watch\"><div id=\"keyBanner\"></div><div class=\"toast\" id=\"toast\"></div>" + watchHeader + watchCategoryBar + watchHero + watchCatalogueMount + watchGrid + watchFooter + detailModal + videoPlayer + "</section>";
