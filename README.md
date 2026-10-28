# Vibecoder guidelines — building an OhhWells template

Everything needed to build a template that the OhhWells canvas editor and the AI prompt feature can edit, and to prove it before it ships.

| Read | When |
|---|---|
| [1-SETUP.md](1-SETUP.md) | Starting a template: copy `starter/`, run it, configure env, publish. Also §7, publishing your own or a client's site instead of a marketplace template. |
| [starter/](starter/) | The platform's starter template, synced automatically from the OhhWells templates repo. Copy it; do not edit it here. |
| [2-CONVENTIONS.md](2-CONVENTIONS.md) | Writing any component: the `data-ohw-*` contract, keys, sections, links, brand tokens, forms, maps, carousels. |
| [3-CHECKS.md](3-CHECKS.md) | Before publishing: build, the convention checker, the AI review (with your own Anthropic key), CI. |
| [check/](check/) | The checker itself. Deterministic rules 1 to 25 plus the AI review runner. Zero npm dependencies, Node 18+. |

## The one idea behind every rule

The editor and the AI never read your JSX. The bridge (`@ohhwells/bridge`, mounted in the root layout) collects `data-ohw-*` attributes from the rendered DOM, and that collection is the only view the editor and the model have of the page. Anything not tagged correctly is silently invisible: no error, no warning at runtime, the feature simply does nothing for that element. The same holds for brand repaints (they work through CSS variables), section targeting (through `data-ohw-section` ids) and navigation rewiring (through `data-ohw-href-key`).

The checker exists because these failures never show up as broken builds. They show up weeks later as "the AI ignored my section".

## How this repo is used

You have your template folder. This repo is the rulebook and the checker for it; it is the same tool the OhhWells team runs over the platform's own templates, so passing it here means passing it there.

```bash
git clone https://github.com/ohhwells/vibecoder-guidelines.git   # anywhere, once
cd my-template                                                          # your template
node /path/to/vibecoder-guidelines/check/run.mjs                        # checks this template
```

- Public and read-only: anyone can read and clone, only the OhhWells team can change it. If a rule flags something your template genuinely satisfies, open an issue with the finding and the source; do not work around it.
- Rule numbers 1 to 25 in these docs are the checker's rule numbers (`check/rules/NN-*.mjs`).
- Run it again after every change; it takes about a second and needs no install.
