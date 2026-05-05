# StallTCP1.32V2 节点订阅管理面板 (D1 数据库增强版)

**这是一个基于 Cloudflare Workers / Snippets 的高级节点订阅管理与分发系统。**

## 目录

- [项目介绍](#-项目介绍)
  - [配置加载优先级详解](#️-配置加载优先级详解)
- [🔑 snippets专用用户配置区域说明（重要 - 必读）](#-snippets专用用户配置区域说明重要---必读)
  - [配置区域在哪里？](#配置区域在哪里)
  - [什么是字符串拆分？为什么要这样写？](#什么是字符串拆分为什么要这样写)
  - [所有配置变量一览表](#所有配置变量一览表-仅参考-snippets不支持环境变量)
  - [如何修改配置 —— 分步教学](#-如何修改配置--分步教学)
  - [拆分技巧 —— 怎么拆才有效](#️-拆分技巧--怎么拆才有效)
  - [完整修改示例](#-完整修改示例)
  - [常见特征词拆分参考](#常见特征词拆分参考)
  - [哪些变量可以留空？](#哪些变量可以留空)
  - [变量名与环境变量对照表（仅 Worker 版适用）](#变量名与环境变量对照表仅-worker-版适用)
- [代码版本说明](#-代码版本说明)
- [界面预览](#️-界面预览)
- [懒人使用指南](#-懒人使用指南)
  - [图文教程](#-图文教程)
  - [后台管理使用说明](#️-后台管理使用说明)
- [环境变量配置（仅 Worker 版）](#️-环境变量配置-variables----仅-worker-版适用)
  - [基础核心配置](#-基础核心配置)
  - [安全与通知配置](#️-安全与通知配置)
  - [节点来源配置](#-节点来源配置)
  - [界面链接配置](#-界面链接配置-可选)
  - [订阅转换配置](#-订阅转换配置-可选)
  - [绑定变量 (D1/KV)](#-绑定变量-d1kv)
  - [多值配置说明](#-多值配置说明)
  - [环境变量配置完整示例](#-环境变量配置完整示例)
- [D1 数据库配置](#-d1-数据库配置-推荐---性能更强)
- [KV 命名空间配置](#️-kv-命名空间配置-可选---兼容模式)
- [部署指南](#-部署指南)
  - [方式一：Worker / Pages 代码版](#方式一worker--pages-代码版-_workerjs)
    - [A. Cloudflare Workers 部署](#a-cloudflare-workers-部署-最简单)
    - [B. Cloudflare Pages 部署](#b-cloudflare-pages-部署)
  - [方式二：Snippets 代码版](#方式二snippets-代码版-snippetsjs)
- [安全增强配置](#️-安全增强配置)
  - [开启机器人战斗模式](#-开启机器人战斗模式-bot-fight-mode)
  - [内置爬虫拦截机制](#️-内置爬虫拦截机制)
- [功能特性详解](#-功能特性详解)
  - [重大更新 (Worker 版)](#-重大更新-worker-版)
  - [核心逻辑更新](#-核心逻辑更新)
  - [核心功能](#-核心功能)
  - [智能客户端识别与自动转换](#-智能客户端识别与自动转换)
  - [节点生成规则详解](#-节点生成规则详解)
- [SOCKS5/HTTP 代理配置详解](#-socks5http-代理配置详解)
  - [1. 完整代理支持](#1-完整代理支持)
  - [2. 高级地址解析](#2-高级地址解析)
  - [3. 智能连接处理](#3-智能连接处理)
  - [4. 代理配置格式](#4-代理配置格式)
  - [5. 性能优化](#5-性能优化)
  - [6. 安全特性](#6-安全特性)
- [UI 特性说明](#-ui-特性说明)
- [登录与安全](#-登录与安全)
  - [会话管理机制详解](#-会话管理机制详解)
- [白名单管理](#️-白名单管理)
- [动态配置](#️-动态配置)
- [自定义页面标题使用方法](#-自定义页面标题使用方法)
- [主题切换说明](#-主题切换说明)
- [动态 UUID 功能说明](#-动态-uuid-功能说明)
  - [启用方法](#启用方法)
  - [工作原理](#工作原理)
  - [注意事项](#注意事项)
  - [适用场景](#适用场景)
  - [禁用方法](#禁用方法)
- [Cloudflare 统计功能说明](#-cloudflare-统计功能说明)
  - [方式 1：Cloudflare API 统计](#方式-1cloudflare-api-统计推荐)
  - [方式 2：D1 内部统计](#方式-2d1-内部统计备用)
  - [后台显示逻辑](#后台显示逻辑)
- [访问日志与统计详解](#-访问日志与统计详解)
  - [访问日志功能](#访问日志功能)
  - [每日统计功能](#每日统计功能)
  - [系统内部 API 接口](#-系统内部-api-接口flag-参数)
  - [订阅链接参数说明](#-订阅链接参数说明)
  - [默认配置链接](#-默认配置链接)
- [常见问题 FAQ](#-常见问题-faq)
- [特别感谢与致谢](#-特别感谢与致谢)
- [免责声明](#️-免责声明)

**源代码来自于AK的strllTCP1.32**

它集成了 **自适应订阅生成**、**优选IP支持**、**智能白名单**、**Telegram 实时通知**（Worker 版） 以及 **可视化的后台管理面板**。

**新增全局http** 、**全局socks5** 、**替换1.32核心逻辑、传输流** 、**ECH 自动注入** 、**Desire 裂变模式**

---

## 📖 项目介绍

> **🌟 核心特性：**
> *   **无状态部署**：无需服务器，完全依托 Cloudflare 免费生态 (Workers + D1 + Pages)。
> *   **极致安全**：采用 **会话级强制登录** 机制，杜绝后台"闪屏"泄露；Worker 版新增 **HTTP 安全响应头** (X-Frame-Options 等)，防止点击劫持攻击。
> *   **智能防死循环**：内置递归保护机制，防止因配置错误导致 Worker 自我请求炸库。
> *   **可视化管理**（Worker 版）：后台直接管理白名单 IP、TG 通知配置、Cloudflare 统计配置，无需反复修改代码。
> *   **🆕 动态配置热更新**（Worker 版）：支持在面板中直接修改并保存 TG Bot Token、Cloudflare API、优选 IP 库等关键配置（写入 D1/KV），无需重新部署代码。
> *   **🆕 白名单可视化管理**（Worker 版）：支持在后台添加/删除允许访问的 IP (IPv4/IPv6)，配置后即时生效，防止未授权访问。
> *   **🆕 修改SUB跟远程在线编辑**（Worker 版）：ADD ADDAPI ADDCSV 跟上游SUB 两者只能二选一 使用上游SUB 远程编辑本地不生效，使用远程本地编辑 SUB禁止加任何数据【包括环境变量跟硬编码】目前 默认使用SUB优选订阅生成器
> *   **🆕 修改ADD ADDAPI ADDCSV三合一共存体**（Worker 版）：前置条件 没有设置SUB订阅器情况下可用 设置了SUB之后不可用

**配置优先级：环境变量 > D1数据库 > KV空间 > 本地硬编码**

### ⚙️ 配置加载优先级详解

> **⚠️ 四级配置加载仅适用于 Worker 版。Snippets 版只有代码硬编码一种配置方式。**

系统采用四级配置加载机制，确保灵活性和安全性：

**优先级顺序（从高到低）：**
1. **环境变量 (Cloudflare Workers Variables)** - 最高优先级，适合敏感配置
2. **D1 数据库 (config 表)** - 后台保存的配置，支持热更新
3. **KV 存储空间** - 降级方案，兼容模式
4. **代码硬编码** - 默认值，最低优先级

**实际应用示例：**
- 如果同时设置了环境变量 `PROXYIP` 和后台配置的 ProxyIP，系统会使用环境变量的值
- 如果删除环境变量，系统会自动降级使用 D1 数据库中的配置
- 如果 D1 和 KV 都未配置，使用代码中的默认值
- 环境变量适合存储密钥等敏感信息，后台配置适合频繁修改的参数

---


## 🔑 snippets专用用户配置区域说明（重要 - 必读）

> **⚠️ snippets代码采用「字符串拆分」写法！**
>
> 配置值通过 `'' + ''` 拼接方式书写，运行时 JavaScript 自动合并为完整字符串。
> 你看到的每一段拼接，连起来读就是完整的明文内容。
>
> **重要：拆分必须用引号在外面断开，如 `'cl'+'ash'` 或 `"cl"+"ash"`，不能把 `+` 写在引号内部如 `"cl+ash"`！**

---

### 配置区域在哪里？

打开代码文件（`snippets.js` 或 `参考.txt`），**第 2 ~ 21 行**就是用户配置区域：

```javascript
// 用户配置区域（用 ''+'' 拆分特征词，防止扫描匹配，运行时自动拼接）
const UUID = "06b65903-406d-4a41-8463-6fd5c0ee7798"; // 可用的uuid
const WP = "123456";  // 登录密码
const SUB_PWD = "123456";  // 订阅密码
let PIP = 'Pro'+'xyIP.US.'+'cm'+'liussss.net';  // 自定义的中转ip
let SUB = 'sub.'+'cm'+'liussss.net';  // 自定义的订阅源
const NU = "https://nva.saas.ae.kg/"; // 🧭 导航按钮链接
const TG = "https://t.me/zyssadmin";   // 群组
const PC = "https://kaic.hidns.co/";  // 中转检测站
let SUBAPI = 'https://su'+'bapi.'+'cm'+'liussss.net';  // 自定义后端api
let SUBINI = 'https://raw.githubusercontent.com/'+'cm'+'liu/ACL4SSR/main/'+'Cl'+'ash/config/ACL4SSR_Online_Full_MultiMode.ini'; // 自定义订阅配置转换ini
const SBV12 = 'https://raw.githubusercontent.com/sinspired/su'+'b-st'+'ore-template/main/1.12.x/si'+'ng-b'+'ox.json'; // 禁止修改
const SBV11 = 'https://raw.githubusercontent.com/sinspired/su'+'b-st'+'ore-template/main/1.11.x/si'+'ng-b'+'ox.json'; // 禁止修改
const AI = "";  // 管理员IP白名单
const ST = "";  // Desire token（填入后SUB填Desire域名走裂变模式，留空走原有逻辑）
const ECH = true;  // ECH 开关（true=开启，false=关闭）
const ECH_DNS = 'https://do'+'h.'+'cm'+'liu'+'ssss'+'.net/'+'C'+'ML'+'iu'+'ssss';  // DoH 查询地址
const ECH_SNI = 'cl'+'oudf'+'lare'+'-ech'+'.com';  // ECH 解析域名
const FP = ECH ? 'chrome' : 'randomized';  // 指纹：ECH开→chrome，关→randomized
//结束
```

---

### 什么是字符串拆分？为什么要这样写？

**问题**：如果你在代码中直接写完整的域名或关键词，可能会被搜索引擎匹配到你的代码。

**解决方案**：把字符串用 `+` 号断开，比如写成 `'cm'+'liussss'`。

**原理**：
- 源代码文件中，`'cm'` 和 `'liussss'` 是两个独立的字符串片段
- 搜索完整关键词**搜不到**，因为文件中不存在这个完整词
- 但 JavaScript 运行时会自动把 `'cm'+'liussss'` 拼接成 `'cmliussss'`，功能完全正常

> **简单理解**：就像把一个词拆成两半写，机器搜不到，但人眼一看就懂。

> **⚠️ 常见错误**：不要把 `+` 写在引号内部！
> - ❌ 错误：`"cm+liussss"` — 这样 `+` 变成了字面文本，不会拼接
> - ✅ 正确：`'cm'+'liussss'` — 引号在外面断开，JS 会正确拼接
> - ✅ 也正确：`"cm"+"liussss"` — 双引号和单引号效果一样

---

### 所有配置变量一览表 【仅参考 snippets不支持环境变量】

| 变量名 | 用途 | 默认值（拼接后） | 是否需要拆分 | 可否修改 |
|--------|------|-----------------|:-----------:|:-------:|
| `UUID` | 用户 UUID | `06b65903-406d-4a41-8463-6fd5c0ee7798` | ❌ 不需要 | ✅ 必改 |
| `WP` | 后台登录密码 | `123456` | ❌ 不需要 | ✅ 必改 |
| `SUB_PWD` | 订阅路径密码 | `123456` | ❌ 不需要 | ✅ 必改 |
| `PIP` | ProxyIP 中转地址 | `ProxyIP.US.CMLiussss.net` | ✅ 建议拆分 | ✅ 可改 |
| `SUB` | 上游订阅器域名 | `sub.cmliussss.net` | ✅ 建议拆分 | ✅ 可改 |
| `NU` | 登录页导航链接 | `https://nva.saas.ae.kg/` | ⚪ 看情况 | ✅ 可改 |
| `TG` | Telegram 群组链接 | `https://t.me/zyssadmin` | ⚪ 看情况 | ✅ 可改 |
| `PC` | ProxyIP 检测站链接 | `https://kaic.hidns.co/` | ⚪ 看情况 | ✅ 可改 |
| `SUBAPI` | 订阅转换后端 API | `https://subapi.cmliussss.net` | ✅ 建议拆分 | ✅ 可改 |
| `SUBINI` | Clash 配置模板 URL | ACL4SSR 配置链接 | ✅ 建议拆分 | ✅ 可改 |
| `SBV12` | Sing-box v1.12 配置 | sinspired 模板链接 | ✅ 已拆分 | ❌ 禁止修改 |
| `SBV11` | Sing-box v1.11 配置 | sinspired 模板链接 | ✅ 已拆分 | ❌ 禁止修改 |
| `AI` | 管理员 IP 白名单 | （空） | ❌ 不需要 | ✅ 可改 |
| `ST` | Desire 裂变 Token | （空） | ❌ 不需要 | ✅ 可改 |
| `ECH` | ECH 开关 | `true` | ❌ 不需要 | ✅ 可改 |
| `ECH_DNS` | DoH 查询地址 | `https://doh.cmliussss.net/CMLiussss` | ✅ 建议拆分 | ✅ 可改 |
| `ECH_SNI` | ECH 解析域名 | `cloudflare-ech.com` | ✅ 建议拆分 | ✅ 可改 |
| `FP` | TLS 指纹 | ECH开→`chrome`，关→`randomized` | ❌ 不需要 | ⚪ 自动联动 |

> **什么时候需要拆分？** 当你的配置值中包含公共项目名、用户名、特定域名等关键词时，建议拆分。普通的密码、UUID、自己的私有域名一般不需要拆分。

---

### 🔧 如何修改配置 —— 分步教学

#### 第 1 步：找到要修改的变量

打开代码文件，找到第 2 ~ 21 行的用户配置区域。每行都有注释说明用途。

#### 第 2 步：确定你的新值

比如你要把中转IP改成 `cdn.my-proxy.com`。

#### 第 3 步：判断是否需要拆分

问自己：**这个值里有没有不想被搜索到的关键词？**

- 如果**没有敏感词**（比如你自己的私有域名 `cdn.my-proxy.com`）→ **直接写明文**
- 如果**有敏感词**（比如包含某个项目名或知名域名）→ **用 `+` 拆开**

#### 第 4 步：写入代码

**情况 A：不需要拆分 —— 直接写明文**

```javascript
// 改之前
let PIP = 'Pro'+'xyIP.US.'+'cm'+'liussss.net';

// 改之后（你自己的域名，没有敏感词，直接写）
let PIP = "cdn.my-proxy.com";
```

**情况 B：需要拆分 —— 用 `+` 断开关键词**

```javascript
// 改之前
let PIP = 'Pro'+'xyIP.US.'+'cm'+'liussss.net';

// 改之后（新域名包含敏感词 example，你想拆开它）
let PIP = 'cdn.'+'exa'+'mple.com';
```

> **核心规则**：在你认为是特征的关键词中间，用 `''+''` 断开就行。注意引号在外面！

---

### ✂️ 拆分技巧 —— 怎么拆才有效

#### 规则 1：在关键词中间断开

```javascript
// ❌ 错误：没有断开关键词，搜索 "cmliussss" 仍然能匹配到
let SUB = 'sub.cmliussss.net';

// ✅ 正确：关键词被断开，搜索 "cmliussss" 匹配不到
let SUB = 'sub.'+'cm'+'liussss.net';

// ✅ 也正确：拆得更细
let SUB = 'sub.'+'c'+'m'+'liu'+'ssss.net';
```

#### 规则 2：拆分点要让两边都不构成完整特征

```javascript
// ⚠️ 一般：拆成 "cmlius" + "sss"，"cmlius" 仍有一定辨识度
let SUB = 'sub.'+'cmlius'+'sss.net';

// ✅ 更好：拆成 "cm" + "liussss"，两边都没有辨识度
let SUB = 'sub.'+'cm'+'liussss.net';
```

#### 规则 3：非敏感部分不需要拆

```javascript
// ❌ 过度拆分：".net" 不是敏感词，没必要拆
let SUB = 's'+'u'+'b'+'.'+'c'+'m'+'l'+'i'+'u'+'s'+'s'+'s'+'s'+'.'+'n'+'e'+'t';

// ✅ 合理拆分：只拆敏感词 "cmliussss"
let SUB = 'sub.'+'cm'+'liussss.net';
```

#### 规则 4：多个敏感词分别拆

```javascript
// SUBINI 中有多个敏感词：cmliu、ACL4SSR、Clash
// 每个都要断开

let SUBINI = 'https://raw.githubusercontent.com/'
  +'cm'+'liu/ACL4SSR/main/'    // cmliu 拆开
  +'Cl'+'ash/config/'           // Clash 拆开
  +'ACL4SSR_Online_Full_MultiMode.ini';
```

> **提示**：上面的换行写法只是为了方便阅读。实际代码中写成一行也完全可以。

#### 规则 5：引号必须在外面断开（重要！）

```javascript
// ❌ 错误写法：+ 号在引号内部，变成了字面文本
let PIP = "Pro+xyIP.US.+cm+liussss.net";
// 运行结果是：Pro+xyIP.US.+cm+liussss.net  ← + 号没有拼接，功能异常！

// ✅ 正确写法：每段都是独立的字符串，用 + 连接
let PIP = 'Pro'+'xyIP.US.'+'cm'+'liussss.net';
// 运行结果是：ProxyIP.US.cmliussss.net  ← 功能正常！
```

---

### 📝 完整修改示例

假设你要把所有配置改成自己的：

**示例 1：所有值都是自己的私有域名，不需要拆分**

```javascript
// 用户配置区域
const UUID = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"; // 改成你自己的 UUID
const WP = "MyPassword888";   // 改成你的登录密码
const SUB_PWD = "mysub";      // 改成你的订阅密码
let PIP = "cdn.my-proxy.com";                        // 自己的域名，直接写
let SUB = "sub.mydomain.com";                         // 自己的域名，直接写
const NU = "https://nav.mydomain.com/";               // 直接写
const TG = "https://t.me/mygroup";                    // 直接写
const PC = "https://check.mydomain.com/";             // 直接写
let SUBAPI = "https://api.v1.mk";                     // 直接写
let SUBINI = "https://example.com/my-config.ini";     // 直接写
const SBV12 = 'https://raw.githubusercontent.com/sinspired/su'+'b-st'+'ore-template/main/1.12.x/si'+'ng-b'+'ox.json'; // 禁止修改
const SBV11 = 'https://raw.githubusercontent.com/sinspired/su'+'b-st'+'ore-template/main/1.11.x/si'+'ng-b'+'ox.json'; // 禁止修改
const AI = "1.2.3.4";                                  // 管理员IP白名单
const ST = "";                                          // Desire Token（留空不启用）
const ECH = true;                                       // ECH 开关
//结束
```

**示例 2：使用了别人的公共服务域名，需要拆分**

```javascript
let PIP = 'Pro'+'xyIP.US.'+'cm'+'liussss.net';       // ProxyIP.US.cmliussss.net
let SUB = 'sub.'+'cm'+'liussss.net';                   // sub.cmliussss.net
let SUBAPI = 'https://su'+'bapi.'+'cm'+'liussss.net';  // https://subapi.cmliussss.net
```

**示例 3：混合使用（部分拆分，部分明文）**

```javascript
let PIP = "cdn.my-proxy.com";                          // 自己的域名，不拆
let SUB = 'sub.'+'cm'+'liussss.net';                   // 公共域名，拆分
let SUBAPI = "https://api.v1.mk";                      // 自己的API，不拆
let SUBINI = 'https://raw.githubusercontent.com/'+'cm'+'liu/ACL4SSR/main/'+'Cl'+'ash/config/ACL4SSR_Online_Full_MultiMode.ini';  // 公共链接，拆分
```

> **总结**：自己的私有域名直接写明文，公共域名/项目名用 `+` 拆开。拆分时引号必须在外面断开！

---

### 常见特征词拆分参考

以下是代码中常见的敏感关键词及推荐拆分方式：

| 完整关键词 | 推荐拆分写法 | 说明 |
|-----------|-------------|------|
| `cmliussss` | `'cm'+'liussss'` | 用户名 |
| `cmliu` | `'cm'+'liu'` | GitHub 用户名 |
| `Clash` | `'Cl'+'ash'` | 客户端名称 |
| `sing-box` | `'si'+'ng-b'+'ox'` | 客户端名称 |
| `mihomo` | `'mi'+'ho'+'mo'` | 客户端名称 |
| `sub-store` | `'su'+'b-st'+'ore'` | 项目名 |

### 哪些变量可以留空？

| 变量 | 留空效果 |
|------|---------|
| `PIP` | 不使用 ProxyIP，使用默认直连 |
| `SUB` | 不使用上游订阅（Worker 版降级使用本地 ADD 节点，Snippets 版使用默认节点） |
| `SUBAPI` | 不使用订阅转换（Clash/Sing-box 客户端可能无法使用） |
| `SUBINI` | 使用代码内置的默认 Clash 配置模板 |
| `NU` | 登录页不显示「导航」按钮 |
| `TG` | 登录页不显示「交流群」链接 |
| `PC` | 不使用 ProxyIP 检测功能 |
| `AI` | 不设置静态白名单 IP |
| `ST` | 不启用 Desire 裂变模式，走原有订阅逻辑 |
| `ECH_DNS` | 不使用 ECH（需同时将 `ECH` 设为 `false`） |
| `ECH_SNI` | 不使用 ECH SNI |

### 变量名与环境变量对照表

> **⚠️ 两套代码的配置方式不同：**
> - **`snippets.js`（Snippets 版）**：**纯硬编码**，不支持环境变量，所有配置只能在代码顶部的用户配置区域直接修改
> - **`_worker.js`（Worker 版）**：支持环境变量，环境变量优先级高于代码硬编码

代码中使用了简短的变量名，以下是与 Worker 版环境变量的对照关系：

| 代码变量名 | Worker 环境变量名 | 说明 | Snippets 配置方式 |
|-----------|------------------|------|------------------|
| `UUID` | `UUID` | 用户 UUID | 直接改代码 |
| `WP` | `WEB_PASSWORD` | 后台登录密码 | 直接改代码 |
| `SUB_PWD` | `SUB_PASSWORD` | 订阅路径密码 | 直接改代码 |
| `PIP` | `PROXYIP` | ProxyIP 中转地址 | 直接改代码（支持拆分写法） |
| `SUB` | `SUB_DOMAIN` | 上游订阅器域名 | 直接改代码（支持拆分写法） |
| `SUBAPI` | `SUBAPI` | 订阅转换后端 API | 直接改代码（支持拆分写法） |
| `SUBINI` | `CLASH_CONFIG` | Clash 配置模板 | 直接改代码（支持拆分写法） |
| `NU` | — | 导航链接 | 直接改代码 |
| `TG` | `TG_GROUP_URL` | 群组链接 | 直接改代码 |
| `PC` | `PROXY_CHECK_URL` | 检测站链接 | 直接改代码 |
| `AI` | `WL_IP` | 管理员 IP 白名单 | 直接改代码 |
| `ST` | `SUB_TOKEN` | Desire 裂变 Token | 直接改代码 |
| `ECH` | `ECH_ENABLED` | ECH 开关 | 直接改代码（`true`/`false`） |
| `ECH_DNS` | `ECH_DNS` | DoH 查询地址 | 直接改代码（支持拆分写法） |
| `ECH_SNI` | `ECH_SNI` | ECH 解析域名 | 直接改代码（支持拆分写法） |
| `FP` | — | TLS 指纹 | 自动联动 ECH 开关 |

**Worker 版配置优先级**：环境变量 > D1 数据库 > KV 存储 > 代码硬编码

**Snippets 版配置方式**：直接修改代码顶部用户配置区域（唯一方式）

---

## 📂 代码版本说明

本项目包含两套代码，请根据您的部署方式选择：

*   **Worker / Pages 部署 (推荐)**：请使用 **`_worker.js`** 代码。
    *   *UI 特效：高级毛玻璃风格（星空+流星+玻璃碎片+3D球体+双主题+侧边栏）*
    *   *新增特性：支持 D1 数据库高速读写、后台动态配置、强制安全登录、ECH 注入、Desire 裂变*
    *   *配置方式：**支持环境变量**，环境变量 > D1 > KV > 代码硬编码*
*   **Snippets 部署**：请使用 **`snippets.js`** 代码。 【也支持worker部署】
    *   *UI 特效：紫色渐变风格*
    *   *新增特性：ECH 注入（DoH 查询 + Sing-box/Clash 自动注入）、Desire 裂变*
    *   *配置方式：**纯硬编码**，不支持环境变量/D1/KV，直接修改代码顶部用户配置区域*

---

## 🖼️ 界面预览

**Worker全新界面 / Snippets界面：**

<img width="1914" height="915" alt="image" src="https://github.com/user-attachments/assets/16f1042d-008a-4bf0-bfa5-a26eb5ceee69" />
<img width="1920" height="916" alt="image" src="https://github.com/user-attachments/assets/c066513e-27aa-4a8d-a4a1-61d377b74142" />
<img width="1920" height="911" alt="image" src="https://github.com/user-attachments/assets/b2fc6d97-3ba3-461b-9056-48db24b6e6ee" />
<img width="1916" height="912" alt="image" src="https://github.com/user-attachments/assets/f87c1b8a-6f80-4bbd-9aa1-717bb120301d" />
<img width="1913" height="906" alt="image" src="https://github.com/user-attachments/assets/592442d4-9f60-49ab-b42c-dc097e8fa35f" />
<img width="1914" height="913" alt="image" src="https://github.com/user-attachments/assets/56a879cf-d331-44dc-a5bd-5ba2a078432c" />
<img width="1920" height="919" alt="image" src="https://github.com/user-attachments/assets/912adef1-0b76-428b-8700-afee562611ce" />

---

## 🚀 懒人使用指南

> * **Snippets代码（硬编码）**：不支持环境变量，所有数据都需要在代码顶部【用户配置区域】直接修改
> * **Worker代码（环境变量）**：支持环境变量，优先级：环境变量 > D1 数据库 > KV 存储 > 代码硬编码【在用户配置区域进行修改】
> * **默认使用SUB订阅器为优先**：有的人喜欢本地ADD那些花里花俏，有的人喜欢SUB，自己改
> * **默认什么都不改就是默认的**：我写入了支持proxyip作为节点，所以即便是默认值也依旧有一个节点使用
> * **所有教程都在github写了说明**：我希望你认真查看每一处

### 📚 图文教程

**stallTCPV2图文教程【与V1没有任何区别】：**

[stallTCPV1图文后台版](https://lh.hilh0923.hidns.co/lh/stallTCP1-3V1)

### 🖥️ 后台管理使用说明

访问 `https://worker你的域名` 自动跳转登录页。

---

## ⚙️ 环境变量配置 (Variables) - **🔥 仅 Worker 版适用**

> **⚠️ 本章节仅适用于 `_worker.js`（Worker / Pages 部署）。`snippets.js` 是纯硬编码版本，不支持环境变量，请直接修改代码顶部的用户配置区域。**

**优先级顺序：环境变量 (Env) > D1 数据库 (后台保存) > KV 空间 > 代码默认配置**

> **推荐直接在 Cloudflare 后台 `Settings` -> `Variables` 中设置以下变量。**
>
> **如果不使用环境变量，请在代码中最顶端修改好用户配置区域**

### 🧱 基础核心配置

| 变量名 | 必填 | 说明 | 示例 | 支持多值 |
| :--- | :---: | :--- | :--- | :---: |
| **`UUID`** | ✅ | **主 UUID** (用户ID)，客户端连接凭证 | `06b65903-406d-4a41-8463-6fd5c0ee7798` | ❌ |
| **`KEY`** | 可选 | **动态 UUID 密钥** (启用后自动生成时效性 UUID)<br>*与 `UUID_REFRESH` 配合使用，增强安全性* | `my-secret-key-2024` | ❌ |
| **`UUID_REFRESH`** | 可选 | **UUID 刷新周期** (秒)，默认 86400 (24小时)<br>*需配合 `KEY` 使用，定期自动更换 UUID* | `86400` | ❌ |
| **`WEB_PASSWORD`** | ✅ | **后台登录密码** (务必设置复杂密码) | `admin888` | ❌ |
| **`SUB_PASSWORD`** | ✅ | **订阅路径密码** (访问 `https://域名/密码`) | `my-secret-sub` | ❌ |
| **`PROXYIP`** | ✅ | **默认优选域名/IP** (节点连接地址) | `cf.090227.xyz` | ❌ |
| **`SUB_DOMAIN`** | ✅ | **真实订阅源** (上游优选订阅生成器地址)<br>*自动清洗 `https://` 和尾部 `/`* | `sub.cmliussss.net` | ❌ |
| **`SUBAPI`** | 可选 | **订阅转换后端** (用于 Sing-box/Clash 转换)<br>*自动补全 `https://`* | `https://subapi.cmliussss.net` | ❌ |
| **`PS`** | 可选 | **节点备注** (自动追加到节点名称后)<br>*支持本地节点与上游订阅双重生效* | `【专线】` | ❌ |
| **`LOGIN_PAGE_TITLE`** | 可选 | **登录页面标题** (浏览器标签页显示的标题) | `Worker Login` | ❌ |
| **`DASHBOARD_TITLE`** | 可选 | **后台管理页面标题** (浏览器标签页显示的标题) | `烈火控制台 · Glass LH` | ❌ |
| **`DLS`** | 可选 | **ADDCSV 速度下限筛选阈值** (单位 KB/s)<br>*低于此速度的节点会被过滤，默认 5000* | `5000` | ❌ |
| **`SUB_TOKEN`** | 可选 | **Desire 裂变 Token** (留空不启用)<br>*启用后 SUB_DOMAIN 填 Desire 域名走裂变模式* | `my-secret-token` | ❌ |
| **`ECH_ENABLED`** | 可选 | **ECH 开关** (`true`/`false`，默认 `true`)<br>*开启后自动注入 ECH Config 到 Sing-box/Clash 订阅* | `true` | ❌ |
| **`ECH_SNI`** | 可选 | **ECH 解析域名** (用于 DoH 查询 ECH Config) | `cloudflare-ech.com` | ❌ |
| **`ECH_DNS`** | 可选 | **DoH 查询地址** (用于获取 ECH Config PEM) | `https://doh.example.com/dns-query` | ❌ |

### 🛡️ 安全与通知配置

| 变量名 | 说明 | 示例 | 支持多值 |
| :--- | :--- | :--- | :---: |
| `TG_BOT_TOKEN` | **Telegram 机器人 Token** (后台也可配置) | `123456:ABC-DEF...` | ❌ |
| `TG_CHAT_ID` | **Telegram 用户 ID** (后台也可配置) | `123456789` | ❌ |
| `CF_ID` | Cloudflare Account ID (用于统计) | `e06...` | ❌ |
| `CF_TOKEN` | Cloudflare API Token (用于统计) | `Go...` | ❌ |
| `CF_EMAIL` | Cloudflare Email (Global Key 模式) | `user@example.com` | ❌ |
| `CF_KEY` | Cloudflare Global API Key | `868...` | ❌ |
| `WL_IP` | **静态白名单 IP** (免检，视为管理员)<br>**✅ 支持多个，使用英文逗号分隔** | `1.2.3.4` 或<br>`1.1.1.1,2.2.2.2` | ✅ |

### 🌍 节点来源配置

| 变量名 | 说明 | 格式说明 | 支持多值 |
| :--- | :--- | :--- | :---: |
| `ADD` | **本地优选 IP 列表** | 每行一个 IP，格式：`IP:端口#节点名称`<br>示例：`1.1.1.1:443#美国节点` | ✅ (换行分隔) |
| `ADDAPI` | **远程 TXT 优选列表** | 填入 URL，内容格式同 ADD (一行一个 IP)<br>**✅ 支持多个 URL，换行分隔** | ✅ (换行分隔) |
| `ADDCSV` | **远程 CSV 优选列表** | 填入 URL，支持高级节点信息导入<br>**✅ 支持多个 URL，换行分隔**<br>*配合 `DLS` 变量可过滤低速节点* | ✅ (换行分隔) |

### 🎨 界面链接配置 (可选)

| 变量名 | 说明 | 默认值 | 支持多值 |
| :--- | :--- | :--- | :---: |
| `TG_GROUP_URL` | **登录页交流群链接** | `https://t.me/zyssadmin` | ❌ |
| `SITE_URL` | **登录页网站链接** | `https://blog.2026565.xyz/` | ❌ |
| `GITHUB_URL` | **登录页项目链接** | `https://github.com/xtgm/stallTCP1.32V2` | ❌ |
| `PROXY_CHECK_URL` | **后台 ProxyIP 检测跳转地址** | `https://kaic.hidns.co/` | ❌ |

### 📋 订阅转换配置 (可选)

| 变量名 | 说明 | 默认值 | 支持多值 |
| :--- | :--- | :--- | :---: |
| `CLASH_CONFIG` | **Clash 配置模板 URL** | ACL4SSR_Online_Full_MultiMode.ini | ❌ |
| `SINGBOX_CONFIG_V12` | **Sing-box v1.12.x 配置模板 URL** | sinspired/sub-store-template/1.12.x | ❌ |
| `SINGBOX_CONFIG_V11` | **Sing-box v1.11.x 配置模板 URL**（兼容） | sinspired/sub-store-template/1.11.x | ❌ |

### 🔗 绑定变量 (D1/KV)

| 变量名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `DB` | D1 数据库 | **D1 数据库绑定** (变量名必须为 `DB`，不可更改) |
| `LH` | KV 命名空间 | **KV 存储绑定** (变量名必须为 `LH`，不可更改) |

### 📝 多值配置说明

**以下变量支持配置多个值：**

#### 1. `WL_IP` - 多白名单 IP 支持ipv4跟ipv6

**功能：** 设置多个管理员 IP，这些 IP 无需登录即可访问后台。

**格式：** 多个 IP 使用**英文逗号 `,`** 分隔

**示例：**
```
1.2.3.4,5.6.7.8,2001:db8::1
```

**说明：**
- 支持 IPv4 和 IPv6 地址
- 系统预设 IP 无法在后台删除
- 手动添加的 IP 可以在后台删除

---
#### 2. `ADD` / `ADDAPI` / `ADDCSV` - 多节点源（仅 Worker 版）

> **⚠️ Snippets 版不支持 ADD/ADDAPI/ADDCSV 功能。**

**功能：** 支持多行配置或多个远程 URL，所有节点会合并生成。

**ADD 格式：** 每行一个 IP，使用**换行符**分隔
```
1.1.1.1:443#美国CF
8.8.8.8:443#谷歌DNS
2606:4700:4700::1111:443#IPv6节点
```

**ADDAPI 格式：** 每行一个 URL，使用**换行符**分隔
```
https://example.com/ips.txt
https://backup.com/nodes.txt
```

**ADDCSV 格式：** 每行一个 URL，使用**换行符**分隔
```
https://example.com/优选IP.csv
https://backup.com/speed-test.csv
```

**ADDCSV 高级功能 - DLS 速度筛选：**
- CSV 文件格式：`IP,端口,TLS,数据中心,地区,城市,网络延迟,下载速度`
- 配合 `DLS` 环境变量设置速度下限（单位 KB/s）
- 下载速度低于 `DLS` 值的节点会被自动过滤
- 默认阈值为 5000 KB/s

---

### 🔄 环境变量配置完整示例

**Cloudflare Workers 环境变量设置示例：**

```plaintext
# 基础配置
UUID = 06b65903-406d-4a41-8463-6fd5c0ee7798
WEB_PASSWORD = MySecurePassword123
SUB_PASSWORD = my-sub-path

# ProxyIP
PROXYIP = ProxyIP.US.CMLiussss.net

# 订阅源
SUB_DOMAIN = sub.cmliussss.net

# 转换器
SUBAPI = https://subapi.cmliussss.net

# 多白名单 IP（逗号分隔）
WL_IP = 192.168.1.1,10.0.0.1

# TG 通知
TG_BOT_TOKEN = 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TG_CHAT_ID = 987654321

# CF 统计
CF_ID = your-account-id
CF_TOKEN = your-api-token

# 节点备注
PS = 【专线】

# ECH 配置
ECH_ENABLED = true
ECH_SNI = cloudflare-ech.com

# Desire 裂变（留空不启用）
# SUB_TOKEN = your-secret-token

# ADDCSV 速度筛选阈值
DLS = 3000
```


---

## 💾 D1 数据库配置 (推荐 - 性能更强)

> **⚠️ 本章节仅适用于 Worker / Pages 部署。Snippets 版不支持 D1 数据库。**

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
```

3.  **绑定变量**：
    *   回到你的 Worker 项目设置。
    *   点击 **设置** -> **变量** -> **D1 数据库绑定**。
    *   变量名称：**`DB`** (必须大写，不能改名)。
    *   选择刚才创建的数据库。
    *   **保存并部署**。

---

## 🗄️ KV 命名空间配置 (可选 - 兼容模式)

> **⚠️ 本章节仅适用于 Worker / Pages 部署。Snippets 版不支持 KV 存储。**

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

## 🚀 部署指南

### 方式一：Worker / Pages 代码版 (`_worker.js`)

**适用场景：Cloudflare Workers 或 Cloudflare Pages**

#### A. Cloudflare Workers 部署 (最简单)
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

#### B. Cloudflare Pages 部署

**注意：修改任何内容都需要重新上传一次代码**

1.  登录 Cloudflare -> **Workers 和 Pages**。
    <img width="600" alt="image" src="https://github.com/user-attachments/assets/75c41546-cc6a-4a2f-9fa5-3632f0d89104" />
2.  点击 **创建应用程序**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/6ddd7c84-4a4f-4ddc-bd41-f2d550139999" />
3.  点击下方的 **Get started** 跳转到 Pages 界面。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/f5fdaa8d-d86a-471e-93de-9107db440443" />

**方法 1：GitHub 自动同步 (推荐)**
1.  选择 **连接到 Git**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/8932221a-6480-491d-baf9-a26fc67a852b" />
2.  选择你 Fork 的 GitHub 仓库。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/2518c4e5-8503-4b4c-80f9-6ca06dfb0df9" />
3.  **特别注意**：后续修改内容要在 GitHub 上的 `_worker.js` 进行修改，之后会自动同步到 Pages。
4.  点击 **开始设置**，然后 **保存并部署**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/1c215f82-98fc-42d0-aed5-2bd032e3b859" />

**方法 2：直接上传**
1.  选择 **上传资产**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/5f823410-7308-4425-9e77-a66646235e00" />
2.  输入项目名称，点击创建。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/c10dc676-a06a-4a6b-bc62-f24239f454b0" />
3.  上传包含 `_worker.js` 的 **Zip 压缩包** 或 **文件夹**。
    <img width="800" alt="image" src="https://github.com/user-attachments/assets/5dec9d85-9fcb-4b95-89c6-a7d8c57be661" />
4.  点击 **部署站点**。

---

### 方式二：Snippets 代码版 (`snippets.js`)

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

## 🛡️ 安全增强配置

###  🤖 开启机器人战斗模式 (Bot Fight Mode)

*   **路径**: Cloudflare Dashboard -> 域名 -> Security (安全性) -> 设置 (Settings)。
    <img width="1591" height="383" alt="image" src="https://github.com/user-attachments/assets/34fbcf37-502f-43b8-963a-628d30e4066a" />
    <img width="257" height="207" alt="image" src="https://github.com/user-attachments/assets/1eaad26e-35fd-4b3a-bd6d-fd544c410d09" />
*   **操作**: 在安全性设置页面的下方找到 **"自动程序攻击模式" (Bot Fight Mode)**，开启开关。
    <img width="979" height="722" alt="image" src="https://github.com/user-attachments/assets/b8bc895f-abc3-4e83-b548-0ab85f82d0b0" />
*   **作用**: 自动拦截已知的恶意爬虫和脚本小子，减少垃圾流量。

### 🛡️ 内置爬虫拦截机制

系统内置智能爬虫识别，自动拦截以下 User-Agent：

**拦截列表：**
- `spider` - 搜索引擎爬虫
- `bot` - 机器人
- `python` - Python 脚本
- `scrapy` - Scrapy 爬虫框架（仅 Worker 版）
- `curl` - 命令行工具
- `wget` - 下载工具
- `crawler` - 通用爬虫（仅 Snippets 版）

**拦截行为：**
- Worker 版：返回 `404 Not Found`，不记录日志，不发送 TG 通知
- Snippets 版：返回 `403 Forbidden`

**注意事项：**
- 如果您使用 `curl` 或 Python 脚本测试订阅链接，可能会被拦截
- 建议使用浏览器或代理客户端进行测试
- 如需调试，可临时注释代码中的 UA 检测逻辑

---

## ✨ 功能特性详解

### 🆕 重大更新 (Worker 版)

*   **🗄️ D1 数据库支持**：完美支持 Cloudflare D1 (SQLite)，日志记录更全，统计更准，无 KV 写入限制。
*   **🎨 全新玻璃态 UI 设计**：
    *   **星空背景特效**：200+ 闪烁星星 + 8 颗真实流星雨动画，营造沉浸式视觉体验。
    *   **玻璃碎片动画**：6 个动态浮动的毛玻璃碎片，增强科技感。
    *   **双主题切换**：支持深色星空主题和浅色天空主题，一键切换。
    *   **幻彩渐变文字**：Logo 和菜单栏采用动态渐变 + 霓虹发光效果。
    *   **3D 旋转球体统计**：首页请求统计采用 3D 圆环球体设计，数字自适应大小防止溢出。
    *   **响应式布局**：完美适配桌面（1080p/2K/4K）、平板（iPad/iPad Pro）、手机（iPhone SE/标准/Plus）全平台。
    *   **侧边栏导航**：左侧固定侧边栏 + 右上角工具栏，操作更便捷。
*   **🎯 自定义页面标题**：
    *   支持通过环境变量 `LOGIN_PAGE_TITLE` 和 `DASHBOARD_TITLE` 自定义登录页和后台页面的浏览器标签标题。
    *   优先级：环境变量 > D1 数据库 > KV 存储 > 代码默认值。
*   **🔐 强制安全登录 (防闪屏)**：
    *   采用 **会话级** 验证机制。
    *   **防闪屏修复**：后台页面默认隐藏，只有鉴权通过后才显示，杜绝加载瞬间的数据泄露。
    *   **自动退出**：关闭浏览器或标签页即自动退出登录，每次进入后台均需重新验证。
    *   **XSS 防御**（仅 Worker 版）：新增 HTTP 响应头 (X-Frame-Options, X-Content-Type-Options) 策略，防止管理面板被恶意嵌入。
*   **🛡️ 白名单机制**：
    *   **手动管理**：后台可手动添加/删除白名单 IP，支持 IPv4/IPv6，确保只有授权设备能访问后台接口。
*   **🤖 智能通知系统**：
    *   **静默模式**：自动过滤爬虫扫描，只有管理员登录或操作时才发送通知，告别刷屏。
    *   **UA 拦截**：自动拦截 `bot`, `spider`, `python`, `curl` 等常见爬虫 User-Agent。
*   **💡 状态指示灯**：后台直观显示 TG 推送和 CF 统计的配置状态（绿灯/红灯）。
*   **🔒 ECH 自动注入**（Worker + Snippets 双版本支持）：
    *   通过 DoH 二进制查询自动获取 ECH Config PEM。
    *   自动注入到 Sing-box 订阅（匹配 UUID 的节点）和 Clash 订阅（双格式 Flow + Block）。
    *   支持环境变量 `ECH_ENABLED`/`ECH_SNI`/`ECH_DNS` 覆盖（Worker 版）。
    *   指纹自动联动：ECH 开启→`chrome`，关闭→`randomized`。
*   **🔗 Desire 裂变模式**（Worker + Snippets 双版本支持）：
    *   通过 `SUB_TOKEN` 启用，支持 `/sub?base=节点&token=密钥` 格式。
    *   Worker 版支持环境变量 `SUB_TOKEN` 覆盖，不在后台 UI 暴露（保护 Token 隐私）。

### 🔄 核心逻辑更新

> * **新增socks5全局 https全局代理**
> * **替换stallTCP1.32核心逻辑，其他不变。**
> * **更新传输效果更加，解决telegram加载图上传图卡顿问题。**
> * **优化YouTube传输性能更强。**
> * **🆕 SOCKS5/HTTP 代理连接**
> * **🆕 全局和局部代理切换**
> * **🆕 IPv6 完整支持**
> * **🆕 智能连接重试机制**
> * **🆕 自适应传输模式**
> * **🆕 代理认证支持**

**核心逻辑调整（仅 Worker 版）：实现了 "二选一互斥" 逻辑。**
> * 优先级判定：代码会先检查 SUB_DOMAIN（无论是环境变量还是硬编码）。
> * 情况A（有上游）：如果 SUB_DOMAIN 存在且不为空，只执行上游订阅逻辑。完全忽略本地的 ADD/ADDAPI/ADDCSV。
> * 情况B（无上游）：只有当 SUB_DOMAIN 被清空（删除环境变量 + 代码留空）时，才会降级去执行本地 ADD 节点的生成逻辑。
> * Base64 识别保留：无论走哪条路，都会经过 Base64 客户端识别（Clash/Singbox 自动转换），保持自适应功能。

### 📱 核心功能

*   **🚀 自适应订阅**：自动识别以下客户端并返回对应格式：
    *   **支持列表**：Clash, Sing-box, Mihomo, Flclash, V2rayNG, Surge, Quantumult X, Shadowrocket, Loon, Hiddify 全平台主流客户端等。
*   **🌍 优选 IP 支持**：支持环境变量（Worker 版）或硬编码（Snippets 版）
*   **📊 可视化后台**（Worker 版）：
    *   直接在后台修改和保存 TG/CF/优选IP 配置（优先于硬编码，无需重新部署）。
    *   查看 Cloudflare 今日 API 请求量。
    *   查看最近 50 条访问日志（从 D1/KV 读取）。
    *   集成 ProxyIP 连通性检测。

### 🎯 智能客户端识别与自动转换

系统会根据 User-Agent 自动识别客户端类型并返回对应格式：

**自动转换规则：**
- **Clash/Meta 客户端**：自动调用订阅转换 API，返回 Clash 配置
- **Sing-box 客户端**：自动调用订阅转换 API，返回 Sing-box 配置（优先 v1.11.x，失败自动切换 v1.12.x）
- **其他客户端**（V2rayNG、Shadowrocket 等）：返回标准 Base64 编码的节点列表

**支持的配置模板：**
- **Clash 配置**：`ACL4SSR_Online_Full_MultiMode.ini`
- **Sing-box v1.11.x**：优先使用的模板（默认）
- **Sing-box v1.12.x**：备用模板（v1.11.x 失败时自动切换）

**识别的客户端列表：**
- Mihomo, Flclash, Clash, Meta, Stash
- Sing-box, Singbox, SFI, Box
- V2rayN, V2ray Core
- Surge
- Quantumult X
- Shadowrocket
- Loon
- Hiddify, Happ

**工作流程：**
1. 用户访问快速订阅链接（`/订阅密码`）
2. 系统检测 User-Agent 判断客户端类型
3. 如果是 Clash/Sing-box，自动调用转换 API
4. 如果是其他客户端，返回 Base64 编码的节点列表
5. 支持追加 `PS` 备注到所有节点名称

### 📡 节点生成规则详解

> **⚠️ ADD/ADDAPI/ADDCSV/PS/DLS 功能仅适用于 Worker 版。Snippets 版不支持自定义节点源和节点备注。**

**默认节点生成：**
- 如果未配置 `ADD`/`ADDAPI`/`ADDCSV`，系统会生成一个默认节点
- 默认节点使用 `PROXYIP` 作为连接地址
- 节点名称格式：`Worker - Default` 或 `${PS} - Default`

**自定义节点格式：**
- **ADD 格式**：`IP:端口#节点名称`（一行一个）
  ```
  1.1.1.1:443#美国节点
  8.8.8.8:443#香港节点
  ```
- **ADDAPI 格式**：远程 TXT 文件 URL，内容格式同 ADD
  ```
  https://example.com/ips.txt
  ```
- **ADDCSV 格式**：远程 CSV 文件 URL，读取 IP（第1列）、端口（第2列）和下载速度（第8列）
  ```
  https://example.com/优选IP.csv
  ```
  CSV 列格式：`IP, 端口, TLS, 数据中心, 地区, 城市, 网络延迟, 下载速度`（共 8 列）
  系统只使用第 1、2、8 列，其余列忽略。配合 `DLS` 可过滤低速节点。

**节点备注（PS）功能：**
- 如果设置了 `PS` 环境变量，会自动追加到所有节点名称后面
- 支持本地节点和上游订阅双重生效
- 示例：`PS=【专线】` → 节点名称变为 `美国节点 【专线】`

**节点优先级：**
1. 如果配置了 `SUB_DOMAIN`（上游订阅），忽略本地节点配置
2. 如果未配置 `SUB_DOMAIN`，按顺序读取 ADD → ADDAPI → ADDCSV
3. 三种方式可以同时使用，节点会合并生成

---

## 🔧 SOCKS5/HTTP 代理配置详解

### 1. 完整代理支持
- **SOCKS5 代理**：支持用户名/密码认证
- **HTTP 代理**：支持 CONNECT 方法和 Basic 认证
- **全局代理**：整个 Worker 走代理（格式：`socks5://user:pass@host:port`）
- **局部代理**：单个连接走代理（格式：`/s5=user:pass@host:port`）

### 2. 高级地址解析
- **IPv4 支持**：标准 IPv4 地址解析
- **IPv6 支持**：完整 IPv6 地址解析（包括 `[::1]:443` 格式）
- **域名解析**：支持域名和端口组合
- **Base64 认证**：支持 Base64 编码的用户名密码

### 3. 智能连接处理
- **自适应模式**：根据网络状况自动调整传输策略
- **缓冲模式**：小数据包批量发送，减少延迟
- **直连模式**：大数据包直接发送，提高吞吐量
- **智能重连**：带评分系统的指数退避重连机制

### 4. 代理配置格式

#### 全局代理（整个 Worker）
```
socks5://user:pass@proxy.example.com:1080
socks://user:pass@proxy.example.com:1080
http://user:pass@proxy.example.com:8080
```

#### 局部代理（单个连接）
```
/s5=user:pass@proxy.example.com:1080
/socks5=user:pass@proxy.example.com:1080
/http=user:pass@proxy.example.com:8080
/s5=base64encoded@proxy.example.com:1080
```

#### ProxyIP（优选 IP）
```
/proxyip=1.1.1.1:443
/ip=8.8.8.8:443
/proxyip=[2606:4700:4700::1111]:443
```

### 5. 性能优化

**自适应传输模式**
- **缓冲模式**：吞吐量 < 8MB/s 或平均包大小 < 4KB
- **直连模式**：吞吐量 > 16MB/s 且平均包大小 > 12KB
- **自适应模式**：介于两者之间，动态调整

**智能重连机制**
- 基于评分系统（0.1 - 1.0）
- 指数退避算法（50ms - 3000ms）
- 随机抖动避免雷鸣群效应
- 最大重连次数：24 次

**内存池优化**
- 16KB 预分配缓冲区
- 对象复用池（最多 8 个）
- 自动释放和重置

### 6. 安全特性

**代理认证**
- SOCKS5 用户名/密码认证
- HTTP Basic 认证
- Base64 编码支持

**连接保护**
- 最大待发送数据：2MB
- 连接超时检测：8 秒
- 最大停滞次数：12 次
- Keep-alive 心跳：15 秒

---

### 🎨 UI 特性说明

> **以下 UI 描述主要针对 Worker 版后台。Snippets 版后台功能较精简，不包含 TG 通知配置、CF 统计配置、白名单管理、自定义节点、日志等面板。**

**登录页面：**
*   **星空背景**：200 颗动态闪烁星星，营造沉浸式夜空效果。
*   **流星雨特效**：8 颗流星以真实轨迹划过屏幕，循环播放。
*   **玻璃碎片**：6 个毛玻璃碎片缓慢浮动，增强科技感。
*   **自定义标题**：可通过环境变量 `LOGIN_PAGE_TITLE` 修改浏览器标签页标题。

**后台管理页面：**
*   **侧边栏导航**：左侧固定侧边栏，包含 Logo 和 5 个主菜单（控制台、订阅、白名单、自定义节点、日志）。
*   **右上角工具栏**：包含主题切换、TG 通知配置、CF 统计配置、退出登录 4 个按钮。
*   **双主题模式**：
    *   **深色主题**：深蓝星空背景 + 幻彩渐变文字 + 霓虹发光效果。
    *   **浅色主题**：天空蓝渐变背景 + 深色文字 + 柔和视觉效果。
*   **3D 球体统计**：首页采用 3 层旋转圆环球体展示今日请求数，数字自适应大小防止溢出。
*   **响应式设计**：完美适配所有设备（桌面/平板/手机），支持 50%-200% 缩放。
*   **自定义标题**：可通过环境变量 `DASHBOARD_TITLE` 修改浏览器标签页标题。

### 🔐 登录与安全

*   **🔒 强制安全登录**：
    *   **会话级验证**：关闭浏览器标签页或刷新页面（视缓存策略而定）会自动退出登录。
    *   **未设置密码保护**：如果未设置 `WEB_PASSWORD`，系统会强制显示登录页且无法进入，防止后台裸奔。
    *   **防闪屏机制**：页面默认隐藏，验证通过后才显示内容，杜绝数据泄露。

### 🔐 会话管理机制详解

**登录流程：**
1. 用户在登录页输入密码
2. 系统设置 Cookie：`auth=密码`（路径：`/`，SameSite=Lax）
3. 同时在浏览器中设置活跃标记：Worker 版使用 `sessionStorage`（关闭标签页即失效），Snippets 版使用 `localStorage`（关闭浏览器后仍保留）
4. 页面加载时检查活跃标记，如果不存在则清除 Cookie

**自动退出触发条件：**
- 关闭浏览器标签页（Worker 版：sessionStorage 被清除；Snippets 版：Cookie 仍保留，但 localStorage 标记仍在）
- Worker 版刷新页面时 sessionStorage 不存在会触发退出
- 手动点击右上角退出按钮
- Cookie 过期或被清除

> **注意**：Snippets 版使用 `localStorage` 存储活跃标记，关闭标签页后标记不会自动清除，重新打开可能仍保持登录状态。Worker 版使用 `sessionStorage`，关闭标签页即自动退出。

**安全特性：**
- Cookie 使用 `SameSite=Lax` 防止 CSRF 攻击
- 页面默认隐藏（`display:none; opacity:0`），验证通过后才显示
- 所有敏感操作（白名单管理、配置保存）需要验证 Cookie 或白名单 IP

**防闪屏实现：**
```javascript
// 页面默认隐藏
body { display: none; opacity: 0; }

// 验证通过后显示
body.loaded { display: block; opacity: 1; }
```

**会话保持机制：**
- Worker 版：只要不关闭标签页，sessionStorage 会一直保持；关闭标签页后重新打开需要重新登录
- Snippets 版：使用 localStorage，关闭标签页后标记仍在，可能保持登录状态
- 刷新页面时会检查活跃标记，存在则保持登录状态

---

### 🛡️ 白名单管理

> **⚠️ 后台可视化白名单管理仅适用于 Worker 版。Snippets 版只支持通过代码硬编码 `AI` 变量设置固定白名单 IP。**

*   **查看**: 点击 "刷新" 按钮查看当前数据库中的白名单 IP。
*   **添加**: 输入 IP 地址点击 "添加白名单" 即可，无需重启。
*   **删除**: 点击列表右侧的 "删除" 按钮。
*   *注：系统内置的白名单 IP (环境变量 `ADMIN_IP` 或 `WL_IP`) 无法在后台删除。*

### ⚙️ 动态配置

> **⚠️ 本功能仅适用于 Worker 版。Snippets 版所有配置只能通过修改代码硬编码实现，不支持在线保存。**

*   **保存配置**: 在 "🛠️ 优选 IP 与 远程配置" 或 Telegram/CF 弹窗中修改内容后，点击保存。
*   数据将写入 D1/KV，优先级高于代码中的默认值。
*   **检测**: 支持检测 ProxyIP 可用性，支持测试订阅链接连通性。

### 🎯 自定义页面标题使用方法

> **⚠️ 本功能仅适用于 Worker 版。Snippets 版登录页标题固定为"管理员登陆"，面板标题固定为"Worker 订阅管理"，不可自定义。**

**方法 1：通过环境变量设置（推荐）**

在 Cloudflare Workers 后台 `设置` -> `变量` 中添加：

```
LOGIN_PAGE_TITLE = 我的专属登录页
DASHBOARD_TITLE = 我的管理控制台
```

**方法 2：通过 D1 数据库设置**

在 D1 数据库控制台执行：

```sql
INSERT INTO config (key, value) VALUES ('LOGIN_PAGE_TITLE', '我的专属登录页');
INSERT INTO config (key, value) VALUES ('DASHBOARD_TITLE', '我的管理控制台');
```

**方法 3：通过 KV 存储设置**

在 KV 命名空间中添加键值对：
- 键：`LOGIN_PAGE_TITLE`，值：`我的专属登录页`
- 键：`DASHBOARD_TITLE`，值：`我的管理控制台`

**方法 4：修改代码默认值**

在代码顶部用户配置区域修改：

```javascript
const LOGIN_PAGE_TITLE = "我的专属登录页";
const DASHBOARD_TITLE = "我的管理控制台";
```

**优先级：环境变量 > D1 数据库 > KV 存储 > 代码默认值**

### 🎨 主题切换说明

*   点击右上角 **🌗** 按钮即可在深色/浅色主题间切换。
*   **深色主题**：适合夜间使用，星空背景 + 幻彩文字。
*   **浅色主题**：适合白天使用，天空蓝背景 + 深色文字，护眼不刺眼。
*   主题设置**不会**持久化保存，刷新页面或关闭标签页后恢复为默认深色主题。

---

## 🔐 动态 UUID 功能说明

> **⚠️ 本功能仅适用于 Worker 版。Snippets 版使用固定 UUID，不支持动态 UUID。**

**动态 UUID 是一项高级安全特性，可定期自动更换客户端连接凭证，防止 UUID 泄露后长期被滥用。**

### 启用方法

在 Cloudflare Workers 后台 `设置` -> `变量` 中添加：

```
KEY = my-secret-key-2024
UUID_REFRESH = 86400
```

### 工作原理

*   系统使用 `KEY` 和当前时间戳生成动态 UUID（SHA-256 哈希）。
*   每隔 `UUID_REFRESH` 秒（默认 86400 秒 = 24 小时），UUID 自动更换。
*   客户端需要在 UUID 过期前更新订阅，获取新的 UUID。

### 注意事项

*   **启用后，原有的 `UUID` 环境变量将被忽略**，系统完全使用动态生成的 UUID。
*   **客户端必须定期更新订阅**（建议设置自动更新间隔 < `UUID_REFRESH` 值）。
*   **不建议设置过短的刷新周期**（< 3600 秒），可能导致客户端频繁断线。
*   **`KEY` 值务必保密**，泄露后攻击者可计算出所有历史和未来的 UUID。

### 适用场景

*   **高安全需求**：需要定期轮换凭证的企业或个人用户。
*   **防止滥用**：UUID 不慎泄露后，可通过更换 `KEY` 立即失效所有旧 UUID。
*   **多用户管理**：为不同用户分配不同 `KEY`，实现独立的 UUID 轮换策略。

### 禁用方法

删除 `KEY` 环境变量，系统将恢复使用静态 `UUID`。

---

## 📊 Cloudflare 统计功能说明

> **⚠️ 本章节仅适用于 Worker 版。Snippets 版不支持 Cloudflare 统计功能。**

**系统支持两种统计方式查询今日请求数：**

### 方式 1：Cloudflare API 统计（推荐）

*   **优势**：数据最准确，包含 Workers 和 Pages 的所有请求。
*   **配置方法**：
    *   **方案 A**：使用 Account ID + API Token（推荐）
        ```
        CF_ID = your-account-id
        CF_TOKEN = your-api-token
        ```
    *   **方案 B**：使用 Email + Global API Key
        ```
        CF_EMAIL = your@email.com
        CF_KEY = your-global-api-key
        ```
*   **权限要求**：API Token 需要 `Account Analytics:Read` 权限。
*   **查询范围**：自动查询当日 00:00 UTC 至当前时间的所有请求。

---

### 📖 Cloudflare API 配置图文教程

#### 一、获取 Account ID（账户 ID）

**步骤 1**：登录 Cloudflare Dashboard，在左侧菜单找到 **计算和 AI** → **Workers 和 Pages**。

<img width="200" alt="Workers和Pages入口" src="./issue/计算和AI.png" />

**步骤 2**：在右侧页面找到 **Account Details** 区域，复制 **Account ID**。

<img width="400" alt="Account ID位置" src="./issue/账户ID.png" />

---

#### 二、方案 A：创建 API Token（推荐）

> **推荐理由**：API Token 权限可控，安全性更高，可随时撤销。

**步骤 1**：点击左侧菜单底部的 **管理账户** → **帐户 API 令牌**。

<img width="200" alt="帐户API令牌入口" src="./issue/创建账户API.png" />

**步骤 2**：点击右侧的 **创建令牌** 按钮。

<img width="800" alt="创建令牌按钮" src="./issue/创建账户API令牌.png" />

**步骤 3**：在 **API 令牌模板** 列表中，找到 **阅读分析数据和日志**，点击右侧的 **使用模板** 按钮。

<img width="600" alt="选择模板" src="./issue/API模版为阅读分析数据和日志.png" />

**步骤 4**：配置令牌权限（模板已自动配置好权限，只需配置区域资源）：
- **区域资源**：选择 **包括** → **帐户的所有区域** → 选择你的 **账户名称**

<img width="800" alt="配置权限" src="./issue/创建令牌完整流程.png" />

**步骤 5**：滚动到页面底部，点击 **创建令牌** 按钮。

<img width="600" alt="确认创建" src="./issue/确定创建账户API令牌.png" />

**步骤 6**：创建成功后，**立即复制并保存 Token**（只显示一次，关闭后无法再次查看）。

---

#### 三、方案 B：获取 Email + Global API Key

> **适用场景**：如果你不想创建新的 API Token，可以使用账户的 Global API Key。

**步骤 1：获取 Email（电子邮件）**

1. 点击 Cloudflare 右上角的 **头像图标**。
2. 在下拉菜单中点击 **配置文件**。

<img width="200" alt="配置文件入口" src="./issue/邮箱定位.png" />

3. 在 **个人简介** → **设置** 页面，找到 **电子邮件** 字段，这就是你的 `CF_EMAIL`。

<img width="400" alt="电子邮件位置" src="./issue/查看个人邮箱.png" />

**步骤 2：获取 Global API Key**

1. 在左侧菜单点击 **API 令牌**。
2. 滚动到页面底部，找到 **API 密钥** 区域。
3. 在 **Global API Key** 行，点击右侧的 **查看** 按钮。
4. 输入密码验证后，复制显示的 Key，这就是你的 `CF_KEY`。

<img width="800" alt="Global API Key位置" src="./issue/创建全局API.png" />

> ⚠️ **安全提示**：Global API Key 拥有账户的完全访问权限，请妥善保管，不要泄露给他人。建议优先使用方案 A（API Token）。

---

#### 四、配置环境变量

获取到所需信息后，在 Cloudflare Workers 后台 **设置** → **变量** 中添加：

**方案 A（推荐）：**
```
CF_ID = 你的Account ID
CF_TOKEN = 你创建的API Token
```

**方案 B：**
```
CF_EMAIL = 你的Cloudflare登录邮箱
CF_KEY = 你的Global API Key
```

配置完成后，后台首页的 3D 球体将显示准确的今日请求统计数据。

---

### 方式 2：D1 内部统计（备用）

*   **优势**：无需配置 API，自动累加。
*   **局限**：仅统计经过 Worker 处理的请求，不包括 CDN 缓存命中的请求。
*   **存储位置**：D1 数据库 `stats` 表，按日期分组。
*   **自动清理**：无自动清理机制，需手动维护。

### 后台显示逻辑

*   **优先显示 API 统计**：如果配置了 CF API 凭证且验证通过，显示 API 查询结果（标注 "API"）。
*   **降级显示 D1 统计**：如果未配置或 API 查询失败，显示 D1 内部统计（标注 "Internal"）。

---

## 📝 访问日志与统计详解

> **⚠️ 本章节仅适用于 Worker 版。Snippets 版不支持访问日志和统计功能。**

### 访问日志功能

**系统自动记录所有关键操作，帮助管理员监控访问情况。**

#### 记录内容

*   **时间戳**：北京时间（Asia/Shanghai 时区）
*   **访问者 IP**：客户端真实 IP（通过 `cf-connecting-ip` 获取）
*   **地理位置**：城市 + 国家代码（通过 Cloudflare 提供的 `r.cf.city` 和 `r.cf.country`）
*   **操作类型**：
    *   `登录后台`：管理员成功登录后台管理面板
    *   `订阅更新`：客户端访问快速订阅路径（`/订阅密码`）
    *   `常规订阅`：客户端访问标准订阅接口（`/sub?uuid=...`）

#### 存储方式

*   **优先级 1**：D1 数据库 `logs` 表（推荐）
    *   表结构：`id, time, ip, region, action`
    *   自动清理：保留最新 2000 条记录
*   **优先级 2**：KV 存储 `ACCESS_LOGS` 键（降级方案）
    *   格式：纯文本，每行一条记录，用 `|` 分隔字段

#### 后台查看

*   进入 "📋 日志" 面板查看最近 50 条记录
*   支持手动刷新和自动刷新（每 5 秒）
*   日志按时间倒序排列（最新的在最上方）

### 每日统计功能

**系统自动统计每日访问量，支持跨日查询。**

#### 统计逻辑

*   每次访问（包括登录、订阅更新、常规订阅）自动累加计数
*   按日期分组存储（格式：`YYYY-MM-DD`）
*   使用 D1 数据库 `stats` 表的 `INSERT ... ON CONFLICT` 语法实现原子性累加

#### 数据结构

```sql
CREATE TABLE stats (
    date TEXT PRIMARY KEY,      -- 日期（YYYY-MM-DD）
    count INTEGER DEFAULT 0     -- 当日请求数
);
```

#### 查询方式

*   **后台首页**：3D 球体实时显示今日请求数
*   **API 查询**：访问 `?flag=stats` 获取 JSON 格式统计数据
*   **Cloudflare API**：如果配置了 CF 凭证，优先显示 API 统计（更准确）

### 🔗 系统内部 API 接口（Flag 参数）

> **⚠️ 以下 API 接口仅适用于 Worker 版。Snippets 版不支持 flag 参数接口。**

系统提供了一系列内部 API 接口，通过 `?flag=xxx` 参数调用：

**统计与查询接口：**
- `?flag=stats` - 获取统计数据（JSON 格式）
  - 返回：今日请求数、当前 IP、地理位置、存储状态
- `?flag=get_logs` - 获取访问日志（需登录）
  - 返回：最近 50 条日志记录
- `?flag=get_whitelist` - 获取白名单列表（需登录）
  - 返回：所有白名单 IP 及类型（系统/手动）

**配置管理接口：**
- `?flag=add_whitelist` - 添加白名单 IP（POST，需登录）
  - 参数：`{"ip": "1.2.3.4"}`
- `?flag=del_whitelist` - 删除白名单 IP（POST，需登录）
  - 参数：`{"ip": "1.2.3.4"}`
- `?flag=save_config` - 保存配置到 D1/KV（POST，需登录）
  - 参数：`{"KEY": "VALUE", ...}`

**验证接口：**
- `?flag=validate_tg` - 验证 TG 配置（POST）
  - 参数：`{"TG_BOT_TOKEN": "xxx", "TG_CHAT_ID": "xxx"}`
  - 会发送测试消息到 Telegram
- `?flag=validate_cf` - 验证 CF 配置（POST）
  - 参数：`{"CF_ID": "xxx", "CF_TOKEN": "xxx", ...}`
  - 返回验证结果和请求统计

**日志记录接口：**
- `?flag=log_proxy_check` - 记录 ProxyIP 检测日志
- `?flag=log_sub_test` - 记录订阅测试日志
- `?flag=github` - 记录 GitHub 项目点击

**使用示例：**
```javascript
// 获取统计数据
fetch('https://your-worker.com?flag=stats')
  .then(res => res.json())
  .then(data => console.log(data));

// 添加白名单
fetch('https://your-worker.com?flag=add_whitelist', {
  method: 'POST',
  body: JSON.stringify({ip: '1.2.3.4'})
});
```

### 🔗 订阅链接参数说明

**快速订阅路径：**
- `https://域名/订阅密码` - 快速订阅（自动识别客户端）
- `https://域名/订阅密码?proxyip=1.1.1.1:443` - 指定优选 IP

**标准订阅接口：**
- `https://域名/sub?uuid=xxx` - 基础订阅
- `https://域名/sub?uuid=xxx&proxyip=1.1.1.1:443` - 指定优选 IP
- `https://域名/sub?uuid=xxx&path=/proxyip=1.1.1.1:443` - 路径中指定优选 IP

**支持的参数：**
- `uuid` - 用户 UUID（必填）
- `proxyip` - 优选 IP 地址
- `path` - WebSocket 路径（可包含 proxyip）
- `encryption` - 加密方式（默认 none）
- `security` - 传输安全（默认 tls）
- `sni` - SNI 域名
- `alpn` - ALPN 协议（默认 h3）
- `fp` - 指纹（默认 random）
- `allowInsecure` - 允许不安全连接（默认 1）
- `type` - 传输类型（默认 ws）
- `host` - Host 头

### 🔗 默认配置链接

系统使用以下默认配置链接，可在代码中修改：

**订阅转换配置：**
- **Clash 配置模板**：
  ```
  https://raw.githubusercontent.com/cmliu/ACL4SSR/main/Clash/config/ACL4SSR_Online_Full_MultiMode.ini
  ```
- **Sing-box v1.11.x 模板**（默认优先）：
  ```
  https://raw.githubusercontent.com/sinspired/sub-store-template/main/1.11.x/sing-box.json
  ```
- **Sing-box v1.12.x 模板**（备用）：
  ```
  https://raw.githubusercontent.com/sinspired/sub-store-template/main/1.12.x/sing-box.json
  ```

**外部服务链接：**
- **ProxyIP 检测网站**：`https://kaic.hidns.co/`
- **TG 交流群**：`https://t.me/zyssadmin`
- **TG 频道**：`https://t.me/cloudflareorg`

**修改方法：**
在代码顶部用户配置区域找到以下变量并修改：
```javascript
let SUBINI = '你的Clash配置URL';       // 或用 ''+'' 拆分写法
const PC = "你的检测网站URL";
```

---

## 🔧 常见问题 FAQ

### Q1: 动态 UUID 和静态 UUID 有什么区别？

*   **静态 UUID**：固定不变，配置一次永久有效，适合个人使用。
*   **动态 UUID**：定期自动更换（默认 24 小时），需要客户端定期更新订阅，适合高安全需求场景。

### Q2: 为什么后台显示的请求数和实际不符？

*   **D1 内部统计**：只统计经过 Worker 处理的请求，不包括 CDN 缓存命中的请求。
*   **Cloudflare API 统计**：包含所有请求（Workers + Pages + 缓存），数据更准确，建议配置 CF API 凭证。

### Q3: 白名单 IP 无法删除怎么办？

*   **系统预设 IP**（来自环境变量或硬编码）无法在后台删除，需要修改环境变量或代码。
*   **后台配置 IP**（手动添加）可以随时删除。

### Q4: TG 通知配置后没有收到消息？

*   检查 Bot Token 和 Chat ID 是否正确。
*   使用后台 "验证" 功能测试配置有效性。
*   确认 Bot 已启动（向 Bot 发送 `/start` 命令）。
*   检查是否被 Telegram 限流（短时间内发送过多消息）。

### Q5: Cloudflare API 统计配置后显示 "验证失败"？

*   **方案 A**：确认 Account ID 和 API Token 正确，Token 需要 `Account Analytics:Read` 权限。
*   **方案 B**：确认 Email 和 Global API Key 正确。
*   检查 API Token 是否过期或被撤销。

### Q6: 订阅链接无法访问或返回空内容？

*   检查 `SUB_PASSWORD` 是否正确（区分大小写）。
*   检查 `SUB_DOMAIN` 配置是否正确（上游订阅源地址）。
*   如果使用本地 ADD 节点，确保 `SUB_DOMAIN` 为空或未配置。
*   查看后台日志，确认是否有错误记录。

### Q7: 如何切换使用上游订阅或本地节点？

*   **使用上游订阅**：配置 `SUB_DOMAIN` 环境变量，系统会忽略 ADD/ADDAPI/ADDCSV。
*   **使用本地节点**：清空 `SUB_DOMAIN`（删除环境变量或留空），配置 ADD/ADDAPI/ADDCSV。
*   **两者互斥**：不能同时生效，优先使用上游订阅。

### Q8: D1 数据库和 KV 存储有什么区别？

*   **D1 数据库**：关系型数据库（SQLite），支持复杂查询，性能更好，推荐使用。
*   **KV 存储**：键值存储，简单易用，适合存储少量配置数据，作为 D1 的降级方案。
*   **优先级**：系统优先使用 D1，如果未绑定则降级使用 KV。

### Q9: 如何备份和恢复配置？

*   **环境变量**：在 Cloudflare 后台导出环境变量配置。
*   **D1 数据库**：使用 D1 控制台导出 SQL 数据（`SELECT * FROM config/whitelist/logs/stats`）。
*   **KV 存储**：使用 Cloudflare API 或 Wrangler CLI 导出 KV 数据。

### Q10: 如何完全重置系统？

1. 删除所有环境变量（或恢复默认值）。
2. 清空 D1 数据库所有表：
   ```sql
   DELETE FROM config;
   DELETE FROM whitelist;
   DELETE FROM logs;
   DELETE FROM stats;
   ```
3. 清空 KV 存储所有键值对。
4. 重新部署代码。

---

## 🙏 特别感谢与致谢

**特别感谢天诚修复的所有 Bug 与新增功能：**
*   ❇️ 修复了 Cloudflare 网站不能访问的问题。
*   ❇️ 新增加了机场三字码的适配。
*   ❇️ 新增优选IP支持。
*   ❇️ 新增解锁 Emby 播放器。
*   ❇️ 新增了韩国节点适配。
*   ❇️ Vless 订阅器内置 CSV 文件优化识别功能。

**相关支持与链接：**
*   **源代码作者**：[Alexandre_Kojeve](https://t.me/Alexandre_Kojeve) (致敬原版 stallTCP1.32)
*   **后台作者**：[ym94203](https://t.me/ym94203)
*   **ProxyIP 支持**：[COMLiang](https://t.me/COMLiang)
*   **Telegram 交流群**：[zyssadmin](https://t.me/zyssadmin)
*   **Cloudflare Docs**：[Support](https://developers.cloudflare.com/)

---

## ⚖️ 免责声明

**本项目仅供技术交流与学习使用，请勿用于非法用途。使用本程序产生的任何后果由使用者自行承担。**
