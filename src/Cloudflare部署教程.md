# Cloudflare Pages 部署教程

## 前言

Cloudflare Pages 是 Cloudflare 提供的一项免费静态网站托管服务，非常适合部署基于 React、Vue、Angular 等框架构建的前端项目。本教程将详细指导您如何将您的对联生成网站部署到 Cloudflare Pages 上。

## 什么是 Cloudflare Pages？

Cloudflare Pages 是一个 JAMstack 平台，支持直接从 Git 仓库部署静态网站。它具有以下优势：
- 完全免费的基础托管服务
- 全球 CDN 加速，提高网站加载速度
- 支持自定义域名
- 自动 SSL 证书
- 简单的配置和部署流程

## 前置条件

在开始之前，您需要准备以下内容：

1. **GitHub 或 GitLab 或 Bitbucket 账号**
   - 需要将代码托管到这些 Git 平台之一
   - 如果您还没有账号，请先注册一个

2. **Cloudflare 账号**
   - 访问 [Cloudflare 官网](https://www.cloudflare.com/) 注册一个免费账号

3. **项目代码**
   - 确保您的 React 项目能够正常构建（本地执行 `npm run build` 测试）

## 步骤 1：将代码推送到 Git 仓库

1. 如果您的项目还没有 Git 仓库，请先初始化一个：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. 在 GitHub/GitLab/Bitbucket 上创建一个新的仓库，然后将本地代码推送到远程仓库：
   ```bash
   git remote add origin <您的远程仓库URL>
   git push -u origin main
   ```

## 步骤 2：创建 Cloudflare Pages 项目

1. 登录您的 [Cloudflare 账号](https://dash.cloudflare.com/)
2. 在侧边栏中点击 **Pages**
3. 点击 **Create a project** 按钮
4. 选择您的代码托管平台（GitHub/GitLab/Bitbucket）
5. 授权 Cloudflare 访问您的代码仓库
6. 选择您要部署的仓库
7. 点击 **Begin setup** 按钮

## 步骤 3：配置构建设置

在配置页面，您需要设置以下选项：

1. **Project name**: 为您的项目设置一个名称（这将成为您的站点子域名的一部分）
2. **Production branch**: 选择您要部署的分支，通常是 `main` 或 `master`
3. **Build settings**:
   - **Framework preset**: 选择 `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: 保持为空（默认为根目录）
4. **Environment variables (advanced)**: 您可以添加环境变量（如果需要的话）

配置完成后，点击 **Save and Deploy** 按钮开始部署过程。

## 步骤 4：等待部署完成

Cloudflare Pages 会开始构建和部署您的项目。这通常需要几分钟时间。您可以在页面上看到实时的构建日志。

部署成功后，您将看到一个成功的消息，以及一个临时的 URL（类似于 `https://您的项目名称.pages.dev`），您可以通过这个 URL 访问您的网站。

## 步骤 5：配置自定义域名（可选）

如果您想使用自己的域名访问网站，可以按照以下步骤配置：

1. 在 Cloudflare Pages 项目页面，点击 **Custom domains** 标签
2. 点击 **Set up a custom domain** 按钮
3. 输入您的域名（例如 `couplet.example.com`）
4. 点击 **Continue** 按钮
5. 按照提示在您的域名注册商处添加 DNS 记录
6. 等待 DNS 记录生效（通常需要几分钟到几小时不等）
7. Cloudflare 会自动为您的域名配置 SSL 证书

## 常见问题及解决方案

### 1. 部署失败，出现构建错误

**解决方案**:
- 检查构建日志，查看具体的错误信息
- 确保您的 `package.json` 中有正确的 `build` 脚本
- 确保您的项目能够在本地成功构建

### 2. 网站显示空白或资源加载失败

**解决方案**:
- 检查浏览器控制台，查看是否有错误信息
- 确保您的路由配置正确（如果使用了 React Router 等路由库）
- 检查 `publicPath` 配置是否正确

### 3. 自定义域名不生效

**解决方案**:
- 确认 DNS 记录是否正确设置
- 等待 DNS 记录传播完成
- 检查域名是否已经通过 Cloudflare 代理（DNS 设置中的云朵图标是否为橙色）

## 额外提示

1. **自动部署**: 每次您推送到配置的分支时，Cloudflare Pages 会自动重新构建和部署您的网站
2. **预览分支**: 您可以为不同的分支设置预览环境，方便测试
3. **环境变量**: 您可以设置不同环境的环境变量，用于区分开发和生产环境
4. **自定义页面规则**: 您可以设置页面规则来自定义缓存行为、重定向等

## 总结

通过本教程，您已经学会了如何将 React 项目部署到 Cloudflare Pages。Cloudflare Pages 提供了一个简单、免费、高效的静态网站托管解决方案，非常适合个人项目和小型应用。如果您在部署过程中遇到任何问题，请参考 Cloudflare 的[官方文档](https://developers.cloudflare.com/pages/)或在社区寻求帮助。

祝您部署成功！您的个性化对联生成网站很快就能与全球用户见面了！