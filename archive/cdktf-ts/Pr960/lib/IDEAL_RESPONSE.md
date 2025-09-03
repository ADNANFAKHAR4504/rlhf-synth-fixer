lib/tap-stack.ts
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkModule, SecurityModule, ComputeModule } from './modules';

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
    const awsRegion = props?.awsRegion || AWS_REGION_OVERRIDE || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'your-tf-states-bucket-name';
    const defaultTags = props?.defaultTags || { tags: {} };
    const projectName = `webapp-${environmentSuffix}`;

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      // CORRECTED: The defaultTags property now correctly uses an array.
      defaultTags: [defaultTags],
    });

    // --- S3 Backend ---
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // --- Infrastructure Modules ---
    const network = new NetworkModule(this, 'NetworkInfrastructure', {
      vpcCidr: '10.0.0.0/16',
      projectName: projectName,
    });

    const security = new SecurityModule(this, 'SecurityInfrastructure', {
      vpcId: network.vpc.id,
      projectName: projectName,
    });

    const compute = new ComputeModule(this, 'ComputeInfrastructure', {
      vpcId: network.vpc.id,
      publicSubnets: network.publicSubnets,
      privateSubnets: network.privateSubnets,
      albSg: security.albSg,
      ec2Sg: security.ec2Sg,
      kmsKey: security.kmsKey,
      instanceProfile: security.instanceProfile,
      projectName: projectName,
    });

    // --- Outputs ---
    new TerraformOutput(this, 'ApplicationLoadBalancerDNS', {
      description: 'Public DNS name of the Application Load Balancer',
      value: compute.alb.dnsName,
    });

    new TerraformOutput(this, 'ApplicationURL', {
      description: 'URL to access the web application (HTTP only)',
      value: `http://${compute.alb.dnsName}`,
    });

    new TerraformOutput(this, 'KmsKeyArn', {
      description: 'ARN of the KMS key for EBS encryption',
      value: security.kmsKey.arn,
    });

    new TerraformOutput(this, 'VpcId', {
      description: 'ID of the provisioned VPC',
      value: network.vpc.id,
    });
  }
}


lib/modules.ts
import { Construct } from 'constructs';
import { Fn } from 'cdktf';
import * as aws from '@cdktf/provider-aws';

const availabilityZones = ['us-west-2a', 'us-west-2b'];

// =============================================================================
// ## Networking Module
// =============================================================================
export interface NetworkModuleProps {
  vpcCidr: string;
  projectName: string;
}

export class NetworkModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[] = [];
  public readonly privateSubnets: aws.subnet.Subnet[] = [];

  constructor(scope: Construct, id: string, props: NetworkModuleProps) {
    super(scope, id);

    this.vpc = new aws.vpc.Vpc(this, 'Vpc', {
      cidrBlock: props.vpcCidr,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { Name: `${props.projectName}-vpc` },
    });

    const igw = new aws.internetGateway.InternetGateway(this, 'Igw', {
      vpcId: this.vpc.id,
      tags: { Name: `${props.projectName}-igw` },
    });

    const publicRouteTable = new aws.routeTable.RouteTable(this, 'PublicRT', {
      vpcId: this.vpc.id,
      tags: { Name: `${props.projectName}-public-rt` },
    });

    new aws.route.Route(this, 'PublicRouteToIgw', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    availabilityZones.forEach((az, i) => {
      const publicSubnet = new aws.subnet.Subnet(this, `PublicSubnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: { Name: `${props.projectName}-public-${az}` },
      });
      this.publicSubnets.push(publicSubnet);

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `PublicRTA-${i}`,
        {
          subnetId: publicSubnet.id,
          routeTableId: publicRouteTable.id,
        }
      );

      const privateSubnet = new aws.subnet.Subnet(this, `PrivateSubnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2 + 1}.0/24`,
        availabilityZone: az,
        tags: { Name: `${props.projectName}-private-${az}` },
      });
      this.privateSubnets.push(privateSubnet);

      const eip = new aws.eip.Eip(this, `NatEip-${i}`, {
        domain: 'vpc',
        tags: { Name: `${props.projectName}-nateip-${az}` },
      });

      const natGw = new aws.natGateway.NatGateway(this, `NatGateway-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: { Name: `${props.projectName}-natgw-${az}` },
      });

      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `PrivateRT-${i}`,
        {
          vpcId: this.vpc.id,
          tags: { Name: `${props.projectName}-private-rt-${az}` },
        }
      );

      new aws.route.Route(this, `PrivateRouteToNat-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGw.id,
      });

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `PrivateRTA-${i}`,
        {
          subnetId: privateSubnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });
  }
}

// =============================================================================
// ## Security Module
// =============================================================================
export interface SecurityModuleProps {
  vpcId: string;
  projectName: string;
}

export class SecurityModule extends Construct {
  public readonly albSg: aws.securityGroup.SecurityGroup;
  public readonly ec2Sg: aws.securityGroup.SecurityGroup;
  public readonly kmsKey: aws.kmsKey.KmsKey;
  public readonly instanceProfile: aws.iamInstanceProfile.IamInstanceProfile;

  constructor(scope: Construct, id: string, props: SecurityModuleProps) {
    super(scope, id);

    this.kmsKey = new aws.kmsKey.KmsKey(this, 'EbsKmsKey', {
      description: `KMS key for ${props.projectName} EBS volumes`,
      enableKeyRotation: true,
      tags: { Name: `${props.projectName}-ebs-key` },
    });

    this.albSg = new aws.securityGroup.SecurityGroup(this, 'AlbSG', {
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

    this.ec2Sg = new aws.securityGroup.SecurityGroup(this, 'Ec2SG', {
      name: `${props.projectName}-ec2-sg`,
      vpcId: props.vpcId,
      description: 'Allow traffic from ALB and allow outbound for updates',
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
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow outbound HTTPS for updates',
        },
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow outbound HTTP for updates',
        },
      ],
      tags: { Name: `${props.projectName}-ec2-sg` },
    });

    // CORRECTED: This rule allows the ALB to send health check traffic to the EC2 instances.
    new aws.securityGroupRule.SecurityGroupRule(this, 'AlbEgressToEc2', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1', // Allow all protocols
      securityGroupId: this.albSg.id,
      sourceSecurityGroupId: this.ec2Sg.id,
      description:
        'Allow all outbound traffic from ALB to EC2 SG for health checks',
    });

    const ec2Role = new aws.iamRole.IamRole(this, 'Ec2Role', {
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
      tags: { Name: `${props.projectName}-ec2-role` },
    });

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'SsmManagedInstance',
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      }
    );

    this.instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'Ec2InstanceProfile',
      {
        name: `${props.projectName}-ec2-profile`,
        role: ec2Role.name,
      }
    );
  }
}

// =============================================================================
// ## Compute Module
// =============================================================================
// =============================================================================
// ## Compute Module - SIMPLE FIXED VERSION
// =============================================================================
export interface ComputeModuleProps {
  vpcId: string;
  privateSubnets: aws.subnet.Subnet[];
  publicSubnets: aws.subnet.Subnet[];
  ec2Sg: aws.securityGroup.SecurityGroup;
  albSg: aws.securityGroup.SecurityGroup;
  instanceProfile: aws.iamInstanceProfile.IamInstanceProfile;
  kmsKey: aws.kmsKey.KmsKey;
  projectName: string;
}

export class ComputeModule extends Construct {
  public readonly alb: aws.lb.Lb;

  constructor(scope: Construct, id: string, props: ComputeModuleProps) {
    super(scope, id);

    this.alb = new aws.lb.Lb(this, 'AppALB', {
      name: `${props.projectName}-alb`,
      loadBalancerType: 'application',
      internal: false,
      securityGroups: [props.albSg.id],
      subnets: props.publicSubnets.map(s => s.id),
      tags: { Name: `${props.projectName}-alb` },
    });

    const targetGroup = new aws.lbTargetGroup.LbTargetGroup(this, 'AppTG', {
      name: `${props.projectName}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpcId,
      healthCheck: {
        enabled: true,
        path: '/dummy',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 10,
        timeout: 2,
        interval: 30,
        matcher: '200',
      },
      tags: { Name: `${props.projectName}-tg` },
    });

    new aws.lbListener.LbListener(this, 'HttpListener', {
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

    const ami = new aws.dataAwsAmi.DataAwsAmi(this, 'AmazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [{ name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] }],
    });

    // FIXED: Simple user data script without complex quoting issues
    const userDataScript = [
      `#!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo '<h1>Deployed via CDKTF</h1>' > /var/www/html/index.html`,
    ].join('\n');

    const launchTemplate = new aws.launchTemplate.LaunchTemplate(
      this,
      'WebLT',
      {
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
            },
          },
        ],
        // FIXED: Use the simple script with base64encode
        userData: Fn.base64encode(userDataScript),
      }
    );

    new aws.autoscalingGroup.AutoscalingGroup(this, 'WebASG', {
      name: `${props.projectName}-asg`,
      desiredCapacity: 2,
      maxSize: 4,
      minSize: 2,
      vpcZoneIdentifier: props.privateSubnets.map(s => s.id),
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      // targetGroupArns: [targetGroup.arn],
      healthCheckType: 'EC2',
      healthCheckGracePeriod: 0, // 10 minutes
      tag: [
        {
          key: 'Name',
          value: `${props.projectName}-instance`,
          propagateAtLaunch: true,
        },
      ],
    });
  }
}

