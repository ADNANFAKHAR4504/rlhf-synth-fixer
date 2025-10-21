import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
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

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Get available AZs
    const azs = new DataAwsAvailabilityZones(this, 'available-azs', {
      state: 'available',
    });

    // Get current AWS account ID
    new DataAwsCallerIdentity(this, 'current', {});

    // VPC
    const vpc = new Vpc(this, 'healthcare-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `healthcare-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
        Application: 'patient-management',
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `healthcare-igw-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Public Subnets
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `\${${azs.fqn}.names[0]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `healthcare-public-subnet-1-${environmentSuffix}`,
        Environment: environmentSuffix,
        Type: 'public',
      },
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `\${${azs.fqn}.names[1]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `healthcare-public-subnet-2-${environmentSuffix}`,
        Environment: environmentSuffix,
        Type: 'public',
      },
    });

    // Private Subnets
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: `\${${azs.fqn}.names[0]}`,
      tags: {
        Name: `healthcare-private-subnet-1-${environmentSuffix}`,
        Environment: environmentSuffix,
        Type: 'private',
      },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.12.0/24',
      availabilityZone: `\${${azs.fqn}.names[1]}`,
      tags: {
        Name: `healthcare-private-subnet-2-${environmentSuffix}`,
        Environment: environmentSuffix,
        Type: 'private',
      },
    });

    // Elastic IP for NAT Gateway
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: `healthcare-nat-eip-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // NAT Gateway
    const natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: `healthcare-nat-gateway-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: {
        Name: `healthcare-public-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
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

    // Private Route Table
    const privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: vpc.id,
      tags: {
        Name: `healthcare-private-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
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

    // KMS Key for encryption
    const kmsKey = new KmsKey(this, 'healthcare-kms-key', {
      description: 'KMS key for healthcare application encryption',
      enableKeyRotation: true,
      deletionWindowInDays: 10,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: 'arn:aws:iam::${data.aws_caller_identity.current.account_id}:root',
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow services to use the key',
            Effect: 'Allow',
            Principal: {
              Service: [
                'secretsmanager.amazonaws.com',
                'rds.amazonaws.com',
                'logs.amazonaws.com',
              ],
            },
            Action: [
              'kms:Decrypt',
              'kms:DescribeKey',
              'kms:CreateGrant',
              'kms:GenerateDataKey',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `healthcare-kms-key-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new KmsAlias(this, 'healthcare-kms-alias', {
      name: `alias/healthcare-${environmentSuffix}`,
      targetKeyId: kmsKey.id,
    });

    // Security Group for RDS
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `healthcare-rds-sg-${environmentSuffix}`,
      description: 'Security group for RDS Aurora cluster',
      vpcId: vpc.id,
      tags: {
        Name: `healthcare-rds-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Security Group for ECS
    const ecsSecurityGroup = new SecurityGroup(this, 'ecs-sg', {
      name: `healthcare-ecs-sg-${environmentSuffix}`,
      description: 'Security group for ECS tasks',
      vpcId: vpc.id,
      tags: {
        Name: `healthcare-ecs-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Allow ECS to connect to RDS
    new SecurityGroupRule(this, 'rds-ingress-from-ecs', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroupId: rdsSecurityGroup.id,
      sourceSecurityGroupId: ecsSecurityGroup.id,
      description: 'Allow PostgreSQL access from ECS tasks',
    });

    // Allow ECS outbound traffic
    new SecurityGroupRule(this, 'ecs-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      securityGroupId: ecsSecurityGroup.id,
      cidrBlocks: ['0.0.0.0/0'],
      description: 'Allow all outbound traffic',
    });

    // Database Credentials in Secrets Manager
    const dbSecret = new SecretsmanagerSecret(this, 'db-credentials', {
      name: `healthcare/db/credentials-${environmentSuffix}`,
      description: 'RDS Aurora database credentials',
      kmsKeyId: kmsKey.id,
      tags: {
        Name: `healthcare-db-credentials-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const dbUsername = 'healthcareadmin';
    const dbPassword = 'ChangeMe123456!'; // This should be generated securely in production

    new SecretsmanagerSecretVersion(this, 'db-credentials-version', {
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: dbUsername,
        password: dbPassword,
        engine: 'postgres',
        host: '',
        port: 5432,
      }),
    });

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `healthcare-db-subnet-group-${environmentSuffix}`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: `healthcare-db-subnet-group-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // RDS Aurora Serverless v2 Cluster
    const rdsCluster = new RdsCluster(this, 'aurora-cluster', {
      clusterIdentifier: `healthcare-aurora-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineMode: 'provisioned',
      engineVersion: '15.4',
      databaseName: 'healthcaredb',
      masterUsername: dbUsername,
      masterPassword: dbPassword,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      kmsKeyId: kmsKey.arn,
      storageEncrypted: true,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      enabledCloudwatchLogsExports: ['postgresql'],
      serverlessv2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 1.0,
      },
      skipFinalSnapshot: true,
      tags: {
        Name: `healthcare-aurora-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Aurora Serverless v2 Instance
    new RdsClusterInstance(this, 'aurora-instance', {
      identifier: `healthcare-aurora-instance-${environmentSuffix}`,
      clusterIdentifier: rdsCluster.id,
      instanceClass: 'db.serverless',
      engine: rdsCluster.engine,
      engineVersion: rdsCluster.engineVersion,
      tags: {
        Name: `healthcare-aurora-instance-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Update secret with RDS endpoint
    this.addOverride(
      'resource.aws_secretsmanager_secret_version.db-credentials-version.secret_string',
      `\${jsonencode({
        username = "${dbUsername}"
        password = "${dbPassword}"
        engine = "postgres"
        host = aws_rds_cluster.aurora-cluster.endpoint
        port = 5432
        dbname = "healthcaredb"
      })}`
    );

    // Note: Secrets Manager Rotation requires a Lambda function ARN
    // For managed rotation with RDS, you would need to configure rotation_lambda_arn
    // This is commented out to allow deployment without Lambda setup

    // IAM Role for ECS Task Execution
    const ecsTaskExecutionRole = new IamRole(this, 'ecs-task-execution-role', {
      name: `healthcare-ecs-task-execution-${environmentSuffix}`,
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
        Name: `healthcare-ecs-task-execution-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'ecs-task-execution-policy', {
      role: ecsTaskExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // Additional policy for Secrets Manager and KMS
    const ecsSecretsPolicy = new IamPolicy(this, 'ecs-secrets-policy', {
      name: `healthcare-ecs-secrets-${environmentSuffix}`,
      description: 'Allow ECS tasks to access Secrets Manager',
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
            Action: ['kms:Decrypt', 'kms:DescribeKey'],
            Resource: kmsKey.arn,
          },
        ],
      }),
      tags: {
        Name: `healthcare-ecs-secrets-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'ecs-secrets-policy-attachment', {
      role: ecsTaskExecutionRole.name,
      policyArn: ecsSecretsPolicy.arn,
    });

    // IAM Role for ECS Task
    const ecsTaskRole = new IamRole(this, 'ecs-task-role', {
      name: `healthcare-ecs-task-${environmentSuffix}`,
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
        Name: `healthcare-ecs-task-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // CloudWatch Log Group for ECS
    // Note: KMS encryption for CloudWatch Logs requires additional IAM permissions
    // Removed kmsKeyId to allow deployment without complex key policy setup
    const ecsLogGroup = new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/ecs/healthcare-app-${environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `healthcare-ecs-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // ECS Cluster
    new EcsCluster(this, 'ecs-cluster', {
      name: `healthcare-cluster-${environmentSuffix}`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: `healthcare-cluster-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // ECS Task Definition
    new EcsTaskDefinition(this, 'ecs-task-definition', {
      family: `healthcare-app-${environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '256',
      memory: '512',
      executionRoleArn: ecsTaskExecutionRole.arn,
      taskRoleArn: ecsTaskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'healthcare-app',
          image: 'nginx:latest',
          essential: true,
          portMappings: [
            {
              containerPort: 80,
              protocol: 'tcp',
            },
          ],
          secrets: [
            {
              name: 'DB_HOST',
              valueFrom: `${dbSecret.arn}:host::`,
            },
            {
              name: 'DB_USERNAME',
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
              name: 'ENVIRONMENT',
              value: environmentSuffix,
            },
            {
              name: 'AWS_REGION',
              value: awsRegion,
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
        },
      ]),
      tags: {
        Name: `healthcare-app-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });
  }
}
