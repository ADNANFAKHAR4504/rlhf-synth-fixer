import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import {
  VpcModule,
  SecurityGroupModule,
  S3Module,
  IamModule,
  Ec2Module,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Fix: Only use AWS_REGION_OVERRIDE if it's actually set and not empty
    const AWS_REGION_OVERRIDE = process.env.AWS_REGION_OVERRIDE;
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-west-2'; // Changed default to us-west-2 as per problem statement

    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Get current AWS account information
    const current = new DataAwsCallerIdentity(this, 'current');

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

    // Create VPC with public and private subnets
    const vpcModule = new VpcModule(this, 'vpc-module', {
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidr: '10.0.1.0/24',
      privateSubnetCidr: '10.0.2.0/24',
      availabilityZone: `${awsRegion}a`,
    });

    // Create Security Group for EC2 instance
    const securityGroupModule = new SecurityGroupModule(this, 'sg-module', {
      vpcId: vpcModule.vpc.id,
    });

    // Create S3 bucket for application logs
    const s3Module = new S3Module(this, 's3-module');

    // Create IAM role and instance profile for EC2
    const iamModule = new IamModule(this, 'iam-module', {
      bucketArn: s3Module.bucket.arn,
    });

    // Create EC2 instance in private subnet
    const ec2Module = new Ec2Module(this, 'ec2-module', {
      subnetId: vpcModule.privateSubnet.id,
      securityGroupIds: [securityGroupModule.securityGroup.id],
      instanceProfileName: iamModule.instanceProfile.name,
    });

    // Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-id', {
      value: vpcModule.publicSubnet.id,
      description: 'Public subnet ID',
    });

    new TerraformOutput(this, 'private-subnet-id', {
      value: vpcModule.privateSubnet.id,
      description: 'Private subnet ID',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: ec2Module.instance.id,
      description: 'EC2 instance ID',
    });

    new TerraformOutput(this, 'ec2-private-ip', {
      value: ec2Module.instance.privateIp,
      description: 'EC2 instance private IP address',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'S3 bucket name for logs',
    });

    new TerraformOutput(this, 'security-group-id', {
      value: securityGroupModule.securityGroup.id,
      description: 'Security Group ID',
    });

    // Add this new output to use the current variable
    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
