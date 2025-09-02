import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { VpcModule, IamModule, Ec2AsgModule } from '../lib/modules';
import { TerraformOutput } from 'cdktf';
// ? Import your stacks here
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
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Common configuration
    const namePrefix = 'MyApp';
    const projectTags = {
      Project: 'MyApp',
    };

    // Create VPC with public and private subnets across 3 AZs
    const vpcModule = new VpcModule(this, 'vpc', {
      name: namePrefix,
      cidrBlock: '10.0.0.0/16',
      tags: projectTags,
    });

    // Create IAM roles and instance profile
    const iamModule = new IamModule(this, 'iam', {
      name: namePrefix,
      tags: projectTags,
    });

    // Create EC2 instances with Auto Scaling
    const ec2AsgModule = new Ec2AsgModule(this, 'ec2-asg', {
      name: namePrefix,
      vpcId: vpcModule.outputs.vpc.id,
      privateSubnetIds: vpcModule.outputs.privateSubnets.map(
        subnet => subnet.id
      ),
      instanceProfile: iamModule.outputs.instanceProfile,
      tags: projectTags,
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
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // VPC Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.outputs.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.outputs.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of the public subnets',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.outputs.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
    });

    // IAM Outputs
    new TerraformOutput(this, 'instance-profile-name', {
      value: iamModule.outputs.instanceProfile.name,
      description: 'Name of the EC2 Instance Profile',
    });

    new TerraformOutput(this, 'iam-role-name', {
      value: iamModule.outputs.role.name,
      description: 'Name of the IAM Role',
    });

    // EC2 Auto Scaling Outputs
    new TerraformOutput(this, 'auto-scaling-group-name', {
      value: ec2AsgModule.outputs.autoScalingGroup.name,
      description: 'Name of the Auto Scaling Group',
    });

    new TerraformOutput(this, 'launch-template-id', {
      value: ec2AsgModule.outputs.launchTemplate.id,
      description: 'ID of the Launch Template',
    });

    new TerraformOutput(this, 'ec2-security-group-id', {
      value: ec2AsgModule.outputs.securityGroup.id,
      description: 'ID of the EC2 Security Group',
    });

    // Internet Gateway Output
    new TerraformOutput(this, 'internet-gateway-id', {
      value: vpcModule.outputs.internetGateway.id,
      description: 'ID of the Internet Gateway',
    });

    // NAT Gateway Output
    new TerraformOutput(this, 'nat-gateway-id', {
      value: vpcModule.outputs.natGateway.id,
      description: 'ID of the NAT Gateway',
    });
  }
}
