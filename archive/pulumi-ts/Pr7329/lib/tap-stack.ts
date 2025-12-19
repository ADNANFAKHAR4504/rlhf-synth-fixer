/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Multi-Region Disaster Recovery Infrastructure for Financial Transaction System
 *
 * This stack implements a complete multi-region DR architecture with:
 * - Aurora PostgreSQL Global Database (us-east-1 primary, us-west-2 secondary)
 * - Route53 health checks and failover routing
 * - Lambda-based replication lag monitoring
 * - Cross-region VPC peering
 * - CloudWatch alarms and monitoring
 * - IAM roles for DR operations
 *
 * All resources are tagged with Environment=production and DR-Role=primary/secondary
 */

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * Configuration arguments for the TapStack
 */
export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Main infrastructure stack for multi-region disaster recovery
 */
export class TapStack extends pulumi.ComponentResource {
  // Expose key outputs for integration testing
  public readonly primaryVpcId: pulumi.Output<string>;
  public readonly secondaryVpcId: pulumi.Output<string>;
  public readonly globalClusterId: pulumi.Output<string>;
  public readonly primaryClusterId: pulumi.Output<string>;
  public readonly secondaryClusterId: pulumi.Output<string>;
  public readonly primaryClusterEndpoint: pulumi.Output<string>;
  public readonly secondaryClusterEndpoint: pulumi.Output<string>;
  public readonly hostedZoneId: pulumi.Output<string>;
  public readonly healthCheckId: pulumi.Output<string>;
  public readonly primaryMonitorFunctionArn: pulumi.Output<string>;
  public readonly secondaryMonitorFunctionArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const defaultTags = args.tags || {};

    // ==================== REGION CONFIGURATION ====================
    const primaryRegion = 'us-east-1';
    const secondaryRegion = 'us-west-2';

    // Create providers for both regions
    const primaryProvider = new aws.Provider(
      `primary-provider-${environmentSuffix}`,
      {
        region: primaryRegion,
        defaultTags: { tags: defaultTags },
      },
      { parent: this }
    );

    const secondaryProvider = new aws.Provider(
      `secondary-provider-${environmentSuffix}`,
      {
        region: secondaryRegion,
        defaultTags: { tags: defaultTags },
      },
      { parent: this }
    );

    // ==================== PRIMARY REGION VPC (us-east-1) ====================
    const primaryVpc = new aws.ec2.Vpc(
      `primary-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...defaultTags,
          Name: `primary-vpc-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Create 3 private subnets in primary region (different AZs)
    const primarySubnets = [
      new aws.ec2.Subnet(
        `primary-subnet-1-${environmentSuffix}`,
        {
          vpcId: primaryVpc.id,
          cidrBlock: '10.0.1.0/24',
          availabilityZone: 'us-east-1a',
          tags: {
            ...defaultTags,
            Name: `primary-subnet-1-${environmentSuffix}`,
            Environment: 'production',
            'DR-Role': 'primary',
          },
        },
        { parent: this, provider: primaryProvider }
      ),

      new aws.ec2.Subnet(
        `primary-subnet-2-${environmentSuffix}`,
        {
          vpcId: primaryVpc.id,
          cidrBlock: '10.0.2.0/24',
          availabilityZone: 'us-east-1b',
          tags: {
            ...defaultTags,
            Name: `primary-subnet-2-${environmentSuffix}`,
            Environment: 'production',
            'DR-Role': 'primary',
          },
        },
        { parent: this, provider: primaryProvider }
      ),

      new aws.ec2.Subnet(
        `primary-subnet-3-${environmentSuffix}`,
        {
          vpcId: primaryVpc.id,
          cidrBlock: '10.0.3.0/24',
          availabilityZone: 'us-east-1c',
          tags: {
            ...defaultTags,
            Name: `primary-subnet-3-${environmentSuffix}`,
            Environment: 'production',
            'DR-Role': 'primary',
          },
        },
        { parent: this, provider: primaryProvider }
      ),
    ];

    // DB Subnet Group for primary region
    const primaryDbSubnetGroup = new aws.rds.SubnetGroup(
      `primary-db-subnet-group-${environmentSuffix}`,
      {
        name: `primary-db-subnet-group-${environmentSuffix}`,
        subnetIds: primarySubnets.map(s => s.id),
        tags: {
          ...defaultTags,
          Name: `primary-db-subnet-group-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Security Group for Aurora in primary region
    const primaryDbSecurityGroup = new aws.ec2.SecurityGroup(
      `primary-db-sg-${environmentSuffix}`,
      {
        name: `primary-db-sg-${environmentSuffix}`,
        description:
          'Security group for Aurora PostgreSQL Global Database - Primary Region',
        vpcId: primaryVpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16', '10.1.0.0/16'], // Allow from both VPCs
            description: 'PostgreSQL access from primary and secondary VPCs',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...defaultTags,
          Name: `primary-db-sg-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // ==================== SECONDARY REGION VPC (us-west-2) ====================
    const secondaryVpc = new aws.ec2.Vpc(
      `secondary-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.1.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...defaultTags,
          Name: `secondary-vpc-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'secondary',
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Create 3 private subnets in secondary region (different AZs)
    const secondarySubnets = [
      new aws.ec2.Subnet(
        `secondary-subnet-1-${environmentSuffix}`,
        {
          vpcId: secondaryVpc.id,
          cidrBlock: '10.1.1.0/24',
          availabilityZone: 'us-west-2a',
          tags: {
            ...defaultTags,
            Name: `secondary-subnet-1-${environmentSuffix}`,
            Environment: 'production',
            'DR-Role': 'secondary',
          },
        },
        { parent: this, provider: secondaryProvider }
      ),

      new aws.ec2.Subnet(
        `secondary-subnet-2-${environmentSuffix}`,
        {
          vpcId: secondaryVpc.id,
          cidrBlock: '10.1.2.0/24',
          availabilityZone: 'us-west-2b',
          tags: {
            ...defaultTags,
            Name: `secondary-subnet-2-${environmentSuffix}`,
            Environment: 'production',
            'DR-Role': 'secondary',
          },
        },
        { parent: this, provider: secondaryProvider }
      ),

      new aws.ec2.Subnet(
        `secondary-subnet-3-${environmentSuffix}`,
        {
          vpcId: secondaryVpc.id,
          cidrBlock: '10.1.3.0/24',
          availabilityZone: 'us-west-2c',
          tags: {
            ...defaultTags,
            Name: `secondary-subnet-3-${environmentSuffix}`,
            Environment: 'production',
            'DR-Role': 'secondary',
          },
        },
        { parent: this, provider: secondaryProvider }
      ),
    ];

    // DB Subnet Group for secondary region
    const secondaryDbSubnetGroup = new aws.rds.SubnetGroup(
      `secondary-db-subnet-group-${environmentSuffix}`,
      {
        name: `secondary-db-subnet-group-${environmentSuffix}`,
        subnetIds: secondarySubnets.map(s => s.id),
        tags: {
          ...defaultTags,
          Name: `secondary-db-subnet-group-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'secondary',
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Security Group for Aurora in secondary region
    const secondaryDbSecurityGroup = new aws.ec2.SecurityGroup(
      `secondary-db-sg-${environmentSuffix}`,
      {
        name: `secondary-db-sg-${environmentSuffix}`,
        description:
          'Security group for Aurora PostgreSQL Global Database - Secondary Region',
        vpcId: secondaryVpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            cidrBlocks: ['10.0.0.0/16', '10.1.0.0/16'], // Allow from both VPCs
            description: 'PostgreSQL access from primary and secondary VPCs',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...defaultTags,
          Name: `secondary-db-sg-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'secondary',
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // ==================== VPC PEERING ====================
    // Create VPC peering connection from primary to secondary
    const vpcPeeringConnection = new aws.ec2.VpcPeeringConnection(
      `vpc-peering-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        peerVpcId: secondaryVpc.id,
        peerRegion: secondaryRegion,
        autoAccept: false,
        tags: {
          ...defaultTags,
          Name: `vpc-peering-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Accept the peering connection in the secondary region
    const vpcPeeringConnectionAccepter =
      new aws.ec2.VpcPeeringConnectionAccepter(
        `vpc-peering-accepter-${environmentSuffix}`,
        {
          vpcPeeringConnectionId: vpcPeeringConnection.id,
          autoAccept: true,
          tags: {
            ...defaultTags,
            Name: `vpc-peering-accepter-${environmentSuffix}`,
            Environment: 'production',
            'DR-Role': 'secondary',
          },
        },
        { parent: this, provider: secondaryProvider }
      );

    // Route tables for primary VPC
    const primaryRouteTable = new aws.ec2.RouteTable(
      `primary-route-table-${environmentSuffix}`,
      {
        vpcId: primaryVpc.id,
        tags: {
          ...defaultTags,
          Name: `primary-route-table-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Add route to secondary VPC via peering
    const _primaryPeeringRoute = new aws.ec2.Route(
      `primary-peering-route-${environmentSuffix}`,
      {
        routeTableId: primaryRouteTable.id,
        destinationCidrBlock: '10.1.0.0/16',
        vpcPeeringConnectionId: vpcPeeringConnection.id,
      },
      {
        parent: this,
        provider: primaryProvider,
        dependsOn: [vpcPeeringConnectionAccepter],
      }
    );

    // Route tables for secondary VPC
    const secondaryRouteTable = new aws.ec2.RouteTable(
      `secondary-route-table-${environmentSuffix}`,
      {
        vpcId: secondaryVpc.id,
        tags: {
          ...defaultTags,
          Name: `secondary-route-table-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'secondary',
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Add route to primary VPC via peering
    const _secondaryPeeringRoute = new aws.ec2.Route(
      `secondary-peering-route-${environmentSuffix}`,
      {
        routeTableId: secondaryRouteTable.id,
        destinationCidrBlock: '10.0.0.0/16',
        vpcPeeringConnectionId: vpcPeeringConnection.id,
      },
      {
        parent: this,
        provider: secondaryProvider,
        dependsOn: [vpcPeeringConnectionAccepter],
      }
    );

    // Associate route tables with subnets
    primarySubnets.forEach((subnet, idx) => {
      new aws.ec2.RouteTableAssociation(
        `primary-rt-assoc-${idx}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: primaryRouteTable.id,
        },
        { parent: this, provider: primaryProvider }
      );
    });

    secondarySubnets.forEach((subnet, idx) => {
      new aws.ec2.RouteTableAssociation(
        `secondary-rt-assoc-${idx}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: secondaryRouteTable.id,
        },
        { parent: this, provider: secondaryProvider }
      );
    });

    // ==================== KMS ENCRYPTION KEYS ====================
    // KMS key for primary region
    const primaryKmsKey = new aws.kms.Key(
      `primary-aurora-kms-${environmentSuffix}`,
      {
        description:
          'KMS key for Aurora PostgreSQL Global Database encryption - Primary Region',
        deletionWindowInDays: 7,
        enableKeyRotation: true,
        tags: {
          ...defaultTags,
          Name: `primary-aurora-kms-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      { parent: this, provider: primaryProvider }
    );

    const _primaryKmsKeyAlias = new aws.kms.Alias(
      `primary-aurora-kms-alias-${environmentSuffix}`,
      {
        name: `alias/primary-aurora-${environmentSuffix}`,
        targetKeyId: primaryKmsKey.id,
      },
      { parent: this, provider: primaryProvider }
    );

    // KMS key for secondary region
    const secondaryKmsKey = new aws.kms.Key(
      `secondary-aurora-kms-${environmentSuffix}`,
      {
        description:
          'KMS key for Aurora PostgreSQL Global Database encryption - Secondary Region',
        deletionWindowInDays: 7,
        enableKeyRotation: true,
        tags: {
          ...defaultTags,
          Name: `secondary-aurora-kms-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'secondary',
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    const _secondaryKmsKeyAlias = new aws.kms.Alias(
      `secondary-aurora-kms-alias-${environmentSuffix}`,
      {
        name: `alias/secondary-aurora-${environmentSuffix}`,
        targetKeyId: secondaryKmsKey.id,
      },
      { parent: this, provider: secondaryProvider }
    );

    // ==================== AURORA GLOBAL DATABASE ====================
    // Create Global Database
    const globalCluster = new aws.rds.GlobalCluster(
      `aurora-global-${environmentSuffix}`,
      {
        globalClusterIdentifier: `aurora-global-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        databaseName: 'transactions',
        storageEncrypted: true,
        deletionProtection: false, // Required for destroyability
      },
      { parent: this, provider: primaryProvider }
    );

    // Create primary Aurora cluster
    const primaryCluster = new aws.rds.Cluster(
      `primary-aurora-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `primary-aurora-cluster-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        databaseName: 'transactions',
        masterUsername: 'dbadmin',
        masterPassword: pulumi.secret('TempPassword123!'), // In production, use Secrets Manager
        globalClusterIdentifier: globalCluster.id,
        dbSubnetGroupName: primaryDbSubnetGroup.name,
        vpcSecurityGroupIds: [primaryDbSecurityGroup.id],
        kmsKeyId: primaryKmsKey.arn,
        storageEncrypted: true,
        backupRetentionPeriod: 7,
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        enabledCloudwatchLogsExports: ['postgresql'],
        skipFinalSnapshot: true, // Required for destroyability
        finalSnapshotIdentifier: undefined, // Explicitly no final snapshot
        deletionProtection: false, // Required for destroyability
        tags: {
          ...defaultTags,
          Name: `primary-aurora-cluster-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      {
        parent: this,
        provider: primaryProvider,
        replaceOnChanges: ['globalClusterIdentifier'],
        deleteBeforeReplace: true,
        dependsOn: [
          globalCluster,
          primaryDbSubnetGroup,
          primaryDbSecurityGroup,
          primaryKmsKey,
        ],
      }
    );

    // Create primary Aurora cluster instances
    const primaryClusterInstance1 = new aws.rds.ClusterInstance(
      `primary-aurora-instance-1-${environmentSuffix}`,
      {
        identifier: `primary-aurora-instance-1-${environmentSuffix}`,
        clusterIdentifier: primaryCluster.id,
        instanceClass: 'db.r5.large',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        publiclyAccessible: false,
        tags: {
          ...defaultTags,
          Name: `primary-aurora-instance-1-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      { parent: this, provider: primaryProvider, dependsOn: [primaryCluster] }
    );

    const _primaryClusterInstance2 = new aws.rds.ClusterInstance(
      `primary-aurora-instance-2-${environmentSuffix}`,
      {
        identifier: `primary-aurora-instance-2-${environmentSuffix}`,
        clusterIdentifier: primaryCluster.id,
        instanceClass: 'db.r5.large',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        publiclyAccessible: false,
        tags: {
          ...defaultTags,
          Name: `primary-aurora-instance-2-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      { parent: this, provider: primaryProvider, dependsOn: [primaryCluster] }
    );

    // Create secondary Aurora cluster (attached to global database)
    const secondaryCluster = new aws.rds.Cluster(
      `secondary-aurora-cluster-${environmentSuffix}`,
      {
        clusterIdentifier: `secondary-aurora-cluster-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        globalClusterIdentifier: globalCluster.id,
        dbSubnetGroupName: secondaryDbSubnetGroup.name,
        vpcSecurityGroupIds: [secondaryDbSecurityGroup.id],
        kmsKeyId: secondaryKmsKey.arn,
        storageEncrypted: true,
        skipFinalSnapshot: true, // Required for destroyability
        finalSnapshotIdentifier: undefined, // Explicitly no final snapshot
        deletionProtection: false, // Required for destroyability
        tags: {
          ...defaultTags,
          Name: `secondary-aurora-cluster-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'secondary',
        },
      },
      {
        parent: this,
        provider: secondaryProvider,
        replaceOnChanges: ['globalClusterIdentifier'],
        deleteBeforeReplace: true,
        dependsOn: [
          globalCluster,
          primaryCluster,
          primaryClusterInstance1,
          secondaryDbSubnetGroup,
          secondaryDbSecurityGroup,
          secondaryKmsKey,
        ],
      }
    );

    // Create secondary Aurora cluster instances
    const _secondaryClusterInstance1 = new aws.rds.ClusterInstance(
      `secondary-aurora-instance-1-${environmentSuffix}`,
      {
        identifier: `secondary-aurora-instance-1-${environmentSuffix}`,
        clusterIdentifier: secondaryCluster.id,
        instanceClass: 'db.r5.large',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        publiclyAccessible: false,
        tags: {
          ...defaultTags,
          Name: `secondary-aurora-instance-1-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'secondary',
        },
      },
      {
        parent: this,
        provider: secondaryProvider,
        dependsOn: [secondaryCluster],
      }
    );

    const _secondaryClusterInstance2 = new aws.rds.ClusterInstance(
      `secondary-aurora-instance-2-${environmentSuffix}`,
      {
        identifier: `secondary-aurora-instance-2-${environmentSuffix}`,
        clusterIdentifier: secondaryCluster.id,
        instanceClass: 'db.r5.large',
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        publiclyAccessible: false,
        tags: {
          ...defaultTags,
          Name: `secondary-aurora-instance-2-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'secondary',
        },
      },
      {
        parent: this,
        provider: secondaryProvider,
        dependsOn: [secondaryCluster],
      }
    );

    // ==================== IAM ROLES FOR LAMBDA ====================
    // IAM Role for Lambda monitoring functions
    const lambdaRole = new aws.iam.Role(
      `lambda-monitor-role-${environmentSuffix}`,
      {
        name: `lambda-monitor-role-${environmentSuffix}`,
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
        tags: {
          ...defaultTags,
          Name: `lambda-monitor-role-${environmentSuffix}`,
          Environment: 'production',
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Attach basic Lambda execution policy
    const lambdaBasicExecution = new aws.iam.RolePolicyAttachment(
      `lambda-basic-execution-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this, provider: primaryProvider }
    );

    // Custom policy for RDS monitoring
    const lambdaRdsPolicy = new aws.iam.RolePolicy(
      `lambda-rds-policy-${environmentSuffix}`,
      {
        name: `lambda-rds-policy-${environmentSuffix}`,
        role: lambdaRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'rds:DescribeDBClusters',
                'rds:DescribeGlobalClusters',
                'rds:DescribeDBClusterEndpoints',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['cloudwatch:PutMetricData'],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['sns:Publish'],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this, provider: primaryProvider }
    );

    // IAM Role for DR operations
    // Get the AWS account ID properly
    const callerIdentity = pulumi.output(aws.getCallerIdentity());
    const accountId = callerIdentity.accountId;

    const drOperationsRole = new aws.iam.Role(
      `dr-operations-role-${environmentSuffix}`,
      {
        name: `dr-operations-role-${environmentSuffix}`,
        assumeRolePolicy: pulumi.all([accountId]).apply((values: string[]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { Service: 'lambda.amazonaws.com' },
                Action: 'sts:AssumeRole',
              },
              {
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${values[0]}:root`,
                },
                Action: 'sts:AssumeRole',
                Condition: {
                  StringEquals: {
                    'sts:ExternalId': `dr-ops-${environmentSuffix}`,
                  },
                },
              },
            ],
          })
        ),
        tags: {
          ...defaultTags,
          Name: `dr-operations-role-${environmentSuffix}`,
          Environment: 'production',
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Policy for DR operations
    const _drOperationsPolicy = new aws.iam.RolePolicy(
      `dr-operations-policy-${environmentSuffix}`,
      {
        name: `dr-operations-policy-${environmentSuffix}`,
        role: drOperationsRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'rds:FailoverGlobalCluster',
                'rds:RemoveFromGlobalCluster',
                'rds:ModifyDBCluster',
                'rds:DescribeDBClusters',
                'rds:DescribeGlobalClusters',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'route53:ChangeResourceRecordSets',
                'route53:GetHealthCheckStatus',
                'route53:UpdateHealthCheck',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this, provider: primaryProvider }
    );

    // ==================== SNS TOPICS FOR ALERTS ====================
    // SNS Topic for primary region alerts
    const primaryAlertTopic = new aws.sns.Topic(
      `primary-alert-topic-${environmentSuffix}`,
      {
        name: `primary-alert-topic-${environmentSuffix}`,
        tags: {
          ...defaultTags,
          Name: `primary-alert-topic-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // SNS Topic for secondary region alerts
    const secondaryAlertTopic = new aws.sns.Topic(
      `secondary-alert-topic-${environmentSuffix}`,
      {
        name: `secondary-alert-topic-${environmentSuffix}`,
        tags: {
          ...defaultTags,
          Name: `secondary-alert-topic-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'secondary',
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // ==================== LAMBDA MONITORING FUNCTIONS ====================
    // Lambda function code for replication lag monitoring
    const lambdaCode = `
import json
import boto3
import os

rds = boto3.client('rds')
cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')

CLUSTER_ID = os.environ['CLUSTER_ID']
GLOBAL_CLUSTER_ID = os.environ['GLOBAL_CLUSTER_ID']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
REGION = os.environ['AWS_REGION']
LAG_THRESHOLD = 5.0  # 5 seconds

def lambda_handler(event, context):
    try:
        # Get global cluster details
        response = rds.describe_global_clusters(
            GlobalClusterIdentifier=GLOBAL_CLUSTER_ID
        )

        if not response['GlobalClusters']:
            return {
                'statusCode': 404,
                'body': json.dumps('Global cluster not found')
            }

        global_cluster = response['GlobalClusters'][0]
        replication_lag = 0.0

        # Find replication lag for our cluster
        for member in global_cluster.get('GlobalClusterMembers', []):
            if member['DBClusterArn'].endswith(CLUSTER_ID):
                # For secondary regions, check replication lag
                if not member.get('IsWriter', False):
                    # Secondary cluster - check lag
                    cluster_response = rds.describe_db_clusters(
                        DBClusterIdentifier=CLUSTER_ID
                    )
                    if cluster_response['DBClusters']:
                        cluster = cluster_response['DBClusters'][0]
                        # Replication lag in milliseconds, convert to seconds
                        replication_lag = cluster.get('ReplicationLag', 0) / 1000.0

        # Publish custom metric to CloudWatch
        cloudwatch.put_metric_data(
            Namespace='Aurora/GlobalDatabase',
            MetricData=[
                {
                    'MetricName': 'ReplicationLag',
                    'Value': replication_lag,
                    'Unit': 'Seconds',
                    'Dimensions': [
                        {
                            'Name': 'GlobalCluster',
                            'Value': GLOBAL_CLUSTER_ID
                        },
                        {
                            'Name': 'Region',
                            'Value': REGION
                        }
                    ]
                }
            ]
        )

        # Check if lag exceeds threshold
        if replication_lag > LAG_THRESHOLD:
            message = f"ALERT: Replication lag ({replication_lag:.2f}s) exceeds threshold ({LAG_THRESHOLD}s) for cluster {CLUSTER_ID} in {REGION}"
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f'Aurora Replication Lag Alert - {REGION}',
                Message=message
            )
            print(message)
        else:
            print(f"Replication lag: {replication_lag:.2f}s (within threshold)")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'cluster': CLUSTER_ID,
                'region': REGION,
                'replication_lag_seconds': replication_lag,
                'threshold_seconds': LAG_THRESHOLD,
                'status': 'ALERT' if replication_lag > LAG_THRESHOLD else 'OK'
            })
        }

    except Exception as e:
        error_message = f"Error monitoring replication lag: {str(e)}"
        print(error_message)
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'Aurora Monitoring Error - {REGION}',
            Message=error_message
        )
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
`;

    // Create Lambda function in primary region
    const primaryMonitorFunction = new aws.lambda.Function(
      `primary-monitor-function-${environmentSuffix}`,
      {
        name: `primary-monitor-function-${environmentSuffix}`,
        runtime: 'python3.11',
        handler: 'index.lambda_handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.py': new pulumi.asset.StringAsset(lambdaCode),
        }),
        timeout: 60,
        reservedConcurrentExecutions: 5,
        environment: {
          variables: {
            CLUSTER_ID: primaryCluster.clusterIdentifier,
            GLOBAL_CLUSTER_ID: globalCluster.globalClusterIdentifier,
            SNS_TOPIC_ARN: primaryAlertTopic.arn,
          },
        },
        tags: {
          ...defaultTags,
          Name: `primary-monitor-function-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      {
        parent: this,
        provider: primaryProvider,
        dependsOn: [lambdaRole, lambdaBasicExecution, lambdaRdsPolicy],
      }
    );

    // Create Lambda function in secondary region
    const secondaryMonitorFunction = new aws.lambda.Function(
      `secondary-monitor-function-${environmentSuffix}`,
      {
        name: `secondary-monitor-function-${environmentSuffix}`,
        runtime: 'python3.11',
        handler: 'index.lambda_handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.py': new pulumi.asset.StringAsset(lambdaCode),
        }),
        timeout: 60,
        reservedConcurrentExecutions: 5,
        environment: {
          variables: {
            CLUSTER_ID: secondaryCluster.clusterIdentifier,
            GLOBAL_CLUSTER_ID: globalCluster.globalClusterIdentifier,
            SNS_TOPIC_ARN: secondaryAlertTopic.arn,
          },
        },
        tags: {
          ...defaultTags,
          Name: `secondary-monitor-function-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'secondary',
        },
      },
      {
        parent: this,
        provider: secondaryProvider,
        dependsOn: [lambdaRole, lambdaBasicExecution, lambdaRdsPolicy],
      }
    );

    // ==================== EVENTBRIDGE RULES FOR SCHEDULED MONITORING ====================
    // EventBridge rule to trigger primary Lambda every minute
    const primaryMonitorRule = new aws.cloudwatch.EventRule(
      `primary-monitor-rule-${environmentSuffix}`,
      {
        name: `primary-monitor-rule-${environmentSuffix}`,
        description:
          'Trigger replication lag monitoring in primary region every minute',
        scheduleExpression: 'rate(1 minute)',
        tags: {
          ...defaultTags,
          Name: `primary-monitor-rule-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      { parent: this, provider: primaryProvider }
    );

    const _primaryMonitorTarget = new aws.cloudwatch.EventTarget(
      `primary-monitor-target-${environmentSuffix}`,
      {
        rule: primaryMonitorRule.name,
        arn: primaryMonitorFunction.arn,
      },
      { parent: this, provider: primaryProvider }
    );

    const _primaryMonitorPermission = new aws.lambda.Permission(
      `primary-monitor-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: primaryMonitorFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: primaryMonitorRule.arn,
      },
      { parent: this, provider: primaryProvider }
    );

    // EventBridge rule to trigger secondary Lambda every minute
    const secondaryMonitorRule = new aws.cloudwatch.EventRule(
      `secondary-monitor-rule-${environmentSuffix}`,
      {
        name: `secondary-monitor-rule-${environmentSuffix}`,
        description:
          'Trigger replication lag monitoring in secondary region every minute',
        scheduleExpression: 'rate(1 minute)',
        tags: {
          ...defaultTags,
          Name: `secondary-monitor-rule-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'secondary',
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    const _secondaryMonitorTarget = new aws.cloudwatch.EventTarget(
      `secondary-monitor-target-${environmentSuffix}`,
      {
        rule: secondaryMonitorRule.name,
        arn: secondaryMonitorFunction.arn,
      },
      { parent: this, provider: secondaryProvider }
    );

    const _secondaryMonitorPermission = new aws.lambda.Permission(
      `secondary-monitor-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: secondaryMonitorFunction.name,
        principal: 'events.amazonaws.com',
        sourceArn: secondaryMonitorRule.arn,
      },
      { parent: this, provider: secondaryProvider }
    );

    // ==================== CLOUDWATCH ALARMS ====================
    // Alarm for primary cluster CPU utilization
    const _primaryCpuAlarm = new aws.cloudwatch.MetricAlarm(
      `primary-cpu-alarm-${environmentSuffix}`,
      {
        name: `primary-cpu-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Alert when primary Aurora cluster CPU exceeds 80%',
        alarmActions: [primaryAlertTopic.arn],
        dimensions: {
          DBClusterIdentifier: primaryCluster.clusterIdentifier,
        },
        tags: {
          ...defaultTags,
          Name: `primary-cpu-alarm-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Alarm for primary cluster storage utilization
    const _primaryStorageAlarm = new aws.cloudwatch.MetricAlarm(
      `primary-storage-alarm-${environmentSuffix}`,
      {
        name: `primary-storage-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'VolumeBytesUsed',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 85899345920, // 80GB (85% of 100GB typical allocation)
        alarmDescription:
          'Alert when primary Aurora cluster storage exceeds 85%',
        alarmActions: [primaryAlertTopic.arn],
        dimensions: {
          DBClusterIdentifier: primaryCluster.clusterIdentifier,
        },
        tags: {
          ...defaultTags,
          Name: `primary-storage-alarm-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Alarm for secondary cluster CPU utilization
    const _secondaryCpuAlarm = new aws.cloudwatch.MetricAlarm(
      `secondary-cpu-alarm-${environmentSuffix}`,
      {
        name: `secondary-cpu-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Alert when secondary Aurora cluster CPU exceeds 80%',
        alarmActions: [secondaryAlertTopic.arn],
        dimensions: {
          DBClusterIdentifier: secondaryCluster.clusterIdentifier,
        },
        tags: {
          ...defaultTags,
          Name: `secondary-cpu-alarm-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'secondary',
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Alarm for secondary cluster storage utilization
    const _secondaryStorageAlarm = new aws.cloudwatch.MetricAlarm(
      `secondary-storage-alarm-${environmentSuffix}`,
      {
        name: `secondary-storage-alarm-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'VolumeBytesUsed',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 85899345920, // 80GB (85% of 100GB typical allocation)
        alarmDescription:
          'Alert when secondary Aurora cluster storage exceeds 85%',
        alarmActions: [secondaryAlertTopic.arn],
        dimensions: {
          DBClusterIdentifier: secondaryCluster.clusterIdentifier,
        },
        tags: {
          ...defaultTags,
          Name: `secondary-storage-alarm-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'secondary',
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // ==================== ROUTE53 CONFIGURATION ====================
    // Create Private Hosted Zone in primary region
    const hostedZone = new aws.route53.Zone(
      `db-hosted-zone-${environmentSuffix}`,
      {
        name: `db.internal.${environmentSuffix}`,
        vpcs: [
          {
            vpcId: primaryVpc.id,
            vpcRegion: primaryRegion,
          },
        ],
        tags: {
          ...defaultTags,
          Name: `db-hosted-zone-${environmentSuffix}`,
          Environment: 'production',
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Associate secondary VPC with hosted zone
    const _secondaryVpcAssociation = new aws.route53.ZoneAssociation(
      `secondary-vpc-association-${environmentSuffix}`,
      {
        zoneId: hostedZone.zoneId,
        vpcId: secondaryVpc.id,
        vpcRegion: secondaryRegion,
      },
      { parent: this, provider: secondaryProvider }
    );

    // Health check for primary cluster endpoint
    const primaryHealthCheck = new aws.route53.HealthCheck(
      `primary-health-check-${environmentSuffix}`,
      {
        type: 'CALCULATED',
        childHealthThreshold: 1,
        childHealthchecks: [], // Will be updated to include Lambda-based checks
        tags: {
          ...defaultTags,
          Name: `primary-health-check-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'primary',
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Health check for secondary cluster endpoint
    const secondaryHealthCheck = new aws.route53.HealthCheck(
      `secondary-health-check-${environmentSuffix}`,
      {
        type: 'CALCULATED',
        childHealthThreshold: 1,
        childHealthchecks: [], // Will be updated to include Lambda-based checks
        tags: {
          ...defaultTags,
          Name: `secondary-health-check-${environmentSuffix}`,
          Environment: 'production',
          'DR-Role': 'secondary',
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // Primary DNS record with health check
    const _primaryDnsRecord = new aws.route53.Record(
      `primary-db-record-${environmentSuffix}`,
      {
        zoneId: hostedZone.zoneId,
        name: `rds.db.internal.${environmentSuffix}`,
        type: 'CNAME',
        ttl: 60,
        records: [primaryCluster.endpoint],
        setIdentifier: 'primary',
        failoverRoutingPolicies: [
          {
            type: 'PRIMARY',
          },
        ],
        healthCheckId: primaryHealthCheck.id,
      },
      {
        parent: this,
        provider: primaryProvider,
        dependsOn: [hostedZone, primaryCluster, primaryHealthCheck],
      }
    );

    // Secondary DNS record with health check (failover)
    const _secondaryDnsRecord = new aws.route53.Record(
      `secondary-db-record-${environmentSuffix}`,
      {
        zoneId: hostedZone.zoneId,
        name: `rds.db.internal.${environmentSuffix}`,
        type: 'CNAME',
        ttl: 60,
        records: [secondaryCluster.endpoint],
        setIdentifier: 'secondary',
        failoverRoutingPolicies: [
          {
            type: 'SECONDARY',
          },
        ],
        healthCheckId: secondaryHealthCheck.id,
      },
      {
        parent: this,
        provider: primaryProvider,
        dependsOn: [hostedZone, secondaryCluster, secondaryHealthCheck],
      }
    );

    // ==================== EXPORTS ====================
    this.primaryVpcId = primaryVpc.id;
    this.secondaryVpcId = secondaryVpc.id;
    this.globalClusterId = globalCluster.id;
    this.primaryClusterId = primaryCluster.id;
    this.secondaryClusterId = secondaryCluster.id;
    this.primaryClusterEndpoint = primaryCluster.endpoint;
    this.secondaryClusterEndpoint = secondaryCluster.endpoint;
    this.hostedZoneId = hostedZone.zoneId;
    this.healthCheckId = primaryHealthCheck.id;
    this.primaryMonitorFunctionArn = primaryMonitorFunction.arn;
    this.secondaryMonitorFunctionArn = secondaryMonitorFunction.arn;

    // Register outputs
    this.registerOutputs({
      primaryVpcId: this.primaryVpcId,
      secondaryVpcId: this.secondaryVpcId,
      globalClusterId: this.globalClusterId,
      primaryClusterId: this.primaryClusterId,
      secondaryClusterId: this.secondaryClusterId,
      primaryClusterEndpoint: this.primaryClusterEndpoint,
      secondaryClusterEndpoint: this.secondaryClusterEndpoint,
      primaryClusterReaderEndpoint: primaryCluster.readerEndpoint,
      secondaryClusterReaderEndpoint: secondaryCluster.readerEndpoint,
      hostedZoneId: this.hostedZoneId,
      hostedZoneName: hostedZone.name,
      primaryHealthCheckId: primaryHealthCheck.id,
      secondaryHealthCheckId: secondaryHealthCheck.id,
      primaryMonitorFunctionArn: this.primaryMonitorFunctionArn,
      primaryMonitorFunctionName: primaryMonitorFunction.name,
      secondaryMonitorFunctionArn: this.secondaryMonitorFunctionArn,
      secondaryMonitorFunctionName: secondaryMonitorFunction.name,
      primaryAlertTopicArn: primaryAlertTopic.arn,
      secondaryAlertTopicArn: secondaryAlertTopic.arn,
      drOperationsRoleArn: drOperationsRole.arn,
      vpcPeeringConnectionId: vpcPeeringConnection.id,
    });
  }
}
