import { Construct } from 'constructs';
import { Fn } from 'cdktf';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';

const availabilityZones = ['us-west-2a', 'us-west-2b'];

// =============================================================================
// Networking Module
// =============================================================================
export interface NetworkModuleProps {
  vpcCidr: string;
  projectName: string;
}

export class NetworkModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[] = [];
  public readonly privateSubnets: Subnet[] = [];

  constructor(scope: Construct, id: string, props: NetworkModuleProps) {
    super(scope, id);

    this.vpc = new Vpc(this, 'Vpc', {
      cidrBlock: props.vpcCidr,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { Name: `${props.projectName}-vpc` },
    });

    const igw = new InternetGateway(this, 'Igw', {
      vpcId: this.vpc.id,
      tags: { Name: `${props.projectName}-igw` },
    });

    const publicRouteTable = new RouteTable(this, 'PublicRT', {
      vpcId: this.vpc.id,
      tags: { Name: `${props.projectName}-public-rt` },
    });

    new Route(this, 'PublicRouteToIgw', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    availabilityZones.forEach((az, i) => {
      const publicSubnet = new Subnet(this, `PublicSubnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: { Name: `${props.projectName}-public-${az}` },
      });
      this.publicSubnets.push(publicSubnet);

      new RouteTableAssociation(this, `PublicRTA-${i}`, {
        subnetId: publicSubnet.id,
        routeTableId: publicRouteTable.id,
      });

      const privateSubnet = new Subnet(this, `PrivateSubnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2 + 1}.0/24`,
        availabilityZone: az,
        tags: { Name: `${props.projectName}-private-${az}` },
      });
      this.privateSubnets.push(privateSubnet);

      const eip = new Eip(this, `NatEip-${i}`, {
        domain: 'vpc',
        tags: { Name: `${props.projectName}-nateip-${az}` },
      });

      const natGw = new NatGateway(this, `NatGateway-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: { Name: `${props.projectName}-natgw-${az}` },
      });

      const privateRouteTable = new RouteTable(this, `PrivateRT-${i}`, {
        vpcId: this.vpc.id,
        tags: { Name: `${props.projectName}-private-rt-${az}` },
      });

      new Route(this, `PrivateRouteToNat-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGw.id,
      });

      new RouteTableAssociation(this, `PrivateRTA-${i}`, {
        subnetId: privateSubnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
  }
}

// =============================================================================
// Security Module
// =============================================================================
export interface SecurityModuleProps {
  vpcId: string;
  projectName: string;
}

export class SecurityModule extends Construct {
  public readonly albSg: SecurityGroup;
  public readonly ec2Sg: SecurityGroup;
  public readonly kmsKey: KmsKey;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, props: SecurityModuleProps) {
    super(scope, id);

    this.kmsKey = new KmsKey(this, 'EbsKmsKey', {
      description: `KMS key for ${props.projectName} EBS volumes`,
      enableKeyRotation: true,
      tags: { Name: `${props.projectName}-ebs-key` },
    });

    this.albSg = new SecurityGroup(this, 'AlbSG', {
      name: `${props.projectName}-alb-sg`,
      vpcId: props.vpcId,
      description: 'Allow web traffic to ALB',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP',
        },
      ],
      tags: { Name: `${props.projectName}-alb-sg` },
    });

    this.ec2Sg = new SecurityGroup(this, 'Ec2SG', {
      name: `${props.projectName}-ec2-sg`,
      vpcId: props.vpcId,
      description: 'Allow traffic from ALB and outbound for updates',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          securityGroups: [this.albSg.id],
          description: 'Allow inbound from ALB',
        },
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: { Name: `${props.projectName}-ec2-sg` },
    });

    new SecurityGroupRule(this, 'AlbEgressToEc2', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      securityGroupId: this.albSg.id,
      sourceSecurityGroupId: this.ec2Sg.id,
    });

    const ec2Role = new IamRole(this, 'Ec2Role', {
      name: `${props.projectName}-ec2-role`,
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

    this.instanceProfile = new IamInstanceProfile(this, 'Ec2InstanceProfile', {
      name: `${props.projectName}-ec2-profile`,
      role: ec2Role.name,
    });
  }
}

// =============================================================================
// Compute Module
// =============================================================================
export interface ComputeModuleProps {
  vpcId: string;
  privateSubnets: Subnet[];
  publicSubnets: Subnet[];
  ec2Sg: SecurityGroup;
  albSg: SecurityGroup;
  instanceProfile: IamInstanceProfile;
  kmsKey: KmsKey;
  projectName: string;
}

export class ComputeModule extends Construct {
  public readonly alb: Lb;

  constructor(scope: Construct, id: string, props: ComputeModuleProps) {
    super(scope, id);

    this.alb = new Lb(this, 'AppALB', {
      name: `${props.projectName}-alb`,
      loadBalancerType: 'application',
      internal: false,
      securityGroups: [props.albSg.id],
      subnets: props.publicSubnets.map(s => s.id),
    });

    const targetGroup = new LbTargetGroup(this, 'AppTG', {
      name: `${props.projectName}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpcId,
    });

    new LbListener(this, 'HttpListener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    const ami = new DataAwsAmi(this, 'AmazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [{ name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] }],
    });

    const launchTemplate = new LaunchTemplate(this, 'WebLT', {
      namePrefix: `${props.projectName}-lt-`,
      imageId: ami.id,
      instanceType: 't3.micro',
      vpcSecurityGroupIds: [props.ec2Sg.id],
      iamInstanceProfile: { name: props.instanceProfile.name },
      blockDeviceMappings: [
        {
          deviceName: '/dev/xvda',
          ebs: {
            volumeSize: 8,
            volumeType: 'gp3',
            encrypted: 'true',
            kmsKeyId: props.kmsKey.arn,
          },
        },
      ],
      userData: Fn.base64encode(`#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo '<h1>Deployed via CDKTF</h1>' > /var/www/html/index.html`),
    });

    new AutoscalingGroup(this, 'WebASG', {
      name: `${props.projectName}-asg`,
      desiredCapacity: 2,
      maxSize: 4,
      minSize: 2,
      vpcZoneIdentifier: props.privateSubnets.map(s => s.id),
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      targetGroupArns: [targetGroup.arn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
    });
  }
}
