/*
 * Dog Feeding Card
 * Shows a dog photo with Breakfast and Dinner status circles.
 * Resource type: JavaScript module
 * Card type:     custom:dog-feeding-card
 */

const DFC_VERSION = "1.0.0";

const THEME_COLORS = [
  "primary", "accent", "disabled", "red", "pink", "purple", "deep-purple",
  "indigo", "blue", "light-blue", "cyan", "teal", "green", "light-green",
  "lime", "yellow", "amber", "orange", "deep-orange", "brown", "light-grey",
  "grey", "dark-grey", "blue-grey", "black", "white",
];

const DEFAULTS = {
  image_size: 120,
  on_circle_color: "#dff0d3",
  on_icon_color: "#5fa83f",
  off_circle_color: "#bfbfbf",
  off_icon_color: "#808080",
};

// Accepts hex, rgb(), var(--anything), or a bare theme name like "green".
const resolveColor = (value, fallback) => {
  const v = typeof value === "string" ? value.trim() : "";
  if (!v) return fallback;
  if (THEME_COLORS.includes(v)) return `var(--${v}-color)`;
  return v;
};

class DogFeedingCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._imgSrc = null;
  }

  static getConfigElement() {
    return document.createElement("dog-feeding-card-editor");
  }

  static getStubConfig(hass) {
    const ids = Object.keys((hass && hass.states) || {}).filter(
      (id) => id.startsWith("binary_sensor.") || id.startsWith("input_boolean.")
    );
    const find = (word) => ids.find((id) => id.includes(word)) || "";
    return {
      image: "",
      breakfast_entity: find("breakfast"),
      dinner_entity: find("dinner"),
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = { ...DEFAULTS, ...config };
    if (!this._built) this._build();
    this._update();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._built) this._update();
  }

  getCardSize() {
    return 4;
  }

  getGridOptions() {
    return { columns: 6, rows: 4, min_columns: 3, min_rows: 3 };
  }

  _build() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          height: 100%;
          box-sizing: border-box;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .photo {
          width: var(--dfc-size, 120px);
          max-width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 24%;
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--secondary-background-color);
          color: var(--secondary-text-color);
        }
        .photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: var(--dfc-pos, center);
          display: block;
        }
        .photo ha-icon { --mdc-icon-size: 48%; }
        .meals {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .meal {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          padding: 4px;
          margin: 0;
          font: inherit;
          color: inherit;
          cursor: pointer;
          border-radius: var(--ha-card-border-radius, 12px);
        }
        .meal:focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }
        .circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.3s ease, color 0.3s ease;
        }
        .circle ha-icon { --mdc-icon-size: 38px; }
        .label {
          color: var(--primary-text-color);
          font-size: var(--ha-font-size-m, 14px);
          font-weight: 500;
          line-height: 1.2;
        }
        .meal.unavailable .circle { opacity: 0.5; }
      </style>
      <ha-card>
        <div class="photo">
          <img alt="" />
          <ha-icon icon="mdi:dog"></ha-icon>
        </div>
        <div class="meals">
          <button class="meal" data-meal="breakfast" type="button">
            <span class="circle"><ha-icon></ha-icon></span>
            <span class="label">Breakfast</span>
          </button>
          <button class="meal" data-meal="dinner" type="button">
            <span class="circle"><ha-icon></ha-icon></span>
            <span class="label">Dinner</span>
          </button>
        </div>
      </ha-card>
    `;

    const root = this.shadowRoot;
    this._img = root.querySelector(".photo img");
    this._placeholder = root.querySelector(".photo ha-icon");
    this._img.addEventListener("error", () => this._showImage(false));
    this._img.addEventListener("load", () => this._showImage(true));

    this._meals = {};
    root.querySelectorAll(".meal").forEach((btn) => {
      const meal = btn.dataset.meal;
      this._meals[meal] = {
        btn,
        circle: btn.querySelector(".circle"),
        icon: btn.querySelector(".circle ha-icon"),
      };
      btn.addEventListener("click", () => this._moreInfo(meal));
    });

    this._built = true;
  }

  _showImage(ok) {
    this._img.style.display = ok ? "block" : "none";
    this._placeholder.style.display = ok ? "none" : "block";
  }

  _moreInfo(meal) {
    const entityId = this._config && this._config[`${meal}_entity`];
    if (!entityId) return;
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId },
        bubbles: true,
        composed: true,
      })
    );
  }

  _update() {
    const c = this._config;
    if (!c) return;

    // Photo
    const size = Number(c.image_size) || DEFAULTS.image_size;
    this.style.setProperty("--dfc-size", `${size}px`);
    this.style.setProperty("--dfc-pos", c.image_position || "center");

    const src = c.image || "";
    if (src !== this._imgSrc) {
      this._imgSrc = src;
      if (src) {
        this._img.src = src;
      } else {
        this._img.removeAttribute("src");
        this._showImage(false);
      }
    }

    // Status circles
    const onCircle = resolveColor(c.on_circle_color, DEFAULTS.on_circle_color);
    const onIcon = resolveColor(c.on_icon_color, DEFAULTS.on_icon_color);
    const offCircle = resolveColor(c.off_circle_color, DEFAULTS.off_circle_color);
    const offIcon = resolveColor(c.off_icon_color, DEFAULTS.off_icon_color);

    ["breakfast", "dinner"].forEach((meal) => {
      const els = this._meals[meal];
      const entityId = c[`${meal}_entity`];
      const stateObj = this._hass && entityId ? this._hass.states[entityId] : undefined;
      const state = stateObj ? stateObj.state : undefined;
      const fed = state === "on";
      const unavailable = !stateObj || state === "unavailable" || state === "unknown";

      els.icon.setAttribute("icon", fed ? "mdi:check" : "mdi:close");
      els.circle.style.backgroundColor = fed ? onCircle : offCircle;
      els.circle.style.color = fed ? onIcon : offIcon;
      els.btn.classList.toggle("unavailable", unavailable);
      els.btn.setAttribute(
        "aria-label",
        `${meal === "breakfast" ? "Breakfast" : "Dinner"}: ${fed ? "fed" : "not fed"}`
      );
    });
  }
}

const EDITOR_SCHEMA = [
  { name: "image", selector: { text: {} } },
  {
    name: "",
    type: "grid",
    schema: [
      {
        name: "image_size",
        selector: {
          number: { min: 60, max: 300, step: 5, unit_of_measurement: "px", mode: "box" },
        },
      },
      { name: "image_position", selector: { text: {} } },
    ],
  },
  {
    name: "breakfast_entity",
    selector: { entity: { domain: ["binary_sensor", "input_boolean"] } },
  },
  {
    name: "dinner_entity",
    selector: { entity: { domain: ["binary_sensor", "input_boolean"] } },
  },
  {
    name: "",
    type: "grid",
    schema: [
      { name: "on_circle_color", selector: { text: {} } },
      { name: "on_icon_color", selector: { text: {} } },
      { name: "off_circle_color", selector: { text: {} } },
      { name: "off_icon_color", selector: { text: {} } },
    ],
  },
];

const EDITOR_LABELS = {
  image: "Image location",
  image_size: "Image size",
  image_position: "Image focus",
  breakfast_entity: "Breakfast sensor",
  dinner_entity: "Dinner sensor",
  on_circle_color: "Fed: circle color",
  on_icon_color: "Fed: check color",
  off_circle_color: "Not fed: circle color",
  off_icon_color: "Not fed: X color",
};

const EDITOR_HELPERS = {
  image: "Path or URL, for example /local/dog.jpg for a file in /config/www",
  image_position: "Where to anchor the crop, for example center 20%",
  on_circle_color:
    "Hex, rgb(), a CSS variable like var(--primary-color), or a theme name like green",
};

class DogFeedingCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  _render() {
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.schema = EDITOR_SCHEMA;
      this._form.computeLabel = (s) => EDITOR_LABELS[s.name] || s.name;
      this._form.computeHelper = (s) => EDITOR_HELPERS[s.name] || "";
      this._form.addEventListener("value-changed", (ev) => {
        ev.stopPropagation();
        const value = { ...ev.detail.value };
        Object.keys(value).forEach((k) => {
          if (value[k] === "" || value[k] === undefined || value[k] === null) delete value[k];
        });
        this._config = value;
        this.dispatchEvent(
          new CustomEvent("config-changed", {
            detail: { config: value },
            bubbles: true,
            composed: true,
          })
        );
      });
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.data = this._config;
  }
}

customElements.define("dog-feeding-card", DogFeedingCard);
customElements.define("dog-feeding-card-editor", DogFeedingCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "dog-feeding-card",
  name: "Dog Feeding",
  description: "Dog photo with breakfast and dinner status circles.",
  preview: true,
});

console.info(`%c DOG-FEEDING-CARD %c v${DFC_VERSION} `, "background:#5fa83f;color:#fff", "");
