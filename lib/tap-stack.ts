import { Construct } from 'constructs';
import { TerraformStack, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { VpcModule, SecurityGroupModule, LaunchTemplateModule, AutoScalingGroupModule, S3Module } from '../lib/modules';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

interface Config {
  environment: 'dev' | 'qa' | 'prod';
  project: string;
  region: string;
  vpcCidr: string;
  instanceType: string;
  amiNameFilter: string;
  keyName: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: Config) {
    super(scope, id);

    // AWS Provider Configuration
    new AwsProvider(this, 'aws', {
      region: config.region,
    });

    const namePrefix = `${config.environment}-${config.project}`;
    const tags = {
      Environment: config.environment,
      Project: config.project,
    };

    // Find the latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: [config.amiNameFilter],
        },
      ],
    });

    // VPC Module
    const vpc = new VpcModule(this, 'vpcModule', {
      name: namePrefix,
      environment: config.environment,
      cidrBlock: config.vpcCidr,
      tags,
    });

    // Security Group Module for EC2 instances
    const ec2Sg = new SecurityGroupModule(this, 'ec2SecurityGroup', {
      name: `${namePrefix}-ec2`,
      environment: config.environment,
      vpcId: vpc.vpc.id,
      ingressRules: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'], // Be more restrictive in production
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
    const launchTemplate = new LaunchTemplateModule(this, 'launchTemplateModule', {
      name: namePrefix,
      environment: config.environment,
      instanceType: config.instanceType,
      amiId: ami.id,
      keyName: config.keyName,
      securityGroupIds: [ec2Sg.securityGroup.id],
      userData: Fn.base64encode(
        `#!/bin/bash
          echo "Hello, World! from EC2" > index.html
          nohup busybox httpd -f -p 80 &`,
      ),
      tags,
    });

    // Auto Scaling Group Module
    const asg = new AutoScalingGroupModule(this, 'autoScalingGroupModule', {
      name: namePrefix,
      environment: config.environment,
      launchTemplateId: launchTemplate.launchTemplate.id,
      subnetIds: vpc.publicSubnets.map((s) => s.id),
      minSize: config.minSize,
      maxSize: config.maxSize,
      desiredCapacity: config.desiredCapacity,
      tags,
    });

    // S3 Bucket Module
    new S3Module(this, 's3BucketModule', {
      name: `${namePrefix}-data`,
      environment: config.environment,
      bucketName: `${namePrefix}-data-${this.node.id}`.toLowerCase(),
      tags,
    });
  }
}