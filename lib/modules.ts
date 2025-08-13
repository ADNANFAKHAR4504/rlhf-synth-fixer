import { Construct } from 'constructs';
import { Fn } from 'cdktf';

// AWS VPC-related resources
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';

// AWS EC2 and networking
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

// AWS IAM
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

// AWS KMS
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';

// =============================================================================
// ## VpcModule
// Creates the foundational VPC and public subnets.
// =============================================================================
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[] = [];

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.vpc = new Vpc(this, 'Vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { Name: 'prod-vpc' },
    });

    const igw = new InternetGateway(this, 'Igw', {
      vpcId: this.vpc.id,
      tags: { Name: 'prod-igw' },
    });

    const publicRouteTable = new RouteTable(this, 'PublicRT', {
      vpcId: this.vpc.id,
      tags: { Name: 'prod-public-rt' },
    });

    new Route(this, 'PublicRouteToIgw', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    const availabilityZones = ['us-west-2a', 'us-west-2b'];
    availabilityZones.forEach((az, i) => {
      const publicSubnet = new Subnet(this, `PublicSubnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: { Name: `prod-public-${az}` },
      });
      this.publicSubnets.push(publicSubnet);

      new RouteTableAssociation(this, `PublicRTA-${i}`, {
        subnetId: publicSubnet.id,
        routeTableId: publicRouteTable.id,
      });
    });
  }
}

// =============================================================================
// ## Ec2InstanceModule
// Creates a single EC2 instance with its security group, IAM role, and KMS key.
// =============================================================================
export interface Ec2InstanceModuleProps {
  vpcId: string;
  subnetId: string;
}

export class Ec2InstanceModule extends Construct {
  public readonly instance: Instance;
  public readonly kmsKey: KmsKey;
  // ADDED: Expose the security group for testing
  public readonly ec2Sg: SecurityGroup;

  constructor(scope: Construct, id: string, props: Ec2InstanceModuleProps) {
    super(scope, id);

    this.kmsKey = new KmsKey(this, 'EbsKmsKey', {
      description: 'KMS key for EC2 EBS volume encryption',
      enableKeyRotation: true,
    });

    this.ec2Sg = new SecurityGroup(this, 'Ec2Sg', {
      name: 'prod-ec2-sg',
      vpcId: props.vpcId,
      description: 'Allow HTTP and SSH access',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP inbound',
        },
        {
          protocol: 'tcp',
          fromPort: 22,
          toPort: 22,
          cidrBlocks: ['206.84.231.196/32'],
          description: 'Allow SSH',
        },
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound',
        },
      ],
      tags: { Name: 'prod-ec2-sg' },
    });

    const ec2Role = new IamRole(this, 'Ec2Role', {
      name: 'prod-ec2-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'SsmManagedInstance', {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    const instanceProfile = new IamInstanceProfile(this, 'Ec2InstanceProfile', {
      name: 'prod-ec2-profile',
      role: ec2Role.name,
    });

    const ami = new DataAwsAmi(this, 'AmazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [{ name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] }],
    });

    this.instance = new Instance(this, 'WebServer', {
      ami: ami.id,
      instanceType: 't2.micro',
      subnetId: props.subnetId,
      vpcSecurityGroupIds: [this.ec2Sg.id],
      iamInstanceProfile: instanceProfile.name,
      associatePublicIpAddress: true,
      rootBlockDevice: {
        volumeSize: 8,
        volumeType: 'gp3',
        encrypted: true,
        kmsKeyId: this.kmsKey.arn,
      },
      userData: Fn.base64encode(`#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo '<h1>Hello from EC2!</h1>' > /var/www/html/index.html`),
      tags: { Name: 'prod-web-server' },
    });
  }
}
