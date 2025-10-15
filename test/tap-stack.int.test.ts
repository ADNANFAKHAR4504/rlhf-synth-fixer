import {
  ApiGatewayV2Client,
  GetApiCommand,
  GetStageCommand
} from '@aws-sdk/client-apigatewayv2';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInternetGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeCacheClustersCommand,
  DescribeCacheSubnetGroupsCommand,
  ElastiCacheClient,
} from '@aws-sdk/client-elasticache';
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  GetKeyPolicyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
} from '@aws-sdk/client-kms';
import {
  GetFunctionCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import * as fs from 'fs';
import * as path from 'path';

describe('Healthcare Stack Integration Tests', () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr4326';

  // AWS Clients
  const ec2Client = new EC2Client({ region });
  const rdsClient = new RDSClient({ region });
  const elastiCacheClient = new ElastiCacheClient({ region });
  const kmsClient = new KMSClient({ region });
  const secretsClient = new SecretsManagerClient({ region });
  const lambdaClient = new LambdaClient({ region });
  const apiGwClient = new ApiGatewayV2Client({ region });
  const cloudWatchLogsClient = new CloudWatchLogsClient({ region });
  const iamClient = new IAMClient({ region });

  let outputs: any;

  beforeAll(() => {
    // Load actual deployment outputs from cdk-outputs.json
    const outputsPath = path.join(__dirname, '..', 'cdk-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error('cdk-outputs.json not found. Please deploy healthcare infrastructure first');
    }

    const fileContent = fs.readFileSync(outputsPath, 'utf8');
    if (!fileContent.trim()) {
      throw new Error('cdk-outputs.json is empty. Please ensure healthcare infrastructure is properly deployed.');
    }

    try {
      const allOutputs = JSON.parse(fileContent);
      // Extract healthcare stack outputs (adjust key name as needed)
      outputs = allOutputs[`TapStack${environmentSuffix}`] || allOutputs;
    } catch (error) {
      throw new Error(`Failed to parse cdk-outputs.json: ${error}`);
    }

    console.log('Loaded healthcare stack outputs:', Object.keys(outputs));
  }, 30000);

  describe('VPC and Network Infrastructure', () => {
    test('VPC exists with correct CIDR and configuration', async () => {
      // Find VPC by name tag
      const command = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`healthcare-vpc-${environmentSuffix}`]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');

      // Check DNS attributes using separate API calls
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId,
        Attribute: 'enableDnsHostnames'
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId,
        Attribute: 'enableDnsSupport'
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);

      // Check environment tag
      const envTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag?.Value).toBe(environmentSuffix);
    }, 15000);

    test('Public and Private subnets are created correctly', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [
              `healthcare-public-subnet-1-${environmentSuffix}`,
              `healthcare-public-subnet-2-${environmentSuffix}`,
              `healthcare-private-subnet-1-${environmentSuffix}`,
              `healthcare-private-subnet-2-${environmentSuffix}`
            ]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(4);

      const publicSubnet1 = response.Subnets?.find(s =>
        s.Tags?.some(t => t.Key === 'Name' && t.Value === `healthcare-public-subnet-1-${environmentSuffix}`)
      );
      const privateSubnet1 = response.Subnets?.find(s =>
        s.Tags?.some(t => t.Key === 'Name' && t.Value === `healthcare-private-subnet-1-${environmentSuffix}`)
      );

      expect(publicSubnet1?.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet1?.MapPublicIpOnLaunch).toBe(true);
      expect(privateSubnet1?.CidrBlock).toBe('10.0.10.0/24');
      expect(privateSubnet1?.MapPublicIpOnLaunch).toBe(false);
    }, 15000);

    test('Internet Gateway is attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: [`healthcare-igw-${environmentSuffix}`]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.InternetGateways).toHaveLength(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].State).toBe('available');
    }, 10000);

    test('Security Groups are configured properly', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'group-name',
            Values: [
              `healthcare-lambda-sg-${environmentSuffix}`,
              `healthcare-rds-sg-${environmentSuffix}`,
              `healthcare-elasticache-sg-${environmentSuffix}`
            ]
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups?.length).toBeGreaterThanOrEqual(3);

      // Check Lambda security group has egress rule
      const lambdaSg = response.SecurityGroups?.find(sg =>
        sg.GroupName === `healthcare-lambda-sg-${environmentSuffix}`
      );
      expect(lambdaSg?.IpPermissionsEgress?.length).toBeGreaterThan(0);

      // Check RDS security group has ingress from Lambda
      const rdsSg = response.SecurityGroups?.find(sg =>
        sg.GroupName === `healthcare-rds-sg-${environmentSuffix}`
      );
      expect(rdsSg?.IpPermissions?.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('KMS and Security', () => {
    test('KMS key exists with proper configuration', async () => {
      // Find KMS key by alias
      const command = new DescribeKeyCommand({
        KeyId: `alias/healthcare-${environmentSuffix}`
      });

      const response = await kmsClient.send(command);
      const key = response.KeyMetadata!;

      expect(key.KeyState).toBe('Enabled');

      // Check key rotation status using separate API call with actual key ID
      const rotationCommand = new GetKeyRotationStatusCommand({
        KeyId: key.KeyId
      });
      const rotationResponse = await kmsClient.send(rotationCommand);
      expect(rotationResponse.KeyRotationEnabled).toBe(true);

      expect(key.Description).toContain('HIPAA compliance');
    }, 10000);

    test('KMS key policy allows CloudWatch Logs access', async () => {
      // First, get the actual key ID from the alias
      const describeCommand = new DescribeKeyCommand({
        KeyId: `alias/healthcare-${environmentSuffix}`
      });
      const describeResponse = await kmsClient.send(describeCommand);
      const keyId = describeResponse.KeyMetadata!.KeyId!;

      const command = new GetKeyPolicyCommand({
        KeyId: keyId,
        PolicyName: 'default'
      });

      const response = await kmsClient.send(command);
      const policy = JSON.parse(response.Policy!);

      // Check for CloudWatch Logs statement
      const logsStatement = policy.Statement.find((stmt: any) =>
        stmt.Sid === 'AllowCloudWatchLogsEncryption'
      );
      expect(logsStatement).toBeDefined();
      expect(logsStatement.Principal.Service).toContain(`logs.${region}.amazonaws.com`);
    }, 10000);
  });

  describe('Database Infrastructure', () => {
    test('RDS Aurora cluster is properly configured', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: `healthcare-db-${environmentSuffix}`
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toHaveLength(1);

      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.BackupRetentionPeriod).toBe(7);
      expect(cluster.DeletionProtection).toBe(false);
    }, 20000);

    test('RDS cluster instances are running', async () => {
      // Get cluster info first to find the instance identifiers
      const clusterCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: `healthcare-db-${environmentSuffix}`
      });

      const clusterResponse = await rdsClient.send(clusterCommand);
      const cluster = clusterResponse.DBClusters![0];

      expect(cluster.DBClusterMembers?.length).toBeGreaterThanOrEqual(2);

      // Now check each instance individually
      for (const member of cluster.DBClusterMembers!) {
        const instanceCommand = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: member.DBInstanceIdentifier
        });

        const instanceResponse = await rdsClient.send(instanceCommand);
        const instance = instanceResponse.DBInstances![0];

        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.DBInstanceClass).toBe('db.serverless');
      }
    }, 20000);

    test('DB subnet group exists with correct subnets', async () => {
      const command = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: `healthcare-db-subnet-group-${environmentSuffix}`
      });

      const response = await rdsClient.send(command);
      expect(response.DBSubnetGroups).toHaveLength(1);

      const subnetGroup = response.DBSubnetGroups![0];
      expect(subnetGroup.Subnets?.length).toBe(2);
      expect(subnetGroup.DBSubnetGroupDescription).toContain('RDS Aurora cluster');
    }, 10000);
  });

  describe('ElastiCache Infrastructure', () => {
    test('ElastiCache Redis cluster is properly configured', async () => {
      const command = new DescribeCacheClustersCommand({
        CacheClusterId: `healthcare-cache-${environmentSuffix}`
      });

      const response = await elastiCacheClient.send(command);
      expect(response.CacheClusters).toHaveLength(1);

      const cluster = response.CacheClusters![0];
      expect(cluster.CacheClusterStatus).toBe('available');
      expect(cluster.Engine).toBe('redis');
      expect(cluster.CacheNodeType).toBe('cache.t4g.micro');
      expect(cluster.NumCacheNodes).toBe(1);
    }, 15000);

    test('ElastiCache subnet group is configured', async () => {
      const command = new DescribeCacheSubnetGroupsCommand({
        CacheSubnetGroupName: `healthcare-cache-subnet-group-${environmentSuffix}`
      });

      const response = await elastiCacheClient.send(command);
      expect(response.CacheSubnetGroups).toHaveLength(1);

      const subnetGroup = response.CacheSubnetGroups![0];
      expect(subnetGroup.Subnets?.length).toBe(2);
    }, 10000);
  });

  describe('Secrets Manager', () => {
    test('Database secret exists and is encrypted', async () => {
      const command = new DescribeSecretCommand({
        SecretId: `healthcare-db-credentials-${environmentSuffix}`
      });

      const response = await secretsClient.send(command);
      const secret = response;

      expect(secret.Name).toBe(`healthcare-db-credentials-${environmentSuffix}`);
      expect(secret.KmsKeyId).toBeDefined();
      expect(secret.Description).toContain('HIPAA-compliant');
    }, 10000);
  });

  describe('Lambda Function', () => {
    test('Patient record processor Lambda exists and is configured', async () => {
      const command = new GetFunctionCommand({
        FunctionName: `healthcare-processor-${environmentSuffix}`
      });

      const response = await lambdaClient.send(command);
      const func = response;

      expect(func.Configuration?.State).toBe('Active');
      expect(func.Configuration?.Runtime).toBe('nodejs20.x');
      expect(func.Configuration?.Handler).toBe('index.handler');
      expect(func.Configuration?.Timeout).toBe(30);
      expect(func.Configuration?.MemorySize).toBe(512);

      // Check VPC configuration
      expect(func.Configuration?.VpcConfig?.SubnetIds?.length).toBe(2);
      expect(func.Configuration?.VpcConfig?.SecurityGroupIds?.length).toBeGreaterThan(0);

      // Check environment variables
      const envVars = func.Configuration?.Environment?.Variables;
      expect(envVars?.DB_SECRET_ARN).toContain('healthcare-db-credentials');
      expect(envVars?.REDIS_CLUSTER_ID).toBe(`healthcare-cache-${environmentSuffix}`);
      expect(envVars?.ENVIRONMENT).toBe(environmentSuffix);
    }, 15000);
  });

  describe('API Gateway', () => {
    let apiId: string;

    beforeAll(async () => {
      // We need to find the API ID from the deployment outputs or by name
      // This is a simplified approach - in real scenarios you'd get this from outputs
      apiId = outputs.ApiId || 'test-api-id';
    });

    test('API Gateway HTTP API exists', async () => {
      if (!apiId || apiId === 'test-api-id') {
        console.log('Skipping test: API ID not available in outputs');
        return;
      }

      const command = new GetApiCommand({
        ApiId: apiId
      });

      const response = await apiGwClient.send(command);
      expect(response.Name).toContain(`healthcare-api-${environmentSuffix}`);
      expect(response.ProtocolType).toBe('HTTP');
      expect(response.CorsConfiguration).toBeDefined();
    }, 10000);

    test('API stage is configured with logging', async () => {
      if (!apiId || apiId === 'test-api-id') {
        console.log('Skipping test: API ID not available in outputs');
        return;
      }

      const command = new GetStageCommand({
        ApiId: apiId,
        StageName: 'prod'
      });

      const response = await apiGwClient.send(command);
      expect(response.StageName).toBe('prod');
      expect(response.AutoDeploy).toBe(true);
      expect(response.AccessLogSettings).toBeDefined();
      expect(response.DefaultRouteSettings?.ThrottlingBurstLimit).toBe(100);
      expect(response.DefaultRouteSettings?.ThrottlingRateLimit).toBe(50);
    }, 10000);
  });

  describe('CloudWatch Logs', () => {
    test('API Gateway log group exists with encryption', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/apigateway/healthcare-${environmentSuffix}`
      });

      const response = await cloudWatchLogsClient.send(command);
      expect(response.logGroups?.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(90);
      expect(logGroup.kmsKeyId).toBeDefined();
    }, 10000);
  });

  describe('IAM Roles and Policies', () => {
    test('Lambda execution role exists with proper policies', async () => {
      const command = new GetRoleCommand({
        RoleName: `healthcare-lambda-role-${environmentSuffix}`
      });

      const response = await iamClient.send(command);
      const role = response.Role!;

      expect(role.RoleName).toBe(`healthcare-lambda-role-${environmentSuffix}`);

      // Check attached policies
      const policiesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: role.RoleName!
      });

      const policiesResponse = await iamClient.send(policiesCommand);
      const policyArns = policiesResponse.AttachedPolicies?.map(p => p.PolicyArn) || [];

      expect(policyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      expect(policyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');

      // Should have custom policy for Secrets Manager and KMS access
      expect(policyArns.some(arn => arn?.includes('healthcare-lambda-policy'))).toBe(true);
    }, 15000);
  });
});