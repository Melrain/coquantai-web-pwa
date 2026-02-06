# 用 Cloudflare Tunnel 提供 HTTPS（手机测 PWA 安装）

本机 Next 跑在 `http://localhost:3000`，通过 **Cloudflare Tunnel（cloudflared）** 可得到一条 HTTPS 公网地址，手机浏览器直接打开即可满足 PWA 安装对 HTTPS 的要求，无需自签名证书或 Nginx。

## 1. 安装 cloudflared（必须先安装，否则 `npm run https-tunnel` 会报 `cloudflared: not found`）

按官方文档安装一次即可：

- 安装说明：<https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/>

常见方式示例：

- **Linux（amd64）**：从 GitHub 下载 deb 后安装：
  ```bash
  curl -L -o cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  sudo dpkg -i cloudflared.deb
  ```
  或若系统有 snap：`sudo snap install cloudflared`
- **macOS**：`brew install cloudflared`。
- **Windows**：从 GitHub Releases 下载 exe 或使用 winget。

安装后终端执行 `cloudflared --version` 能输出版本即表示成功。

## 2. 启动 Next 与隧道

1. 在项目根目录启动 Next：
   ```bash
   npm run dev
   ```
2. 再开一个终端，执行：
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```
   或使用项目提供的脚本（需已安装 cloudflared 并加入 PATH）：
   ```bash
   npm run https-tunnel
   ```
3. 终端会打印类似：
   ```text
   Your quick Tunnel has been created! Visit it at:
   https://xxxx-xx-xx-xx-xx.trycloudflare.com
   ```
   复制该 `https://xxx.trycloudflare.com` 地址。

## 3. 手机访问

用手机浏览器打开上一步得到的 HTTPS 地址即可访问当前本机 Next 应用，并测试 PWA 安装（无需信任自签名证书）。

## 4. 注意

- 隧道进程需保持运行；关闭终端或 Ctrl+C 后，该链接会失效，下次需重新执行 `cloudflared tunnel --url http://localhost:3000` 获取新链接。
- 每次运行的 `https://xxx.trycloudflare.com` 可能不同，属正常现象。
