/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { RegionalInfrastructure } from './regional-infrastructure';

/**
 * Configuration options for the TapStack component.
 */
export interface TapStackArgs {
  /**
   * The environment suffix (e.g., 'dev', 'staging', 'prod')
   */
  environmentSuffix: string;

  /**
   * Tags to apply to all resources
   */
  tags?: Record<string, string>;
}

/**
 * TapStack component that encapsulates all infrastructure for the Test Automation Platform.
 *
 * This component creates a multi-region disaster recovery infrastructure with:
 * - Global RDS Aurora PostgreSQL cluster
 * - Primary infrastructure in us-east-1
 * - DR infrastructure in us-west-2
 * - VPC peering between regions
 * - S3 replication
 * - Route53 health checks and failover
 * - EventBridge cross-region replication
 * - CloudWatch alarms and monitoring dashboard
 */
export class TapStack extends pulumi.ComponentResource {
  // VPC and Network Outputs
  public readonly primaryVpcId: pulumi.Output<string>;
  public readonly drVpcId: pulumi.Output<string>;
  public readonly vpcPeeringConnectionId: pulumi.Output<string>;
  public readonly primaryPublicSubnetIds: pulumi.Output<string[]>;
  public readonly primaryPrivateSubnetIds: pulumi.Output<string[]>;
  public readonly drPublicSubnetIds: pulumi.Output<string[]>;
  public readonly drPrivateSubnetIds: pulumi.Output<string[]>;

  // Database Outputs
  public readonly globalClusterId: pulumi.Output<string>;
  public readonly primaryDbEndpoint: pulumi.Output<string>;
  public readonly drDbEndpoint: pulumi.Output<string>;
  public readonly primaryDbClusterId: pulumi.Output<string>;
  public readonly drDbClusterId: pulumi.Output<string>;

  // Compute Outputs
  public readonly primaryAlbEndpoint: pulumi.Output<string>;
  public readonly failoverEndpoint: pulumi.Output<string>;
  public readonly primaryAlbDnsName: pulumi.Output<string>;
  public readonly drAlbDnsName: pulumi.Output<string>;
  public readonly primaryLambdaName: pulumi.Output<string>;
  public readonly drLambdaName: pulumi.Output<string>;
  public readonly primaryLambdaArn: pulumi.Output<string>;
  public readonly drLambdaArn: pulumi.Output<string>;

  // Storage Outputs
  public readonly primaryBucketName: pulumi.Output<string>;
  public readonly drBucketName: pulumi.Output<string>;
  public readonly primaryBucketArn: pulumi.Output<string>;
  public readonly drBucketArn: pulumi.Output<string>;

  // Route53 and Health Check Outputs
  public readonly route53ZoneId: pulumi.Output<string>;
  public readonly primaryEndpoint: pulumi.Output<string>;
  public readonly primaryHealthCheckId: pulumi.Output<string>;
  public readonly drHealthCheckId: pulumi.Output<string>;

  // EventBridge Outputs
  public readonly primaryEventBusName: pulumi.Output<string>;
  public readonly drEventBusName: pulumi.Output<string>;
  public readonly primaryEventBusArn: pulumi.Output<string>;
  public readonly drEventBusArn: pulumi.Output<string>;

  // Monitoring Outputs
  public readonly alarmTopicArn: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    const { environmentSuffix, tags: customTags } = args;

    // Define default tags
    const tags = {
      Environment: environmentSuffix,
      ManagedBy: 'Pulumi',
      Project: 'HealthcareDR',
      ...customTags,
    };

    // Create Global Database Cluster (PostgreSQL 14.6 for verified compatibility)
    const globalCluster = new aws.rds.GlobalCluster(
      'global-cluster',
      {
        globalClusterIdentifier: `global-healthcare-${environmentSuffix}`,
        engine: 'aurora-postgresql',
        engineVersion: '14.6',
        databaseName: 'healthcare',
        deletionProtection: false,
      },
      { parent: this }
    );

    // Create Primary Infrastructure (us-east-1)
    const primaryInfra = new RegionalInfrastructure(
      'primary',
      {
        environmentSuffix,
        region: 'us-east-1',
        isPrimary: true,
        vpcCidr: '10.0.0.0/16',
        globalClusterId: globalCluster,
        tags: { ...tags, 'DR-Role': 'primary' },
      },
      { parent: this }
    );

    // Create DR Infrastructure (us-west-2)
    const drInfra = new RegionalInfrastructure(
      'dr',
      {
        environmentSuffix,
        region: 'us-west-2',
        isPrimary: false,
        vpcCidr: '10.1.0.0/16',
        globalClusterId: globalCluster,
        tags: { ...tags, 'DR-Role': 'secondary' },
      },
      { parent: this, dependsOn: [primaryInfra] }
    );

    // Create VPC Peering Connection
    const vpcPeering = new aws.ec2.VpcPeeringConnection(
      'vpc-peering',
      {
        vpcId: primaryInfra.networking.vpc.id,
        peerVpcId: drInfra.networking.vpc.id,
        peerRegion: 'us-west-2',
        autoAccept: false,
        tags: { ...tags, Name: `vpc-peering-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Accept VPC Peering in us-west-2
    const drProvider = new aws.Provider('dr-provider', { region: 'us-west-2' }, { parent: this });
    const peeringAccepter = new aws.ec2.VpcPeeringConnectionAccepter(
      'peering-accepter',
      {
        vpcPeeringConnectionId: vpcPeering.id,
        autoAccept: true,
        tags: { ...tags, Name: `vpc-peering-accepter-${environmentSuffix}` },
      },
      { parent: this, provider: drProvider, dependsOn: [vpcPeering] }
    );

    // Add peering routes to primary VPC (us-east-1)
    primaryInfra.networking.privateRouteTables.forEach((rt, i) => {
      new aws.ec2.Route(
        `primary-private-peer-route-${i}`,
        {
          routeTableId: rt.id,
          destinationCidrBlock: '10.1.0.0/16',
          vpcPeeringConnectionId: vpcPeering.id,
        },
        { parent: this, dependsOn: [peeringAccepter] }
      );
    });

    new aws.ec2.Route(
      'primary-public-peer-route',
      {
        routeTableId: primaryInfra.networking.publicRouteTable.id,
        destinationCidrBlock: '10.1.0.0/16',
        vpcPeeringConnectionId: vpcPeering.id,
      },
      { parent: this, dependsOn: [peeringAccepter] }
    );

    // Add peering routes to DR VPC (us-west-2)
    drInfra.networking.privateRouteTables.forEach((rt, i) => {
      new aws.ec2.Route(
        `dr-private-peer-route-${i}`,
        {
          routeTableId: rt.id,
          destinationCidrBlock: '10.0.0.0/16',
          vpcPeeringConnectionId: vpcPeering.id,
        },
        { parent: this, provider: drProvider, dependsOn: [peeringAccepter] }
      );
    });

    new aws.ec2.Route(
      'dr-public-peer-route',
      {
        routeTableId: drInfra.networking.publicRouteTable.id,
        destinationCidrBlock: '10.0.0.0/16',
        vpcPeeringConnectionId: vpcPeering.id,
      },
      { parent: this, provider: drProvider, dependsOn: [peeringAccepter] }
    );

    // Create S3 Replication Role
    const replicationRole = new aws.iam.Role(
      'replication-role',
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
        tags: { ...tags, Name: `s3-replication-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      'replication-policy',
      {
        role: replicationRole.id,
        policy: pulumi
          .all([primaryInfra.storage.bucket.arn, drInfra.storage.bucket.arn])
          .apply(([sourceArn, destArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
                  Resource: sourceArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObjectVersionForReplication',
                    's3:GetObjectVersionAcl',
                    's3:GetObjectVersionTagging',
                  ],
                  Resource: `${sourceArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:ReplicateObject',
                    's3:ReplicateDelete',
                    's3:ReplicateTags',
                  ],
                  Resource: `${destArn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Add destination bucket policy (allowing replication)
    const drBucketPolicy = new aws.s3.BucketPolicy(
      'dr-bucket-policy',
      {
        bucket: drInfra.storage.bucket.id,
        policy: pulumi
          .all([drInfra.storage.bucket.arn, replicationRole.arn])
          .apply(([bucketArn, roleArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AllowReplicationRole',
                  Effect: 'Allow',
                  Principal: {
                    AWS: roleArn,
                  },
                  Action: [
                    's3:ReplicateObject',
                    's3:ReplicateDelete',
                    's3:ReplicateTags',
                    's3:GetObjectVersionForReplication',
                    's3:ObjectOwnerOverrideToBucketOwner',
                  ],
                  Resource: `${bucketArn}/*`,
                },
                {
                  Sid: 'AllowReplicationRoleGetBucket',
                  Effect: 'Allow',
                  Principal: {
                    AWS: roleArn,
                  },
                  Action: [
                    's3:List*',
                    's3:GetBucketVersioning',
                    's3:GetBucketObjectLockConfiguration',
                  ],
                  Resource: bucketArn,
                },
              ],
            })
          ),
      },
      { parent: this, provider: drProvider, dependsOn: [drInfra.storage.bucketVersioning] }
    );

    // Configure S3 Replication
    const _primaryReplication = new aws.s3.BucketReplicationConfig(
      'primary-replication',
      {
        bucket: primaryInfra.storage.bucket.id,
        role: replicationRole.arn,
        rules: [
          {
            id: 'replicate-all',
            status: 'Enabled',
            priority: 1,
            deleteMarkerReplication: { status: 'Enabled' },
            filter: {},
            destination: {
              bucket: drInfra.storage.bucket.arn,
              replicationTime: {
                status: 'Enabled',
                time: { minutes: 15 },
              },
              metrics: {
                status: 'Enabled',
                eventThreshold: { minutes: 15 },
              },
            },
          },
        ],
      },
      {
        parent: this,
        dependsOn: [
          primaryInfra.storage.bucketVersioning,
          drInfra.storage.bucketVersioning,
          drBucketPolicy,
        ],
      }
    );

    // Create Route53 Hosted Zone
    const hostedZone = new aws.route53.Zone(
      'hosted-zone',
      {
        name: `${environmentSuffix}.testing.local`,
        tags: { ...tags, Name: `hosted-zone-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Create Health Checks (HTTP on port 80, targeting /health)
    const primaryHealthCheck = new aws.route53.HealthCheck(
      'primary-health-check',
      {
        type: 'HTTP',
        resourcePath: '/health',
        fqdn: primaryInfra.compute.alb.dnsName,
        port: 80,
        requestInterval: 30,
        failureThreshold: 3,
        tags: { ...tags, Name: `primary-health-check-${environmentSuffix}` },
      },
      { parent: this }
    );

    const drHealthCheck = new aws.route53.HealthCheck(
      'dr-health-check',
      {
        type: 'HTTP',
        resourcePath: '/health',
        fqdn: drInfra.compute.alb.dnsName,
        port: 80,
        requestInterval: 30,
        failureThreshold: 3,
        tags: { ...tags, Name: `dr-health-check-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Create Route53 Records with Failover
    const _primaryRecord = new aws.route53.Record(
      'primary-record',
      {
        zoneId: hostedZone.zoneId,
        name: `api.${environmentSuffix}.testing.local`,
        type: 'CNAME',
        ttl: 60,
        records: [primaryInfra.compute.alb.dnsName],
        setIdentifier: 'primary',
        failoverRoutingPolicies: [{ type: 'PRIMARY' }],
        healthCheckId: primaryHealthCheck.id,
      },
      { parent: this }
    );

    const _drRecord = new aws.route53.Record(
      'dr-record',
      {
        zoneId: hostedZone.zoneId,
        name: `api.${environmentSuffix}.testing.local`,
        type: 'CNAME',
        ttl: 60,
        records: [drInfra.compute.alb.dnsName],
        setIdentifier: 'secondary',
        failoverRoutingPolicies: [{ type: 'SECONDARY' }],
        healthCheckId: drHealthCheck.id,
      },
      { parent: this }
    );

    // Create EventBridge Cross-Region Rule (Primary to DR)
    const eventRole = new aws.iam.Role(
      'event-role',
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'events.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: { ...tags, Name: `event-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      'event-policy',
      {
        role: eventRole.id,
        policy: drInfra.eventBus.arn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: 'events:PutEvents',
                Resource: arn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    const primaryEventRule = new aws.cloudwatch.EventRule(
      'primary-event-rule',
      {
        name: `forward-to-dr-${environmentSuffix}`,
        eventBusName: primaryInfra.eventBus.name,
        eventPattern: JSON.stringify({
          source: ['healthcare.application'],
          'detail-type': ['Patient Data Event'],
        }),
        tags: { ...tags, Name: `event-rule-primary-${environmentSuffix}` },
      },
      { parent: this }
    );

    const _drEventBusTarget = new aws.cloudwatch.EventTarget(
      'dr-event-target',
      {
        rule: primaryEventRule.name,
        eventBusName: primaryInfra.eventBus.name,
        arn: drInfra.eventBus.arn,
        roleArn: eventRole.arn,
      },
      { parent: this }
    );

    // Add EventBridge Permission to DR Bus
    const _drEventBusPolicy = new aws.cloudwatch.EventBusPolicy(
      'dr-event-bus-policy',
      {
        eventBusName: drInfra.eventBus.name,
        policy: pulumi
          .all([primaryInfra.eventBus.arn, drInfra.eventBus.arn])
          .apply(([_primaryArn, drArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AllowCrossRegionEvents',
                  Effect: 'Allow',
                  Principal: '*',
                  Action: 'events:PutEvents',
                  Resource: drArn,
                  Condition: {
                    StringEquals: {
                      'events:source': 'healthcare.application',
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this, provider: drProvider }
    );

    // Create SNS Topic for Alarms
    const alarmTopic = new aws.sns.Topic(
      'alarm-topic',
      {
        name: `healthcare-alarms-${environmentSuffix}`,
        tags: { ...tags, Name: `alarm-topic-${environmentSuffix}` },
      },
      { parent: this }
    );

    // CloudWatch Alarms for Route53 Health Checks
    const _primaryHealthAlarm = new aws.cloudwatch.MetricAlarm(
      'primary-health-alarm',
      {
        name: `primary-health-check-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HealthCheckStatus',
        namespace: 'AWS/Route53',
        period: 60,
        statistic: 'Minimum',
        threshold: 1,
        alarmDescription: 'Primary region health check failed',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          HealthCheckId: primaryHealthCheck.id,
        },
        tags: { ...tags, Name: `primary-health-alarm-${environmentSuffix}` },
      },
      { parent: this }
    );

    const _drHealthAlarm = new aws.cloudwatch.MetricAlarm(
      'dr-health-alarm',
      {
        name: `dr-health-check-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'HealthCheckStatus',
        namespace: 'AWS/Route53',
        period: 60,
        statistic: 'Minimum',
        threshold: 1,
        alarmDescription: 'DR region health check failed',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          HealthCheckId: drHealthCheck.id,
        },
        tags: { ...tags, Name: `dr-health-alarm-${environmentSuffix}` },
      },
      { parent: this }
    );

    // CloudWatch Alarms for RDS
    const _primaryRdsCpuAlarm = new aws.cloudwatch.MetricAlarm(
      'primary-rds-cpu-alarm',
      {
        name: `primary-rds-cpu-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'Primary RDS CPU utilization above 80%',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBClusterIdentifier: primaryInfra.database.cluster.id,
        },
        tags: { ...tags, Name: `primary-rds-cpu-alarm-${environmentSuffix}` },
      },
      { parent: this }
    );

    const _primaryRdsConnectionsAlarm = new aws.cloudwatch.MetricAlarm(
      'primary-rds-connections-alarm',
      {
        name: `primary-rds-connections-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 100,
        alarmDescription: 'Primary RDS connections above 100',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBClusterIdentifier: primaryInfra.database.cluster.id,
        },
        tags: {
          ...tags,
          Name: `primary-rds-connections-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarms for Lambda
    const _primaryLambdaErrorAlarm = new aws.cloudwatch.MetricAlarm(
      'primary-lambda-error-alarm',
      {
        name: `primary-lambda-errors-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        alarmDescription: 'Primary Lambda function errors above 10',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          FunctionName: primaryInfra.compute.lambdaFunction.name,
        },
        tags: { ...tags, Name: `primary-lambda-error-alarm-${environmentSuffix}` },
      },
      { parent: this }
    );

    const _primaryLambdaThrottleAlarm = new aws.cloudwatch.MetricAlarm(
      'primary-lambda-throttle-alarm',
      {
        name: `primary-lambda-throttles-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: 'Throttles',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 0,
        alarmDescription: 'Primary Lambda function throttled',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          FunctionName: primaryInfra.compute.lambdaFunction.name,
        },
        tags: {
          ...tags,
          Name: `primary-lambda-throttle-alarm-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // CloudWatch Alarms for ALB
    const _primaryAlbUnhealthyAlarm = new aws.cloudwatch.MetricAlarm(
      'primary-alb-unhealthy-alarm',
      {
        name: `primary-alb-unhealthy-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'UnHealthyHostCount',
        namespace: 'AWS/ApplicationELB',
        period: 60,
        statistic: 'Maximum',
        threshold: 0,
        alarmDescription: 'Primary ALB has unhealthy targets',
        alarmActions: [alarmTopic.arn],
        dimensions: {
          LoadBalancer: primaryInfra.compute.alb.arnSuffix,
          TargetGroup: primaryInfra.compute.targetGroup.arnSuffix,
        },
        tags: { ...tags, Name: `primary-alb-unhealthy-alarm-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Create CloudWatch Dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      'dashboard',
      {
        dashboardName: `healthcare-dr-${environmentSuffix}`,
        dashboardBody: pulumi
          .all([
            primaryInfra.compute.alb.arn,
            drInfra.compute.alb.arn,
            primaryInfra.compute.lambdaFunction.name,
            drInfra.compute.lambdaFunction.name,
            primaryInfra.database.cluster.id,
            drInfra.database.cluster.id,
          ])
          .apply(
            ([
              _primaryAlbArn,
              _drAlbArn,
              primaryLambda,
              drLambda,
              primaryCluster,
              drCluster,
            ]) =>
              JSON.stringify({
                widgets: [
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        ['AWS/ApplicationELB', 'RequestCount', { stat: 'Sum', label: 'Primary ALB Requests' }],
                        ['...', { stat: 'Sum', label: 'DR ALB Requests', region: 'us-west-2' }],
                      ],
                      period: 300,
                      stat: 'Sum',
                      region: 'us-east-1',
                      title: 'ALB Request Counts',
                    },
                  },
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        ['AWS/Lambda', 'Invocations', 'FunctionName', primaryLambda],
                        ['...', 'FunctionName', drLambda, { region: 'us-west-2' }],
                      ],
                      period: 300,
                      stat: 'Sum',
                      region: 'us-east-1',
                      title: 'Lambda Invocations',
                    },
                  },
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        ['AWS/RDS', 'CPUUtilization', 'DBClusterIdentifier', primaryCluster],
                        ['...', 'DBClusterIdentifier', drCluster, { region: 'us-west-2' }],
                      ],
                      period: 300,
                      stat: 'Average',
                      region: 'us-east-1',
                      title: 'RDS CPU Utilization',
                    },
                  },
                  {
                    type: 'metric',
                    properties: {
                      metrics: [
                        ['AWS/Route53', 'HealthCheckStatus', 'HealthCheckId', primaryHealthCheck.id],
                        ['...', 'HealthCheckId', drHealthCheck.id],
                      ],
                      period: 60,
                      stat: 'Minimum',
                      region: 'us-east-1',
                      title: 'Health Check Status',
                    },
                  },
                ],
              })
          ),
      },
      { parent: this }
    );

    // Assign all outputs
    this.primaryVpcId = primaryInfra.networking.vpc.id;
    this.drVpcId = drInfra.networking.vpc.id;
    this.vpcPeeringConnectionId = vpcPeering.id;
    this.primaryPublicSubnetIds = pulumi.output(
      primaryInfra.networking.publicSubnets.map(s => s.id)
    );
    this.primaryPrivateSubnetIds = pulumi.output(
      primaryInfra.networking.privateSubnets.map(s => s.id)
    );
    this.drPublicSubnetIds = pulumi.output(
      drInfra.networking.publicSubnets.map(s => s.id)
    );
    this.drPrivateSubnetIds = pulumi.output(
      drInfra.networking.privateSubnets.map(s => s.id)
    );

    this.globalClusterId = globalCluster.id;
    this.primaryDbEndpoint = primaryInfra.database.cluster.endpoint;
    this.drDbEndpoint = drInfra.database.cluster.endpoint;
    this.primaryDbClusterId = primaryInfra.database.cluster.id;
    this.drDbClusterId = drInfra.database.cluster.id;

    this.primaryAlbDnsName = primaryInfra.compute.alb.dnsName;
    this.drAlbDnsName = drInfra.compute.alb.dnsName;
    this.primaryAlbEndpoint = pulumi.interpolate`http://${primaryInfra.compute.alb.dnsName}`;
    this.failoverEndpoint = pulumi.interpolate`http://${drInfra.compute.alb.dnsName}`;
    this.primaryLambdaName = primaryInfra.compute.lambdaFunction.name;
    this.drLambdaName = drInfra.compute.lambdaFunction.name;
    this.primaryLambdaArn = primaryInfra.compute.lambdaFunction.arn;
    this.drLambdaArn = drInfra.compute.lambdaFunction.arn;

    this.primaryBucketName = primaryInfra.storage.bucket.id;
    this.drBucketName = drInfra.storage.bucket.id;
    this.primaryBucketArn = primaryInfra.storage.bucket.arn;
    this.drBucketArn = drInfra.storage.bucket.arn;

    this.route53ZoneId = hostedZone.zoneId;
    this.primaryEndpoint = pulumi.interpolate`http://api.${environmentSuffix}.testing.local`;
    this.primaryHealthCheckId = primaryHealthCheck.id;
    this.drHealthCheckId = drHealthCheck.id;

    this.primaryEventBusName = primaryInfra.eventBus.name;
    this.drEventBusName = drInfra.eventBus.name;
    this.primaryEventBusArn = primaryInfra.eventBus.arn;
    this.drEventBusArn = drInfra.eventBus.arn;

    this.alarmTopicArn = alarmTopic.arn;
    this.dashboardName = dashboard.dashboardName;
    this.dashboardUrl = pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${dashboard.dashboardName}`;

    this.registerOutputs({
      primaryVpcId: this.primaryVpcId,
      drVpcId: this.drVpcId,
      vpcPeeringConnectionId: this.vpcPeeringConnectionId,
      primaryPublicSubnetIds: this.primaryPublicSubnetIds,
      primaryPrivateSubnetIds: this.primaryPrivateSubnetIds,
      drPublicSubnetIds: this.drPublicSubnetIds,
      drPrivateSubnetIds: this.drPrivateSubnetIds,
      globalClusterId: this.globalClusterId,
      primaryDbEndpoint: this.primaryDbEndpoint,
      drDbEndpoint: this.drDbEndpoint,
      primaryDbClusterId: this.primaryDbClusterId,
      drDbClusterId: this.drDbClusterId,
      primaryAlbEndpoint: this.primaryAlbEndpoint,
      failoverEndpoint: this.failoverEndpoint,
      primaryAlbDnsName: this.primaryAlbDnsName,
      drAlbDnsName: this.drAlbDnsName,
      primaryLambdaName: this.primaryLambdaName,
      drLambdaName: this.drLambdaName,
      primaryLambdaArn: this.primaryLambdaArn,
      drLambdaArn: this.drLambdaArn,
      primaryBucketName: this.primaryBucketName,
      drBucketName: this.drBucketName,
      primaryBucketArn: this.primaryBucketArn,
      drBucketArn: this.drBucketArn,
      route53ZoneId: this.route53ZoneId,
      primaryEndpoint: this.primaryEndpoint,
      primaryHealthCheckId: this.primaryHealthCheckId,
      drHealthCheckId: this.drHealthCheckId,
      primaryEventBusName: this.primaryEventBusName,
      drEventBusName: this.drEventBusName,
      primaryEventBusArn: this.primaryEventBusArn,
      drEventBusArn: this.drEventBusArn,
      alarmTopicArn: this.alarmTopicArn,
      dashboardUrl: this.dashboardUrl,
      dashboardName: this.dashboardName,
    });
  }
}
