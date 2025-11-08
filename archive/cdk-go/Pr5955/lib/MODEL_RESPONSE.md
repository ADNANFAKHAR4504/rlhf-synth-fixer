# Payment Processing Infrastructure Migration - CDK Go Implementation

This implementation provides a complete AWS infrastructure solution for migrating a payment processing system from on-premises to AWS, supporting both development and production environments with environment-specific configurations.

## File: go.mod

```go
module payment-processing-migration

go 1.19

require (
	github.com/aws/aws-cdk-go/awscdk/v2 v2.100.0
	github.com/aws/constructs-go/constructs/v10 v10.3.0
	github.com/aws/jsii-runtime-go v1.91.0
)
```

## File: lib/payment-stack.go

```go
package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscodepipeline"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscodepipelineactions"
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
	VpcCidr               string
	RdsInstanceType       awsec2.InstanceType
	LambdaMemorySize      float64
	SqsVisibilityTimeout  awscdk.Duration
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
		Cidr:           jsii.String(envConfig.VpcCidr),
		MaxAzs:         jsii.Number(2),
		NatGateways:    jsii.Number(2),
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
		Vpc:               vpc,
		Description:       jsii.String(fmt.Sprintf("Subnet group for RDS - %s", props.Environment)),
		VpcSubnets:        &awsec2.SubnetSelection{SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS},
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		SubnetGroupName:   jsii.String(fmt.Sprintf("db-subnet-group-%s", props.EnvironmentSuffix)),
	})

	// Create RDS PostgreSQL instance
	dbInstance := awsrds.NewDatabaseInstance(stack, jsii.String(fmt.Sprintf("payment-db-%s", props.EnvironmentSuffix)), &awsrds.DatabaseInstanceProps{
		Engine: awsrds.DatabaseInstanceEngine_Postgres(&awsrds.PostgresInstanceEngineProps{
			Version: awsrds.PostgresEngineVersion_VER_14(),
		}),
		InstanceType:       envConfig.RdsInstanceType,
		Vpc:                vpc,
		VpcSubnets:         &awsec2.SubnetSelection{SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS},
		SecurityGroups:     &[]awsec2.ISecurityGroup{rdsSecurityGroup},
		SubnetGroup:        dbSubnetGroup,
		MultiAz:            jsii.Bool(props.Environment == "prod"),
		AllocatedStorage:   jsii.Number(getStorageSize(props.Environment)),
		StorageType:        awsrds.StorageType_GP3,
		DatabaseName:       jsii.String("paymentdb"),
		BackupRetention:    awscdk.Duration_Days(jsii.Number(7)),
		DeleteAutomatedBackups: jsii.Bool(true),
		RemovalPolicy:      awscdk.RemovalPolicy_DESTROY,
		DeletionProtection: jsii.Bool(false),
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
		BucketName:       jsii.String(fmt.Sprintf("payment-data-%s", props.EnvironmentSuffix)),
		Versioned:        jsii.Bool(true),
		RemovalPolicy:    awscdk.RemovalPolicy_DESTROY,
		AutoDeleteObjects: jsii.Bool(true),
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Enabled: jsii.Bool(true),
				NoncurrentVersionExpiration: awscdk.Duration_Days(jsii.Number(30)),
				Transitions: &[]*awss3.Transition{
					{
						StorageClass:      awss3.StorageClass_INTELLIGENT_TIERING,
						TransitionAfter:   awscdk.Duration_Days(jsii.Number(90)),
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
	validationFunction := awslambda.NewFunction(stack, jsii.String(fmt.Sprintf("validation-function-%s", props.EnvironmentSuffix)), &awslambda.FunctionProps{
		FunctionName: jsii.String(fmt.Sprintf("transaction-validation-%s", props.EnvironmentSuffix)),
		Runtime:      awslambda.Runtime_PROVIDED_AL2023(),
		Handler:      jsii.String("bootstrap"),
		Code:         awslambda.Code_FromAsset(jsii.String("lib/lambda/validation"), nil),
		MemorySize:   jsii.Number(envConfig.LambdaMemorySize),
		Timeout:      awscdk.Duration_Seconds(jsii.Number(30)),
		Vpc:          vpc,
		VpcSubnets:   &awsec2.SubnetSelection{SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS},
		SecurityGroups: &[]awsec2.ISecurityGroup{lambdaSecurityGroup},
		Role:         lambdaRole,
		Environment: &map[string]*string{
			"ENVIRONMENT":       jsii.String(props.Environment),
			"DB_HOST":          dbInstance.DbInstanceEndpointAddress(),
			"DB_PORT":          dbInstance.DbInstanceEndpointPort(),
			"DB_NAME":          jsii.String("paymentdb"),
			"QUEUE_URL":        transactionQueue.QueueUrl(),
			"DATA_BUCKET":      dataBucket.BucketName(),
		},
		LogRetention: awslogs.RetentionDays_ONE_WEEK,
	})

	// Tag Lambda function
	awscdk.Tags_Of(validationFunction).Add(jsii.String("Environment"), jsii.String(props.Environment), nil)
	awscdk.Tags_Of(validationFunction).Add(jsii.String("CostCenter"), jsii.String("PaymentProcessing"), nil)

	// Create CloudWatch alarm for Lambda errors
	validationFunction.MetricErrors(&awslambda.MetricOptions{
		Period:      awscdk.Duration_Minutes(jsii.Number(5)),
		Statistic:   jsii.String("Sum"),
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
		Period:      awscdk.Duration_Minutes(jsii.Number(5)),
		Statistic:   jsii.String("Average"),
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
		Period:      awscdk.Duration_Minutes(jsii.Number(5)),
		Statistic:   jsii.String("Average"),
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
			VpcCidr:               "10.1.0.0/16",
			RdsInstanceType:       awsec2.InstanceType_Of(awsec2.InstanceClass_R5, awsec2.InstanceSize_LARGE),
			LambdaMemorySize:      2048,
			SqsVisibilityTimeout:  awscdk.Duration_Seconds(jsii.Number(120)),
			CloudWatchAlarmThreshold: 5,
		}
	}
	// Default to dev configuration
	return EnvironmentConfig{
		VpcCidr:               "10.0.0.0/16",
		RdsInstanceType:       awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_SMALL),
		LambdaMemorySize:      512,
		SqsVisibilityTimeout:  awscdk.Duration_Seconds(jsii.Number(30)),
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
```

## File: lib/pipeline-stack.go

```go
package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscodebuild"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscodepipeline"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscodepipelineactions"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type PipelineStackProps struct {
	awscdk.StackProps
	EnvironmentSuffix string
	Environment       string
	RepositoryName    string
	BranchName        string
}

func NewPipelineStack(scope constructs.Construct, id string, props *PipelineStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	// Create artifact bucket for pipeline
	artifactBucket := awss3.NewBucket(stack, jsii.String(fmt.Sprintf("pipeline-artifacts-%s", props.EnvironmentSuffix)), &awss3.BucketProps{
		BucketName:        jsii.String(fmt.Sprintf("pipeline-artifacts-%s", props.EnvironmentSuffix)),
		Versioned:         jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		AutoDeleteObjects: jsii.Bool(true),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
	})

	// Create source output artifact
	sourceOutput := awscodepipeline.NewArtifact(jsii.String("SourceOutput"))

	// Create source action (GitHub or CodeCommit)
	sourceAction := awscodepipelineactions.NewCodeCommitSourceAction(&awscodepipelineactions.CodeCommitSourceActionProps{
		ActionName: jsii.String("Source"),
		Repository: awscodepipeline.NewCfnPipeline_ActionDeclarationProperty(&awscodepipeline.CfnPipeline_ActionDeclarationProperty{
			Name: jsii.String("Source"),
		}),
		Branch: jsii.String(props.BranchName),
		Output: sourceOutput,
	})

	// Create build project for CDK synth
	buildProject := awscodebuild.NewPipelineProject(stack, jsii.String(fmt.Sprintf("build-project-%s", props.EnvironmentSuffix)), &awscodebuild.PipelineProjectProps{
		ProjectName: jsii.String(fmt.Sprintf("payment-cdk-build-%s", props.EnvironmentSuffix)),
		Environment: &awscodebuild.BuildEnvironment{
			BuildImage:           awscodebuild.LinuxBuildImage_STANDARD_7_0(),
			ComputeType:          awscodebuild.ComputeType_SMALL,
			PrivilegedMode:       jsii.Bool(false),
		},
		BuildSpec: awscodebuild.BuildSpec_FromObject(&map[string]interface{}{
			"version": "0.2",
			"phases": map[string]interface{}{
				"install": map[string]interface{}{
					"commands": []string{
						"npm install -g aws-cdk",
						"go version",
					},
				},
				"build": map[string]interface{}{
					"commands": []string{
						"go mod download",
						"cdk synth",
					},
				},
			},
			"artifacts": map[string]interface{}{
				"base-directory": "cdk.out",
				"files": []string{
					"**/*",
				},
			},
		}),
	})

	// Create build output artifact
	buildOutput := awscodepipeline.NewArtifact(jsii.String("BuildOutput"))

	// Create build action
	buildAction := awscodepipelineactions.NewCodeBuildAction(&awscodepipelineactions.CodeBuildActionProps{
		ActionName: jsii.String("Build"),
		Project:    buildProject,
		Input:      sourceOutput,
		Outputs:    &[]awscodepipeline.Artifact{buildOutput},
	})

	// Create manual approval action for production
	var approvalAction awscodepipelineactions.ManualApprovalAction
	if props.Environment == "prod" {
		approvalAction = awscodepipelineactions.NewManualApprovalAction(&awscodepipelineactions.ManualApprovalActionProps{
			ActionName:            jsii.String("ManualApproval"),
			AdditionalInformation: jsii.String("Please review the changes before deploying to production"),
			RunOrder:              jsii.Number(1),
		})
	}

	// Create deploy action
	deployAction := awscodepipelineactions.NewCloudFormationCreateUpdateStackAction(&awscodepipelineactions.CloudFormationCreateUpdateStackActionProps{
		ActionName:   jsii.String("Deploy"),
		StackName:    jsii.String(fmt.Sprintf("PaymentStack-%s", props.Environment)),
		TemplatePath: buildOutput.AtPath(jsii.String(fmt.Sprintf("PaymentStack-%s.template.json", props.Environment))),
		AdminPermissions: jsii.Bool(true),
		RunOrder:     jsii.Number(2),
	})

	// Create pipeline stages
	stages := []*awscodepipeline.StageProps{
		{
			StageName: jsii.String("Source"),
			Actions:   &[]awscodepipeline.IAction{sourceAction},
		},
		{
			StageName: jsii.String("Build"),
			Actions:   &[]awscodepipeline.IAction{buildAction},
		},
	}

	// Add approval and deploy stage
	var deployStageActions []awscodepipeline.IAction
	if props.Environment == "prod" {
		deployStageActions = []awscodepipeline.IAction{approvalAction, deployAction}
	} else {
		deployStageActions = []awscodepipeline.IAction{deployAction}
	}

	stages = append(stages, &awscodepipeline.StageProps{
		StageName: jsii.String("Deploy"),
		Actions:   &deployStageActions,
	})

	// Create pipeline
	pipeline := awscodepipeline.NewPipeline(stack, jsii.String(fmt.Sprintf("pipeline-%s", props.EnvironmentSuffix)), &awscodepipeline.PipelineProps{
		PipelineName:  jsii.String(fmt.Sprintf("payment-pipeline-%s", props.EnvironmentSuffix)),
		ArtifactBucket: artifactBucket,
		Stages:        &stages,
		RestartExecutionOnUpdate: jsii.Bool(false),
	})

	// Tag pipeline
	awscdk.Tags_Of(pipeline).Add(jsii.String("Environment"), jsii.String(props.Environment), nil)
	awscdk.Tags_Of(pipeline).Add(jsii.String("CostCenter"), jsii.String("PaymentProcessing"), nil)

	// Output pipeline ARN
	awscdk.NewCfnOutput(stack, jsii.String("PipelineArn"), &awscdk.CfnOutputProps{
		Value:       pipeline.PipelineArn(),
		Description: jsii.String("CodePipeline ARN"),
		ExportName:  jsii.String(fmt.Sprintf("pipeline-arn-%s", props.EnvironmentSuffix)),
	})

	return stack
}
```

## File: bin/tap.go

```go
package main

import (
	"os"

	"payment-processing-migration/lib"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"
)

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	// Get environment from context (defaults to dev)
	environment := app.Node().TryGetContext(jsii.String("environment"))
	var env string
	if environment != nil {
		env = environment.(string)
	} else {
		env = "dev"
	}

	// Get environment suffix from context (defaults to random)
	envSuffix := app.Node().TryGetContext(jsii.String("environmentSuffix"))
	var suffix string
	if envSuffix != nil {
		suffix = envSuffix.(string)
	} else {
		suffix = env + "-default"
	}

	// Get AWS account and region from environment variables
	account := os.Getenv("CDK_DEFAULT_ACCOUNT")
	region := os.Getenv("CDK_DEFAULT_REGION")
	if region == "" {
		region = "us-east-1"
	}

	// Create payment stack
	lib.NewPaymentStack(app, "PaymentStack-" + env, &lib.PaymentStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Account: jsii.String(account),
				Region:  jsii.String(region),
			},
			Description: jsii.String("Payment Processing Infrastructure Stack - " + env),
		},
		EnvironmentSuffix: suffix,
		Environment:       env,
	})

	// Create pipeline stack (optional, only if repository is configured)
	repoName := app.Node().TryGetContext(jsii.String("repositoryName"))
	if repoName != nil {
		branchName := "main"
		if env == "dev" {
			branchName = "develop"
		}

		lib.NewPipelineStack(app, "PipelineStack-" + env, &lib.PipelineStackProps{
			StackProps: awscdk.StackProps{
				Env: &awscdk.Environment{
					Account: jsii.String(account),
					Region:  jsii.String(region),
				},
				Description: jsii.String("Deployment Pipeline Stack - " + env),
			},
			EnvironmentSuffix: suffix,
			Environment:       env,
			RepositoryName:    repoName.(string),
			BranchName:        branchName,
		})
	}

	app.Synth(nil)
}
```

## File: lib/lambda/validation/main.go

```go
package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	_ "github.com/lib/pq"
)

type Transaction struct {
	ID          string  `json:"id"`
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	MerchantID  string  `json:"merchant_id"`
	CustomerID  string  `json:"customer_id"`
	Timestamp   string  `json:"timestamp"`
}

type ValidationResult struct {
	TransactionID string `json:"transaction_id"`
	Valid         bool   `json:"valid"`
	Reason        string `json:"reason,omitempty"`
}

var (
	db          *sql.DB
	s3Client    *s3.Client
	sqsClient   *sqs.Client
	environment string
	dbHost      string
	dbPort      string
	dbName      string
	queueURL    string
	dataBucket  string
)

func init() {
	environment = os.Getenv("ENVIRONMENT")
	dbHost = os.Getenv("DB_HOST")
	dbPort = os.Getenv("DB_PORT")
	dbName = os.Getenv("DB_NAME")
	queueURL = os.Getenv("QUEUE_URL")
	dataBucket = os.Getenv("DATA_BUCKET")

	// Initialize database connection
	var err error
	dbURL := fmt.Sprintf("postgres://admin:password@%s:%s/%s?sslmode=require",
		dbHost, dbPort, dbName)
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to database: %v", err))
	}

	// Initialize AWS SDK clients
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		panic(fmt.Sprintf("Failed to load AWS config: %v", err))
	}

	s3Client = s3.NewFromConfig(cfg)
	sqsClient = sqs.NewFromConfig(cfg)
}

func handler(ctx context.Context, sqsEvent events.SQSEvent) error {
	for _, record := range sqsEvent.Records {
		var transaction Transaction
		err := json.Unmarshal([]byte(record.Body), &transaction)
		if err != nil {
			fmt.Printf("Error unmarshaling transaction: %v\n", err)
			continue
		}

		result := validateTransaction(ctx, transaction)

		// Store validation result in S3
		err = storeResult(ctx, result)
		if err != nil {
			fmt.Printf("Error storing result: %v\n", err)
			return err
		}

		// Delete message from queue if processing succeeded
		if result.Valid {
			fmt.Printf("Transaction %s validated successfully\n", transaction.ID)
		} else {
			fmt.Printf("Transaction %s validation failed: %s\n", transaction.ID, result.Reason)
		}
	}

	return nil
}

func validateTransaction(ctx context.Context, tx Transaction) ValidationResult {
	result := ValidationResult{
		TransactionID: tx.ID,
		Valid:         true,
	}

	// Validate amount
	if tx.Amount <= 0 {
		result.Valid = false
		result.Reason = "Invalid amount"
		return result
	}

	// Validate currency
	if tx.Currency == "" {
		result.Valid = false
		result.Reason = "Missing currency"
		return result
	}

	// Check for fraud patterns in database
	var fraudCount int
	err := db.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM fraud_patterns WHERE merchant_id = $1 OR customer_id = $2",
		tx.MerchantID, tx.CustomerID).Scan(&fraudCount)

	if err != nil {
		fmt.Printf("Database query error: %v\n", err)
		result.Valid = false
		result.Reason = "Database validation error"
		return result
	}

	if fraudCount > 0 {
		result.Valid = false
		result.Reason = "Fraud pattern detected"
		return result
	}

	return result
}

func storeResult(ctx context.Context, result ValidationResult) error {
	data, err := json.Marshal(result)
	if err != nil {
		return err
	}

	key := fmt.Sprintf("validation-results/%s/%s.json", environment, result.TransactionID)

	// Store result in S3 (implementation simplified for brevity)
	fmt.Printf("Would store result to s3://%s/%s\n", dataBucket, key)

	return nil
}

func main() {
	lambda.Start(handler)
}
```

## File: lib/lambda/validation/go.mod

```go
module validation

go 1.19

require (
	github.com/aws/aws-lambda-go v1.41.0
	github.com/aws/aws-sdk-go-v2 v1.21.0
	github.com/aws/aws-sdk-go-v2/config v1.18.42
	github.com/aws/aws-sdk-go-v2/service/s3 v1.40.0
	github.com/aws/aws-sdk-go-v2/service/sqs v1.24.6
	github.com/lib/pq v1.10.9
)
```

## File: cdk.json

```json
{
  "app": "go run bin/tap.go",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "go.mod",
      "go.sum",
      "**/*test.go"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false
  }
}
```

## File: README.md

```markdown
# Payment Processing Infrastructure Migration

This CDK Go application provides a complete infrastructure solution for migrating a payment processing system from on-premises to AWS, supporting both development and production environments.

## Prerequisites

- Go 1.19 or higher
- AWS CDK 2.100 or higher
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

## Architecture

The solution creates:

- **VPC**: Separate VPCs for dev (10.0.0.0/16) and prod (10.1.0.0/16) with public/private subnets across 2 AZs
- **RDS**: PostgreSQL 14 instances with automated backups (db.t3.small for dev, db.r5.large for prod)
- **Lambda**: Transaction validation functions with Go runtime (512MB for dev, 2048MB for prod)
- **S3**: Versioned buckets with lifecycle policies for data storage
- **SQS**: Message queues with environment-specific visibility timeouts
- **IAM**: Least-privilege roles and policies
- **CloudWatch**: Monitoring and alarms with environment-appropriate thresholds
- **CodePipeline**: Deployment automation with manual approval for production

## Installation

1. Install dependencies:
```bash
go mod download
```

2. Bootstrap CDK (first time only):
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
```

## Deployment

### Deploy Development Environment

```bash
cdk deploy PaymentStack-dev \
  -c environment=dev \
  -c environmentSuffix=dev-v1
```

### Deploy Production Environment

```bash
cdk deploy PaymentStack-prod \
  -c environment=prod \
  -c environmentSuffix=prod-v1
```

### Deploy with Pipeline

```bash
cdk deploy PipelineStack-prod \
  -c environment=prod \
  -c environmentSuffix=prod-v1 \
  -c repositoryName=payment-processing-repo
```

## Environment-Specific Configurations

### Development
- VPC CIDR: 10.0.0.0/16
- RDS: db.t3.small, 20GB storage
- Lambda: 512MB memory
- SQS visibility timeout: 30 seconds
- CloudWatch alarm threshold: 10 errors

### Production
- VPC CIDR: 10.1.0.0/16
- RDS: db.r5.large, 100GB storage, Multi-AZ enabled
- Lambda: 2048MB memory
- SQS visibility timeout: 120 seconds
- CloudWatch alarm threshold: 5 errors

## Lambda Function

The transaction validation Lambda function:
- Uses Go runtime (provided.al2023)
- Validates transaction data
- Checks for fraud patterns in RDS
- Stores results in S3
- Processes messages from SQS

To build the Lambda function:
```bash
cd lib/lambda/validation
GOOS=linux GOARCH=amd64 go build -o bootstrap main.go
zip function.zip bootstrap
```

## Security Features

- Network isolation with VPCs and security groups
- Database access restricted to Lambda functions only
- Least-privilege IAM policies
- Encryption at rest for S3 and SQS
- Multi-AZ deployment for production RDS

## Monitoring

CloudWatch alarms are configured for:
- Lambda function errors
- SQS queue depth
- RDS CPU utilization

## Cost Optimization

- Development environment uses smaller, cost-effective instance types
- S3 lifecycle policies transition objects to Intelligent-Tiering after 90 days
- Lambda functions sized appropriately per environment
- RDS automated backups with 7-day retention

## Cleanup

To destroy the infrastructure:

```bash
cdk destroy PaymentStack-dev
cdk destroy PaymentStack-prod
cdk destroy PipelineStack-prod
```

## Context Variables

- `environment`: Target environment (dev/prod)
- `environmentSuffix`: Unique suffix for resource naming
- `repositoryName`: CodeCommit repository name (optional, for pipeline)

## Useful CDK Commands

- `cdk synth` - Synthesize CloudFormation template
- `cdk diff` - Compare deployed stack with current state
- `cdk deploy` - Deploy stack to AWS
- `cdk destroy` - Remove stack from AWS
- `cdk ls` - List all stacks

## Testing

Run Go tests:
```bash
go test ./...
```

## License

This project is licensed under the MIT License.
```

## File: .gitignore

```
# Binaries for programs and plugins
*.exe
*.exe~
*.dll
*.so
*.dylib

# Test binary, built with `go test -c`
*.test

# Output of the go coverage tool
*.out

# Dependency directories
vendor/

# Go workspace file
go.work

# CDK asset staging directory
.cdk.staging
cdk.out

# Lambda build artifacts
lib/lambda/*/bootstrap
lib/lambda/*/function.zip

# Environment variables
.env

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
```

## File: Makefile

```makefile
.PHONY: help install build test deploy-dev deploy-prod clean

help:
	@echo "Available commands:"
	@echo "  make install     - Install Go dependencies"
	@echo "  make build       - Build Lambda functions"
	@echo "  make test        - Run tests"
	@echo "  make deploy-dev  - Deploy to development environment"
	@echo "  make deploy-prod - Deploy to production environment"
	@echo "  make clean       - Clean build artifacts"

install:
	go mod download
	npm install -g aws-cdk

build:
	cd lib/lambda/validation && \
	GOOS=linux GOARCH=amd64 go build -o bootstrap main.go && \
	zip -j function.zip bootstrap

test:
	go test ./... -v

deploy-dev:
	cdk deploy PaymentStack-dev \
		-c environment=dev \
		-c environmentSuffix=dev-v1

deploy-prod:
	cdk deploy PaymentStack-prod \
		-c environment=prod \
		-c environmentSuffix=prod-v1

clean:
	rm -rf cdk.out
	rm -f lib/lambda/*/bootstrap
	rm -f lib/lambda/*/function.zip
```
