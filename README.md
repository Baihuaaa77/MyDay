# MyDay

MyDay 是一个轻量的每日计划、复盘和数据统计工具。它是一个纯前端静态应用，数据保存在当前浏览器的 IndexedDB 中，不依赖后端服务。

## 功能

- 当下页：记录昨天、今天、明天的任务、状态 emoji、自评分和每日备注。
- 历史页：通过月历查看和编辑任意日期记录，久远日期编辑前会二次确认。
- 统计页：查看评分趋势、任务完成率、完成任务数和最长连续打卡。
- 数据备份：在统计页导出 JSON 备份，也可以导入旧备份恢复或合并数据。
- PWA 支持：部署后可被浏览器安装，并缓存静态资源以支持更稳定的再次打开体验。

## 本地开发

```bash
npm install
npm run dev
```

默认由 Vite 启动开发服务器。终端会显示本地访问地址，通常是 `http://localhost:5173`。

## 构建

```bash
npm run build
```

构建产物会输出到 `dist/`，可以部署到任意静态托管服务。项目使用相对资源路径和 Hash 路由，适合部署到 GitHub Pages、Vercel、Netlify 或任意子路径。

Android 浏览器触发“安装应用 / 添加到主屏幕”通常要求生产环境 HTTPS 地址；用手机访问局域网里的 Vite 开发地址时，可能只能看到页面，不能触发原生安装提示。

## GitHub Pages 部署

仓库包含 `.github/workflows/deploy.yml`。推送到 `main` 后，GitHub Actions 会自动构建并发布 `dist/`。

首次启用时，在 GitHub 仓库中进入 `Settings -> Pages`，将 `Source` 设置为 `GitHub Actions`。

## 数据说明

应用使用浏览器本地的 IndexedDB 保存数据。旧版本写入 `localStorage` 的 `myday-records` 会在首次打开新版时自动迁移。由于数据仍然在用户自己的浏览器中，这意味着：

- 同一台设备、同一个浏览器、同一个站点地址下的数据会保留。
- 清理浏览器站点数据、换浏览器或换设备后，数据不会自动同步。
- 建议定期在统计页点击“导出数据”，保存一份 JSON 备份。

导入数据时，MyDay 会校验记录结构，并与当前本地数据按日期合并；同一天的导入记录会覆盖当前记录。

## 技术栈

- Vite
- React 18
- TypeScript
- Tailwind CSS
- Recharts
- lucide-react
