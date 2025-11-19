import * as pulumi from '@pulumi/pulumi';
import { EnvironmentConfig } from './types';
import { VpcComponent } from './vpc-component';
import { RdsComponent } from './rds-component';
import { LambdaComponent } from './lambda-component';
import { ApiGatewayComponent } from './api-gateway-component';
import { DynamoDBComponent } from './dynamodb-component';
import { S3Component } from './s3-component';
import { CloudWatchComponent } from './cloudwatch-component';
import { getEnvironmentConfig, getResourceTags } from './config';

export interface EnvironmentComponentArgs {
  environmentSuffix: string;
  baseEnvironment?: 'dev' | 'staging' | 'prod';
}

/**
 * Reusable Environment Component that orchestrates all resources
 * for a specific environment (dev, staging, prod)
 */
export class EnvironmentComponent extends pulumi.ComponentResource {
  public readonly config: EnvironmentConfig;
  public readonly vpc: VpcComponent;
  public readonly rds: RdsComponent;
  public readonly lambda: LambdaComponent;
  public readonly apiGateway: ApiGatewayComponent;
  public readonly dynamodb: DynamoDBComponent;
  public readonly s3: S3Component;
  public readonly cloudwatch: CloudWatchComponent;

  constructor(
    name: string,
    args: EnvironmentComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:environment:EnvironmentComponent', name, {}, opts);

    const { environmentSuffix, baseEnvironment } = args;

    // Use baseEnvironment for configuration, fallback to environmentSuffix for backward compatibility
    const configEnvironment = baseEnvironment || environmentSuffix;

    // Get environment configuration using the base environment
    this.config = getEnvironmentConfig(configEnvironment);

    // Use environmentSuffix for resource tags to maintain unique naming
    const tags = getResourceTags(environmentSuffix);

    // Create VPC and networking
    this.vpc = new VpcComponent(
      'vpc',
      {
        config: this.config,
        tags,
        environmentSuffix,
      },
      { parent: this }
    );

    // Create RDS database
    this.rds = new RdsComponent(
      'rds',
      {
        config: this.config,
        tags,
        environmentSuffix,
        vpcId: this.vpc.vpc.id,
        privateSubnetIds: pulumi.all(this.vpc.privateSubnets.map(s => s.id)),
      },
      { parent: this }
    );

    // Create Lambda function
    this.lambda = new LambdaComponent(
      'lambda',
      {
        config: this.config,
        tags,
        environmentSuffix,
        vpcId: this.vpc.vpc.id,
        privateSubnetIds: pulumi.all(this.vpc.privateSubnets.map(s => s.id)),
        dbEndpoint: this.rds.dbInstance.endpoint,
      },
      { parent: this }
    );

    // Create API Gateway
    this.apiGateway = new ApiGatewayComponent(
      'api',
      {
        config: this.config,
        tags,
        environmentSuffix,
        lambdaFunctionArn: this.lambda.lambdaFunction.arn,
        lambdaFunctionName: this.lambda.lambdaFunction.name,
      },
      { parent: this }
    );

    // Create DynamoDB table
    this.dynamodb = new DynamoDBComponent(
      'dynamodb',
      {
        config: this.config,
        tags,
        environmentSuffix,
      },
      { parent: this }
    );

    // Create S3 bucket
    this.s3 = new S3Component(
      's3',
      {
        config: this.config,
        tags,
        environmentSuffix,
      },
      { parent: this }
    );

    // Create CloudWatch monitoring
    this.cloudwatch = new CloudWatchComponent(
      'cloudwatch',
      {
        config: this.config,
        tags,
        environmentSuffix,
        lambdaFunctionName: this.lambda.lambdaFunction.name,
        apiGatewayName: this.apiGateway.api.name,
        dynamoTableName: this.dynamodb.table.name,
        rdsInstanceId: this.rds.dbInstance.identifier,
      },
      { parent: this }
    );

    this.registerOutputs({
      environment: this.config.environment,
      vpcId: this.vpc.vpc.id,
      dbEndpoint: this.rds.dbInstance.endpoint,
      lambdaArn: this.lambda.lambdaFunction.arn,
      apiUrl: this.apiGateway.stage.invokeUrl,
      tableName: this.dynamodb.table.name,
      bucketName: this.s3.bucket.id,
      dashboardName: this.cloudwatch.dashboard.dashboardName,
    });
  }
}
