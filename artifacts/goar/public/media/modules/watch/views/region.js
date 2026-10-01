import "../../../services/storage.js";
globalThis.buildRegionSelect = function buildRegionSelect(){
  const sel = document.getElementById("regionSelect");
  sel.innerHTML = REGIONS.map(([c]) => '<option value="' + c + '"' + (c===REGION?' selected':'') + '>' + c + '</option>').join("");
  if (!regionChangeHooked){
    sel.onchange = () => {
      REGION = sel.value;
      try { mediaStorage.setItem("goar_region", REGION); } catch(e){}
      providerMapCache = {};
      toast("Region: " + REGION);
      if (document.body.classList.contains("prov-mode")) routeTo("hubs");
      else if (activeTab === "hubs") buildHubsTab();
      else routeTo(activeTab);
    };
    regionChangeHooked = true;
  }
}



