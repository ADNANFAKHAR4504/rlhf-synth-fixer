import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkModule, SecurityModule, ComputeModule } from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  sshKeyName?: string;
  vpcCidr?: string;
}

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE || props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = {
      Environment: 'Production',
      ...(props?.defaultTags || {}),
    };

    // AWS Provider with version pin
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [defaultTags],
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
      cidrBlock: props?.vpcCidr || '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.3.0/24'],
      privateSubnetCidrs: ['10.0.2.0/24', '10.0.4.0/24'],
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
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
      sshKeyName: props?.sshKeyName || 'my-dev-keypair',
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

    new TerraformOutput(this, 'privateSubnetIds', {
      value: network.privateSubnetIds.join(', '),
      description: 'The IDs of the private subnets.',
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
