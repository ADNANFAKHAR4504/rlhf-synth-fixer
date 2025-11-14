import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface LambdaStackProps extends BaseStackProps {
  vpc: ec2.IVpc;
}

export class LambdaStack extends BaseStack {
  public readonly orderProcessingFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // Create execution role with environment-specific permissions boundary
    const executionRole = new iam.Role(this, 'OrderProcessingRole', {
      roleName: this.getResourceName('order-processing-role'),
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Add least-privilege permissions
    executionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:Query',
        ],
        resources: [
          `arn:aws:dynamodb:${this.region}:${this.account}:table/orders-${this.environmentSuffix}`,
        ],
      })
    );

    executionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['sqs:SendMessage', 'sqs:GetQueueUrl'],
        resources: [
          `arn:aws:sqs:${this.region}:${this.account}:order-processing-${this.environmentSuffix}`,
        ],
      })
    );

    executionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject', 's3:GetObject'],
        resources: [`arn:aws:s3:::trade-data-${this.environmentSuffix}/*`],
      })
    );

    // Security group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc: props.vpc,
        securityGroupName: this.getResourceName('lambda-sg'),
        description: 'Security group for order processing Lambda',
        allowAllOutbound: true,
      }
    );

    // Create Lambda function with environment-specific configuration
    this.orderProcessingFunction = new lambda.Function(
      this,
      'OrderProcessingFunction',
      {
        functionName: this.getResourceName('order-processing'),
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/order-processing'),
        memorySize: this.environmentConfig.lambdaConfig.memorySize,
        timeout: cdk.Duration.seconds(
          this.environmentConfig.lambdaConfig.timeout
        ),
        reservedConcurrentExecutions:
          this.environmentConfig.lambdaConfig.reservedConcurrentExecutions,
        role: executionRole,
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
        environment: {
          ENVIRONMENT: this.environmentSuffix,
          DYNAMODB_TABLE: `orders-${this.environmentSuffix}`,
          SQS_QUEUE: `order-processing-${this.environmentSuffix}`,
          S3_BUCKET: `trade-data-${this.environmentSuffix}`,
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // Export Lambda function ARN
    this.exportToParameterStore(
      'order-processing-function-arn',
      this.orderProcessingFunction.functionArn
    );
  }
}
