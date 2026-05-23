# Third-party notices

Blockwork is original work licensed under the [MIT License](LICENSE). It uses the
third-party software listed below. Each is redistributed or referenced under its
own license, reproduced/linked here in accordance with those licenses.

> Blockwork is **not affiliated with, sponsored by, or endorsed by** MIT, the MIT
> App Inventor project, or Google. "App Inventor" is referenced only descriptively
> (Blockwork is *App-Inventor-style*); all related names and logos belong to their
> respective owners.

---

## Blockly
- **Version:** 11.x
- **License:** Apache License 2.0
- **Copyright:** © Google LLC
- **Homepage:** https://developers.google.com/blockly
- **How Blockwork uses it:** loaded from a CDN in the **editor only** (the block
  workspace and code generator). It is **not** bundled into exported student apps.

Licensed under the Apache License, Version 2.0. You may obtain a copy of the
License at: https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed
under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
CONDITIONS OF ANY KIND, either express or implied.

---

## MQTT.js
- **Version:** 5.x
- **License:** MIT
- **Copyright:** © the MQTT.js contributors
- **Homepage:** https://github.com/mqttjs/MQTT.js
- **How Blockwork uses it:** loaded from a CDN at runtime by the `MqttClient`
  component when an app connects to a broker.

MIT License text reproduced under "MIT License (shared text)" below.

---

## JSZip
- **Version:** 3.10.1
- **License:** Dual-licensed under MIT or GPLv3 — used here under the **MIT** option.
- **Copyright:** © 2009–2016 Stuart Knightley
- **Homepage:** https://stuk.github.io/jszip/
- **How Blockwork uses it:** **vendored** at `vendor/jszip.min.js` (its license
  header is preserved in that file) and loaded on demand to build the export zip.
- **Bundled dependency:** JSZip includes **pako** (© Vitaly Puzrin & Andrey Tupitsin),
  licensed under the MIT License — https://github.com/nodeca/pako

MIT License text reproduced under "MIT License (shared text)" below.

---

## MIT License (shared text)

The following MIT License terms apply to MQTT.js, JSZip (under its MIT option),
and pako. The copyright holder for each is named in its section above.

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
