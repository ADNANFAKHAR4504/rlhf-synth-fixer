Generate an Infrastructure optimisation script for this code.The file should be called optimize.py and should use boto to apply the optimisations. Scale down the following resources for cost optimization in a development environment:
- Aurora Database: Reduce minCapacity from 2 to 0.5 ACU, maxCapacity from 4 to 1 ACU, and backup retention from 14 to 1 day
- ElastiCache Redis: Reduce numCacheClusters from 3 to 2 nodes
- ECS Fargate: Reduce desiredCount from 3 to 2 tasks 
### File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';
import { DatabaseStack } from './database-stack';
import { CacheStack } from './cache-stack';
import { ComputeStack } from './compute-stack';
import { ApiStack } from './api-stack';

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

    // Networking infrastructure
    const networkingStack = new NetworkingStack(this, 'NetworkingStack', {
      environmentSuffix,
    });

    // Database infrastructure
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      vpc: networkingStack.vpc,
      databaseSecurityGroup: networkingStack.databaseSecurityGroup,
      environmentSuffix,
    });

    // Cache infrastructure
    const cacheStack = new CacheStack(this, 'CacheStack', {
      vpc: networkingStack.vpc,
      cacheSecurityGroup: networkingStack.cacheSecurityGroup,
      environmentSuffix,
    });

    // Compute infrastructure
    const computeStack = new ComputeStack(this, 'ComputeStack', {
      vpc: networkingStack.vpc,
      ecsSecurityGroup: networkingStack.ecsSecurityGroup,
      albSecurityGroup: networkingStack.albSecurityGroup,
      databaseSecret: databaseStack.databaseSecret,
      redisEndpoint: cacheStack.redisEndpoint,
      environmentSuffix,
    });

    // API Gateway infrastructure
    new ApiStack(this, 'ApiStack', {
      loadBalancer: computeStack.loadBalancer,
      environmentSuffix,
    });
  }
}
```

### File: lib/networking-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkingStackProps {
  environmentSuffix: string;
}

export class NetworkingStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly ecsSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly cacheSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id);

    // Create VPC with public and private subnets across 2 AZs
    this.vpc = new ec2.Vpc(this, 'StreamFlixVpc', {
      vpcName: `streamflix-vpc-${props.environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1,
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
      ],
    });

    // ALB Security Group
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    // ECS Security Group
    this.ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ECS Fargate tasks',
      allowAllOutbound: true,
    });

    this.ecsSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    // Database Security Group
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for RDS PostgreSQL',
        allowAllOutbound: false,
      }
    );

    this.databaseSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from ECS'
    );

    // Cache Security Group
    this.cacheSecurityGroup = new ec2.SecurityGroup(
      this,
      'CacheSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for ElastiCache Redis',
        allowAllOutbound: false,
      }
    );

    this.cacheSecurityGroup.addIngressRule(
      this.ecsSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow Redis access from ECS'
    );

    // Output VPC ID
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });
  }
}
```

### File: lib/database-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface DatabaseStackProps {
  vpc: ec2.Vpc;
  databaseSecurityGroup: ec2.SecurityGroup;
  environmentSuffix: string;
}

export class DatabaseStack extends Construct {
  public readonly databaseCluster: rds.DatabaseCluster;
  public readonly databaseSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);
    const minCapacity = 2;
    const maxCapacity = 4;
    const backupRetentionDays = 14;

    // Create database credentials secret
    this.databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `streamflix-db-credentials-${props.environmentSuffix}`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    // Create Aurora Serverless v2 PostgreSQL cluster for faster provisioning
    this.databaseCluster = new rds.DatabaseCluster(this, 'DatabaseCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_10,
      }),
      credentials: rds.Credentials.fromSecret(this.databaseSecret),
      writer: rds.ClusterInstance.serverlessV2('writer', {
        autoMinorVersionUpgrade: true,
      }),
      readers: [
        rds.ClusterInstance.serverlessV2('reader', {
          scaleWithWriter: true,
        }),
      ],
      serverlessV2MinCapacity: minCapacity,
      serverlessV2MaxCapacity: maxCapacity,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [props.databaseSecurityGroup],
      defaultDatabaseName: 'streamflix',
      storageEncrypted: true,
      backup: {
        retention: cdk.Duration.days(backupRetentionDays),
      },
    });

    // Output database configuration
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.databaseCluster.clusterEndpoint.hostname,
      description: 'Database cluster endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.databaseSecret.secretArn,
      description: 'Database credentials secret ARN',
    });

    new cdk.CfnOutput(this, 'DatabaseCapacity', {
      value: `Min: ${minCapacity} ACU, Max: ${maxCapacity} ACU`,
      description: 'Aurora Serverless v2 capacity configuration',
    });

    new cdk.CfnOutput(this, 'DatabaseBackupRetention', {
      value: `${backupRetentionDays} days`,
      description: 'Backup retention period',
    });
  }
}
```

### File: lib/cache-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';

interface CacheStackProps {
  vpc: ec2.Vpc;
  cacheSecurityGroup: ec2.SecurityGroup;
  environmentSuffix: string;
}

export class CacheStack extends Construct {
  public readonly redisCluster: elasticache.CfnReplicationGroup;
  public readonly redisEndpoint: string;

  constructor(scope: Construct, id: string, props: CacheStackProps) {
    super(scope, id);

    // Create subnet group for ElastiCache
    const subnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'RedisSubnetGroup',
      {
        description: 'Subnet group for Redis cluster',
        subnetIds: props.vpc.privateSubnets.map(subnet => subnet.subnetId),
        cacheSubnetGroupName: `streamflix-redis-subnet-${props.environmentSuffix}`,
      }
    );

    // Create Redis replication group with encryption
    this.redisCluster = new elasticache.CfnReplicationGroup(
      this,
      'RedisCluster',
      {
        replicationGroupDescription: 'StreamFlix content metadata cache',
        replicationGroupId: `streamflix-redis-${props.environmentSuffix}`,
        engine: 'redis',
        engineVersion: '7.1',
        cacheNodeType: 'cache.t4g.micro',
        numCacheClusters: 3,
        automaticFailoverEnabled: true,
        multiAzEnabled: true,
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
        transitEncryptionMode: 'required',
        cacheSubnetGroupName: subnetGroup.cacheSubnetGroupName,
        securityGroupIds: [props.cacheSecurityGroup.securityGroupId],
        port: 6379,
      }
    );

    this.redisCluster.addDependency(subnetGroup);

    // Redis endpoint (primary endpoint for writes)
    this.redisEndpoint = this.redisCluster.attrPrimaryEndPointAddress;

    // Output Redis endpoint
    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: this.redisEndpoint,
      description: 'Redis cluster primary endpoint',
    });

    new cdk.CfnOutput(this, 'RedisPort', {
      value: this.redisCluster.attrPrimaryEndPointPort,
      description: 'Redis cluster port',
    });
  }
}
```

### File: lib/compute-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface ComputeStackProps {
  vpc: ec2.Vpc;
  ecsSecurityGroup: ec2.SecurityGroup;
  albSecurityGroup: ec2.SecurityGroup;
  databaseSecret: secretsmanager.Secret;
  redisEndpoint: string;
  environmentSuffix: string;
}

export class ComputeStack extends Construct {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    // Create ECS cluster
    this.cluster = new ecs.Cluster(this, 'EcsCluster', {
      vpc: props.vpc,
      clusterName: `streamflix-cluster-${props.environmentSuffix}`,
      containerInsights: true,
    });

    // Create task execution role
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    // Grant read access to database secret
    props.databaseSecret.grantRead(taskExecutionRole);

    // Create task role
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Create log group
    const logGroup = new logs.LogGroup(this, 'ServiceLogGroup', {
      logGroupName: `/ecs/streamflix-api-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create task definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'TaskDefinition',
      {
        memoryLimitMiB: 512,
        cpu: 256,
        executionRole: taskExecutionRole,
        taskRole: taskRole,
      }
    );

    // Add container to task definition
    const container = taskDefinition.addContainer('ApiContainer', {
      image: ecs.ContainerImage.fromRegistry('nginx:latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'streamflix-api',
        logGroup: logGroup,
      }),
      environment: {
        REDIS_ENDPOINT: props.redisEndpoint,
        REDIS_PORT: '6379',
        ENVIRONMENT: props.environmentSuffix,
      },
      secrets: {
        DB_HOST: ecs.Secret.fromSecretsManager(props.databaseSecret, 'host'),
        DB_USERNAME: ecs.Secret.fromSecretsManager(
          props.databaseSecret,
          'username'
        ),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(
          props.databaseSecret,
          'password'
        ),
      },
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // Create Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup,
      loadBalancerName: `streamflix-alb-${props.environmentSuffix}`,
    });

    // Create target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc: props.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // Add listener
    this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Create Fargate service
    this.service = new ecs.FargateService(this, 'FargateService', {
      cluster: this.cluster,
      taskDefinition: taskDefinition,
      desiredCount: 3,
      securityGroups: [props.ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      assignPublicIp: false,
      serviceName: `streamflix-api-${props.environmentSuffix}`,
    });

    // Attach service to target group
    this.service.attachToApplicationTargetGroup(targetGroup);

    // Output ALB DNS name
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });
  }
}
```

### File: lib/api-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

interface ApiStackProps {
  loadBalancer: elbv2.ApplicationLoadBalancer;
  environmentSuffix: string;
}

export class ApiStack extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id);

    // Create REST API
    this.api = new apigateway.RestApi(this, 'ContentApi', {
      restApiName: `StreamFlix Content API ${props.environmentSuffix}`,
      description: 'API for StreamFlix content metadata',
      deployOptions: {
        stageName: props.environmentSuffix,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 2000,
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
    });

    // Create HTTP integration with ALB (public endpoint)
    const integration = new apigateway.HttpIntegration(
      `http://${props.loadBalancer.loadBalancerDnsName}/{proxy}`,
      {
        httpMethod: 'ANY',
        proxy: true,
        options: {
          requestParameters: {
            'integration.request.path.proxy': 'method.request.path.proxy',
          },
        },
      }
    );

    // Add proxy resource for all paths
    const proxyResource = this.api.root.addResource('{proxy+}');
    proxyResource.addMethod('ANY', integration, {
      requestParameters: {
        'method.request.path.proxy': true,
      },
    });

    // Add root path
    const rootIntegration = new apigateway.HttpIntegration(
      `http://${props.loadBalancer.loadBalancerDnsName}`,
      {
        httpMethod: 'ANY',
        proxy: true,
      }
    );
    this.api.root.addMethod('ANY', rootIntegration);

    // Output API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
    });
  }
}
```