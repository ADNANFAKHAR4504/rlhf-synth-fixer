```typescript

import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import {
  VpcModule,
  S3Module,
  IamModule,
  SecurityModule,
  Ec2Module,
} from '../lib/modules';

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

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-west-2';
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

    // 1️⃣ VPC
    const vpc = new VpcModule(this, 'VpcModule', {
      tags: { Environment: environmentSuffix, Owner: 'team-a' },
    });

    // 2️⃣ S3 Bucket
    const s3 = new S3Module(this, 'S3Module', {
      tags: { Environment: environmentSuffix, Owner: 'team-a' },
      versioning: true,
      forceDestroy: true,
    });

    // 3️⃣ IAM Role + Instance Profile
    const iam = new IamModule(this, 'IamModule', {
      tags: { Environment: environmentSuffix, Owner: 'team-a' },
      s3BucketArn: s3.bucketArn,
      s3BucketName: s3.bucketName,
    });

    // 4️⃣ Security Group
    const sec = new SecurityModule(this, 'SecurityModule', {
      vpcId: vpc.vpcId,
      sshCidr: '0.0.0.0/0', // WARNING: open SSH for testing only
      tags: { Environment: environmentSuffix, Owner: 'team-a' },
    });

    // 5️⃣ EC2 Instance
    const ec2 = new Ec2Module(this, 'Ec2Module', {
      subnetId: vpc.publicSubnetId,
      securityGroupIds: [sec.securityGroupId],
      instanceProfileName: iam.instanceProfileName,
      tags: { Environment: environmentSuffix, Owner: 'team-a' },
      instanceType: 't2.micro',
    });

    // ======================
    // Terraform Outputs
    // ======================

    new TerraformOutput(this, 'vpc_id', { value: vpc.vpcId });
    new TerraformOutput(this, 'public_subnet_id', {
      value: vpc.publicSubnetId,
    });

    new TerraformOutput(this, 'bucket_name', { value: s3.bucketName });
    new TerraformOutput(this, 'bucket_arn', { value: s3.bucketArn });

    new TerraformOutput(this, 'iam_role_name', { value: iam.roleName });
    new TerraformOutput(this, 'iam_role_arn', { value: iam.roleArn });
    new TerraformOutput(this, 'instance_profile_name', {
      value: iam.instanceProfileName,
    });

    new TerraformOutput(this, 'security_group_id', {
      value: sec.securityGroupId,
    });
    new TerraformOutput(this, 'security_group_name', {
      value: sec.securityGroupName,
    });

    new TerraformOutput(this, 'ec2_instance_id', { value: ec2.instanceId });
    new TerraformOutput(this, 'ec2_instance_public_ip', {
      value: ec2.instancePublicIp,
    });
  }
}


```