import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { CloudwatchEventRule } from '@cdktf/provider-aws/lib/cloudwatch-event-rule';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { LambdaEventSourceMapping } from '@cdktf/provider-aws/lib/lambda-event-source-mapping';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SqsQueue } from '@cdktf/provider-aws/lib/sqs-queue';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { AssetType, TerraformAsset } from 'cdktf';
import { Construct } from 'constructs';
import * as path from 'path';
import { config } from './config/infrastructure-config';
import { SharedConstructs } from './shared-constructs';

// Generate unique suffix to avoid resource naming conflicts
const uniqueSuffix = 'q8t3';

export interface PrimaryRegionStackProps {
  provider: AwsProvider;
  environmentSuffix: string;
  sharedConstructs: SharedConstructs;
  secondaryProvider: AwsProvider;
}

export class PrimaryRegionStack extends Construct {
  public readonly vpc: Vpc;
  public readonly api: ApiGatewayRestApi;
  public readonly tradeProcessorFunction: LambdaFunction;
  public readonly auroraCluster: RdsCluster;

  constructor(scope: Construct, id: string, props: PrimaryRegionStackProps) {
    super(scope, id);

    const { provider, environmentSuffix, sharedConstructs, secondaryProvider } =
      props;
    const regionConfig = config.primaryRegion;

    // VPC
    this.vpc = new Vpc(this, 'vpc', {
      provider,
      cidrBlock: regionConfig.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `trading-vpc-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
        ManagedBy: 'CDKTF',
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      provider,
      vpcId: this.vpc.id,
      tags: {
        Name: `trading-igw-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Public Subnets
    const publicSubnets = regionConfig.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index}`, {
        provider,
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: regionConfig.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `trading-public-subnet-${index}-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      });
    });

    // Private Subnets
    const privateSubnets = regionConfig.privateSubnetCidrs.map(
      (cidr, index) => {
        return new Subnet(this, `private-subnet-${index}`, {
          provider,
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: regionConfig.availabilityZones[index],
          tags: {
            Name: `trading-private-subnet-${index}-primary-${environmentSuffix}`,
            Environment: environmentSuffix,
          },
        });
      }
    );

    // Public Route Table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      provider,
      vpcId: this.vpc.id,
      tags: {
        Name: `trading-public-rt-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new Route(this, 'public-route', {
      provider,
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        provider,
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Security Groups
    const lambdaSecurityGroup = new SecurityGroup(this, 'lambda-sg', {
      provider,
      name: `lambda-sg-primary-${environmentSuffix}`,
      description: 'Security group for Lambda functions',
      vpcId: this.vpc.id,
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
        Name: `lambda-sg-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      provider,
      name: `rds-sg-primary-${environmentSuffix}`,
      description: 'Security group for RDS Aurora',
      vpcId: this.vpc.id,
      ingress: [
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          securityGroups: [lambdaSecurityGroup.id],
          description: 'PostgreSQL from Lambda',
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
        Name: `rds-sg-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      provider,
      name: `trading-db-subnet-group-primary-${environmentSuffix}-${uniqueSuffix}`,
      subnetIds: privateSubnets.map(s => s.id),
      tags: {
        Name: `db-subnet-group-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Aurora PostgreSQL Cluster (Primary)
    this.auroraCluster = new RdsCluster(this, 'aurora-cluster', {
      provider,
      clusterIdentifier: `trading-cluster-primary-${environmentSuffix}-${uniqueSuffix}`,
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      databaseName: config.databaseName,
      masterUsername: config.databaseUsername,
      masterPassword: process.env.TF_VAR_db_password || 'ChangeMe123!', // Password from environment variable
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      storageEncrypted: true,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
      skipFinalSnapshot: true,
      globalClusterIdentifier: sharedConstructs.globalCluster.id,
      engineMode: 'provisioned',
      serverlessv2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 2,
      },
      tags: {
        Name: `aurora-cluster-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
      dependsOn: [sharedConstructs.globalCluster],
    });

    // Aurora Instance
    new RdsClusterInstance(this, 'aurora-instance-1', {
      provider,
      identifier: `trading-instance-1-primary-${environmentSuffix}-${uniqueSuffix}`,
      clusterIdentifier: this.auroraCluster.id,
      instanceClass: 'db.serverless',
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      tags: {
        Name: `aurora-instance-1-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // SQS Queue for Trade Orders
    const tradeQueue = new SqsQueue(this, 'trade-queue', {
      provider,
      name: `${config.tradeQueueName}-primary-${environmentSuffix}-${uniqueSuffix}`,
      visibilityTimeoutSeconds: 300,
      messageRetentionSeconds: 1209600, // 14 days
      receiveWaitTimeSeconds: 20,
      tags: {
        Name: `trade-queue-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Dead Letter Queue
    const dlq = new SqsQueue(this, 'trade-dlq', {
      provider,
      name: `${config.tradeQueueName}-dlq-primary-${environmentSuffix}-${uniqueSuffix}`,
      messageRetentionSeconds: 1209600,
      tags: {
        Name: `trade-dlq-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Lambda Execution Role
    const lambdaRole = new IamRole(this, 'lambda-role', {
      provider,
      name: `lambda-execution-role-primary-${environmentSuffix}`,
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
        Name: `lambda-role-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new IamRolePolicy(this, 'lambda-policy', {
      provider,
      role: lambdaRole.id,
      name: 'LambdaExecutionPolicy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
          {
            Effect: 'Allow',
            Action: [
              'ec2:CreateNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DeleteNetworkInterface',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'sqs:ReceiveMessage',
              'sqs:DeleteMessage',
              'sqs:GetQueueAttributes',
              'sqs:SendMessage',
            ],
            Resource: [tradeQueue.arn, dlq.arn],
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
            ],
            Resource: sharedConstructs.sessionTable.arn,
          },
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetObject'],
            Resource: [
              `${sharedConstructs.auditLogBucket.arn}/*`,
              `${sharedConstructs.configBucket.arn}/*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: ['rds:DescribeDBClusters', 'rds:DescribeDBInstances'],
            Resource: '*',
          },
        ],
      }),
    });

    // Trade Processor Lambda Function
    const tradeProcessorAsset = new TerraformAsset(
      this,
      'trade-processor-asset',
      {
        path: path.join(__dirname, 'lambda'),
        type: AssetType.ARCHIVE,
      }
    );

    this.tradeProcessorFunction = new LambdaFunction(this, 'trade-processor', {
      provider,
      functionName: `trade-processor-primary-${environmentSuffix}-${uniqueSuffix}`,
      role: lambdaRole.arn,
      handler: 'trade-processor.handler',
      runtime: 'nodejs18.x',
      filename: tradeProcessorAsset.path,
      sourceCodeHash: tradeProcessorAsset.assetHash,
      timeout: 300,
      memorySize: 512,
      vpcConfig: {
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [lambdaSecurityGroup.id],
      },
      environment: {
        variables: {
          ENVIRONMENT_SUFFIX: environmentSuffix,
          REGION: regionConfig.region,
          DB_CLUSTER_ENDPOINT: this.auroraCluster.endpoint,
          DB_NAME: config.databaseName,
          DB_USERNAME: config.databaseUsername,
          SESSION_TABLE: sharedConstructs.sessionTable.name,
          AUDIT_BUCKET: sharedConstructs.auditLogBucket.bucket,
        },
      },
      tags: {
        Name: `trade-processor-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Lambda SQS Event Source Mapping
    new LambdaEventSourceMapping(this, 'trade-queue-trigger', {
      provider,
      eventSourceArn: tradeQueue.arn,
      functionName: this.tradeProcessorFunction.arn,
      batchSize: 10,
      maximumBatchingWindowInSeconds: 5,
    });

    // API Gateway
    this.api = new ApiGatewayRestApi(this, 'api', {
      provider,
      name: `trading-api-primary-${environmentSuffix}`,
      description: 'Trading Platform API - Primary Region',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags: {
        Name: `api-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // API Resources
    const tradesResource = new ApiGatewayResource(this, 'trades-resource', {
      provider,
      restApiId: this.api.id,
      parentId: this.api.rootResourceId,
      pathPart: 'trades',
    });

    const healthResource = new ApiGatewayResource(this, 'health-resource', {
      provider,
      restApiId: this.api.id,
      parentId: this.api.rootResourceId,
      pathPart: 'health',
    });

    // POST /trades
    const postTradesMethod = new ApiGatewayMethod(this, 'post-trades-method', {
      provider,
      restApiId: this.api.id,
      resourceId: tradesResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    });

    // GET /health
    const getHealthMethod = new ApiGatewayMethod(this, 'get-health-method', {
      provider,
      restApiId: this.api.id,
      resourceId: healthResource.id,
      httpMethod: 'GET',
      authorization: 'NONE',
    });

    // Lambda Permission for API Gateway
    new LambdaPermission(this, 'api-lambda-permission', {
      provider,
      statementId: 'AllowAPIGatewayInvoke',
      action: 'lambda:InvokeFunction',
      functionName: this.tradeProcessorFunction.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${this.api.executionArn}/*/*/*`,
    });

    // API Integrations
    const postTradesIntegration = new ApiGatewayIntegration(
      this,
      'post-trades-integration',
      {
        provider,
        restApiId: this.api.id,
        resourceId: tradesResource.id,
        httpMethod: postTradesMethod.httpMethod,
        type: 'AWS_PROXY',
        integrationHttpMethod: 'POST',
        uri: this.tradeProcessorFunction.invokeArn,
      }
    );

    const getHealthIntegration = new ApiGatewayIntegration(
      this,
      'get-health-integration',
      {
        provider,
        restApiId: this.api.id,
        resourceId: healthResource.id,
        httpMethod: getHealthMethod.httpMethod,
        type: 'MOCK',
        requestTemplates: {
          'application/json': '{"statusCode": 200}',
        },
      }
    );

    // API Deployment
    const deployment = new ApiGatewayDeployment(this, 'api-deployment', {
      provider,
      restApiId: this.api.id,
      dependsOn: [
        postTradesMethod,
        getHealthMethod,
        postTradesIntegration,
        getHealthIntegration,
      ],
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _stage = new ApiGatewayStage(this, 'api-stage', {
      provider,
      deploymentId: deployment.id,
      restApiId: this.api.id,
      stageName: 'prod',
      tags: {
        Name: `api-stage-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // CloudWatch Alarms
    const alarmTopic = new SnsTopic(this, 'alarm-topic', {
      provider,
      name: `trading-alarms-primary-${environmentSuffix}`,
      tags: {
        Name: `alarm-topic-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // RDS Lag Alarm
    new CloudwatchMetricAlarm(this, 'rds-lag-alarm', {
      provider,
      alarmName: `rds-replication-lag-primary-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'AuroraGlobalDBReplicationLag',
      namespace: 'AWS/RDS',
      period: 60,
      statistic: 'Average',
      threshold: 1000, // 1 second in milliseconds
      alarmDescription: 'Alert when RDS replication lag exceeds 1 second',
      dimensions: {
        DBClusterIdentifier: this.auroraCluster.id,
      },
      alarmActions: [alarmTopic.arn],
      tags: {
        Name: `rds-lag-alarm-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Lambda Error Alarm
    new CloudwatchMetricAlarm(this, 'lambda-error-alarm', {
      provider,
      alarmName: `lambda-errors-primary-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 60,
      statistic: 'Sum',
      threshold: 5,
      alarmDescription: 'Alert when Lambda errors exceed threshold',
      dimensions: {
        FunctionName: this.tradeProcessorFunction.functionName,
      },
      alarmActions: [alarmTopic.arn],
      tags: {
        Name: `lambda-error-alarm-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // API Gateway Latency Alarm
    new CloudwatchMetricAlarm(this, 'api-latency-alarm', {
      provider,
      alarmName: `api-latency-primary-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Latency',
      namespace: 'AWS/ApiGateway',
      period: 60,
      statistic: 'Average',
      threshold: 1000, // 1 second
      alarmDescription: 'Alert when API latency exceeds 1 second',
      dimensions: {
        ApiName: this.api.name,
        Stage: 'prod',
      },
      alarmActions: [alarmTopic.arn],
      tags: {
        Name: `api-latency-alarm-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Systems Manager Parameters
    new SsmParameter(this, 'region-parameter', {
      provider,
      name: `/trading/${environmentSuffix}/primary/region`,
      type: 'String',
      value: regionConfig.region,
      overwrite: true,
      tags: {
        Environment: environmentSuffix,
      },
    });

    new SsmParameter(this, 'api-endpoint-parameter', {
      provider,
      name: `/trading/${environmentSuffix}/primary/api-endpoint`,
      type: 'String',
      value: `${this.api.id}.execute-api.${regionConfig.region}.amazonaws.com`,
      overwrite: true,
      tags: {
        Environment: environmentSuffix,
      },
    });

    new SsmParameter(this, 'db-endpoint-parameter', {
      provider,
      name: `/trading/${environmentSuffix}/primary/db-endpoint`,
      type: 'String',
      value: this.auroraCluster.endpoint,
      overwrite: true,
      tags: {
        Environment: environmentSuffix,
      },
    });

    new SsmParameter(this, 'cluster-id-parameter', {
      provider,
      name: `/trading/${environmentSuffix}/primary/cluster-id`,
      type: 'String',
      value: this.auroraCluster.clusterIdentifier,
      overwrite: true,
      tags: {
        Environment: environmentSuffix,
      },
    });

    // EventBridge Rule for Cross-Region Events
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _eventBusSecondary = new CloudwatchEventRule(
      this,
      'cross-region-event-rule',
      {
        provider: secondaryProvider,
        name: `receive-primary-events-${environmentSuffix}`,
        description: 'Receive events from primary region',
        eventPattern: JSON.stringify({
          source: ['trading.platform'],
          'detail-type': ['Trade Order', 'Failover Event'],
        }),
        tags: {
          Name: `cross-region-rule-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      }
    );
  }
}
