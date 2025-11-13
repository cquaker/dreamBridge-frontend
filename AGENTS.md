# Repository Guidelines

## 项目结构与模块组织
该仓库采用 Next.js 16 App Router：`app/` 提供入口路由，`components/` 存放可复用 UI（如 `components/pages/home.tsx` 与 `components/ui/*`），`hooks/` 放置仅在客户端使用的辅助函数，`lib/utils.ts` 保留纯工具逻辑，`styles/globals.css` 与 `components.json` 负责全局令牌与设计系统映射，静态资源统一进入 `public/`。借助 `tsconfig.json` 中的 `@/*` 路径别名避免脆弱的相对引用。

## 构建、测试与开发命令
- `pnpm dev` - 在 `localhost:3000` 启动热更新开发服务器。
- `pnpm build` - 运行 `next build`，以生产配置捕获类型与 Lint 问题。
- `pnpm start` - 启动编译后的 Next.js 服务，模拟线上环境。
- `pnpm lint`（可加 `--fix`）- 在提交前执行 ESLint，保持仓库无警告。

## 代码风格与命名约定
TypeScript 开启 strict 模式，需要为 Props、API 响应与配置显式写类型。统一使用 2 空格缩进、结尾逗号与双引号。组件与导出使用 PascalCase（如 `StudentProfileForm`），Hook 采用 `useSomething` 驼峰命名，工具函数保持 lowerCamelCase。组件应以函数式组合为主，Tailwind 类就地书写，任何主题变量改动都在 `styles/globals.css` 中集中管理，推送前务必执行 `pnpm lint --fix`。

## 测试指南
目前尚无测试，新增功能需同步补充。推荐使用 Vitest + React Testing Library，测试文件命名为 `<module>.test.tsx` 并与被测文件同目录（示例：`components/project-card.test.tsx`）。对浏览器或网络能力进行 Mock，避免真实外部调用。每个 PR 都应补充至少一条与改动相关的测试用例。

## 提交与 Pull Request 指南
仓库尚未初始化历史，请直接采用 Conventional Commits（例如 `feat: add student profile validation`）并保持单次提交可独立构建。PR 描述需包含：变更摘要、关联 Issue/任务编号、运行 `pnpm dev` 时截取的 UI 截图、已执行的命令式测试计划，以及可能的发布或迁移说明。

## 环境与配置
密钥写入 `.env.local` 并忽略提交，仅通过 `NEXT_PUBLIC_` 前缀暴露安全变量。新增字体或主题时，扩展 `styles/globals.css` 中的 CSS 变量并在 `components.json` 注册对应 UI 原子以便 shadcn 生成保持同步。任何配置调整都需先跑 `pnpm lint` 与 `pnpm build`，尽早暴露缺失环境变量或 Tailwind Token 错误。
