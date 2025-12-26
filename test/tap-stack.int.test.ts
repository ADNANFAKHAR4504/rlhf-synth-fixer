import {
  CloudWatchClient
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
  type IpPermission,
  type IpRange,
  type SecurityGroup,
  type Subnet,
  type Tag
} from '@aws-sdk/client-ec2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  KMSClient
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client
} from '@aws-sdk/client-s3';
import { GetCallerIdentityCommand, STSClient } from '@aws-sdk/client-sts';
import * as fs from 'fs';
import * as path from 'path';

// Load stack outputs
const loadStackOutputs = () => {
  try {
    const outputsPath = path.join(__dirname, '../cfn-outputs/all-outputs.json');
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    const allOutputs = JSON.parse(outputsContent);
    
    // Extract the first (and likely only) stack's outputs
    const stackNames = Object.keys(allOutputs);
    if (stackNames.length === 0) {
      throw new Error('No stack outputs found in all-outputs.json');
    }
    
    const stackName = stackNames[0];
    console.log(`Using outputs from stack: ${stackName}`);
    return allOutputs[stackName];
  } catch (error) {
    throw new Error(`Failed to load stack outputs: ${error}`);
  }
};

// Extract region from stack outputs
const extractRegionFromOutputs = (stackOutputs: any): string => {
  // Try to extract region from RDS endpoint
  if (stackOutputs.rdsEndpoint) {
    const match = stackOutputs.rdsEndpoint.match(/\.([a-z0-9-]+)\.rds\.amazonaws\.com/);
    if (match) {
      return match[1];
    }
  }
  
  // Try to extract region from IAM ARN
  if (stackOutputs.applicationRoleArn) {
    const match = stackOutputs.applicationRoleArn.match(/app-role-pr\d+-([a-z0-9-]+)-/);
    if (match) {
      return match[1];
    }
  }
  
  // Fallback to environment variable or default
  return process.env.AWS_REGION || 'us-east-1';
};

// Initialize AWS clients
const initializeClients = (region: string) => {
  return {
    ec2: new EC2Client({ region }),
    rds: new RDSClient({ region }),
    s3: new S3Client({ region }),
    kms: new KMSClient({ region }),
    iam: new IAMClient({ region }),
    sts: new STSClient({ region }),
    cloudwatch: new CloudWatchClient({ region }),
  };
};

// Helper function to wait for a condition with timeout
const waitForCondition = async (
  condition: () => Promise<boolean>,
  timeout: number = 30000,
  interval: number = 2000
): Promise<void> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Generate unique test ID
const generateTestId = (): string => {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

describe('TAP Infrastructure Integration Tests', () => {
  let stackOutputs: any;
  let clients: any;
  let accountId: string;
  let region: string;

  beforeAll(async () => {
    // Load stack outputs
    stackOutputs = loadStackOutputs();
    console.log('Loaded stack outputs:', JSON.stringify(stackOutputs, null, 2));

    // Extract region from stack outputs
    region = extractRegionFromOutputs(stackOutputs);
    console.log(`Detected region from stack outputs: ${region}`);

    // Initialize AWS clients with the correct region
    clients = initializeClients(region);

    // Get account ID
    try {
      const identity = await clients.sts.send(new GetCallerIdentityCommand({}));
      accountId = identity.Account!;
      console.log(`Running tests against AWS account: ${accountId}`);
    } catch (error) {
      throw new Error(`Failed to get AWS account identity: ${error}`);
    }
  });
});
