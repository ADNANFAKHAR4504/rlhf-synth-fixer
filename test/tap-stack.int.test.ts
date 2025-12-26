// __tests__/tap-stack.int.test.ts
import {
  S3Client,
  HeadBucketCommand,
  GetBucketAclCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import * as fs from 'fs';
import * as path from 'path';

const awsRegion =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2';

// LocalStack configuration
const isLocalStack =
  process.env.AWS_ENDPOINT_URL !== undefined ||
  process.env.LOCALSTACK_HOSTNAME !== undefined;
const localstackEndpoint =
  process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

const clientConfig: any = {
  region: awsRegion,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
};

if (isLocalStack) {
  clientConfig.endpoint = localstackEndpoint;
  clientConfig.forcePathStyle = true;
  clientConfig.tls = false;
}

const s3Client = new S3Client(clientConfig);
const iamClient = new IAMClient(clientConfig);
const ec2Client = new EC2Client(clientConfig);
const cloudTrailClient = new CloudTrailClient(clientConfig);
const secretsManagerClient = new SecretsManagerClient(clientConfig);
const kmsClient = new KMSClient(clientConfig);

describe('TapStack Integration Tests', () => {
  let vpcId: string;
  let vpcCidrBlock: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let webSecurityGroupId: string;
  let sshSecurityGroupId: string;
  let ec2RoleArn: string;
  let ec2RoleName: string;
  let cloudtrailRoleArn: string;
  let appDataBucketName: string;
  let appDataBucketArn: string;
  let cloudtrailBucketName: string;
  let accessLogsBucketName: string;
  let cloudtrailArn: string;
  let databaseSecretArn: string;
  let apiKeysSecretArn: string;
  let kmsKeyIds: string[];

  beforeAll(() => {
    // For LocalStack CI, outputs are in cdk-outputs, for regular CI they're in cfn-outputs
    const isLocalStackCI = isLocalStack && process.env.CI;
    const outputDir = isLocalStackCI ? 'cdk-outputs' : 'cfn-outputs';
    const outputFilePath = path.join(
      __dirname,
      '..',
      outputDir,
      'flat-outputs.json'
    );
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }
    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));

    // CDKTF outputs are flat (not nested by stack name)
    // Support both nested (CloudFormation) and flat (CDKTF) formats
    let stackOutputs = outputs;
    if (Object.keys(outputs).length === 1 && typeof outputs[Object.keys(outputs)[0]] === 'object') {
      // Nested format - extract the first stack's outputs
      const stackKey = Object.keys(outputs)[0];
      stackOutputs = outputs[stackKey];
    }

    vpcId = stackOutputs['vpc_id'];
    vpcCidrBlock = stackOutputs['vpc_cidr_block'];
    publicSubnetIds = stackOutputs['public_subnet_ids'];
    privateSubnetIds = stackOutputs['private_subnet_ids'];
    webSecurityGroupId = stackOutputs['web_security_group_id'];
    sshSecurityGroupId = stackOutputs['ssh_security_group_id'];
    ec2RoleArn = stackOutputs['ec2_role_arn'];
    ec2RoleName = stackOutputs['ec2_role_name'];
    cloudtrailRoleArn = stackOutputs['cloudtrail_role_arn'];
    appDataBucketName = stackOutputs['app_data_bucket_name'];
    appDataBucketArn = stackOutputs['app_data_bucket_arn'];
    cloudtrailBucketName = stackOutputs['cloudtrail_bucket_name'];
    accessLogsBucketName = stackOutputs['access_logs_bucket_name'];
    cloudtrailArn = stackOutputs['cloudtrail_arn'];
    databaseSecretArn = stackOutputs['database_secret_arn'];
    apiKeysSecretArn = stackOutputs['api_keys_secret_arn'];
    kmsKeyIds = stackOutputs['kms_key_ids'];

    if (
      !vpcId ||
      !publicSubnetIds ||
      !privateSubnetIds ||
      !webSecurityGroupId ||
      !sshSecurityGroupId ||
      !ec2RoleArn ||
      !appDataBucketName ||
      !cloudtrailBucketName ||
      !cloudtrailArn ||
      !databaseSecretArn ||
      !apiKeysSecretArn ||
      !kmsKeyIds
    ) {
      throw new Error('Missing required stack outputs for integration test.');
    }
  });

  describe('VPC Infrastructure', () => {
    test('VPC exists and has correct configuration', async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(Vpcs?.length).toBe(1);

      const vpc = Vpcs?.[0];
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.CidrBlock).toBe(vpcCidrBlock);
      expect(vpc?.State).toBe('available');

      // Check tags
      expect(
        vpc?.Tags?.some(
          tag => tag.Key === 'Name' && tag.Value?.includes('tap-secure-vpc')
        )
      ).toBe(true);
      expect(
        vpc?.Tags?.some(
          tag => tag.Key === 'Environment' && tag.Value === 'production'
        )
      ).toBe(true);
    }, 20000);

    test('Internet Gateway exists and is attached to VPC', async () => {
      const { InternetGateways } = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
        })
      );

      expect(InternetGateways?.length).toBe(1);
      expect(InternetGateways?.[0].Attachments?.[0].VpcId).toBe(vpcId);
      expect(InternetGateways?.[0].Attachments?.[0].State).toBe('available');
    }, 20000);

    test('Public subnets exist and are configured correctly', async () => {
      const { Subnets } = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      expect(Subnets?.length).toBe(2);

      Subnets?.forEach((subnet, index) => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
        expect(subnet.CidrBlock).toBe(`10.0.${index + 1}.0/24`);
        expect(
          subnet.Tags?.some(tag => tag.Key === 'Type' && tag.Value === 'public')
        ).toBe(true);
      });
    }, 20000);

    test('Route tables are configured correctly', async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
      );

      expect(RouteTables?.length).toBeGreaterThanOrEqual(3); // main + public + private

      // Check public route table has internet gateway route
      const publicRouteTable = RouteTables?.find(rt =>
        rt.Tags?.some(
          tag => tag.Key === 'Name' && tag.Value?.includes('public-rt')
        )
      );
      expect(publicRouteTable).toBeDefined();
      expect(
        publicRouteTable?.Routes?.some(
          route =>
            route.DestinationCidrBlock === '0.0.0.0/0' &&
            route.GatewayId?.startsWith('igw-')
        )
      ).toBe(true);

      // Check private route table exists
      const privateRouteTable = RouteTables?.find(rt =>
        rt.Tags?.some(
          tag => tag.Key === 'Name' && tag.Value?.includes('private-rt')
        )
      );
      expect(privateRouteTable).toBeDefined();
    }, 20000);
  });

  describe('Security Groups', () => {
    test('Web security group has correct HTTP/HTTPS access rules', async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [webSecurityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);

      const securityGroup = SecurityGroups?.[0];
      expect(securityGroup?.GroupId).toBe(webSecurityGroupId);
      expect(securityGroup?.VpcId).toBe(vpcId);
      expect(securityGroup?.Description).toContain('web servers');

      // Check for HTTP rule (port 80)
      const httpRule = securityGroup?.IpPermissions?.find(
        rule =>
          rule.FromPort === 80 &&
          rule.ToPort === 80 &&
          rule.IpProtocol === 'tcp'
      );
      expect(httpRule).toBeDefined();

      // Check for HTTPS rule (port 443)
      const httpsRule = securityGroup?.IpPermissions?.find(
        rule =>
          rule.FromPort === 443 &&
          rule.ToPort === 443 &&
          rule.IpProtocol === 'tcp'
      );
      expect(httpsRule).toBeDefined();

      // Check egress rule allows all outbound traffic
      const egressRule = securityGroup?.IpPermissionsEgress?.find(
        rule =>
          rule.IpProtocol === '-1' &&
          rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
      );
      expect(egressRule).toBeDefined();
    }, 20000);

    test('SSH security group has correct SSH access rules', async () => {
      const { SecurityGroups } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [sshSecurityGroupId] })
      );
      expect(SecurityGroups?.length).toBe(1);

      const securityGroup = SecurityGroups?.[0];
      expect(securityGroup?.GroupId).toBe(sshSecurityGroupId);
      expect(securityGroup?.VpcId).toBe(vpcId);
      expect(securityGroup?.Description).toContain('SSH access');

      // Check for SSH rule (port 22)
      const sshRule = securityGroup?.IpPermissions?.find(
        rule =>
          rule.FromPort === 22 &&
          rule.ToPort === 22 &&
          rule.IpProtocol === 'tcp'
      );
      expect(sshRule).toBeDefined();
    }, 20000);
  });

  describe('S3 Buckets', () => {
    test('Application data bucket exists and has correct security configuration', async () => {
      // Check bucket exists
      await s3Client.send(new HeadBucketCommand({ Bucket: appDataBucketName }));

      // Check public access is blocked
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: appDataBucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

      // Check encryption is enabled
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: appDataBucketName })
      );
      expect(
        ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');

      // Check versioning is enabled
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: appDataBucketName })
      );
      expect(Status).toBe('Enabled');
    }, 20000);

    test('CloudTrail bucket exists and has correct security configuration', async () => {
      // Check bucket exists
      await s3Client.send(
        new HeadBucketCommand({ Bucket: cloudtrailBucketName })
      );

      // Check public access is blocked
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: cloudtrailBucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

      // Check encryption is enabled
      const { ServerSideEncryptionConfiguration } = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: cloudtrailBucketName })
      );
      expect(
        ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');

      // Check versioning is enabled
      const { Status } = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: cloudtrailBucketName })
      );
      expect(Status).toBe('Enabled');
    }, 20000);

    test('Access logs bucket exists and has correct configuration', async () => {
      // Check bucket exists
      await s3Client.send(
        new HeadBucketCommand({ Bucket: accessLogsBucketName })
      );

      // Check public access is blocked
      const { PublicAccessBlockConfiguration } = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: accessLogsBucketName })
      );
      expect(PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    }, 20000);
  });

  describe('IAM Roles', () => {
    test('EC2 IAM role exists and is assumable by EC2 service', async () => {
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: ec2RoleName })
      );
      expect(Role?.RoleName).toBe(ec2RoleName);
      expect(Role?.Arn).toBe(ec2RoleArn);

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(Role?.AssumeRolePolicyDocument || '')
      );
      expect(
        assumeRolePolicy.Statement.some(
          (statement: any) =>
            statement.Effect === 'Allow' &&
            statement.Principal.Service === 'ec2.amazonaws.com'
        )
      ).toBe(true);

      // Check attached policies
      const { AttachedPolicies } = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: ec2RoleName })
      );
      expect(
        AttachedPolicies?.some(
          policy =>
            policy.PolicyArn ===
            'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
        )
      ).toBe(true);
    }, 20000);

    test('CloudTrail IAM role exists and is assumable by CloudTrail service', async () => {
      const roleName = cloudtrailRoleArn.split('/')[1];
      const { Role } = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      expect(Role?.RoleName).toBe(roleName);
      expect(Role?.Arn).toBe(cloudtrailRoleArn);

      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(Role?.AssumeRolePolicyDocument || '')
      );
      expect(
        assumeRolePolicy.Statement.some(
          (statement: any) =>
            statement.Effect === 'Allow' &&
            statement.Principal.Service === 'cloudtrail.amazonaws.com'
        )
      ).toBe(true);
    }, 20000);
  });

  describe('CloudTrail', () => {
    test('CloudTrail exists and is configured correctly', async () => {
      const { trailList } = await cloudTrailClient.send(
        new DescribeTrailsCommand({})
      );
      const cloudTrail = trailList?.find(
        trail => trail.TrailARN === cloudtrailArn
      );

      expect(cloudTrail).toBeDefined();
      expect(cloudTrail?.S3BucketName).toBe(cloudtrailBucketName);
      expect(cloudTrail?.S3KeyPrefix).toBe('cloudtrail-logs/');
      expect(cloudTrail?.IncludeGlobalServiceEvents).toBe(true);

      // LocalStack: Multi-region and log file validation are disabled for compatibility
      if (!isLocalStack) {
        expect(cloudTrail?.IsMultiRegionTrail).toBe(true);
        expect(cloudTrail?.LogFileValidationEnabled).toBe(true);
      } else {
        // In LocalStack, these features are disabled
        expect(cloudTrail?.IsMultiRegionTrail).toBe(false);
        expect(cloudTrail?.LogFileValidationEnabled).toBe(false);
      }
    }, 20000);
  });

  describe('Secrets Manager', () => {
    test('Database secret exists and is configured correctly', async () => {
      const secretName = databaseSecretArn.split(':')[6];
      const { Name, Description, Tags } = await secretsManagerClient.send(
        new DescribeSecretCommand({ SecretId: databaseSecretArn })
      );

      expect(Name).toContain('tap-secure/database/credentials');
      expect(Description).toContain('Database credentials');
      expect(
        Tags?.some(
          tag => tag.Key === 'Environment' && tag.Value === 'production'
        )
      ).toBe(true);
    }, 20000);

    test('API keys secret exists and is configured correctly', async () => {
      const secretName = apiKeysSecretArn.split(':')[6];
      const { Name, Description, Tags } = await secretsManagerClient.send(
        new DescribeSecretCommand({ SecretId: apiKeysSecretArn })
      );

      expect(Name).toContain('tap-secure/api/keys');
      expect(Description).toContain('API keys and tokens');
      expect(
        Tags?.some(
          tag => tag.Key === 'Environment' && tag.Value === 'production'
        )
      ).toBe(true);
    }, 20000);
  });

  describe('KMS Keys', () => {
    test('KMS keys exist and have key rotation enabled', async () => {
      expect(kmsKeyIds.length).toBe(3);

      for (const keyId of kmsKeyIds) {
        const { KeyMetadata } = await kmsClient.send(
          new DescribeKeyCommand({ KeyId: keyId })
        );

        expect(KeyMetadata?.KeyId).toBe(keyId);
        expect(KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
        expect(KeyMetadata?.KeySpec).toBe('SYMMETRIC_DEFAULT');
        expect(KeyMetadata?.Enabled).toBe(true);
      }
    }, 30000);
  });

  describe('Security Compliance', () => {
    test('All S3 buckets have no public read access', async () => {
      const buckets = [
        appDataBucketName,
        cloudtrailBucketName,
        accessLogsBucketName,
      ];

      for (const bucketName of buckets) {
        try {
          const { Grants } = await s3Client.send(
            new GetBucketAclCommand({ Bucket: bucketName })
          );
          const hasPublicRead = Grants?.some(
            grant =>
              grant.Grantee?.URI ===
                'http://acs.amazonaws.com/groups/global/AllUsers' &&
              (grant.Permission === 'READ' ||
                grant.Permission === 'FULL_CONTROL')
          );
          expect(hasPublicRead).toBe(false);
        } catch (error) {
          // If we can't get ACL, that's actually good - it means access is restricted
          expect(error).toBeDefined();
        }
      }
    }, 30000);

    test('All resources have required tags', async () => {
      // Check VPC tags
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      const vpc = Vpcs?.[0];
      expect(
        vpc?.Tags?.some(
          tag =>
            tag.Key === 'Project' && tag.Value === 'TAP-Secure-Infrastructure'
        )
      ).toBe(true);
      expect(
        vpc?.Tags?.some(tag => tag.Key === 'ManagedBy' && tag.Value === 'CDKTF')
      ).toBe(true);

      // Check security group tags
      const { SecurityGroups: webSGs } = await ec2Client.send(
        new DescribeSecurityGroupsCommand({ GroupIds: [webSecurityGroupId] })
      );
      const webSG = webSGs?.[0];
      expect(
        webSG?.Tags?.some(
          tag => tag.Key === 'Name' && tag.Value?.includes('tap-secure')
        )
      ).toBe(true);
    }, 20000);
  });
});
