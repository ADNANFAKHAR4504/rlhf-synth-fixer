import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

// Import all modules
import {
  StackConfig,
  validateStackConfiguration,
  createKmsKey,
  createVpcWithSubnetsAndNat,
  createIamRolesAndPolicies,
  createEncryptedS3Buckets,
  createBastionHost,
  createPrivateEc2Fleet,
  createAlbForPrivateInstances,
  createRdsMultiAz,
  createVPCFlowLogs,
  enableGuardDuty,
  createCloudWatchAlarms,
  createSsmSetupAndVpcEndpoints,
} from './modules';

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

    // Get current AWS account identity
    const current = new DataAwsCallerIdentity(this, 'current');

    // Stack configuration
    const stackConfig: StackConfig = {
      environment: environmentSuffix,
      trustedIpRanges: ['10.0.0.0/8'], // Update with your actual trusted IP ranges
      vpcCidr: '10.0.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b'], // Update based on your region
      instanceType: 't3.medium',
      keyPairName: 'TapStackpr4141-keypair', // Update with your actual key pair name
      dbPassword: 'ChangeMePlease123!', // Use AWS Secrets Manager in production
      kmsKeyAlias: `${environmentSuffix}-master-key`,
      notificationEmail: 'alerts@example.com', // Update with actual email
      dbInstanceClass: 'db.t3.medium',
      fleetSize: 2,
      region: awsRegion,
      accountId: current.accountId,
      tags: {
        Environment: environmentSuffix,
        ManagedBy: 'Terraform',
        Stack: id,
      },
    };

    // Validate configuration
    validateStackConfiguration(stackConfig);

    // Create KMS key for encryption
    const kmsKey = createKmsKey(this, stackConfig);

    // Create VPC with subnets and NAT gateways
    const vpcResources = createVpcWithSubnetsAndNat(this, stackConfig);

    // Create IAM roles and policies
    const iamResources = createIamRolesAndPolicies(this, stackConfig);

    // Create encrypted S3 buckets
    const s3Resources = createEncryptedS3Buckets(this, stackConfig, kmsKey);

    // Create bastion host (public EC2)
    const bastionResources = createBastionHost(
      this,
      stackConfig,
      vpcResources,
      iamResources,
      kmsKey
    );

    // Create private EC2 fleet
    const ec2FleetResources = createPrivateEc2Fleet(
      this,
      stackConfig,
      vpcResources,
      iamResources,
      kmsKey
    );

    // Create ALB for private instances
    const albResources = createAlbForPrivateInstances(
      this,
      stackConfig,
      vpcResources,
      ec2FleetResources
    );

    // Create RDS Multi-AZ instance
    const rdsResources = createRdsMultiAz(
      this,
      stackConfig,
      vpcResources,
      kmsKey
    );

    // Enable VPC Flow Logs
    createVPCFlowLogs(this, stackConfig, vpcResources);

    // Enable GuardDuty
    enableGuardDuty(this, stackConfig);

    // Create CloudWatch alarms
    createCloudWatchAlarms(
      this,
      stackConfig,
      ec2FleetResources,
      albResources,
      rdsResources
    );

    // Create SSM setup and VPC endpoints
    createSsmSetupAndVpcEndpoints(
      this,
      stackConfig,
      vpcResources,
      iamResources
    );

    // Terraform Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcResources.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcResources.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcResources.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'bastion-instance-id', {
      value: bastionResources.instance.id,
      description: 'Bastion host instance ID',
    });

    new TerraformOutput(this, 'bastion-public-ip', {
      value: bastionResources.instance.publicIp,
      description: 'Bastion host public IP address',
    });

    new TerraformOutput(this, 'app-s3-bucket-name', {
      value: s3Resources.appBucket.bucket,
      description: 'Application S3 bucket name',
    });

    new TerraformOutput(this, 'log-s3-bucket-name', {
      value: s3Resources.logBucket.bucket,
      description: 'Log S3 bucket name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsResources.instance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsKey.keyId,
      description: 'KMS key ID',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: albResources.alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'private-ec2-instance-ids', {
      value: ec2FleetResources.instances.map(instance => instance.id),
      description: 'Private EC2 fleet instance IDs',
    });
  }
}
