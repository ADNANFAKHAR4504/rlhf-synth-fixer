import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface ComputeConstructProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  database: rds.DatabaseCluster;
  databaseSecret: secretsmanager.Secret;
  transactionBucket: s3.Bucket;
  paymentQueue: sqs.Queue;
  memorySize: number;
}

export class ComputeConstruct extends Construct {
  public readonly paymentValidationFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      vpc,
      database,
      databaseSecret,
      transactionBucket,
      paymentQueue,
      memorySize,
    } = props;

    // Security group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc,
        securityGroupName: `payment-lambda-sg-${environmentSuffix}`,
        description: 'Security group for payment validation Lambda',
        allowAllOutbound: true,
      }
    );

    // Allow Lambda to access database
    database.connections.allowFrom(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to access database'
    );

    // Create Lambda execution role
    const lambdaRole = new iam.Role(this, 'PaymentValidationRole', {
      roleName: `payment-validation-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Grant permissions
    databaseSecret.grantRead(lambdaRole);
    transactionBucket.grantReadWrite(lambdaRole);
    paymentQueue.grantSendMessages(lambdaRole);

    // Enable X-Ray tracing permissions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
        resources: ['*'],
      })
    );

    // Create Lambda function for payment validation
    this.paymentValidationFunction = new lambda.Function(
      this,
      'PaymentValidationFunction',
      {
        functionName: `payment-validation-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/payment-validation'),
        memorySize,
        timeout: cdk.Duration.seconds(30),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
        role: lambdaRole,
        environment: {
          DATABASE_SECRET_ARN: databaseSecret.secretArn,
          DATABASE_ENDPOINT: database.clusterEndpoint.hostname,
          TRANSACTION_BUCKET: transactionBucket.bucketName,
          PAYMENT_QUEUE_URL: paymentQueue.queueUrl,
          ENVIRONMENT: environmentSuffix,
        },
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Create alias for environment-specific deployment
    // Note: Alias is created for future deployment strategies but not used in current implementation
    new lambda.Alias(this, 'PaymentValidationAlias', {
      aliasName: environmentSuffix,
      version: this.paymentValidationFunction.currentVersion,
    });

    // Tags
    cdk.Tags.of(this.paymentValidationFunction).add(
      'Name',
      `payment-validation-${environmentSuffix}`
    );
    cdk.Tags.of(this.paymentValidationFunction).add(
      'Environment',
      environmentSuffix
    );
  }
}
