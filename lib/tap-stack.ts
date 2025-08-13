import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { VpcModule, Ec2InstanceModule } from './modules';

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

    const environmentSuffix = props?.environmentSuffix || 'prod';
    const awsRegion = AWS_REGION_OVERRIDE;
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'your-tf-states-bucket-name';
    const defaultTags = props?.defaultTags || { tags: {} };

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

    const vpc = new VpcModule(this, 'VpcInfrastructure');

    const ec2 = new Ec2InstanceModule(this, 'Ec2InstanceInfrastructure', {
      vpcId: vpc.vpc.id,
      subnetId: vpc.publicSubnets[0].id,
    });

    new TerraformOutput(this, 'InstanceId', {
      description: 'ID of the EC2 instance',
      value: ec2.instance.id,
    });

    new TerraformOutput(this, 'InstancePublicIp', {
      description: 'Public IP address of the EC2 instance',
      value: ec2.instance.publicIp,
    });

    new TerraformOutput(this, 'ApplicationURL', {
      description: 'URL to access the web application',
      value: `http://${ec2.instance.publicIp}`,
    });

    new TerraformOutput(this, 'KmsKeyArn', {
      description: 'ARN of the KMS key for EBS encryption',
      value: ec2.kmsKey.arn,
    });

    new TerraformOutput(this, 'VpcId', {
      description: 'ID of the provisioned VPC',
      value: vpc.vpc.id,
    });

    // ADDED: Output for the EC2 security group ID
    new TerraformOutput(this, 'Ec2SecurityGroupId', {
      description: 'ID of the EC2 instance security group',
      value: ec2.ec2Sg.id,
    });
  }
}
