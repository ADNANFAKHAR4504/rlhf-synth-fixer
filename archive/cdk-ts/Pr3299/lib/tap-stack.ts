import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as certmanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as nodejslambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  notificationEmail?: string;
  customDomainName?: string;
  hostedZoneId?: string;
  hostedZoneName?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const isProd = environmentSuffix === 'prod';
    const resourcePrefix = isProd ? 'prod-' : `${environmentSuffix}-`;

    // Add required tags for RLHF training tracking
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Create S3 bucket for Lambda code
    const lambdaCodeBucket = new s3.Bucket(this, 'LambdaCodeBucket', {
      bucketName: `${resourcePrefix}lambda-code-bucket-${this.account}`,
      removalPolicy: isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd,
      versioned: isProd,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // Create DynamoDB table
    const table = new dynamodb.Table(this, 'EventsTable', {
      tableName: `${resourcePrefix}events-table`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: isProd,
    });

    // Create SNS Topic for alarms
    const alarmTopic = new sns.Topic(this, 'LambdaAlarmTopic', {
      topicName: `${resourcePrefix}lambda-alarms`,
      displayName: `${resourcePrefix}Lambda Function Alarms`,
    });

    // Add email subscription if provided
    if (props?.notificationEmail) {
      alarmTopic.addSubscription(
        new subscriptions.EmailSubscription(props.notificationEmail)
      );
    }

    // Create Lambda execution role with necessary permissions
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `${resourcePrefix}lambda-execution-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Add permissions to the role
    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
        resources: [
          lambdaCodeBucket.bucketArn,
          `${lambdaCodeBucket.bucketArn}/*`,
        ],
      })
    );

    lambdaExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Query',
          'dynamodb:Scan',
        ],
        resources: [table.tableArn],
      })
    );

    // Create Lambda function
    const apiHandler = new nodejslambda.NodejsFunction(this, 'ApiHandler', {
      functionName: `${resourcePrefix}api-handler`,
      entry: path.join(__dirname, 'lambda/api-handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: lambdaCodeBucket.bucketName,
        NODE_ENV: isProd ? 'production' : 'development',
      },
      role: lambdaExecutionRole,
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
      logRetention: logs.RetentionDays.TWO_WEEKS,
      insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_143_0, // Enable Lambda Insights
    });

    // Create CloudWatch Alarms for Lambda
    const lambdaErrorsAlarm = new cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      alarmName: `${resourcePrefix}lambda-errors`,
      metric: apiHandler.metricErrors({
        period: cdk.Duration.minutes(1),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      actionsEnabled: true,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    lambdaErrorsAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alarmTopic)
    );

    const lambdaThrottlesAlarm = new cloudwatch.Alarm(
      this,
      'LambdaThrottlesAlarm',
      {
        alarmName: `${resourcePrefix}lambda-throttles`,
        metric: apiHandler.metricThrottles({
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        actionsEnabled: true,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    lambdaThrottlesAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alarmTopic)
    );

    // Create CloudWatch Logs role for API Gateway (required for access logging)
    const apiGatewayCloudWatchRole = new iam.Role(
      this,
      'ApiGatewayCloudWatchRole',
      {
        assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonAPIGatewayPushToCloudWatchLogs'
          ),
        ],
      }
    );

    // Set the CloudWatch role for API Gateway account settings
    new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: apiGatewayCloudWatchRole.roleArn,
    });

    // Create Log Group for API Gateway access logs
    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayAccessLogs', {
      logGroupName: `/aws/apigateway/${resourcePrefix}api`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // Create API Gateway REST API
    const api = new apigateway.RestApi(this, 'ServerlessApi', {
      restApiName: `${resourcePrefix}serverless-api`,
      description: 'Serverless API with Lambda integration',
      deployOptions: {
        stageName: isProd ? 'prod' : environmentSuffix,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: !isProd, // Enable in non-prod only for security
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      endpointTypes: [apigateway.EndpointType.REGIONAL],
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Add custom domain if provided
    if (props?.customDomainName && props?.hostedZoneName) {
      // Create a certificate
      const certificate = new certmanager.Certificate(this, 'ApiCertificate', {
        domainName: props.customDomainName,
        validation: certmanager.CertificateValidation.fromDns(
          props.hostedZoneId
            ? route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
                hostedZoneId: props.hostedZoneId,
                zoneName: props.hostedZoneName,
              })
            : route53.HostedZone.fromLookup(this, 'HostedZone', {
                domainName: props.hostedZoneName,
              })
        ),
      });

      // Create custom domain
      const domainName = new apigateway.DomainName(this, 'ApiDomainName', {
        domainName: props.customDomainName,
        certificate: certificate,
        endpointType: apigateway.EndpointType.REGIONAL,
        securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
      });

      // Map the custom domain to the API
      new apigateway.BasePathMapping(this, 'ApiPathMapping', {
        domainName: domainName,
        restApi: api,
        stage: api.deploymentStage,
      });

      // Create Route53 record
      const zone = props.hostedZoneId
        ? route53.HostedZone.fromHostedZoneAttributes(
            this,
            'Route53HostedZone',
            {
              hostedZoneId: props.hostedZoneId,
              zoneName: props.hostedZoneName,
            }
          )
        : route53.HostedZone.fromLookup(this, 'Route53HostedZone', {
            domainName: props.hostedZoneName,
          });

      new route53.ARecord(this, 'ApiDnsRecord', {
        recordName: props.customDomainName.split('.')[0], // Extracts subdomain
        zone: zone,
        target: route53.RecordTarget.fromAlias(
          new targets.ApiGatewayDomain(domainName)
        ),
      });
    }

    // Create the API resources and methods
    const apiResource = api.root.addResource('api');
    const eventsResource = apiResource.addResource('events');

    // GET /api/events
    eventsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(apiHandler, {
        proxy: true,
      })
    );

    // POST /api/events
    eventsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(apiHandler, {
        proxy: true,
      })
    );

    // GET /api/events/{id}
    const eventResource = eventsResource.addResource('{id}');
    eventResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(apiHandler, {
        proxy: true,
      })
    );

    // DELETE /api/events/{id}
    eventResource.addMethod(
      'DELETE',
      new apigateway.LambdaIntegration(apiHandler, {
        proxy: true,
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `https://${api.restApiId}.execute-api.${this.region}.amazonaws.com/${api.deploymentStage.stageName}/`,
      description: 'API Gateway URL',
    });

    if (props?.customDomainName) {
      new cdk.CfnOutput(this, 'ApiCustomDomain', {
        value: `https://${props.customDomainName}/`,
        description: 'API Gateway Custom Domain URL',
      });
    }

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: table.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'LambdaFunction', {
      value: apiHandler.functionName,
      description: 'Lambda Function Name',
    });
  }
}
