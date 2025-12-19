/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackProps {
  environmentSuffix: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly blueAlbEndpoint: pulumi.Output<string>;
  public readonly greenAlbEndpoint: pulumi.Output<string>;
  public readonly blueDatabaseEndpoint: pulumi.Output<string>;
  public readonly greenDatabaseEndpoint: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;

  constructor(
    name: string,
    props: TapStackProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    const { environmentSuffix } = props;
    const region = 'eu-central-1';

    // Get availability zones
    const availabilityZones = aws
      .getAvailabilityZones({
        state: 'available',
      })
      .then(azs => azs.names.slice(0, 3));

    // KMS Key for encryption
    const kmsKey = new aws.kms.Key(
      `payment-kms-${environmentSuffix}`,
      {
        description: 'KMS key for payment processing encryption',
        enableKeyRotation: true,
        tags: {
          Environment: 'production',
          Service: 'payment-processing',
          ManagedBy: 'Pulumi',
          CostCenter: 'fintech-migration',
        },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `payment-kms-alias-${environmentSuffix}`,
      {
        targetKeyId: kmsKey.id,
        name: `alias/payment-processing-${environmentSuffix}`,
      },
      { parent: this }
    );

    // Blue VPC
    const blueVpc = new aws.ec2.Vpc(
      `blue-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `blue-vpc-${environmentSuffix}`,
          Environment: 'blue',
          Service: 'payment-processing',
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    // Green VPC
    const greenVpc = new aws.ec2.Vpc(
      `green-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.1.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `green-vpc-${environmentSuffix}`,
          Environment: 'green',
          Service: 'payment-processing',
          ManagedBy: 'Pulumi',
        },
      },
      { parent: this }
    );

    // Blue Private Subnets
    const bluePrivateSubnets = pulumi.all([availabilityZones]).apply(([azs]) =>
      azs.map(
        (az, i) =>
          new aws.ec2.Subnet(
            `blue-private-subnet-${i}-${environmentSuffix}`,
            {
              vpcId: blueVpc.id,
              cidrBlock: `10.0.${i + 1}.0/24`,
              availabilityZone: az,
              tags: {
                Name: `blue-private-subnet-${i}-${environmentSuffix}`,
                Environment: 'blue',
                Type: 'private',
              },
            },
            { parent: this }
          )
      )
    );

    // Green Private Subnets
    const greenPrivateSubnets = pulumi.all([availabilityZones]).apply(([azs]) =>
      azs.map(
        (az, i) =>
          new aws.ec2.Subnet(
            `green-private-subnet-${i}-${environmentSuffix}`,
            {
              vpcId: greenVpc.id,
              cidrBlock: `10.1.${i + 1}.0/24`,
              availabilityZone: az,
              tags: {
                Name: `green-private-subnet-${i}-${environmentSuffix}`,
                Environment: 'green',
                Type: 'private',
              },
            },
            { parent: this }
          )
      )
    );

    // Blue Public Subnets
    const bluePublicSubnets = pulumi.all([availabilityZones]).apply(([azs]) =>
      azs.map(
        (az, i) =>
          new aws.ec2.Subnet(
            `blue-public-subnet-${i}-${environmentSuffix}`,
            {
              vpcId: blueVpc.id,
              cidrBlock: `10.0.${i + 10}.0/24`,
              availabilityZone: az,
              mapPublicIpOnLaunch: true,
              tags: {
                Name: `blue-public-subnet-${i}-${environmentSuffix}`,
                Environment: 'blue',
                Type: 'public',
              },
            },
            { parent: this }
          )
      )
    );

    // Green Public Subnets
    const greenPublicSubnets = pulumi.all([availabilityZones]).apply(([azs]) =>
      azs.map(
        (az, i) =>
          new aws.ec2.Subnet(
            `green-public-subnet-${i}-${environmentSuffix}`,
            {
              vpcId: greenVpc.id,
              cidrBlock: `10.1.${i + 10}.0/24`,
              availabilityZone: az,
              mapPublicIpOnLaunch: true,
              tags: {
                Name: `green-public-subnet-${i}-${environmentSuffix}`,
                Environment: 'green',
                Type: 'public',
              },
            },
            { parent: this }
          )
      )
    );

    // Internet Gateways
    const blueIgw = new aws.ec2.InternetGateway(
      `blue-igw-${environmentSuffix}`,
      {
        vpcId: blueVpc.id,
        tags: {
          Name: `blue-igw-${environmentSuffix}`,
          Environment: 'blue',
        },
      },
      { parent: this }
    );

    const greenIgw = new aws.ec2.InternetGateway(
      `green-igw-${environmentSuffix}`,
      {
        vpcId: greenVpc.id,
        tags: {
          Name: `green-igw-${environmentSuffix}`,
          Environment: 'green',
        },
      },
      { parent: this }
    );

    // Route Tables for Public Subnets
    const bluePublicRouteTable = new aws.ec2.RouteTable(
      `blue-public-rt-${environmentSuffix}`,
      {
        vpcId: blueVpc.id,
        tags: {
          Name: `blue-public-rt-${environmentSuffix}`,
          Environment: 'blue',
        },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `blue-public-route-${environmentSuffix}`,
      {
        routeTableId: bluePublicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: blueIgw.id,
      },
      { parent: this }
    );

    const greenPublicRouteTable = new aws.ec2.RouteTable(
      `green-public-rt-${environmentSuffix}`,
      {
        vpcId: greenVpc.id,
        tags: {
          Name: `green-public-rt-${environmentSuffix}`,
          Environment: 'green',
        },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `green-public-route-${environmentSuffix}`,
      {
        routeTableId: greenPublicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: greenIgw.id,
      },
      { parent: this }
    );

    // Associate public subnets with route tables
    bluePublicSubnets.apply(subnets =>
      subnets.forEach(
        (subnet, i) =>
          new aws.ec2.RouteTableAssociation(
            `blue-public-rta-${i}-${environmentSuffix}`,
            {
              subnetId: subnet.id,
              routeTableId: bluePublicRouteTable.id,
            },
            { parent: this }
          )
      )
    );

    greenPublicSubnets.apply(subnets =>
      subnets.forEach(
        (subnet, i) =>
          new aws.ec2.RouteTableAssociation(
            `green-public-rta-${i}-${environmentSuffix}`,
            {
              subnetId: subnet.id,
              routeTableId: greenPublicRouteTable.id,
            },
            { parent: this }
          )
      )
    );

    // Transit Gateway
    const transitGateway = new aws.ec2transitgateway.TransitGateway(
      `tgw-${environmentSuffix}`,
      {
        description: 'Transit Gateway for blue-green environments',
        defaultRouteTableAssociation: 'enable',
        defaultRouteTablePropagation: 'enable',
        tags: {
          Name: `tgw-${environmentSuffix}`,
          Service: 'payment-processing',
        },
      },
      { parent: this }
    );

    // Attach VPCs to Transit Gateway
    new aws.ec2transitgateway.VpcAttachment(
      `blue-tgw-attachment-${environmentSuffix}`,
      {
        transitGatewayId: transitGateway.id,
        vpcId: blueVpc.id,
        subnetIds: bluePrivateSubnets.apply(subnets => subnets.map(s => s.id)),
        tags: {
          Name: `blue-tgw-attachment-${environmentSuffix}`,
          Environment: 'blue',
        },
      },
      { parent: this }
    );

    new aws.ec2transitgateway.VpcAttachment(
      `green-tgw-attachment-${environmentSuffix}`,
      {
        transitGatewayId: transitGateway.id,
        vpcId: greenVpc.id,
        subnetIds: greenPrivateSubnets.apply(subnets => subnets.map(s => s.id)),
        tags: {
          Name: `green-tgw-attachment-${environmentSuffix}`,
          Environment: 'green',
        },
      },
      { parent: this }
    );

    // Security Groups for ALB
    const blueAlbSecurityGroup = new aws.ec2.SecurityGroup(
      `blue-alb-sg-${environmentSuffix}`,
      {
        vpcId: blueVpc.id,
        description: 'Security group for blue ALB',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          Name: `blue-alb-sg-${environmentSuffix}`,
          Environment: 'blue',
        },
      },
      { parent: this }
    );

    const greenAlbSecurityGroup = new aws.ec2.SecurityGroup(
      `green-alb-sg-${environmentSuffix}`,
      {
        vpcId: greenVpc.id,
        description: 'Security group for green ALB',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          Name: `green-alb-sg-${environmentSuffix}`,
          Environment: 'green',
        },
      },
      { parent: this }
    );

    // Security Groups for ECS
    const blueEcsSecurityGroup = new aws.ec2.SecurityGroup(
      `blue-ecs-sg-${environmentSuffix}`,
      {
        vpcId: blueVpc.id,
        description: 'Security group for blue ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [blueAlbSecurityGroup.id],
            description: 'From ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          Name: `blue-ecs-sg-${environmentSuffix}`,
          Environment: 'blue',
        },
      },
      { parent: this }
    );

    const greenEcsSecurityGroup = new aws.ec2.SecurityGroup(
      `green-ecs-sg-${environmentSuffix}`,
      {
        vpcId: greenVpc.id,
        description: 'Security group for green ECS tasks',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [greenAlbSecurityGroup.id],
            description: 'From ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          Name: `green-ecs-sg-${environmentSuffix}`,
          Environment: 'green',
        },
      },
      { parent: this }
    );

    // Security Groups for Aurora
    const blueDbSecurityGroup = new aws.ec2.SecurityGroup(
      `blue-db-sg-${environmentSuffix}`,
      {
        vpcId: blueVpc.id,
        description: 'Security group for blue Aurora cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [blueEcsSecurityGroup.id],
            description: 'From ECS tasks',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          Name: `blue-db-sg-${environmentSuffix}`,
          Environment: 'blue',
        },
      },
      { parent: this }
    );

    const greenDbSecurityGroup = new aws.ec2.SecurityGroup(
      `green-db-sg-${environmentSuffix}`,
      {
        vpcId: greenVpc.id,
        description: 'Security group for green Aurora cluster',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [greenEcsSecurityGroup.id],
            description: 'From ECS tasks',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          Name: `green-db-sg-${environmentSuffix}`,
          Environment: 'green',
        },
      },
      { parent: this }
    );

    // DB Subnet Groups
    const blueDbSubnetGroup = new aws.rds.SubnetGroup(
      `blue-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: bluePrivateSubnets.apply(subnets => subnets.map(s => s.id)),
        tags: {
          Name: `blue-db-subnet-group-${environmentSuffix}`,
          Environment: 'blue',
        },
      },
      { parent: this }
    );

    const greenDbSubnetGroup = new aws.rds.SubnetGroup(
      `green-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: greenPrivateSubnets.apply(subnets => subnets.map(s => s.id)),
        tags: {
          Name: `green-db-subnet-group-${environmentSuffix}`,
          Environment: 'green',
        },
      },
      { parent: this }
    );

    // Aurora Cluster Parameter Groups
    const auroraClusterParameterGroup = new aws.rds.ClusterParameterGroup(
      `aurora-pg-cluster-${environmentSuffix}`,
      {
        family: 'aurora-postgresql14',
        description: 'Aurora PostgreSQL 14 cluster parameter group',
        tags: {
          Name: `aurora-pg-cluster-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Blue Aurora Cluster
    const blueAuroraCluster = new aws.rds.Cluster(
      `blue-aurora-${environmentSuffix}`,
      {
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        clusterIdentifier: `blue-aurora-${environmentSuffix}`,
        masterUsername: 'dbadmin',
        masterPassword: pulumi.secret('TemporaryPassword123!'),
        dbSubnetGroupName: blueDbSubnetGroup.name,
        vpcSecurityGroupIds: [blueDbSecurityGroup.id],
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        dbClusterParameterGroupName: auroraClusterParameterGroup.name,
        skipFinalSnapshot: true,
        tags: {
          Name: `blue-aurora-${environmentSuffix}`,
          Environment: 'blue',
          Service: 'payment-processing',
        },
      },
      { parent: this }
    );

    // Green Aurora Cluster
    const greenAuroraCluster = new aws.rds.Cluster(
      `green-aurora-${environmentSuffix}`,
      {
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        clusterIdentifier: `green-aurora-${environmentSuffix}`,
        masterUsername: 'dbadmin',
        masterPassword: pulumi.secret('TemporaryPassword123!'),
        dbSubnetGroupName: greenDbSubnetGroup.name,
        vpcSecurityGroupIds: [greenDbSecurityGroup.id],
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        dbClusterParameterGroupName: auroraClusterParameterGroup.name,
        skipFinalSnapshot: true,
        tags: {
          Name: `green-aurora-${environmentSuffix}`,
          Environment: 'green',
          Service: 'payment-processing',
        },
      },
      { parent: this }
    );

    // Aurora Instances for Blue
    const blueAuroraWriter = new aws.rds.ClusterInstance(
      `blue-aurora-writer-${environmentSuffix}`,
      {
        identifier: `blue-aurora-writer-${environmentSuffix}`,
        clusterIdentifier: blueAuroraCluster.id,
        instanceClass: 'db.r6g.large',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        publiclyAccessible: false,
        tags: {
          Name: `blue-aurora-writer-${environmentSuffix}`,
          Environment: 'blue',
          Role: 'writer',
        },
      },
      { parent: this }
    );

    new aws.rds.ClusterInstance(
      `blue-aurora-reader-${environmentSuffix}`,
      {
        identifier: `blue-aurora-reader-${environmentSuffix}`,
        clusterIdentifier: blueAuroraCluster.id,
        instanceClass: 'db.r6g.large',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        publiclyAccessible: false,
        tags: {
          Name: `blue-aurora-reader-${environmentSuffix}`,
          Environment: 'blue',
          Role: 'reader',
        },
      },
      { parent: this, dependsOn: [blueAuroraWriter] }
    );

    // Aurora Instances for Green
    const greenAuroraWriter = new aws.rds.ClusterInstance(
      `green-aurora-writer-${environmentSuffix}`,
      {
        identifier: `green-aurora-writer-${environmentSuffix}`,
        clusterIdentifier: greenAuroraCluster.id,
        instanceClass: 'db.r6g.large',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        publiclyAccessible: false,
        tags: {
          Name: `green-aurora-writer-${environmentSuffix}`,
          Environment: 'green',
          Role: 'writer',
        },
      },
      { parent: this }
    );

    new aws.rds.ClusterInstance(
      `green-aurora-reader-${environmentSuffix}`,
      {
        identifier: `green-aurora-reader-${environmentSuffix}`,
        clusterIdentifier: greenAuroraCluster.id,
        instanceClass: 'db.r6g.large',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        publiclyAccessible: false,
        tags: {
          Name: `green-aurora-reader-${environmentSuffix}`,
          Environment: 'green',
          Role: 'reader',
        },
      },
      { parent: this, dependsOn: [greenAuroraWriter] }
    );

    // S3 Buckets
    const transactionLogsBucket = new aws.s3.Bucket(
      `transaction-logs-${environmentSuffix}`,
      {
        bucket: `transaction-logs-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            id: 'archive-old-logs',
            enabled: true,
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        tags: {
          Name: `transaction-logs-${environmentSuffix}`,
          Service: 'payment-processing',
        },
      },
      { parent: this }
    );

    // S3 Bucket Policy for SSL enforcement
    new aws.s3.BucketPolicy(
      `transaction-logs-policy-${environmentSuffix}`,
      {
        bucket: transactionLogsBucket.id,
        policy: pulumi.all([transactionLogsBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'DenyInsecureTransport',
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:*',
                Resource: [bucketArn, `${bucketArn}/*`],
                Condition: {
                  Bool: {
                    'aws:SecureTransport': 'false',
                  },
                },
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    const complianceDocsBucket = new aws.s3.Bucket(
      `compliance-docs-${environmentSuffix}`,
      {
        bucket: `compliance-docs-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            id: 'archive-compliance-docs',
            enabled: true,
            transitions: [
              {
                days: 30,
                storageClass: 'INTELLIGENT_TIERING',
              },
              {
                days: 180,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        tags: {
          Name: `compliance-docs-${environmentSuffix}`,
          Service: 'payment-processing',
        },
      },
      { parent: this }
    );

    new aws.s3.BucketPolicy(
      `compliance-docs-policy-${environmentSuffix}`,
      {
        bucket: complianceDocsBucket.id,
        policy: pulumi.all([complianceDocsBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'DenyInsecureTransport',
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:*',
                Resource: [bucketArn, `${bucketArn}/*`],
                Condition: {
                  Bool: {
                    'aws:SecureTransport': 'false',
                  },
                },
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Block public access for S3 buckets
    new aws.s3.BucketPublicAccessBlock(
      `transaction-logs-block-${environmentSuffix}`,
      {
        bucket: transactionLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `compliance-docs-block-${environmentSuffix}`,
      {
        bucket: complianceDocsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // DynamoDB Tables
    const sessionTable = new aws.dynamodb.Table(
      `sessions-${environmentSuffix}`,
      {
        name: `sessions-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'sessionId',
        rangeKey: 'userId',
        attributes: [
          { name: 'sessionId', type: 'S' },
          { name: 'userId', type: 'S' },
          { name: 'email', type: 'S' },
        ],
        globalSecondaryIndexes: [
          {
            name: 'UserEmailIndex',
            hashKey: 'email',
            projectionType: 'ALL',
          },
        ],
        pointInTimeRecovery: {
          enabled: true,
        },
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
        ttl: {
          attributeName: 'ttl',
          enabled: true,
        },
        tags: {
          Name: `sessions-${environmentSuffix}`,
          Service: 'payment-processing',
        },
      },
      { parent: this }
    );

    const rateLimitTable = new aws.dynamodb.Table(
      `rate-limits-${environmentSuffix}`,
      {
        name: `rate-limits-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'apiKey',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'apiKey', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ],
        pointInTimeRecovery: {
          enabled: true,
        },
        ttl: {
          attributeName: 'expiryTime',
          enabled: true,
        },
        tags: {
          Name: `rate-limits-${environmentSuffix}`,
          Service: 'payment-processing',
        },
      },
      { parent: this }
    );

    // IAM Role for ECS Tasks
    const ecsTaskRole = new aws.iam.Role(
      `ecs-task-role-${environmentSuffix}`,
      {
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
        },
      },
      { parent: this }
    );

    // IAM Policy for ECS Tasks
    new aws.iam.RolePolicy(
      `ecs-task-policy-${environmentSuffix}`,
      {
        role: ecsTaskRole.id,
        policy: pulumi
          .all([
            transactionLogsBucket.arn,
            complianceDocsBucket.arn,
            sessionTable.arn,
            rateLimitTable.arn,
          ])
          .apply(([txLogsArn, docsArn, sessionsArn, rateLimitArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:PutObject'],
                  Resource: [`${txLogsArn}/*`, `${docsArn}/*`],
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:Query',
                  ],
                  Resource: [
                    sessionsArn,
                    rateLimitArn,
                    `${sessionsArn}/index/*`,
                  ],
                },
                {
                  Effect: 'Allow',
                  Action: ['secretsmanager:GetSecretValue'],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: ['ssm:GetParameter', 'ssm:GetParameters'],
                  Resource: `arn:aws:ssm:${region}:*:parameter/payment-processing/*`,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                  ],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // IAM Role for ECS Task Execution
    const ecsExecutionRole = new aws.iam.Role(
      `ecs-execution-role-${environmentSuffix}`,
      {
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
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
        ],
        tags: {
          Name: `ecs-execution-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // ECS Clusters
    const blueEcsCluster = new aws.ecs.Cluster(
      `blue-ecs-cluster-${environmentSuffix}`,
      {
        name: `blue-ecs-cluster-${environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          Name: `blue-ecs-cluster-${environmentSuffix}`,
          Environment: 'blue',
        },
      },
      { parent: this }
    );

    const greenEcsCluster = new aws.ecs.Cluster(
      `green-ecs-cluster-${environmentSuffix}`,
      {
        name: `green-ecs-cluster-${environmentSuffix}`,
        settings: [
          {
            name: 'containerInsights',
            value: 'enabled',
          },
        ],
        tags: {
          Name: `green-ecs-cluster-${environmentSuffix}`,
          Environment: 'green',
        },
      },
      { parent: this }
    );

    // CloudWatch Log Groups
    const bluePaymentApiLogGroup = new aws.cloudwatch.LogGroup(
      `blue-payment-api-logs-${environmentSuffix}`,
      {
        name: `/ecs/blue-payment-api-${environmentSuffix}`,
        retentionInDays: 90,
        tags: {
          Environment: 'blue',
          Service: 'payment-api',
        },
      },
      { parent: this }
    );

    const blueTransactionProcessorLogGroup = new aws.cloudwatch.LogGroup(
      `blue-transaction-processor-logs-${environmentSuffix}`,
      {
        name: `/ecs/blue-transaction-processor-${environmentSuffix}`,
        retentionInDays: 90,
        tags: {
          Environment: 'blue',
          Service: 'transaction-processor',
        },
      },
      { parent: this }
    );

    const blueReportingLogGroup = new aws.cloudwatch.LogGroup(
      `blue-reporting-logs-${environmentSuffix}`,
      {
        name: `/ecs/blue-reporting-${environmentSuffix}`,
        retentionInDays: 90,
        tags: {
          Environment: 'blue',
          Service: 'reporting',
        },
      },
      { parent: this }
    );

    const greenPaymentApiLogGroup = new aws.cloudwatch.LogGroup(
      `green-payment-api-logs-${environmentSuffix}`,
      {
        name: `/ecs/green-payment-api-${environmentSuffix}`,
        retentionInDays: 90,
        tags: {
          Environment: 'green',
          Service: 'payment-api',
        },
      },
      { parent: this }
    );

    const greenTransactionProcessorLogGroup = new aws.cloudwatch.LogGroup(
      `green-transaction-processor-logs-${environmentSuffix}`,
      {
        name: `/ecs/green-transaction-processor-${environmentSuffix}`,
        retentionInDays: 90,
        tags: {
          Environment: 'green',
          Service: 'transaction-processor',
        },
      },
      { parent: this }
    );

    const greenReportingLogGroup = new aws.cloudwatch.LogGroup(
      `green-reporting-logs-${environmentSuffix}`,
      {
        name: `/ecs/green-reporting-${environmentSuffix}`,
        retentionInDays: 90,
        tags: {
          Environment: 'green',
          Service: 'reporting',
        },
      },
      { parent: this }
    );

    // ECS Task Definitions - Blue
    const bluePaymentApiTaskDefinition = new aws.ecs.TaskDefinition(
      `blue-payment-api-task-${environmentSuffix}`,
      {
        family: `blue-payment-api-${environmentSuffix}`,
        cpu: '256',
        memory: '512',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: ecsExecutionRole.arn,
        taskRoleArn: ecsTaskRole.arn,
        containerDefinitions: pulumi.jsonStringify([
          {
            name: 'payment-api',
            image: 'public.ecr.aws/docker/library/nginx:alpine',
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
                'awslogs-group': bluePaymentApiLogGroup.name,
                'awslogs-region': region,
                'awslogs-stream-prefix': 'ecs',
              },
            },
          },
        ]),
        tags: {
          Name: `blue-payment-api-task-${environmentSuffix}`,
          Environment: 'blue',
          Service: 'payment-api',
        },
      },
      { parent: this }
    );

    const blueTransactionProcessorTaskDefinition = new aws.ecs.TaskDefinition(
      `blue-transaction-processor-task-${environmentSuffix}`,
      {
        family: `blue-transaction-processor-${environmentSuffix}`,
        cpu: '512',
        memory: '1024',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: ecsExecutionRole.arn,
        taskRoleArn: ecsTaskRole.arn,
        containerDefinitions: pulumi.jsonStringify([
          {
            name: 'transaction-processor',
            image: 'public.ecr.aws/docker/library/nginx:alpine',
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
                'awslogs-group': blueTransactionProcessorLogGroup.name,
                'awslogs-region': region,
                'awslogs-stream-prefix': 'ecs',
              },
            },
          },
        ]),
        tags: {
          Name: `blue-transaction-processor-task-${environmentSuffix}`,
          Environment: 'blue',
          Service: 'transaction-processor',
        },
      },
      { parent: this }
    );

    const blueReportingTaskDefinition = new aws.ecs.TaskDefinition(
      `blue-reporting-task-${environmentSuffix}`,
      {
        family: `blue-reporting-${environmentSuffix}`,
        cpu: '256',
        memory: '512',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: ecsExecutionRole.arn,
        taskRoleArn: ecsTaskRole.arn,
        containerDefinitions: pulumi.jsonStringify([
          {
            name: 'reporting',
            image: 'public.ecr.aws/docker/library/nginx:alpine',
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
                'awslogs-group': blueReportingLogGroup.name,
                'awslogs-region': region,
                'awslogs-stream-prefix': 'ecs',
              },
            },
          },
        ]),
        tags: {
          Name: `blue-reporting-task-${environmentSuffix}`,
          Environment: 'blue',
          Service: 'reporting',
        },
      },
      { parent: this }
    );

    // ECS Task Definitions - Green
    const greenPaymentApiTaskDefinition = new aws.ecs.TaskDefinition(
      `green-payment-api-task-${environmentSuffix}`,
      {
        family: `green-payment-api-${environmentSuffix}`,
        cpu: '256',
        memory: '512',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: ecsExecutionRole.arn,
        taskRoleArn: ecsTaskRole.arn,
        containerDefinitions: pulumi.jsonStringify([
          {
            name: 'payment-api',
            image: 'public.ecr.aws/docker/library/nginx:alpine',
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
                'awslogs-group': greenPaymentApiLogGroup.name,
                'awslogs-region': region,
                'awslogs-stream-prefix': 'ecs',
              },
            },
          },
        ]),
        tags: {
          Name: `green-payment-api-task-${environmentSuffix}`,
          Environment: 'green',
          Service: 'payment-api',
        },
      },
      { parent: this }
    );

    const greenTransactionProcessorTaskDefinition = new aws.ecs.TaskDefinition(
      `green-transaction-processor-task-${environmentSuffix}`,
      {
        family: `green-transaction-processor-${environmentSuffix}`,
        cpu: '512',
        memory: '1024',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: ecsExecutionRole.arn,
        taskRoleArn: ecsTaskRole.arn,
        containerDefinitions: pulumi.jsonStringify([
          {
            name: 'transaction-processor',
            image: 'public.ecr.aws/docker/library/nginx:alpine',
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
                'awslogs-group': greenTransactionProcessorLogGroup.name,
                'awslogs-region': region,
                'awslogs-stream-prefix': 'ecs',
              },
            },
          },
        ]),
        tags: {
          Name: `green-transaction-processor-task-${environmentSuffix}`,
          Environment: 'green',
          Service: 'transaction-processor',
        },
      },
      { parent: this }
    );

    const greenReportingTaskDefinition = new aws.ecs.TaskDefinition(
      `green-reporting-task-${environmentSuffix}`,
      {
        family: `green-reporting-${environmentSuffix}`,
        cpu: '256',
        memory: '512',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        executionRoleArn: ecsExecutionRole.arn,
        taskRoleArn: ecsTaskRole.arn,
        containerDefinitions: pulumi.jsonStringify([
          {
            name: 'reporting',
            image: 'public.ecr.aws/docker/library/nginx:alpine',
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
                'awslogs-group': greenReportingLogGroup.name,
                'awslogs-region': region,
                'awslogs-stream-prefix': 'ecs',
              },
            },
          },
        ]),
        tags: {
          Name: `green-reporting-task-${environmentSuffix}`,
          Environment: 'green',
          Service: 'reporting',
        },
      },
      { parent: this }
    );

    // Application Load Balancers - Blue
    const blueAlb = new aws.lb.LoadBalancer(
      `blue-alb-${environmentSuffix}`,
      {
        name: `blue-alb-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [blueAlbSecurityGroup.id],
        subnets: bluePublicSubnets.apply(subnets => subnets.map(s => s.id)),
        enableDeletionProtection: false,
        tags: {
          Name: `blue-alb-${environmentSuffix}`,
          Environment: 'blue',
        },
      },
      { parent: this }
    );

    // Application Load Balancers - Green
    const greenAlb = new aws.lb.LoadBalancer(
      `green-alb-${environmentSuffix}`,
      {
        name: `green-alb-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [greenAlbSecurityGroup.id],
        subnets: greenPublicSubnets.apply(subnets => subnets.map(s => s.id)),
        enableDeletionProtection: false,
        tags: {
          Name: `green-alb-${environmentSuffix}`,
          Environment: 'green',
        },
      },
      { parent: this }
    );

    // Target Groups - Blue
    const bluePaymentApiTargetGroup = new aws.lb.TargetGroup(
      `blue-payment-api-tg-${environmentSuffix}`,
      {
        name: `blue-payment-api-tg-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        targetType: 'ip',
        vpcId: blueVpc.id,
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
        },
        deregistrationDelay: 30,
        tags: {
          Name: `blue-payment-api-tg-${environmentSuffix}`,
          Environment: 'blue',
        },
      },
      { parent: this }
    );

    const blueTransactionProcessorTargetGroup = new aws.lb.TargetGroup(
      `blue-transaction-processor-tg-${environmentSuffix}`,
      {
        name: `blue-txn-proc-tg-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        targetType: 'ip',
        vpcId: blueVpc.id,
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
        },
        deregistrationDelay: 30,
        tags: {
          Name: `blue-transaction-processor-tg-${environmentSuffix}`,
          Environment: 'blue',
        },
      },
      { parent: this }
    );

    const blueReportingTargetGroup = new aws.lb.TargetGroup(
      `blue-reporting-tg-${environmentSuffix}`,
      {
        name: `blue-reporting-tg-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        targetType: 'ip',
        vpcId: blueVpc.id,
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
        },
        deregistrationDelay: 30,
        tags: {
          Name: `blue-reporting-tg-${environmentSuffix}`,
          Environment: 'blue',
        },
      },
      { parent: this }
    );

    // Target Groups - Green
    const greenPaymentApiTargetGroup = new aws.lb.TargetGroup(
      `green-payment-api-tg-${environmentSuffix}`,
      {
        name: `green-payment-api-tg-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        targetType: 'ip',
        vpcId: greenVpc.id,
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
        },
        deregistrationDelay: 30,
        tags: {
          Name: `green-payment-api-tg-${environmentSuffix}`,
          Environment: 'green',
        },
      },
      { parent: this }
    );

    const greenTransactionProcessorTargetGroup = new aws.lb.TargetGroup(
      `green-transaction-processor-tg-${environmentSuffix}`,
      {
        name: `green-txn-proc-tg-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        targetType: 'ip',
        vpcId: greenVpc.id,
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
        },
        deregistrationDelay: 30,
        tags: {
          Name: `green-transaction-processor-tg-${environmentSuffix}`,
          Environment: 'green',
        },
      },
      { parent: this }
    );

    const greenReportingTargetGroup = new aws.lb.TargetGroup(
      `green-reporting-tg-${environmentSuffix}`,
      {
        name: `green-reporting-tg-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        targetType: 'ip',
        vpcId: greenVpc.id,
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          timeout: 5,
          interval: 30,
        },
        deregistrationDelay: 30,
        tags: {
          Name: `green-reporting-tg-${environmentSuffix}`,
          Environment: 'green',
        },
      },
      { parent: this }
    );

    // WAF WebACL for Blue ALB
    const blueWafWebAcl = new aws.wafv2.WebAcl(
      `blue-waf-${environmentSuffix}`,
      {
        scope: 'REGIONAL',
        defaultAction: {
          allow: {},
        },
        rules: [
          {
            name: 'RateLimitRule',
            priority: 1,
            action: {
              block: {},
            },
            statement: {
              rateBasedStatement: {
                limit: 10000,
                aggregateKeyType: 'IP',
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'RateLimitRule',
              sampledRequestsEnabled: true,
            },
          },
          {
            name: 'SQLInjectionRule',
            priority: 2,
            action: {
              block: {},
            },
            statement: {
              sqliMatchStatement: {
                fieldToMatch: {
                  body: {},
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                ],
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'SQLInjectionRule',
              sampledRequestsEnabled: true,
            },
          },
          {
            name: 'XSSRule',
            priority: 3,
            action: {
              block: {},
            },
            statement: {
              xssMatchStatement: {
                fieldToMatch: {
                  body: {},
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                ],
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'XSSRule',
              sampledRequestsEnabled: true,
            },
          },
        ],
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `blue-waf-${environmentSuffix}`,
          sampledRequestsEnabled: true,
        },
        tags: {
          Name: `blue-waf-${environmentSuffix}`,
          Environment: 'blue',
        },
      },
      { parent: this }
    );

    // WAF WebACL for Green ALB
    const greenWafWebAcl = new aws.wafv2.WebAcl(
      `green-waf-${environmentSuffix}`,
      {
        scope: 'REGIONAL',
        defaultAction: {
          allow: {},
        },
        rules: [
          {
            name: 'RateLimitRule',
            priority: 1,
            action: {
              block: {},
            },
            statement: {
              rateBasedStatement: {
                limit: 10000,
                aggregateKeyType: 'IP',
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'RateLimitRule',
              sampledRequestsEnabled: true,
            },
          },
          {
            name: 'SQLInjectionRule',
            priority: 2,
            action: {
              block: {},
            },
            statement: {
              sqliMatchStatement: {
                fieldToMatch: {
                  body: {},
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                ],
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'SQLInjectionRule',
              sampledRequestsEnabled: true,
            },
          },
          {
            name: 'XSSRule',
            priority: 3,
            action: {
              block: {},
            },
            statement: {
              xssMatchStatement: {
                fieldToMatch: {
                  body: {},
                },
                textTransformations: [
                  {
                    priority: 0,
                    type: 'URL_DECODE',
                  },
                ],
              },
            },
            visibilityConfig: {
              cloudwatchMetricsEnabled: true,
              metricName: 'XSSRule',
              sampledRequestsEnabled: true,
            },
          },
        ],
        visibilityConfig: {
          cloudwatchMetricsEnabled: true,
          metricName: `green-waf-${environmentSuffix}`,
          sampledRequestsEnabled: true,
        },
        tags: {
          Name: `green-waf-${environmentSuffix}`,
          Environment: 'green',
        },
      },
      { parent: this }
    );

    // Associate WAF with ALBs
    new aws.wafv2.WebAclAssociation(
      `blue-waf-assoc-${environmentSuffix}`,
      {
        resourceArn: blueAlb.arn,
        webAclArn: blueWafWebAcl.arn,
      },
      { parent: this }
    );

    new aws.wafv2.WebAclAssociation(
      `green-waf-assoc-${environmentSuffix}`,
      {
        resourceArn: greenAlb.arn,
        webAclArn: greenWafWebAcl.arn,
      },
      { parent: this }
    );

    // ALB Listeners - Blue (MUST CREATE BEFORE ECS SERVICES)
    const blueAlbListener = new aws.lb.Listener(
      `blue-alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: blueAlb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: bluePaymentApiTargetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // Additional listener rules for other target groups
    new aws.lb.ListenerRule(
      `blue-txn-processor-rule-${environmentSuffix}`,
      {
        listenerArn: blueAlbListener.arn,
        priority: 100,
        actions: [
          {
            type: 'forward',
            targetGroupArn: blueTransactionProcessorTargetGroup.arn,
          },
        ],
        conditions: [
          {
            pathPattern: {
              values: ['/transaction/*'],
            },
          },
        ],
      },
      { parent: this }
    );

    new aws.lb.ListenerRule(
      `blue-reporting-rule-${environmentSuffix}`,
      {
        listenerArn: blueAlbListener.arn,
        priority: 101,
        actions: [
          {
            type: 'forward',
            targetGroupArn: blueReportingTargetGroup.arn,
          },
        ],
        conditions: [
          {
            pathPattern: {
              values: ['/reporting/*'],
            },
          },
        ],
      },
      { parent: this }
    );

    // ALB Listeners - Green (MUST CREATE BEFORE ECS SERVICES)
    const greenAlbListener = new aws.lb.Listener(
      `green-alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: greenAlb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: greenPaymentApiTargetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // Additional listener rules for other target groups
    new aws.lb.ListenerRule(
      `green-txn-processor-rule-${environmentSuffix}`,
      {
        listenerArn: greenAlbListener.arn,
        priority: 100,
        actions: [
          {
            type: 'forward',
            targetGroupArn: greenTransactionProcessorTargetGroup.arn,
          },
        ],
        conditions: [
          {
            pathPattern: {
              values: ['/transaction/*'],
            },
          },
        ],
      },
      { parent: this }
    );

    new aws.lb.ListenerRule(
      `green-reporting-rule-${environmentSuffix}`,
      {
        listenerArn: greenAlbListener.arn,
        priority: 101,
        actions: [
          {
            type: 'forward',
            targetGroupArn: greenReportingTargetGroup.arn,
          },
        ],
        conditions: [
          {
            pathPattern: {
              values: ['/reporting/*'],
            },
          },
        ],
      },
      { parent: this }
    );

    // ECS Services - Blue (CREATE AFTER LISTENERS)
    new aws.ecs.Service(
      `blue-payment-api-service-${environmentSuffix}`,
      {
        name: `blue-payment-api-service-${environmentSuffix}`,
        cluster: blueEcsCluster.arn,
        taskDefinition: bluePaymentApiTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: bluePrivateSubnets.apply(subnets => subnets.map(s => s.id)),
          securityGroups: [blueEcsSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: bluePaymentApiTargetGroup.arn,
            containerName: 'payment-api',
            containerPort: 8080,
          },
        ],
        tags: {
          Name: `blue-payment-api-service-${environmentSuffix}`,
          Environment: 'blue',
          Service: 'payment-api',
        },
      },
      { parent: this, dependsOn: [blueAlbListener] }
    );

    new aws.ecs.Service(
      `blue-transaction-processor-service-${environmentSuffix}`,
      {
        name: `blue-txn-proc-service-${environmentSuffix}`,
        cluster: blueEcsCluster.arn,
        taskDefinition: blueTransactionProcessorTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: bluePrivateSubnets.apply(subnets => subnets.map(s => s.id)),
          securityGroups: [blueEcsSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: blueTransactionProcessorTargetGroup.arn,
            containerName: 'transaction-processor',
            containerPort: 8080,
          },
        ],
        tags: {
          Name: `blue-transaction-processor-service-${environmentSuffix}`,
          Environment: 'blue',
          Service: 'transaction-processor',
        },
      },
      { parent: this, dependsOn: [blueAlbListener] }
    );

    new aws.ecs.Service(
      `blue-reporting-service-${environmentSuffix}`,
      {
        name: `blue-reporting-service-${environmentSuffix}`,
        cluster: blueEcsCluster.arn,
        taskDefinition: blueReportingTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: bluePrivateSubnets.apply(subnets => subnets.map(s => s.id)),
          securityGroups: [blueEcsSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: blueReportingTargetGroup.arn,
            containerName: 'reporting',
            containerPort: 8080,
          },
        ],
        tags: {
          Name: `blue-reporting-service-${environmentSuffix}`,
          Environment: 'blue',
          Service: 'reporting',
        },
      },
      { parent: this, dependsOn: [blueAlbListener] }
    );

    // ECS Services - Green (CREATE AFTER LISTENERS)
    new aws.ecs.Service(
      `green-payment-api-service-${environmentSuffix}`,
      {
        name: `green-payment-api-service-${environmentSuffix}`,
        cluster: greenEcsCluster.arn,
        taskDefinition: greenPaymentApiTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: greenPrivateSubnets.apply(subnets => subnets.map(s => s.id)),
          securityGroups: [greenEcsSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: greenPaymentApiTargetGroup.arn,
            containerName: 'payment-api',
            containerPort: 8080,
          },
        ],
        tags: {
          Name: `green-payment-api-service-${environmentSuffix}`,
          Environment: 'green',
          Service: 'payment-api',
        },
      },
      { parent: this, dependsOn: [greenAlbListener] }
    );

    new aws.ecs.Service(
      `green-transaction-processor-service-${environmentSuffix}`,
      {
        name: `green-txn-proc-service-${environmentSuffix}`,
        cluster: greenEcsCluster.arn,
        taskDefinition: greenTransactionProcessorTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: greenPrivateSubnets.apply(subnets => subnets.map(s => s.id)),
          securityGroups: [greenEcsSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: greenTransactionProcessorTargetGroup.arn,
            containerName: 'transaction-processor',
            containerPort: 8080,
          },
        ],
        tags: {
          Name: `green-transaction-processor-service-${environmentSuffix}`,
          Environment: 'green',
          Service: 'transaction-processor',
        },
      },
      { parent: this, dependsOn: [greenAlbListener] }
    );

    new aws.ecs.Service(
      `green-reporting-service-${environmentSuffix}`,
      {
        name: `green-reporting-service-${environmentSuffix}`,
        cluster: greenEcsCluster.arn,
        taskDefinition: greenReportingTaskDefinition.arn,
        desiredCount: 2,
        launchType: 'FARGATE',
        networkConfiguration: {
          subnets: greenPrivateSubnets.apply(subnets => subnets.map(s => s.id)),
          securityGroups: [greenEcsSecurityGroup.id],
          assignPublicIp: false,
        },
        loadBalancers: [
          {
            targetGroupArn: greenReportingTargetGroup.arn,
            containerName: 'reporting',
            containerPort: 8080,
          },
        ],
        tags: {
          Name: `green-reporting-service-${environmentSuffix}`,
          Environment: 'green',
          Service: 'reporting',
        },
      },
      { parent: this, dependsOn: [greenAlbListener] }
    );

    // Lambda Role for Data Migration
    const lambdaRole = new aws.iam.Role(
      `migration-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
        ],
        tags: {
          Name: `migration-lambda-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Lambda Policy for Database Access
    new aws.iam.RolePolicy(
      `migration-lambda-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([blueAuroraCluster.arn, greenAuroraCluster.arn])
          .apply(([blueDbArn, greenDbArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['rds:DescribeDBClusters', 'rds:DescribeDBInstances'],
                  Resource: [blueDbArn, greenDbArn],
                },
                {
                  Effect: 'Allow',
                  Action: ['secretsmanager:GetSecretValue'],
                  Resource: '*',
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Lambda Security Group
    const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
      `lambda-sg-${environmentSuffix}`,
      {
        vpcId: blueVpc.id,
        description: 'Security group for migration Lambda',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          Name: `lambda-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Lambda Function for Data Migration
    const migrationLambda = new aws.lambda.Function(
      `data-migration-lambda-${environmentSuffix}`,
      {
        name: `data-migration-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        role: lambdaRole.arn,
        handler: 'index.handler',
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Starting data migration from blue to green');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  // Implement incremental data sync logic here
  // This is a placeholder implementation
  try {
    // Connect to blue database
    console.log('Connecting to blue database...');
    
    // Fetch incremental changes
    console.log('Fetching incremental changes...');
    
    // Transform and sync to green database
    console.log('Syncing data to green database...');
    
    // Log migration status to CloudWatch
    console.log('Migration batch completed successfully');
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Migration completed',
        recordsSynced: 0,
      }),
    };
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  }
};
`),
        }),
        timeout: 300,
        memorySize: 512,
        vpcConfig: {
          subnetIds: bluePrivateSubnets.apply(subnets =>
            subnets.map(s => s.id)
          ),
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        environment: {
          variables: {
            BLUE_DB_CLUSTER: blueAuroraCluster.endpoint,
            GREEN_DB_CLUSTER: greenAuroraCluster.endpoint,
          },
        },
        tags: {
          Name: `data-migration-lambda-${environmentSuffix}`,
          Service: 'migration',
        },
      },
      { parent: this }
    );

    // CloudWatch Log Group for Lambda
    new aws.cloudwatch.LogGroup(
      `migration-lambda-logs-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/${migrationLambda.name}`,
        retentionInDays: 90,
        tags: {
          Service: 'migration',
        },
      },
      { parent: this }
    );

    // SNS Topic for Alerts
    const alertTopic = new aws.sns.Topic(
      `alerts-${environmentSuffix}`,
      {
        name: `payment-alerts-${environmentSuffix}`,
        displayName: 'Payment Processing Alerts',
        tags: {
          Name: `alerts-${environmentSuffix}`,
          Service: 'payment-processing',
        },
      },
      { parent: this }
    );

    // CloudWatch Alarms - Blue Environment
    new aws.cloudwatch.MetricAlarm(
      `blue-high-error-rate-${environmentSuffix}`,
      {
        name: `blue-high-error-rate-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: '5XXError',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 1,
        alarmDescription: 'Alert when error rate exceeds 1% over 5 minutes',
        alarmActions: [alertTopic.arn],
        dimensions: {
          LoadBalancer: blueAlb.arnSuffix,
        },
        tags: {
          Environment: 'blue',
        },
      },
      { parent: this }
    );

    // CloudWatch Alarms - Green Environment
    new aws.cloudwatch.MetricAlarm(
      `green-high-error-rate-${environmentSuffix}`,
      {
        name: `green-high-error-rate-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: '5XXError',
        namespace: 'AWS/ApplicationELB',
        period: 300,
        statistic: 'Average',
        threshold: 1,
        alarmDescription: 'Alert when error rate exceeds 1% over 5 minutes',
        alarmActions: [alertTopic.arn],
        dimensions: {
          LoadBalancer: greenAlb.arnSuffix,
        },
        tags: {
          Environment: 'green',
        },
      },
      { parent: this }
    );

    // CloudWatch Dashboard - FIXED METRICS FORMAT
    const dashboard = new aws.cloudwatch.Dashboard(
      `payment-dashboard-${environmentSuffix}`,
      {
        dashboardName: `payment-processing-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([
            blueAlb.arnSuffix,
            greenAlb.arnSuffix,
            blueAuroraCluster.id,
            greenAuroraCluster.id,
          ])
          .apply(([blueAlbSuffix, greenAlbSuffix, blueDbId, greenDbId]) =>
            JSON.stringify({
              widgets: [
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      ['AWS/ApplicationELB', 'RequestCount', 'LoadBalancer', blueAlbSuffix],
                      ['...', greenAlbSuffix],
                    ],
                    period: 300,
                    stat: 'Sum',
                    region: region,
                    title: 'Transaction Throughput',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      ['AWS/ApplicationELB', 'TargetResponseTime', 'LoadBalancer', blueAlbSuffix],
                      ['...', greenAlbSuffix],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: region,
                    title: 'Response Time',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      ['AWS/ApplicationELB', 'HTTPCode_Target_5XX_Count', 'LoadBalancer', blueAlbSuffix],
                      ['...', greenAlbSuffix],
                    ],
                    period: 300,
                    stat: 'Sum',
                    region: region,
                    title: 'Error Rates',
                  },
                },
                {
                  type: 'metric',
                  properties: {
                    metrics: [
                      ['AWS/RDS', 'CPUUtilization', 'DBClusterIdentifier', blueDbId],
                      ['...', greenDbId],
                    ],
                    period: 300,
                    stat: 'Average',
                    region: region,
                    title: 'Database Performance',
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Route 53 Health Checks
    new aws.route53.HealthCheck(
      `blue-health-check-${environmentSuffix}`,
      {
        type: 'HTTP',
        resourcePath: '/health',
        fqdn: blueAlb.dnsName,
        port: 80,
        requestInterval: 30,
        failureThreshold: 3,
        tags: {
          Name: `blue-health-check-${environmentSuffix}`,
          Environment: 'blue',
        },
      },
      { parent: this }
    );

    new aws.route53.HealthCheck(
      `green-health-check-${environmentSuffix}`,
      {
        type: 'HTTP',
        resourcePath: '/health',
        fqdn: greenAlb.dnsName,
        port: 80,
        requestInterval: 30,
        failureThreshold: 3,
        tags: {
          Name: `green-health-check-${environmentSuffix}`,
          Environment: 'green',
        },
      },
      { parent: this }
    );

    // Export Stack Outputs
    this.blueAlbEndpoint = pulumi.interpolate`http://${blueAlb.dnsName}`;
    this.greenAlbEndpoint = pulumi.interpolate`http://${greenAlb.dnsName}`;
    this.blueDatabaseEndpoint = blueAuroraCluster.endpoint;
    this.greenDatabaseEndpoint = greenAuroraCluster.endpoint;
    this.dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${region}#dashboards:name=${dashboard.dashboardName}`;

    this.registerOutputs({
      blueAlbEndpoint: this.blueAlbEndpoint,
      greenAlbEndpoint: this.greenAlbEndpoint,
      blueDatabaseEndpoint: this.blueDatabaseEndpoint,
      greenDatabaseEndpoint: this.greenDatabaseEndpoint,
      dashboardUrl: this.dashboardUrl,
    });
  }
}
