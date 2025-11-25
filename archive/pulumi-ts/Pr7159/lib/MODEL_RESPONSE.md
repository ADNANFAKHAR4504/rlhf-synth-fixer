# Multi-Environment Infrastructure Solution

This solution implements a comprehensive multi-environment infrastructure management system using Pulumi with TypeScript for a trading platform.

## File: lib/config.ts

```typescript
import * as pulumi from "@pulumi/pulumi";

export interface EnvironmentConfig {
  environment: string;
  region: string;
  vpcCidr: string;
  availabilityZones: string[];
  ecsTaskCount: number;
  ecsTaskCpu: string;
  ecsTaskMemory: string;
  rdsInstanceClass: string;
  rdsEngineMode?: string;
  enableAutoScaling: boolean;
  sslCertificateArn?: string;
  tags: { [key: string]: string };
  s3LifecycleRules: {
    enabled: boolean;
    transitionDays?: number;
    expirationDays?: number;
  };
  rdsBackupRetentionDays: number;
  permissionBoundaryArn?: string;
}

export function getConfig(): EnvironmentConfig {
  const config = new pulumi.Config();
  const stack = pulumi.getStack();

  return {
    environment: config.require("environment"),
    region: config.get("region") || "us-east-1",
    vpcCidr: config.require("vpcCidr"),
    availabilityZones: config.requireObject<string[]>("availabilityZones"),
    ecsTaskCount: config.requireNumber("ecsTaskCount"),
    ecsTaskCpu: config.require("ecsTaskCpu"),
    ecsTaskMemory: config.require("ecsTaskMemory"),
    rdsInstanceClass: config.require("rdsInstanceClass"),
    rdsEngineMode: config.get("rdsEngineMode"),
    enableAutoScaling: config.requireBoolean("enableAutoScaling"),
    sslCertificateArn: config.get("sslCertificateArn"),
    tags: {
      Environment: config.require("environment"),
      Owner: config.get("owner") || "platform-team",
      CostCenter: config.get("costCenter") || "engineering",
      ManagedBy: "pulumi",
      Stack: stack,
    },
    s3LifecycleRules: {
      enabled: config.requireBoolean("s3LifecycleEnabled"),
      transitionDays: config.getNumber("s3TransitionDays"),
      expirationDays: config.getNumber("s3ExpirationDays"),
    },
    rdsBackupRetentionDays: config.getNumber("rdsBackupRetentionDays") || 7,
    permissionBoundaryArn: config.get("permissionBoundaryArn"),
  };
}
```

## File: lib/components/vpc.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface VpcComponentArgs {
  vpcCidr: string;
  availabilityZones: string[];
  environmentSuffix: string;
  tags: { [key: string]: string };
}

export class VpcComponent extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnets: aws.ec2.Subnet[];
  public readonly privateSubnets: aws.ec2.Subnet[];
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly publicRouteTable: aws.ec2.RouteTable;
  public readonly privateRouteTables: aws.ec2.RouteTable[];
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];

  constructor(name: string, args: VpcComponentArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:network:VpcComponent", name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // VPC
    this.vpc = new aws.ec2.Vpc(`vpc-${args.environmentSuffix}`, {
      cidrBlock: args.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...args.tags,
        Name: `vpc-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    this.vpcId = this.vpc.id;

    // Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(`igw-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: {
        ...args.tags,
        Name: `igw-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    // Public Subnets
    this.publicSubnets = args.availabilityZones.map((az, index) => {
      const cidrBlock = `10.${index}.1.0/24`;
      return new aws.ec2.Subnet(`public-subnet-${index}-${args.environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidrBlock,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          ...args.tags,
          Name: `public-subnet-${index}-${args.environmentSuffix}`,
          Type: "public",
        },
      }, defaultResourceOptions);
    });

    this.publicSubnetIds = this.publicSubnets.map(subnet => subnet.id);

    // Public Route Table
    this.publicRouteTable = new aws.ec2.RouteTable(`public-rt-${args.environmentSuffix}`, {
      vpcId: this.vpc.id,
      tags: {
        ...args.tags,
        Name: `public-rt-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    // Public Route to Internet
    new aws.ec2.Route(`public-route-${args.environmentSuffix}`, {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    }, defaultResourceOptions);

    // Associate Public Subnets with Public Route Table
    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(`public-rta-${index}-${args.environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: this.publicRouteTable.id,
      }, defaultResourceOptions);
    });

    // Private Subnets
    this.privateSubnets = args.availabilityZones.map((az, index) => {
      const cidrBlock = `10.${index}.2.0/24`;
      return new aws.ec2.Subnet(`private-subnet-${index}-${args.environmentSuffix}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidrBlock,
        availabilityZone: az,
        tags: {
          ...args.tags,
          Name: `private-subnet-${index}-${args.environmentSuffix}`,
          Type: "private",
        },
      }, defaultResourceOptions);
    });

    this.privateSubnetIds = this.privateSubnets.map(subnet => subnet.id);

    // Private Route Tables (one per AZ for potential NAT Gateway flexibility)
    this.privateRouteTables = args.availabilityZones.map((az, index) => {
      const routeTable = new aws.ec2.RouteTable(`private-rt-${index}-${args.environmentSuffix}`, {
        vpcId: this.vpc.id,
        tags: {
          ...args.tags,
          Name: `private-rt-${index}-${args.environmentSuffix}`,
        },
      }, defaultResourceOptions);

      new aws.ec2.RouteTableAssociation(`private-rta-${index}-${args.environmentSuffix}`, {
        subnetId: this.privateSubnets[index].id,
        routeTableId: routeTable.id,
      }, defaultResourceOptions);

      return routeTable;
    });

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
```

## File: lib/components/security-groups.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface SecurityGroupsArgs {
  vpcId: pulumi.Input<string>;
  environmentSuffix: string;
  tags: { [key: string]: string };
}

export class SecurityGroupsComponent extends pulumi.ComponentResource {
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ecsSecurityGroup: aws.ec2.SecurityGroup;
  public readonly rdsSecurityGroup: aws.ec2.SecurityGroup;

  constructor(name: string, args: SecurityGroupsArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:security:SecurityGroupsComponent", name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // ALB Security Group
    this.albSecurityGroup = new aws.ec2.SecurityGroup(`alb-sg-${args.environmentSuffix}`, {
      vpcId: args.vpcId,
      description: "Security group for Application Load Balancer",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow HTTP from anywhere",
        },
        {
          protocol: "tcp",
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow HTTPS from anywhere",
        },
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow all outbound traffic",
        },
      ],
      tags: {
        ...args.tags,
        Name: `alb-sg-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    // ECS Security Group
    this.ecsSecurityGroup = new aws.ec2.SecurityGroup(`ecs-sg-${args.environmentSuffix}`, {
      vpcId: args.vpcId,
      description: "Security group for ECS tasks",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 8080,
          toPort: 8080,
          securityGroups: [this.albSecurityGroup.id],
          description: "Allow traffic from ALB",
        },
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow all outbound traffic",
        },
      ],
      tags: {
        ...args.tags,
        Name: `ecs-sg-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    // RDS Security Group
    this.rdsSecurityGroup = new aws.ec2.SecurityGroup(`rds-sg-${args.environmentSuffix}`, {
      vpcId: args.vpcId,
      description: "Security group for RDS database",
      ingress: [
        {
          protocol: "tcp",
          fromPort: 3306,
          toPort: 3306,
          securityGroups: [this.ecsSecurityGroup.id],
          description: "Allow traffic from ECS tasks",
        },
      ],
      egress: [
        {
          protocol: "-1",
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow all outbound traffic",
        },
      ],
      tags: {
        ...args.tags,
        Name: `rds-sg-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    this.registerOutputs({
      albSecurityGroupId: this.albSecurityGroup.id,
      ecsSecurityGroupId: this.ecsSecurityGroup.id,
      rdsSecurityGroupId: this.rdsSecurityGroup.id,
    });
  }
}
```

## File: lib/components/rds.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";

export interface RdsComponentArgs {
  subnetIds: pulumi.Input<string>[];
  securityGroupId: pulumi.Input<string>;
  instanceClass: string;
  engineMode?: string;
  backupRetentionDays: number;
  environmentSuffix: string;
  tags: { [key: string]: string };
}

export class RdsComponent extends pulumi.ComponentResource {
  public readonly cluster: aws.rds.Cluster;
  public readonly clusterInstance: aws.rds.ClusterInstance;
  public readonly subnetGroup: aws.rds.SubnetGroup;
  public readonly masterPassword: random.RandomPassword;
  public readonly endpoint: pulumi.Output<string>;

  constructor(name: string, args: RdsComponentArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:database:RdsComponent", name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // DB Subnet Group
    this.subnetGroup = new aws.rds.SubnetGroup(`rds-subnet-group-${args.environmentSuffix}`, {
      subnetIds: args.subnetIds,
      tags: {
        ...args.tags,
        Name: `rds-subnet-group-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    // Generate Master Password
    this.masterPassword = new random.RandomPassword(`rds-password-${args.environmentSuffix}`, {
      length: 16,
      special: true,
      overrideSpecial: "!#$%&*()-_=+[]{}<>:?",
    }, defaultResourceOptions);

    // RDS Aurora Cluster
    const engineMode = args.engineMode || "provisioned";
    const serverlessV2ScalingConfiguration = engineMode === "provisioned" ? {
      maxCapacity: 1.0,
      minCapacity: 0.5,
    } : undefined;

    this.cluster = new aws.rds.Cluster(`aurora-cluster-${args.environmentSuffix}`, {
      engine: "aurora-mysql",
      engineVersion: "8.0.mysql_aurora.3.04.0",
      engineMode: engineMode,
      databaseName: "tradingdb",
      masterUsername: "admin",
      masterPassword: this.masterPassword.result,
      dbSubnetGroupName: this.subnetGroup.name,
      vpcSecurityGroupIds: [args.securityGroupId],
      backupRetentionPeriod: args.backupRetentionDays,
      preferredBackupWindow: "03:00-04:00",
      preferredMaintenanceWindow: "mon:04:00-mon:05:00",
      skipFinalSnapshot: true,
      serverlessv2ScalingConfiguration: serverlessV2ScalingConfiguration,
      storageEncrypted: true,
      tags: {
        ...args.tags,
        Name: `aurora-cluster-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    // RDS Cluster Instance
    this.clusterInstance = new aws.rds.ClusterInstance(`aurora-instance-${args.environmentSuffix}`, {
      clusterIdentifier: this.cluster.id,
      instanceClass: args.instanceClass,
      engine: "aurora-mysql",
      engineVersion: "8.0.mysql_aurora.3.04.0",
      publiclyAccessible: false,
      tags: {
        ...args.tags,
        Name: `aurora-instance-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    this.endpoint = this.cluster.endpoint;

    this.registerOutputs({
      clusterEndpoint: this.endpoint,
      clusterId: this.cluster.id,
    });
  }
}
```

## File: lib/components/ecs.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface EcsComponentArgs {
  vpcId: pulumi.Input<string>;
  subnetIds: pulumi.Input<string>[];
  securityGroupId: pulumi.Input<string>;
  taskCount: number;
  taskCpu: string;
  taskMemory: string;
  enableAutoScaling: boolean;
  environmentSuffix: string;
  tags: { [key: string]: string };
}

export class EcsComponent extends pulumi.ComponentResource {
  public readonly cluster: aws.ecs.Cluster;
  public readonly taskDefinition: aws.ecs.TaskDefinition;
  public readonly service: aws.ecs.Service;
  public readonly taskExecutionRole: aws.iam.Role;
  public readonly taskRole: aws.iam.Role;
  public readonly targetGroup: aws.lb.TargetGroup;

  constructor(name: string, args: EcsComponentArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:compute:EcsComponent", name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // ECS Cluster
    this.cluster = new aws.ecs.Cluster(`ecs-cluster-${args.environmentSuffix}`, {
      tags: {
        ...args.tags,
        Name: `ecs-cluster-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    // Task Execution Role
    this.taskExecutionRole = new aws.iam.Role(`ecs-task-execution-role-${args.environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "ecs-tasks.amazonaws.com",
          },
        }],
      }),
      tags: {
        ...args.tags,
        Name: `ecs-task-execution-role-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    new aws.iam.RolePolicyAttachment(`ecs-task-execution-policy-${args.environmentSuffix}`, {
      role: this.taskExecutionRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
    }, defaultResourceOptions);

    // Task Role
    this.taskRole = new aws.iam.Role(`ecs-task-role-${args.environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "ecs-tasks.amazonaws.com",
          },
        }],
      }),
      tags: {
        ...args.tags,
        Name: `ecs-task-role-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    // CloudWatch Logs Group
    const logGroup = new aws.cloudwatch.LogGroup(`ecs-log-group-${args.environmentSuffix}`, {
      retentionInDays: 7,
      tags: {
        ...args.tags,
        Name: `ecs-log-group-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    // Task Definition
    this.taskDefinition = new aws.ecs.TaskDefinition(`ecs-task-${args.environmentSuffix}`, {
      family: `trading-app-${args.environmentSuffix}`,
      networkMode: "awsvpc",
      requiresCompatibilities: ["FARGATE"],
      cpu: args.taskCpu,
      memory: args.taskMemory,
      executionRoleArn: this.taskExecutionRole.arn,
      taskRoleArn: this.taskRole.arn,
      containerDefinitions: JSON.stringify([{
        name: "trading-app",
        image: "nginx:latest",
        portMappings: [{
          containerPort: 8080,
          protocol: "tcp",
        }],
        logConfiguration: {
          logDriver: "awslogs",
          options: {
            "awslogs-group": logGroup.name,
            "awslogs-region": aws.config.region,
            "awslogs-stream-prefix": "ecs",
          },
        },
      }]),
      tags: {
        ...args.tags,
        Name: `ecs-task-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    // Target Group
    this.targetGroup = new aws.lb.TargetGroup(`ecs-tg-${args.environmentSuffix}`, {
      vpcId: args.vpcId,
      port: 8080,
      protocol: "HTTP",
      targetType: "ip",
      healthCheck: {
        enabled: true,
        path: "/",
        protocol: "HTTP",
        matcher: "200-399",
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      tags: {
        ...args.tags,
        Name: `ecs-tg-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    // ECS Service
    this.service = new aws.ecs.Service(`ecs-service-${args.environmentSuffix}`, {
      cluster: this.cluster.arn,
      taskDefinition: this.taskDefinition.arn,
      desiredCount: args.taskCount,
      launchType: "FARGATE",
      networkConfiguration: {
        subnets: args.subnetIds,
        securityGroups: [args.securityGroupId],
        assignPublicIp: false,
      },
      loadBalancers: [{
        targetGroupArn: this.targetGroup.arn,
        containerName: "trading-app",
        containerPort: 8080,
      }],
      tags: {
        ...args.tags,
        Name: `ecs-service-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    // Auto Scaling (if enabled)
    if (args.enableAutoScaling) {
      const scalingTarget = new aws.appautoscaling.Target(`ecs-scaling-target-${args.environmentSuffix}`, {
        maxCapacity: args.taskCount * 2,
        minCapacity: args.taskCount,
        resourceId: pulumi.interpolate`service/${this.cluster.name}/${this.service.name}`,
        scalableDimension: "ecs:service:DesiredCount",
        serviceNamespace: "ecs",
      }, defaultResourceOptions);

      new aws.appautoscaling.Policy(`ecs-scaling-policy-${args.environmentSuffix}`, {
        policyType: "TargetTrackingScaling",
        resourceId: scalingTarget.resourceId,
        scalableDimension: scalingTarget.scalableDimension,
        serviceNamespace: scalingTarget.serviceNamespace,
        targetTrackingScalingPolicyConfiguration: {
          predefinedMetricSpecification: {
            predefinedMetricType: "ECSServiceAverageCPUUtilization",
          },
          targetValue: 70.0,
        },
      }, defaultResourceOptions);
    }

    this.registerOutputs({
      clusterId: this.cluster.id,
      serviceId: this.service.id,
      targetGroupArn: this.targetGroup.arn,
    });
  }
}
```

## File: lib/components/alb.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface AlbComponentArgs {
  vpcId: pulumi.Input<string>;
  subnetIds: pulumi.Input<string>[];
  securityGroupId: pulumi.Input<string>;
  targetGroupArn: pulumi.Input<string>;
  sslCertificateArn?: string;
  environmentSuffix: string;
  tags: { [key: string]: string };
}

export class AlbComponent extends pulumi.ComponentResource {
  public readonly alb: aws.lb.LoadBalancer;
  public readonly httpListener: aws.lb.Listener;
  public readonly httpsListener?: aws.lb.Listener;
  public readonly dnsName: pulumi.Output<string>;

  constructor(name: string, args: AlbComponentArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:loadbalancing:AlbComponent", name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(`alb-${args.environmentSuffix}`, {
      loadBalancerType: "application",
      securityGroups: [args.securityGroupId],
      subnets: args.subnetIds,
      enableDeletionProtection: false,
      tags: {
        ...args.tags,
        Name: `alb-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    this.dnsName = this.alb.dnsName;

    // HTTP Listener
    this.httpListener = new aws.lb.Listener(`alb-listener-http-${args.environmentSuffix}`, {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: "HTTP",
      defaultActions: args.sslCertificateArn ? [{
        type: "redirect",
        redirect: {
          port: "443",
          protocol: "HTTPS",
          statusCode: "HTTP_301",
        },
      }] : [{
        type: "forward",
        targetGroupArn: args.targetGroupArn,
      }],
    }, defaultResourceOptions);

    // HTTPS Listener (if certificate provided)
    if (args.sslCertificateArn) {
      this.httpsListener = new aws.lb.Listener(`alb-listener-https-${args.environmentSuffix}`, {
        loadBalancerArn: this.alb.arn,
        port: 443,
        protocol: "HTTPS",
        sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
        certificateArn: args.sslCertificateArn,
        defaultActions: [{
          type: "forward",
          targetGroupArn: args.targetGroupArn,
        }],
      }, defaultResourceOptions);
    }

    this.registerOutputs({
      albArn: this.alb.arn,
      albDnsName: this.dnsName,
    });
  }
}
```

## File: lib/components/s3.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface S3ComponentArgs {
  lifecycleRules: {
    enabled: boolean;
    transitionDays?: number;
    expirationDays?: number;
  };
  enableVersioning: boolean;
  environmentSuffix: string;
  tags: { [key: string]: string };
}

export class S3Component extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketName: pulumi.Output<string>;

  constructor(name: string, args: S3ComponentArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:storage:S3Component", name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // S3 Bucket
    this.bucket = new aws.s3.Bucket(`trading-data-${args.environmentSuffix}`, {
      forceDestroy: true,
      tags: {
        ...args.tags,
        Name: `trading-data-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    this.bucketName = this.bucket.id;

    // Versioning
    if (args.enableVersioning) {
      new aws.s3.BucketVersioningV2(`bucket-versioning-${args.environmentSuffix}`, {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: "Enabled",
        },
      }, defaultResourceOptions);
    }

    // Encryption
    new aws.s3.BucketServerSideEncryptionConfigurationV2(`bucket-encryption-${args.environmentSuffix}`, {
      bucket: this.bucket.id,
      rules: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: "AES256",
        },
      }],
    }, defaultResourceOptions);

    // Lifecycle Rules
    if (args.lifecycleRules.enabled) {
      const rules: aws.types.input.s3.BucketLifecycleConfigurationV2Rule[] = [];

      if (args.lifecycleRules.transitionDays) {
        rules.push({
          id: "transition-to-ia",
          status: "Enabled",
          transitions: [{
            days: args.lifecycleRules.transitionDays,
            storageClass: "STANDARD_IA",
          }],
        });
      }

      if (args.lifecycleRules.expirationDays) {
        rules.push({
          id: "expiration",
          status: "Enabled",
          expiration: {
            days: args.lifecycleRules.expirationDays,
          },
        });
      }

      if (rules.length > 0) {
        new aws.s3.BucketLifecycleConfigurationV2(`bucket-lifecycle-${args.environmentSuffix}`, {
          bucket: this.bucket.id,
          rules: rules,
        }, defaultResourceOptions);
      }
    }

    // Block Public Access
    new aws.s3.BucketPublicAccessBlock(`bucket-public-access-${args.environmentSuffix}`, {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, defaultResourceOptions);

    this.registerOutputs({
      bucketName: this.bucketName,
      bucketArn: this.bucket.arn,
    });
  }
}
```

## File: lib/components/cloudwatch.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface CloudWatchComponentArgs {
  ecsClusterName: pulumi.Input<string>;
  ecsServiceName: pulumi.Input<string>;
  rdsClusterId: pulumi.Input<string>;
  albArn: pulumi.Input<string>;
  environmentSuffix: string;
  tags: { [key: string]: string };
}

export class CloudWatchComponent extends pulumi.ComponentResource {
  public readonly dashboard: aws.cloudwatch.Dashboard;

  constructor(name: string, args: CloudWatchComponentArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:monitoring:CloudWatchComponent", name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // CloudWatch Dashboard
    this.dashboard = new aws.cloudwatch.Dashboard(`trading-dashboard-${args.environmentSuffix}`, {
      dashboardName: `trading-dashboard-${args.environmentSuffix}`,
      dashboardBody: pulumi.all([
        args.ecsClusterName,
        args.ecsServiceName,
        args.rdsClusterId,
        args.albArn,
      ]).apply(([clusterName, serviceName, clusterId, albArn]) => JSON.stringify({
        widgets: [
          {
            type: "metric",
            properties: {
              metrics: [
                ["AWS/ECS", "CPUUtilization", { stat: "Average" }],
                [".", "MemoryUtilization", { stat: "Average" }],
              ],
              period: 300,
              stat: "Average",
              region: aws.config.region,
              title: "ECS Cluster Metrics",
              yAxis: {
                left: {
                  min: 0,
                  max: 100,
                },
              },
            },
          },
          {
            type: "metric",
            properties: {
              metrics: [
                ["AWS/RDS", "CPUUtilization", { stat: "Average", DBClusterIdentifier: clusterId }],
                [".", "DatabaseConnections", { stat: "Average", DBClusterIdentifier: clusterId }],
              ],
              period: 300,
              stat: "Average",
              region: aws.config.region,
              title: "RDS Cluster Metrics",
            },
          },
          {
            type: "metric",
            properties: {
              metrics: [
                ["AWS/ApplicationELB", "TargetResponseTime", { stat: "Average" }],
                [".", "RequestCount", { stat: "Sum" }],
                [".", "HTTPCode_Target_5XX_Count", { stat: "Sum" }],
              ],
              period: 300,
              stat: "Average",
              region: aws.config.region,
              title: "ALB Metrics",
            },
          },
        ],
      })),
    }, defaultResourceOptions);

    // CloudWatch Alarms
    new aws.cloudwatch.MetricAlarm(`ecs-cpu-alarm-${args.environmentSuffix}`, {
      alarmName: `ecs-high-cpu-${args.environmentSuffix}`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/ECS",
      period: 300,
      statistic: "Average",
      threshold: 80,
      alarmDescription: "ECS CPU utilization is too high",
      tags: args.tags,
    }, defaultResourceOptions);

    new aws.cloudwatch.MetricAlarm(`rds-cpu-alarm-${args.environmentSuffix}`, {
      alarmName: `rds-high-cpu-${args.environmentSuffix}`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/RDS",
      period: 300,
      statistic: "Average",
      threshold: 80,
      alarmDescription: "RDS CPU utilization is too high",
      dimensions: {
        DBClusterIdentifier: args.rdsClusterId,
      },
      tags: args.tags,
    }, defaultResourceOptions);

    this.registerOutputs({
      dashboardName: this.dashboard.dashboardName,
    });
  }
}
```

## File: lib/drift-detection.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface DriftDetectionConfig {
  environments: string[];
  organizationName: string;
}

export class DriftDetector {
  private config: DriftDetectionConfig;

  constructor(config: DriftDetectionConfig) {
    this.config = config;
  }

  public async detectDrift(): Promise<DriftReport> {
    const report: DriftReport = {
      timestamp: new Date().toISOString(),
      environments: {},
    };

    for (const env of this.config.environments) {
      const stackReference = new pulumi.StackReference(
        `${this.config.organizationName}/trading-platform/${env}`
      );

      const outputs = await stackReference.getOutputValue("infraOutputs");
      report.environments[env] = outputs;
    }

    return report;
  }

  public generateComparisonReport(report: DriftReport): string {
    let comparison = "# Infrastructure Comparison Report\n\n";
    comparison += `Generated: ${report.timestamp}\n\n`;

    const envs = Object.keys(report.environments);
    comparison += "## Environment Comparison\n\n";

    for (let i = 0; i < envs.length - 1; i++) {
      const env1 = envs[i];
      const env2 = envs[i + 1];
      comparison += `### ${env1} vs ${env2}\n\n`;
      comparison += this.compareEnvironments(
        report.environments[env1],
        report.environments[env2]
      );
    }

    return comparison;
  }

  private compareEnvironments(env1: any, env2: any): string {
    let diff = "";
    const keys = new Set([...Object.keys(env1), ...Object.keys(env2)]);

    for (const key of keys) {
      if (JSON.stringify(env1[key]) !== JSON.stringify(env2[key])) {
        diff += `- **${key}**\n`;
        diff += `  - Environment 1: ${JSON.stringify(env1[key])}\n`;
        diff += `  - Environment 2: ${JSON.stringify(env2[key])}\n`;
      }
    }

    return diff || "No differences detected\n";
  }
}

export interface DriftReport {
  timestamp: string;
  environments: {
    [envName: string]: any;
  };
}
```

## File: index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import { getConfig } from "./lib/config";
import { VpcComponent } from "./lib/components/vpc";
import { SecurityGroupsComponent } from "./lib/components/security-groups";
import { RdsComponent } from "./lib/components/rds";
import { EcsComponent } from "./lib/components/ecs";
import { AlbComponent } from "./lib/components/alb";
import { S3Component } from "./lib/components/s3";
import { CloudWatchComponent } from "./lib/components/cloudwatch";

// Get environment configuration
const config = getConfig();
const environmentSuffix = pulumi.getStack();

// VPC Component
const vpc = new VpcComponent("trading-vpc", {
  vpcCidr: config.vpcCidr,
  availabilityZones: config.availabilityZones,
  environmentSuffix: environmentSuffix,
  tags: config.tags,
});

// Security Groups
const securityGroups = new SecurityGroupsComponent("trading-security", {
  vpcId: vpc.vpcId,
  environmentSuffix: environmentSuffix,
  tags: config.tags,
});

// RDS Aurora Cluster
const rds = new RdsComponent("trading-database", {
  subnetIds: vpc.privateSubnetIds,
  securityGroupId: securityGroups.rdsSecurityGroup.id,
  instanceClass: config.rdsInstanceClass,
  engineMode: config.rdsEngineMode,
  backupRetentionDays: config.rdsBackupRetentionDays,
  environmentSuffix: environmentSuffix,
  tags: config.tags,
});

// ECS Fargate Cluster and Service
const ecs = new EcsComponent("trading-compute", {
  vpcId: vpc.vpcId,
  subnetIds: vpc.privateSubnetIds,
  securityGroupId: securityGroups.ecsSecurityGroup.id,
  taskCount: config.ecsTaskCount,
  taskCpu: config.ecsTaskCpu,
  taskMemory: config.ecsTaskMemory,
  enableAutoScaling: config.enableAutoScaling,
  environmentSuffix: environmentSuffix,
  tags: config.tags,
});

// Application Load Balancer
const alb = new AlbComponent("trading-alb", {
  vpcId: vpc.vpcId,
  subnetIds: vpc.publicSubnetIds,
  securityGroupId: securityGroups.albSecurityGroup.id,
  targetGroupArn: ecs.targetGroup.arn,
  sslCertificateArn: config.sslCertificateArn,
  environmentSuffix: environmentSuffix,
  tags: config.tags,
});

// S3 Bucket
const s3 = new S3Component("trading-storage", {
  lifecycleRules: config.s3LifecycleRules,
  enableVersioning: config.environment === "prod",
  environmentSuffix: environmentSuffix,
  tags: config.tags,
});

// CloudWatch Dashboard
const cloudwatch = new CloudWatchComponent("trading-monitoring", {
  ecsClusterName: ecs.cluster.name,
  ecsServiceName: ecs.service.name,
  rdsClusterId: rds.cluster.id,
  albArn: alb.alb.arn,
  environmentSuffix: environmentSuffix,
  tags: config.tags,
});

// Export infrastructure outputs
export const infraOutputs = {
  vpcId: vpc.vpcId,
  albDnsName: alb.dnsName,
  rdsEndpoint: rds.endpoint,
  ecsClusterId: ecs.cluster.id,
  s3BucketName: s3.bucketName,
  dashboardName: cloudwatch.dashboard.dashboardName,
  environment: config.environment,
  region: config.region,
  ecsTaskCount: config.ecsTaskCount,
  rdsInstanceClass: config.rdsInstanceClass,
};

// Export key values for cross-stack references
export const vpcId = vpc.vpcId;
export const publicSubnetIds = vpc.publicSubnetIds;
export const privateSubnetIds = vpc.privateSubnetIds;
export const albSecurityGroupId = securityGroups.albSecurityGroup.id;
export const ecsSecurityGroupId = securityGroups.ecsSecurityGroup.id;
export const rdsSecurityGroupId = securityGroups.rdsSecurityGroup.id;
```

## File: Pulumi.dev.yaml

```yaml
config:
  trading-platform:environment: dev
  trading-platform:region: us-east-1
  trading-platform:vpcCidr: 10.0.0.0/16
  trading-platform:availabilityZones:
    - us-east-1a
    - us-east-1b
  trading-platform:ecsTaskCount: 1
  trading-platform:ecsTaskCpu: "256"
  trading-platform:ecsTaskMemory: "512"
  trading-platform:rdsInstanceClass: db.t3.medium
  trading-platform:rdsEngineMode: provisioned
  trading-platform:rdsBackupRetentionDays: 7
  trading-platform:enableAutoScaling: false
  trading-platform:s3LifecycleEnabled: true
  trading-platform:s3TransitionDays: 90
  trading-platform:s3ExpirationDays: 365
  trading-platform:owner: dev-team
  trading-platform:costCenter: development
```

## File: Pulumi.staging.yaml

```yaml
config:
  trading-platform:environment: staging
  trading-platform:region: us-east-1
  trading-platform:vpcCidr: 10.1.0.0/16
  trading-platform:availabilityZones:
    - us-east-1a
    - us-east-1b
  trading-platform:ecsTaskCount: 2
  trading-platform:ecsTaskCpu: "512"
  trading-platform:ecsTaskMemory: "1024"
  trading-platform:rdsInstanceClass: db.r5.large
  trading-platform:rdsEngineMode: provisioned
  trading-platform:rdsBackupRetentionDays: 14
  trading-platform:enableAutoScaling: true
  trading-platform:s3LifecycleEnabled: true
  trading-platform:s3TransitionDays: 60
  trading-platform:s3ExpirationDays: 180
  trading-platform:owner: staging-team
  trading-platform:costCenter: staging
```

## File: Pulumi.prod.yaml

```yaml
config:
  trading-platform:environment: prod
  trading-platform:region: us-east-1
  trading-platform:vpcCidr: 10.2.0.0/16
  trading-platform:availabilityZones:
    - us-east-1a
    - us-east-1b
    - us-east-1c
  trading-platform:ecsTaskCount: 4
  trading-platform:ecsTaskCpu: "1024"
  trading-platform:ecsTaskMemory: "2048"
  trading-platform:rdsInstanceClass: db.r5.xlarge
  trading-platform:rdsEngineMode: provisioned
  trading-platform:rdsBackupRetentionDays: 30
  trading-platform:enableAutoScaling: true
  trading-platform:s3LifecycleEnabled: true
  trading-platform:s3TransitionDays: 30
  trading-platform:s3ExpirationDays: 90
  trading-platform:owner: platform-team
  trading-platform:costCenter: production
```

## File: lib/README.md

```markdown
# Multi-Environment Trading Platform Infrastructure

This Pulumi TypeScript project implements a comprehensive multi-environment infrastructure for a trading platform with consistent deployment patterns across dev, staging, and production environments.

## Architecture Overview

The infrastructure includes:

- VPC: Custom VPC with public and private subnets across multiple availability zones
- ECS Fargate: Container orchestration with environment-specific task counts
- RDS Aurora: MySQL-compatible database with Aurora Serverless v2 support
- Application Load Balancer: HTTP/HTTPS load balancing with SSL support
- S3: Encrypted storage with lifecycle policies
- CloudWatch: Monitoring dashboards and alarms
- IAM: Least-privilege roles and policies

## Prerequisites

- Node.js 18+ installed
- Pulumi CLI installed
- AWS credentials configured
- AWS account with appropriate permissions

## Project Structure

```
.
├── index.ts                      # Main entry point
├── lib/
│   ├── config.ts                 # Configuration management
│   ├── drift-detection.ts        # Drift detection utilities
│   └── components/
│       ├── vpc.ts                # VPC component
│       ├── security-groups.ts    # Security groups component
│       ├── rds.ts                # RDS Aurora component
│       ├── ecs.ts                # ECS Fargate component
│       ├── alb.ts                # Application Load Balancer component
│       ├── s3.ts                 # S3 bucket component
│       └── cloudwatch.ts         # CloudWatch monitoring component
├── Pulumi.dev.yaml               # Dev environment config
├── Pulumi.staging.yaml           # Staging environment config
└── Pulumi.prod.yaml              # Production environment config
```

## Environment-Specific Configurations

### Dev Environment
- ECS Task Count: 1
- ECS Resources: 256 CPU, 512 MB Memory
- RDS Instance: db.t3.medium
- Auto Scaling: Disabled
- Backup Retention: 7 days

### Staging Environment
- ECS Task Count: 2
- ECS Resources: 512 CPU, 1024 MB Memory
- RDS Instance: db.r5.large
- Auto Scaling: Enabled
- Backup Retention: 14 days

### Production Environment
- ECS Task Count: 4
- ECS Resources: 1024 CPU, 2048 MB Memory
- RDS Instance: db.r5.xlarge
- Auto Scaling: Enabled
- Backup Retention: 30 days

## Deployment Instructions

### Deploy Dev Environment

```bash
pulumi stack select dev
pulumi up
```

### Deploy Staging Environment

```bash
pulumi stack select staging
pulumi up
```

### Deploy Production Environment

```bash
pulumi stack select prod
pulumi up
```

## Cross-Stack References

To reference resources from another stack:

```typescript
import * as pulumi from "@pulumi/pulumi";

const devStack = new pulumi.StackReference("organization/trading-platform/dev");
const devVpcId = await devStack.getOutputValue("vpcId");
```

## Drift Detection

Run drift detection to compare configurations:

```typescript
import { DriftDetector } from "./lib/drift-detection";

const detector = new DriftDetector({
  environments: ["dev", "staging", "prod"],
  organizationName: "your-org",
});

const report = await detector.detectDrift();
const comparison = detector.generateComparisonReport(report);
console.log(comparison);
```

## Resource Naming Convention

All resources follow the naming pattern: {resource-type}-{environmentSuffix}

Example:
- vpc-dev
- ecs-cluster-staging
- aurora-cluster-prod

## Security Features

- All S3 buckets encrypted at rest with AES256
- RDS clusters use encryption at rest
- Security groups follow least-privilege principles
- IAM roles use environment-specific trust policies
- All public access to S3 buckets blocked

## Monitoring

CloudWatch dashboards provide unified views of:
- ECS CPU and memory utilization
- RDS cluster performance metrics
- ALB request counts and response times
- Custom alarms for high CPU utilization

## Cost Optimization

- Aurora Serverless v2 scaling for cost efficiency
- S3 lifecycle policies to transition to IA storage
- Auto-scaling for staging and production environments
- Minimal NAT Gateway usage

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured as destroyable with no retention policies for easy cleanup.

## Troubleshooting

### Common Issues

1. Stack already exists: Use pulumi stack select <name> to switch to existing stack
2. AWS credentials: Ensure AWS credentials are configured with aws configure
3. Pulumi organization: Update organization name in drift detection configuration

## Support

For issues or questions, contact the platform team.
```
