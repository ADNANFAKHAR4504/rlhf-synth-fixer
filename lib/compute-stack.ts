import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as vpclattice from 'aws-cdk-lib/aws-vpclattice';
import { Construct } from 'constructs';

interface ComputeStackProps {
  vpc: ec2.Vpc;
  database: rds.DatabaseInstance;
  redisCluster: elasticache.CfnCacheCluster;
  redisSecurityGroup: ec2.SecurityGroup;
  openSearchDomain: opensearch.Domain;
  openSearchSecurityGroup: ec2.SecurityGroup;
  mediaBucket: s3.Bucket;
  serviceNetwork: vpclattice.CfnServiceNetwork;
  environmentSuffix: string;
}

export class ComputeStack extends Construct {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;
  public readonly ec2SecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    // CloudWatch Log Group with timestamp to avoid DELETE_SKIPPED issues
    const timestamp = Date.now().toString();
    const ec2LogGroup = new logs.LogGroup(this, 'EC2LogGroup', {
      logGroupName: `/aws/ec2/compute-stack-${props.environmentSuffix}-${timestamp}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ALB Security Group
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    // Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'WikiALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // EC2 Security Group
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    this.ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    // IAM Role for EC2 Instances
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Grant S3 permissions
    props.mediaBucket.grantReadWrite(ec2Role);

    // Grant OpenSearch permissions
    props.openSearchDomain.grantReadWrite(ec2Role);

    // User Data Script
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Wiki Platform</h1>" > /var/www/html/index.html'
    );

    // Launch Template
    const launchTemplate = new ec2.LaunchTemplate(this, 'WikiLaunchTemplate', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role: ec2Role,
      securityGroup: this.ec2SecurityGroup,
      userData: userData,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
          }),
        },
      ],
    });

    // Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'WikiASG', {
      vpc: props.vpc,
      launchTemplate: launchTemplate,
      minCapacity: 2,
      maxCapacity: 5,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'WikiTargetGroup',
      {
        vpc: props.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [this.autoScalingGroup],
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
        },
      }
    );

    // ALB Listener
    this.alb.addListener('HttpListener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // Auto Scaling Policies
    this.autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    this.autoScalingGroup.scaleOnRequestCount('RequestCountScaling', {
      targetRequestsPerMinute: 1000,
    });

    // VPC Lattice Service
    const latticeTargetGroup = new vpclattice.CfnTargetGroup(
      this,
      'LatticeTargetGroup',
      {
        type: 'ALB',
        targets: [
          {
            id: this.alb.loadBalancerArn,
            port: 80,
          },
        ],
        config: {
          port: 80,
          protocol: 'HTTP',
          protocolVersion: 'HTTP1',
          vpcIdentifier: props.vpc.vpcId,
        },
      }
    );

    const latticeService = new vpclattice.CfnService(
      this,
      'WikiLatticeService',
      {
        name: `wiki-service-${props.environmentSuffix}`,
        authType: 'AWS_IAM',
      }
    );

    new vpclattice.CfnListener(this, 'LatticeListener', {
      serviceIdentifier: latticeService.attrArn,
      protocol: 'HTTP',
      port: 80,
      defaultAction: {
        forward: {
          targetGroups: [
            {
              targetGroupIdentifier: latticeTargetGroup.attrArn,
              weight: 100,
            },
          ],
        },
      },
    });

    new vpclattice.CfnServiceNetworkServiceAssociation(
      this,
      'ServiceAssociation',
      {
        serviceIdentifier: latticeService.attrArn,
        serviceNetworkIdentifier: props.serviceNetwork.attrArn,
      }
    );

    // Configure Security Group Rules for Database Access
    const dbSecurityGroup = props.database.connections.securityGroups[0];
    dbSecurityGroup.addIngressRule(
      this.ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from EC2 instances'
    );

    // Configure Security Group Rules for Redis Access
    props.redisSecurityGroup.addIngressRule(
      this.ec2SecurityGroup,
      ec2.Port.tcp(6379),
      'Allow Redis access from EC2 instances'
    );

    // Configure Security Group Rules for OpenSearch Access
    props.openSearchSecurityGroup.addIngressRule(
      this.ec2SecurityGroup,
      ec2.Port.tcp(443),
      'Allow HTTPS access from EC2 instances for OpenSearch'
    );

    // Tags
    cdk.Tags.of(this.alb).add('Name', `WikiALB-${props.environmentSuffix}`);
    cdk.Tags.of(this.autoScalingGroup).add(
      'Name',
      `WikiASG-${props.environmentSuffix}`
    );
    cdk.Tags.of(this.autoScalingGroup).add(
      'Environment',
      props.environmentSuffix
    );
  }
}
