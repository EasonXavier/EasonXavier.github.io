# Lancelot UI Playground Portal Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Portal card 04 with a clearly marked development entry for the deployed Lancelot UI playground and publish Portal v1.5.0.

**Architecture:** Keep the existing static four-card layout and turn the reserved green card into a normal anchor that targets `/lancelot-gamepal-ui-playground/`. Preserve existing interactions and visual primitives, rename only the card-specific placeholder selectors, and update all Portal version surfaces together.

**Tech Stack:** Static HTML/CSS/JavaScript, npm metadata, Playwright end-to-end tests, GitHub Pages.

## Global Constraints

- Modify only `EasonXavier/EasonXavier.github.io`; do not read, sync, test, or modify the local `lancelot-gamepal-ui-playground` workspace.
- Portal version is exactly `1.5.0` with release date `2026-07-28`.
- Card 04 links to `/lancelot-gamepal-ui-playground/` in the current tab and displays `朗世乐`, `移动 UI 与性能试验场`, `开发中`, `v0.1.0`, and `进入试验场`.
- Do not create a tag, GitHub Release, or formal Lancelot release.

---

### Task 1: Lock the new Portal behavior with a failing test

**Files:**
- Modify: `tests/portal-preview.spec.js`

**Interfaces:**
- Consumes: Portal DOM rendered from `/`.
- Produces: Assertions for Portal v1.5.0, the new card href/copy/version/status, and the section count.

- [ ] **Step 1: Replace the current smoke test assertions with the new contract**

```js
const lancelotCard = page.locator('a[href="/lancelot-gamepal-ui-playground/"]');
await expect(page.locator('.release-meta-header')).toContainText('v1.5.0');
await expect(page.locator('.section-heading')).toContainText('3 个可用 · 1 个开发中');
await expect(lancelotCard).toContainText('朗世乐');
await expect(lancelotCard).toContainText('移动 UI 与性能试验场');
await expect(lancelotCard).toContainText('开发中');
await expect(lancelotCard).toContainText('v0.1.0');
await expect(lancelotCard).toContainText('进入试验场');
```

- [ ] **Step 2: Run the targeted Playwright test and verify RED**

Run: `npm run test:e2e -- --project="Desktop Edge"`

Expected: FAIL because the header still shows `v1.4.0` and the Lancelot anchor does not exist.

### Task 2: Implement the card and Portal version update

**Files:**
- Modify: `index.html`
- Rename/modify: `assets/portal.v1.4.0.css` to `assets/portal.v1.5.0.css`
- Rename: `assets/portal.v1.4.0.js` to `assets/portal.v1.5.0.js`
- Modify: `package.json`, `package-lock.json`, `README.md`

**Interfaces:**
- Consumes: Existing `tool-card`, `tool-card-active`, `card-green`, `status-meta`, and parallax behavior.
- Produces: A same-tab card 04 anchor and consistent Portal v1.5.0 metadata/assets.

- [ ] **Step 1: Replace the reserved article with the active Lancelot anchor**

```html
<a class="tool-card tool-card-active card-green tool-lancelot" href="/lancelot-gamepal-ui-playground/" aria-label="打开朗世乐 UI 试验场">
  <div class="card-topline">
    <span class="status-meta">
      <span class="status-dot"><i></i>开发中</span>
      <span class="card-version" title="lancelot-gamepal-ui-playground main · v0.1.0">v0.1.0</span>
    </span>
    <span class="card-number">04</span>
  </div>
  <div class="card-visual" data-parallax data-parallax-speed="0.028" data-parallax-max="18" aria-hidden="true">
    <div class="abstract-icon lancelot-icon"><span></span><span></span><span></span></div>
  </div>
  <div class="card-content">
    <h3>朗世乐</h3>
    <p class="card-subtitle">移动 UI 与性能试验场</p>
  </div>
  <div class="card-action"><span>进入试验场</span><span class="arrow" aria-hidden="true">↗</span></div>
</a>
```

- [ ] **Step 2: Update Portal metadata and section copy**

Set the application version, header version/date, CSS/JS references, and package/lockfile root versions to `1.5.0`; set the header date to `2026-07-28`; set the section count to `3 个可用 · 1 个开发中`.

- [ ] **Step 3: Rename versioned assets and card-specific selectors**

Rename the CSS/JS files to `portal.v1.5.0.*`. In CSS, replace `.tool-placeholder-two` with `.tool-lancelot`, replace `.placeholder-icon`/`.placeholder-two` selectors with `.lancelot-icon`, and preserve their existing declarations and responsive spans.

- [ ] **Step 4: Update README entry and file tree**

Replace item 4 with the Pages URL and the two card facts: it is a mobile UI/performance playground and is under active development. Update the listed asset names to `portal.v1.5.0.css` and `portal.v1.5.0.js`.

- [ ] **Step 5: Run the targeted Playwright test and verify GREEN**

Run: `npm run test:e2e -- --project="Desktop Edge"`

Expected: PASS with the new card contract.

### Task 3: Verify, publish, and validate Pages

**Files:**
- Verify all modified files; create no additional artifacts in the repository.

**Interfaces:**
- Consumes: Portal v1.5.0 working tree and the deployed Lancelot Pages URL.
- Produces: A tested commit on `main` and a successful Portal Pages deployment.

- [ ] **Step 1: Run static and full responsive verification**

Run `node --check assets/portal.v1.5.0.js`, verify all relative `href`/`src` assets exist, run `git diff --check`, and run `npm run test:e2e` across all configured Playwright projects.

Expected: all commands exit 0; Playwright reports no failed projects.

- [ ] **Step 2: Recheck the target Pages endpoint**

Run: `curl.exe -I -L --max-time 20 https://easonx.me/lancelot-gamepal-ui-playground/`

Expected: final response is `HTTP/1.1 200 OK` from GitHub Pages.

- [ ] **Step 3: Review the final diff and commit**

Stage only the plan, tests, Portal HTML/CSS/JS, package metadata, and README. Commit with `feat: add Lancelot UI playground to portal`.

- [ ] **Step 4: Push main and verify deployment**

Push `main` to `origin`, poll the latest GitHub Pages build until it reports `built` for the pushed commit, then verify `https://easonx.me/` serves Portal v1.5.0 and includes the new link.
