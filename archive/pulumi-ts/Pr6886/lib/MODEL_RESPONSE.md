# Model Response: Multi-Environment Infrastructure with Pulumi TypeScript

This implementation creates a comprehensive multi-environment infrastructure management system using Pulumi TypeScript. The solution provisions three environments (dev, staging, prod) across different AWS regions with consistent base infrastructure while allowing environment-specific variations.

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { BaseInfrastructure } from "./infrastructure/base-infrastructure";
import { ParameterStoreHierarchy } from "./infrastructure/parameter-store";
import { EcsService } from "./infrastructure/ecs-service";
import { AuroraCluster } from "./infrastructure/aurora-cluster";
import { CrossStackReferences } from "./infrastructure/cross-stack-references";
import { CloudWatchDashboard } from "./monitoring/cloudwatch-dashboard";
import { DriftDetection } from "./monitoring/drift-detection";

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const environment = config.require("environment"); // dev, staging, prod
const region = config.get("region") || "us-east-1";

// Environment-specific configurations
interface EnvironmentConfig {
  instanceType: string;
  auroraInstanceCount: number;
  backupRetentionDays: number;
  containerImageTag: string;
  vpcCidr: string;
}

const environmentConfigs: Record<string, EnvironmentConfig> = {
  dev: {
    instanceType: "t3.medium",
    auroraInstanceCount: 1,
    backupRetentionDays: 1,
    containerImageTag: "latest",
    vpcCidr: "10.0.0.0/16"
  },
  staging: {
    instanceType: "m5.large",
    auroraInstanceCount: 2,
    backupRetentionDays: 7,
    containerImageTag: "staging-*",
    vpcCidr: "10.1.0.0/16"
  },
  prod: {
    instanceType: "m5.xlarge",
    auroraInstanceCount: 3,
    backupRetentionDays: 30,
    containerImageTag: "v*.*.*",
    vpcCidr: "10.2.0.0/16"
  }
};

const envConfig = environmentConfigs[environment];

// Create base infrastructure
const baseInfra = new BaseInfrastructure(`base-infra-${environmentSuffix}`, {
  environmentSuffix,
  environment,
  vpcCidr: envConfig.vpcCidr,
  availabilityZones: ["a", "b", "c"]
});

// Create Parameter Store hierarchy
const parameterStore = new ParameterStoreHierarchy(`param-store-${environmentSuffix}`, {
  environmentSuffix,
  environment,
  vpcId: baseInfra.vpc.id,
  securityGroupIds: [baseInfra.securityGroup.id]
});

// Create Aurora cluster
const aurora = new AuroraCluster(`aurora-${environmentSuffix}`, {
  environmentSuffix,
  environment,
  vpcId: baseInfra.vpc.id,
  subnetIds: baseInfra.privateSubnetIds,
  securityGroupIds: [baseInfra.databaseSecurityGroup.id],
  instanceCount: envConfig.auroraInstanceCount,
  backupRetentionDays: envConfig.backupRetentionDays,
  instanceClass: envConfig.instanceType
});

// Create ECS service
const ecsService = new EcsService(`ecs-service-${environmentSuffix}`, {
  environmentSuffix,
  environment,
  cluster: baseInfra.ecsCluster,
  vpcId: baseInfra.vpc.id,
  subnetIds: baseInfra.privateSubnetIds,
  albSubnetIds: baseInfra.publicSubnetIds,
  securityGroupId: baseInfra.securityGroup.id,
  imageTag: envConfig.containerImageTag,
  databaseEndpoint: aurora.endpoint,
  databaseSecretArn: aurora.secretArn
});

// Set up cross-stack references
const crossStackRefs = new CrossStackReferences(`cross-stack-${environmentSuffix}`, {
  environmentSuffix,
  environment,
  vpcId: baseInfra.vpc.id,
  ecsClusterArn: baseInfra.ecsCluster.arn,
  albArn: ecsService.albArn,
  auroraEndpoint: aurora.endpoint
});

// Create CloudWatch dashboard
const dashboard = new CloudWatchDashboard(`dashboard-${environmentSuffix}`, {
  environmentSuffix,
  environment,
  ecsClusterName: baseInfra.ecsCluster.name,
  ecsServiceName: ecsService.serviceName,
  albArn: ecsService.albArn,
  auroraClusterId: aurora.clusterId
});

// Set up drift detection
const driftDetection = new DriftDetection(`drift-${environmentSuffix}`, {
  environmentSuffix,
  environment,
  vpcId: baseInfra.vpc.id,
  ecsClusterArn: baseInfra.ecsCluster.arn,
  auroraClusterArn: aurora.clusterArn
});

// Export outputs for stack references
export const vpcId = baseInfra.vpc.id;
export const publicSubnetIds = baseInfra.publicSubnetIds;
export const privateSubnetIds = baseInfra.privateSubnetIds;
export const ecsClusterName = baseInfra.ecsCluster.name;
export const ecsClusterArn = baseInfra.ecsCluster.arn;
export const ecsServiceName = ecsService.serviceName;
export const albDnsName = ecsService.albDnsName;
export const albArn = ecsService.albArn;
export const auroraEndpoint = aurora.endpoint;
export const auroraReaderEndpoint = aurora.readerEndpoint;
export const auroraClusterId = aurora.clusterId;
export const snsTopicArn = driftDetection.snsTopicArn;
export const dashboardName = dashboard.dashboardName;
```

## File: infrastructure/base-infrastructure.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface BaseInfrastructureArgs {
  environmentSuffix: string;
  environment: string;
  vpcCidr: string;
  availabilityZones: string[];
}

export class BaseInfrastructure extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateway: aws.ec2.NatGateway;
  public readonly securityGroup: aws.ec2.SecurityGroup;
  public readonly databaseSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ecsCluster: aws.ecs.Cluster;

  constructor(name: string, args: BaseInfrastructureArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:infrastructure:BaseInfrastructure", name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Create VPC
    this.vpc = new aws.ec2.Vpc(`vpc-${args.environmentSuffix}`, {
      cidrBlock: args.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `vpc-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(`igw-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: {
        Name: `igw-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    // Create public subnets
    this.publicSubnets = [];
    this.publicSubnetIds = [];
    args.availabilityZones.forEach((az, index) => {
      const subnet = new aws.ec2.Subnet(`public-subnet-${az}-${args.environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: `${args.vpcCidr.split('.')[0]}.${args.vpcCidr.split('.')[1]}.${index * 16}.0/20`,
        availabilityZone: pulumi.interpolate`${aws.getRegionOutput().name}${az}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${az}-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
          Type: "public"
        }
      }, defaultResourceOptions);
      this.publicSubnets.push(subnet);
      this.publicSubnetIds.push(subnet.id);
    });

    // Create NAT Gateway (only 1 for cost optimization)
    const eip = new aws.ec2.Eip(`nat-eip-${args.environmentSuffix}`, {
      domain: "vpc",
      tags: {
        Name: `nat-eip-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    this.natGateway = new aws.ec2.NatGateway(`nat-${args.environmentSuffix}`, {
      allocationId: eip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        Name: `nat-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    // Create private subnets
    this.privateSubnets = [];
    this.privateSubnetIds = [];
    args.availabilityZones.forEach((az, index) => {
      const subnet = new aws.ec2.Subnet(`private-subnet-${az}-${args.environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: `${args.vpcCidr.split('.')[0]}.${args.vpcCidr.split('.')[1]}.${128 + index * 16}.0/20`,
        availabilityZone: pulumi.interpolate`${aws.getRegionOutput().name}${az}`,
        tags: {
          Name: `private-subnet-${az}-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
          Type: "private"
        }
      }, defaultResourceOptions);
      this.privateSubnets.push(subnet);
      this.privateSubnetIds.push(subnet.id);
    });

    // Create route table for public subnets
    const publicRouteTable = new aws.ec2.RouteTable(`public-rt-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: {
        Name: `public-rt-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    new aws.ec2.Route(`public-route-${args.environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id
    }, defaultResourceOptions);

    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(`public-rta-${index}-${args.environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id
      }, defaultResourceOptions);
    });

    // Create route table for private subnets
    const privateRouteTable = new aws.ec2.RouteTable(`private-rt-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: {
        Name: `private-rt-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    new aws.ec2.Route(`private-route-${args.environmentSuffix}`, {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: this.natGateway.id
    }, defaultResourceOptions);

    this.privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(`private-rta-${index}-${args.environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id
      }, defaultResourceOptions);
    });

    // Create security group for ECS tasks
    this.securityGroup = new aws.ec2.SecurityGroup(`ecs-sg-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      description: "Security group for ECS tasks",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ["0.0.0.0/0"]
        },
        {
          protocol: "tcp",
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      tags: {
        Name: `ecs-sg-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    // Create security group for RDS
    this.databaseSecurityGroup = new aws.ec2.SecurityGroup(`rds-sg-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      description: "Security group for RDS Aurora",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 5432,
          toPort: 5432,
          securityGroups: [this.securityGroup.id]
        }
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      tags: {
        Name: `rds-sg-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    // Create ECS cluster
    this.ecsCluster = new aws.ecs.Cluster(`ecs-cluster-${args.environmentSuffix}`, {
      name: `ecs-cluster-${args.environmentSuffix}`,
      settings: [{
        name: "containerInsights",
        value: "enabled"
      }],
      tags: {
        Name: `ecs-cluster-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      ecsClusterArn: this.ecsCluster.arn
    });
  }
}
```

## File: infrastructure/parameter-store.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface ParameterStoreHierarchyArgs {
  environmentSuffix: string;
  environment: string;
  vpcId: pulumi.Input<string>;
  securityGroupIds: pulumi.Input<string>[];
}

export class ParameterStoreHierarchy extends pulumi.ComponentResource {
  public readonly sharedParameters: aws.ssm.Parameter[];
  public readonly environmentParameters: aws.ssm.Parameter[];

  constructor(name: string, args: ParameterStoreHierarchyArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:infrastructure:ParameterStoreHierarchy", name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Shared parameters across all environments
    this.sharedParameters = [];

    const sharedParams = [
      { name: "app-name", value: "trading-platform" },
      { name: "app-version", value: "1.0.0" },
      { name: "log-level", value: "info" }
    ];

    sharedParams.forEach(param => {
      const ssmParam = new aws.ssm.Parameter(`shared-${param.name}-${args.environmentSuffix}`, {
        name: `/shared/${param.name}-${args.environmentSuffix}`,
        type: "String",
        value: param.value,
        description: `Shared parameter: ${param.name}`,
        tags: {
          Name: `shared-${param.name}-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
          Type: "shared"
        }
      }, defaultResourceOptions);
      this.sharedParameters.push(ssmParam);
    });

    // Environment-specific parameters
    this.environmentParameters = [];

    const envParams = [
      { name: "database-max-connections", value: args.environment === "prod" ? "100" : "50" },
      { name: "cache-ttl", value: args.environment === "prod" ? "3600" : "300" },
      { name: "api-timeout", value: args.environment === "prod" ? "30000" : "10000" }
    ];

    envParams.forEach(param => {
      const ssmParam = new aws.ssm.Parameter(`env-${param.name}-${args.environmentSuffix}`, {
        name: `/${args.environment}/${param.name}-${args.environmentSuffix}`,
        type: "String",
        value: param.value,
        description: `Environment-specific parameter: ${param.name}`,
        tags: {
          Name: `env-${param.name}-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix,
          Type: "environment-specific"
        }
      }, defaultResourceOptions);
      this.environmentParameters.push(ssmParam);
    });

    // Network configuration parameters
    new aws.ssm.Parameter(`vpc-id-${args.environmentSuffix}`, {
      name: `/${args.environment}/network/vpc-id-${args.environmentSuffix}`,
      type: "String",
      value: pulumi.output(args.vpcId),
      description: "VPC ID for the environment",
      tags: {
        Name: `vpc-id-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    this.registerOutputs({});
  }
}
```

## File: infrastructure/aurora-cluster.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";

export interface AuroraClusterArgs {
  environmentSuffix: string;
  environment: string;
  vpcId: pulumi.Input<string>;
  subnetIds: pulumi.Input<string>[];
  securityGroupIds: pulumi.Input<string>[];
  instanceCount: number;
  backupRetentionDays: number;
  instanceClass: string;
}

export class AuroraCluster extends pulumi.ComponentResource {
  public readonly cluster: aws.rds.Cluster;
  public readonly instances: aws.rds.ClusterInstance[];
  public readonly endpoint: pulumi.Output<string>;
  public readonly readerEndpoint: pulumi.Output<string>;
  public readonly clusterId: pulumi.Output<string>;
  public readonly clusterArn: pulumi.Output<string>;
  public readonly secretArn: pulumi.Output<string>;

  constructor(name: string, args: AuroraClusterArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:infrastructure:AuroraCluster", name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Generate random password
    const dbPassword = new random.RandomPassword(`db-password-${args.environmentSuffix}`, {
      length: 32,
      special: true,
      overrideSpecial: "!#$%&*()-_=+[]{}<>:?"
    }, defaultResourceOptions);

    // Store password in Secrets Manager
    const dbSecret = new aws.secretsmanager.Secret(`db-secret-${args.environmentSuffix}`, {
      name: `aurora-password-${args.environmentSuffix}`,
      description: "Aurora database password",
      tags: {
        Name: `db-secret-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    new aws.secretsmanager.SecretVersion(`db-secret-version-${args.environmentSuffix}`, {
      secretId: dbSecret.id,
      secretString: pulumi.interpolate`{"username":"admin","password":"${dbPassword.result}"}`
    }, defaultResourceOptions);

    this.secretArn = dbSecret.arn;

    // Create DB subnet group
    const subnetGroup = new aws.rds.SubnetGroup(`db-subnet-group-${args.environmentSuffix}`, {
      name: `db-subnet-group-${args.environmentSuffix}`,
      subnetIds: args.subnetIds,
      tags: {
        Name: `db-subnet-group-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    // Create Aurora cluster parameter group
    const clusterParameterGroup = new aws.rds.ClusterParameterGroup(`aurora-pg-${args.environmentSuffix}`, {
      name: `aurora-pg-${args.environmentSuffix}`,
      family: "aurora-postgresql14",
      description: "Aurora PostgreSQL cluster parameter group",
      parameters: [
        {
          name: "log_statement",
          value: "all"
        },
        {
          name: "log_min_duration_statement",
          value: "1000"
        }
      ],
      tags: {
        Name: `aurora-pg-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    // Create Aurora cluster
    this.cluster = new aws.rds.Cluster(`aurora-cluster-${args.environmentSuffix}`, {
      clusterIdentifier: `aurora-cluster-${args.environmentSuffix}`,
      engine: "aurora-postgresql",
      engineMode: "provisioned",
      engineVersion: "14.6",
      databaseName: "trading",
      masterUsername: "admin",
      masterPassword: dbPassword.result,
      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: args.securityGroupIds,
      dbClusterParameterGroupName: clusterParameterGroup.name,
      backupRetentionPeriod: args.backupRetentionDays,
      preferredBackupWindow: "03:00-04:00",
      preferredMaintenanceWindow: "sun:04:00-sun:05:00",
      skipFinalSnapshot: true,
      deletionProtection: false,
      enabledCloudwatchLogsExports: ["postgresql"],
      storageEncrypted: true,
      serverlessv2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 1.0
      },
      tags: {
        Name: `aurora-cluster-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    // Create Aurora instances
    this.instances = [];
    for (let i = 0; i < args.instanceCount; i++) {
      const instance = new aws.rds.ClusterInstance(`aurora-instance-${i}-${args.environmentSuffix}`, {
        identifier: `aurora-instance-${i}-${args.environmentSuffix}`,
        clusterIdentifier: this.cluster.id,
        instanceClass: "db.serverless",
        engine: "aurora-postgresql",
        engineVersion: "14.6",
        publiclyAccessible: false,
        tags: {
          Name: `aurora-instance-${i}-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix
        }
      }, { ...defaultResourceOptions, dependsOn: [this.cluster] });
      this.instances.push(instance);
    }

    this.endpoint = this.cluster.endpoint;
    this.readerEndpoint = this.cluster.readerEndpoint;
    this.clusterId = this.cluster.id;
    this.clusterArn = this.cluster.arn;

    this.registerOutputs({
      endpoint: this.endpoint,
      readerEndpoint: this.readerEndpoint,
      clusterArn: this.clusterArn
    });
  }
}
```

## File: infrastructure/ecs-service.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface EcsServiceArgs {
  environmentSuffix: string;
  environment: string;
  cluster: aws.ecs.Cluster;
  vpcId: pulumi.Input<string>;
  subnetIds: pulumi.Input<string>[];
  albSubnetIds: pulumi.Input<string>[];
  securityGroupId: pulumi.Input<string>;
  imageTag: string;
  databaseEndpoint: pulumi.Output<string>;
  databaseSecretArn: pulumi.Output<string>;
}

export class EcsService extends pulumi.ComponentResource {
  public readonly taskDefinition: aws.ecs.TaskDefinition;
  public readonly service: aws.ecs.Service;
  public readonly alb: aws.lb.LoadBalancer;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;
  public readonly serviceName: pulumi.Output<string>;

  constructor(name: string, args: EcsServiceArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:infrastructure:EcsService", name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Create IAM role for ECS task execution
    const taskExecutionRole = new aws.iam.Role(`ecs-execution-role-${args.environmentSuffix}`, {
      name: `ecs-execution-role-${args.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "ecs-tasks.amazonaws.com"
          }
        }]
      }),
      tags: {
        Name: `ecs-execution-role-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    new aws.iam.RolePolicyAttachment(`ecs-execution-policy-${args.environmentSuffix}`, {
      role: taskExecutionRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    }, defaultResourceOptions);

    // Add policy to read secrets
    new aws.iam.RolePolicy(`ecs-secrets-policy-${args.environmentSuffix}`, {
      role: taskExecutionRole.id,
      policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "secretsmanager:GetSecretValue",
            "kms:Decrypt"
          ],
          "Resource": ["${args.databaseSecretArn}", "${args.databaseSecretArn}*"]
        }]
      }`
    }, defaultResourceOptions);

    // Create IAM role for ECS task
    const taskRole = new aws.iam.Role(`ecs-task-role-${args.environmentSuffix}`, {
      name: `ecs-task-role-${args.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "ecs-tasks.amazonaws.com"
          }
        }]
      }),
      tags: {
        Name: `ecs-task-role-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    // Add S3 access policy
    new aws.iam.RolePolicy(`ecs-s3-policy-${args.environmentSuffix}`, {
      role: taskRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Action: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:ListBucket"
          ],
          Resource: ["*"]
        }]
      })
    }, defaultResourceOptions);

    // Create CloudWatch log group
    const logGroup = new aws.cloudwatch.LogGroup(`ecs-logs-${args.environmentSuffix}`, {
      name: `/ecs/trading-app-${args.environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `ecs-logs-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    // Create task definition
    this.taskDefinition = new aws.ecs.TaskDefinition(`ecs-task-${args.environmentSuffix}`, {
      family: `trading-app-${args.environmentSuffix}`,
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      cpu: "256",
      memory: "512",
      executionRoleArn: taskExecutionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: pulumi.interpolate`[{
        "name": "trading-app",
        "image": "public.ecr.aws/docker/library/nginx:${args.imageTag}",
        "essential": true,
        "portMappings": [{
          "containerPort": 80,
          "protocol": "tcp"
        }],
        "environment": [{
          "name": "ENVIRONMENT",
          "value": "${args.environment}"
        }, {
          "name": "DATABASE_ENDPOINT",
          "value": "${args.databaseEndpoint}"
        }],
        "secrets": [{
          "name": "DATABASE_PASSWORD",
          "valueFrom": "${args.databaseSecretArn}"
        }],
        "logConfiguration": {
          "logDriver": "awslogs",
          "options": {
            "awslogs-group": "${logGroup.name}",
            "awslogs-region": "${aws.getRegionOutput().name}",
            "awslogs-stream-prefix": "ecs"
          }
        }
      }]`,
      tags: {
        Name: `ecs-task-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    // Create Application Load Balancer
    const albSecurityGroup = new aws.ec2.SecurityGroup(`alb-sg-${args.environmentSuffix}`, {
      vpcId: args.vpcId,
      description: "Security group for ALB",
      ingress: [{
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"]
      }],
      egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"]
      }],
      tags: {
        Name: `alb-sg-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    this.alb = new aws.lb.LoadBalancer(`alb-${args.environmentSuffix}`, {
      name: `alb-${args.environmentSuffix}`,
      internal: false,
      loadBalancerType: "application",
      securityGroups: [albSecurityGroup.id],
      subnets: args.albSubnetIds,
      enableDeletionProtection: false,
      tags: {
        Name: `alb-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    this.targetGroup = new aws.lb.TargetGroup(`tg-${args.environmentSuffix}`, {
      name: `tg-${args.environmentSuffix}`,
      port: 80,
      protocol: "HTTP",
      targetType: "ip",
      vpcId: args.vpcId,
      healthCheck: {
        enabled: true,
        path: "/",
        protocol: "HTTP",
        matcher: "200",
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 2
      },
      tags: {
        Name: `tg-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    new aws.lb.Listener(`alb-listener-${args.environmentSuffix}`, {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: "HTTP",
      defaultActions: [{
        type: "forward",
        targetGroupArn: this.targetGroup.arn
      }],
      tags: {
        Name: `alb-listener-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    // Create ECS service
    this.service = new aws.ecs.Service(`ecs-service-${args.environmentSuffix}`, {
      name: `trading-service-${args.environmentSuffix}`,
      cluster: args.cluster.arn,
      taskDefinition: this.taskDefinition.arn,
      desiredCount: 2,
      launchType: "FARGATE",
      networkConfiguration: {
        assignPublicIp: false,
        subnets: args.subnetIds,
        securityGroups: [args.securityGroupId]
      },
      loadBalancers: [{
        targetGroupArn: this.targetGroup.arn,
        containerName: "trading-app",
        containerPort: 80
      }],
      tags: {
        Name: `ecs-service-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, { ...defaultResourceOptions, dependsOn: [this.targetGroup] });

    this.albDnsName = this.alb.dnsName;
    this.albArn = this.alb.arn;
    this.serviceName = this.service.name;

    this.registerOutputs({
      serviceName: this.serviceName,
      albDnsName: this.albDnsName,
      albArn: this.albArn
    });
  }
}
```

## File: infrastructure/cross-stack-references.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface CrossStackReferencesArgs {
  environmentSuffix: string;
  environment: string;
  vpcId: pulumi.Input<string>;
  ecsClusterArn: pulumi.Output<string>;
  albArn: pulumi.Output<string>;
  auroraEndpoint: pulumi.Output<string>;
}

export class CrossStackReferences extends pulumi.ComponentResource {
  constructor(name: string, args: CrossStackReferencesArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:infrastructure:CrossStackReferences", name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Get reference to other stack if it exists
    const config = new pulumi.Config();
    const referenceStackName = config.get("referenceStack");

    if (referenceStackName) {
      const stackRef = new pulumi.StackReference(`stack-ref-${args.environmentSuffix}`, {
        name: referenceStackName
      }, defaultResourceOptions);

      // Validate network configuration is synchronized
      const refVpcId = stackRef.getOutput("vpcId");

      // Create VPC peering connection if different VPCs
      refVpcId.apply(refId => {
        if (refId !== args.vpcId) {
          new aws.ec2.VpcPeeringConnection(`vpc-peer-${args.environmentSuffix}`, {
            vpcId: args.vpcId,
            peerVpcId: refId,
            autoAccept: true,
            tags: {
              Name: `vpc-peer-${args.environmentSuffix}`,
              Environment: args.environment,
              EnvironmentSuffix: args.environmentSuffix
            }
          }, defaultResourceOptions);
        }
      });

      // Store references for other environments
      new aws.ssm.Parameter(`ref-ecs-cluster-${args.environmentSuffix}`, {
        name: `/${args.environment}/references/ecs-cluster-${args.environmentSuffix}`,
        type: "String",
        value: pulumi.output(args.ecsClusterArn),
        description: "ECS cluster ARN reference",
        tags: {
          Name: `ref-ecs-cluster-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix
        }
      }, defaultResourceOptions);

      new aws.ssm.Parameter(`ref-alb-arn-${args.environmentSuffix}`, {
        name: `/${args.environment}/references/alb-arn-${args.environmentSuffix}`,
        type: "String",
        value: pulumi.output(args.albArn),
        description: "ALB ARN reference",
        tags: {
          Name: `ref-alb-arn-${args.environmentSuffix}`,
          Environment: args.environment,
          EnvironmentSuffix: args.environmentSuffix
        }
      }, defaultResourceOptions);
    }

    this.registerOutputs({});
  }
}
```

## File: monitoring/cloudwatch-dashboard.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface CloudWatchDashboardArgs {
  environmentSuffix: string;
  environment: string;
  ecsClusterName: pulumi.Output<string>;
  ecsServiceName: pulumi.Output<string>;
  albArn: pulumi.Output<string>;
  auroraClusterId: pulumi.Output<string>;
}

export class CloudWatchDashboard extends pulumi.ComponentResource {
  public readonly dashboard: aws.cloudwatch.Dashboard;
  public readonly dashboardName: pulumi.Output<string>;

  constructor(name: string, args: CloudWatchDashboardArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:monitoring:CloudWatchDashboard", name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    const region = aws.getRegionOutput().name;

    // Create comprehensive dashboard
    this.dashboard = new aws.cloudwatch.Dashboard(`dashboard-${args.environmentSuffix}`, {
      dashboardName: `trading-platform-${args.environment}-${args.environmentSuffix}`,
      dashboardBody: pulumi.all([
        args.ecsClusterName,
        args.ecsServiceName,
        args.albArn,
        args.auroraClusterId,
        region
      ]).apply(([clusterName, serviceName, albArn, clusterId, reg]) => JSON.stringify({
        widgets: [
          {
            type: "metric",
            properties: {
              metrics: [
                ["AWS/ECS", "CPUUtilization", { stat: "Average", label: "ECS CPU" }],
                [".", "MemoryUtilization", { stat: "Average", label: "ECS Memory" }]
              ],
              period: 300,
              stat: "Average",
              region: reg,
              title: "ECS Resource Utilization",
              yAxis: {
                left: {
                  min: 0,
                  max: 100
                }
              }
            }
          },
          {
            type: "metric",
            properties: {
              metrics: [
                ["AWS/ApplicationELB", "TargetResponseTime", { stat: "Average" }],
                [".", "RequestCount", { stat: "Sum" }],
                [".", "HTTPCode_Target_2XX_Count", { stat: "Sum" }],
                [".", "HTTPCode_Target_4XX_Count", { stat: "Sum" }],
                [".", "HTTPCode_Target_5XX_Count", { stat: "Sum" }]
              ],
              period: 300,
              stat: "Average",
              region: reg,
              title: "ALB Metrics"
            }
          },
          {
            type: "metric",
            properties: {
              metrics: [
                ["AWS/RDS", "CPUUtilization", { stat: "Average", label: "RDS CPU" }],
                [".", "DatabaseConnections", { stat: "Average", label: "DB Connections" }],
                [".", "ReadLatency", { stat: "Average", label: "Read Latency" }],
                [".", "WriteLatency", { stat: "Average", label: "Write Latency" }]
              ],
              period: 300,
              stat: "Average",
              region: reg,
              title: "Aurora Cluster Metrics"
            }
          },
          {
            type: "log",
            properties: {
              query: `SOURCE '/ecs/trading-app-${args.environmentSuffix}'\n| fields @timestamp, @message\n| sort @timestamp desc\n| limit 20`,
              region: reg,
              title: "Recent ECS Logs"
            }
          }
        ]
      }))
    }, defaultResourceOptions);

    this.dashboardName = this.dashboard.dashboardName;

    this.registerOutputs({
      dashboardName: this.dashboardName
    });
  }
}
```

## File: monitoring/drift-detection.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface DriftDetectionArgs {
  environmentSuffix: string;
  environment: string;
  vpcId: pulumi.Input<string>;
  ecsClusterArn: pulumi.Output<string>;
  auroraClusterArn: pulumi.Output<string>;
}

export class DriftDetection extends pulumi.ComponentResource {
  public readonly snsTopic: aws.sns.Topic;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly eventRule: aws.cloudwatch.EventRule;

  constructor(name: string, args: DriftDetectionArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:monitoring:DriftDetection", name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Create SNS topic for drift alerts
    this.snsTopic = new aws.sns.Topic(`drift-alerts-${args.environmentSuffix}`, {
      name: `drift-alerts-${args.environmentSuffix}`,
      displayName: "Infrastructure Drift Alerts",
      tags: {
        Name: `drift-alerts-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    this.snsTopicArn = this.snsTopic.arn;

    // Create CloudWatch Event Rule for configuration changes
    this.eventRule = new aws.cloudwatch.EventRule(`drift-rule-${args.environmentSuffix}`, {
      name: `drift-detection-${args.environmentSuffix}`,
      description: "Detect configuration drift in infrastructure",
      eventPattern: JSON.stringify({
        source: ["aws.ec2", "aws.ecs", "aws.rds"],
        "detail-type": [
          "AWS API Call via CloudTrail",
          "EC2 Instance State-change Notification",
          "ECS Task State Change",
          "RDS DB Instance Event"
        ]
      }),
      tags: {
        Name: `drift-rule-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    // Create Lambda function for drift detection
    const driftDetectionRole = new aws.iam.Role(`drift-lambda-role-${args.environmentSuffix}`, {
      name: `drift-lambda-role-${args.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "lambda.amazonaws.com"
          }
        }]
      }),
      tags: {
        Name: `drift-lambda-role-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    new aws.iam.RolePolicyAttachment(`drift-lambda-basic-${args.environmentSuffix}`, {
      role: driftDetectionRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    }, defaultResourceOptions);

    new aws.iam.RolePolicy(`drift-lambda-policy-${args.environmentSuffix}`, {
      role: driftDetectionRole.id,
      policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Action": [
            "sns:Publish",
            "ec2:Describe*",
            "ecs:Describe*",
            "rds:Describe*",
            "ssm:GetParameter"
          ],
          "Resource": "*"
        }]
      }`
    }, defaultResourceOptions);

    const driftLambda = new aws.lambda.Function(`drift-lambda-${args.environmentSuffix}`, {
      name: `drift-detection-${args.environmentSuffix}`,
      runtime: "nodejs18.x",
      handler: "index.handler",
      role: driftDetectionRole.arn,
      timeout: 60,
      environment: {
        variables: {
          ENVIRONMENT: args.environment,
          SNS_TOPIC_ARN: this.snsTopic.arn,
          VPC_ID: pulumi.output(args.vpcId),
          ECS_CLUSTER_ARN: args.ecsClusterArn,
          AURORA_CLUSTER_ARN: args.auroraClusterArn
        }
      },
      code: new pulumi.asset.AssetArchive({
        "index.js": new pulumi.asset.StringAsset(`
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { EC2Client, DescribeVpcsCommand } = require('@aws-sdk/client-ec2');
const { ECSClient, DescribeClustersCommand } = require('@aws-sdk/client-ecs');
const { RDSClient, DescribeDBClustersCommand } = require('@aws-sdk/client-rds');

const snsClient = new SNSClient({});
const ec2Client = new EC2Client({});
const ecsClient = new ECSClient({});
const rdsClient = new RDSClient({});

exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  const environment = process.env.ENVIRONMENT;
  const snsTopicArn = process.env.SNS_TOPIC_ARN;

  try {
    // Check for configuration drift
    const driftMessages = [];

    // Example: Check VPC configuration
    const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
      VpcIds: [process.env.VPC_ID]
    }));

    if (vpcResponse.Vpcs && vpcResponse.Vpcs.length > 0) {
      const vpc = vpcResponse.Vpcs[0];
      if (!vpc.EnableDnsHostnames || !vpc.EnableDnsSupport) {
        driftMessages.push('VPC DNS configuration drift detected');
      }
    }

    // Send alert if drift detected
    if (driftMessages.length > 0) {
      await snsClient.send(new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: \`Configuration Drift Detected - \${environment}\`,
        Message: \`The following drift has been detected:\\n\\n\${driftMessages.join('\\n')}\`
      }));
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Drift detection completed', drifts: driftMessages.length })
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
        `)
      }),
      tags: {
        Name: `drift-lambda-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    // Grant EventBridge permission to invoke Lambda
    new aws.lambda.Permission(`drift-lambda-permission-${args.environmentSuffix}`, {
      action: "lambda:InvokeFunction",
      function: driftLambda.name,
      principal: "events.amazonaws.com",
      sourceArn: this.eventRule.arn
    }, defaultResourceOptions);

    // Create EventBridge target
    new aws.cloudwatch.EventTarget(`drift-target-${args.environmentSuffix}`, {
      rule: this.eventRule.name,
      arn: driftLambda.arn
    }, defaultResourceOptions);

    // Create CloudWatch Alarms for drift detection
    new aws.cloudwatch.MetricAlarm(`drift-alarm-${args.environmentSuffix}`, {
      name: `drift-alarm-${args.environmentSuffix}`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 1,
      metricName: "Errors",
      namespace: "AWS/Lambda",
      period: 300,
      statistic: "Sum",
      threshold: 0,
      alarmDescription: "Alert on drift detection errors",
      alarmActions: [this.snsTopic.arn],
      dimensions: {
        FunctionName: driftLambda.name
      },
      tags: {
        Name: `drift-alarm-${args.environmentSuffix}`,
        Environment: args.environment,
        EnvironmentSuffix: args.environmentSuffix
      }
    }, defaultResourceOptions);

    this.registerOutputs({
      snsTopicArn: this.snsTopicArn
    });
  }
}
```

## File: Pulumi.yaml

```yaml
name: multi-environment-infrastructure
runtime: nodejs
description: Multi-environment infrastructure management with Pulumi TypeScript
```

## File: package.json

```json
{
  "name": "multi-environment-infrastructure",
  "version": "1.0.0",
  "description": "Multi-environment infrastructure management with Pulumi TypeScript",
  "main": "index.ts",
  "scripts": {
    "test": "jest"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0",
    "@types/jest": "^29.0.0",
    "jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0",
    "@pulumi/random": "^4.0.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "outDir": "bin",
    "rootDir": "."
  },
  "include": [
    "**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "**/*.spec.ts"
  ]
}
```
