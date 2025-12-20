# StallTCP1.3V1 节点订阅管理面板 (D1 数据库增强版)

**这是一个基于 Cloudflare Workers / Snippets 的高级节点订阅管理与分发系统。**

**源代码来自于AK的strllTCP1.3**

它集成了 **自适应订阅生成**、**优选IP自动负载均衡**、**智能白名单**、**Telegram 实时通知** 以及 **可视化的后台管理面板**。

> **🌟 核心特性：**
> *   **无状态部署**：无需服务器，完全依托 Cloudflare 免费生态 (Workers + D1 + Pages)。
> *   **极致安全**：采用 **会话级强制登录** 机制，杜绝后台“闪屏”泄露；新增 **HTTP 安全响应头** (X-Frame-Options 等)，防止点击劫持攻击。
> *   **智能防死循环**：内置递归保护机制，防止因配置错误导致 Worker 自我请求炸库。
> *   **可视化管理**：后台直接管理白名单 IP、TG 通知配置、Cloudflare 统计配置，无需反复修改代码。
> *   **🆕 动态配置热更新**：支持在面板中直接修改并保存 TG Bot Token、Cloudflare API、优选 IP 库等关键配置（写入 D1/KV），无需重新部署代码。
> *   **🆕 白名单可视化管理**：支持在后台添加/删除允许访问的 IP (IPv4/IPv6)，配置后即时生效，防止未授权访问。

---

## ⚙️ 环境变量配置 (Variables) - **🔥 部署必看**

**优先级顺序：环境变量 (Env) > D1 数据库 (后台保存) > KV 空间 > 代码默认配置**
> **推荐直接在 Cloudflare 后台 `Settings` -> `Variables` 中设置以下变量。**
> **如果不使用环境变量 请在代码中最顶端修改好用户配置区域**

### 🧱 基础核心配置

| 变量名 | 必填 | 说明 | 示例 |
| :--- | :---: | :--- | :--- |
| **`UUID`** | ✅ | **主 UUID** (用户ID)，客户端连接凭证 | `06b65903-406d-4a41-8463-6fd5c0ee7798` |
| **`WEB_PASSWORD`** | ✅ | **后台登录密码** (务必设置复杂密码) | `admin888` |
| **`SUB_PASSWORD`** | ✅ | **订阅路径密码** (访问 `https://域名/密码`) | `my-secret-sub` |
| **`PROXYIP`** | ✅ | **默认优选域名/IP** (节点连接地址) | `cf.090227.xyz` |
| **`SUB_DOMAIN`** | ✅ | **真实订阅源** (上游优选订阅生成器地址)<br>*自动清洗 `https://` 和尾部 `/`* | `sub.cmliussss.net` |
| **`SUBAPI`** | 可选 | **订阅转换后端** (用于 Sing-box/Clash 转换)<br>*自动补全 `https://`* | `https://subapi.cmliussss.net` |
| **`PS`** | 可选 | **节点备注** (自动追加到节点名称后)<br>*支持本地节点与上游订阅双重生效* | `【专线】` |

### 🛡️ 安全与通知配置

| 变量名 | 说明 | 示例 |
| :--- | :--- | :--- |
| `TG_BOT_TOKEN` | **Telegram 机器人 Token** (后台也可配置) | `123456:ABC-DEF...` |
| `TG_CHAT_ID` | **Telegram 用户 ID** (后台也可配置) | `123456789` |
| `CF_ID` | Cloudflare Account ID (用于统计) | `e06...` |
| `CF_TOKEN` | Cloudflare API Token (用于统计) | `Go...` |
| `CF_EMAIL` | Cloudflare Email (Global Key 模式) | `user@example.com` |
| `CF_KEY` | Cloudflare Global API Key | `868...` |
| `WL_IP` | **静态白名单 IP** (免检，视为管理员) | `210.61.97.241` |

### 🌍 节点来源配置

| 变量名 | 说明 | 格式说明 |
| :--- | :--- | :--- |
| `ADD` | **本地优选 IP 列表** | `1.1.1.1:443#美国, 2.2.2.2#香港` |
| `ADDAPI` | **远程 TXT 优选列表** | 填入 URL，格式同上 (一行一个 IP) |
| `ADDCSV` | **远程 CSV 优选列表** | 填入 URL，支持高级节点信息导入 |

 
---



###  🤖 开启机器人战斗模式 (Bot Fight Mode)

*   **路径**: Cloudflare Dashboard -> 域名 -> Security (安全性) -> 设置 (Settings)。
    <img width="1591" height="383" alt="image" src="https://github.com/user-attachments/assets/34fbcf37-502f-43b8-963a-628d30e4066a" />
    <img width="257" height="207" alt="image" src="https://github.com/user-attachments/assets/1eaad26e-35fd-4b3a-bd6d-fd544c410d09" />
*   
*   **操作**: 在安全性设置页面的下方找到 **“自动程序攻击模式” (Bot Fight Mode)**，开启开关。
*   <img width="979" height="722" alt="image" src="https://github.com/user-attachments/assets/b8bc895f-abc3-4e83-b548-0ab85f82d0b0" />
*   **作用**: 自动拦截已知的恶意爬虫和脚本小子，减少垃圾流量。
---

## ⚡️ 进阶配置：D1 数据库 (推荐 - 性能更强)

**本版本支持 Cloudflare D1 (SQLite) 数据库，推荐使用以获得最佳体验。**

1.  **创建数据库**：
    *   在 Cloudflare 左侧菜单选择 **Workers & Pages** -> **D1**。
    *   点击 **创建数据库**，命名为 `sub_db` (或其他你喜欢的名字)。

2.  **初始化表结构 (必做)**：
    *   进入刚才创建的数据库，点击 **控制台 (Console)** 标签。
    *   复制以下 SQL 代码粘贴到控制台并点击 **Execute (执行)**：
```      
CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS whitelist (ip TEXT PRIMARY KEY, created_at INTEGER);
CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, time TEXT, ip TEXT, region TEXT, action TEXT);
CREATE TABLE IF NOT EXISTS stats (date TEXT PRIMARY KEY, count INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS flood (ip TEXT PRIMARY KEY, count INTEGER DEFAULT 0, updated_at INTEGER);
```

## 📂 代码版本说明

本项目包含两套代码，请根据您的部署方式选择：

*   **Worker / Pages 部署 (推荐)**：请使用 **`_worker.js`** 代码。
    *   *UI 特效：高级毛玻璃风格*
    *   *新增特性：支持 D1 数据库高速读写、后台动态配置、强制安全登录*
*   **Snippets 部署**：请使用 **`snippets.js`** 代码。 【也支持worker部署】
    *   *UI 特效：紫色渐变风格*

---

## ✨ 功能特性详情

**✅ 完美支持 Cloudflare Workers / Pages / Snippets**

### 🆕 重大更新 (Worker 版)
*   **🗄️ D1 数据库支持**：完美支持 Cloudflare D1 (SQLite)，日志记录更全，统计更准，无 KV 写入限制。
*   **🔐 强制安全登录 (防闪屏)**：
    *   采用 **会话级** 验证机制。
    *   **防闪屏修复**：后台页面默认隐藏，只有鉴权通过后才显示，杜绝加载瞬间的数据泄露。
    *   **自动退出**：关闭浏览器或标签页即自动退出登录，每次进入后台均需重新验证。
    *   **XSS 防御**：新增 HTTP 响应头 (X-Frame-Options, X-Content-Type-Options) 策略，防止管理面板被恶意嵌入。
*   **🛡️ 白名单机制**：
    *   **自动记录**：登录成功的管理员 IP 会自动加入临时白名单。
    *   **可视化管理**：后台可手动添加/删除白名单 IP，支持 IPv4/IPv6，确保只有授权设备能访问后台接口。
*   **🤖 智能通知系统**：
    *   **静默模式**：自动过滤爬虫扫描，只有管理员登录或操作时才发送通知，告别刷屏。
    *   **UA 拦截**：自动拦截 `bot`, `spider`, `python`, `curl` 等常见爬虫 User-Agent。
*   **💡 状态指示灯**：后台直观显示 TG 推送和 CF 统计的配置状态（绿灯/红灯）。

### 核心功能
*   **🚀 自适应订阅**：自动识别以下客户端并返回对应格式：
    *   **支持列表**：Clash, Sing-box, Mihomo, Flclash, V2rayNG, Surge, Quantumult X, Shadowrocket, Loon, Hiddify 全平台主流客户端等。
*   **🌍 优选 IP 支持**：支持环境变量。支持在线编辑
*   **📊 可视化后台**：
    *   直接在后台修改和保存 TG/CF/优选IP 配置（优先于硬编码，无需重新部署）。
    *   查看 Cloudflare 今日 API 请求量。
    *   查看最近 50 条访问日志（从 D1/KV 读取）。
    *   集成 ProxyIP 连通性检测。

**界面预览：** worker全新界面/snippets界面
<img width="100%" alt="image" src="https://github.com/user-attachments/assets/e43db73f-4d8d-41a3-ab43-61555c8c984b" />
<img width="1920" height="918" alt="image" src="https://github.com/user-attachments/assets/609af76b-99ae-4fe6-ac08-1878ca34f369" />
<img width="1920" height="918" alt="image" src="https://github.com/user-attachments/assets/84bf305e-7072-403e-8389-628349a29e3f" />

---

## 🚀 部署指南一：Worker / Pages 代码版 (`_worker.js`)

**适用场景：Cloudflare Workers 或 Cloudflare Pages**

### 方式 A：Cloudflare Workers 部署 (最简单)
1.  登录 Cloudflare Dashboard。
2.  找到 **计算 (Workers & Pages)** -> **概述**。
3.  选择 **从 Hello World! 开始**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/2b80a97b-ee57-42a8-be1a-8180254f54dc" />
4.  输入任意名称，点击 **部署**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/b26217ed-d17c-465d-bcbd-b232ab5a4fd0" />
5.  在 Workers 列表找到刚部署的项目，点击 **编辑代码**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/a7f0c75a-56c3-467b-a07f-d37cafb8dd6c" />
6.  **清空**原有代码，将项目中的 **`_worker.js`** 内容完整复制粘贴进去。
7.  点击右上角 **保存并部署**。

### 方式 B：Cloudflare Pages 部署
**注意：修改任何内容都需要重新上传一次代码**

1.  登录 Cloudflare -> **Workers 和 Pages**。
    <img width="600" alt="image" src="https://github.com/user-attachments/assets/75c41546-cc6a-4a2f-9fa5-3632f0d89104" />
2.  点击 **创建应用程序**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/6ddd7c84-4a4f-4ddc-bd41-f2d550139999" />
3.  点击下方的 **Get started** 跳转到 Pages 界面。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/f5fdaa8d-d86a-471e-93de-9107db440443" />

#### (方法 1) GitHub 自动同步 (推荐)
1.  选择 **连接到 Git**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/8932221a-6480-491d-baf9-a26fc67a852b" />
2.  选择你 Fork 的 GitHub 仓库。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/2518c4e5-8503-4b4c-80f9-6ca06dfb0df9" />
3.  **特别注意**：后续修改内容要在 GitHub 上的 `_worker.js` 进行修改，之后会自动同步到 Pages。
4.  点击 **开始设置**，然后 **保存并部署**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/1c215f82-98fc-42d0-aed5-2bd032e3b859" />

#### (方法 2) 直接上传
1.  选择 **上传资产**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/5f823410-7308-4425-9e77-a66646235e00" />
2.  输入项目名称，点击创建。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/c10dc676-a06a-4a6b-bc62-f24239f454b0" />
3.  上传包含 `_worker.js` 的 **Zip 压缩包** 或 **文件夹**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/5dec9d85-9fcb-4b95-89c6-a7d8c57be661" />
4.  点击 **部署站点**。

---

## 🚀 部署指南二：Snippets 代码版 (`snippets.js`)

**适用场景：已有域名托管在 Cloudflare，想利用 Snippets 功能**

1.  进入 Cloudflare Dashboard，点击你的**域名**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/2483c2b7-3bb2-4cac-bdd6-38f8b31f4329" />
2.  在左侧菜单找到 **规则 (Rules)** -> **Snippets**，点击 **创建片段**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/9059a47d-77da-4ba4-82cc-03e8a8638c0f" />
3.  输入片段名称。
4.  将项目中的 **`snippets.js`** 内容完整复制粘贴进去。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/f163e9ef-989b-4645-8ebc-eadf755f4b23" />
5.  **设置触发规则**：
    *   选择 **自定义规则**。
    *   字段：`主机名 (Hostname)`
    *   运算符：`等于 (equals)`
    *   值：你的子域名 (例如 `sub.yourdomain.com`)
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/1f858efe-a6ce-4bf6-8d62-0bfc462ef2b3" />
6.  点击 **创建片段** 保存。
7.  **配置 DNS (重要)**：
    *   前往 **DNS** 设置页，添加一条 **A 记录**。
    *   **名称**：填写上面设置的子域名 (例如 `sub`)。
    *   **IPv4 地址**：`192.0.2.1` (保留地址，仅作占位用)。
    *   **代理状态**：必须开启 **小黄云 (Proxied)**。
    <img width="600" alt="image" src="https://github.com/user-attachments/assets/f88ad346-30aa-41ef-9f7c-deb2453afbfe" />

---



---

## 💾 兼容模式：绑定 KV (可选)

**如果您不想配置 D1，系统支持自动降级使用 KV 存储配置和白名单。**

1.  在 Cloudflare 左侧菜单选择 **Workers & Pages** -> **KV**。
2.  点击 **创建命名空间 (Create a Namespace)**，命名为 `BLACKLIST`（或任意名称）。
3.  回到你的 Worker/Pages/Snippet 项目设置页：
    *   **Workers/Pages**：`设置` -> `变量` -> `KV 命名空间绑定`。
4.  点击 **添加绑定**：
    *   **变量名称 (Variable name)**: `LH` (⚠️必须填这个，不能改)
    *   **KV 命名空间**: 选择你刚才创建的空间。
5.  **保存并重新部署**。

---

## 🖥️ 后台管理使用说明

访问 `https://你的域名/` 自动跳转登录页。

*   **🔒 强制安全登录**：
    *   **会话级验证**：关闭浏览器标签页或刷新页面（视缓存策略而定）会自动退出登录。
    *   **未设置密码保护**：如果未设置 `WEB_PASSWORD`，系统会强制显示登录页且无法进入，防止后台裸奔。
*   **🛡️ 白名单管理**：
    *   **查看**: 点击 "刷新" 按钮查看当前数据库中的白名单 IP。
    *   **添加**: 输入 IP 地址点击 "添加白名单" 即可，无需重启。
    *   **删除**: 点击列表右侧的 "删除" 按钮。
    *   *注：系统内置的白名单 IP (环境变量 `ADMIN_IP` 或 `WL_IP`) 无法在后台删除。*
*   **⚙️ 动态配置**：
    *   **保存配置**: 在 "🛠️ 优选 IP 与 远程配置" 或 Telegram/CF 弹窗中修改内容后，点击保存。
    *   数据将写入 D1/KV，优先级高于代码中的默认值。
    *   **检测**: 支持检测 ProxyIP 可用性，支持测试订阅链接连通性。

---

## 🙏 特别感谢与致谢

**特别感谢天诚修复的所有 Bug 与新增功能：**
*   ❇️ 修复了 Cloudflare 网站不能访问的问题。
*   ❇️ 新增加了机场三字码的适配。
*   ❇️ 新增负载均衡轮询。
*   ❇️ 新增解锁 Emby 播放器。
*   ❇️ 新增了韩国节点适配。
*   ❇️ Trojan/Vless 订阅器内置 CSV 文件优化识别功能。

**相关支持与链接：**
*   **源代码作者**：[Alexandre_Kojeve](https://t.me/Alexandre_Kojeve) (致敬原版 stallTCP1.3)
*   **后台作者**：[ym94203](https://t.me/ym94203)
*   **ProxyIP 支持**：[COMLiang](https://t.me/COMLiang)
*   **Telegram 交流群**：[zyssadmin](https://t.me/zyssadmin)
*   **Cloudflare Docs**：[Support](https://developers.cloudflare.com/)

---

## ⚖️ 免责声明

**本项目仅供技术交流与学习使用，请勿用于非法用途。使用本程序产生的任何后果由使用者自行承担。**
