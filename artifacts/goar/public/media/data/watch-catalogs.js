globalThis.PROVIDER_CONTENT= {
  netflix:{monetization:"flatrate", recencyDays:365, minVotes:10},
  disney:{monetization:"flatrate", recencyDays:1095, minVotes:15},
  crunchyroll:{monetization:"flatrate", recencyDays:365, minVotes:5, genres:"16", originCountry:"JP"},
  prime:{monetization:"flatrate", recencyDays:365, minVotes:10},
  hulu:{monetization:"flatrate", recencyDays:365, minVotes:10},
  max:{monetization:"flatrate", recencyDays:730, minVotes:15},
  apple:{monetization:"flatrate", recencyDays:1095, minVotes:10},
  paramount:{monetization:"flatrate", recencyDays:365, minVotes:10},
  peacock:{monetization:"flatrate", recencyDays:365, minVotes:10},
  stan:{monetization:"flatrate", recencyDays:365, minVotes:10},
  binge:{monetization:"flatrate", recencyDays:365, minVotes:10},
  shudder:{monetization:"flatrate", recencyDays:730, minVotes:5, genres:"27"},
  mubi:{monetization:"flatrate", recencyDays:1095, minVotes:20},
  tubi:{monetization:"free,ads", recencyDays:1095, minVotes:5},
  pluto:{monetization:"free,ads", recencyDays:1095, minVotes:5},
  roku:{monetization:"free,ads", recencyDays:1095, minVotes:5}
};
globalThis.DEFAULT_PROVIDER_CONTENT= { monetization:"flatrate", recencyDays:365, minVotes:5 };


globalThis.PROVIDER_DESIGNS= {
  "netflix":{key:"netflix", style:"netflix", color:"#E50914", bg:"#000000", bg2:"#0a0a0a", accent:"#ff4d4d"},
  "disney plus":{key:"disney", style:"disney", color:"#1490E8", bg:"#040714", bg2:"#0a1128", accent:"#4da6ff"},
  "disney+":{key:"disney", style:"disney", color:"#1490E8", bg:"#040714", bg2:"#0a1128", accent:"#4da6ff"},
  "crunchyroll":{key:"crunchyroll", style:"crunchyroll", color:"#F47521", bg:"#000000", bg2:"#1a0d02", accent:"#ff9f5a"},
  "amazon prime video":{key:"prime", style:"prime", color:"#00A8E1", bg:"#0f171e", bg2:"#0a1216", accent:"#4dd0f0"},
  "prime video":{key:"prime", style:"prime", color:"#00A8E1", bg:"#0f171e", bg2:"#0a1216", accent:"#4dd0f0"},
  "hulu":{key:"hulu", style:"hulu", color:"#1CE783", bg:"#0b0b0b", bg2:"#0a1810", accent:"#5cf0a8"},
  "max":{key:"max", style:"max", color:"#4169E1", bg:"#000000", bg2:"#0a0f1f", accent:"#7b9dff"},
  "hbo max":{key:"max", style:"max", color:"#4169E1", bg:"#000000", bg2:"#0a0f1f", accent:"#7b9dff"},
  "apple tv plus":{key:"apple", style:"apple", color:"#F5F5F7", bg:"#000000", bg2:"#0a0a0a", accent:"#ffffff"},
  "apple tv+":{key:"apple", style:"apple", color:"#F5F5F7", bg:"#000000", bg2:"#0a0a0a", accent:"#ffffff"},
  "apple tv":{key:"apple", style:"apple", color:"#F5F5F7", bg:"#000000", bg2:"#0a0a0a", accent:"#ffffff"},
  "paramount plus":{key:"paramount", style:"paramount", color:"#0064FF", bg:"#000814", bg2:"#001033", accent:"#4d94ff"},
  "peacock":{key:"peacock", style:"peacock", color:"#FFCC00", bg:"#000000", bg2:"#1a1400", accent:"#ffdd4d"},
  "stan":{key:"stan", style:"stan", color:"#4FC3F7", bg:"#0a0a0a", bg2:"#041720", accent:"#7dd8ff"},
  "binge":{key:"binge", style:"binge", color:"#FF2D78", bg:"#000000", bg2:"#21050f", accent:"#ff6ba3"},
  "shudder":{key:"shudder", style:"shudder", color:"#E22020", bg:"#000000", bg2:"#1a0202", accent:"#ff5555"},
  "mubi":{key:"mubi", style:"mubi", color:"#FFD600", bg:"#000000", bg2:"#1a1600", accent:"#ffe666"},
  "tubi":{key:"tubi", style:"tubi", color:"#FA8147", bg:"#0a0a0a", bg2:"#201005", accent:"#ffab7a"},
  "pluto tv":{key:"pluto", style:"pluto", color:"#FFE01A", bg:"#000000", bg2:"#1a1800", accent:"#fff266"},
  "roku":{key:"roku", style:"roku", color:"#6C3FC5", bg:"#000000", bg2:"#0f0820", accent:"#a380ff"}
};

globalThis.DISNEY_BRANDS= [
  {label:"Disney", color:"#1a4fa0", bg:"linear-gradient(135deg,#0b2a5e,#041e4a)", cid:2},
  {label:"PIXAR", color:"#00a2e1", bg:"linear-gradient(135deg,#0a3a52,#041e2c)", cid:3},
  {label:"MARVEL", color:"#ec1d24", bg:"linear-gradient(135deg,#4a0205,#1c0202)", cid:420},
  {label:"STAR WARS", color:"#ffb400", bg:"linear-gradient(135deg,#4a3a00,#1c1400)", cid:1},
  {label:"Nat Geo", color:"#ffcc00", bg:"linear-gradient(135deg,#4a3d00,#1c1600)", cid:7521},
  {label:"20th Century", color:"#c8a35a", bg:"linear-gradient(135deg,#3a2d10,#1c1508)", cid:25}
];

/* ================= KIDS & MUSIC ================= */
globalThis.KIDS_GENRES= "10751|16";

globalThis.MUSIC_GENRE_ID= 10402;

globalThis.FEATURED_PROVIDERS= ["Netflix","Disney Plus","Disney+","Crunchyroll","Amazon Prime Video","Prime Video","Max","Hulu","Apple TV","Apple TV+","Paramount Plus","Peacock","Stan","Binge"];

globalThis.ANIME_SUBGENRES= [
  {id:28,name:"Action"},{id:12,name:"Adventure"},{id:35,name:"Comedy"},
  {id:18,name:"Drama"},{id:14,name:"Fantasy"},{id:10749,name:"Romance"},{id:9648,name:"Mystery"}
];

globalThis.PREDEFINED= [
  {label:"Trending", fn:()=>showSpecial("trending")},
  {label:"New Releases", fn:()=>showSpecial("new")},
  {label:"Top Rated", fn:()=>showSpecial("toprated")},
  {label:"In Theaters", fn:()=>showSpecial("now_movie")},
  {label:"Coming Soon", fn:()=>showSpecial("upcoming_movie")},
  {label:"Anime", fn:()=>showAnime("popular")},
  {label:"Kids", fn:()=>showKids("popular")},
  {label:"Music", fn:()=>showMusic("trend")},
  {label:"Action", fn:()=>showGenreGrid({id:28,name:"Action"},"all")},
  {label:"Comedy", fn:()=>showGenreGrid({id:35,name:"Comedy"},"all")},
  {label:"Horror", fn:()=>showGenreGrid({id:27,name:"Horror"},"all")},
  {label:"Sci-Fi", fn:()=>showGenreGrid({id:878,name:"Science Fiction"},"all")},
  {label:"Romance", fn:()=>showGenreGrid({id:10749,name:"Romance"},"all")},
  {label:"Documentary", fn:()=>showGenreGrid({id:99,name:"Documentary"},"all")},
];

globalThis.REGIONS= [["US","United States"],["GB","United Kingdom"],["CA","Canada"],["AU","Australia"],["NZ","New Zealand"],["IE","Ireland"],["DE","Germany"],["FR","France"],["ES","Spain"],["IT","Italy"],["NL","Netherlands"],["SE","Sweden"],["NO","Norway"],["DK","Denmark"],["FI","Finland"],["PL","Poland"],["PT","Portugal"],["BR","Brazil"],["MX","Mexico"],["AR","Argentina"],["JP","Japan"],["KR","South Korea"],["IN","India"],["ID","Indonesia"],["PH","Philippines"],["TH","Thailand"],["SG","Singapore"],["MY","Malaysia"],["ZA","South Africa"],["AE","United Arab Emirates"],["TR","Türkiye"],["RU","Russia"]];

globalThis.WEST_LIVE= [
  { n:"Red Bull TV", g:"Sport", u:"https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8" },
  { n:"Bloomberg TV", g:"Business", u:"https://www.bloomberg.com/media-manifest/streams/us.m3u8" },
  { n:"CBS News", g:"News", u:"https://cbsn-us.cbsnstream.cbsnews.com/out/v1/55a8648e8f134e82a470f83d562deeca/master.m3u8" },
  { n:"Sky News Australia", g:"News", u:"https://skynewsau-live.akamaized.net/hls/live/2002689/skynewsau-extra1/master.m3u8" },
  { n:"DW English", g:"News", u:"https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8" },
  { n:"Al Jazeera English", g:"News", u:"https://live-hls-apps-aje-fa.getaj.net/AJE/index.m3u8" },
  { n:"NASA TV", g:"Science", u:"https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8" }
];

export const watchCatalogs = { PROVIDER_CONTENT, DEFAULT_PROVIDER_CONTENT, PROVIDER_DESIGNS, DISNEY_BRANDS, KIDS_GENRES, MUSIC_GENRE_ID, FEATURED_PROVIDERS, ANIME_SUBGENRES, PREDEFINED, REGIONS, WEST_LIVE };
