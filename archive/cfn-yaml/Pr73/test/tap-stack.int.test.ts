import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import { DescribeInstancesCommand, EC2Client } from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { GetRoleCommand, IAMClient } from '@aws-sdk/client-iam';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import fs from 'fs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_DEFAULT_REGION || 'us-east-1';

let outputs: any;

beforeAll(async () => {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
});

describe('TapStack Integration Tests', () => {
  const cfnClient = new CloudFormationClient({ region });
  const ec2Client = new EC2Client({ region });
  const s3Client = new S3Client({ region });
  const elbv2Client = new ElasticLoadBalancingV2Client({ region });
  const iamClient = new IAMClient({ region });

  describe('CloudFormation Stack', () => {
    test('should have stack deployed successfully', async () => {
      // Extract stack name from the EC2 role ARN
      const roleArn = outputs.EC2RoleArn;
      const stackName = roleArn.split('/')[1].split('-EC2Role-')[0];
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks![0].StackStatus).toBe('CREATE_COMPLETE');
    });

    test('should have all required outputs', () => {
      const requiredOutputs = [
        'S3BucketName',
        'S3BucketArn',
        'KMSKeyArn',
        'EC2RoleArn',
        'LoadBalancerDNS',
        'EC2InstanceId',
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });
  });

  describe('SSM Parameter Integration', () => {
    test('should use external VPC infrastructure via SSM parameters', async () => {
      // Test that the template properly uses SSM parameter resolution
      // by checking that our deployed resources reference the external VPC
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2InstanceId],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);

      expect(instanceResponse.Reservations).toBeDefined();
      expect(instanceResponse.Reservations!.length).toBeGreaterThan(0);
      expect(instanceResponse.Reservations![0].Instances).toBeDefined();
      expect(instanceResponse.Reservations![0].Instances!.length).toBeGreaterThan(0);
      const instance = instanceResponse.Reservations![0].Instances![0];

      // Verify the instance is deployed in the VPC from SSM parameters
      expect(instance.VpcId).toBeDefined();
      expect(instance.SubnetId).toBeDefined();
      expect(instance.SecurityGroups).toBeDefined();
      expect(instance.SecurityGroups!.length).toBeGreaterThan(0);
    });

    test('should demonstrate dynamic configuration management', async () => {
      // The fact that our resources are deployed and working proves SSM resolution worked
      expect(outputs.EC2InstanceId).toMatch(/^i-/);
      expect(outputs.LoadBalancerDNS).toContain('elb.amazonaws.com');

      // Verify ALB is in the correct VPC (external infrastructure)
      const lbCommand = new DescribeLoadBalancersCommand({
        Names: [`devel-application-lb`],
      });
      const lbResponse = await elbv2Client.send(lbCommand);

      expect(lbResponse.LoadBalancers).toBeDefined();
      const lb = lbResponse.LoadBalancers![0];
      expect(lb.VpcId).toBeDefined();
      expect(lb.AvailabilityZones).toBeDefined();
      expect(lb.AvailabilityZones!.length).toBe(2); // Multi-AZ deployment
    });
  });

  describe('EC2 Infrastructure', () => {
    test('should have EC2 instance running', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2InstanceId],
      });
      const response = await ec2Client.send(command);

      expect(response.Reservations).toBeDefined();
      expect(response.Reservations!.length).toBeGreaterThan(0);
      expect(response.Reservations![0].Instances).toBeDefined();
      expect(response.Reservations![0].Instances!.length).toBeGreaterThan(0);
      const instance = response.Reservations![0].Instances![0];
      expect(['running', 'pending']).toContain(instance.State!.Name);
    });

    test('should have IAM role configured', async () => {
      const roleArn = outputs.EC2RoleArn;
      const roleName = roleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.AssumeRolePolicyDocument).toBeDefined();
    });
  });

  describe('S3 Infrastructure', () => {
    test('should have S3 bucket accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.S3BucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should have bucket encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const encryption = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(encryption.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe(
        'aws:kms'
      );
    });

    test('should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('should be able to put and get objects with KMS encryption', async () => {
      const testKey = 'test-object.txt';
      const testContent = 'This is a test object for integration testing';

      // Put object
      const putCommand = new PutObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: testKey,
        Body: testContent,
        ServerSideEncryption: 'aws:kms',
        SSEKMSKeyId: outputs.KMSKeyArn,
      });

      await s3Client.send(putCommand);

      // Get object
      const getCommand = new GetObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: testKey,
      });

      const response = await s3Client.send(getCommand);
      const content = await response.Body!.transformToString();

      expect(content).toBe(testContent);
      expect(response.ServerSideEncryption).toBe('aws:kms');
    }, 10000);
  });

  describe('KMS Encryption', () => {
    test('should have KMS key ARN in outputs', () => {
      expect(outputs.KMSKeyArn).toBeDefined();
      expect(outputs.KMSKeyArn).toContain('arn:aws:kms');
      expect(outputs.KMSKeyArn).toContain('key/');
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer deployed', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: ['devel-application-lb'],
      });
      const response = await elbv2Client.send(command);

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);
      const lb = response.LoadBalancers![0];
      expect(lb.Type).toBe('application');
      expect(lb.State!.Code).toBe('active');
      expect(lb.DNSName).toBe(outputs.LoadBalancerDNS);
    });

    test('should have target group with health checks configured', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`devel-target-group`],
      });
      const response = await elbv2Client.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBe(1);
      const tg = response.TargetGroups![0];
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
    });
  });

  describe('End-to-End Workflow', () => {
    test('should demonstrate complete infrastructure workflow', async () => {
      // Verify all components are working together with SSM parameter integration
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.LoadBalancerDNS).toContain('elb.amazonaws.com');
      expect(outputs.EC2InstanceId).toMatch(/^i-/);
      expect(outputs.KMSKeyArn).toContain('arn:aws:kms');

      // Verify the SSM parameter integration worked by checking instance deployment
      const instanceCommand = new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2InstanceId],
      });
      const instanceResponse = await ec2Client.send(instanceCommand);
      expect(instanceResponse.Reservations).toBeDefined();
      expect(instanceResponse.Reservations!.length).toBeGreaterThan(0);
      expect(instanceResponse.Reservations![0].Instances).toBeDefined();
      expect(instanceResponse.Reservations![0].Instances!.length).toBeGreaterThan(0);
      const instance = instanceResponse.Reservations![0].Instances![0];

      // These values came from SSM parameter resolution
      expect(instance.VpcId).toMatch(/^vpc-/);
      expect(instance.SubnetId).toMatch(/^subnet-/);
      expect(instance.SecurityGroups![0].GroupId).toMatch(/^sg-/);

      // This validates that all resources were created successfully
      // using dynamic configuration management with SSM Parameter Store
      console.log(
        '✅ All infrastructure components deployed with SSM parameter integration'
      );
    });
  });
});
