import SnowflakeId from 'snowflake-id';

const snowflake = new SnowflakeId({
  mid: Number(process.env.SNOWFLAKE_WORKER_ID ?? 1), // 机器节点 ID (Worker ID)，多节点部署时每个节点设置不同数字 (0-1023)
  offset: Number(process.env.SNOWFLAKE_OFFSET ?? 1704067200000),
});

/** 生成雪花 ID（string），对应 Java long / Postgres BIGINT */
export function nextSnowflakeId(): string {
  return snowflake.generate();
}
