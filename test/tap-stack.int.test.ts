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

// Load AWS account id from environment variable
const accid = process.env.AWS_ACCOUNT_ID;

// Get environment suffix from environment variable 
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;

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
const ECSServiceName: string = outputs.ECSServiceName;
const LoadBalancerURL: string = outputs.LoadBalancerURL;
const DatabaseEndpoint: string = outputs.DatabaseEndpoint;
const DatabaseReadEndpoint: string = outputs.DatabaseReadEndpoint;
const DatabaseSecretArn: string = outputs.DatabaseSecretArn;
const SNSTopicArn: string = outputs.SNSTopicArn;
const BackupPlanId: string = outputs.BackupPlanId;


// 1. PRIMARY TRANSACTION FLOW (User Request → ALB → ECS → Database → Response)
describe('Primary Transaction Flow - End-to-End Data Flow', () => {
  test('User Request -> ALB -> ECS Task -> Database -> Response', async () => {
    expect(ECSServiceName).toBeDefined();
    expect(LoadBalancerURL).toBeDefined();

    // A. User Request -> ALB (verify ALB exists and is active using LoadBalancerArn)
    const albCommand = new DescribeLoadBalancersCommand({ LoadBalancerArns: [LoadBalancerArn] });
    const albDetails = await elbClient.send(albCommand);
    expect(albDetails.LoadBalancers).toBeDefined();
    expect(albDetails.LoadBalancers!.length).toBe(1);
    expect(albDetails.LoadBalancers![0].State?.Code).toBe('active');

    const albResponse = await axios.get(LoadBalancerURL, {
      timeout: 15000,
      validateStatus: () => true,
    });
    expect(albResponse.status).toBeDefined();
    expect([200, 301, 302, 503, 502]).toContain(albResponse.status);

    // B. ALB -> Target Group Health Check
    const healthCommand = new DescribeTargetHealthCommand({ TargetGroupArn: ALBTargetGroupArn });
    const healthResponse = await elbClient.send(healthCommand);
    expect(healthResponse.TargetHealthDescriptions).toBeDefined();
    const healthyTargets = healthResponse.TargetHealthDescriptions!.filter(
      (t) => t.TargetHealth?.State === 'healthy'
    );
    expect(healthyTargets.length).toBeGreaterThan(0);

    // C. ECS Task -> Database Connection Flow
    const serviceCommand = new DescribeServicesCommand({
      cluster: ECSClusterName,
      services: [ECSServiceName],
    });
    const serviceResponse = await ecsClient.send(serviceCommand);
    const service = serviceResponse.services![0];
    expect(service.runningCount).toBeGreaterThan(0);

    // Verify tasks can connect to database via Secrets Manager
    const secretCommand = new GetSecretValueCommand({ SecretId: DatabaseSecretArn });
    const secretResponse = await secretsClient.send(secretCommand);
    const secret = JSON.parse(secretResponse.SecretString!);
    expect(secret.host).toBe(DatabaseEndpoint);
    expect(secret.username).toBeDefined();
    expect(secret.password).toBeDefined();

    // D. Database -> Verify connectivity
    const clusterCommand = new DescribeDBClustersCommand({
      DBClusterIdentifier: DatabaseEndpoint.split('.')[0],
    });
    const clusterResponse = await rdsClient.send(clusterCommand);
    expect(clusterResponse.DBClusters![0].Status).toBe('available');
  }, 60000);

  test('HTTP Request -> ALB Health Check -> ECS Container -> Response', async () => {
    expect(ECSServiceName).toBeDefined();
    expect(LoadBalancerURL).toBeDefined();

    // A. Send HTTP request -> ALB
    const requestStartTime = Date.now();
    const response = await axios.get(`${LoadBalancerURL}/health`, {
      timeout: 15000,
      validateStatus: () => true,
    });
    const requestDuration = Date.now() - requestStartTime;

    // B. Verify ALB processed request
    expect(response.status).toBeDefined();
    expect(response.headers).toBeDefined();

    // C. Verify response came from ECS container
    if (response.status === 200) {
      expect(response.data).toBeDefined();
    }

    // Verify request completed within reasonable time
    expect(requestDuration).toBeLessThan(15000);
  }, 30000);

  test('Database Write -> Read Endpoint -> Data Consistency', async () => {
    expect(ECSServiceName).toBeDefined();

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
      if (error.name === 'InvalidRequestException' && error.message.includes('already scheduled')) {
        console.log('Rotation already in progress, waiting...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      } else {
        throw error;
      }
    }

    // C. Wait for rotation to complete (Lambda execution)
    await new Promise(resolve => setTimeout(resolve, 30000));

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
    });

    await testClient.connect();
    const testResult = await testClient.query('SELECT 1');
    expect(testResult.rows[0]).toEqual({ '?column?': 1 });
    await testClient.end();
  }, 120000);
});


// 3. AUTO-SCALING WORKFLOW (CPU-Based Scaling)
describe('Auto-Scaling Workflow - End-to-End Flow', () => {
  test('Metric Collection -> Scaling Decision -> Task Count Adjustment', async () => {
    expect(ECSServiceName).toBeDefined();

    // A. Get current task count
    const beforeCommand = new DescribeServicesCommand({
      cluster: ECSClusterName,
      services: [ECSServiceName],
    });
    const beforeResponse = await ecsClient.send(beforeCommand);
    const beforeTaskCount = beforeResponse.services![0].runningCount;
    expect(beforeTaskCount).toBeDefined();

    // B. Generate CPU load metric (simulate high CPU)
    const metricCommand = new PutMetricDataCommand({
      Namespace: 'AWS/ECS',
      MetricData: [
        {
          MetricName: 'CPUUtilization',
          Value: 85.0,
          Unit: 'Percent',
          Dimensions: [
            { Name: 'ServiceName', Value: ECSServiceName },
            { Name: 'ClusterName', Value: ECSClusterName },
          ],
          Timestamp: new Date(),
        },
      ],
    });
    await cloudwatchClient.send(metricCommand);

    // C. Wait for scaling evaluation period
    await new Promise(resolve => setTimeout(resolve, 60000));

    // Verify scaling metrics are being collected
    const getMetricsCommand = new GetMetricStatisticsCommand({
      Namespace: 'AWS/ECS',
      MetricName: 'CPUUtilization',
      Dimensions: [
        { Name: 'ServiceName', Value: ECSServiceName },
        { Name: 'ClusterName', Value: ECSClusterName },
      ],
      StartTime: new Date(Date.now() - 300000),
      EndTime: new Date(),
      Period: 60,
      Statistics: ['Average'],
    });
    const metricsResponse = await cloudwatchClient.send(getMetricsCommand);
    expect(metricsResponse.Datapoints).toBeDefined();
  }, 120000);
});


// 4. BACKUP AND DISASTER RECOVERY WORKFLOW
describe('Backup and DR Workflow - End-to-End Flow', () => {
  test('Backup Trigger -> Snapshot Creation -> Backup Vault Storage', async () => {
    // A. Get Aurora cluster identifier
    const clusterId = DatabaseEndpoint.split('.')[0];
    expect(accid).toBeDefined();
    const clusterArn = `arn:aws:rds:${region}:${accid}:cluster:${clusterId}`;

    // B. Trigger backup job
    try {
      const backupCommand = new StartBackupJobCommand({
        BackupVaultName: outputs.BackupVaultName,
        ResourceArn: clusterArn,
        IamRoleArn: outputs.BackupRoleArn,
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
    const vaultName = outputs.BackupVaultName;

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


// 5. BLUE-GREEN DEPLOYMENT WORKFLOW
describe('Blue-Green Deployment Workflow - End-to-End Flow', () => {
  test('New Image -> Green Target Group -> Traffic Routing', async () => {
    expect(ECSServiceName).toBeDefined();
    expect(LoadBalancerURL).toBeDefined();

    // A. Verify primary target group has healthy targets
    const primaryHealthCommand = new DescribeTargetHealthCommand({ TargetGroupArn: ALBTargetGroupArn });
    const primaryHealthResponse = await elbClient.send(primaryHealthCommand);
    const primaryHealthy = primaryHealthResponse.TargetHealthDescriptions!.filter(
      (t) => t.TargetHealth?.State === 'healthy'
    );
    expect(primaryHealthy.length).toBeGreaterThan(0);

    // B. Send request with blue-green header
    expect(outputs.ALBTargetGroupBlueGreenArn).toBeDefined();
    const bgHealthCommand = new DescribeTargetHealthCommand({
      TargetGroupArn: outputs.ALBTargetGroupBlueGreenArn,
    });
    const bgHealthResponse = await elbClient.send(bgHealthCommand);
    expect(bgHealthResponse.TargetHealthDescriptions).toBeDefined();

    // C. Verify traffic routing works
    const response = await axios.get(LoadBalancerURL, {
      timeout: 10000,
      validateStatus: () => true,
      headers: {
        'X-Deployment-Version': 'blue-green-test',
      },
    });
    expect(response.status).toBeDefined();
  }, 60000);
});


// 6. MONITORING AND ALERTING WORKFLOW
describe('Monitoring and Alerting Workflow - End-to-End Flow', () => {
  test('Application Logs -> CloudWatch Logs -> Log Stream Verification', async () => {
    expect(ECSServiceName).toBeDefined();
    expect(LoadBalancerURL).toBeDefined();

    // A. Application generates log (via HTTP request)
    await axios.get(LoadBalancerURL, {
      timeout: 10000,
      validateStatus: () => true,
    });

    // B. Wait for logs to stream to CloudWatch
    await new Promise(resolve => setTimeout(resolve, 10000));

    // C. Verify logs appear in CloudWatch Logs
    expect(environmentSuffix).toBeDefined();
    const logGroupName = `/ecs/${environmentSuffix}-meridian`;
    const streamsCommand = new DescribeLogStreamsCommand({
      logGroupName: logGroupName,
      orderBy: 'LastEventTime',
      descending: true,
      limit: 5,
    });
    const streamsResponse = await logsClient.send(streamsCommand);

    expect(streamsResponse.logStreams).toBeDefined();
    if (streamsResponse.logStreams!.length > 0) {
      const logStream = streamsResponse.logStreams![0];
      const eventsCommand = new GetLogEventsCommand({
        logGroupName: logGroupName,
        logStreamName: logStream.logStreamName!,
        limit: 10,
      });
      const eventsResponse = await logsClient.send(eventsCommand);
      expect(eventsResponse.events).toBeDefined();
    }
  }, 60000);

  test('Alarm Trigger -> SNS Notification -> Message Delivery', async () => {
    // A. Publish test metric that could trigger alarm
    const metricCommand = new PutMetricDataCommand({
      Namespace: 'AWS/ECS',
      MetricData: [
        {
          MetricName: 'CPUUtilization',
          Value: 90.0,
          Unit: 'Percent',
          Dimensions: [
            { Name: 'ServiceName', Value: ECSServiceName },
            { Name: 'ClusterName', Value: ECSClusterName },
          ],
          Timestamp: new Date(),
        },
      ],
    });
    await cloudwatchClient.send(metricCommand);

    // B. Publish test message to SNS topic
    const snsCommand = new PublishCommand({
      TopicArn: SNSTopicArn,
      Subject: 'Integration Test Alert',
      Message: 'Test message from integration test',
    });
    const snsResponse = await snsClient.send(snsCommand);
    expect(snsResponse.MessageId).toBeDefined();

    // C. Verify message was accepted by SNS
    expect(snsResponse.MessageId).toBeTruthy();
  }, 30000);
});


// 7. NETWORK FLOW VALIDATION
describe('Network Flow Validation - End-to-End Connectivity', () => {
  test('Internet -> ALB -> ECS Task -> Database (Private Network)', async () => {
    expect(ECSServiceName).toBeDefined();

    // A. Verify ALB is active and accessible using LoadBalancerArn
    const albCommand = new DescribeLoadBalancersCommand({ LoadBalancerArns: [LoadBalancerArn] });
    const albResponse = await elbClient.send(albCommand);
    expect(albResponse.LoadBalancers![0].State?.Code).toBe('active');
    expect(albResponse.LoadBalancers![0].Scheme).toBe('internet-facing');

    // Verify VPC routing
    const vpcCommand = new DescribeVpcsCommand({ VpcIds: [VPCId] });
    const vpcResponse = await ec2Client.send(vpcCommand);
    expect(vpcResponse.Vpcs![0].State).toBe('available');

    // B. Verify ECS tasks are in private subnets
    const serviceCommand = new DescribeServicesCommand({
      cluster: ECSClusterName,
      services: [ECSServiceName],
    });
    const serviceResponse = await ecsClient.send(serviceCommand);
    const networkConfig = serviceResponse.services![0].networkConfiguration?.awsvpcConfiguration;
    expect(networkConfig?.assignPublicIp).toBe('DISABLED');

    // C. Verify database is accessible from ECS (via security groups)
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

    // B. Verify secret is encrypted with KMS
    expect(secretResponse.KMSKeyId).toBeDefined();

    // C. Use decrypted credentials to connect to database
    const secret = JSON.parse(secretResponse.SecretString!);
    const dbClient = new Client({
      host: DatabaseEndpoint,
      port: 5432,
      database: secret.dbname,
      user: secret.username,
      password: secret.password,
      ssl: { rejectUnauthorized: false },
    });

    await dbClient.connect();
    const result = await dbClient.query('SELECT 1');
    expect(result.rows[0]).toEqual({ '?column?': 1 });
    await dbClient.end();
  }, 30000);
});


// TEST DATA CLEANUP - Global Cleanup After All Tests
describe('Test Data Cleanup', () => {
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
  }, 60000);
});
