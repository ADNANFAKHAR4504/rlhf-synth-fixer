# Multi-Region Web Application Infrastructure

This solution creates a highly available web application infrastructure across two AWS regions with automatic failover capabilities using CDK TypeScript.

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { WebAppStack } from './webapp-stack';
import { Route53Stack } from './route53-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Primary region (us-east-1) infrastructure
    const primaryNetworkStack = new NetworkStack(this, 'PrimaryNetwork', {
      env: { region: 'us-east-1' },
      environmentSuffix,
      regionName: 'primary'
    });

    const primaryWebAppStack = new WebAppStack(this, 'PrimaryWebApp', {
      env: { region: 'us-east-1' },
      environmentSuffix,
      vpc: primaryNetworkStack.vpc,
      regionName: 'primary'
    });

    // Secondary region (us-west-2) infrastructure
    const secondaryNetworkStack = new NetworkStack(this, 'SecondaryNetwork', {
      env: { region: 'us-west-2' },
      environmentSuffix,
      regionName: 'secondary'
    });

    const secondaryWebAppStack = new WebAppStack(this, 'SecondaryWebApp', {
      env: { region: 'us-west-2' },
      environmentSuffix,
      vpc: secondaryNetworkStack.vpc,
      regionName: 'secondary'
    });

    // Global Route 53 DNS management
    new Route53Stack(this, 'Route53', {
      env: { region: 'us-east-1' }, // Route 53 is global but we deploy from us-east-1
      environmentSuffix,
      primaryLoadBalancer: primaryWebAppStack.loadBalancer,
      secondaryLoadBalancer: secondaryWebAppStack.loadBalancer
    });
  }
}
```

## lib/network-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkStackProps extends cdk.StackProps {
  environmentSuffix: string;
  regionName: string;
}

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // Create VPC with multi-AZ setup
    this.vpc = new ec2.Vpc(this, `WebAppVPC-${props.regionName}`, {
      vpcName: `webapp-vpc-${props.regionName}-${props.environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3, // Use 3 AZs for better resilience
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Add VPC Flow Logs for monitoring
    new ec2.FlowLog(this, `VPCFlowLog-${props.regionName}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Create security group for web application
    const webAppSecurityGroup = new ec2.SecurityGroup(this, `WebAppSG-${props.regionName}`, {
      vpc: this.vpc,
      description: 'Security group for web application instances',
      allowAllOutbound: true,
    });

    webAppSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    webAppSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Export security group for use in other stacks
    new cdk.CfnOutput(this, `WebAppSecurityGroupId-${props.regionName}`, {
      value: webAppSecurityGroup.securityGroupId,
      exportName: `WebAppSG-${props.regionName}-${props.environmentSuffix}`,
    });

    // Export VPC details
    new cdk.CfnOutput(this, `VPCId-${props.regionName}`, {
      value: this.vpc.vpcId,
      exportName: `VPC-${props.regionName}-${props.environmentSuffix}`,
    });
  }
}
```

## lib/webapp-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface WebAppStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  regionName: string;
}

export class WebAppStack extends cdk.Stack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: WebAppStackProps) {
    super(scope, id, props);

    // Create security group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, `ALBSG-${props.regionName}`, {
      vpc: props.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, `WebAppALB-${props.regionName}`, {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      loadBalancerName: `webapp-alb-${props.regionName}-${props.environmentSuffix}`,
    });

    // Create security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, `EC2SG-${props.regionName}`, {
      vpc: props.vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    // Create IAM role for EC2 instances
    const ec2Role = new iam.Role(this, `EC2Role-${props.regionName}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    // User data script for web server setup
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<html><body><h1>Web Application - Region: ${AWS::Region}</h1><p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p></body></html>" > /var/www/html/index.html'
    );

    // Create Launch Template
    const launchTemplate = new ec2.LaunchTemplate(this, `LaunchTemplate-${props.regionName}`, {
      launchTemplateName: `webapp-lt-${props.regionName}-${props.environmentSuffix}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData: userData,
      detailedMonitoring: true,
    });

    // Create Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, `ASG-${props.regionName}`, {
      vpc: props.vpc,
      launchTemplate: launchTemplate,
      minCapacity: 2,
      maxCapacity: 10,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
      autoScalingGroupName: `webapp-asg-${props.regionName}-${props.environmentSuffix}`,
    });

    // Create target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, `TargetGroup-${props.regionName}`, {
      vpc: props.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.INSTANCE,
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        unhealthyThresholdCount: 5,
        path: '/',
      },
      targetGroupName: `webapp-tg-${props.regionName}-${props.environmentSuffix}`,
    });

    // Attach ASG to target group
    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // Add listener to ALB
    this.loadBalancer.addListener(`Listener-${props.regionName}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Add scaling policies
    const cpuScalingPolicy = autoScalingGroup.scaleOnCpuUtilization(`CPUScaling-${props.regionName}`, {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(3),
    });

    const requestCountScalingPolicy = autoScalingGroup.scaleOnRequestCount(`RequestScaling-${props.regionName}`, {
      targetRequestsPerMinute: 1000,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(3),
    });

    // Export ALB DNS name for Route 53
    new cdk.CfnOutput(this, `LoadBalancerDNS-${props.regionName}`, {
      value: this.loadBalancer.loadBalancerDnsName,
      exportName: `ALB-DNS-${props.regionName}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `LoadBalancerHostedZoneId-${props.regionName}`, {
      value: this.loadBalancer.loadBalancerCanonicalHostedZoneId,
      exportName: `ALB-HZ-${props.regionName}-${props.environmentSuffix}`,
    });
  }
}
```

## lib/route53-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

interface Route53StackProps extends cdk.StackProps {
  environmentSuffix: string;
  primaryLoadBalancer: elbv2.ApplicationLoadBalancer;
  secondaryLoadBalancer: elbv2.ApplicationLoadBalancer;
}

export class Route53Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Route53StackProps) {
    super(scope, id, props);

    const domainName = `webapp-${props.environmentSuffix}.example.com`;

    // Create hosted zone
    const hostedZone = new route53.HostedZone(this, 'WebAppHostedZone', {
      zoneName: domainName,
    });

    // Health check for primary region
    const primaryHealthCheck = new route53.CfnHealthCheck(this, 'PrimaryHealthCheck', {
      type: 'HTTPS_STR_MATCH',
      resourcePath: '/',
      fullyQualifiedDomainName: props.primaryLoadBalancer.loadBalancerDnsName,
      requestInterval: 30,
      failureThreshold: 3,
      searchString: 'Web Application',
      tags: [
        {
          key: 'Name',
          value: `Primary-HealthCheck-${props.environmentSuffix}`,
        },
      ],
    });

    // Health check for secondary region
    const secondaryHealthCheck = new route53.CfnHealthCheck(this, 'SecondaryHealthCheck', {
      type: 'HTTPS_STR_MATCH',
      resourcePath: '/',
      fullyQualifiedDomainName: props.secondaryLoadBalancer.loadBalancerDnsName,
      requestInterval: 30,
      failureThreshold: 3,
      searchString: 'Web Application',
      tags: [
        {
          key: 'Name',
          value: `Secondary-HealthCheck-${props.environmentSuffix}`,
        },
      ],
    });

    // Primary region record (failover primary)
    new route53.ARecord(this, 'PrimaryRecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(props.primaryLoadBalancer)
      ),
      setIdentifier: 'primary',
      failover: route53.Failover.PRIMARY,
      healthCheckId: primaryHealthCheck.attrHealthCheckId,
      ttl: cdk.Duration.seconds(60),
    });

    // Secondary region record (failover secondary)
    new route53.ARecord(this, 'SecondaryRecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(props.secondaryLoadBalancer)
      ),
      setIdentifier: 'secondary',
      failover: route53.Failover.SECONDARY,
      healthCheckId: secondaryHealthCheck.attrHealthCheckId,
      ttl: cdk.Duration.seconds(60),
    });

    // Output the hosted zone information
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: hostedZone.hostedZoneId,
      exportName: `HostedZone-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DomainName', {
      value: domainName,
      exportName: `DomainName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NameServers', {
      value: hostedZone.hostedZoneNameServers?.join(',') || 'undefined',
      exportName: `NameServers-${props.environmentSuffix}`,
    });
  }
}
```