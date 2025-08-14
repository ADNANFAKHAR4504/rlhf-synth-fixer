import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LambdaStackArgs {
  environmentSuffix: string;
  tableName: pulumi.Output<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly lambdaFunction: aws.lambda.Function;
  public readonly lambdaFunctionName: pulumi.Output<string>;

  constructor(
    name: string,
    args: LambdaStackArgs,
    opts?: pulumi.ResourceOptions
  ) {
    super('tap:lambda:LambdaStack', name, args, opts);

    // Create IAM role for Lambda with least privilege
    const lambdaRole = new aws.iam.Role(
      `tap-lambda-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: args.tags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(
      `tap-lambda-basic-${args.environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Create custom policy for DynamoDB access
    const dynamodbPolicy = new aws.iam.RolePolicy(
      `tap-lambda-dynamodb-policy-${args.environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi.all([args.tableName]).apply(([tableName]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:GetItem',
                  'dynamodb:PutItem',
                  'dynamodb:UpdateItem',
                  'dynamodb:DeleteItem',
                  'dynamodb:Query',
                  'dynamodb:Scan',
                  'dynamodb:BatchGetItem',
                  'dynamodb:BatchWriteItem',
                  'dynamodb:ExecuteStatement',
                  'dynamodb:ExecuteTransaction',
                  'dynamodb:PartiQLSelect',
                  'dynamodb:PartiQLInsert',
                  'dynamodb:PartiQLUpdate',
                  'dynamodb:PartiQLDelete',
                ],
                Resource: `arn:aws:dynamodb:us-east-1:*:table/${tableName}`,
              },
              {
                Effect: 'Allow',
                Action: [
                  'kms:Decrypt',
                  'kms:GenerateDataKey',
                  'kms:DescribeKey',
                ],
                Resource: '*',
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Lambda function code
    const lambdaCode = `
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, ExecuteStatementCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event, context) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    const tableName = process.env.TABLE_NAME;
    
    try {
        const httpMethod = event.httpMethod;
        const path = event.path;
        
        switch (httpMethod) {
            case 'GET':
                if (event.pathParameters && event.pathParameters.id) {
                    // Get specific item
                    const id = event.pathParameters.id;
                    const getResult = await ddbDocClient.send(new GetCommand({
                        TableName: tableName,
                        Key: { id: id }
                    }));
                    
                    return {
                        statusCode: 200,
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                        },
                        body: JSON.stringify(getResult.Item || {})
                    };
                } else {
                    // List all items using PartiQL
                    const partiQLResult = await ddbDocClient.send(new ExecuteStatementCommand({
                        Statement: \`SELECT * FROM "\${tableName}"\`
                    }));
                    
                    return {
                        statusCode: 200,
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*",
                        },
                        body: JSON.stringify(partiQLResult.Items || [])
                    };
                }
                
            case 'POST':
                const body = JSON.parse(event.body || '{}');
                const item = {
                    id: body.id || new Date().getTime().toString(),
                    ...body,
                    createdAt: new Date().toISOString()
                };
                
                await ddbDocClient.send(new PutCommand({
                    TableName: tableName,
                    Item: item
                }));
                
                return {
                    statusCode: 201,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    body: JSON.stringify(item)
                };
                
            default:
                return {
                    statusCode: 405,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    body: JSON.stringify({ message: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ 
                message: 'Internal server error',
                error: error.message 
            })
        };
    }
};
`;

    // Create Lambda function
    this.lambdaFunction = new aws.lambda.Function(
      `tap-lambda-${args.environmentSuffix}`,
      {
        runtime: aws.lambda.Runtime.NodeJS22dX,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(lambdaCode),
          'package.json': new pulumi.asset.StringAsset(
            JSON.stringify({
              name: 'tap-serverless-lambda',
              version: '1.0.0',
              dependencies: {
                '@aws-sdk/client-dynamodb': '^3.0.0',
                '@aws-sdk/lib-dynamodb': '^3.0.0',
              },
            })
          ),
        }),
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 30,
        memorySize: 256,
        environment: {
          variables: {
            TABLE_NAME: args.tableName,
            NODE_ENV: 'production',
          },
        },
        tags: args.tags,
      },
      { parent: this, dependsOn: [lambdaBasicPolicy, dynamodbPolicy] }
    );

    this.lambdaFunctionName = this.lambdaFunction.name;

    this.registerOutputs({
      lambdaFunctionName: this.lambdaFunctionName,
    });
  }
}
