import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { VpcModule } from './modules';
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

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Environment: 'Production',
            Repository: 'iac-test-automations',
            CommitAuthor: 'tushar-turing8',
            ManagedBy: 'Terraform-CDKTF',
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

    // Instantiate the VPC Module
    const network = new VpcModule(this, 'ProductionVpc', {
      vpcCidr: '10.0.0.0/16',
      availabilityZones: ['us-west-2a', 'us-west-2b'],
    });

    // Essential Outputs
    new TerraformOutput(this, 'vpc_id', {
      value: network.vpcId,
      description: 'The ID of the main VPC.',
    });

    new TerraformOutput(this, 'public_subnet_id', {
      value: network.publicSubnetId,
      description: 'The ID of the public subnet.',
    });

    new TerraformOutput(this, 'private_subnet_id', {
      value: network.privateSubnetId,
      description: 'The ID of the private subnet (with NAT Gateway access).',
    });

    new TerraformOutput(this, 'availability_zones_used', {
      value: [network.publicAz, network.privateAz],
      description: 'The availability zones used for the subnets.',
    });
  }
}
