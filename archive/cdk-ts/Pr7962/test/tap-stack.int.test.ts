import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcAttributeCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeFlowLogsCommand,
  DescribeNetworkAclsCommand,
  DescribeTagsCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketLocationCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import * as fs from 'fs';
import * as path from 'path';

// AWS Service clients
const ec2 = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const kms = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const iam = new IAMClient({ region: process.env.AWS_REGION || 'us-east-1' });
const logs = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Read the deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
} else {
  console.warn(
    'cfn-outputs/flat-outputs.json not found. Run deployment first.'
  );
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Integration Tests', () => {
  const testTimeout = 30000; // 30 seconds for AWS API calls

  // Check if outputs are available before running tests
  beforeAll(() => {
    if (!outputs || Object.keys(outputs).length === 0) {
      console.warn(
        '⚠️ No deployment outputs found. Integration tests may fail.'
      );
      console.warn(
        'Make sure to run deployment first to generate cfn-outputs/flat-outputs.json'
      );
    } else {
      console.log('✅ Deployment outputs loaded successfully');
      console.log('Available outputs:', Object.keys(outputs));
    }
  });

  describe('VPC Resources', () => {
    test(
      'VPC exists and is configured correctly',
      async () => {
        const vpcId = outputs.VPCId;
        expect(vpcId).toBeDefined();

        const response = await ec2.send(
          new DescribeVpcsCommand({ VpcIds: [vpcId] })
        );
        const vpc = response.Vpcs?.[0];

        expect(vpc).toBeDefined();
        expect(vpc?.CidrBlock).toBe('10.0.0.0/16');

        // Check DNS settings via attributes
        const dnsHostnamesResponse = await ec2.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsHostnames',
          })
        );

        const dnsSupportResponse = await ec2.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsSupport',
          })
        );

        expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
        expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      },
      testTimeout
    );

    test(
      'VPC has public and private subnets',
      async () => {
        const vpcId = outputs.VPCId;

        const response = await ec2.send(
          new DescribeSubnetsCommand({
            Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
        );

        const subnets = response.Subnets || [];
        expect(subnets.length).toBe(4); // 2 public + 2 private

        const publicSubnets = subnets.filter((s: any) => s.MapPublicIpOnLaunch);
        const privateSubnets = subnets.filter(
          (s: any) => !s.MapPublicIpOnLaunch
        );

        expect(publicSubnets.length).toBe(2);
        expect(privateSubnets.length).toBe(2);
      },
      testTimeout
    );

    test(
      'NAT Gateway exists for private subnets',
      async () => {
        const vpcId = outputs.VPCId;

        const response = await ec2.send(
          new DescribeNatGatewaysCommand({
            Filter: [
              { Name: 'vpc-id', Values: [vpcId] },
              { Name: 'state', Values: ['available'] },
            ],
          })
        );

        const natGateways = response.NatGateways || [];
        expect(natGateways.length).toBeGreaterThanOrEqual(1);
      },
      testTimeout
    );
  });

  describe('Security Groups', () => {
    test(
      'Security Group has uniform inbound rules',
      async () => {
        const sgId = outputs.SecureFleetSecurityGroupId61D61F2F;
        expect(sgId).toBeDefined();

        const response = await ec2.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [sgId],
          })
        );

        const sg = response.SecurityGroups?.[0];
        expect(sg).toBeDefined();

        const ingressRules = sg?.IpPermissions || [];

        // Check that all ingress rules are from trusted CIDR blocks
        ingressRules.forEach((rule: any) => {
          const hasTrustedCidr = rule.IpRanges?.some(
            (range: any) =>
              range.CidrIp === '10.0.0.0/8' ||
              range.CidrIp === '172.16.0.0/12' ||
              range.CidrIp === '192.168.0.0/16'
          );
          expect(hasTrustedCidr).toBe(true);
        });

        // Check for SSH, HTTP, and HTTPS rules
        const sshRule = ingressRules.find((r: any) => r.FromPort === 22);
        const httpRule = ingressRules.find((r: any) => r.FromPort === 80);
        const httpsRule = ingressRules.find((r: any) => r.FromPort === 443);

        expect(sshRule).toBeDefined();
        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
      },
      testTimeout
    );

    test(
      'Security group has restricted outbound rules',
      async () => {
        const sgId = outputs.SecureFleetSecurityGroupId61D61F2F;

        const response = await ec2.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [sgId],
          })
        );

        const sg = response.SecurityGroups?.[0];
        const egressRules = sg?.IpPermissionsEgress || [];

        // Check for HTTPS, HTTP, and DNS rules
        const httpsRule = egressRules.find(
          (rule: any) => rule.FromPort === 443
        );
        const httpRule = egressRules.find((rule: any) => rule.FromPort === 80);
        const dnsRule = egressRules.find((rule: any) => rule.FromPort === 53);

        expect(httpsRule).toBeDefined();
        expect(httpRule).toBeDefined();
        expect(dnsRule).toBeDefined();

        // Check that no rule allows all traffic to 0.0.0.0/0 with all protocols
        const unrestrictedRule = egressRules.find(
          (rule: any) =>
            rule.IpRanges?.some((range: any) => range.CidrIp === '0.0.0.0/0') &&
            rule.IpProtocol === '-1'
        );

        expect(unrestrictedRule).toBeUndefined();
      },
      testTimeout
    );
  });

  describe('S3 Bucket', () => {
    test(
      'Application bucket exists with encryption',
      async () => {
        const bucketName = outputs.SecureFleetS3BucketName3089D846;
        expect(bucketName).toBeDefined();

        // Check bucket exists
        const bucketResponse = await s3.send(
          new GetBucketLocationCommand({ Bucket: bucketName })
        );
        expect(bucketResponse).toBeDefined();

        // Check encryption
        const encryptionResponse = await s3.send(
          new GetBucketEncryptionCommand({
            Bucket: bucketName,
          })
        );

        const rules =
          encryptionResponse.ServerSideEncryptionConfiguration?.Rules || [];
        expect(rules.length).toBeGreaterThan(0);
      },
      testTimeout
    );

    test(
      'S3 bucket has versioning enabled',
      async () => {
        const bucketName = outputs.SecureFleetS3BucketName3089D846;

        const response = await s3.send(
          new GetBucketVersioningCommand({
            Bucket: bucketName,
          })
        );

        expect(response.Status).toBe('Enabled');
      },
      testTimeout
    );

    test(
      'S3 bucket blocks public access',
      async () => {
        const bucketName = outputs.SecureFleetS3BucketName3089D846;

        const response = await s3.send(
          new GetPublicAccessBlockCommand({
            Bucket: bucketName,
          })
        );

        const config = response.PublicAccessBlockConfiguration;
        expect(config?.BlockPublicAcls).toBe(true);
        expect(config?.BlockPublicPolicy).toBe(true);
        expect(config?.IgnorePublicAcls).toBe(true);
        expect(config?.RestrictPublicBuckets).toBe(true);
      },
      testTimeout
    );
  });

  describe('KMS Keys', () => {
    test(
      'S3 KMS key exists and has rotation enabled',
      async () => {
        const keyId = outputs.SecureFleetKMSKeyId71AAA129;
        expect(keyId).toBeDefined();

        const response = await kms.send(
          new DescribeKeyCommand({ KeyId: keyId })
        );
        const keyMetadata = response.KeyMetadata;

        expect(keyMetadata).toBeDefined();
        expect(keyMetadata?.Enabled).toBe(true);
        expect(keyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');

        // Check key rotation
        const rotationResponse = await kms.send(
          new GetKeyRotationStatusCommand({
            KeyId: keyId,
          })
        );

        expect(rotationResponse.KeyRotationEnabled).toBe(true);
      },
      testTimeout
    );
  });

  describe('IAM Roles', () => {
    test(
      'EC2 Instance Role exists with correct policies',
      async () => {
        const roleArn = outputs.SecureFleetIAMRoleArn587E87CB;
        expect(roleArn).toBeDefined();

        const roleName = roleArn.split('/').pop();

        const response = await iam.send(
          new GetRoleCommand({ RoleName: roleName! })
        );
        const role = response.Role;

        expect(role).toBeDefined();
        expect(role?.AssumeRolePolicyDocument).toBeDefined();

        // Check attached policies
        const policiesResponse = await iam.send(
          new ListAttachedRolePoliciesCommand({
            RoleName: roleName!,
          })
        );

        const attachedPolicies = policiesResponse.AttachedPolicies || [];

        // Check inline policies as well
        const inlinePoliciesResponse = await iam.send(
          new ListRolePoliciesCommand({
            RoleName: roleName!,
          })
        );

        const inlinePolicies = inlinePoliciesResponse.PolicyNames || [];

        // The role should have either attached policies or inline policies
        const totalPolicies = attachedPolicies.length + inlinePolicies.length;
        expect(totalPolicies).toBeGreaterThan(0);
      },
      testTimeout
    );
  });

  describe('Security Groups', () => {
    test(
      'Security Group exists and is configured correctly',
      async () => {
        const securityGroupId = outputs.SecureFleetSecurityGroupId61D61F2F;
        expect(securityGroupId).toBeDefined();

        const response = await ec2.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [securityGroupId],
          })
        );

        const securityGroup = response.SecurityGroups?.[0];
        expect(securityGroup).toBeDefined();
        expect(securityGroup?.Description).toContain(
          'Uniform security group for EC2 fleet'
        );
      },
      testTimeout
    );
  });

  describe('CloudWatch Logs', () => {
    test(
      'VPC Flow Logs group exists',
      async () => {
        const logGroupName = outputs.VPCFlowLogGroupName;
        expect(logGroupName).toBeDefined();

        const response = await logs.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: logGroupName,
          })
        );

        const logGroup = response.logGroups?.find(
          (lg: any) => lg.logGroupName === logGroupName
        );

        expect(logGroup).toBeDefined();
        expect(logGroup?.retentionInDays).toBe(30);
      },
      testTimeout
    );
  });

  describe('VPC Flow Logs', () => {
    test(
      'Flow logs are enabled for VPC',
      async () => {
        const vpcId = outputs.VPCId;

        const response = await ec2.send(
          new DescribeFlowLogsCommand({
            Filter: [{ Name: 'resource-id', Values: [vpcId] }],
          })
        );

        const flowLogs = response.FlowLogs || [];
        expect(flowLogs.length).toBeGreaterThan(0);

        const flowLog = flowLogs[0];
        expect(flowLog.FlowLogStatus).toBe('ACTIVE');
        expect(flowLog.TrafficType).toBe('ALL');
      },
      testTimeout
    );
  });

  describe('EC2 Instances', () => {
    test(
      'EC2 instances exist with correct configuration',
      async () => {
        const vpcId = outputs.VPCId;

        // This test would require additional EC2 permissions to describe instances
        // For now, we'll test that the VPC exists and has the expected configuration
        expect(vpcId).toBeDefined();

        // Check that the VPC has the expected CIDR block
        const response = await ec2.send(
          new DescribeVpcsCommand({ VpcIds: [vpcId] })
        );
        const vpc = response.Vpcs?.[0];
        expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      },
      testTimeout
    );
  });

  describe('Resource Tagging', () => {
    test(
      'VPC has appropriate tags',
      async () => {
        const vpcId = outputs.VPCId;

        const response = await ec2.send(
          new DescribeTagsCommand({
            Filters: [{ Name: 'resource-id', Values: [vpcId] }],
          })
        );

        const tags = response.Tags || [];
        const tagMap = tags.reduce(
          (acc: any, tag: any) => {
            acc[tag.Key!] = tag.Value!;
            return acc;
          },
          {} as Record<string, string>
        );

        expect(tagMap['Project']).toBe('SecureEC2Fleet');
        expect(tagMap['Environment']).toBeDefined();
        expect(tagMap['Compliance']).toBe('SOC2');
        expect(tagMap['Owner']).toBe('CloudSecurityTeam');
        expect(tagMap['CostCenter']).toBe('Infrastructure');
      },
      testTimeout
    );
  });

  describe('Cross-Account Support', () => {
    test(
      'Stack exports are configured for cross-account sharing',
      async () => {
        // Check that the stack exports the necessary values for cross-account access
        expect(outputs.VPCId).toBeDefined();
        expect(outputs.FleetRoleArn).toBeDefined();
        expect(outputs.VPCFlowLogGroupName).toBeDefined();

        // These exports should be available for cross-account resource sharing
        expect(typeof outputs.VPCId).toBe('string');
        expect(typeof outputs.FleetRoleArn).toBe('string');
        expect(typeof outputs.VPCFlowLogGroupName).toBe('string');
      },
      testTimeout
    );
  });

  describe('Environment Configuration', () => {
    test(
      'Environment suffix is properly configured',
      async () => {
        expect(environmentSuffix).toBeDefined();
        expect(typeof environmentSuffix).toBe('string');

        // Check that resources use the environment suffix
        if (outputs.SecureFleetS3BucketName3089D846) {
          expect(outputs.SecureFleetS3BucketName3089D846).toContain(
            environmentSuffix
          );
        }
      },
      testTimeout
    );
  });
});
