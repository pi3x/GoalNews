const footerScript = document.currentScript;

(async () => {
  if (!footerScript?.src) {
    throw new Error("GoalNews footer script URL is unavailable.");
  }

  const siteRoot = new URL("../../", footerScript.src);
  const response = await fetch(new URL("footer.html", siteRoot));
  if (!response.ok) {
    throw new Error(`GoalNews footer request failed: ${response.status}`);
  }

  const template = document.createElement("template");
  template.innerHTML = await response.text();

  const footer = template.content.querySelector("#goalnews-footer");
  if (!footer) {
    throw new Error("GoalNews footer markup is missing #goalnews-footer.");
  }

  footer.querySelectorAll("a[href]").forEach((link) => {
    link.href = new URL(link.getAttribute("href"), siteRoot).href;
  });

  const year = footer.querySelector("[data-current-year]");
  if (!year) {
    throw new Error("GoalNews footer markup is missing its year element.");
  }
  year.textContent = String(new Date().getFullYear());

  if (!document.querySelector("#goalnews-footer")) {
    document.body.append(footer);
  }
})().catch((error) => {
  console.error("GoalNews footer could not be loaded:", error);
});
