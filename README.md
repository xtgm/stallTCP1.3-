# stallTCP1.3V1  节点与订阅管理面板 (通用后台版)

**如果项目对您有帮助。请给我点亮星星star 谢谢**

**源代码来源于Alexandre_Kojeve的stallTCP1.3**

**特别说明 我只是完善了html后台管理页面**

**✅ 完美支持 Cloudflare Workers**  
**✅ 完美支持 Cloudflare Pages**  
**✅ 完美支持 Cloudflare snippets**  

**这是一个基于 Cloudflare Workers 的 VLESS 节点脚本。**

**集成了 Web 管理后台、订阅转换.**

**优选 IP 自动解析（支持 .netlib 异步解析）以及 Clash/Sing-box 配置生成功能。**

**修复全平台所有兼容性问题 修复ios系统shadowrocket以及quantumult x兼容性问题**

<img width="1905" height="919" alt="image" src="https://github.com/user-attachments/assets/e43db73f-4d8d-41a3-ab43-61555c8c984b" />

-----------------------------------------------------------------------------------------------------------------

-----------------------------------------------------------------------------------------------------------------

# 特别感谢天诚修复的所有bug功能

❇️修复了cloudflare网站不能访问的问题                                                                                                                     

❇️新增加了机场三字码的适配                                                                                                                       

❇️新增负载均衡轮询

❇️新增解锁Emby播放器

❇️新增了韩国节点适配

❇️Tojan订阅器内置CSV文件优化识别功能                                                                                          

❇️Vless订阅器内置CSV文件优化识别功能



------------------------------------------------------------------------------------------------------------------



## 📞 支持
- **源代码作者** ：https://t.me/Alexandre_Kojeve
- **proxyip支持** ：https://t.me/COMLiang
- **Telegram群组**: https://t.me/zyssadmin
- **telegram作者**：https://t.me/ym94203
- **Cloudflare Docs支持**: https://developers.cloudflare.com/

 🙏致敬原版作者：  Alexandre_Kojeve

 ⚠️ 后台作者：    ym94203
 
 👥 交流群组       zyssadmin 
 
 🤖  问题反馈/ 天诚技术交流群


------------------------------------------------------------------------------------------------------------------

## ⚙️ 配置说明 (Configuration)

在 `worker.js` 代码的前几行，你需要根据需求修改以下变量：

## 🟣 用户配置区域
// =============================================================================

const UUID = "你的UUID";                 // 必填：建议使用 UUID Generator 生成

const WEB_PASSWORD = "你的后台密码";       // 必填：访问网页后台的密码

const SUB_PASSWORD = "sub";             // 选填：快速订阅路径，访问 https://域名/sub 即可

const DEFAULT_PROXY_IP = "tw.sni2025.netlib.re"; // 默认优选 IP 或域名

const DEFAULT_SUB_DOMAIN = "sub.cmliussss.net";  // 真实订阅源（用于聚合）


-----------------------------------------------------------------------------------------------------------------



-----------------------------------------------------------------------------------------------------------------

## ✨ 主要功能

- **🚀 VLESS 协议支持**：基于 `cloudflare:sockets`，实现高性能代理。
- **🛡️ 专属管理后台**：内置 Web 界面，可查看配置、复制订阅、检测 IP。
- **🔄 订阅聚合与转换**：支持抓取远程订阅源，并自动替换为 Worker 的节点信息。
- **⚡ 优选 IP 增强**：
  - 内置常用优选 IP 列表。 可自行修改自定义优选IP
  - **特色功能**：支持 `.netlib` 域名的异步 DoH 解析，自动获取动态优选 IP。
- **🔗 多客户端支持**：自动识别 User-Agent，为 Clash、Meta、Stash 等客户端生成专属配置。
- **🔐 安全认证**：支持自定义 UUID 和后台管理密码。

## 🛠️ 部署指南

------------------------------------------------------------------------


## 🚀 快速开始

--- **worker部署**（小白最优选择）
部署 CF Worker：

登录你的cloudflare
找到计算和AI里的Workers 和 Pages：
选择从 Hello World! 开始：

<img width="1264" height="602" alt="image" src="https://github.com/user-attachments/assets/2b80a97b-ee57-42a8-be1a-8180254f54dc" />


输入任意的work名称之后点击部署即可

<img width="1645" height="806" alt="image" src="https://github.com/user-attachments/assets/b26217ed-d17c-465d-bcbd-b232ab5a4fd0" />


然后在cloudflare的Workers 和 Pages里面 找到你部署好的work项目 以我的项目为例： 点击编辑代码

<img width="1646" height="128" alt="image" src="https://github.com/user-attachments/assets/a7f0c75a-56c3-467b-a07f-d37cafb8dd6c" />


将 worker.js 的内容粘贴到 Worker 编辑器中并完成部署



**到这里worker部署就结束了**



----------------------------------------------------------------------

# cloudflare snip部署 【有snippets的必看】

点击自己的域名进入

<img width="1565" height="202" alt="image" src="https://github.com/user-attachments/assets/2483c2b7-3bb2-4cac-bdd6-38f8b31f4329" />

找到规则-snippets 点击创建片段

<img width="1652" height="716" alt="image" src="https://github.com/user-attachments/assets/9059a47d-77da-4ba4-82cc-03e8a8638c0f" />

输入片段名称【自己决定】

<img width="1920" height="878" alt="image" src="https://github.com/user-attachments/assets/f163e9ef-989b-4645-8ebc-eadf755f4b23" />

找到我项目的worker.js代码 打开它 复制代码 粘贴到snippets

选择片段规则-自定义规则

字段为主机名 运算符为等于 值为你的子域名+你的域名

例如：123为子域名 321.com为你的CF托管域名 

<img width="1920" height="914" alt="image" src="https://github.com/user-attachments/assets/1f858efe-a6ce-4bf6-8d62-0bfc462ef2b3" />

点击完成 保存更改

弹出修改 创建DNNS记录 

选择创建新代理DNS记录

类型为A 名称为你的子域名 ipv4 为192.0.2.1


<img width="640" height="459" alt="image" src="https://github.com/user-attachments/assets/f88ad346-30aa-41ef-9f7c-deb2453afbfe" />


snippets部署结束


------------------------------------------------------------------------

### 方法二：通过 GitHub Actions 部署（进阶）

*如果你熟悉 Wrangler CLI，可以直接 clone 本仓库并使用 `npx wrangler deploy`。*


------------------------------------------------------------------------------


# ⚖️ 免责声明

**本项目仅供技术交流与学习使用，请勿用于非法用途。使用本程序产生的任何后果由使用者自行承担。**


# 🙏 致谢

**基于 Cloudflare Workers 平台**

**感谢开源社区提供的优选 IP 思路**

**致谢Alexandre Kojève做的TCP流媒体优化**

**致谢天诚大佬COMLiang做的proxyip**

**感谢天诚交流群各位群友支持**
