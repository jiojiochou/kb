# Redis 模块

业务模块在 `imports` 中引入 `RedisModule`，通过构造函数注入 `RedisService`，使用 `redisService.client` 执行 ioredis 命令。同一 Nest 应用中的模块共享此连接。

模块统一管理连接配置、错误日志和关闭时的连接释放。连接采用懒加载，首次执行命令时建立连接。应用根模块需通过 `ConfigModule.forRoot()` 加载环境配置。

| 环境变量         | 默认值      |
| ---------------- | ----------- |
| `REDIS_HOST`     | `localhost` |
| `REDIS_PORT`     | `6379`      |
| `REDIS_PASSWORD` | 无          |
| `REDIS_DB`       | `0`         |

业务 key 命名、过期时间和 Lua 脚本由各自的业务服务维护，例如 `VerificationCodeStore`。
