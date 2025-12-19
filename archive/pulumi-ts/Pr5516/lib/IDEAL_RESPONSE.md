# Multi-AZ Application with Automatic Failover – IDEAL RESPONSE

The sections below contain the exact, validated TypeScript source for the Pulumi stacks that compose the solution. Each code block mirrors the corresponding file in `lib/`.

## File: `lib/tap-stack.ts`

```ts
/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the multi-AZ payment processing application with automatic failover.
 *
 * It orchestrates the instantiation of all infrastructure components including:
 * - VPC with public and private subnets across 3 AZs
 * - Auto Scaling Group with 2 instances per AZ
 * - Application Load Balancer with health checks
 * - CloudWatch alarms and SNS notifications
 * - Route53 health checks for failover
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { NetworkStack } from './network-stack';
import { SecurityStack } from './security-stack';
import { LoadBalancerStack } from './loadbalancer-stack';
import { ComputeStack } from './compute-stack';
import { MonitoringStack } from './monitoring-stack';
import { Route53Stack } from './route53-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the multi-AZ failover application.
 *
 * This component orchestrates the instantiation of all infrastructure components
 * required for a highly available payment processing application with automatic
 * failover capabilities across multiple availability zones.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly autoScalingGroupName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Define default tags with required Production and FailoverEnabled tags
    const defaultTags = pulumi.output(args.tags || {}).apply(t => ({
      ...t,
      Environment: 'Production',
      FailoverEnabled: 'true',
    }));

    // Define target region and availability zones
    const region = 'eu-central-1';
    const availabilityZones = [
      'eu-central-1a',
      'eu-central-1b',
      'eu-central-1c',
    ];

    // 1. Create Network Infrastructure (VPC, Subnets, NAT Gateways)
    const networkStack = new NetworkStack(
      'network',
      {
        environmentSuffix,
        region,
        availabilityZones,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 2. Create Security Groups
    const securityStack = new SecurityStack(
      'security',
      {
        environmentSuffix,
        vpcId: networkStack.vpc.id,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 3. Create Application Load Balancer and Target Group
    const loadBalancerStack = new LoadBalancerStack(
      'loadbalancer',
      {
        environmentSuffix,
        vpcId: networkStack.vpc.id,
        publicSubnetIds: networkStack.publicSubnets.map(s => s.id),
        albSecurityGroupId: securityStack.albSecurityGroup.id,
        tags: defaultTags,
      },
      { parent: this }
    );

    // 4. Create Auto Scaling Group with EC2 Instances
    const computeStack = new ComputeStack(
      'compute',
      {
        environmentSuffix,
        region,
        availabilityZones,
        privateSubnetIds: networkStack.privateSubnets.map(s => s.id),
        instanceSecurityGroupId: securityStack.instanceSecurityGroup.id,
        targetGroupArn: loadBalancerStack.targetGroup.arn,
        tags: defaultTags,
      },
      { parent: this, dependsOn: [loadBalancerStack] }
    );

    // 5. Create CloudWatch Alarms and SNS Notifications
    const monitoringStack = new MonitoringStack(
      'monitoring',
      {
        environmentSuffix,
        region,
        availabilityZones,
        targetGroupArn: loadBalancerStack.targetGroup.arn,
        albArn: loadBalancerStack.alb.arn,
        autoScalingGroupName: computeStack.autoScalingGroup.name,
        tags: defaultTags,
      },
      { parent: this, dependsOn: [computeStack] }
    );

    // 6. Create Route53 Health Checks
    const route53Stack = new Route53Stack(
      'route53',
      {
        environmentSuffix,
        albDnsName: loadBalancerStack.alb.dnsName,
        albZoneId: loadBalancerStack.alb.zoneId,
        tags: defaultTags,
      },
      { parent: this, dependsOn: [loadBalancerStack] }
    );

    // Expose important outputs
    this.vpcId = networkStack.vpc.id;
    this.albDnsName = loadBalancerStack.alb.dnsName;
    this.snsTopicArn = monitoringStack.snsTopic.arn;
    this.autoScalingGroupName = computeStack.autoScalingGroup.name;

    // Register the outputs of this component
    this.registerOutputs({
      vpcId: this.vpcId,
      albDnsName: this.albDnsName,
      albArn: loadBalancerStack.alb.arn,
      targetGroupArn: loadBalancerStack.targetGroup.arn,
      autoScalingGroupName: this.autoScalingGroupName,
      snsTopicArn: this.snsTopicArn,
      healthCheckId: route53Stack.healthCheck.id,
      region: region,
      availabilityZones: availabilityZones,
    });
  }
}
```

## File: `lib/network-stack.ts`

```ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface NetworkStackArgs {
  environmentSuffix: string;
  region: string;
  availabilityZones: string[];
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class NetworkStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateways: aws.ec2.NatGateway[];
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly privateRouteTables: aws.ec2.RouteTable[];

  constructor(
    name: string,
    args: NetworkStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:network:NetworkStack', name, args, opts);

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `vpc-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `igw-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `igw-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create public subnets (one per AZ)
    this.publicSubnets = args.availabilityZones.map((az, index) => {
      return new aws.ec2.Subnet(
        `public-subnet-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${index}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...pulumi.output(args.tags).apply(t => t),
            Name: `public-subnet-${az}-${args.environmentSuffix}`,
            Type: 'public',
          },
        },
        { parent: this }
      );
    });

    // Create private subnets (one per AZ)
    this.privateSubnets = args.availabilityZones.map((az, index) => {
      return new aws.ec2.Subnet(
        `private-subnet-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: `10.0.${index + 10}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: false,
          tags: {
            ...pulumi.output(args.tags).apply(t => t),
            Name: `private-subnet-${az}-${args.environmentSuffix}`,
            Type: 'private',
          },
        },
        { parent: this }
      );
    });

    // Allocate Elastic IPs for NAT Gateways
    const eips = args.availabilityZones.map((az, index) => {
      return new aws.ec2.Eip(
        `nat-eip-${index}-${args.environmentSuffix}`,
        {
          domain: 'vpc',
          tags: {
            ...pulumi.output(args.tags).apply(t => t),
            Name: `nat-eip-${az}-${args.environmentSuffix}`,
          },
        },
        { parent: this }
      );
    });

    // Create NAT Gateways (one per AZ for high availability)
    this.natGateways = args.availabilityZones.map((az, index) => {
      return new aws.ec2.NatGateway(
        `nat-${index}-${args.environmentSuffix}`,
        {
          allocationId: eips[index].id,
          subnetId: this.publicSubnets[index].id,
          tags: {
            ...pulumi.output(args.tags).apply(t => t),
            Name: `nat-${az}-${args.environmentSuffix}`,
          },
        },
        { parent: this, dependsOn: [this.internetGateway] }
      );
    });

    // Create public route table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `public-rt-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add route to Internet Gateway
    new aws.ec2.Route(
      `public-route-${args.environmentSuffix}`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: this.publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create private route tables (one per AZ)
    this.privateRouteTables = args.availabilityZones.map((az, index) => {
      const routeTable = new aws.ec2.RouteTable(
        `private-rt-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...pulumi.output(args.tags).apply(t => t),
            Name: `private-rt-${az}-${args.environmentSuffix}`,
          },
        },
        { parent: this }
      );

      // Add route to NAT Gateway
      new aws.ec2.Route(
        `private-route-${index}-${args.environmentSuffix}`,
        {
          routeTableId: routeTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: this.natGateways[index].id,
        },
        { parent: this }
      );

      // Associate private subnet with its route table
      new aws.ec2.RouteTableAssociation(
        `private-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: this.privateSubnets[index].id,
          routeTableId: routeTable.id,
        },
        { parent: this }
      );

      return routeTable;
    });

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnets.map(s => s.id),
      privateSubnetIds: this.privateSubnets.map(s => s.id),
    });
  }
}
```

## File: `lib/security-stack.ts`

```ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class SecurityStack extends pulumi.ComponentResource {
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly instanceSecurityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: SecurityStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:security:SecurityStack', name, args, opts);

    // ALB Security Group
    this.albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS traffic from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP traffic from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `alb-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Instance Security Group
    this.instanceSecurityGroup = new aws.ec2.SecurityGroup(
      `instance-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: 'Security group for EC2 instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            securityGroups: [this.albSecurityGroup.id],
            description: 'Allow HTTPS traffic from ALB',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [this.albSecurityGroup.id],
            description: 'Allow HTTP traffic from ALB for health checks',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `instance-sg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      albSecurityGroupId: this.albSecurityGroup.id,
      instanceSecurityGroupId: this.instanceSecurityGroup.id,
    });
  }
}
```

## File: `lib/loadbalancer-stack.ts`

```ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LoadBalancerStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  publicSubnetIds: pulumi.Input<string>[];
  albSecurityGroupId: pulumi.Input<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class LoadBalancerStack extends pulumi.ComponentResource {
  public readonly alb: aws.lb.LoadBalancer;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly listener: aws.lb.Listener;

  constructor(
    name: string,
    args: LoadBalancerStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:loadbalancer:LoadBalancerStack', name, args, opts);

    // Create Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(
      `alb-${args.environmentSuffix}`,
      {
        loadBalancerType: 'application',
        subnets: args.publicSubnetIds,
        securityGroups: [args.albSecurityGroupId],
        enableCrossZoneLoadBalancing: true,
        enableHttp2: true,
        enableDeletionProtection: false, // Set to true in production
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `alb-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Target Group with health checks
    this.targetGroup = new aws.lb.TargetGroup(
      `tg-${args.environmentSuffix}`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: args.vpcId,
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          matcher: '200',
          interval: 30, // Health checks every 30 seconds
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        deregistrationDelay: 30,
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `tg-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create HTTP Listener (in production, use HTTPS with certificate)
    this.listener = new aws.lb.Listener(
      `listener-${args.environmentSuffix}`,
      {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `listener-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      albArn: this.alb.arn,
      albDnsName: this.alb.dnsName,
      targetGroupArn: this.targetGroup.arn,
    });
  }
}
```

## File: `lib/compute-stack.ts`

```ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ComputeStackArgs {
  environmentSuffix: string;
  region: string;
  availabilityZones: string[];
  privateSubnetIds: pulumi.Input<string>[];
  instanceSecurityGroupId: pulumi.Input<string>;
  targetGroupArn: pulumi.Input<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ComputeStack extends pulumi.ComponentResource {
  public readonly launchTemplate: aws.ec2.LaunchTemplate;
  public readonly autoScalingGroup: aws.autoscaling.Group;
  public readonly instanceRole: aws.iam.Role;

  constructor(
    name: string,
    args: ComputeStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:compute:ComputeStack', name, args, opts);

    // Get the latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'state',
          values: ['available'],
        },
      ],
    });

    // Create IAM role for EC2 instances
    this.instanceRole = new aws.iam.Role(
      `instance-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `instance-role-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Attach SSM policy for instance management
    new aws.iam.RolePolicyAttachment(
      `ssm-policy-${args.environmentSuffix}`,
      {
        role: this.instanceRole.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      },
      { parent: this }
    );

    // Create instance profile
    const instanceProfile = new aws.iam.InstanceProfile(
      `instance-profile-${args.environmentSuffix}`,
      {
        role: this.instanceRole.name,
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `instance-profile-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // User data script to configure the instance
    const userData = `#!/bin/bash
set -e

# Update system
yum update -y

# Install necessary packages
yum install -y httpd mod_ssl

# Create a simple health check endpoint
cat > /var/www/html/health << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Health Check</title></head>
<body>
<h1>OK</h1>
<p>Service is healthy</p>
</body>
</html>
EOF

# Create a simple index page
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Payment Processing Service</title></head>
<body>
<h1>Payment Processing Application</h1>
<p>Multi-AZ deployment with automatic failover</p>
<p>Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</p>
<p>Availability Zone: $(ec2-metadata --availability-zone | cut -d " " -f 2)</p>
</body>
</html>
EOF

# Configure Apache
systemctl enable httpd
systemctl start httpd

# Setup CloudWatch agent for monitoring
yum install -y amazon-cloudwatch-agent
`;

    // Create Launch Template
    this.launchTemplate = new aws.ec2.LaunchTemplate(
      `launch-template-${args.environmentSuffix}`,
      {
        imageId: ami.then(a => a.id),
        instanceType: 't3.small',
        iamInstanceProfile: {
          arn: instanceProfile.arn,
        },
        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required', // IMDSv2 enforcement
          httpPutResponseHopLimit: 1,
        },
        networkInterfaces: [
          {
            associatePublicIpAddress: 'false',
            deleteOnTermination: 'true',
            securityGroups: [args.instanceSecurityGroupId],
          },
        ],
        userData: Buffer.from(userData).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...pulumi.output(args.tags).apply(t => t),
              Name: `payment-processor-${args.environmentSuffix}`,
            },
          },
          {
            resourceType: 'volume',
            tags: {
              ...pulumi.output(args.tags).apply(t => t),
              Name: `payment-processor-volume-${args.environmentSuffix}`,
            },
          },
        ],
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `launch-template-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Auto Scaling Group with exactly 2 instances per AZ
    this.autoScalingGroup = new aws.autoscaling.Group(
      `asg-${args.environmentSuffix}`,
      {
        desiredCapacity: args.availabilityZones.length * 2, // 2 instances per AZ
        maxSize: args.availabilityZones.length * 3, // Allow scaling up to 3 per AZ
        minSize: args.availabilityZones.length * 2, // Minimum 2 per AZ
        vpcZoneIdentifiers: args.privateSubnetIds,
        healthCheckGracePeriod: 300, // 300 seconds for new instances
        healthCheckType: 'ELB',
        targetGroupArns: [args.targetGroupArn],
        launchTemplate: {
          id: this.launchTemplate.id,
          version: '$Latest',
        },
        enabledMetrics: [
          'GroupDesiredCapacity',
          'GroupInServiceInstances',
          'GroupMaxSize',
          'GroupMinSize',
          'GroupPendingInstances',
          'GroupStandbyInstances',
          'GroupTerminatingInstances',
          'GroupTotalInstances',
        ],
        tags: pulumi.output(args.tags).apply(t => {
          const baseTags = [
            {
              key: 'Name',
              value: `asg-${args.environmentSuffix}`,
              propagateAtLaunch: true,
            },
          ];
          const tagEntries = Object.entries(t).map(([key, value]) => ({
            key,
            value: String(value),
            propagateAtLaunch: true,
          }));
          return [...baseTags, ...tagEntries];
        }),
      },
      { parent: this, dependsOn: [this.launchTemplate] }
    );

    this.registerOutputs({
      autoScalingGroupName: this.autoScalingGroup.name,
      launchTemplateId: this.launchTemplate.id,
    });
  }
}
```

## File: `lib/monitoring-stack.ts`

```ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  region: string;
  availabilityZones: string[];
  targetGroupArn: pulumi.Input<string>;
  albArn: pulumi.Input<string>;
  autoScalingGroupName: pulumi.Input<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly snsTopic: aws.sns.Topic;
  public readonly unhealthyTargetAlarm: aws.cloudwatch.MetricAlarm;
  public readonly targetResponseTimeAlarm: aws.cloudwatch.MetricAlarm;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    // Create SNS Topic for notifications
    this.snsTopic = new aws.sns.Topic(
      `failover-alerts-${args.environmentSuffix}`,
      {
        displayName: `Failover Alerts - ${args.environmentSuffix}`,
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `failover-alerts-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch alarm for unhealthy targets
    // Triggers when any AZ has less than 2 healthy targets
    this.unhealthyTargetAlarm = new aws.cloudwatch.MetricAlarm(
      `unhealthy-targets-${args.environmentSuffix}`,
      {
        name: `unhealthy-targets-${args.environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: args.availabilityZones.length * 2, // Less than 2 per AZ
        treatMissingData: 'breaching',
        alarmDescription: 'Alert when any AZ has less than 2 healthy targets',
        alarmActions: [this.snsTopic.arn],
        okActions: [this.snsTopic.arn],
        dimensions: {
          TargetGroup: pulumi.output(args.targetGroupArn).apply(arn => {
            const parts = arn.split(':');
            return parts[parts.length - 1];
          }),
          LoadBalancer: pulumi.output(args.albArn).apply(arn => {
            const parts = arn.split(':loadbalancer/');
            return parts[parts.length - 1];
          }),
        },
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `unhealthy-targets-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch alarm for target response time
    this.targetResponseTimeAlarm = new aws.cloudwatch.MetricAlarm(
      `target-response-time-${args.environmentSuffix}`,
      {
        name: `target-response-time-${args.environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'TargetResponseTime',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Average',
        threshold: 1.0, // 1 second
        treatMissingData: 'notBreaching',
        alarmDescription: 'Alert when target response time exceeds 1 second',
        alarmActions: [this.snsTopic.arn],
        okActions: [this.snsTopic.arn],
        dimensions: {
          TargetGroup: pulumi.output(args.targetGroupArn).apply(arn => {
            const parts = arn.split(':');
            return parts[parts.length - 1];
          }),
          LoadBalancer: pulumi.output(args.albArn).apply(arn => {
            const parts = arn.split(':loadbalancer/');
            return parts[parts.length - 1];
          }),
        },
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `target-response-time-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `dashboard-${args.environmentSuffix}`,
      {
        dashboardName: `failover-monitoring-${args.environmentSuffix}`,
        dashboardBody: pulumi
          .all([args.targetGroupArn, args.albArn, args.autoScalingGroupName])
          .apply(([_tgArn, _lbArn, asgName]) => {
            return JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ApplicationELB',
                        'HealthyHostCount',
                        { stat: 'Average' },
                      ],
                      ['.', 'UnHealthyHostCount', { stat: 'Average' }],
                    ],
                    period: 60,
                    stat: 'Average',
                    region: args.region,
                    title: 'Target Health',
                    yAxis: {
                      left: {
                        min: 0,
                      },
                    },
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/ApplicationELB',
                        'TargetResponseTime',
                        { stat: 'Average' },
                      ],
                    ],
                    period: 60,
                    stat: 'Average',
                    region: args.region,
                    title: 'Target Response Time',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      ['AWS/ApplicationELB', 'RequestCount', { stat: 'Sum' }],
                    ],
                    period: 60,
                    stat: 'Sum',
                    region: args.region,
                    title: 'Request Count',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      [
                        'AWS/AutoScaling',
                        'GroupDesiredCapacity',
                        'AutoScalingGroupName',
                        asgName,
                      ],
                      ['.', 'GroupInServiceInstances', '.', '.'],
                    ],
                    period: 60,
                    stat: 'Average',
                    region: args.region,
                    title: 'Auto Scaling Group',
                  },
                },
              ],
            });
          }),
      },
      { parent: this }
    );

    this.registerOutputs({
      snsTopicArn: this.snsTopic.arn,
      unhealthyTargetAlarmName: this.unhealthyTargetAlarm.name,
      dashboardName: dashboard.dashboardName,
    });
  }
}
```

## File: `lib/route53-stack.ts`

```ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface Route53StackArgs {
  environmentSuffix: string;
  albDnsName: pulumi.Input<string>;
  albZoneId: pulumi.Input<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class Route53Stack extends pulumi.ComponentResource {
  public readonly healthCheck: aws.route53.HealthCheck;
  public readonly hostedZone?: aws.route53.Zone;
  public readonly record?: aws.route53.Record;

  constructor(
    name: string,
    args: Route53StackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:route53:Route53Stack', name, args, opts);

    // Create Route53 Health Check for ALB
    // Note: In production, you would use HTTPS with a valid certificate
    this.healthCheck = new aws.route53.HealthCheck(
      `alb-health-check-${args.environmentSuffix}`,
      {
        type: 'HTTPS',
        resourcePath: '/health',
        failureThreshold: 3,
        requestInterval: 30,
        measureLatency: true,
        fqdn: args.albDnsName,
        port: 443,
        tags: {
          ...pulumi.output(args.tags).apply(t => t),
          Name: `alb-health-check-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Note: Creating a hosted zone and DNS records requires a domain
    // Uncomment and modify the following if you have a domain configured

    /*
    // Get or create hosted zone
    this.hostedZone = new aws.route53.Zone(`zone-${args.environmentSuffix}`, {
      name: 'example.com', // Replace with your domain
      tags: {
        ...pulumi.output(args.tags).apply(t => t),
        Name: `zone-${args.environmentSuffix}`,
      },
    }, { parent: this });

    // Create DNS record with failover routing
    this.record = new aws.route53.Record(`record-${args.environmentSuffix}`, {
      zoneId: this.hostedZone.zoneId,
      name: `app-${args.environmentSuffix}.example.com`, // Replace with your subdomain
      type: 'A',
      aliases: [{
        name: args.albDnsName,
        zoneId: args.albZoneId,
        evaluateTargetHealth: true,
      }],
      setIdentifier: `primary-${args.environmentSuffix}`,
      failoverRoutingPolicies: [{
        type: 'PRIMARY',
      }],
      healthCheckId: this.healthCheck.id,
    }, { parent: this });
    */

    this.registerOutputs({
      healthCheckId: this.healthCheck.id,
    });
  }
}
```
