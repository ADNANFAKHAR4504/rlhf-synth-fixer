import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { dataAwsAmi } from '@cdktf/provider-aws';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { VpcModule, S3BucketModule, Ec2InstanceModule } from './modules';

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

    // --- Data Source for latest Amazon Linux 2 AMI ---
    const amzLinux2Ami = new dataAwsAmi.DataAwsAmi(this, 'AmzLinux2', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // --- Instantiate VPC Module ---
    const vpcModule = new VpcModule(this, 'Vpc', {
      cidrBlock: '10.0.0.0/16',
      publicSubnetCidr: '10.0.1.0/24',
      privateSubnetCidr: '10.0.2.0/24',
      availabilityZone: 'us-west-2a',
    });

    // --- Instantiate S3 Bucket Module ---
    const s3Module = new S3BucketModule(this, 'S3Bucket', {
      bucketName: `tap-secure-bucket-${this.node.addr}`,
    });

    // --- Instantiate EC2 Instance Module ---
    const ec2Module = new Ec2InstanceModule(this, 'Ec2Instance', {
      subnetId: vpcModule.privateSubnet.id,
      ami: amzLinux2Ami.id,
      vpcId: vpcModule.vpc.id, // Pass the correct VPC ID to the module
    });

    // --- Outputs ---
    new TerraformOutput(this, 'VpcId', {
      description: 'ID of the provisioned VPC',
      value: vpcModule.vpc.id,
    });

    new TerraformOutput(this, 'PublicSubnetId', {
      description: 'ID of the public subnet',
      value: vpcModule.publicSubnet.id,
    });

    new TerraformOutput(this, 'PrivateSubnetId', {
      description: 'ID of the private subnet',
      value: vpcModule.privateSubnet.id,
    });

    new TerraformOutput(this, 'S3BucketName', {
      description: 'Name of the secure S3 bucket',
      value: s3Module.bucket.bucket,
    });

    new TerraformOutput(this, 'Ec2InstanceId', {
      description: 'ID of the EC2 instance',
      value: ec2Module.instance.id,
    });
  }
}
