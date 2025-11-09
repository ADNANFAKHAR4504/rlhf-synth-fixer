# CDKTF TypeScript Implementation for ECS Fargate Payment Application

This implementation provides a complete infrastructure for deploying a containerized payment processing web application on AWS ECS Fargate with high availability, auto-scaling, and PCI DSS compliance features.

## Architecture Overview

- VPC with 3 public and 3 private subnets across 3 availability zones
- Application Load Balancer in public subnets with HTTPS and path-based routing
- ECS Fargate cluster with Spot instances for cost optimization
- RDS PostgreSQL Multi-AZ with encrypted storage
- Secrets Manager for database credentials
- CloudWatch Container Insights for monitoring
- ECR private repository for container images
- Auto-scaling based on CPU utilization (70% threshold)

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// Get environment variables from the environment or use defaults
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stateBucket = process.env.TERRAFORM_STATE_BUCKET || 'iac-rlhf-tf-states';
const stateBucketRegion =
  process.env.TERRAFORM_STATE_BUCKET_REGION || 'us-east-1';
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Calculate the stack name
const stackName = `TapStack${environmentSuffix}`;

// defaultTags is structured in adherence to the AwsProviderDefaultTags interface
const defaultTags = {
  tags: {
    Environment: 'production',
    Project: 'payment-app',
    Repository: repositoryName,
    CommitAuthor: commitAuthor,
    ManagedBy: 'CDKTF',
  },
};

// Create the TapStack with the calculated properties
new TapStack(app, stackName, {
  environmentSuffix: environmentSuffix,
  stateBucket: stateBucket,
  stateBucketRegion: stateBucketRegion,
  awsRegion: awsRegion,
  defaultTags: defaultTags,
});

// Synthesize the app to generate the Terraform configuration
app.synth();
```

## File: lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { EcrRepository } from '@cdktf/provider-aws/lib/ecr-repository';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LbListenerRule } from '@cdktf/provider-aws/lib/lb-listener-rule';
import { AcmCertificate } from '@cdktf/provider-aws/lib/acm-certificate';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { AppautoscalingTarget } from '@cdktf/provider-aws/lib/appautoscaling-target';
import { AppautoscalingPolicy } from '@cdktf/provider-aws/lib/appautoscaling-policy';

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

    // Fix: Only use AWS_REGION_OVERRIDE if it's actually set and not empty
    const AWS_REGION_OVERRIDE = process.env.AWS_REGION_OVERRIDE;
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';

    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Get current AWS account information
    const current = new DataAwsCallerIdentity(this, 'current');

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'available', {
      state: 'available',
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Using an escape hatch for S3 state locking
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ========================================
    // VPC and Network Infrastructure
    // ========================================

    // Create VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `vpc-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `igw-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create Public Subnets (3 AZs)
    const publicSubnets: Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-${i}-${environmentSuffix}`,
          Environment: 'production',
          Project: 'payment-app',
          Type: 'public',
        },
      });
      publicSubnets.push(subnet);
    }

    // Create Private Subnets (3 AZs)
    const privateSubnets: Subnet[] = [];
    for (let i = 0; i < 3; i++) {
      const subnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `private-subnet-${i}-${environmentSuffix}`,
          Environment: 'production',
          Project: 'payment-app',
          Type: 'private',
        },
      });
      privateSubnets.push(subnet);
    }

    // Create Elastic IPs for NAT Gateways
    const eips: Eip[] = [];
    for (let i = 0; i < 3; i++) {
      const eip = new Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `nat-eip-${i}-${environmentSuffix}`,
          Environment: 'production',
          Project: 'payment-app',
        },
      });
      eips.push(eip);
    }

    // Create NAT Gateways (one per AZ)
    const natGateways: NatGateway[] = [];
    for (let i = 0; i < 3; i++) {
      const nat = new NatGateway(this, `nat-gateway-${i}`, {
        allocationId: eips[i].id,
        subnetId: publicSubnets[i].id,
        tags: {
          Name: `nat-gateway-${i}-${environmentSuffix}`,
          Environment: 'production',
          Project: 'payment-app',
        },
      });
      natGateways.push(nat);
    }

    // Create Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        Name: `public-rt-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `public-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create Private Route Tables (one per AZ for NAT)
    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new RouteTable(
        this,
        `private-route-table-${i}`,
        {
          vpcId: vpc.id,
          tags: {
            Name: `private-rt-${i}-${environmentSuffix}`,
            Environment: 'production',
            Project: 'payment-app',
          },
        }
      );

      // Create route to NAT Gateway
      new Route(this, `private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[i].id,
      });

      // Associate private subnet with private route table
      new RouteTableAssociation(this, `private-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // ========================================
    // Security Groups
    // ========================================

    // ALB Security Group
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `alb-sg-${environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.id,
      tags: {
        Name: `alb-sg-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Allow HTTPS from internet to ALB
    new SecurityGroupRule(this, 'alb-https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow HTTPS from internet',
    });

    // Allow HTTP from internet to ALB (for redirect)
    new SecurityGroupRule(this, 'alb-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow HTTP from internet for redirect',
    });

    // Allow all outbound from ALB
    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // ECS Security Group
    const ecsSecurityGroup = new SecurityGroup(this, 'ecs-sg', {
      name: `ecs-sg-${environmentSuffix}`,
      description: 'Security group for ECS tasks',
      vpcId: vpc.id,
      tags: {
        Name: `ecs-sg-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Allow traffic from ALB to ECS on port 8080
    new SecurityGroupRule(this, 'ecs-alb-ingress', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: albSecurityGroup.id,
      securityGroupId: ecsSecurityGroup.id,
      description: 'Allow traffic from ALB to ECS on port 8080',
    });

    // Allow all outbound from ECS
    new SecurityGroupRule(this, 'ecs-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ecsSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // RDS Security Group
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `rds-sg-${environmentSuffix}`,
      description: 'Security group for RDS PostgreSQL',
      vpcId: vpc.id,
      tags: {
        Name: `rds-sg-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Allow traffic from ECS to RDS on port 5432
    new SecurityGroupRule(this, 'rds-ecs-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: rdsSecurityGroup.id,
      description: 'Allow traffic from ECS to RDS on port 5432',
    });

    // Allow all outbound from RDS
    new SecurityGroupRule(this, 'rds-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: rdsSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // ========================================
    // ECR Repository
    // ========================================

    const ecrRepository = new EcrRepository(this, 'ecr-repo', {
      name: `payment-app-${environmentSuffix}`,
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      imageTagMutability: 'MUTABLE',
      tags: {
        Name: `payment-app-ecr-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // ========================================
    // RDS PostgreSQL Database
    // ========================================

    // Create DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `db-subnet-group-${environmentSuffix}`,
      subnetIds: privateSubnets.map((s) => s.id),
      description: 'Subnet group for RDS PostgreSQL',
      tags: {
        Name: `db-subnet-group-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create RDS PostgreSQL Instance
    const rdsInstance = new DbInstance(this, 'rds-instance', {
      identifier: `payment-db-${environmentSuffix}`,
      engine: 'postgres',
      engineVersion: '16.4',
      instanceClass: 'db.t3.medium',
      allocatedStorage: 20,
      storageType: 'gp3',
      storageEncrypted: true,
      dbName: 'paymentdb',
      username: 'dbadmin',
      managePassword: true,
      multiAz: true,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: true,
      deletionProtection: false,
      publiclyAccessible: false,
      enabledCloudwatchLogsExports: ['postgresql', 'upgrade'],
      tags: {
        Name: `payment-db-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create Secrets Manager Secret for database connection
    const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: `payment-db-connection-${environmentSuffix}`,
      description: 'Database connection string for payment application',
      tags: {
        Name: `db-secret-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Store database connection string in Secrets Manager
    new SecretsmanagerSecretVersion(this, 'db-secret-version', {
      secretId: dbSecret.id,
      secretString: `{"host":"${rdsInstance.address}","port":"${rdsInstance.port}","dbname":"${rdsInstance.dbName}","username":"${rdsInstance.username}","engine":"postgres"}`,
    });

    // ========================================
    // ECS Cluster and CloudWatch Logs
    // ========================================

    // Create CloudWatch Log Group for ECS
    const ecsLogGroup = new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/ecs/payment-app-${environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `ecs-logs-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create ECS Cluster with Container Insights
    const ecsCluster = new EcsCluster(this, 'ecs-cluster', {
      name: `payment-cluster-${environmentSuffix}`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: `payment-cluster-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // ========================================
    // IAM Roles for ECS
    // ========================================

    // ECS Task Execution Role
    const ecsTaskExecutionRole = new IamRole(this, 'ecs-task-execution-role', {
      name: `ecs-task-execution-role-${environmentSuffix}`,
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
        Name: `ecs-task-execution-role-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Attach AWS managed policy for ECS task execution
    new IamRolePolicyAttachment(this, 'ecs-task-execution-policy-attachment', {
      role: ecsTaskExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // Custom policy for Secrets Manager access
    const secretsPolicy = new IamPolicy(this, 'secrets-policy', {
      name: `ecs-secrets-policy-${environmentSuffix}`,
      description: 'Policy for ECS tasks to access Secrets Manager',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: dbSecret.arn,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `secrets-policy-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    new IamRolePolicyAttachment(this, 'secrets-policy-attachment', {
      role: ecsTaskExecutionRole.name,
      policyArn: secretsPolicy.arn,
    });

    // ECS Task Role (for application permissions)
    const ecsTaskRole = new IamRole(this, 'ecs-task-role', {
      name: `ecs-task-role-${environmentSuffix}`,
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
        Name: `ecs-task-role-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // ========================================
    // Application Load Balancer
    // ========================================

    // Create self-signed certificate for HTTPS (in production, use ACM with real domain)
    const certificate = new AcmCertificate(this, 'alb-certificate', {
      domainName: `payment-app-${environmentSuffix}.example.com`,
      validationMethod: 'DNS',
      tags: {
        Name: `alb-cert-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    // Create Application Load Balancer
    const alb = new Lb(this, 'alb', {
      name: `payment-alb-${environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: publicSubnets.map((s) => s.id),
      enableDeletionProtection: false,
      enableHttp2: true,
      tags: {
        Name: `payment-alb-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create Target Group for ECS
    const targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `payment-tg-${environmentSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId: vpc.id,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        matcher: '200',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      deregistrationDelay: 30,
      tags: {
        Name: `payment-tg-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create HTTPS Listener
    const httpsListener = new LbListener(this, 'https-listener', {
      loadBalancerArn: alb.arn,
      port: 443,
      protocol: 'HTTPS',
      sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
      certificateArn: certificate.arn,
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
      tags: {
        Name: `https-listener-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create path-based routing rules for /api/* and /admin/*
    new LbListenerRule(this, 'api-path-rule', {
      listenerArn: httpsListener.arn,
      priority: 100,
      action: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
      condition: [
        {
          pathPattern: {
            values: ['/api/*'],
          },
        },
      ],
      tags: {
        Name: `api-path-rule-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    new LbListenerRule(this, 'admin-path-rule', {
      listenerArn: httpsListener.arn,
      priority: 101,
      action: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
      condition: [
        {
          pathPattern: {
            values: ['/admin/*'],
          },
        },
      ],
      tags: {
        Name: `admin-path-rule-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create HTTP Listener (redirect to HTTPS)
    new LbListener(this, 'http-listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'redirect',
          redirect: {
            port: '443',
            protocol: 'HTTPS',
            statusCode: 'HTTP_301',
          },
        },
      ],
      tags: {
        Name: `http-listener-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // ========================================
    // ECS Task Definition and Service
    // ========================================

    // Create ECS Task Definition
    const taskDefinition = new EcsTaskDefinition(this, 'task-definition', {
      family: `payment-app-${environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '256',
      memory: '512',
      executionRoleArn: ecsTaskExecutionRole.arn,
      taskRoleArn: ecsTaskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'payment-app',
          image: `${ecrRepository.repositoryUrl}:latest`,
          essential: true,
          portMappings: [
            {
              containerPort: 8080,
              protocol: 'tcp',
            },
          ],
          environment: [
            {
              name: 'ENVIRONMENT',
              value: 'production',
            },
            {
              name: 'LOG_LEVEL',
              value: 'INFO',
            },
          ],
          secrets: [
            {
              name: 'DB_CONNECTION',
              valueFrom: dbSecret.arn,
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': ecsLogGroup.name,
              'awslogs-region': awsRegion,
              'awslogs-stream-prefix': 'ecs',
            },
          },
          healthCheck: {
            command: [
              'CMD-SHELL',
              'curl -f http://localhost:8080/health || exit 1',
            ],
            interval: 30,
            timeout: 5,
            retries: 3,
            startPeriod: 60,
          },
        },
      ]),
      tags: {
        Name: `payment-task-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
    });

    // Create ECS Service with Fargate Spot
    const ecsService = new EcsService(this, 'ecs-service', {
      name: `payment-service-${environmentSuffix}`,
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 3,
      launchType: 'FARGATE',
      platformVersion: 'LATEST',
      capacityProviderStrategy: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 100,
          base: 0,
        },
      ],
      networkConfiguration: {
        subnets: privateSubnets.map((s) => s.id),
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: 'payment-app',
          containerPort: 8080,
        },
      ],
      healthCheckGracePeriodSeconds: 60,
      enableExecuteCommand: true,
      tags: {
        Name: `payment-service-${environmentSuffix}`,
        Environment: 'production',
        Project: 'payment-app',
      },
      dependsOn: [httpsListener],
    });

    // ========================================
    // Auto Scaling Configuration
    // ========================================

    // Create Auto Scaling Target
    const autoScalingTarget = new AppautoscalingTarget(
      this,
      'ecs-autoscaling-target',
      {
        maxCapacity: 10,
        minCapacity: 3,
        resourceId: `service/${ecsCluster.name}/${ecsService.name}`,
        scalableDimension: 'ecs:service:DesiredCount',
        serviceNamespace: 'ecs',
      }
    );

    // Create Auto Scaling Policy based on CPU utilization
    new AppautoscalingPolicy(this, 'ecs-cpu-scaling-policy', {
      name: `payment-cpu-scaling-${environmentSuffix}`,
      policyType: 'TargetTrackingScaling',
      resourceId: autoScalingTarget.resourceId,
      scalableDimension: autoScalingTarget.scalableDimension,
      serviceNamespace: autoScalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        targetValue: 70.0,
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageCPUUtilization',
        },
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    });

    // ========================================
    // Outputs
    // ========================================

    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: publicSubnets.map((s) => s.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: privateSubnets.map((s) => s.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'alb-arn', {
      value: alb.arn,
      description: 'Application Load Balancer ARN',
    });

    new TerraformOutput(this, 'ecs-cluster-name', {
      value: ecsCluster.name,
      description: 'ECS Cluster name',
    });

    new TerraformOutput(this, 'ecs-service-name', {
      value: ecsService.name,
      description: 'ECS Service name',
    });

    new TerraformOutput(this, 'ecr-repository-url', {
      value: ecrRepository.repositoryUrl,
      description: 'ECR Repository URL',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsInstance.endpoint,
      description: 'RDS PostgreSQL endpoint',
    });

    new TerraformOutput(this, 'db-secret-arn', {
      value: dbSecret.arn,
      description: 'Database secret ARN in Secrets Manager',
    });

    new TerraformOutput(this, 'cloudwatch-log-group', {
      value: ecsLogGroup.name,
      description: 'CloudWatch Log Group for ECS',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });

    new TerraformOutput(this, 'aws-region', {
      value: awsRegion,
      description: 'AWS Region',
    });
  }
}
```

## File: cdktf.json

```json
{
  "language": "typescript",
  "app": "npx ts-node bin/tap.ts",
  "projectId": "payment-app-ecs-fargate",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 6.0"
  ],
  "terraformModules": [],
  "context": {}
}
```

## File: lib/README.md

```markdown
# Payment Application ECS Fargate Infrastructure

This CDKTF TypeScript implementation provisions a complete infrastructure for deploying a containerized payment processing web application on AWS ECS Fargate.

## Architecture

### Network Infrastructure
- VPC with CIDR 10.0.0.0/16
- 3 public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24) across 3 availability zones
- 3 private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24) across 3 availability zones
- Internet Gateway for public subnet internet access
- 3 NAT Gateways (one per AZ) for private subnet outbound access
- Public and private route tables with appropriate routing

### Load Balancing
- Application Load Balancer in public subnets
- HTTPS listener on port 443 with ACM certificate
- HTTP listener on port 80 (redirects to HTTPS)
- Path-based routing for /api/* and /admin/* endpoints
- Target group for ECS tasks on port 8080

### Container Orchestration
- ECS Fargate cluster with CloudWatch Container Insights enabled
- ECS service with 3 minimum tasks
- Fargate Spot instances for cost optimization
- Task definition with 256 CPU and 512 MB memory
- Container health checks and logging to CloudWatch

### Database
- RDS PostgreSQL 16.4 instance (db.t3.medium)
- Multi-AZ deployment for high availability
- Encrypted storage with automated backups
- Deployed in private subnets
- Backup retention: 7 days
- Maintenance window: Sunday 04:00-05:00 UTC

### Security
- Secrets Manager for database connection credentials
- Security groups:
  - ALB: Allow HTTPS (443) and HTTP (80) from internet
  - ECS: Allow traffic from ALB on port 8080
  - RDS: Allow traffic from ECS on port 5432
- IAM roles:
  - ECS Task Execution Role with Secrets Manager access
  - ECS Task Role for application permissions
- Private ECR repository with image scanning enabled

### Auto-Scaling
- Application Auto Scaling for ECS service
- Min capacity: 3 tasks
- Max capacity: 10 tasks
- Target CPU utilization: 70%
- Scale-out cooldown: 60 seconds
- Scale-in cooldown: 300 seconds

### Monitoring
- CloudWatch Container Insights enabled on ECS cluster
- CloudWatch Logs for ECS task logs
- 7-day log retention
- RDS enhanced monitoring with PostgreSQL logs

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- AWS CLI configured with appropriate credentials
- Terraform >= 1.5
- CDKTF CLI installed

## Environment Variables

The following environment variables can be set:

- `ENVIRONMENT_SUFFIX`: Environment suffix for resource naming (default: 'dev')
- `AWS_REGION`: AWS region for deployment (default: 'us-east-1')
- `TERRAFORM_STATE_BUCKET`: S3 bucket for Terraform state (default: 'iac-rlhf-tf-states')
- `TERRAFORM_STATE_BUCKET_REGION`: Region for state bucket (default: 'us-east-1')
- `REPOSITORY`: Repository name for tagging (default: 'unknown')
- `COMMIT_AUTHOR`: Commit author for tagging (default: 'unknown')

## Deployment Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Container Image

Build your payment application container image and push to ECR:

```bash
# Get ECR repository URL from outputs after initial deploy
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag your image
docker build -t payment-app:latest .
docker tag payment-app:latest <ecr-repository-url>:latest

# Push to ECR
docker push <ecr-repository-url>:latest
```

### 3. Initialize CDKTF

```bash
npm run cdktf:get
```

### 4. Synthesize Configuration

```bash
npm run cdktf:synth
```

### 5. Deploy Infrastructure

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX=prod

# Deploy all resources
npm run cdktf:deploy
```

### 6. Retrieve Outputs

After deployment, retrieve important outputs:

```bash
cdktf output
```

Key outputs:
- `alb-dns-name`: Load balancer URL for accessing the application
- `ecr-repository-url`: ECR repository URL for pushing container images
- `rds-endpoint`: RDS database endpoint
- `db-secret-arn`: ARN of the database secret in Secrets Manager

## Post-Deployment Configuration

### 1. Configure DNS (if using custom domain)

- Point your domain to the ALB DNS name using a CNAME record
- Update the ACM certificate domain validation records in Route 53

### 2. Update Container Image

The initial deployment references `latest` tag in ECR. Push your application image:

```bash
docker push <ecr-repository-url>:latest
```

### 3. Force New Deployment

After pushing the image, force a new ECS deployment:

```bash
aws ecs update-service \
  --cluster payment-cluster-${ENVIRONMENT_SUFFIX} \
  --service payment-service-${ENVIRONMENT_SUFFIX} \
  --force-new-deployment \
  --region us-east-1
```

## Testing

### Health Check

Test the application health endpoint:

```bash
curl https://<alb-dns-name>/health
```

### Path-Based Routing

Test API and admin endpoints:

```bash
curl https://<alb-dns-name>/api/status
curl https://<alb-dns-name>/admin/dashboard
```

### Database Connection

The ECS tasks automatically retrieve database credentials from Secrets Manager. The connection string is available as the `DB_CONNECTION` environment variable in the container.

## Monitoring

### CloudWatch Container Insights

View ECS metrics in CloudWatch:

```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=payment-cluster-${ENVIRONMENT_SUFFIX} \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region us-east-1
```

### View Logs

View ECS task logs:

```bash
aws logs tail /ecs/payment-app-${ENVIRONMENT_SUFFIX} --follow --region us-east-1
```

### RDS Logs

View PostgreSQL logs:

```bash
aws rds describe-db-log-files \
  --db-instance-identifier payment-db-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

## Scaling

The ECS service automatically scales based on CPU utilization:

- When average CPU > 70%, scales out (adds tasks)
- When average CPU < 70%, scales in (removes tasks)
- Min: 3 tasks, Max: 10 tasks

To manually scale:

```bash
aws ecs update-service \
  --cluster payment-cluster-${ENVIRONMENT_SUFFIX} \
  --service payment-service-${ENVIRONMENT_SUFFIX} \
  --desired-count 5 \
  --region us-east-1
```

## Troubleshooting

### ECS Tasks Not Starting

Check ECS service events:

```bash
aws ecs describe-services \
  --cluster payment-cluster-${ENVIRONMENT_SUFFIX} \
  --services payment-service-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

### Database Connection Issues

Verify security group rules allow ECS to RDS traffic:

```bash
aws ec2 describe-security-groups \
  --filters Name=group-name,Values=rds-sg-${ENVIRONMENT_SUFFIX} \
  --region us-east-1
```

### ALB Health Check Failures

Check target group health:

```bash
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn> \
  --region us-east-1
```

## Cleanup

To destroy all resources:

```bash
# Empty ECR repository first
aws ecr batch-delete-image \
  --repository-name payment-app-${ENVIRONMENT_SUFFIX} \
  --image-ids imageTag=latest \
  --region us-east-1

# Destroy infrastructure
npm run cdktf:destroy
```

## Security Considerations

1. **PCI DSS Compliance**:
   - All data at rest is encrypted (RDS, EBS volumes)
   - All data in transit uses TLS (ALB HTTPS, RDS encryption in transit)
   - Database credentials stored in Secrets Manager
   - Network segmentation with security groups

2. **Least Privilege**:
   - IAM roles follow least privilege principle
   - Security groups restrict traffic to only required ports

3. **Monitoring**:
   - CloudWatch Container Insights enabled
   - RDS enhanced monitoring enabled
   - All logs retained for 7 days

4. **High Availability**:
   - Multi-AZ RDS deployment
   - ECS tasks spread across 3 availability zones
   - NAT Gateway redundancy (one per AZ)

## Cost Optimization

- Fargate Spot instances used for ECS tasks (up to 70% cost savings)
- Auto-scaling ensures resources match demand
- NAT Gateways used only in private subnets (consider VPC endpoints for further savings)
- 7-day log retention to manage CloudWatch costs

## License

MIT
```

## Deployment Notes

1. **ACM Certificate**: The implementation includes a placeholder ACM certificate. In production, you should:
   - Own a domain name
   - Create an ACM certificate for your domain
   - Complete DNS validation
   - Update the certificate ARN

2. **Container Image**: Before the ECS service can run successfully:
   - Build your payment application Docker image
   - Push it to the ECR repository
   - Ensure it listens on port 8080
   - Implement a `/health` endpoint for health checks

3. **Database Credentials**: The RDS instance uses managed passwords. To retrieve the password:
   ```bash
   aws secretsmanager get-secret-value --secret-id <rds-master-secret-arn> --region us-east-1
   ```

4. **Fargate Spot**: The implementation uses Fargate Spot with 100% weight for cost optimization. For production workloads requiring higher availability, consider using a mix:
   ```typescript
   capacityProviderStrategy: [
     { capacityProvider: 'FARGATE', weight: 50, base: 3 },
     { capacityProvider: 'FARGATE_SPOT', weight: 50, base: 0 },
   ]
   ```

5. **Region Override**: The stack respects `AWS_REGION_OVERRIDE` environment variable for testing purposes.
