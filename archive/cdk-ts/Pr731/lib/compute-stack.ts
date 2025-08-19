import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  instanceRole: iam.Role;
  kmsKey: kms.Key;
}

export class ComputeStack extends cdk.NestedStack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Instance profile for EC2
    new iam.CfnInstanceProfile(
      this,
      `${props.environmentSuffix}-instance-profile`,
      {
        instanceProfileName: `${props.environmentSuffix}-instance-profile`,
        roles: [props.instanceRole.roleName],
      }
    );

    // Launch template with encrypted EBS volumes
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `${props.environmentSuffix}-launch-template`,
      {
        launchTemplateName: `${props.environmentSuffix}-launch-template`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: props.securityGroup,
        role: props.instanceRole,
        userData: ec2.UserData.forLinux(),
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              kmsKey: props.kmsKey,
              volumeType: ec2.EbsDeviceVolumeType.GP3,
            }),
          },
        ],
      }
    );

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      `${props.environmentSuffix}-asg`,
      {
        autoScalingGroupName: `${props.environmentSuffix}-asg`,
        vpc: props.vpc,
        launchTemplate: launchTemplate,
        minCapacity: 1,
        maxCapacity: 3,
        desiredCapacity: 2,
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      `${props.environmentSuffix}-alb`,
      {
        loadBalancerName: `${props.environmentSuffix}-alb`,
        vpc: props.vpc,
        internetFacing: true,
        securityGroup: props.securityGroup,
      }
    );

    // Target group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `${props.environmentSuffix}-tg`,
      {
        targetGroupName: `${props.environmentSuffix}-tg`,
        vpc: props.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [autoScalingGroup],
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          path: '/health',
          protocol: elbv2.Protocol.HTTP,
          timeout: cdk.Duration.seconds(5),
          unhealthyThresholdCount: 2,
        },
      }
    );

    // ALB Listener
    this.loadBalancer.addListener(`${props.environmentSuffix}-listener`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });
  }
}
