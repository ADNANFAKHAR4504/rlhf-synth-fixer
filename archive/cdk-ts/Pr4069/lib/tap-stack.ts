import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IEnvironmentConfig } from './config/environment-config';
import { ApiGatewayAccountConstruct } from './constructs/api-gateway-account-construct';
import { ApiGatewayConstruct } from './constructs/api-gateway-construct';
import { CognitoConstruct } from './constructs/cognito-construct';
import { DynamoDBConstruct } from './constructs/dynamodb-construct';
import { LambdaConstruct } from './constructs/lambda-construct';
import { MonitoringConstruct } from './constructs/monitoring-construct';
import { VpcConstruct } from './constructs/vpc-construct';

export interface TapStackProps extends cdk.StackProps {
  config: IEnvironmentConfig;
  environment: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Set up API Gateway CloudWatch Logs role (regional setting)
    new ApiGatewayAccountConstruct(this, 'ApiGatewayAccount');

    const vpc = new VpcConstruct(this, 'VPC', {
      environment: props.environment,
      config: props.config.vpc,
    });

    const cognito = new CognitoConstruct(this, 'Cognito', {
      environment: props.environment,
      config: props.config.cognito,
    });

    const dynamodb = new DynamoDBConstruct(this, 'DynamoDB', {
      environment: props.environment,
      config: props.config.dynamodb,
      budgetLimit: props.config.budgetLimit,
    });

    const lambda = new LambdaConstruct(this, 'Lambda', {
      environment: props.environment,
      vpc: vpc.vpc,
      tables: dynamodb.tables,
      config: props.config.lambda,
      environmentVariables: props.config.environmentVariables,
    });

    const apiGateway = new ApiGatewayConstruct(this, 'APIGateway', {
      environment: props.environment,
      lambdaFunctions: lambda.functions,
      userPool: cognito.userPool,
      config: props.config.apiGateway,
      domainConfig: props.config.customDomain,
    });

    new MonitoringConstruct(this, 'Monitoring', {
      environment: props.environment,
      lambdaFunctions: lambda.functions,
      apiGateway: apiGateway.api,
      tables: dynamodb.tables,
      config: props.config.monitoring,
    });

    // API Gateway Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: apiGateway.api.url,
      description: 'API Gateway URL',
      exportName: `${props.environment}-ApiUrl`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: apiGateway.api.restApiId,
      description: 'API Gateway ID',
      exportName: `${props.environment}-ApiId`,
    });

    new cdk.CfnOutput(this, 'ApiStageName', {
      value: props.config.apiGateway.stageName,
      description: 'API Gateway Stage Name',
      exportName: `${props.environment}-ApiStageName`,
    });

    if (apiGateway.customDomainName) {
      new cdk.CfnOutput(this, 'CustomApiUrl', {
        value: `https://${apiGateway.customDomainName}`,
        description: 'Custom API Domain URL',
        exportName: `${props.environment}-CustomApiUrl`,
      });
    }

    // Cognito Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: cognito.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `${props.environment}-UserPoolId`,
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: cognito.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
      exportName: `${props.environment}-UserPoolArn`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: cognito.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `${props.environment}-UserPoolClientId`,
    });

    // VPC Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${props.environment}-VpcId`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: vpc.vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
      exportName: `${props.environment}-VpcCidr`,
    });

    // DynamoDB Table Outputs
    Object.keys(dynamodb.tables).forEach(name => {
      const table = dynamodb.tables[name];
      new cdk.CfnOutput(this, `${name}TableName`, {
        value: table.tableName,
        description: `${name} DynamoDB Table Name`,
        exportName: `${props.environment}-${name}TableName`,
      });

      new cdk.CfnOutput(this, `${name}TableArn`, {
        value: table.tableArn,
        description: `${name} DynamoDB Table ARN`,
        exportName: `${props.environment}-${name}TableArn`,
      });
    });

    // Lambda Function Outputs
    Object.keys(lambda.functions).forEach(name => {
      const fn = lambda.functions[name];
      new cdk.CfnOutput(this, `${name}FunctionName`, {
        value: fn.functionName,
        description: `${name} Lambda Function Name`,
        exportName: `${props.environment}-${name}FunctionName`,
      });

      new cdk.CfnOutput(this, `${name}FunctionArn`, {
        value: fn.functionArn,
        description: `${name} Lambda Function ARN`,
        exportName: `${props.environment}-${name}FunctionArn`,
      });
    });

    // Lambda Alias Outputs (if versioning is enabled)
    if (props.config.lambda.enableVersioning) {
      Object.keys(lambda.aliases).forEach(name => {
        const alias = lambda.aliases[name];
        new cdk.CfnOutput(this, `${name}AliasName`, {
          value: alias.aliasName,
          description: `${name} Lambda Alias Name`,
          exportName: `${props.environment}-${name}AliasName`,
        });

        new cdk.CfnOutput(this, `${name}AliasArn`, {
          value: alias.functionArn,
          description: `${name} Lambda Alias ARN`,
          exportName: `${props.environment}-${name}AliasArn`,
        });
      });
    }

    // Environment Output
    new cdk.CfnOutput(this, 'Environment', {
      value: props.environment,
      description: 'Deployment Environment',
      exportName: `${props.environment}-Environment`,
    });

    // Region Output
    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
      exportName: `${props.environment}-Region`,
    });
  }
}
