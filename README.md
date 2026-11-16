<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

项目使用 NestJS 12，开发、构建和测试需要 **Node.js 24.15.0 或更新版本**
（本项目使用 24.22.1）及 pnpm 11.25.0。项目和 NestJS 12 的包均采用 ESM，
相对导入使用 `.js` 后缀，TypeScript 使用 NodeNext 模块解析。
构建使用 Nest CLI 默认的 TypeScript 编译器，自动将 `@app/*` 库别名转换为运行时路径。
单元测试和端到端测试使用 Vitest 4 / Vite 8，代码检查使用 Oxlint。

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

构建入口为 `dist/src/main.js`；`pnpm run start:prod` 使用该入口。
应用继续使用 Express 适配器，以支持现有的 session 和 Passport 登录流程。

## 邮箱验证码发送限制

`POST /auth/email/verification-code` 默认限制同一邮箱在首次请求起的 3600 秒内
最多发送 5 次；邮箱大小写和首尾空格不影响额度，超限返回 HTTP 429。

可通过环境变量 `EMAIL_VERIFICATION_SEND_LIMIT`（默认 `5`）和
`EMAIL_VERIFICATION_SEND_WINDOW_SECONDS`（默认 `3600`）调整，值必须为正整数。

发送计数使用 Redis 7 的 `MULTI + INCR + EXPIRE NX`，并发请求共用额度，
后续请求不会延长窗口。超限请求也计数，但不会覆盖验证码；发送或保存失败仍占用额度。
验证码有效期为 5 分钟，发送失败时保留 Lua 按值匹配删除，避免误删其他请求的验证码。

## 邮箱验证码校验

`POST /auth/email/verify` 接收 `email` 和 6 位数字字符串 `code`。
校验成功沿用接口默认的 HTTP 201 空响应，同时原子删除验证码，同一验证码只能成功使用一次。
验证码错误、过期或已使用返回 HTTP 400；错误验证码不会删除当前有效验证码。
Redis 异常返回 HTTP 500。此接口仅校验验证码，不修改用户信息或创建登录会话。

## 分页查询用户

`GET /user?page=1&pageSize=10` 查询未软删除的用户，按创建时间、ID 倒序排列。
`page` 默认 `1`，`pageSize` 默认 `10`，均为正整数，每页最多 `100` 条。
非法参数或超出安全整数范围的分页偏移量返回 HTTP 400。

```bash
curl "http://localhost:3000/user?page=2&pageSize=10"
```

可选参数 `account` 按账号精确筛选（去除首尾空格，1～25 个字符），
例如 `GET /user?account=user.name-1`；无匹配时返回空列表。

返回 HTTP 200，响应结构为：

```json
{
  "items": [],
  "total": 0,
  "page": 2,
  "pageSize": 10,
  "totalPages": 0
}
```

`items` 包含用户基本资料和创建、更新时间，不包含密码及删除时间。
`total` 为未软删除用户总数，`totalPages` 为总页数，无数据时为 `0`。
请求超过末页时返回空列表，仍保留实际总数。接口沿用用户模块当前的无鉴权方式。

## 查询单个用户

`GET /user/:id` 按用户 ID 查询未软删除的用户，例如 `GET /user/123456789012345678`。
成功返回 HTTP 200，统一响应结构为 `{ code: 200, message: 'success', data: 用户资料 }`，
不包含密码和删除时间。用户 ID 为雪花 ID，超出 JS 安全整数范围，请求和响应中均使用字符串；
ID 必须为不以 0 开头、不超过 PostgreSQL `bigint` 上限的正整数，否则返回 HTTP 400。
用户不存在或已软删除返回 HTTP 404。按账号查找请使用 `GET /user?account=...`。
接口沿用用户模块当前的无鉴权方式。
静态路由 `GET /user/check-account` 保持为账号占用检查接口。

## 更新用户信息

`PATCH /user/:id` 按用户 ID 部分更新用户资料，支持 `email`、`displayName`、
`firstName`、`lastName` 和 `avatar`，未传入的字段保持原值。昵称、姓名和头像
可传 `null` 清空；邮箱不能为 `null`，邮箱唯一约束包含已软删除的账户。
账号、密码和系统字段不参与更新，未知字段沿用全局白名单配置被忽略。

```bash
curl -X PATCH "http://localhost:3000/user/123456789012345678" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"新昵称","firstName":"小明"}'
```

成功返回 HTTP 200 和更新后的用户资料，不包含密码和删除时间。
非法 ID、非法字段值或未提供任何可更新字段返回 HTTP 400，
用户不存在或已软删除返回 HTTP 404，邮箱冲突返回 HTTP 409。
接口沿用用户模块当前的无鉴权方式。

## 账户软删除

调试接口为 `DELETE /user/:id`，例如：

```bash
curl -i -X DELETE "http://localhost:3000/user/123456789012345678"
```

将 `123456789012345678` 替换为实际用户 ID。成功返回 HTTP 204，无响应体。
此接口当前未加鉴权，供本地调试使用。

服务层提供 `UserService.softDeleteUserById(id)`，按用户 ID 软删除账户，
成功时返回 `void`。非法 ID 在控制器参数校验阶段返回 HTTP 400，
用户不存在或已被删除返回 HTTP 404。

删除使用 TypeORM 的 `DeleteDateColumn` 和 `softDelete`，在 `user.delete_time`
记录删除时间并保留原始数据。普通账户和邮箱查询会自动排除已删除账户；
注册查重及账号占用检查仍包含已删除账户，账号和邮箱不能重复注册。
当前项目启用了 `synchronize: true`，启动时会自动同步新增字段。

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov

# lint (including type-aware rules)
$ pnpm run lint
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
