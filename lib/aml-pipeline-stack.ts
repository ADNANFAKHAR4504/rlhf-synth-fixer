import * as cdk from 'aws-cdk-lib';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as athena from 'aws-cdk-lib/aws-athena';
import * as neptune from 'aws-cdk-lib/aws-neptune';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as opensearchserverless from 'aws-cdk-lib/aws-opensearchserverless';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kinesisEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface AmlPipelineStackProps extends cdk.NestedStackProps {
  sagemakerEndpointName: string;
  verifiedPermissionsPolicyStoreId: string;
  dataBucketName: string;
  environmentSuffix: string;
}

export class AmlPipelineStack extends cdk.NestedStack {
  public readonly transactionStream: kinesis.Stream;
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: AmlPipelineStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix;

    // Create VPC for resources that need it
    this.vpc = new ec2.Vpc(this, `AmlVpc-${suffix}`, {
      maxAzs: 2, // Reduced from 3 to minimize NAT Gateway costs
      natGateways: 0, // Removed NAT Gateways to avoid slow deployment
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // S3 Bucket for Athena results
    const athenaResultsBucket = new s3.Bucket(
      this,
      `AthenaResultsBucket-${suffix}`,
      {
        encryption: s3.BucketEncryption.S3_MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            id: 'delete-old-results',
            expiration: cdk.Duration.days(7),
            prefix: 'athena-results/',
          },
        ],
      }
    );

    // ==================== HOT PATH ====================

    // Kinesis Data Stream for transaction events
    this.transactionStream = new kinesis.Stream(
      this,
      `TransactionStream-${suffix}`,
      {
        shardCount: 1, // Reduced for cost optimization
        retentionPeriod: cdk.Duration.hours(24),
        encryption: kinesis.StreamEncryption.MANAGED,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // ElastiCache Redis cluster for velocity checks
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(
      this,
      `RedisSubnetGroup-${suffix}`,
      {
        description: 'Subnet group for Redis',
        subnetIds: this.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }).subnetIds,
      }
    );

    const redisSecurityGroup = new ec2.SecurityGroup(
      this,
      `RedisSecurityGroup-${suffix}`,
      {
        vpc: this.vpc,
        description: 'Security group for Redis cluster',
        allowAllOutbound: false,
      }
    );

    const redisCluster = new elasticache.CfnReplicationGroup(
      this,
      `RedisCluster-${suffix}`,
      {
        replicationGroupId: `aml-redis-${suffix}`,
        replicationGroupDescription:
          'Redis cluster for velocity fraud detection',
        engine: 'redis',
        cacheNodeType: 'cache.t3.micro', // Smaller instance for cost optimization
        numCacheClusters: 2, // Reduced to 2 for cost
        automaticFailoverEnabled: true,
        multiAzEnabled: false, // Disabled for cost optimization
        cacheSubnetGroupName: redisSubnetGroup.ref,
        securityGroupIds: [redisSecurityGroup.securityGroupId],
        atRestEncryptionEnabled: true,
        transitEncryptionEnabled: true,
        transitEncryptionMode: 'required',
        port: 6379,
      }
    );

    // DynamoDB table for customer risk profiles
    const customerRiskTable = new dynamodb.Table(
      this,
      `CustomerRiskProfiles-${suffix}`,
      {
        partitionKey: {
          name: 'customerId',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        pointInTimeRecovery: false, // Disabled for cost
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Add GSI for risk level queries
    customerRiskTable.addGlobalSecondaryIndex({
      indexName: 'riskLevel-index',
      partitionKey: { name: 'riskLevel', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'lastUpdated', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Triage Lambda Function
    const triageLambda = new NodejsFunction(this, `TriageLambda-${suffix}`, {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambdas/triage/index.ts'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512, // Reduced for cost optimization
      environment: {
        REDIS_ENDPOINT: redisCluster.attrPrimaryEndPointAddress,
        REDIS_PORT: redisCluster.attrPrimaryEndPointPort,
        VERIFIED_PERMISSIONS_POLICY_STORE_ID:
          props.verifiedPermissionsPolicyStoreId,
        SAGEMAKER_ENDPOINT_NAME: props.sagemakerEndpointName,
        CUSTOMER_RISK_TABLE: customerRiskTable.tableName,
        STEP_FUNCTION_ARN: '', // Will be set after creating Step Function
      },
      bundling: {
        externalModules: ['@aws-sdk/*'],
        minify: true,
        sourceMap: false,
      },
    });

    // Note: Lambda is not in VPC to avoid NAT Gateway costs
    // In production, you would place Lambda in VPC with NAT Gateway or VPC endpoints

    // IAM permissions for Triage Lambda
    triageLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'verifiedpermissions:IsAuthorized',
          'verifiedpermissions:BatchIsAuthorized',
        ],
        resources: ['*'],
      })
    );

    triageLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sagemaker:InvokeEndpoint'],
        resources: [
          `arn:aws:sagemaker:${this.region}:${this.account}:endpoint/${props.sagemakerEndpointName}`,
        ],
      })
    );

    customerRiskTable.grantReadData(triageLambda);

    // Add Kinesis event source to Triage Lambda
    triageLambda.addEventSource(
      new kinesisEventSources.KinesisEventSource(this.transactionStream, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 10, // Reduced for testing
        maxBatchingWindow: cdk.Duration.seconds(1),
        parallelizationFactor: 1, // Reduced for cost
        reportBatchItemFailures: true,
        retryAttempts: 3,
      })
    );

    // ==================== WARM PATH ====================

    // Neptune Graph Database for relationship analysis
    const neptuneSubnetGroup = new neptune.CfnDBSubnetGroup(
      this,
      `NeptuneSubnetGroup-${suffix}`,
      {
        dbSubnetGroupDescription: 'Subnet group for Neptune',
        subnetIds: this.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }).subnetIds,
      }
    );

    const neptuneSecurityGroup = new ec2.SecurityGroup(
      this,
      `NeptuneSecurityGroup-${suffix}`,
      {
        vpc: this.vpc,
        description: 'Security group for Neptune cluster',
        allowAllOutbound: false,
      }
    );

    const neptuneCluster = new neptune.CfnDBCluster(
      this,
      `NeptuneCluster-${suffix}`,
      {
        dbClusterIdentifier: `aml-neptune-${suffix}`,
        dbSubnetGroupName: neptuneSubnetGroup.ref,
        vpcSecurityGroupIds: [neptuneSecurityGroup.securityGroupId],
        storageEncrypted: true,
        iamAuthEnabled: true,
        deletionProtection: false,
        serverlessScalingConfiguration: {
          minCapacity: 2.5,
          maxCapacity: 4.5,
        },
      }
    );

    // Aurora Serverless v2 for cost optimization
    const auroraCluster = new rds.DatabaseCluster(
      this,
      `AmlRulesDb-${suffix}`,
      {
        clusterIdentifier: `aml-aurora-${suffix}`,
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_3,
        }),
        serverlessV2MinCapacity: 0.5,
        serverlessV2MaxCapacity: 1,
        writer: rds.ClusterInstance.serverlessV2(`AuroraWriter-${suffix}`, {
          instanceIdentifier: `aml-aurora-writer-${suffix}`,
        }),
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        defaultDatabaseName: 'amlrules',
        storageEncrypted: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        deletionProtection: false,
      }
    );

    // Athena Workgroup for queries
    const athenaWorkgroup = new athena.CfnWorkGroup(
      this,
      `AmlAthenaWorkgroup-${suffix}`,
      {
        name: `aml-investigation-workgroup-${suffix}`,
        workGroupConfiguration: {
          resultConfiguration: {
            outputLocation: `s3://${athenaResultsBucket.bucketName}/athena-results/`,
            encryptionConfiguration: {
              encryptionOption: 'SSE_S3',
            },
          },
          enforceWorkGroupConfiguration: true,
          publishCloudWatchMetricsEnabled: true,
          bytesScannedCutoffPerQuery: 1099511627776, // 1TB limit per query
        },
      }
    );

    // Lambda for scoring
    const scoringLambda = new NodejsFunction(this, `ScoringLambda-${suffix}`, {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, 'lambdas/scoring/index.ts'),
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        AURORA_SECRET_ARN: auroraCluster.secret!.secretArn,
        AURORA_CLUSTER_ARN: auroraCluster.clusterArn,
      },
    });

    auroraCluster.grantDataApiAccess(scoringLambda);

    // Lambda for Bedrock summarization
    const bedrockSummarizerLambda = new NodejsFunction(
      this,
      `BedrockSummarizerLambda-${suffix}`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambdas/bedrock-summarizer/index.ts'),
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        environment: {
          BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
        },
      }
    );

    bedrockSummarizerLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['bedrock:InvokeModel'],
        resources: [
          `arn:aws:bedrock:${this.region}::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0`,
        ],
      })
    );

    // Step Functions State Machine
    // Define Neptune query task as a Pass state (mock)
    // Note: CallAwsService for neptunedata is not available in this region
    const neptuneQueryTask = new stepfunctions.Pass(
      this,
      `QueryNeptune-${suffix}`,
      {
        result: stepfunctions.Result.fromObject({
          neptuneResults: {
            status: 'success',
            message: 'Neptune query placeholder - not executed',
          },
        }),
        resultPath: '$.neptuneResults',
      }
    );

    // Define Athena query task
    const athenaQueryTask = new sfnTasks.AthenaStartQueryExecution(
      this,
      `QueryAthena-${suffix}`,
      {
        queryString: stepfunctions.JsonPath.stringAt('$.athenaQuery'),
        queryExecutionContext: {
          databaseName: 'aml_transactions',
        },
        resultConfiguration: {
          outputLocation: {
            bucketName: athenaResultsBucket.bucketName,
            objectKey: 'athena-results',
          },
        },
        workGroup: athenaWorkgroup.name,
      }
    );

    // Define get Athena results task
    const getAthenaResults = new sfnTasks.AthenaGetQueryResults(
      this,
      `GetAthenaResults-${suffix}`,
      {
        queryExecutionId: stepfunctions.JsonPath.stringAt('$.QueryExecutionId'),
      }
    );

    // Parallel state for Neptune and Athena queries
    const parallelQueries = new stepfunctions.Parallel(
      this,
      `ParallelInvestigation-${suffix}`
    )
      .branch(athenaQueryTask.next(getAthenaResults))
      .branch(neptuneQueryTask);

    // Scoring Lambda invocation
    const scoringTask = new sfnTasks.LambdaInvoke(
      this,
      `CalculateRiskScore-${suffix}`,
      {
        lambdaFunction: scoringLambda,
        outputPath: '$.Payload',
      }
    );

    // ==================== ACTION PATH ====================

    // API Gateway for SAR filing
    const sarApi = new apigateway.RestApi(this, `SarFilingApi-${suffix}`, {
      restApiName: `SAR Filing API ${suffix}`,
      description: 'API for filing Suspicious Activity Reports',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
    });

    // Lambda for SAR filing
    const sarFilingLambda = new NodejsFunction(
      this,
      `SarFilingLambda-${suffix}`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambdas/sar-filing/index.ts'),
        timeout: cdk.Duration.seconds(30),
      }
    );

    const sarResource = sarApi.root.addResource('sar');
    sarResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(sarFilingLambda)
    );

    // OpenSearch Serverless for evidence archival
    const opensearchSecurityPolicy = new opensearchserverless.CfnSecurityPolicy(
      this,
      `OpenSearchSecurityPolicy-${suffix}`,
      {
        name: `aml-sec-${suffix}`,
        type: 'encryption',
        policy: JSON.stringify({
          Rules: [
            {
              ResourceType: 'collection',
              Resource: [`collection/aml-evid-${suffix}`],
            },
          ],
          AWSOwnedKey: true,
        }),
      }
    );

    const opensearchNetworkPolicy = new opensearchserverless.CfnSecurityPolicy(
      this,
      `OpenSearchNetworkPolicy-${suffix}`,
      {
        name: `aml-net-${suffix}`,
        type: 'network',
        policy: JSON.stringify([
          {
            Rules: [
              {
                ResourceType: 'collection',
                Resource: [`collection/aml-evid-${suffix}`],
              },
              {
                ResourceType: 'dashboard',
                Resource: [`collection/aml-evid-${suffix}`],
              },
            ],
            AllowFromPublic: true,
          },
        ]),
      }
    );

    const opensearchCollection = new opensearchserverless.CfnCollection(
      this,
      `EvidenceCollection-${suffix}`,
      {
        name: `aml-evid-${suffix}`,
        type: 'SEARCH',
        description: 'Collection for archiving AML investigation evidence',
      }
    );

    opensearchCollection.addDependency(opensearchSecurityPolicy);
    opensearchCollection.addDependency(opensearchNetworkPolicy);

    // Lambda for evidence archiving
    const evidenceArchiverLambda = new NodejsFunction(
      this,
      `EvidenceArchiverLambda-${suffix}`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, 'lambdas/evidence-archiver/index.ts'),
        timeout: cdk.Duration.seconds(60),
        environment: {
          OPENSEARCH_ENDPOINT: opensearchCollection.attrCollectionEndpoint,
          OPENSEARCH_COLLECTION: opensearchCollection.name!,
        },
      }
    );

    evidenceArchiverLambda.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['aoss:*'],
        resources: [`arn:aws:aoss:${this.region}:${this.account}:collection/*`],
      })
    );

    // Security Hub custom action
    const securityHubAction = new stepfunctions.CustomState(
      this,
      `AlertSecurityHub-${suffix}`,
      {
        stateJson: {
          Type: 'Task',
          Resource: 'arn:aws:states:::aws-sdk:securityhub:batchImportFindings',
          Parameters: {
            Findings: [
              {
                SchemaVersion: '2018-10-08',
                Id: stepfunctions.JsonPath.stringAt('$.investigationId'),
                ProductArn: `arn:aws:securityhub:${this.region}:${this.account}:product/${this.account}/default`,
                GeneratorId: 'aml-monitoring-system',
                AwsAccountId: this.account,
                Types: ['Sensitive Data Identifications/Financial'],
                CreatedAt: stepfunctions.JsonPath.stringAt(
                  '$$.State.EnteredTime'
                ),
                UpdatedAt: stepfunctions.JsonPath.stringAt(
                  '$$.State.EnteredTime'
                ),
                Severity: {
                  Label: 'HIGH',
                  Normalized: 80,
                },
                Title: 'Potential Money Laundering Activity Detected',
                Description: stepfunctions.JsonPath.stringAt('$.summary'),
              },
            ],
          },
        },
      }
    );

    // Action steps parallel execution
    const actionSteps = new stepfunctions.Parallel(
      this,
      `ExecuteActions-${suffix}`
    )
      .branch(
        new sfnTasks.LambdaInvoke(this, `FileSAR-${suffix}`, {
          lambdaFunction: sarFilingLambda,
        })
      )
      .branch(securityHubAction)
      .branch(
        new sfnTasks.LambdaInvoke(this, `ArchiveEvidence-${suffix}`, {
          lambdaFunction: evidenceArchiverLambda,
        })
      );

    // Create final state machine with all steps
    const completeWorkflow = new stepfunctions.StateMachine(
      this,
      `CompleteAmlWorkflow-${suffix}`,
      {
        definitionBody: stepfunctions.DefinitionBody.fromChainable(
          parallelQueries.next(scoringTask).next(
            new stepfunctions.Choice(this, `CheckHighRisk-${suffix}`)
              .when(
                stepfunctions.Condition.numberGreaterThanEquals(
                  '$.riskScore',
                  80
                ),
                new sfnTasks.LambdaInvoke(this, `GenerateSummary-${suffix}`, {
                  lambdaFunction: bedrockSummarizerLambda,
                  resultPath: '$.summary',
                }).next(actionSteps)
              )
              .otherwise(
                new stepfunctions.Pass(this, `NoActionRequired-${suffix}`)
              )
          )
        ),
        tracingEnabled: true,
        logs: {
          destination: new logs.LogGroup(this, `StepFunctionLogs-${suffix}`, {
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }),
          level: stepfunctions.LogLevel.ALL,
        },
      }
    );

    // Grant permissions to complete workflow
    completeWorkflow.grantStartExecution(triageLambda);
    athenaResultsBucket.grantReadWrite(completeWorkflow);

    completeWorkflow.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['athena:*'],
        resources: ['*'],
      })
    );

    // Update Triage Lambda environment variable
    triageLambda.addEnvironment(
      'STEP_FUNCTION_ARN',
      completeWorkflow.stateMachineArn
    );

    // ==================== STACK OUTPUTS FOR INTEGRATION TESTING ====================

    // Hot Path Outputs
    new cdk.CfnOutput(this, `TransactionStreamName-${suffix}`, {
      value: this.transactionStream.streamName,
      description: 'Kinesis stream name for transaction events',
      exportName: `aml-transaction-stream-name-${suffix}`,
    });

    new cdk.CfnOutput(this, `TransactionStreamArn-${suffix}`, {
      value: this.transactionStream.streamArn,
      description: 'Kinesis stream ARN for transaction events',
      exportName: `aml-transaction-stream-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, `CustomerRiskTableName-${suffix}`, {
      value: customerRiskTable.tableName,
      description: 'DynamoDB table name for customer risk profiles',
      exportName: `aml-customer-risk-table-${suffix}`,
    });

    new cdk.CfnOutput(this, `CustomerRiskTableArn-${suffix}`, {
      value: customerRiskTable.tableArn,
      description: 'DynamoDB table ARN for customer risk profiles',
      exportName: `aml-customer-risk-table-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, `RedisEndpoint-${suffix}`, {
      value: redisCluster.attrPrimaryEndPointAddress,
      description: 'ElastiCache Redis primary endpoint for velocity checks',
      exportName: `aml-redis-endpoint-${suffix}`,
    });

    new cdk.CfnOutput(this, `RedisPort-${suffix}`, {
      value: redisCluster.attrPrimaryEndPointPort,
      description: 'ElastiCache Redis port',
      exportName: `aml-redis-port-${suffix}`,
    });

    new cdk.CfnOutput(this, `TriageLambdaName-${suffix}`, {
      value: triageLambda.functionName,
      description: 'Triage Lambda function name',
      exportName: `aml-triage-lambda-${suffix}`,
    });

    new cdk.CfnOutput(this, `TriageLambdaArn-${suffix}`, {
      value: triageLambda.functionArn,
      description: 'Triage Lambda function ARN',
      exportName: `aml-triage-lambda-arn-${suffix}`,
    });

    // Warm Path Outputs
    new cdk.CfnOutput(this, `StepFunctionArn-${suffix}`, {
      value: completeWorkflow.stateMachineArn,
      description:
        'Step Functions state machine ARN for investigation workflow',
      exportName: `aml-stepfunction-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, `StepFunctionName-${suffix}`, {
      value: completeWorkflow.stateMachineName,
      description: 'Step Functions state machine name',
      exportName: `aml-stepfunction-name-${suffix}`,
    });

    new cdk.CfnOutput(this, `AthenaWorkgroupName-${suffix}`, {
      value: athenaWorkgroup.name!,
      description: 'Athena workgroup name for historical analysis',
      exportName: `aml-athena-workgroup-${suffix}`,
    });

    new cdk.CfnOutput(this, `AthenaResultsBucketName-${suffix}`, {
      value: athenaResultsBucket.bucketName,
      description: 'S3 bucket name for Athena query results',
      exportName: `aml-athena-bucket-${suffix}`,
    });

    new cdk.CfnOutput(this, `NeptuneClusterEndpoint-${suffix}`, {
      value: neptuneCluster.attrEndpoint,
      description: 'Neptune cluster endpoint for relationship analysis',
      exportName: `aml-neptune-endpoint-${suffix}`,
    });

    new cdk.CfnOutput(this, `NeptuneClusterPort-${suffix}`, {
      value: neptuneCluster.attrPort,
      description: 'Neptune cluster port',
      exportName: `aml-neptune-port-${suffix}`,
    });

    new cdk.CfnOutput(this, `NeptuneClusterResourceId-${suffix}`, {
      value: neptuneCluster.attrClusterResourceId,
      description: 'Neptune cluster resource ID',
      exportName: `aml-neptune-resource-id-${suffix}`,
    });

    new cdk.CfnOutput(this, `AuroraClusterEndpoint-${suffix}`, {
      value: auroraCluster.clusterEndpoint.hostname,
      description: 'Aurora cluster endpoint for AML rules database',
      exportName: `aml-aurora-endpoint-${suffix}`,
    });

    new cdk.CfnOutput(this, `AuroraClusterArn-${suffix}`, {
      value: auroraCluster.clusterArn,
      description: 'Aurora cluster ARN',
      exportName: `aml-aurora-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, `AuroraSecretArn-${suffix}`, {
      value: auroraCluster.secret!.secretArn,
      description: 'Aurora database credentials secret ARN',
      exportName: `aml-aurora-secret-${suffix}`,
    });

    new cdk.CfnOutput(this, `ScoringLambdaName-${suffix}`, {
      value: scoringLambda.functionName,
      description: 'Scoring Lambda function name',
      exportName: `aml-scoring-lambda-${suffix}`,
    });

    new cdk.CfnOutput(this, `ScoringLambdaArn-${suffix}`, {
      value: scoringLambda.functionArn,
      description: 'Scoring Lambda function ARN',
      exportName: `aml-scoring-lambda-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, `BedrockSummarizerLambdaName-${suffix}`, {
      value: bedrockSummarizerLambda.functionName,
      description: 'Bedrock summarizer Lambda function name',
      exportName: `aml-bedrock-lambda-${suffix}`,
    });

    new cdk.CfnOutput(this, `BedrockSummarizerLambdaArn-${suffix}`, {
      value: bedrockSummarizerLambda.functionArn,
      description: 'Bedrock summarizer Lambda function ARN',
      exportName: `aml-bedrock-lambda-arn-${suffix}`,
    });

    // Action Path Outputs
    new cdk.CfnOutput(this, `SarApiUrl-${suffix}`, {
      value: sarApi.url,
      description: 'API Gateway URL for SAR filing endpoint',
      exportName: `aml-sar-api-url-${suffix}`,
    });

    new cdk.CfnOutput(this, `SarApiId-${suffix}`, {
      value: sarApi.restApiId,
      description: 'API Gateway REST API ID',
      exportName: `aml-sar-api-id-${suffix}`,
    });

    new cdk.CfnOutput(this, `SarFilingLambdaName-${suffix}`, {
      value: sarFilingLambda.functionName,
      description: 'SAR filing Lambda function name',
      exportName: `aml-sar-lambda-${suffix}`,
    });

    new cdk.CfnOutput(this, `SarFilingLambdaArn-${suffix}`, {
      value: sarFilingLambda.functionArn,
      description: 'SAR filing Lambda function ARN',
      exportName: `aml-sar-lambda-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, `OpenSearchCollectionEndpoint-${suffix}`, {
      value: opensearchCollection.attrCollectionEndpoint,
      description:
        'OpenSearch Serverless collection endpoint for evidence archival',
      exportName: `aml-opensearch-endpoint-${suffix}`,
    });

    new cdk.CfnOutput(this, `OpenSearchCollectionArn-${suffix}`, {
      value: opensearchCollection.attrArn,
      description: 'OpenSearch Serverless collection ARN',
      exportName: `aml-opensearch-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, `OpenSearchCollectionName-${suffix}`, {
      value: opensearchCollection.name!,
      description: 'OpenSearch Serverless collection name',
      exportName: `aml-opensearch-name-${suffix}`,
    });

    new cdk.CfnOutput(this, `EvidenceArchiverLambdaName-${suffix}`, {
      value: evidenceArchiverLambda.functionName,
      description: 'Evidence archiver Lambda function name',
      exportName: `aml-evidence-lambda-${suffix}`,
    });

    new cdk.CfnOutput(this, `EvidenceArchiverLambdaArn-${suffix}`, {
      value: evidenceArchiverLambda.functionArn,
      description: 'Evidence archiver Lambda function ARN',
      exportName: `aml-evidence-lambda-arn-${suffix}`,
    });

    // Infrastructure Outputs
    new cdk.CfnOutput(this, `VpcId-${suffix}`, {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `aml-vpc-id-${suffix}`,
    });

    new cdk.CfnOutput(this, `Region-${suffix}`, {
      value: this.region,
      description: 'AWS Region',
      exportName: `aml-region-${suffix}`,
    });
  }
}
