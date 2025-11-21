import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSecurityGroupsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  GetTopicAttributesCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import * as fs from 'fs';
import * as path from 'path';

const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'm1d2p4qa';
const stackName = `TapStack${environmentSuffix}`;

const cfnClient = new CloudFormationClient({ region });
const lambdaClient = new LambdaClient({ region });
const rdsClient = new RDSClient({ region });
const ec2Client = new EC2Client({ region });
const secretsClient = new SecretsManagerClient({ region });
const snsClient = new SNSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

interface StackOutputs {
  [key: string]: string;
}

interface StackResource {
  LogicalResourceId: string;
  PhysicalResourceId: string;
  ResourceType: string;
}

let stackOutputs: StackOutputs = {};
let stackResources: Map<string, string> = new Map();

describe('CloudFormation Stack Integration Tests', () => {
  beforeAll(async () => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      stackOutputs = JSON.parse(outputsContent);
    } else {
      // If flat-outputs.json doesn't exist, fetch from CloudFormation
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);
      const stack = response.Stacks?.[0];

      if (stack?.Outputs) {
        stack.Outputs.forEach(output => {
          if (output.OutputKey && output.OutputValue) {
            stackOutputs[output.OutputKey] = output.OutputValue;
          }
        });
      }
    }

    expect(Object.keys(stackOutputs).length).toBeGreaterThan(0);

    // Load stack resources to get physical IDs
    const resourcesCommand = new DescribeStackResourcesCommand({
      StackName: stackName
    });
    const resourcesResponse = await cfnClient.send(resourcesCommand);
    if (resourcesResponse.StackResources) {
      resourcesResponse.StackResources.forEach(resource => {
        if (resource.LogicalResourceId && resource.PhysicalResourceId) {
          stackResources.set(resource.LogicalResourceId, resource.PhysicalResourceId);
        }
      });
    }
  }, 30000);

  describe('Stack Deployment', () => {
    test('CloudFormation stack should exist and be in CREATE_COMPLETE state', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks?.length).toBeGreaterThan(0);
      expect(response.Stacks?.[0].StackStatus).toBe('CREATE_COMPLETE');
    });

    test('Stack should have all expected outputs', () => {
      const expectedOutputs = [
        'RDSClusterEndpoint',
        'RDSClusterReadEndpoint',
        'LambdaFunctionArn',
        'LambdaSecurityGroupId',
        'DBSecurityGroupId',
        'DBSecretArn',
        'NotificationTopicArn'
      ];

      expectedOutputs.forEach(outputKey => {
        expect(stackOutputs[outputKey]).toBeDefined();
        expect(typeof stackOutputs[outputKey]).toBe('string');
        expect(stackOutputs[outputKey].length).toBeGreaterThan(0);
      });
    });
  });

  describe('RDS Aurora Resources', () => {
    test('Aurora DB Cluster should be available', async () => {
      const clusterEndpoint = stackOutputs.RDSClusterEndpoint;
      expect(clusterEndpoint).toBeDefined();

      // Get actual cluster identifier from stack resources
      const clusterIdentifier = stackResources.get('AuroraDBCluster') || '';
      expect(clusterIdentifier).toBeTruthy();

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters?.length).toBeGreaterThan(0);

      const cluster = response.DBClusters?.[0];
      expect(cluster?.Status).toBe('available');
      expect(cluster?.Engine).toBe('aurora-mysql');
      expect(cluster?.Endpoint).toBe(clusterEndpoint);
    }, 30000);

    test('Aurora DB Cluster should have ServerlessV2 scaling configuration', async () => {
      const clusterIdentifier = stackResources.get('AuroraDBCluster') || '';
      expect(clusterIdentifier).toBeTruthy();

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters?.[0];
      expect(cluster?.ServerlessV2ScalingConfiguration).toBeDefined();
      expect(cluster?.ServerlessV2ScalingConfiguration?.MinCapacity).toBe(0.5);
      expect(cluster?.ServerlessV2ScalingConfiguration?.MaxCapacity).toBe(1.0);
    }, 30000);

    test('Aurora DB Cluster should have read endpoint', async () => {
      const readEndpoint = stackOutputs.RDSClusterReadEndpoint;
      expect(readEndpoint).toBeDefined();
      expect(typeof readEndpoint).toBe('string');
      expect(readEndpoint).toContain('cluster-ro');
    });

    test('Aurora DB Cluster should have backup enabled', async () => {
      const clusterIdentifier = stackResources.get('AuroraDBCluster') || '';
      expect(clusterIdentifier).toBeTruthy();

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters?.[0];
      expect(cluster?.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(cluster?.PreferredBackupWindow).toBeDefined();
      expect(cluster?.PreferredMaintenanceWindow).toBeDefined();
    }, 30000);

    test('Aurora DB Instance should be available', async () => {
      const instanceIdentifier = `aurora-instance-${environmentSuffix}`;

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: instanceIdentifier
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances?.length).toBeGreaterThan(0);

      const instance = response.DBInstances?.[0];
      expect(instance?.DBInstanceStatus).toBe('available');
      expect(instance?.DBInstanceClass).toBe('db.serverless');
      expect(instance?.Engine).toBe('aurora-mysql');
    }, 30000);

    test('Aurora DB Instance should not be publicly accessible', async () => {
      const instanceIdentifier = `aurora-instance-${environmentSuffix}`;

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: instanceIdentifier
      });
      const response = await rdsClient.send(command);

      const instance = response.DBInstances?.[0];
      expect(instance?.PubliclyAccessible).toBe(false);
    }, 30000);
  });

  describe('Lambda Function Resources', () => {
    test('Lambda function should exist and be active', async () => {
      const functionArn = stackOutputs.LambdaFunctionArn;
      expect(functionArn).toBeDefined();

      const functionName = `transaction-processor-${environmentSuffix}`;

      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionArn).toBe(functionArn);
      expect(response.Configuration?.State).toBe('Active');
      expect(response.Configuration?.Runtime).toBe('python3.11');
    }, 30000);

    test('Lambda function should have 3GB memory configured', async () => {
      const functionName = `transaction-processor-${environmentSuffix}`;

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName
      });
      const response = await lambdaClient.send(command);

      expect(response.MemorySize).toBe(3008);
    }, 30000);

    test('Lambda function should not have reserved concurrent executions (removed to avoid account limits)', async () => {
      const functionName = `transaction-processor-${environmentSuffix}`;

      const command = new GetFunctionCommand({
        FunctionName: functionName
      });
      const response = await lambdaClient.send(command);

      // ReservedConcurrentExecutions is not set to avoid account-level concurrency limit issues
      expect(response.Concurrency?.ReservedConcurrentExecutions).toBeUndefined();
    }, 30000);

    test('Lambda function should have DB endpoint in environment variables', async () => {
      const functionName = `transaction-processor-${environmentSuffix}`;

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName
      });
      const response = await lambdaClient.send(command);

      expect(response.Environment?.Variables).toBeDefined();
      expect(response.Environment?.Variables?.DB_ENDPOINT).toBe(stackOutputs.RDSClusterEndpoint);
      expect(response.Environment?.Variables?.DB_NAME).toBe('transactions');
      expect(response.Environment?.Variables?.DB_PORT).toBe('3306');
    }, 30000);

    test('Lambda function should be deployed in VPC', async () => {
      const functionName = `transaction-processor-${environmentSuffix}`;

      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName
      });
      const response = await lambdaClient.send(command);

      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig?.VpcId).toBeDefined();
      expect(response.VpcConfig?.SubnetIds).toBeDefined();
      expect(response.VpcConfig?.SubnetIds?.length).toBeGreaterThan(0);
      expect(response.VpcConfig?.SecurityGroupIds).toBeDefined();
      expect(response.VpcConfig?.SecurityGroupIds).toContain(stackOutputs.LambdaSecurityGroupId);
    }, 30000);

    test('Lambda log group should exist', async () => {
      const logGroupName = `/aws/lambda/transaction-processor-${environmentSuffix}`;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups?.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBeDefined();
    }, 30000);
  });

  describe('Security Group Resources', () => {
    test('Lambda security group should exist', async () => {
      const sgId = stackOutputs.LambdaSecurityGroupId;
      expect(sgId).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId]
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(1);

      const sg = response.SecurityGroups?.[0];
      expect(sg?.GroupName).toContain(`lambda-security-group-${environmentSuffix}`);
      expect(sg?.GroupId).toBe(sgId);
    }, 30000);

    test('Lambda security group should allow all outbound traffic', async () => {
      const sgId = stackOutputs.LambdaSecurityGroupId;

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId]
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups?.[0];
      const egressRules = sg?.IpPermissionsEgress || [];

      const allowAllRule = egressRules.find(rule =>
        rule.IpProtocol === '-1' &&
        rule.IpRanges?.some(ip => ip.CidrIp === '0.0.0.0/0')
      );

      expect(allowAllRule).toBeDefined();
    }, 30000);

    test('DB security group should exist', async () => {
      const sgId = stackOutputs.DBSecurityGroupId;
      expect(sgId).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId]
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups?.length).toBe(1);

      const sg = response.SecurityGroups?.[0];
      expect(sg?.GroupName).toContain(`db-security-group-${environmentSuffix}`);
      expect(sg?.GroupId).toBe(sgId);
    }, 30000);

    test('DB security group should allow MySQL access from Lambda security group', async () => {
      const dbSgId = stackOutputs.DBSecurityGroupId;
      const lambdaSgId = stackOutputs.LambdaSecurityGroupId;

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [dbSgId]
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups?.[0];
      const ingressRules = sg?.IpPermissions || [];

      const mysqlRule = ingressRules.find(rule =>
        rule.IpProtocol === 'tcp' &&
        rule.FromPort === 3306 &&
        rule.ToPort === 3306 &&
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === lambdaSgId)
      );

      expect(mysqlRule).toBeDefined();
    }, 30000);
  });

  describe('Secrets Manager Resources', () => {
    test('DB Secret should exist', async () => {
      const secretArn = stackOutputs.DBSecretArn;
      expect(secretArn).toBeDefined();

      const command = new DescribeSecretCommand({
        SecretId: secretArn
      });
      const response = await secretsClient.send(command);

      expect(response.ARN).toBe(secretArn);
      expect(response.Name).toContain(`rds-credentials-${environmentSuffix}`);
    }, 30000);

    test('DB Secret should contain correct credential structure', async () => {
      const secretArn = stackOutputs.DBSecretArn;

      const command = new GetSecretValueCommand({
        SecretId: secretArn
      });
      const response = await secretsClient.send(command);

      expect(response.SecretString).toBeDefined();

      const credentials = JSON.parse(response.SecretString || '{}');
      expect(credentials.username).toBeDefined();
      expect(credentials.password).toBeDefined();
      expect(credentials.engine).toBe('mysql');
      expect(credentials.port).toBe(3306);
      expect(credentials.dbname).toBe('transactions');
      // Note: host is not included in GenerateSecretString template, 
      // applications should use RDSClusterEndpoint from stack outputs
    }, 30000);
  });

  describe('SNS Resources', () => {
    test('Notification topic should exist', async () => {
      const topicArn = stackOutputs.NotificationTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({
        TopicArn: topicArn
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
      expect(response.Attributes?.DisplayName).toBe('Deployment Notifications');
    }, 30000);
  });

  describe('Resource Integration', () => {
    test('Lambda should be able to connect to RDS through security groups', async () => {
      const functionName = `transaction-processor-${environmentSuffix}`;
      const dbSgId = stackOutputs.DBSecurityGroupId;
      const lambdaSgId = stackOutputs.LambdaSecurityGroupId;

      // Verify Lambda uses the correct security group
      const lambdaConfig = await lambdaClient.send(
        new GetFunctionConfigurationCommand({ FunctionName: functionName })
      );

      expect(lambdaConfig.VpcConfig?.SecurityGroupIds).toContain(lambdaSgId);

      // Verify DB security group allows access from Lambda security group
      const dbSgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [dbSgId] })
      );

      const dbSg = dbSgResponse.SecurityGroups?.[0];
      const hasLambdaAccess = dbSg?.IpPermissions?.some(rule =>
        rule.FromPort === 3306 &&
        rule.ToPort === 3306 &&
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === lambdaSgId)
      );

      expect(hasLambdaAccess).toBe(true);
    }, 30000);

    test('RDS endpoint should be accessible in the VPC', async () => {
      const clusterEndpoint = stackOutputs.RDSClusterEndpoint;

      // Verify endpoint format (CloudFormation auto-generates cluster names)
      expect(clusterEndpoint).toMatch(/^.*\.cluster-.*\.us-east-1\.rds\.amazonaws\.com$/);

      // Verify cluster is in VPC
      const clusterIdentifier = stackResources.get('AuroraDBCluster') || '';
      expect(clusterIdentifier).toBeTruthy();

      const response = await rdsClient.send(
        new DescribeDBClustersCommand({ DBClusterIdentifier: clusterIdentifier })
      );

      const cluster = response.DBClusters?.[0];
      expect(cluster?.DBSubnetGroup).toBeDefined();
      expect(cluster?.VpcSecurityGroups).toBeDefined();
      expect(cluster?.VpcSecurityGroups?.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Resource Tagging', () => {
    test('RDS cluster should have required tags', async () => {
      const clusterIdentifier = stackResources.get('AuroraDBCluster') || '';
      expect(clusterIdentifier).toBeTruthy();

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters?.[0];
      const tags = cluster?.TagList || [];

      const nameTag = tags.find(tag => tag.Key === 'Name');
      const envTag = tags.find(tag => tag.Key === 'Environment');

      expect(nameTag).toBeDefined();
      expect(nameTag?.Value).toContain(environmentSuffix);
      expect(envTag).toBeDefined();
    }, 30000);

    test('Lambda function should have required tags', async () => {
      const functionArn = stackOutputs.LambdaFunctionArn;

      const command = new GetFunctionCommand({
        FunctionName: functionArn
      });
      const response = await lambdaClient.send(command);

      const tags = response.Tags || {};

      expect(tags.Name).toBeDefined();
      expect(tags.Name).toContain(environmentSuffix);
      expect(tags.Environment).toBeDefined();
    }, 30000);
  });
});
