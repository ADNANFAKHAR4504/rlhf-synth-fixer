## IDEAL_RESPONSE — lib/ directory summary

This document describes the key source files implemented under `lib/` for the compliance scanner CDK application and includes the full source of the TypeScript/JavaScript files present in `lib/` so reviewers and automated tooling can quickly inspect the implementation.

Files included below:

- `compliance-stack.ts` — the Compliance construct implementation (backwards-compatible alias `ComplianceStack`). Creates VPC, endpoints, S3 results bucket, Lambda Layer, three scanner Lambdas (EC2, RDS, S3), SNS topic, EventBridge schedule, CloudWatch dashboard/alarms and exports useful outputs.
- `tap-stack.ts` — top-level stack which instantiates the `ComplianceConstruct`.
- `lambda_handlers/index.js` — packaged Lambda handlers for EC2/RDS/S3 scanning logic (Node.js AWS SDK v2 style).
- `lambda_layer/nodejs/index.js` — small helper file inside the Layer so the Layer asset is non-empty.

Notes and conventions:

- All code blocks are formatted using a TypeScript fenced block (```typescript) per repository/style guidance. JavaScript handler files are included using the same fence for consistent rendering.
- The construct applies a tag `iac-rlhf-amazon` to resources, uses timestamped `-<environment>-<timestamp>` suffixes, and sets removal policies (e.g., S3 bucket `RemovalPolicy.DESTROY` with `autoDeleteObjects: true`) to make test and CI cleanup easier.
- The Lambda layer is created from `lib/lambda_layer` and Lambda code comes from `lib/lambda_handlers`.

---

### compliance-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

interface ComplianceStackProps extends cdk.StackProps {
	environmentSuffix?: string;
}

export class ComplianceConstruct extends Construct {
	constructor(scope: Construct, id: string, props?: ComplianceStackProps) {
		super(scope, id);

		const stack = cdk.Stack.of(this);

		const environmentSuffix =
			props?.environmentSuffix ||
			this.node.tryGetContext('environmentSuffix') ||
			'dev';

		// Timestamp to ensure uniqueness across repeated deploys in the same environment
		const timestamp = new Date()
			.toISOString()
			.replace(/[^0-9]/g, '')
			.slice(0, 14);

		// Apply required tag
		cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

		const nameSuffix = `-${environmentSuffix}-${timestamp}`;

		// VPC for Lambda functions
		const vpc = new ec2.Vpc(this, `ComplianceVpc${nameSuffix}`, {
			maxAzs: 2,
			natGateways: 1,
			subnetConfiguration: [
				{
					cidrMask: 24,
					name: `public${nameSuffix}`,
					subnetType: ec2.SubnetType.PUBLIC,
				},
				{
					cidrMask: 24,
					name: `private${nameSuffix}`,
					subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
				},
			],
		});

		// Gateway endpoint for S3 (correct type)
		vpc.addGatewayEndpoint(`S3GatewayEndpoint${nameSuffix}`, {
			service: ec2.GatewayVpcEndpointAwsService.S3,
		});

		// Interface endpoints for SSM and CloudWatch Logs
		vpc.addInterfaceEndpoint(`SSMEndpoint${nameSuffix}`, {
			service: ec2.InterfaceVpcEndpointAwsService.SSM,
			privateDnsEnabled: true,
		});

		vpc.addInterfaceEndpoint(`SSMMessagesEndpoint${nameSuffix}`, {
			service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
			privateDnsEnabled: true,
		});

		vpc.addInterfaceEndpoint(`CloudWatchLogsEndpoint${nameSuffix}`, {
			service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
			privateDnsEnabled: true,
		});

		// S3 bucket for compliance scan results
		const sanitizedBucketName =
			`compliance-scan-results${nameSuffix}`.toLowerCase();
		const complianceResultsBucket = new s3.Bucket(
			this,
			`ComplianceResultsBucket${nameSuffix}`,
			{
				bucketName: sanitizedBucketName,
				encryption: s3.BucketEncryption.S3_MANAGED,
				lifecycleRules: [
					{
						id: 'delete-old-results',
						expiration: Duration.days(90),
						enabled: true,
					},
				],
				blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
				removalPolicy: RemovalPolicy.DESTROY,
				autoDeleteObjects: true,
			}
		);

		// SNS Topic for compliance violations
		const complianceViolationsTopic = new sns.Topic(
			this,
			`ComplianceViolationsTopic${nameSuffix}`,
			{
				displayName: `Infrastructure Compliance Violations${nameSuffix}`,
				topicName: `compliance-violations${nameSuffix}`,
			}
		);

		const drTopicArn =
			this.node.tryGetContext('drTopicArn') || process.env.DR_TOPIC_ARN;

		const approvedAmisParam =
			this.node.tryGetContext('approvedAmisParam') ||
			'/compliance/approved-amis';
		const approvedAmisParamName = approvedAmisParam.startsWith('/')
			? approvedAmisParam.slice(1)
			: approvedAmisParam;
		const ssmParamArn = `arn:aws:ssm:${stack.region}:${stack.account}:parameter/${approvedAmisParamName}`;

		const snsPublishResources = [complianceViolationsTopic.topicArn];
		if (drTopicArn) {
			snsPublishResources.push(drTopicArn);
		}

		const commonLambdaPolicyStatements: iam.PolicyStatement[] = [
			new iam.PolicyStatement({
				actions: ['s3:PutObject', 's3:PutObjectAcl'],
				resources: [complianceResultsBucket.bucketArn + '/*'],
				effect: iam.Effect.ALLOW,
			}),
			new iam.PolicyStatement({
				actions: ['sns:Publish'],
				resources: snsPublishResources,
				effect: iam.Effect.ALLOW,
			}),
		];

		const putMetricStatement = new iam.PolicyStatement({
			actions: ['cloudwatch:PutMetricData'],
			resources: ['*'],
			effect: iam.Effect.ALLOW,
		});

		// EC2 role
		const ec2ComplianceScannerRole = new iam.Role(
			this,
			`EC2ComplianceScannerRole${nameSuffix}`,
			{
				assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
				managedPolicies: [
					iam.ManagedPolicy.fromAwsManagedPolicyName(
						'service-role/AWSLambdaVPCAccessExecutionRole'
					),
				],
			}
		);

		ec2ComplianceScannerRole.addToPolicy(
			new iam.PolicyStatement({
				actions: [
					'ec2:DescribeInstances',
					'ec2:DescribeTags',
					'ec2:DescribeImages',
				],
				resources: ['*'],
				effect: iam.Effect.ALLOW,
			})
		);
		ec2ComplianceScannerRole.addToPolicy(
			new iam.PolicyStatement({
				actions: ['ssm:GetParameter', 'ssm:GetParameters'],
				resources: [ssmParamArn],
				effect: iam.Effect.ALLOW,
			})
		);
		commonLambdaPolicyStatements.forEach((s) =>
			ec2ComplianceScannerRole.addToPolicy(s)
		);
		ec2ComplianceScannerRole.addToPolicy(putMetricStatement);

		// RDS role
		const rdsComplianceScannerRole = new iam.Role(
			this,
			`RDSComplianceScannerRole${nameSuffix}`,
			{
				assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
				managedPolicies: [
					iam.ManagedPolicy.fromAwsManagedPolicyName(
						'service-role/AWSLambdaVPCAccessExecutionRole'
					),
				],
			}
		);

		rdsComplianceScannerRole.addToPolicy(
			new iam.PolicyStatement({
				actions: ['rds:DescribeDBInstances', 'rds:ListTagsForResource'],
				resources: ['*'],
				effect: iam.Effect.ALLOW,
			})
		);
		commonLambdaPolicyStatements.forEach((s) =>
			rdsComplianceScannerRole.addToPolicy(s)
		);
		rdsComplianceScannerRole.addToPolicy(putMetricStatement);

		// S3 role
		const s3ComplianceScannerRole = new iam.Role(
			this,
			`S3ComplianceScannerRole${nameSuffix}`,
			{
				assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
				managedPolicies: [
					iam.ManagedPolicy.fromAwsManagedPolicyName(
						'service-role/AWSLambdaVPCAccessExecutionRole'
					),
				],
			}
		);

		s3ComplianceScannerRole.addToPolicy(
			new iam.PolicyStatement({
				actions: ['s3:ListAllMyBuckets'],
				resources: ['*'],
				effect: iam.Effect.ALLOW,
			})
		);

		s3ComplianceScannerRole.addToPolicy(
			new iam.PolicyStatement({
				actions: [
					's3:GetBucketVersioning',
					's3:GetBucketLifecycleConfiguration',
					's3:GetBucketTagging',
					's3:ListBucket',
				],
				resources: ['arn:aws:s3:::*'],
				effect: iam.Effect.ALLOW,
			})
		);
		commonLambdaPolicyStatements.forEach((s) =>
			s3ComplianceScannerRole.addToPolicy(s)
		);
		s3ComplianceScannerRole.addToPolicy(putMetricStatement);

		const lambdaAssetPath = path.join(__dirname, 'lambda_handlers');

		const lambdaLayer = new lambda.LayerVersion(
			this,
			`ComplianceLambdaLayer${nameSuffix}`,
			{
				layerVersionName: `compliance-scanner-layer${nameSuffix}`,
				code: lambda.Code.fromAsset(path.join(__dirname, 'lambda_layer')),
				compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
				description: 'Lambda layer for compliance scanner functions',
			}
		);

		const commonLambdaProps: Omit<
			lambda.FunctionProps,
			'runtime' | 'code' | 'handler' | 'functionName' | 'role'
		> = {
			timeout: Duration.minutes(5),
			memorySize: 512,
			vpc: vpc,
			vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
			layers: [lambdaLayer],
			logRetention: logs.RetentionDays.ONE_MONTH,
		};

		const ec2ComplianceScanner = new lambda.Function(
			this,
			`EC2ComplianceScanner${nameSuffix}`,
			{
				...commonLambdaProps,
				runtime: lambda.Runtime.NODEJS_18_X,
				code: lambda.Code.fromAsset(lambdaAssetPath),
				functionName: `ec2-compliance-scanner${nameSuffix}`,
				handler: 'index.scanEC2Handler',
				role: ec2ComplianceScannerRole,
				environment: {
					RESULTS_BUCKET: complianceResultsBucket.bucketName,
					SNS_TOPIC_ARN: complianceViolationsTopic.topicArn,
					CROSS_REGION_TOPIC_ARN: drTopicArn || '',
					SSM_PARAMETER_NAME:
						this.node.tryGetContext('approvedAmisParam') ||
						'/compliance/approved-amis',
				},
			}
		);

		const rdsComplianceScanner = new lambda.Function(
			this,
			`RDSComplianceScanner${nameSuffix}`,
			{
				...commonLambdaProps,
				runtime: lambda.Runtime.NODEJS_18_X,
				code: lambda.Code.fromAsset(lambdaAssetPath),
				functionName: `rds-compliance-scanner${nameSuffix}`,
				handler: 'index.scanRDSHandler',
				role: rdsComplianceScannerRole,
				environment: {
					RESULTS_BUCKET: complianceResultsBucket.bucketName,
					SNS_TOPIC_ARN: complianceViolationsTopic.topicArn,
					CROSS_REGION_TOPIC_ARN: drTopicArn || '',
					SSM_PARAMETER_NAME:
						this.node.tryGetContext('approvedAmisParam') ||
						'/compliance/approved-amis',
				},
			}
		);

		const s3ComplianceScanner = new lambda.Function(
			this,
			`S3ComplianceScanner${nameSuffix}`,
			{
				...commonLambdaProps,
				runtime: lambda.Runtime.NODEJS_18_X,
				code: lambda.Code.fromAsset(lambdaAssetPath),
				functionName: `s3-compliance-scanner${nameSuffix}`,
				handler: 'index.scanS3Handler',
				role: s3ComplianceScannerRole,
				environment: {
					RESULTS_BUCKET: complianceResultsBucket.bucketName,
					SNS_TOPIC_ARN: complianceViolationsTopic.topicArn,
					CROSS_REGION_TOPIC_ARN: drTopicArn || '',
					SSM_PARAMETER_NAME:
						this.node.tryGetContext('approvedAmisParam') ||
						'/compliance/approved-amis',
				},
			}
		);

		const scanScheduleRule = new events.Rule(
			this,
			`ComplianceScanSchedule${nameSuffix}`,
			{
				ruleName: `compliance-scan-schedule${nameSuffix}`,
				schedule: events.Schedule.rate(Duration.hours(4)),
				description: 'Triggers compliance scans every 4 hours',
			}
		);
		scanScheduleRule.addTarget(new targets.LambdaFunction(ec2ComplianceScanner));
		scanScheduleRule.addTarget(new targets.LambdaFunction(rdsComplianceScanner));
		scanScheduleRule.addTarget(new targets.LambdaFunction(s3ComplianceScanner));

		const complianceDashboard = new cloudwatch.Dashboard(
			this,
			`ComplianceDashboard${nameSuffix}`,
			{
				dashboardName: `infrastructure-compliance${nameSuffix}`,
				periodOverride: cloudwatch.PeriodOverride.AUTO,
			}
		);

		complianceDashboard.addWidgets(
			new cloudwatch.GraphWidget({
				title: 'Compliance Scores by Resource Type',
				left: [
					new cloudwatch.Metric({
						namespace: 'ComplianceScanner',
						metricName: 'EC2ComplianceScore',
						dimensionsMap: { ResourceType: 'EC2' },
						statistic: 'Average',
						period: Duration.hours(1),
					}),
					new cloudwatch.Metric({
						namespace: 'ComplianceScanner',
						metricName: 'RDSComplianceScore',
						dimensionsMap: { ResourceType: 'RDS' },
						statistic: 'Average',
						period: Duration.hours(1),
					}),
					new cloudwatch.Metric({
						namespace: 'ComplianceScanner',
						metricName: 'S3ComplianceScore',
						dimensionsMap: { ResourceType: 'S3' },
						statistic: 'Average',
						period: Duration.hours(1),
					}),
				],
				leftYAxis: { min: 0, max: 100, label: 'Compliance Score (%)' },
				width: 12,
				height: 6,
			}),
			new cloudwatch.GraphWidget({
				title: 'Violations Count - Last 30 Days',
				left: [
					new cloudwatch.Metric({
						namespace: 'ComplianceScanner',
						metricName: 'EC2Violations',
						dimensionsMap: { ResourceType: 'EC2' },
						statistic: 'Sum',
						period: Duration.days(1),
					}),
					new cloudwatch.Metric({
						namespace: 'ComplianceScanner',
						metricName: 'RDSViolations',
						dimensionsMap: { ResourceType: 'RDS' },
						statistic: 'Sum',
						period: Duration.days(1),
					}),
					new cloudwatch.Metric({
						namespace: 'ComplianceScanner',
						metricName: 'S3Violations',
						dimensionsMap: { ResourceType: 'S3' },
						statistic: 'Sum',
						period: Duration.days(1),
					}),
				],
				width: 12,
				height: 6,
			})
		);

		const alertEmail = this.node.tryGetContext('alertEmail') || process.env.ALERT_EMAIL;
		if (alertEmail) {
			complianceViolationsTopic.addSubscription(new snsSubscriptions.EmailSubscription(alertEmail));
		}

		new cloudwatch.Alarm(this, `LowEC2ComplianceAlarm${nameSuffix}`, {
			alarmName: `low-ec2-compliance${nameSuffix}`,
			metric: new cloudwatch.Metric({
				namespace: 'ComplianceScanner',
				metricName: 'EC2ComplianceScore',
				dimensionsMap: { ResourceType: 'EC2' },
				statistic: 'Average',
				period: Duration.hours(1),
			}),
			threshold: 80,
			comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
			evaluationPeriods: 2,
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
			alarmDescription: 'EC2 compliance score below 80%',
		});

		new cdk.CfnOutput(stack, `ComplianceResultsBucketOutput${nameSuffix}`, {
			value: complianceResultsBucket.bucketName,
			description: 'S3 bucket for compliance scan results',
			exportName: `ComplianceResultsBucket${environmentSuffix}`,
		});

		new cdk.CfnOutput(stack, `ComplianceViolationsTopicOutput${nameSuffix}`, {
			value: complianceViolationsTopic.topicArn,
			description: 'SNS topic for compliance violations',
			exportName: `ComplianceViolationsTopic${environmentSuffix}`,
		});

		new cdk.CfnOutput(stack, `ComplianceDashboardOutput${nameSuffix}`, {
			value: `https://console.aws.amazon.com/cloudwatch/home?region=${stack.region}#dashboards:name=${complianceDashboard.dashboardName}`,
			description: 'CloudWatch dashboard URL',
			exportName: `ComplianceDashboardURL${environmentSuffix}`,
		});

		new cdk.CfnOutput(stack, `EC2ComplianceScannerArn${nameSuffix}`, {
			value: ec2ComplianceScanner.functionArn,
			description: 'EC2 compliance scanner Lambda ARN',
			exportName: `EC2ComplianceScannerArn${environmentSuffix}`,
		});

		new cdk.CfnOutput(stack, `RDSComplianceScannerArn${nameSuffix}`, {
			value: rdsComplianceScanner.functionArn,
			description: 'RDS compliance scanner Lambda ARN',
			exportName: `RDSComplianceScannerArn${environmentSuffix}`,
		});

		new cdk.CfnOutput(stack, `S3ComplianceScannerArn${nameSuffix}`, {
			value: s3ComplianceScanner.functionArn,
			description: 'S3 compliance scanner Lambda ARN',
			exportName: `S3ComplianceScannerArn${environmentSuffix}`,
		});

		new cdk.CfnOutput(stack, `ComplianceVpcId${nameSuffix}`, {
			value: vpc.vpcId,
			description: 'VPC id used by compliance scanners',
			exportName: `ComplianceVpcId${environmentSuffix}`,
		});

		new cdk.CfnOutput(stack, `EC2ComplianceLogGroup${nameSuffix}`, {
			value: `/aws/lambda/${ec2ComplianceScanner.functionName}`,
			description: 'CloudWatch Log Group name for EC2 compliance scanner',
			exportName: `EC2ComplianceLogGroup${environmentSuffix}`,
		});

		new cdk.CfnOutput(stack, `RDSComplianceLogGroup${nameSuffix}`, {
			value: `/aws/lambda/${rdsComplianceScanner.functionName}`,
			description: 'CloudWatch Log Group name for RDS compliance scanner',
			exportName: `RDSComplianceLogGroup${environmentSuffix}`,
		});

		new cdk.CfnOutput(stack, `S3ComplianceLogGroup${nameSuffix}`, {
			value: `/aws/lambda/${s3ComplianceScanner.functionName}`,
			description: 'CloudWatch Log Group name for S3 compliance scanner',
			exportName: `S3ComplianceLogGroup${environmentSuffix}`,
		});
	}
}

export { ComplianceConstruct as ComplianceStack };

---

### tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComplianceConstruct } from './compliance-stack';

interface TapStackProps extends cdk.StackProps {
	environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: TapStackProps) {
		super(scope, id, props);

		const environmentSuffix =
			props?.environmentSuffix ||
			this.node.tryGetContext('environmentSuffix') ||
			'dev';

		cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

		new ComplianceConstruct(this, `ComplianceConstruct-${environmentSuffix}`, {
			environmentSuffix: environmentSuffix,
		});
	}
}

```

---

### lambda_handlers/index.js

```typescript
const AWS = require('aws-sdk');
const ec2 = new AWS.EC2();
const rds = new AWS.RDS();
const s3 = new AWS.S3();
const ssm = new AWS.SSM();
const sns = new AWS.SNS();
const cloudwatch = new AWS.CloudWatch();

const REQUIRED_TAGS = ['Environment', 'Owner', 'CostCenter', 'DataClassification'];
const RESULTS_BUCKET = process.env.RESULTS_BUCKET;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const CROSS_REGION_TOPIC_ARN = process.env.CROSS_REGION_TOPIC_ARN; // optional
const SSM_PARAMETER_NAME = process.env.SSM_PARAMETER_NAME; // '/compliance/approved-amis'

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function withRetry(fn, maxRetries = 3) {
	let lastError;
	for (let i = 0; i < maxRetries; i++) {
		try { return await fn(); } catch (error) {
			lastError = error;
			if (error && (error.code === 'Throttling' || error.code === 'RequestLimitExceeded')) {
				await sleep(Math.pow(2, i) * 1000);
			} else { throw error; }
		}
	}
	throw lastError;
}

async function checkResourceTags(tags, resourceId, resourceType) {
	const violations = [];
	const tagMap = {};
	if (tags) tags.forEach(t => { tagMap[t.Key] = t.Value; });
	for (const requiredTag of REQUIRED_TAGS) {
		if (!tagMap[requiredTag]) {
			violations.push({ resourceId, resourceType, violationType: 'MISSING_TAG', details: `Missing required tag: ${requiredTag}`, severity: 'HIGH'});
		}
	}
	return violations;
}

async function publishMetric(metricName, value, unit, dimensions) {
	const params = { Namespace: 'ComplianceScanner', MetricData: [{ MetricName: metricName, Value: value, Unit: unit, Dimensions: dimensions, Timestamp: new Date() }] };
	await withRetry(() => cloudwatch.putMetricData(params).promise());
}

async function sendNotification(violations) {
	if (!violations || violations.length === 0) return;
	const criticalViolations = violations.filter(v => v.severity === 'CRITICAL');
	if (criticalViolations.length > 0 && SNS_TOPIC_ARN) {
		const message = { default: `Found ${criticalViolations.length} critical compliance violations`, violations: criticalViolations };
		await withRetry(() => sns.publish({ TopicArn: SNS_TOPIC_ARN, Message: JSON.stringify(message), Subject: 'Critical Compliance Violations Detected' }).promise());
		if (CROSS_REGION_TOPIC_ARN) {
			await withRetry(() => sns.publish({ TopicArn: CROSS_REGION_TOPIC_ARN, Message: JSON.stringify(message), Subject: 'Critical Compliance Violations Detected (DR)' }).promise());
		}
	}
}

async function saveResults(scanType, results) {
	if (!RESULTS_BUCKET) return;
	const timestamp = new Date().toISOString();
	const key = `${scanType}/${timestamp}.json`;
	await withRetry(() => s3.putObject({ Bucket: RESULTS_BUCKET, Key: key, Body: JSON.stringify(results, null, 2), ContentType: 'application/json' }).promise());
}

exports.scanEC2Handler = async (event) => {
	const violations = []; let totalInstances = 0; let compliantInstances = 0;
	try {
		let approvedAMIs = [];
		if (SSM_PARAMETER_NAME) {
			try {
				const param = await withRetry(() => ssm.getParameter({ Name: SSM_PARAMETER_NAME }).promise());
				approvedAMIs = JSON.parse(param.Parameter.Value || '[]');
			} catch (e) { console.warn('Approved AMIs parameter missing or unreadable, continuing without AMI validation'); }
		}
		let nextToken = null;
		do {
			const params = { MaxResults: 100, NextToken: nextToken };
			const response = await withRetry(() => ec2.describeInstances(params).promise());
			for (const reservation of response.Reservations || []) {
				for (const instance of reservation.Instances || []) {
					totalInstances++; const instanceViolations = [];
					instanceViolations.push(...await checkResourceTags(instance.Tags, instance.InstanceId, 'EC2_INSTANCE'));
					if (approvedAMIs.length > 0 && !approvedAMIs.includes(instance.ImageId)) {
						instanceViolations.push({ resourceId: instance.InstanceId, resourceType: 'EC2_INSTANCE', violationType: 'UNAPPROVED_AMI', details: `Instance using unapproved AMI: ${instance.ImageId}`, severity: 'HIGH' });
					}
					violations.push(...instanceViolations);
					if (instanceViolations.length === 0) compliantInstances++;
				}
			}
			nextToken = response.NextToken;
		} while (nextToken);

		await publishMetric('EC2ComplianceScore', totalInstances > 0 ? (compliantInstances/totalInstances)*100 : 100, 'Percent', [{ Name: 'ResourceType', Value: 'EC2' }]);
		await publishMetric('EC2Violations', violations.length, 'Count', [{ Name: 'ResourceType', Value: 'EC2' }]);
		await saveResults('ec2', { violations, totalInstances, compliantInstances });
		await sendNotification(violations);
		return { statusCode: 200, body: JSON.stringify({ totalInstances, compliantInstances, violations: violations.length }) };
	} catch (error) { console.error('EC2 scan error:', error); throw error; }
};

exports.scanRDSHandler = async (event) => {
	const violations = []; let totalInstances = 0; let compliantInstances = 0;
	try {
		let marker = null;
		do {
			const params = { MaxRecords: 100, Marker: marker };
			const response = await withRetry(() => rds.describeDBInstances(params).promise());
			for (const dbInstance of response.DBInstances || []) {
				totalInstances++; const instanceViolations = [];
				try {
					const tagsResponse = await withRetry(() => rds.listTagsForResource({ ResourceName: dbInstance.DBInstanceArn }).promise());
					instanceViolations.push(...await checkResourceTags(tagsResponse.TagList, dbInstance.DBInstanceIdentifier, 'RDS_INSTANCE'));
				} catch (e) { console.warn('RDS tag read failed', e); }
				if (!dbInstance.StorageEncrypted) {
					instanceViolations.push({ resourceId: dbInstance.DBInstanceIdentifier, resourceType: 'RDS_INSTANCE', violationType: 'ENCRYPTION_DISABLED', details: 'RDS instance does not have encryption enabled', severity: 'CRITICAL' });
				}
				if (dbInstance.BackupRetentionPeriod === 0) {
					instanceViolations.push({ resourceId: dbInstance.DBInstanceIdentifier, resourceType: 'RDS_INSTANCE', violationType: 'BACKUP_DISABLED', details: 'RDS instance does not have automated backups configured', severity: 'HIGH' });
				}
				violations.push(...instanceViolations);
				if (instanceViolations.length === 0) compliantInstances++;
			}
			marker = response.Marker;
		} while (marker);
		await publishMetric('RDSComplianceScore', totalInstances > 0 ? (compliantInstances/totalInstances)*100 : 100, 'Percent', [{ Name: 'ResourceType', Value: 'RDS' }]);
		await publishMetric('RDSViolations', violations.length, 'Count', [{ Name: 'ResourceType', Value: 'RDS' }]);
		await saveResults('rds', { violations, totalInstances, compliantInstances });
		await sendNotification(violations);
		return { statusCode: 200, body: JSON.stringify({ totalInstances, compliantInstances, violations: violations.length }) };
	} catch (error) { console.error('RDS scan error:', error); throw error; }
};

exports.scanS3Handler = async (event) => {
	const violations = []; let totalBuckets = 0; let compliantBuckets = 0;
	try {
		const bucketsResponse = await withRetry(() => s3.listBuckets().promise());
		for (const bucket of bucketsResponse.Buckets || []) {
			totalBuckets++; const bucketViolations = [];
			try {
				const tagsResponse = await withRetry(() => s3.getBucketTagging({ Bucket: bucket.Name }).promise().catch(err => { if (err.code === 'NoSuchTagSet') return { TagSet: [] }; throw err; }));
				bucketViolations.push(...await checkResourceTags(tagsResponse.TagSet.map(t => ({ Key: t.Key, Value: t.Value })), bucket.Name, 'S3_BUCKET'));
				const versioningResponse = await withRetry(() => s3.getBucketVersioning({ Bucket: bucket.Name }).promise());
				if (versioningResponse.Status !== 'Enabled') {
					bucketViolations.push({ resourceId: bucket.Name, resourceType: 'S3_BUCKET', violationType: 'VERSIONING_DISABLED', details: 'S3 bucket does not have versioning enabled', severity: 'HIGH' });
				}
				try { await withRetry(() => s3.getBucketLifecycleConfiguration({ Bucket: bucket.Name }).promise()); } catch (err) { if (err.code === 'NoSuchLifecycleConfiguration') { bucketViolations.push({ resourceId: bucket.Name, resourceType: 'S3_BUCKET', violationType: 'NO_LIFECYCLE_POLICY', details: 'S3 bucket does not have lifecycle policies defined', severity: 'MEDIUM' }); } }
				violations.push(...bucketViolations);
				if (bucketViolations.length === 0) compliantBuckets++;
			} catch (error) { console.error(`Error scanning bucket ${bucket.Name}:`, error); violations.push({ resourceId: bucket.Name, resourceType: 'S3_BUCKET', violationType: 'SCAN_ERROR', details: `Failed to scan bucket: ${error.message}`, severity: 'MEDIUM' }); }
		}
		await publishMetric('S3ComplianceScore', totalBuckets > 0 ? (compliantBuckets/totalBuckets)*100 : 100, 'Percent', [{ Name: 'ResourceType', Value: 'S3' }]);
		await publishMetric('S3Violations', violations.length, 'Count', [{ Name: 'ResourceType', Value: 'S3' }]);
		await saveResults('s3', { violations, totalBuckets, compliantBuckets });
		await sendNotification(violations);
		return { statusCode: 200, body: JSON.stringify({ totalBuckets, compliantBuckets, violations: violations.length }) };
	} catch (error) { console.error('S3 scan error:', error); throw error; }
};

```

---

### lambda_layer/nodejs/index.js

```typescript
// Small helper to be available in the layer for compliance lambdas
module.exports = {
	layerHelper: function () {
		return 'compliance-layer-active';
	},
};

```

---
The `lib/IDEAL_RESPONSE.md` file has been updated with the implementation write-up and embedded source files.
