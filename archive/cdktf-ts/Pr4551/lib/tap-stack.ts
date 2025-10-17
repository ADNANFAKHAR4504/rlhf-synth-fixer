import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  VpcModule,
  KmsModule,
  S3Module,
  IamModule,
  RdsModule,
  Ec2Module,
  MonitoringModule,
  CloudFrontModule,
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
            Project: 'TAP-Infrastructure',
            IaC: 'CDKTF',
            Terraform: 'true',
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
    // Deploy KMS module first (needed for encryption)
    console.log('📦 Deploying KMS encryption keys...');
    const kmsModule = new KmsModule(this, 'kms');

    const environment = environmentSuffix;
    const project = 'TAP-Infrastructure';
    // Deploy VPC and networking
    console.log('🌐 Deploying VPC and networking components...');
    const vpcModule = new VpcModule(this, 'vpc', {
      environment,
      project,
      awsRegion,
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
      allowedSshCidr: '0.0.0.0/32', // Change this to your IP for better security
    });

    // Deploy S3 bucket for logging
    console.log('🪣 Deploying S3 bucket for logging...');
    const s3Module = new S3Module(this, 's3', kmsModule.key);

    // Deploy RDS PostgreSQL database
    console.log('🗄️ Deploying RDS PostgreSQL database...');
    const rdsModule = new RdsModule(
      this,
      'rds',
      vpcModule.vpc,
      vpcModule.privateSubnets,
      kmsModule.key
    );

    // Deploy IAM roles and policies
    console.log('🔐 Configuring IAM roles and policies...');
    const iamModule = new IamModule(
      this,
      'iam',
      s3Module.logBucket.arn,
      rdsModule.resourceArn
    );

    // Deploy EC2 instance
    console.log('💻 Deploying EC2 instance...');
    const ec2Module = new Ec2Module(
      this,
      'ec2',
      vpcModule.vpc,
      vpcModule.publicSubnets[0],
      iamModule.instanceProfile,
      '0.0.0.0/32' // Replace with your admin IP range
    );

    // Setup monitoring and alerting
    console.log('📊 Configuring CloudWatch monitoring and SNS alerts...');
    const monitoringModule = new MonitoringModule(
      this,
      'monitoring',
      ec2Module.instance.id,
      rdsModule.instance.id,
      'admin@example.com' // Replace with your email
      // kmsModule.key
    );

    // Deploy CloudFront distribution
    console.log('🚀 Deploying CloudFront CDN distribution...');
    const cloudFrontModule = new CloudFrontModule(
      this,
      'cloudfront',
      s3Module.logBucket
    );

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC identifier',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(s => s.id).join(','),
      description: 'Public subnet identifiers',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(s => s.id).join(','),
      description: 'Private subnet identifiers',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.logBucket.id,
      description: 'S3 logging bucket name',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: s3Module.logBucket.arn,
      description: 'S3 logging bucket ARN',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.instance.endpoint,
      description: 'RDS PostgreSQL endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'rds-instance-id', {
      value: rdsModule.instance.id,
      description: 'RDS instance identifier',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: ec2Module.instance.id,
      description: 'EC2 instance identifier',
    });

    new TerraformOutput(this, 'ec2-public-ip', {
      value: ec2Module.instance.publicIp,
      description: 'EC2 instance public IP address',
    });

    new TerraformOutput(this, 'ec2-public-dns', {
      value: ec2Module.instance.publicDns,
      description: 'EC2 instance public DNS name',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: monitoringModule.snsTopic.arn,
      description: 'SNS topic ARN for alerts',
    });

    new TerraformOutput(this, 'cloudfront-distribution-id', {
      value: cloudFrontModule.distribution.id,
      description: 'CloudFront distribution ID',
    });

    new TerraformOutput(this, 'cloudfront-domain-name', {
      value: cloudFrontModule.distribution.domainName,
      description: 'CloudFront distribution domain name',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsModule.key.keyId,
      description: 'KMS master key ID',
    });

    new TerraformOutput(this, 'kms-key-arn', {
      value: kmsModule.key.arn,
      description: 'KMS master key ARN',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
