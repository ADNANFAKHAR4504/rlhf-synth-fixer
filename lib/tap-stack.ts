import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  KmsModule,
  VpcModule,
  IamRoleModule,
  S3BucketModule,
  CloudTrailModule,
  // AwsConfigModule,
  SecurityGroupsModule,
} from './modules';
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    const tags = {
      Environment: 'SecureApp',
      CreatedBy: 'CDKTF',
      Project: 'TAP',
    };

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ? Add your stack instantiations here
    // 1. Create KMS Keys
    const kms = new KmsModule(this, 'kms', {
      keyName: 'tap-encryption-key',
      description: 'KMS key for TAP secure environment',
      enableKeyRotation: true,
      tags,
    });

    // 2. Create VPC with subnets
    const vpc = new VpcModule(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.3.0/24', '10.0.4.0/24'],
      availabilityZones: ['us-east-2a', 'us-east-2b'],
      tags,
    });

    // 3. Create IAM Roles
    const s3AccessRole = new IamRoleModule(this, 's3-access-role', {
      roleName: 'tap-s3-access-role',
      assumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      inlinePolicies: {
        's3-access': {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
              Resource: [
                'arn:aws:s3:::tap-secure-bucket',
                'arn:aws:s3:::tap-secure-bucket/*',
              ],
            },
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
              Resource: kms.keyArn,
            },
          ],
        },
      },
      tags,
    });

    // 4. Create S3 buckets - one for logs and one for application
    // Log bucket first, needed for other services
    const logBucket = new S3BucketModule(this, 'log-bucket', {
      bucketName: 'tap-logs-bucket',
      allowCloudTrailAccess: true,
      kmsKeyId: kms.keyId,
      cloudTrailPrefix: 'cloudtrail-logs/',
      tags,
    });

    // Secure bucket for application data
    const secureBucket = new S3BucketModule(this, 'secure-bucket', {
      bucketName: 'tap-secure-bucket',
      kmsKeyId: kms.keyId,
      accessRoleArn: s3AccessRole.roleArn,
      loggingBucket: logBucket.bucketName,
      loggingPrefix: 'secure-bucket-logs/',
      tags,
    });

    // 5. Set up CloudTrail
    const cloudTrail = new CloudTrailModule(this, 'cloudtrail', {
      trailName: 'tap-cloudtrail',
      s3BucketName: logBucket.bucketName,
      s3KeyPrefix: 'cloudtrail-logs/',
      kmsKeyId: kms.keyArn,
      tags,
    });

    // 6. Set up AWS Config
    // const awsConfig = new AwsConfigModule(this, "config", {
    //   s3BucketName: logBucket.bucketName,
    //   s3KeyPrefix: "config-logs",
    //   kmsKeyId: kms.keyId,
    //   tags
    // });

    // 7. Create Security Groups
    const securityGroups = new SecurityGroupsModule(this, 'security-groups', {
      vpcId: vpc.vpcId,
      allowedHttpCidrs: ['10.0.0.0/8'], // Example restricted CIDR
      allowedSshCidrs: ['10.0.0.0/8'], // Example restricted CIDR
      tags,
    });

    // Outputs
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public_subnet_ids', {
      value: vpc.publicSubnetIds,
      description: 'Public Subnet IDs',
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: vpc.privateSubnetIds,
      description: 'Private Subnet IDs',
    });

    new TerraformOutput(this, 'kms_key_arn', {
      value: kms.keyArn,
      description: 'KMS Key ARN',
    });

    new TerraformOutput(this, 'secure_bucket_name', {
      value: secureBucket.bucketName,
      description: 'Secure S3 Bucket Name',
    });

    new TerraformOutput(this, 'log_bucket_name', {
      value: logBucket.bucketName,
      description: 'Log S3 Bucket Name',
    });

    new TerraformOutput(this, 's3_access_role_arn', {
      value: s3AccessRole.roleArn,
      description: 'IAM Role ARN for S3 Access',
    });

    new TerraformOutput(this, 'cloudtrail_arn', {
      value: cloudTrail.trailArn,
      description: 'CloudTrail ARN',
    });

    // new TerraformOutput(this, "config_recorder_name", {
    //   value: awsConfig.recorderName,
    //   description: "AWS Config Recorder Name"
    // });

    new TerraformOutput(this, 'web_security_group_id', {
      value: securityGroups.webSgId,
      description: 'Web Security Group ID',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
