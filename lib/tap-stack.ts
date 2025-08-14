import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// Import your modules
import { NetworkModule, SecurityModule, ComputeModule } from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  sshKeyName?: string; // Required for EC2
}

const AWS_REGION_OVERRIDE = 'us-west-2';

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

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // --- Network Module ---
    const network = new NetworkModule(this, 'NetworkModule', {
      cidrBlock: '10.0.0.0/16',
      publicSubnetCidr: '10.0.1.0/24',
      privateSubnetCidr: '10.0.2.0/24',
      availabilityZone: `${awsRegion}a`,
    });

    // --- Security Module ---
    const security = new SecurityModule(this, 'SecurityModule', {
      vpcId: network.vpcId,
    });

    // --- Compute Module ---
    const compute = new ComputeModule(this, 'ComputeModule', {
      vpcId: network.vpcId,
      publicSubnetIds: network.publicSubnetIds,
      securityGroupId: security.securityGroupId,
      sshKeyName: props?.sshKeyName || 'my-dev-keypair', // Replace with your actual key
    });

    // --- Outputs ---
    new TerraformOutput(this, 'vpcId', {
      value: network.vpcId,
      description: 'The ID of the main VPC.',
    });

    new TerraformOutput(this, 'publicSubnetIds', {
      value: network.publicSubnetIds.join(', '),
      description: 'The IDs of the public subnets.',
    });

    new TerraformOutput(this, 'privateSubnetId', {
      value: network.privateSubnetId,
      description: 'The ID of the private subnet.',
    });

    new TerraformOutput(this, 'securityGroupId', {
      value: security.securityGroupId,
      description: 'The ID of the EC2 Security Group.',
    });

    new TerraformOutput(this, 'instanceId', {
      value: compute.instanceId,
      description: 'The ID of the created EC2 instance.',
    });
  }
}
