const qs = (selector, root = document) => root.querySelector(selector);
const make = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (className) node.className = className;
  return node;
};
function safeHref(value, fallback = "#") {
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    const url = new URL(value, location.href);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? value : fallback;
  } catch { return fallback; }
}
function text(selector, value) {
  const node = qs(selector);
  if (node && value != null) node.textContent = value;
}
function lines(selector, values = []) {
  qs(selector)?.replaceChildren(...values.map(value => make("span", value)));
}
function brand(node, studio) {
  if (!node) return;
  node.replaceChildren(document.createTextNode(studio.name + " "), make("em", studio.accent));
}
function gameLink(game) { return "game.html?game=" + encodeURIComponent(game.slug); }
function devicePlatform(device = navigator) {
  const agent = device.userAgent || "";
  if (/Android/i.test(agent)) return "android";
  if (/iPhone|iPad|iPod/i.test(agent) ||
      (device.platform === "MacIntel" && device.maxTouchPoints > 1)) return "ios";
  return "desktop";
}
function storeUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.href : "";
  } catch { return ""; }
}
function playButtons(game) {
  const platform = devicePlatform();
  const stores = platform === "android" ? [["googlePlay", "Play Game"]] :
    platform === "ios" ? [["appStore", "Play Game"]] :
    [["googlePlay", "Google Play"], ["appStore", "App Store"]];
  const links = stores.flatMap(([key, label]) => {
    const href = storeUrl(game[key]);
    if (!href) return [];
    const link = make("a", label, "store-link");
    link.href = href;
    link.setAttribute("aria-label", "Play " + game.title + " on " + (key === "googlePlay" ? "Google Play" : "the App Store"));
    return [link];
  });
  if (!links.length) return null;
  const buttons = make("div", null, "game-actions");
  buttons.append(...links);
  return buttons;
}

function image(data, eager = false) {
  const node = make("img");
  node.src = safeHref(data.image, "assets/games.png");
  node.alt = data.imageAlt || "";
  node.loading = eager ? "eager" : "lazy";
  node.decoding = "async";
  if (eager) node.setAttribute("fetchpriority", "high");
  return node;
}
function renderHome(data) {
  const {studio, hero, about, contact} = data;
  brand(qs("[data-brand]"), studio);
  brand(qs("[data-footer-brand]"), studio);
  qs("[data-navigation]").replaceChildren(...data.navigation.map(item => {
    const link = make("a", item.label); link.href = safeHref(item.href); return link;
  }));
  text("[data-hero-kicker]", hero.kicker);
  lines("[data-hero-title]", hero.title);
  text("[data-hero-body]", hero.body || studio.description);
  const cta = qs("[data-hero-cta]");
  cta.replaceChildren(document.createTextNode(hero.cta.label + " "), make("span", "\u2198"));
  cta.lastChild.setAttribute("aria-hidden", "true");
  cta.href = safeHref(hero.cta.href);
  const heroImage = image(hero, true);
  heroImage.setAttribute("data-hero-image", "");
  qs("[data-hero-image]").replaceWith(heroImage);
  const cards = data.games.map(game => {
    const card = make("article", null, "game-card" + (game.featured ? " featured" : ""));
    const content = make("div", null, "game-card-content");
    const meta = make("div", null, "game-meta");
    meta.append(make("span", game.year || ""), make("span", game.status || ""));
    const heading = make("h3");
    const link = make("a", game.title); link.href = gameLink(game);
    link.append(make("span", game.subtitle || ""));
    heading.append(link);
    const details = make("a", "Explore " + game.title + " \u2192", "game-details");
    details.href = gameLink(game);
    content.append(meta, heading, make("p", game.description), details);
    const actions = playButtons(game);
    if (actions) content.append(actions);
    card.append(image(game), content);
    return card;
  });
  qs("[data-games]").replaceChildren(...(cards.length ? cards : [make("p", "New games are on the way.", "loading-message")]));
  text("[data-about-kicker]", about.kicker);
  lines("[data-about-title]", about.title);
  qs("[data-about-text]").replaceChildren(...about.paragraphs.map(p => make("p", p)));
  qs("[data-values]").replaceChildren(...data.values.map(value => {
    const card = make("article", null, "value-card");
    card.append(make("small", value.number), make("h3", value.title), make("p", value.text));
    return card;
  }));
  text("[data-location]", data.site.locationLabel);
  text("[data-contact-kicker]", contact.kicker);
  lines("[data-contact-title]", contact.title);
  text("[data-contact-body]", contact.body);
  text("[data-contact-email]", studio.email);
  qs("[data-contact-email]").href = "mailto:" + studio.email;
  text("[data-copyright]", data.footer.copyright);
}
function renderGame(data, game) {
  const main = qs("[data-game-content]");
  const name = data.studio.name + " " + data.studio.accent;
  brand(qs(".site-header .brand"), data.studio);
  brand(qs("[data-footer-brand]"), data.studio);
  text("[data-copyright]", data.footer.copyright);
  const breadcrumb = make("nav"); breadcrumb.setAttribute("aria-label", "Breadcrumb");
  const home = make("a", name); home.href = "index.html";
  breadcrumb.append(home, document.createTextNode(" / " + game.title));
  const overview = make("section", null, "game-overview");
  const copy = make("div");
  copy.append(make("p", name + " / " + (game.status || "MOBILE GAME"), "kicker"), make("h1", game.subtitle || game.title), make("p", game.description));
  const actions = playButtons(game);
  if (actions) copy.append(actions);
  overview.append(copy, image(game, true));
  const sections = (game.sections || []).map(item => {
    const section = make("section");
    section.append(make("h2", item.title), ...item.paragraphs.map(p => make("p", p)));
    return section;
  });
  const support = make("section");
  const p = make("p", "For questions, contact ");
  const email = make("a", data.studio.email); email.href = "mailto:" + data.studio.email;
  p.append(email);
  const privacy = make("a", "Privacy Policy"); privacy.href = "privacy.html";
  support.append(make("h2", "Contact and support"), p, privacy);
  main.replaceChildren(breadcrumb, overview, ...sections, support);
}
function metadata(data, game, privacy = false) {
  const name = data.studio.name + " " + data.studio.accent;
  const base = new URL(data.site.url.replace(/\/$/, "") + "/");
  if (!["http:", "https:"].includes(base.protocol)) throw new Error("Invalid site.url");
  const absolute = value => new URL(value, base).href;
  const url = absolute(privacy ? "privacy.html" : game ? gameLink(game) : "");
  const title = privacy ? "Privacy Policy | " + name : game ? (game.subtitle || game.title) + " | " + name : name + " | Mobile Puzzle Games";
  const description = privacy ? "Privacy policy for " + name + " games and services." : game ? game.description : data.studio.description;
  const artwork = absolute(game ? game.image : privacy ? data.site.logo : data.hero.image);
  document.title = title;
  function meta(key, value, property = false) {
    const attr = property ? "property" : "name";
    let node = qs('meta[' + attr + '="' + key + '"]');
    if (!node) { node = make("meta"); node.setAttribute(attr, key); document.head.append(node); }
    node.content = value;
  }
  meta("description", description);
  for (const [key, value] of Object.entries({title, description, url, image: artwork, site_name: name, "image:alt": title})) meta("og:" + key, value, true);
  meta("twitter:title", title); meta("twitter:description", description); meta("twitter:image", artwork);
  let canonical = qs('link[rel="canonical"]');
  if (!canonical) { canonical = make("link"); canonical.rel = "canonical"; document.head.append(canonical); }
  canonical.href = url;
  const org = {"@type":"Organization", "@id":absolute("#organization"), name, email:data.studio.email, description:data.studio.description, url:absolute(""), logo:absolute(data.site.logo)};
  const unique = [...new Map(data.games.map(g => [g.slug, g])).values()];
  const gameNodes = (game ? [game] : privacy ? [] : unique).map(g => ({
    "@type":"VideoGame", "@id":absolute(gameLink(g))+"#game", name:g.subtitle || g.title,
    alternateName:g.title, description:g.description, genre:g.genre || "Puzzle",
    url:absolute(gameLink(g)), image:absolute(g.image), publisher:{"@id":org["@id"]}
  }));
  const page = {"@type":"WebPage", "@id":url+"#webpage", name:title, url, description, inLanguage:"en"};
  if (game) page.mainEntity = {"@id":gameNodes[0]["@id"]};
  let schema = qs('script[type="application/ld+json"]');
  if (!schema) { schema = make("script"); schema.type = "application/ld+json"; document.head.append(schema); }
  schema.textContent = JSON.stringify({"@context":"https://schema.org", "@graph":[org, page, ...gameNodes]});
}
function setupMenu() {
  const button = qs("[data-menu-button]"), nav = qs("[data-navigation]");
  if (!button || !nav) return;
  const close = () => { button.setAttribute("aria-expanded", "false"); button.setAttribute("aria-label", "Open navigation"); nav.classList.remove("open"); document.body.classList.remove("menu-open"); };
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open)); button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    nav.classList.toggle("open", open); document.body.classList.toggle("menu-open", open);
  });
  nav.addEventListener("click", event => { if (event.target.closest("a")) close(); });
  window.addEventListener("resize", () => { if (window.innerWidth > 860) close(); });
}
async function init() {
  setupMenu();
  const header = qs("[data-header]");
  if (header) window.addEventListener("scroll", () => header.classList.toggle("scrolled", window.scrollY > 20), {passive:true});
  try {
    const response = await fetch("data/studio.json", {cache:"no-cache"});
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.json();
    if (!data.studio || !data.site || !Array.isArray(data.games)) throw new Error("Invalid studio.json");
    if (qs("[data-games]")) { renderHome(data); metadata(data); }
    else if (qs("[data-game-content]")) {
      const slug = new URLSearchParams(location.search).get("game");
      const game = data.games.find(g => g.slug === slug);
      if (!game) {
        qs("[data-game-content]").replaceChildren(make("h1", "Game not found"), make("p", "Return to the home page to explore our games."));
        document.title = "Game not found";
        let robots = qs('meta[name="robots"]');
        if (!robots) { robots = make("meta"); robots.name = "robots"; document.head.append(robots); }
        robots.content = "noindex, follow";
        qs('script[type="application/ld+json"]')?.remove();
        qs('link[rel="canonical"]')?.remove();
        return;
      }
      renderGame(data, game); metadata(data, game);
    } else metadata(data, null, true);
  } catch (error) {
    console.error("Unable to load website data:", error);
    const notice = make("p", "Content could not be loaded. Please refresh the page.", "loading-message");
    notice.setAttribute("role", "alert");
    (qs("[data-games]") || qs("[data-game-content]") || qs("main"))?.append(notice);
  }
}
init();
