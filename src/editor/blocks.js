/*
 * blocks.js — generates Blockly blocks and their JavaScript code, straight from
 * the component schemas. There are NO hand-written blocks per component: every
 * event / property / method becomes a block automatically.
 *
 * For each component type we generate four kinds of block:
 *   • event   `when [Button1▾].Click do {…}`        → $bw.on("Button1","Click",fn)
 *   • setter  `set [Label1▾].Text to (…)`           → $bw.set("Label1","Text",v)
 *   • getter  `[Label1▾].Text`                      → $bw.get("Label1","Text")
 *   • method  `call [Notifier1▾].ShowAlert (…)`     → $bw.call("Notifier1","ShowAlert",[v])
 *
 * The instance (Button1, Button2, …) is a live dropdown populated from the
 * current project, so one generated block definition serves every instance of a
 * type. `$bw` is the runtime API implemented in src/runtime/runtime.js (M5).
 *
 * Block type ids follow: bw_<Type>_<kind>_<member>, e.g. bw_Button_event_Click.
 */

import { allComponents } from "../components/_registry.js";
import { walk, getScreen } from "./model.js";

const q = (s) => JSON.stringify(s);

/** Blockly hue per palette category, so related blocks share a colour. */
function categoryColour(category) {
  return { UI: "230", Layout: "200", Storage: "160", Media: "20" }[category] ?? "120";
}

/** A sensible literal to use when a setter/argument input is left empty. */
function emptyValue(spec) {
  switch (spec?.type) {
    case "number": return "0";
    case "boolean": return "false";
    case "color": return '"#000000"';
    case "dimension": return '"auto"';
    case "enum": return q(spec.options?.[0] ?? "");
    default: return '""';
  }
}

/** Names of all instances of a type in the current project (Screen included). */
function instancesOfType(type) {
  if (type === "Screen") return [getScreen().name];
  const names = [];
  walk((node) => { if (node.type === type) names.push(node.name); });
  return names;
}

/** A Blockly dropdown that always reflects the current instances of a type. */
function instanceDropdown(Blockly, type) {
  return new Blockly.FieldDropdown(() => {
    const names = instancesOfType(type);
    return names.length ? names.map((n) => [n, n]) : [["(none)", ""]];
  });
}

/** The generated block type ids for one component (used to build the toolbox). */
export function blockTypesFor(def) {
  const t = def.name;
  const ids = [];
  for (const ev of Object.keys(def.events ?? {})) ids.push(`bw_${t}_event_${ev}`);
  for (const prop of Object.keys(def.properties ?? {})) {
    ids.push(`bw_${t}_set_${prop}`, `bw_${t}_get_${prop}`);
  }
  for (const m of Object.keys(def.methods ?? {})) ids.push(`bw_${t}_call_${m}`);
  return ids;
}

/** Register every component's blocks + JS generators. Call once after Blockly loads. */
export function registerComponentBlocks(Blockly) {
  const JS = Blockly.JavaScript;
  if (!JS) throw new Error("Blockly JavaScript generator not found");
  for (const def of allComponents()) defineFor(Blockly, JS, def);

  // Override the built-in text block's generator. Blockly's default turns a
  // newline inside a text block into a JS line-continuation, which silently
  // disappears at runtime; JSON.stringify produces a correct, faithful literal
  // (real "\n", proper quoting) so what a student types is what they get.
  JS.forBlock["text"] = (block) => [JSON.stringify(block.getFieldValue("TEXT")), JS.ORDER_ATOMIC];
}

function defineFor(Blockly, JS, def) {
  const t = def.name;
  const colour = categoryColour(def.category);

  // ---- Events: `when [inst].Event do {…}` ----
  for (const ev of Object.keys(def.events ?? {})) {
    const id = `bw_${t}_event_${ev}`;
    Blockly.Blocks[id] = { init() {
      this.appendDummyInput()
        .appendField("when")
        .appendField(instanceDropdown(Blockly, t), "INSTANCE")
        .appendField(`.${ev}`);
      this.appendStatementInput("DO").appendField("do");
      this.setColour(colour);
      this.setTooltip(`Runs when ${t}.${ev} happens.`);
    }};
    JS.forBlock[id] = (block, gen) => {
      const inst = block.getFieldValue("INSTANCE");
      const body = gen.statementToCode(block, "DO");
      return `$bw.on(${q(inst)}, ${q(ev)}, function() {\n${body}});\n`;
    };
  }

  // ---- Properties: setter (statement) + getter (value) ----
  for (const [prop, spec] of Object.entries(def.properties ?? {})) {
    const setId = `bw_${t}_set_${prop}`;
    Blockly.Blocks[setId] = { init() {
      this.appendValueInput("VALUE")
        .appendField("set")
        .appendField(instanceDropdown(Blockly, t), "INSTANCE")
        .appendField(`.${prop} to`);
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour(colour);
    }};
    JS.forBlock[setId] = (block, gen) => {
      const inst = block.getFieldValue("INSTANCE");
      const value = gen.valueToCode(block, "VALUE", gen.ORDER_NONE) || emptyValue(spec);
      return `$bw.set(${q(inst)}, ${q(prop)}, ${value});\n`;
    };

    const getId = `bw_${t}_get_${prop}`;
    Blockly.Blocks[getId] = { init() {
      this.appendDummyInput()
        .appendField(instanceDropdown(Blockly, t), "INSTANCE")
        .appendField(`.${prop}`);
      this.setOutput(true);
      this.setColour(colour);
    }};
    JS.forBlock[getId] = (block, gen) => {
      const inst = block.getFieldValue("INSTANCE");
      return [`$bw.get(${q(inst)}, ${q(prop)})`, gen.ORDER_FUNCTION_CALL];
    };
  }

  // ---- Methods: `call [inst].Method (args)` ----
  // A method that declares `returns` becomes a value block (usable in an
  // expression); otherwise it's a statement block.
  for (const [m, meta] of Object.entries(def.methods ?? {})) {
    const id = `bw_${t}_call_${m}`;
    const params = meta.params ?? [];
    const returnsValue = !!meta.returns;
    Blockly.Blocks[id] = { init() {
      this.appendDummyInput()
        .appendField(returnsValue ? "" : "call")
        .appendField(instanceDropdown(Blockly, t), "INSTANCE")
        .appendField(`.${m}`);
      params.forEach((p, i) => this.appendValueInput(`ARG${i}`).appendField(p.name));
      if (returnsValue) {
        this.setOutput(true);
      } else {
        this.setPreviousStatement(true);
        this.setNextStatement(true);
      }
      this.setColour(colour);
    }};
    JS.forBlock[id] = (block, gen) => {
      const inst = block.getFieldValue("INSTANCE");
      const args = params.map((_, i) => gen.valueToCode(block, `ARG${i}`, gen.ORDER_COMMA) || "null");
      const call = `$bw.call(${q(inst)}, ${q(m)}, [${args.join(", ")}])`;
      return returnsValue ? [call, gen.ORDER_FUNCTION_CALL] : `${call};\n`;
    };
  }
}
