import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { SecurityModules, SecurityModulesConfig } from './modules';
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

const AWS_REGION_OVERRIDE = 'eu-west-1';

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
            Project: 'MyApp',
            Environment: environmentSuffix,
            ManagedBy: 'CDKTF',
            SecurityLevel: 'High',
            Region: awsRegion,
          },
        },
      ],
    });

    // Configuration variables - centralized for easy management
    const config: SecurityModulesConfig = {
      // Only allow traffic from this specific IP range (RFC 5737 documentation range)
      allowedCidr: '203.0.113.0/24',
      region: 'eu-west-1',
      instanceType: 't3.micro', // Cost-effective for demonstration
      dbInstanceClass: 'db.t3.micro', // Smallest RDS instance for cost optimization
    };

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
    // Initialize security modules with our configuration
    const securityModules = new SecurityModules(
      this,
      'SecurityModules',
      config
    );

    // Terraform Outputs - expose important resource identifiers and endpoints

    // CloudTrail ARN for integration with other security tools
    new TerraformOutput(this, 'cloudtrail_arn', {
      description:
        'ARN of the CloudTrail for security monitoring and compliance',
      value: securityModules.cloudTrail.arn,
      sensitive: false,
    });

    // S3 bucket name for application reference
    new TerraformOutput(this, 's3_bucket_name', {
      description: 'Name of the encrypted S3 bucket for sensitive data storage',
      value: securityModules.s3Bucket.bucket,
      sensitive: false,
    });

    // S3 bucket ARN for IAM policies and cross-service references
    new TerraformOutput(this, 's3_bucket_arn', {
      description: 'ARN of the encrypted S3 bucket for policy references',
      value: securityModules.s3Bucket.arn,
      sensitive: false,
    });

    // KMS Key ID for encryption operations
    new TerraformOutput(this, 'kms_key_id', {
      description:
        'ID of the KMS key used for encrypting EBS volumes, S3 buckets, and RDS',
      value: securityModules.kmsKey.keyId,
      sensitive: false,
    });

    // KMS Key ARN for cross-service encryption
    new TerraformOutput(this, 'kms_key_arn', {
      description: 'ARN of the KMS key for cross-service encryption references',
      value: securityModules.kmsKey.arn,
      sensitive: false,
    });

    // RDS endpoint for application database connections (private access only)
    new TerraformOutput(this, 'rds_endpoint', {
      description:
        'Private endpoint of the RDS instance (accessible only from within VPC)',
      value: securityModules.rdsInstance.endpoint,
      sensitive: true, // Mark as sensitive since it contains connection information
    });

    // RDS port for application configuration
    new TerraformOutput(this, 'rds_port', {
      description: 'Port number of the RDS instance',
      value: securityModules.rdsInstance.port,
      sensitive: false,
    });

    // CloudWatch alarm ARN for integration with notification systems
    new TerraformOutput(this, 'cloudwatch_alarm_arn', {
      description: 'ARN of the CloudWatch alarm monitoring EC2 CPU utilization',
      value: securityModules.cloudWatchAlarm.arn,
      sensitive: false,
    });

    // VPC ID for network configuration reference
    new TerraformOutput(this, 'vpc_id', {
      description: 'ID of the VPC containing all resources',
      value: securityModules.vpc.id,
      sensitive: false,
    });

    // Security Group ID for additional resource configuration
    new TerraformOutput(this, 'security_group_id', {
      description:
        'ID of the security group restricting access to trusted IP range',
      value: securityModules.securityGroup.id,
      sensitive: false,
    });

    // IAM Role ARN for EC2 instance profile reference
    new TerraformOutput(this, 'iam_role_arn', {
      description: 'ARN of the least-privilege IAM role for EC2 instances',
      value: securityModules.iamRole.arn,
      sensitive: false,
    });

    // EC2 Instance ID for management and monitoring
    new TerraformOutput(this, 'ec2_instance_id', {
      description: 'ID of the EC2 instance with encrypted EBS volume',
      value: securityModules.ec2Instance.id,
      sensitive: false,
    });

    // Configuration summary output
    new TerraformOutput(this, 'security_configuration', {
      description: 'Summary of security configuration applied',
      value: {
        allowed_cidr: config.allowedCidr,
        region: config.region,
        encryption_enabled: true,
        cloudtrail_enabled: true,
        rds_public_access: false,
        s3_public_access_blocked: true,
      },
      sensitive: false,
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
