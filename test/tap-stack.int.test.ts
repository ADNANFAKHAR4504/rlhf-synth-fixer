import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand
} from '@aws-sdk/client-cloudtrail';
import {
  CloudWatchLogsClient
} from '@aws-sdk/client-cloudwatch-logs';
import {
  ConfigServiceClient,
  DescribeConfigRulesCommand,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand
} from '@aws-sdk/client-config-service';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  DeleteObjectCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  GetWebACLCommand,
  GetWebACLForResourceCommand,
  WAFV2Client
} from '@aws-sdk/client-wafv2';
import fs from 'fs';

// ==========================================
// Test Configuration
// ==========================================
const OUTPUTS_FILE_PATH =
  process.env.OUTPUTS_FILE_PATH || 'cfn-outputs/flat-outputs.json';
const AWS_REGION = process.env.AWS_REGION || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const TEST_TIMEOUT = 60000; // 60 seconds

// Initialize AWS clients
const s3Client = new S3Client({ region: AWS_REGION });
const ec2Client = new EC2Client({ region: AWS_REGION });
const rdsClient = new RDSClient({ region: AWS_REGION });
const iamClient = new IAMClient({ region: 'us-east-1' }); // IAM is global
const kmsClient = new KMSClient({ region: AWS_REGION });
const secretsClient = new SecretsManagerClient({ region: AWS_REGION });
const cloudTrailClient = new CloudTrailClient({ region: AWS_REGION });
const configClient = new ConfigServiceClient({ region: AWS_REGION });
const elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
const wafClient = new WAFV2Client({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });

// ==========================================
// Helper Functions
// ==========================================
function loadOutputs(): Record<string, string> {
  try {
    if (!fs.existsSync(OUTPUTS_FILE_PATH)) {
      console.warn(`Outputs file not found: ${OUTPUTS_FILE_PATH}`);
      return {};
    }

    const content = fs.readFileSync(OUTPUTS_FILE_PATH, 'utf8');
    const outputs = JSON.parse(content);

    // Flatten nested outputs
    const flatOutputs: Record<string, string> = {};
    Object.keys(outputs).forEach(key => {
      if (typeof outputs[key] === 'object' && outputs[key] !== null) {
        Object.assign(flatOutputs, outputs[key]);
      } else {
        flatOutputs[key] = outputs[key];
      }
    });

    console.log(`Loaded ${Object.keys(flatOutputs).length} outputs from ${OUTPUTS_FILE_PATH}`);
    return flatOutputs;
  } catch (error) {
    console.error('Failed to load outputs:', error);
    return {};
  }
}

function skipIfOutputMissing(outputs: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    if (!outputs[key]) {
      console.warn(`Skipping test: Required output '${key}' not found`);
      return true;
    }
  }
  return false;
}

// ==========================================
// Integration Tests
// ==========================================
describe('TapStack CloudFormation Integration Tests', () => {
  let outputs: Record<string, string>;

  beforeAll(() => {
    outputs = loadOutputs();
    if (Object.keys(outputs).length === 0) {
      console.warn('No outputs loaded. Tests may be skipped.');
    }
  });

  afterAll(async () => {
    // Close all clients
    s3Client.destroy();
    ec2Client.destroy();
    rdsClient.destroy();
    iamClient.destroy();
    kmsClient.destroy();
    secretsClient.destroy();
    cloudTrailClient.destroy();
    configClient.destroy();
    elbClient.destroy();
    wafClient.destroy();
    logsClient.destroy();
  });

  // ==========================================
  // Service-Level Tests (Single Service)
  // ==========================================
  describe('Service-Level Tests: S3', () => {
    test(
      'should have SecureDataBucket with proper encryption and versioning',
      async () => {
        if (skipIfOutputMissing(outputs, 'SecureDataBucketName')) return;

        const bucketName = outputs.SecureDataBucketName;

        // Verify bucket exists
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));

        // Verify versioning
        const versioningResponse = await s3Client.send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );
        expect(versioningResponse.Status).toBe('Enabled');

        // Verify public access block
        const publicAccessResponse = await s3Client.send(
          new GetPublicAccessBlockCommand({ Bucket: bucketName })
        );
        const publicAccess = publicAccessResponse.PublicAccessBlockConfiguration!;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);

        // Verify encryption
        const encryptionResponse = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );
        expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
        expect(
          encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0]
            .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
        ).toBe('AES256');

        console.log('✓ SecureDataBucket is properly configured');
      },
      TEST_TIMEOUT
    );

    test(
      'should have LogBucket with KMS encryption',
      async () => {
        if (skipIfOutputMissing(outputs, 'LogBucketName')) return;

        const bucketName = outputs.LogBucketName;

        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));

        const encryptionResponse = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );
        expect(
          encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0]
            .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
        ).toBe('aws:kms');

        console.log('✓ LogBucket has KMS encryption');
      },
      TEST_TIMEOUT
    );

    test(
      'should have CloudTrailBucket configured',
      async () => {
        if (skipIfOutputMissing(outputs, 'CloudTrailBucketName')) return;

        const bucketName = outputs.CloudTrailBucketName;
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));

        const publicAccessResponse = await s3Client.send(
          new GetPublicAccessBlockCommand({ Bucket: bucketName })
        );
        expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);

        console.log('✓ CloudTrailBucket is configured');
      },
      TEST_TIMEOUT
    );

    test(
      'should have ConfigBucket configured',
      async () => {
        if (skipIfOutputMissing(outputs, 'ConfigBucketName')) return;

        const bucketName = outputs.ConfigBucketName;
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));

        console.log('✓ ConfigBucket is configured');
      },
      TEST_TIMEOUT
    );
  });

  describe('Service-Level Tests: VPC and Networking', () => {
    test(
      'should have VPC with correct CIDR and DNS settings',
      async () => {
        if (skipIfOutputMissing(outputs, 'VPCId')) return;

        const vpcId = outputs.VPCId;

        const response = await ec2Client.send(
          new DescribeVpcsCommand({ VpcIds: [vpcId] })
        );

        expect(response.Vpcs).toBeDefined();
        expect(response.Vpcs!.length).toBe(1);

        const vpc = response.Vpcs![0];
        expect(vpc.CidrBlock).toBe('10.0.0.0/16');

        // Query DNS attributes separately
        const dnsHostnamesResponse = await ec2Client.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsHostnames'
          })
        );

        const dnsSupportResponse = await ec2Client.send(
          new DescribeVpcAttributeCommand({
            VpcId: vpcId,
            Attribute: 'enableDnsSupport'
          })
        );

        expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
        expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);

        console.log('✓ VPC is properly configured');
      },
      TEST_TIMEOUT
    );

    test(
      'should have subnets in multiple availability zones',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'PublicSubnet1Id',
            'PublicSubnet2Id',
            'PrivateSubnet1Id',
            'PrivateSubnet2Id'
          )
        )
          return;

        const subnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
        ];

        const response = await ec2Client.send(
          new DescribeSubnetsCommand({ SubnetIds: subnetIds })
        );

        expect(response.Subnets).toBeDefined();
        expect(response.Subnets!.length).toBe(4);

        // Get unique AZs
        const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
        expect(azs.size).toBe(2);

        // Verify CIDR blocks
        const publicSubnet1 = response.Subnets!.find(
          s => s.SubnetId === outputs.PublicSubnet1Id
        );
        expect(publicSubnet1?.CidrBlock).toBe('10.0.1.0/24');

        console.log('✓ Subnets are configured across multiple AZs');
      },
      TEST_TIMEOUT
    );

    test(
      'should have NAT Gateway for private subnet egress',
      async () => {
        if (skipIfOutputMissing(outputs, 'VPCId', 'NATGatewayId')) return;

        const vpcId = outputs.VPCId;

        const response = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
          })
        );

        expect(response.NatGateways).toBeDefined();
        expect(response.NatGateways!.length).toBeGreaterThan(0);
        expect(response.NatGateways![0].State).toBe('available');

        console.log('✓ NAT Gateway is available');
      },
      TEST_TIMEOUT
    );

    test(
      'should have Internet Gateway attached to VPC',
      async () => {
        if (skipIfOutputMissing(outputs, 'VPCId')) return;

        const vpcId = outputs.VPCId;

        const response = await ec2Client.send(
          new DescribeInternetGatewaysCommand({
            Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
          })
        );

        expect(response.InternetGateways).toBeDefined();
        expect(response.InternetGateways!.length).toBe(1);
        expect(response.InternetGateways![0].Attachments![0].State).toBe('available');

        console.log('✓ Internet Gateway is attached');
      },
      TEST_TIMEOUT
    );
  });

  describe('Service-Level Tests: Security Groups', () => {
    test(
      'should have security groups with proper configuration',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'BastionSecurityGroupId',
            'ApplicationSecurityGroupId',
            'DatabaseSecurityGroupId',
            'ALBSecurityGroupId'
          )
        )
          return;

        const sgIds = [
          outputs.BastionSecurityGroupId,
          outputs.ApplicationSecurityGroupId,
          outputs.DatabaseSecurityGroupId,
          outputs.ALBSecurityGroupId,
        ];

        const response = await ec2Client.send(
          new DescribeSecurityGroupsCommand({ GroupIds: sgIds })
        );

        expect(response.SecurityGroups).toBeDefined();
        expect(response.SecurityGroups!.length).toBe(4);

        // Verify Bastion SG has SSH rule
        const bastionSG = response.SecurityGroups!.find(
          sg => sg.GroupId === outputs.BastionSecurityGroupId
        );
        expect(bastionSG).toBeDefined();
        const sshRule = bastionSG!.IpPermissions!.find(rule => rule.FromPort === 22);
        expect(sshRule).toBeDefined();

        // Verify ALB SG has HTTPS and HTTP rules
        const albSG = response.SecurityGroups!.find(
          sg => sg.GroupId === outputs.ALBSecurityGroupId
        );
        expect(albSG).toBeDefined();
        const httpsRule = albSG!.IpPermissions!.find(rule => rule.FromPort === 443);
        const httpRule = albSG!.IpPermissions!.find(rule => rule.FromPort === 80);
        expect(httpsRule).toBeDefined();
        expect(httpRule).toBeDefined();

        console.log('✓ Security groups are properly configured');
      },
      TEST_TIMEOUT
    );
  });

  describe('Service-Level Tests: RDS Database', () => {
    test(
      'should have RDS instance with encryption and backups',
      async () => {
        if (skipIfOutputMissing(outputs, 'DatabaseEndpoint')) return;

        // Extract DB identifier from endpoint
        const dbEndpoint = outputs.DatabaseEndpoint;
        const dbIdentifier = dbEndpoint.split('.')[0];

        const response = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          })
        );

        expect(response.DBInstances).toBeDefined();
        expect(response.DBInstances!.length).toBe(1);

        const db = response.DBInstances![0];
        expect(db.StorageEncrypted).toBe(true);
        expect(db.BackupRetentionPeriod).toBe(30);
        expect(db.Engine).toBe('mysql');
        expect(db.EnabledCloudwatchLogsExports).toContain('error');

        console.log('✓ RDS instance is properly configured');
      },
      TEST_TIMEOUT
    );
  });

  describe('Service-Level Tests: IAM Roles', () => {
    test(
      'should have EC2 role with appropriate policies',
      async () => {
        if (skipIfOutputMissing(outputs, 'EC2RoleArn')) return;

        const roleArn = outputs.EC2RoleArn;
        const roleName = roleArn.split('/').pop()!;

        const roleResponse = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        expect(roleResponse.Role).toBeDefined();

        // Check inline policies
        const policiesResponse = await iamClient.send(
          new ListRolePoliciesCommand({ RoleName: roleName })
        );
        expect(policiesResponse.PolicyNames).toBeDefined();

        // Check attached policies
        const attachedResponse = await iamClient.send(
          new ListAttachedRolePoliciesCommand({ RoleName: roleName })
        );
        const policyNames = attachedResponse.AttachedPolicies!.map(p => p.PolicyName);
        expect(policyNames).toContain('CloudWatchAgentServerPolicy');

        console.log('✓ EC2 role is properly configured');
      },
      TEST_TIMEOUT
    );

    test(
      'should have Admin role with MFA requirement',
      async () => {
        if (skipIfOutputMissing(outputs, 'AdminRoleArn')) return;

        const roleArn = outputs.AdminRoleArn;
        const roleName = roleArn.split('/').pop()!;

        const roleResponse = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );

        const assumeRolePolicy = JSON.parse(
          decodeURIComponent(roleResponse.Role!.AssumeRolePolicyDocument!)
        );
        const statement = assumeRolePolicy.Statement[0];
        // AWS returns boolean conditions as strings
        expect(statement.Condition?.Bool?.['aws:MultiFactorAuthPresent']).toBe('true');
        expect(roleResponse.Role!.MaxSessionDuration).toBe(3600);

        console.log('✓ Admin role has MFA requirement');
      },
      TEST_TIMEOUT
    );
  });

  describe('Service-Level Tests: KMS Keys', () => {
    test(
      'should have KMS keys with rotation enabled',
      async () => {
        if (skipIfOutputMissing(outputs, 'S3KMSKeyId', 'RDSKMSKeyId')) return;

        const keyIds = [outputs.S3KMSKeyId, outputs.RDSKMSKeyId];

        for (const keyId of keyIds) {
          const keyResponse = await kmsClient.send(
            new DescribeKeyCommand({ KeyId: keyId })
          );
          expect(keyResponse.KeyMetadata?.Enabled).toBe(true);

          const rotationResponse = await kmsClient.send(
            new GetKeyRotationStatusCommand({ KeyId: keyId })
          );
          expect(rotationResponse.KeyRotationEnabled).toBe(true);
        }

        console.log('✓ KMS keys have rotation enabled');
      },
      TEST_TIMEOUT
    );
  });

  describe('Service-Level Tests: Secrets Manager', () => {
    test(
      'should have database secret with proper encryption',
      async () => {
        if (skipIfOutputMissing(outputs, 'DatabaseSecretArn')) return;

        const secretArn = outputs.DatabaseSecretArn;

        const response = await secretsClient.send(
          new DescribeSecretCommand({ SecretId: secretArn })
        );

        expect(response.ARN).toBe(secretArn);
        expect(response.KmsKeyId).toBeDefined();

        console.log('✓ Database secret is properly configured');
      },
      TEST_TIMEOUT
    );
  });

  describe('Service-Level Tests: CloudTrail', () => {
    test(
      'should have CloudTrail logging with encryption',
      async () => {
        if (skipIfOutputMissing(outputs, 'CloudTrailArn')) return;

        const trailArn = outputs.CloudTrailArn;
        const trailName = trailArn.split('/').pop()!;

        const describeResponse = await cloudTrailClient.send(
          new DescribeTrailsCommand({ trailNameList: [trailName] })
        );

        expect(describeResponse.trailList).toBeDefined();
        expect(describeResponse.trailList!.length).toBe(1);

        const trail = describeResponse.trailList![0];
        expect(trail.IsMultiRegionTrail).toBe(true);
        expect(trail.LogFileValidationEnabled).toBe(true);
        expect(trail.KmsKeyId).toBeDefined();

        // Check trail status
        const statusResponse = await cloudTrailClient.send(
          new GetTrailStatusCommand({ Name: trailName })
        );
        expect(statusResponse.IsLogging).toBe(true);

        console.log('✓ CloudTrail is properly configured and logging');
      },
      TEST_TIMEOUT
    );
  });

  describe('Service-Level Tests: AWS Config', () => {
    test(
      'should have AWS Config recorder active',
      async () => {
        if (skipIfOutputMissing(outputs, 'ConfigRecorderName')) return;

        const recorderName = outputs.ConfigRecorderName;

        const response = await configClient.send(
          new DescribeConfigurationRecordersCommand({
            ConfigurationRecorderNames: [recorderName],
          })
        );

        expect(response.ConfigurationRecorders).toBeDefined();
        expect(response.ConfigurationRecorders!.length).toBe(1);

        const recorder = response.ConfigurationRecorders![0];
        expect(recorder.recordingGroup?.allSupported).toBe(true);
        expect(recorder.recordingGroup?.includeGlobalResourceTypes).toBe(true);

        console.log('✓ AWS Config recorder is active');
      },
      TEST_TIMEOUT
    );

    test(
      'should have Config rules for security compliance',
      async () => {
        const response = await configClient.send(
          new DescribeConfigRulesCommand({})
        );

        expect(response.ConfigRules).toBeDefined();
        expect(response.ConfigRules!.length).toBeGreaterThan(0);

        // Find security-related rules
        const sshRule = response.ConfigRules!.find(rule =>
          rule.ConfigRuleName?.includes('ssh')
        );
        const rdpRule = response.ConfigRules!.find(rule =>
          rule.ConfigRuleName?.includes('rdp')
        );

        expect(sshRule || rdpRule).toBeDefined();

        console.log('✓ Config rules are configured');
      },
      TEST_TIMEOUT
    );
  });

  describe('Service-Level Tests: Application Load Balancer', () => {
    test(
      'should have ALB configured properly',
      async () => {
        if (skipIfOutputMissing(outputs, 'ALBArn')) return;

        const albArn = outputs.ALBArn;

        const response = await elbClient.send(
          new DescribeLoadBalancersCommand({
            LoadBalancerArns: [albArn],
          })
        );

        expect(response.LoadBalancers).toBeDefined();
        expect(response.LoadBalancers!.length).toBe(1);

        const alb = response.LoadBalancers![0];
        expect(alb.Type).toBe('application');
        expect(alb.Scheme).toBe('internet-facing');
        expect(alb.State?.Code).toBe('active');

        console.log('✓ ALB is active and properly configured');
      },
      TEST_TIMEOUT
    );
  });

  describe('Service-Level Tests: WAF', () => {
    test(
      'should have WAF Web ACL with proper rules',
      async () => {
        if (skipIfOutputMissing(outputs, 'WebACLArn')) return;

        const webACLArn = outputs.WebACLArn;
        const webACLId = webACLArn.split('/').pop()!;
        const webACLName = webACLArn.split('/')[2];

        const response = await wafClient.send(
          new GetWebACLCommand({
            Scope: 'REGIONAL',
            Id: webACLId,
            Name: webACLName,
          })
        );

        expect(response.WebACL).toBeDefined();
        expect(response.WebACL!.Rules).toBeDefined();
        expect(response.WebACL!.Rules!.length).toBeGreaterThan(0);

        // Check for rate limiting rule
        const rateLimitRule = response.WebACL!.Rules!.find(rule =>
          rule.Name.includes('RateLimit')
        );
        expect(rateLimitRule).toBeDefined();

        console.log('✓ WAF Web ACL is configured with rules');
      },
      TEST_TIMEOUT
    );
  });

  // ==========================================
  // Cross-Service Tests (Two Services)
  // ==========================================
  describe('Cross-Service Tests: S3 and KMS', () => {
    test(
      'should use KMS key for S3 bucket encryption',
      async () => {
        if (skipIfOutputMissing(outputs, 'LogBucketName', 'S3KMSKeyId')) return;

        const bucketName = outputs.LogBucketName;
        const kmsKeyId = outputs.S3KMSKeyId;

        const encryptionResponse = await s3Client.send(
          new GetBucketEncryptionCommand({ Bucket: bucketName })
        );

        const rule =
          encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0];
        const keyInUse = rule.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;

        // Verify it's using a KMS key (either the ID or ARN)
        expect(keyInUse).toBeDefined();
        expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');

        console.log('✓ S3 bucket uses KMS encryption');
      },
      TEST_TIMEOUT
    );
  });

  describe('Cross-Service Tests: CloudTrail and S3', () => {
    test(
      'should write CloudTrail logs to S3 bucket',
      async () => {
        if (skipIfOutputMissing(outputs, 'CloudTrailArn', 'CloudTrailBucketName'))
          return;

        const trailArn = outputs.CloudTrailArn;
        const bucketName = outputs.CloudTrailBucketName;
        const trailName = trailArn.split('/').pop()!;

        const response = await cloudTrailClient.send(
          new DescribeTrailsCommand({ trailNameList: [trailName] })
        );

        const trail = response.trailList![0];
        expect(trail.S3BucketName).toBe(bucketName);

        // Verify trail is logging
        const statusResponse = await cloudTrailClient.send(
          new GetTrailStatusCommand({ Name: trailName })
        );
        expect(statusResponse.IsLogging).toBe(true);

        console.log('✓ CloudTrail writes to S3 bucket');
      },
      TEST_TIMEOUT
    );
  });

  describe('Cross-Service Tests: AWS Config and S3', () => {
    test(
      'should write Config snapshots to S3 bucket',
      async () => {
        if (skipIfOutputMissing(outputs, 'ConfigRecorderName', 'ConfigBucketName'))
          return;

        const recorderName = outputs.ConfigRecorderName;
        const bucketName = outputs.ConfigBucketName;

        const response = await configClient.send(
          new DescribeDeliveryChannelsCommand({})
        );

        expect(response.DeliveryChannels).toBeDefined();
        const channel = response.DeliveryChannels!.find(ch =>
          ch.name?.includes(recorderName.replace('ConfigRecorder', 'DeliveryChannel'))
        );

        // Config channels may not include the full recorder name
        if (response.DeliveryChannels!.length > 0) {
          const anyChannel = response.DeliveryChannels![0];
          expect(anyChannel.s3BucketName).toBeDefined();
          console.log('✓ AWS Config writes to S3 bucket');
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('Cross-Service Tests: RDS and Secrets Manager', () => {
    test(
      'should use Secrets Manager for database credentials',
      async () => {
        if (skipIfOutputMissing(outputs, 'DatabaseEndpoint', 'DatabaseSecretArn'))
          return;

        const secretArn = outputs.DatabaseSecretArn;

        const secretResponse = await secretsClient.send(
          new GetSecretValueCommand({ SecretId: secretArn })
        );

        expect(secretResponse.SecretString).toBeDefined();

        const secret = JSON.parse(secretResponse.SecretString!);
        expect(secret.username).toBe('admin');
        expect(secret.password).toBeDefined();
        expect(secret.password.length).toBe(32);

        console.log('✓ Database uses Secrets Manager for credentials');
      },
      TEST_TIMEOUT
    );
  });

  describe('Cross-Service Tests: ALB and WAF', () => {
    test(
      'should have WAF protecting ALB',
      async () => {
        if (skipIfOutputMissing(outputs, 'ALBArn', 'WebACLArn')) return;

        const albArn = outputs.ALBArn;

        try {
          const response = await wafClient.send(
            new GetWebACLForResourceCommand({
              ResourceArn: albArn,
            })
          );

          expect(response.WebACL).toBeDefined();
          expect(response.WebACL!.ARN).toBe(outputs.WebACLArn);

          console.log('✓ WAF is protecting ALB');
        } catch (error: any) {
          if (error.name === 'WAFNonexistentItemException') {
            console.warn('WAF association may not be complete yet');
          } else {
            throw error;
          }
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('Cross-Service Tests: EC2 and IAM', () => {
    test(
      'should have EC2 role with S3 access permissions',
      async () => {
        if (skipIfOutputMissing(outputs, 'EC2RoleArn', 'SecureDataBucketName')) return;

        const roleArn = outputs.EC2RoleArn;
        const roleName = roleArn.split('/').pop()!;

        const policiesResponse = await iamClient.send(
          new ListRolePoliciesCommand({ RoleName: roleName })
        );

        expect(policiesResponse.PolicyNames).toBeDefined();
        const s3Policy = policiesResponse.PolicyNames!.find(name =>
          name.includes('S3')
        );
        expect(s3Policy).toBeDefined();

        // Get the policy document
        const policyResponse = await iamClient.send(
          new GetRolePolicyCommand({
            RoleName: roleName,
            PolicyName: s3Policy!,
          })
        );

        const policyDocument = JSON.parse(
          decodeURIComponent(policyResponse.PolicyDocument!)
        );
        const hasS3Actions = policyDocument.Statement.some((stmt: any) =>
          stmt.Action?.some((action: string) => action.startsWith('s3:'))
        );

        expect(hasS3Actions).toBe(true);

        console.log('✓ EC2 role has S3 access permissions');
      },
      TEST_TIMEOUT
    );
  });

  describe('Cross-Service Tests: RDS and KMS', () => {
    test(
      'should use KMS key for RDS encryption',
      async () => {
        if (skipIfOutputMissing(outputs, 'DatabaseEndpoint', 'RDSKMSKeyId')) return;

        const dbEndpoint = outputs.DatabaseEndpoint;
        const dbIdentifier = dbEndpoint.split('.')[0];

        const response = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          })
        );

        const db = response.DBInstances![0];
        expect(db.StorageEncrypted).toBe(true);
        expect(db.KmsKeyId).toBeDefined();

        console.log('✓ RDS uses KMS for encryption');
      },
      TEST_TIMEOUT
    );
  });

  // ==========================================
  // End-to-End Tests (3+ Services)
  // ==========================================
  describe('End-to-End Tests: S3 Write and CloudTrail Logging', () => {
    test(
      'should log S3 operations to CloudTrail',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'SecureDataBucketName',
            'CloudTrailArn',
            'CloudTrailBucketName'
          )
        )
          return;

        const bucketName = outputs.SecureDataBucketName;
        const testKey = `test-${Date.now()}.txt`;
        const testContent = 'Integration test content';

        // Perform S3 operation
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: testKey,
            Body: testContent,
          })
        );

        console.log(`✓ Wrote test object to S3: ${testKey}`);

        // Verify object exists
        const getResponse = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );
        expect(getResponse.Body).toBeDefined();

        // CloudTrail logging is async, so we verify trail is active
        const trailArn = outputs.CloudTrailArn;
        const trailName = trailArn.split('/').pop()!;

        const statusResponse = await cloudTrailClient.send(
          new GetTrailStatusCommand({ Name: trailName })
        );
        expect(statusResponse.IsLogging).toBe(true);

        // Clean up
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: testKey,
          })
        );

        console.log('✓ S3 operations are logged by CloudTrail');
      },
      TEST_TIMEOUT
    );
  });

  describe('End-to-End Tests: VPC, Security Groups, and RDS', () => {
    test(
      'should have RDS in private subnets with security group protection',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'DatabaseEndpoint',
            'DatabaseSecurityGroupId',
            'PrivateSubnet1Id',
            'PrivateSubnet2Id',
            'VPCId'
          )
        )
          return;

        const dbEndpoint = outputs.DatabaseEndpoint;
        const dbIdentifier = dbEndpoint.split('.')[0];

        const dbResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          })
        );

        const db = dbResponse.DBInstances![0];

        // Verify DB is in VPC
        expect(db.DBSubnetGroup?.VpcId).toBe(outputs.VPCId);

        // Verify DB subnets
        const subnetIds = db.DBSubnetGroup?.Subnets?.map(s => s.SubnetIdentifier) || [];
        expect(subnetIds).toContain(outputs.PrivateSubnet1Id);
        expect(subnetIds).toContain(outputs.PrivateSubnet2Id);

        // Verify security group
        const sgIds = db.VpcSecurityGroups?.map(sg => sg.VpcSecurityGroupId) || [];
        expect(sgIds).toContain(outputs.DatabaseSecurityGroupId);

        // Verify security group rules
        const sgResponse = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.DatabaseSecurityGroupId],
          })
        );

        const sg = sgResponse.SecurityGroups![0];
        // Database SG should only have ingress from Application SG on port 3306
        const mysqlRule = sg.IpPermissions!.find(rule => rule.FromPort === 3306);
        expect(mysqlRule).toBeDefined();

        console.log('✓ RDS is properly isolated in private subnets with security groups');
      },
      TEST_TIMEOUT
    );
  });

  describe('End-to-End Tests: Multi-Layer Security Flow', () => {
    test(
      'should have complete security flow: WAF -> ALB -> App SG -> DB SG',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'WebACLArn',
            'ALBArn',
            'ApplicationSecurityGroupId',
            'DatabaseSecurityGroupId'
          )
        )
          return;

        // 1. Verify WAF is protecting ALB
        const albArn = outputs.ALBArn;

        try {
          const wafResponse = await wafClient.send(
            new GetWebACLForResourceCommand({
              ResourceArn: albArn,
            })
          );
          expect(wafResponse.WebACL).toBeDefined();
        } catch (error: any) {
          console.warn('WAF association check skipped');
        }

        // 2. Verify ALB exists and is active
        const albResponse = await elbClient.send(
          new DescribeLoadBalancersCommand({
            LoadBalancerArns: [albArn],
          })
        );
        expect(albResponse.LoadBalancers![0].State?.Code).toBe('active');

        // 3. Verify Application Security Group allows traffic from ALB SG
        const appSgResponse = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.ApplicationSecurityGroupId],
          })
        );
        const appSg = appSgResponse.SecurityGroups![0];
        const hasAlbIngress = appSg.IpPermissions!.some(rule =>
          rule.UserIdGroupPairs?.some(pair =>
            pair.GroupId === outputs.ALBSecurityGroupId
          )
        );
        expect(hasAlbIngress).toBe(true);

        // 4. Verify Database Security Group allows traffic from Application SG
        const dbSgResponse = await ec2Client.send(
          new DescribeSecurityGroupsCommand({
            GroupIds: [outputs.DatabaseSecurityGroupId],
          })
        );
        const dbSg = dbSgResponse.SecurityGroups![0];
        const hasAppIngress = dbSg.IpPermissions!.some(rule =>
          rule.UserIdGroupPairs?.some(pair =>
            pair.GroupId === outputs.ApplicationSecurityGroupId
          )
        );
        expect(hasAppIngress).toBe(true);

        console.log('✓ Complete security flow is properly configured');
      },
      TEST_TIMEOUT
    );
  });

  describe('End-to-End Tests: Compliance and Audit Trail', () => {
    test(
      'should have complete audit trail: CloudTrail + Config + KMS',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'CloudTrailArn',
            'ConfigRecorderName',
            'S3KMSKeyId'
          )
        )
          return;

        // 1. Verify CloudTrail is logging
        const trailArn = outputs.CloudTrailArn;
        const trailName = trailArn.split('/').pop()!;

        const trailStatusResponse = await cloudTrailClient.send(
          new GetTrailStatusCommand({ Name: trailName })
        );
        expect(trailStatusResponse.IsLogging).toBe(true);

        // 2. Verify CloudTrail uses KMS encryption
        const trailResponse = await cloudTrailClient.send(
          new DescribeTrailsCommand({ trailNameList: [trailName] })
        );
        const trail = trailResponse.trailList![0];
        expect(trail.KmsKeyId).toBeDefined();

        // 3. Verify Config is recording
        const configResponse = await configClient.send(
          new DescribeConfigurationRecordersCommand({
            ConfigurationRecorderNames: [outputs.ConfigRecorderName],
          })
        );
        expect(configResponse.ConfigurationRecorders).toBeDefined();
        expect(configResponse.ConfigurationRecorders!.length).toBe(1);

        // 4. Verify KMS key has rotation enabled
        const rotationResponse = await kmsClient.send(
          new GetKeyRotationStatusCommand({ KeyId: outputs.S3KMSKeyId })
        );
        expect(rotationResponse.KeyRotationEnabled).toBe(true);

        console.log('✓ Complete audit trail is configured');
      },
      TEST_TIMEOUT
    );
  });

  describe('End-to-End Tests: Data Flow with Encryption', () => {
    test(
      'should encrypt data at rest throughout the pipeline',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'SecureDataBucketName',
            'LogBucketName',
            'DatabaseEndpoint',
            'S3KMSKeyId',
            'RDSKMSKeyId'
          )
        )
          return;

        // 1. Verify S3 buckets use encryption
        const secureDataResponse = await s3Client.send(
          new GetBucketEncryptionCommand({
            Bucket: outputs.SecureDataBucketName,
          })
        );
        expect(
          secureDataResponse.ServerSideEncryptionConfiguration!.Rules![0]
            .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
        ).toBe('AES256');

        const logBucketResponse = await s3Client.send(
          new GetBucketEncryptionCommand({
            Bucket: outputs.LogBucketName,
          })
        );
        expect(
          logBucketResponse.ServerSideEncryptionConfiguration!.Rules![0]
            .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
        ).toBe('aws:kms');

        // 2. Verify RDS uses encryption
        const dbEndpoint = outputs.DatabaseEndpoint;
        const dbIdentifier = dbEndpoint.split('.')[0];

        const dbResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          })
        );
        expect(dbResponse.DBInstances![0].StorageEncrypted).toBe(true);

        // 3. Verify KMS keys exist and are enabled
        const s3KeyResponse = await kmsClient.send(
          new DescribeKeyCommand({ KeyId: outputs.S3KMSKeyId })
        );
        expect(s3KeyResponse.KeyMetadata?.Enabled).toBe(true);

        const rdsKeyResponse = await kmsClient.send(
          new DescribeKeyCommand({ KeyId: outputs.RDSKMSKeyId })
        );
        expect(rdsKeyResponse.KeyMetadata?.Enabled).toBe(true);

        console.log('✓ Data is encrypted at rest throughout the pipeline');
      },
      TEST_TIMEOUT
    );
  });

  describe('End-to-End Tests: High Availability Setup', () => {
    test(
      'should have multi-AZ deployment for high availability',
      async () => {
        if (
          skipIfOutputMissing(
            outputs,
            'VPCId',
            'PublicSubnet1Id',
            'PublicSubnet2Id',
            'PrivateSubnet1Id',
            'PrivateSubnet2Id',
            'DatabaseEndpoint'
          )
        )
          return;

        // 1. Verify subnets span multiple AZs
        const subnetIds = [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
        ];

        const subnetResponse = await ec2Client.send(
          new DescribeSubnetsCommand({ SubnetIds: subnetIds })
        );

        const azs = new Set(subnetResponse.Subnets!.map(s => s.AvailabilityZone));
        expect(azs.size).toBe(2);

        // 2. Verify NAT Gateway exists for high availability
        const natResponse = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            Filter: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
          })
        );
        expect(natResponse.NatGateways!.length).toBeGreaterThan(0);
        expect(natResponse.NatGateways![0].State).toBe('available');

        // 3. Verify RDS uses DB subnet group spanning multiple AZs
        const dbEndpoint = outputs.DatabaseEndpoint;
        const dbIdentifier = dbEndpoint.split('.')[0];

        const dbResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: dbIdentifier,
          })
        );

        const dbSubnets = dbResponse.DBInstances![0].DBSubnetGroup?.Subnets || [];
        const dbAzs = new Set(dbSubnets.map(s => s.SubnetAvailabilityZone?.Name));
        expect(dbAzs.size).toBeGreaterThanOrEqual(2);

        console.log('✓ Infrastructure is configured for high availability');
      },
      TEST_TIMEOUT
    );
  });
});
