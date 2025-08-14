import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// Import your modules here
import { VpcModule, Ec2Module } from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  sshKeyName?: string; // Required for EC2
}

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

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // --- VPC Module ---
    const vpcModule = new VpcModule(this, 'VpcModule');

    // --- EC2 Module ---
    const ec2Module = new Ec2Module(this, 'Ec2Module', {
      vpcId: vpcModule.vpcId,
      publicSubnetIds: vpcModule.publicSubnetIds,
      sshKeyName: props?.sshKeyName || 'your-dev-key', // Replace with actual key name
    });

    // --- Stack Outputs (as required by prompt) ---
    new TerraformOutput(this, 'vpcId', {
      value: vpcModule.vpcId,
      description: 'The ID of the main VPC.',
    });

    new TerraformOutput(this, 'publicSubnetIds', {
      value: vpcModule.publicSubnetIds.join(', '),
      description: 'The IDs of the public subnets.',
    });

    new TerraformOutput(this, 'privateSubnetId', {
      value: vpcModule.privateSubnetId,
      description: 'The ID of the private subnet.',
    });

    new TerraformOutput(this, 'ec2SecurityGroupId', {
      value: ec2Module.securityGroupId,
      description: 'The ID of the EC2 Security Group.',
    });
  }
}
