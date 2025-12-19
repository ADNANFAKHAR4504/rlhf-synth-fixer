import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import {
  S3Backend,
  TerraformStack,
  TerraformVariable,
  TerraformOutput,
} from 'cdktf';
import { Construct } from 'constructs';
import { RandomProvider } from '@cdktf/provider-random/lib/provider'; // Add this line

// Import your stacks here
import { SecureAppModules, SecureAppModulesConfig } from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-west-2' for SecureApp requirements.

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-west-2';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags
      ? [props.defaultTags]
      : [
          {
            tags: {
              Project: 'SecureApp',
              Environment: environmentSuffix,
              ManagedBy: 'CDKTF',
              Owner: 'DevOps-Team',
            },
          },
        ];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new RandomProvider(this, 'random');

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Add your stack instantiations here
    // Terraform Variables for sensitive data
    const dbUsername = new TerraformVariable(this, 'db_username', {
      type: 'string',
      description: 'Database username',
      default: 'admin',
      sensitive: false,
    });

    const allowedCidrBlocks = new TerraformVariable(
      this,
      'allowed_cidr_blocks',
      {
        type: 'list(string)',
        description: 'CIDR blocks allowed to access the application',
        default: ['0.0.0.0/0'], // Should be restricted in production
      }
    );

    // Environment-specific configuration
    const config: SecureAppModulesConfig = {
      environment: environmentSuffix,
      allowedCidrBlocks: allowedCidrBlocks.listValue,
      dbUsername: dbUsername.stringValue,
      dbPassword: '',
      instanceType:
        environmentSuffix === 'production' || environmentSuffix === 'prod'
          ? 't3.medium'
          : 't3.micro',
    };

    // Create all infrastructure using the SecureApp modules
    const secureAppModules = new SecureAppModules(
      this,
      'SecureAppModules',
      config
    );

    // Terraform Outputs for important resource information
    new TerraformOutput(this, 'vpc_id', {
      value: secureAppModules.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'public_subnet_a_id', {
      value: secureAppModules.publicSubnetA.id,
      description: 'ID of public subnet A',
    });

    new TerraformOutput(this, 'public_subnet_b_id', {
      value: secureAppModules.publicSubnetB.id,
      description: 'ID of public subnet B',
    });

    new TerraformOutput(this, 'private_subnet_a_id', {
      value: secureAppModules.privateSubnetA.id,
      description: 'ID of private subnet A',
    });

    new TerraformOutput(this, 'private_subnet_b_id', {
      value: secureAppModules.privateSubnetB.id,
      description: 'ID of private subnet B',
    });

    new TerraformOutput(this, 'web_security_group_id', {
      value: secureAppModules.webSecurityGroup.id,
      description: 'ID of the web security group',
    });

    new TerraformOutput(this, 'db_security_group_id', {
      value: secureAppModules.dbSecurityGroup.id,
      description: 'ID of the database security group',
    });

    new TerraformOutput(this, 'kms_key_id', {
      value: secureAppModules.kmsKey.keyId,
      description: 'ID of the KMS key',
    });

    new TerraformOutput(this, 'kms_key_arn', {
      value: secureAppModules.kmsKey.arn,
      description: 'ARN of the KMS key',
    });

    new TerraformOutput(this, 's3_bucket_name', {
      value: secureAppModules.s3Bucket.bucket,
      description: 'Name of the S3 bucket',
    });

    new TerraformOutput(this, 's3_bucket_arn', {
      value: secureAppModules.s3Bucket.arn,
      description: 'ARN of the S3 bucket',
    });

    new TerraformOutput(this, 'rds_endpoint', {
      value: secureAppModules.rdsInstance.endpoint,
      description: 'RDS instance endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'rds_instance_id', {
      value: secureAppModules.rdsInstance.id,
      description: 'RDS instance identifier',
    });

    new TerraformOutput(this, 'ec2_instance_id', {
      value: secureAppModules.ec2Instance.id,
      description: 'EC2 instance ID',
    });

    new TerraformOutput(this, 'ec2_public_ip', {
      value: secureAppModules.ec2Instance.publicIp,
      description: 'EC2 instance public IP',
    });

    new TerraformOutput(this, 'ec2_public_dns', {
      value: secureAppModules.ec2Instance.publicDns,
      description: 'EC2 instance public DNS',
    });

    new TerraformOutput(this, 'cloudwatch_log_group_name', {
      value: secureAppModules.cloudwatchLogGroup.name,
      description: 'CloudWatch log group name',
    });

    new TerraformOutput(this, 'application_url', {
      value: `http://${secureAppModules.ec2Instance.publicDns}`,
      description: 'URL to access the application',
    });
  }
}
