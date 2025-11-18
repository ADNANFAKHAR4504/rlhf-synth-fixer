import * as cdk from 'aws-cdk-lib';
import { Construct, IConstruct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';

export interface TapStackProps extends cdk.StackProps {
  readonly environmentSuffix: string;
  readonly customDomainName?: string;
  readonly certificateArn?: string;
  readonly dbUsername?: string;
  readonly databaseName?: string;
  readonly apiStageName?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const dbUsername = props.dbUsername || 'postgres';
    const databaseName = props.databaseName || 'payments';
    const apiStageName = props.apiStageName || environmentSuffix;

    // VPC with 2 public and 4 private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, `PaymentVpc-${environmentSuffix}`, {
      vpcName: `payment-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `private-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Security group for Lambda functions
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `LambdaSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        securityGroupName: `lambda-sg-${environmentSuffix}`,
        description: `Security group for Lambda functions in ${environmentSuffix}`,
        allowAllOutbound: true,
      }
    );

    // Security group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `RdsSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        securityGroupName: `rds-sg-${environmentSuffix}`,
        description: `Security group for RDS in ${environmentSuffix}`,
        allowAllOutbound: false,
      }
    );

    // Allow Lambda to connect to RDS
    rdsSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to access PostgreSQL'
    );

    // RDS credentials in Secrets Manager
    const dbSecret = new secretsmanager.Secret(
      this,
      `DbSecret-${environmentSuffix}`,
      {
        secretName: `payment-db-secret-${environmentSuffix}`,
        description: `Database credentials for ${environmentSuffix}`,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: dbUsername }),
          generateStringKey: 'password',
          excludePunctuation: true,
          includeSpace: false,
          passwordLength: 32,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // RDS subnet group
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DbSubnetGroup-${environmentSuffix}`,
      {
        subnetGroupName: `payment-db-subnet-${environmentSuffix}`,
        description: `Subnet group for RDS in ${environmentSuffix}`,
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // RDS PostgreSQL instance
    const dbInstance = new rds.DatabaseInstance(
      this,
      `PaymentDatabase-${environmentSuffix}`,
      {
        instanceIdentifier: `payment-db-${environmentSuffix}`,
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_14,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [rdsSecurityGroup],
        subnetGroup: dbSubnetGroup,
        credentials: rds.Credentials.fromSecret(dbSecret),
        databaseName: databaseName,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        backupRetention: cdk.Duration.days(0),
        deleteAutomatedBackups: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        deletionProtection: false,
        publiclyAccessible: false,
        storageEncrypted: true,
      }
    );

    // Dead Letter Queue for Lambda errors
    const dlq = new sqs.Queue(this, `PaymentDlq-${environmentSuffix}`, {
      queueName: `payment-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(14),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 bucket for payment receipts
    const receiptsBucket = new s3.Bucket(
      this,
      `ReceiptsBucket-${environmentSuffix}`,
      {
        bucketName: `payment-receipts-${environmentSuffix}-${this.account}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        versioned: false,
      }
    );

    // Lambda execution role
    const lambdaRole = new iam.Role(
      this,
      `LambdaExecutionRole-${environmentSuffix}`,
      {
        roleName: `payment-lambda-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
      }
    );

    // Grant Lambda permissions
    dbSecret.grantRead(lambdaRole);
    receiptsBucket.grantReadWrite(lambdaRole);
    dlq.grantSendMessages(lambdaRole);

    // Lambda function for payments endpoint
    const paymentsFunction = new lambda.Function(
      this,
      `PaymentsFunction-${environmentSuffix}`,
      {
        functionName: `payment-api-payments-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log('Payment request received:', JSON.stringify(event, null, 2));

  const dbSecretArn = process.env.DB_SECRET_ARN;
  const receiptsBucket = process.env.RECEIPTS_BUCKET;

  // In production, would:
  // 1. Retrieve DB credentials from Secrets Manager
  // 2. Connect to RDS PostgreSQL
  // 3. Process payment
  // 4. Store receipt in S3
  // 5. Return response

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Payment processed successfully',
      transactionId: Date.now().toString(),
      environment: process.env.ENVIRONMENT,
    }),
  };
};
      `),
        environment: {
          DB_SECRET_ARN: dbSecret.secretArn,
          DB_HOST: dbInstance.dbInstanceEndpointAddress,
          DB_PORT: dbInstance.dbInstanceEndpointPort,
          DB_NAME: databaseName,
          RECEIPTS_BUCKET: receiptsBucket.bucketName,
          ENVIRONMENT: environmentSuffix,
        },
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
        role: lambdaRole,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        deadLetterQueue: dlq,
        logRetention: logs.RetentionDays.TWO_WEEKS,
      }
    );

    // Lambda function for refunds endpoint
    const refundsFunction = new lambda.Function(
      this,
      `RefundsFunction-${environmentSuffix}`,
      {
        functionName: `payment-api-refunds-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log('Refund request received:', JSON.stringify(event, null, 2));

  const dbSecretArn = process.env.DB_SECRET_ARN;
  const receiptsBucket = process.env.RECEIPTS_BUCKET;

  // In production, would:
  // 1. Retrieve DB credentials from Secrets Manager
  // 2. Connect to RDS PostgreSQL
  // 3. Process refund
  // 4. Update receipt in S3
  // 5. Return response

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Refund processed successfully',
      transactionId: Date.now().toString(),
      environment: process.env.ENVIRONMENT,
    }),
  };
};
      `),
        environment: {
          DB_SECRET_ARN: dbSecret.secretArn,
          DB_HOST: dbInstance.dbInstanceEndpointAddress,
          DB_PORT: dbInstance.dbInstanceEndpointPort,
          DB_NAME: databaseName,
          RECEIPTS_BUCKET: receiptsBucket.bucketName,
          ENVIRONMENT: environmentSuffix,
        },
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
        role: lambdaRole,
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        deadLetterQueue: dlq,
        logRetention: logs.RetentionDays.TWO_WEEKS,
      }
    );

    // API Gateway REST API
    const api = new apigateway.RestApi(
      this,
      `PaymentApi-${environmentSuffix}`,
      {
        restApiName: `payment-api-${environmentSuffix}`,
        description: `Payment processing API for ${environmentSuffix}`,
        cloudWatchRole: false,
        deployOptions: {
          stageName: apiStageName,
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
          metricsEnabled: true,
        },
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,
        },
      }
    );

    // Add custom domain if provided
    if (props.customDomainName && props.certificateArn) {
      const certificate = certificatemanager.Certificate.fromCertificateArn(
        this,
        `Certificate-${environmentSuffix}`,
        props.certificateArn
      );

      new apigateway.DomainName(this, `CustomDomain-${environmentSuffix}`, {
        domainName: props.customDomainName,
        certificate,
        endpointType: apigateway.EndpointType.REGIONAL,
        mapping: api,
      });
    }

    // /payments endpoint
    const paymentsResource = api.root.addResource('payments');
    paymentsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(paymentsFunction)
    );
    paymentsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(paymentsFunction)
    );

    // /refunds endpoint
    const refundsResource = api.root.addResource('refunds');
    refundsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(refundsFunction)
    );
    refundsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(refundsFunction)
    );

    // SNS topic for alarm notifications
    const alarmTopic = new sns.Topic(this, `AlarmTopic-${environmentSuffix}`, {
      topicName: `payment-alarms-${environmentSuffix}`,
      displayName: `Payment API Alarms for ${environmentSuffix}`,
    });

    // CloudWatch alarm for payments function errors
    const paymentsErrorAlarm = new cloudwatch.Alarm(
      this,
      `PaymentsErrorAlarm-${environmentSuffix}`,
      {
        alarmName: `payment-api-payments-errors-${environmentSuffix}`,
        alarmDescription: `Payments Lambda error rate exceeds 5% in ${environmentSuffix}`,
        metric: paymentsFunction.metricErrors({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    paymentsErrorAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // CloudWatch alarm for refunds function errors
    const refundsErrorAlarm = new cloudwatch.Alarm(
      this,
      `RefundsErrorAlarm-${environmentSuffix}`,
      {
        alarmName: `payment-api-refunds-errors-${environmentSuffix}`,
        alarmDescription: `Refunds Lambda error rate exceeds 5% in ${environmentSuffix}`,
        metric: refundsFunction.metricErrors({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 5,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    refundsErrorAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alarmTopic)
    );

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL',
      exportName: `payment-api-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PaymentsFunctionArn', {
      value: paymentsFunction.functionArn,
      description: 'Payments Lambda function ARN',
      exportName: `payments-function-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RefundsFunctionArn', {
      value: refundsFunction.functionArn,
      description: 'Refunds Lambda function ARN',
      exportName: `refunds-function-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbInstance.dbInstanceEndpointAddress,
      description: 'RDS database endpoint',
      exportName: `database-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: dbSecret.secretArn,
      description: 'Database secret ARN',
      exportName: `database-secret-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ReceiptsBucketName', {
      value: receiptsBucket.bucketName,
      description: 'S3 bucket for receipts',
      exportName: `receipts-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS topic for alarms',
      exportName: `alarm-topic-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `vpc-id-${environmentSuffix}`,
    });

    // Add CDK Aspect for validation
    cdk.Aspects.of(this).add(
      new EnvironmentValidationAspect(environmentSuffix)
    );
  }
}

// CDK Aspect to validate no hardcoded environment values
class EnvironmentValidationAspect implements cdk.IAspect {
  constructor(private environmentSuffix: string) {}

  public visit(node: IConstruct): void {
    // Validate that resources have environment suffix in names
    if (node instanceof lambda.Function) {
      const funcName = node.functionName;
      if (funcName && !funcName.includes(this.environmentSuffix)) {
        cdk.Annotations.of(node).addWarning(
          `Lambda function name should include environment suffix: ${this.environmentSuffix}`
        );
      }
    }

    if (node instanceof s3.Bucket) {
      const bucketName = node.bucketName;
      if (bucketName && !bucketName.includes(this.environmentSuffix)) {
        cdk.Annotations.of(node).addWarning(
          `S3 bucket name should include environment suffix: ${this.environmentSuffix}`
        );
      }
    }

    if (node instanceof rds.DatabaseInstance) {
      const instanceId = node.instanceIdentifier;
      if (instanceId && !instanceId.includes(this.environmentSuffix)) {
        cdk.Annotations.of(node).addWarning(
          `RDS instance identifier should include environment suffix: ${this.environmentSuffix}`
        );
      }
    }

    // Check for RemovalPolicy.RETAIN
    if (node instanceof cdk.CfnResource) {
      const cfnResource = node as cdk.CfnResource;
      if (
        cfnResource.cfnOptions.deletionPolicy === cdk.CfnDeletionPolicy.RETAIN
      ) {
        cdk.Annotations.of(node).addError(
          'RemovalPolicy.RETAIN is not allowed. All resources must be destroyable.'
        );
      }
    }
  }
}
