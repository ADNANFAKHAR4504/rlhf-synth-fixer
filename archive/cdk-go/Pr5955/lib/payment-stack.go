package lib

import (
	"fmt"
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssqs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type EnvironmentConfig struct {
	VpcCidr                  string
	RdsInstanceType          awsec2.InstanceType
	LambdaMemorySize         float64
	SqsVisibilityTimeout     awscdk.Duration
	CloudWatchAlarmThreshold float64
}

type PaymentStackProps struct {
	awscdk.StackProps
	EnvironmentSuffix string
	Environment       string
}

func NewPaymentStack(scope constructs.Construct, id string, props *PaymentStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	// Get environment-specific configuration
	envConfig := getEnvironmentConfig(props.Environment)

	// Create VPC with public and private subnets across 2 AZs
	vpc := awsec2.NewVpc(stack, jsii.String(fmt.Sprintf("vpc-%s", props.EnvironmentSuffix)), &awsec2.VpcProps{
		Cidr:        jsii.String(envConfig.VpcCidr),
		MaxAzs:      jsii.Number(2),
		NatGateways: jsii.Number(2),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:       jsii.String("public"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("private"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
				CidrMask:   jsii.Number(24),
			},
		},
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
	})

	// Tag VPC for cost allocation
	awscdk.Tags_Of(vpc).Add(jsii.String("Environment"), jsii.String(props.Environment), nil)
	awscdk.Tags_Of(vpc).Add(jsii.String("CostCenter"), jsii.String("PaymentProcessing"), nil)

	// Create security group for Lambda functions
	lambdaSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String(fmt.Sprintf("lambda-sg-%s", props.EnvironmentSuffix)), &awsec2.SecurityGroupProps{
		Vpc:              vpc,
		Description:      jsii.String(fmt.Sprintf("Security group for Lambda functions - %s", props.Environment)),
		AllowAllOutbound: jsii.Bool(true),
	})

	// Create security group for RDS
	rdsSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String(fmt.Sprintf("rds-sg-%s", props.EnvironmentSuffix)), &awsec2.SecurityGroupProps{
		Vpc:              vpc,
		Description:      jsii.String(fmt.Sprintf("Security group for RDS - %s", props.Environment)),
		AllowAllOutbound: jsii.Bool(false),
	})

	// Allow database access only from Lambda functions
	rdsSecurityGroup.AddIngressRule(
		lambdaSecurityGroup,
		awsec2.Port_Tcp(jsii.Number(5432)),
		jsii.String("Allow PostgreSQL access from Lambda"),
		jsii.Bool(false),
	)

	// Create RDS subnet group
	dbSubnetGroup := awsrds.NewSubnetGroup(stack, jsii.String(fmt.Sprintf("db-subnet-group-%s", props.EnvironmentSuffix)), &awsrds.SubnetGroupProps{
		Vpc:             vpc,
		Description:     jsii.String(fmt.Sprintf("Subnet group for RDS - %s", props.Environment)),
		VpcSubnets:      &awsec2.SubnetSelection{SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS},
		RemovalPolicy:   awscdk.RemovalPolicy_DESTROY,
		SubnetGroupName: jsii.String(fmt.Sprintf("db-subnet-group-%s", props.EnvironmentSuffix)),
	})

	// Create RDS PostgreSQL instance
	dbInstance := awsrds.NewDatabaseInstance(stack, jsii.String(fmt.Sprintf("payment-db-%s", props.EnvironmentSuffix)), &awsrds.DatabaseInstanceProps{
		Engine: awsrds.DatabaseInstanceEngine_Postgres(&awsrds.PostgresInstanceEngineProps{
			Version: awsrds.PostgresEngineVersion_VER_14(),
		}),
		InstanceType:           envConfig.RdsInstanceType,
		Vpc:                    vpc,
		VpcSubnets:             &awsec2.SubnetSelection{SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS},
		SecurityGroups:         &[]awsec2.ISecurityGroup{rdsSecurityGroup},
		SubnetGroup:            dbSubnetGroup,
		MultiAz:                jsii.Bool(props.Environment == "prod"),
		AllocatedStorage:       jsii.Number(getStorageSize(props.Environment)),
		StorageType:            awsrds.StorageType_GP3,
		DatabaseName:           jsii.String("paymentdb"),
		BackupRetention:        awscdk.Duration_Days(jsii.Number(7)),
		DeleteAutomatedBackups: jsii.Bool(true),
		RemovalPolicy:          awscdk.RemovalPolicy_DESTROY,
		DeletionProtection:     jsii.Bool(false),
		CloudwatchLogsExports: &[]*string{
			jsii.String("postgresql"),
		},
		CloudwatchLogsRetention: awslogs.RetentionDays_ONE_WEEK,
	})

	// Tag RDS instance
	awscdk.Tags_Of(dbInstance).Add(jsii.String("Environment"), jsii.String(props.Environment), nil)
	awscdk.Tags_Of(dbInstance).Add(jsii.String("CostCenter"), jsii.String("PaymentProcessing"), nil)

	// Create S3 bucket for data storage
	dataBucket := awss3.NewBucket(stack, jsii.String(fmt.Sprintf("payment-data-bucket-%s", props.EnvironmentSuffix)), &awss3.BucketProps{
		BucketName:        jsii.String(fmt.Sprintf("payment-data-%s", props.EnvironmentSuffix)),
		Versioned:         jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		AutoDeleteObjects: jsii.Bool(true),
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Enabled:                     jsii.Bool(true),
				NoncurrentVersionExpiration: awscdk.Duration_Days(jsii.Number(30)),
				Transitions: &[]*awss3.Transition{
					{
						StorageClass:    awss3.StorageClass_INTELLIGENT_TIERING(),
						TransitionAfter: awscdk.Duration_Days(jsii.Number(90)),
					},
				},
			},
		},
		Encryption: awss3.BucketEncryption_S3_MANAGED,
	})

	// Tag S3 bucket
	awscdk.Tags_Of(dataBucket).Add(jsii.String("Environment"), jsii.String(props.Environment), nil)
	awscdk.Tags_Of(dataBucket).Add(jsii.String("CostCenter"), jsii.String("PaymentProcessing"), nil)

	// Create SQS queue for transaction processing
	transactionQueue := awssqs.NewQueue(stack, jsii.String(fmt.Sprintf("transaction-queue-%s", props.EnvironmentSuffix)), &awssqs.QueueProps{
		QueueName:         jsii.String(fmt.Sprintf("transaction-queue-%s", props.EnvironmentSuffix)),
		VisibilityTimeout: envConfig.SqsVisibilityTimeout,
		RetentionPeriod:   awscdk.Duration_Days(jsii.Number(14)),
		Encryption:        awssqs.QueueEncryption_KMS_MANAGED,
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
	})

	// Tag SQS queue
	awscdk.Tags_Of(transactionQueue).Add(jsii.String("Environment"), jsii.String(props.Environment), nil)
	awscdk.Tags_Of(transactionQueue).Add(jsii.String("CostCenter"), jsii.String("PaymentProcessing"), nil)

	// Create IAM role for Lambda with least-privilege policies
	lambdaRole := awsiam.NewRole(stack, jsii.String(fmt.Sprintf("lambda-role-%s", props.EnvironmentSuffix)), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("lambda.amazonaws.com"), nil),
		RoleName:  jsii.String(fmt.Sprintf("payment-lambda-role-%s", props.EnvironmentSuffix)),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AWSLambdaVPCAccessExecutionRole")),
		},
	})

	// Add least-privilege policies
	lambdaRole.AddToPolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect: awsiam.Effect_ALLOW,
		Actions: &[]*string{
			jsii.String("s3:GetObject"),
			jsii.String("s3:PutObject"),
		},
		Resources: &[]*string{
			dataBucket.ArnForObjects(jsii.String("*")),
		},
	}))

	lambdaRole.AddToPolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect: awsiam.Effect_ALLOW,
		Actions: &[]*string{
			jsii.String("sqs:ReceiveMessage"),
			jsii.String("sqs:DeleteMessage"),
			jsii.String("sqs:GetQueueAttributes"),
			jsii.String("sqs:SendMessage"),
		},
		Resources: &[]*string{
			transactionQueue.QueueArn(),
		},
	}))

	lambdaRole.AddToPolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect: awsiam.Effect_ALLOW,
		Actions: &[]*string{
			jsii.String("logs:CreateLogGroup"),
			jsii.String("logs:CreateLogStream"),
			jsii.String("logs:PutLogEvents"),
		},
		Resources: &[]*string{
			jsii.String(fmt.Sprintf("arn:aws:logs:%s:%s:log-group:/aws/lambda/*",
				*stack.Region(), *stack.Account())),
		},
	}))

	// Create Lambda function for transaction validation
	// Determine correct path based on whether we're running from project root or lib/
	lambdaPath := getLambdaAssetPath()

	validationFunction := awslambda.NewFunction(stack, jsii.String(fmt.Sprintf("validation-function-%s", props.EnvironmentSuffix)), &awslambda.FunctionProps{
		FunctionName:   jsii.String(fmt.Sprintf("transaction-validation-%s", props.EnvironmentSuffix)),
		Runtime:        awslambda.Runtime_PROVIDED_AL2023(),
		Handler:        jsii.String("bootstrap"),
		Code:           awslambda.Code_FromAsset(jsii.String(lambdaPath), nil),
		MemorySize:     jsii.Number(envConfig.LambdaMemorySize),
		Timeout:        awscdk.Duration_Seconds(jsii.Number(30)),
		Vpc:            vpc,
		VpcSubnets:     &awsec2.SubnetSelection{SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS},
		SecurityGroups: &[]awsec2.ISecurityGroup{lambdaSecurityGroup},
		Role:           lambdaRole,
		Environment: &map[string]*string{
			"ENVIRONMENT": jsii.String(props.Environment),
			"DB_HOST":     dbInstance.DbInstanceEndpointAddress(),
			"DB_PORT":     dbInstance.DbInstanceEndpointPort(),
			"DB_NAME":     jsii.String("paymentdb"),
			"QUEUE_URL":   transactionQueue.QueueUrl(),
			"DATA_BUCKET": dataBucket.BucketName(),
		},
		LogRetention: awslogs.RetentionDays_ONE_WEEK,
	})

	// Tag Lambda function
	awscdk.Tags_Of(validationFunction).Add(jsii.String("Environment"), jsii.String(props.Environment), nil)
	awscdk.Tags_Of(validationFunction).Add(jsii.String("CostCenter"), jsii.String("PaymentProcessing"), nil)

	// Create CloudWatch alarm for Lambda errors
	validationFunction.MetricErrors(&awscloudwatch.MetricOptions{
		Period:    awscdk.Duration_Minutes(jsii.Number(5)),
		Statistic: jsii.String("Sum"),
	}).CreateAlarm(stack, jsii.String(fmt.Sprintf("lambda-errors-alarm-%s", props.EnvironmentSuffix)), &awscloudwatch.CreateAlarmOptions{
		AlarmName:          jsii.String(fmt.Sprintf("lambda-errors-%s", props.EnvironmentSuffix)),
		AlarmDescription:   jsii.String(fmt.Sprintf("Lambda function errors - %s", props.Environment)),
		Threshold:          jsii.Number(envConfig.CloudWatchAlarmThreshold),
		EvaluationPeriods:  jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
		TreatMissingData:   awscloudwatch.TreatMissingData_NOT_BREACHING,
	})

	// Create CloudWatch alarm for SQS queue depth
	transactionQueue.MetricApproximateNumberOfMessagesVisible(&awscloudwatch.MetricOptions{
		Period:    awscdk.Duration_Minutes(jsii.Number(5)),
		Statistic: jsii.String("Average"),
	}).CreateAlarm(stack, jsii.String(fmt.Sprintf("sqs-depth-alarm-%s", props.EnvironmentSuffix)), &awscloudwatch.CreateAlarmOptions{
		AlarmName:          jsii.String(fmt.Sprintf("sqs-queue-depth-%s", props.EnvironmentSuffix)),
		AlarmDescription:   jsii.String(fmt.Sprintf("SQS queue depth - %s", props.Environment)),
		Threshold:          jsii.Number(getQueueDepthThreshold(props.Environment)),
		EvaluationPeriods:  jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
		TreatMissingData:   awscloudwatch.TreatMissingData_NOT_BREACHING,
	})

	// Create CloudWatch alarm for RDS CPU
	dbInstance.MetricCPUUtilization(&awscloudwatch.MetricOptions{
		Period:    awscdk.Duration_Minutes(jsii.Number(5)),
		Statistic: jsii.String("Average"),
	}).CreateAlarm(stack, jsii.String(fmt.Sprintf("rds-cpu-alarm-%s", props.EnvironmentSuffix)), &awscloudwatch.CreateAlarmOptions{
		AlarmName:          jsii.String(fmt.Sprintf("rds-cpu-utilization-%s", props.EnvironmentSuffix)),
		AlarmDescription:   jsii.String(fmt.Sprintf("RDS CPU utilization - %s", props.Environment)),
		Threshold:          jsii.Number(getRdsCpuThreshold(props.Environment)),
		EvaluationPeriods:  jsii.Number(3),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
		TreatMissingData:   awscloudwatch.TreatMissingData_NOT_BREACHING,
	})

	// Output important values
	awscdk.NewCfnOutput(stack, jsii.String("VpcId"), &awscdk.CfnOutputProps{
		Value:       vpc.VpcId(),
		Description: jsii.String("VPC ID"),
		ExportName:  jsii.String(fmt.Sprintf("vpc-id-%s", props.EnvironmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("DatabaseEndpoint"), &awscdk.CfnOutputProps{
		Value:       dbInstance.DbInstanceEndpointAddress(),
		Description: jsii.String("RDS Database Endpoint"),
		ExportName:  jsii.String(fmt.Sprintf("db-endpoint-%s", props.EnvironmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("QueueUrl"), &awscdk.CfnOutputProps{
		Value:       transactionQueue.QueueUrl(),
		Description: jsii.String("SQS Queue URL"),
		ExportName:  jsii.String(fmt.Sprintf("queue-url-%s", props.EnvironmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("DataBucketName"), &awscdk.CfnOutputProps{
		Value:       dataBucket.BucketName(),
		Description: jsii.String("S3 Data Bucket Name"),
		ExportName:  jsii.String(fmt.Sprintf("data-bucket-%s", props.EnvironmentSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("ValidationFunctionArn"), &awscdk.CfnOutputProps{
		Value:       validationFunction.FunctionArn(),
		Description: jsii.String("Lambda Validation Function ARN"),
		ExportName:  jsii.String(fmt.Sprintf("validation-function-%s", props.EnvironmentSuffix)),
	})

	return stack
}

// getEnvironmentConfig returns environment-specific configuration
func getEnvironmentConfig(environment string) EnvironmentConfig {
	if environment == "prod" {
		return EnvironmentConfig{
			VpcCidr:                  "10.1.0.0/16",
			RdsInstanceType:          awsec2.InstanceType_Of(awsec2.InstanceClass_R5, awsec2.InstanceSize_LARGE),
			LambdaMemorySize:         2048,
			SqsVisibilityTimeout:     awscdk.Duration_Seconds(jsii.Number(120)),
			CloudWatchAlarmThreshold: 5,
		}
	}
	// Default to dev configuration
	return EnvironmentConfig{
		VpcCidr:                  "10.0.0.0/16",
		RdsInstanceType:          awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_SMALL),
		LambdaMemorySize:         512,
		SqsVisibilityTimeout:     awscdk.Duration_Seconds(jsii.Number(30)),
		CloudWatchAlarmThreshold: 10,
	}
}

// getStorageSize returns environment-specific RDS storage size
func getStorageSize(environment string) float64 {
	if environment == "prod" {
		return 100
	}
	return 20
}

// getQueueDepthThreshold returns environment-specific SQS queue depth threshold
func getQueueDepthThreshold(environment string) float64 {
	if environment == "prod" {
		return 1000
	}
	return 100
}

// getRdsCpuThreshold returns environment-specific RDS CPU threshold
func getRdsCpuThreshold(environment string) float64 {
	if environment == "prod" {
		return 80
	}
	return 70
}

// getLambdaAssetPath returns the correct path to Lambda assets
// depending on whether we're running from project root or lib/ directory
func getLambdaAssetPath() string {
	// Check if we're running from lib/ directory (for unit tests)
	if _, err := os.Stat("lambda/validation"); err == nil {
		return "lambda/validation"
	}
	// Default to project root path
	return "lib/lambda/validation"
}
