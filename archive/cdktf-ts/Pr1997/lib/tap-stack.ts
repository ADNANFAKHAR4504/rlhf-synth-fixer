import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { SecureInfrastructureModules, SecureInfraConfig } from './modules';
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
            Project: 'SecProject',
            Environment: environmentSuffix,
            ManagedBy: 'CDKTF',
            SecurityLevel: 'High',
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

    // ? Add your stack instantiations here
    // =============================================================================
    // CONFIGURATION - Centralized security parameters
    // =============================================================================
    const secureConfig: SecureInfraConfig = {
      // Approved IP ranges - Replace with your organization's IP ranges
      // These should be your office networks, VPN endpoints, etc.
      approvedIpRanges: [
        '203.0.113.0/24', // Example: Office network range
        '198.51.100.0/24', // Example: VPN network range
        '192.0.2.0/24', // Example: Admin network range
      ],

      // Security team email for alerts - Replace with actual security team email
      securityTeamEmail: 'security-team@yourcompany.com',

      // Backup region for disaster recovery - Different from primary region
      backupRegion: 'us-west-2',

      // Environment designation
      environment: 'production',
    };

    // =============================================================================
    // DEPLOY SECURE INFRASTRUCTURE MODULES
    // =============================================================================
    const secureInfra = new SecureInfrastructureModules(
      this,
      'SecProject-Infrastructure',
      secureConfig
    );

    // =============================================================================
    // OUTPUTS - Important resource identifiers for external reference
    // =============================================================================

    // IAM Role ARN - For applications to assume this role
    new TerraformOutput(this, 'iam-role-arn', {
      description: 'ARN of the least-privilege IAM role for applications',
      value: secureInfra.iamRole.arn,
      sensitive: false,
    });

    // Main S3 Bucket Name - For application configuration
    new TerraformOutput(this, 'main-bucket-name', {
      description: 'Name of the main encrypted S3 bucket for application data',
      value: secureInfra.mainBucket.bucket,
      sensitive: false,
    });

    // Log S3 Bucket Name - For log aggregation configuration
    new TerraformOutput(this, 'log-bucket-name', {
      description: 'Name of the encrypted S3 bucket for centralized logging',
      value: secureInfra.logBucket.bucket,
      sensitive: false,
    });

    // KMS Key ID - For additional encryption needs
    new TerraformOutput(this, 'kms-key-id', {
      description: 'ID of the KMS key used for encryption at rest',
      value: secureInfra.kmsKey.keyId,
      sensitive: false,
    });

    // KMS Key ARN - For IAM policies and cross-service encryption
    new TerraformOutput(this, 'kms-key-arn', {
      description: 'ARN of the KMS key used for encryption at rest',
      value: secureInfra.kmsKey.arn,
      sensitive: false,
    });

    // VPC ID - For additional resource deployment
    new TerraformOutput(this, 'vpc-id', {
      description: 'ID of the secure VPC for network isolation',
      value: secureInfra.vpc.id,
      sensitive: false,
    });

    // Security Group ID - For EC2 instances and other compute resources
    new TerraformOutput(this, 'security-group-id', {
      description: 'ID of the security group with restricted access rules',
      value: secureInfra.securityGroup.id,
      sensitive: false,
    });

    // CloudTrail ARN - For compliance and audit reporting
    new TerraformOutput(this, 'cloudtrail-arn', {
      description: 'ARN of the CloudTrail for comprehensive API logging',
      value: secureInfra.cloudTrail.arn,
      sensitive: false,
    });

    // SNS Topic ARN - For integrating additional security alerts
    new TerraformOutput(this, 'security-alerts-topic-arn', {
      description: 'ARN of the SNS topic for security alerts and notifications',
      value: secureInfra.snsAlertTopic.arn,
      sensitive: false,
    });

    // Backup Vault Name - For additional backup configurations
    new TerraformOutput(this, 'backup-vault-name', {
      description: 'Name of the AWS Backup vault for automated backups',
      value: secureInfra.backupVault.name,
      sensitive: false,
    });

    // CloudWatch Alarm Names - For monitoring dashboard integration
    new TerraformOutput(this, 'unauthorized-access-alarm-name', {
      description:
        'Name of the CloudWatch alarm for unauthorized access attempts',
      value: secureInfra.unauthorizedAccessAlarm.alarmName,
      sensitive: false,
    });

    // Backup Bucket ARN - For cross-region disaster recovery reference
    new TerraformOutput(this, 'backup-bucket-arn', {
      description: 'ARN of the cross-region backup S3 bucket',
      value: secureInfra.backupBucket.arn,
      sensitive: false,
    });

    // Region Information - For multi-region deployments
    new TerraformOutput(this, 'primary-region', {
      description: 'Primary AWS region for the deployment',
      value: 'us-east-1',
      sensitive: false,
    });

    new TerraformOutput(this, 'backup-region', {
      description: 'Backup AWS region for disaster recovery',
      value: secureConfig.backupRegion,
      sensitive: false,
    });

    // Security Configuration Summary - For documentation and compliance
    new TerraformOutput(this, 'security-summary', {
      description: 'Summary of security controls implemented',
      value: JSON.stringify({
        encryption: 'All data encrypted at rest with KMS',
        networking: 'VPC with restricted security groups',
        access_control: 'Least privilege IAM roles and policies',
        logging: 'Comprehensive CloudTrail and CloudWatch logging',
        backup: 'Cross-region backup with AWS Backup service',
        monitoring: 'CloudWatch alarms with SNS notifications',
        compliance: '90-day log retention for audit requirements',
      }),
      sensitive: false,
    });

    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
