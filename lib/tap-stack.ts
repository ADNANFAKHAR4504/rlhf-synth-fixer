import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // 1. KMS Key with Rotation and Resource Policy
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      alias: `analytics-key-${environmentSuffix}`,
      description:
        'Customer-managed key for data analytics platform encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add resource-based policy to restrict key usage
    encryptionKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowKeyUsageBySpecificRoles',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
        actions: [
          'kms:Decrypt',
          'kms:Encrypt',
          'kms:GenerateDataKey',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'kms:ViaService': [`s3.${this.region}.amazonaws.com`],
          },
        },
      })
    );

    // Add CloudWatch Logs permissions to KMS key
    encryptionKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudWatchLogs',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:CreateGrant',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${this.region}:${this.account}:log-group:*`,
          },
        },
      })
    );

    // 2. VPC with Private Subnets
    const vpc = new ec2.Vpc(this, 'AnalyticsVpc', {
      vpcName: `analytics-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // 3. VPC Endpoints for AWS Services
    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    vpc.addGatewayEndpoint('DynamoDbEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    // Security group for VPC endpoints
    const endpointSecurityGroup = new ec2.SecurityGroup(
      this,
      'EndpointSecurityGroup',
      {
        vpc,
        description: 'Security group for VPC interface endpoints',
        allowAllOutbound: true,
      }
    );

    endpointSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'Allow HTTPS from VPC'
    );

    vpc.addInterfaceEndpoint('LambdaEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.LAMBDA,
      securityGroups: [endpointSecurityGroup],
    });

    // 4. S3 Buckets with Encryption and Versioning
    const auditLogsBucket = new s3.Bucket(this, 'AuditLogsBucket', {
      bucketName: `audit-logs-${environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    const rawDataBucket = new s3.Bucket(this, 'RawDataBucket', {
      bucketName: `raw-data-${environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      serverAccessLogsBucket: auditLogsBucket,
      serverAccessLogsPrefix: 'raw-data-logs/',
    });

    const processedDataBucket = new s3.Bucket(this, 'ProcessedDataBucket', {
      bucketName: `processed-data-${environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      serverAccessLogsBucket: auditLogsBucket,
      serverAccessLogsPrefix: 'processed-data-logs/',
    });

    // Add bucket policies denying unencrypted uploads
    const denyUnencryptedPolicy = new iam.PolicyStatement({
      sid: 'DenyUnencryptedObjectUploads',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:PutObject'],
      resources: [],
      conditions: {
        StringNotEquals: {
          's3:x-amz-server-side-encryption': 'aws:kms',
        },
      },
    });

    const denyUnencryptedPolicyRaw = denyUnencryptedPolicy.copy();
    denyUnencryptedPolicyRaw.addResources(rawDataBucket.arnForObjects('*'));
    rawDataBucket.addToResourcePolicy(denyUnencryptedPolicyRaw);

    const denyUnencryptedPolicyProcessed = denyUnencryptedPolicy.copy();
    denyUnencryptedPolicyProcessed.addResources(
      processedDataBucket.arnForObjects('*')
    );
    processedDataBucket.addToResourcePolicy(denyUnencryptedPolicyProcessed);

    // 5. Security Group for Lambda Functions
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc,
        description: 'Security group for Lambda data processing functions',
        allowAllOutbound: false,
      }
    );

    lambdaSecurityGroup.addEgressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'Allow HTTPS to VPC endpoints'
    );

    // 6. Permission Boundary for IAM Roles
    const permissionBoundary = new iam.ManagedPolicy(
      this,
      'PermissionBoundary',
      {
        managedPolicyName: `lambda-permission-boundary-${environmentSuffix}`,
        statements: [
          new iam.PolicyStatement({
            sid: 'AllowedServices',
            effect: iam.Effect.ALLOW,
            actions: [
              's3:GetObject',
              's3:PutObject',
              's3:ListBucket',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'kms:Decrypt',
              'kms:Encrypt',
              'kms:GenerateDataKey',
              'ec2:CreateNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DeleteNetworkInterface',
              'ec2:AssignPrivateIpAddresses',
              'ec2:UnassignPrivateIpAddresses',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'DenyDestructiveActions',
            effect: iam.Effect.DENY,
            actions: [
              's3:DeleteBucket',
              's3:DeleteBucketPolicy',
              'kms:ScheduleKeyDeletion',
              'kms:DisableKey',
              'iam:DeleteRole',
              'iam:DeleteRolePolicy',
            ],
            resources: ['*'],
          }),
        ],
      }
    );

    // 7. CloudWatch Log Groups with KMS Encryption
    const dataProcessorLogGroup = new logs.LogGroup(
      this,
      'DataProcessorLogGroup',
      {
        logGroupName: `/aws/lambda/data-processor-${environmentSuffix}`,
        encryptionKey,
        retention: logs.RetentionDays.THREE_MONTHS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const apiGatewayLogGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/analytics-api-${environmentSuffix}`,
      encryptionKey,
      retention: logs.RetentionDays.THREE_MONTHS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 8. Lambda IAM Role with Session Policies
    const dataProcessorRole = new iam.Role(this, 'DataProcessorRole', {
      roleName: `data-processor-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      permissionsBoundary: permissionBoundary,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Grant specific S3 prefix access
    rawDataBucket.grantRead(dataProcessorRole, 'input/*');
    processedDataBucket.grantWrite(dataProcessorRole, 'output/*');
    encryptionKey.grantEncryptDecrypt(dataProcessorRole);

    dataProcessorLogGroup.grantWrite(dataProcessorRole);

    // 9. Lambda Function for Data Processing
    const dataProcessorFunction = new lambda.Function(
      this,
      'DataProcessorFunction',
      {
        functionName: `data-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log('Processing event:', JSON.stringify(event, null, 2));

  // Extract S3 event details
  const records = event.Records || [];

  for (const record of records) {
    if (record.s3) {
      const bucket = record.s3.bucket.name;
      const key = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));
      console.log(\`Processing file: \${bucket}/\${key}\`);

      // Data processing logic would go here
      // For demonstration, we just log the event
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Data processed successfully' })
  };
};
      `),
        role: dataProcessorRole,
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        securityGroups: [lambdaSecurityGroup],
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        environment: {
          RAW_DATA_BUCKET: rawDataBucket.bucketName,
          PROCESSED_DATA_BUCKET: processedDataBucket.bucketName,
          KMS_KEY_ID: encryptionKey.keyId,
        },
        logGroup: dataProcessorLogGroup,
      }
    );

    // 10. EventBridge Rule for S3 Events
    const s3EventRule = new events.Rule(this, 'S3EventRule', {
      ruleName: `s3-object-created-${environmentSuffix}`,
      description: 'Trigger Lambda on S3 object creation in raw data bucket',
      eventPattern: {
        source: ['aws.s3'],
        detailType: ['Object Created'],
        detail: {
          bucket: {
            name: [rawDataBucket.bucketName],
          },
        },
      },
    });

    s3EventRule.addTarget(new targets.LambdaFunction(dataProcessorFunction));

    // Enable EventBridge notifications on the raw data bucket
    rawDataBucket.enableEventBridgeNotification();

    // 11. API Gateway with WAF and API Key Authentication
    const api = new apigateway.RestApi(this, 'AnalyticsApi', {
      restApiName: `analytics-api-${environmentSuffix}`,
      description: 'Secure API for data analytics platform',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiGatewayLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
      },
      endpointTypes: [apigateway.EndpointType.REGIONAL],
    });

    // API Key for authentication
    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: `analytics-api-key-${environmentSuffix}`,
      description: 'API key for analytics platform access',
    });

    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: `analytics-usage-plan-${environmentSuffix}`,
      description: 'Usage plan for analytics API',
      apiStages: [
        {
          api,
          stage: api.deploymentStage,
        },
      ],
      throttle: {
        rateLimit: 100,
        burstLimit: 200,
      },
    });

    usagePlan.addApiKey(apiKey);

    // API Resource and Method
    const dataResource = api.root.addResource('data');
    const lambdaIntegration = new apigateway.LambdaIntegration(
      dataProcessorFunction
    );

    dataResource.addMethod('POST', lambdaIntegration, {
      apiKeyRequired: true,
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    dataResource.addMethod('GET', lambdaIntegration, {
      apiKeyRequired: true,
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // 12. AWS WAF WebACL for API Gateway
    const webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
      name: `analytics-waf-${environmentSuffix}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `analytics-waf-${environmentSuffix}`,
      },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'SQLInjectionProtection',
          priority: 2,
          statement: {
            sqliMatchStatement: {
              fieldToMatch: { body: { oversizeHandling: 'CONTINUE' } },
              textTransformations: [
                {
                  priority: 0,
                  type: 'URL_DECODE',
                },
                {
                  priority: 1,
                  type: 'HTML_ENTITY_DECODE',
                },
              ],
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLInjectionProtection',
          },
        },
        {
          name: 'XSSProtection',
          priority: 3,
          statement: {
            xssMatchStatement: {
              fieldToMatch: { body: { oversizeHandling: 'CONTINUE' } },
              textTransformations: [
                {
                  priority: 0,
                  type: 'URL_DECODE',
                },
                {
                  priority: 1,
                  type: 'HTML_ENTITY_DECODE',
                },
              ],
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'XSSProtection',
          },
        },
      ],
    });

    // Associate WAF with API Gateway
    new wafv2.CfnWebACLAssociation(this, 'WebAclAssociation', {
      resourceArn: `arn:aws:apigateway:${this.region}::/restapis/${api.restApiId}/stages/${api.deploymentStage.stageName}`,
      webAclArn: webAcl.attrArn,
    });

    // 13. SNS Topic for Security Alarms
    const securityAlarmTopic = new sns.Topic(this, 'SecurityAlarmTopic', {
      topicName: `security-alarms-${environmentSuffix}`,
      displayName: 'Security Alarms for Analytics Platform',
    });

    // 14. CloudWatch Alarms for Security Events
    const apiErrorAlarm = new cloudwatch.Alarm(this, 'ApiErrorAlarm', {
      alarmName: `api-4xx-errors-${environmentSuffix}`,
      alarmDescription:
        'Alert on high rate of API 4xx errors (potential authentication failures)',
      metric: api.metricClientError({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    apiErrorAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlarmTopic)
    );

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'LambdaErrorAlarm', {
      alarmName: `lambda-errors-${environmentSuffix}`,
      alarmDescription: 'Alert on Lambda function errors',
      metric: dataProcessorFunction.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    lambdaErrorAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlarmTopic)
    );

    const wafBlockedRequestsAlarm = new cloudwatch.Alarm(
      this,
      'WafBlockedRequestsAlarm',
      {
        alarmName: `waf-blocked-requests-${environmentSuffix}`,
        alarmDescription: 'Alert on high rate of WAF blocked requests',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/WAFV2',
          metricName: 'BlockedRequests',
          dimensionsMap: {
            WebACL: `analytics-waf-${environmentSuffix}`,
            Region: this.region,
            Rule: 'ALL',
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 100,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    wafBlockedRequestsAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(securityAlarmTopic)
    );

    // 15. Stack Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `api-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID for authentication',
      exportName: `api-key-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RawDataBucketName', {
      value: rawDataBucket.bucketName,
      description: 'Raw data S3 bucket name',
      exportName: `raw-data-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ProcessedDataBucketName', {
      value: processedDataBucket.bucketName,
      description: 'Processed data S3 bucket name',
      exportName: `processed-data-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AuditLogsBucketName', {
      value: auditLogsBucket.bucketName,
      description: 'Audit logs S3 bucket name',
      exportName: `audit-logs-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: encryptionKey.keyArn,
      description: 'KMS key ARN for encryption',
      exportName: `kms-key-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DataProcessorFunctionName', {
      value: dataProcessorFunction.functionName,
      description: 'Lambda data processor function name',
      exportName: `data-processor-function-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: lambdaSecurityGroup.securityGroupId,
      description: 'Lambda security group ID',
      exportName: `lambda-sg-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EndpointSecurityGroupId', {
      value: endpointSecurityGroup.securityGroupId,
      description: 'VPC endpoint security group ID',
      exportName: `endpoint-sg-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DataProcessorRoleArn', {
      value: dataProcessorRole.roleArn,
      description: 'Data processor Lambda role ARN',
      exportName: `data-processor-role-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PermissionBoundaryArn', {
      value: permissionBoundary.managedPolicyArn,
      description: 'Permission boundary managed policy ARN',
      exportName: `permission-boundary-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DataProcessorLogGroupName', {
      value: dataProcessorLogGroup.logGroupName,
      description: 'Data processor log group name',
      exportName: `data-processor-logs-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayLogGroupName', {
      value: apiGatewayLogGroup.logGroupName,
      description: 'API Gateway log group name',
      exportName: `api-gateway-logs-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebAclArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
      exportName: `waf-webacl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecurityAlarmTopicArn', {
      value: securityAlarmTopic.topicArn,
      description: 'Security alarm SNS topic ARN',
      exportName: `security-alarm-topic-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3EventRuleName', {
      value: s3EventRule.ruleName,
      description: 'S3 EventBridge rule name',
      exportName: `s3-event-rule-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiErrorAlarmName', {
      value: apiErrorAlarm.alarmName,
      description: 'API 4xx error alarm name',
      exportName: `api-error-alarm-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaErrorAlarmName', {
      value: lambdaErrorAlarm.alarmName,
      description: 'Lambda error alarm name',
      exportName: `lambda-error-alarm-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WafBlockedRequestsAlarmName', {
      value: wafBlockedRequestsAlarm.alarmName,
      description: 'WAF blocked requests alarm name',
      exportName: `waf-blocked-alarm-${environmentSuffix}`,
    });
  }
}
