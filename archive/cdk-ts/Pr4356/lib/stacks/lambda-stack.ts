import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface LambdaStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  dataTable: dynamodb.Table;
  dataBucket: s3.Bucket;
  apiSecret: secretsmanager.Secret;
}

export class LambdaStack extends cdk.Stack {
  public readonly dataProcessorFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);

    // Lambda execution role with specific permissions
    const lambdaRole = new iam.Role(
      this,
      `LambdaRole-${props.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        description: 'Lambda execution role for data processor',
        roleName: `serverless-lambda-role-${props.environmentSuffix}`,
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
      }
    );

    // Security Group for Lambda
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `LambdaSG-${props.environmentSuffix}`,
      {
        vpc: props.vpc,
        description: 'Security group for Lambda function',
        allowAllOutbound: true,
      }
    );

    // Lambda function for data processing
    this.dataProcessorFunction = new lambda.Function(
      this,
      `DataProcessor-${props.environmentSuffix}`,
      {
        functionName: `serverless-data-processor-${props.environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
        const { randomUUID } = require('crypto');

        const dynamoClient = new DynamoDBClient({});
        const dynamoDB = DynamoDBDocumentClient.from(dynamoClient);
        const s3Client = new S3Client({});
        const secretsClient = new SecretsManagerClient({});

        exports.handler = async (event) => {
          console.log('Received event:', JSON.stringify(event, null, 2));

          try {
            // Parse request body
            const body = JSON.parse(event.body || '{}');
            const timestamp = Date.now();
            const id = randomUUID();

            // Get secrets
            const secretCommand = new GetSecretValueCommand({
              SecretId: process.env.SECRET_ARN
            });
            const secretData = await secretsClient.send(secretCommand);
            const secrets = JSON.parse(secretData.SecretString);

            // Process data
            const processedData = {
              id,
              timestamp,
              status: 'processed',
              data: body,
              processedAt: new Date().toISOString(),
              ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days TTL
            };

            // Store in DynamoDB
            const putCommand = new PutCommand({
              TableName: process.env.TABLE_NAME,
              Item: processedData
            });
            await dynamoDB.send(putCommand);

            // Store raw data in S3
            const s3Command = new PutObjectCommand({
              Bucket: process.env.BUCKET_NAME,
              Key: \`data/\${new Date().getFullYear()}/\${new Date().getMonth() + 1}/\${id}.json\`,
              Body: JSON.stringify(processedData),
              ContentType: 'application/json',
              ServerSideEncryption: 'AES256',
              Metadata: {
                'processed-by': 'lambda',
                'timestamp': timestamp.toString()
              }
            });
            await s3Client.send(s3Command);

            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                message: 'Data processed successfully',
                id,
                timestamp
              })
            };
          } catch (error) {
            console.error('Error processing data:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                message: 'Error processing data',
                error: error.message
              })
            };
          }
        };
      `),
        environment: {
          TABLE_NAME: props.dataTable.tableName,
          BUCKET_NAME: props.dataBucket.bucketName,
          SECRET_ARN: props.apiSecret.secretArn,
          ENVIRONMENT: props.environmentSuffix,
        },
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        role: lambdaRole,
        tracing: lambda.Tracing.ACTIVE,
        logRetention: logs.RetentionDays.ONE_MONTH,
        deadLetterQueueEnabled: true,
        retryAttempts: 2,
      }
    );

    // Grant permissions
    props.dataTable.grantReadWriteData(this.dataProcessorFunction);
    props.dataBucket.grantReadWrite(this.dataProcessorFunction);
    props.apiSecret.grantRead(this.dataProcessorFunction);

    // Output
    new cdk.CfnOutput(this, 'FunctionArn', {
      value: this.dataProcessorFunction.functionArn,
      description: 'Lambda Function ARN',
      exportName: `DataProcessorArn-${props.environmentSuffix}`,
    });
  }
}
