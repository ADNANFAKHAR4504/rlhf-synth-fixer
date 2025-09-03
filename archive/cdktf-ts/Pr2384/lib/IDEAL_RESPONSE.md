## lib/modules.ts

```typescript
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DataAwsVpc } from '@cdktf/provider-aws/lib/data-aws-vpc';

/**
 * Configuration interface for all modules
 */
export interface ModuleConfig {
  environment: string;
  projectName: string;
  tags: { [key: string]: string };
}

/**
 * S3 Module - Creates a secure S3 bucket with versioning and encryption
 */
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;
  public readonly bucketArn: string;

  constructor(scope: Construct, id: string, config: ModuleConfig) {
    super(scope, id);

    const bucketName = `${config.projectName}-${config.environment}-bucket`;

    // Create S3 bucket
    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: bucketName,
      tags: {
        ...config.tags,
        Name: bucketName,
        Component: 'storage',
      },
    });

    // Enable versioning
    new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: this.bucket.bucket, // use .bucket (bucket name), not .id
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Configure server-side encryption
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

    // Block public access
    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    this.bucketArn = this.bucket.arn;
  }
}

/**
 * Security Group Module - Creates a security group allowing only HTTPS traffic
 */
export class SecurityGroupModule extends Construct {
  public readonly securityGroup: SecurityGroup;
  public readonly securityGroupId: string;

  constructor(
    scope: Construct,
    id: string,
    config: ModuleConfig & { vpcId: string }
  ) {
    super(scope, id);

    const sgName = `${config.projectName}-${config.environment}-sg`;

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
    });

    this.securityGroupId = this.securityGroup.id;
  }
}

/**
 * IAM Role Module - Creates an IAM role with least privilege access
 */
export class IamRoleModule extends Construct {
  public readonly role: IamRole;
  public readonly roleArn: string;

  constructor(
    scope: Construct,
    id: string,
    config: ModuleConfig & { bucketArn: string }
  ) {
    super(scope, id);

    // Get current AWS account and region for policy restrictions
    const callerIdentity = new DataAwsCallerIdentity(this, 'current');
    const currentRegion = new DataAwsRegion(this, 'current-region');

    const roleName = `${config.projectName}-${config.environment}-role`;

    // Create IAM role with assume role policy for EC2
    this.role = new IamRole(this, 'iam-role', {
      name: roleName,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        ...config.tags,
        Name: roleName,
        Component: 'iam',
      },
    });

    // Create least privilege policy for S3 bucket access
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

    // Attach inline policy to role
    new IamRolePolicy(this, 'iam-role-policy', {
      name: `${roleName}-policy`,
      role: this.role.id,
      policy: JSON.stringify(policyDocument),
    });

    this.roleArn = this.role.arn;
  }
}

/**
 * VPC Module - Retrieves the default VPC or creates a new one
 * Fixed to properly retrieve the actual default VPC ID
 */
export class VpcModule extends Construct {
  public readonly vpcId: string;
  public readonly defaultVpc: DataAwsVpc;

  constructor(scope: Construct, id: string, _config: ModuleConfig) {
    super(scope, id);

    // Get the actual default VPC using data source
    this.defaultVpc = new DataAwsVpc(this, 'default-vpc', {
      default: true,
    });

    // Use the actual VPC ID from the data source
    this.vpcId = this.defaultVpc.id;
  }
}
```

## lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

// Import your stacks here
import {
  S3Module,
  SecurityGroupModule,
  IamRoleModule,
  VpcModule,
  ModuleConfig,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  projectName?: string;
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
    const projectName = props?.projectName || 'tap-project';

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

    // Get current AWS account for outputs
    const current = new DataAwsCallerIdentity(this, 'current');

    // Common configuration for all modules
    const moduleConfig: ModuleConfig = {
      environment: environmentSuffix,
      projectName: projectName,
      tags: {
        Environment: environmentSuffix,
        Project: projectName,
        ManagedBy: 'terraform',
        ...(props?.defaultTags?.tags || {}),
      },
    };

    // Create VPC module (now properly retrieves default VPC)
    const vpcModule = new VpcModule(this, 'vpc', moduleConfig);

    // Create S3 module
    const s3Module = new S3Module(this, 's3', moduleConfig);

    // Create Security Group module (now uses actual VPC ID)
    const securityGroupModule = new SecurityGroupModule(
      this,
      'security-group',
      {
        ...moduleConfig,
        vpcId: vpcModule.vpcId, // This now contains the actual VPC ID
      }
    );

    // Create IAM Role module
    const iamRoleModule = new IamRoleModule(this, 'iam-role', {
      ...moduleConfig,
      bucketArn: s3Module.bucketArn,
    });

    // Terraform Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpcId,
      description: 'Default VPC ID',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'S3 bucket name',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: s3Module.bucketArn,
      description: 'S3 bucket ARN',
    });

    new TerraformOutput(this, 'security-group-id', {
      value: securityGroupModule.securityGroupId,
      description: 'Security Group ID',
    });

    new TerraformOutput(this, 'iam-role-arn', {
      value: iamRoleModule.roleArn,
      description: 'IAM Role ARN',
    });

    new TerraformOutput(this, 'iam-role-name', {
      value: iamRoleModule.role.name,
      description: 'IAM Role name',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });
  }
}
```