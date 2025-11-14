# Multi-Environment Infrastructure with CDKTF TypeScript

This implementation provides a complete CDKTF TypeScript solution for managing multi-environment infrastructure across dev, staging, and production AWS accounts.

## File: main.ts

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";

interface EnvironmentConfig {
  name: string;
  account: string;
  cidrBase: number;
  rds: {
    instanceCount: number;
    instanceClass: string;
  };
  ecs: {
    desiredCount: number;
    cpu: string;
    memory: string;
  };
  alarms: {
    cpuThreshold: number;
    memoryThreshold: number;
  };
}

const environments: Record<string, EnvironmentConfig> = {
  dev: {
    name: "dev",
    account: "123456789012",
    cidrBase: 1,
    rds: { instanceCount: 1, instanceClass: "db.t3.medium" },
    ecs: { desiredCount: 1, cpu: "256", memory: "512" },
    alarms: { cpuThreshold: 80, memoryThreshold: 80 }
  },
  staging: {
    name: "staging",
    account: "234567890123",
    cidrBase: 2,
    rds: { instanceCount: 1, instanceClass: "db.t3.large" },
    ecs: { desiredCount: 2, cpu: "512", memory: "1024" },
    alarms: { cpuThreshold: 75, memoryThreshold: 75 }
  },
  prod: {
    name: "prod",
    account: "345678901234",
    cidrBase: 3,
    rds: { instanceCount: 2, instanceClass: "db.r5.large" },
    ecs: { desiredCount: 3, cpu: "1024", memory: "2048" },
    alarms: { cpuThreshold: 70, memoryThreshold: 70 }
  }
};

abstract class BaseEnvironmentStack extends TerraformStack {
  constructor(scope: Construct, id: string, protected config: EnvironmentConfig, protected environmentSuffix: string) {
    super(scope, id);

    new AwsProvider(this, "aws", {
      region: "us-east-1",
      assumeRole: [{
        roleArn: `arn:aws:iam::${config.account}:role/TerraformRole`
      }]
    });
  }
}

class MultiEnvironmentStack extends BaseEnvironmentStack {
  constructor(scope: Construct, id: string, config: EnvironmentConfig, environmentSuffix: string) {
    super(scope, id, config, environmentSuffix);

    // Import constructs
    const vpc = new VpcConstruct(this, "vpc", {
      environmentName: config.name,
      cidrBase: config.cidrBase,
      environmentSuffix
    });

    const aurora = new AuroraConstruct(this, "aurora", {
      vpcId: vpc.vpcId,
      subnetIds: vpc.privateSubnetIds,
      environmentName: config.name,
      instanceCount: config.rds.instanceCount,
      instanceClass: config.rds.instanceClass,
      environmentSuffix
    });

    const ecr = new EcrConstruct(this, "ecr", {
      environmentName: config.name,
      environmentSuffix
    });

    const ecs = new EcsConstruct(this, "ecs", {
      vpcId: vpc.vpcId,
      publicSubnetIds: vpc.publicSubnetIds,
      privateSubnetIds: vpc.privateSubnetIds,
      ecrRepositoryUrl: ecr.repositoryUrl,
      environmentName: config.name,
      desiredCount: config.ecs.desiredCount,
      cpu: config.ecs.cpu,
      memory: config.ecs.memory,
      environmentSuffix
    });

    const monitoring = new MonitoringConstruct(this, "monitoring", {
      environmentName: config.name,
      auroraClusterId: aurora.clusterId,
      ecsClusterName: ecs.clusterName,
      albArn: ecs.albArn,
      cpuThreshold: config.alarms.cpuThreshold,
      memoryThreshold: config.alarms.memoryThreshold,
      environmentSuffix
    });

    // Outputs
    new TerraformOutput(this, "vpc_id", {
      value: vpc.vpcId,
      description: `VPC ID for ${config.name} environment`
    });

    new TerraformOutput(this, "aurora_endpoint", {
      value: aurora.clusterEndpoint,
      description: `Aurora cluster endpoint for ${config.name}`
    });

    new TerraformOutput(this, "alb_dns", {
      value: ecs.albDnsName,
      description: `ALB DNS name for ${config.name}`
    });
  }
}

const app = new App();

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || "default";

Object.values(environments).forEach(config => {
  new MultiEnvironmentStack(app, `${config.name}-stack`, config, environmentSuffix);
});

app.synth();
```

## File: lib/vpc-construct.ts

```typescript
import { Construct } from "constructs";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { Route } from "@cdktf/provider-aws/lib/route";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";

export interface VpcConstructProps {
  environmentName: string;
  cidrBase: number;
  environmentSuffix: string;
}

export class VpcConstruct extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    const azs = new DataAwsAvailabilityZones(this, "azs", {
      state: "available"
    });

    // VPC
    const vpc = new Vpc(this, "vpc", {
      cidrBlock: `10.${props.cidrBase}.0.0/16`,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `vpc-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName,
        ManagedBy: "cdktf"
      }
    });

    this.vpcId = vpc.id;

    // Internet Gateway
    const igw = new InternetGateway(this, "igw", {
      vpcId: vpc.id,
      tags: {
        Name: `igw-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName
      }
    });

    // Public Subnets
    const publicSubnets: Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.${props.cidrBase}.${i}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${i}-${props.environmentName}-${props.environmentSuffix}`,
          Environment: props.environmentName,
          Type: "public"
        }
      });
      publicSubnets.push(subnet);
    }

    // Private Subnets
    const privateSubnets: Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.${props.cidrBase}.${i + 10}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        tags: {
          Name: `private-subnet-${i}-${props.environmentName}-${props.environmentSuffix}`,
          Environment: props.environmentName,
          Type: "private"
        }
      });
      privateSubnets.push(subnet);
    }

    // NAT Gateway (one per AZ for high availability)
    const natGateways: NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new Eip(this, `nat-eip-${i}`, {
        vpc: true,
        tags: {
          Name: `nat-eip-${i}-${props.environmentName}-${props.environmentSuffix}`,
          Environment: props.environmentName
        }
      });

      const nat = new NatGateway(this, `nat-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnets[i].id,
        tags: {
          Name: `nat-${i}-${props.environmentName}-${props.environmentSuffix}`,
          Environment: props.environmentName
        }
      });
      natGateways.push(nat);
    }

    // Public Route Table
    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: vpc.id,
      tags: {
        Name: `public-rt-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName
      }
    });

    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id
    });

    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `public-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id
      });
    });

    // Private Route Tables (one per AZ)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${i}`, {
        vpcId: vpc.id,
        tags: {
          Name: `private-rt-${i}-${props.environmentName}-${props.environmentSuffix}`,
          Environment: props.environmentName
        }
      });

      new Route(this, `private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: natGateways[i].id
      });

      new RouteTableAssociation(this, `private-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id
      });
    });

    this.publicSubnetIds = publicSubnets.map(s => s.id);
    this.privateSubnetIds = privateSubnets.map(s => s.id);
  }
}
```

## File: lib/aurora-construct.ts

```typescript
import { Construct } from "constructs";
import { RdsCluster } from "@cdktf/provider-aws/lib/rds-cluster";
import { RdsClusterInstance } from "@cdktf/provider-aws/lib/rds-cluster-instance";
import { DbSubnetGroup } from "@cdktf/provider-aws/lib/db-subnet-group";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { SecurityGroupRule } from "@cdktf/provider-aws/lib/security-group-rule";
import { SsmParameter } from "@cdktf/provider-aws/lib/ssm-parameter";

export interface AuroraConstructProps {
  vpcId: string;
  subnetIds: string[];
  environmentName: string;
  instanceCount: number;
  instanceClass: string;
  environmentSuffix: string;
}

export class AuroraConstruct extends Construct {
  public readonly clusterId: string;
  public readonly clusterEndpoint: string;

  constructor(scope: Construct, id: string, props: AuroraConstructProps) {
    super(scope, id);

    // Security Group
    const sg = new SecurityGroup(this, "aurora-sg", {
      name: `aurora-sg-${props.environmentName}-${props.environmentSuffix}`,
      description: "Security group for Aurora cluster",
      vpcId: props.vpcId,
      tags: {
        Name: `aurora-sg-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName
      }
    });

    new SecurityGroupRule(this, "aurora-ingress", {
      type: "ingress",
      fromPort: 5432,
      toPort: 5432,
      protocol: "tcp",
      cidrBlocks: [`10.${props.environmentName === "dev" ? 1 : props.environmentName === "staging" ? 2 : 3}.0.0/16`],
      securityGroupId: sg.id
    });

    new SecurityGroupRule(this, "aurora-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: sg.id
    });

    // DB Subnet Group
    const subnetGroup = new DbSubnetGroup(this, "subnet-group", {
      name: `aurora-subnet-${props.environmentName}-${props.environmentSuffix}`,
      subnetIds: props.subnetIds,
      tags: {
        Name: `aurora-subnet-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName
      }
    });

    // Master password stored in SSM
    const masterPassword = new SsmParameter(this, "master-password", {
      name: `/${props.environmentName}/aurora/master-password`,
      type: "SecureString",
      value: "ChangeMe123!",
      tags: {
        Environment: props.environmentName
      }
    });

    // Aurora Cluster
    const cluster = new RdsCluster(this, "cluster", {
      clusterIdentifier: `aurora-${props.environmentName}-${props.environmentSuffix}`,
      engine: "aurora-postgresql",
      engineVersion: "14.6",
      databaseName: "appdb",
      masterUsername: "admin",
      masterPassword: masterPassword.value,
      dbSubnetGroupName: subnetGroup.name,
      vpcSecurityGroupIds: [sg.id],
      backupRetentionPeriod: 7,
      preferredBackupWindow: "03:00-04:00",
      preferredMaintenanceWindow: "sun:04:00-sun:05:00",
      skipFinalSnapshot: true,
      storageEncrypted: true,
      tags: {
        Name: `aurora-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName
      }
    });

    // Cluster Instances
    for (let i = 0; i < props.instanceCount; i++) {
      new RdsClusterInstance(this, `instance-${i}`, {
        identifier: `aurora-${props.environmentName}-${props.environmentSuffix}-${i}`,
        clusterIdentifier: cluster.id,
        instanceClass: props.instanceClass,
        engine: cluster.engine,
        engineVersion: cluster.engineVersion,
        tags: {
          Name: `aurora-instance-${i}-${props.environmentName}-${props.environmentSuffix}`,
          Environment: props.environmentName
        }
      });
    }

    this.clusterId = cluster.id;
    this.clusterEndpoint = cluster.endpoint;
  }
}
```

## File: lib/ecr-construct.ts

```typescript
import { Construct } from "constructs";
import { EcrRepository } from "@cdktf/provider-aws/lib/ecr-repository";
import { EcrLifecyclePolicy } from "@cdktf/provider-aws/lib/ecr-lifecycle-policy";

export interface EcrConstructProps {
  environmentName: string;
  environmentSuffix: string;
}

export class EcrConstruct extends Construct {
  public readonly repositoryUrl: string;

  constructor(scope: Construct, id: string, props: EcrConstructProps) {
    super(scope, id);

    const repo = new EcrRepository(this, "repo", {
      name: `app-repo-${props.environmentSuffix}`,
      imageScanningConfiguration: {
        scanOnPush: true
      },
      imageTagMutability: "MUTABLE",
      tags: {
        Name: `app-repo-${props.environmentSuffix}`,
        Environment: props.environmentName
      }
    });

    new EcrLifecyclePolicy(this, "lifecycle", {
      repository: repo.name,
      policy: JSON.stringify({
        rules: [{
          rulePriority: 1,
          description: "Keep last 10 images",
          selection: {
            tagStatus: "any",
            countType: "imageCountMoreThan",
            countNumber: 10
          },
          action: {
            type: "expire"
          }
        }]
      })
    });

    this.repositoryUrl = repo.repositoryUrl;
  }
}
```

## File: lib/ecs-construct.ts

```typescript
import { Construct } from "constructs";
import { EcsCluster } from "@cdktf/provider-aws/lib/ecs-cluster";
import { EcsTaskDefinition } from "@cdktf/provider-aws/lib/ecs-task-definition";
import { EcsService } from "@cdktf/provider-aws/lib/ecs-service";
import { Lb } from "@cdktf/provider-aws/lib/lb";
import { LbTargetGroup } from "@cdktf/provider-aws/lib/lb-target-group";
import { LbListener } from "@cdktf/provider-aws/lib/lb-listener";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { SecurityGroupRule } from "@cdktf/provider-aws/lib/security-group-rule";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamPolicy } from "@cdktf/provider-aws/lib/iam-policy";

export interface EcsConstructProps {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  ecrRepositoryUrl: string;
  environmentName: string;
  desiredCount: number;
  cpu: string;
  memory: string;
  environmentSuffix: string;
}

export class EcsConstruct extends Construct {
  public readonly clusterName: string;
  public readonly albArn: string;
  public readonly albDnsName: string;

  constructor(scope: Construct, id: string, props: EcsConstructProps) {
    super(scope, id);

    // ECS Cluster
    const cluster = new EcsCluster(this, "cluster", {
      name: `app-cluster-${props.environmentName}-${props.environmentSuffix}`,
      tags: {
        Name: `app-cluster-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName
      }
    });

    // ALB Security Group
    const albSg = new SecurityGroup(this, "alb-sg", {
      name: `alb-sg-${props.environmentName}-${props.environmentSuffix}`,
      description: "Security group for ALB",
      vpcId: props.vpcId,
      tags: {
        Name: `alb-sg-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName
      }
    });

    new SecurityGroupRule(this, "alb-ingress-http", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: albSg.id
    });

    new SecurityGroupRule(this, "alb-ingress-https", {
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: albSg.id
    });

    new SecurityGroupRule(this, "alb-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: albSg.id
    });

    // ECS Task Security Group
    const taskSg = new SecurityGroup(this, "task-sg", {
      name: `ecs-task-sg-${props.environmentName}-${props.environmentSuffix}`,
      description: "Security group for ECS tasks",
      vpcId: props.vpcId,
      tags: {
        Name: `ecs-task-sg-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName
      }
    });

    new SecurityGroupRule(this, "task-ingress", {
      type: "ingress",
      fromPort: 8080,
      toPort: 8080,
      protocol: "tcp",
      sourceSecurityGroupId: albSg.id,
      securityGroupId: taskSg.id
    });

    new SecurityGroupRule(this, "task-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: taskSg.id
    });

    // IAM Roles
    const executionRole = new IamRole(this, "execution-role", {
      name: `ecs-execution-${props.environmentName}-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: { Service: "ecs-tasks.amazonaws.com" },
          Action: "sts:AssumeRole"
        }]
      }),
      tags: {
        Environment: props.environmentName
      }
    });

    new IamRolePolicyAttachment(this, "execution-policy", {
      role: executionRole.name,
      policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    });

    const taskRole = new IamRole(this, "task-role", {
      name: `ecs-task-${props.environmentName}-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: { Service: "ecs-tasks.amazonaws.com" },
          Action: "sts:AssumeRole"
        }]
      }),
      tags: {
        Environment: props.environmentName
      }
    });

    const taskPolicy = new IamPolicy(this, "task-policy", {
      name: `ecs-task-policy-${props.environmentName}-${props.environmentSuffix}`,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Action: [
            "s3:GetObject",
            "s3:PutObject"
          ],
          Resource: `arn:aws:s3:::app-bucket-${props.environmentName}-${props.environmentSuffix}/*`
        }]
      })
    });

    new IamRolePolicyAttachment(this, "task-policy-attachment", {
      role: taskRole.name,
      policyArn: taskPolicy.arn
    });

    // Task Definition
    const taskDef = new EcsTaskDefinition(this, "task-def", {
      family: `app-task-${props.environmentName}-${props.environmentSuffix}`,
      requiresCompatibilities: ["FARGATE"],
      networkMode: "awsvpc",
      cpu: props.cpu,
      memory: props.memory,
      executionRoleArn: executionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: JSON.stringify([{
        name: "app",
        image: `${props.ecrRepositoryUrl}:latest`,
        portMappings: [{
          containerPort: 8080,
          protocol: "tcp"
        }],
        environment: [
          { name: "ENVIRONMENT", value: props.environmentName }
        ],
        logConfiguration: {
          logDriver: "awslogs",
          options: {
            "awslogs-group": `/ecs/${props.environmentName}`,
            "awslogs-region": "us-east-1",
            "awslogs-stream-prefix": "app"
          }
        }
      }]),
      tags: {
        Environment: props.environmentName
      }
    });

    // ALB
    const alb = new Lb(this, "alb", {
      name: `alb-${props.environmentName}-${props.environmentSuffix}`,
      loadBalancerType: "application",
      securityGroups: [albSg.id],
      subnets: props.publicSubnetIds,
      tags: {
        Name: `alb-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName
      }
    });

    const targetGroup = new LbTargetGroup(this, "target-group", {
      name: `tg-${props.environmentName}-${props.environmentSuffix}`,
      port: 8080,
      protocol: "HTTP",
      vpcId: props.vpcId,
      targetType: "ip",
      healthCheck: {
        enabled: true,
        path: "/health",
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30
      },
      tags: {
        Environment: props.environmentName
      }
    });

    new LbListener(this, "listener", {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: "HTTP",
      defaultAction: [{
        type: "forward",
        targetGroupArn: targetGroup.arn
      }]
    });

    // ECS Service
    new EcsService(this, "service", {
      name: `app-service-${props.environmentName}-${props.environmentSuffix}`,
      cluster: cluster.id,
      taskDefinition: taskDef.arn,
      desiredCount: props.desiredCount,
      launchType: "FARGATE",
      networkConfiguration: {
        subnets: props.privateSubnetIds,
        securityGroups: [taskSg.id],
        assignPublicIp: false
      },
      loadBalancer: [{
        targetGroupArn: targetGroup.arn,
        containerName: "app",
        containerPort: 8080
      }],
      tags: {
        Environment: props.environmentName
      }
    });

    this.clusterName = cluster.name;
    this.albArn = alb.arn;
    this.albDnsName = alb.dnsName;
  }
}
```

## File: lib/monitoring-construct.ts

```typescript
import { Construct } from "constructs";
import { CloudwatchDashboard } from "@cdktf/provider-aws/lib/cloudwatch-dashboard";
import { CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch-metric-alarm";
import { SnsTarget } from "@cdktf/provider-aws/lib/sns-topic";

export interface MonitoringConstructProps {
  environmentName: string;
  auroraClusterId: string;
  ecsClusterName: string;
  albArn: string;
  cpuThreshold: number;
  memoryThreshold: number;
  environmentSuffix: string;
}

export class MonitoringConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    // CloudWatch Dashboard
    new CloudwatchDashboard(this, "dashboard", {
      dashboardName: `${props.environmentName}-dashboard-${props.environmentSuffix}`,
      dashboardBody: JSON.stringify({
        widgets: [
          {
            type: "metric",
            properties: {
              metrics: [
                ["AWS/RDS", "CPUUtilization", { stat: "Average" }],
                ["AWS/RDS", "DatabaseConnections", { stat: "Sum" }]
              ],
              period: 300,
              stat: "Average",
              region: "us-east-1",
              title: "Aurora Metrics"
            }
          },
          {
            type: "metric",
            properties: {
              metrics: [
                ["AWS/ECS", "CPUUtilization", { stat: "Average" }],
                ["AWS/ECS", "MemoryUtilization", { stat: "Average" }]
              ],
              period: 300,
              stat: "Average",
              region: "us-east-1",
              title: "ECS Metrics"
            }
          },
          {
            type: "metric",
            properties: {
              metrics: [
                ["AWS/ApplicationELB", "TargetResponseTime", { stat: "Average" }],
                ["AWS/ApplicationELB", "RequestCount", { stat: "Sum" }]
              ],
              period: 300,
              stat: "Average",
              region: "us-east-1",
              title: "ALB Metrics"
            }
          }
        ]
      })
    });

    // CPU Alarm
    new CloudwatchMetricAlarm(this, "cpu-alarm", {
      alarmName: `${props.environmentName}-cpu-${props.environmentSuffix}`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "CPUUtilization",
      namespace: "AWS/ECS",
      period: 300,
      statistic: "Average",
      threshold: props.cpuThreshold,
      alarmDescription: `CPU utilization alarm for ${props.environmentName}`,
      tags: {
        Environment: props.environmentName
      }
    });

    // Memory Alarm
    new CloudwatchMetricAlarm(this, "memory-alarm", {
      alarmName: `${props.environmentName}-memory-${props.environmentSuffix}`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "MemoryUtilization",
      namespace: "AWS/ECS",
      period: 300,
      statistic: "Average",
      threshold: props.memoryThreshold,
      alarmDescription: `Memory utilization alarm for ${props.environmentName}`,
      tags: {
        Environment: props.environmentName
      }
    });
  }
}
```

## File: lib/s3-construct.ts

```typescript
import { Construct } from "constructs";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketLifecycleConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration";
import { S3BucketServerSideEncryptionConfigurationA } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";

export interface S3ConstructProps {
  environmentName: string;
  environmentSuffix: string;
}

export class S3Construct extends Construct {
  public readonly bucketName: string;

  constructor(scope: Construct, id: string, props: S3ConstructProps) {
    super(scope, id);

    const bucket = new S3Bucket(this, "bucket", {
      bucket: `app-bucket-${props.environmentName}-${props.environmentSuffix}`,
      tags: {
        Name: `app-bucket-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName
      }
    });

    new S3BucketServerSideEncryptionConfigurationA(this, "encryption", {
      bucket: bucket.id,
      rule: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: "AES256"
        }
      }]
    });

    new S3BucketPublicAccessBlock(this, "public-access-block", {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });

    new S3BucketLifecycleConfiguration(this, "lifecycle", {
      bucket: bucket.id,
      rule: [{
        id: "transition-to-ia",
        status: "Enabled",
        transition: [{
          days: 30,
          storageClass: "STANDARD_IA"
        }, {
          days: 90,
          storageClass: "GLACIER"
        }]
      }]
    });

    this.bucketName = bucket.id;
  }
}
```

## File: cdktf.json

```json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "multi-env-infra",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## File: package.json

```json
{
  "name": "multi-environment-infrastructure",
  "version": "1.0.0",
  "description": "Multi-environment infrastructure deployment with CDKTF",
  "main": "main.js",
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "test": "jest"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.0.0"
  }
}
```

## Deployment Instructions

1. Install dependencies:
```bash
npm install
```

2. Get Terraform providers:
```bash
npm run get
```

3. Set environment suffix:
```bash
export ENVIRONMENT_SUFFIX="test123"
```

4. Synthesize infrastructure:
```bash
npm run synth
```

5. Deploy specific environment:
```bash
cdktf deploy dev-stack
cdktf deploy staging-stack
cdktf deploy prod-stack
```

## Architecture Overview

The implementation creates three identical environments (dev, staging, prod) with:

- **VPC**: Environment-specific CIDR blocks (10.1.0.0/16, 10.2.0.0/16, 10.3.0.0/16)
- **Subnets**: 3 public and 3 private subnets across availability zones
- **NAT Gateways**: One per AZ for high availability
- **RDS Aurora**: PostgreSQL clusters with environment-specific instance counts
- **ECS Fargate**: Container services with environment-specific task definitions
- **ALB**: Application Load Balancers with health checks
- **S3**: Encrypted buckets with lifecycle policies
- **CloudWatch**: Dashboards and alarms with environment-specific thresholds
- **IAM**: Least-privilege roles for ECS tasks

All resources include environmentSuffix for uniqueness and proper tagging.
