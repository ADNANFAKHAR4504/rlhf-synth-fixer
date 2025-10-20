import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

// Import custom modules
import {
  VPCConstruct,
  IAMConstruct,
  S3BucketConstruct,
  RDSConstruct,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

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

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new RandomProvider(this, 'random', {});

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${awsRegion}/${id}.tfstate`, // Add region to path
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Get current AWS account ID
    const current = new DataAwsCallerIdentity(this, 'current');

    // Common tags
    const commonTags = {
      Environment: environmentSuffix,
      ManagedBy: 'Terraform',
      Project: id,
    };

    // Create VPC
    const vpcModule = new VPCConstruct(this, 'vpc', {
      projectName: id,
      environment: environmentSuffix,
      tags: commonTags,
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24'],
      azs: [`${awsRegion}a`, `${awsRegion}b`],
    });

    // Create KMS key for encryption
    const kmsModule = new (class extends Construct {
      public readonly key: KmsKey;
      public readonly alias: KmsAlias;

      constructor(scope: Construct, id: string) {
        super(scope, id);

        this.key = new KmsKey(scope, 'kms-key', {
          description: `${id}-${environmentSuffix} encryption key`,
          enableKeyRotation: true,
          tags: {
            ...commonTags,
            Name: `${id}-${environmentSuffix}-kms-key`,
          },
        });

        this.alias = new KmsAlias(scope, 'kms-alias', {
          name: `alias/${id}-${environmentSuffix}`,
          targetKeyId: this.key.keyId,
        });
      }
    })(this, 'kms');

    // Create IAM roles
    const iamModule = new IAMConstruct(this, 'iam', {
      projectName: id,
      environment: environmentSuffix,
      tags: commonTags,
    });

    // Create S3 buckets
    const publicS3Module = new S3BucketConstruct(this, 'public-s3', {
      projectName: id,
      environment: environmentSuffix,
      tags: commonTags,
      bucketName: `${id.toLowerCase()}-${environmentSuffix}-pubblic-assets`, // Convert to lowercase
      encryption: 'SSE-S3',
      versioning: true,
    });

    const privateS3Module = new S3BucketConstruct(this, 'private-s3', {
      projectName: id,
      environment: environmentSuffix,
      tags: commonTags,
      bucketName: `${id.toLowerCase()}-${environmentSuffix}-priivate-data`, // Convert to lowercase
      encryption: 'SSE-KMS',
      kmsKeyArn: kmsModule.key.arn,
      versioning: true,
    });

    // Security Groups
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `${id}-${environmentSuffix}-alb-sg`,
      description: 'Security group for ALB',
      vpcId: vpcModule.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP from anywhere',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound',
        },
      ],
      tags: {
        ...commonTags,
        Name: `${id}-${environmentSuffix}-alb-sg`,
      },
    });

    const instanceSecurityGroup = new SecurityGroup(this, 'instance-sg', {
      name: `${id}-${environmentSuffix}-instance-sg`,
      description: 'Security group for EC2 instances',
      vpcId: vpcModule.vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [albSecurityGroup.id],
          description: 'Allow HTTP from ALB',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound',
        },
      ],
      tags: {
        ...commonTags,
        Name: `${id}-${environmentSuffix}-instance-sg`,
      },
    });

    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${id}-${environmentSuffix}-rds-sg`,
      description: 'Security group for RDS',
      vpcId: vpcModule.vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [instanceSecurityGroup.id],
          description: 'Allow PostgreSQL from instances',
        },
      ],
      tags: {
        ...commonTags,
        Name: `${id}-${environmentSuffix}-rds-sg`,
      },
    });

    // Create EC2 instance role
    const ec2Role = iamModule.createRole({
      roleName: `${id}-${environmentSuffix}-ecc2-role`,
      assumeRolePolicy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      policies: [
        {
          policyName: 'ec2-policy',
          policyDocument: IAMConstruct.getEc2InstancePolicy(
            [publicS3Module.bucket.arn, privateS3Module.bucket.arn],
            []
          ),
        },
      ],
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      ],
    });

    // ADD THIS: Create instance profile for the role
    const ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${id}-${environmentSuffix}-instannce-profile`,
        role: ec2Role.name,
      }
    );

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux-2', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // Create public EC2 instance
    const publicEc2Module = new (class extends Construct {
      public readonly instance: Instance;

      constructor(scope: Construct, id: string) {
        super(scope, id);

        this.instance = new Instance(scope, 'public-instance', {
          instanceType: 't3.micro',
          ami: ami.id,
          subnetId: vpcModule.publicSubnets[0].id,
          vpcSecurityGroupIds: [instanceSecurityGroup.id],
          iamInstanceProfile: ec2InstanceProfile.name, // Use instance profile name, not role name
          metadataOptions: {
            httpTokens: 'required',
            httpPutResponseHopLimit: 1,
          },
          tags: {
            ...commonTags,
            Name: `${id}-${environmentSuffix}-public-instance`,
          },
        });
      }
    })(this, 'public-ec2');

    // Create private EC2 instance
    const privateEc2Module = new (class extends Construct {
      public readonly instance: Instance;

      constructor(scope: Construct, id: string) {
        super(scope, id);

        this.instance = new Instance(scope, 'private-instance', {
          instanceType: 't3.micro',
          ami: ami.id,
          subnetId: vpcModule.privateSubnets[0].id,
          vpcSecurityGroupIds: [instanceSecurityGroup.id],
          iamInstanceProfile: ec2InstanceProfile.name, // Use instance profile name, not role name
          metadataOptions: {
            httpTokens: 'required',
            httpPutResponseHopLimit: 1,
          },
          tags: {
            ...commonTags,
            Name: `${id}-${environmentSuffix}-private-instance`,
          },
        });
      }
    })(this, 'private-ec2');

    // Create RDS instance
    const rdsModule = new RDSConstruct(this, 'rds', {
      projectName: id.toLowerCase(),
      environment: environmentSuffix,
      tags: commonTags,
      instanceIdentifier: `${id.toLowerCase()}-${environmentSuffix}-db`,
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      engine: 'postgres',
      multiAz: environmentSuffix === 'production',
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      backupRetentionPeriod: environmentSuffix === 'production' ? 30 : 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: environmentSuffix === 'production',
      kmsKeyId: kmsModule.key.arn, // Changed from .id to .arn
      storageEncrypted: true,
    });

    // Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'public-ec2-instance-id', {
      value: publicEc2Module.instance.id,
      description: 'Public EC2 instance ID',
    });

    new TerraformOutput(this, 'public-ec2-public-ip', {
      value: publicEc2Module.instance.publicIp,
      description: 'Public EC2 instance public IP address',
    });

    new TerraformOutput(this, 'private-ec2-instance-id', {
      value: privateEc2Module.instance.id,
      description: 'Private EC2 instance ID',
    });

    new TerraformOutput(this, 'private-ec2-private-ip', {
      value: privateEc2Module.instance.privateIp,
      description: 'Private EC2 instance private IP address',
    });

    new TerraformOutput(this, 'public-s3-bucket-name', {
      value: publicS3Module.bucket.bucket,
      description: 'Public S3 bucket name for app assets',
    });

    new TerraformOutput(this, 'private-s3-bucket-name', {
      value: privateS3Module.bucket.bucket,
      description: 'Private S3 bucket name for internal data',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.instance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsModule.key.keyId,
      description: 'KMS key ID',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });
  }
}
