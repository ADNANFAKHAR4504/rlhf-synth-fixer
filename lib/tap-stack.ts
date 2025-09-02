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
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';

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
              CreatedAt: new Date().toISOString(),
            },
          },
        ];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
      // Add retry configuration for better reliability
      maxRetries: 3,
    });

    // Configure S3 Backend with enhanced state locking configuration
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
      // Add DynamoDB table for state locking (recommended)
      dynamodbTable: 'terraform-state-locks',
      // Add workspace configuration for better isolation
      workspaceKeyPrefix: 'workspaces',
    });

    // Enhanced state locking configuration
    this.addOverride('terraform.backend.s3', {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
      dynamodb_table: 'terraform-state-locks',
      workspace_key_prefix: 'workspaces',
      // Add retry and timeout configurations
      max_retries: 5,
      skip_credentials_validation: false,
      skip_metadata_api_check: false,
      skip_region_validation: false,
      // Force path style for compatibility
      force_path_style: false,
    });

    // Add your stack instantiations here
    // Terraform Variables for sensitive data
    const dbUsername = new TerraformVariable(this, 'db_username', {
      type: 'string',
      description: 'Database username',
      default: 'admin',
      sensitive: false,
      validation: [
        {
          condition: 'length(var.db_username) >= 3',
          errorMessage: 'Database username must be at least 3 characters long.',
        },
      ],
    });

    const allowedCidrBlocks = new TerraformVariable(
      this,
      'allowed_cidr_blocks',
      {
        type: 'list(string)',
        description: 'CIDR blocks allowed to access the application',
        default:
          environmentSuffix === 'prod' || environmentSuffix === 'production'
            ? ['10.0.0.0/8'] // More restrictive for production
            : ['0.0.0.0/0'], // Open for development
        validation: [
          {
            condition: 'length(var.allowed_cidr_blocks) > 0',
            errorMessage: 'At least one CIDR block must be specified.',
          },
        ],
      }
    );

    // Configuration parameters with error handling
    let dbPasswordSecret;
    try {
      dbPasswordSecret = new DataAwsSecretsmanagerSecretVersion(
        this,
        'db-password-secret',
        {
          secretId: `secureapp-db-password-${environmentSuffix}`,
          // Add version stage for better secret management
          versionStage: 'AWSCURRENT',
        }
      );
    } catch (error) {
      // Fallback to a default secret if the environment-specific one doesn't exist
      dbPasswordSecret = new DataAwsSecretsmanagerSecretVersion(
        this,
        'db-password-secret-fallback',
        {
          secretId: 'my-db-password',
          versionStage: 'AWSCURRENT',
        }
      );
    }

    // Environment-specific configuration with validation
    const config: SecureAppModulesConfig = {
      environment: environmentSuffix,
      allowedCidrBlocks: allowedCidrBlocks.listValue,
      dbUsername: dbUsername.stringValue,
      dbPassword: dbPasswordSecret.secretString,
      instanceType: this.getInstanceType(environmentSuffix),
    };

    // Create all infrastructure using the SecureApp modules
    const secureAppModules = new SecureAppModules(
      this,
      'SecureAppModules',
      config
    );

    // Terraform Outputs for important resource information
    this.createOutputs(secureAppModules);
  }

  private getInstanceType(environmentSuffix: string): string {
    const prodEnvironments = ['production', 'prod', 'prd'];
    const stagingEnvironments = ['staging', 'stage', 'stg'];

    if (prodEnvironments.includes(environmentSuffix.toLowerCase())) {
      return 't3.medium';
    } else if (stagingEnvironments.includes(environmentSuffix.toLowerCase())) {
      return 't3.small';
    } else {
      return 't3.micro';
    }
  }

  private createOutputs(secureAppModules: SecureAppModules): void {
    // Infrastructure Outputs
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

    // Security Outputs
    new TerraformOutput(this, 'web_security_group_id', {
      value: secureAppModules.webSecurityGroup.id,
      description: 'ID of the web security group',
    });

    new TerraformOutput(this, 'db_security_group_id', {
      value: secureAppModules.dbSecurityGroup.id,
      description: 'ID of the database security group',
    });

    // Encryption Outputs
    new TerraformOutput(this, 'kms_key_id', {
      value: secureAppModules.kmsKey.keyId,
      description: 'ID of the KMS key',
    });

    new TerraformOutput(this, 'kms_key_arn', {
      value: secureAppModules.kmsKey.arn,
      description: 'ARN of the KMS key',
    });

    // Storage Outputs
    new TerraformOutput(this, 's3_bucket_name', {
      value: secureAppModules.s3Bucket.bucket,
      description: 'Name of the S3 bucket',
    });

    new TerraformOutput(this, 's3_bucket_arn', {
      value: secureAppModules.s3Bucket.arn,
      description: 'ARN of the S3 bucket',
    });

    // Database Outputs
    new TerraformOutput(this, 'rds_endpoint', {
      value: secureAppModules.rdsInstance.endpoint,
      description: 'RDS instance endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'rds_instance_id', {
      value: secureAppModules.rdsInstance.id,
      description: 'RDS instance identifier',
    });

    // Compute Outputs
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

    // Monitoring Outputs
    new TerraformOutput(this, 'cloudwatch_log_group_name', {
      value: secureAppModules.cloudwatchLogGroup.name,
      description: 'CloudWatch log group name',
    });

    // Application Outputs
    new TerraformOutput(this, 'application_url', {
      value: `http://${secureAppModules.ec2Instance.publicDns}`,
      description: 'URL to access the application',
    });

    // Additional useful outputs
    new TerraformOutput(this, 'deployment_timestamp', {
      value: new Date().toISOString(),
      description: 'Timestamp of deployment',
    });

    new TerraformOutput(this, 'environment', {
      value: secureAppModules.vpc.tags.Environment,
      description: 'Environment name',
    });
  }
}
