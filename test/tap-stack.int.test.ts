import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
  StackResource,
} from '@aws-sdk/client-cloudformation';
import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import { GetBucketTaggingCommand, S3Client } from '@aws-sdk/client-s3';

// --- Configuration ---
// The name of the stack to be tested. This should be deployed beforehand.
// The test is designed to run against a 'prod' environment to validate conditional resources.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `tap-stack-${environmentSuffix}`;
const region = process.env.AWS_REGION || 'us-east-1';

// --- AWS Clients ---
const cfnClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const iamClient = new IAMClient({ region });

// --- Test Suite ---
describe('TapStack Integration Tests', () => {
  let stackResources: StackResource[] = [];

  // Helper function to find a resource's Physical ID
  const getPhysicalId = (logicalId: string): string | undefined => {
    return stackResources.find(r => r.LogicalResourceId === logicalId)
      ?.PhysicalResourceId;
  };

  beforeAll(async () => {
    // Fetch stack details once before all tests
    try {
      const stacksCommand = new DescribeStacksCommand({ StackName: stackName });
      const stacksResponse = await cfnClient.send(stacksCommand);
      const stack = stacksResponse.Stacks?.[0];

      if (
        !stack ||
        !['CREATE_COMPLETE', 'UPDATE_COMPLETE'].includes(
          stack.StackStatus || ''
        )
      ) {
        throw new Error(
          `Stack ${stackName} not found or not in a successful state.`
        );
      }

      const resourcesCommand = new DescribeStackResourcesCommand({
        StackName: stackName,
      });
      const resourcesResponse = await cfnClient.send(resourcesCommand);
      stackResources = resourcesResponse.StackResources || [];
    } catch (error) {
      console.error(
        'Failed to fetch stack details. Ensure the stack is deployed and its name is correct.',
        error
      );
      // Fail fast if we can't get stack details
      throw error;
    }
  }, 30000); // 30s timeout for setup

  // Only run EC2 tests if it's a 'prod' environment, due to the Condition
  if (environmentSuffix === 'prod') {
    describe('ProductionOnlyInstance (EC2)', () => {
      let instanceId: string | undefined;
      let instanceDetails: any;

      beforeAll(async () => {
        instanceId = getPhysicalId('ProductionOnlyInstance');
        expect(instanceId).toBeDefined();

        const command = new DescribeInstancesCommand({
          InstanceIds: [instanceId!],
        });
        const data = await ec2Client.send(command);
        instanceDetails = data.Reservations?.[0]?.Instances?.[0];
        expect(instanceDetails).toBeDefined();
      });

      test('should be running', () => {
        expect(instanceDetails.State?.Name).toBe('running');
      });

      test('should have the correct "Environment" tag', () => {
        const envTag = instanceDetails.Tags?.find(
          (t: any) => t.Key === 'Environment'
        );
        expect(envTag).toBeDefined();
        expect(envTag.Value).toBe(stackName);
      });

      test('should have the correct Security Group attached', () => {
        const sgId = getPhysicalId('AppSecurityGroup');
        expect(sgId).toBeDefined();
        expect(instanceDetails.SecurityGroups).toContainEqual(
          expect.objectContaining({ GroupId: sgId })
        );
      });

      test('should have the correct IAM Instance Profile attached', () => {
        const profileId = getPhysicalId('EC2InstanceProfile');
        expect(profileId).toBeDefined();
        expect(instanceDetails.IamInstanceProfile?.Arn).toContain(profileId);
      });

      test('should be using a dynamic AMI from SSM', () => {
        expect(instanceDetails.ImageId).toMatch(/^ami-/);
      });
    });
  }

  describe('AppS3Bucket', () => {
    test('should have the "Environment" tag set to the stack name', async () => {
      const bucketId = getPhysicalId('AppS3Bucket');
      expect(bucketId).toBeDefined();
      const s3Tags = await s3Client.send(
        new GetBucketTaggingCommand({ Bucket: bucketId! })
      );
      expect(s3Tags.TagSet).toContainEqual({
        Key: 'Environment',
        Value: stackName,
      });
    });
  });

  describe('AppSecurityGroup', () => {
    test('should allow inbound HTTP and HTTPS traffic', async () => {
      const sgId = getPhysicalId('AppSecurityGroup');
      expect(sgId).toBeDefined();
      const command = new DescribeSecurityGroupsCommand({ GroupIds: [sgId!] });
      const data = await ec2Client.send(command);
      const sgDetails = data.SecurityGroups?.[0];

      const httpRule = sgDetails?.IpPermissions?.find(
        (p: any) => p.FromPort === 80 && p.ToPort === 80
      );
      expect(httpRule?.IpRanges).toContainEqual({ CidrIp: '0.0.0.0/0' });

      const httpsRule = sgDetails?.IpPermissions?.find(
        (p: any) => p.FromPort === 443 && p.ToPort === 443
      );
      expect(httpsRule?.IpRanges).toContainEqual({ CidrIp: '0.0.0.0/0' });
    });
  });

  describe('EC2InstanceRole (IAM)', () => {
    test('should have a trust policy for the EC2 service', async () => {
      const roleName = getPhysicalId('EC2InstanceRole');
      expect(roleName).toBeDefined();
      const command = new GetRoleCommand({ RoleName: roleName! });
      const data = await iamClient.send(command);
      const policy = JSON.parse(
        decodeURIComponent(data.Role!.AssumeRolePolicyDocument!)
      );
      const statement = policy.Statement[0];
      expect(statement.Principal.Service).toBe('ec2.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });
  });
});
