# Repository rename and portal cutover audit

## Operation

- Operation ID: `repo-rename-2026-07-29-portal-cutover`
- Status: `completed`
- Portal repository: `EasonXavier/EasonXavier.github.io`
- Portal repository ID: `1302800358`
- Branch and Pages source: `main` / repository root
- Baseline commit: `0a3bccf9792f04549559463035a6dc39f1639ec3`
- Prepared at: `2026-07-29T07:49:09+08:00` (`2026-07-28T23:49:09Z`)
- Portal release: `1.5.1` (`2026-07-29`)
- Portal implementation commit:
  `4a1cebe6075daa5d0f82d9bfbb2bcf16283ff04e`
- Deployment verified at: `2026-07-29T07:55:45+08:00`
  (`2026-07-28T23:55:45Z`)

## Completed repository renames

| Repository ID | Previous name | Canonical name | Final audit commit | Verification |
| --- | --- | --- | --- | --- |
| `1300417121` | `What-to-eat-today` | `what-to-eat-today` | `355f7d5` | New Pages URL returned HTTP 200; title `今天吃什么` |
| `1227244603` | `singledeviceDFTFA` | `single-device-dftfa` | `59079c2` | New Pages URL returned HTTP 200; title `singledeviceDFTFA` |
| `1305865066` | `DataSpectrum` | `data-spectrum` | `31c1cf23e4064040e9d6e03dd7091888d3006ff8` | Pages run `30408952963` succeeded; new URL returned HTTP 200; title `DataSpectrum · 数据棱镜` |

The repository IDs remained stable. The preflight scan found no GitHub Actions
consumers, submodules, package coordinates, raw-content URLs, or API endpoints
that depended on the previous repository names.

## Public URL changes

| Previous route | Canonical route |
| --- | --- |
| `https://easonx.me/What-to-eat-today/` | `https://easonx.me/what-to-eat-today/` |
| `https://easonx.me/singledeviceDFTFA/` | `https://easonx.me/single-device-dftfa/` |
| `https://easonx.me/DataSpectrum/` | `https://easonx.me/data-spectrum/` |

This was a direct cutover. No compatibility redirect pages were added at the
old GitHub Pages paths.

## Portal changes

- Switch the three portal routes and technical repository labels to the
  canonical names.
- Preserve user-facing product names and the applications' independent version
  labels.
- Release Portal `1.5.1` dated `2026-07-29`.
- Rename the versioned CSS and JavaScript assets to `portal.v1.5.1.*`.
- Synchronize `package.json`, `package-lock.json`, README links, and Playwright
  expectations.

## Test evidence

- Baseline: `npm run test:e2e` passed all 11 tests before implementation.
- RED: the updated expectations failed all 11 tests because the served page
  still reported `v1.5.0 · 2026-07-28`.
- GREEN: JavaScript syntax validation passed and `npm run test:e2e` passed all
  11 tests after implementation.
- Live: `https://easonx.me/` returned HTTP 200 and reported Portal `1.5.1`
  with all three canonical routes.
- Live: the three canonical application URLs and both versioned Portal assets
  returned HTTP 200.

## Result

`PASS` — the three repository renames, their Pages deployments, and the Portal
cutover were verified. The annotated release tag `v1.5.1` identifies the final
Portal audit commit.

## Rollback procedure

1. Rename the three repositories back to their previous names in the reverse
   order: `data-spectrum`, `single-device-dftfa`, then `what-to-eat-today`.
2. Reset each local `origin` URL to the restored repository name.
3. Revert the Portal release commit to restore version `1.5.0`, the previous
   routes, technical labels, and static asset names.
4. Append the rollback event and resulting repository names, commit IDs, and
   timestamps to each repository's audit file; commit and push the records.
5. Verify the Portal and all three restored Pages URLs return HTTP 200.

Do not create new repositories using the previous names during rollback; doing
so can interfere with GitHub's repository redirect behavior.
