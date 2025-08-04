import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import {
  Ipv6OnlyVpc,
  Ipv6OnlySubnet,
  Ipv6OnlySecurityGroup,
  Ec2Iam,
  Ipv6OnlyEc2Instance,
} from './modules';

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
    const commonTags = {
      Environment: 'dev',
      Project: 'IPv6-IoT',
      Cloud: 'AWS',
    };
    // Create the IPv6-only VPC and related components
    const ipv6VpcModule = new Ipv6OnlyVpc(this, 'ipv6-vpc', {
      name: 'tap-ipv6',
      tags: commonTags,
    });

    // Create a public subnet with a slice of the VPC's IPv6 CIDR
    const publicSubnetModule = new Ipv6OnlySubnet(this, 'public-subnet', {
      name: 'tap-public',
      vpcId: ipv6VpcModule.vpc.id,
      ipv6CidrBlock: Fn.cidrsubnet(ipv6VpcModule.vpc.ipv6CidrBlock, 8, 1),
      publicRouteTableId: ipv6VpcModule.publicRouteTable.id, // Corrected: Pass the route table ID
      tags: commonTags,
    });

    // Create a Security Group for the EC2 instance
    const ec2SgModule = new Ipv6OnlySecurityGroup(this, 'ec2-sg', {
      name: 'tap-ec2',
      vpcId: ipv6VpcModule.vpc.id,
      tags: commonTags,
    });

    // Create an IAM Role and Instance Profile for the EC2 instance
    const ec2IamModule = new Ec2Iam(this, 'ec2-iam', {
      name: 'tap-ec2',
      tags: commonTags,
    });

    // Get an Amazon Linux 2 AMI that supports IPv6
    const ami = new DataAwsAmi(this, 'ami', {
      owners: ['amazon'],
      mostRecent: true,
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'virtualization-type', values: ['hvm'] },
      ],
    });

    // User data script for a simple IPv6-only web server
    const userData = `#!/bin/bash
      yum update -y
      yum install -y httpd
      echo "<h1>Hello from IPv6-only EC2 instance!</h1>" > /var/www/html/index.html
      service httpd start
      chkconfig httpd on`;

    // Create the IPv6-only EC2 instance
    const ec2InstanceModule = new Ipv6OnlyEc2Instance(this, 'iot-app', {
      name: 'tap-iot-app',
      instanceType: 't3.micro',
      ami: ami.id,
      subnetId: publicSubnetModule.subnet.id,
      securityGroupId: ec2SgModule.securityGroup.id,
      instanceProfileName: ec2IamModule.instanceProfile.name,
      userData: userData,
      tags: commonTags,
    });

    // Define the required stack outputs
    new TerraformOutput(this, 'vpc-id', {
      value: ipv6VpcModule.vpc.id,
      description: 'The ID of the IPv6-only VPC',
    });

    new TerraformOutput(this, 'public-subnet-id', {
      value: publicSubnetModule.subnet.id,
      description: 'The ID of the public IPv6 subnet',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: ec2InstanceModule.instance.id,
      description: 'The ID of the EC2 instance',
    });

    new TerraformOutput(this, 'ec2-ipv6-address', {
      value: ec2InstanceModule.instance.ipv6Addresses[0],
      description: 'The public IPv6 address of the EC2 instance',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
