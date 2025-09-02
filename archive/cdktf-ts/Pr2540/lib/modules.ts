import { Fn } from 'cdktf';
import { Construct } from 'constructs';

import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';

import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DataAwsVpc } from '@cdktf/provider-aws/lib/data-aws-vpc';

export interface ModuleConfig {
  environment: string;
  projectName: string;
  tags: { [key: string]: string };
  /** Stable random suffix passed from the stack (e.g., "9f3a") */
  nameSuffix: string;
}

/** S3 Module - secure S3 bucket with versioning/encryption; globally-unique name via suffix */
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;
  public readonly bucketArn: string;
  public readonly bucketName: string;

  constructor(scope: Construct, id: string, config: ModuleConfig) {
    super(scope, id);

    // Ensure fixed parts are lowercase for S3 naming rules
    const proj = (config.projectName ?? '').toLowerCase();
    const env = (config.environment ?? '').toLowerCase();

    // Build name using Fn.format so Terraform gets a valid expression (no tftoken)
    const bucketName = Fn.format('%s-%s-%s-bucket', [
      proj,
      env,
      config.nameSuffix,
    ]);

    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: bucketName,
      tags: {
        ...config.tags,
        Name: bucketName,
        Component: 'storage',
      },
      // Safety: avoid accidental destruction
      lifecycle: {
        preventDestroy: true,
        ignoreChanges: ['tags'],
      },
      forceDestroy: false,
    });

    new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: this.bucket.bucket,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-encryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    this.bucketArn = this.bucket.arn;
    this.bucketName = this.bucket.bucket;
  }
}

/** Security Group Module - only HTTPS ingress; unique name via suffix */
export class SecurityGroupModule extends Construct {
  public readonly securityGroup: SecurityGroup;
  public readonly securityGroupId: string;

  constructor(
    scope: Construct,
    id: string,
    config: ModuleConfig & { vpcId: string }
  ) {
    super(scope, id);

    const sgName = Fn.format('%s-%s-%s-sg', [
      config.projectName,
      config.environment,
      config.nameSuffix,
    ]);

    this.securityGroup = new SecurityGroup(this, 'security-group', {
      name: sgName,
      description: `Security group for ${config.projectName} ${config.environment} environment`,
      vpcId: config.vpcId,

      // Inbound rules - only HTTPS (port 443)
      ingress: [
        {
          description: 'HTTPS traffic',
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],

      // Outbound rules - allow all outbound traffic
      egress: [
        {
          description: 'All outbound traffic',
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],

      tags: {
        ...config.tags,
        Name: sgName,
        Component: 'security',
      },

      lifecycle: {
        preventDestroy: true,
        ignoreChanges: ['tags', 'description'],
      },
    });

    this.securityGroupId = this.securityGroup.id;
  }
}

/** IAM Role Module - least privilege; unique name via suffix */
export class IamRoleModule extends Construct {
  public readonly role: IamRole;
  public readonly roleArn: string;
  public readonly roleName: string;

  constructor(
    scope: Construct,
    id: string,
    config: ModuleConfig & { bucketArn: string }
  ) {
    super(scope, id);

    const callerIdentity = new DataAwsCallerIdentity(this, 'current');
    const currentRegion = new DataAwsRegion(this, 'current-region');

    const roleName = Fn.format('%s-%s-%s-role', [
      config.projectName,
      config.environment,
      config.nameSuffix,
    ]);

    this.role = new IamRole(this, 'iam-role', {
      name: roleName,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
          },
        ],
      }),
      tags: {
        ...config.tags,
        Name: roleName,
        Component: 'iam',
      },
      lifecycle: {
        preventDestroy: true,
        ignoreChanges: ['tags'],
      },
    });

    const policyDocument = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:GetObjectVersion',
            's3:ListBucket',
          ],
          Resource: [config.bucketArn, `${config.bucketArn}/*`],
          Condition: {
            StringEquals: {
              'aws:RequestedRegion': currentRegion.name,
            },
          },
        },
        {
          Effect: 'Allow',
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          Resource: `arn:aws:logs:${currentRegion.name}:${callerIdentity.accountId}:log-group:/aws/${config.projectName}/${config.environment}/*`,
        },
      ],
    };

    new IamRolePolicy(this, 'iam-role-policy', {
      name: Fn.format('%s-policy', [roleName]),
      role: this.role.id,
      policy: JSON.stringify(policyDocument),
    });

    this.roleArn = this.role.arn;
    this.roleName = roleName as unknown as string; // Token; fine for outputs/tests
  }
}

/** VPC Module - retrieves the default VPC */
export class VpcModule extends Construct {
  public readonly vpcId: string;
  public readonly defaultVpc: DataAwsVpc;

  constructor(scope: Construct, id: string, _config: ModuleConfig) {
    super(scope, id);

    this.defaultVpc = new DataAwsVpc(this, 'default-vpc', { default: true });
    this.vpcId = this.defaultVpc.id;
  }
}
