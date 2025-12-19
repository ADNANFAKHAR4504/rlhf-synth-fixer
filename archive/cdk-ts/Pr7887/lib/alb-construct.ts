import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

export interface ApplicationLoadBalancerConstructProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  fargateService: ecs.FargateService;
}

export class ApplicationLoadBalancerConstruct extends Construct {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly targetGroup: elbv2.ApplicationTargetGroup;

  constructor(
    scope: Construct,
    id: string,
    props: ApplicationLoadBalancerConstructProps
  ) {
    super(scope, id);

    const { environmentSuffix, vpc, fargateService } = props;

    // Create security group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      securityGroupName: `alb-sg-${environmentSuffix}`,
      vpc: vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      'LoadBalancer',
      {
        loadBalancerName: `ecs-alb-${environmentSuffix}`,
        vpc: vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        deletionProtection: false, // Fully destroyable
      }
    );

    // Issue 5: Create target group with corrected health check configuration
    this.targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: `ecs-tg-${environmentSuffix}`,
      vpc: vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      deregistrationDelay: cdk.Duration.seconds(30),
      // Issue 5: Fix health check configuration
      healthCheck: {
        enabled: true,
        path: '/health', // Corrected health check path
        protocol: elbv2.Protocol.HTTP,
        port: '8080',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10), // Increased timeout
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
        healthyHttpCodes: '200',
      },
    });

    // Add listener
    this.loadBalancer.addListener('Listener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [this.targetGroup],
    });

    // Attach Fargate service to target group
    fargateService.attachToApplicationTargetGroup(this.targetGroup);
  }
}
