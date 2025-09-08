import { Construct } from 'constructs';
import { TerraformStack, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
// 1. IMPORT THE RDS ENGINE VERSION DATA SOURCE
import { DataAwsRdsEngineVersion } from '@cdktf/provider-aws/lib/data-aws-rds-engine-version';

interface TapStackConfig {
  env: {
    region: string;
  };
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: TapStackConfig) {
    super(scope, id);

    const region = config.env.region;
    const randomSuffix = Fn.substr(Fn.uuid(), 0, 8);

    // 1. AWS Provider and VPC Setup
    new AwsProvider(this, 'aws', { region });

    const vpc = new Vpc(this, 'main-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
    });

    const igw = new InternetGateway(this, 'main-igw', { vpcId: vpc.id });

    // Public Subnets and Routing
    const publicSubnetA = new Subnet(this, 'public-subnet-a', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${region}a`,
      mapPublicIpOnLaunch: true,
    });

    const publicSubnetB = new Subnet(this, 'public-subnet-b', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${region}b`,
      mapPublicIpOnLaunch: true,
    });

    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
    });

    new RouteTableAssociation(this, 'public-rta-a', {
      subnetId: publicSubnetA.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public-rta-b', {
      subnetId: publicSubnetB.id,
      routeTableId: publicRouteTable.id,
    });

    // Private Subnets and Routing with NAT Gateways
    const privateSubnetA = new Subnet(this, 'private-subnet-a', {
      vpcId: vpc.id,
      cidrBlock: '10.0.101.0/24',
      availabilityZone: `${region}a`,
    });

    const privateSubnetB = new Subnet(this, 'private-subnet-b', {
      vpcId: vpc.id,
      cidrBlock: '10.0.102.0/24',
      availabilityZone: `${region}b`,
    });

    const eipA = new Eip(this, 'nat-eip-a', { domain: 'vpc' });
    const natGatewayA = new NatGateway(this, 'nat-gw-a', {
      allocationId: eipA.id,
      subnetId: publicSubnetA.id,
    });
    const privateRouteTableA = new RouteTable(this, 'private-rt-a', {
      vpcId: vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGatewayA.id }],
    });
    new RouteTableAssociation(this, 'private-rta-a', {
      subnetId: privateSubnetA.id,
      routeTableId: privateRouteTableA.id,
    });

    // 2. Security Groups (Web, App, DB)
    const albSg = new SecurityGroup(this, 'alb-sg', {
      name: `alb-sg-${randomSuffix}`,
      vpcId: vpc.id,
      description: 'Allow HTTP/HTTPS traffic to ALB',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
      ],
    });

    const appSg = new SecurityGroup(this, 'app-sg', {
      name: `app-sg-${randomSuffix}`,
      vpcId: vpc.id,
      description: 'Allow traffic from ALB to App',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          securityGroups: [albSg.id],
        },
      ],
      egress: [
        { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
      ],
    });

    const rdsSg = new SecurityGroup(this, 'rds-sg', {
      name: `rds-sg-${randomSuffix}`,
      vpcId: vpc.id,
      description: 'Allow traffic from App to RDS',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 3306,
          toPort: 3306,
          securityGroups: [appSg.id],
        },
      ],
    });

    // 3. CloudWatch Log Group
    const logGroup = new CloudwatchLogGroup(this, 'app-log-group', {
      name: `/app/logs-${randomSuffix}`,
      retentionInDays: 7,
    });

    // 4. IAM Role and Policy for EC2 (Least Privilege)
    const ec2Role = new IamRole(this, 'ec2-role', {
      name: `ec2-role-${randomSuffix}`,
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

    const ec2Policy = new IamPolicy(this, 'ec2-policy', {
      name: `ec2-policy-${randomSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Effect: 'Allow',
            Resource: `${logGroup.arn}:*`,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'ec2-policy-attachment', {
      role: ec2Role.name,
      policyArn: ec2Policy.arn,
    });

    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `ec2-instance-profile-${randomSuffix}`,
        role: ec2Role.name,
      }
    );

    // 5. RDS Database (Multi-AZ with Backups)
    const dbSubnetGroup = new DbSubnetGroup(this, 'rds-subnet-group', {
      name: `rds-subnet-group-${randomSuffix}`,
      subnetIds: [privateSubnetA.id, privateSubnetB.id],
    });

    // 2. LOOK UP THE LATEST MYSQL ENGINE VERSION
    const rdsEngineVersion = new DataAwsRdsEngineVersion(
      this,
      'mysql-version',
      {
        engine: 'mysql',
        latest: true,
      }
    );

    new DbInstance(this, 'rds-instance', {
      identifier: `app-db-${randomSuffix}`,
      allocatedStorage: 20,
      instanceClass: 'db.t3.micro',
      engine: 'mysql',
      // 3. USE THE DYNAMICALLY FOUND VERSION
      engineVersion: rdsEngineVersion.version,
      username: 'adminUser',
      password: 'MustBeChangedInSecretsManager1',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSg.id],
      multiAz: true,
      backupRetentionPeriod: 7, // Enable automated backups
      skipFinalSnapshot: true,
    });

    // 6. ALB, Target Group, and Listener
    const alb = new Lb(this, 'alb', {
      name: `app-lb-${randomSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSg.id],
      subnets: [publicSubnetA.id, publicSubnetB.id],
    });

    const targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `app-tg-${randomSuffix}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpc.id,
      healthCheck: {
        path: '/health',
        protocol: 'HTTP',
      },
    });

    new LbListener(this, 'listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // 7. Launch Template and Auto Scaling Group
    const ami = new DataAwsAmi(this, 'amazon-linux-2', {
      mostRecent: true,
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'virtualization-type', values: ['hvm'] },
      ],
      owners: ['amazon'],
    });

    const launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `app-launch-template-${randomSuffix}`,
      imageId: ami.id,
      instanceType: 't3.micro',
      iamInstanceProfile: { name: instanceProfile.name },
      vpcSecurityGroupIds: [appSg.id],
      // User data can be added here to install CloudWatch agent, etc.
    });

    new AutoscalingGroup(this, 'autoscaling-group', {
      name: `app-asg-${randomSuffix}`,
      launchTemplate: { id: launchTemplate.id, version: '$Latest' },
      minSize: 2,
      maxSize: 5,
      desiredCapacity: 2,
      vpcZoneIdentifier: [privateSubnetA.id, privateSubnetB.id],
      targetGroupArns: [targetGroup.arn],
    });
  }
}
