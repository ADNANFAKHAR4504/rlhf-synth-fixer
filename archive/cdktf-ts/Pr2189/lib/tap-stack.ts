import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';

// Import your stacks here
import {
  VpcModule,
  S3Module,
  IamModule,
  AutoScalingModule as autoscalingModule,
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

    // Add your stack instantiations here
    // Do NOT create resources directly in this stack.
    // Instead, create separate stacks for each resource type.

    // Create VPC Module
    const vpcModule = new VpcModule(this, `vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
    });

    // Create S3 Module for static website hosting with CloudFront
    const s3Module = new S3Module(this, `s3-${environmentSuffix}`, {
      bucketName: `my-static-website-${environmentSuffix}-${Date.now()}`, // Adding timestamp to ensure uniqueness
    });

    // Create IAM Module
    const iamModule = new IamModule(this, `iam-${environmentSuffix}`, {
      roleName: `web-server-role-${environmentSuffix}`,
    });

    // Create Auto Scaling Module
    const autoScalingModule = new autoscalingModule(
      this,
      `autoscaling-${environmentSuffix}`,
      {
        vpcId: vpcModule.vpc.id,
        privateSubnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
        publicSubnetIds: vpcModule.publicSubnets.map(subnet => subnet.id),
        instanceProfile: iamModule.instanceProfile,
        minSize: 1,
        maxSize: 3,
        desiredCapacity: 2,
      }
    );

    // VPC Module Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'The ID of the created VPC',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: 'A list of the IDs of the public subnets',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: 'A list of the IDs of the private subnets',
    });

    new TerraformOutput(this, 'internet-gateway-id', {
      value: vpcModule.internetGateway.id,
      description: 'The ID of the Internet Gateway',
    });

    new TerraformOutput(this, 'nat-gateway-ids', {
      value: vpcModule.natGateways.map(nat => nat.id),
      description: 'The IDs of the NAT Gateways',
    });

    // S3 Module Outputs
    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description:
        'The name of the S3 bucket created for static website hosting',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: s3Module.bucket.arn,
      description: 'The ARN of the S3 bucket',
    });

    // CloudFront Distribution Outputs
    new TerraformOutput(this, 'cloudfront-distribution-id', {
      value: s3Module.distribution.id,
      description: 'The ID of the CloudFront distribution',
    });

    new TerraformOutput(this, 'cloudfront-distribution-domain-name', {
      value: s3Module.distribution.domainName,
      description: 'The domain name of the CloudFront distribution',
    });

    new TerraformOutput(this, 'cloudfront-distribution-arn', {
      value: s3Module.distribution.arn,
      description: 'The ARN of the CloudFront distribution',
    });

    // IAM Module Outputs
    new TerraformOutput(this, 'iam-role-name', {
      value: iamModule.instanceRole.name,
      description: 'The name of the IAM role created for EC2 instances',
    });

    new TerraformOutput(this, 'iam-role-arn', {
      value: iamModule.instanceRole.arn,
      description: 'The ARN of the IAM role created for EC2 instances',
    });

    new TerraformOutput(this, 'iam-instance-profile-name', {
      value: iamModule.instanceProfile.name,
      description: 'The name of the IAM instance profile',
    });

    // Auto Scaling Module Outputs
    new TerraformOutput(this, 'load-balancer-dns-name', {
      value: autoScalingModule.loadBalancer.dnsName,
      description: 'The DNS name of the Application Load Balancer',
    });

    new TerraformOutput(this, 'load-balancer-arn', {
      value: autoScalingModule.loadBalancer.arn,
      description: 'The ARN of the Application Load Balancer',
    });

    new TerraformOutput(this, 'auto-scaling-group-name', {
      value: autoScalingModule.autoScalingGroup.name,
      description: 'The name of the Auto Scaling Group',
    });

    new TerraformOutput(this, 'auto-scaling-group-arn', {
      value: autoScalingModule.autoScalingGroup.arn,
      description: 'The ARN of the Auto Scaling Group',
    });
  }
}
