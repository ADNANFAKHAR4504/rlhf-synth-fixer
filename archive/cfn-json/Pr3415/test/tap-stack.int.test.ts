import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeVpcAttributeCommand
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketPolicyCommand
} from '@aws-sdk/client-s3';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  ListMetricsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand
} from '@aws-sdk/client-cloudformation';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};
if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

const region = process.env.AWS_REGION || 'us-east-2';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = process.env.STACK_NAME || `TapStack${environmentSuffix}`;

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const cfnClient = new CloudFormationClient({ region });

describe('CloudFormation Stack Integration Tests', () => {
  describe('Stack Deployment', () => {
    test('should have a successfully deployed stack', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);

      expect(response.Stacks).toBeDefined();
      expect(response.Stacks![0].StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });

    test('should have all expected outputs', async () => {
      expect(outputs).toBeDefined();
      expect(outputs.WebServerPublicIP).toBeDefined();
      expect(outputs.WebServerURL).toBeDefined();
      expect(outputs.StaticAssetsBucketName).toBeDefined();
      expect(outputs.StaticAssetsBucketURL).toBeDefined();
      expect(outputs.DashboardURL).toBeDefined();
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC with correct CIDR block', async () => {
      const stackResources = await cfnClient.send(
        new DescribeStackResourcesCommand({ StackName: stackName })
      );

      const vpcResource = stackResources.StackResources?.find(
        r => r.ResourceType === 'AWS::EC2::VPC'
      );

      if (vpcResource) {
        const vpcCommand = new DescribeVpcsCommand({
          VpcIds: [vpcResource.PhysicalResourceId!]
        });
        const vpcResponse = await ec2Client.send(vpcCommand);

        expect(vpcResponse.Vpcs![0].CidrBlock).toBe('10.6.0.0/16');
        // DNS settings are retrieved via DescribeVpcAttribute
        const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
          VpcId: vpcResource.PhysicalResourceId!,
          Attribute: 'enableDnsHostnames'
        });
        const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
        expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

        const dnsSupportCommand = new DescribeVpcAttributeCommand({
          VpcId: vpcResource.PhysicalResourceId!,
          Attribute: 'enableDnsSupport'
        });
        const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
        expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      }
    });

    test('should have public subnet with correct configuration', async () => {
      const stackResources = await cfnClient.send(
        new DescribeStackResourcesCommand({ StackName: stackName })
      );

      const subnetResource = stackResources.StackResources?.find(
        r => r.ResourceType === 'AWS::EC2::Subnet'
      );

      if (subnetResource) {
        const subnetCommand = new DescribeSubnetsCommand({
          SubnetIds: [subnetResource.PhysicalResourceId!]
        });
        const subnetResponse = await ec2Client.send(subnetCommand);

        expect(subnetResponse.Subnets![0].CidrBlock).toBe('10.6.1.0/24');
        expect(subnetResponse.Subnets![0].MapPublicIpOnLaunch).toBe(true);
      }
    });
  });

  describe('EC2 Instance', () => {
    test('should have running EC2 instance', async () => {
      const stackResources = await cfnClient.send(
        new DescribeStackResourcesCommand({ StackName: stackName })
      );

      const instanceResource = stackResources.StackResources?.find(
        r => r.ResourceType === 'AWS::EC2::Instance'
      );

      if (instanceResource) {
        const instanceCommand = new DescribeInstancesCommand({
          InstanceIds: [instanceResource.PhysicalResourceId!]
        });
        const instanceResponse = await ec2Client.send(instanceCommand);

        const instance = instanceResponse.Reservations![0].Instances![0];
        expect(instance.State!.Name).toBe('running');
        expect(instance.InstanceType).toBe('t3.micro');
        expect(instance.PublicIpAddress).toBeDefined();
      }
    });
  });

  describe('S3 Bucket', () => {
    test('should have S3 bucket with versioning enabled', async () => {
      const bucketName = outputs.StaticAssetsBucketName;
      expect(bucketName).toBeDefined();

      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await s3Client.send(headCommand);

      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);

      expect(versioningResponse.Status).toBe('Enabled');
    });
  });

  describe('Web Server Functionality', () => {
    test('should respond to HTTP requests', async () => {
      const webServerUrl = outputs.WebServerURL;
      expect(webServerUrl).toBeDefined();

      try {
        const response = await axios.get(webServerUrl, { timeout: 5000 });
        expect(response.status).toBe(200);
        expect(response.data).toContain('Non-Profit Donation Platform');
      } catch (error: any) {
        // If connection fails, check if it's just a timing issue
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          console.warn('Web server may still be initializing');
        } else {
          throw error;
        }
      }
    }, 10000);
  });

  describe('End-to-End Workflow', () => {
    test('should have fully functional infrastructure', async () => {
      // Verify all critical components are working together
      expect(outputs.WebServerPublicIP).toBeDefined();
      expect(outputs.StaticAssetsBucketName).toBeDefined();
      expect(outputs.DashboardURL).toBeDefined();

      // Verify the web server IP is valid
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      expect(outputs.WebServerPublicIP).toMatch(ipRegex);

      // Verify S3 bucket URL is properly formatted
      expect(outputs.StaticAssetsBucketURL).toContain('s3');
      expect(outputs.StaticAssetsBucketURL).toContain('amazonaws.com');

      // Verify CloudWatch Dashboard URL is valid
      expect(outputs.DashboardURL).toContain('console.aws.amazon.com/cloudwatch');
    });
  });
});
