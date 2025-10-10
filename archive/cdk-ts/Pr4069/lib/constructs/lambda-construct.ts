import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';
import { ILambdaConfig } from '../config/environment-config';

export interface LambdaConstructProps {
  environment: string;
  vpc: ec2.Vpc;
  tables: { [key: string]: dynamodb.Table };
  config: ILambdaConfig;
  environmentVariables: { [key: string]: string };
}

export class LambdaConstruct extends Construct {
  public readonly functions: { [key: string]: lambda.Function } = {};
  public readonly aliases: { [key: string]: lambda.Alias } = {};

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    props.config.functions.forEach(functionConfig => {
      const logGroup = new logs.LogGroup(
        this,
        `${functionConfig.name}LogGroup`,
        {
          logGroupName: `/aws/lambda/${props.environment}-${functionConfig.name}`,
          retention: logs.RetentionDays.ONE_MONTH,
          removalPolicy:
            props.environment === 'production'
              ? cdk.RemovalPolicy.RETAIN
              : cdk.RemovalPolicy.DESTROY,
        }
      );

      const functionRole = new iam.Role(this, `${functionConfig.name}Role`, {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        description: `Role for ${functionConfig.name} Lambda function`,
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
        inlinePolicies: {
          LambdaExecutionPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                resources: [logGroup.logGroupArn],
              }),
              new iam.PolicyStatement({
                actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
                resources: ['*'],
              }),
            ],
          }),
        },
      });

      const fn = new NodejsFunction(this, functionConfig.name, {
        functionName: `${props.environment}-${functionConfig.name}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, '../lambda/user-handler.ts'),
        handler: 'handler',
        memorySize: functionConfig.memorySize,
        timeout: cdk.Duration.seconds(functionConfig.timeout),
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        environment: {
          ENVIRONMENT: props.environment,
          ...props.environmentVariables,
          ...Object.entries(props.tables).reduce(
            (acc, [name, table]) => ({
              ...acc,
              [`${name.toUpperCase()}_TABLE_NAME`]: table.tableName,
            }),
            {}
          ),
        },
        reservedConcurrentExecutions:
          functionConfig.reservedConcurrentExecutions,
        tracing: lambda.Tracing.ACTIVE,
        role: functionRole,
        logGroup: logGroup,
        bundling: {
          minify: true,
          sourceMap: true,
          externalModules: ['aws-sdk'],
        },
      });

      Object.values(props.tables).forEach(table => {
        table.grantReadWriteData(fn);
      });

      if (props.config.enableVersioning) {
        const version = fn.currentVersion;

        const alias = new lambda.Alias(this, `${functionConfig.name}Alias`, {
          aliasName: props.config.aliasName,
          version: version,
          provisionedConcurrentExecutions:
            props.environment === 'production' ? 1 : undefined,
        });

        this.aliases[functionConfig.name] = alias;
        this.functions[functionConfig.name] = fn;
      } else {
        this.functions[functionConfig.name] = fn;
      }

      cdk.Tags.of(fn).add(
        'Name',
        `${props.environment}-${functionConfig.name}`
      );
    });
  }
}
