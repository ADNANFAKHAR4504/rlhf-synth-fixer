/**
 * tap-stack.ts
 *
 * Multi-region disaster recovery infrastructure for trading platform
 * Implements automated failover between us-east-1 (primary) and us-east-2 (standby)
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly primaryEndpoint: pulumi.Output<string>;
  public readonly secondaryEndpoint: pulumi.Output<string>;
  public readonly healthCheckUrl: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Get database password from Pulumi config or environment variable
    const config = new pulumi.Config();
    const dbPassword =
      config.getSecret('dbPassword') ||
      pulumi.secret(process.env.TF_VAR_db_password || 'TempPassword123!');

    // Primary region provider (eu-central-1)
    const primaryProvider = new aws.Provider(
      `provider-primary-${environmentSuffix}`,
      {
        region: 'eu-central-1',
      },
      { parent: this }
    );

    // Secondary region provider (eu-central-2)
    const secondaryProvider = new aws.Provider(
      `provider-secondary-${environmentSuffix}`,
      {
        region: 'eu-central-2',
      },
      { parent: this }
    );

    // KMS keys for encryption
    const primaryKmsKey = new aws.kms.Key(
      `kms-primary-${environmentSuffix}`,
      {
        description: `KMS key for primary region ${environmentSuffix}`,
        enableKeyRotation: true,
        tags: { ...tags, Environment: environmentSuffix, Region: 'primary' },
      },
      { parent: this, provider: primaryProvider }
    );

    const secondaryKmsKey = new aws.kms.Key(
      `kms-secondary-${environmentSuffix}`,
      {
        description: `KMS key for secondary region ${environmentSuffix}`,
        enableKeyRotation: true,
        tags: { ...tags, Environment: environmentSuffix, Region: 'secondary' },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Primary VPC
    const primaryVpc = new aws.ec2.Vpc(
      `vpc-primary-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `vpc-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Secondary VPC
    const secondaryVpc = new aws.ec2.Vpc(
      `vpc-secondary-${environmentSuffix}`,
      {
        cidrBlock: '10.1.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...tags,
          Name: `vpc-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Get availability zones
    const primaryAzs = aws.getAvailabilityZonesOutput(
      {},
      { provider: primaryProvider }
    );
    const secondaryAzs = aws.getAvailabilityZonesOutput(
      {},
      { provider: secondaryProvider }
    );

    // Primary private subnets (3 AZs)
    const primaryPrivateSubnets = [0, 1, 2].map(
      i =>
        new aws.ec2.Subnet(
          `subnet-primary-private-${i}-${environmentSuffix}`,
          {
            vpcId: primaryVpc.id,
            cidrBlock: `10.0.${i + 1}.0/24`,
            availabilityZone: primaryAzs.apply(azs => azs.names[i]),
            tags: {
              ...tags,
              Name: `subnet-primary-private-${i}-${environmentSuffix}`,
              Environment: environmentSuffix,
            },
          },
          { parent: this, provider: primaryProvider }
        )
    );

    // Primary public subnets for NAT and ALB
    const primaryPublicSubnets = [0, 1, 2].map(
      i =>
        new aws.ec2.Subnet(
          `subnet-primary-public-${i}-${environmentSuffix}`,
          {
            vpcId: primaryVpc.id,
            cidrBlock: `10.0.${i + 10}.0/24`,
            availabilityZone: primaryAzs.apply(azs => azs.names[i]),
            mapPublicIpOnLaunch: true,
            tags: {
              ...tags,
              Name: `subnet-primary-public-${i}-${environmentSuffix}`,
              Environment: environmentSuffix,
            },
          },
          { parent: this, provider: primaryProvider }
        )
    );

    // Secondary private subnets
    const secondaryPrivateSubnets = [0, 1, 2].map(
      i =>
        new aws.ec2.Subnet(
          `subnet-secondary-private-${i}-${environmentSuffix}`,
          {
            vpcId: secondaryVpc.id,
            cidrBlock: `10.1.${i + 1}.0/24`,
            availabilityZone: secondaryAzs.apply(azs => azs.names[i]),
            tags: {
              ...tags,
              Name: `subnet-secondary-private-${i}-${environmentSuffix}`,
              Environment: environmentSuffix,
            },
          },
          { parent: this, provider: secondaryProvider }
        )
    );

    // Secondary public subnets
    const secondaryPublicSubnets = [0, 1, 2].map(
      i =>
        new aws.ec2.Subnet(
          `subnet-secondary-public-${i}-${environmentSuffix}`,
          {
            vpcId: secondaryVpc.id,
            cidrBlock: `10.1.${i + 10}.0/24`,
            availabilityZone: secondaryAzs.apply(azs => azs.names[i]),
            mapPublicIpOnLaunch: true,
            tags: {
              ...tags,
              Name: `subnet-secondary-public-${i}-${environmentSuffix}`,
              Environment: environmentSuffix,
            },
          },
          { parent: this, provider: secondaryProvider }
        )
    );

    // Internet Gateways
    const primaryIgw = new aws.ec2.InternetGateway(
      `igw-primary-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        tags: {
          ...tags,
          Name: `igw-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    const secondaryIgw = new aws.ec2.InternetGateway(
      `igw-secondary-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        tags: {
          ...tags,
          Name: `igw-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Elastic IPs for NAT Gateways (only in primary for cost optimization)
    const primaryNatEip = new aws.ec2.Eip(
      `eip-primary-nat-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          ...tags,
          Name: `eip-primary-nat-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider, dependsOn: [primaryIgw] }
    );

    // NAT Gateway in primary region (single NAT for cost optimization)
    const primaryNatGateway = new aws.ec2.NatGateway(
      `nat-primary-${environmentSuffix}`,
      {
        allocationId: primaryNatEip.id,
        subnetId: primaryPublicSubnets[0].id,
        tags: {
          ...tags,
          Name: `nat-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Route tables for primary region
    const primaryPublicRouteTable = new aws.ec2.RouteTable(
      `rt-primary-public-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: primaryIgw.id,
          },
        ],
        tags: {
          ...tags,
          Name: `rt-primary-public-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    primaryPublicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `rta-primary-public-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: primaryPublicRouteTable.id,
        },
        { parent: this, provider: primaryProvider }
      );
    });

    const primaryPrivateRouteTable = new aws.ec2.RouteTable(
      `rt-primary-private-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: primaryNatGateway.id,
          },
        ],
        tags: {
          ...tags,
          Name: `rt-primary-private-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    primaryPrivateSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `rta-primary-private-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: primaryPrivateRouteTable.id,
        },
        { parent: this, provider: primaryProvider }
      );
    });

    // Route tables for secondary region
    const secondaryPublicRouteTable = new aws.ec2.RouteTable(
      `rt-secondary-public-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: secondaryIgw.id,
          },
        ],
        tags: {
          ...tags,
          Name: `rt-secondary-public-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    secondaryPublicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `rta-secondary-public-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: secondaryPublicRouteTable.id,
        },
        { parent: this, provider: secondaryProvider }
      );
    });

    // Security Groups
    const primaryAlbSg = new aws.ec2.SecurityGroup(
      `alb-primary-sg-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        description: 'Security group for primary ALB',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: {
          ...tags,
          Name: `alb-primary-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    const primaryAppSg = new aws.ec2.SecurityGroup(
      `app-primary-sg-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        description: 'Security group for primary application instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [primaryAlbSg.id],
          },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: {
          ...tags,
          Name: `app-primary-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    const primaryDbSg = new aws.ec2.SecurityGroup(
      `db-primary-sg-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        description: 'Security group for primary database',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [primaryAppSg.id],
          },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: {
          ...tags,
          Name: `db-primary-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    const secondaryAlbSg = new aws.ec2.SecurityGroup(
      `alb-secondary-sg-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        description: 'Security group for secondary ALB',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: {
          ...tags,
          Name: `alb-secondary-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    const secondaryAppSg = new aws.ec2.SecurityGroup(
      `app-secondary-sg-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        description: 'Security group for secondary application instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 8080,
            toPort: 8080,
            securityGroups: [secondaryAlbSg.id],
          },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: {
          ...tags,
          Name: `app-secondary-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    const secondaryDbSg = new aws.ec2.SecurityGroup(
      `db-secondary-sg-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        description: 'Security group for secondary database',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [secondaryAppSg.id],
          },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: {
          ...tags,
          Name: `db-secondary-sg-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // DB Subnet Groups
    const primaryDbSubnetGroup = new aws.rds.SubnetGroup(
      `dbsubnet-primary-${environmentSuffix}`,
      {
        subnetIds: primaryPrivateSubnets.map(s => s.id),
        tags: {
          ...tags,
          Name: `dbsubnet-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    const secondaryDbSubnetGroup = new aws.rds.SubnetGroup(
      `dbsubnet-secondary-${environmentSuffix}`,
      {
        subnetIds: secondaryPrivateSubnets.map(s => s.id),
        tags: {
          ...tags,
          Name: `dbsubnet-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Aurora Global Database Cluster
    const globalCluster = new aws.rds.GlobalCluster(
      `aurora-global-${environmentSuffix}`,
      {
        globalClusterIdentifier: `aurora-global-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        databaseName: 'tradingdb',
        storageEncrypted: true,
      },
      { parent: this }
    );

    // Primary Aurora Cluster
    const primaryCluster = new aws.rds.Cluster(
      `aurora-primary-${environmentSuffix}`,
      {
        clusterIdentifier: `aurora-primary-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        globalClusterIdentifier: globalCluster.id,
        masterUsername: 'dbadmin',
        masterPassword: dbPassword,
        dbSubnetGroupName: primaryDbSubnetGroup.name,
        vpcSecurityGroupIds: [primaryDbSg.id],
        storageEncrypted: true,
        kmsKeyId: primaryKmsKey.arn,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        skipFinalSnapshot: true,
        tags: {
          ...tags,
          Name: `aurora-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Primary cluster instances
    const primaryClusterInstance = new aws.rds.ClusterInstance(
      `aurora-primary-instance-${environmentSuffix}`,
      {
        identifier: `aurora-primary-instance-${environmentSuffix}`,
        clusterIdentifier: primaryCluster.id,
        instanceClass: 'db.r5.large',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        tags: {
          ...tags,
          Name: `aurora-primary-instance-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Secondary Aurora Cluster (read replica)
    const secondaryCluster = new aws.rds.Cluster(
      `aurora-secondary-${environmentSuffix}`,
      {
        clusterIdentifier: `aurora-secondary-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        globalClusterIdentifier: globalCluster.id,
        dbSubnetGroupName: secondaryDbSubnetGroup.name,
        vpcSecurityGroupIds: [secondaryDbSg.id],
        storageEncrypted: true,
        kmsKeyId: secondaryKmsKey.arn,
        skipFinalSnapshot: true,
        tags: {
          ...tags,
          Name: `aurora-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      {
        parent: this,
        provider: secondaryProvider,
        dependsOn: [primaryClusterInstance],
        ignoreChanges: ['globalClusterIdentifier'],
      }
    );

    // Secondary cluster instance (minimal for standby)
    const secondaryClusterInstance = new aws.rds.ClusterInstance(
      `aurora-secondary-instance-${environmentSuffix}`,
      {
        identifier: `aurora-secondary-instance-${environmentSuffix}`,
        clusterIdentifier: secondaryCluster.id,
        instanceClass: 'db.r5.large',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        tags: {
          ...tags,
          Name: `aurora-secondary-instance-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // SNS Topics for alerting
    const primarySnsTopic = new aws.sns.Topic(
      `sns-primary-${environmentSuffix}`,
      {
        name: `trading-alerts-primary-${environmentSuffix}`,
        tags: { ...tags, Environment: environmentSuffix },
      },
      { parent: this, provider: primaryProvider }
    );

    const secondarySnsTopic = new aws.sns.Topic(
      `sns-secondary-${environmentSuffix}`,
      {
        name: `trading-alerts-secondary-${environmentSuffix}`,
        tags: { ...tags, Environment: environmentSuffix },
      },
      { parent: this, provider: secondaryProvider }
    );

    // S3 bucket for artifacts with replication
    const primaryBucket = new aws.s3.Bucket(
      `bucket-primary-${environmentSuffix}`,
      {
        bucket: `trading-artifacts-primary-${environmentSuffix}`,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: primaryKmsKey.arn,
            },
          },
        },
        versioning: { enabled: true },
        forceDestroy: true,
        tags: { ...tags, Environment: environmentSuffix },
      },
      { parent: this, provider: primaryProvider }
    );

    const secondaryBucket = new aws.s3.Bucket(
      `bucket-secondary-${environmentSuffix}`,
      {
        bucket: `trading-artifacts-secondary-${environmentSuffix}`,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: secondaryKmsKey.arn,
            },
          },
        },
        versioning: { enabled: true },
        forceDestroy: true,
        tags: { ...tags, Environment: environmentSuffix },
      },
      { parent: this, provider: secondaryProvider }
    );

    // IAM role for replication
    const replicationRole = new aws.iam.Role(
      `s3-replication-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 's3.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: { ...tags, Environment: environmentSuffix },
      },
      { parent: this }
    );

    const replicationPolicy = new aws.iam.RolePolicy(
      `s3-replication-policy-${environmentSuffix}`,
      {
        role: replicationRole.id,
        policy: pulumi
          .all([primaryBucket.arn, secondaryBucket.arn])
          .apply(([src, dst]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
                  Resource: src,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObjectVersionForReplication',
                    's3:GetObjectVersionAcl',
                  ],
                  Resource: `${src}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['s3:ReplicateObject', 's3:ReplicateDelete'],
                  Resource: `${dst}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // S3 replication configuration
    const bucketReplication = new aws.s3.BucketReplicationConfig(
      `bucket-replication-${environmentSuffix}`,
      {
        role: replicationRole.arn,
        bucket: primaryBucket.id,
        rules: [
          {
            id: 'replicate-all',
            status: 'Enabled',
            sourceSelectionCriteria: {
              sseKmsEncryptedObjects: {
                status: 'Enabled',
              },
            },
            destination: {
              bucket: secondaryBucket.arn,
              encryptionConfiguration: {
                replicaKmsKeyId: secondaryKmsKey.arn,
              },
            },
          },
        ],
      },
      {
        parent: this,
        provider: primaryProvider,
        dependsOn: [replicationPolicy],
      }
    );

    // Lambda execution role
    const lambdaRole = new aws.iam.Role(
      `lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: { ...tags, Environment: environmentSuffix },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `lambda-basic-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    const lambdaRdsPolicy = new aws.iam.RolePolicy(
      `lambda-rds-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['rds:DescribeDBClusters', 'cloudwatch:PutMetricData'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Lambda function to monitor replication lag (using bundled AWS SDK v2)
    const monitorLambda = new aws.lambda.Function(
      `monitor-replication-${environmentSuffix}`,
      {
        name: `monitor-replication-${environmentSuffix}`,
        runtime: 'nodejs18.x',
        role: lambdaRole.arn,
        handler: 'index.handler',
        timeout: 30,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const rds = new AWS.RDS({ region: 'eu-central-1' });
const cloudwatch = new AWS.CloudWatch({ region: 'eu-central-1' });

exports.handler = async (event) => {
  try {
    const result = await rds.describeDBClusters({
      DBClusterIdentifier: process.env.PRIMARY_CLUSTER_ID
    }).promise();

    const cluster = result.DBClusters[0];
    const replicationLag = cluster.ReplicationSourceIdentifier ?
      (cluster.LatestRestorableTime ?
        (Date.now() - new Date(cluster.LatestRestorableTime).getTime()) / 1000 : 0) : 0;

    await cloudwatch.putMetricData({
      Namespace: 'TradingPlatform',
      MetricData: [{
        MetricName: 'ReplicationLag',
        Value: replicationLag,
        Unit: 'Seconds',
        Timestamp: new Date()
      }]
    }).promise();

    return { statusCode: 200, body: JSON.stringify({ replicationLag }) };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
        `),
        }),
        environment: {
          variables: {
            PRIMARY_CLUSTER_ID: primaryCluster.id,
          },
        },
        tags: { ...tags, Environment: environmentSuffix },
      },
      { parent: this, provider: primaryProvider }
    );

    // EventBridge rule to trigger Lambda every 1 minute
    const monitorRule = new aws.cloudwatch.EventRule(
      `monitor-rule-${environmentSuffix}`,
      {
        scheduleExpression: 'rate(1 minute)',
        tags: { ...tags, Environment: environmentSuffix },
      },
      { parent: this, provider: primaryProvider }
    );

    const monitorTarget = new aws.cloudwatch.EventTarget(
      `monitor-target-${environmentSuffix}`,
      {
        rule: monitorRule.name,
        arn: monitorLambda.arn,
      },
      { parent: this, provider: primaryProvider }
    );

    const monitorPermission = new aws.lambda.Permission(
      `monitor-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: monitorLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: monitorRule.arn,
      },
      { parent: this, provider: primaryProvider }
    );

    // CloudWatch Alarms
    const replicationLagAlarm = new aws.cloudwatch.MetricAlarm(
      `alarm-replication-lag-${environmentSuffix}`,
      {
        name: `replication-lag-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'ReplicationLag',
        namespace: 'TradingPlatform',
        period: 60,
        statistic: 'Average',
        threshold: 30,
        alarmDescription: 'Alert when replication lag exceeds 30 seconds',
        alarmActions: [primarySnsTopic.arn],
        tags: { ...tags, Environment: environmentSuffix },
      },
      { parent: this, provider: primaryProvider }
    );

    // Application Load Balancer - Primary
    const primaryAlb = new aws.lb.LoadBalancer(
      `alb-primary-${environmentSuffix}`,
      {
        name: `alb-primary-${environmentSuffix}`,
        loadBalancerType: 'application',
        subnets: primaryPublicSubnets.map(s => s.id),
        securityGroups: [primaryAlbSg.id],
        tags: {
          ...tags,
          Name: `alb-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    const primaryTargetGroup = new aws.lb.TargetGroup(
      `tg-primary-${environmentSuffix}`,
      {
        name: `tg-primary-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        vpcId: primaryVpc.id,
        healthCheck: {
          enabled: true,
          path: '/health',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        tags: { ...tags, Environment: environmentSuffix },
      },
      { parent: this, provider: primaryProvider }
    );

    const primaryListener = new aws.lb.Listener(
      `listener-primary-${environmentSuffix}`,
      {
        loadBalancerArn: primaryAlb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: primaryTargetGroup.arn,
          },
        ],
      },
      { parent: this, provider: primaryProvider }
    );

    // Application Load Balancer - Secondary
    const secondaryAlb = new aws.lb.LoadBalancer(
      `alb-secondary-${environmentSuffix}`,
      {
        name: `alb-secondary-${environmentSuffix}`,
        loadBalancerType: 'application',
        subnets: secondaryPublicSubnets.map(s => s.id),
        securityGroups: [secondaryAlbSg.id],
        tags: {
          ...tags,
          Name: `alb-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    const secondaryTargetGroup = new aws.lb.TargetGroup(
      `tg-secondary-${environmentSuffix}`,
      {
        name: `tg-secondary-${environmentSuffix}`,
        port: 8080,
        protocol: 'HTTP',
        vpcId: secondaryVpc.id,
        healthCheck: {
          enabled: true,
          path: '/health',
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        tags: { ...tags, Environment: environmentSuffix },
      },
      { parent: this, provider: secondaryProvider }
    );

    const secondaryListener = new aws.lb.Listener(
      `listener-secondary-${environmentSuffix}`,
      {
        loadBalancerArn: secondaryAlb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: secondaryTargetGroup.arn,
          },
        ],
      },
      { parent: this, provider: secondaryProvider }
    );

    // Get latest Amazon Linux 2 AMI
    const primaryAmi = aws.ec2.getAmiOutput(
      {
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
          { name: 'virtualization-type', values: ['hvm'] },
        ],
      },
      { provider: primaryProvider }
    );

    const secondaryAmi = aws.ec2.getAmiOutput(
      {
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
          { name: 'virtualization-type', values: ['hvm'] },
        ],
      },
      { provider: secondaryProvider }
    );

    // Launch Template - Primary
    const primaryLaunchTemplate = new aws.ec2.LaunchTemplate(
      `lt-primary-${environmentSuffix}`,
      {
        namePrefix: `lt-primary-${environmentSuffix}`,
        imageId: primaryAmi.apply(ami => ami.id),
        instanceType: 't3.medium',
        vpcSecurityGroupIds: [primaryAppSg.id],
        userData: Buffer.from(
          `#!/bin/bash
echo "Starting trading application..." > /var/log/user-data.log
# Application startup script would go here
`
        ).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...tags,
              Name: `app-primary-${environmentSuffix}`,
              Environment: environmentSuffix,
            },
          },
        ],
      },
      { parent: this, provider: primaryProvider }
    );

    // Auto Scaling Group - Primary
    const primaryAsg = new aws.autoscaling.Group(
      `asg-primary-${environmentSuffix}`,
      {
        name: `asg-primary-${environmentSuffix}`,
        vpcZoneIdentifiers: primaryPrivateSubnets.map(s => s.id),
        minSize: 2,
        maxSize: 10,
        desiredCapacity: 2,
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        targetGroupArns: [primaryTargetGroup.arn],
        launchTemplate: {
          id: primaryLaunchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `asg-primary-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: environmentSuffix,
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this, provider: primaryProvider }
    );

    // Auto Scaling Policies - Primary
    const primaryScaleUpPolicy = new aws.autoscaling.Policy(
      `policy-primary-scaleup-${environmentSuffix}`,
      {
        name: `policy-primary-scaleup-${environmentSuffix}`,
        autoscalingGroupName: primaryAsg.name,
        adjustmentType: 'ChangeInCapacity',
        scalingAdjustment: 2,
        cooldown: 300,
      },
      { parent: this, provider: primaryProvider }
    );

    // Launch Template - Secondary (minimal)
    const secondaryLaunchTemplate = new aws.ec2.LaunchTemplate(
      `lt-secondary-${environmentSuffix}`,
      {
        namePrefix: `lt-secondary-${environmentSuffix}`,
        imageId: secondaryAmi.apply(ami => ami.id),
        instanceType: 't3.small',
        vpcSecurityGroupIds: [secondaryAppSg.id],
        userData: Buffer.from(
          `#!/bin/bash
echo "Starting standby trading application..." > /var/log/user-data.log
# Application startup script would go here
`
        ).toString('base64'),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              ...tags,
              Name: `app-secondary-${environmentSuffix}`,
              Environment: environmentSuffix,
            },
          },
        ],
      },
      { parent: this, provider: secondaryProvider }
    );

    // Auto Scaling Group - Secondary (minimal capacity)
    const secondaryAsg = new aws.autoscaling.Group(
      `asg-secondary-${environmentSuffix}`,
      {
        name: `asg-secondary-${environmentSuffix}`,
        vpcZoneIdentifiers: secondaryPrivateSubnets.map(s => s.id),
        minSize: 1,
        maxSize: 10,
        desiredCapacity: 1,
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        targetGroupArns: [secondaryTargetGroup.arn],
        launchTemplate: {
          id: secondaryLaunchTemplate.id,
          version: '$Latest',
        },
        tags: [
          {
            key: 'Name',
            value: `asg-secondary-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: environmentSuffix,
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this, provider: secondaryProvider }
    );

    // Auto Scaling Policy - Secondary (rapid scale-up on failover)
    const secondaryScaleUpPolicy = new aws.autoscaling.Policy(
      `policy-secondary-scaleup-${environmentSuffix}`,
      {
        name: `policy-secondary-scaleup-${environmentSuffix}`,
        autoscalingGroupName: secondaryAsg.name,
        adjustmentType: 'PercentChangeInCapacity',
        scalingAdjustment: 200,
        cooldown: 60,
      },
      { parent: this, provider: secondaryProvider }
    );

    // Route53 Health Checks
    const primaryHealthCheck = new aws.route53.HealthCheck(
      `healthcheck-primary-${environmentSuffix}`,
      {
        type: 'HTTP',
        resourcePath: '/health',
        fqdn: primaryAlb.dnsName,
        port: 80,
        requestInterval: 30,
        failureThreshold: 3,
        tags: {
          ...tags,
          Name: `healthcheck-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    const secondaryHealthCheck = new aws.route53.HealthCheck(
      `healthcheck-secondary-${environmentSuffix}`,
      {
        type: 'HTTP',
        resourcePath: '/health',
        fqdn: secondaryAlb.dnsName,
        port: 80,
        requestInterval: 30,
        failureThreshold: 3,
        tags: {
          ...tags,
          Name: `healthcheck-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { parent: this }
    );

    // Route53 Hosted Zone (simulated - would need actual domain)
    const hostedZone = new aws.route53.Zone(
      `zone-${environmentSuffix}`,
      {
        name: `trading-platform-${environmentSuffix}.internal`,
        tags: { ...tags, Environment: environmentSuffix },
      },
      { parent: this }
    );

    // Route53 Records with Failover
    const primaryRecord = new aws.route53.Record(
      `record-primary-${environmentSuffix}`,
      {
        zoneId: hostedZone.zoneId,
        name: `api.trading-platform-${environmentSuffix}.internal`,
        type: 'A',
        setIdentifier: 'primary',
        failoverRoutingPolicies: [{ type: 'PRIMARY' }],
        healthCheckId: primaryHealthCheck.id,
        aliases: [
          {
            name: primaryAlb.dnsName,
            zoneId: primaryAlb.zoneId,
            evaluateTargetHealth: true,
          },
        ],
      },
      { parent: this }
    );

    const secondaryRecord = new aws.route53.Record(
      `record-secondary-${environmentSuffix}`,
      {
        zoneId: hostedZone.zoneId,
        name: `api.trading-platform-${environmentSuffix}.internal`,
        type: 'A',
        setIdentifier: 'secondary',
        failoverRoutingPolicies: [{ type: 'SECONDARY' }],
        healthCheckId: secondaryHealthCheck.id,
        aliases: [
          {
            name: secondaryAlb.dnsName,
            zoneId: secondaryAlb.zoneId,
            evaluateTargetHealth: true,
          },
        ],
      },
      { parent: this }
    );

    // CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `dashboard-${environmentSuffix}`,
      {
        dashboardName: `trading-platform-${environmentSuffix}`,
        dashboardBody: pulumi.jsonStringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [['TradingPlatform', 'ReplicationLag']],
                period: 60,
                stat: 'Average',
                region: 'us-east-1',
                title: 'Database Replication Lag',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  [
                    'AWS/ApplicationELB',
                    'HealthyHostCount',
                    { stat: 'Average' },
                  ],
                  ['.', 'UnHealthyHostCount', { stat: 'Average' }],
                ],
                period: 60,
                stat: 'Average',
                region: 'us-east-1',
                title: 'Primary ALB Health',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['AWS/RDS', 'CPUUtilization', { stat: 'Average' }],
                  ['.', 'DatabaseConnections', { stat: 'Sum' }],
                ],
                period: 60,
                stat: 'Average',
                region: 'us-east-1',
                title: 'Primary Database Metrics',
              },
            },
          ],
        }),
      },
      { parent: this, provider: primaryProvider }
    );

    // Export outputs
    this.primaryEndpoint = primaryAlb.dnsName;
    this.secondaryEndpoint = secondaryAlb.dnsName;
    this.healthCheckUrl = pulumi.interpolate`http://${primaryAlb.dnsName}/health`;
    this.dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=eu-central-1#dashboards:name=${dashboard.dashboardName}`;

    // Resources are created for their side effects (infrastructure deployment)
    void secondaryClusterInstance;
    void bucketReplication;
    void lambdaRdsPolicy;
    void monitorTarget;
    void monitorPermission;
    void replicationLagAlarm;
    void primaryListener;
    void secondaryListener;
    void primaryScaleUpPolicy;
    void secondaryScaleUpPolicy;
    void primaryRecord;
    void secondaryRecord;

    this.registerOutputs({
      primaryEndpoint: this.primaryEndpoint,
      secondaryEndpoint: this.secondaryEndpoint,
      healthCheckUrl: this.healthCheckUrl,
      dashboardUrl: this.dashboardUrl,
      primaryClusterId: primaryCluster.id,
      secondaryClusterId: secondaryCluster.id,
      primaryBucketName: primaryBucket.id,
      secondaryBucketName: secondaryBucket.id,
      route53ZoneId: hostedZone.zoneId,
      primarySnsTopicArn: primarySnsTopic.arn,
      secondarySnsTopicArn: secondarySnsTopic.arn,
    });
  }
}
