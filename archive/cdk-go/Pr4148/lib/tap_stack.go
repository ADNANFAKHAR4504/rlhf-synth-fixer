package lib

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatchactions"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsevents"
	"github.com/aws/aws-cdk-go/awscdk/v2/awseventstargets"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awskinesis"
	"github.com/aws/aws-cdk-go/awscdk/v2/awskms"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsstepfunctions"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsstepfunctionstasks"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// TapStackProps defines the properties for the TapStack CDK stack.
//
// This struct extends the base awscdk.StackProps with additional
// environment-specific configuration options.
type TapStackProps struct {
	*awscdk.StackProps
	// EnvironmentSuffix is an optional suffix to identify the
	// deployment environment (e.g., 'dev', 'prod').
	EnvironmentSuffix *string
}

// generateRandomSuffix creates a random 6-character suffix for resource naming
func generateRandomSuffix() string {
	rand.Seed(time.Now().UnixNano())
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	suffix := make([]byte, 6)
	for i := range suffix {
		suffix[i] = charset[rand.Intn(len(charset))]
	}
	return string(suffix)
}

// TapStack represents the main CDK stack for the Tap project.
//
// This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
// It determines the environment suffix from the provided properties,
// CDK context, or defaults to 'dev'.
//
// Note:
//   - Do NOT create AWS resources directly in this stack.
//   - Instead, instantiate separate stacks for each resource type within this stack.
type TapStack struct {
	awscdk.Stack
	// EnvironmentSuffix stores the environment suffix used for resource naming and configuration.
	EnvironmentSuffix *string
	// RandomSuffix stores a random suffix to ensure unique resource names
	RandomSuffix *string

	// Data infrastructure resources
	EncryptionKey   awskms.Key
	RawImageBucket  awss3.Bucket
	ProcessedBucket awss3.Bucket
	MetadataTable   awsdynamodb.Table
	DataStream      awskinesis.Stream

	// Training infrastructure resources
	TrainingBucket   awss3.Bucket
	SageMakerRole    awsiam.Role
	TrainingPipeline awsstepfunctions.StateMachine

	// Inference infrastructure resources
	ModelBucket     awss3.Bucket
	InferenceApi    awsapigateway.RestApi
	InferenceLambda awslambda.Function

	// Monitoring infrastructure resources
	AlertTopic awssns.Topic
	Dashboard  awscloudwatch.Dashboard
}

// NewTapStack creates a new instance of TapStack.
//
// Args:
//
//	scope: The parent construct.
//	id: The unique identifier for this stack.
//	props: Optional properties for configuring the stack, including environment suffix.
//
// Returns:
//
//	A new TapStack instance.
func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Get environment suffix from props, context, or use 'dev' as default
	var environmentSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		// Context values can be strings or *string depending on how they're set
		switch v := suffix.(type) {
		case string:
			environmentSuffix = v
		case *string:
			environmentSuffix = *v
		default:
			environmentSuffix = "dev"
		}
	} else {
		environmentSuffix = "dev"
	}

	// Generate random suffix for unique resource names
	randomSuffix := generateRandomSuffix()

	tapStack := &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
		RandomSuffix:      jsii.String(randomSuffix),
	}

	// 1. Create Data Infrastructure
	tapStack.createDataInfrastructure(stack)

	// 2. Create Training Infrastructure
	tapStack.createTrainingInfrastructure(stack)

	// 3. Create Inference Infrastructure
	tapStack.createInferenceInfrastructure(stack)

	// 4. Create Monitoring Infrastructure
	tapStack.createMonitoringInfrastructure(stack)

	// 5. Add outputs for integration testing
	tapStack.addStackOutputs(stack)

	return tapStack
}

func (tapStack *TapStack) createDataInfrastructure(stack awscdk.Stack) {
	// Create KMS encryption key
	tapStack.EncryptionKey = awskms.NewKey(stack, jsii.String("DataEncryptionKey"), &awskms.KeyProps{
		Description:       jsii.String("Vision ML Pipeline Data Encryption Key"),
		EnableKeyRotation: jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		PendingWindow:     awscdk.Duration_Days(jsii.Number(7)),
	})

	// Raw image bucket (input)
	tapStack.RawImageBucket = awss3.NewBucket(stack, jsii.String("RawImageBucket"), &awss3.BucketProps{
		BucketName:        jsii.String(fmt.Sprintf("raw-images-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
		Versioned:         jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		AutoDeleteObjects: jsii.Bool(true),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_KMS,
		EncryptionKey:     tapStack.EncryptionKey,
	})

	// Processed data bucket (for preprocessed images)
	tapStack.ProcessedBucket = awss3.NewBucket(stack, jsii.String("ProcessedDataBucket"), &awss3.BucketProps{
		BucketName:        jsii.String(fmt.Sprintf("processed-images-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
		Versioned:         jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		AutoDeleteObjects: jsii.Bool(true),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_KMS,
		EncryptionKey:     tapStack.EncryptionKey,
	})

	// DynamoDB table for image metadata
	tapStack.MetadataTable = awsdynamodb.NewTable(stack, jsii.String("ImageMetadataTable"), &awsdynamodb.TableProps{
		TableName:   jsii.String(fmt.Sprintf("image-metadata-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
		BillingMode: awsdynamodb.BillingMode_PAY_PER_REQUEST,
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("image_id"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		PointInTimeRecovery: jsii.Bool(true),
		RemovalPolicy:       awscdk.RemovalPolicy_DESTROY,
		Encryption:          awsdynamodb.TableEncryption_CUSTOMER_MANAGED,
		EncryptionKey:       tapStack.EncryptionKey,
	})

	// Kinesis stream for real-time image processing
	tapStack.DataStream = awskinesis.NewStream(stack, jsii.String("ImageProcessingStream"), &awskinesis.StreamProps{
		StreamName:      jsii.String(fmt.Sprintf("image-processing-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
		RetentionPeriod: awscdk.Duration_Hours(jsii.Number(24)),
		StreamMode:      awskinesis.StreamMode_ON_DEMAND,
		Encryption:      awskinesis.StreamEncryption_KMS,
		EncryptionKey:   tapStack.EncryptionKey,
	})
}

func (tapStack *TapStack) createTrainingInfrastructure(stack awscdk.Stack) {
	// Training data bucket
	tapStack.TrainingBucket = awss3.NewBucket(stack, jsii.String("TrainingDataBucket"), &awss3.BucketProps{
		BucketName:        jsii.String(fmt.Sprintf("model-training-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
		Versioned:         jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		AutoDeleteObjects: jsii.Bool(true),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_KMS,
		EncryptionKey:     tapStack.EncryptionKey,
	})

	// IAM role for SageMaker with least privilege permissions
	tapStack.SageMakerRole = awsiam.NewRole(stack, jsii.String("SageMakerExecutionRole"), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("sagemaker.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSageMakerFullAccess")),
		},
	})

	// Add scoped S3 permissions instead of AmazonS3FullAccess
	tapStack.SageMakerRole.AddToPolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect: awsiam.Effect_ALLOW,
		Actions: &[]*string{
			jsii.String("s3:GetObject"),
			jsii.String("s3:PutObject"),
			jsii.String("s3:ListBucket"),
		},
		Resources: &[]*string{
			tapStack.TrainingBucket.BucketArn(),
			tapStack.TrainingBucket.ArnForObjects(jsii.String("*")),
			tapStack.ProcessedBucket.BucketArn(),
			tapStack.ProcessedBucket.ArnForObjects(jsii.String("*")),
			tapStack.RawImageBucket.BucketArn(),
			tapStack.RawImageBucket.ArnForObjects(jsii.String("*")),
		},
	}))

	// Grant KMS permissions for encrypted buckets
	tapStack.EncryptionKey.GrantEncryptDecrypt(tapStack.SageMakerRole)

	// Define training pipeline using Step Functions
	prepLambda := awslambda.NewFunction(stack, jsii.String("DataPrepLambda"), &awslambda.FunctionProps{
		Runtime:    awslambda.Runtime_PYTHON_3_9(),
		Handler:    jsii.String("index.handler"),
		Code:       awslambda.Code_FromInline(jsii.String("def handler(event, context):\n    print('Data preparation lambda')\n    return {'statusCode': 200}")),
		Timeout:    awscdk.Duration_Minutes(jsii.Number(5)),
		MemorySize: jsii.Number(512),
	})

	trainingJob := awsstepfunctions.NewPass(stack, jsii.String("ModelTrainingJob"), &awsstepfunctions.PassProps{
		Comment: jsii.String("Simulate SageMaker Training Job"),
		Result:  awsstepfunctions.Result_FromObject(&map[string]interface{}{"TrainingJobStatus": "Completed"}),
	})

	evalLambda := awslambda.NewFunction(stack, jsii.String("ModelEvalLambda"), &awslambda.FunctionProps{
		Runtime:    awslambda.Runtime_PYTHON_3_9(),
		Handler:    jsii.String("index.handler"),
		Code:       awslambda.Code_FromInline(jsii.String("def handler(event, context):\n    print('Model evaluation lambda')\n    return {'statusCode': 200}")),
		Timeout:    awscdk.Duration_Minutes(jsii.Number(5)),
		MemorySize: jsii.Number(512),
	})

	// Build Step Functions workflow with tasks
	prepTask := awsstepfunctionstasks.NewLambdaInvoke(stack, jsii.String("PrepareTrainingData"), &awsstepfunctionstasks.LambdaInvokeProps{
		LambdaFunction: prepLambda,
		OutputPath:     jsii.String("$.Payload"),
	})

	evalTask := awsstepfunctionstasks.NewLambdaInvoke(stack, jsii.String("EvaluateModel"), &awsstepfunctionstasks.LambdaInvokeProps{
		LambdaFunction: evalLambda,
		OutputPath:     jsii.String("$.Payload"),
	})

	// Chain the tasks
	definition := prepTask.Next(trainingJob).Next(evalTask)

	trainPipeline := awsstepfunctions.NewStateMachine(stack, jsii.String("ModelTrainingPipeline"), &awsstepfunctions.StateMachineProps{
		StateMachineName: jsii.String(fmt.Sprintf("ml-model-training-pipeline-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
		Definition:       definition,
		Timeout:          awscdk.Duration_Hours(jsii.Number(2)),
	})

	tapStack.TrainingPipeline = trainPipeline
}

func (tapStack *TapStack) createInferenceInfrastructure(stack awscdk.Stack) {
	// Model artifacts bucket
	tapStack.ModelBucket = awss3.NewBucket(stack, jsii.String("ModelArtifactsBucket"), &awss3.BucketProps{
		BucketName:        jsii.String(fmt.Sprintf("model-artifacts-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
		Versioned:         jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		AutoDeleteObjects: jsii.Bool(true),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_KMS,
		EncryptionKey:     tapStack.EncryptionKey,
	})

	// Inference Lambda
	tapStack.InferenceLambda = awslambda.NewFunction(stack, jsii.String("InferenceFunction"), &awslambda.FunctionProps{
		Runtime:    awslambda.Runtime_PYTHON_3_9(),
		Handler:    jsii.String("index.handler"),
		Code:       awslambda.Code_FromInline(jsii.String("def handler(event, context):\n    print('Inference lambda')\n    return {'statusCode': 200, 'body': '{\"prediction\": \"example\"}'}")),
		Timeout:    awscdk.Duration_Minutes(jsii.Number(1)),
		MemorySize: jsii.Number(1024),
		Environment: &map[string]*string{
			"MODEL_BUCKET":   tapStack.ModelBucket.BucketName(),
			"ENVIRONMENT":    tapStack.EnvironmentSuffix,
			"METADATA_TABLE": tapStack.MetadataTable.TableName(),
		},
	})

	// Grant permissions
	tapStack.ModelBucket.GrantRead(tapStack.InferenceLambda, nil)
	tapStack.MetadataTable.GrantReadWriteData(tapStack.InferenceLambda)

	// API Gateway with authentication
	tapStack.InferenceApi = awsapigateway.NewRestApi(stack, jsii.String("InferenceAPI"), &awsapigateway.RestApiProps{
		RestApiName: jsii.String(fmt.Sprintf("ml-inference-api-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
		Description: jsii.String("API for ML model inference with API Key authentication"),
		DeployOptions: &awsapigateway.StageOptions{
			StageName:            jsii.String("v1"),
			LoggingLevel:         awsapigateway.MethodLoggingLevel_INFO,
			DataTraceEnabled:     jsii.Bool(true),
			MetricsEnabled:       jsii.Bool(true),
			TracingEnabled:       jsii.Bool(true),
			ThrottlingBurstLimit: jsii.Number(100),
			ThrottlingRateLimit:  jsii.Number(50),
		},
		CloudWatchRole: jsii.Bool(true),
	})

	// Create API Key for authentication
	apiKey := tapStack.InferenceApi.AddApiKey(jsii.String("InferenceApiKey"), &awsapigateway.ApiKeyOptions{
		ApiKeyName:  jsii.String(fmt.Sprintf("ml-inference-key-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
		Description: jsii.String("API Key for ML inference endpoint"),
	})

	// Create usage plan with throttling and quota
	usagePlan := tapStack.InferenceApi.AddUsagePlan(jsii.String("InferenceUsagePlan"), &awsapigateway.UsagePlanProps{
		Name:        jsii.String(fmt.Sprintf("ml-inference-usage-plan-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
		Description: jsii.String("Usage plan for ML inference API"),
		Throttle: &awsapigateway.ThrottleSettings{
			RateLimit:  jsii.Number(50),
			BurstLimit: jsii.Number(100),
		},
		Quota: &awsapigateway.QuotaSettings{
			Limit:  jsii.Number(10000),
			Period: awsapigateway.Period_DAY,
		},
		ApiStages: &[]*awsapigateway.UsagePlanPerApiStage{
			{
				Api:   tapStack.InferenceApi,
				Stage: tapStack.InferenceApi.DeploymentStage(),
			},
		},
	})

	usagePlan.AddApiKey(apiKey, nil)

	// Add /predict endpoint with API Key requirement
	inferenceResource := tapStack.InferenceApi.Root().AddResource(jsii.String("predict"), nil)
	inferenceResource.AddMethod(jsii.String("POST"), awsapigateway.NewLambdaIntegration(tapStack.InferenceLambda, nil), &awsapigateway.MethodOptions{
		ApiKeyRequired:    jsii.Bool(true),
		AuthorizationType: awsapigateway.AuthorizationType_NONE,
	})

	// Export API Key ID for retrieval
	awscdk.NewCfnOutput(stack, jsii.String("InferenceApiKeyId"), &awscdk.CfnOutputProps{
		Value:       apiKey.KeyId(),
		Description: jsii.String("API Key ID for inference endpoint (use AWS CLI to get the value)"),
		ExportName:  jsii.String(fmt.Sprintf("InferenceApiKeyId-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
	})
}

func (tapStack *TapStack) createMonitoringInfrastructure(stack awscdk.Stack) {
	// SNS topic for alerts
	tapStack.AlertTopic = awssns.NewTopic(stack, jsii.String("AlertTopic"), &awssns.TopicProps{
		TopicName: jsii.String(fmt.Sprintf("ml-pipeline-alerts-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
	})

	// CloudWatch Dashboard
	tapStack.Dashboard = awscloudwatch.NewDashboard(stack, jsii.String("MLPipelineDashboard"), &awscloudwatch.DashboardProps{
		DashboardName: jsii.String(fmt.Sprintf("ml-pipeline-dashboard-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
	})

	// API Gateway widget
	apiWidget := awscloudwatch.NewGraphWidget(&awscloudwatch.GraphWidgetProps{
		Title: jsii.String("API Gateway Metrics"),
		Left: &[]awscloudwatch.IMetric{
			tapStack.InferenceApi.MetricCount(nil),
			tapStack.InferenceApi.MetricLatency(nil),
		},
	})

	// Lambda widget
	lambdaWidget := awscloudwatch.NewGraphWidget(&awscloudwatch.GraphWidgetProps{
		Title: jsii.String("Lambda Metrics"),
		Left: &[]awscloudwatch.IMetric{
			tapStack.InferenceLambda.MetricInvocations(nil),
			tapStack.InferenceLambda.MetricDuration(nil),
			tapStack.InferenceLambda.MetricErrors(nil),
		},
	})

	tapStack.Dashboard.AddWidgets(apiWidget, lambdaWidget)

	// Create CloudWatch Alarms
	tapStack.createAlarms(stack)
}

func (tapStack *TapStack) createAlarms(stack awscdk.Stack) {
	// API Gateway latency alarm
	apiLatencyAlarm := tapStack.InferenceApi.MetricLatency(nil).CreateAlarm(stack, jsii.String("ApiLatencyAlarm"), &awscloudwatch.CreateAlarmOptions{
		EvaluationPeriods:  jsii.Number(3),
		Threshold:          jsii.Number(500),
		AlarmName:          jsii.String(fmt.Sprintf("api-latency-alarm-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
		AlarmDescription:   jsii.String("Alarm when API Gateway latency exceeds 500ms"),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
		TreatMissingData:   awscloudwatch.TreatMissingData_NOT_BREACHING,
	})

	// Lambda error alarm
	lambdaErrorAlarm := tapStack.InferenceLambda.MetricErrors(nil).CreateAlarm(stack, jsii.String("LambdaErrorAlarm"), &awscloudwatch.CreateAlarmOptions{
		EvaluationPeriods:  jsii.Number(1),
		Threshold:          jsii.Number(1),
		AlarmName:          jsii.String(fmt.Sprintf("lambda-error-alarm-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
		AlarmDescription:   jsii.String("Alarm when Lambda has errors"),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
	})

	// Connect alarms to SNS topic
	apiLatencyAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(tapStack.AlertTopic))
	lambdaErrorAlarm.AddAlarmAction(awscloudwatchactions.NewSnsAction(tapStack.AlertTopic))

	// Schedule daily training job
	schedule := awsevents.NewRule(stack, jsii.String("DailyTrainingSchedule"), &awsevents.RuleProps{
		RuleName: jsii.String(fmt.Sprintf("daily-training-schedule-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
		Schedule: awsevents.Schedule_Expression(jsii.String("cron(0 0 * * ? *)")),
		Enabled:  jsii.Bool(false), // Disabled by default
	})

	schedule.AddTarget(awseventstargets.NewSfnStateMachine(tapStack.TrainingPipeline, nil))
}

func (tapStack *TapStack) addStackOutputs(stack awscdk.Stack) {
	// Add outputs for resources
	awscdk.NewCfnOutput(stack, jsii.String("RawImageBucketName"), &awscdk.CfnOutputProps{
		Value:       tapStack.RawImageBucket.BucketName(),
		Description: jsii.String("Raw image bucket name"),
		ExportName:  jsii.String(fmt.Sprintf("RawImageBucket-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("ProcessedBucketName"), &awscdk.CfnOutputProps{
		Value:       tapStack.ProcessedBucket.BucketName(),
		Description: jsii.String("Processed data bucket name"),
		ExportName:  jsii.String(fmt.Sprintf("ProcessedBucket-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("MetadataTableName"), &awscdk.CfnOutputProps{
		Value:       tapStack.MetadataTable.TableName(),
		Description: jsii.String("Image metadata table name"),
		ExportName:  jsii.String(fmt.Sprintf("MetadataTable-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("ModelBucketName"), &awscdk.CfnOutputProps{
		Value:       tapStack.ModelBucket.BucketName(),
		Description: jsii.String("Model artifacts bucket name"),
		ExportName:  jsii.String(fmt.Sprintf("ModelBucket-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("InferenceApiEndpoint"), &awscdk.CfnOutputProps{
		Value:       tapStack.InferenceApi.Url(),
		Description: jsii.String("Inference API endpoint"),
		ExportName:  jsii.String(fmt.Sprintf("InferenceApiEndpoint-%s-%s", *tapStack.EnvironmentSuffix, *tapStack.RandomSuffix)),
	})
}
