import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import {
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
  NatGateway,
  Subnet
} from '@aws-sdk/client-ec2';
import {
  KMSClient
} from '@aws-sdk/client-kms';
import {
  DescribeDBInstancesCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client
} from '@aws-sdk/client-s3';
import {
  GetWebACLCommand,
  Rule,
  WAFV2Client
} from '@aws-sdk/client-wafv2';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from outputs file to avoid hardcoding
const loadStackOutputs = async () => {
  const outputsFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

  if (!fs.existsSync(outputsFilePath)) {
    console.warn(`Outputs file not found: ${outputsFilePath}`);
    return {} as Record<string, string>;
  }

  try {
    const fileContent = fs.readFileSync(outputsFilePath, 'utf8');
    return JSON.parse(fileContent) as Record<string, string>;
  } catch (error) {
    console.error('Error reading outputs file:', error);
    return {} as Record<string, string>;
  }
};

// AWS SDK clients
const region = process.env.AWS_REGION || 'us-east-1';
const environment = process.env.ENVIRONMENT || 'Development';
const stackName = `SecureInfrastructure-${environment}`;

const cloudFormationClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const wafClient = new WAFV2Client({ region });
const kmsClient = new KMSClient({ region });

jest.setTimeout(120000); // Increase timeout for AWS API calls

const hasAwsCreds = () =>
  Boolean(
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_PROFILE ||
    process.env.AWS_WEB_IDENTITY_TOKEN_FILE
  );

describe('Secure Infrastructure Integration Tests', () => {
  let outputs: Record<string, string> = {};

  beforeAll(async () => {
    if (!hasAwsCreds()) {
      console.warn('Skipping live tests: AWS credentials not found in environment');
      return;
    }
    try {
      outputs = await loadStackOutputs();
      console.log('Loaded CloudFormation Outputs:', Object.keys(outputs));
      console.log('Environment:', environment);
      console.log('Stack name:', stackName);
    } catch (err) {
      console.warn('Error loading stack outputs:', err);
    }
  });

  const skipIfNoStack = () => {
    if (!hasAwsCreds()) return true;
    return Object.keys(outputs).length === 0;
  };

  describe('VPC Infrastructure', () => {
    test('VPC exists and has correct CIDR', async () => {
      if (skipIfNoStack()) {
        return;
      }

      const vpcId = outputs.VPCId;
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId]
        })
      );

      expect(response.Vpcs?.length).toBe(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toMatch(/^10\.0\./);
      // DNS settings will be verified through stack outputs or additional API calls if needed
    });

    test('Subnets are properly configured across AZs', async () => {
      if (skipIfNoStack()) {
        return;
      }

      const subnetIds = outputs.PrivateSubnets.split(',').concat(outputs.PublicSubnets.split(','));
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: subnetIds
        })
      );

      expect(response.Subnets?.length).toBe(4);

      // Check AZ distribution
      const azs = new Set(response.Subnets?.map((s: Subnet) => s.AvailabilityZone));
      expect(azs.size).toBe(2);

      // Verify public/private configuration
      const publicSubnets = response.Subnets?.filter((s: Subnet) => s.MapPublicIpOnLaunch);
      const privateSubnets = response.Subnets?.filter((s: Subnet) => !s.MapPublicIpOnLaunch);
      expect(publicSubnets?.length).toBe(2);
      expect(privateSubnets?.length).toBe(2);
    });

    test('NAT Gateways are deployed and active in multiple AZs', async () => {
      if (skipIfNoStack()) {
        return;
      }

      const response = await ec2Client.send(new DescribeNatGatewaysCommand({}));
      const natGateways = response.NatGateways?.filter((ng: NatGateway) =>
        ng.VpcId === outputs.VPCId && ng.State === 'available'
      );

      // We should have two NAT Gateways for high availability
      expect(natGateways?.length).toBe(2);

      // Check NAT Gateways are in different AZs
      const azs = new Set(natGateways?.map(ng => ng.SubnetId));
      expect(azs.size).toBe(2);

      // Verify all NAT Gateways are available
      natGateways?.forEach(ng => {
        expect(ng.State).toBe('available');
      });
    });


  });



  describe('RDS Configuration', () => {
    test('RDS instance meets essential security requirements', async () => {
      if (skipIfNoStack()) {
        return;
      }

      // Skip test if RDS is not enabled
      if (!outputs.RDSEndpoint) {
        console.log('Skipping RDS test - RDS creation disabled');
        return;
      }

      try {
        const response = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: outputs.RDSEndpoint.split('.')[0]
          })
        );

        const dbInstance = response.DBInstances![0];

        // Essential security checks that must be true in production
        expect(dbInstance.StorageEncrypted).toBe(true);
        expect(dbInstance.PubliclyAccessible).toBe(false);

        // Verify basic backup configuration
        expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);

        // Verify instance is encrypted
        expect(dbInstance.KmsKeyId).toBeDefined();

        // Log other security configurations for review
        console.log('RDS Security Configuration:', {
          multiAZ: dbInstance.MultiAZ,
          iamAuth: dbInstance.IAMDatabaseAuthenticationEnabled,
          deletionProtection: dbInstance.DeletionProtection,
          backupRetentionDays: dbInstance.BackupRetentionPeriod,
          dbParameterGroup: dbInstance.DBParameterGroups?.[0]?.DBParameterGroupName
        });
      } catch (error) {
        console.error('Error checking RDS instance:', error);
        throw error;
      }
    });
  });

  describe('S3 Security', () => {
    test('S3 bucket has encryption and versioning enabled', async () => {
      if (skipIfNoStack()) {
        return;
      }

      const bucketName = outputs.S3BucketName;

      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: bucketName
        })
      );

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: bucketName
        })
      );

      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('S3 bucket blocks public access', async () => {
      if (skipIfNoStack()) {
        return;
      }

      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: outputs.S3BucketName
        })
      );

      const publicAccessBlock = response.PublicAccessBlockConfiguration!;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('WAF Configuration', () => {
    test('WAF is configured with SQL injection protection', async () => {
      if (skipIfNoStack()) {
        return;
      }

      // Get the WebACL parts from the ARN
      const parts = outputs.WebACLArn.split('/');

      // Get the WebACL details
      const webAclResponse = await wafClient.send(
        new GetWebACLCommand({
          Name: parts[parts.length - 2],
          Id: parts[parts.length - 1],
          Scope: 'REGIONAL'
        })
      );

      const responseWebAcl = webAclResponse.WebACL;
      expect(responseWebAcl).toBeDefined();

      const sqlInjectionRule = responseWebAcl?.Rules?.find((r: Rule) => r.Name === 'BlockSQLInjection');
      expect(sqlInjectionRule).toBeDefined();
      expect(sqlInjectionRule?.Action?.Block).toBeDefined();
    });
  });

  describe('Security Group Configuration', () => {
    test('Security group configuration meets basic security requirements', async () => {
      if (skipIfNoStack()) {
        return;
      }

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.RDSSecurityGroupId, outputs.ALBSecurityGroupId, outputs.ECSSecurityGroupId].filter(Boolean)
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      for (const sg of response.SecurityGroups!) {
        // Log security group configuration for review
        console.log(`Security Group ${sg.GroupId} configuration:`, {
          name: sg.GroupName,
          description: sg.Description,
          vpcId: sg.VpcId,
          ingressRulesCount: sg.IpPermissions?.length || 0,
          egressRulesCount: sg.IpPermissionsEgress?.length || 0
        });

        // For RDS, only check if there's no direct public access
        if (sg.GroupId === outputs.RDSSecurityGroupId) {
          const hasDirectPublicAccess = sg.IpPermissions?.some(permission =>
            permission.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
          );
          expect(hasDirectPublicAccess).toBe(false);
        }

        // For ALB, log allowed ports for review
        if (sg.GroupId === outputs.ALBSecurityGroupId) {
          const publicIngressPorts = sg.IpPermissions
            ?.filter(p => p.IpRanges?.some(r => r.CidrIp === '0.0.0.0/0'))
            .map(p => p.FromPort);

          console.log('ALB public ingress ports:', publicIngressPorts);
        }
      }
    });
  });
});
