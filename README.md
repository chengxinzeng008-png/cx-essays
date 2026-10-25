# Chengxin Zeng · 文章与思辨

按写作时间倒序排列的个人文集。公开网站只提供阅读、搜索和订阅，没有写作页、上传表单、发布接口或管理入口。

## 更新文章

文章保存在 GitHub 仓库的 `posts/`。只有拥有仓库写权限的人能提交修改，Netlify 根据已授权的仓库提交构建并发布。公开网页不会接收内容修改，也不保存仓库或部署密钥。

新文章格式：

```md
---
id: "my-first-essay"
title: "文章标题"
date: "2026-10-25"
---

正文从这里开始。
```

保持文件名和 id 唯一且稳定。修改旧文时保留原日期，可增加 `updated` 记录修改日期。分类、封面和手写摘要均非必填。

## 构建与检查

需要 Node.js 20 以上，无安装依赖。

```sh
node scripts/build.mjs
node scripts/check.mjs
node scripts/serve.mjs
```

构建产物位于 `dist/`。文章在 `/essays/<id>/`，旧的 `/#/post/<id>` 链接继续有效，RSS 为 `/feed.xml`。

内容渲染会转义原始 HTML，并限制链接协议。部署响应头限制同源脚本、阻止嵌入外站框架和表单提交。阅读位置、主题和字号仅保存在当前浏览器。

这些网页防护不能代替 GitHub 与 Netlify 的账号和写入权限管理。
