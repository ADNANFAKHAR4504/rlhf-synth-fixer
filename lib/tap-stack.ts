import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as sns from 'aws-cdk-lib/aws-sns';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const vpc = new ec2.Vpc(this, `tap-vpc-${environmentSuffix}`, {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'public', subnetType: ec2.SubnetType.PUBLIC },
        {
          name: 'private-egress',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    new ec2.GatewayVpcEndpoint(this, `tap-vpce-s3-${environmentSuffix}`, {
      vpc,
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });
    new ec2.GatewayVpcEndpoint(this, `tap-vpce-ddb-${environmentSuffix}`, {
      vpc,
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    const dataKmsKey = new kms.Key(this, `tap-kms-${environmentSuffix}`, {
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const logsBucket = new s3.Bucket(this, `tap-logs-${environmentSuffix}`, {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: dataKmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          expiration: cdk.Duration.days(365),
        },
      ],
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const transactionsTable = new dynamodb.Table(
      this,
      `tap-ddb-${environmentSuffix}`,
      {
        partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'ts', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: true,
        encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryptionKey: dataKmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const lambdaRole = new iam.Role(
      this,
      `tap-lambda-role-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
      }
    );
    transactionsTable.grantReadWriteData(lambdaRole);
    logsBucket.grantReadWrite(lambdaRole);
    dataKmsKey.grantEncryptDecrypt(lambdaRole);

    const processorFn = new lambda.Function(
      this,
      `tap-processor-${environmentSuffix}`,
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        handler: 'index.handler',
        code: lambda.Code.fromInline(
          "exports.handler=async(e)=>{const a=JSON.stringify(e||{});return{status:'ok',action:e&&e.action||'PROCESS',echo:a}};"
        ),
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        role: lambdaRole,
        environment: {
          ENV: environmentSuffix,
          TABLE_NAME: transactionsTable.tableName,
          LOGS_BUCKET: logsBucket.bucketName,
        },
      }
    );

    const validatorFn = new lambda.Function(
      this,
      `tap-validator-${environmentSuffix}`,
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        handler: 'index.handler',
        code: lambda.Code.fromInline(
          "exports.handler=async(e)=>{return{valid:true,phase:(e&&e.validationType)||'CHECK'}};"
        ),
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        role: lambdaRole,
        environment: {
          ENV: environmentSuffix,
          TABLE_NAME: transactionsTable.tableName,
        },
      }
    );

    const topic = new sns.Topic(
      this,
      `tap-migration-sns-${environmentSuffix}`,
      {
        masterKey: dataKmsKey,
      }
    );

    const notifyStart = new tasks.SnsPublish(
      this,
      `tap-task-start-${environmentSuffix}`,
      {
        topic,
        message: stepfunctions.TaskInput.fromText('migration-started'),
      }
    );
    const preValidate = new tasks.LambdaInvoke(
      this,
      `tap-task-pre-validate-${environmentSuffix}`,
      {
        lambdaFunction: validatorFn,
        payloadResponseOnly: true,
        payload: stepfunctions.TaskInput.fromObject({ validationType: 'PRE' }),
      }
    );
    const shiftTraffic = new tasks.LambdaInvoke(
      this,
      `tap-task-shift-${environmentSuffix}`,
      {
        lambdaFunction: processorFn,
        payloadResponseOnly: true,
        payload: stepfunctions.TaskInput.fromObject({
          action: 'UPDATE_ROUTING',
          targetWeight: 0.5,
        }),
      }
    );
    const postValidate = new tasks.LambdaInvoke(
      this,
      `tap-task-post-validate-${environmentSuffix}`,
      {
        lambdaFunction: validatorFn,
        payloadResponseOnly: true,
        payload: stepfunctions.TaskInput.fromObject({ validationType: 'POST' }),
      }
    );
    const logGroup = new logs.LogGroup(
      this,
      `tap-sfn-logs-${environmentSuffix}`,
      {
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );
    const stateMachine = new stepfunctions.StateMachine(
      this,
      `tap-sfn-${environmentSuffix}`,
      {
        definition: notifyStart
          .next(preValidate)
          .next(shiftTraffic)
          .next(postValidate),
        tracingEnabled: true,
        timeout: cdk.Duration.minutes(15),
        logs: { destination: logGroup, level: stepfunctions.LogLevel.ALL },
      }
    );

    const rule = new events.Rule(this, `tap-sync-rule-${environmentSuffix}`, {
      eventPattern: { source: ['aws.dynamodb'] },
    });
    rule.addTarget(new eventsTargets.LambdaFunction(processorFn));

    const dashboard = new cloudwatch.Dashboard(
      this,
      `tap-dashboard-${environmentSuffix}`
    );
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Processor Invocations',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: { FunctionName: processorFn.functionName },
          }),
        ],
      })
    );

    new route53.CfnHealthCheck(this, `tap-hc-${environmentSuffix}`, {
      healthCheckConfig: {
        type: 'HTTPS',
        fullyQualifiedDomainName: `api-${environmentSuffix}.example.local`,
        port: 443,
        resourcePath: '/health',
        requestInterval: 30,
        failureThreshold: 3,
      },
    });

    new cdk.CfnOutput(this, `tap-ddb-name-${environmentSuffix}`, {
      value: transactionsTable.tableName,
      exportName: `tap-ddb-name-${environmentSuffix}`,
    });
    new cdk.CfnOutput(this, `tap-bucket-name-${environmentSuffix}`, {
      value: logsBucket.bucketName,
      exportName: `tap-bucket-name-${environmentSuffix}`,
    });
    new cdk.CfnOutput(this, `tap-sfn-arn-${environmentSuffix}`, {
      value: stateMachine.stateMachineArn,
      exportName: `tap-sfn-arn-${environmentSuffix}`,
    });
  }
}
