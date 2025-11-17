# Multi-Environment Infrastructure with CDKTF

This implementation provides a multi-environment infrastructure setup using CDKTF with ts for a fintech payment processing platform.

## File: lib/tap-stack.ts

```ts
import { Construct } from 'constructs';
import { TerraformStack, S3Backend } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Route } from '@cdktf/provider-aws/lib/route';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { AlbTargetGroup } from '@cdktf/provider-aws/lib/alb-target-group';
import { AlbListener } from '@cdktf/provider-aws/lib/alb-listener';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { VpcEndpoint } from '@cdktf/provider-aws/lib/vpc-endpoint';
import { DataAwsSecretsmanagerSecret } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

export interface TapStackConfig {
  environmentSuffix: string;
  stateBucket: string;
  stateBucketRegion: string;
  awsRegion: string;
  defaultTags: Array<{ tags: { [key: string]: string } }>;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, name: string, config: TapStackConfig) {
    super(scope, name);

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: config.awsRegion,
      defaultTags: config.defaultTags,
    });

    // Configure S3 Backend for remote state
    new S3Backend(this, {
      bucket: config.stateBucket,
      key: `tap-stack-${config.environmentSuffix}.tfstate`,
      region: config.stateBucketRegion,
      encrypt: true,
    });

    // Get environment-specific configuration
    const environment = this.getEnvironmentConfig(config.environmentSuffix);

    // Get available AZs
    const availabilityZones = new DataAwsAvailabilityZones(this, 'available', {
      state: 'available',
    });

    // Create VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `vpc-${config.environmentSuffix}`,
        Environment: config.environmentSuffix,
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `igw-${config.environmentSuffix}`,
      },
    });

    // Create public subnets
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[0]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `public-subnet-1-${config.environmentSuffix}`,
      },
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[1]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `public-subnet-2-${config.environmentSuffix}`,
      },
    });

    // Create private subnets
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.10.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[0]}`,
      tags: {
        Name: `private-subnet-1-${config.environmentSuffix}`,
      },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: `\${${availabilityZones.fqn}.names[1]}`,
      tags: {
        Name: `private-subnet-2-${config.environmentSuffix}`,
      },
    });

    // Create EIP for NAT Gateway
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: `nat-eip-${config.environmentSuffix}`,
      },
    });

    // Create NAT Gateway
    const natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: `nat-gateway-${config.environmentSuffix}`,
      },
    });

    // Create route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        Name: `public-rt-${config.environmentSuffix}`,
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

    // Create route table for private subnets
    const privateRouteTable = new RouteTable(this, 'private-route-table', {
      vpcId: vpc.id,
      tags: {
        Name: `private-rt-${config.environmentSuffix}`,
      },
    });

    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });

    new RouteTableAssociation(this, 'private-rta-1', {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable.id,
    });

    new RouteTableAssociation(this, 'private-rta-2', {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable.id,
    });

    // Create VPC Endpoints for S3 and ECR
    new VpcEndpoint(this, 's3-endpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${config.awsRegion}.s3`,
      vpcEndpointType: 'Gateway',
      routeTableIds: [privateRouteTable.id],
      tags: {
        Name: `s3-endpoint-${config.environmentSuffix}`,
      },
    });

    new VpcEndpoint(this, 'ecr-api-endpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${config.awsRegion}.ecr.api`,
      vpcEndpointType: 'Interface',
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      privateDnsEnabled: true,
      tags: {
        Name: `ecr-api-endpoint-${config.environmentSuffix}`,
      },
    });

    new VpcEndpoint(this, 'ecr-dkr-endpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${config.awsRegion}.ecr.dkr`,
      vpcEndpointType: 'Interface',
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      privateDnsEnabled: true,
      tags: {
        Name: `ecr-dkr-endpoint-${config.environmentSuffix}`,
      },
    });

    // Create KMS key for RDS encryption
    const rdsKmsKey = new KmsKey(this, 'rds-kms-key', {
      description: `RDS encryption key for ${config.environmentSuffix}`,
      deletionWindowInDays: 10,
      tags: {
        Name: `rds-kms-key-${config.environmentSuffix}`,
      },
    });

    // Create DB subnet group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `db-subnet-group-${config.environmentSuffix}`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: `db-subnet-group-${config.environmentSuffix}`,
      },
    });

    // Create security group for RDS
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `rds-sg-${config.environmentSuffix}`,
      description: 'Security group for RDS PostgreSQL',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          cidrBlocks: [vpc.cidrBlock],
          description: 'PostgreSQL access from VPC',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound',
        },
      ],
      tags: {
        Name: `rds-sg-${config.environmentSuffix}`,
      },
    });

    // Reference database password from Secrets Manager
    const dbPasswordSecret = new DataAwsSecretsmanagerSecret(this, 'db-password-secret', {
      name: `payment-platform-db-password-${config.environmentSuffix}`,
    });

    const dbPasswordSecretVersion = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-password-secret-version',
      {
        secretId: dbPasswordSecret.id,
      }
    );

    // Create RDS instance
    const rdsInstance = new DbInstance(this, 'rds-instance', {
      identifier: `payment-db-${config.environmentSuffix}`,
      engine: 'postgres',
      engineVersion: '14.7',
      instanceClass: environment.dbInstanceClass,
      allocatedStorage: environment.dbAllocatedStorage,
      storageType: 'gp3',
      storageEncrypted: true,
      kmsKeyId: rdsKmsKey.arn,
      dbName: 'paymentdb',
      username: 'dbadmin',
      password: dbPasswordSecretVersion.secretString,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      multiAz: environment.multiAz,
      skipFinalSnapshot: true,
      tags: {
        Name: `payment-db-${config.environmentSuffix}`,
      },
    });

    // Create ECS cluster
    const ecsCluster = new EcsCluster(this, 'ecs-cluster', {
      name: `payment-cluster-${config.environmentSuffix}`,
      tags: {
        Name: `payment-cluster-${config.environmentSuffix}`,
      },
    });

    // Create CloudWatch log group for ECS
    const ecsLogGroup = new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/ecs/payment-platform-${config.environmentSuffix}`,
      retentionInDays: environment.logRetentionDays,
      tags: {
        Name: `ecs-logs-${config.environmentSuffix}`,
      },
    });

    // Create security group for ECS tasks
    const ecsTaskSecurityGroup = new SecurityGroup(this, 'ecs-task-sg', {
      name: `ecs-task-sg-${config.environmentSuffix}`,
      description: 'Security group for ECS tasks',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 8080,
          toPort: 8080,
          protocol: 'tcp',
          cidrBlocks: [vpc.cidrBlock],
          description: 'Application port from VPC',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound',
        },
      ],
      tags: {
        Name: `ecs-task-sg-${config.environmentSuffix}`,
      },
    });

    // Create ECS task definition
    const taskDefinition = new EcsTaskDefinition(this, 'ecs-task-definition', {
      family: `payment-task-${config.environmentSuffix}`,
      requiresCompatibilities: ['FARGATE'],
      networkMode: 'awsvpc',
      cpu: '256',
      memory: '512',
      containerDefinitions: JSON.stringify([
        {
          name: 'payment-app',
          image: 'nginx:latest',
          cpu: 256,
          memory: 512,
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
              'awslogs-group': ecsLogGroup.name,
              'awslogs-region': config.awsRegion,
              'awslogs-stream-prefix': 'payment-app',
            },
          },
        },
      ]),
      tags: {
        Name: `payment-task-${config.environmentSuffix}`,
      },
    });

    // Create security group for ALB
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `alb-sg-${config.environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS from internet',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound',
        },
      ],
      tags: {
        Name: `alb-sg-${config.environmentSuffix}`,
      },
    });

    // Create Application Load Balancer
    const alb = new Alb(this, 'alb', {
      name: `payment-alb-${config.environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: [publicSubnet1.id, publicSubnet2.id],
      tags: {
        Name: `payment-alb-${config.environmentSuffix}`,
      },
    });

    // Create target group
    const targetGroup = new AlbTargetGroup(this, 'alb-target-group', {
      name: `payment-tg-${config.environmentSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId: vpc.id,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/',
        protocol: 'HTTP',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
      },
      tags: {
        Name: `payment-tg-${config.environmentSuffix}`,
      },
    });

    // Create ALB listener
    new AlbListener(this, 'alb-listener', {
      loadBalancerArn: alb.arn,
      port: 443,
      protocol: 'HTTPS',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // Create ECS service
    new EcsService(this, 'ecs-service', {
      name: `payment-service-${config.environmentSuffix}`,
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: environment.ecsTaskCount,
      launchType: 'FARGATE',
      networkConfiguration: {
        subnets: [privateSubnet1.id, privateSubnet2.id],
        securityGroups: [ecsTaskSecurityGroup.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: 'payment-app',
          containerPort: 8080,
        },
      ],
      tags: {
        Name: `payment-service-${config.environmentSuffix}`,
      },
    });

    // Create S3 bucket for application assets
    const assetsBucket = new S3Bucket(this, 'assets-bucket', {
      bucket: `payment-assets-${config.environmentSuffix}`,
      tags: {
        Name: `payment-assets-${config.environmentSuffix}`,
      },
    });

    // Enable versioning on S3 bucket
    new S3BucketVersioningA(this, 'assets-bucket-versioning', {
      bucket: assetsBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Configure lifecycle policy on S3 bucket
    new S3BucketLifecycleConfiguration(this, 'assets-bucket-lifecycle', {
      bucket: assetsBucket.id,
      rule: [
        {
          id: `expire-old-versions-${config.environmentSuffix}`,
          status: 'Enabled',
          noncurrentVersionExpiration: {
            noncurrentDays: environment.s3RetentionDays,
          },
        },
      ],
    });
  }

  private getEnvironmentConfig(env: string): EnvironmentConfig {
    const configs: { [key: string]: EnvironmentConfig } = {
      dev: {
        dbInstanceClass: 'db.t3.micro',
        dbAllocatedStorage: 20,
        multiAz: false,
        ecsTaskCount: 1,
        logRetentionDays: 7,
        s3RetentionDays: 7,
      },
      staging: {
        dbInstanceClass: 'db.t3.small',
        dbAllocatedStorage: 50,
        multiAz: false,
        ecsTaskCount: 2,
        logRetentionDays: 30,
        s3RetentionDays: 30,
      },
      prod: {
        dbInstanceClass: 'db.m5.large',
        dbAllocatedStorage: 100,
        multiAz: true,
        ecsTaskCount: 4,
        logRetentionDays: 90,
        s3RetentionDays: 90,
      },
    };

    return configs[env] || configs['dev'];
  }
}

interface EnvironmentConfig {
  dbInstanceClass: string;
  dbAllocatedStorage: number;
  multiAz: boolean;
  ecsTaskCount: number;
  logRetentionDays: number;
  s3RetentionDays: number;
}
```

## File: lib/README.md

```markdown
# Multi-Environment Payment Platform Infrastructure

This CDKTF project provisions a multi-environment infrastructure for a fintech payment processing platform.

## Architecture

The infrastructure includes:

- VPC with public and private subnets across multiple availability zones
- RDS PostgreSQL database with customer-managed KMS encryption
- ECS Fargate cluster for containerized workloads
- Application Load Balancer for traffic distribution
- S3 buckets for application assets
- VPC endpoints for cost-optimized AWS service access
- CloudWatch log groups for application logging

## Environment Configuration

The infrastructure supports three environments with different sizing:

| Resource | Dev | Staging | Prod |
|----------|-----|---------|------|
| RDS Instance | db.t3.micro | db.t3.small | db.m5.large |
| ECS Tasks | 1 | 2 | 4 |
| Log Retention | 7 days | 30 days | 90 days |
| S3 Retention | 7 days | 30 days | 90 days |

## Prerequisites

1. Node.js 18+ and npm
2. Terraform 1.5+
3. AWS CLI configured with appropriate credentials
4. CDKTF CLI installed: `npm install -g cdktf-cli`

## Setup

Install dependencies:

```bash
npm install
```

## Deployment

Set required environment variables:

```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-west-2
export TERRAFORM_STATE_BUCKET=your-state-bucket
export TERRAFORM_STATE_BUCKET_REGION=us-west-2
```

Create database password secret in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name payment-platform-db-password-${ENVIRONMENT_SUFFIX} \
  --secret-string "YourSecurePassword123!"
```

Deploy the infrastructure:

```bash
cdktf deploy
```

## Destroying Infrastructure

To tear down all resources:

```bash
cdktf destroy
```

## Security Notes

- Database passwords are stored in AWS Secrets Manager
- RDS instances use customer-managed KMS keys for encryption
- All S3 buckets have versioning enabled
- ALB only accepts HTTPS traffic
- ECS tasks run in private subnets with no public IPs
