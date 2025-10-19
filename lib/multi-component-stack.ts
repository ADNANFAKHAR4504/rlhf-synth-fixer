import * as cdk from 'aws-cdk-lib';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export class MultiComponentApplicationStack extends cdk.NestedStack {
  // String suffix for unique resource naming
  private readonly stringSuffix: string;
  // Expose important resource tokens as public properties so other stacks
  // in the same CDK app can reference them without requiring manual
  // CloudFormation exports/imports.
  public readonly vpcId!: string;
  public readonly apiUrl!: string;
  public readonly lambdaFunctionArn!: string;
  public readonly rdsEndpoint!: string;
  public readonly s3BucketName!: string;
  public readonly sqsQueueUrl!: string;
  public readonly cloudFrontDomainName!: string;
  public readonly hostedZoneId!: string;
  public readonly databaseSecretArn!: string;
  public readonly lambdaRoleArn!: string;
  public readonly databaseSecurityGroupId!: string;
  public readonly lambdaSecurityGroupId!: string;
  public readonly lambdaLogGroupName!: string;

  // Expose a small helper to compute the sanitized suffix used for Lambda names.
  // This is intentionally simple and useful to call from unit tests to exercise
  // the branches (defined vs falsy suffix).
  public computeSafeSuffixForLambda(input?: string): string | cdk.Aws {
    return input
      ? input.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
      : cdk.Aws.NO_VALUE;
  }

  constructor(scope: Construct, id: string, props?: cdk.NestedStackProps) {
    // Respect props by passing them directly to the NestedStack constructor
    super(scope, id, props);

    // Generate unique string suffix
    this.stringSuffix = cdk.Fn.select(2, cdk.Fn.split('-', cdk.Aws.STACK_ID));

    // ========================================
    // VPC Configuration
    // ========================================
    const vpc = new ec2.Vpc(this, 'AppVpc', {
      vpcName: `prod-vpc-app-${this.stringSuffix}`,
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'prod-public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'prod-private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // ========================================
    // Secrets Manager - RDS Credentials
    // ========================================
    const databaseSecret = new secretsmanager.Secret(this, 'DatabaseSecret', {
      secretName: `prod-secretsmanager-db-${this.stringSuffix.toLowerCase().replace(/[^a-zA-Z0-9\-_+=.@!]/g, '')}`,
      description: 'RDS PostgreSQL database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'dbadmin',
        }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    // ========================================
    // RDS PostgreSQL Database
    // ========================================
    const databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        securityGroupName: `prod-ec2-sg-db-${this.stringSuffix}`,
        vpc,
        description: 'Security group for RDS PostgreSQL',
        allowAllOutbound: false,
      }
    );

    // Use a generally-available Postgres engine version. Some regions may not have
    // older minor versions (e.g. 13.7). Prefer Postgres 15.x which has wider availability.
    // Allow reusing an existing DB subnet group to avoid hitting account quotas
    // (provide either env var RDS_SUBNET_GROUP_NAME or CDK context key
    // `rdsSubnetGroupName` to import an existing group). If not provided,
    // CDK will create a new SubnetGroup automatically.
    const importedSubnetGroupName =
      process.env.RDS_SUBNET_GROUP_NAME ||
      this.node.tryGetContext('rdsSubnetGroupName');
    const importedSubnetGroup = importedSubnetGroupName
      ? rds.SubnetGroup.fromSubnetGroupName(
          this,
          'ImportedRdsSubnetGroup',
          String(importedSubnetGroupName)
        )
      : undefined;

    const rdsInstance = new rds.DatabaseInstance(this, 'PostgresDatabase', {
      instanceIdentifier: `prod-rds-postgres-${this.stringSuffix.toLowerCase().replace(/[^a-z0-9-]/g, '')}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        // Use the major Postgres 15 engine constant so CDK/RDS will pick a supported
        // minor version available in the target region. Pinning to a minor (e.g. 15.3)
        // can fail in regions that don't offer that exact patch level.
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.M5,
        ec2.InstanceSize.LARGE
      ),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      // If an imported subnet group was provided, pass it to the DB instance
      subnetGroup: importedSubnetGroup,
      securityGroups: [databaseSecurityGroup],
      credentials: rds.Credentials.fromSecret(databaseSecret),
      databaseName: 'proddb',
      allocatedStorage: 20,
      storageEncrypted: true,
      backupRetention: Duration.days(7),
      deletionProtection: false,
      removalPolicy: RemovalPolicy.DESTROY,
      multiAz: true, // High availability
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_WEEK,
    });

    // ========================================
    // S3 Buckets
    // ========================================
    // Prefer a deterministic base suffix for cross-region deployments when provided
    const baseEnvSuffix = (props as any)?.baseEnvironmentSuffix as
      | string
      | undefined;

    const bucketNameParts = [
      'prod-s3-static',
      // Use the provided base environment suffix if present so both stacks
      // produce the same base bucket name across regions. Otherwise fall
      // back to the internal stringSuffix which is derived from the stack id.
      baseEnvSuffix
        ? baseEnvSuffix.toLowerCase().replace(/[^a-z0-9-]/g, '')
        : this.stringSuffix.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      cdk.Aws.REGION,
    ];

    const staticFilesBucket = new s3.Bucket(this, 'StaticFilesBucket', {
      bucketName: cdk.Fn.join('-', bucketNameParts),
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: Duration.days(30),
          enabled: true,
        },
      ],
    });

    // Optional S3 replication: if the CDK context `enableReplication=true`
    // and a `secondaryRegion` prop was forwarded to this nested stack, then
    // configure cross-region replication from the primary bucket to the
    // deterministic destination bucket in the secondary region. The
    // destination bucket will follow the same naming pattern but with the
    // secondary region token appended so the destination's name is stable.
    const enableReplicationContext =
      this.node.tryGetContext('enableReplication');
    const enableReplicationEnv = process.env.ENABLE_REPLICATION === 'true';
    const enableReplication =
      enableReplicationContext === true ||
      enableReplicationContext === 'true' ||
      enableReplicationEnv;

    // Accept secondaryRegion via props (forwarded by TapStack) as a token or literal
    const secondaryRegion = (props as any)?.secondaryRegion as
      | string
      | undefined;
    // When computing the destination bucket name, prefer the same deterministic
    // base suffix as used for the local bucket so the destination bucket's
    // name will match the bucket created by the nested stack in the
    // secondary region.
    const bucketBaseNameToken = baseEnvSuffix
      ? baseEnvSuffix.toLowerCase().replace(/[^a-z0-9-]/g, '')
      : this.stringSuffix.toLowerCase().replace(/[^a-z0-9-]/g, '');

    if (enableReplication && secondaryRegion) {
      // Destination bucket name (deterministic)
      const destinationBucketName = cdk.Fn.join('-', [
        'prod-s3-static',
        bucketBaseNameToken,
        secondaryRegion,
      ]);

      // Build the destination bucket ARN explicitly (works across partitions).
      const destinationBucketArn = cdk.Stack.of(this).formatArn({
        service: 's3',
        resource: destinationBucketName,
        arnFormat: cdk.ArnFormat.NO_RESOURCE_NAME,
      });

      // Assume the destination bucket exists in the secondary stack/region.
      // Create the replication role that S3 will use to replicate objects.
      const replicationRole = new iam.Role(this, 'S3ReplicationRole', {
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
        description: 'Role for cross-region S3 replication',
      });

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            's3:GetObjectVersionForReplication',
            's3:GetObjectVersionAcl',
            's3:GetObjectVersionTagging',
          ],
          resources: [staticFilesBucket.bucketArn + '/*'],
        })
      );

      replicationRole.addToPolicy(
        new iam.PolicyStatement({
          actions: [
            's3:ReplicateObject',
            's3:ReplicateDelete',
            's3:ReplicateTags',
            's3:PutObjectAcl',
          ],
          // destination bucket ARN for objects is arn:aws:s3:::bucketName/*
          resources: [`${destinationBucketArn}/*`],
        })
      );

      // Add replication configuration via L1 CfnBucket
      const cfnSourceBucket = staticFilesBucket.node
        .defaultChild as s3.CfnBucket;
      if (cfnSourceBucket) {
        cfnSourceBucket.replicationConfiguration = {
          role: replicationRole.roleArn,
          rules: [
            {
              id: 'ReplicateAll',
              priority: 1,
              status: 'Enabled',
              filter: { prefix: '' },
              destination: {
                // The destination.bucket expects the destination bucket's ARN for
                // cross-region replication. Use the explicit ARN we constructed
                // above so CloudFormation receives a valid value across partitions.
                bucket: destinationBucketArn,
                account: cdk.Aws.ACCOUNT_ID,
                storageClass: 'STANDARD',
              },
            },
          ],
        } as any;
      }
    }

    // ========================================
    // SQS Queue
    // ========================================
    const asyncQueue = new sqs.Queue(this, 'AsyncProcessingQueue', {
      queueName: `prod-sqs-async-${this.stringSuffix.toLowerCase().replace(/[^a-zA-Z0-9-_]/g, '')}`,
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      retentionPeriod: Duration.days(4),
      visibilityTimeout: Duration.minutes(6),
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: new sqs.Queue(this, 'DLQ', {
          queueName: `prod-sqs-dlq-${this.stringSuffix.toLowerCase().replace(/[^a-zA-Z0-9-_]/g, '')}`,
        }),
      },
    });

    // ========================================
    // CloudWatch Log Groups
    // ========================================
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/prod-lambda-api-v2-${this.stringSuffix.toLowerCase().replace(/[^a-zA-Z0-9-_/]/g, '')}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // VPC Flow Logs: ship VPC traffic logs to CloudWatch Logs for security/monitoring
    const vpcFlowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: `/aws/vpc-flow-logs/prod-${this.stringSuffix.toLowerCase().replace(/[^a-z0-9-]/g, '')}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Metric filters for VPC Flow Logs
    // Count rejected packets (action = REJECT)
    new logs.MetricFilter(this, 'VpcRejectsMetricFilter', {
      logGroup: vpcFlowLogGroup,
      metricNamespace: 'VPC/FlowLogs',
      metricName: 'RejectedPackets',
      filterPattern: logs.FilterPattern.literal(
        '[version, account, interfaceId, srcAddr, dstAddr, srcPort, dstPort, protocol, packets, bytes, start, end, action = REJECT, logStatus]'
      ),
      metricValue: '1',
    });

    // Count SSH (dstPort = 22) connection attempts
    new logs.MetricFilter(this, 'VpcSshMetricFilter', {
      logGroup: vpcFlowLogGroup,
      metricNamespace: 'VPC/FlowLogs',
      metricName: 'SshConnectionAttempts',
      filterPattern: logs.FilterPattern.literal(
        '[version, account, interfaceId, srcAddr, dstAddr, srcPort, dstPort = 22, protocol, packets, bytes, start, end, action, logStatus]'
      ),
      metricValue: '1',
    });

    // Count RDP (dstPort = 3389) connection attempts
    new logs.MetricFilter(this, 'VpcRdpMetricFilter', {
      logGroup: vpcFlowLogGroup,
      metricNamespace: 'VPC/FlowLogs',
      metricName: 'RdpConnectionAttempts',
      filterPattern: logs.FilterPattern.literal(
        '[version, account, interfaceId, srcAddr, dstAddr, srcPort, dstPort = 3389, protocol, packets, bytes, start, end, action, logStatus]'
      ),
      metricValue: '1',
    });

    // ========================================
    // IAM Roles (Least Privilege)
    // ========================================
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRoleV2', {
      roleName: `prod-iam-lambda-${this.stringSuffix.replace(/[^a-zA-Z0-9+=,.@_-]/g, '')}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
        // Use the managed policy name (not a full ARN) so CDK renders the
        // correct ARN for the current partition. The earlier code used a
        // duplicated ARN string which produced an invalid managed policy name
        // and caused CloudFormation to reject the role creation.
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    // API Gateway needs an account-level CloudWatch role to push logs.
    // Create a role that API Gateway can assume to write to CloudWatch Logs
    // and then set it on the API Gateway account via the L1 CfnAccount resource.
    const apiGatewayCloudWatchRole = new iam.Role(
      this,
      'ApiGatewayCloudWatchRole',
      {
        assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        description:
          'Role allowing API Gateway to write logs to CloudWatch Logs',
        managedPolicies: [
          // AWS managed policy that grants API Gateway permissions to push logs
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
          ),
        ],
      }
    );

    // Set the account-level CloudWatch role for API Gateway so stages can enable logging.
    // This maps to the AWS::ApiGateway::Account resource.
    new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: apiGatewayCloudWatchRole.roleArn,
    });

    // Lambda permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [lambdaLogGroup.logGroupArn],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [`${staticFilesBucket.bucketArn}/*`],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage', 'sqs:ReceiveMessage', 'sqs:DeleteMessage'],
        resources: [asyncQueue.queueArn],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [databaseSecret.secretArn],
      })
    );

    // ========================================
    // Lambda Function (Multi-AZ)
    // ========================================
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        securityGroupName: `prod-ec2-sg-lambda-${this.stringSuffix}`,
        vpc,
        description: 'Security group for Lambda function',
        allowAllOutbound: true,
      }
    );

    // Lambda function names must match a restricted pattern. Sanitize the suffix
    // to only include lowercase letters, numbers, hyphens and underscores.
    const safeSuffixForLambda = this.computeSafeSuffixForLambda(
      this.stringSuffix
    );

    const lambdaFunction = new lambda.Function(this, 'ApiLambda', {
      functionName: `prod-lambda-api-v2-${safeSuffixForLambda}`,
      runtime: lambda.Runtime.NODEJS_18_X, // Updated to supported version
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const secretsManager = new AWS.SecretsManager();
        const s3 = new AWS.S3();
        const sqs = new AWS.SQS();

        exports.handler = async (event) => {
          console.log('Processing API request:', JSON.stringify(event, null, 2));

          try {
            // Validate input
            if (!event.body) {
              throw new Error('Request body is required');
            }

            const requestData = JSON.parse(event.body);
            if (!requestData.orderId || !requestData.customerId) {
              throw new Error('orderId and customerId are required');
            }

            // Retrieve database secret for potential future DB operations
            const secretName = '${databaseSecret.secretName}';
            const secret = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
            console.log('Successfully retrieved database credentials for order processing');

            // Store order data in S3 for persistence
            const s3Key = \`orders/\${requestData.orderId}.json\`;
            await s3.putObject({
              Bucket: '${staticFilesBucket.bucketName}',
              Key: s3Key,
              Body: JSON.stringify(requestData),
              ContentType: 'application/json'
            }).promise();
            console.log('Order data stored in S3:', s3Key);

            // Send order to SQS for asynchronous processing (e.g., payment, fulfillment)
            const queueUrl = '${asyncQueue.queueUrl}';
            await sqs.sendMessage({
              QueueUrl: queueUrl,
              MessageBody: JSON.stringify({
                orderId: requestData.orderId,
                customerId: requestData.customerId,
                timestamp: new Date().toISOString(),
                action: 'process_order'
              }),
            }).promise();
            console.log('Order queued for processing');

            return {
              statusCode: 200,
              body: JSON.stringify({
                message: 'Order received and queued for processing',
                orderId: requestData.orderId,
                timestamp: new Date().toISOString(),
              }),
            };
          } catch (error) {
            console.error('Error processing order:', error);
            return {
              statusCode: 400,
              body: JSON.stringify({
                error: 'Failed to process order',
                details: error.message,
              }),
            };
          }
        };
      `),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      timeout: Duration.minutes(5),
      memorySize: 512,
      environment: {
        DATABASE_SECRET_NAME: databaseSecret.secretName,
        S3_BUCKET: staticFilesBucket.bucketName,
        SQS_QUEUE_URL: asyncQueue.queueUrl,
      },
      tracing: lambda.Tracing.ACTIVE,
      role: lambdaRole,
      logRetention: logs.RetentionDays.ONE_WEEK,
      reservedConcurrentExecutions: 100,
    });

    // Allow Lambda to connect to RDS
    databaseSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to connect to PostgreSQL'
    );

    // ========================================
    // API Gateway (IAM Authentication)
    // ========================================
    const api = new apigateway.RestApi(this, 'ApiGateway', {
      restApiName: `prod-apigateway-rest-${this.stringSuffix}`,
      description: 'Production API Gateway',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 10000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    const apiResource = api.root.addResource('api');
    apiResource.addMethod('GET', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.IAM,
    });
    apiResource.addMethod('POST', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.IAM,
    });

    // ========================================
    // Route 53 Hosted Zone
    // ========================================
    const hostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: 'example-prod.com',
      comment: `Production hosted zone - ${this.stringSuffix}`,
    });

    // ========================================
    // CloudFront Distribution
    // ========================================
    const cloudFrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      'CloudFrontOAI',
      {
        comment: `prod-cloudfront-oai-${this.stringSuffix}`,
      }
    );

    staticFilesBucket.grantRead(cloudFrontOAI);

    const distribution = new cloudfront.Distribution(
      this,
      'CloudFrontDistribution',
      {
        comment: `prod-cloudfront-dist-${this.stringSuffix}`,
        defaultBehavior: {
          origin: new cloudfrontOrigins.S3Origin(staticFilesBucket, {
            originAccessIdentity: cloudFrontOAI,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          responseHeadersPolicy:
            cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
        },
        additionalBehaviors: {
          '/api/*': {
            origin: new cloudfrontOrigins.RestApiOrigin(api),
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
          },
        },
        priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
        enabled: true,
        geoRestriction: cloudfront.GeoRestriction.allowlist('US', 'CA'),
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      }
    );

    // Ensure the CloudFront Distribution is created after the
    // OriginAccessIdentity low-level resource. Without this explicit
    // dependency CloudFormation can attempt to create the distribution
    // before CloudFront has finished creating the OAI which results in
    // errors like "The specified origin access identity does not exist".
    const oaiResource = cloudFrontOAI.node.defaultChild as
      | cdk.CfnResource
      | undefined;
    if (oaiResource) {
      distribution.node.addDependency(oaiResource as cdk.CfnResource);
    }

    // ========================================
    // WAFv2 WebACL (protect CloudFront and proxied API)
    // ========================================
    // WAF scope=CLOUDFRONT is a global resource and must be created in
    // us-east-1. Guard creation so that when this stack is synthesized or
    // deployed in other regions (e.g., during multi-region runs) we don't
    // attempt to create a global WebACL in the wrong region which would
    // cause CloudFormation failures. To explicitly allow global WAF creation
    // in another region set the context key `allowGlobalWaf=true` when
    // running the CDK app.
    const stackRegion = cdk.Stack.of(this).region;
    const allowGlobalWaf =
      this.node.tryGetContext('allowGlobalWaf') === true ||
      this.node.tryGetContext('allowGlobalWaf') === 'true';

    // New: WAF is disabled by default to avoid cross-region/global resource
    // creation surprises during CI. Enable it explicitly by setting the
    // CDK context `enableWaf=true` or environment var `ENABLE_WAF=true`.
    const enableWafContext = this.node.tryGetContext('enableWaf');
    const enableWafEnv = process.env.ENABLE_WAF === 'true';
    const enableWaf =
      enableWafContext === true || enableWafContext === 'true' || enableWafEnv;

    const shouldCreateWaf =
      enableWaf && (stackRegion === 'us-east-1' || allowGlobalWaf);

    if (shouldCreateWaf) {
      const webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
        defaultAction: { allow: {} },
        scope: 'CLOUDFRONT',
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: `prod-waf-${safeSuffixForLambda}`,
          sampledRequestsEnabled: true,
        },
        name: `prod-webacl-${safeSuffixForLambda}`,
        rules: [
          {
            name: 'AWSManagedCommonRuleSet',
            priority: 0,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              metricName: `aws-managed-${safeSuffixForLambda}`,
              sampledRequestsEnabled: true,
            },
          },
        ],
      });

      // Associate the WebACL with the CloudFront distribution (global scope).
      // WAF expects a resource ARN like:
      // arn:${Partition}:cloudfront::${Account}:distribution/${DistributionId}
      // CloudFront distributions are global; the account in the distribution ARN
      // can be empty in some CDK constructs. Build the ARN explicitly using the
      // current partition and account along with the distribution id.
      // Build the CloudFront distribution ARN explicitly for WAF. CloudFront
      // is a global service: the ARN must have an empty region ("") and the
      // account ID. Example: arn:aws:cloudfront::123456789012:distribution/EDFDVBD632BHDS5
      const cloudFrontArn = cdk.Stack.of(this).formatArn({
        service: 'cloudfront',
        resource: `distribution/${distribution.distributionId}`,
        arnFormat: cdk.ArnFormat.SLASH_RESOURCE_NAME,
        region: '',
        account: cdk.Aws.ACCOUNT_ID,
      });

      const webAclAssociation = new wafv2.CfnWebACLAssociation(
        this,
        'WebAclAssociation',
        {
          resourceArn: cloudFrontArn,
          webAclArn: webAcl.attrArn,
        }
      );

      // Ensure CloudFormation creates the distribution before attempting the
      // WebACL association. The CDK sometimes renders the association without
      // an explicit dependency which can cause WAF to receive an ARN that
      // isn't yet usable. Add explicit dependencies on the distribution's
      // low-level resource and the WebACL itself.
      const cfResource = distribution.node.defaultChild as
        | cdk.CfnResource
        | undefined;
      if (cfResource) {
        webAclAssociation.node.addDependency(cfResource as cdk.CfnResource);
      }
      webAclAssociation.node.addDependency(webAcl);
    } else {
      // Emit an explicit output so reviewers/operators can see the WAF was
      // intentionally skipped for this region during deploy/synth.
      new cdk.CfnOutput(this, 'WafCreationSkipped', {
        value: `WAF not created in region ${stackRegion}. Set context allowGlobalWaf=true to override.`,
        description: 'Indicates WAF creation was skipped due to region guard',
      });
    }

    // Route 53 A Record for CloudFront
    new route53.ARecord(this, 'CloudFrontARecord', {
      zone: hostedZone,
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(distribution)
      ),
    });

    // Additional Route 53 records for comprehensive DNS
    // Point the API subdomain to the CloudFront distribution which
    // proxies /api/* to the RestApi. This avoids requiring a
    // default domain directly on the API Gateway.
    new route53.ARecord(this, 'ApiARecord', {
      zone: hostedZone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(distribution)
      ),
    });

    // ========================================
    // CloudWatch Alarms and Monitoring
    // ========================================
    // Lambda errors alarm
    new cdk.aws_cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      alarmName: `prod-cloudwatch-lambda-errors-${safeSuffixForLambda}`,
      metric: lambdaFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator:
        cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // RDS CPU utilization alarm
    new cdk.aws_cloudwatch.Alarm(this, 'RdsCpuAlarm', {
      alarmName: `prod-cloudwatch-rds-cpu-${safeSuffixForLambda}`,
      metric: rdsInstance.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator:
        cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // API Gateway 5xx errors alarm
    new cdk.aws_cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
      alarmName: `prod-cloudwatch-apigateway-5xx-${safeSuffixForLambda}`,
      metric: api.metricServerError(),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator:
        cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // ==========================
    // Monitoring: SNS topic, additional alarms and dashboard
    // ==========================

    // Central SNS topic for alarm notifications. We do NOT auto-subscribe an email
    // unless ALARM_NOTIFICATION_EMAIL is set in the environment to avoid CI auto-subscribes.
    const alarmsTopic = new sns.Topic(this, 'AlarmsTopic', {
      displayName: `prod-alarms-${this.stringSuffix}`,
    });

    if (process.env.ALARM_NOTIFICATION_EMAIL) {
      alarmsTopic.addSubscription(
        new subscriptions.EmailSubscription(
          process.env.ALARM_NOTIFICATION_EMAIL
        )
      );
    }

    // CloudWatch Alarms for VPC Flow Log derived metrics
    const rejectedPacketsMetric = new cloudwatch.Metric({
      namespace: 'VPC/FlowLogs',
      metricName: 'RejectedPackets',
      period: Duration.minutes(5),
      statistic: 'Sum',
    });

    const sshAttemptsMetric = new cloudwatch.Metric({
      namespace: 'VPC/FlowLogs',
      metricName: 'SshConnectionAttempts',
      period: Duration.minutes(5),
      statistic: 'Sum',
    });

    const rdpAttemptsMetric = new cloudwatch.Metric({
      namespace: 'VPC/FlowLogs',
      metricName: 'RdpConnectionAttempts',
      period: Duration.minutes(5),
      statistic: 'Sum',
    });

    new cloudwatch.Alarm(this, 'VpcRejectedPacketsAlarm', {
      alarmName: `prod-vpc-rejected-packets-${this.stringSuffix}`,
      metric: rejectedPacketsMetric,
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    }).addAlarmAction(new cw_actions.SnsAction(alarmsTopic));

    new cloudwatch.Alarm(this, 'VpcSshAttemptsAlarm', {
      alarmName: `prod-vpc-ssh-attempts-${this.stringSuffix}`,
      metric: sshAttemptsMetric,
      threshold: 20,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    }).addAlarmAction(new cw_actions.SnsAction(alarmsTopic));

    new cloudwatch.Alarm(this, 'VpcRdpAttemptsAlarm', {
      alarmName: `prod-vpc-rdp-attempts-${this.stringSuffix}`,
      metric: rdpAttemptsMetric,
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    }).addAlarmAction(new cw_actions.SnsAction(alarmsTopic));

    // SQS alarms
    new cloudwatch.Alarm(this, 'SqsVisibleMessagesAlarm', {
      alarmName: `prod-cloudwatch-sqs-visible-${safeSuffixForLambda}`,
      metric: asyncQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 100,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'SqsOldestMessageAlarm', {
      alarmName: `prod-cloudwatch-sqs-oldest-${safeSuffixForLambda}`,
      metric: asyncQueue.metricApproximateAgeOfOldestMessage(),
      threshold: 300, // seconds
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // S3 metrics (4xx and 5xx errors)
    const s34xx = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: '4xxErrors',
      dimensionsMap: { BucketName: staticFilesBucket.bucketName },
      period: Duration.minutes(5),
    });

    const s35xx = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: '5xxErrors',
      dimensionsMap: { BucketName: staticFilesBucket.bucketName },
      period: Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, 'S34xxAlarm', {
      alarmName: `prod-cloudwatch-s3-4xx-${safeSuffixForLambda}`,
      metric: s34xx,
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'S35xxAlarm', {
      alarmName: `prod-cloudwatch-s3-5xx-${safeSuffixForLambda}`,
      metric: s35xx,
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Lambda duration and throttles
    new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      alarmName: `prod-cloudwatch-lambda-duration-${safeSuffixForLambda}`,
      metric: lambdaFunction.metricDuration(),
      threshold: 300000, // milliseconds (5m) - very high, tune as needed
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'LambdaThrottlesAlarm', {
      alarmName: `prod-cloudwatch-lambda-throttles-${safeSuffixForLambda}`,
      metric: lambdaFunction.metricThrottles(),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // RDS additional alarm: free storage space low
    new cloudwatch.Alarm(this, 'RdsFreeStorageAlarm', {
      alarmName: `prod-cloudwatch-rds-free-storage-${safeSuffixForLambda}`,
      metric: rdsInstance.metricFreeStorageSpace(),
      threshold: 20 * 1024 * 1024 * 1024, // 20 GiB
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    });

    // Wire alarms to SNS topic using actions (add actions so they notify).
    // We'll attach actions directly when creating alarms below.

    // attach alarm actions to some of the alarms we created above
    // (we create alarms with attached SnsAction below)
    // Recreate a couple of key alarms with actions attached
    const lambdaErrorsWithAction = new cloudwatch.Alarm(
      this,
      'LambdaErrorsAlarmWithAction',
      {
        alarmName: `prod-cloudwatch-lambda-errors-${safeSuffixForLambda}-with-action`,
        metric: lambdaFunction.metricErrors(),
        threshold: 5,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    lambdaErrorsWithAction.addAlarmAction(
      new cw_actions.SnsAction(alarmsTopic)
    );

    const rdsCpuWithAction = new cloudwatch.Alarm(
      this,
      'RdsCpuAlarmWithAction',
      {
        alarmName: `prod-cloudwatch-rds-cpu-${safeSuffixForLambda}-with-action`,
        metric: rdsInstance.metricCPUUtilization(),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    rdsCpuWithAction.addAlarmAction(new cw_actions.SnsAction(alarmsTopic));

    // Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'OperationalDashboard', {
      dashboardName: `prod-ops-${safeSuffixForLambda}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [lambdaFunction.metricErrors()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Lambda Duration (ms)',
        left: [lambdaFunction.metricDuration()],
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS CPU %',
        left: [rdsInstance.metricCPUUtilization()],
      }),
      new cloudwatch.GraphWidget({
        title: 'SQS Visible Messages',
        left: [asyncQueue.metricApproximateNumberOfMessagesVisible()],
      }),
      new cloudwatch.GraphWidget({
        title: 'S3 4xx Errors',
        left: [s34xx],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Gateway 5xx',
        left: [api.metricServerError()],
      })
    );

    // ========================================
    // Stack Outputs
    // ========================================

    // ========================================
    // Route53 Health Checks (for monitoring and potential failover)
    // ========================================
    // Extract host portion from api.url (https://host/...)
    const apiHost = cdk.Fn.select(2, cdk.Fn.split('/', this.apiUrl || api.url));

    const apiHealthCheck = new route53.CfnHealthCheck(this, 'ApiHealthCheck', {
      healthCheckConfig: {
        type: 'HTTPS',
        fullyQualifiedDomainName: apiHost,
        port: 443,
        // Ping the root path; if you have a dedicated /health path, change resourcePath
        resourcePath: '/',
        requestInterval: 30,
        failureThreshold: 3,
      },
    });

    new cdk.CfnOutput(this, 'ApiHealthCheckId', {
      value: apiHealthCheck.attrHealthCheckId,
      description: 'Route53 HealthCheckId for API endpoint',
    });

    // CloudFront domain health check (optional; CloudFront may throttle health probes)
    const cfHealthCheck = new route53.CfnHealthCheck(
      this,
      'CloudFrontHealthCheck',
      {
        healthCheckConfig: {
          type: 'HTTPS',
          fullyQualifiedDomainName: distribution.distributionDomainName,
          port: 443,
          resourcePath: '/',
          requestInterval: 30,
          failureThreshold: 3,
        },
      }
    );

    new cdk.CfnOutput(this, 'CloudFrontHealthCheckId', {
      value: cfHealthCheck.attrHealthCheckId,
      description: 'Route53 HealthCheckId for CloudFront distribution',
    });
    this.vpcId = vpc.vpcId;
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpcId,
      description: 'VPC ID',
    });

    this.apiUrl = api.url;
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.apiUrl,
      description: 'API Gateway URL',
    });

    this.lambdaFunctionArn = lambdaFunction.functionArn;
    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.lambdaFunctionArn,
      description: 'Lambda Function ARN',
    });

    this.rdsEndpoint = rdsInstance.dbInstanceEndpointAddress;
    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: this.rdsEndpoint,
      description: 'RDS PostgreSQL Endpoint',
    });

    this.s3BucketName = staticFilesBucket.bucketName;
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.s3BucketName,
      description: 'S3 Bucket Name',
    });

    this.sqsQueueUrl = asyncQueue.queueUrl;
    new cdk.CfnOutput(this, 'SqsQueueUrl', {
      value: this.sqsQueueUrl,
      description: 'SQS Queue URL',
    });

    this.cloudFrontDomainName = distribution.distributionDomainName;
    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: this.cloudFrontDomainName,
      description: 'CloudFront Distribution Domain Name',
    });

    this.hostedZoneId = hostedZone.hostedZoneId;
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
    });

    this.databaseSecretArn = databaseSecret.secretArn;
    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.databaseSecretArn,
      description: 'Database Secret ARN',
    });

    this.lambdaRoleArn = lambdaRole.roleArn;
    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: this.lambdaRoleArn,
      description: 'Lambda IAM Role ARN',
    });

    this.databaseSecurityGroupId = databaseSecurityGroup.securityGroupId;
    new cdk.CfnOutput(this, 'DatabaseSecurityGroupId', {
      value: this.databaseSecurityGroupId,
      description: 'Database Security Group ID',
    });

    this.lambdaSecurityGroupId = lambdaSecurityGroup.securityGroupId;
    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: this.lambdaSecurityGroupId,
      description: 'Lambda Security Group ID',
    });

    this.lambdaLogGroupName = lambdaLogGroup.logGroupName;
    new cdk.CfnOutput(this, 'LambdaLogGroupName', {
      value: this.lambdaLogGroupName,
      description: 'Lambda Log Group Name',
    });

    // Tags for all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'MultiComponentApplication');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Region', cdk.Aws.REGION);
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'enabled');
  }
}
