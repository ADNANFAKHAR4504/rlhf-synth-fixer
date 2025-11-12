```typescript
// bin/tap.ts
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```
```typescript
// lib/tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as config from 'aws-cdk-lib/aws-config';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export interface TapStackProps extends cdk.StackProps {
	environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props: TapStackProps) {
		super(scope, id, props);

		const env = props.environmentSuffix;

		const configTable = new dynamodb.Table(this, 'ConfigTable', {
			partitionKey: { name: 'configId', type: dynamodb.AttributeType.STRING },
			sortKey: { name: 'version', type: dynamodb.AttributeType.STRING },
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			timeToLiveAttribute: 'ttl',
			pointInTimeRecovery: true,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
			tableName: `${env}-config-tracking`,
		});

		configTable.addGlobalSecondaryIndex({
			indexName: 'EnvironmentIndex',
			partitionKey: { name: 'environment', type: dynamodb.AttributeType.STRING },
			sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
		});

		const reportsBucket = new s3.Bucket(this, 'ReportsBucket', {
			versioned: true,
			encryption: s3.BucketEncryption.S3_MANAGED,
			lifecycleRules: [
				{
					transitions: [
						{ storageClass: s3.StorageClass.GLACIER, transitionAfter: cdk.Duration.days(30) },
					],
					expiration: cdk.Duration.days(90),
				},
			],
			autoDeleteObjects: true,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		const repo = new ecr.Repository(this, 'BuildImagesRepo', {
			repositoryName: `${env}-config-sync-builds`,
			imageScanOnPush: true,
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
			assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
			managedPolicies: [
				iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
			],
		});

		lambdaRole.addToPolicy(
			new iam.PolicyStatement({
				actions: ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
				resources: [configTable.tableArn, `${configTable.tableArn}/index/*`],
			}),
		);

		lambdaRole.addToPolicy(
			new iam.PolicyStatement({
				actions: ['s3:PutObject', 's3:GetObject'],
				resources: [reportsBucket.arnForObjects('*')],
			}),
		);

		lambdaRole.addToPolicy(
			new iam.PolicyStatement({
				actions: ['cloudformation:DescribeStacks', 'cloudformation:ListStackResources'],
				resources: ['*'],
			}),
		);

		lambdaRole.addToPolicy(
			new iam.PolicyStatement({
				actions: ['ssm:GetParameter', 'ssm:GetParameters'],
				resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/${env}/*`],
			}),
		);

		const driftFn = new lambda.Function(this, 'DriftDetectionFn', {
			runtime: lambda.Runtime.NODEJS_20_X,
			architecture: lambda.Architecture.ARM_64,
			handler: 'index.handler',
			code: lambda.Code.fromInline('exports.handler=async()=>{"ok":true};'),
			timeout: cdk.Duration.minutes(5),
			memorySize: 256,
			role: lambdaRole,
			environment: {
				CONFIG_TABLE: configTable.tableName,
				REPORTS_BUCKET: reportsBucket.bucketName,
				ENVIRONMENT: env,
				TTL_DAYS: '90',
				ALERT_EMAIL_PARAM: `/${env}/config-sync/alert-email`,
			},
		});

		new events.Rule(this, 'DriftSchedule', {
			schedule: events.Schedule.rate(cdk.Duration.minutes(30)),
			targets: [new targets.LambdaFunction(driftFn)],
		});

		const approvalTopic = new sns.Topic(this, 'ApprovalTopic', {
			topicName: `${env}-config-approval`,
		});

		const approvalFn = new lambda.Function(this, 'ApprovalHandlerFn', {
			runtime: lambda.Runtime.NODEJS_20_X,
			architecture: lambda.Architecture.ARM_64,
			handler: 'index.handler',
			code: lambda.Code.fromInline('exports.handler=async()=>{"approved":true};'),
			role: lambdaRole,
			environment: {
				APPROVAL_TOPIC_ARN: approvalTopic.topicArn,
				CONFIG_TABLE: configTable.tableName,
				ENVIRONMENT: env,
			},
		});

		approvalTopic.addSubscription(new subs.LambdaSubscription(approvalFn));

		const validationProject = new codebuild.Project(this, 'ValidationProject', {
			projectName: `${env}-config-validation`,
			environment: {
				buildImage: codebuild.LinuxBuildImage.fromEcrRepository(repo),
				computeType: codebuild.ComputeType.SMALL,
			},
			buildSpec: codebuild.BuildSpec.fromObject({
				version: '0.2',
				phases: {
					build: { commands: ['echo validate'] },
				},
			}),
			removalPolicy: cdk.RemovalPolicy.DESTROY,
		});

		configTable.grantReadWriteData(validationProject);
		reportsBucket.grantReadWrite(validationProject);

		const promotionFn = new lambda.Function(this, 'ConfigPromotionFn', {
			runtime: lambda.Runtime.NODEJS_20_X,
			architecture: lambda.Architecture.ARM_64,
			handler: 'index.handler',
			code: lambda.Code.fromInline('exports.handler=async()=>{"promoted":true};'),
			role: lambdaRole,
			environment: {
				VALIDATION_PROJECT_NAME: validationProject.projectName,
				CONFIG_TABLE: configTable.tableName,
				ENVIRONMENT: env,
			},
		});

		promotionFn.addToRolePolicy(
			new iam.PolicyStatement({
				actions: ['codebuild:StartBuild', 'codebuild:BatchGetBuilds'],
				resources: [validationProject.projectArn],
			}),
		);

		const complianceFn = new lambda.Function(this, 'ComplianceEvaluatorFn', {
			runtime: lambda.Runtime.NODEJS_20_X,
			architecture: lambda.Architecture.ARM_64,
			handler: 'index.handler',
			code: lambda.Code.fromInline('exports.handler=async()=>({compliance_type:"COMPLIANT"});'),
			role: lambdaRole,
		});

		new config.CustomRule(this, 'ConfigComplianceRule', {
			configRuleName: `${env}-config-sync-compliance`,
			lambdaFunction: complianceFn,
			periodic: true,
			maximumExecutionFrequency: config.MaximumExecutionFrequency.TWENTY_FOUR_HOURS,
		});

		const rollbackFn = new lambda.Function(this, 'RollbackHandlerFn', {
			runtime: lambda.Runtime.NODEJS_20_X,
			architecture: lambda.Architecture.ARM_64,
			handler: 'index.handler',
			code: lambda.Code.fromInline('exports.handler=async()=>{"rollback":true};'),
			role: lambdaRole,
		});

		rollbackFn.addToRolePolicy(
			new iam.PolicyStatement({
				actions: [
					'cloudformation:ContinueUpdateRollback',
					'cloudformation:GetStackPolicy',
					'cloudformation:SetStackPolicy',
				],
				resources: [`arn:aws:cloudformation:${this.region}:${this.account}:stack/*`],
			}),
		);

		new events.Rule(this, 'StackFailureRule', {
			eventPattern: {
				source: ['aws.cloudformation'],
				detailType: ['CloudFormation Stack Status Change'],
			},
			targets: [new targets.LambdaFunction(rollbackFn)],
		});

		new cdk.CfnOutput(this, 'ConfigTableName', {
			value: configTable.tableName,
			exportName: `${env}-ConfigTableName`,
		});

		new cdk.CfnOutput(this, 'ReportsBucketName', {
			value: reportsBucket.bucketName,
			exportName: `${env}-ReportsBucketName`,
		});

		new cdk.CfnOutput(this, 'ApprovalTopicArn', {
			value: approvalTopic.topicArn,
			exportName: `${env}-ApprovalTopicArn`,
		});

		ssm.StringParameter.fromStringParameterAttributes(this, 'AlertEmailParam', {
			parameterName: `/${env}/config-sync/alert-email`,
		});
	}
}
```
```json
// cdk.json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "context": {
    "@aws-cdk/core:target-partitions": ["aws"]
  }
}
```