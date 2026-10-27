# 使用说明

把本目录提交到公开仓库 `lymerin/lymerin`，默认分支使用 `main`，README 就会出现在个人主页。

## 修改与更新

- `profile.template.md`：主页的正文，可直接改简介、项目描述和链接。
- `scripts/update-profile.mjs`：从 GitHub 获取已合并 PR 数量，再生成 `README.md`。
- `data/profile.json`：已合并 PR 的记录，便于核对。
- `.github/workflows/update-profile.yml`：每天北京时间 09:17 刷新数量，也可手动运行。

本地更新：

```sh
gh auth login
node scripts/update-profile.mjs
```

定时更新使用 GitHub 自带的 token，无需额外服务。GitHub 的定时调度可能延迟，长期不活跃的公开仓库可能暂停定时任务。

只统计脚本中列出的四个上游项目的已合并 PR。搜索不完整时保留原有主页，不写入部分结果。

## 排版参考

按 [NianJiuZst](https://github.com/NianJiuZst/NianJiuZst) 的完整结构排版：居中介绍与联系入口、两列开源贡献、关注方向、GitHub 统计、技术栈。

贡献区只列四个上游项目的已合并 PR。GitHub 统计图使用与参考主页相同的服务，隐藏所有 PR 总数；语言分布反映个人公开非 Fork 仓库的代码量。第三方统计图片的可用性由该服务决定。

正文和贡献描述按自己的实际记录撰写，不复制参考主页的个人经历、身份和贡献数据。
