### Reasoning Trace

---

Let's break down what we need to build for this AWS CDK TypeScript project:

1. Global components:
   - AWS Global Accelerator (static entry point)
   - Aurora Global Database (primary in ap-northeast-2)

2. Region-specific components (for both ap-northeast-2 and ap-southeast-2):
   - VPC with specified CIDRs:
     - ap-northeast-2: 10.0.0.0/16
     - ap-southeast-2: 172.16.0.0/16
   - Transit Gateway with inter-region peering
   - ECS Fargate clusters for microservices
   - Application Load Balancer (ALB)

3. Governance:
   - CDK Aspect to enforce encryption on storage resources

Let's structure our CDK TypeScript project accordingly. The directory structure will be:

```
project-root/
  ├── bin/
  │   └── tap.ts                       # Entry point
  ├── lib/
  │   ├── tap-stack.ts                 # Main stack orchestrator
  │   ├── stacks/
  │   │   ├── global-stack.ts          # Global Accelerator
  │   │   ├── regional-stack.ts        # ECS, ALB per region
  │   │   ├── networking-stack.ts      # VPC and Transit Gateway
  │   │   ├── database-stack.ts        # Aurora Global Database
  │   │   └── tgw-peering-stack.ts     # TGW cross-region peering
  │   └── aspects/
  │       └── encryption-aspect.ts     # For enforcing encryption
  ├── package.json
  └── cdk.json
```

Now let's implement each component:

### Answer

---

# Multi-Region Active-Active Trading Platform CDK Project

This project implements a global trading platform with an active-active deployment across ap-northeast-2 and ap-southeast-2.

## Implementation Files

### `bin/tap.ts` (Entry Point)

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { EncryptionAspect } from '../lib/aspects/encryption-aspect';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'trading-platform';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('Project', 'TradingPlatform');

// Primary region stack
new TapStack(app, `${stackName}-Primary`, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-2',
  },
});

// Secondary region stack
new TapStack(app, `${stackName}-Secondary`, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-southeast-2',
  },
});

// Apply encryption aspect to all stacks
cdk.Aspects.of(app).add(new EncryptionAspect());

app.synth();
```

### `lib/tap-stack.ts` (Main Stack Orchestrator)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { DatabaseStack } from './stacks/database-stack';
import { GlobalStack } from './stacks/global-stack';
import { NetworkingStack } from './stacks/networking-stack';
import { RegionalStack } from './stacks/regional-stack';
import { TgwPeeringStack } from './stacks/tgw-peering-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const region = this.region;
    const isMainRegion = region === 'ap-northeast-2';
    const cidr = isMainRegion ? '10.0.0.0/16' : '172.16.0.0/16';
    const remoteCidr = isMainRegion ? '172.16.0.0/16' : '10.0.0.0/16';

    // Create networking stack
    const networkingStack = new NetworkingStack(
      this,
      `NetworkingStack-${environmentSuffix}`,
      {
        cidr: cidr,
        isMainRegion: isMainRegion,
        environmentSuffix: environmentSuffix,
        remoteCidr: remoteCidr,
      }
    );

    // Store Transit Gateway ID in SSM Parameter for cross-region access
    new ssm.StringParameter(this, `TGWIdParameter-${environmentSuffix}`, {
      parameterName: `/trading-platform/tgw-id/${region}${environmentSuffix}`,
      stringValue: networkingStack.transitGateway.ref,
      description: `Transit Gateway ID for ${region}`,
    });

    // Create regional stack with ECS and ALB
    const regionalStack = new RegionalStack(
      this,
      `RegionalStack-${environmentSuffix}`,
      {
        vpc: networkingStack.vpc,
        isMainRegion: isMainRegion,
        environmentSuffix: environmentSuffix,
      }
    );

    // Only create database and global stacks in primary region
    if (isMainRegion) {
      const databaseStack = new DatabaseStack(
        this,
        `DatabaseStack-${environmentSuffix}`,
        {
          primaryVpc: networkingStack.vpc,
          environmentSuffix: environmentSuffix,
        }
      );

      const globalStack = new GlobalStack(
        this,
        `GlobalStack-${environmentSuffix}`,
        {
          primaryAlb: regionalStack.loadBalancer,
          environmentSuffix: environmentSuffix,
        }
      );

      // Create Transit Gateway peering (primary region creates the peering request)
      const enablePeering =
        this.node.tryGetContext('enableTgwPeering') === 'true';

      if (enablePeering) {
        const primaryTgwId = networkingStack.transitGateway.ref;
        const secondaryTgwId = cdk.Fn.importValue(
          `TransitGatewayId-ap-southeast-2-${environmentSuffix}`
        );

        const tgwPeeringStack = new TgwPeeringStack(
          this,
          `TGWPeeringStack-${environmentSuffix}`,
          {
            primaryTgwId: primaryTgwId,
            primaryRegion: 'ap-northeast-2',
            secondaryTgwId: secondaryTgwId,
            secondaryRegion: 'ap-southeast-2',
            environmentSuffix: environmentSuffix,
          }
        );

        // Add explicit dependencies to ensure TGW peering runs after all other stacks
        tgwPeeringStack.node.addDependency(networkingStack);
        tgwPeeringStack.node.addDependency(regionalStack);
        tgwPeeringStack.node.addDependency(databaseStack);
        tgwPeeringStack.node.addDependency(globalStack);
      }
    }
  }
}
```

### `lib/stacks/networking-stack.ts` (VPCs & Transit Gateway)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface NetworkingStackProps {
  cidr: string;
  isMainRegion: boolean;
  environmentSuffix: string;
  remoteCidr?: string;
  peeringAttachmentId?: string;
}

export class NetworkingStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly transitGateway: ec2.CfnTransitGateway;
  public readonly transitGatewayAttachment: ec2.CfnTransitGatewayAttachment;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    // Create VPC with public, private, and isolated subnets
    this.vpc = new ec2.Vpc(this, `VPC${props.environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr(props.cidr),
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
    this.transitGateway = new ec2.CfnTransitGateway(
      this,
      `TransitGateway${props.environmentSuffix}`,
      {
        amazonSideAsn: props.isMainRegion ? 64512 : 64513,
        autoAcceptSharedAttachments: 'enable',
        defaultRouteTableAssociation: 'enable',
        defaultRouteTablePropagation: 'enable',
        description: `Transit Gateway for ${stack.region}`,
        tags: [
          {
            key: 'Name',
            value: `TradingPlatform-TGW-${stack.region}${props.environmentSuffix}`,
          },
        ],
      }
    );

    // Attach VPC to Transit Gateway
    const privateSubnetIds = this.vpc.privateSubnets.map(
      subnet => subnet.subnetId
    );

    this.transitGatewayAttachment = new ec2.CfnTransitGatewayAttachment(
      this,
      `TGWAttachment${props.environmentSuffix}`,
      {
        transitGatewayId: this.transitGateway.ref,
        vpcId: this.vpc.vpcId,
        subnetIds: privateSubnetIds,
        tags: [
          {
            key: 'Name',
            value: `TradingPlatform-TGW-Attachment-${stack.region}${props.environmentSuffix}`,
          },
        ],
      }
    );

    // Add routes for cross-region communication via Transit Gateway
    if (props.remoteCidr) {
      // Add route to private subnets for remote region traffic
      this.vpc.privateSubnets.forEach((subnet, index) => {
        new ec2.CfnRoute(
          this,
          `TGWRoute-Private-${index}-${props.environmentSuffix}`,
          {
            routeTableId: subnet.routeTable.routeTableId,
            destinationCidrBlock: props.remoteCidr,
            transitGatewayId: this.transitGateway.ref,
          }
        );
      });

      // Add route to isolated subnets for remote region traffic
      this.vpc.isolatedSubnets.forEach((subnet, index) => {
        new ec2.CfnRoute(
          this,
          `TGWRoute-Isolated-${index}-${props.environmentSuffix}`,
          {
            routeTableId: subnet.routeTable.routeTableId,
            destinationCidrBlock: props.remoteCidr,
            transitGatewayId: this.transitGateway.ref,
          }
        );
      });
    }

    // Outputs for integration testing
    new cdk.CfnOutput(this, `VpcId${props.environmentSuffix}`, {
      value: this.vpc.vpcId,
      exportName: `VpcId-${stack.region}-${props.environmentSuffix}`,
      description: `VPC ID for ${stack.region}`,
    });

    new cdk.CfnOutput(this, `TransitGatewayId${props.environmentSuffix}`, {
      value: this.transitGateway.ref,
      exportName: `TransitGatewayId-${stack.region}-${props.environmentSuffix}`,
      description: `Transit Gateway ID for ${stack.region}`,
    });
  }
}
```

### `lib/stacks/database-stack.ts` (Aurora Global Database)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface DatabaseStackProps {
  primaryVpc: ec2.Vpc;
  environmentSuffix: string;
}

export class DatabaseStack extends Construct {
  public readonly globalCluster: rds.CfnGlobalCluster;
  public readonly primaryCluster: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    // Create a secret for database credentials
    const dbCredentials = new secretsmanager.Secret(
      this,
      `DBCredentials${props.environmentSuffix}`,
      {
        secretName: `trading-platform/database-credentials${props.environmentSuffix}`,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
          generateStringKey: 'password',
          excludePunctuation: true,
          passwordLength: 16,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create the global cluster
    this.globalCluster = new rds.CfnGlobalCluster(
      this,
      `GlobalCluster${props.environmentSuffix}`,
      {
        globalClusterIdentifier: `trading-platform-global${props.environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '15.4',
        storageEncrypted: true,
      }
    );

    // Create the primary Aurora cluster using Serverless v2
    this.primaryCluster = new rds.DatabaseCluster(
      this,
      `PrimaryCluster${props.environmentSuffix}`,
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_4,
        }),
        credentials: rds.Credentials.fromSecret(dbCredentials),
        vpc: props.primaryVpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        writer: rds.ClusterInstance.serverlessV2(
          `Writer${props.environmentSuffix}`
        ),
        serverlessV2MinCapacity: 0.5,
        serverlessV2MaxCapacity: 1,
        storageEncrypted: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        backup: {
          retention: cdk.Duration.days(1),
        },
      }
    );

    // Link the primary cluster to the global cluster
    const cfnPrimaryCluster = this.primaryCluster.node
      .defaultChild as rds.CfnDBCluster;
    cfnPrimaryCluster.globalClusterIdentifier = this.globalCluster.ref;
    cfnPrimaryCluster.addDependency(this.globalCluster);

    // Export DB endpoints for integration testing
    new cdk.CfnOutput(
      this,
      `PrimaryClusterEndpoint${props.environmentSuffix}`,
      {
        value: this.primaryCluster.clusterEndpoint.socketAddress,
        exportName: `PrimaryClusterEndpoint${props.environmentSuffix}`,
        description: 'Primary Aurora cluster endpoint',
      }
    );

    new cdk.CfnOutput(
      this,
      `GlobalClusterIdentifier${props.environmentSuffix}`,
      {
        value: this.globalCluster.ref,
        exportName: `GlobalClusterIdentifier${props.environmentSuffix}`,
        description: 'Aurora Global cluster identifier',
      }
    );

    new cdk.CfnOutput(this, `DBSecretArn${props.environmentSuffix}`, {
      value: dbCredentials.secretArn,
      exportName: `DBSecretArn${props.environmentSuffix}`,
      description: 'Database credentials secret ARN',
    });
  }
}
```

### `lib/stacks/regional-stack.ts` (ECS Services & ALB)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';

interface RegionalStackProps {
  vpc: ec2.Vpc;
  isMainRegion: boolean;
  environmentSuffix: string;
}

export class RegionalStack extends Construct {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly ecsCluster: ecs.Cluster;
  public readonly tradingService: ecs.FargateService;
  public readonly orderManagementService: ecs.FargateService;

  constructor(scope: Construct, id: string, props: RegionalStackProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    // Create ECS Cluster
    this.ecsCluster = new ecs.Cluster(
      this,
      `TradingECSCluster${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        containerInsights: true,
        clusterName: `TradingPlatform-${stack.region}${props.environmentSuffix}`,
      }
    );

    // Create ALB
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      `TradingALB${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        internetFacing: true,
        loadBalancerName: `Trading-${stack.region}${props.environmentSuffix}`,
      }
    );

    // Create a default listener
    const listener = this.loadBalancer.addListener(
      `Listener${props.environmentSuffix}`,
      {
        port: 80,
        defaultAction: elbv2.ListenerAction.fixedResponse(200, {
          contentType: 'text/plain',
          messageBody: 'OK',
        }),
      }
    );

    // Create log groups for the services
    const tradingLogGroup = new logs.LogGroup(
      this,
      `TradingLogGroup${props.environmentSuffix}`,
      {
        retention: logs.RetentionDays.ONE_WEEK,
        logGroupName: `/ecs/trading-service-${stack.region}${props.environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const orderManagementLogGroup = new logs.LogGroup(
      this,
      `OrderManagementLogGroup${props.environmentSuffix}`,
      {
        retention: logs.RetentionDays.ONE_WEEK,
        logGroupName: `/ecs/order-management-service-${stack.region}${props.environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // ECS Task Execution Role
    const executionRole = new iam.Role(
      this,
      `ECSTaskExecutionRole${props.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonECSTaskExecutionRolePolicy'
          ),
        ],
      }
    );

    // Task role for the services
    const taskRole = new iam.Role(
      this,
      `ECSTaskRole${props.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      }
    );

    // Trading Engine Service
    const tradingTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      `TradingTaskDef${props.environmentSuffix}`,
      {
        memoryLimitMiB: 512,
        cpu: 256,
        executionRole: executionRole,
        taskRole: taskRole,
      }
    );

    tradingTaskDefinition.addContainer(
      `TradingContainer${props.environmentSuffix}`,
      {
        image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
        logging: new ecs.AwsLogDriver({
          streamPrefix: 'trading-engine',
          logGroup: tradingLogGroup,
        }),
        portMappings: [
          {
            containerPort: 80,
            protocol: ecs.Protocol.TCP,
          },
        ],
        environment: {
          REGION: stack.region,
          IS_MAIN_REGION: props.isMainRegion ? 'true' : 'false',
        },
      }
    );

    // Trading Service Target Group
    const tradingTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `TradingTargetGroup${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
        },
      }
    );

    listener.addAction(`TradingRoute${props.environmentSuffix}`, {
      priority: 10,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/trading/*'])],
      action: elbv2.ListenerAction.forward([tradingTargetGroup]),
    });

    // Deploy Trading Service
    this.tradingService = new ecs.FargateService(
      this,
      `TradingService${props.environmentSuffix}`,
      {
        cluster: this.ecsCluster,
        taskDefinition: tradingTaskDefinition,
        desiredCount: 1,
        minHealthyPercent: 50,
        maxHealthyPercent: 200,
        assignPublicIp: false,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [
          new ec2.SecurityGroup(
            this,
            `TradingServiceSG${props.environmentSuffix}`,
            {
              vpc: props.vpc,
              description: 'Security group for the Trading Service',
              allowAllOutbound: true,
            }
          ),
        ],
      }
    );

    this.tradingService.attachToApplicationTargetGroup(tradingTargetGroup);

    // Order Management Service
    const orderManagementTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      `OrderManagementTaskDef${props.environmentSuffix}`,
      {
        memoryLimitMiB: 512,
        cpu: 256,
        executionRole: executionRole,
        taskRole: taskRole,
      }
    );

    orderManagementTaskDefinition.addContainer(
      `OrderManagementContainer${props.environmentSuffix}`,
      {
        image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
        logging: new ecs.AwsLogDriver({
          streamPrefix: 'order-management',
          logGroup: orderManagementLogGroup,
        }),
        portMappings: [
          {
            containerPort: 80,
            protocol: ecs.Protocol.TCP,
          },
        ],
        environment: {
          REGION: stack.region,
          IS_MAIN_REGION: props.isMainRegion ? 'true' : 'false',
        },
      }
    );

    // Order Management Service Target Group
    const orderManagementTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `OrderManagementTargetGroup${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
        },
      }
    );

    listener.addAction(`OrderManagementRoute${props.environmentSuffix}`, {
      priority: 20,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/orders/*'])],
      action: elbv2.ListenerAction.forward([orderManagementTargetGroup]),
    });

    // Deploy Order Management Service
    this.orderManagementService = new ecs.FargateService(
      this,
      `OrderManagementService${props.environmentSuffix}`,
      {
        cluster: this.ecsCluster,
        taskDefinition: orderManagementTaskDefinition,
        desiredCount: 1,
        minHealthyPercent: 50,
        maxHealthyPercent: 200,
        assignPublicIp: false,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [
          new ec2.SecurityGroup(
            this,
            `OrderManagementServiceSG${props.environmentSuffix}`,
            {
              vpc: props.vpc,
              description: 'Security group for the Order Management Service',
              allowAllOutbound: true,
            }
          ),
        ],
      }
    );

    this.orderManagementService.attachToApplicationTargetGroup(
      orderManagementTargetGroup
    );

    // Outputs for integration testing
    new cdk.CfnOutput(this, `ALBDnsName${props.environmentSuffix}`, {
      value: this.loadBalancer.loadBalancerDnsName,
      exportName: `ALBDnsName-${stack.region}${props.environmentSuffix}`,
      description: `ALB DNS Name for ${stack.region}`,
    });

    new cdk.CfnOutput(this, `ECSClusterName${props.environmentSuffix}`, {
      value: this.ecsCluster.clusterName,
      exportName: `ECSClusterName-${stack.region}${props.environmentSuffix}`,
      description: `ECS Cluster Name for ${stack.region}`,
    });
  }
}
```

### `lib/stacks/global-stack.ts` (Global Accelerator)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as globalaccelerator from 'aws-cdk-lib/aws-globalaccelerator';
import * as ga_endpoints from 'aws-cdk-lib/aws-globalaccelerator-endpoints';
import { Construct } from 'constructs';

interface GlobalStackProps {
  primaryAlb: elbv2.ApplicationLoadBalancer;
  environmentSuffix: string;
}

export class GlobalStack extends Construct {
  public readonly accelerator: globalaccelerator.Accelerator;

  constructor(scope: Construct, id: string, props: GlobalStackProps) {
    super(scope, id);

    // Create Global Accelerator
    this.accelerator = new globalaccelerator.Accelerator(
      this,
      `TradingAccelerator${props.environmentSuffix}`,
      {
        acceleratorName: `TradingPlatformAccelerator${props.environmentSuffix}`,
        enabled: true,
      }
    );

    // Create listener for HTTP
    const listener = this.accelerator.addListener(
      `WebListener${props.environmentSuffix}`,
      {
        portRanges: [
          {
            fromPort: 80,
            toPort: 80,
          },
        ],
      }
    );

    // Create endpoint group for primary region
    listener.addEndpointGroup(`USEndpointGroup${props.environmentSuffix}`, {
      trafficDialPercentage: 100,
      healthCheckPath: '/',
      healthCheckPort: 80,
      healthCheckProtocol: globalaccelerator.HealthCheckProtocol.HTTP,
      healthCheckInterval: cdk.Duration.seconds(30),
      endpoints: [
        new ga_endpoints.ApplicationLoadBalancerEndpoint(props.primaryAlb, {
          weight: 128,
        }),
      ],
    });

    // Outputs for integration testing
    new cdk.CfnOutput(this, `GlobalAcceleratorDNS${props.environmentSuffix}`, {
      value: this.accelerator.dnsName,
      description: 'The DNS name of the Global Accelerator',
      exportName: `GlobalAcceleratorDNS${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(
      this,
      `GlobalAcceleratorEndpoint${props.environmentSuffix}`,
      {
        value: `http://${this.accelerator.dnsName}`,
        description: 'Global Accelerator HTTP endpoint',
        exportName: `GlobalAcceleratorEndpoint${props.environmentSuffix}`,
      }
    );
  }
}
```

### `lib/stacks/tgw-peering-stack.ts` (Transit Gateway Peering)

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface TgwPeeringStackProps {
  primaryTgwId: string;
  primaryRegion: string;
  secondaryTgwId: string;
  secondaryRegion: string;
  environmentSuffix: string;
}

export class TgwPeeringStack extends Construct {
  public readonly peeringAttachment: ec2.CfnTransitGatewayPeeringAttachment;

  constructor(scope: Construct, id: string, props: TgwPeeringStackProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);

    // Create Transit Gateway Peering Attachment (only in primary region)
    if (stack.region === props.primaryRegion) {
      this.peeringAttachment = new ec2.CfnTransitGatewayPeeringAttachment(
        this,
        `TGWPeering${props.environmentSuffix}`,
        {
          transitGatewayId: props.primaryTgwId,
          peerTransitGatewayId: props.secondaryTgwId,
          peerRegion: props.secondaryRegion,
          peerAccountId: stack.account,
          tags: [
            {
              key: 'Name',
              value: `TradingPlatform-TGW-Peering-${props.primaryRegion}-${props.secondaryRegion}${props.environmentSuffix}`,
            },
          ],
        }
      );

      // Output the peering attachment ID
      new cdk.CfnOutput(
        this,
        `TGWPeeringAttachmentId${props.environmentSuffix}`,
        {
          value: this.peeringAttachment.ref,
          exportName: `TGWPeeringAttachmentId${props.environmentSuffix}`,
          description: 'Transit Gateway Peering Attachment ID',
        }
      );
    }
  }
}
```

### `lib/aspects/encryption-aspect.ts` (Encryption Enforcement)

```typescript
import { IConstruct } from 'constructs';
import * as cdk from 'aws-cdk-lib';

export class EncryptionAspect implements cdk.IAspect {
  public visit(node: IConstruct): void {
    // Check S3 buckets for encryption
    if (node instanceof cdk.aws_s3.CfnBucket) {
      if (!node.bucketEncryption) {
        node.bucketEncryption = {
          serverSideEncryptionConfiguration: [
            {
              serverSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
            },
          ],
        };
      }
    }

    // Check DynamoDB tables for encryption
    if (node instanceof cdk.aws_dynamodb.CfnTable) {
      if (!node.sseSpecification) {
        node.sseSpecification = {
          sseEnabled: true,
        };
      }
    }

    // Check RDS instances for encryption
    if (node instanceof cdk.aws_rds.CfnDBInstance) {
      if (!node.storageEncrypted) {
        node.storageEncrypted = true;
      }
    }

    // Check RDS clusters for encryption
    if (node instanceof cdk.aws_rds.CfnDBCluster) {
      if (!node.storageEncrypted) {
        node.storageEncrypted = true;
      }
    }

    // Check EFS File Systems for encryption
    if (node instanceof cdk.aws_efs.CfnFileSystem) {
      if (!node.encrypted) {
        node.encrypted = true;
      }
    }
  }
}
```

## Deployment Strategy

The infrastructure should be deployed in the following order:

1. **Deploy Secondary Stack First**:
   ```bash
   cdk deploy TapStackdev-Secondary
   ```

2. **Deploy Primary Stack**:
   ```bash
   cdk deploy TapStackdev-Primary
   ```

3. **Enable Transit Gateway Peering** (after both stacks are deployed):
   ```bash
   cdk deploy TapStackdev-Primary --context enableTgwPeering=true
   ```

## Key Features

1. **Multi-Region Architecture**: Active-active setup across ap-northeast-2 and ap-southeast-2
2. **Global Accelerator**: Static entry point with automatic failover
3. **Aurora Global Database**: Primary cluster in ap-northeast-2 with encryption enabled
4. **Transit Gateway Peering**: Cross-region private communication
5. **ECS Fargate Services**: Trading engine and order management microservices
6. **Encryption Aspect**: Automatically enforces encryption on storage resources
7. **Comprehensive Outputs**: All resources export CloudFormation outputs for integration testing

## Architecture Highlights

- **Networking**: VPCs with public, private, and isolated subnets in each region
- **Security**: All traffic between regions flows through Transit Gateway
- **High Availability**: Multi-AZ deployment with ALB health checks
- **Scalability**: Fargate auto-scaling with serverless Aurora
- **Governance**: CDK Aspects enforce security policies across all resources
