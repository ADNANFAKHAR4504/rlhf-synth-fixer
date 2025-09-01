import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { VpcModule, Ec2Module } from './modules';

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

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // Create VPC module
    const vpcModule = new VpcModule(this, 'vpc-module', {
      name: `tap-${environmentSuffix}`,
      cidrBlock: '10.0.0.0/24',
      tags: {
        Environment: environmentSuffix,
      },
    });

    // Create EC2 module
    const ec2Module = new Ec2Module(this, 'ec2-module', {
      instanceType: 't3.micro',
      ami: 'ami-0e95a5e2743ec9ec9', // Amazon Linux 2 AMI (adjust based on your region)
      subnetId: vpcModule.subnetId,
      name: `tap-${environmentSuffix}`,
      tags: {
        Environment: environmentSuffix,
      },
    });

    // Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'subnet-id', {
      value: vpcModule.subnet.id,
      description: 'Subnet ID',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: ec2Module.instance.id,
      description: 'EC2 instance ID',
    });

    new TerraformOutput(this, 'ec2-private-ip', {
      value: ec2Module.instance.privateIp,
      description: 'EC2 instance private IP address',
    });

    new TerraformOutput(this, 'ec2-public-ip', {
      value: ec2Module.instance.publicIp,
      description: 'EC2 instance public IP address',
    });
  }
}
