import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { Fn, S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import {
  AutoScalingModule,
  S3BucketModule,
  SecurityGroupModule,
  VpcModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'eu-central-1';
    const stateBucketRegion = props?.stateBucketRegion || 'eu-central-1';
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

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    const project = 'tap';
    const env = environmentSuffix as 'dev' | 'qa' | 'prod';

    // 1. Create a multi-AZ VPC.
    const tapVpc = new VpcModule(this, 'tap-vpc', {
      cidrBlock: '10.0.0.0/16',
      env,
      project,
    });

    // 2. Create a Security Group for the web server.
    const webServerSg = new SecurityGroupModule(this, 'web-server-sg', {
      vpcId: tapVpc.vpc.id,
      env,
      project,
      name: 'web-server',
      description: 'Allows HTTP and SSH access',
      ingressRules: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['192.0.1.0/32'],
          ipv6CidrBlocks: ['::/0'],
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['192.0.1.0/32'],
          ipv6CidrBlocks: ['::/0'],
        },
      ],
    });

    const bastionSg = new SecurityGroupModule(this, 'bastion-sg', {
      vpcId: tapVpc.vpc.id,
      env,
      project,
      name: 'bastion',
      description: 'Allows SSH access from a trusted IP',
      ingressRules: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['192.0.2.0/24'],
        },
      ],
    });

    const webAsg = new AutoScalingModule(this, 'web-asg', {
      env,
      project,
      subnetIds: tapVpc.publicSubnets.map(subnet => subnet.id),
      securityGroupIds: [webServerSg.securityGroup.id],
      instanceType: 't2.micro',
      minSize: 1,
      maxSize: 3,
      desiredCapacity: 1,
      userData: Fn.rawString(`#!/bin/bash
                sudo yum update -y
                sudo yum install httpd -y
                sudo systemctl start httpd
                sudo systemctl enable httpd
                echo "<h1>Hello from ${project} ${env}</h1>" > /var/www/html/index.html`),
    });

    // 4. Create a private S3 Bucket for application assets.
    const appBucket = new S3BucketModule(this, 'app-bucket', {
      env,
      project,
      name: 'app-assets',
    });

    new TerraformOutput(this, 'vpc_id', {
      value: tapVpc.vpc.id,
      description: 'The ID of the created VPC',
    });

    new TerraformOutput(this, 'public_subnet_ids', {
      value: tapVpc.publicSubnets.map(subnet => subnet.id),
      description: 'The IDs of the public subnets',
    });

    new TerraformOutput(this, 'web_server_sg_id', {
      value: webServerSg.securityGroup.id,
      description: 'The ID of the web server security group',
    });

    new TerraformOutput(this, 'web_asg_name', {
      value: webAsg.autoScalingGroup.name,
      description: 'The name of the web server Auto Scaling Group',
    });

    new TerraformOutput(this, 'app_bucket_name', {
      value: appBucket.bucket.bucket,
      description: 'The name of the application S3 bucket',
    });

    new TerraformOutput(this, 'bastion_sg_id', {
      value: bastionSg.securityGroup.id,
      description: 'The ID of the bastion host security group',
    });
  }
}
