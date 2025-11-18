import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import validation aspects
import {
  ResourceValidationAspect,
  IamValidationAspect,
} from './validation-aspects';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Apply validation aspects
    cdk.Aspects.of(this).add(new ResourceValidationAspect(), { priority: 100 });
    cdk.Aspects.of(this).add(new IamValidationAspect(), { priority: 100 });

    // Create payment processing infrastructure (logically separated components)
    this.createPaymentProcessingInfrastructure(environmentSuffix);
  }

  private createPaymentProcessingInfrastructure(
    environmentSuffix: string
  ): void {
    // VPC and Networking
    const vpc = this.createVpc(environmentSuffix);

    // API Gateway
    const { apiGateway } = this.createApiGateway(environmentSuffix);

    // Database
    const { cluster, securityGroup } = this.createDatabase(
      environmentSuffix,
      vpc
    );

    // Processing components (Lambda, SQS, Step Functions)
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const {
      paymentValidationFunction,
      paymentProcessingFunction,
      paymentQueue,
      paymentDlq,
      eventBus,
      stateMachine,
    } = this.createProcessingComponents(
      environmentSuffix,
      vpc,
      apiGateway,
      securityGroup,
      cluster
    );
    /* eslint-enable @typescript-eslint/no-unused-vars */

    // Monitoring and Observability
    this.createMonitoringComponents(
      environmentSuffix,
      apiGateway,
      paymentValidationFunction,
      paymentProcessingFunction,
      cluster,
      paymentQueue,
      paymentDlq
    );

    // Outputs
    new cdk.CfnOutput(this, `EnvironmentSuffix${environmentSuffix}`, {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });

    new cdk.CfnOutput(this, `ApiUrl${environmentSuffix}`, {
      value: apiGateway.url,
      description: 'Payment API Gateway URL',
    });

    new cdk.CfnOutput(this, `VpcId${environmentSuffix}`, {
      value: vpc.vpcId,
      description: 'VPC ID for payment processing',
    });

    new cdk.CfnOutput(this, `DatabaseEndpoint${environmentSuffix}`, {
      value: cluster.clusterEndpoint.hostname,
      description: 'RDS Aurora cluster endpoint',
    });

    new cdk.CfnOutput(this, `PaymentQueueUrl${environmentSuffix}`, {
      value: paymentQueue.queueUrl,
      description: 'Payment processing SQS queue URL',
    });
  }

  private createVpc(environmentSuffix: string) {
    const vpc = new cdk.aws_ec2.Vpc(this, `PaymentVpc${environmentSuffix}`, {
      vpcName: `payment-processing-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: cdk.aws_ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    return vpc;
  }

  private createApiGateway(environmentSuffix: string) {
    const apiGateway = new cdk.aws_apigateway.RestApi(
      this,
      `PaymentApi${environmentSuffix}`,
      {
        restApiName: `payment-processing-api-${environmentSuffix}`,
        description: 'Payment Processing API Gateway',
        defaultCorsPreflightOptions: {
          allowOrigins: cdk.aws_apigateway.Cors.ALL_ORIGINS,
          allowMethods: cdk.aws_apigateway.Cors.ALL_METHODS,
          allowHeaders: [
            'Content-Type',
            'X-Amz-Date',
            'Authorization',
            'X-Api-Key',
          ],
        },
      }
    );

    return { apiGateway };
  }

  private createDatabase(environmentSuffix: string, vpc: cdk.aws_ec2.Vpc) {
    const encryptionKey = new cdk.aws_kms.Key(
      this,
      `DatabaseKey${environmentSuffix}`,
      {
        enableKeyRotation: true,
        description: 'KMS key for payment database encryption',
      }
    );

    const securityGroup = new cdk.aws_ec2.SecurityGroup(
      this,
      `DatabaseSecurityGroup${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for payment database',
        allowAllOutbound: true,
      }
    );

    securityGroup.addIngressRule(
      cdk.aws_ec2.Peer.ipv4(vpc.vpcCidrBlock),
      cdk.aws_ec2.Port.tcp(5432),
      'PostgreSQL access from VPC'
    );

    const cluster = new cdk.aws_rds.DatabaseCluster(
      this,
      `PaymentDatabase${environmentSuffix}`,
      {
        engine: cdk.aws_rds.DatabaseClusterEngine.auroraPostgres({
          version: cdk.aws_rds.AuroraPostgresEngineVersion.VER_14_6,
        }),
        credentials: cdk.aws_rds.Credentials.fromGeneratedSecret(
          'payment_admin',
          {
            secretName: `payment-db-secret-${environmentSuffix}`,
          }
        ),
        clusterIdentifier: `payment-db-${environmentSuffix}`,
        instances: 2,
        instanceProps: {
          vpc,
          vpcSubnets: {
            subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
          securityGroups: [securityGroup],
          instanceType: cdk.aws_ec2.InstanceType.of(
            cdk.aws_ec2.InstanceClass.R6G,
            cdk.aws_ec2.InstanceSize.LARGE
          ),
        },
        port: 5432,
        defaultDatabaseName: 'paymentdb',
        storageEncrypted: true,
        storageEncryptionKey: encryptionKey,
        backup: {
          retention: cdk.Duration.days(30),
          preferredWindow: '03:00-04:00',
        },
        monitoringInterval: cdk.Duration.minutes(1),
        cloudwatchLogsExports: ['postgresql'],
        deletionProtection: true,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    return { cluster, securityGroup };
  }

  private createProcessingComponents(
    environmentSuffix: string,
    vpc: cdk.aws_ec2.Vpc,
    apiGateway: cdk.aws_apigateway.RestApi,
    databaseSecurityGroup: cdk.aws_ec2.SecurityGroup,
    _databaseCluster: cdk.aws_rds.DatabaseCluster
  ) {
    // IAM role for Lambda functions
    const lambdaRole = new cdk.aws_iam.Role(
      this,
      `ProcessingLambdaRole${environmentSuffix}`,
      {
        assumedBy: new cdk.aws_iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
          cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
      }
    );

    // SQS FIFO queues
    const paymentDlq = new cdk.aws_sqs.Queue(
      this,
      `PaymentDlq${environmentSuffix}`,
      {
        queueName: `payment-processing-dlq-${environmentSuffix}.fifo`,
        fifo: true,
        contentBasedDeduplication: true,
        retentionPeriod: cdk.Duration.days(14),
      }
    );

    const paymentQueue = new cdk.aws_sqs.Queue(
      this,
      `PaymentQueue${environmentSuffix}`,
      {
        queueName: `payment-processing-queue-${environmentSuffix}.fifo`,
        fifo: true,
        contentBasedDeduplication: true,
        retentionPeriod: cdk.Duration.days(4),
        deadLetterQueue: {
          queue: paymentDlq,
          maxReceiveCount: 3,
        },
      }
    );

    // EventBridge event bus
    const eventBus = new cdk.aws_events.EventBus(
      this,
      `PaymentEventBus${environmentSuffix}`,
      {
        eventBusName: `payment-events-${environmentSuffix}`,
      }
    );

    // EventBridge rule for payment events
    new cdk.aws_events.Rule(this, `PaymentEventRule${environmentSuffix}`, {
      eventBus: eventBus,
      eventPattern: {
        source: ['payment.processing'],
        detailType: ['Payment Transaction'],
      },
      targets: [
        new cdk.aws_events_targets.SqsQueue(paymentQueue, {
          messageGroupId: 'payment-events',
        }),
      ],
    });

    // Step Functions state machine for payment workflow
    const stateMachine = new cdk.aws_stepfunctions.StateMachine(
      this,
      `PaymentWorkflow${environmentSuffix}`,
      {
        stateMachineName: `payment-processing-workflow-${environmentSuffix}`,
        stateMachineType: cdk.aws_stepfunctions.StateMachineType.EXPRESS,
        definition: new cdk.aws_stepfunctions.Pass(
          this,
          `PassState${environmentSuffix}`
        ),
      }
    );

    // Lambda functions
    const paymentValidationFunction = new cdk.aws_lambda.Function(
      this,
      `PaymentValidation${environmentSuffix}`,
      {
        functionName: `payment-validation-${environmentSuffix}`,
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        code: cdk.aws_lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log('Payment validation event:', JSON.stringify(event, null, 2));
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Payment validation successful' })
  };
};
      `),
        handler: 'index.handler',
        role: lambdaRole,
        vpc,
        vpcSubnets: { subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [databaseSecurityGroup],
        timeout: cdk.Duration.minutes(2),
        memorySize: 256,
      }
    );

    const paymentProcessingFunction = new cdk.aws_lambda.Function(
      this,
      `PaymentProcessing${environmentSuffix}`,
      {
        functionName: `payment-processing-${environmentSuffix}`,
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        code: cdk.aws_lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log('Payment processing event:', JSON.stringify(event, null, 2));
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Payment processing successful' })
  };
};
      `),
        handler: 'index.handler',
        role: lambdaRole,
        vpc,
        vpcSubnets: { subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [databaseSecurityGroup],
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
      }
    );

    // API Gateway integration
    const paymentsResource = apiGateway.root.addResource('payments');
    const paymentResource = paymentsResource.addResource('{paymentId}');

    paymentsResource.addMethod(
      'POST',
      new cdk.aws_apigateway.LambdaIntegration(paymentValidationFunction)
    );
    paymentResource.addMethod(
      'GET',
      new cdk.aws_apigateway.LambdaIntegration(paymentValidationFunction)
    );
    paymentResource.addMethod(
      'PUT',
      new cdk.aws_apigateway.LambdaIntegration(paymentValidationFunction)
    );

    return {
      paymentValidationFunction,
      paymentProcessingFunction,
      paymentQueue,
      paymentDlq,
      eventBus,
      stateMachine,
    };
  }

  private createMonitoringComponents(
    environmentSuffix: string,
    apiGateway: cdk.aws_apigateway.RestApi,
    paymentValidationFunction: cdk.aws_lambda.Function,
    paymentProcessingFunction: cdk.aws_lambda.Function,
    databaseCluster: cdk.aws_rds.DatabaseCluster,
    paymentQueue: cdk.aws_sqs.Queue,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    paymentDlq: cdk.aws_sqs.Queue
  ): void {
    // SNS topics for alerts
    new cdk.aws_sns.Topic(
      this,
      `PaymentCriticalAlertsTopic${environmentSuffix}`,
      {
        topicName: `payment-critical-alerts-${environmentSuffix}`,
        displayName: 'Payment Critical Alerts',
      }
    );

    new cdk.aws_sns.Topic(
      this,
      `PaymentSystemAlertsTopic${environmentSuffix}`,
      {
        topicName: `payment-system-alerts-${environmentSuffix}`,
        displayName: 'Payment System Alerts',
      }
    );

    // CloudWatch alarms - API Gateway 4XX errors
    new cdk.aws_cloudwatch.Alarm(
      this,
      `ApiGateway4xxErrors${environmentSuffix}`,
      {
        alarmName: `payment-api-4xx-errors-${environmentSuffix}`,
        alarmDescription: 'API Gateway 4xx errors above threshold',
        metric: new cdk.aws_cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          dimensionsMap: { ApiName: apiGateway.restApiName },
          statistic: 'Sum',
        }),
        threshold: 10,
        evaluationPeriods: 3,
        comparisonOperator:
          cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );

    // CloudWatch alarms - Lambda validation errors
    new cdk.aws_cloudwatch.Alarm(
      this,
      `PaymentValidationErrors${environmentSuffix}`,
      {
        alarmName: `payment-validation-errors-${environmentSuffix}`,
        alarmDescription: 'Payment validation Lambda errors above threshold',
        metric: paymentValidationFunction.metricErrors({
          statistic: 'Sum',
        }),
        threshold: 5,
        evaluationPeriods: 2,
        comparisonOperator:
          cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );

    // CloudWatch alarms - SQS queue depth
    new cdk.aws_cloudwatch.Alarm(
      this,
      `PaymentQueueDepth${environmentSuffix}`,
      {
        alarmName: `payment-queue-depth-${environmentSuffix}`,
        alarmDescription: 'Payment queue depth above threshold',
        metric: paymentQueue.metricApproximateNumberOfMessagesVisible({
          statistic: 'Average',
        }),
        threshold: 100,
        evaluationPeriods: 2,
        comparisonOperator:
          cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );

    // CloudWatch Dashboard
    const dashboard = new cdk.aws_cloudwatch.Dashboard(
      this,
      `PaymentProcessingDashboard${environmentSuffix}`,
      {
        dashboardName: `payment-processing-dashboard-${environmentSuffix}`,
      }
    );

    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'API Gateway Performance',
        width: 12,
        height: 6,
        left: [
          new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            dimensionsMap: { ApiName: apiGateway.restApiName },
            statistic: 'Sum',
            label: 'Total Requests',
          }),
        ],
      })
    );
  }
}
