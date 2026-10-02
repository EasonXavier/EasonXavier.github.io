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
   - 默认先保函后付款，任意时点需要垫资时自动提示
   - 测试版 v0.1.0；示例数据，仅在当前页面内计算，不上传输入

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
