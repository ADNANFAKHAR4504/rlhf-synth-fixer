/* eslint-disable import/no-extraneous-dependencies */
// AWS SDK and pg are provided by Lambda runtime layer
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { Client } from 'pg';

const secretsClient = new SecretsManagerClient({});

interface HealthCheckResult {
  healthy: boolean;
  endpoint: string;
  replicationLag?: number;
  message?: string;
}

export const handler = async (): Promise<HealthCheckResult> => {
  const primaryEndpoint = process.env.PRIMARY_CLUSTER_ENDPOINT!;
  const secretArn = process.env.SECRET_ARN!;

  try {
    // Get database credentials
    const secretResponse = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: secretArn })
    );
    const secret = JSON.parse(secretResponse.SecretString!);

    // Create PostgreSQL client with TLS
    const client = new Client({
      host: primaryEndpoint,
      port: 5432,
      user: secret.username,
      password: secret.password,
      database: 'postgres',
      ssl: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2',
      },
      connectionTimeoutMillis: 5000,
      query_timeout: 5000,
    });

    // Test connection and check replication lag
    await client.connect();

    // Check if this is a writer instance
    const writerCheckQuery = 'SELECT pg_is_in_recovery()';
    const writerResult = await client.query(writerCheckQuery);
    const isReadOnly = writerResult.rows[0].pg_is_in_recovery;

    // Check replication lag (for global database)
    let replicationLag = 0;
    if (!isReadOnly) {
      const lagQuery = `
                SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) * 1000 as lag_ms
                FROM pg_stat_replication
                WHERE state = 'streaming'
                ORDER BY lag_ms DESC
                LIMIT 1
            `;
      const lagResult = await client.query(lagQuery);
      if (lagResult.rows.length > 0) {
        replicationLag = lagResult.rows[0].lag_ms || 0;
      }
    }

    await client.end();

    return {
      healthy: true,
      endpoint: primaryEndpoint,
      replicationLag,
      message: `Primary cluster is healthy. Read-only: ${isReadOnly}, Lag: ${replicationLag}ms`,
    };
  } catch (error) {
    console.error('Health check failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      healthy: false,
      endpoint: primaryEndpoint,
      message: `Health check failed: ${errorMessage}`,
    };
  }
};
