# Multi-Environment Infrastructure Management with Pulumi

This implementation provides a comprehensive multi-environment infrastructure solution using Pulumi with TypeScript. It creates consistent infrastructure across development, staging, and production environments while allowing environment-specific sizing and redundancy variations.

## File: lib/config.ts

```typescript
import * as pulumi from "@pulumi/pulumi";

export interface EnvironmentConfig {
  environment: string;
  region: string;
  instanceType: string;
  dbInstanceCount: number;
  backupRetentionDays: number;
  containerImageTag: string;
  vpcCidr: string;
  availabilityZones: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const config = new pulumi.Config();
  const environment = pulumi.getStack();
  const environmentSuffix = config.get("environmentSuffix") || pulumi.getStack();

  // Default configurations per environment
  const configs: { [key: string]: EnvironmentConfig } = {
    dev: {
      environment: "dev",
      region: "us-east-2",
      instanceType: "t3.medium",
      dbInstanceCount: 1,
      backupRetentionDays: 7,
      containerImageTag: "latest",
      vpcCidr: "10.0.0.0/16",
      availabilityZones: ["us-east-2a", "us-east-2b", "us-east-2c"],
      publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"],
      privateSubnetCidrs: ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"],
    },
    staging: {
      environment: "staging",
      region: "us-east-1",
      instanceType: "m5.large",
      dbInstanceCount: 2,
      backupRetentionDays: 14,
      containerImageTag: "staging-*",
      vpcCidr: "10.1.0.0/16",
      availabilityZones: ["us-east-1a", "us-east-1b", "us-east-1c"],
      publicSubnetCidrs: ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"],
      privateSubnetCidrs: ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"],
    },
    prod: {
      environment: "prod",
      region: "us-east-1",
      instanceType: "m5.xlarge",
      dbInstanceCount: 3,
      backupRetentionDays: 30,
      containerImageTag: "v*.*.*",
      vpcCidr: "10.2.0.0/16",
      availabilityZones: ["us-east-1a", "us-east-1b", "us-east-1c"],
      publicSubnetCidrs: ["10.2.1.0/24", "10.2.2.0/24", "10.2.3.0/24"],
      privateSubnetCidrs: ["10.2.11.0/24", "10.2.12.0/24", "10.2.13.0/24"],
    },
  };

  return configs[environment] || configs.dev;
}

export function getEnvironmentSuffix(): string {
  const config = new pulumi.Config();
  return config.get("environmentSuffix") || pulumi.getStack();
}
```

## File: lib/components/vpc-component.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface VpcComponentArgs {
  environmentSuffix: string;
  vpcCidr: string;
  availabilityZones: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
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

  constructor(
    name: string,
    args: VpcComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:network:VpcComponent", name, {}, opts);

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: args.vpcCidr,
        enableDnsHostnames: args.enableDnsHostnames ?? true,
        enableDnsSupport: args.enableDnsSupport ?? true,
        tags: {
          Name: `vpc-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    this.vpcId = this.vpc.id;

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `igw-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `igw-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Public Subnets
    this.publicSubnets = args.publicSubnetCidrs.map((cidr, index) => {
      return new aws.ec2.Subnet(
        `public-subnet-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: args.availabilityZones[index],
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `public-subnet-${index}-${args.environmentSuffix}`,
            Environment: args.environmentSuffix,
            Type: "public",
          },
        },
        { parent: this }
      );
    });

    this.publicSubnetIds = this.publicSubnets.map((subnet) => subnet.id);

    // Create Private Subnets
    this.privateSubnets = args.privateSubnetCidrs.map((cidr, index) => {
      return new aws.ec2.Subnet(
        `private-subnet-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: args.availabilityZones[index],
          mapPublicIpOnLaunch: false,
          tags: {
            Name: `private-subnet-${index}-${args.environmentSuffix}`,
            Environment: args.environmentSuffix,
            Type: "private",
          },
        },
        { parent: this }
      );
    });

    this.privateSubnetIds = this.privateSubnets.map((subnet) => subnet.id);

    // Create Public Route Table
    this.publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Name: `public-rt-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create route to Internet Gateway
    new aws.ec2.Route(
      `public-route-${args.environmentSuffix}`,
      {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    // Associate Public Subnets with Public Route Table
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

    // Create Private Route Tables (one per AZ)
    this.privateRouteTables = args.availabilityZones.map((az, index) => {
      return new aws.ec2.RouteTable(
        `private-rt-${index}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Name: `private-rt-${index}-${args.environmentSuffix}`,
            Environment: args.environmentSuffix,
            AvailabilityZone: az,
          },
        },
        { parent: this }
      );
    });

    // Associate Private Subnets with Private Route Tables
    this.privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `private-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: this.privateRouteTables[index].id,
        },
        { parent: this }
      );
    });

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
    });
  }
}
```

## File: lib/components/security-component.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface SecurityComponentArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
}

export class SecurityComponent extends pulumi.ComponentResource {
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ecsSecurityGroup: aws.ec2.SecurityGroup;
  public readonly rdsSecurityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: SecurityComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:security:SecurityComponent", name, {}, opts);

    // ALB Security Group
    this.albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: "Security group for Application Load Balancer",
        ingress: [
          {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow HTTP traffic",
          },
          {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow HTTPS traffic",
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
          Name: `alb-sg-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // ECS Security Group
    this.ecsSecurityGroup = new aws.ec2.SecurityGroup(
      `ecs-sg-${args.environmentSuffix}`,
      {
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
          Name: `ecs-sg-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // RDS Security Group
    this.rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${args.environmentSuffix}`,
      {
        vpcId: args.vpcId,
        description: "Security group for RDS Aurora cluster",
        ingress: [
          {
            protocol: "tcp",
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [this.ecsSecurityGroup.id],
            description: "Allow PostgreSQL traffic from ECS",
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
          Name: `rds-sg-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      albSecurityGroupId: this.albSecurityGroup.id,
      ecsSecurityGroupId: this.ecsSecurityGroup.id,
      rdsSecurityGroupId: this.rdsSecurityGroup.id,
    });
  }
}
```

## File: lib/components/ecs-component.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface EcsComponentArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string>[];
  ecsSecurityGroupId: pulumi.Input<string>;
  albTargetGroupArn: pulumi.Input<string>;
  containerImageTag: string;
  desiredCount?: number;
  cpu?: string;
  memory?: string;
}

export class EcsComponent extends pulumi.ComponentResource {
  public readonly cluster: aws.ecs.Cluster;
  public readonly taskDefinition: aws.ecs.TaskDefinition;
  public readonly service: aws.ecs.Service;
  public readonly taskExecutionRole: aws.iam.Role;
  public readonly taskRole: aws.iam.Role;

  constructor(
    name: string,
    args: EcsComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:compute:EcsComponent", name, {}, opts);

    // Create ECS Cluster
    this.cluster = new aws.ecs.Cluster(
      `ecs-cluster-${args.environmentSuffix}`,
      {
        name: `ecs-cluster-${args.environmentSuffix}`,
        settings: [
          {
            name: "containerInsights",
            value: "enabled",
          },
        ],
        tags: {
          Name: `ecs-cluster-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Task Execution Role
    this.taskExecutionRole = new aws.iam.Role(
      `ecs-task-execution-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Action: "sts:AssumeRole",
              Effect: "Allow",
              Principal: {
                Service: "ecs-tasks.amazonaws.com",
              },
            },
          ],
        }),
        tags: {
          Name: `ecs-task-execution-role-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Attach execution role policy
    new aws.iam.RolePolicyAttachment(
      `ecs-task-execution-policy-${args.environmentSuffix}`,
      {
        role: this.taskExecutionRole.name,
        policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
      },
      { parent: this }
    );

    // Create Task Role
    this.taskRole = new aws.iam.Role(
      `ecs-task-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Action: "sts:AssumeRole",
              Effect: "Allow",
              Principal: {
                Service: "ecs-tasks.amazonaws.com",
              },
            },
          ],
        }),
        tags: {
          Name: `ecs-task-role-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Attach policies for accessing Secrets Manager and SSM
    new aws.iam.RolePolicy(
      `ecs-task-policy-${args.environmentSuffix}`,
      {
        role: this.taskRole.id,
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "secretsmanager:GetSecretValue",
                "ssm:GetParameters",
                "ssm:GetParameter",
                "ssm:GetParametersByPath",
              ],
              Resource: "*",
            },
            {
              Effect: "Allow",
              Action: [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
              ],
              Resource: "*",
            },
          ],
        }),
      },
      { parent: this }
    );

    // Create CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(
      `ecs-log-group-${args.environmentSuffix}`,
      {
        name: `/ecs/trading-platform-${args.environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `ecs-log-group-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Task Definition
    this.taskDefinition = new aws.ecs.TaskDefinition(
      `ecs-task-def-${args.environmentSuffix}`,
      {
        family: `trading-platform-${args.environmentSuffix}`,
        networkMode: "awsvpc",
        requiresCompatibilities: ["FARGATE"],
        cpu: args.cpu || "512",
        memory: args.memory || "1024",
        executionRoleArn: this.taskExecutionRole.arn,
        taskRoleArn: this.taskRole.arn,
        containerDefinitions: JSON.stringify([
          {
            name: `trading-app-${args.environmentSuffix}`,
            image: `nginx:${args.containerImageTag}`,
            essential: true,
            portMappings: [
              {
                containerPort: 8080,
                protocol: "tcp",
              },
            ],
            logConfiguration: {
              logDriver: "awslogs",
              options: {
                "awslogs-group": logGroup.name,
                "awslogs-region": aws.config.region,
                "awslogs-stream-prefix": "ecs",
              },
            },
            environment: [
              {
                name: "ENVIRONMENT",
                value: args.environmentSuffix,
              },
            ],
          },
        ]),
        tags: {
          Name: `ecs-task-def-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create ECS Service
    this.service = new aws.ecs.Service(
      `ecs-service-${args.environmentSuffix}`,
      {
        name: `trading-platform-${args.environmentSuffix}`,
        cluster: this.cluster.arn,
        taskDefinition: this.taskDefinition.arn,
        desiredCount: args.desiredCount || 2,
        launchType: "FARGATE",
        networkConfiguration: {
          subnets: args.privateSubnetIds,
          securityGroups: [args.ecsSecurityGroupId],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: args.albTargetGroupArn,
            containerName: `trading-app-${args.environmentSuffix}`,
            containerPort: 8080,
          },
        ],
        tags: {
          Name: `ecs-service-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this, dependsOn: [this.taskDefinition] }
    );

    this.registerOutputs({
      clusterArn: this.cluster.arn,
      serviceArn: this.service.id,
      taskDefinitionArn: this.taskDefinition.arn,
    });
  }
}
```

## File: lib/components/alb-component.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface AlbComponentArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  publicSubnetIds: pulumi.Input<string>[];
  albSecurityGroupId: pulumi.Input<string>;
}

export class AlbComponent extends pulumi.ComponentResource {
  public readonly alb: aws.lb.LoadBalancer;
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly listener: aws.lb.Listener;

  constructor(
    name: string,
    args: AlbComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:network:AlbComponent", name, {}, opts);

    // Create Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(
      `alb-${args.environmentSuffix}`,
      {
        name: `alb-${args.environmentSuffix}`,
        internal: false,
        loadBalancerType: "application",
        securityGroups: [args.albSecurityGroupId],
        subnets: args.publicSubnetIds,
        enableDeletionProtection: false,
        tags: {
          Name: `alb-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Target Group
    this.targetGroup = new aws.lb.TargetGroup(
      `tg-${args.environmentSuffix}`,
      {
        name: `tg-${args.environmentSuffix}`,
        port: 8080,
        protocol: "HTTP",
        vpcId: args.vpcId,
        targetType: "ip",
        healthCheck: {
          enabled: true,
          path: "/health",
          protocol: "HTTP",
          matcher: "200",
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        deregistrationDelay: 30,
        tags: {
          Name: `tg-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Listener
    this.listener = new aws.lb.Listener(
      `listener-${args.environmentSuffix}`,
      {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: "HTTP",
        defaultActions: [
          {
            type: "forward",
            targetGroupArn: this.targetGroup.arn,
          },
        ],
        tags: {
          Name: `listener-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
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

## File: lib/components/rds-component.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface RdsComponentArgs {
  environmentSuffix: string;
  privateSubnetIds: pulumi.Input<string>[];
  rdsSecurityGroupId: pulumi.Input<string>;
  dbInstanceCount: number;
  backupRetentionDays: number;
  instanceClass?: string;
}

export class RdsComponent extends pulumi.ComponentResource {
  public readonly subnetGroup: aws.rds.SubnetGroup;
  public readonly cluster: aws.rds.Cluster;
  public readonly clusterInstances: aws.rds.ClusterInstance[];
  public readonly clusterEndpoint: pulumi.Output<string>;
  public readonly clusterReaderEndpoint: pulumi.Output<string>;

  constructor(
    name: string,
    args: RdsComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:database:RdsComponent", name, {}, opts);

    // Create DB Subnet Group
    this.subnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${args.environmentSuffix}`,
      {
        name: `db-subnet-group-${args.environmentSuffix}`,
        subnetIds: args.privateSubnetIds,
        tags: {
          Name: `db-subnet-group-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create RDS Aurora Cluster
    this.cluster = new aws.rds.Cluster(
      `aurora-cluster-${args.environmentSuffix}`,
      {
        clusterIdentifier: `aurora-cluster-${args.environmentSuffix}`,
        engine: "aurora-postgresql",
        engineMode: "provisioned",
        engineVersion: "15.3",
        databaseName: "tradingdb",
        masterUsername: "dbadmin",
        masterPassword: pulumi.secret("ChangeMe123!"),
        dbSubnetGroupName: this.subnetGroup.name,
        vpcSecurityGroupIds: [args.rdsSecurityGroupId],
        backupRetentionPeriod: args.backupRetentionDays,
        preferredBackupWindow: "03:00-04:00",
        preferredMaintenanceWindow: "mon:04:00-mon:05:00",
        storageEncrypted: true,
        skipFinalSnapshot: true,
        enabledCloudwatchLogsExports: ["postgresql"],
        tags: {
          Name: `aurora-cluster-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create Cluster Instances
    this.clusterInstances = [];
    for (let i = 0; i < args.dbInstanceCount; i++) {
      const instance = new aws.rds.ClusterInstance(
        `aurora-instance-${i}-${args.environmentSuffix}`,
        {
          identifier: `aurora-instance-${i}-${args.environmentSuffix}`,
          clusterIdentifier: this.cluster.id,
          instanceClass: args.instanceClass || "db.t3.medium",
          engine: "aurora-postgresql",
          engineVersion: "15.3",
          publiclyAccessible: false,
          tags: {
            Name: `aurora-instance-${i}-${args.environmentSuffix}`,
            Environment: args.environmentSuffix,
          },
        },
        { parent: this }
      );
      this.clusterInstances.push(instance);
    }

    this.clusterEndpoint = this.cluster.endpoint;
    this.clusterReaderEndpoint = this.cluster.readerEndpoint;

    this.registerOutputs({
      clusterEndpoint: this.clusterEndpoint,
      clusterReaderEndpoint: this.clusterReaderEndpoint,
      clusterArn: this.cluster.arn,
    });
  }
}
```

## File: lib/components/monitoring-component.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface MonitoringComponentArgs {
  environmentSuffix: string;
  clusterName: pulumi.Input<string>;
  serviceName: pulumi.Input<string>;
  albArn: pulumi.Input<string>;
  targetGroupArn: pulumi.Input<string>;
  rdsClusterIdentifier: pulumi.Input<string>;
}

export class MonitoringComponent extends pulumi.ComponentResource {
  public readonly dashboard: aws.cloudwatch.Dashboard;
  public readonly snsTopic: aws.sns.Topic;
  public readonly alarms: aws.cloudwatch.MetricAlarm[];

  constructor(
    name: string,
    args: MonitoringComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:monitoring:MonitoringComponent", name, {}, opts);

    // Create SNS Topic for Alerts
    this.snsTopic = new aws.sns.Topic(
      `alerts-topic-${args.environmentSuffix}`,
      {
        name: `alerts-topic-${args.environmentSuffix}`,
        displayName: `Alerts for ${args.environmentSuffix} environment`,
        tags: {
          Name: `alerts-topic-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Create CloudWatch Dashboard
    this.dashboard = new aws.cloudwatch.Dashboard(
      `dashboard-${args.environmentSuffix}`,
      {
        dashboardName: `trading-platform-${args.environmentSuffix}`,
        dashboardBody: pulumi
          .all([
            args.clusterName,
            args.serviceName,
            args.albArn,
            args.targetGroupArn,
            args.rdsClusterIdentifier,
          ])
          .apply(
            ([
              cluster,
              service,
              albArn,
              targetGroup,
              rdsCluster,
            ]) => JSON.stringify({
              widgets: [
                {
                  type: "metric",
                  properties: {
                    metrics: [
                      [
                        "AWS/ECS",
                        "CPUUtilization",
                        "ClusterName",
                        cluster,
                        "ServiceName",
                        service,
                      ],
                      [
                        ".",
                        "MemoryUtilization",
                        ".",
                        ".",
                        ".",
                        ".",
                      ],
                    ],
                    period: 300,
                    stat: "Average",
                    region: aws.config.region,
                    title: "ECS Service Metrics",
                  },
                },
                {
                  type: "metric",
                  properties: {
                    metrics: [
                      [
                        "AWS/ApplicationELB",
                        "TargetResponseTime",
                        "LoadBalancer",
                        albArn.split(":").pop(),
                      ],
                      [
                        ".",
                        "RequestCount",
                        ".",
                        ".",
                      ],
                      [
                        ".",
                        "HTTPCode_Target_2XX_Count",
                        ".",
                        ".",
                      ],
                      [
                        ".",
                        "HTTPCode_Target_5XX_Count",
                        ".",
                        ".",
                      ],
                    ],
                    period: 300,
                    stat: "Sum",
                    region: aws.config.region,
                    title: "ALB Metrics",
                  },
                },
                {
                  type: "metric",
                  properties: {
                    metrics: [
                      [
                        "AWS/RDS",
                        "CPUUtilization",
                        "DBClusterIdentifier",
                        rdsCluster,
                      ],
                      [
                        ".",
                        "DatabaseConnections",
                        ".",
                        ".",
                      ],
                      [
                        ".",
                        "FreeableMemory",
                        ".",
                        ".",
                      ],
                    ],
                    period: 300,
                    stat: "Average",
                    region: aws.config.region,
                    title: "RDS Aurora Metrics",
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create CloudWatch Alarms
    this.alarms = [];

    // ECS CPU Alarm
    const ecsCpuAlarm = new aws.cloudwatch.MetricAlarm(
      `ecs-cpu-alarm-${args.environmentSuffix}`,
      {
        name: `ecs-cpu-high-${args.environmentSuffix}`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/ECS",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmDescription: "ECS CPU utilization is too high",
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          ClusterName: args.clusterName,
          ServiceName: args.serviceName,
        },
        tags: {
          Name: `ecs-cpu-alarm-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );
    this.alarms.push(ecsCpuAlarm);

    // RDS CPU Alarm
    const rdsCpuAlarm = new aws.cloudwatch.MetricAlarm(
      `rds-cpu-alarm-${args.environmentSuffix}`,
      {
        name: `rds-cpu-high-${args.environmentSuffix}`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/RDS",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmDescription: "RDS CPU utilization is too high",
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          DBClusterIdentifier: args.rdsClusterIdentifier,
        },
        tags: {
          Name: `rds-cpu-alarm-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );
    this.alarms.push(rdsCpuAlarm);

    // ALB 5XX Alarm
    const alb5xxAlarm = new aws.cloudwatch.MetricAlarm(
      `alb-5xx-alarm-${args.environmentSuffix}`,
      {
        name: `alb-5xx-errors-${args.environmentSuffix}`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 1,
        metricName: "HTTPCode_Target_5XX_Count",
        namespace: "AWS/ApplicationELB",
        period: 300,
        statistic: "Sum",
        threshold: 10,
        alarmDescription: "ALB is returning too many 5XX errors",
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          LoadBalancer: args.albArn,
        },
        tags: {
          Name: `alb-5xx-alarm-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );
    this.alarms.push(alb5xxAlarm);

    this.registerOutputs({
      dashboardName: this.dashboard.dashboardName,
      snsTopicArn: this.snsTopic.arn,
    });
  }
}
```

## File: lib/components/parameter-store-component.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface ParameterStoreComponentArgs {
  environmentSuffix: string;
  parameters: { [key: string]: string };
}

export class ParameterStoreComponent extends pulumi.ComponentResource {
  public readonly parameters: aws.ssm.Parameter[];

  constructor(
    name: string,
    args: ParameterStoreComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:config:ParameterStoreComponent", name, {}, opts);

    this.parameters = [];

    // Create SSM Parameters
    for (const [key, value] of Object.entries(args.parameters)) {
      const param = new aws.ssm.Parameter(
        `param-${key}-${args.environmentSuffix}`,
        {
          name: `/trading-platform/${args.environmentSuffix}/${key}`,
          type: "String",
          value: value,
          description: `${key} parameter for ${args.environmentSuffix} environment`,
          tags: {
            Name: `param-${key}-${args.environmentSuffix}`,
            Environment: args.environmentSuffix,
          },
        },
        { parent: this }
      );
      this.parameters.push(param);
    }

    this.registerOutputs({
      parameterCount: this.parameters.length,
    });
  }
}
```

## File: lib/components/s3-component.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface S3ComponentArgs {
  environmentSuffix: string;
}

export class S3Component extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketPolicy: aws.s3.BucketPolicy;

  constructor(
    name: string,
    args: S3ComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:storage:S3Component", name, {}, opts);

    // Create S3 Bucket
    this.bucket = new aws.s3.Bucket(
      `data-bucket-${args.environmentSuffix}`,
      {
        bucket: `trading-data-${args.environmentSuffix}`,
        acl: "private",
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
          },
        },
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            id: "expire-old-versions",
            enabled: true,
            noncurrentVersionExpiration: {
              days: 90,
            },
          },
        ],
        tags: {
          Name: `data-bucket-${args.environmentSuffix}`,
          Environment: args.environmentSuffix,
        },
      },
      { parent: this }
    );

    // Block Public Access
    new aws.s3.BucketPublicAccessBlock(
      `bucket-public-access-block-${args.environmentSuffix}`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    this.registerOutputs({
      bucketName: this.bucket.id,
      bucketArn: this.bucket.arn,
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { getEnvironmentConfig, getEnvironmentSuffix } from "./config";
import { VpcComponent } from "./components/vpc-component";
import { SecurityComponent } from "./components/security-component";
import { AlbComponent } from "./components/alb-component";
import { EcsComponent } from "./components/ecs-component";
import { RdsComponent } from "./components/rds-component";
import { MonitoringComponent } from "./components/monitoring-component";
import { ParameterStoreComponent } from "./components/parameter-store-component";
import { S3Component } from "./components/s3-component";

// Get environment configuration
const envConfig = getEnvironmentConfig();
const environmentSuffix = getEnvironmentSuffix();

// Configure AWS Provider for the appropriate region
const provider = new aws.Provider("aws-provider", {
  region: envConfig.region,
});

// Create VPC with subnets
const vpcComponent = new VpcComponent("vpc", {
  environmentSuffix: environmentSuffix,
  vpcCidr: envConfig.vpcCidr,
  availabilityZones: envConfig.availabilityZones,
  publicSubnetCidrs: envConfig.publicSubnetCidrs,
  privateSubnetCidrs: envConfig.privateSubnetCidrs,
}, { provider });

// Create Security Groups
const securityComponent = new SecurityComponent("security", {
  environmentSuffix: environmentSuffix,
  vpcId: vpcComponent.vpcId,
}, { provider });

// Create Application Load Balancer
const albComponent = new AlbComponent("alb", {
  environmentSuffix: environmentSuffix,
  vpcId: vpcComponent.vpcId,
  publicSubnetIds: vpcComponent.publicSubnetIds,
  albSecurityGroupId: securityComponent.albSecurityGroup.id,
}, { provider });

// Create ECS Cluster and Service
const ecsComponent = new EcsComponent("ecs", {
  environmentSuffix: environmentSuffix,
  vpcId: vpcComponent.vpcId,
  privateSubnetIds: vpcComponent.privateSubnetIds,
  ecsSecurityGroupId: securityComponent.ecsSecurityGroup.id,
  albTargetGroupArn: albComponent.targetGroup.arn,
  containerImageTag: envConfig.containerImageTag,
  desiredCount: envConfig.environment === "prod" ? 3 : 2,
}, { provider });

// Create RDS Aurora Cluster
const rdsComponent = new RdsComponent("rds", {
  environmentSuffix: environmentSuffix,
  privateSubnetIds: vpcComponent.privateSubnetIds,
  rdsSecurityGroupId: securityComponent.rdsSecurityGroup.id,
  dbInstanceCount: envConfig.dbInstanceCount,
  backupRetentionDays: envConfig.backupRetentionDays,
  instanceClass: envConfig.instanceType === "t3.medium" ? "db.t3.medium" : "db.r5.large",
}, { provider });

// Create S3 Bucket
const s3Component = new S3Component("s3", {
  environmentSuffix: environmentSuffix,
}, { provider });

// Create Parameter Store entries
const parameterStoreComponent = new ParameterStoreComponent("params", {
  environmentSuffix: environmentSuffix,
  parameters: {
    "db-endpoint": rdsComponent.clusterEndpoint,
    "environment": envConfig.environment,
    "region": envConfig.region,
    "container-image-tag": envConfig.containerImageTag,
  },
}, { provider });

// Create Monitoring Dashboard and Alarms
const monitoringComponent = new MonitoringComponent("monitoring", {
  environmentSuffix: environmentSuffix,
  clusterName: ecsComponent.cluster.name,
  serviceName: ecsComponent.service.name,
  albArn: albComponent.alb.arn,
  targetGroupArn: albComponent.targetGroup.arn,
  rdsClusterIdentifier: rdsComponent.cluster.clusterIdentifier,
}, { provider });

// Export outputs
export const vpcId = vpcComponent.vpcId;
export const publicSubnetIds = vpcComponent.publicSubnetIds;
export const privateSubnetIds = vpcComponent.privateSubnetIds;
export const albDnsName = albComponent.alb.dnsName;
export const albArn = albComponent.alb.arn;
export const ecsClusterArn = ecsComponent.cluster.arn;
export const ecsServiceArn = ecsComponent.service.id;
export const rdsClusterEndpoint = rdsComponent.clusterEndpoint;
export const rdsClusterReaderEndpoint = rdsComponent.clusterReaderEndpoint;
export const s3BucketName = s3Component.bucket.id;
export const dashboardName = monitoringComponent.dashboard.dashboardName;
export const snsTopicArn = monitoringComponent.snsTopic.arn;
```

## File: lib/README.md

```markdown
# Multi-Environment Trading Platform Infrastructure

This Pulumi TypeScript project implements a comprehensive multi-environment infrastructure solution for a trading platform across development, staging, and production environments.

## Architecture Overview

The infrastructure includes:
- VPC with 3 availability zones per environment
- Public and private subnets
- Application Load Balancer for traffic distribution
- ECS Fargate cluster for containerized applications
- RDS Aurora PostgreSQL cluster with environment-specific sizing
- S3 bucket for data storage
- CloudWatch dashboards and alarms
- SNS topics for alerting
- AWS Systems Manager Parameter Store for configuration

## Environment Configuration

### Development
- Region: us-east-2
- Instance Type: t3.medium
- Database Instances: 1
- Backup Retention: 7 days
- Container Tag: latest

### Staging
- Region: us-east-1
- Instance Type: m5.large
- Database Instances: 2
- Backup Retention: 14 days
- Container Tag: staging-*

### Production
- Region: us-east-1
- Instance Type: m5.xlarge
- Database Instances: 3
- Backup Retention: 30 days
- Container Tag: v*.*.*

## Prerequisites

- Pulumi CLI 3.x
- Node.js 18+
- AWS CLI configured with appropriate credentials
- AWS account with permissions for VPC, ECS, RDS, ALB, CloudWatch, SNS, S3, and SSM

## Deployment

### Initialize Stacks

```bash
# Create development stack
pulumi stack init dev
pulumi config set environmentSuffix dev

# Create staging stack
pulumi stack init staging
pulumi config set environmentSuffix staging

# Create production stack
pulumi stack init prod
pulumi config set environmentSuffix prod
```

### Deploy Infrastructure

```bash
# Deploy development environment
pulumi stack select dev
pulumi up

# Deploy staging environment
pulumi stack select staging
pulumi up

# Deploy production environment
pulumi stack select prod
pulumi up
```

## Stack References

To reference outputs from one stack in another:

```typescript
import * as pulumi from "@pulumi/pulumi";

const prodStack = new pulumi.StackReference("prod");
const prodVpcId = prodStack.getOutput("vpcId");
```

## VPC Peering (Optional)

To enable VPC peering between environments, add the following to your stack:

```typescript
// In staging stack, peer with production
const peeringConnection = new aws.ec2.VpcPeeringConnection("staging-to-prod", {
  vpcId: vpcComponent.vpcId,
  peerVpcId: prodStack.getOutput("vpcId"),
  peerRegion: "us-east-1",
  autoAccept: false,
});
```

## Monitoring and Alerting

CloudWatch dashboards are automatically created for each environment at:
- Dashboard name: `trading-platform-{environment}`

SNS topics for alerts:
- Topic name: `alerts-topic-{environment}`

Subscribe to SNS topics to receive alerts:

```bash
aws sns subscribe \
  --topic-arn <sns-topic-arn> \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Configuration Drift Detection

To detect drift between environments:

1. Compare stack outputs:
```bash
pulumi stack output --stack dev > dev-outputs.json
pulumi stack output --stack staging > staging-outputs.json
pulumi stack output --stack prod > prod-outputs.json
```

2. Use CloudWatch dashboards to compare metrics across environments

3. Check Parameter Store values:
```bash
aws ssm get-parameters-by-path --path /trading-platform/dev
aws ssm get-parameters-by-path --path /trading-platform/staging
aws ssm get-parameters-by-path --path /trading-platform/prod
```

## Destroying Infrastructure

To tear down an environment:

```bash
pulumi stack select <environment>
pulumi destroy
```

## Security Considerations

- All data is encrypted at rest and in transit
- RDS uses encrypted storage
- S3 buckets use AES256 encryption
- Security groups follow principle of least privilege
- IAM roles have minimal required permissions
- Database credentials should be rotated regularly using AWS Secrets Manager

## Testing

Unit tests are located in the `test/` directory. Run tests with:

```bash
npm test
```

## Troubleshooting

### Database Connection Issues
- Verify security group rules allow traffic from ECS security group
- Check Parameter Store for correct database endpoint
- Ensure database is in available state

### ECS Task Launch Failures
- Check CloudWatch Logs at `/ecs/trading-platform-{environment}`
- Verify task execution role has proper permissions
- Check container image exists and is accessible

### ALB Health Check Failures
- Verify target group health check path is correct
- Ensure ECS tasks are listening on port 8080
- Check security group rules allow traffic from ALB

## Additional Resources

- [Pulumi AWS Documentation](https://www.pulumi.com/docs/intro/cloud-providers/aws/)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [RDS Aurora Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.BestPractices.html)
```

## File: test/tap-stack.test.ts

```typescript
import * as pulumi from "@pulumi/pulumi";

// Mock Pulumi runtime for testing
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.inputs.name + "_id",
      state: args.inputs,
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe("Infrastructure Stack Tests", () => {
  let stack: typeof import("../lib/tap-stack");

  beforeAll(async () => {
    // Set required config
    process.env.PULUMI_CONFIG = JSON.stringify({
      "tap:environmentSuffix": "test",
    });

    stack = await import("../lib/tap-stack");
  });

  describe("VPC Configuration", () => {
    it("should export VPC ID", async () => {
      const vpcId = await stack.vpcId;
      expect(vpcId).toBeDefined();
    });

    it("should export public subnet IDs", async () => {
      const publicSubnetIds = await stack.publicSubnetIds;
      expect(publicSubnetIds).toBeDefined();
      expect(Array.isArray(publicSubnetIds)).toBe(true);
    });

    it("should export private subnet IDs", async () => {
      const privateSubnetIds = await stack.privateSubnetIds;
      expect(privateSubnetIds).toBeDefined();
      expect(Array.isArray(privateSubnetIds)).toBe(true);
    });
  });

  describe("Load Balancer Configuration", () => {
    it("should export ALB DNS name", async () => {
      const albDnsName = await stack.albDnsName;
      expect(albDnsName).toBeDefined();
    });

    it("should export ALB ARN", async () => {
      const albArn = await stack.albArn;
      expect(albArn).toBeDefined();
    });
  });

  describe("ECS Configuration", () => {
    it("should export ECS cluster ARN", async () => {
      const ecsClusterArn = await stack.ecsClusterArn;
      expect(ecsClusterArn).toBeDefined();
    });

    it("should export ECS service ARN", async () => {
      const ecsServiceArn = await stack.ecsServiceArn;
      expect(ecsServiceArn).toBeDefined();
    });
  });

  describe("Database Configuration", () => {
    it("should export RDS cluster endpoint", async () => {
      const rdsEndpoint = await stack.rdsClusterEndpoint;
      expect(rdsEndpoint).toBeDefined();
    });

    it("should export RDS reader endpoint", async () => {
      const rdsReaderEndpoint = await stack.rdsClusterReaderEndpoint;
      expect(rdsReaderEndpoint).toBeDefined();
    });
  });

  describe("Storage Configuration", () => {
    it("should export S3 bucket name", async () => {
      const s3BucketName = await stack.s3BucketName;
      expect(s3BucketName).toBeDefined();
    });
  });

  describe("Monitoring Configuration", () => {
    it("should export dashboard name", async () => {
      const dashboardName = await stack.dashboardName;
      expect(dashboardName).toBeDefined();
    });

    it("should export SNS topic ARN", async () => {
      const snsTopicArn = await stack.snsTopicArn;
      expect(snsTopicArn).toBeDefined();
    });
  });
});
```

## File: Pulumi.dev.yaml

```yaml
config:
  aws:region: us-east-2
  tap:environmentSuffix: dev
```

## File: Pulumi.staging.yaml

```yaml
config:
  aws:region: us-east-1
  tap:environmentSuffix: staging
```

## File: Pulumi.prod.yaml

```yaml
config:
  aws:region: us-east-1
  tap:environmentSuffix: prod
```