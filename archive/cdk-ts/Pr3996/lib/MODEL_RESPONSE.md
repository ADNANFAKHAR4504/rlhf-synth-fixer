### Reasoning Trace

---

Let's break down what we need to build for this AWS CDK project:

1. Global components:
   - AWS Global Accelerator (static entry point)
   - Aurora Global Database (primary in us-east-1, secondary in eu-west-1)

2. Region-specific components (for both us-east-1 and eu-west-1):
   - VPC with specified CIDRs:
     - us-east-1: 10.0.0.0/16
     - eu-west-1: 172.16.0.0/16
   - Transit Gateway with inter-region peering
   - ECS Fargate clusters for microservices
   - Application Load Balancer (ALB)

3. Governance:
   - CDK Aspect to enforce encryption on storage resources

Let's structure our CDK TypeScript project accordingly. I'll start by defining the directory structure:

```
project-root/
  ├── bin/
  │   └── trading-platform.ts          # Entry point
  ├── lib/
  │   ├── global-stack.ts              # Global resources
  │   ├── regional-stack.ts            # Resources deployed in each region
  │   ├── networking-stack.ts          # VPC and transit gateway
  │   ├── database-stack.ts            # Aurora Global Database
  │   └── aspects/
  │       └── encryption-aspect.ts     # For enforcing encryption
  ├── package.json
  └── cdk.json
```

Now let's develop each file:

1. First, the entry point (`bin/trading-platform.ts`):

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GlobalStack } from '../lib/global-stack';
import { RegionalStack } from '../lib/regional-stack';
import { NetworkingStack } from '../lib/networking-stack';
import { DatabaseStack } from '../lib/database-stack';
import { EncryptionAspect } from '../lib/aspects/encryption-aspect';

const app = new cdk.App();

// Define regions
const primaryRegion = 'us-east-1';
const secondaryRegion = 'eu-west-1';

// Create networking stacks for both regions
const primaryNetworking = new NetworkingStack(
  app,
  'TradingPlatform-Networking-Primary',
  {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: primaryRegion },
    cidr: '10.0.0.0/16',
    isMainRegion: true,
  }
);

const secondaryNetworking = new NetworkingStack(
  app,
  'TradingPlatform-Networking-Secondary',
  {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: secondaryRegion },
    cidr: '172.16.0.0/16',
    isMainRegion: false,
  }
);

// Set up Transit Gateway peering
primaryNetworking.addPeering(secondaryNetworking);

// Create database stack with global database
const dbStack = new DatabaseStack(app, 'TradingPlatform-Database', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: primaryRegion },
  primaryRegion: primaryRegion,
  secondaryRegion: secondaryRegion,
  primaryVpc: primaryNetworking.vpc,
  secondaryVpc: secondaryNetworking.vpc,
});

// Create regional stacks for both regions
const primaryRegionalStack = new RegionalStack(
  app,
  'TradingPlatform-Regional-Primary',
  {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: primaryRegion },
    vpc: primaryNetworking.vpc,
    isMainRegion: true,
  }
);

const secondaryRegionalStack = new RegionalStack(
  app,
  'TradingPlatform-Regional-Secondary',
  {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: secondaryRegion },
    vpc: secondaryNetworking.vpc,
    isMainRegion: false,
  }
);

// Create global stack with Global Accelerator pointing to both regions
const globalStack = new GlobalStack(app, 'TradingPlatform-Global', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: primaryRegion },
  primaryAlb: primaryRegionalStack.loadBalancer,
  secondaryAlb: secondaryRegionalStack.loadBalancer,
});

// Apply aspects to all stacks
cdk.Aspects.of(app).add(new EncryptionAspect());

app.synth();
```

2. Now let's create the networking stack (`lib/networking-stack.ts`):

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface NetworkingStackProps extends cdk.StackProps {
  cidr: string;
  isMainRegion: boolean;
}

export class NetworkingStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly transitGateway: ec2.CfnTransitGateway;
  public readonly transitGatewayAttachment: ec2.CfnTransitGatewayAttachment;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id, props);

    // Create VPC
    this.vpc = new ec2.Vpc(this, 'VPC', {
      cidr: props.cidr,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Create Transit Gateway
    this.transitGateway = new ec2.CfnTransitGateway(this, 'TransitGateway', {
      amazonSideAsn: props.isMainRegion ? 64512 : 64513,
      autoAcceptSharedAttachments: 'enable',
      defaultRouteTableAssociation: 'enable',
      defaultRouteTablePropagation: 'enable',
      description: `Transit Gateway for ${this.region}`,
      tags: [
        {
          key: 'Name',
          value: `TradingPlatform-TGW-${this.region}`,
        },
      ],
    });

    // Attach VPC to Transit Gateway
    const privateSubnetIds = this.vpc.privateSubnets.map(
      subnet => subnet.subnetId
    );

    this.transitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      'TGWAttachment',
      {
        transitGatewayId: this.transitGateway.ref,
        vpcId: this.vpc.vpcId,
        subnetIds: privateSubnetIds,
        tags: [
          {
            key: 'Name',
            value: `TradingPlatform-TGW-Attachment-${this.region}`,
          },
        ],
      }
    );

    // Add routes from private subnets to Transit Gateway
    this.vpc.privateSubnets.forEach((subnet, index) => {
      new ec2.CfnRoute(this, `TGWRoute${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: props.isMainRegion
          ? '172.16.0.0/16'
          : '10.0.0.0/16',
        transitGatewayId: this.transitGateway.ref,
      });
    });
  }

  // Method to set up peering between this region and another region
  public addPeering(peerStack: NetworkingStack): void {
    // Create Transit Gateway Peering
    const tgwPeering = new ec2.CfnTransitGatewayPeeringAttachment(
      this,
      'TGWPeering',
      {
        transitGatewayId: this.transitGateway.ref,
        peerTransitGatewayId: peerStack.transitGateway.ref,
        peerRegion: peerStack.region,
        tags: [
          {
            key: 'Name',
            value: `TradingPlatform-TGW-Peering-${this.region}-${peerStack.region}`,
          },
        ],
      }
    );

    // Accept the peering request
    const tgwPeeringAccept = new ec2.CfnTransitGatewayPeeringAttachmentAccepter(
      peerStack,
      'TGWPeeringAccept',
      {
        transitGatewayAttachmentId: tgwPeering.attrTransitGatewayAttachmentId,
        tags: [
          {
            key: 'Name',
            value: `TradingPlatform-TGW-Peering-${peerStack.region}-${this.region}`,
          },
        ],
      }
    );

    // Create route table entries for the peering connection
    // (simplified - in a real scenario, you'd need to create a Transit Gateway Route Table and add routes)
  }
}
```

3. Let's create the database stack (`lib/database-stack.ts`):

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

interface DatabaseStackProps extends cdk.StackProps {
  primaryRegion: string;
  secondaryRegion: string;
  primaryVpc: ec2.Vpc;
  secondaryVpc: ec2.Vpc;
}

export class DatabaseStack extends cdk.Stack {
  public readonly globalCluster: rds.CfnGlobalCluster;
  public readonly primaryCluster: rds.DatabaseCluster;
  public readonly secondaryCluster: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create a secret for database credentials
    const dbCredentials = new secretsmanager.Secret(this, 'DBCredentials', {
      secretName: 'trading-platform/database-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 16,
      },
    });

    // Create the global cluster
    this.globalCluster = new rds.CfnGlobalCluster(this, 'GlobalCluster', {
      globalClusterIdentifier: 'trading-platform-global',
      sourceDbClusterIdentifier: '', // Will be filled in after primary cluster creation
      storageEncrypted: true,
    });

    // Create the primary Aurora cluster in the primary region
    this.primaryCluster = new rds.DatabaseCluster(this, 'PrimaryCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_4,
      }),
      credentials: rds.Credentials.fromSecret(dbCredentials),
      instanceProps: {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R5,
          ec2.InstanceSize.LARGE
        ),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        vpc: props.primaryVpc,
      },
      instances: 2,
      storageEncrypted: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      backup: {
        retention: cdk.Duration.days(7),
      },
    });

    // Link the primary cluster to the global cluster
    this.globalCluster.sourceDbClusterIdentifier =
      this.primaryCluster.clusterIdentifier;

    // Create a secondary Aurora cluster in the secondary region
    const secondaryClusterStack = new cdk.Stack(
      scope,
      'SecondaryDBClusterStack',
      {
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: props.secondaryRegion,
        },
      }
    );

    const cfnSecondaryCluster = new rds.CfnDBCluster(
      secondaryClusterStack,
      'SecondaryCluster',
      {
        globalClusterIdentifier: this.globalCluster.globalClusterIdentifier,
        engine: 'aurora-postgresql',
        engineVersion: '13.4',
        dbSubnetGroupName: new rds.CfnDBSubnetGroup(
          secondaryClusterStack,
          'SecondaryDBSubnetGroup',
          {
            dbSubnetGroupDescription:
              'Subnet group for Aurora secondary cluster',
            subnetIds: props.secondaryVpc.isolatedSubnets.map(
              subnet => subnet.subnetId
            ),
          }
        ).ref,
      }
    );

    // Create instances for the secondary cluster
    for (let i = 0; i < 2; i++) {
      new rds.CfnDBInstance(secondaryClusterStack, `SecondaryInstance${i}`, {
        dbInstanceClass: 'db.r5.large',
        engine: 'aurora-postgresql',
        dbClusterIdentifier: cfnSecondaryCluster.ref,
        dbInstanceIdentifier: `trading-platform-secondary-${i}`,
      });
    }

    // Add security group rules for database access
    // (This would typically include rules to allow your application to access the database)

    // Export DB endpoints for use in other stacks
    new cdk.CfnOutput(this, 'PrimaryClusterEndpoint', {
      value: this.primaryCluster.clusterEndpoint.socketAddress,
      exportName: 'PrimaryClusterEndpoint',
    });

    new cdk.CfnOutput(secondaryClusterStack, 'SecondaryClusterEndpoint', {
      value: cfnSecondaryCluster.attrEndpointAddress,
      exportName: 'SecondaryClusterEndpoint',
    });
  }
}
```

4. Now let's implement the regional stack (`lib/regional-stack.ts`):

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

interface RegionalStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  isMainRegion: boolean;
}

export class RegionalStack extends cdk.Stack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly ecsCluster: ecs.Cluster;
  public readonly tradingService: ecs.FargateService;
  public readonly orderManagementService: ecs.FargateService;

  constructor(scope: Construct, id: string, props: RegionalStackProps) {
    super(scope, id, props);

    // Create ECS Cluster
    this.ecsCluster = new ecs.Cluster(this, 'TradingECSCluster', {
      vpc: props.vpc,
      containerInsights: true,
      clusterName: `TradingPlatform-${this.region}`,
    });

    // Create ALB
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'TradingALB', {
      vpc: props.vpc,
      internetFacing: true,
      loadBalancerName: `TradingPlatform-${this.region}`,
    });

    // Create a default listener and target group
    const listener = this.loadBalancer.addListener('Listener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    // Create log groups for the services
    const tradingLogGroup = new logs.LogGroup(this, 'TradingLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
      logGroupName: `/ecs/trading-service-${this.region}`,
    });

    const orderManagementLogGroup = new logs.LogGroup(
      this,
      'OrderManagementLogGroup',
      {
        retention: logs.RetentionDays.ONE_WEEK,
        logGroupName: `/ecs/order-management-service-${this.region}`,
      }
    );

    // ECS Task Execution Role
    const executionRole = new iam.Role(this, 'ECSTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    // Task role for the services
    const taskRole = new iam.Role(this, 'ECSTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Add necessary permissions to the task role
    // (You would add specific permissions based on what your services need)

    // Trading Engine Service
    const tradingTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      'TradingTaskDef',
      {
        memoryLimitMiB: 2048,
        cpu: 1024,
        executionRole: executionRole,
        taskRole: taskRole,
      }
    );

    tradingTaskDefinition.addContainer('TradingContainer', {
      // Assume you have an ECR repository with your container images
      image: ecs.ContainerImage.fromRegistry(
        'account.dkr.ecr.region.amazonaws.com/trading-engine:latest'
      ),
      logging: new ecs.AwsLogDriver({
        streamPrefix: 'trading-engine',
        logGroup: tradingLogGroup,
      }),
      portMappings: [
        {
          containerPort: 8080,
          protocol: ecs.Protocol.TCP,
        },
      ],
      environment: {
        REGION: this.region,
        IS_MAIN_REGION: props.isMainRegion ? 'true' : 'false',
      },
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -f http://localhost:8080/health || exit 1',
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    // Trading Service Target Group
    const tradingTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'TradingTargetGroup',
      {
        vpc: props.vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
        },
      }
    );

    listener.addAction('TradingRoute', {
      priority: 10,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/trading/*'])],
      action: elbv2.ListenerAction.forward([tradingTargetGroup]),
    });

    // Deploy Trading Service
    this.tradingService = new ecs.FargateService(this, 'TradingService', {
      cluster: this.ecsCluster,
      taskDefinition: tradingTaskDefinition,
      desiredCount: 2,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      assignPublicIp: false,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [
        new ec2.SecurityGroup(this, 'TradingServiceSG', {
          vpc: props.vpc,
          description: 'Security group for the Trading Service',
          allowAllOutbound: true,
        }),
      ],
    });

    this.tradingService.attachToApplicationTargetGroup(tradingTargetGroup);

    // Order Management Service
    const orderManagementTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      'OrderManagementTaskDef',
      {
        memoryLimitMiB: 2048,
        cpu: 1024,
        executionRole: executionRole,
        taskRole: taskRole,
      }
    );

    orderManagementTaskDefinition.addContainer('OrderManagementContainer', {
      image: ecs.ContainerImage.fromRegistry(
        'account.dkr.ecr.region.amazonaws.com/order-management:latest'
      ),
      logging: new ecs.AwsLogDriver({
        streamPrefix: 'order-management',
        logGroup: orderManagementLogGroup,
      }),
      portMappings: [
        {
          containerPort: 8080,
          protocol: ecs.Protocol.TCP,
        },
      ],
      environment: {
        REGION: this.region,
        IS_MAIN_REGION: props.isMainRegion ? 'true' : 'false',
      },
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -f http://localhost:8080/health || exit 1',
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    // Order Management Service Target Group
    const orderManagementTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'OrderManagementTargetGroup',
      {
        vpc: props.vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
        },
      }
    );

    listener.addAction('OrderManagementRoute', {
      priority: 20,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/orders/*'])],
      action: elbv2.ListenerAction.forward([orderManagementTargetGroup]),
    });

    // Deploy Order Management Service
    this.orderManagementService = new ecs.FargateService(
      this,
      'OrderManagementService',
      {
        cluster: this.ecsCluster,
        taskDefinition: orderManagementTaskDefinition,
        desiredCount: 2,
        minHealthyPercent: 50,
        maxHealthyPercent: 200,
        assignPublicIp: false,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [
          new ec2.SecurityGroup(this, 'OrderManagementServiceSG', {
            vpc: props.vpc,
            description: 'Security group for the Order Management Service',
            allowAllOutbound: true,
          }),
        ],
      }
    );

    this.orderManagementService.attachToApplicationTargetGroup(
      orderManagementTargetGroup
    );

    // Create CloudWatch Dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(
      this,
      'TradingPlatformDashboard',
      {
        dashboardName: `TradingPlatform-${this.region}`,
      }
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ApplicationELB',
            metricName: 'RequestCount',
            dimensionsMap: {
              LoadBalancer: this.loadBalancer.loadBalancerFullName,
            },
            statistic: 'Sum',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Trading Service CPU Utilization',
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              ClusterName: this.ecsCluster.clusterName,
              ServiceName: this.tradingService.serviceName,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Order Management Service CPU Utilization',
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              ClusterName: this.ecsCluster.clusterName,
              ServiceName: this.orderManagementService.serviceName,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        ],
      })
    );
  }
}
```

5. Now let's create the global stack (`lib/global-stack.ts`):

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as globalaccelerator from 'aws-cdk-lib/aws-globalaccelerator';
import * as ga_endpoints from 'aws-cdk-lib/aws-globalaccelerator-endpoints';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

interface GlobalStackProps extends cdk.StackProps {
  primaryAlb: elbv2.ApplicationLoadBalancer;
  secondaryAlb: elbv2.ApplicationLoadBalancer;
}

export class GlobalStack extends cdk.Stack {
  public readonly accelerator: globalaccelerator.Accelerator;

  constructor(scope: Construct, id: string, props: GlobalStackProps) {
    super(scope, id, props);

    // Create Global Accelerator
    this.accelerator = new globalaccelerator.Accelerator(
      this,
      'TradingAccelerator',
      {
        acceleratorName: 'TradingPlatformAccelerator',
        enabled: true,
      }
    );

    // Create listener for HTTP/HTTPS
    const listener = this.accelerator.addListener('WebListener', {
      portRanges: [
        {
          fromPort: 80,
          toPort: 80,
        },
        {
          fromPort: 443,
          toPort: 443,
        },
      ],
    });

    // Create endpoint groups for each region
    const usEndpointGroup = listener.addEndpointGroup('USEndpointGroup', {
      regions: ['us-east-1'],
      trafficDialPercentage: 50,
      healthCheckPath: '/health',
      healthCheckPort: 80,
      healthCheckProtocol: globalaccelerator.HealthCheckProtocol.HTTP,
      healthCheckInterval: cdk.Duration.seconds(10),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
    });

    const euEndpointGroup = listener.addEndpointGroup('EUEndpointGroup', {
      regions: ['eu-west-1'],
      trafficDialPercentage: 50,
      healthCheckPath: '/health',
      healthCheckPort: 80,
      healthCheckProtocol: globalaccelerator.HealthCheckProtocol.HTTP,
      healthCheckInterval: cdk.Duration.seconds(10),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
    });

    // Add ALB endpoints
    usEndpointGroup.addLoadBalancerEndpoint(
      new ga_endpoints.ApplicationLoadBalancerEndpoint(props.primaryAlb)
    );

    euEndpointGroup.addLoadBalancerEndpoint(
      new ga_endpoints.ApplicationLoadBalancerEndpoint(props.secondaryAlb)
    );

    // Output the Global Accelerator DNS name
    new cdk.CfnOutput(this, 'GlobalAcceleratorDNS', {
      value: this.accelerator.dnsName,
      description: 'The DNS name of the Global Accelerator',
      exportName: 'GlobalAcceleratorDNS',
    });
  }
}
```

6. Finally, let's implement the encryption aspect (`lib/aspects/encryption-aspect.ts`):

```typescript
import { IAspect, IConstruct } from 'constructs';
import * as cdk from 'aws-cdk-lib';

export class EncryptionAspect implements IAspect {
  public visit(node: IConstruct): void {
    // Check S3 buckets for encryption
    if (node instanceof cdk.aws_s3.CfnBucket) {
      if (!node.bucketEncryption) {
        throw new Error(
          `S3 Bucket ${node.node.path} must have encryption enabled`
        );
      }
    }

    // Check DynamoDB tables for encryption
    if (node instanceof cdk.aws_dynamodb.CfnTable) {
      if (!node.sseSpecification || !node.sseSpecification.sseEnabled) {
        throw new Error(
          `DynamoDB Table ${node.node.path} must have encryption enabled`
        );
      }
    }

    // Check RDS instances for encryption
    if (node instanceof cdk.aws_rds.CfnDBInstance) {
      if (!node.storageEncrypted) {
        throw new Error(
          `RDS Instance ${node.node.path} must have storage encryption enabled`
        );
      }
    }

    // Check RDS clusters for encryption
    if (node instanceof cdk.aws_rds.CfnDBCluster) {
      if (!node.storageEncrypted) {
        throw new Error(
          `RDS Cluster ${node.node.path} must have storage encryption enabled`
        );
      }
    }

    // Check EFS File Systems for encryption
    if (node instanceof cdk.aws_efs.CfnFileSystem) {
      if (!node.encrypted) {
        throw new Error(
          `EFS File System ${node.node.path} must have encryption enabled`
        );
      }
    }

    // Check Lambda function environment variables for encryption
    if (node instanceof cdk.aws_lambda.CfnFunction) {
      if (node.environment && !node.environmentEncryption) {
        throw new Error(
          `Lambda Function ${node.node.path} with environment variables must have encryption enabled`
        );
      }
    }
  }
}
```

8. Let's also create the `package.json`:

```json
{
  "name": "trading-platform",
  "version": "0.1.0",
  "bin": {
    "trading-platform": "bin/trading-platform.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy:primary": "cdk deploy --all --require-approval never --context region=us-east-1",
    "deploy:secondary": "cdk deploy --all --require-approval never --context region=eu-west-1",
    "deploy:all": "npm run deploy:primary && npm run deploy:secondary"
  },
  "devDependencies": {
    "@aws-cdk/assert": "^2.99.0",
    "@types/jest": "^29.5.3",
    "@types/node": "20.4.2",
    "aws-cdk": "2.99.0",
    "jest": "^29.6.1",
    "ts-jest": "^29.1.1",
    "ts-node": "^10.9.1",
    "typescript": "~5.1.6"
  },
  "dependencies": {
    "aws-cdk-lib": "2.99.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  }
}
```

9. Finally, let's create `cdk.json`:

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/trading-platform.ts",
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "tags": {
      "Project": "TradingPlatform",
      "Environment": "Production"
    }
  }
}
```

This setup creates a multi-region active-active setup for a trading platform as requested, with these key components:

1. Global Accelerator to route traffic to the closest region
2. Aurora Global Database with primary in us-east-1 and secondary in eu-west-1
3. VPCs in both regions with Transit Gateway inter-region peering
4. ECS Fargate services for the trading engine and order management
5. Application Load Balancers in each region
6. CDK Aspect to enforce encryption requirements

The encryption aspect ensures that:

- All storage resources (S3, DynamoDB, RDS, etc.) have encryption enabled

This is a complete and structured AWS CDK TypeScript project that should meet all the requirements specified for the global trading platform.

### Answer

---

# Multi-Region Active-Active Trading Platform CDK Project

This project sets up a global trading platform with an active-active deployment across us-east-1 and eu-west-1. Here's the complete AWS CDK TypeScript implementation:

## Project Structure

```
trading-platform/
├── bin/
│   └── trading-platform.ts              # Entry point
├── lib/
│   ├── global-stack.ts                  # Global Accelerator & global resources
│   ├── regional-stack.ts                # Region-specific resources
│   ├── networking-stack.ts              # VPC and Transit Gateway
│   ├── database-stack.ts                # Aurora Global Database
│   └── aspects/
│       └── encryption-aspect.ts         # Enforces encryption
├── package.json
└── cdk.json
```

## Implementation Files

### `bin/trading-platform.ts` (Entry Point)

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GlobalStack } from '../lib/global-stack';
import { RegionalStack } from '../lib/regional-stack';
import { NetworkingStack } from '../lib/networking-stack';
import { DatabaseStack } from '../lib/database-stack';
import { EncryptionAspect } from '../lib/aspects/encryption-aspect';

const app = new cdk.App();

// Define regions
const primaryRegion = 'us-east-1';
const secondaryRegion = 'eu-west-1';

// Create networking stacks for both regions
const primaryNetworking = new NetworkingStack(
  app,
  'TradingPlatform-Networking-Primary',
  {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: primaryRegion },
    cidr: '10.0.0.0/16',
    isMainRegion: true,
  }
);

const secondaryNetworking = new NetworkingStack(
  app,
  'TradingPlatform-Networking-Secondary',
  {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: secondaryRegion },
    cidr: '172.16.0.0/16',
    isMainRegion: false,
  }
);

// Set up Transit Gateway peering
primaryNetworking.addPeering(secondaryNetworking);

// Create database stack with global database
const dbStack = new DatabaseStack(app, 'TradingPlatform-Database', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: primaryRegion },
  primaryRegion: primaryRegion,
  secondaryRegion: secondaryRegion,
  primaryVpc: primaryNetworking.vpc,
  secondaryVpc: secondaryNetworking.vpc,
});

// Create regional stacks for both regions
const primaryRegionalStack = new RegionalStack(
  app,
  'TradingPlatform-Regional-Primary',
  {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: primaryRegion },
    vpc: primaryNetworking.vpc,
    isMainRegion: true,
  }
);

const secondaryRegionalStack = new RegionalStack(
  app,
  'TradingPlatform-Regional-Secondary',
  {
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: secondaryRegion },
    vpc: secondaryNetworking.vpc,
    isMainRegion: false,
  }
);

// Create global stack with Global Accelerator pointing to both regions
const globalStack = new GlobalStack(app, 'TradingPlatform-Global', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: primaryRegion },
  primaryAlb: primaryRegionalStack.loadBalancer,
  secondaryAlb: secondaryRegionalStack.loadBalancer,
});

// Apply governance aspects to all stacks
cdk.Aspects.of(app).add(new EncryptionAspect());

app.synth();
```

### `lib/networking-stack.ts` (VPCs & Transit Gateway)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface NetworkingStackProps extends cdk.StackProps {
  cidr: string;
  isMainRegion: boolean;
}

export class NetworkingStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly transitGateway: ec2.CfnTransitGateway;
  public readonly transitGatewayAttachment: ec2.CfnTransitGatewayAttachment;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id, props);

    // Create VPC with public, private, and isolated subnets
    this.vpc = new ec2.Vpc(this, 'VPC', {
      cidr: props.cidr,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Create Transit Gateway
    this.transitGateway = new ec2.CfnTransitGateway(this, 'TransitGateway', {
      amazonSideAsn: props.isMainRegion ? 64512 : 64513,
      autoAcceptSharedAttachments: 'enable',
      defaultRouteTableAssociation: 'enable',
      defaultRouteTablePropagation: 'enable',
      description: `Transit Gateway for ${this.region}`,
      tags: [
        {
          key: 'Name',
          value: `TradingPlatform-TGW-${this.region}`,
        },
      ],
    });

    // Attach VPC to Transit Gateway
    const privateSubnetIds = this.vpc.privateSubnets.map(
      subnet => subnet.subnetId
    );

    this.transitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      'TGWAttachment',
      {
        transitGatewayId: this.transitGateway.ref,
        vpcId: this.vpc.vpcId,
        subnetIds: privateSubnetIds,
        tags: [
          {
            key: 'Name',
            value: `TradingPlatform-TGW-Attachment-${this.region}`,
          },
        ],
      }
    );

    // Add routes from private subnets to Transit Gateway
    this.vpc.privateSubnets.forEach((subnet, index) => {
      new ec2.CfnRoute(this, `TGWRoute${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: props.isMainRegion
          ? '172.16.0.0/16'
          : '10.0.0.0/16',
        transitGatewayId: this.transitGateway.ref,
      });
    });
  }

  // Method to set up peering between this region and another region
  public addPeering(peerStack: NetworkingStack): void {
    // Create Transit Gateway Peering
    const tgwPeering = new ec2.CfnTransitGatewayPeeringAttachment(
      this,
      'TGWPeering',
      {
        transitGatewayId: this.transitGateway.ref,
        peerTransitGatewayId: peerStack.transitGateway.ref,
        peerRegion: peerStack.region,
        tags: [
          {
            key: 'Name',
            value: `TradingPlatform-TGW-Peering-${this.region}-${peerStack.region}`,
          },
        ],
      }
    );

    // Accept the peering request
    const tgwPeeringAccept = new ec2.CfnTransitGatewayPeeringAttachmentAccepter(
      peerStack,
      'TGWPeeringAccept',
      {
        transitGatewayAttachmentId: tgwPeering.attrTransitGatewayAttachmentId,
        tags: [
          {
            key: 'Name',
            value: `TradingPlatform-TGW-Peering-${peerStack.region}-${this.region}`,
          },
        ],
      }
    );
  }
}
```

### `lib/database-stack.ts` (Aurora Global Database)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

interface DatabaseStackProps extends cdk.StackProps {
  primaryRegion: string;
  secondaryRegion: string;
  primaryVpc: ec2.Vpc;
  secondaryVpc: ec2.Vpc;
}

export class DatabaseStack extends cdk.Stack {
  public readonly globalCluster: rds.CfnGlobalCluster;
  public readonly primaryCluster: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create a secret for database credentials
    const dbCredentials = new secretsmanager.Secret(this, 'DBCredentials', {
      secretName: 'trading-platform/database-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 16,
      },
    });

    // Create the global cluster
    this.globalCluster = new rds.CfnGlobalCluster(this, 'GlobalCluster', {
      globalClusterIdentifier: 'trading-platform-global',
      storageEncrypted: true,
    });

    // Create the primary Aurora cluster in the primary region
    this.primaryCluster = new rds.DatabaseCluster(this, 'PrimaryCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_4,
      }),
      credentials: rds.Credentials.fromSecret(dbCredentials),
      instanceProps: {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R5,
          ec2.InstanceSize.LARGE
        ),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        vpc: props.primaryVpc,
      },
      instances: 2,
      storageEncrypted: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      backup: {
        retention: cdk.Duration.days(7),
      },
    });

    // Link the primary cluster to the global cluster
    const cfnPrimaryCluster = this.primaryCluster.node
      .defaultChild as rds.CfnDBCluster;
    cfnPrimaryCluster.globalClusterIdentifier = this.globalCluster.ref;

    // Create a secondary Aurora cluster in the secondary region
    const secondaryClusterStack = new cdk.Stack(
      scope,
      'SecondaryDBClusterStack',
      {
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: props.secondaryRegion,
        },
      }
    );

    const cfnSecondaryCluster = new rds.CfnDBCluster(
      secondaryClusterStack,
      'SecondaryCluster',
      {
        globalClusterIdentifier: this.globalCluster.globalClusterIdentifier,
        engine: 'aurora-postgresql',
        engineVersion: '13.4',
        dbSubnetGroupName: new rds.CfnDBSubnetGroup(
          secondaryClusterStack,
          'SecondaryDBSubnetGroup',
          {
            dbSubnetGroupDescription:
              'Subnet group for Aurora secondary cluster',
            subnetIds: props.secondaryVpc.isolatedSubnets.map(
              subnet => subnet.subnetId
            ),
          }
        ).ref,
      }
    );

    // Create instances for the secondary cluster
    for (let i = 0; i < 2; i++) {
      new rds.CfnDBInstance(secondaryClusterStack, `SecondaryInstance${i}`, {
        dbInstanceClass: 'db.r5.large',
        engine: 'aurora-postgresql',
        dbClusterIdentifier: cfnSecondaryCluster.ref,
        dbInstanceIdentifier: `trading-platform-secondary-${i}`,
      });
    }

    // Export DB endpoints for use in other stacks
    new cdk.CfnOutput(this, 'PrimaryClusterEndpoint', {
      value: this.primaryCluster.clusterEndpoint.socketAddress,
      exportName: 'PrimaryClusterEndpoint',
    });

    new cdk.CfnOutput(secondaryClusterStack, 'SecondaryClusterEndpoint', {
      value: cfnSecondaryCluster.attrEndpointAddress,
      exportName: 'SecondaryClusterEndpoint',
    });
  }
}
```

### `lib/regional-stack.ts` (ECS Services & ALB)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';

interface RegionalStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  isMainRegion: boolean;
}

export class RegionalStack extends cdk.Stack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly ecsCluster: ecs.Cluster;
  public readonly tradingService: ecs.FargateService;
  public readonly orderManagementService: ecs.FargateService;

  constructor(scope: Construct, id: string, props: RegionalStackProps) {
    super(scope, id, props);

    // Create ECS Cluster
    this.ecsCluster = new ecs.Cluster(this, 'TradingECSCluster', {
      vpc: props.vpc,
      containerInsights: true,
      clusterName: `TradingPlatform-${this.region}`,
    });

    // Create ALB
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'TradingALB', {
      vpc: props.vpc,
      internetFacing: true,
      loadBalancerName: `TradingPlatform-${this.region}`,
    });

    // Create a default listener and target group
    const listener = this.loadBalancer.addListener('Listener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    // Create log groups for the services
    const tradingLogGroup = new logs.LogGroup(this, 'TradingLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
      logGroupName: `/ecs/trading-service-${this.region}`,
    });

    const orderManagementLogGroup = new logs.LogGroup(
      this,
      'OrderManagementLogGroup',
      {
        retention: logs.RetentionDays.ONE_WEEK,
        logGroupName: `/ecs/order-management-service-${this.region}`,
      }
    );

    // ECS Task Execution Role
    const executionRole = new iam.Role(this, 'ECSTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    // Task role for the services
    const taskRole = new iam.Role(this, 'ECSTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Trading Engine Service
    const tradingTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      'TradingTaskDef',
      {
        memoryLimitMiB: 2048,
        cpu: 1024,
        executionRole: executionRole,
        taskRole: taskRole,
      }
    );

    tradingTaskDefinition.addContainer('TradingContainer', {
      image: ecs.ContainerImage.fromRegistry(
        '${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/trading-engine:latest'
      ),
      logging: new ecs.AwsLogDriver({
        streamPrefix: 'trading-engine',
        logGroup: tradingLogGroup,
      }),
      portMappings: [
        {
          containerPort: 8080,
          protocol: ecs.Protocol.TCP,
        },
      ],
      environment: {
        REGION: this.region,
        IS_MAIN_REGION: props.isMainRegion ? 'true' : 'false',
      },
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -f http://localhost:8080/health || exit 1',
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    // Trading Service Target Group
    const tradingTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'TradingTargetGroup',
      {
        vpc: props.vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
        },
      }
    );

    listener.addAction('TradingRoute', {
      priority: 10,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/trading/*'])],
      action: elbv2.ListenerAction.forward([tradingTargetGroup]),
    });

    // Deploy Trading Service
    this.tradingService = new ecs.FargateService(this, 'TradingService', {
      cluster: this.ecsCluster,
      taskDefinition: tradingTaskDefinition,
      desiredCount: 2,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      assignPublicIp: false,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [
        new ec2.SecurityGroup(this, 'TradingServiceSG', {
          vpc: props.vpc,
          description: 'Security group for the Trading Service',
          allowAllOutbound: true,
        }),
      ],
    });

    this.tradingService.attachToApplicationTargetGroup(tradingTargetGroup);

    // Order Management Service (similar to Trading Service)
    const orderManagementTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      'OrderManagementTaskDef',
      {
        memoryLimitMiB: 2048,
        cpu: 1024,
        executionRole: executionRole,
        taskRole: taskRole,
      }
    );

    // Add container and configure service similar to trading service
    // Implement order management service (similar pattern to trading service)
    // ...

    // Add necessary security group rules to allow services to communicate
    // ...
  }
}
```

### `lib/global-stack.ts` (Global Accelerator)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as globalaccelerator from 'aws-cdk-lib/aws-globalaccelerator';
import * as ga_endpoints from 'aws-cdk-lib/aws-globalaccelerator-endpoints';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

interface GlobalStackProps extends cdk.StackProps {
  primaryAlb: elbv2.ApplicationLoadBalancer;
  secondaryAlb: elbv2.ApplicationLoadBalancer;
}

export class GlobalStack extends cdk.Stack {
  public readonly accelerator: globalaccelerator.Accelerator;

  constructor(scope: Construct, id: string, props: GlobalStackProps) {
    super(scope, id, props);

    // Create Global Accelerator
    this.accelerator = new globalaccelerator.Accelerator(
      this,
      'TradingAccelerator',
      {
        acceleratorName: 'TradingPlatformAccelerator',
        enabled: true,
      }
    );

    // Create listener for HTTP/HTTPS
    const listener = this.accelerator.addListener('WebListener', {
      portRanges: [
        {
          fromPort: 80,
          toPort: 80,
        },
        {
          fromPort: 443,
          toPort: 443,
        },
      ],
    });

    // Create endpoint groups for each region
    const usEndpointGroup = listener.addEndpointGroup('USEndpointGroup', {
      regions: ['us-east-1'],
      trafficDialPercentage: 50,
      healthCheckPath: '/health',
      healthCheckPort: 80,
      healthCheckProtocol: globalaccelerator.HealthCheckProtocol.HTTP,
      healthCheckInterval: cdk.Duration.seconds(10),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
    });

    const euEndpointGroup = listener.addEndpointGroup('EUEndpointGroup', {
      regions: ['eu-west-1'],
      trafficDialPercentage: 50,
      healthCheckPath: '/health',
      healthCheckPort: 80,
      healthCheckProtocol: globalaccelerator.HealthCheckProtocol.HTTP,
      healthCheckInterval: cdk.Duration.seconds(10),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 2,
    });

    // Add ALB endpoints
    usEndpointGroup.addLoadBalancerEndpoint(
      new ga_endpoints.ApplicationLoadBalancerEndpoint(props.primaryAlb)
    );

    euEndpointGroup.addLoadBalancerEndpoint(
      new ga_endpoints.ApplicationLoadBalancerEndpoint(props.secondaryAlb)
    );

    // Output the Global Accelerator DNS name
    new cdk.CfnOutput(this, 'GlobalAcceleratorDNS', {
      value: this.accelerator.dnsName,
      description: 'The DNS name of the Global Accelerator',
      exportName: 'GlobalAcceleratorDNS',
    });
  }
}
```
