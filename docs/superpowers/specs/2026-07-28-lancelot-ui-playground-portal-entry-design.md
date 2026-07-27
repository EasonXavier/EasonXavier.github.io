# 朗世乐 UI 试验场 Portal 入口设计

## 目标

在 Eason's Tools Portal 中提供一个稳定的线上测试入口，直接打开已经部署在 GitHub Pages 的朗世乐移动 UI 与性能试验场，同时明确提示该项目仍在开发中。

## 已确认设计

- 只修改并发布 `EasonXavier/EasonXavier.github.io`；不读取、同步、测试或修改本地 `lancelot-gamepal-ui-playground` 工作区。
- 将编号 `04` 的绿色预留卡替换为可点击卡片，不新增第五张卡，保持现有四卡响应式布局。
- 卡片使用站点根路径 `/lancelot-gamepal-ui-playground/`，在当前标签页打开 GitHub Pages。
- 卡片标题为“朗世乐”，副标题为“移动 UI 与性能试验场”，状态为“开发中”，项目版本显示为 `v0.1.0`，操作文案为“进入试验场”。
- 工具区统计改为“3 个可用 · 1 个开发中”。卡片沿用现有绿色抽象图形，但将 Portal 代码中的 placeholder 命名替换为 Lancelot 语义命名，不引入新素材。
- Portal 版本从 `1.4.0` 升级到 `1.5.0`，发布日期使用 `2026-07-28`；同步更新页面元数据、版本化 CSS/JS 文件名、包清单、锁文件、README 和测试。

## 验证与发布

- 实施前仅允许从 `origin/main` 纯快进同步；若工作区不干净或出现分歧，停止且不覆盖现有内容。
- 自动验证覆盖 Portal 版本一致性、静态资源存在性、JavaScript 语法、现有多视口 Playwright 冒烟测试，以及朗世乐卡片的链接、状态、版本和统计文案。
- 发布前确认 `https://easonx.me/lancelot-gamepal-ui-playground/` 返回 HTTP 200。
- 验证通过后提交并推送 Portal 的 `main`，等待 GitHub Pages 构建成功，再检查线上 Portal 的新卡片和目标跳转。
- 不创建 tag、GitHub Release 或朗世乐正式版本。
