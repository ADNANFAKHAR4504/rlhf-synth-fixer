import fs from 'fs';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeAddressesCommand,
} from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  GetRolePolicyCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  ResourceGroupsTaggingAPIClient,
  GetResourcesCommand,
} from '@aws-sdk/client-resource-groups-tagging-api';
const REGION = 'us-east-1'; // or your desired region

const ec2 = new EC2Client({ region: REGION });
const rds = new RDSClient({ region: REGION });
const s3 = new S3Client({ region: REGION });
const iam = new IAMClient({ region: REGION });

const environmentSuffix = process.env.CDK_CONTEXT_ENVIRONMENT_SUFFIX || 'dev';

let outputs: Record<string, any> = {};
const outputsFile = 'cfn-outputs/flat-outputs.json';

if (fs.existsSync(outputsFile)) {
  try {
    outputs = JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
  } catch (error) {
    console.warn(`Failed to read outputs file: ${error}`);
  }
} else {
  console.warn(
    `Outputs file ${outputsFile} not found. Integration tests will be limited.`
  );
}

describe('WebServerStack CDK Outputs', () => {
  const elasticIP = outputs.ElasticIP;
  const rdsAddress = outputs.RDSADDRESS;
  const rdsPort = outputs.RDSPORT;
  const s3BucketName = outputs.S3;

  test('should have ElasticIP, RDS, and S3 outputs defined', () => {
    expect(elasticIP).toBeDefined();
    expect(rdsAddress).toBeDefined();
    expect(rdsPort).toBeDefined();
    expect(s3BucketName).toBeDefined();
  });

  test('ElasticIP should be a valid IP address', () => {
    const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    expect(elasticIP).toMatch(ipRegex);
  });

  test('RDS address should be a valid RDS endpoint hostname', () => {
    const rdsRegex = /^[\w-]+\.c[\w\d-]+\.([\w-]+)\.rds\.amazonaws\.com$/;
    expect(rdsAddress).toMatch(rdsRegex);
  });

  test('RDS port should be a valid port number', () => {
    const portNum = Number(rdsPort);
    expect(portNum).toBeGreaterThanOrEqual(1024);
    expect(portNum).toBeLessThanOrEqual(65535);
  });

  test('S3 bucket name should follow AWS naming conventions', () => {
    const s3Regex = /^[a-z0-9.-]{3,63}$/;
    expect(s3BucketName).toMatch(s3Regex);
  });
});

describe('WebServerStack Integration Test', () => {
  it('should verify EC2 instance exists by Elastic IP', async () => {
    const res = await ec2.send(new DescribeAddressesCommand({}));
    const address = res.Addresses?.find(
      addr => addr.PublicIp === outputs.ElasticIP
    );
    expect(address).toBeDefined();
    expect(address?.InstanceId).toBeDefined();
  });

  it('should verify RDS instance is available', async () => {
    const res = await rds.send(new DescribeDBInstancesCommand({}));
    const dbInstance = res.DBInstances?.find(
      db => db.Endpoint?.Address === outputs.RDSADDRESS
    );
    expect(dbInstance).toBeDefined();
    expect(dbInstance?.DBInstanceStatus).toEqual('available');
    expect(dbInstance?.Endpoint?.Port?.toString()).toEqual(outputs.RDSPORT);
  });

  it('should verify S3 bucket exists', async () => {
    const res = await s3.send(new HeadBucketCommand({ Bucket: outputs.S3 }));
    expect(res.$metadata.httpStatusCode).toBe(200);
  });
});

describe('EC2 Instance and Role Integration Test', () => {
  let instanceId: string | undefined;
  let roleName = outputs.EC2RoleName;

  test('should find EC2 instance with specified name tag and validate Elastic IP', async () => {
    const res = await ec2.send(new DescribeInstancesCommand({}));
    const instance = res.Reservations?.flatMap(r => r.Instances ?? []).find(
      inst =>
        inst.Tags?.some(
          tag => tag.Key === 'Name' && tag.Value === outputs.EC2InstanceName
        )
    );
    expect(instance).toBeDefined();
    expect(instance?.State?.Name).toBe('running');
    instanceId = instance?.InstanceId;

    const eipRes = await ec2.send(new DescribeAddressesCommand({}));
    const eip = eipRes.Addresses?.find(ip => ip.InstanceId === instanceId);
    expect(eip?.PublicIp).toBe(outputs.ElasticIP);
  });

  test('should verify IAM role exists and contains expected policies', async () => {
    const roleRes = await iam.send(
      new GetRoleCommand({ RoleName: outputs.EC2RoleName })
    );
    const role = roleRes.Role;
    expect(role).toBeDefined();
    expect(role?.AssumeRolePolicyDocument).toBeDefined();

    const inlinePolicyRes = await iam.send(
      new GetRolePolicyCommand({
        RoleName: outputs.EC2RoleName,
        PolicyName: 'S3ReadOnlyAccess',
      })
    );

    const policyDocument = inlinePolicyRes.PolicyDocument;

    let decodedPolicy: any;
    try {
      decodedPolicy =
        typeof policyDocument === 'string'
          ? JSON.parse(decodeURIComponent(policyDocument))
          : policyDocument;
    } catch (err) {
      console.error('Policy decode error:', err);
    }

    expect(decodedPolicy?.Statement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Action: expect.arrayContaining(['s3:GetObject', 's3:ListBucket']),
          Effect: 'Allow',
        }),
      ])
    );

    const attachedPoliciesRes = await iam.send(
      new ListAttachedRolePoliciesCommand({
        RoleName: outputs.EC2RoleName,
      })
    );

    const hasRdsPolicy = attachedPoliciesRes.AttachedPolicies?.some(
      policy => policy.PolicyName === 'AmazonRDSReadOnlyAccess'
    );
    expect(hasRdsPolicy).toBe(true);
  });
});

describe('Elastic IP Integration Test', () => {
  const elasticIp = outputs.ElasticIP;

  test('should be associated with an EC2 instance and exist', async () => {
    expect(elasticIp).toBeDefined();

    const ec2Client = new EC2Client({ region: REGION });

    const command = new DescribeAddressesCommand({
      PublicIps: [elasticIp],
    });

    const response = await ec2Client.send(command);

    expect(response.Addresses).toBeDefined();
    expect(response.Addresses?.length).toBeGreaterThan(0);

    const addressInfo = response.Addresses![0];

    expect(addressInfo.PublicIp).toEqual(elasticIp);
    expect(addressInfo.InstanceId).toBeDefined();
  });
});

const client = new ResourceGroupsTaggingAPIClient({ region: 'us-east-1' });

describe('Deployed resources tagging integration test', () => {
  it('should verify that all resources have required tags', async () => {
    const command = new GetResourcesCommand({});
    const response = await client.send(command);

    const resourceTagList = response.ResourceTagMappingList || [];

    expect(resourceTagList.length).toBeGreaterThan(0);

    for (const resource of resourceTagList) {
      const arn = resource.ResourceARN;
      const tags = resource.Tags || [];

      const tagKeys = tags.map(t => t.Key);
      const tagMap = Object.fromEntries(tags.map(t => [t.Key, t.Value]));

      expect(tagKeys).toContain('Environment');

      const envTag = tagMap['Environment'];
      expect(typeof envTag).toBe('string'); // type guard for TS

      // Optional: check for specific tags on certain resource types
      if (arn?.includes('ec2')) {
        expect(tagKeys).toContain('Name');
      }

      // Log for debug
      console.log(`✅ Verified tags for resource: ${arn}`);
    }
  }, 15000); // increase timeout if needed
});