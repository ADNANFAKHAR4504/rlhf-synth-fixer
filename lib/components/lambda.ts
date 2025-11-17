import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { EnvironmentConfig, TagsConfig } from '../types';

export interface LambdaComponentArgs {
  environmentSuffix: string;
  envConfig: EnvironmentConfig;
  tags: TagsConfig;
  vpcId: pulumi.Output<string>;
  privateSubnetIds: pulumi.Output<string>[];
  dbEndpoint: pulumi.Output<string>;
  dynamoTableName: pulumi.Output<string>;
  dynamoTableArn: pulumi.Output<string>;
}

export class LambdaComponent extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;
  public readonly securityGroup: aws.ec2.SecurityGroup;
  public readonly function: aws.lambda.Function;
  public readonly logGroup: aws.cloudwatch.LogGroup;
  public readonly functionArn: pulumi.Output<string>;
  public readonly functionName: pulumi.Output<string>;

  constructor(
    name: string,
    args: LambdaComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:lambda:LambdaComponent', name, {}, opts);

    const {
      environmentSuffix,
      envConfig,
      tags,
      vpcId,
      privateSubnetIds,
      dbEndpoint,
      dynamoTableName,
      dynamoTableArn,
    } = args;

    // Create Lambda execution role with environment prefix
    this.role = new aws.iam.Role(
      `${envConfig.environment}-payment-lambda-role-${environmentSuffix}`,
      {
        name: `${envConfig.environment}-payment-lambda-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: {
          ...tags,
          Purpose: 'lambda-execution',
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `${envConfig.environment}-lambda-basic-policy-${environmentSuffix}`,
      {
        role: this.role.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach VPC execution policy
    new aws.iam.RolePolicyAttachment(
      `${envConfig.environment}-lambda-vpc-policy-${environmentSuffix}`,
      {
        role: this.role.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Create custom policy for DynamoDB and RDS access (least privilege)
    new aws.iam.RolePolicy(
      `${envConfig.environment}-lambda-custom-policy-${environmentSuffix}`,
      {
        role: this.role.name,
        policy: pulumi.all([dynamoTableArn]).apply(([tableArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:PutItem',
                  'dynamodb:GetItem',
                  'dynamodb:Query',
                  'dynamodb:UpdateItem',
                ],
                Resource: tableArn,
              },
              {
                Effect: 'Allow',
                Action: [
                  'rds-data:ExecuteStatement',
                  'rds-data:BatchExecuteStatement',
                ],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create security group for Lambda
    this.securityGroup = new aws.ec2.SecurityGroup(
      `payment-lambda-sg-${environmentSuffix}`,
      {
        vpcId: vpcId,
        description: `Security group for Lambda functions in ${envConfig.environment}`,
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound',
          },
        ],
        tags: {
          ...tags,
          Name: `payment-lambda-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch Log Group with environment-specific retention
    this.logGroup = new aws.cloudwatch.LogGroup(
      `payment-lambda-logs-${environmentSuffix}`,
      {
        name: `/aws/lambda/payment-processor-${environmentSuffix}`,
        retentionInDays: envConfig.logRetentionDays,
        tags: {
          ...tags,
        },
      },
      { parent: this }
    );

    // Create Lambda function with 512MB memory and environment-based concurrency
    this.function = new aws.lambda.Function(
      `payment-processor-${environmentSuffix}`,
      {
        name: `payment-processor-${environmentSuffix}`,
        runtime: aws.lambda.Runtime.NodeJS20dX,
        role: this.role.arn,
        handler: 'index.handler',
        memorySize: 512,
        timeout: 30,
        reservedConcurrentExecutions: envConfig.lambdaConcurrency,
        code: new pulumi.asset.AssetArchive({
          '.': new pulumi.asset.FileArchive('./lambda'),
        }),
        vpcConfig: {
          subnetIds: privateSubnetIds,
          securityGroupIds: [this.securityGroup.id],
        },
        environment: {
          variables: {
            DB_ENDPOINT: dbEndpoint,
            DYNAMO_TABLE: dynamoTableName,
            ENVIRONMENT: envConfig.environment,
            LOG_LEVEL: envConfig.environment === 'prod' ? 'INFO' : 'DEBUG',
          },
        },
        tags: {
          ...tags,
          Name: `payment-processor-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [this.logGroup] }
    );

    this.functionArn = this.function.arn;
    this.functionName = this.function.name;

    this.registerOutputs({
      functionArn: this.functionArn,
      functionName: this.functionName,
    });
  }
}
