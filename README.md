# 原点

写下想达成的目标，和你给它的时间。页面列出可以勾选的事，进度只留在这台浏览器。

页面是纯静态文件，没有构建步骤。GitHub Pages 从仓库根目录发布即可。

## 怎么用

1. 填写「想达成的目标」和「时间」。时间用你自己的话，例如六个月，或每周三个晚上。
2. 按「列出要做的事」。清单立刻出现，没有动画。
3. 勾选只留在这台浏览器。最近的目标可以再打开。改字之后按「更新清单」。

页面不替你编写目标，也不另排一套日期。

## 本机保存与预留接口

目标和勾选写在本机 `localStorage`，不会上传。

右上角「接口」是预留抽屉：可以填写 Base URL、密钥和模型名，只存在本机。这一版不会读取这些字段，也不会发起请求。

| 键 | 内容 |
| --- | --- |
| `yuandian-plans-v2` | 最近的目标、时间和清单 |
| `yuandian-checks-v2` | 勾选 |
| `yuandian-llm-v1` | 预留的地址、密钥、模型 |

## 文件

| 路径 | 作用 |
| --- | --- |
| `index.html` | 页面 |
| `styles.css` | 样式 |
| `engine.js` | 本机清单 |
| `app.js` | 表单、勾选、预留接口 |
| `favicon.svg` | 图标 |
| `.nojekyll` | 让 GitHub Pages 按原样提供文件 |
| `test/engine.test.js` | 引擎测试 |
| `fde/` | 与本页无关的内部草案，首页没有入口 |

## 本地预览

```bash
python3 -m http.server 8742
```

打开 [http://127.0.0.1:8742](http://127.0.0.1:8742)。

```bash
node --test test/engine.test.js
```

## 发布

仓库 Settings → Pages → Deploy from a branch。分支选 `main`，文件夹选 `/ (root)`。

不要把密钥、token 或 `.env` 放进这个仓库。
