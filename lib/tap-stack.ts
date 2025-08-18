import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, Fn } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { TerraformOutput } from 'cdktf';
// Import your custom modules
import {
  VpcModule,
  SecurityGroupModule,
  LaunchTemplateModule,
  AutoScalingGroupModule,
  S3Module,
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
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
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
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // --- Start of Resource Configuration ---
    // Define the resource configuration directly within the stack.
    // These values are either hardcoded or derived from the existing props.
    // This is necessary because we cannot modify the `bin/tap.ts` file to pass a 'config' object.

    const environment: 'dev' | 'qa' | 'prod' = environmentSuffix as
      | 'dev'
      | 'qa'
      | 'prod';
    const project = 'your-project-name'; // Hardcoded project name
    const namePrefix = `${environment}-${project}`;

    const tags = {
      Environment: environment,
      Project: project,
      ...(props?.defaultTags?.tags || {}),
    };

    // Configuration for the modules
    const vpcCidr = '10.0.0.0/16';
    const instanceType = 't2.micro';
    const amiNameFilter = 'amzn2-ami-hvm-*-x86_64-gp2';
    const keyName = 'your-key-pair-name'; // Replace with a valid key pair name
    const minSize = 1;
    const maxSize = 3;
    const desiredCapacity = 1;

    // Find the latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: [amiNameFilter],
        },
      ],
    });

    // VPC Module
    const vpc = new VpcModule(this, 'vpcModule', {
      name: namePrefix,
      environment: environment,
      cidrBlock: vpcCidr,
      tags,
    });

    // Security Group Module for EC2 instances
    const ec2Sg = new SecurityGroupModule(this, 'ec2SecurityGroup', {
      name: `${namePrefix}-ec2`,
      environment: environment,
      vpcId: vpc.vpc.id,
      ingressRules: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egressRules: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    });

    // Launch Template Module
    const launchTemplate = new LaunchTemplateModule(
      this,
      'launchTemplateModule',
      {
        name: namePrefix,
        environment: environment,
        instanceType: instanceType,
        amiId: ami.id,
        keyName: keyName,
        securityGroupIds: [ec2Sg.securityGroup.id],
        userData: Fn.base64encode(
          Fn.rawString(
            `#!/bin/bash
          echo "Hello, World! from EC2" > index.html
          nohup busybox httpd -f -p 80 &`
          )
        ),
      }
    );

    // Auto Scaling Group Module
    new AutoScalingGroupModule(this, 'autoScalingGroupModule', {
      name: namePrefix,
      environment: environment,
      launchTemplateId: launchTemplate.launchTemplate.id,
      subnetIds: [Fn.element(vpc.publicSubnets, 0)],
      minSize: minSize,
      maxSize: maxSize,
      desiredCapacity: desiredCapacity,
      tags,
    });

    // S3 Bucket Module
    new S3Module(this, 's3BucketModule', {
      name: `${namePrefix}-data`,
      environment: environment,
      bucketName: `${namePrefix}-data-${this.node.id}`.toLowerCase(),
      tags,
    });

    // --- Terraform Outputs ---
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.vpc.id,
      description: 'The ID of the main VPC.',
    });
    new TerraformOutput(this, 'public_subnet_ids', {
      value: vpc.publicSubnets,
    });
    new TerraformOutput(this, 'ec2_security_group_id', {
      value: ec2Sg.securityGroup.id,
      description: 'The ID of the EC2 security group.',
    });
  }
}
