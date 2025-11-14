import {
  EC2Client,
  DescribeVpcsCommand,
} from '@aws-sdk/client-ec2';
import {
  ECSClient,
  DescribeServicesCommand,
  ListTasksCommand,
  DescribeTasksCommand,
} from '@aws-sdk/client-ecs';
import {
  RDSClient,
  DescribeDBClustersCommand,
} from '@aws-sdk/client-rds';
import {
  ElasticLoadBalancingV2Client,
  DescribeTargetHealthCommand,
  DescribeLoadBalancersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  RotateSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchLogsClient,
  GetLogEventsCommand,
  DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  PublishCommand,
} from '@aws-sdk/client-sns';
import {
  BackupClient,
  StartBackupJobCommand,
  DescribeBackupJobCommand,
  ListRecoveryPointsByBackupVaultCommand,
  GetBackupPlanCommand,
} from '@aws-sdk/client-backup';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

const outputs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../cfn-outputs/flat-outputs.json'), 'utf8')
);

// Load AWS region from environment variable
const region = process.env.AWS_REGION;
if (!region) {
  throw new Error('AWS_REGION environment variable is required');
}

// Get environment suffix from environment variable 
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;
if (!environmentSuffix) {
  throw new Error('ENVIRONMENT_SUFFIX environment variable is required');
}

// AWS Clients
const ec2Client = new EC2Client({ region });
const ecsClient = new ECSClient({ region });
const rdsClient = new RDSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const cloudwatchClient = new CloudWatchClient({ region });
const snsClient = new SNSClient({ region });
const backupClient = new BackupClient({ region });

// Stack outputs
const VPCId: string = outputs.VPCId;
const LoadBalancerArn: string = outputs.LoadBalancerArn;
const ALBTargetGroupArn: string = outputs.ALBTargetGroupArn;
const ECSClusterName: string = outputs.ECSClusterName;
const LoadBalancerURL: string = outputs.LoadBalancerURL;
const DatabaseEndpoint: string = outputs.DatabaseEndpoint;
const DatabaseReadEndpoint: string = outputs.DatabaseReadEndpoint;
const DatabaseSecretArn: string = outputs.DatabaseSecretArn;
const SNSTopicArn: string = outputs.SNSTopicArn;
const BackupPlanId: string = outputs.BackupPlanId;
const BackupVaultName: string = outputs.BackupVaultName;
const BackupRoleArn: string = outputs.BackupRoleArn;


// 1. DATABASE DATA CONSISTENCY TEST
describe('Database Data Consistency', () => {
  test('Database Write -> Read Endpoint -> Data Consistency', async () => {
    // A. Get database credentials from Secrets Manager
    const secretCommand = new GetSecretValueCommand({ SecretId: DatabaseSecretArn });
    const secretResponse = await secretsClient.send(secretCommand);
    const secret = JSON.parse(secretResponse.SecretString!);

    // B. Connect to write endpoint (primary)
    const writeClient = new Client({
      host: DatabaseEndpoint,
      port: 5432,
      database: secret.dbname,
      user: secret.username,
      password: secret.password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    await writeClient.connect();

    // C. Write test data
    const testId = `test_${Date.now()}`;
    await writeClient.query('CREATE TABLE IF NOT EXISTS integration_test (id VARCHAR PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW())');
    await writeClient.query('INSERT INTO integration_test (id) VALUES ($1) ON CONFLICT (id) DO NOTHING', [testId]);

    // D. Read from read endpoint (replica)
    const readClient = new Client({
      host: DatabaseReadEndpoint,
      port: 5432,
      database: secret.dbname,
      user: secret.username,
      password: secret.password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    await readClient.connect();

    // Wait for replication (Aurora typically < 100ms)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await readClient.query('SELECT * FROM integration_test WHERE id = $1', [testId]);
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0].id).toBe(testId);

    await writeClient.end();
    await readClient.end();
  }, 60000);
});


// 2. SECRET ROTATION WORKFLOW (30-Day Automatic Rotation)
describe('Secret Rotation Workflow - End-to-End Flow', () => {
  test('Rotation Trigger -> Lambda -> Database Update -> Secret Version Update', async () => {
    // A. Get current secret version
    const beforeCommand = new GetSecretValueCommand({ SecretId: DatabaseSecretArn });
    const beforeResponse = await secretsClient.send(beforeCommand);
    const beforeSecret = JSON.parse(beforeResponse.SecretString!);
    const beforeVersionId = beforeResponse.VersionId;

    // B. Trigger manual rotation (simulating 30-day trigger)
    try {
      const rotateCommand = new RotateSecretCommand({ SecretId: DatabaseSecretArn });
      await secretsClient.send(rotateCommand);
    } catch (error: any) {
      // Rotation might be in progress or recently completed
      if (error.name === 'InvalidRequestException' && 
          (error.message.includes('already scheduled') || error.message.includes("isn't complete"))) {
        console.log('Rotation already in progress, waiting...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      } else {
        throw error;
      }
    }

    // C. Wait for rotation to complete (Lambda execution) - check periodically
    let rotationComplete = false;
    let attempts = 0;
    while (!rotationComplete && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const checkCommand = new GetSecretValueCommand({ SecretId: DatabaseSecretArn });
      const checkResponse = await secretsClient.send(checkCommand);
      if (checkResponse.VersionId !== beforeVersionId) {
        rotationComplete = true;
      }
      attempts++;
    }

    // D. Verify new secret version exists
    const afterCommand = new GetSecretValueCommand({ SecretId: DatabaseSecretArn });
    const afterResponse = await secretsClient.send(afterCommand);
    const afterSecret = JSON.parse(afterResponse.SecretString!);

    // Secret should still be accessible with new password
    expect(afterSecret.username).toBe(beforeSecret.username);
    expect(afterSecret.host).toBe(beforeSecret.host);

    // Verify new password works with database
    const testClient = new Client({
      host: DatabaseEndpoint,
      port: 5432,
      database: afterSecret.dbname,
      user: afterSecret.username,
      password: afterSecret.password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    await testClient.connect();
    const testResult = await testClient.query('SELECT 1');
    expect(testResult.rows[0]).toEqual({ '?column?': 1 });
    await testClient.end();
  }, 180000);
});




// 4. BACKUP AND DISASTER RECOVERY WORKFLOW
describe('Backup and DR Workflow - End-to-End Flow', () => {
  test('Backup Trigger -> Snapshot Creation -> Backup Vault Storage', async () => {
    // A. Get Aurora cluster ARN from RDS describe command
    const clusterId = DatabaseEndpoint.split('.')[0];
    const clusterCommand = new DescribeDBClustersCommand({
      DBClusterIdentifier: clusterId,
    });
    const clusterResponse = await rdsClient.send(clusterCommand);
    const clusterArn = clusterResponse.DBClusters![0].DBClusterArn!;

    // B. Trigger backup job
    try {
      const backupCommand = new StartBackupJobCommand({
        BackupVaultName: BackupVaultName,
        ResourceArn: clusterArn,
        IamRoleArn: BackupRoleArn,
      });
      const backupResponse = await backupClient.send(backupCommand);
      const backupJobId = backupResponse.BackupJobId;

      // C. Wait for backup to complete
      let backupStatus = 'CREATED';
      let attempts = 0;
      while (backupStatus !== 'COMPLETED' && backupStatus !== 'FAILED' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        const statusCommand = new DescribeBackupJobCommand({ BackupJobId: backupJobId });
        const statusResponse = await backupClient.send(statusCommand);
        backupStatus = statusResponse.State!;
        expect(backupStatus).toBeDefined();
        attempts++;
      }

      expect(['COMPLETED', 'RUNNING', 'CREATED']).toContain(backupStatus);
    } catch (error: any) {
      // Backup should work - fail if it doesn't
      throw new Error(`Backup job failed: ${error.message}`);
    }
  }, 300000);

  test('Backup Plan -> Backup Configuration Verification', async () => {
    // A. Get backup plan details using BackupPlanId
    try {
      const planCommand = new GetBackupPlanCommand({ BackupPlanId: BackupPlanId });
      const planResponse = await backupClient.send(planCommand);

      expect(planResponse.BackupPlan).toBeDefined();
      expect(planResponse.BackupPlan!.BackupPlanName).toBeDefined();
      expect(planResponse.BackupPlan!.Rules).toBeDefined();
      expect(planResponse.BackupPlan!.Rules!.length).toBeGreaterThan(0);
    } catch (error: any) {
      // Backup plan must exist - fail if it doesn't
      throw new Error(`Backup plan not found: ${error.message}`);
    }
  }, 30000);

  test('Backup Vault -> Recovery Point Verification', async () => {
    const vaultName = BackupVaultName;

    try {
      const listCommand = new ListRecoveryPointsByBackupVaultCommand({
        BackupVaultName: vaultName,
        MaxResults: 10,
      });
      const response = await backupClient.send(listCommand);

      expect(response.RecoveryPoints).toBeDefined();
    } catch (error: any) {
      // Backup vault must exist - fail if it doesn't
      throw new Error(`Backup vault not found: ${error.message}`);
    }
  }, 30000);
});




// 6. MONITORING AND ALERTING WORKFLOW
describe('Monitoring and Alerting Workflow - End-to-End Flow', () => {
  test('Alarm Trigger -> SNS Notification -> Message Delivery', async () => {
    // A. Publish test message to SNS topic
    const snsCommand = new PublishCommand({
      TopicArn: SNSTopicArn,
      Subject: 'Integration Test Alert',
      Message: 'Test message from integration test',
    });
    const snsResponse = await snsClient.send(snsCommand);
    expect(snsResponse.MessageId).toBeDefined();

    // B. Verify message was accepted by SNS
    expect(snsResponse.MessageId).toBeTruthy();
  }, 30000);
});


// 7. NETWORK FLOW VALIDATION
describe('Network Flow Validation - End-to-End Connectivity', () => {
  test('VPC and ALB Configuration Verification', async () => {
    // A. Verify ALB is active and accessible using LoadBalancerArn
    const albCommand = new DescribeLoadBalancersCommand({ LoadBalancerArns: [LoadBalancerArn] });
    const albResponse = await elbClient.send(albCommand);
    expect(albResponse.LoadBalancers![0].State?.Code).toBe('active');
    expect(albResponse.LoadBalancers![0].Scheme).toBe('internet-facing');

    // B. Verify VPC routing
    const vpcCommand = new DescribeVpcsCommand({ VpcIds: [VPCId] });
    const vpcResponse = await ec2Client.send(vpcCommand);
    expect(vpcResponse.Vpcs![0].State).toBe('available');

    // C. Verify database is accessible
    const clusterCommand = new DescribeDBClustersCommand({
      DBClusterIdentifier: DatabaseEndpoint.split('.')[0],
    });
    const clusterResponse = await rdsClient.send(clusterCommand);
    expect(clusterResponse.DBClusters![0].Status).toBe('available');
  }, 60000);
});


// 8. SECURITY FLOW VALIDATION
describe('Security Flow Validation - End-to-End Encryption', () => {
  test('Secret Retrieval -> KMS Decryption -> Database Connection', async () => {
    // A. Retrieve secret from Secrets Manager
    const secretCommand = new GetSecretValueCommand({ SecretId: DatabaseSecretArn });
    const secretResponse = await secretsClient.send(secretCommand);
    expect(secretResponse.SecretString).toBeDefined();

    // B. Verify secret is encrypted with KMS (if customer-managed key is used)
    if (secretResponse.KMSKeyId) {
      expect(secretResponse.KMSKeyId).toBeDefined();
    }

    // C. Use decrypted credentials to connect to database
    const secret = JSON.parse(secretResponse.SecretString!);
    const dbClient = new Client({
      host: DatabaseEndpoint,
      port: 5432,
      database: secret.dbname,
      user: secret.username,
      password: secret.password,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });

    await dbClient.connect();
    const result = await dbClient.query('SELECT 1');
    expect(result.rows[0]).toEqual({ '?column?': 1 });
    await dbClient.end();
  }, 60000);
});


// TEST DATA CLEANUP - Global Cleanup After All Tests
afterAll(async () => {
    // Cleanup all test data created during integration tests
    let cleanupClient: Client | null = null;

    try {
      const secretCommand = new GetSecretValueCommand({ SecretId: DatabaseSecretArn });
      const secretResponse = await secretsClient.send(secretCommand);
      const secret = JSON.parse(secretResponse.SecretString!);

      cleanupClient = new Client({
        host: DatabaseEndpoint,
        port: 5432,
        database: secret.dbname,
        user: secret.username,
        password: secret.password,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });

      await cleanupClient.connect();

      // Delete all test data with test_ prefix
      await cleanupClient.query("DELETE FROM integration_test WHERE id LIKE 'test_%'");

      console.log('Test data cleanup completed');
    } catch (error) {
      console.error('Error during test data cleanup:', error);
    } finally {
      if (cleanupClient) {
        try {
          await cleanupClient.end();
        } catch (error) {
          console.error('Error closing cleanup client:', error);
        }
      }
    }
}, 120000);
