/*
 * _registry.js — the list of all components, validated and indexed.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  TO ADD A COMPONENT: create src/components/YourThing.js, then add  │
 * │  two lines below — an import and an entry in DEFINITIONS. Done.    │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * This module is intentionally free of editor dependencies so the runtime and
 * exporter can import it too. Validation problems are collected in
 * `registryErrors` rather than logged here; the editor logs them on startup.
 */

import { validateComponent } from "./schema.js";

import { Screen } from "./Screen.js";
import { Button } from "./Button.js";
import { Label } from "./Label.js";
import { TextBox } from "./TextBox.js";
import { Image } from "./Image.js";
import { HorizontalArrangement } from "./HorizontalArrangement.js";
import { VerticalArrangement } from "./VerticalArrangement.js";
import { LocalStorage } from "./LocalStorage.js";
import { Notifier } from "./Notifier.js";
import { Geolocation } from "./Geolocation.js";
import { Camera } from "./Camera.js";
import { Accelerometer } from "./Accelerometer.js";
import { MqttClient } from "./MqttClient.js";
// 👉 import new components here

const DEFINITIONS = [
  Screen,
  Button,
  Label,
  TextBox,
  Image,
  HorizontalArrangement,
  VerticalArrangement,
  LocalStorage,
  Notifier,
  Geolocation,
  Camera,
  Accelerometer,
  MqttClient,
  // 👉 add new components here
];

/** name -> definition, for valid components only. */
export const components = new Map();

/** Human-readable problems found while building the registry (empty = all good). */
export const registryErrors = [];

for (const def of DEFINITIONS) {
  const errors = validateComponent(def);
  if (errors.length) {
    registryErrors.push(`${def?.name ?? "(unnamed)"}: ${errors.join("; ")}`);
  } else if (components.has(def.name)) {
    registryErrors.push(`duplicate component name "${def.name}"`);
  } else {
    components.set(def.name, def);
  }
}

/* ---- Query helpers used by the palette, blocks, runtime and exporter ---- */

export const getComponent = (name) => components.get(name);
export const allComponents = () => [...components.values()];
export const visibleComponents = () => allComponents().filter((c) => c.visible);
export const nonVisibleComponents = () => allComponents().filter((c) => !c.visible);

/** Group components by their `category`, preserving insertion order. */
export function componentsByCategory() {
  const groups = new Map();
  for (const def of allComponents()) {
    if (!groups.has(def.category)) groups.set(def.category, []);
    groups.get(def.category).push(def);
  }
  return groups;
}
