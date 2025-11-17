import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface LambdaConstructProps {
  environmentSuffix: string;
  config: EnvironmentConfig;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  databaseSecretArn: string;
}

export class LambdaConstruct extends Construct {
  public readonly dataProcessorFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    // Create IAM role for Lambda
    const lambdaRole = new iam.Role(
      this,
      `LambdaRole-${props.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        roleName: `lambda-role-${props.environmentSuffix}`,
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
      }
    );

    // Add permissions for Secrets Manager
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['secretsmanager:GetSecretValue'],
        resources: [props.databaseSecretArn],
      })
    );

    // FIX 3: Use RetentionDays enum with proper mapping
    // FIX 4: Add RemovalPolicy.DESTROY to log group
    // Map numeric days to enum keys
    const retentionMapping: Record<number, logs.RetentionDays> = {
      1: logs.RetentionDays.ONE_DAY,
      3: logs.RetentionDays.THREE_DAYS,
      5: logs.RetentionDays.FIVE_DAYS,
      7: logs.RetentionDays.ONE_WEEK,
      14: logs.RetentionDays.TWO_WEEKS,
      30: logs.RetentionDays.ONE_MONTH,
      60: logs.RetentionDays.TWO_MONTHS,
      90: logs.RetentionDays.THREE_MONTHS,
      120: logs.RetentionDays.FOUR_MONTHS,
      150: logs.RetentionDays.FIVE_MONTHS,
      180: logs.RetentionDays.SIX_MONTHS,
      365: logs.RetentionDays.ONE_YEAR,
    };

    const logGroup = new logs.LogGroup(
      this,
      `LambdaLogGroup-${props.environmentSuffix}`,
      {
        logGroupName: `/aws/lambda/data-processor-${props.environmentSuffix}`,
        retention: retentionMapping[props.config.logRetention],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create Lambda function
    this.dataProcessorFunction = new lambda.Function(
      this,
      `DataProcessor-${props.environmentSuffix}`,
      {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import os

def handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps('Data processor function')
    }
        `),
        functionName: `data-processor-${props.environmentSuffix}`,
        memorySize: props.config.lambdaMemorySize,
        timeout: cdk.Duration.seconds(30),
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [props.securityGroup],
        role: lambdaRole,
        environment: {
          DB_SECRET_ARN: props.databaseSecretArn,
        },
        logGroup: logGroup,
      }
    );
  }
}
