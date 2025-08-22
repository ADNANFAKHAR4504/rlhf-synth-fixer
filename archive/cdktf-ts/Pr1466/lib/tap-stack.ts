import { Construct } from 'constructs';
import { TerraformStack, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { IamGroup } from '@cdktf/provider-aws/lib/iam-group';
import { IamGroupPolicy } from '@cdktf/provider-aws/lib/iam-group-policy';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // --- Provider and Common Configuration ---
    const region = 'us-east-1';
    const commonTags = {
      Project: 'SecureWebApp',
      Environment: 'Production',
      Owner: 'SecurityTeam',
    };

    new AwsProvider(this, 'aws', { region });
    const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);
    const callerIdentity = new DataAwsCallerIdentity(
      this,
      'CallerIdentity',
      {}
    );

    // --- KMS Key for Encryption ---
    const kmsKey = new KmsKey(this, 'KmsMasterKey', {
      description: 'KMS key for encrypting all application data',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: { AWS: `arn:aws:iam::${callerIdentity.accountId}:root` },
            Action: 'kms:*',
            Resource: '*',
          },
          // REMOVED: Statement allowing CloudWatch logs to use the key is no longer needed.
        ],
      }),
      tags: commonTags,
    });

    // --- S3 Bucket for Logs ---
    const logBucket = new S3Bucket(this, 'LogBucket', {
      bucket: `secure-infra-logs-${uniqueSuffix}`,
      tags: commonTags,
    });
    new S3BucketVersioningA(this, 'LogBucketVersioning', {
      bucket: logBucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });
    new S3BucketPublicAccessBlock(this, 'LogBucketPublicAccessBlock', {
      bucket: logBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // --- Secure S3 Data Bucket ---
    const dataBucket = new S3Bucket(this, 'DataBucket', {
      bucket: `secure-infra-data-${uniqueSuffix}`,
      tags: commonTags,
    });
    new S3BucketVersioningA(this, 'DataBucketVersioning', {
      bucket: dataBucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });
    new S3BucketPublicAccessBlock(this, 'DataBucketPublicAccessBlock', {
      bucket: dataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'DataBucketEncryption',
      {
        bucket: dataBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.id,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );
    new S3BucketLoggingA(this, 'DataBucketLogging', {
      bucket: dataBucket.id,
      targetBucket: logBucket.id,
      targetPrefix: 's3-access-logs/',
    });

    // --- VPC with no direct internet access ---
    const vpc = new Vpc(this, 'MainVpc', {
      cidrBlock: '10.10.0.0/16',
      enableDnsHostnames: true,
      tags: { ...commonTags, Name: 'secure-vpc' },
    });

    // --- Internet Gateway for NAT ---
    const igw = new InternetGateway(this, 'InternetGateway', {
      vpcId: vpc.id,
      tags: commonTags,
    });

    // --- Subnets (Public for NAT, Private for EC2) ---
    const publicSubnet = new Subnet(this, 'PublicSubnet', {
      vpcId: vpc.id,
      cidrBlock: '10.10.1.0/24',
      mapPublicIpOnLaunch: true,
      tags: { ...commonTags, Name: 'secure-public-subnet' },
    });
    const privateSubnet = new Subnet(this, 'PrivateSubnet', {
      vpcId: vpc.id,
      cidrBlock: '10.10.2.0/24',
      mapPublicIpOnLaunch: false,
      tags: { ...commonTags, Name: 'secure-private-subnet' },
    });

    // --- NAT Gateway for outbound traffic ---
    const eip = new Eip(this, 'NatEip', { tags: commonTags });
    const natGateway = new NatGateway(this, 'NatGateway', {
      allocationId: eip.id,
      subnetId: publicSubnet.id,
      tags: commonTags,
      dependsOn: [igw],
    });

    // --- Routing ---
    const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.id,
      tags: { ...commonTags, Name: 'secure-public-rt' },
    });
    new Route(this, 'PublicRoute', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });
    new RouteTableAssociation(this, 'PublicSubnetAssoc', {
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });
    const privateRouteTable = new RouteTable(this, 'PrivateRouteTable', {
      vpcId: vpc.id,
      tags: { ...commonTags, Name: 'secure-private-rt' },
    });
    new Route(this, 'PrivateRoute', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });
    new RouteTableAssociation(this, 'PrivateSubnetAssoc', {
      subnetId: privateSubnet.id,
      routeTableId: privateRouteTable.id,
    });

    // --- VPC Flow Logging ---
    const flowLogGroup = new CloudwatchLogGroup(this, 'VpcFlowLogGroup', {
      name: `/aws/vpc-flow-logs/secure-vpc-${uniqueSuffix}`,
      retentionInDays: 30,
      tags: commonTags,
    });
    const flowLogRole = new IamRole(this, 'FlowLogRole', {
      name: `flow-log-role-${uniqueSuffix}`,
      assumeRolePolicy: new DataAwsIamPolicyDocument(
        this,
        'FlowLogAssumeRole',
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                {
                  type: 'Service',
                  identifiers: ['vpc-flow-logs.amazonaws.com'],
                },
              ],
            },
          ],
        }
      ).json,
    });
    const flowLogPolicy = new IamPolicy(this, 'FlowLogPolicy', {
      name: `flow-log-policy-${uniqueSuffix}`,
      policy: new DataAwsIamPolicyDocument(this, 'FlowLogPolicyDoc', {
        statement: [
          {
            actions: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
            ],
            resources: [`${flowLogGroup.arn}:*`],
          },
        ],
      }).json,
    });
    new IamRolePolicyAttachment(this, 'FlowLogPolicyAttachment', {
      role: flowLogRole.name,
      policyArn: flowLogPolicy.arn,
    });

    // REMOVED: The IAM policy that gave the FlowLogRole KMS permissions.

    new FlowLog(this, 'VpcFlowLog', {
      iamRoleArn: flowLogRole.arn,
      logDestination: flowLogGroup.arn,
      trafficType: 'ALL',
      vpcId: vpc.id,
      tags: commonTags,
    });

    // --- IAM Policy to Enforce MFA ---
    const mfaPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Deny',
          Action: '*',
          Resource: '*',
          Condition: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        },
      ],
    };
    const mfaEnforcementGroup = new IamGroup(this, 'MfaEnforcementGroup', {
      name: `MfaEnforcedUsers-${uniqueSuffix}`,
    });
    new IamGroupPolicy(this, 'MfaGroupPolicy', {
      name: `EnforceMfaPolicy-${uniqueSuffix}`,
      group: mfaEnforcementGroup.name,
      policy: JSON.stringify(mfaPolicy),
    });

    // --- IAM Role and Instance Profile for EC2 ---
    const ec2Role = new IamRole(this, 'Ec2AppRole', {
      name: `secure-ec2-role-${uniqueSuffix}`,
      assumeRolePolicy: new DataAwsIamPolicyDocument(
        this,
        'Ec2AssumeRolePolicy',
        {
          statement: [
            {
              actions: ['sts:AssumeRole'],
              principals: [
                { type: 'Service', identifiers: ['ec2.amazonaws.com'] },
              ],
            },
          ],
        }
      ).json,
      tags: commonTags,
    });

    new IamRolePolicy(this, 'Ec2AppRolePolicy', {
      name: `S3AndKmsAccessPolicy-${uniqueSuffix}`,
      role: ec2Role.name,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: `${dataBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: dataBucket.arn,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:GenerateDataKey*'],
            Resource: kmsKey.arn,
          },
        ],
      }),
    });

    const instanceProfile = new IamInstanceProfile(this, 'InstanceProfile', {
      name: `secure-instance-profile-${uniqueSuffix}`,
      role: ec2Role.name,
    });

    // --- EC2 Instance Security Group ---
    const ec2Sg = new SecurityGroup(this, 'Ec2Sg', {
      name: `secure-ec2-sg-${uniqueSuffix}`,
      vpcId: vpc.id,
      description: 'Allow SSH from a specific bastion host',
      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['203.0.113.0/24'],
          description: 'Allow SSH from Bastion',
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: commonTags,
    });

    // --- EC2 Instance ---
    const latestLinuxAmi = new DataAwsAmi(this, 'LatestAmazonLinux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [{ name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] }],
    });
    new Instance(this, 'SecureInstance', {
      ami: latestLinuxAmi.id,
      instanceType: 't2.micro',
      subnetId: privateSubnet.id,
      vpcSecurityGroupIds: [ec2Sg.id],
      iamInstanceProfile: instanceProfile.name,
      rootBlockDevice: {
        encrypted: true,
        kmsKeyId: kmsKey.id,
      },
      tags: { ...commonTags, Name: 'secure-app-server' },
    });
  }
}
