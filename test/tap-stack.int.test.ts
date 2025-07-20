// ====================================================================================
// !! IMPORTANT !! TROUBLESHOOTING: "Cannot find module" ERROR
// ====================================================================================
// If you see an error like "Cannot find module '@aws-sdk/client-ec2'" or
// "Cannot find module 'node-fetch'", it means the required packages are not
// installed in your project's `node_modules` folder.
//
// To fix this, you must run the following command in your project's terminal:
//
// npm install --save-dev @aws-sdk/client-ec2 @aws-sdk/client-iam node-fetch @types/node-fetch
//
// This command reads your `package.json` file, downloads the necessary code,
// and makes it available to your test files. This step is essential for both
// local testing and for your CI/CD pipeline.
// ====================================================================================

// This is an integration test suite for the deployed Web Server CloudFormation stack.
// It uses the AWS SDK for JavaScript (v3) to verify the created resources.
// Ensure you have the AWS SDK installed and your AWS credentials configured
// in the environment where you run these tests.

import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  Instance,
  SecurityGroup,
  Tag,
  IpPermission,
  DescribeSecurityGroupsCommandInput,
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

// Helper function to pause execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    const sgIdentifier = outputs.SecurityGroupId;
    let sgCommandInput: DescribeSecurityGroupsCommandInput;

    // FIX: Check if the identifier is an ID (starts with 'sg-') or a name.
    // This makes the test robust against incorrect CloudFormation outputs.
    if (sgIdentifier.startsWith('sg-')) {
      sgCommandInput = { GroupIds: [sgIdentifier] };
    } else {
      sgCommandInput = { GroupNames: [sgIdentifier] };
    }
    
    const sgCommand = new DescribeSecurityGroupsCommand(sgCommandInput);
    const sgResponse = await ec2Client.send(sgCommand);
    
    if (!sgResponse.SecurityGroups || sgResponse.SecurityGroups.length === 0) {
      throw new Error(`Security Group '${sgIdentifier}' not found.`);
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
    // FIX: Implement a polling mechanism to handle EC2 startup delay.
    test('Web server should be accessible and return correct content', async () => {
      const url = `http://${outputs.InstancePublicIp}`;
      const maxRetries = 12; // 12 retries * 5 seconds = 60 seconds total wait time
      let lastError: Error | null = null;

      for (let i = 0; i < maxRetries; i++) {
        try {
          console.log(`Attempt ${i + 1}/${maxRetries}: Pinging ${url}...`);
          const response = await fetch(url);
          if (response.ok) {
            const text = await response.text();
            expect(response.status).toBe(200);
            expect(text).toContain('<h1>Deployed Successfully via CloudFormation</h1>');
            console.log('Connection successful!');
            return; // Exit test successfully
          }
        } catch (error) {
          if (error instanceof Error) {
            lastError = error;
          }
        }
        // Wait 5 seconds before the next retry
        await sleep(5000);
      }

      // If the loop completes without a successful connection, fail the test.
      fail(
        `Web server was not accessible after ${maxRetries * 5} seconds. Last error: ${lastError?.message || 'Unknown error'}`
      );
    }, 90000); // Increased test timeout to 90 seconds to accommodate polling
  });
});
