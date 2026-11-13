// Runs the checks inside the tab the user was looking at and shows the result.
"use strict";

const GROUPS = [
  {
    "title": "Signals you send",
    "items": [
      {
        "id": "global-privacy-control",
        "name": "Global Privacy Control",
        "why": "Tells every site you refuse the sale and sharing of your data. Legally binding in some jurisdictions."
      },
      {
        "id": "cookies",
        "name": "Cookies",
        "why": "Sites you visit can store cookies; Klin keeps each site's cookies separate so they cannot follow you elsewhere. This test cannot check the separation itself."
      }
    ]
  },
  {
    "title": "Network",
    "items": [
      {
        "id": "local-network-address-webrtc",
        "name": "Local network address (WebRTC)",
        "why": "Video-call technology can reveal your address inside your home or office network, even behind a VPN."
      },
      {
        "id": "connection-type",
        "name": "Connection type",
        "why": "Wi-Fi, mobile or cable, and its speed."
      }
    ]
  },
  {
    "title": "Device",
    "items": [
      {
        "id": "browser-and-system",
        "name": "Browser and system",
        "why": "Announced to every site with each request."
      },
      {
        "id": "processor-cores",
        "name": "Processor cores",
        "why": "A small number that differs between machines."
      },
      {
        "id": "memory-size",
        "name": "Memory size",
        "why": "Another hardware detail that narrows down your device."
      },
      {
        "id": "battery-level",
        "name": "Battery level",
        "why": "Charge level and charging time have been used to follow users across sites."
      },
      {
        "id": "screen-and-window",
        "name": "Screen and window",
        "why": "Screen size is common; the exact window size is often unique."
      },
      {
        "id": "touch-screen",
        "name": "Touch screen",
        "why": "Whether the device has a touch screen."
      },
      {
        "id": "graphics-card",
        "name": "Graphics card",
        "why": "The model of your graphics hardware."
      },
      {
        "id": "cameras-and-microphones",
        "name": "Cameras and microphones",
        "why": "How many devices are connected; their names stay hidden until you grant access."
      }
    ]
  },
  {
    "title": "Language and place",
    "items": [
      {
        "id": "languages",
        "name": "Languages",
        "why": "Your preferred languages, in order."
      },
      {
        "id": "time-zone",
        "name": "Time zone",
        "why": "Roughly where you are, even when your IP address is hidden."
      }
    ]
  },
  {
    "title": "Hidden fingerprints",
    "items": [
      {
        "id": "canvas-drawing",
        "name": "Canvas drawing",
        "why": "A site draws an invisible picture and reads it back: tiny differences between machines make a stable identifier."
      },
      {
        "id": "audio-processing",
        "name": "Audio processing",
        "why": "Same idea with an inaudible sound."
      },
      {
        "id": "installed-fonts",
        "name": "Installed fonts",
        "why": "The list of fonts on your machine is rarely the same as anyone else's."
      }
    ]
  }
];
const LABEL = { protected: "Protected", exposed: "Exposed", visible: "Visible" };

function el(tag, props = {}, children = []) {
  const node = Object.assign(document.createElement(tag), props);
  for (const child of [].concat(children)) node.append(child);
  return node;
}

function show(message) {
  document.getElementById("results").replaceChildren(el("p", { textContent: message }));
  document.documentElement.dataset.done = "error";
}

function render(results, where) {
  const byId = new Map(results.map((r) => [r.id, r]));
  const counts = { protected: 0, exposed: 0, visible: 0 };
  const sections = [];
  for (const group of GROUPS) {
    const box = el("div", { className: "group" });
    for (const item of group.items) {
      const r = byId.get(item.id);
      if (!r || !(r.status in counts)) continue;
      counts[r.status]++;
      const row = el("div", { className: "item" }, [
        el("strong", { textContent: item.name }),
        el("span", { className: "badge " + r.status, textContent: LABEL[r.status] }),
        el("div", { className: "value", textContent: r.value }),
        el("div", { className: "why", textContent: item.why }),
      ]);
      row.dataset.name = item.name; row.dataset.status = r.status; row.dataset.value = r.value;
      box.append(row);
    }
    sections.push(el("h2", { textContent: group.title }), box);
  }
  document.getElementById("results").replaceChildren(...sections);
  document.getElementById("where").textContent = where;
  const stat = (n, label) => el("div", { className: "stat" }, [el("b", { textContent: n }), el("span", { textContent: label })]);
  document.getElementById("summary").replaceChildren(
    stat(counts.protected, "protected"), stat(counts.exposed, "exposed"), stat(counts.visible, "visible to any site"));
  document.documentElement.dataset.done = "1";
}

async function main() {
  const tabId = Number(new URLSearchParams(location.search).get("tab"));
  const inExtension = typeof browser !== "undefined" && browser.scripting;
  if (!inExtension) {
    // Opened as an ordinary web page (development and tests): test this page itself.
    return render(await klinSelfTestChecks(), "Tested as seen by this page.");
  }
  if (!tabId) return show("Open a website, then click the Klin self-test button in the toolbar.");
  let host = "the site";
  try {
    host = new URL((await browser.tabs.get(tabId)).url).host || host;
    // world "MAIN" = the page's own context: extension contexts are exempt from
    // fingerprinting protection and would give misleading results.
    const [injection] = await browser.scripting.executeScript({ target: { tabId }, world: "MAIN", func: klinSelfTestChecks });
    if (!injection || !Array.isArray(injection.result)) throw new Error(injection && injection.error ? injection.error.message : "no result");
    render(injection.result, `Tested as seen by ${host}, in the tab you were viewing.`);
  } catch (e) {
    show("This page cannot be tested (browser pages and a few protected sites do not allow it). Open an ordinary website and click the button again.");
  }
}

main();
