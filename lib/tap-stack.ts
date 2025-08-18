import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { NetworkingModule } from './modules';
// import { MyStack } from './my-stack';
// Configuration variables - easily modifiable without changing core logic
const CONFIG = {
  region: 'us-east-1',
  vpcCidr: '10.0.0.0/16',
  publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
  privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
  instanceType: 't3.micro', // Free tier eligible
  keyPairName: 'corp-keypair', // Replace with your actual key pair name
};

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
            Environment: environmentSuffix,
            Owner: 'DevOps Team',
            Project: 'RLHF',
            ManagedBy: 'CDKTF',
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
    // Deploy the networking module with all infrastructure
    const networking = new NetworkingModule(this, 'networking', {
      vpcCidr: CONFIG.vpcCidr,
      publicSubnetCidrs: CONFIG.publicSubnetCidrs,
      privateSubnetCidrs: CONFIG.privateSubnetCidrs,
      instanceType: CONFIG.instanceType,
      keyPairName: CONFIG.keyPairName,
    });

    // Output VPC ID for reference by other stacks or external tools
    new TerraformOutput(this, 'vpc-id', {
      value: networking.vpc.id,
      description: 'ID of the main VPC',
    });

    // Output public subnet IDs
    new TerraformOutput(this, 'public-subnet-ids', {
      value: networking.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of the public subnets',
    });

    // Output private subnet IDs
    new TerraformOutput(this, 'private-subnet-ids', {
      value: networking.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
    });

    // Output NAT Gateway ID for monitoring and cost tracking
    new TerraformOutput(this, 'nat-gateway-id', {
      value: networking.natGateway.id,
      description: 'ID of the NAT Gateway',
    });

    // Output public instance IDs
    new TerraformOutput(this, 'public-instance-ids', {
      value: networking.publicInstances.map(instance => instance.id),
      description: 'IDs of the public EC2 instances',
    });

    // Output public instance public IPs for SSH access
    new TerraformOutput(this, 'public-instance-ips', {
      value: networking.publicInstances.map(instance => instance.publicIp),
      description: 'Public IP addresses of the public EC2 instances',
    });

    // Output private instance IDs
    new TerraformOutput(this, 'private-instance-ids', {
      value: networking.privateInstances.map(instance => instance.id),
      description: 'IDs of the private EC2 instances',
    });

    // Output private instance private IPs for internal communication
    new TerraformOutput(this, 'private-instance-ips', {
      value: networking.privateInstances.map(instance => instance.privateIp),
      description: 'Private IP addresses of the private EC2 instances',
    });

    // Output availability zones used
    new TerraformOutput(this, 'availability-zones', {
      value: networking.publicSubnets.map(subnet => subnet.availabilityZone),
      description: 'Availability zones where subnets are deployed',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
