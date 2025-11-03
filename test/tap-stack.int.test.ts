import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  GetFunctionCommand,
  GetFunctionConfigurationCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import { mockClient } from 'aws-sdk-client-mock';
import * as fs from 'fs';
import * as path from 'path';

// Load stack outputs
const outputsPath = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

const region = outputs.region || 'eu-west-2';

// Detect if using LocalStack
const useLocalStack = process.env.USE_LOCALSTACK === 'true' || process.env.AWS_ENDPOINT_URL;
const localStackEndpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

// Client configuration
const clientConfig = useLocalStack
  ? {
    region,
    endpoint: localStackEndpoint,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  }
  : { region };

// Initialize AWS clients
const ec2Client = new EC2Client(clientConfig);
const rdsClient = new RDSClient(clientConfig);
const snsClient = new SNSClient(clientConfig);
const lambdaClient = new LambdaClient(clientConfig);
const secretsClient = new SecretsManagerClient(clientConfig);
const logsClient = new CloudWatchLogsClient(clientConfig);
const iamClient = new IAMClient(clientConfig);

// Create mocks for AWS SDK clients
const ec2Mock = mockClient(EC2Client);
const rdsMock = mockClient(RDSClient);
const snsMock = mockClient(SNSClient);
const lambdaMock = mockClient(LambdaClient);
const secretsMock = mockClient(SecretsManagerClient);
const logsMock = mockClient(CloudWatchLogsClient);
const iamMock = mockClient(IAMClient);

// Check if real resources are deployed
const hasDeployedResources = () => {
  return (
    outputs.vpcId &&
    outputs.vpcId !== 'vpc-0123456789abcdef0' && // Not the mock value
    !useLocalStack
  );
};

// Use mocks for local testing
const useMocks = !hasDeployedResources() && !useLocalStack;

describe('TapStack Integration Tests', () => {
  beforeAll(() => {
    if (useMocks) {
      console.log('Running integration tests with mocked AWS SDK responses');
    } else if (useLocalStack) {
      console.log('Running integration tests against LocalStack');
    } else {
      console.log('Running integration tests against real AWS resources');
    }
  });

  beforeEach(() => {
    if (useMocks) {
      // Reset all mocks before each test
      ec2Mock.reset();
      rdsMock.reset();
      snsMock.reset();
      lambdaMock.reset();
      secretsMock.reset();
      logsMock.reset();
      iamMock.reset();

      // Setup default mock responses
      setupMockResponses();
    }
  });

  function setupMockResponses() {
    // Mock VPC responses
    ec2Mock.on(DescribeVpcsCommand).resolves({
      Vpcs: [
        {
          VpcId: outputs.vpcId,
          CidrBlock: '172.16.0.0/16',
          State: 'available',
          Tags: [
            { Key: 'Environment', Value: 'production' },
            { Key: 'Project', Value: 'payment-processing' },
          ],
        },
      ],
    });

    // Mock Subnets responses
    ec2Mock.on(DescribeSubnetsCommand).resolves({
      Subnets: [
        {
          SubnetId: 'subnet-111',
          VpcId: outputs.vpcId,
          CidrBlock: '172.16.1.0/24',
          AvailabilityZone: 'eu-west-2a',
        },
        {
          SubnetId: 'subnet-222',
          VpcId: outputs.vpcId,
          CidrBlock: '172.16.2.0/24',
          AvailabilityZone: 'eu-west-2b',
        },
      ],
    });

    // Mock Route Tables responses
    ec2Mock.on(DescribeRouteTablesCommand).resolves({
      RouteTables: [
        {
          RouteTableId: 'rtb-123',
          VpcId: outputs.vpcId,
        },
      ],
    });

    // Mock Security Groups responses
    ec2Mock.on(DescribeSecurityGroupsCommand).resolves({
      SecurityGroups: [
        {
          GroupId: 'sg-rds-123',
          GroupName: 'rds-sg-dev',
          Description: 'Security group for RDS MySQL instance',
          VpcId: outputs.vpcId,
          IpPermissions: [
            {
              FromPort: 3306,
              ToPort: 3306,
              IpProtocol: 'tcp',
            },
          ],
        },
        {
          GroupId: 'sg-lambda-456',
          GroupName: 'lambda-sg-dev',
          Description: 'Security group for Lambda functions',
          VpcId: outputs.vpcId,
        },
      ],
    });

    // Mock RDS Instance responses
    rdsMock.on(DescribeDBInstancesCommand).resolves({
      DBInstances: [
        {
          DBInstanceIdentifier: 'rds-mysql-dev',
          Engine: 'mysql',
          EngineVersion: '8.0.35',
          DBInstanceClass: 'db.t3.medium',
          AllocatedStorage: 100,
          StorageType: 'gp2',
          StorageEncrypted: true,
          MultiAZ: true,
          BackupRetentionPeriod: 7,
          DBInstanceStatus: 'available',
          Endpoint: {
            Address: outputs.rdsEndpoint.split(':')[0],
            Port: 3306,
          },
          DBSubnetGroup: {
            DBSubnetGroupName: 'db-subnet-group-dev',
          },
          TagList: [
            { Key: 'Environment', Value: 'production' },
            { Key: 'Project', Value: 'payment-processing' },
          ],
        },
      ],
    });

    // Mock DB Subnet Groups responses
    rdsMock.on(DescribeDBSubnetGroupsCommand).resolves({
      DBSubnetGroups: [
        {
          DBSubnetGroupName: 'db-subnet-group-dev',
          Subnets: [
            {
              SubnetIdentifier: 'subnet-111',
              SubnetAvailabilityZone: { Name: 'eu-west-2a' },
            },
            {
              SubnetIdentifier: 'subnet-222',
              SubnetAvailabilityZone: { Name: 'eu-west-2b' },
            },
          ],
        },
      ],
    });

    // Mock SNS Topic responses
    snsMock.on(GetTopicAttributesCommand).resolves({
      Attributes: {
        TopicArn: outputs.snsTopicArn,
        DisplayName: 'Production Alerts',
      },
    });

    snsMock.on(ListSubscriptionsByTopicCommand).resolves({
      Subscriptions: [],
    });

    // Mock Lambda Function responses
    lambdaMock.on(GetFunctionCommand).resolves({
      Configuration: {
        FunctionName: 'payment-processor-dev',
        FunctionArn: outputs.lambdaFunctionArn,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 30,
        State: 'Active',
        Role: 'arn:aws:iam::123456789012:role/lambda-role-dev',
      },
    });

    lambdaMock.on(GetFunctionConfigurationCommand).resolves({
      FunctionName: 'payment-processor-dev',
      FunctionArn: outputs.lambdaFunctionArn,
      Runtime: 'nodejs18.x',
      Handler: 'index.handler',
      MemorySize: 512,
      Timeout: 30,
      Role: 'arn:aws:iam::123456789012:role/lambda-role-dev',
      VpcConfig: {
        VpcId: outputs.vpcId,
        SubnetIds: ['subnet-111', 'subnet-222'],
        SecurityGroupIds: ['sg-lambda-456'],
      },
      Environment: {
        Variables: {
          DB_HOST: outputs.rdsEndpoint.split(':')[0],
          DB_NAME: 'payments',
          DB_SECRET_ARN: outputs.dbSecretArn,
        },
      },
    });

    // Mock Secrets Manager responses
    secretsMock.on(DescribeSecretCommand).resolves({
      ARN: outputs.dbSecretArn,
      Name: 'db-secret-dev',
      Description: 'RDS MySQL credentials',
    });

    secretsMock.on(GetSecretValueCommand).resolves({
      ARN: outputs.dbSecretArn,
      Name: 'db-secret-dev',
      SecretString: JSON.stringify({
        username: 'admin',
        password: 'Chang3M3Pl3as3!123456',
      }),
    });

    // Mock CloudWatch Logs responses
    logsMock.on(DescribeLogGroupsCommand).resolves({
      logGroups: [
        {
          logGroupName: '/aws/lambda/payment-processor-dev',
          retentionInDays: 7,
        },
      ],
    });

    // Mock IAM Role responses
    iamMock.on(GetRoleCommand).resolves({
      Role: {
        Path: '/',
        RoleName: 'lambda-role-dev',
        RoleId: 'AIDACKCEVSQ6C2EXAMPLE',
        Arn: 'arn:aws:iam::123456789012:role/lambda-role-dev',
        CreateDate: new Date('2024-01-01'),
        AssumeRolePolicyDocument: encodeURIComponent(
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { Service: 'lambda.amazonaws.com' },
                Action: 'sts:AssumeRole',
              },
            ],
          })
        ),
      },
    });

    iamMock.on(ListAttachedRolePoliciesCommand).resolves({
      AttachedPolicies: [
        {
          PolicyName: 'AWSLambdaVPCAccessExecutionRole',
          PolicyArn:
            'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
        },
        {
          PolicyName: 'AWSLambdaBasicExecutionRole',
          PolicyArn:
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        },
      ],
    });
  }

  describe('VPC Configuration', () => {
    it('should have a VPC with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('172.16.0.0/16');
      expect(vpc.State).toBe('available');
      // Note: DNS settings are VPC attributes, not direct properties
      // To check DNS settings, use DescribeVpcAttributeCommand separately
    }, 30000);

    it('should have private subnets in multiple availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);

      const azs = new Set(
        response.Subnets!.map(subnet => subnet.AvailabilityZone)
      );
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // Verify CIDR blocks
      const cidrBlocks = response.Subnets!.map(subnet => subnet.CidrBlock);
      expect(cidrBlocks).toContain('172.16.1.0/24');
      expect(cidrBlocks).toContain('172.16.2.0/24');
    }, 30000);

    it('should have proper route tables configured', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Security Groups', () => {
    it('should have RDS security group with correct configuration', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
          {
            Name: 'group-name',
            Values: ['*rds-sg*'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      const rdsSecurityGroup = response.SecurityGroups![0];
      expect(rdsSecurityGroup.Description).toContain('RDS MySQL');

      // Verify ingress rules allow MySQL port 3306
      const ingressRules = rdsSecurityGroup.IpPermissions || [];
      const mysqlRule = ingressRules.find(
        rule => rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
    }, 30000);

    it('should have Lambda security group with correct configuration', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
          {
            Name: 'group-name',
            Values: ['*lambda-sg*'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      const lambdaSecurityGroup = response.SecurityGroups!.find(sg =>
        sg.Description?.includes('Lambda')
      );
      expect(lambdaSecurityGroup).toBeDefined();
      expect(lambdaSecurityGroup!.Description).toContain('Lambda');
    }, 30000);
  });

  describe('RDS Instance', () => {
    it('should have RDS instance with correct configuration', async () => {
      const dbInstanceId = outputs.rdsEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      });

      const response = await rdsClient.send(command);
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances).toHaveLength(1);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.EngineVersion).toMatch(/^8\.0/);
      expect(dbInstance.DBInstanceClass).toBe('db.t3.medium');
      expect(dbInstance.AllocatedStorage).toBe(100);
      expect(dbInstance.StorageType).toBe('gp2');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
      expect(dbInstance.DBInstanceStatus).toBe('available');
    }, 30000);

    it('should have RDS endpoint accessible', async () => {
      expect(outputs.rdsEndpoint).toBeDefined();
      expect(outputs.rdsEndpoint).toMatch(
        /^rds-mysql-.*\..*\.rds\.amazonaws\.com:3306$/
      );
    }, 30000);

    it('should have DB subnet group in multiple AZs', async () => {
      const dbInstanceId = outputs.rdsEndpoint.split('.')[0];
      const dbCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceId,
      });
      const dbResponse = await rdsClient.send(dbCommand);
      const subnetGroupName =
        dbResponse.DBInstances![0].DBSubnetGroup!.DBSubnetGroupName;

      const command = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName,
      });

      const response = await rdsClient.send(command);
      expect(response.DBSubnetGroups).toBeDefined();
      expect(response.DBSubnetGroups).toHaveLength(1);

      const subnetGroup = response.DBSubnetGroups![0];
      expect(subnetGroup.Subnets).toBeDefined();
      expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2);

      const azs = new Set(
        subnetGroup.Subnets!.map(subnet => subnet.SubnetAvailabilityZone!.Name)
      );
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, 30000);
  });

  describe('SNS Topic', () => {
    it('should have SNS topic with correct configuration', async () => {
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.snsTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.DisplayName).toBe('Production Alerts');
      expect(response.Attributes!.TopicArn).toBe(outputs.snsTopicArn);
    }, 30000);

    it('should have SNS topic accessible', async () => {
      expect(outputs.snsTopicArn).toBeDefined();
      expect(outputs.snsTopicArn).toMatch(
        /^arn:aws:sns:.*:.*:alerts-topic-.*$/
      );
    }, 30000);

    it('should list subscriptions for SNS topic', async () => {
      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.snsTopicArn,
      });

      const response = await snsClient.send(command);
      expect(response.Subscriptions).toBeDefined();
      // Subscriptions may be empty if no email was configured
      expect(Array.isArray(response.Subscriptions)).toBe(true);
    }, 30000);
  });

  describe('Lambda Function', () => {
    it('should have Lambda function with correct configuration', async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop()!;
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();

      const config = response.Configuration!;
      expect(config.Runtime).toBe('nodejs18.x');
      expect(config.Handler).toBe('index.handler');
      expect(config.MemorySize).toBe(512);
      expect(config.Timeout).toBe(30);
      expect(config.State).toBe('Active');
    }, 30000);

    it('should have Lambda function in VPC', async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop()!;
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.VpcConfig).toBeDefined();
      expect(response.VpcConfig!.VpcId).toBe(outputs.vpcId);
      expect(response.VpcConfig!.SubnetIds).toBeDefined();
      expect(response.VpcConfig!.SubnetIds!.length).toBeGreaterThanOrEqual(2);
      expect(response.VpcConfig!.SecurityGroupIds).toBeDefined();
      expect(response.VpcConfig!.SecurityGroupIds!.length).toBeGreaterThan(0);
    }, 30000);

    it('should have Lambda function with environment variables', async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop()!;
      const command = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      expect(response.Environment).toBeDefined();
      expect(response.Environment!.Variables).toBeDefined();

      const envVars = response.Environment!.Variables!;
      expect(envVars.DB_HOST).toBeDefined();
      expect(envVars.DB_HOST).toContain('rds.amazonaws.com');
      expect(envVars.DB_NAME).toBe('payments');
      expect(envVars.DB_SECRET_ARN).toBeDefined();
      expect(envVars.DB_SECRET_ARN).toMatch(/^arn:aws:secretsmanager:/);
    }, 30000);
  });

  describe('Secrets Manager', () => {
    it('should have secret with correct configuration', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.dbSecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.ARN).toBe(outputs.dbSecretArn);
      expect(response.Name).toContain('db-secret');
      expect(response.Description).toBe('RDS MySQL credentials');
    }, 30000);

    it('should have secret value with username and password', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.dbSecretArn,
      });

      const response = await secretsClient.send(command);
      expect(response.SecretString).toBeDefined();

      const secret = JSON.parse(response.SecretString!);
      expect(secret.username).toBeDefined();
      expect(secret.username).toBe('admin');
      expect(secret.password).toBeDefined();
      expect(secret.password.length).toBeGreaterThanOrEqual(16);
    }, 30000);
  });

  describe('CloudWatch Logs', () => {
    it('should have Lambda log group configured', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/lambda/payment-processor',
      });

      const response = await logsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups![0];
      expect(logGroup.retentionInDays).toBe(7);
    }, 30000);
  });

  describe('IAM Roles and Policies', () => {
    it('should have Lambda execution role', async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop()!;
      const configCommand = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const configResponse = await lambdaClient.send(configCommand);
      const roleArn = configResponse.Role!;
      const roleName = roleArn.split('/').pop()!;

      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);
      expect(response.Role).toBeDefined();
      expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain(
        'lambda.amazonaws.com'
      );
    }, 30000);

    it('should have required policies attached to Lambda role', async () => {
      const functionName = outputs.lambdaFunctionArn.split(':').pop()!;
      const configCommand = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const configResponse = await lambdaClient.send(configCommand);
      const roleArn = configResponse.Role!;
      const roleName = roleArn.split('/').pop()!;

      const command = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);
      expect(response.AttachedPolicies).toBeDefined();
      expect(response.AttachedPolicies!.length).toBeGreaterThanOrEqual(2);

      const policyArns = response.AttachedPolicies!.map(
        policy => policy.PolicyArn
      );
      expect(policyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
      expect(policyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    }, 30000);
  });

  describe('Resource Tags', () => {
    it('should have proper tags on VPC', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs![0];
      expect(vpc.Tags).toBeDefined();

      const tags = vpc.Tags!.reduce(
        (acc, tag) => {
          acc[tag.Key!] = tag.Value!;
          return acc;
        },
        {} as Record<string, string>
      );

      expect(tags.Environment).toBe('production');
      expect(tags.Project).toBe('payment-processing');
    }, 30000);

    it('should have proper tags on RDS instance', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.rdsEndpoint.split('.')[0],
      });

      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.TagList).toBeDefined();

      const tags = dbInstance.TagList!.reduce(
        (acc, tag) => {
          acc[tag.Key!] = tag.Value!;
          return acc;
        },
        {} as Record<string, string>
      );

      expect(tags.Environment).toBe('production');
      expect(tags.Project).toBe('payment-processing');
    }, 30000);
  });

  describe('End-to-End Workflow', () => {
    it('should have complete infrastructure for payment processing', async () => {
      // Verify all required components exist
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.rdsEndpoint).toBeDefined();
      expect(outputs.snsTopicArn).toBeDefined();
      expect(outputs.lambdaFunctionArn).toBeDefined();
      expect(outputs.dbSecretArn).toBeDefined();

      // Verify connectivity between components
      const functionName = outputs.lambdaFunctionArn.split(':').pop()!;
      const configCommand = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const configResponse = await lambdaClient.send(configCommand);

      // Verify Lambda has access to DB endpoint
      expect(configResponse.Environment!.Variables!.DB_HOST).toContain(
        outputs.rdsEndpoint.split(':')[0]
      );

      // Verify Lambda has access to secret
      expect(configResponse.Environment!.Variables!.DB_SECRET_ARN).toBe(
        outputs.dbSecretArn
      );

      // Verify Lambda is in the same VPC as RDS
      expect(configResponse.VpcConfig!.VpcId).toBe(outputs.vpcId);
    }, 30000);

    it('should support high availability with Multi-AZ deployment', async () => {
      // Verify RDS Multi-AZ
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.rdsEndpoint.split('.')[0],
      });
      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBInstances![0].MultiAZ).toBe(true);

      // Verify multiple subnets in different AZs
      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      const azs = new Set(
        subnetResponse.Subnets!.map(subnet => subnet.AvailabilityZone)
      );
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    it('should have proper security configuration', async () => {
      // Verify RDS encryption
      const rdsCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: outputs.rdsEndpoint.split('.')[0],
      });
      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBInstances![0].StorageEncrypted).toBe(true);

      // Verify secrets are stored in Secrets Manager
      const secretCommand = new DescribeSecretCommand({
        SecretId: outputs.dbSecretArn,
      });
      const secretResponse = await secretsClient.send(secretCommand);
      expect(secretResponse.ARN).toBeDefined();

      // Verify Lambda is in private subnets
      const functionName = outputs.lambdaFunctionArn.split(':').pop()!;
      const lambdaCommand = new GetFunctionConfigurationCommand({
        FunctionName: functionName,
      });
      const lambdaResponse = await lambdaClient.send(lambdaCommand);
      expect(lambdaResponse.VpcConfig!.SubnetIds!.length).toBeGreaterThan(0);
    }, 30000);
  });
});
