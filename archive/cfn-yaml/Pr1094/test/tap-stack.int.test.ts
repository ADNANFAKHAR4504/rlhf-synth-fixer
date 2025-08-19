import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcAttributeCommand,
  Vpc,
  SecurityGroup,
} from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import {
  LambdaClient,
  GetFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  DynamoDBClient,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
} from '@aws-sdk/client-dynamodb';
import {
  CloudTrailClient,
  GetTrailCommand,
  GetTrailStatusCommand,
  GetEventSelectorsCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  APIGatewayClient,
  GetApiKeyCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { S3Client, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';

// --- Test Configuration ---
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'prod';
// This should match the name you use when deploying the stack.
const STACK_NAME = `TapStack${ENVIRONMENT_SUFFIX}`;
const REGION = process.env.AWS_REGION || 'us-east-1';

// --- Type Definition for Stack Outputs ---
interface StackOutputs {
  VPCId: string;
  ALBDNSName: string;
  ApiGatewayUrl: string;
  ApiKeyId: string;
  RDSEndpoint: string;
  S3BucketName: string;
  RDSInstanceId: string;
}

// --- AWS SDK Clients ---
const ec2Client = new EC2Client({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const lambdaClient = new LambdaClient({ region: REGION });
const dynamoDBClient = new DynamoDBClient({ region: REGION });
const cloudTrailClient = new CloudTrailClient({ region: REGION });
const apiGatewayClient = new APIGatewayClient({ region: REGION });
const s3Client = new S3Client({ region: REGION }); // NEW: S3 Client
const logsClient = new CloudWatchLogsClient({ region: REGION }); // NEW: CWL Client

// --- Read Deployed Stack Outputs ---
let outputs: StackOutputs | null = null;
try {
  const outputsObject = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
  outputs = outputsObject as StackOutputs;
} catch (error) {
  console.warn(
    'cfn-outputs/flat_outputs.json not found or is invalid. Integration tests will be skipped. Make sure to deploy the stack and generate the outputs file.'
  );
  console.error(error);
}

// Conditionally run tests only if the outputs file was successfully loaded
const testSuite = outputs ? describe : describe.skip;

testSuite('NovaModel Secure Infrastructure Integration Tests', () => {
  if (!outputs) {
    return; // Should not happen due to describe.skip, but good for type safety
  }

  // Set a longer timeout for all tests in this suite
  jest.setTimeout(60000);

  // ---------------------------------------------------------------- //
  //                         VPC and Networking                       //
  // ---------------------------------------------------------------- //
  describe('🌐 VPC and Networking', () => {
    test('VPC should exist, be available, and have DNS attributes enabled', async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs!.VPCId] })
      );
      expect(Vpcs).toBeDefined();
      expect(Vpcs!).toHaveLength(1);
      const vpc: Vpc = Vpcs![0];
      expect(vpc.State).toBe('available');

      const dnsSupport = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: outputs!.VPCId,
          Attribute: 'enableDnsSupport',
        })
      );
      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);

      const dnsHostnames = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: outputs!.VPCId,
          Attribute: 'enableDnsHostnames',
        })
      );
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
    });

    test('should have 2 public and 2 private subnets across different AZs', async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs!.VPCId] }],
        })
      );
      expect(Subnets).toBeDefined();
      const publicSubnets = Subnets!.filter(s => s.MapPublicIpOnLaunch);
      const privateSubnets = Subnets!.filter(s => !s.MapPublicIpOnLaunch);

      expect(publicSubnets.length).toBe(2);
      expect(privateSubnets.length).toBe(2);

      const publicAzs = new Set(publicSubnets.map(s => s.AvailabilityZone));
      const privateAzs = new Set(privateSubnets.map(s => s.AvailabilityZone));
      expect(publicAzs.size).toBe(2);
      expect(privateAzs.size).toBe(2);
    });
  });

  // ---------------------------------------------------------------- //
  //                         Network Security                         //
  // ---------------------------------------------------------------- //
  describe('🛡️ Network Security', () => {
    let albSg: SecurityGroup;
    let ec2Sg: SecurityGroup;
    let rdsSg: SecurityGroup;
    let lambdaSg: SecurityGroup;

    beforeAll(async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [outputs!.VPCId] },
            { Name: 'tag:Project', Values: ['NovaModelBreaking'] },
          ],
        })
      );

      albSg = SecurityGroups!.find(
        sg => sg.GroupName === `novamodel-sec-${ENVIRONMENT_SUFFIX}-alb-sg`
      )!;
      ec2Sg = SecurityGroups!.find(
        sg => sg.GroupName === `novamodel-sec-${ENVIRONMENT_SUFFIX}-ec2-sg`
      )!;
      rdsSg = SecurityGroups!.find(
        sg => sg.GroupName === `novamodel-sec-${ENVIRONMENT_SUFFIX}-rds-sg`
      )!;
      lambdaSg = SecurityGroups!.find(
        sg => sg.GroupName === `novamodel-sec-${ENVIRONMENT_SUFFIX}-lambda-sg`
      )!;
    });

    test('ALB Security Group should allow public HTTP/HTTPS and have correct name', () => {
      expect(albSg).toBeDefined();
      const httpRule = albSg.IpPermissions!.find(p => p.FromPort === 80);
      const httpsRule = albSg.IpPermissions!.find(p => p.FromPort === 443);
      expect(httpRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('EC2 Security Group should only allow traffic from the ALB on HTTP and HTTPS', () => {
      expect(ec2Sg).toBeDefined();
      expect(ec2Sg.IpPermissions).toHaveLength(2);
      const httpRule = ec2Sg.IpPermissions!.find(p => p.FromPort === 80);
      const httpsRule = ec2Sg.IpPermissions!.find(p => p.FromPort === 443);
      expect(httpRule?.UserIdGroupPairs?.[0].GroupId).toBe(albSg.GroupId);
      expect(httpsRule?.UserIdGroupPairs?.[0].GroupId).toBe(albSg.GroupId);
    });

    test('RDS Security Group should only allow traffic from EC2 and Lambda SGs on port 3306', () => {
      expect(rdsSg).toBeDefined();
      const ec2Rule = rdsSg.IpPermissions!.find(p =>
        p.UserIdGroupPairs?.some(pair => pair.GroupId === ec2Sg.GroupId)
      );
      const lambdaRule = rdsSg.IpPermissions!.find(p =>
        p.UserIdGroupPairs?.some(pair => pair.GroupId === lambdaSg.GroupId)
      );
      expect(ec2Rule).toBeDefined();
      expect(lambdaRule).toBeDefined();
      expect(ec2Rule?.FromPort).toBe(3306);
      expect(lambdaRule?.FromPort).toBe(3306);
    });
  });

  // ---------------------------------------------------------------- //
  //                   Data Storage and Encryption                    //
  // ---------------------------------------------------------------- //
  describe('💾 Data Storage and Encryption', () => {
    test('RDS Instance should be available, Multi-AZ, and encrypted', async () => {
      // Get the RDS endpoint from stack outputs
      const rdsInstanceId = outputs.RDSInstanceId;

      const describeSpecificInstanceCommand = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: rdsInstanceId,
      });
      const specificInstanceResponse = await rdsClient.send(
        describeSpecificInstanceCommand
      );
      const db = specificInstanceResponse.DBInstances?.[0];

      // Verify the RDS instance properties
      expect(db).toBeDefined();
      expect(db!.DBInstanceStatus).toBe('available');
      expect(db!.MultiAZ).toBe(true);
      expect(db!.StorageEncrypted).toBe(true);
    });
  });

  // ---------------------------------------------------------------- //
  //                       Compute and API Gateway                    //
  // ---------------------------------------------------------------- //
  describe('⚙️ Compute and API', () => {
    test('Lambda function should be active, have correct name, and be in VPC', async () => {
      const functionName = `novamodel-sec-${ENVIRONMENT_SUFFIX}-function`;
      const Configuration = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: functionName,
        })
      );
      expect(Configuration?.State).toBe('Active');
      expect(Configuration?.FunctionName).toBe(functionName);
      expect(Configuration?.VpcConfig?.VpcId).toBe(outputs!.VPCId);
      expect(Configuration?.VpcConfig?.SubnetIds?.length).toBe(2);
      expect(Configuration?.VpcConfig?.SecurityGroupIds?.length).toBe(1);
    });

    test('API Gateway should have an enabled API key', async () => {
      const apiKey = await apiGatewayClient.send(
        new GetApiKeyCommand({
          apiKey: outputs.ApiKeyId,
          includeValue: false,
        })
      );
      expect(apiKey).toBeDefined();
      expect(apiKey.enabled).toBe(true);
    });
  });

  // ---------------------------------------------------------------- //
  //                       Logging and Monitoring                     //
  // ---------------------------------------------------------------- //
  describe('📊 Logging and Monitoring', () => {
    const trailName = `novamodel-sec-${ENVIRONMENT_SUFFIX}-trail`;

    test('CloudTrail should be configured correctly', async () => {
      const { Trail } = await cloudTrailClient.send(
        new GetTrailCommand({ Name: trailName })
      );
      expect(Trail).toBeDefined();
      expect(Trail?.Name).toBe(trailName);
      expect(Trail?.IsMultiRegionTrail).toBe(true);
      expect(Trail?.IncludeGlobalServiceEvents).toBe(true);

      const { IsLogging } = await cloudTrailClient.send(
        new GetTrailStatusCommand({ Name: trailName })
      );
      expect(IsLogging).toBe(true);
    });

    test('CloudTrail should have correct event selectors', async () => {
      const { EventSelectors } = await cloudTrailClient.send(
        new GetEventSelectorsCommand({ TrailName: trailName })
      );
      expect(EventSelectors).toBeDefined();
      expect(EventSelectors!).toHaveLength(1);
      const dataResources = EventSelectors![0].DataResources;
      expect(dataResources).toBeDefined();
      expect(dataResources!.length).toBe(3);

      const resourceTypes = new Set(dataResources!.map(r => r.Type));
      expect(resourceTypes).toContain('AWS::S3::Object');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::DynamoDB::Table');
    });

    test('should have dedicated CloudWatch Log Groups', async () => {
      const cfnLogGroupName = `/aws/cloudformation/${STACK_NAME}`;
      const flowLogGroupName = `/aws/vpc/flowlogs/${STACK_NAME}`;

      const { logGroups } = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/',
        })
      );

      const groupNames = logGroups?.map(g => g.logGroupName);
      expect(groupNames).toContain(cfnLogGroupName);
      expect(groupNames).toContain(flowLogGroupName);
    });
  });
});
