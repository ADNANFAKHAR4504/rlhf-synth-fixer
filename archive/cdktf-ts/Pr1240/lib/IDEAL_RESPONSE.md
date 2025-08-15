import { App, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration-a';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging-a';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

/\*\*

- @interface SecureInfraConstructProps
- @description Defines the properties for the regional security-hardened infrastructure construct.
- @property {string} region - The AWS region for this instance of the infrastructure.
- @property {AwsProvider} provider - The CDKTF AWS provider configured for the specific region.
- @property {{ [key: string]: string }} tags - A map of tags to apply to all resources.
- @property {S3Bucket} loggingBucket - The central S3 bucket for access logs.
  \*/
  interface SecureInfraConstructProps {
  region: string;
  provider: AwsProvider;
  tags: { [key: string]: string };
  loggingBucket: S3Bucket;
  }

/\*\*

- @class SecureInfraConstruct
- @description A reusable construct that creates a security-hardened set of resources in a specific AWS region.
- This includes a private VPC, a KMS key with a restrictive policy, a least-privilege IAM role,
- an encrypted S3 bucket, and a CloudWatch Log Group.
  \*/
  class SecureInfraConstruct extends Construct {
  public readonly appRoleArn: TerraformOutput;
  public readonly dataBucketName: TerraformOutput;

constructor(scope: Construct, id: string, props: SecureInfraConstructProps) {
super(scope, id);

    const { region, provider, tags, loggingBucket } = props;
    const resourcePrefix = `${tags.Project}-${tags.Environment}-${region}`;

    // --- Networking (Private by Default) ---
    const vpc = new Vpc(this, 'Vpc', {
      provider,
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      tags: { ...tags, Name: `${resourcePrefix}-vpc` },
    });

    const subnet = new Subnet(this, 'PrivateSubnet', {
      provider,
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      tags: { ...tags, Name: `${resourcePrefix}-private-subnet` },
    });

    const defaultSg = new SecurityGroup(this, 'DefaultSg', {
      provider,
      name: `${resourcePrefix}-default-sg`,
      description: 'Default security group - no inbound access',
      vpcId: vpc.id,
      tags: { ...tags, Name: `${resourcePrefix}-default-sg` },
      // No ingress/egress rules by default to enforce least privilege
    });

    // --- IAM & KMS (Least Privilege & Encryption) ---
    const callerIdentity = new DataAwsCallerIdentity(this, 'CallerIdentity', { provider });

    // IAM Role for the application
    const appRole = new IamRole(this, 'AppRole', {
      provider,
      name: `${resourcePrefix}-AppRole`,
      assumeRolePolicy: new DataAwsIamPolicyDocument(this, 'AppRoleAssumePolicy', {
        provider,
        statement: [{
          actions: ['sts:AssumeRole'],
          principals: [{
            type: 'Service',
            identifiers: ['ec2.amazonaws.com'], // Example service principal
          }],
        }],
      }).json,
      tags,
    });

    // Customer-managed KMS Key for data encryption
    const dataKey = new KmsKey(this, 'DataKmsKey', {
      provider,
      description: `KMS key for ${resourcePrefix}`,
      enableKeyRotation: true,
      policy: new DataAwsIamPolicyDocument(this, 'KmsKeyPolicy', {
        provider,
        statement: [
          // 1. Allow root user full access to the key
          {
            sid: 'Enable IAM User Permissions',
            actions: ['kms:*'],
            effect: 'Allow',
            resources: ['*'],
            principals: [{
              type: 'AWS',
              identifiers: [`arn:aws:iam::${callerIdentity.accountId}:root`],
            }],
          },
          // 2. Grant explicit encrypt/decrypt permissions to the application role
          {
            sid: 'Allow AppRole to use the key',
            actions: ['kms:Encrypt', 'kms:Decrypt', 'kms:ReEncrypt*', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
            effect: 'Allow',
            resources: ['*'], // Policy is attached to the key, so '*' refers to this key
            principals: [{
              type: 'AWS',
              identifiers: [appRole.arn],
            }],
          },
        ],
      }).json,
      tags,
    });

    // --- S3 Bucket (Encrypted & Logged) ---
    const dataBucket = new S3Bucket(this, 'DataBucket', {
      provider,
      bucket: `${resourcePrefix}-data-bucket-${callerIdentity.accountId}`,
      tags,
    });

    new S3BucketPublicAccessBlock(this, 'DataBucketPab', {
      provider,
      bucket: dataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 'DataBucketSse', {
      provider,
      bucket: dataBucket.id,
      rule: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'aws:kms',
          kmsMasterKeyId: dataKey.id,
        },
        bucketKeyEnabled: true,
      }],
    });

    new S3BucketLoggingA(this, 'DataBucketLogging', {
        provider,
        bucket: dataBucket.id,
        targetBucket: loggingBucket.id,
        targetPrefix: `logs/${dataBucket.bucket}/`,
    });

    // --- IAM Policy (Precise, No Wildcards) ---
    const appPolicy = new IamPolicy(this, 'AppPolicy', {
      provider,
      name: `${resourcePrefix}-AppPolicy`,
      description: 'Least-privilege policy for the application',
      policy: new DataAwsIamPolicyDocument(this, 'AppPolicyDoc', {
        provider,
        statement: [
          {
            sid: 'S3ObjectAccess',
            effect: 'Allow',
            actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            resources: [`${dataBucket.arn}/*`], // Precise access to objects in the bucket
          },
          {
            sid: 'S3ListAccess',
            effect: 'Allow',
            actions: ['s3:ListBucket'],
            resources: [dataBucket.arn], // Precise access to the bucket itself
          },
        ],
      }).json,
      tags,
    });

    new IamRolePolicyAttachment(this, 'AppPolicyAttachment', {
      provider,
      role: appRole.name,
      policyArn: appPolicy.arn,
    });

    // --- CloudWatch Logging ---
    new CloudwatchLogGroup(this, 'AppLogGroup', {
      provider,
      name: `/app/${resourcePrefix}/application-logs`,
      retentionInDays: 30,
      tags,
    });

    // --- Outputs ---
    this.appRoleArn = new TerraformOutput(this, 'AppRoleArn', { value: appRole.arn });
    this.dataBucketName = new TerraformOutput(this, 'DataBucketName', { value: dataBucket.bucket });

}
}

/\*\*

- @class DualRegionSecureStack
- @description The main CDKTF stack that orchestrates the deployment of security-hardened infrastructure
- across two AWS regions: us-east-1 and us-west-2.
  \*/
  class DualRegionSecureStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
  super(scope, id);

      const commonTags = {
        Project: 'SecureCore',
        Environment: 'Prod',
        Owner: 'SRE-Team',
      };

      // --- Define Providers for Each Region ---
      const usEast1Provider = new AwsProvider(this, 'aws-us-east-1', {
        region: 'us-east-1',
        alias: 'us-east-1',
      });

      const usWest2Provider = new AwsProvider(this, 'aws-us-west-2', {
        region: 'us-west-2',
        alias: 'us-west-2',
      });

      // --- Central Logging Bucket (in us-east-1) ---
      const centralLoggingBucket = new S3Bucket(this, 'CentralLoggingBucket', {
          provider: usEast1Provider,
          bucket: `secure-core-central-logs-${new DataAwsCallerIdentity(this, 'MainCallerIdentity', { provider: usEast1Provider }).accountId}`,
          tags: {...commonTags, Name: 'central-logging-bucket'}
      });

      new S3BucketPublicAccessBlock(this, 'LoggingBucketPab', {
          provider: usEast1Provider,
          bucket: centralLoggingBucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
      });

      // --- Instantiate Regional Infrastructure ---
      new SecureInfraConstruct(this, 'Infra-us-east-1', {
        region: 'us-east-1',
        provider: usEast1Provider,
        tags: commonTags,
        loggingBucket: centralLoggingBucket,
      });

      new SecureInfraConstruct(this, 'Infra-us-west-2', {
        region: 'us-west-2',
        provider: usWest2Provider,
        tags: commonTags,
        loggingBucket: centralLoggingBucket,
      });

  }
  }

const app = new App();
new DualRegionSecureStack(app, 'dual-region-secure-stack');
app.synth();
