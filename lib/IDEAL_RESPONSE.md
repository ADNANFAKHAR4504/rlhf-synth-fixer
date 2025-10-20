## Ideal response — implemented library files and rationale

This document summarizes the changes made under `lib/` to repair and harden the serverless infrastructure, list the implemented source files, and include each `.ts` and `.js` source file found in `lib/` with properly formatted code blocks.

Summary of what was implemented
- Added a robust CDK stack that provisions an API Gateway + Lambda + DynamoDB + S3 bucket + SSM parameter + DLQ.
- Replaced a simple asset Lambda with a `NodejsFunction` bundling configuration so dependencies (aws-sdk, uuid) are included in the deployment artifact.
- Added a minimal Lambda handler that reads an SSM parameter, validates the request, and writes an item to DynamoDB.
- Improved integration tests to fetch CloudWatch logs on failure and added diagnostics for debugging 502 responses.

Files included below (source preserved):

- `serverless-infrastructure-stack.ts` — CDK stack that creates the resources and configures NodejsFunction bundling.
- `lambda-handler/index.js` — Lambda handler implementing the HTTP POST to /items and DynamoDB write.
- `tap-stack.ts` — Simple wrapper that instantiates the serverless stack at the app root.

---

### lib/serverless-infrastructure-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface ServerlessInfrastructureStackProps extends cdk.StackProps {
	readonly envSuffix?: string; // optional environment suffix (e.g., dev, prod)
}

function sanitizeName(input: string): string {
	return input
		.toLowerCase()
		.replace(/[^a-z0-9-]/g, '-')
		.replace(/-+/g, '-')
		.replace(/(^-|-$)/g, '')
		.slice(0, 63);
}

export class ServerlessInfrastructureStack extends cdk.Stack {
	constructor(
		scope: Construct,
		id: string,
		props?: ServerlessInfrastructureStackProps
	) {
		super(scope, id, props);

		// Add global tag required by the task
		cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

		// Environment suffix: prefer explicit prop, then env var, then 'dev'
		const envName = (props && props.envSuffix) || process.env.ENV || 'dev';
		const ts = Date.now().toString().slice(-6); // short timestamp
		const resourceSuffix = sanitizeName(`${envName}-${ts}`);

		// DynamoDB table
		const dynamoTable = new dynamodb.Table(this, 'ApplicationTable', {
			tableName: `application-table-${resourceSuffix}`,
			partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		// S3 bucket for API logs (created but not wired directly to APIGW access logs)
		const logsBucket = new s3.Bucket(this, 'ApiLogsBucket', {
			bucketName: sanitizeName(`api-logs-${resourceSuffix}`),
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			autoDeleteObjects: true,
			lifecycleRules: [{ expiration: cdk.Duration.days(30) }],
		});

		// SSM Parameter for configuration
		const configParameter = new ssm.StringParameter(this, 'ConfigParameter', {
			parameterName: `/application/config-${resourceSuffix}`,
			stringValue: JSON.stringify({ apiVersion: '1.0', environment: envName }),
			description: 'Application configuration parameter',
		});

		// Dead-letter queue
		const deadLetterQueue = new sqs.Queue(this, 'LambdaDeadLetterQueue', {
			queueName: `lambda-dlq-${resourceSuffix}`,
			retentionPeriod: cdk.Duration.days(14),
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		// IAM role for Lambda with least-privilege statements
		const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
			roleName: `lambda-execution-role-${resourceSuffix}`,
			assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
		});

		// Attach minimal managed policy for CloudWatch logging
		lambdaRole.addManagedPolicy(
			iam.ManagedPolicy.fromAwsManagedPolicyName(
				'service-role/AWSLambdaBasicExecutionRole'
			)
		);

		// Minimal X-Ray permissions (narrowly scoped actions)
		lambdaRole.addToPolicy(
			new iam.PolicyStatement({
				actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
				resources: ['*'],
				effect: iam.Effect.ALLOW,
			})
		);

		// Create Lambda function name (include stack name to avoid collisions across stacks)
		const lambdaFunctionName = sanitizeName(
			`${this.stackName}-application-function-${resourceSuffix}`
		);

		// Lambda function using NodejsFunction bundling so dependencies are included
		const lambdaFunction = new NodejsFunction(this, 'ApplicationFunction', {
			functionName: lambdaFunctionName,
			runtime: lambda.Runtime.NODEJS_18_X,
			entry: path.join(__dirname, 'lambda-handler', 'index.js'),
			handler: 'handler',
			role: lambdaRole,
			environment: {
				TABLE_NAME: dynamoTable.tableName,
				CONFIG_PARAMETER_NAME: configParameter.parameterName,
				ENV: envName,
			},
			deadLetterQueue: deadLetterQueue,
			deadLetterQueueEnabled: true,
			tracing: lambda.Tracing.ACTIVE,
			timeout: cdk.Duration.seconds(30),
			memorySize: 256,
			bundling: {
				// ensure aws-sdk (v2) and uuid are bundled into the lambda package
				nodeModules: ['aws-sdk', 'uuid'],
			},
		});

		// Grant the lambda minimal access to resources
		dynamoTable.grantReadWriteData(lambdaFunction);
		deadLetterQueue.grantSendMessages(lambdaFunction);
		configParameter.grantRead(lambdaFunction);

		// Do not create an explicit Lambda LogGroup with a fixed name to avoid
		// cross-stack name collisions. Lambda will create the log group at
		// /aws/lambda/<functionName> automatically. If retention configuration
		// is required, consider using a LogRetention construct that can apply
		// retention to an existing log group.

		// API Gateway log group
		const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
			logGroupName: `/aws/apigateway/application-api-${resourceSuffix}`,
			retention: logs.RetentionDays.ONE_WEEK,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		// API Gateway (REST API)
		const api = new apigateway.RestApi(this, 'ApplicationApi', {
			restApiName: `application-api-${resourceSuffix}`,
			deployOptions: {
				stageName: 'prod',
				loggingLevel: apigateway.MethodLoggingLevel.INFO,
				dataTraceEnabled: true,
				tracingEnabled: true,
				accessLogDestination: new apigateway.LogGroupLogDestination(
					apiLogGroup
				),
				accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
			},
			defaultCorsPreflightOptions: {
				allowOrigins: apigateway.Cors.ALL_ORIGINS,
				allowMethods: apigateway.Cors.ALL_METHODS,
			},
		});

		// Lambda integration (with proxy integration)
		const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
			proxy: true,
		});

		const apiResource = api.root.addResource('items');
		apiResource.addMethod('GET', lambdaIntegration);
		apiResource.addMethod('POST', lambdaIntegration);
		apiResource.addMethod('PUT', lambdaIntegration);
		apiResource.addMethod('DELETE', lambdaIntegration);

		// Outputs
		new cdk.CfnOutput(this, 'ApiEndpointUrl', {
			value: api.url,
			description: 'API Gateway endpoint URL',
			exportName: `api-endpoint-url-${resourceSuffix}`,
		});

		new cdk.CfnOutput(this, 'DynamoTableName', {
			value: dynamoTable.tableName,
			description: 'DynamoDB table name',
			exportName: `dynamo-table-name-${resourceSuffix}`,
		});

		new cdk.CfnOutput(this, 'LogsBucketName', {
			value: logsBucket.bucketName,
			description: 'S3 bucket for API logs',
			exportName: `logs-bucket-name-${resourceSuffix}`,
		});
	}
}
```

### lib/lambda-handler/index.js
```typescript
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const ssm = new AWS.SSM();

// Simple event processor: on POST /items this function writes an item to DynamoDB
// and uses a configuration parameter from SSM to augment the item.
exports.handler = async (event) => {
	console.log('Received event:', JSON.stringify(event));

	const now = new Date().toISOString();

	// Read config parameter (non-blocking if missing)
	let config = {};
	try {
		const paramName = process.env.CONFIG_PARAMETER_NAME;
		if (paramName) {
			const res = await ssm.getParameter({ Name: paramName }).promise();
			config = JSON.parse(res.Parameter.Value || '{}');
		}
	} catch (err) {
		console.warn('Unable to read config parameter:', err.message || err);
	}

	// Parse body for API Gateway proxy integration
	let body = {};
	try {
		body = typeof event.body === 'string' ? JSON.parse(event.body) : (event.body || {});
	} catch (err) {
		return {
			statusCode: 400,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ error: 'Invalid JSON body' }),
		};
	}

	// Minimal validation
	if (!body || !body.id) {
		return {
			statusCode: 400,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ error: 'Missing required field: id' }),
		};
	}

	const item = {
		id: body.id,
		payload: body.payload || null,
		receivedAt: now,
		environment: process.env.ENV || 'dev',
		configVersion: config.apiVersion || 'unknown',
	};

	try {
		await dynamo.put({ TableName: process.env.TABLE_NAME, Item: item }).promise();
	} catch (err) {
		console.error('DynamoDB put error:', err);
		return {
			statusCode: 500,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ error: 'Internal Server Error' }),
		};
	}

	return {
		statusCode: 201,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ message: 'Item stored', item }),
	};
};
```

---
