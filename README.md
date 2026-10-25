# Chengxin Zeng · 文章与思辨

按写作时间倒序排列的个人文集。分类、封面和手写摘要均不是发文要求。

## 写文章

打开网站的 `/write/`，填写标题、日期和正文。草稿自动保存在当前浏览器，支持预览。

点击“准备发布”，保存下载的 `.md` 文件，再通过页面提供的入口上传到 GitHub 仓库的 `posts/` 并提交。Netlify 会重新生成并发布网站。写作页不保存 GitHub 密钥；只有仓库拥有者可以提交。

也可以直接在 `posts/` 新建文章：

```md
---
id: "my-first-essay"
title: "文章标题"
date: "2026-10-25"
---

正文从这里开始。
```

`id` 和文件名保持唯一且稳定。`date` 支持 `YYYY-MM-DD` 或仅知道月份时的 `YYYY-MM`。修改旧文章时保留原日期、文件名和 id，按需加 `updated: "2026-10-25"`。文章不因修改而跑到首页最上面。

支持小标题、加粗、引用、无序和有序列表、代码块、Markdown 链接、图片（https 或站内绝对路径）及脚注。摘要默认从正文提取，可选加 `summary` 覆盖。

## 本地运行

需要 Node.js 20 以上，无需安装依赖。

```sh
node scripts/build.mjs
node scripts/check.mjs
node scripts/serve.mjs
```

构建产物在 `dist/`。Netlify 按 `netlify.toml` 执行相同构建。

文章独立页面在 `/essays/<id>/`，以前的 `/#/post/<id>` 链接会转到新地址。RSS 是 `/feed.xml`。正文搜索索引按需加载。阅读位置、字号、主题与草稿都只保存在当前浏览器，未引入账号系统或行为追踪。
