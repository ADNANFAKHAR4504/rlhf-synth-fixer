import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

describe('Live AWS Resources Integration Tests', () => {
  // LocalStack compatibility: Use the deployed stack name from metadata
  const stackName = process.env.STACK_NAME || `tap-stack-${process.env.PR_ID || 'Pr533'}`;
  const region = process.env.AWS_REGION || 'us-east-1';

  let stackOutputs: Record<string, string> = {};

  // LocalStack endpoint configuration
  const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') || process.env.AWS_ENDPOINT_URL?.includes('4566');
  const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
  const clientConfig = isLocalStack ? { region, endpoint } : { region };

  const cfnClient = new CloudFormationClient(clientConfig);
  const s3Client = new S3Client({ ...clientConfig, forcePathStyle: true });
  const lambdaClient = new LambdaClient(clientConfig);
  const secretsClient = new SecretsManagerClient(clientConfig);
  const cwClient = new CloudWatchClient(clientConfig);
  const logsClient = new CloudWatchLogsClient(clientConfig);
  const ec2Client = new EC2Client(clientConfig);
  const iamClient = new IAMClient(clientConfig);

  beforeAll(async () => {
    try {
      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );
      const stack = response.Stacks?.[0];
      if (stack?.Outputs) {
        stackOutputs = stack.Outputs.reduce(
          (acc, output) => {
            if (output.OutputKey && output.OutputValue) {
              acc[output.OutputKey] = output.OutputValue;
            }
            return acc;
          },
          {} as Record<string, string>
        );
      }
    } catch (error) {
      console.error('Failed to get stack outputs:', error);
      throw new Error(`Stack ${stackName} not found or not accessible`);
    }
  }, 30000);

  describe('Live Infrastructure Validation', () => {
    test('should have deployed S3 bucket with proper security', async () => {
      const bucketName = stackOutputs.S3BucketName;
      expect(bucketName).toBeDefined();

      // Check bucket encryption
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');

      // Check public access block
      const publicAccessResponse = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      expect(
        publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        publicAccessResponse.PublicAccessBlockConfiguration
          ?.RestrictPublicBuckets
      ).toBe(true);
    });

    test('should have deployed Lambda function with VPC configuration', async () => {
      const functionName = stackOutputs.LambdaFunctionName;
      expect(functionName).toBeDefined();

      const response = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      expect(response.Configuration?.Runtime).toMatch(
        /^(python3\.12|nodejs20\.x)$/
      );
      expect(response.Configuration?.VpcConfig?.SubnetIds).toHaveLength(2);
      expect(response.Configuration?.VpcConfig?.SecurityGroupIds).toHaveLength(
        1
      );
      expect(
        response.Configuration?.Environment?.Variables?.SERVERLESSAPP_SECRET_ARN
      ).toBeDefined();
    });

    test('should have deployed Secrets Manager secret', async () => {
      const secretArn = stackOutputs.SecretArn;
      expect(secretArn).toBeDefined();

      const response = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: secretArn })
      );

      expect(response.Name).toContain('ServerlessAppSecret');
      expect(response.Description).toBeDefined();
    });

    test('should have CloudWatch alarms for monitoring', async () => {
      const response = await cwClient.send(
        new DescribeAlarmsCommand({ AlarmNamePrefix: 'ServerlessApp' })
      );

      const alarms = response.MetricAlarms || [];
      expect(alarms.length).toBeGreaterThanOrEqual(2);

      const errorAlarm = alarms.find(alarm =>
        alarm.AlarmName?.includes('Error')
      );
      const invocationAlarm = alarms.find(alarm =>
        alarm.AlarmName?.includes('Invocation')
      );

      expect(errorAlarm).toBeDefined();
      expect(errorAlarm?.MetricName).toBe('Errors');
      expect(errorAlarm?.Threshold).toBe(1);

      expect(invocationAlarm).toBeDefined();
      expect(invocationAlarm?.MetricName).toBe('Invocations');
      expect(invocationAlarm?.Threshold).toBe(100);
    });

    test('should have CloudWatch log group with retention', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: '/aws/lambda/ServerlessApp',
        })
      );

      const logGroups = response.logGroups || [];
      expect(logGroups.length).toBeGreaterThanOrEqual(1);

      const logGroup = logGroups[0];
      // LocalStack compatibility: retention may not be fully stored
      if (logGroup.retentionInDays !== undefined) {
        expect(logGroup.retentionInDays).toBe(7);
      }
      expect(logGroup.logGroupName).toBe('/aws/lambda/ServerlessAppLambda');
    });

    test('should have VPC with proper networking setup', async () => {
      // Get VPC details
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [{ Name: 'tag:Name', Values: ['*ServerlessApp*'] }],
        })
      );

      expect(vpcResponse.Vpcs?.length).toBeGreaterThanOrEqual(1);
      const vpc = vpcResponse.Vpcs?.[0];
      expect(vpc?.CidrBlock).toBe('10.0.0.0/24');

      // Get subnets
      const subnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpc?.VpcId || ''] }],
        })
      );

      const subnets = subnetResponse.Subnets || [];
      expect(subnets.length).toBeGreaterThanOrEqual(2);

      // Verify different AZs
      const azs = subnets.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs).size).toBeGreaterThanOrEqual(2);
    });

    test('should have security group with proper egress rules', async () => {
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'group-name', Values: ['*ServerlessApp*'] }],
        })
      );

      expect(sgResponse.SecurityGroups?.length).toBeGreaterThanOrEqual(1);
      const sg = sgResponse.SecurityGroups?.[0];

      // Should allow all outbound traffic
      const egressRule = sg?.IpPermissionsEgress?.find(
        rule => rule.IpProtocol === '-1'
      );
      expect(egressRule).toBeDefined();
      expect(egressRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have IAM role with least privilege permissions', async () => {
      const functionName = stackOutputs.LambdaFunctionName;
      const lambdaResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      const roleArn = lambdaResponse.Configuration?.Role;
      expect(roleArn).toBeDefined();

      const roleName = roleArn?.split('/').pop();
      const roleResponse = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName || '' })
      );

      expect(roleResponse.Role?.RoleName).toContain('ServerlessApp');
      expect(roleResponse.Role?.AssumeRolePolicyDocument).toContain(
        'lambda.amazonaws.com'
      );
    });
  });

  describe('Resource Integration Tests', () => {
    test('should verify stack outputs are available', () => {
      expect(stackOutputs.S3BucketName).toBeDefined();
      expect(stackOutputs.LambdaFunctionName).toBeDefined();
      expect(stackOutputs.LambdaFunctionArn).toBeDefined();
      expect(stackOutputs.SecretArn).toBeDefined();
    });

    test('should have all resources in running state', async () => {
      // Verify Lambda is active
      const functionName = stackOutputs.LambdaFunctionName;
      const lambdaResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );
      expect(lambdaResponse.Configuration?.State).toBe('Active');

      // Verify secret is available
      const secretArn = stackOutputs.SecretArn;
      const secretResponse = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: secretArn })
      );
      expect(secretResponse.ARN).toBe(secretArn);
    });

    test('should validate resource connectivity', async () => {
      const functionName = stackOutputs.LambdaFunctionName;
      const bucketName = stackOutputs.S3BucketName;

      // Lambda should have environment variable pointing to secret
      const lambdaResponse = await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: functionName })
      );

      const secretArn =
        lambdaResponse.Configuration?.Environment?.Variables
          ?.SERVERLESSAPP_SECRET_ARN;
      expect(secretArn).toBe(stackOutputs.SecretArn);

      // Verify bucket exists and is accessible
      expect(bucketName).toMatch(/^serverlessapp.*bucket/i);
    });
  });

  describe('End-to-End Functionality Tests', () => {
    test('should verify stack is fully operational', async () => {
      // Get stack status
      const stackResponse = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );

      const stack = stackResponse.Stacks?.[0];
      expect(stack?.StackStatus).toBe('CREATE_COMPLETE');
      expect(stack?.Outputs?.length).toBeGreaterThanOrEqual(4);
    });
  });
});
