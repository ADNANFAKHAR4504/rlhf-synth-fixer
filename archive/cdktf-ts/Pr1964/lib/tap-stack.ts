import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// Import your stacks here
import {
  NetworkingModule,
  SecurityModule,
  StorageModule,
  ComputeModule,
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

const AWS_REGION_OVERRIDE = 'us-west-1';

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

    const projectName = `tap-${environmentSuffix}`;

    // Create Networking Module
    const networkingModule = new NetworkingModule(this, 'networking', {
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
      projectName: projectName,
    });

    // Create Security Module
    const securityModule = new SecurityModule(this, 'security', {
      vpcId: networkingModule.vpc.id,
      projectName: projectName,
    });

    // Create Storage Module
    const storageModule = new StorageModule(this, 'storage', {
      projectName: projectName,
    });

    // Create Compute Module
    const computeModule = new ComputeModule(this, 'compute', {
      subnetId: networkingModule.publicSubnets[0].id, // Deploy in first public subnet
      securityGroupIds: [securityModule.ec2SecurityGroup.id],
      s3BucketArn: storageModule.s3Bucket.arn,
      projectName: projectName,
    });

    // Terraform Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: networkingModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: networkingModule.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: networkingModule.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'internet-gateway-id', {
      value: networkingModule.internetGateway.id,
      description: 'Internet Gateway ID',
    });

    new TerraformOutput(this, 'nat-gateway-id', {
      value: networkingModule.natGateway.id,
      description: 'NAT Gateway ID',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: computeModule.ec2Instance.id,
      description: 'EC2 instance ID',
    });

    new TerraformOutput(this, 'ec2-public-ip', {
      value: computeModule.ec2Instance.publicIp,
      description: 'EC2 instance public IP address',
    });

    new TerraformOutput(this, 'ec2-private-ip', {
      value: computeModule.ec2Instance.privateIp,
      description: 'EC2 instance private IP address',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: storageModule.s3Bucket.bucket,
      description: 'S3 bucket name for application data',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: storageModule.s3Bucket.arn,
      description: 'S3 bucket ARN',
    });

    new TerraformOutput(this, 'ec2-security-group-id', {
      value: securityModule.ec2SecurityGroup.id,
      description: 'EC2 Security Group ID',
    });

    new TerraformOutput(this, 'ec2-iam-role-arn', {
      value: computeModule.iamRole.arn,
      description: 'EC2 IAM Role ARN',
    });
  }
}
