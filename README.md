# EasonXavier.github.io

静态网页工具发布门户，使用 GitHub Pages 托管。

## 当前入口

1. [动态二维码识别](https://easonx.me/single-device-dftfa/)
   - 手机摄像头扫码
   - PC 屏幕共享识别
   - 动态二维码 Index 与复制状态提示
2. [今天吃什么](https://easonx.me/what-to-eat-today/)
   - 大类与具体菜式两层随机选择
   - 大类 24 小时内不重复
3. [DataSpectrum 数据棱镜](https://easonx.me/data-spectrum/)
   - 根据公开 KD 数据估算绝密对局场次区间
   - 按游戏一位小数 KD 的显示区间计算下界
   - 全程在浏览器本地计算
4. [朗世乐 UI 试验场](https://easonx.me/lancelot-gamepal-ui-playground/)
   - 移动 UI 与微信 WebView 性能试验场
   - 当前处于开发中，用于线上测试

5. [服务器交易现金流测算](https://easonx.me/server-cashflow/)
   - 预付款、尾款、居间返点与保函分配
   - 默认先保函后付款，任意时点需要垫资时用背景色、状态文字和缺口金额提示，不弹窗
   - 采购、销售单价每次 ±5 万元；居间 A/B 独立按每台返点计算，每次 ±1 万元
   - 默认采购 128 台 × 1390 万元，销售 128 台 × 1500 万元，下游预付款 29.4%，居间返点 85 万元/台
   - 上下游预付款比例每次 ±0.1 个百分点；采购及销售数量提供 ×2 / ÷2 按钮，不能整除或越界时禁用
   - 统一表单与步进控件，分区导航和顶部固定资金指标（预付款净额、结清后余额、利润、缺口），图表自适应移动端
   - 图表在前，采购与销售参数在图下；上游设置保函比例，下游销售卡直接显示分配金额和实际保函比例（保函金额 ÷ 下游销售合同金额）；分配设置及覆盖明细默认折叠
   - v0.6.0；支持 JSON 导入导出、明暗主题、现金流图表与固定密码入口；仅在当前页面内计算，不上传输入

## 文件结构

```text
EasonXavier.github.io/
├── index.html
├── assets/
│   ├── portal.v1.6.0.css
│   ├── portal.v1.6.0.js
│   └── fonts/
│       ├── portal-kai.v1.3.0.woff2
│       └── portal-text.v1.3.0.woff2
├── .nojekyll
└── README.md
```

门户默认使用暗色主题，可通过页头按钮切换，并在浏览器中记住手动选择。版本和更新日期显示在页脚。

## 发布地址

```text
https://easonx.me/
```

门户卡片使用自定义域名下的项目站点根路径链接；路径与对应的规范化仓库名称保持一致。

## 版本规则

- Portal 版本只在门户自身的布局、功能或交互行为发生变化时更新。
- 各工具的版本号独立维护；仅同步工具卡版本号时，不更新 Portal 自身版本。
- 因此工具更新不会连带改变页头、`package.json` 或静态资源文件名中的 Portal 版本。


## 服务器交易工具测试

运行 `node --test tests/server-cashflow.test.cjs` 验证计算模型。工具位于本仓库 `server-cashflow/`，随 Portal 一同发布。

### 交易 JSON 格式

- `server-cashflow/template.json` 为可直接导入的完整模板。
- `server-cashflow/schema.json` 为 JSON Schema 2020-12 定义。
- `schemaVersion` 固定为 `2.0`，`currency` 为 `CNY`，`amountUnit` 为 `CNY_10K`（万元）。
- 百分比用数值 30 表示 30%，节点用 1–999 的整数表示；先保函、后付款。
- `procurement` 描述采购单价、数量、预付款和保函比例及节点。
- 可选 `advanceMarginPoints` 为预付款差额 m，默认 3；客户可选 `advanceMode` 为 `auto` 或 `manual`。页面默认及新增客户为自动；自动比例＝分配保函金额 ÷ 销售额 × 100 − m，四舍五入到 0.1 个百分点并限制在 0–100。修改价格、保函或 m 后联动。
- 老版 v2.0 数据未提供 `advanceMode` 时按手动保留 `advanceRate`；新版导出保存模式及 m，自动模式的 `advanceRate` 为计算快照，重新导入时按公式重算。
- `customers` 描述各下游名称、销售单价、数量、预付款比例及收款节点。
- `intermediaries` 为独立居间方数组（最多 20 位），每项含 `name` 和 `rebatePerUnit`（万元/台）。各方应付返点为每台返点 × 全部已售台数，随对应客户回款比例支付；无返点可填空数组。
- v1.0 的客户 `rebateTotal` 不再使用；导入旧版会提示改用 v2.0 模板，避免将合同总额误作每台费用。
- `guaranteeAllocation` 为 `quantity`（按数量）或 `manual`（手动额度）；手动模式下每个客户必须提供 `guaranteeAmount`。
- 导入先校验再替换，不猜测缺失数据。存在垫资或保函顺序问题的合法数据可导入，导入后立即显示风险提示。
- 当前数据可导出；刷新页面会恢复预设参数。仅主题偏好保存到本机。

### 访问入口

固定密码采用加盐 PBKDF2 校验，源代码不保存明文密码。此功能只限制普通页面入口；GitHub Pages 及仓库仍为公开静态资源，不能用来保护机密数据或替代服务端认证。锁定不会上传、保存或清空当前交易，刷新需重新输入密码。

校验命令：`node tests/server-cashflow-data.test.cjs`。密码不得提交至本仓库。

### 现金流工具 v0.6.0

- 保函基数 B1 默认跟随采购单价 P1，可手动指定；保函总额为 B1 × 采购台数 × 保函比例，采购成本仍按 P1 计算。
- 完整 JSON 输出保留 v2.0 条件结构，新增 procurement.guaranteeBasePrice / guaranteeBaseMode 和 calculation 结果快照。旧数据缺少 B1 时跟随 P1；只有基数数值时采用手动模式。导入始终按条件重新计算，不信任历史 calculation。上限 2 MB。
- 客户报价图片按所选客户输出成交单价、数量、合同额、保函金额及实际比例、两期货款、各居间方每台费用与两次付款。图片不包含上游成本、内部利润、资金缺口或其他客户信息。PNG 在浏览器本地生成。
