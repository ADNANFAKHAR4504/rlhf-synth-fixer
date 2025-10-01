import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  VpcModule,
  Ec2Module,
  S3Module,
  IamModule,
  CloudTrailModule,
  CloudWatchModule,
  WafModule,
  KmsModule,
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

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Project: 'SecureWebApp',
            Environment: environmentSuffix,
            ManagedBy: 'CDKTF',
            Owner: 'DevOps Team',
            CostCenter: 'IT-Security',
            ComplianceRequired: 'true',
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
    // Configuration variables
    const config = {
      // Network configuration
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidr: '10.0.1.0/24',
      privateSubnetCidr: '10.0.2.0/24',
      availabilityZone: 'us-east-1a',

      // Security configuration - Replace with your actual approved IP ranges
      allowedSshCidr: ['10.0.0.0/8'], // Internal network only
      allowedHttpsCidr: ['0.0.0.0/0'], // HTTPS can be more open, but consider restricting

      // EC2 configuration
      instanceType: 't3.medium',
      // Replace with your desired AMI ID (Amazon Linux 2 example)
      amiId: 'ami-0c02fb55956c7d316', // This should be a real AMI ID

      // S3 configuration
      appBucketName: 'secure-app-bucket-ts-12345', // Unique bucket name
      cloudtrailBucketName: 'secure-cloudtrail-bucket-ts-12345', // Unique bucket name

      // CloudTrail configuration
      cloudtrailName: 'secure-app-cloudtrail-trail',

      // WAF configuration
      webAclName: 'SecureAppWebACLTS',

      // IAM configuration
      mfaRequired: true,
      accessKeyRotationDays: 90,
    };

    // KMS Module - Create encryption keys first
    const kmsModule = new KmsModule(this, 'kms', {
      keyDescription: 'KMS key for secure web application encryption',
      keyUsage: 'ENCRYPT_DECRYPT',
    });

    // VPC Module - Network foundation
    const vpcModule = new VpcModule(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      publicSubnetCidr: config.publicSubnetCidr,
      privateSubnetCidr: config.privateSubnetCidr,
      availabilityZone: config.availabilityZone,
      kmsKeyId: kmsModule.kmsKey.arn,
    });

    // S3 Module - Storage with encryption
    const s3Module = new S3Module(this, 's3', {
      bucketName: config.appBucketName,
      cloudtrailBucketName: config.cloudtrailBucketName,
      kmsKeyId: kmsModule.kmsKey.arn,
      trailName: config.cloudtrailName,
    });

    // CloudTrail Module - Audit logging
    const cloudtrailModule = new CloudTrailModule(this, 'cloudtrail', {
      trailName: config.cloudtrailName,
      s3BucketName: s3Module.cloudtrailBucket.bucket,
      kmsKeyId: kmsModule.kmsKey.arn,
    });

    // CloudWatch Module - Security monitoring
    const cloudwatchModule = new CloudWatchModule(this, 'cloudwatch', {
      cloudTrailLogGroupName: cloudtrailModule.logGroup.name,
    });

    // IAM Module - Identity and access management
    new IamModule(this, 'iam', {
      mfaRequired: config.mfaRequired,
      accessKeyRotationDays: config.accessKeyRotationDays,
    });

    // EC2 Module - Application server
    const ec2Module = new Ec2Module(this, 'ec2', {
      subnetId: vpcModule.privateSubnet.id,
      vpcId: vpcModule.vpc.id,
      amiId: config.amiId,
      instanceType: config.instanceType,
      allowedSshCidr: config.allowedSshCidr,
      allowedHttpsCidr: config.allowedHttpsCidr,
      kmsKeyId: kmsModule.kmsKey.arn,
    });

    // WAF Module - Web application firewall
    const wafModule = new WafModule(this, 'waf', {
      webAclName: config.webAclName,
      allowedIpRanges: config.allowedHttpsCidr,
    });

    // Terraform Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID for the secure infrastructure',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: ec2Module.instance.id,
      description: 'EC2 Instance ID for the application server',
    });

    new TerraformOutput(this, 'private-subnet-id', {
      value: vpcModule.privateSubnet.id,
      description: 'Private subnet ID where EC2 instance is deployed',
    });

    new TerraformOutput(this, 's3-app-bucket-name', {
      value: s3Module.appBucket.bucket,
      description: 'S3 bucket name for application data',
    });

    new TerraformOutput(this, 's3-cloudtrail-bucket-name', {
      value: s3Module.cloudtrailBucket.bucket,
      description: 'S3 bucket name for CloudTrail logs',
    });

    new TerraformOutput(this, 'cloudtrail-arn', {
      value: cloudtrailModule.cloudTrail.arn,
      description: 'CloudTrail ARN for audit logging',
    });

    new TerraformOutput(this, 'cloudwatch-unauthorized-api-alarm-arn', {
      value: cloudwatchModule.unauthorizedApiCallsAlarm.arn,
      description: 'CloudWatch alarm ARN for unauthorized API calls',
    });

    new TerraformOutput(this, 'cloudwatch-root-usage-alarm-arn', {
      value: cloudwatchModule.rootAccountUsageAlarm.arn,
      description: 'CloudWatch alarm ARN for root account usage',
    });

    new TerraformOutput(this, 'waf-web-acl-id', {
      value: wafModule.webAcl.id,
      description: 'WAF Web ACL ID for application protection',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsModule.kmsKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new TerraformOutput(this, 'kms-key-arn', {
      value: kmsModule.kmsKey.arn,
      description: 'KMS Key ARN for encryption',
    });

    new TerraformOutput(this, 'security-group-id', {
      value: ec2Module.securityGroup.id,
      description: 'Security Group ID for EC2 instance',
    });

    new TerraformOutput(this, 'vpc-flow-log-id', {
      value: vpcModule.flowLog.id,
      description: 'VPC Flow Log ID for network monitoring',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
