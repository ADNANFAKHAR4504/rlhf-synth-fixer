import { Construct } from 'constructs';
import { TerraformStack, Fn, TerraformOutput } from 'cdktf';
// S3Backend is commented out but keeping import for future use
// import { S3Backend } from 'cdktf';
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
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { AlbTargetGroup } from '@cdktf/provider-aws/lib/alb-target-group';
import { AlbListener } from '@cdktf/provider-aws/lib/alb-listener';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { VpcEndpoint } from '@cdktf/provider-aws/lib/vpc-endpoint';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
// Removed unused imports: DataAwsSecretsmanagerSecret and DataAwsSecretsmanagerSecretVersion
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
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

    // Configure AWS Provider with default tags
    new AwsProvider(this, 'aws', {
      region: config.awsRegion,
      defaultTags: config.defaultTags,
    });

    // Add a short timestamp suffix for uniqueness (last 6 digits)
    const uniqueSuffix = Date.now().toString().slice(-6);

    // Define state lock table name (must be static for backend config)
    const stateLockTableName = `tap-state-lock-${config.environmentSuffix}-${uniqueSuffix}`;

    // Configure S3 Backend for remote state (without DynamoDB locking initially)
    // COMMENTED OUT FOR QA: Using local state to avoid S3 AccessDenied issues
    // new S3Backend(this, {
    //   bucket: config.stateBucket,
    //   key: `tap-stack-${config.environmentSuffix}.tfstate`,
    //   region: config.stateBucketRegion,
    //   encrypt: true,
    // });

    // Create DynamoDB table for state locking (for future use)
    new DynamodbTable(this, 'state-lock-table', {
      name: stateLockTableName,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'LockID',
      attribute: [
        {
          name: 'LockID',
          type: 'S',
        },
      ],
      tags: {
        Name: stateLockTableName,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
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
        Name: `payment-vpc-${config.environmentSuffix}-${uniqueSuffix}`,
        Environment: config.environmentSuffix,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-igw-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create public subnets in different AZs
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: Fn.element(availabilityZones.names, 0),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `payment-public-subnet-1-${config.environmentSuffix}-${uniqueSuffix}`,
        Type: 'Public',
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: Fn.element(availabilityZones.names, 1),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `payment-public-subnet-2-${config.environmentSuffix}-${uniqueSuffix}`,
        Type: 'Public',
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create private subnets in different AZs
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.10.0/24',
      availabilityZone: Fn.element(availabilityZones.names, 0),
      tags: {
        Name: `payment-private-subnet-1-${config.environmentSuffix}-${uniqueSuffix}`,
        Type: 'Private',
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: Fn.element(availabilityZones.names, 1),
      tags: {
        Name: `payment-private-subnet-2-${config.environmentSuffix}-${uniqueSuffix}`,
        Type: 'Private',
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create EIP for NAT Gateway
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: `payment-nat-eip-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create NAT Gateway in public subnet
    const natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: `payment-nat-gateway-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
      dependsOn: [igw],
    });

    // Create route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        Name: `payment-public-rt-${config.environmentSuffix}-${uniqueSuffix}`,
        Type: 'Public',
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Add route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
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
        Name: `payment-private-rt-${config.environmentSuffix}-${uniqueSuffix}`,
        Type: 'Private',
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Add route to NAT Gateway for private subnets
    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });

    // Associate private subnets with private route table
    new RouteTableAssociation(this, 'private-rta-1', {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable.id,
    });

    new RouteTableAssociation(this, 'private-rta-2', {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable.id,
    });

    // Create security group for VPC Endpoints
    const vpcEndpointSecurityGroup = new SecurityGroup(
      this,
      'vpc-endpoint-sg',
      {
        name: `payment-vpc-endpoint-sg-${config.environmentSuffix}-${uniqueSuffix}`,
        description: 'Security group for VPC Endpoints',
        vpcId: vpc.id,
        tags: {
          Name: `payment-vpc-endpoint-sg-${config.environmentSuffix}-${uniqueSuffix}`,
          Project: 'PaymentPlatform',
          ManagedBy: 'CDKTF',
        },
      }
    );

    // Allow HTTPS traffic from VPC to endpoints
    new SecurityGroupRule(this, 'vpc-endpoint-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: [vpc.cidrBlock],
      securityGroupId: vpcEndpointSecurityGroup.id,
      description: 'HTTPS from VPC',
    });

    new SecurityGroupRule(this, 'vpc-endpoint-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: vpcEndpointSecurityGroup.id,
      description: 'Allow all outbound',
    });

    // Create VPC Endpoint for S3 (Gateway type)
    new VpcEndpoint(this, 's3-endpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${config.awsRegion}.s3`,
      vpcEndpointType: 'Gateway',
      routeTableIds: [privateRouteTable.id],
      tags: {
        Name: `payment-s3-endpoint-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create VPC Endpoints for ECR (Interface type)
    new VpcEndpoint(this, 'ecr-api-endpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${config.awsRegion}.ecr.api`,
      vpcEndpointType: 'Interface',
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      securityGroupIds: [vpcEndpointSecurityGroup.id],
      privateDnsEnabled: true,
      tags: {
        Name: `payment-ecr-api-endpoint-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    new VpcEndpoint(this, 'ecr-dkr-endpoint', {
      vpcId: vpc.id,
      serviceName: `com.amazonaws.${config.awsRegion}.ecr.dkr`,
      vpcEndpointType: 'Interface',
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      securityGroupIds: [vpcEndpointSecurityGroup.id],
      privateDnsEnabled: true,
      tags: {
        Name: `payment-ecr-dkr-endpoint-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create KMS key for RDS encryption
    const rdsKmsKey = new KmsKey(this, 'rds-kms-key', {
      description: `RDS encryption key for payment platform ${config.environmentSuffix}`,
      deletionWindowInDays: 10,
      enableKeyRotation: true,
      tags: {
        Name: `payment-rds-kms-key-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create KMS alias for easier reference
    new KmsAlias(this, 'rds-kms-alias', {
      name: `alias/payment-rds-${config.environmentSuffix}-${uniqueSuffix}`,
      targetKeyId: rdsKmsKey.keyId,
    });

    // Create DB subnet group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `payment-db-subnet-${config.environmentSuffix}-${uniqueSuffix}`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      description: `Database subnet group for payment platform ${config.environmentSuffix}`,
      tags: {
        Name: `payment-db-subnet-group-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create security group for RDS
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `payment-rds-sg-${config.environmentSuffix}-${uniqueSuffix}`,
      description: 'Security group for RDS PostgreSQL database',
      vpcId: vpc.id,
      tags: {
        Name: `payment-rds-sg-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    new SecurityGroupRule(this, 'rds-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: [vpc.cidrBlock],
      securityGroupId: rdsSecurityGroup.id,
      description: 'PostgreSQL access from VPC',
    });

    new SecurityGroupRule(this, 'rds-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: rdsSecurityGroup.id,
      description: 'Allow all outbound',
    });

    // Create database password in Secrets Manager
    const dbPasswordSecret = new SecretsmanagerSecret(
      this,
      'db-password-secret',
      {
        name: `payment-db-pwd-${config.environmentSuffix}-${uniqueSuffix}`,
        description: `Database password for payment platform ${config.environmentSuffix}`,
        recoveryWindowInDays: 0, // Immediately delete for QA/testing
        tags: {
          Name: `payment-platform-db-password-${config.environmentSuffix}-${uniqueSuffix}`,
          Project: 'PaymentPlatform',
          ManagedBy: 'CDKTF',
        },
      }
    );

    // Generate a random password for the database
    const dbPassword = `TempPass${config.environmentSuffix}123!`;

    const dbPasswordSecretVersion = new SecretsmanagerSecretVersion(
      this,
      'db-password-secret-version',
      {
        secretId: dbPasswordSecret.id,
        secretString: dbPassword,
      }
    );

    // Create RDS PostgreSQL instance
    const rdsInstance = new DbInstance(this, 'rds-instance', {
      identifier: `payment-db-${config.environmentSuffix}-${uniqueSuffix}`,
      engine: 'postgres',
      engineVersion: '14',
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
      backupRetentionPeriod: environment.backupRetentionDays,
      skipFinalSnapshot: true,
      copyTagsToSnapshot: true,
      deletionProtection: false,
      tags: {
        Name: `payment-db-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create ECS cluster
    const ecsCluster = new EcsCluster(this, 'ecs-cluster', {
      name: `payment-cluster-${config.environmentSuffix}-${uniqueSuffix}`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: `payment-cluster-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create CloudWatch log group for ECS
    const ecsLogGroup = new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/ecs/payment-platform-${config.environmentSuffix}-${uniqueSuffix}`,
      retentionInDays: environment.logRetentionDays,
      tags: {
        Name: `payment-ecs-logs-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create IAM role for ECS task execution
    const ecsTaskExecutionRole = new IamRole(this, 'ecs-task-execution-role', {
      name: `payment-ecs-exec-role-${config.environmentSuffix}-${uniqueSuffix}`,
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
        Name: `payment-ecs-task-execution-role-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Attach AWS managed policy for ECS task execution
    new IamRolePolicyAttachment(this, 'ecs-task-execution-policy', {
      role: ecsTaskExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // Create IAM policy for CloudWatch Logs access
    const ecsLogsPolicy = new IamPolicy(this, 'ecs-logs-policy', {
      name: `payment-ecs-logs-policy-${config.environmentSuffix}-${uniqueSuffix}`,
      description: 'Policy for ECS tasks to write logs to CloudWatch',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: `${ecsLogGroup.arn}:*`,
          },
        ],
      }),
      tags: {
        Name: `payment-ecs-logs-policy-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    new IamRolePolicyAttachment(this, 'ecs-logs-policy-attachment', {
      role: ecsTaskExecutionRole.name,
      policyArn: ecsLogsPolicy.arn,
    });

    // Create IAM role for ECS task
    const ecsTaskRole = new IamRole(this, 'ecs-task-role', {
      name: `payment-ecs-task-role-${config.environmentSuffix}-${uniqueSuffix}`,
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
        Name: `payment-ecs-task-role-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create security group for ECS tasks
    const ecsTaskSecurityGroup = new SecurityGroup(this, 'ecs-task-sg', {
      name: `payment-ecs-task-sg-${config.environmentSuffix}-${uniqueSuffix}`,
      description: 'Security group for ECS Fargate tasks',
      vpcId: vpc.id,
      tags: {
        Name: `payment-ecs-task-sg-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    new SecurityGroupRule(this, 'ecs-task-ingress', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      cidrBlocks: [vpc.cidrBlock],
      securityGroupId: ecsTaskSecurityGroup.id,
      description: 'Application port from VPC',
    });

    new SecurityGroupRule(this, 'ecs-task-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ecsTaskSecurityGroup.id,
      description: 'Allow all outbound',
    });

    // Create ECS task definition
    const taskDefinition = new EcsTaskDefinition(this, 'ecs-task-definition', {
      family: `payment-task-${config.environmentSuffix}-${uniqueSuffix}`,
      requiresCompatibilities: ['FARGATE'],
      networkMode: 'awsvpc',
      cpu: '256',
      memory: '512',
      executionRoleArn: ecsTaskExecutionRole.arn,
      taskRoleArn: ecsTaskRole.arn,
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
          environment: [
            {
              name: 'ENVIRONMENT',
              value: config.environmentSuffix,
            },
          ],
        },
      ]),
      tags: {
        Name: `payment-task-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create security group for ALB
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `payment-alb-sg-${config.environmentSuffix}-${uniqueSuffix}`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.id,
      tags: {
        Name: `payment-alb-sg-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    new SecurityGroupRule(this, 'alb-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'HTTP from internet',
    });

    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
      description: 'Allow all outbound',
    });

    // Create Application Load Balancer
    const alb = new Alb(this, 'alb', {
      name: `pay-alb-${config.environmentSuffix}-${uniqueSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: [publicSubnet1.id, publicSubnet2.id],
      enableDeletionProtection: false,
      tags: {
        Name: `payment-alb-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create target group
    const targetGroup = new AlbTargetGroup(this, 'alb-target-group', {
      name: `pay-tg-${config.environmentSuffix}-${uniqueSuffix}`,
      port: 8080,
      protocol: 'HTTP',
      vpcId: vpc.id,
      targetType: 'ip',
      deregistrationDelay: '30',
      healthCheck: {
        enabled: true,
        path: '/',
        protocol: 'HTTP',
        port: '8080',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        matcher: '200-299',
      },
      tags: {
        Name: `payment-tg-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create ALB listener for HTTP
    // Note: For synthetic testing, using HTTP only to avoid ACM certificate validation delays
    // In production, use HTTPS with valid ACM certificate and DNS validation
    new AlbListener(this, 'alb-listener-http', {
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
        Name: `payment-alb-listener-http-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create ECS service
    new EcsService(this, 'ecs-service', {
      name: `payment-service-${config.environmentSuffix}-${uniqueSuffix}`,
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: environment.ecsTaskCount,
      launchType: 'FARGATE',
      platformVersion: 'LATEST',
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
      healthCheckGracePeriodSeconds: 60,
      dependsOn: [targetGroup],
      tags: {
        Name: `payment-service-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Create S3 bucket for application assets with globally unique name
    const timestamp = Date.now().toString();
    const assetsBucket = new S3Bucket(this, 'assets-bucket', {
      bucket: `payment-assets-${config.environmentSuffix}-${timestamp}`,
      forceDestroy: true,
      tags: {
        Name: `payment-assets-${config.environmentSuffix}-${uniqueSuffix}`,
        Project: 'PaymentPlatform',
        ManagedBy: 'CDKTF',
      },
    });

    // Block public access to S3 bucket
    new S3BucketPublicAccessBlock(this, 'assets-bucket-public-access-block', {
      bucket: assetsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable server-side encryption on S3 bucket
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'assets-bucket-encryption',
      {
        bucket: assetsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

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
          id: `expire-old-versions-${config.environmentSuffix}-${uniqueSuffix}`,
          status: 'Enabled',
          noncurrentVersionExpiration: [
            {
              noncurrentDays: environment.s3RetentionDays,
            },
          ],
          expiration: [
            {
              expiredObjectDeleteMarker: true,
            },
          ],
        },
      ],
    });

    // Stack Outputs for integration testing
    new TerraformOutput(this, 'VpcId', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'AlbDnsName', {
      value: alb.dnsName,
      description: 'ALB DNS Name',
    });

    new TerraformOutput(this, 'AlbArn', {
      value: alb.arn,
      description: 'ALB ARN',
    });

    new TerraformOutput(this, 'RdsEndpoint', {
      value: rdsInstance.endpoint,
      description: 'RDS Instance Endpoint',
    });

    new TerraformOutput(this, 'RdsAddress', {
      value: rdsInstance.address,
      description: 'RDS Instance Address',
    });

    new TerraformOutput(this, 'EcsClusterName', {
      value: ecsCluster.name,
      description: 'ECS Cluster Name',
    });

    new TerraformOutput(this, 'EcsClusterArn', {
      value: ecsCluster.arn,
      description: 'ECS Cluster ARN',
    });

    new TerraformOutput(this, 'S3BucketName', {
      value: assetsBucket.bucket,
      description: 'S3 Assets Bucket Name',
    });

    new TerraformOutput(this, 'SecretArn', {
      value: dbPasswordSecret.arn,
      description: 'Database Password Secret ARN',
    });
  }

  /**
   * Get environment-specific configuration based on environment suffix
   * @param env Environment name (dev, staging, prod)
   * @returns Environment-specific configuration object
   */
  private getEnvironmentConfig(env: string): EnvironmentConfig {
    const configs: { [key: string]: EnvironmentConfig } = {
      dev: {
        dbInstanceClass: 'db.t3.micro',
        dbAllocatedStorage: 20,
        multiAz: false,
        backupRetentionDays: 1,
        ecsTaskCount: 1,
        logRetentionDays: 7,
        s3RetentionDays: 7,
      },
      staging: {
        dbInstanceClass: 'db.t3.small',
        dbAllocatedStorage: 50,
        multiAz: false,
        backupRetentionDays: 7,
        ecsTaskCount: 2,
        logRetentionDays: 30,
        s3RetentionDays: 30,
      },
      prod: {
        dbInstanceClass: 'db.m5.large',
        dbAllocatedStorage: 100,
        multiAz: true,
        backupRetentionDays: 30,
        ecsTaskCount: 4,
        logRetentionDays: 90,
        s3RetentionDays: 90,
      },
    };

    // Return configuration for the specified environment, default to dev if not found
    return configs[env] || configs['dev'];
  }
}

/**
 * Environment-specific configuration interface
 */
interface EnvironmentConfig {
  dbInstanceClass: string;
  dbAllocatedStorage: number;
  multiAz: boolean;
  backupRetentionDays: number;
  ecsTaskCount: number;
  logRetentionDays: number;
  s3RetentionDays: number;
}
