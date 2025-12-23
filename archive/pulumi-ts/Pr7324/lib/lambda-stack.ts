/**
 * lambda-stack.ts
 *
 * Defines Lambda function for data processing in VPC.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LambdaStackArgs {
  region: string;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string>[];
  securityGroupId: pulumi.Input<string>;
  auroraEndpoint: pulumi.Input<string>;
  dynamoDbTableName: pulumi.Input<string>;
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly function: aws.lambda.Function;
  public readonly role: aws.iam.Role;
  public readonly logGroup: aws.cloudwatch.LogGroup;
  public readonly functionArn: pulumi.Output<string>;
  public readonly functionName: pulumi.Output<string>;

  constructor(
    name: string,
    args: LambdaStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:lambda:LambdaStack', name, args, opts);

    const region = args.region;
    const envSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create IAM role for Lambda
    this.role = new aws.iam.Role(
      `${name}-lambda-role`,
      {
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: {
          ...tags,
          Name: `${name}-lambda-role-${envSuffix}-e7`,
          Region: region,
        },
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    new aws.iam.RolePolicyAttachment(
      `${name}-lambda-basic`,
      {
        role: this.role.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Attach VPC execution policy
    new aws.iam.RolePolicyAttachment(
      `${name}-lambda-vpc`,
      {
        role: this.role.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    // Create inline policy for DynamoDB access
    new aws.iam.RolePolicy(
      `${name}-lambda-dynamodb-policy`,
      {
        role: this.role.id,
        policy: pulumi.jsonStringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'dynamodb:PutItem',
                'dynamodb:GetItem',
                'dynamodb:UpdateItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Create CloudWatch Log Group
    this.logGroup = new aws.cloudwatch.LogGroup(
      `${name}-lambda-logs`,
      {
        name: `/aws/lambda/${name}-data-processor-${envSuffix}-e7`,
        retentionInDays: 7,
        tags: {
          ...tags,
          Region: region,
        },
      },
      { parent: this }
    );

    // Create Lambda function
    const lambdaCode = `
exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  const dbEndpoint = process.env.DB_ENDPOINT;
  const tableName = process.env.DYNAMODB_TABLE;
  const region = process.env.AWS_REGION_NAME;

  console.log('Configuration:', { dbEndpoint, tableName, region });

  // In production, this would process data from Aurora and DynamoDB
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Data processing completed',
      region: region,
      timestamp: new Date().toISOString(),
    }),
  };

  console.log('Processing complete');
  return response;
};
`;

    this.function = new aws.lambda.Function(
      `${name}-data-processor`,
      {
        name: `${name}-data-processor-${envSuffix}-e7`,
        runtime: 'nodejs20.x',
        handler: 'index.handler',
        role: this.role.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
        }),
        memorySize: 512,
        timeout: 30,
        environment: {
          variables: {
            DB_ENDPOINT: args.auroraEndpoint,
            DYNAMODB_TABLE: args.dynamoDbTableName,
            AWS_REGION_NAME: region,
          },
        },
        vpcConfig: {
          subnetIds: args.privateSubnetIds,
          securityGroupIds: [args.securityGroupId],
        },
        tags: {
          ...tags,
          Name: `${name}-lambda-${envSuffix}-e7`,
          Region: region,
          Purpose: 'data-processing',
        },
      },
      { parent: this, dependsOn: [this.logGroup] }
    );

    this.functionArn = this.function.arn;
    this.functionName = this.function.name;

    this.registerOutputs({
      functionArn: this.function.arn,
      functionName: this.function.name,
      logGroupName: this.logGroup.name,
    });
  }
}
