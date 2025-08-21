import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  NetworkingModule,
  S3Module,
  IamModule,
  RdsModule,
  SecurityGroupsModule,
  CommonTags,
} from './modules';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
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

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Environment: environmentSuffix,
            Owner: 'DevOps Team',
            Project: 'RLHF',
            ManagedBy: 'Terraform-CDKTF',
          },
        },
      ],
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

    // Common tags for all resources
    const commonTags: CommonTags = {
      Environment: environmentSuffix,
      Owner: 'DevOps Team',
      CostCenter: 'RLHF-CostCenter',
      Project: 'RLHF',
    };

    // ? Add your stack instantiations here
    function tagValue(tags: CommonTags, key: keyof CommonTags): string {
      return (tags[key] ?? '').toString();
    }

    function nameFromTags(tags: CommonTags, suffix: string) {
      const project = tagValue(tags, 'Project').toLowerCase();
      const env = tagValue(tags, 'Environment').toLowerCase();
      return `${project}-${env}-${suffix}`;
    }
    // Deploy Networking Infrastructure
    // Creates VPC with public/private subnets across 3 AZs for high availability
    const networking = new NetworkingModule(this, 'networking', {
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
      privateSubnetCidrs: ['10.0.101.0/24', '10.0.102.0/24', '10.0.103.0/24'],
      tags: commonTags,
    });

    // Deploy S3 Infrastructure
    // Creates secure bucket for application logs with versioning and encryption
    const s3 = new S3Module(this, 's3', {
      bucketName: nameFromTags(commonTags, 'logs'),
      tags: commonTags,
    });

    // Deploy IAM Infrastructure
    // Creates EC2 role with least privilege access to S3 logs bucket
    const iam = new IamModule(
      this,
      'iam',
      {
        roleName: nameFromTags(commonTags, 'ec2-role'),
        tags: commonTags,
      },
      s3.bucket.arn
    );

    // Deploy Security Groups
    // Creates reusable security groups for web and application tiers
    const securityGroups = new SecurityGroupsModule(
      this,
      'security-groups',
      networking.vpc.id,
      commonTags
    );

    // Deploy RDS Infrastructure
    const dbPasswordSecret = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-password-secret',
      {
        secretId: 'my-db-password',
      }
    );
    // Creates Multi-AZ RDS instance with automated backups and encryption
    const rds = new RdsModule(
      this,
      'rds',
      {
        instanceIdentifier: 'rlhfdb',
        dbName: 'rlhfdb',
        instanceClass: 'db.t3.medium', // Use appropriate size for production
        allocatedStorage: 20,
        engine: 'mysql',
        username: 'admin',
        dbPassword: dbPasswordSecret.secretString,
        vpcSecurityGroupIds: [], // Will be set by the module
        subnetGroupName: nameFromTags(commonTags, 'db-subnet-group'),
        tags: commonTags,
      },
      networking.vpc.id,
      networking.privateSubnets.map(subnet => subnet.id)
    );

    // Export all important outputs for use by other stacks or external systems

    // Networking Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: networking.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: networking.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of the public subnets',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: networking.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
    });

    new TerraformOutput(this, 'availability-zones', {
      value: networking.availabilityZones.names,
      description: 'Available availability zones',
    });

    // S3 Outputs
    new TerraformOutput(this, 's3-bucket-name', {
      value: s3.bucket.bucket,
      description: 'Name of the S3 logs bucket',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: s3.bucket.arn,
      description: 'ARN of the S3 logs bucket',
    });

    new TerraformOutput(this, 's3-bucket-domain-name', {
      value: s3.bucket.bucketDomainName,
      description: 'Domain name of the S3 logs bucket',
    });

    // IAM Outputs
    new TerraformOutput(this, 'ec2-role-arn', {
      value: iam.ec2Role.arn,
      description: 'ARN of the EC2 IAM role',
    });

    new TerraformOutput(this, 'ec2-instance-profile-name', {
      value: iam.instanceProfile.name,
      description: 'Name of the EC2 instance profile',
    });

    // Security Group Outputs
    new TerraformOutput(this, 'web-security-group-id', {
      value: securityGroups.webSecurityGroup.id,
      description: 'ID of the web tier security group',
    });

    new TerraformOutput(this, 'app-security-group-id', {
      value: securityGroups.appSecurityGroup.id,
      description: 'ID of the application tier security group',
    });

    // RDS Outputs
    new TerraformOutput(this, 'rds-endpoint', {
      value: rds.dbInstance.endpoint,
      description: 'RDS instance endpoint',
      sensitive: false, // Endpoint is not sensitive, but connection details are
    });

    new TerraformOutput(this, 'rds-port', {
      value: rds.dbInstance.port,
      description: 'RDS instance port',
    });

    new TerraformOutput(this, 'rds-db-name', {
      value: rds.dbInstance.dbName,
      description: 'RDS database name',
    });

    new TerraformOutput(this, 'rds-security-group-id', {
      value: rds.securityGroup.id,
      description: 'ID of the RDS security group',
    });

    // Additional outputs for monitoring and operations
    new TerraformOutput(this, 'region', {
      value: awsRegion,
      description: 'AWS region where resources are deployed',
    });

    new TerraformOutput(this, 'environment', {
      value: environmentSuffix,
      description: 'Environment name',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
