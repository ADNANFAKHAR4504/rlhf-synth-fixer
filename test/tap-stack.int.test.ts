// This is an integration test suite for the deployed Web Server CloudFormation stack.
// It uses the AWS SDK for JavaScript (v3) to verify the created resources.
// Ensure you have the AWS SDK installed (`npm install @aws-sdk/client-ec2 node-fetch`)
// and your AWS credentials configured in the environment where you run these tests.

import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  Instance,
  SecurityGroup,
  Tag,
  IpPermission,
} from '@aws-sdk/client-ec2';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// --- Configuration ---
// These values are read from the cfn-outputs.json file after a successful deployment.
const outputs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../cfn-outputs/flat-outputs.json'), 'utf8')
);

// AWS SDK Clients
const REGION = 'us-east-1'; // Assuming us-east-1 as per the template
const ec2Client = new EC2Client({ region: REGION });

describe('Web Server Stack Integration Tests', () => {
  let instanceDetails: Instance | undefined;
  let securityGroupDetails: SecurityGroup | undefined;

  // Fetch details for the primary resources once before running tests
  beforeAll(async () => {
    // Get EC2 Instance Details from AWS
    const instanceCommand = new DescribeInstancesCommand({
      InstanceIds: [outputs.InstanceId],
    });
    const instanceResponse = await ec2Client.send(instanceCommand);
    if (
      !instanceResponse.Reservations ||
      instanceResponse.Reservations.length === 0
    ) {
      throw new Error(`Instance ${outputs.InstanceId} not found.`);
    }
    instanceDetails = instanceResponse.Reservations[0].Instances?.[0];

    // Get Security Group Details from AWS
    const sgCommand = new DescribeSecurityGroupsCommand({
      GroupIds: [outputs.SecurityGroupId],
    });
    const sgResponse = await ec2Client.send(sgCommand);
    if (!sgResponse.SecurityGroups || sgResponse.SecurityGroups.length === 0) {
      throw new Error(`Security Group ${outputs.SecurityGroupId} not found.`);
    }
    securityGroupDetails = sgResponse.SecurityGroups[0];
  });

  describe('EC2 Instance', () => {
    test('Instance should be in a running state', () => {
      expect(instanceDetails?.State?.Name).toBe('running');
    });

    test('Instance type should be t2.micro', () => {
      expect(instanceDetails?.InstanceType).toBe('t2.micro');
    });

    test('Instance should have the correct tags', () => {
      const tags = Object.fromEntries(
        instanceDetails?.Tags?.map((tag: Tag) => [tag.Key, tag.Value]) || []
      );
      expect(tags.Name).toBe('Production-WebServer');
      expect(tags.Environment).toBe('Production');
      expect(tags.Project).toBe('GlobalResilience');
    });
  });

  describe('Security Group', () => {
    test('Should have exactly two ingress rules', () => {
      expect(securityGroupDetails?.IpPermissions?.length).toBe(2);
    });

    test('Should allow inbound HTTP (port 80) from the correct CIDR', () => {
      const httpRule = securityGroupDetails?.IpPermissions?.find(
        (rule: IpPermission) => rule.FromPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.ToPort).toBe(80);
      expect(httpRule?.IpProtocol).toBe('tcp');
      expect(httpRule?.IpRanges?.[0].CidrIp).toBe('203.0.113.0/24');
    });

    test('Should allow inbound HTTPS (port 443) from the correct CIDR', () => {
      const httpsRule = securityGroupDetails?.IpPermissions?.find(
        (rule: IpPermission) => rule.FromPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.ToPort).toBe(443);
      expect(httpsRule?.IpProtocol).toBe('tcp');
      expect(httpsRule?.IpRanges?.[0].CidrIp).toBe('203.0.113.0/24');
    });
  });

  describe('Web Server Functionality', () => {
    test('Web server should be accessible and return correct content', async () => {
      // It can take a minute for the instance to be fully initialized and the web server to start.
      // A timeout is added to give the instance time.
      const url = `http://${outputs.InstancePublicIp}`;
      let response;
      try {
        response = await fetch(url);
        const text = await response.text();
        expect(response.status).toBe(200);
        expect(text).toContain('<h1>Deployed Successfully via CloudFormation</h1>');
      } catch (error) {
        // Fail the test if the fetch operation fails
        if (error instanceof Error) {
            fail(`Could not connect to the web server at ${url}. Error: ${error.message}`);
        } else {
            fail(`An unknown error occurred while connecting to ${url}`);
        }
      }
    }, 30000); // 30-second timeout for this test
  });
});
