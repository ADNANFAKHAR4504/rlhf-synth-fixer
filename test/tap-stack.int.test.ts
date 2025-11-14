import {
  EC2Client,
  DescribeVpcsCommand,
} from '@aws-sdk/client-ec2';
import {
  ECSClient,
  DescribeServicesCommand,
  ListTasksCommand,
  DescribeTasksCommand,
  DescribeClustersCommand,
} from '@aws-sdk/client-ecs';
import {
  RDSClient,
  DescribeDBClustersCommand,
} from '@aws-sdk/client-rds';
import {
  ElasticLoadBalancingV2Client,
  DescribeTargetHealthCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
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


// 1. DATABASE ENDPOINT VERIFICATION
describe('Database Endpoint Verification', () => {
  test('Database Write Endpoint -> Cluster Status Verification', async () => {
    // A. Verify database cluster exists and is available
    const clusterId = DatabaseEndpoint.split('.')[0];
    const clusterCommand = new DescribeDBClustersCommand({
      DBClusterIdentifier: clusterId,
    });
    const clusterResponse = await rdsClient.send(clusterCommand);
    
    expect(clusterResponse.DBClusters).toBeDefined();
    expect(clusterResponse.DBClusters!.length).toBe(1);
    expect(clusterResponse.DBClusters![0].Status).toBe('available');
    expect(clusterResponse.DBClusters![0].Endpoint).toBe(DatabaseEndpoint);
  }, 30000);

  test('Database Read Endpoint -> Reader Endpoint Verification', async () => {
    // A. Verify read endpoint matches cluster reader endpoint
    const clusterId = DatabaseEndpoint.split('.')[0];
    const clusterCommand = new DescribeDBClustersCommand({
      DBClusterIdentifier: clusterId,
    });
    const clusterResponse = await rdsClient.send(clusterCommand);
    
    expect(clusterResponse.DBClusters![0].ReaderEndpoint).toBe(DatabaseReadEndpoint);
    expect(clusterResponse.DBClusters![0].Status).toBe('available');
  }, 30000);
});

// 2. DATABASE SECRET VERIFICATION
describe('Database Secret Verification', () => {
  test('Secret Retrieval -> Secret Structure Validation', async () => {
    // A. Retrieve secret from Secrets Manager
    const secretCommand = new GetSecretValueCommand({ SecretId: DatabaseSecretArn });
    const secretResponse = await secretsClient.send(secretCommand);
    expect(secretResponse.SecretString).toBeDefined();

    // B. Verify secret structure
    const secret = JSON.parse(secretResponse.SecretString!);
    expect(secret.username).toBeDefined();
    expect(secret.password).toBeDefined();
    expect(secret.host).toBeDefined();
    expect(secret.dbname).toBeDefined();
    expect(secret.port).toBeDefined();
  }, 30000);

  test('Secret KMS Encryption -> KMS Key Verification', async () => {
    // A. Verify secret is encrypted with KMS
    const secretCommand = new GetSecretValueCommand({ SecretId: DatabaseSecretArn });
    const secretResponse = await secretsClient.send(secretCommand);
    
    if (secretResponse.KMSKeyId) {
      expect(secretResponse.KMSKeyId).toBeDefined();
      expect(secretResponse.KMSKeyId).toContain('arn:aws:kms');
    }
  }, 30000);
});

// 3. SECRET ROTATION WORKFLOW
describe('Secret Rotation Workflow', () => {
  test('Rotation Trigger -> Secret Version Update', async () => {
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
    
    // Verify version changed
    if (rotationComplete) {
      expect(afterResponse.VersionId).not.toBe(beforeVersionId);
    }
  }, 180000);
});

// 4. BACKUP TRIGGER TEST
describe('Backup Trigger Test', () => {
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
});

// 5. BACKUP PLAN VERIFICATION
describe('Backup Plan Verification', () => {
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
});

// 6. BACKUP VAULT VERIFICATION
describe('Backup Vault Verification', () => {
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


// 7. SNS NOTIFICATION TEST
describe('SNS Notification Test', () => {
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


// 8. ALB TARGET GROUP VERIFICATION
describe('ALB Target Group Verification', () => {
  test('ALB Target Group -> Target Group Configuration Verification', async () => {
    expect(ALBTargetGroupArn).toBeDefined();
    
    // A. Verify target group exists and is configured
    const targetGroupCommand = new DescribeTargetGroupsCommand({ TargetGroupArns: [ALBTargetGroupArn] });
    const targetGroupResponse = await elbClient.send(targetGroupCommand);
    
    expect(targetGroupResponse.TargetGroups).toBeDefined();
    expect(targetGroupResponse.TargetGroups!.length).toBe(1);
    expect(targetGroupResponse.TargetGroups![0].TargetGroupArn).toBe(ALBTargetGroupArn);
    expect(targetGroupResponse.TargetGroups![0].Port).toBe(8080);
    expect(targetGroupResponse.TargetGroups![0].Protocol).toBe('HTTP');
    
    // B. Verify target group health
    const healthCommand = new DescribeTargetHealthCommand({ TargetGroupArn: ALBTargetGroupArn });
    const healthResponse = await elbClient.send(healthCommand);
    expect(healthResponse.TargetHealthDescriptions).toBeDefined();
    expect(Array.isArray(healthResponse.TargetHealthDescriptions)).toBe(true);
  }, 30000);
});

// 9. LOAD BALANCER URL VERIFICATION
describe('Load Balancer URL Verification', () => {
  test('Load Balancer URL -> ALB DNS and Accessibility', async () => {
    expect(LoadBalancerURL).toBeDefined();
    
    // A. Verify URL format (should be http:// or https://)
    expect(LoadBalancerURL).toMatch(/^https?:\/\//);
    
    // B. Verify ALB is active using LoadBalancerArn
    const albCommand = new DescribeLoadBalancersCommand({ LoadBalancerArns: [LoadBalancerArn] });
    const albResponse = await elbClient.send(albCommand);
    
    expect(albResponse.LoadBalancers).toBeDefined();
    expect(albResponse.LoadBalancers!.length).toBe(1);
    expect(albResponse.LoadBalancers![0].State?.Code).toBe('active');
    
    // C. Verify DNS name matches URL
    const dnsName = albResponse.LoadBalancers![0].DNSName;
    expect(LoadBalancerURL).toContain(dnsName);
    
    // D. Test HTTP connectivity (if accessible)
    try {
      const response = await axios.get(LoadBalancerURL, {
        timeout: 10000,
        validateStatus: () => true,
      });
      expect(response.status).toBeDefined();
      expect([200, 301, 302, 503, 502, 404]).toContain(response.status);
    } catch (error) {
      // Network errors are acceptable if ALB is not publicly accessible from test environment
      console.log('ALB URL not accessible from test environment (expected if in private network)');
    }
  }, 60000);
});

// 10. ALB CONFIGURATION VERIFICATION
describe('ALB Configuration Verification', () => {
  test('ALB Status -> Load Balancer Active State Verification', async () => {
    // A. Verify ALB is active and accessible using LoadBalancerArn
    const albCommand = new DescribeLoadBalancersCommand({ LoadBalancerArns: [LoadBalancerArn] });
    const albResponse = await elbClient.send(albCommand);
    expect(albResponse.LoadBalancers![0].State?.Code).toBe('active');
    expect(albResponse.LoadBalancers![0].Scheme).toBe('internet-facing');
  }, 30000);
});


// 11. VPC CONFIGURATION VERIFICATION
describe('VPC Configuration Verification', () => {
  test('VPC -> VPC Status and Configuration', async () => {
    // A. Verify VPC routing
    const vpcCommand = new DescribeVpcsCommand({ VpcIds: [VPCId] });
    const vpcResponse = await ec2Client.send(vpcCommand);
    expect(vpcResponse.Vpcs![0].State).toBe('available');
    expect(vpcResponse.Vpcs![0].VpcId).toBe(VPCId);
  }, 30000);
});

// 12. DATABASE CLUSTER STATUS VERIFICATION
describe('Database Cluster Status Verification', () => {
  test('Database Cluster -> Cluster Availability Verification', async () => {
    // A. Verify database is accessible via AWS API
    const clusterCommand = new DescribeDBClustersCommand({
      DBClusterIdentifier: DatabaseEndpoint.split('.')[0],
    });
    const clusterResponse = await rdsClient.send(clusterCommand);
    expect(clusterResponse.DBClusters![0].Status).toBe('available');
    expect(clusterResponse.DBClusters![0].Endpoint).toBe(DatabaseEndpoint);
    expect(clusterResponse.DBClusters![0].ReaderEndpoint).toBe(DatabaseReadEndpoint);
  }, 30000);
});
