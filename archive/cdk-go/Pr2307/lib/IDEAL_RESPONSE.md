# Complete TapStack Infrastructure Implementation

This document provides the ideal implementation for a comprehensive, production-grade AWS infrastructure stack using CDK Go. The implementation follows AWS best practices for security, monitoring, and compliance.

## Architecture Overview

The TapStack creates a secure, scalable infrastructure with:
- **VPC** with public/private subnets across multiple AZs
- **S3 buckets** with encryption, versioning, and lifecycle policies
- **DynamoDB table** with encryption, PITR, and streams
- **Lambda function** with VPC integration and monitoring
- **CloudTrail** for audit logging
- **CloudWatch alarms** for proactive monitoring
- **SNS** for alerting

## Project Structure

```
iac-test-automations/
├── bin/
│   └── tap.go                     # Main entry point
├── lib/
│   ├── constructs/
│   │   ├── security_construct.go  # VPC, IAM, SNS
│   │   ├── storage_construct.go   # S3 buckets
│   │   ├── database_construct.go  # DynamoDB table
│   │   └── compute_construct.go   # Lambda function & monitoring
│   ├── lambda/
│   │   └── handler.py             # Lambda Python code
│   └── tap_stack.go               # Main stack definition
├── tests/
│   ├── unit/
│   │   └── tap_stack_unit_test.go # Unit tests
│   └── integration/
│   │   └── tap_stack_int_test.go  # Integration tests
└── go.mod                         # Go dependencies
```

## Complete Implementation

### 1. Go Module Configuration (`go.mod`)

```go
module github.com/TuringGpt/iac-test-automations

go 1.23

require (
	github.com/aws/aws-cdk-go/awscdk/v2 v2.212.0
	github.com/aws/aws-sdk-go-v2 v1.38.1
	github.com/aws/constructs-go/constructs/v10 v10.4.2
	github.com/aws/jsii-runtime-go v1.113.0
	github.com/stretchr/testify v1.11.0
)
```

### 2. Main Entry Point (`bin/tap.go`)

```go
package main

import (
	"os"

	"github.com/TuringGpt/iac-test-automations/lib"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"
)

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	// Get environment suffix from context or use 'dev' as default
	var environmentSuffix string
	if suffix := app.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		if suffixStr, ok := suffix.(string); ok {
			environmentSuffix = suffixStr
		} else {
			environmentSuffix = "dev"
		}
	} else {
		environmentSuffix = "dev"
	}

	stackName := "TapStack" + environmentSuffix

	// Apply global tags
	awscdk.Tags_Of(app).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
	awscdk.Tags_Of(app).Add(jsii.String("Project"), jsii.String("tap-infrastructure"), nil)

	// Create TapStackProps
	props := &lib.TapStackProps{
		StackProps:  awscdk.StackProps{},
		Environment: environmentSuffix,
	}

	// Initialize the stack
	lib.NewTapStack(app, jsii.String(stackName), props)

	app.Synth(nil)
}
```

### 3. Main Stack Definition (`lib/tap_stack.go`)

```go
package lib

import (
	tapConstructs "github.com/TuringGpt/iac-test-automations/lib/constructs"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudtrail"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type TapStackProps struct {
	awscdk.StackProps
	Environment string
}

type TapStack struct {
	awscdk.Stack
	Environment string
}

func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	environment := "prod"
	if props != nil && props.Environment != "" {
		environment = props.Environment
	}

	// CloudTrail setup
	cloudTrailBucket := awss3.NewBucket(stack, jsii.String("CloudTrailBucket"), &awss3.BucketProps{
		BucketName:        jsii.String("proj-cloudtrail-" + environment),
		Versioned:         jsii.Bool(true),
		PublicReadAccess:  jsii.Bool(false),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		EnforceSSL:        jsii.Bool(true),
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:         jsii.String("DeleteOldLogs"),
				Enabled:    jsii.Bool(true),
				Expiration: awscdk.Duration_Days(jsii.Number(90)),
			},
		},
	})

	awscloudtrail.NewTrail(stack, jsii.String("AuditTrail"), &awscloudtrail.TrailProps{
		TrailName:                  jsii.String("proj-audit-trail-" + environment),
		Bucket:                     cloudTrailBucket,
		IncludeGlobalServiceEvents: jsii.Bool(true),
		IsMultiRegionTrail:         jsii.Bool(true),
		EnableFileValidation:       jsii.Bool(true),
		SendToCloudWatchLogs:       jsii.Bool(true),
	})

	// Create constructs
	securityConstruct := tapConstructs.NewSecurityConstruct(stack, "SecurityConstruct", &tapConstructs.SecurityConstructProps{
		Environment: environment,
	})

	storageConstruct := tapConstructs.NewStorageConstruct(stack, "StorageConstruct", &tapConstructs.StorageConstructProps{
		Environment: environment,
	})

	databaseConstruct := tapConstructs.NewDatabaseConstruct(stack, "DatabaseConstruct", &tapConstructs.DatabaseConstructProps{
		Environment: environment,
	})

	tapConstructs.NewComputeConstruct(stack, "ComputeConstruct", &tapConstructs.ComputeConstructProps{
		Environment:   environment,
		LambdaRole:    securityConstruct.LambdaRole,
		S3Bucket:      storageConstruct.Bucket,
		DynamoDBTable: databaseConstruct.Table,
		AlertingTopic: securityConstruct.AlertingTopic,
		VPC:           securityConstruct.VPC,
	})

	// Stack outputs
	awscdk.NewCfnOutput(stack, jsii.String("AlertingTopicArn"), &awscdk.CfnOutputProps{
		Value:       securityConstruct.AlertingTopic.TopicArn(),
		Description: jsii.String("SNS Topic ARN for infrastructure alerts"),
	})

	return &TapStack{
		Stack:       stack,
		Environment: environment,
	}
}
```

### 4. Security Construct (`lib/constructs/security_construct.go`)

```go
package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type SecurityConstructProps struct {
	Environment string
}

type SecurityConstruct struct {
	constructs.Construct
	LambdaRole    awsiam.IRole
	AlertingTopic awssns.ITopic
	VPC           awsec2.IVpc
	VPCEndpoints  map[string]awsec2.IVpcEndpoint
}

func NewSecurityConstruct(scope constructs.Construct, id string, props *SecurityConstructProps) *SecurityConstruct {
	construct := constructs.NewConstruct(scope, &id)

	// Create SNS topic for alerting
	alertingTopic := awssns.NewTopic(construct, jsii.String("AlertingTopic"), &awssns.TopicProps{
		TopicName:   jsii.String("proj-alerts-" + props.Environment),
		DisplayName: jsii.String("TAP Infrastructure Alerts"),
	})

	// Create VPC for private endpoints
	vpc := awsec2.NewVpc(construct, jsii.String("VPC"), &awsec2.VpcProps{
		VpcName:            jsii.String("proj-vpc-" + props.Environment),
		MaxAzs:             jsii.Number(2),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:       jsii.String("Private"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("Public"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
		},
	})

	// VPC endpoints for private service access
	vpcEndpoints := make(map[string]awsec2.IVpcEndpoint)

	// S3 Gateway endpoint
	vpcEndpoints["s3"] = awsec2.NewGatewayVpcEndpoint(construct, jsii.String("S3Endpoint"), &awsec2.GatewayVpcEndpointProps{
		Vpc:     vpc,
		Service: awsec2.GatewayVpcEndpointAwsService_S3(),
	})

	// DynamoDB Gateway endpoint
	vpcEndpoints["dynamodb"] = awsec2.NewGatewayVpcEndpoint(construct, jsii.String("DynamoDBEndpoint"), &awsec2.GatewayVpcEndpointProps{
		Vpc:     vpc,
		Service: awsec2.GatewayVpcEndpointAwsService_DYNAMODB(),
	})

	// CloudWatch Logs Interface endpoint
	vpcEndpoints["logs"] = awsec2.NewInterfaceVpcEndpoint(construct, jsii.String("LogsEndpoint"), &awsec2.InterfaceVpcEndpointProps{
		Vpc:             vpc,
		Service:         awsec2.InterfaceVpcEndpointAwsService_CLOUDWATCH_LOGS(),
		PrivateDnsEnabled: jsii.Bool(true),
	})

	// Enhanced Lambda role with VPC and X-Ray permissions
	lambdaRole := awsiam.NewRole(construct, jsii.String("LambdaExecutionRole"), &awsiam.RoleProps{
		RoleName:    jsii.String("proj-lambda-role-" + props.Environment),
		AssumedBy:   awsiam.NewServicePrincipal(jsii.String("lambda.amazonaws.com"), nil),
		Description: jsii.String("Enhanced IAM role for Lambda with VPC and X-Ray access"),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AWSLambdaVPCAccessExecutionRole")),
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AWSXRayDaemonWriteAccess")),
		},
	})

	// Enhanced inline policies
	enhancedS3Policy := awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
		Statements: &[]awsiam.PolicyStatement{
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Actions: &[]*string{
					jsii.String("s3:GetObject"),
					jsii.String("s3:GetObjectVersion"),
					jsii.String("s3:GetObjectAttributes"),
				},
				Resources: &[]*string{
					jsii.String("arn:aws:s3:::proj-s3-" + props.Environment + "/*"),
				},
				Conditions: &map[string]interface{}{
					"Bool": map[string]interface{}{
						"aws:SecureTransport": "true",
					},
				},
			}),
		},
	})

	enhancedDynamoPolicy := awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
		Statements: &[]awsiam.PolicyStatement{
			awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
				Actions: &[]*string{
					jsii.String("dynamodb:PutItem"),
					jsii.String("dynamodb:UpdateItem"),
					jsii.String("dynamodb:ConditionCheckItem"),
				},
				Resources: &[]*string{
					jsii.String("arn:aws:dynamodb:us-east-1:*:table/proj-dynamodb-" + props.Environment),
				},
			}),
		},
	})

	// Apply enhanced policies
	awsiam.NewPolicy(construct, jsii.String("EnhancedS3AccessPolicy"), &awsiam.PolicyProps{
		PolicyName: jsii.String("proj-enhanced-s3-policy-" + props.Environment),
		Document:   enhancedS3Policy,
		Roles:      &[]awsiam.IRole{lambdaRole},
	})

	awsiam.NewPolicy(construct, jsii.String("EnhancedDynamoDBAccessPolicy"), &awsiam.PolicyProps{
		PolicyName: jsii.String("proj-enhanced-dynamodb-policy-" + props.Environment),
		Document:   enhancedDynamoPolicy,
		Roles:      &[]awsiam.IRole{lambdaRole},
	})

	return &SecurityConstruct{
		Construct:     construct,
		LambdaRole:    lambdaRole,
		AlertingTopic: alertingTopic,
		VPC:           vpc,
		VPCEndpoints:  vpcEndpoints,
	}
}
```

### 5. Storage Construct (`lib/constructs/storage_construct.go`)

```go
package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type StorageConstructProps struct {
	Environment string
}

type StorageConstruct struct {
	constructs.Construct
	Bucket        awss3.IBucket
	LoggingBucket awss3.IBucket
}

func NewStorageConstruct(scope constructs.Construct, id string, props *StorageConstructProps) *StorageConstruct {
	construct := constructs.NewConstruct(scope, &id)

	// Enhanced logging bucket
	loggingBucket := awss3.NewBucket(construct, jsii.String("AccessLogsBucket"), &awss3.BucketProps{
		BucketName:        jsii.String("proj-s3-logs-" + props.Environment),
		PublicReadAccess:  jsii.Bool(false),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		EnforceSSL:        jsii.Bool(true),
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:         jsii.String("DeleteOldAccessLogs"),
				Enabled:    jsii.Bool(true),
				Expiration: awscdk.Duration_Days(jsii.Number(90)),
				Transitions: &[]*awss3.Transition{
					{
						StorageClass:     awss3.StorageClass_INFREQUENT_ACCESS(),
						TransitionAfter: awscdk.Duration_Days(jsii.Number(30)),
					},
				},
			},
		},
	})

	// Enhanced main bucket with SSL-only policy and Transfer Acceleration
	bucket := awss3.NewBucket(construct, jsii.String("MainBucket"), &awss3.BucketProps{
		BucketName:             jsii.String("proj-s3-" + props.Environment),
		Versioned:              jsii.Bool(true),
		PublicReadAccess:       jsii.Bool(false),
		BlockPublicAccess:      awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:             awss3.BucketEncryption_S3_MANAGED,
		EnforceSSL:             jsii.Bool(true),
		TransferAcceleration:   jsii.Bool(true),
		ServerAccessLogsBucket: loggingBucket,
		ServerAccessLogsPrefix: jsii.String("access-logs/"),
		EventBridgeEnabled:     jsii.Bool(true),
	})

	return &StorageConstruct{
		Construct:     construct,
		Bucket:        bucket,
		LoggingBucket: loggingBucket,
	}
}
```

### 6. Database Construct (`lib/constructs/database_construct.go`)

```go
package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type DatabaseConstructProps struct {
	Environment string
}

type DatabaseConstruct struct {
	constructs.Construct
	Table awsdynamodb.ITable
}

func NewDatabaseConstruct(scope constructs.Construct, id string, props *DatabaseConstructProps) *DatabaseConstruct {
	construct := constructs.NewConstruct(scope, &id)

	// Create DynamoDB table with partition key, sort key, encryption, and point-in-time recovery
	table := awsdynamodb.NewTable(construct, jsii.String("MainTable"), &awsdynamodb.TableProps{
		TableName: jsii.String("proj-dynamodb-" + props.Environment),
		// Partition key
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("pk"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		// Sort key
		SortKey: &awsdynamodb.Attribute{
			Name: jsii.String("sk"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		// Enable encryption at rest
		Encryption: awsdynamodb.TableEncryption_AWS_MANAGED,
		// Enable point-in-time recovery using new API
		PointInTimeRecoverySpecification: &awsdynamodb.PointInTimeRecoverySpecification{
			PointInTimeRecoveryEnabled: jsii.Bool(true),
		},
		// Billing mode
		BillingMode: awsdynamodb.BillingMode_PAY_PER_REQUEST,
		// Enable deletion protection for production
		DeletionProtection: jsii.Bool(true),
		// Enable CloudWatch Contributor Insights
		ContributorInsightsEnabled: jsii.Bool(true),
		// Stream specification for change data capture
		Stream: awsdynamodb.StreamViewType_NEW_AND_OLD_IMAGES,
		// Table class for cost optimization
		TableClass: awsdynamodb.TableClass_STANDARD,
		// Removal policy - should be retained by default
		RemovalPolicy: awscdk.RemovalPolicy_RETAIN,
	})

	// Add Global Secondary Index for common query patterns
	table.AddGlobalSecondaryIndex(&awsdynamodb.GlobalSecondaryIndexProps{
		IndexName: jsii.String("GSI1"),
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("gsi1pk"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		SortKey: &awsdynamodb.Attribute{
			Name: jsii.String("gsi1sk"),
			Type: awsdynamodb.AttributeType_STRING,
		},
	})

	// Add tags for better resource management
	awscdk.Tags_Of(table).Add(jsii.String("Environment"), jsii.String(props.Environment), nil)
	awscdk.Tags_Of(table).Add(jsii.String("Project"), jsii.String("tap-infrastructure"), nil)
	awscdk.Tags_Of(table).Add(jsii.String("BackupEnabled"), jsii.String("true"), nil)

	return &DatabaseConstruct{
		Construct: construct,
		Table:     table,
	}
}
```

### 7. Compute Construct (`lib/constructs/compute_construct.go`)

```go
package constructs

import (
	"os"
	"path/filepath"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatchactions"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3notifications"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type ComputeConstructProps struct {
	Environment   string
	LambdaRole    awsiam.IRole
	S3Bucket      awss3.IBucket
	DynamoDBTable awsdynamodb.ITable
	AlertingTopic awssns.ITopic
	VPC           awsec2.IVpc
}

type ComputeConstruct struct {
	constructs.Construct
	LambdaFunction awslambda.IFunction
	Alarms         []awscloudwatch.IAlarm
}

func NewComputeConstruct(scope constructs.Construct, id string, props *ComputeConstructProps) *ComputeConstruct {
	construct := constructs.NewConstruct(scope, &id)

	// Enhanced CloudWatch Log Group
	logGroup := awslogs.NewLogGroup(construct, jsii.String("LambdaLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String("/aws/lambda/proj-lambda-" + props.Environment),
		Retention:     awslogs.RetentionDays_ONE_MONTH,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Get private subnets for Lambda VPC configuration
	privateSubnets := props.VPC.PrivateSubnets()

	// Dynamically resolve Lambda code source
	lambdaCode := resolveLambdaCode()

	// Enhanced Lambda function with ARM64 and Python 3.12
	lambdaFunction := awslambda.NewFunction(construct, jsii.String("ProcessorFunction"), &awslambda.FunctionProps{
		FunctionName:                 jsii.String("proj-lambda-" + props.Environment),
		Runtime:                      awslambda.Runtime_PYTHON_3_12(),
		Architecture:                 awslambda.Architecture_ARM_64(),
		Handler:                      jsii.String("handler.lambda_handler"),
		Code:                         lambdaCode,
		Role:                         props.LambdaRole,
		LogGroup:                     logGroup,
		Timeout:                      awscdk.Duration_Minutes(jsii.Number(5)),
		MemorySize:                   jsii.Number(512),
		ReservedConcurrentExecutions: jsii.Number(10),
		Description:                  jsii.String("Enhanced S3 processor with ARM64 and monitoring"),
		Environment: &map[string]*string{
			"DYNAMODB_TABLE_NAME": props.DynamoDBTable.TableName(),
			"S3_BUCKET_NAME":      props.S3Bucket.BucketName(),
			"ENVIRONMENT":         jsii.String(props.Environment),
		},
		Tracing: awslambda.Tracing_ACTIVE,
		Vpc:     props.VPC,
		VpcSubnets: &awsec2.SubnetSelection{
			Subnets: privateSubnets,
		},
		DeadLetterQueueEnabled: jsii.Bool(true),
		MaxEventAge:            awscdk.Duration_Hours(jsii.Number(2)),
	})

	// Configure S3 trigger
	props.S3Bucket.AddEventNotification(
		awss3.EventType_OBJECT_CREATED,
		awss3notifications.NewLambdaDestination(lambdaFunction),
	)

	// Create comprehensive CloudWatch alarms
	alarms := createLambdaAlarms(construct, lambdaFunction, props)
	createDynamoDBAlarms(construct, props.DynamoDBTable, props.AlertingTopic, props.Environment)

	return &ComputeConstruct{
		Construct:      construct,
		LambdaFunction: lambdaFunction,
		Alarms:         alarms,
	}
}

func createLambdaAlarms(construct constructs.Construct, fn awslambda.IFunction, props *ComputeConstructProps) []awscloudwatch.IAlarm {
	var alarms []awscloudwatch.IAlarm

	// Error Rate Alarm
	errorRateAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaErrorRateAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("proj-lambda-error-rate-" + props.Environment),
		AlarmDescription: jsii.String("Lambda function error rate exceeded 1%"),
		Metric: awscloudwatch.NewMathExpression(&awscloudwatch.MathExpressionProps{
			Expression: jsii.String("(errors / invocations) * 100"),
			UsingMetrics: &map[string]awscloudwatch.IMetric{
				"errors": fn.MetricErrors(&awscloudwatch.MetricOptions{
					Period: awscdk.Duration_Minutes(jsii.Number(5)),
				}),
				"invocations": fn.MetricInvocations(&awscloudwatch.MetricOptions{
					Period: awscdk.Duration_Minutes(jsii.Number(5)),
				}),
			},
		}),
		EvaluationPeriods: jsii.Number(2),
		Threshold:         jsii.Number(1),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	errorRateAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(props.AlertingTopic))

	// Duration Alarm
	durationAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaDurationAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("proj-lambda-duration-" + props.Environment),
		AlarmDescription: jsii.String("Lambda function duration exceeded 30 seconds"),
		Metric: fn.MetricDuration(&awscloudwatch.MetricOptions{
			Period: awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:         jsii.Number(30000),
		EvaluationPeriods: jsii.Number(2),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	durationAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(props.AlertingTopic))

	// Throttling Alarm
	throttleAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaThrottleAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("proj-lambda-throttles-" + props.Environment),
		AlarmDescription: jsii.String("Lambda function is being throttled"),
		Metric: fn.MetricThrottles(&awscloudwatch.MetricOptions{
			Period: awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:         jsii.Number(1),
		EvaluationPeriods: jsii.Number(1),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	throttleAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(props.AlertingTopic))

	alarms = append(alarms, errorRateAlarm, durationAlarm, throttleAlarm)
	return alarms
}

func createDynamoDBAlarms(construct constructs.Construct, table awsdynamodb.ITable, topic awssns.ITopic, env string) {
	// DynamoDB Read Throttling Alarm
	readThrottleAlarm := awscloudwatch.NewAlarm(construct, jsii.String("DynamoDBReadThrottleAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("proj-dynamodb-read-throttles-" + env),
		AlarmDescription: jsii.String("DynamoDB table experiencing read throttling"),
		Metric: awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
			Namespace:  jsii.String("AWS/DynamoDB"),
			MetricName: jsii.String("ReadThrottles"),
			DimensionsMap: &map[string]*string{
				"TableName": table.TableName(),
			},
		}),
		Period:            awscdk.Duration_Minutes(jsii.Number(5)),
		Threshold:         jsii.Number(1),
		EvaluationPeriods: jsii.Number(2),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	readThrottleAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(topic))

	// DynamoDB Write Throttling Alarm
	writeThrottleAlarm := awscloudwatch.NewAlarm(construct, jsii.String("DynamoDBWriteThrottleAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("proj-dynamodb-write-throttles-" + env),
		AlarmDescription: jsii.String("DynamoDB table experiencing write throttling"),
		Metric: awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
			Namespace:  jsii.String("AWS/DynamoDB"),
			MetricName: jsii.String("WriteThrottles"),
			DimensionsMap: &map[string]*string{
				"TableName": table.TableName(),
			},
		}),
		Period:            awscdk.Duration_Minutes(jsii.Number(5)),
		Threshold:         jsii.Number(1),
		EvaluationPeriods: jsii.Number(2),
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	writeThrottleAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(topic))
}

// resolveLambdaCode dynamically finds the Lambda source code or falls back to inline code
func resolveLambdaCode() awslambda.Code {
	possiblePaths := []string{
		"lib/lambda",
		"lambda",
		"src/lambda",
	}

	for _, path := range possiblePaths {
		if _, err := os.Stat(path); err == nil {
			handlerPath := filepath.Join(path, "handler.py")
			if _, err := os.Stat(handlerPath); err == nil {
				return awslambda.Code_FromAsset(jsii.String(path), nil)
			}
		}
	}

	return awslambda.Code_FromInline(jsii.String(getInlineLambdaCode()))
}

func getInlineLambdaCode() string {
	return `import json
import boto3
import logging
import os
from datetime import datetime
from urllib.parse import unquote_plus

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
ENVIRONMENT = os.environ['ENVIRONMENT']

def lambda_handler(event, context):
    logger.info(f"Processing S3 event: {json.dumps(event)}")
    
    try:
        table = dynamodb.Table(TABLE_NAME)
        processed_records = 0
        
        for record in event.get('Records', []):
            if record.get('eventSource') == 'aws:s3':
                bucket_name = record['s3']['bucket']['name']
                object_key = unquote_plus(record['s3']['object']['key'])
                
                item = {
                    'pk': f"s3#{bucket_name}#{object_key}",
                    'sk': f"event#{record['eventTime']}",
                    'object_key': object_key,
                    'bucket_name': bucket_name,
                    'event_name': record['eventName'],
                    'processed_at': datetime.utcnow().isoformat(),
                    'environment': ENVIRONMENT
                }
                
                table.put_item(Item=item)
                processed_records += 1
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Processed {processed_records} records',
                'environment': ENVIRONMENT
            })
        }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        raise
`
}
```

### 8. Lambda Handler (`lib/lambda/handler.py`)

```python
import json
import boto3
import logging
import os
from datetime import datetime
from urllib.parse import unquote_plus
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Get environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
BUCKET_NAME = os.environ['S3_BUCKET_NAME']
ENVIRONMENT = os.environ['ENVIRONMENT']

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Lambda function to process S3 object creation events.
    
    This function is triggered when objects are created in the S3 bucket.
    It extracts metadata from the S3 event and stores it in DynamoDB.
    """
    
    logger.info(f"Processing S3 event: {json.dumps(event)}")
    
    try:
        table = dynamodb.Table(TABLE_NAME)
        processed_records = 0
        
        # Process each record in the event
        for record in event.get('Records', []):
            if record.get('eventSource') == 'aws:s3':
                processed_records += process_s3_record(record, table, context)
        
        logger.info(f"Successfully processed {processed_records} records")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {processed_records} records',
                'environment': ENVIRONMENT
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing S3 event: {str(e)}")
        raise


def process_s3_record(record: Dict[str, Any], table, context) -> int:
    """Process a single S3 record and store metadata in DynamoDB."""
    
    try:
        # Extract S3 information
        s3_info = record['s3']
        bucket_name = s3_info['bucket']['name']
        object_key = unquote_plus(s3_info['object']['key'])
        object_size = s3_info['object']['size']
        
        # Extract event information
        event_name = record['eventName']
        event_time = record['eventTime']
        
        logger.info(f"Processing object: {object_key} from bucket: {bucket_name}")
        
        # Get additional object metadata from S3
        try:
            response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
            content_type = response.get('ContentType', 'unknown')
            last_modified = response.get('LastModified', datetime.now()).isoformat()
            etag = response.get('ETag', '').strip('"')
        except Exception as e:
            logger.warning(f"Could not get object metadata: {str(e)}")
            content_type = 'unknown'
            last_modified = datetime.now().isoformat()
            etag = 'unknown'
        
        # Create DynamoDB item
        item = {
            'pk': f"OBJECT#{bucket_name}",
            'sk': f"KEY#{object_key}#{event_time}",
            'object_key': object_key,
            'bucket_name': bucket_name,
            'object_size': object_size,
            'content_type': content_type,
            'event_name': event_name,
            'event_time': event_time,
            'last_modified': last_modified,
            'etag': etag,
            'processed_at': datetime.now().isoformat(),
            'environment': ENVIRONMENT,
            'lambda_request_id': getattr(context, 'aws_request_id', 'unknown')
        }
        
        # Store in DynamoDB
        table.put_item(Item=item)
        
        logger.info(f"Successfully stored metadata for {object_key}")
        return 1
        
    except Exception as e:
        logger.error(f"Error processing S3 record: {str(e)}")
        raise
```

## Deployment Commands

```bash
# Synthesize CDK template
npx cdk synth --context environmentSuffix=dev

# Deploy to AWS
npx cdk deploy TapStackdev --context environmentSuffix=dev

# Run unit tests
go test ./tests/unit/... -v -cover

# Run integration tests
go test -tags=integration ./tests/integration/... -v

# Lint code
./scripts/lint.sh
```

## Security Features

- Encryption at rest for all data (S3, DynamoDB)
- Encryption in transit with SSL/TLS enforcement
- Network security with VPC and private subnets
- IAM least privilege access policies
- Audit logging with CloudTrail
- Comprehensive monitoring with CloudWatch alarms

## Resource Naming Convention

All resources follow the pattern: proj-{resource}-{environment}

Examples:
- proj-s3-dev (S3 bucket for dev environment)
- proj-dynamodb-prod (DynamoDB table for prod environment)
- proj-lambda-staging (Lambda function for staging environment)

## AWS Services Used

- AWS CloudTrail
- Amazon S3 
- Amazon DynamoDB
- AWS Lambda
- Amazon VPC
- Amazon EC2
- AWS IAM
- Amazon SNS
- Amazon CloudWatch
- Amazon CloudWatch Logs