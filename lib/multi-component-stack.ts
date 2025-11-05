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
import path from 'path';
import canonicalResourceName from './name-utils';

export interface MultiComponentProps extends cdk.StackProps {
  secondaryRegion?: string;
  baseEnvironmentSuffix?: string;
  isPrimary?: boolean;
}

export class MultiComponentApplicationConstruct extends Construct {
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
  // Indicate whether WAF creation was skipped (so callers/stacks can emit
  // equivalent CFN outputs at the stack level if desired).
  public readonly wafWasSkipped: boolean = false;

  // Expose a small helper to compute the sanitized suffix used for Lambda names.
  // This is intentionally simple and useful to call from unit tests to exercise
  // the branches (defined vs falsy suffix).
  public computeSafeSuffixForLambda(
    input?: string | cdk.Token
  ): string | cdk.Aws {
    // If caller provided an explicit empty string, return Aws.NO_VALUE
    // so callers that embed the result into CFN-friendly names can
    // detect omitted values. If the input is a literal string, normalize
    // it; if it's a CDK token (e.g. derived from the stack id), pass the
    // token through unchanged.
    if (input === '') {
      return cdk.Aws.NO_VALUE;
    }

    if (typeof input === 'string' && input.length > 0) {
      return input.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    }

    // For token inputs (non-string), return as-is so downstream helpers
    // can include the token rather than attempting string ops on it.
    return input as unknown as cdk.Aws;
  }

  constructor(scope: Construct, id: string, props?: MultiComponentProps) {
    // Construct (not a NestedStack) - call Construct's constructor and
    // accept a superset of the previous NestedStack props so callers can
    // continue forwarding stack-like options.
    super(scope, id);

    // Read isPrimary flag forwarded from TapStack props. Default to true
    // to preserve single-region behavior.
    const isPrimary = props?.isPrimary;
    const createPrimaryResources =
      isPrimary === undefined || isPrimary === true;

    // Generate unique string suffix
    this.stringSuffix = cdk.Fn.select(2, cdk.Fn.split('-', cdk.Aws.STACK_ID));

    // Allow destructive removal only when explicitly enabled (CI or developer opt-in).
    // By default keep destructive actions off in production to avoid data loss.
    const allowDestroy =
      this.node.tryGetContext('allowDestroy') === true ||
      this.node.tryGetContext('allowDestroy') === 'true' ||
      process.env.ALLOW_DESTROY === 'true';

    // ========================================
    // VPC Configuration
    // ========================================
    const vpc = new ec2.Vpc(this, 'AppVpc', {
      // Use a consistent, human-friendly VPC name across code and docs.
      // Use the canonicalResourceName helper to ensure deterministic names.
      vpcName: canonicalResourceName(
        'prod-vpc-app',
        props?.baseEnvironmentSuffix as string | undefined,
        this.stringSuffix
      ) as string,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'), // Updated from deprecated cidr property
      maxAzs: 2,
      natGateways: 1, // Reduced from 2 to 1 to avoid EIP quota issues
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
      secretName: canonicalResourceName(
        'prod-secretsmanager-db',
        props?.baseEnvironmentSuffix as string | undefined,
        this.stringSuffix
      ) as string,
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
        securityGroupName: canonicalResourceName(
          'prod-ec2-sg-db',
          props?.baseEnvironmentSuffix as string | undefined,
          this.stringSuffix
        ) as string,
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
      // Disable deletion protection in this branch to allow test/deployment cleanup
      // (CI or developers can still control removalPolicy via the allowDestroy flag).
      // Set deletionProtection=false so the DB can be removed when necessary.
      deletionProtection: false,
      // Default to RETAIN for production; allowDestroy enables DESTROY for CI/dev
      removalPolicy: allowDestroy
        ? RemovalPolicy.DESTROY
        : RemovalPolicy.RETAIN,
      publiclyAccessible: false,
      multiAz: true, // High availability
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_WEEK,
    });

    // ========================================
    // S3 Buckets
    // ========================================
    // Prefer a deterministic base suffix for cross-region deployments when provided
    const baseEnvSuffix = props?.baseEnvironmentSuffix as string | undefined;

    // Use deterministic bucket names by default so cross-stack references
    // and deterministic output keys remain stable. This mirrors the prior
    // behavior and avoids surprises for pipeline deployments.

    const staticFilesBucketProps: s3.BucketProps = {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      // Default to RETAIN to protect production data; allowDestroy opt-in enables destructive cleanup
      removalPolicy: allowDestroy
        ? RemovalPolicy.DESTROY
        : RemovalPolicy.RETAIN,
      autoDeleteObjects: allowDestroy,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: Duration.days(30),
          enabled: true,
        },
        {
          id: 'abort-incomplete-multipart',
          abortIncompleteMultipartUploadAfter: Duration.days(7),
        },
      ],
    };

    // Always use a deterministic bucket name (was the default behavior).
    (staticFilesBucketProps as any).bucketName = canonicalResourceName(
      'prod-s3-static',
      baseEnvSuffix,
      this.stringSuffix
    ) as string;

    const staticFilesBucket = new s3.Bucket(
      this,
      'StaticFilesBucket',
      staticFilesBucketProps
    );

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
    const secondaryRegion = props?.secondaryRegion as string | undefined;
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
        } as s3.CfnBucket.ReplicationConfigurationProperty;
      }
    }

    // ========================================
    // SQS Queue
    // ========================================
    const asyncQueue = new sqs.Queue(this, 'AsyncProcessingQueue', {
      queueName: canonicalResourceName(
        'prod-sqs-async',
        props?.baseEnvironmentSuffix as string | undefined,
        this.stringSuffix
      ) as string,
      encryption: sqs.QueueEncryption.KMS_MANAGED,
      retentionPeriod: Duration.days(4),
      visibilityTimeout: Duration.minutes(6),
      deadLetterQueue: {
        maxReceiveCount: 3,
        queue: new sqs.Queue(this, 'DLQ', {
          queueName: canonicalResourceName(
            'prod-sqs-dlq',
            props?.baseEnvironmentSuffix as string | undefined,
            this.stringSuffix
          ) as string,
        }),
      },
    });

    // ========================================
    // CloudWatch Log Groups
    // ========================================
    // Use CDK's built-in unique resource naming - no explicit logGroupName
    // This lets CDK generate a unique name automatically
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // VPC Flow Logs: ship VPC traffic logs to CloudWatch Logs for security/monitoring
    const vpcFlowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: `/aws/vpc-flow-logs/${canonicalResourceName('prod-vpc', props?.baseEnvironmentSuffix as string | undefined, this.stringSuffix)}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Explicitly create the IAM Role that VPC Flow Logs will assume when
    // publishing to CloudWatch Logs. Relying on the L2 construct to generate
    // a role name can lead to CloudFormation lookup issues during updates.
    const vpcFlowLogRole = new iam.Role(this, 'VpcFlowLogRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      description: 'Role allowing VPC Flow Logs to publish to CloudWatch Logs',
    });

    // Allow the Flow Logs service to create streams and put events into the
    // selected log group.
    vpcFlowLogRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [vpcFlowLogGroup.logGroupArn],
      })
    );

    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        vpcFlowLogGroup,
        vpcFlowLogRole
      ),
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

    // Expose CloudWatch metrics for the VPC flow log derived metrics so
    // we can create alarms and dashboards from concrete Metric objects.
    // rejectedPacketsMetric intentionally not used directly; VPC rejects are
    // captured via MetricFilters and exposed if needed in future.

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

    // Central SNS topic for alarm notifications. We do NOT auto-subscribe an email
    // unless ALARM_NOTIFICATION_EMAIL is set in the environment to avoid CI auto-subscribes.
    const alarmsTopic = new sns.Topic(this, 'AlarmsTopic', {
      displayName: canonicalResourceName(
        'prod-alarms',
        props?.baseEnvironmentSuffix as string | undefined,
        this.stringSuffix
      ) as string,
    });

    if (process.env.ALARM_NOTIFICATION_EMAIL) {
      alarmsTopic.addSubscription(
        new subscriptions.EmailSubscription(
          process.env.ALARM_NOTIFICATION_EMAIL
        )
      );
    }

    // ========================================
    // IAM Roles (Least Privilege)
    // ========================================
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRoleV2', {
      roleName: canonicalResourceName(
        'prod-iam-lambda',
        props?.baseEnvironmentSuffix as string | undefined,
        this.stringSuffix
      ) as string,
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
        securityGroupName: canonicalResourceName(
          'prod-ec2-sg-lambda',
          props?.baseEnvironmentSuffix as string | undefined,
          this.stringSuffix
        ) as string,
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
      // Remove explicit functionName - let CDK generate unique name automatically
      runtime: lambda.Runtime.NODEJS_20_X, // Updated to Node.js 20.x for latest support
      handler: 'index.handler',
      // Use simple asset packaging. The Lambda handler uses aws-sdk from the root
      // node_modules which is included automatically by CDK. No separate package.json
      // or bundling needed since dependencies are managed at the root level.
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'api')),
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
      logGroup: lambdaLogGroup, // Associate with the explicit log group created above
      // Do not hard-code reserved concurrency here; account limits vary and
      // can cause deployment failures. Operators can set a reserved concurrency
      // value via context or overrides if needed.
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
      restApiName: canonicalResourceName(
        'prod-apigateway-rest',
        props?.baseEnvironmentSuffix as string | undefined,
        this.stringSuffix
      ) as string,
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
    let hostedZone: route53.IHostedZone | undefined;
    if (createPrimaryResources) {
      hostedZone = new route53.HostedZone(this, 'HostedZone', {
        zoneName: 'example-prod.com',
        comment: `Production hosted zone - ${this.stringSuffix}`,
      });
    }

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
    // us-west-1. Guard creation so that when this stack is synthesized or
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
      enableWaf && (stackRegion === 'us-west-1' || allowGlobalWaf);

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
      // WAF was intentionally skipped for this region. Record that state
      // so callers can decide whether to emit a top-level CFN output.
      this.wafWasSkipped = true;
    }

    // If this is the primary stack, create Route53 records and health
    // checks that point to the primary CloudFront distribution. The
    // secondary stack will rely on the primary's hosted zone and can
    // create failover or alias records there if required by operators.
    if (createPrimaryResources && hostedZone) {
      // Route 53 A Record for CloudFront (www)
      new route53.ARecord(this, 'CloudFrontARecord', {
        zone: hostedZone,
        recordName: 'www',
        target: route53.RecordTarget.fromAlias(
          new route53Targets.CloudFrontTarget(distribution)
        ),
      });

      // Additional Route 53 records for API
      new route53.ARecord(this, 'ApiARecord', {
        zone: hostedZone,
        recordName: 'api',
        target: route53.RecordTarget.fromAlias(
          new route53Targets.CloudFrontTarget(distribution)
        ),
      });

      // Create a Route53 health check for the API endpoint so we can
      // optionally use failover routing (primary/secondary) later.
      const apiHost = cdk.Fn.select(
        2,
        cdk.Fn.split('/', this.apiUrl || api.url)
      );
      new route53.CfnHealthCheck(this, 'ApiHealthCheck', {
        healthCheckConfig: {
          type: 'HTTPS',
          fullyQualifiedDomainName: apiHost,
          port: 443,
          resourcePath: '/',
          requestInterval: 30,
          failureThreshold: 3,
        },
      });

      // ApiHealthCheck created; do not emit a CFN output from the construct.

      new route53.CfnHealthCheck(this, 'CloudFrontHealthCheck', {
        healthCheckConfig: {
          type: 'HTTPS',
          fullyQualifiedDomainName: distribution.distributionDomainName,
          port: 443,
          resourcePath: '/',
          requestInterval: 30,
          failureThreshold: 3,
        },
      });

      // CloudFront health check created; keep CFN outputs at the stack level.
    }

    // ========================================
    // CloudWatch Alarms and Monitoring
    // ========================================
    // Lambda errors alarm
    new cdk.aws_cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      alarmName: canonicalResourceName(
        'prod-cloudwatch-lambda-errors',
        props?.baseEnvironmentSuffix as string | undefined,
        safeSuffixForLambda as string
      ) as string,
      metric: lambdaFunction.metricErrors(),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator:
        cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // RDS CPU utilization alarm
    new cdk.aws_cloudwatch.Alarm(this, 'RdsCpuAlarm', {
      alarmName: canonicalResourceName(
        'prod-cloudwatch-rds-cpu',
        props?.baseEnvironmentSuffix as string | undefined,
        safeSuffixForLambda as string
      ) as string,
      metric: rdsInstance.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator:
        cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // API Gateway 5xx errors alarm
    new cdk.aws_cloudwatch.Alarm(this, 'ApiGateway5xxAlarm', {
      alarmName: canonicalResourceName(
        'prod-cloudwatch-apigateway-5xx',
        props?.baseEnvironmentSuffix as string | undefined,
        safeSuffixForLambda as string
      ) as string,
      metric: api.metricServerError(),
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator:
        cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Note: Route53 health checks are created earlier only for primary stacks
    // (see the guarded block above guarded by `createPrimaryResources`).
    // This section previously duplicated the creation of ApiHealthCheck and
    // CloudFrontHealthCheck which caused a construct name collision during
    // synthesis when the guarded block had already created them. Keep the
    // outputs in the guarded block and avoid creating duplicate constructs here.

    new cloudwatch.Alarm(this, 'VpcSshAttemptsAlarm', {
      alarmName: canonicalResourceName(
        'prod-vpc-ssh-attempts',
        props?.baseEnvironmentSuffix as string | undefined,
        this.stringSuffix
      ) as string,
      metric: sshAttemptsMetric,
      threshold: 20,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    }).addAlarmAction(new cw_actions.SnsAction(alarmsTopic));

    new cloudwatch.Alarm(this, 'VpcRdpAttemptsAlarm', {
      alarmName: canonicalResourceName(
        'prod-vpc-rdp-attempts',
        props?.baseEnvironmentSuffix as string | undefined,
        this.stringSuffix
      ) as string,
      metric: rdpAttemptsMetric,
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    }).addAlarmAction(new cw_actions.SnsAction(alarmsTopic));

    // SQS alarms
    new cloudwatch.Alarm(this, 'SqsVisibleMessagesAlarm', {
      alarmName: canonicalResourceName(
        'prod-cloudwatch-sqs-visible',
        props?.baseEnvironmentSuffix as string | undefined,
        safeSuffixForLambda as string
      ) as string,
      metric: asyncQueue.metricApproximateNumberOfMessagesVisible(),
      threshold: 100,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'SqsOldestMessageAlarm', {
      alarmName: canonicalResourceName(
        'prod-cloudwatch-sqs-oldest',
        props?.baseEnvironmentSuffix as string | undefined,
        safeSuffixForLambda as string
      ) as string,
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
      alarmName: canonicalResourceName(
        'prod-cloudwatch-s3-4xx',
        props?.baseEnvironmentSuffix as string | undefined,
        safeSuffixForLambda as string
      ) as string,
      metric: s34xx,
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'S35xxAlarm', {
      alarmName: canonicalResourceName(
        'prod-cloudwatch-s3-5xx',
        props?.baseEnvironmentSuffix as string | undefined,
        safeSuffixForLambda as string
      ) as string,
      metric: s35xx,
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Lambda duration and throttles
    new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      alarmName: canonicalResourceName(
        'prod-cloudwatch-lambda-duration',
        props?.baseEnvironmentSuffix as string | undefined,
        safeSuffixForLambda as string
      ) as string,
      metric: lambdaFunction.metricDuration(),
      threshold: 300000, // milliseconds (5m) - very high, tune as needed
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    new cloudwatch.Alarm(this, 'LambdaThrottlesAlarm', {
      alarmName: canonicalResourceName(
        'prod-cloudwatch-lambda-throttles',
        props?.baseEnvironmentSuffix as string | undefined,
        safeSuffixForLambda as string
      ) as string,
      metric: lambdaFunction.metricThrottles(),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Additional monitoring coverage
    // API Gateway: 4xx errors (client errors)
    const apiClientErrorsAlarm = new cloudwatch.Alarm(
      this,
      'ApiClientErrorsAlarm',
      {
        alarmName: canonicalResourceName(
          'prod-cloudwatch-apigateway-4xx',
          props?.baseEnvironmentSuffix as string | undefined,
          safeSuffixForLambda as string
        ) as string,
        metric: api.metricClientError(),
        threshold: 50,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    apiClientErrorsAlarm.addAlarmAction(new cw_actions.SnsAction(alarmsTopic));

    // API Gateway: latency alarm (ms)
    const apiLatencyAlarm = new cloudwatch.Alarm(this, 'ApiLatencyAlarm', {
      alarmName: canonicalResourceName(
        'prod-cloudwatch-apigateway-latency',
        props?.baseEnvironmentSuffix as string | undefined,
        safeSuffixForLambda as string
      ) as string,
      metric: api.metricLatency(),
      threshold: 1000, // 1 second
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    apiLatencyAlarm.addAlarmAction(new cw_actions.SnsAction(alarmsTopic));

    // Lambda concurrent executions - alert when concurrency grows unexpectedly
    const lambdaConcurrentMetric = lambdaFunction.metric(
      'ConcurrentExecutions',
      {
        statistic: 'Maximum',
        period: Duration.minutes(1),
      }
    );
    const lambdaConcurrentAlarm = new cloudwatch.Alarm(
      this,
      'LambdaConcurrentAlarm',
      {
        alarmName: canonicalResourceName(
          'prod-cloudwatch-lambda-concurrent',
          props?.baseEnvironmentSuffix as string | undefined,
          safeSuffixForLambda as string
        ) as string,
        metric: lambdaConcurrentMetric,
        threshold: 500,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    lambdaConcurrentAlarm.addAlarmAction(new cw_actions.SnsAction(alarmsTopic));

    // RDS: database connections alarm
    const rdsConnectionsMetric = new cloudwatch.Metric({
      namespace: 'AWS/RDS',
      metricName: 'DatabaseConnections',
      dimensionsMap: { DBInstanceIdentifier: rdsInstance.instanceIdentifier },
      period: Duration.minutes(5),
      statistic: 'Maximum',
    });
    const rdsConnectionsAlarm = new cloudwatch.Alarm(
      this,
      'RdsConnectionsAlarm',
      {
        alarmName: canonicalResourceName(
          'prod-cloudwatch-rds-connections',
          props?.baseEnvironmentSuffix as string | undefined,
          safeSuffixForLambda as string
        ) as string,
        metric: rdsConnectionsMetric,
        threshold: 200,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    rdsConnectionsAlarm.addAlarmAction(new cw_actions.SnsAction(alarmsTopic));

    // RDS: low freeable memory
    const rdsFreeableAlarm = new cloudwatch.Alarm(
      this,
      'RdsFreeableMemoryAlarm',
      {
        alarmName: canonicalResourceName(
          'prod-cloudwatch-rds-freeable-memory',
          props?.baseEnvironmentSuffix as string | undefined,
          safeSuffixForLambda as string
        ) as string,
        metric: rdsInstance.metricFreeableMemory(),
        threshold: 200 * 1024 * 1024, // 200 MiB
        evaluationPeriods: 1,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      }
    );
    rdsFreeableAlarm.addAlarmAction(new cw_actions.SnsAction(alarmsTopic));

    // RDS additional alarm: free storage space low
    new cloudwatch.Alarm(this, 'RdsFreeStorageAlarm', {
      alarmName: canonicalResourceName(
        'prod-cloudwatch-rds-free-storage',
        props?.baseEnvironmentSuffix as string | undefined,
        safeSuffixForLambda as string
      ) as string,
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
        alarmName: canonicalResourceName(
          'prod-cloudwatch-lambda-errors-with-action',
          props?.baseEnvironmentSuffix as string | undefined,
          safeSuffixForLambda as string
        ) as string,
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
        alarmName: canonicalResourceName(
          'prod-cloudwatch-rds-cpu-with-action',
          props?.baseEnvironmentSuffix as string | undefined,
          safeSuffixForLambda as string
        ) as string,
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

    // Route53 health checks are created above in the primary-only guarded
    // block (if createPrimaryResources && hostedZone). Do not recreate them
    // here to avoid duplicate construct names during synthesis.
    // Expose tokens as public properties for the calling stack to use.
    this.vpcId = vpc.vpcId;
    this.apiUrl = api.url;
    this.lambdaFunctionArn = lambdaFunction.functionArn;
    this.rdsEndpoint = rdsInstance.dbInstanceEndpointAddress;
    this.s3BucketName = staticFilesBucket.bucketName;
    this.sqsQueueUrl = asyncQueue.queueUrl;
    this.cloudFrontDomainName = distribution.distributionDomainName;
    this.hostedZoneId = hostedZone
      ? hostedZone.hostedZoneId
      : (cdk.Aws.NO_VALUE as unknown as string);
    this.databaseSecretArn = databaseSecret.secretArn;
    this.lambdaRoleArn = lambdaRole.roleArn;
    this.databaseSecurityGroupId = databaseSecurityGroup.securityGroupId;
    this.lambdaSecurityGroupId = lambdaSecurityGroup.securityGroupId;
    this.lambdaLogGroupName = lambdaLogGroup.logGroupName;

    // Tags for all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'MultiComponentApplication');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Region', cdk.Aws.REGION);
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'enabled');
  }
}

// Backwards-compatible wrapper: preserve the original NestedStack API so
// existing tests and callers that instantiate MultiComponentApplicationStack
// continue to work. This NestedStack simply delegates to the Construct
// implementation and re-exposes the same public tokens and CloudFormation
// outputs as the prior design.
// NOTE: The previous code provided a NestedStack wrapper class named
// MultiComponentApplicationStack for backwards compatibility. Consolidation
// into a single top-level stack/app shape prefers direct use of the
// MultiComponentApplicationConstruct. The wrapper has been removed so
// callers should instantiate the Construct inside their Stack (TapStack
// does this).
