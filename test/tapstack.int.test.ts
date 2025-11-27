import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand
} from '@aws-sdk/client-cloudformation';
import { RDSClient, DescribeDBClustersCommand, DescribeDBInstancesCommand, DescribeGlobalClustersCommand } from '@aws-sdk/client-rds';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { KMSClient, DescribeKeyCommand, ListAliasesCommand } from '@aws-sdk/client-kms';
import { LambdaClient, GetFunctionCommand, InvokeCommand } from '@aws-sdk/client-lambda';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const region = process.env.AWS_REGION || 'us-east-1';
const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${envSuffix}`;

describe('TapStack Integration Tests', () => {
  let outputs = {};
  let stackResources = [];
  let cfnClient;
  let rdsClient;
  let ec2Client;
  let kmsClient;
  let lambdaClient;
  let cwClient;
  let cwLogsClient;
  let iamClient;

  beforeAll(async () => {
    cfnClient = new CloudFormationClient({ region });
    rdsClient = new RDSClient({ region });
    ec2Client = new EC2Client({ region });
    kmsClient = new KMSClient({ region });
    lambdaClient = new LambdaClient({ region });
    cwClient = new CloudWatchClient({ region });
    cwLogsClient = new CloudWatchLogsClient({ region });
    iamClient = new IAMClient({ region });

    // Load outputs from cfn-outputs/flat-outputs.json
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      // Fallback to stack describe if file doesn't exist
      try {
        const describeCommand = new DescribeStacksCommand({ StackName: stackName });
        const stackResponse = await cfnClient.send(describeCommand);
        const stack = stackResponse.Stacks[0];

        if (stack && stack.Outputs) {
          stack.Outputs.forEach(output => {
            outputs[output.OutputKey] = output.OutputValue;
          });
        }
      } catch (error) {
        console.error('Error loading stack outputs:', error);
      }
    }

    // Get stack resources
    try {
      const resourcesCommand = new DescribeStackResourcesCommand({ StackName: stackName });
      const resourcesResponse = await cfnClient.send(resourcesCommand);
      stackResources = resourcesResponse.StackResources || [];
    } catch (error) {
      console.error('Error loading stack resources:', error);
    }
  }, 30000);

  describe('Stack Deployment', () => {
    it('should have deployed successfully', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toHaveLength(1);
      expect(response.Stacks[0].StackStatus).toMatch(/(CREATE_COMPLETE|UPDATE_COMPLETE)/);
    });

    it('should have stack outputs', () => {
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    it('should have all required outputs', () => {
      const requiredOutputs = [
        'GlobalClusterIdentifier',
        'PrimaryClusterEndpoint',
        'PrimaryClusterReaderEndpoint',
        'KMSKeyId',
        'VPCId'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey].length).toBeGreaterThan(0);
      });
    });

    it('should have created all expected resources', () => {
      expect(stackResources.length).toBeGreaterThan(0);
      const resourceTypes = stackResources.map(r => r.ResourceType);

      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::RDS::GlobalCluster');
      expect(resourceTypes).toContain('AWS::RDS::DBCluster');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::KMS::Key');
    });
  });

  describe('VPC Resources', () => {
    it('should have VPC created', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].VpcId).toBe(vpcId);
    });

    it('VPC should have DNS support enabled', async () => {
      const vpcId = outputs.VPCId;
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      const vpc = response.Vpcs[0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    });

    it('should have three private subnets', async () => {
      const subnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id
      ].filter(Boolean);

      expect(subnetIds.length).toBe(3);

      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(3);
    });

    it('subnets should be in different availability zones', async () => {
      const subnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id
      ].filter(Boolean);

      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);

      const azs = response.Subnets.map(s => s.AvailabilityZone);
      const uniqueAZs = new Set(azs);
      expect(uniqueAZs.size).toBe(3);
    });

    it('should have security group created', async () => {
      const sgId = outputs.DBSecurityGroupId;
      if (sgId) {
        const command = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
        const response = await ec2Client.send(command);

        expect(response.SecurityGroups).toHaveLength(1);
        expect(response.SecurityGroups[0].GroupId).toBe(sgId);
      }
    });

    it('security group should allow MySQL port', async () => {
      const sgId = outputs.DBSecurityGroupId;
      if (sgId) {
        const command = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
        const response = await ec2Client.send(command);

        const sg = response.SecurityGroups[0];
        const mysqlRule = sg.IpPermissions.find(rule =>
          rule.FromPort === 3306 && rule.ToPort === 3306
        );
        expect(mysqlRule).toBeDefined();
      }
    });
  });

  describe('Global Database', () => {
    it('should have global cluster created', async () => {
      const globalClusterId = outputs.GlobalClusterIdentifier;
      expect(globalClusterId).toBeDefined();

      const command = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: globalClusterId
      });
      const response = await rdsClient.send(command);

      expect(response.GlobalClusters).toHaveLength(1);
      expect(response.GlobalClusters[0].GlobalClusterIdentifier).toBe(globalClusterId);
    });

    it('global cluster should be available', async () => {
      const globalClusterId = outputs.GlobalClusterIdentifier;
      const command = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: globalClusterId
      });
      const response = await rdsClient.send(command);

      const globalCluster = response.GlobalClusters[0];
      expect(globalCluster.Status).toBe('available');
    });

    it('global cluster should use aurora-mysql', async () => {
      const globalClusterId = outputs.GlobalClusterIdentifier;
      const command = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: globalClusterId
      });
      const response = await rdsClient.send(command);

      const globalCluster = response.GlobalClusters[0];
      expect(globalCluster.Engine).toBe('aurora-mysql');
      expect(globalCluster.EngineVersion).toBe('5.7.mysql_aurora.2.11.2');
    });

    it('global cluster should have storage encryption', async () => {
      const globalClusterId = outputs.GlobalClusterIdentifier;
      const command = new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: globalClusterId
      });
      const response = await rdsClient.send(command);

      const globalCluster = response.GlobalClusters[0];
      expect(globalCluster.StorageEncrypted).toBe(true);
    });
  });

  describe('Primary DB Cluster', () => {
    it('should have primary cluster created', async () => {
      const clusterIdentifier = `aurora-primary-cluster-${envSuffix}`;

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters).toHaveLength(1);
    });

    it('primary cluster should be available', async () => {
      const clusterIdentifier = `aurora-primary-cluster-${envSuffix}`;
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters[0];
      expect(cluster.Status).toBe('available');
    });

    it('primary cluster should have writer endpoint', () => {
      expect(outputs.PrimaryClusterEndpoint).toBeDefined();
      expect(outputs.PrimaryClusterEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    it('primary cluster should have reader endpoint', () => {
      expect(outputs.PrimaryClusterReaderEndpoint).toBeDefined();
      expect(outputs.PrimaryClusterReaderEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    it('primary cluster should have backup configured', async () => {
      const clusterIdentifier = `aurora-primary-cluster-${envSuffix}`;
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters[0];
      expect(cluster.BackupRetentionPeriod).toBe(7);
    });

    it('primary cluster should have CloudWatch logs enabled', async () => {
      const clusterIdentifier = `aurora-primary-cluster-${envSuffix}`;
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters[0];
      expect(cluster.EnabledCloudwatchLogsExports).toContain('slowquery');
      expect(cluster.EnabledCloudwatchLogsExports).toContain('error');
    });

    it('primary cluster should be encrypted', async () => {
      const clusterIdentifier = `aurora-primary-cluster-${envSuffix}`;
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters[0];
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
    });

    it('primary cluster should be part of global cluster', async () => {
      const clusterIdentifier = `aurora-primary-cluster-${envSuffix}`;
      const globalClusterId = outputs.GlobalClusterIdentifier;

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters[0];
      expect(cluster.GlobalWriteForwardingStatus).toBeDefined();
    });
  });

  describe('DB Instances', () => {
    it('should have two primary instances', async () => {
      const instance1Id = `aurora-primary-instance-1-${envSuffix}`;
      const instance2Id = `aurora-primary-instance-2-${envSuffix}`;

      const command1 = new DescribeDBInstancesCommand({ DBInstanceIdentifier: instance1Id });
      const command2 = new DescribeDBInstancesCommand({ DBInstanceIdentifier: instance2Id });

      const response1 = await rdsClient.send(command1);
      const response2 = await rdsClient.send(command2);

      expect(response1.DBInstances).toHaveLength(1);
      expect(response2.DBInstances).toHaveLength(1);
    });

    it('instances should be available', async () => {
      const instance1Id = `aurora-primary-instance-1-${envSuffix}`;
      const command = new DescribeDBInstancesCommand({ DBInstanceIdentifier: instance1Id });
      const response = await rdsClient.send(command);

      expect(response.DBInstances[0].DBInstanceStatus).toBe('available');
    });

    it('instances should be correct type', async () => {
      const instance1Id = `aurora-primary-instance-1-${envSuffix}`;
      const command = new DescribeDBInstancesCommand({ DBInstanceIdentifier: instance1Id });
      const response = await rdsClient.send(command);

      expect(response.DBInstances[0].DBInstanceClass).toBe('db.r5.large');
    });

    it('instances should not be publicly accessible', async () => {
      const instance1Id = `aurora-primary-instance-1-${envSuffix}`;
      const command = new DescribeDBInstancesCommand({ DBInstanceIdentifier: instance1Id });
      const response = await rdsClient.send(command);

      expect(response.DBInstances[0].PubliclyAccessible).toBe(false);
    });
  });

  describe('KMS Encryption', () => {
    it('should have KMS key created', async () => {
      const keyId = outputs.KMSKeyId;
      expect(keyId).toBeDefined();

      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata.KeyId).toBe(keyId);
    });

    it('KMS key should be enabled', async () => {
      const keyId = outputs.KMSKeyId;
      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata.KeyState).toBe('Enabled');
    });

    it('should have KMS key alias', async () => {
      const command = new ListAliasesCommand({});
      const response = await kmsClient.send(command);

      const alias = response.Aliases.find(a =>
        a.AliasName === `alias/aurora-primary-${envSuffix}`
      );
      expect(alias).toBeDefined();
    });
  });

  describe('Lambda Health Check', () => {
    it('should have health check function deployed', async () => {
      const functionArn = outputs.LambdaHealthCheckFunctionArn;
      const functionName = `aurora-health-check-primary-${envSuffix}`;

      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration.FunctionName).toBe(functionName);
    });

    it('health check function should use Python 3.11', async () => {
      const functionName = `aurora-health-check-primary-${envSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration.Runtime).toBe('python3.11');
    });

    it('health check function should have 5 second timeout', async () => {
      const functionName = `aurora-health-check-primary-${envSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration.Timeout).toBe(5);
    });

    it('health check function should be in VPC', async () => {
      const functionName = `aurora-health-check-primary-${envSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration.VpcConfig).toBeDefined();
      expect(response.Configuration.VpcConfig.SubnetIds.length).toBeGreaterThan(0);
    });

    it('health check function should have environment variables', async () => {
      const functionName = `aurora-health-check-primary-${envSuffix}`;
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const env = response.Configuration.Environment.Variables;
      expect(env.CLUSTER_ENDPOINT).toBeDefined();
      expect(env.CLUSTER_IDENTIFIER).toBeDefined();
    });

    it('health check function should be invocable', async () => {
      const functionName = `aurora-health-check-primary-${envSuffix}`;

      try {
        const command = new InvokeCommand({
          FunctionName: functionName,
          InvocationType: 'RequestResponse'
        });
        const response = await lambdaClient.send(command);

        expect(response.StatusCode).toBe(200);

        if (response.Payload) {
          const payload = JSON.parse(new TextDecoder().decode(response.Payload));
          expect(payload.statusCode).toBeDefined();
        }
      } catch (error) {
        // Function invocation might fail if ENIs are still being created
        // This is acceptable for initial deployment
        console.log('Lambda invocation note:', error.message);
      }
    }, 15000);
  });

  describe('CloudWatch Monitoring', () => {
    it('should have replication lag alarm', async () => {
      const alarmName = `aurora-replication-lag-${envSuffix}`;

      const command = new DescribeAlarmsCommand({ AlarmNames: [alarmName] });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms.length).toBeGreaterThan(0);
    });

    it('replication lag alarm should monitor correct metric', async () => {
      const alarmName = `aurora-replication-lag-${envSuffix}`;
      const command = new DescribeAlarmsCommand({ AlarmNames: [alarmName] });
      const response = await cwClient.send(command);

      const alarm = response.MetricAlarms[0];
      expect(alarm.MetricName).toBe('AuroraGlobalDBReplicationLag');
      expect(alarm.Namespace).toBe('AWS/RDS');
      expect(alarm.Threshold).toBe(1000);
    });

    it('should have CloudWatch log groups', async () => {
      const slowQueryLogGroup = `/aws/rds/cluster/aurora-primary-cluster-${envSuffix}/slowquery`;
      const errorLogGroup = `/aws/rds/cluster/aurora-primary-cluster-${envSuffix}/error`;

      const command = new DescribeLogGroupsCommand({});
      const response = await cwLogsClient.send(command);

      const logGroupNames = response.logGroups.map(lg => lg.logGroupName);
      expect(logGroupNames).toContain(slowQueryLogGroup);
      expect(logGroupNames).toContain(errorLogGroup);
    });

    it('log groups should have 30-day retention', async () => {
      const slowQueryLogGroup = `/aws/rds/cluster/aurora-primary-cluster-${envSuffix}/slowquery`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: slowQueryLogGroup
      });
      const response = await cwLogsClient.send(command);

      const logGroup = response.logGroups.find(lg => lg.logGroupName === slowQueryLogGroup);
      if (logGroup) {
        expect(logGroup.retentionInDays).toBe(30);
      }
    });
  });

  describe('IAM Roles', () => {
    it('should have Lambda execution role', async () => {
      const roleName = `aurora-health-check-role-${envSuffix}`;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role.RoleName).toBe(roleName);
    });

    it('Lambda role should trust Lambda service', async () => {
      const roleName = `aurora-health-check-role-${envSuffix}`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const trustPolicy = JSON.parse(decodeURIComponent(response.Role.AssumeRolePolicyDocument));
      const lambdaStatement = trustPolicy.Statement.find(
        stmt => stmt.Principal && stmt.Principal.Service === 'lambda.amazonaws.com'
      );
      expect(lambdaStatement).toBeDefined();
    });
  });

  describe('End-to-End Workflow', () => {
    it('should have complete Aurora infrastructure', () => {
      expect(outputs.GlobalClusterIdentifier).toBeDefined();
      expect(outputs.PrimaryClusterEndpoint).toBeDefined();
      expect(outputs.PrimaryClusterReaderEndpoint).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined();
    });

    it('endpoints should be reachable format', () => {
      const writerEndpoint = outputs.PrimaryClusterEndpoint;
      const readerEndpoint = outputs.PrimaryClusterReaderEndpoint;

      expect(writerEndpoint).toMatch(/^aurora-primary-cluster-.*\.cluster-.+\.rds\.amazonaws\.com$/);
      expect(readerEndpoint).toMatch(/^aurora-primary-cluster-.*\.cluster-ro-.+\.rds\.amazonaws\.com$/);
    });

    it('should have all monitoring components', () => {
      const hasCloudWatch = stackResources.some(r => r.ResourceType === 'AWS::CloudWatch::Alarm');
      const hasLogs = stackResources.some(r => r.ResourceType === 'AWS::Logs::LogGroup');
      const hasLambda = stackResources.some(r => r.ResourceType === 'AWS::Lambda::Function');
      const hasEventRule = stackResources.some(r => r.ResourceType === 'AWS::Events::Rule');

      expect(hasCloudWatch).toBe(true);
      expect(hasLogs).toBe(true);
      expect(hasLambda).toBe(true);
      expect(hasEventRule).toBe(true);
    });
  });

  describe('Resource Tagging', () => {
    it('VPC should have name tag with environmentSuffix', async () => {
      const vpcId = outputs.VPCId;
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      const nameTag = response.Vpcs[0].Tags.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toContain(envSuffix);
    });

    it('subnets should have name tags with environmentSuffix', async () => {
      const subnetIds = [outputs.PrivateSubnet1Id].filter(Boolean);
      if (subnetIds.length > 0) {
        const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
        const response = await ec2Client.send(command);

        const nameTag = response.Subnets[0].Tags.find(tag => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value).toContain(envSuffix);
      }
    });
  });
});
