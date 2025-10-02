# Pulumi TypeScript Infrastructure Code

Here's the complete Pulumi TypeScript infrastructure code for the media company's web application:

## lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { VpcStack } from './vpc-stack';
import { AlbStack } from './alb-stack';
import { Ec2Stack } from './ec2-stack';
import { S3Stack } from './s3-stack';
import { CloudWatchStack } from './cloudwatch-stack';

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
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly albDns: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create VPC and networking resources
    const vpcStack = new VpcStack('tap-vpc', {
      environmentSuffix: environmentSuffix,
      vpcCidr: '10.5.0.0/16',
      tags: tags,
    }, { parent: this });

    // Create S3 bucket for static assets
    const s3Stack = new S3Stack('tap-s3', {
      environmentSuffix: environmentSuffix,
      tags: tags,
    }, { parent: this });

    // Create EC2 Auto Scaling resources
    const ec2Stack = new Ec2Stack('tap-ec2', {
      environmentSuffix: environmentSuffix,
      vpcId: vpcStack.vpcId,
      privateSubnetIds: vpcStack.privateSubnetIds,
      tags: tags,
    }, { parent: this });

    // Create Application Load Balancer
    const albStack = new AlbStack('tap-alb', {
      environmentSuffix: environmentSuffix,
      vpcId: vpcStack.vpcId,
      publicSubnetIds: vpcStack.publicSubnetIds,
      targetGroupArn: ec2Stack.targetGroupArn,
      tags: tags,
    }, { parent: this });

    // Create CloudWatch monitoring
    const cloudWatchStack = new CloudWatchStack('tap-monitoring', {
      environmentSuffix: environmentSuffix,
      autoScalingGroupName: ec2Stack.autoScalingGroupName,
      targetGroupArn: ec2Stack.targetGroupArn,
      albArn: albStack.albArn,
      tags: tags,
    }, { parent: this });

    // Expose outputs
    this.vpcId = vpcStack.vpcId;
    this.albDns = albStack.albDns;
    this.bucketName = s3Stack.bucketName;

    // Register the outputs of this component
    this.registerOutputs({
      vpcId: this.vpcId,
      albDns: this.albDns,
      bucketName: this.bucketName,
    });
  }
}
```

## lib/vpc-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface VpcStackArgs {
  environmentSuffix: string;
  vpcCidr: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;

  constructor(name: string, args: VpcStackArgs, opts?: ResourceOptions) {
    super('tap:vpc:VpcStack', name, args, opts);

    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create VPC
    const vpc = new aws.ec2.Vpc(`${name}-vpc-${args.environmentSuffix}`, {
      cidrBlock: args.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${name}-vpc-${args.environmentSuffix}`,
        ...args.tags,
      },
    }, { parent: this });

    // Create Internet Gateway
    const igw = new aws.ec2.InternetGateway(`${name}-igw-${args.environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        Name: `${name}-igw-${args.environmentSuffix}`,
        ...args.tags,
      },
    }, { parent: this });

    // Create public subnets
    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];

    availabilityZones.then(azs => {
      for (let i = 0; i < Math.min(2, azs.names.length); i++) {
        const publicSubnet = new aws.ec2.Subnet(`${name}-public-subnet-${i}-${args.environmentSuffix}`, {
          vpcId: vpc.id,
          cidrBlock: `10.5.${i * 2}.0/24`,
          availabilityZone: azs.names[i],
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `${name}-public-subnet-${i}-${args.environmentSuffix}`,
            Type: 'Public',
            ...args.tags,
          },
        }, { parent: this });
        publicSubnets.push(publicSubnet);

        const privateSubnet = new aws.ec2.Subnet(`${name}-private-subnet-${i}-${args.environmentSuffix}`, {
          vpcId: vpc.id,
          cidrBlock: `10.5.${i * 2 + 1}.0/24`,
          availabilityZone: azs.names[i],
          tags: {
            Name: `${name}-private-subnet-${i}-${args.environmentSuffix}`,
            Type: 'Private',
            ...args.tags,
          },
        }, { parent: this });
        privateSubnets.push(privateSubnet);
      }
    });

    // Create NAT Gateways for private subnets
    const natGateways: aws.ec2.NatGateway[] = [];
    publicSubnets.forEach((subnet, i) => {
      const eip = new aws.ec2.Eip(`${name}-nat-eip-${i}-${args.environmentSuffix}`, {
        domain: 'vpc',
        tags: {
          Name: `${name}-nat-eip-${i}-${args.environmentSuffix}`,
          ...args.tags,
        },
      }, { parent: this });

      const natGateway = new aws.ec2.NatGateway(`${name}-nat-${i}-${args.environmentSuffix}`, {
        allocationId: eip.id,
        subnetId: subnet.id,
        tags: {
          Name: `${name}-nat-${i}-${args.environmentSuffix}`,
          ...args.tags,
        },
      }, { parent: this });
      natGateways.push(natGateway);
    });

    // Create route tables
    const publicRouteTable = new aws.ec2.RouteTable(`${name}-public-rt-${args.environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        Name: `${name}-public-rt-${args.environmentSuffix}`,
        ...args.tags,
      },
    }, { parent: this });

    new aws.ec2.Route(`${name}-public-route-${args.environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    }, { parent: this });

    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(`${name}-public-rta-${i}-${args.environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      }, { parent: this });
    });

    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new aws.ec2.RouteTable(`${name}-private-rt-${i}-${args.environmentSuffix}`, {
        vpcId: vpc.id,
        tags: {
          Name: `${name}-private-rt-${i}-${args.environmentSuffix}`,
          ...args.tags,
        },
      }, { parent: this });

      new aws.ec2.Route(`${name}-private-route-${i}-${args.environmentSuffix}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[i].id,
      }, { parent: this });

      new aws.ec2.RouteTableAssociation(`${name}-private-rta-${i}-${args.environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      }, { parent: this });
    });

    // Enable VPC Flow Logs
    const flowLogRole = new aws.iam.Role(`${name}-flow-log-role-${args.environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'vpc-flow-logs.amazonaws.com',
          },
        }],
      }),
      tags: args.tags,
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`${name}-flow-log-policy-${args.environmentSuffix}`, {
      role: flowLogRole.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchLogsFullAccess',
    }, { parent: this });

    const flowLogGroup = new aws.cloudwatch.LogGroup(`${name}-flow-logs-${args.environmentSuffix}`, {
      retentionInDays: 7,
      tags: args.tags,
    }, { parent: this });

    new aws.ec2.FlowLog(`${name}-flow-log-${args.environmentSuffix}`, {
      iamRoleArn: flowLogRole.arn,
      logDestinationType: 'cloud-watch-logs',
      logGroupName: flowLogGroup.name,
      trafficType: 'ALL',
      vpcId: vpc.id,
      tags: {
        Name: `${name}-flow-log-${args.environmentSuffix}`,
        ...args.tags,
      },
    }, { parent: this });

    this.vpcId = vpc.id;
    this.publicSubnetIds = pulumi.output(publicSubnets.map(s => s.id));
    this.privateSubnetIds = pulumi.output(privateSubnets.map(s => s.id));

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
```

## lib/ec2-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface Ec2StackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string[]>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class Ec2Stack extends pulumi.ComponentResource {
  public readonly autoScalingGroupName: pulumi.Output<string>;
  public readonly targetGroupArn: pulumi.Output<string>;

  constructor(name: string, args: Ec2StackArgs, opts?: ResourceOptions) {
    super('tap:ec2:Ec2Stack', name, args, opts);

    // Create IAM role for EC2 instances
    const instanceRole = new aws.iam.Role(`${name}-instance-role-${args.environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
        }],
      }),
      tags: args.tags,
    }, { parent: this });

    // Attach necessary policies
    new aws.iam.RolePolicyAttachment(`${name}-ssm-policy-${args.environmentSuffix}`, {
      role: instanceRole.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`${name}-cloudwatch-policy-${args.environmentSuffix}`, {
      role: instanceRole.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    }, { parent: this });

    const instanceProfile = new aws.iam.InstanceProfile(`${name}-instance-profile-${args.environmentSuffix}`, {
      role: instanceRole.name,
      tags: args.tags,
    }, { parent: this });

    // Create Security Group for EC2 instances
    const instanceSecurityGroup = new aws.ec2.SecurityGroup(`${name}-instance-sg-${args.environmentSuffix}`, {
      vpcId: args.vpcId,
      description: 'Security group for EC2 instances',
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['10.5.0.0/16'], // Allow from within VPC
        },
        {
          protocol: 'tcp',
          fromPort: 22,
          toPort: 22,
          cidrBlocks: ['10.0.0.0/8'], // Restricted SSH access
        },
      ],
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      }],
      tags: {
        Name: `${name}-instance-sg-${args.environmentSuffix}`,
        ...args.tags,
      },
    }, { parent: this });

    // User data script for instance initialization
    const userData = `#!/bin/bash
# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install and start nginx
amazon-linux-extras install nginx1 -y
systemctl start nginx
systemctl enable nginx

# Configure simple web page
echo "<h1>Media Company Web Application - Instance $(ec2-metadata --instance-id | cut -d " " -f 2)</h1>" > /usr/share/nginx/html/index.html

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s
`;

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // Create Launch Template
    const launchTemplate = new aws.ec2.LaunchTemplate(`${name}-lt-${args.environmentSuffix}`, {
      namePrefix: `${name}-lt-${args.environmentSuffix}-`,
      imageId: ami.then(ami => ami.id),
      instanceType: 't3.micro',
      iamInstanceProfile: {
        arn: instanceProfile.arn,
      },
      vpcSecurityGroupIds: [instanceSecurityGroup.id],
      userData: Buffer.from(userData).toString('base64'),
      monitoring: {
        enabled: true,
      },
      tagSpecifications: [{
        resourceType: 'instance',
        tags: {
          Name: `${name}-instance-${args.environmentSuffix}`,
          ...args.tags,
        },
      }],
      tags: args.tags,
    }, { parent: this });

    // Create Target Group
    const targetGroup = new aws.lb.TargetGroup(`${name}-tg-${args.environmentSuffix}`, {
      port: 80,
      protocol: 'HTTP',
      vpcId: args.vpcId,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        path: '/',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },
      deregistrationDelay: 30,
      tags: {
        Name: `${name}-tg-${args.environmentSuffix}`,
        ...args.tags,
      },
    }, { parent: this });

    // Create Auto Scaling Group
    const autoScalingGroup = new aws.autoscaling.Group(`${name}-asg-${args.environmentSuffix}`, {
      namePrefix: `${name}-asg-${args.environmentSuffix}-`,
      vpcZoneIdentifiers: args.privateSubnetIds,
      targetGroupArns: [targetGroup.arn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tags: [
        {
          key: 'Name',
          value: `${name}-asg-instance-${args.environmentSuffix}`,
          propagateAtLaunch: true,
        },
        {
          key: 'Environment',
          value: args.environmentSuffix,
          propagateAtLaunch: true,
        },
      ],
    }, { parent: this });

    // Create scaling policies
    const scaleUpPolicy = new aws.autoscaling.Policy(`${name}-scale-up-${args.environmentSuffix}`, {
      scalingAdjustment: 1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: autoScalingGroup.name,
    }, { parent: this });

    const scaleDownPolicy = new aws.autoscaling.Policy(`${name}-scale-down-${args.environmentSuffix}`, {
      scalingAdjustment: -1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: autoScalingGroup.name,
    }, { parent: this });

    this.autoScalingGroupName = autoScalingGroup.name;
    this.targetGroupArn = targetGroup.arn;

    this.registerOutputs({
      autoScalingGroupName: this.autoScalingGroupName,
      targetGroupArn: this.targetGroupArn,
    });
  }
}
```

## lib/alb-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface AlbStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string[]>;
  targetGroupArn: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class AlbStack extends pulumi.ComponentResource {
  public readonly albArn: pulumi.Output<string>;
  public readonly albDns: pulumi.Output<string>;

  constructor(name: string, args: AlbStackArgs, opts?: ResourceOptions) {
    super('tap:alb:AlbStack', name, args, opts);

    // Create Security Group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(`${name}-alb-sg-${args.environmentSuffix}`, {
      vpcId: args.vpcId,
      description: 'Security group for Application Load Balancer',
      ingress: [{
        protocol: 'tcp',
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow HTTP from anywhere',
      }],
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      }],
      tags: {
        Name: `${name}-alb-sg-${args.environmentSuffix}`,
        ...args.tags,
      },
    }, { parent: this });

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(`${name}-alb-${args.environmentSuffix}`, {
      name: `${name}-alb-${args.environmentSuffix}`.substring(0, 32), // ALB name limited to 32 chars
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: args.publicSubnetIds,
      enableDeletionProtection: false,
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      tags: {
        Name: `${name}-alb-${args.environmentSuffix}`,
        ...args.tags,
      },
    }, { parent: this });

    // Create ALB listener
    new aws.lb.Listener(`${name}-listener-${args.environmentSuffix}`, {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultActions: [{
        type: 'forward',
        targetGroupArn: args.targetGroupArn,
      }],
      tags: args.tags,
    }, { parent: this });

    // Enable ALB access logs
    const albLogBucket = new aws.s3.Bucket(`${name}-alb-logs-${args.environmentSuffix}`, {
      acl: 'private',
      lifecycleRules: [{
        enabled: true,
        expiration: {
          days: 30,
        },
      }],
      tags: {
        Name: `${name}-alb-logs-${args.environmentSuffix}`,
        ...args.tags,
      },
    }, { parent: this });

    // Get AWS ELB service account for the region
    const elbServiceAccount = aws.elb.getServiceAccount({});

    new aws.s3.BucketPolicy(`${name}-alb-log-policy-${args.environmentSuffix}`, {
      bucket: albLogBucket.id,
      policy: pulumi.all([albLogBucket.arn, elbServiceAccount]).apply(([bucketArn, account]) => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            AWS: account.arn,
          },
          Action: 's3:PutObject',
          Resource: `${bucketArn}/*`,
        }],
      })),
    }, { parent: this });

    // Update ALB to enable access logs
    new aws.lb.LoadBalancer(`${name}-alb-with-logs-${args.environmentSuffix}`, {
      name: alb.name,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: args.publicSubnetIds,
      enableDeletionProtection: false,
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      accessLogs: {
        bucket: albLogBucket.bucket,
        enabled: true,
        prefix: 'alb-logs',
      },
      tags: {
        Name: `${name}-alb-${args.environmentSuffix}`,
        ...args.tags,
      },
    }, { parent: this, dependsOn: [albLogBucket] });

    this.albArn = alb.arn;
    this.albDns = alb.dnsName;

    this.registerOutputs({
      albArn: this.albArn,
      albDns: this.albDns,
    });
  }
}
```

## lib/s3-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface S3StackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class S3Stack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;

  constructor(name: string, args: S3StackArgs, opts?: ResourceOptions) {
    super('tap:s3:S3Stack', name, args, opts);

    // Create S3 bucket for static assets
    const staticBucket = new aws.s3.Bucket(`${name}-static-${args.environmentSuffix}`, {
      acl: 'private',
      versioning: {
        enabled: true,
      },
      lifecycleRules: [
        {
          enabled: true,
          noncurrentVersionExpiration: {
            days: 90,
          },
        },
        {
          enabled: true,
          transitions: [{
            days: 30,
            storageClass: 'STANDARD_IA',
          }],
        },
      ],
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      tags: {
        Name: `${name}-static-${args.environmentSuffix}`,
        Purpose: 'Static Assets',
        ...args.tags,
      },
    }, { parent: this });

    // Block public access
    new aws.s3.BucketPublicAccessBlock(`${name}-static-pab-${args.environmentSuffix}`, {
      bucket: staticBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // Create bucket policy for ALB/CloudFront access
    const bucketPolicy = new aws.s3.BucketPolicy(`${name}-static-policy-${args.environmentSuffix}`, {
      bucket: staticBucket.id,
      policy: staticBucket.arn.apply(bucketArn => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontOAI',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudfront.amazonaws.com',
            },
            Action: 's3:GetObject',
            Resource: `${bucketArn}/*`,
            Condition: {
              StringEquals: {
                'AWS:SourceAccount': aws.getCallerIdentity().then(identity => identity.accountId),
              },
            },
          },
          {
            Sid: 'AllowALBAccess',
            Effect: 'Allow',
            Principal: {
              Service: 'elasticloadbalancing.amazonaws.com',
            },
            Action: 's3:GetObject',
            Resource: `${bucketArn}/*`,
          },
        ],
      })),
    }, { parent: this });

    this.bucketName = staticBucket.bucket;
    this.bucketArn = staticBucket.arn;

    this.registerOutputs({
      bucketName: this.bucketName,
      bucketArn: this.bucketArn,
    });
  }
}
```

## lib/cloudwatch-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface CloudWatchStackArgs {
  environmentSuffix: string;
  autoScalingGroupName: pulumi.Output<string>;
  targetGroupArn: pulumi.Output<string>;
  albArn: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class CloudWatchStack extends pulumi.ComponentResource {
  constructor(name: string, args: CloudWatchStackArgs, opts?: ResourceOptions) {
    super('tap:cloudwatch:CloudWatchStack', name, args, opts);

    // SNS Topic for alarms
    const alarmTopic = new aws.sns.Topic(`${name}-alarms-${args.environmentSuffix}`, {
      displayName: `${name} CloudWatch Alarms`,
      tags: {
        Name: `${name}-alarms-${args.environmentSuffix}`,
        ...args.tags,
      },
    }, { parent: this });

    // High CPU Utilization Alarm
    const highCpuAlarm = new aws.cloudwatch.MetricAlarm(`${name}-high-cpu-${args.environmentSuffix}`, {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'This metric monitors EC2 cpu utilization',
      alarmActions: [alarmTopic.arn],
      dimensions: {
        AutoScalingGroupName: args.autoScalingGroupName,
      },
      treatMissingData: 'notBreaching',
      tags: args.tags,
    }, { parent: this });

    // Target Group Unhealthy Hosts Alarm
    const unhealthyTargetsAlarm = new aws.cloudwatch.MetricAlarm(`${name}-unhealthy-targets-${args.environmentSuffix}`, {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'UnHealthyHostCount',
      namespace: 'AWS/ApplicationELB',
      period: 60,
      statistic: 'Average',
      threshold: 0,
      alarmDescription: 'Alert when targets become unhealthy',
      alarmActions: [alarmTopic.arn],
      dimensions: {
        TargetGroup: args.targetGroupArn.apply(arn => arn.split(':').pop()?.split('/')[1] || ''),
        LoadBalancer: args.albArn.apply(arn => arn.split(':').pop()?.split('/').slice(1, 4).join('/') || ''),
      },
      treatMissingData: 'notBreaching',
      tags: args.tags,
    }, { parent: this });

    // ALB Request Count Alarm
    const highRequestCountAlarm = new aws.cloudwatch.MetricAlarm(`${name}-high-requests-${args.environmentSuffix}`, {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'RequestCount',
      namespace: 'AWS/ApplicationELB',
      period: 60,
      statistic: 'Sum',
      threshold: 10000,
      alarmDescription: 'Alert on high request count',
      alarmActions: [alarmTopic.arn],
      dimensions: {
        LoadBalancer: args.albArn.apply(arn => arn.split(':').pop()?.split('/').slice(1, 4).join('/') || ''),
      },
      treatMissingData: 'notBreaching',
      tags: args.tags,
    }, { parent: this });

    // ALB Target Response Time Alarm
    const highLatencyAlarm = new aws.cloudwatch.MetricAlarm(`${name}-high-latency-${args.environmentSuffix}`, {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'TargetResponseTime',
      namespace: 'AWS/ApplicationELB',
      period: 300,
      statistic: 'Average',
      threshold: 2,
      alarmDescription: 'Alert on high response time',
      alarmActions: [alarmTopic.arn],
      dimensions: {
        LoadBalancer: args.albArn.apply(arn => arn.split(':').pop()?.split('/').slice(1, 4).join('/') || ''),
      },
      treatMissingData: 'notBreaching',
      tags: args.tags,
    }, { parent: this });

    // CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(`${name}-dashboard-${args.environmentSuffix}`, {
      dashboardName: `${name}-${args.environmentSuffix}`,
      dashboardBody: pulumi.all([
        args.autoScalingGroupName,
        args.targetGroupArn,
        args.albArn,
      ]).apply(([asgName, tgArn, albArn]) => JSON.stringify({
        widgets: [
          {
            type: 'metric',
            x: 0,
            y: 0,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                ['AWS/EC2', 'CPUUtilization', { stat: 'Average', label: 'Average CPU' }],
                ['.', '.', { stat: 'Maximum', label: 'Max CPU' }],
              ],
              view: 'timeSeries',
              stacked: false,
              region: 'us-east-2',
              title: 'EC2 CPU Utilization',
              period: 300,
              dimensions: {
                AutoScalingGroupName: asgName,
              },
            },
          },
          {
            type: 'metric',
            x: 12,
            y: 0,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                ['AWS/ApplicationELB', 'TargetResponseTime', { stat: 'Average' }],
                ['.', 'RequestCount', { stat: 'Sum', yAxis: 'right' }],
              ],
              view: 'timeSeries',
              stacked: false,
              region: 'us-east-2',
              title: 'ALB Performance',
              period: 300,
              dimensions: {
                LoadBalancer: albArn.split(':').pop()?.split('/').slice(1, 4).join('/') || '',
              },
            },
          },
          {
            type: 'metric',
            x: 0,
            y: 6,
            width: 12,
            height: 6,
            properties: {
              metrics: [
                ['AWS/ApplicationELB', 'HealthyHostCount', { stat: 'Average', label: 'Healthy' }],
                ['.', 'UnHealthyHostCount', { stat: 'Average', label: 'Unhealthy' }],
              ],
              view: 'timeSeries',
              stacked: false,
              region: 'us-east-2',
              title: 'Target Health',
              period: 60,
              dimensions: {
                TargetGroup: tgArn.split(':').pop()?.split('/')[1] || '',
                LoadBalancer: albArn.split(':').pop()?.split('/').slice(1, 4).join('/') || '',
              },
            },
          },
        ],
      })),
    }, { parent: this });

    this.registerOutputs({});
  }
}
```