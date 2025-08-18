import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeContinuousBackupsCommand,
  DescribeTableCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';
import {
  DescribeFlowLogsCommand,
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeTagsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetBucketEncryptionCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';

describe('IaCChallenge Infrastructure Integration Tests', () => {
  let cloudFormationClient: CloudFormationClient;
  let ec2Client: EC2Client;
  let s3Client: S3Client;
  let dynamodbClient: DynamoDBClient;
  let cloudWatchLogsClient: CloudWatchLogsClient;

  const stackName = `TapStack${process.env.ENVIRONMENT_SUFFIX || 'dev'}`;
  const region = process.env.AWS_REGION || 'us-east-1';

  let stackOutputs: { [key: string]: string } = {};

  beforeAll(async () => {
    // Initialize AWS SDK v3 clients
    cloudFormationClient = new CloudFormationClient({ region });
    ec2Client = new EC2Client({ region });
    s3Client = new S3Client({ region });
    dynamodbClient = new DynamoDBClient({ region });
    cloudWatchLogsClient = new CloudWatchLogsClient({ region });

    // Get stack outputs
    try {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const stackDescription = await cloudFormationClient.send(command);

      if (stackDescription.Stacks && stackDescription.Stacks[0].Outputs) {
        stackDescription.Stacks[0].Outputs.forEach((output: any) => {
          if (output.OutputKey && output.OutputValue) {
            stackOutputs[output.OutputKey] = output.OutputValue;
          }
        });
      }
    } catch (error) {
      console.error('Failed to get stack outputs:', error);
      throw new Error(`Stack ${stackName} not found or not accessible`);
    }
  }, 30000);

  describe('Stack Deployment', () => {
    test('should have deployed stack successfully', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const stacks = await cloudFormationClient.send(command);

      expect(stacks.Stacks).toBeDefined();
      expect(stacks.Stacks!.length).toBe(1);
      expect(stacks.Stacks![0].StackStatus).toBe('CREATE_COMPLETE');
    });

    test('should have all expected outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'DynamoDBTableName',
        'EC2InstanceId',
        'VPCId',
        'CentralLogGroupName',
      ];

      expectedOutputs.forEach(outputKey => {
        expect(stackOutputs[outputKey]).toBeDefined();
        expect(stackOutputs[outputKey]).not.toBe('');
      });
    });
  });

  describe('VPC and Networking', () => {
    test('should have created VPC with correct configuration', async () => {
      const vpcId = stackOutputs.VPCId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcs = await ec2Client.send(command);

      expect(vpcs.Vpcs).toBeDefined();
      expect(vpcs.Vpcs!.length).toBe(1);

      const vpc = vpcs.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      // Note: EnableDnsHostnames and EnableDnsSupport are not directly available in the response
      // They would need to be checked via DescribeVpcAttribute
    });

    test('should have created public subnet', async () => {
      const vpcId = stackOutputs.VPCId;

      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: ['IaCChallenge-PublicSubnet'] },
        ],
      });
      const subnets = await ec2Client.send(command);

      expect(subnets.Subnets).toBeDefined();
      expect(subnets.Subnets!.length).toBe(1);

      const subnet = subnets.Subnets![0];
      expect(subnet.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet.MapPublicIpOnLaunch).toBe(true);
      expect(subnet.State).toBe('available');
    });

    test('should have internet gateway attached', async () => {
      const vpcId = stackOutputs.VPCId;

      const command = new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
      });
      const igws = await ec2Client.send(command);

      expect(igws.InternetGateways).toBeDefined();
      expect(igws.InternetGateways!.length).toBe(1);

      const igw = igws.InternetGateways![0];
      expect(igw.Attachments).toBeDefined();
      expect(igw.Attachments![0].State).toBe('available');
    });

    test('should have proper routing configuration', async () => {
      const vpcId = stackOutputs.VPCId;

      const command = new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: ['IaCChallenge-PublicRouteTable'] },
        ],
      });
      const routeTables = await ec2Client.send(command);

      expect(routeTables.RouteTables).toBeDefined();
      expect(routeTables.RouteTables!.length).toBe(1);

      const routeTable = routeTables.RouteTables![0];
      const defaultRoute = routeTable.Routes!.find(
        (route: any) => route.DestinationCidrBlock === '0.0.0.0/0'
      );
      expect(defaultRoute).toBeDefined();
      expect(defaultRoute!.GatewayId).toMatch(/^igw-/);
    });
  });

  describe('EC2 Instance', () => {
    test('should have created EC2 instance', async () => {
      const instanceId = stackOutputs.EC2InstanceId;
      expect(instanceId).toBeDefined();

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const instances = await ec2Client.send(command);

      expect(instances.Reservations).toBeDefined();
      expect(instances.Reservations!.length).toBe(1);
      expect(instances.Reservations![0].Instances).toBeDefined();
      expect(instances.Reservations![0].Instances!.length).toBe(1);

      const instance = instances.Reservations![0].Instances![0];
      expect(instance.State!.Name).toMatch(/^(running|pending)$/);
      expect(instance.InstanceType).toBe('t2.micro');
    });

    test('should have proper security group configuration', async () => {
      const instanceId = stackOutputs.EC2InstanceId;

      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const instances = await ec2Client.send(instanceCommand);

      const instance = instances.Reservations![0].Instances![0];
      expect(instance.SecurityGroups).toBeDefined();
      expect(instance.SecurityGroups!.length).toBeGreaterThan(0);

      const sgId = instance.SecurityGroups![0].GroupId!;
      const sgCommand = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
      const securityGroups = await ec2Client.send(sgCommand);

      const sg = securityGroups.SecurityGroups![0];
      expect(sg.GroupName).toBeDefined(); // Auto-generated name

      // Check for SSH and HTTP rules
      const sshRule = sg.IpPermissions!.find(
        (rule: any) => rule.FromPort === 22
      );
      const httpRule = sg.IpPermissions!.find(
        (rule: any) => rule.FromPort === 80
      );

      expect(sshRule).toBeDefined();
      expect(httpRule).toBeDefined();
    });

    test('should have IAM instance profile attached', async () => {
      const instanceId = stackOutputs.EC2InstanceId;

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const instances = await ec2Client.send(command);

      const instance = instances.Reservations![0].Instances![0];
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.IamInstanceProfile!.Arn).toMatch(/instance-profile/);
    });
  });

  describe('S3 Bucket', () => {
    test('should have created S3 bucket', async () => {
      const bucketName = stackOutputs.S3BucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      const headBucket = await s3Client.send(command);

      expect(headBucket).toBeDefined();
    });

    test('should have versioning enabled', async () => {
      const bucketName = stackOutputs.S3BucketName;

      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioning = await s3Client.send(command);

      expect(versioning.Status).toBe('Enabled');
    });

    test('should have encryption enabled', async () => {
      const bucketName = stackOutputs.S3BucketName;

      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryption = await s3Client.send(command);

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration!.Rules).toBeDefined();
      expect(
        encryption.ServerSideEncryptionConfiguration!.Rules!.length
      ).toBeGreaterThan(0);
    });

    test('should have proper tagging', async () => {
      const bucketName = stackOutputs.S3BucketName;

      const command = new GetBucketTaggingCommand({ Bucket: bucketName });
      const tagging = await s3Client.send(command);

      expect(tagging.TagSet).toBeDefined();
      const projectTag = tagging.TagSet!.find(
        (tag: any) => tag.Key === 'Project'
      );
      expect(projectTag).toBeDefined();
      expect(projectTag!.Value).toBe('IaCChallenge');
    });
  });

  describe('DynamoDB Table', () => {
    test('should have created DynamoDB table', async () => {
      const tableName = stackOutputs.DynamoDBTableName;
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({ TableName: tableName });
      const table = await dynamodbClient.send(command);

      expect(table.Table).toBeDefined();
      expect(table.Table!.TableStatus).toBe('ACTIVE');
    });

    test('should have Point-in-Time Recovery enabled', async () => {
      const tableName = stackOutputs.DynamoDBTableName;

      const command = new DescribeContinuousBackupsCommand({
        TableName: tableName,
      });
      const pitr = await dynamodbClient.send(command);

      expect(pitr.ContinuousBackupsDescription).toBeDefined();
      expect(
        pitr.ContinuousBackupsDescription!.PointInTimeRecoveryDescription
      ).toBeDefined();
      expect(
        pitr.ContinuousBackupsDescription!.PointInTimeRecoveryDescription!
          .PointInTimeRecoveryStatus
      ).toBe('ENABLED');
    });

    test('should have proper key schema', async () => {
      const tableName = stackOutputs.DynamoDBTableName;

      const command = new DescribeTableCommand({ TableName: tableName });
      const table = await dynamodbClient.send(command);

      expect(table.Table!.KeySchema).toBeDefined();
      expect(table.Table!.KeySchema!.length).toBeGreaterThan(0);

      const hashKey = table.Table!.KeySchema!.find(
        (key: any) => key.KeyType === 'HASH'
      );
      expect(hashKey).toBeDefined();
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have created central log group', async () => {
      const logGroupName = stackOutputs.CentralLogGroupName;
      expect(logGroupName).toBeDefined();

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const logGroups = await cloudWatchLogsClient.send(command);

      expect(logGroups.logGroups).toBeDefined();
      expect(logGroups.logGroups!.length).toBe(1);

      const logGroup = logGroups.logGroups![0];
      expect(logGroup.logGroupName).toBe(logGroupName);
      expect(logGroup.retentionInDays).toBe(30);
    });

    test('should have VPC Flow Logs configured', async () => {
      const vpcId = stackOutputs.VPCId;

      const command = new DescribeFlowLogsCommand({
        Filter: [{ Name: 'resource-id', Values: [vpcId] }],
      });
      const flowLogs = await ec2Client.send(command);

      expect(flowLogs.FlowLogs).toBeDefined();
      expect(flowLogs.FlowLogs!.length).toBeGreaterThan(0);

      const flowLog = flowLogs.FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.TrafficType).toBe('ALL');
    });
  });

  describe('Security and Compliance', () => {
    test('should have proper resource tagging', async () => {
      const vpcId = stackOutputs.VPCId;

      const command = new DescribeTagsCommand({
        Filters: [{ Name: 'resource-id', Values: [vpcId] }],
      });
      const tags = await ec2Client.send(command);

      expect(tags.Tags).toBeDefined();
      const projectTag = tags.Tags!.find((tag: any) => tag.Key === 'Project');
      expect(projectTag).toBeDefined();
      expect(projectTag!.Value).toBe('IaCChallenge');
    });

    test('should have monitoring and logging enabled', async () => {
      // VPC Flow Logs
      const vpcId = stackOutputs.VPCId;
      const flowLogsCommand = new DescribeFlowLogsCommand({
        Filter: [{ Name: 'resource-id', Values: [vpcId] }],
      });
      const flowLogs = await ec2Client.send(flowLogsCommand);
      expect(flowLogs.FlowLogs!.length).toBeGreaterThan(0);

      // CloudWatch Log Group
      const logGroupName = stackOutputs.CentralLogGroupName;
      const logGroupsCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const logGroups = await cloudWatchLogsClient.send(logGroupsCommand);
      expect(logGroups.logGroups!.length).toBe(1);
    });
  });

  describe('Performance and Cost Optimization', () => {
    test('should use cost-effective instance types', async () => {
      const instanceId = stackOutputs.EC2InstanceId;

      const command = new DescribeInstancesCommand({
        InstanceIds: [instanceId],
      });
      const instances = await ec2Client.send(command);

      const instance = instances.Reservations![0].Instances![0];
      expect(instance.InstanceType).toBe('t2.micro'); // Cost-effective for testing
    });

    test('should have appropriate log retention', async () => {
      const logGroupName = stackOutputs.CentralLogGroupName;

      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const logGroups = await cloudWatchLogsClient.send(command);

      const logGroup = logGroups.logGroups![0];
      expect(logGroup.retentionInDays).toBe(30); // Cost-effective retention
    });
  });

  describe('Disaster Recovery', () => {
    test('should have backup mechanisms in place', async () => {
      // DynamoDB Point-in-Time Recovery
      const tableName = stackOutputs.DynamoDBTableName;
      const pitrCommand = new DescribeContinuousBackupsCommand({
        TableName: tableName,
      });
      const pitr = await dynamodbClient.send(pitrCommand);
      expect(
        pitr.ContinuousBackupsDescription!.PointInTimeRecoveryDescription!
          .PointInTimeRecoveryStatus
      ).toBe('ENABLED');

      // S3 Versioning
      const bucketName = stackOutputs.S3BucketName;
      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });
      const versioning = await s3Client.send(versioningCommand);
      expect(versioning.Status).toBe('Enabled');
    });
  });
});
