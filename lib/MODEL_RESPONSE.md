# Payment Processing System Migration - Infrastructure Code

This document contains the complete Pulumi TypeScript infrastructure code for the payment processing migration project.

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';

export interface TapStackProps {
  tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public vpcId: pulumi.Output<string>;
  public dbEndpoint: pulumi.Output<string>;
  public albDns: pulumi.Output<string>;

  constructor(name: string, props?: TapStackProps) {
    super('custom:infra:TapStack', name, {}, {});

    const config = new pulumi.Config();
    const environmentSuffix = config.require('env');
    const region = aws.config.region || 'us-east-1';

    // Get availability zones - ISSUE: Only getting 2 AZs instead of required 3
    const azs = aws.getAvailabilityZones({
      state: 'available',
    });

    // VPC - ISSUE: No tags applied
    const vpc = new aws.ec2.Vpc(`payment-vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
    }, { parent: this });

    this.vpcId = vpc.id;

    // Internet Gateway
    const igw = new aws.ec2.InternetGateway(`payment-igw-${environmentSuffix}`, {
      vpcId: vpc.id,
    }, { parent: this });

    // Create subnets for 2 AZs - ISSUE: Should be 3 AZs
    const publicSubnets: aws.ec2.Subnet[] = [];
    const privateSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < 2; i++) {
      const publicSubnet = new aws.ec2.Subnet(`public-subnet-${i}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: azs.then(az => az.names[i]),
        mapPublicIpOnLaunch: true,
      }, { parent: this });
      publicSubnets.push(publicSubnet);

      const privateSubnet = new aws.ec2.Subnet(`private-subnet-${i}-${environmentSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: azs.then(az => az.names[i]),
      }, { parent: this });
      privateSubnets.push(privateSubnet);
    }

    // NAT Gateway - ISSUE: Creating multiple NAT gateways (expensive)
    const natGateways: aws.ec2.NatGateway[] = [];
    for (let i = 0; i < publicSubnets.length; i++) {
      const eip = new aws.ec2.Eip(`nat-eip-${i}-${environmentSuffix}`, {
        vpc: true,
      }, { parent: this });

      const nat = new aws.ec2.NatGateway(`nat-${i}-${environmentSuffix}`, {
        subnetId: publicSubnets[i].id,
        allocationId: eip.id,
      }, { parent: this });
      natGateways.push(nat);
    }

    // Public route table
    const publicRT = new aws.ec2.RouteTable(`public-rt-${environmentSuffix}`, {
      vpcId: vpc.id,
      routes: [{
        cidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      }],
    }, { parent: this });

    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(`public-rta-${i}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: publicRT.id,
      }, { parent: this });
    });

    // Private route tables
    privateSubnets.forEach((subnet, i) => {
      const privateRT = new aws.ec2.RouteTable(`private-rt-${i}-${environmentSuffix}`, {
        vpcId: vpc.id,
        routes: [{
          cidrBlock: '0.0.0.0/0',
          natGatewayId: natGateways[i].id,
        }],
      }, { parent: this });

      new aws.ec2.RouteTableAssociation(`private-rta-${i}-${environmentSuffix}`, {
        subnetId: subnet.id,
        routeTableId: privateRT.id,
      }, { parent: this });
    });

    // Security Groups
    const albSG = new aws.ec2.SecurityGroup(`alb-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'ALB Security Group',
      ingress: [{
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ['0.0.0.0/0'],
      }],
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      }],
    }, { parent: this });

    const ecsSG = new aws.ec2.SecurityGroup(`ecs-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'ECS Task Security Group',
      ingress: [{
        protocol: 'tcp',
        fromPort: 8080,
        toPort: 8080,
        securityGroups: [albSG.id],
      }],
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      }],
    }, { parent: this });

    const dbSG = new aws.ec2.SecurityGroup(`db-sg-${environmentSuffix}`, {
      vpcId: vpc.id,
      description: 'Database Security Group',
      ingress: [{
        protocol: 'tcp',
        fromPort: 3306,
        toPort: 3306,
        securityGroups: [ecsSG.id],
      }],
      egress: [{
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      }],
    }, { parent: this });

    // RDS Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(`db-subnet-group-${environmentSuffix}`, {
      subnetIds: privateSubnets.map(s => s.id),
    }, { parent: this });

    // ISSUE: Hardcoded password instead of generating and storing in Secrets Manager
    const dbPassword = 'MySecurePassword123!';

    // ISSUE: Using RDS instance instead of Aurora Serverless (slower, more expensive)
    const db = new aws.rds.Instance(`payment-db-${environmentSuffix}`, {
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.medium',
      allocatedStorage: 20,
      dbName: 'payments',
      username: 'admin',
      password: dbPassword,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [dbSG.id],
      storageEncrypted: true,
      backupRetentionPeriod: 7,
      // ISSUE: Missing skip_final_snapshot for destroyability
      skipFinalSnapshot: false,
      multiAz: true,
    }, { parent: this });

    this.dbEndpoint = db.endpoint;

    // ISSUE: Secrets Manager created but not used for DB credentials
    const dbSecret = new aws.secretsmanager.Secret(`db-secret-${environmentSuffix}`, {
      name: `payment-db-credentials-${environmentSuffix}`,
    }, { parent: this });

    // ISSUE: Rotation not configured (requirement is 30 days)
    new aws.secretsmanager.SecretVersion(`db-secret-version-${environmentSuffix}`, {
      secretId: dbSecret.id,
      secretString: pulumi.jsonStringify({
        username: 'admin',
        password: dbPassword,
        endpoint: db.endpoint,
      }),
    }, { parent: this });

    // ECS Cluster
    const cluster = new aws.ecs.Cluster(`payment-cluster-${environmentSuffix}`, {
      name: `payment-cluster-${environmentSuffix}`,
    }, { parent: this });

    // IAM Role for ECS Task Execution
    const taskExecutionRole = new aws.iam.Role(`task-execution-role-${environmentSuffix}`, {
      assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: 'ecs-tasks.amazonaws.com',
      }),
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`task-execution-policy-${environmentSuffix}`, {
      role: taskExecutionRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    }, { parent: this });

    // IAM Role for ECS Task
    const taskRole = new aws.iam.Role(`task-role-${environmentSuffix}`, {
      assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: 'ecs-tasks.amazonaws.com',
      }),
    }, { parent: this });

    // ISSUE: Too broad IAM permissions (should be least privilege)
    new aws.iam.RolePolicy(`task-role-policy-${environmentSuffix}`, {
      role: taskRole.id,
      policy: {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: ['s3:*', 'secretsmanager:*'],
          Resource: '*',
        }],
      },
    }, { parent: this });

    // CloudWatch Log Group
    const logGroup = new aws.cloudwatch.LogGroup(`payment-logs-${environmentSuffix}`, {
      name: `/ecs/payment-${environmentSuffix}`,
      retentionInDays: 7,
    }, { parent: this });

    // ECS Task Definition
    const taskDefinition = new aws.ecs.TaskDefinition(`payment-task-${environmentSuffix}`, {
      family: `payment-${environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '256',
      memory: '512',
      executionRoleArn: taskExecutionRole.arn,
      taskRoleArn: taskRole.arn,
      containerDefinitions: pulumi.jsonStringify([{
        name: 'payment-app',
        image: 'nginx:latest', // ISSUE: Using nginx placeholder instead of actual app
        portMappings: [{
          containerPort: 8080,
          protocol: 'tcp',
        }],
        logConfiguration: {
          logDriver: 'awslogs',
          options: {
            'awslogs-group': logGroup.name,
            'awslogs-region': region,
            'awslogs-stream-prefix': 'payment',
          },
        },
        environment: [{
          name: 'DB_HOST',
          value: db.endpoint,
        }],
      }]),
    }, { parent: this });

    // Application Load Balancer
    const alb = new aws.lb.LoadBalancer(`payment-alb-${environmentSuffix}`, {
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSG.id],
      subnets: publicSubnets.map(s => s.id),
    }, { parent: this });

    this.albDns = alb.dnsName;

    // ISSUE: Missing SSL certificate configuration (requirement is TLS 1.2+)
    // ISSUE: Only one target group (blue-green requires two)
    const targetGroup = new aws.lb.TargetGroup(`payment-tg-${environmentSuffix}`, {
      port: 8080,
      protocol: 'HTTP',
      vpcId: vpc.id,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/health',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
      },
    }, { parent: this });

    // ISSUE: HTTP listener instead of HTTPS
    const listener = new aws.lb.Listener(`payment-listener-${environmentSuffix}`, {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultActions: [{
        type: 'forward',
        targetGroupArn: targetGroup.arn,
      }],
    }, { parent: this });

    // ECS Service
    const service = new aws.ecs.Service(`payment-service-${environmentSuffix}`, {
      cluster: cluster.arn,
      taskDefinition: taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      networkConfiguration: {
        assignPublicIp: false,
        subnets: privateSubnets.map(s => s.id),
        securityGroups: [ecsSG.id],
      },
      loadBalancers: [{
        targetGroupArn: targetGroup.arn,
        containerName: 'payment-app',
        containerPort: 8080,
      }],
    }, { parent: this, dependsOn: [listener] });

    // ISSUE: Auto-scaling configured but missing CloudWatch alarms to trigger it
    const scalingTarget = new aws.appautoscaling.Target(`payment-scaling-target-${environmentSuffix}`, {
      serviceNamespace: 'ecs',
      resourceId: pulumi.interpolate`service/${cluster.name}/${service.name}`,
      scalableDimension: 'ecs:service:DesiredCount',
      minCapacity: 2,
      maxCapacity: 10,
    }, { parent: this });

    new aws.appautoscaling.Policy(`payment-scaling-policy-${environmentSuffix}`, {
      serviceNamespace: 'ecs',
      resourceId: scalingTarget.resourceId,
      scalableDimension: scalingTarget.scalableDimension,
      policyType: 'TargetTrackingScaling',
      targetTrackingScalingPolicyConfiguration: {
        targetValue: 70,
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageCPUUtilization',
        },
      },
    }, { parent: this });

    // ISSUE: CloudWatch Dashboard missing required database metrics
    const dashboard = new aws.cloudwatch.Dashboard(`payment-dashboard-${environmentSuffix}`, {
      dashboardName: `payment-${environmentSuffix}`,
      dashboardBody: pulumi.jsonStringify({
        widgets: [{
          type: 'metric',
          properties: {
            metrics: [
              ['AWS/ECS', 'CPUUtilization', { stat: 'Average' }],
              ['AWS/ECS', 'MemoryUtilization', { stat: 'Average' }],
            ],
            period: 300,
            stat: 'Average',
            region: region,
            title: 'ECS Metrics',
          },
        }],
      }),
    }, { parent: this });

    // ISSUE: Missing CloudWatch alarms (required for CPU, memory, DB connections)

    // ISSUE: AWS Backup not configured (requirement: daily backups, 30-day retention)

    // ISSUE: Step Functions state machine not implemented (requirement: migration orchestration)

    // ISSUE: Systems Manager Parameter Store not used (requirement: application configuration)

    // Stack outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      dbEndpoint: this.dbEndpoint,
      albDns: this.albDns,
      // ISSUE: Missing many required outputs (subnets, security groups, ARNs)
    });
  }
}
```

## File: bin/tap.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

const defaultTags = {
  Environment: environmentSuffix,
  // ISSUE: Missing required tags (CostCenter, MigrationPhase)
};

// ISSUE: No separate stack logic for dev vs prod
const stack = new TapStack('payment-infrastructure', {
  tags: defaultTags,
});

// ISSUE: Exports don't use proper Pulumi output format
export const vpcId = stack.vpcId;
export const dbEndpoint = stack.dbEndpoint;
export const albDnsName = stack.albDns;
```

## Summary

This implementation provides the core infrastructure for the payment processing migration but has several issues that need to be addressed:

1. Only 2 availability zones instead of required 3
2. Missing blue-green deployment setup (only one target group)
3. Hardcoded database password instead of Secrets Manager
4. Using RDS instance instead of Aurora Serverless
5. No secret rotation configured
6. Missing SSL/TLS termination on ALB
7. Incomplete CloudWatch monitoring (missing DB metrics and alarms)
8. No AWS Backup configuration
9. No Step Functions state machine for migration orchestration
10. Missing Systems Manager Parameter Store integration
11. Missing required tags
12. Overly broad IAM permissions
13. Multiple expensive NAT Gateways