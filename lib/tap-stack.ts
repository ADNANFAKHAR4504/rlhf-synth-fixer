import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { dataAwsAmi } from '@cdktf/provider-aws';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// FIX: Import the new consolidated VpcModule and the S3BucketModule
import { VpcModule, S3BucketModule } from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
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

    // FIX: Add Environment: Production tag to meet compliance requirements
    const defaultTags = {
      tags: {
        Environment: 'Production',
        ...props?.defaultTags?.tags,
      },
    };

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [defaultTags],
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    const amzLinux2Ami = new dataAwsAmi.DataAwsAmi(this, 'AmzLinux2', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'virtualization-type', values: ['hvm'] },
      ],
    });

    // --- Instantiate Consolidated VPC and EC2 Module ---
    // FIX: Instantiate the single VpcModule as required by the review
    const vpcModule = new VpcModule(this, 'VpcAndCompute', {
      cidrBlock: '10.0.0.0/16',
      ami: amzLinux2Ami.id,
      tags: defaultTags.tags, // Pass tags down to the module
    });

    // --- Instantiate S3 Bucket Module ---
    const s3Module = new S3BucketModule(this, 'S3Bucket', {
      bucketName: `tap-secure-bucket-${this.node.addr}`,
      tags: defaultTags.tags, // Pass tags down to the module
    });

    // --- Outputs ---
    // FIX: Update outputs to reflect the new architecture with multiple subnets
    new TerraformOutput(this, 'VpcId', {
      description: 'ID of the provisioned VPC',
      value: vpcModule.vpc.id,
    });

    new TerraformOutput(this, 'PublicSubnetIds', {
      description: 'IDs of the public subnets',
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
    });

    new TerraformOutput(this, 'PrivateSubnetIds', {
      description: 'IDs of the private subnets',
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
    });

    new TerraformOutput(this, 'S3BucketName', {
      description: 'Name of the secure S3 bucket',
      value: s3Module.bucket.bucket,
    });

    new TerraformOutput(this, 'Ec2InstanceId', {
      description: 'ID of the EC2 instance',
      value: vpcModule.instance.id,
    });
  }
}
