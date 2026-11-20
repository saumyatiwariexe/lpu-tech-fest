import "@fontsource/cinzel/latin-500.css";
import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-600.css";
import "./style.css";
import { fest as f } from "./config";
import { compass, mark } from "./marks";
import { startJourney } from "./journey";

const roman = ["I", "II", "III", "IV", "V", "VI"];
document.title = f.name + " · " + f.edition;
document.querySelector("#app")!.innerHTML = `
<header><a class="brand" href="#journey" aria-label="${f.name} home">${compass()}<span>${f.name.toUpperCase()}</span></a><nav aria-label="Main"><a href="#journey">Journey</a><a href="#disciplines">Competitions</a><a href="#schedule">Schedule</a></nav><a class="register" href="#register">Register <span>↗</span></a></header>
<main><section id="journey" aria-label="The fortress journey"><div class="stage">
<img class="plate" src="/media/fortress.jpg" alt="" fetchpriority="high"><video muted playsinline preload="none" aria-hidden="true"></video><div id="cinema"></div><div class="shade"></div>
<div class="folio"><span class="star">✧</span> FIELD CHRONICLE <i></i> FESTIVAL EDITION ${f.edition}</div>
<div class="hero-copy"><p class="eyebrow"><i></i><span id="chapter-key">Chapter I · The arrival</span></p><h1 id="chapter-title">${f.name}</h1><p class="tagline">${f.tagline}</p><div class="meta"><span>${f.dates}</span><i></i><span>${f.venue}</span></div></div>
<div class="rail" aria-label="Journey chapters">${f.chapters.map((c, i) => `<button type="button" data-chapter="${i}" aria-label="${roman[i]} · Go to ${c.kicker}" title="${c.kicker}"><span>${roman[i]}</span></button>`).join("")}</div>
<div class="stage-foot"><button class="discover"><span>↓</span> Explore the chronicle</button><span class="load" role="status"></span><div class="foot-links"><a class="still-link" href="?motion=still">Still view</a><a href="#disciplines">Skip journey ↘</a></div></div><button class="skip-film" hidden>Skip awakening →</button>
</div></section>
<section id="disciplines" class="content"><div class="eyebrow"><i></i>The competitions</div><div class="intro"><h2>Five disciplines.<br><em>Five crowns.</em></h2><p>Choose your field and enter the trials of ${f.name}.</p></div><div class="cards">${f.categories.map(([cat, title, line, team], i) => `<article><div class="card-top">${roman[i]}<span>✧</span></div><div class="sigil">${mark(i)}</div><p class="eyebrow">${cat}</p><h3>${title}</h3><p>${line}</p><small>${team}</small></article>`).join("")}</div></section>
<section id="schedule" class="content"><div class="eyebrow"><i></i>The programme</div><div class="intro"><h2>Festival <em>schedule.</em></h2><p>${f.dates} · ${f.venue}</p></div><div class="agenda">${f.schedule.map(([day, title, line]) => `<div><strong>${day}</strong><h3>${title}</h3><p>${line}</p></div>`).join("")}</div></section>
<section class="content rewards"><div><div class="eyebrow"><i></i>Prize pool</div><h2>${f.prize}</h2><p>Across five competition disciplines.</p></div><div><div class="eyebrow"><i></i>Partner opportunities</div><ul>${f.sponsors.map((x) => "<li>" + x + "</li>").join("")}</ul></div></section>
<section id="register" class="content split"><div><div class="eyebrow"><i></i>Registration</div><h2>Enter <em>the fest.</em></h2><p>Preview registration. Details and dates are provisional.</p></div><form><label>Name<input name="name" autocomplete="name" required maxlength="80"></label><label>Email<input type="email" name="email" autocomplete="email" required></label><div class="choice"><label for="competition">Competition</label><select id="competition" required><option value="">Choose a discipline</option>${f.categories.map((c) => "<option>" + c[0] + "</option>").join("")}</select></div><button class="submit">Preview registration ↗</button><output role="status"></output></form></section>
<section class="content split"><div><div class="eyebrow"><i></i>Information</div><h2>Field <em>notes.</em></h2></div><div>${f.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div></section></main>
<footer><span>${f.university} · ${f.name}</span><span>${f.contact}</span><nav aria-label="Experience quality" style="display:flex;flex-wrap:wrap;gap:8px"><a href="?quality=auto">Auto</a><a href="?quality=high">High</a><a href="?quality=standard">Standard 3D</a><a href="?quality=lite">Lite</a></nav><a href="/credits/">Credits</a><a href="#journey">Back to top ↑</a></footer>`;
document.querySelector("form")!.addEventListener("submit", (e) => {
  e.preventDefault();
  document.querySelector("output")!.textContent =
    "Preview complete. Your details have not been saved or sent.";
});
startJourney();


