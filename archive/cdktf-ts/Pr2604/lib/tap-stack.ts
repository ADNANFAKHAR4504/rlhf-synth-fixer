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
import { AutoscalingPolicy } from '@cdktf/provider-aws/lib/autoscaling-policy';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
// 1. IMPORT S3BucketPolicy and DataAwsCallerIdentity
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

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
    const availabilityZones = [`${region}a`, `${region}b`];

    // AWS Provider and Global Tagging
    new AwsProvider(this, 'aws', {
      region,
      defaultTags: [
        {
          tags: {
            environment: 'production',
            managed_by: 'cdktf',
          },
        },
      ],
    });

    // 2. GET CALLER IDENTITY TO DYNAMICALLY GET YOUR ACCOUNT ID
    const callerIdentity = new DataAwsCallerIdentity(
      this,
      'caller-identity',
      {}
    );

    // Map of ELB Account IDs per region for access logging
    const elbAccountIds: { [key: string]: string } = {
      'us-east-1': '127311923021',
      'us-east-2': '033677994240',
      'us-west-1': '027434742980',
      'us-west-2': '797873946194',
      // Add other regions as needed
    };

    // Networking (VPC, Subnets, Gateways)
    const vpc = new Vpc(this, 'main-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    const igw = new InternetGateway(this, 'main-igw', { vpcId: vpc.id });

    const publicSubnets = availabilityZones.map(
      (zone, index) =>
        new Subnet(this, `public-subnet-${index}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${index + 1}.0/24`,
          availabilityZone: zone,
          mapPublicIpOnLaunch: true,
        })
    );

    const privateSubnets = availabilityZones.map(
      (zone, index) =>
        new Subnet(this, `private-subnet-${index}`, {
          vpcId: vpc.id,
          cidrBlock: `10.0.${100 + index + 1}.0/24`,
          availabilityZone: zone,
        })
    );

    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
    });

    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    availabilityZones.forEach((zone, index) => {
      const eip = new Eip(this, `nat-eip-${index}`, { domain: 'vpc' });
      const natGateway = new NatGateway(this, `nat-gw-${index}`, {
        allocationId: eip.id,
        subnetId: publicSubnets[index].id,
      });
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: vpc.id,
        route: [{ cidrBlock: '0.0.0.0/0', natGatewayId: natGateway.id }],
      });
      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: privateSubnets[index].id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Security Groups
    const albSg = new SecurityGroup(this, 'alb-sg', {
      name: `alb-sg-${randomSuffix}`,
      vpcId: vpc.id,
      description: 'Allow HTTP traffic to ALB',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
      ],
    });

    const ec2Sg = new SecurityGroup(this, 'ec2-sg', {
      name: `ec2-sg-${randomSuffix}`,
      vpcId: vpc.id,
      description: 'Allow traffic from ALB to EC2 instances',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 8080,
          toPort: 8080,
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
      description: 'Allow traffic from EC2 to RDS',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 5432,
          toPort: 5432,
          securityGroups: [ec2Sg.id],
        },
      ],
    });

    // Logging
    const albLogBucket = new S3Bucket(this, 'alb-log-bucket', {
      bucket: `alb-logs-${randomSuffix}`,
    });

    // 3. ADD THE S3 BUCKET POLICY
    new S3BucketPolicy(this, 'alb-log-bucket-policy', {
      bucket: albLogBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${elbAccountIds[region]}:root`,
            },
            Action: 's3:PutObject',
            Resource: `${albLogBucket.arn}/alb-logs/AWSLogs/${callerIdentity.accountId}/*`,
          },
        ],
      }),
    });

    const appLogGroup = new CloudwatchLogGroup(this, 'app-log-group', {
      name: `/app/web-logs-${randomSuffix}`,
      retentionInDays: 30,
    });

    // Application Load Balancer
    const alb = new Lb(this, 'alb', {
      name: `app-lb-${randomSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSg.id],
      subnets: publicSubnets.map(subnet => subnet.id),
      accessLogs: {
        bucket: albLogBucket.bucket,
        prefix: 'alb-logs',
        enabled: true,
      },
    });

    const targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `app-tg-${randomSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId: vpc.id,
      healthCheck: {
        path: '/health',
        protocol: 'HTTP',
        interval: 30,
      },
    });

    new LbListener(this, 'listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [{ type: 'forward', targetGroupArn: targetGroup.arn }],
    });

    // Database
    const dbSubnetGroup = new DbSubnetGroup(this, 'rds-subnet-group', {
      name: `rds-subnet-group-${randomSuffix}`,
      subnetIds: privateSubnets.map(subnet => subnet.id),
    });

    new DbInstance(this, 'rds-instance', {
      identifier: `app-db-${randomSuffix}`,
      allocatedStorage: 20,
      instanceClass: 'db.t3.medium',
      engine: 'postgres',
      engineVersion: '15',
      username: 'appadmin',
      password: 'MustBeChangedInSecretsManager',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSg.id],
      multiAz: true,
      storageEncrypted: true,
      backupRetentionPeriod: 30,
      skipFinalSnapshot: true,
      enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],
    });

    // IAM
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
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
            ],
            Effect: 'Allow',
            Resource: `${appLogGroup.arn}:*`,
          },
          {
            Action: 'ssm:GetParameter',
            Effect: 'Allow',
            Resource: `arn:aws:ssm:${region}:*:parameter/aws/service/cloudwatch-agent/*`,
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
      { name: `ec2-instance-profile-${randomSuffix}`, role: ec2Role.name }
    );

    // Compute
    const ami = new DataAwsAmi(this, 'amazon-linux-2', {
      mostRecent: true,
      filter: [{ name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] }],
      owners: ['amazon'],
    });

    const userData = `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux
`;

    const launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `app-launch-template-${randomSuffix}`,
      imageId: ami.id,
      instanceType: 't3.micro',
      iamInstanceProfile: { name: instanceProfile.name },
      vpcSecurityGroupIds: [ec2Sg.id],
      userData: Fn.base64encode(userData),
    });

    const asg = new AutoscalingGroup(this, 'autoscaling-group', {
      name: `app-asg-${randomSuffix}`,
      launchTemplate: { id: launchTemplate.id, version: '$Latest' },
      minSize: 2,
      maxSize: 10,
      desiredCapacity: 2,
      vpcZoneIdentifier: privateSubnets.map(subnet => subnet.id),
      targetGroupArns: [targetGroup.arn],
    });

    new AutoscalingPolicy(this, 'cpu-scaling-policy', {
      name: `cpu-scaling-policy-${randomSuffix}`,
      autoscalingGroupName: asg.name,
      policyType: 'TargetTrackingScaling',
      estimatedInstanceWarmup: 300,
      targetTrackingConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: 'ASGAverageCPUUtilization',
        },
        targetValue: 50.0,
      },
    });
  }
}
