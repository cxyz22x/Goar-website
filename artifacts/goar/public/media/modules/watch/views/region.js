import "../../../services/storage.js";
globalThis.buildRegionSelect = function buildRegionSelect(){
  const sel = document.getElementById("regionSelect");
  if (!sel) return;
  sel.innerHTML = REGIONS.map(([code, name]) =>
    '<option value="' + code + '"' + (code===REGION?' selected':'') + '>' + name + ' (' + code + ')</option>'
  ).join("");
  if (!regionChangeHooked){
    sel.onchange = () => {
      REGION = sel.value;
      try { mediaStorage.setItem("goar_region", REGION); } catch(e){}
      providerMapCache = {};
      toast("Region changed to " + REGION + ". Updating Watch…");
      if (document.body.classList.contains("prov-mode")) routeTo("hubs");
      else if (activeTab === "hubs") buildHubsTab();
      else routeTo(activeTab);
    };
    regionChangeHooked = true;
  }
}



