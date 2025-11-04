I'll help you set up the infrastructure for the university LMS using CDKTF with TypeScript. Here's the complete solution with all security requirements:

## lib/lms-stack.ts

```typescript
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Fn, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

interface LmsStackProps {
  environmentSuffix: string;
}

export class LmsStack extends Construct {
  constructor(scope: Construct, id: string, props: LmsStackProps) {
    super(scope, id);

    // VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `lms-vpc-${props.environmentSuffix}`,
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `lms-igw-${props.environmentSuffix}`,
      },
    });

    // Public Subnets
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `lms-public-subnet-1-${props.environmentSuffix}`,
      },
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-east-1b',
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `lms-public-subnet-2-${props.environmentSuffix}`,
      },
    });

    // Private Subnets for ECS
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.10.0/24',
      availabilityZone: 'us-east-1a',
      tags: {
        Name: `lms-private-subnet-1-${props.environmentSuffix}`,
      },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: 'us-east-1b',
      tags: {
        Name: `lms-private-subnet-2-${props.environmentSuffix}`,
      },
    });

    // Private Subnets for RDS
    const dbSubnet1 = new Subnet(this, 'db-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.20.0/24',
      availabilityZone: 'us-east-1a',
      tags: {
        Name: `lms-db-subnet-1-${props.environmentSuffix}`,
      },
    });

    const dbSubnet2 = new Subnet(this, 'db-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.21.0/24',
      availabilityZone: 'us-east-1b',
      tags: {
        Name: `lms-db-subnet-2-${props.environmentSuffix}`,
      },
    });

    // Elastic IPs for NAT Gateways
    const eip1 = new Eip(this, 'nat-eip-1', {
      domain: 'vpc',
      tags: {
        Name: `lms-nat-eip-1-${props.environmentSuffix}`,
      },
    });

    const eip2 = new Eip(this, 'nat-eip-2', {
      domain: 'vpc',
      tags: {
        Name: `lms-nat-eip-2-${props.environmentSuffix}`,
      },
    });

    // NAT Gateways
    const natGw1 = new NatGateway(this, 'nat-gw-1', {
      allocationId: eip1.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: `lms-nat-gw-1-${props.environmentSuffix}`,
      },
    });

    const natGw2 = new NatGateway(this, 'nat-gw-2', {
      allocationId: eip2.id,
      subnetId: publicSubnet2.id,
      tags: {
        Name: `lms-nat-gw-2-${props.environmentSuffix}`,
      },
    });

    // Route Table for Public Subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: {
        Name: `lms-public-rt-${props.environmentSuffix}`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new RouteTableAssociation(this, 'public-rta-1', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public-rta-2', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    // Route Tables for Private Subnets
    const privateRouteTable1 = new RouteTable(this, 'private-rt-1', {
      vpcId: vpc.id,
      tags: {
        Name: `lms-private-rt-1-${props.environmentSuffix}`,
      },
    });

    new Route(this, 'private-route-1', {
      routeTableId: privateRouteTable1.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGw1.id,
    });

    const privateRouteTable2 = new RouteTable(this, 'private-rt-2', {
      vpcId: vpc.id,
      tags: {
        Name: `lms-private-rt-2-${props.environmentSuffix}`,
      },
    });

    new Route(this, 'private-route-2', {
      routeTableId: privateRouteTable2.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGw2.id,
    });

    new RouteTableAssociation(this, 'private-rta-1', {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable1.id,
    });

    new RouteTableAssociation(this, 'private-rta-2', {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable2.id,
    });

    // Security Group for ALB
    const albSg = new SecurityGroup(this, 'alb-sg', {
      name: `lms-alb-sg-${props.environmentSuffix}`,
      description: 'Security group for ALB',
      vpcId: vpc.id,
      tags: {
        Name: `lms-alb-sg-${props.environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'alb-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSg.id,
      description: 'Allow HTTP from internet',
    });

    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSg.id,
      description: 'Allow all outbound',
    });

    // Security Group for ECS Tasks
    const ecsSg = new SecurityGroup(this, 'ecs-sg', {
      name: `lms-ecs-sg-${props.environmentSuffix}`,
      description: 'Security group for ECS tasks',
      vpcId: vpc.id,
      tags: {
        Name: `lms-ecs-sg-${props.environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'ecs-ingress', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: albSg.id,
      securityGroupId: ecsSg.id,
      description: 'Allow traffic from ALB',
    });

    new SecurityGroupRule(this, 'ecs-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ecsSg.id,
      description: 'Allow all outbound',
    });

    // Security Group for RDS
    const rdsSg = new SecurityGroup(this, 'rds-sg', {
      name: `lms-rds-sg-${props.environmentSuffix}`,
      description: 'Security group for RDS PostgreSQL',
      vpcId: vpc.id,
      tags: {
        Name: `lms-rds-sg-${props.environmentSuffix}`,
      },
    });

    new SecurityGroupRule(this, 'rds-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSg.id,
      securityGroupId: rdsSg.id,
      description: 'Allow PostgreSQL from ECS',
    });

    // Secrets Manager for DB credentials
    const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: `lms-db-credentials-${props.environmentSuffix}`,
      description: 'Database credentials for LMS',
      tags: {
        Name: `lms-db-credentials-${props.environmentSuffix}`,
      },
    });

    // Database credentials
    const dbUsername = 'lmsadmin';
    const dbName = 'lmsdb';

    // Generate random password for database
    const dbPassword = Fn.join('', [
      'P',
      Fn.substr(Fn.base64encode(Fn.timestamp()), 0, 16),
      '!aA1',
    ]);

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `lms-db-subnet-group-${props.environmentSuffix}`,
      subnetIds: [dbSubnet1.id, dbSubnet2.id],
      description: 'Subnet group for LMS RDS instance',
      tags: {
        Name: `lms-db-subnet-group-${props.environmentSuffix}`,
      },
    });

    // RDS Instance with encryption and SSL
    const rdsInstance = new DbInstance(this, 'rds-instance', {
      identifier: `lms-db-${props.environmentSuffix}`,
      engine: 'postgres',
      engineVersion: '16.3',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp3',
      dbName: dbName,
      username: dbUsername,
      password: dbPassword,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSg.id],
      skipFinalSnapshot: true,
      publiclyAccessible: false,
      storageEncrypted: true,
      multiAz: true,
      backupRetentionPeriod: 7,
      enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],
      parameterGroupName: 'default.postgres16',
      caCertIdentifier: 'rds-ca-rsa2048-g1',
      tags: {
        Name: `lms-db-${props.environmentSuffix}`,
      },
    });

    // Store DB credentials in Secrets Manager after RDS is created
    new SecretsmanagerSecretVersion(this, 'db-secret-version', {
      secretId: dbSecret.id,
      secretString: Fn.jsonencode({
        username: dbUsername,
        password: dbPassword,
        engine: 'postgres',
        host: rdsInstance.address,
        port: 5432,
        dbname: dbName,
      }),
    });

    // IAM Role for ECS Task Execution
    const ecsTaskExecutionRole = new IamRole(this, 'ecs-task-execution-role', {
      name: `lms-ecs-task-execution-role-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `lms-ecs-task-execution-role-${props.environmentSuffix}`,
      },
    });

    new IamRolePolicyAttachment(this, 'ecs-task-execution-policy', {
      role: ecsTaskExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // IAM Policy for Secrets Manager access
    const secretsPolicy = new IamPolicy(this, 'secrets-policy', {
      name: `lms-secrets-policy-${props.environmentSuffix}`,
      description: 'Policy to allow ECS tasks to read secrets',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['secretsmanager:GetSecretValue'],
            Resource: [dbSecret.arn],
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'secrets-policy-attachment', {
      role: ecsTaskExecutionRole.name,
      policyArn: secretsPolicy.arn,
    });

    // IAM Role for ECS Task
    const ecsTaskRole = new IamRole(this, 'ecs-task-role', {
      name: `lms-ecs-task-role-${props.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `lms-ecs-task-role-${props.environmentSuffix}`,
      },
    });

    // CloudWatch Log Group for ECS
    const logGroup = new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/ecs/lms-app-${props.environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `/ecs/lms-app-${props.environmentSuffix}`,
      },
    });

    // ECS Cluster
    const ecsCluster = new EcsCluster(this, 'ecs-cluster', {
      name: `lms-cluster-${props.environmentSuffix}`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: `lms-cluster-${props.environmentSuffix}`,
      },
    });

    // ECS Task Definition
    const taskDefinition = new EcsTaskDefinition(this, 'task-def', {
      family: `lms-task-${props.environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '512',
      memory: '1024',
      executionRoleArn: ecsTaskExecutionRole.arn,
      taskRoleArn: ecsTaskRole.arn,
      containerDefinitions: Fn.jsonencode([
        {
          name: 'lms-app',
          image: 'nginx:latest',
          essential: true,
          portMappings: [
            {
              containerPort: 8080,
              protocol: 'tcp',
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': logGroup.name,
              'awslogs-region': 'us-east-1',
              'awslogs-stream-prefix': 'lms',
            },
          },
          secrets: [
            {
              name: 'DB_HOST',
              valueFrom: `${dbSecret.arn}:host::`,
            },
            {
              name: 'DB_USER',
              valueFrom: `${dbSecret.arn}:username::`,
            },
            {
              name: 'DB_PASSWORD',
              valueFrom: `${dbSecret.arn}:password::`,
            },
            {
              name: 'DB_NAME',
              valueFrom: `${dbSecret.arn}:dbname::`,
            },
          ],
          environment: [
            {
              name: 'DB_PORT',
              value: '5432',
            },
            {
              name: 'DB_SSL_MODE',
              value: 'require',
            },
          ],
        },
      ]),
      tags: {
        Name: `lms-task-${props.environmentSuffix}`,
      },
    });

    // Application Load Balancer
    const alb = new Lb(this, 'alb', {
      name: `lms-alb-${props.environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSg.id],
      subnets: [publicSubnet1.id, publicSubnet2.id],
      enableDeletionProtection: false,
      tags: {
        Name: `lms-alb-${props.environmentSuffix}`,
      },
    });

    // Target Group
    const targetGroup = new LbTargetGroup(this, 'tg', {
      name: `lms-tg-${props.environmentSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId: vpc.id,
      targetType: 'ip',
      deregistrationDelay: '30',
      healthCheck: {
        enabled: true,
        path: '/',
        port: '8080',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: '200-399',
      },
      tags: {
        Name: `lms-tg-${props.environmentSuffix}`,
      },
    });

    // Listener
    new LbListener(this, 'listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
      tags: {
        Name: `lms-listener-${props.environmentSuffix}`,
      },
    });

    // ECS Service
    new EcsService(this, 'ecs-service', {
      name: `lms-service-${props.environmentSuffix}`,
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      platformVersion: 'LATEST',
      healthCheckGracePeriodSeconds: 60,
      networkConfiguration: {
        subnets: [privateSubnet1.id, privateSubnet2.id],
        securityGroups: [ecsSg.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: 'lms-app',
          containerPort: 8080,
        },
      ],
      dependsOn: [alb],
      tags: {
        Name: `lms-service-${props.environmentSuffix}`,
      },
    });

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: alb.dnsName,
      description: 'ALB DNS Name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsInstance.endpoint,
      description: 'RDS Endpoint',
    });

    new TerraformOutput(this, 'db-secret-arn', {
      value: dbSecret.arn,
      description: 'Database Secret ARN',
    });

    new TerraformOutput(this, 'ecs-cluster-name', {
      value: ecsCluster.name,
      description: 'ECS Cluster Name',
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { LmsStack } from './lms-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    new LmsStack(this, `lms-stack-${environmentSuffix}`, {
      environmentSuffix: environmentSuffix,
    });
  }
}

```

This infrastructure includes:
- Complete VPC setup with NAT Gateways for high availability
- ECS Fargate cluster with proper IAM roles and CloudWatch logging
- RDS PostgreSQL with Multi-AZ, encryption at rest, and SSL/TLS support
- Secrets Manager integration with proper IAM permissions
- Application Load Balancer with health checks
- Proper security group configurations
- All resources use environmentSuffix for multi-environment deployment
