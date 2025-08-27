I'll update the TAP stack to address all the critical fixes and enhancements. Here's the comprehensive solution:

## 1. Enhanced Main Stack (`lib/tap_stack.go`)

```go
package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awswafv2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"iac-test-automations/lib/constructs"
)

type TapStackProps struct {
	awscdk.StackProps
	Environment string
	Region      string
}

type TapStack struct {
	awscdk.Stack
	ApiEndpoint           awscdk.CfnOutput
	LambdaArn            awscdk.CfnOutput
	LogGroups            awscdk.CfnOutput
	ApiKeyOutput         awscdk.CfnOutput
	CrossRegionTopicArn  awscdk.CfnOutput
	VpcId                awscdk.CfnOutput
}

func NewTapStack(scope constructs.Construct, id string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}

	stack := awscdk.NewStack(scope, &id, &sprops)

	// Environment suffix for consistent naming
	envSuffix := fmt.Sprintf("-%s-%s", props.Environment, props.Region)

	// Global tags
	awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String(props.Environment), nil)
	awscdk.Tags_Of(stack).Add(jsii.String("Region"), jsii.String(props.Region), nil)
	awscdk.Tags_Of(stack).Add(jsii.String("Project"), jsii.String("TAP"), nil)

	// Create security construct (VPC, Security Groups, IAM roles)
	securityConstruct := constructs.NewSecurityConstruct(stack, jsii.String("SecurityConstruct"), &constructs.SecurityConstructProps{
		Environment: props.Environment,
		Region:      props.Region,
	})

	// Create storage construct (DLQ, SNS for cross-region)
	storageConstruct := constructs.NewStorageConstruct(stack, jsii.String("StorageConstruct"), &constructs.StorageConstructProps{
		Environment: props.Environment,
		Region:      props.Region,
	})

	// Create compute construct with enhanced features
	computeConstruct := constructs.NewComputeConstruct(stack, jsii.String("ComputeConstruct"), &constructs.ComputeConstructProps{
		Environment:     props.Environment,
		Region:          props.Region,
		Vpc:             securityConstruct.Vpc(),
		SecurityGroup:   securityConstruct.LambdaSecurityGroup(),
		ExecutionRole:   securityConstruct.LambdaExecutionRole(),
		DeadLetterQueue: storageConstruct.DeadLetterQueue(),
		CrossRegionTopic: storageConstruct.CrossRegionTopic(),
	})

	// Create API Gateway with enhanced security
	apiUsagePlan := awsapigateway.NewUsagePlan(stack, jsii.String("ApiUsagePlan"), &awsapigateway.UsagePlanProps{
		Name:        jsii.String(fmt.Sprintf("tap-usage-plan%s", envSuffix)),
		Description: jsii.String("Usage plan for TAP API"),
		Throttle: &awsapigateway.ThrottleSettings{
			RateLimit:  jsii.Number(1000),
			BurstLimit: jsii.Number(2000),
		},
		Quota: &awsapigateway.QuotaSettings{
			Limit:  jsii.Number(10000),
			Period: awsapigateway.Period_DAY,
		},
	})

	apiKey := awsapigateway.NewApiKey(stack, jsii.String("ApiKey"), &awsapigateway.ApiKeyProps{
		ApiKeyName:  jsii.String(fmt.Sprintf("tap-api-key%s", envSuffix)),
		Description: jsii.String("API Key for TAP services"),
	})

	api := awsapigateway.NewRestApi(stack, jsii.String("TapApi"), &awsapigateway.RestApiProps{
		RestApiName: jsii.String(fmt.Sprintf("tap-api%s", envSuffix)),
		Description: jsii.String("TAP API Gateway with enhanced security"),
		DefaultCorsPreflightOptions: &awsapigateway.CorsOptions{
			AllowOrigins: &[]*string{jsii.String("*")},
			AllowMethods: &[]*string{jsii.String("GET"), jsii.String("POST"), jsii.String("OPTIONS")},
			AllowHeaders: &[]*string{jsii.String("Content-Type"), jsii.String("X-Amz-Date"), jsii.String("Authorization"), jsii.String("X-Api-Key")},
		},
		CloudWatchRole: jsii.Bool(true),
		DeployOptions: &awsapigateway.StageOptions{
			StageName:           jsii.String("prod"),
			TracingEnabled:      jsii.Bool(true),
			DataTraceEnabled:    jsii.Bool(true),
			LoggingLevel:        awsapigateway.MethodLoggingLevel_INFO,
			MetricsEnabled:      jsii.Bool(true),
			ThrottlingRateLimit: jsii.Number(1000),
			ThrottlingBurstLimit: jsii.Number(2000),
		},
		Policy: awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
			Statements: &[]awsiam.PolicyStatement{
				awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
					Effect: awsiam.Effect_ALLOW,
					Principals: &[]awsiam.IPrincipal{
						awsiam.NewAnyPrincipal(),
					},
					Actions: &[]*string{jsii.String("execute-api:Invoke")},
					Resources: &[]*string{jsii.String("*")},
					Conditions: &map[string]interface{}{
						"IpAddress": map[string]interface{}{
							"aws:SourceIp": []string{"0.0.0.0/0"}, // Configure as needed
						},
					},
				}),
			},
		}),
	})

	// API Gateway Lambda integration with enhanced error handling
	lambdaIntegration := awsapigateway.NewLambdaIntegration(computeConstruct.LambdaFunction(), &awsapigateway.LambdaIntegrationOptions{
		Proxy:                jsii.Bool(true),
		AllowTestInvoke:      jsii.Bool(false),
		IntegrationResponses: &[]*awsapigateway.IntegrationResponse{
			{
				StatusCode: jsii.String("200"),
				ResponseParameters: &map[string]*string{
					"method.response.header.Access-Control-Allow-Origin": jsii.String("'*'"),
				},
			},
			{
				StatusCode:       jsii.String("500"),
				SelectionPattern: jsii.String(".*Error.*"),
				ResponseParameters: &map[string]*string{
					"method.response.header.Access-Control-Allow-Origin": jsii.String("'*'"),
				},
			},
		},
	})

	// Add API resources with method-level configuration
	healthResource := api.Root().AddResource(jsii.String("health"), nil)
	healthResource.AddMethod(jsii.String("GET"), lambdaIntegration, &awsapigateway.MethodOptions{
		ApiKeyRequired: jsii.Bool(false),
		MethodResponses: &[]*awsapigateway.MethodResponse{
			{
				StatusCode: jsii.String("200"),
				ResponseParameters: &map[string]*bool{
					"method.response.header.Access-Control-Allow-Origin": jsii.Bool(true),
				},
			},
		},
	})

	apiResource := api.Root().AddResource(jsii.String("api"), nil)
	dataResource := apiResource.AddResource(jsii.String("data"), nil)
	dataResource.AddMethod(jsii.String("GET"), lambdaIntegration, &awsapigateway.MethodOptions{
		ApiKeyRequired: jsii.Bool(true),
		MethodResponses: &[]*awsapigateway.MethodResponse{
			{
				StatusCode: jsii.String("200"),
				ResponseParameters: &map[string]*bool{
					"method.response.header.Access-Control-Allow-Origin": jsii.Bool(true),
				},
			},
		},
	})
	dataResource.AddMethod(jsii.String("POST"), lambdaIntegration, &awsapigateway.MethodOptions{
		ApiKeyRequired: jsii.Bool(true),
		MethodResponses: &[]*awsapigateway.MethodResponse{
			{
				StatusCode: jsii.String("201"),
				ResponseParameters: &map[string]*bool{
					"method.response.header.Access-Control-Allow-Origin": jsii.Bool(true),
				},
			},
		},
	})

	// Associate API key with usage plan
	apiUsagePlan.AddApiKey(apiKey, nil)
	apiUsagePlan.AddApiStage(&awsapigateway.UsagePlanPerApiStage{
		Api:   api,
		Stage: api.DeploymentStage(),
	})

	// WAF Web ACL for API Gateway
	webAcl := awswafv2.NewCfnWebACL(stack, jsii.String("ApiWebAcl"), &awswafv2.CfnWebACLProps{
		Name:        jsii.String(fmt.Sprintf("tap-api-waf%s", envSuffix)),
		Description: jsii.String("WAF for TAP API Gateway"),
		Scope:       jsii.String("REGIONAL"),
		DefaultAction: &awswafv2.CfnWebACL_DefaultActionProperty{
			Allow: &awswafv2.CfnWebACL_AllowActionProperty{},
		},
		Rules: &[]interface{}{
			&awswafv2.CfnWebACL_RuleProperty{
				Name:     jsii.String("RateLimitRule"),
				Priority: jsii.Number(1),
				Statement: &awswafv2.CfnWebACL_StatementProperty{
					RateBasedStatement: &awswafv2.CfnWebACL_RateBasedStatementProperty{
						Limit:              jsii.Number(2000),
						AggregateKeyType:   jsii.String("IP"),
					},
				},
				Action: &awswafv2.CfnWebACL_RuleActionProperty{
					Block: &awswafv2.CfnWebACL_BlockActionProperty{},
				},
				VisibilityConfig: &awswafv2.CfnWebACL_VisibilityConfigProperty{
					SampledRequestsEnabled:   jsii.Bool(true),
					CloudWatchMetricsEnabled: jsii.Bool(true),
					MetricName:              jsii.String(fmt.Sprintf("TapApiRateLimit%s", envSuffix)),
				},
			},
		},
		VisibilityConfig: &awswafv2.CfnWebACL_VisibilityConfigProperty{
			SampledRequestsEnabled:   jsii.Bool(true),
			CloudWatchMetricsEnabled: jsii.Bool(true),
			MetricName:              jsii.String(fmt.Sprintf("TapApiWaf%s", envSuffix)),
		},
	})

	// Associate WAF with API Gateway
	awswafv2.NewCfnWebACLAssociation(stack, jsii.String("WebAclAssociation"), &awswafv2.CfnWebACLAssociationProps{
		ResourceArn: api.ArnForExecuteApi(jsii.String("*"), jsii.String("*"), jsii.String("*")),
		WebAclArn:   webAcl.AttrArn(),
	})

	// Create outputs with environment suffix
	apiEndpoint := awscdk.NewCfnOutput(stack, jsii.String("ApiEndpoint"), &awscdk.CfnOutputProps{
		Value:       api.Url(),
		Description: jsii.String(fmt.Sprintf("API Gateway endpoint URL for %s in %s", props.Environment, props.Region)),
		ExportName:  jsii.String(fmt.Sprintf("TapApiEndpoint%s", envSuffix)),
	})

	lambdaArn := awscdk.NewCfnOutput(stack, jsii.String("LambdaArn"), &awscdk.CfnOutputProps{
		Value:       computeConstruct.LambdaFunction().FunctionArn(),
		Description: jsii.String(fmt.Sprintf("Lambda function ARN for %s in %s", props.Environment, props.Region)),
		ExportName:  jsii.String(fmt.Sprintf("TapLambdaArn%s", envSuffix)),
	})

	logGroups := awscdk.NewCfnOutput(stack, jsii.String("LogGroups"), &awscdk.CfnOutputProps{
		Value:       computeConstruct.LogGroup().LogGroupName(),
		Description: jsii.String(fmt.Sprintf("CloudWatch Log Group name for %s in %s", props.Environment, props.Region)),
		ExportName:  jsii.String(fmt.Sprintf("TapLogGroups%s", envSuffix)),
	})

	apiKeyOutput := awscdk.NewCfnOutput(stack, jsii.String("ApiKeyId"), &awscdk.CfnOutputProps{
		Value:       apiKey.KeyId(),
		Description: jsii.String(fmt.Sprintf("API Key ID for %s in %s", props.Environment, props.Region)),
		ExportName:  jsii.String(fmt.Sprintf("TapApiKeyId%s", envSuffix)),
	})

	crossRegionTopicArn := awscdk.NewCfnOutput(stack, jsii.String("CrossRegionTopicArn"), &awscdk.CfnOutputProps{
		Value:       storageConstruct.CrossRegionTopic().TopicArn(),
		Description: jsii.String(fmt.Sprintf("Cross-region SNS topic ARN for %s in %s", props.Environment, props.Region)),
		ExportName:  jsii.String(fmt.Sprintf("TapCrossRegionTopicArn%s", envSuffix)),
	})

	vpcId := awscdk.NewCfnOutput(stack, jsii.String("VpcId"), &awscdk.CfnOutputProps{
		Value:       securityConstruct.Vpc().VpcId(),
		Description: jsii.String(fmt.Sprintf("VPC ID for %s in %s", props.Environment, props.Region)),
		ExportName:  jsii.String(fmt.Sprintf("TapVpcId%s", envSuffix)),
	})

	return &TapStack{
		Stack:               stack,
		ApiEndpoint:         apiEndpoint,
		LambdaArn:          lambdaArn,
		LogGroups:          logGroups,
		ApiKeyOutput:       apiKeyOutput,
		CrossRegionTopicArn: crossRegionTopicArn,
		VpcId:              vpcId,
	}
}
```

## 2. Enhanced Security Construct (`lib/constructs/security_construct.go`)

```go
package constructs

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type SecurityConstructProps struct {
	Environment string
	Region      string
}

type SecurityConstruct struct {
	constructs.Construct
	vpc                   awsec2.Vpc
	lambdaSecurityGroup   awsec2.SecurityGroup
	lambdaExecutionRole   awsiam.Role
}

func NewSecurityConstruct(scope constructs.Construct, id *string, props *SecurityConstructProps) *SecurityConstruct {
	construct := constructs.NewConstruct(scope, id)

	envSuffix := fmt.Sprintf("-%s-%s", props.Environment, props.Region)

	// Create VPC with isolated subnets for Lambda
	vpc := awsec2.NewVpc(construct, jsii.String("TapVpc"), &awsec2.VpcProps{
		VpcName:           jsii.String(fmt.Sprintf("tap-vpc%s", envSuffix)),
		MaxAzs:            jsii.Number(2),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:       jsii.String("private-subnet"),
				SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("public-subnet"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
		},
	})

	// VPC Endpoints for AWS services
	vpc.AddGatewayEndpoint(jsii.String("S3Endpoint"), &awsec2.GatewayVpcEndpointOptions{
		Service: awsec2.GatewayVpcEndpointAwsService_S3(),
	})

	vpc.AddInterfaceEndpoint(jsii.String("SNSEndpoint"), &awsec2.InterfaceVpcEndpointOptions{
		Service: awsec2.InterfaceVpcEndpointAwsService_SNS(),
		Subnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
		},
	})

	vpc.AddInterfaceEndpoint(jsii.String("SQSEndpoint"), &awsec2.InterfaceVpcEndpointOptions{
		Service: awsec2.InterfaceVpcEndpointAwsService_SQS(),
		Subnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
		},
	})

	// Security Group for Lambda
	lambdaSecurityGroup := awsec2.NewSecurityGroup(construct, jsii.String("LambdaSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		SecurityGroupName: jsii.String(fmt.Sprintf("tap-lambda-sg%s", envSuffix)),
		Description:       jsii.String("Security group for TAP Lambda functions"),
		AllowAllOutbound:  jsii.Bool(false),
	})

	// Allow HTTPS outbound for AWS API calls
	lambdaSecurityGroup.AddEgressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("HTTPS outbound for AWS APIs"),
		jsii.Bool(false),
	)

	// Lambda execution role with least privilege
	lambdaExecutionRole := awsiam.NewRole(construct, jsii.String("LambdaExecutionRole"), &awsiam.RoleProps{
		RoleName:  jsii.String(fmt.Sprintf("tap-lambda-execution-role%s", envSuffix)),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("lambda.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AWSLambdaVPCAccessExecutionRole")),
		},
		InlinePolicies: &map[string]awsiam.PolicyDocument{
			"TapLambdaPolicy": awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
				Statements: &[]awsiam.PolicyStatement{
					awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
						Effect: awsiam.Effect_ALLOW,
						Actions: &[]*string{
							jsii.String("logs:CreateLogGroup"),
							jsii.String("logs:CreateLogStream"),
							jsii.String("logs:PutLogEvents"),
						},
						Resources: &[]*string{
							jsii.String(fmt.Sprintf("arn:aws:logs:%s:*:log-group:/aws/lambda/tap-handler%s:*", props.Region, envSuffix)),
						},
					}),
					awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
						Effect: awsiam.Effect_ALLOW,
						Actions: &[]*string{
							jsii.String("xray:PutTraceSegments"),
							jsii.String("xray:PutTelemetryRecords"),
						},
						Resources: &[]*string{jsii.String("*")},
					}),
					awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
						Effect: awsiam.Effect_ALLOW,
						Actions: &[]*string{
							jsii.String("sqs:SendMessage"),
							jsii.String("sqs:GetQueueAttributes"),
						},
						Resources: &[]*string{
							jsii.String(fmt.Sprintf("arn:aws:sqs:%s:*:tap-dlq%s", props.Region, envSuffix)),
						},
					}),
					awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
						Effect: awsiam.Effect_ALLOW,
						Actions: &[]*string{
							jsii.String("sns:Publish"),
						},
						Resources: &[]*string{
							jsii.String(fmt.Sprintf("arn:aws:sns:%s:*:tap-cross-region%s", props.Region, envSuffix)),
						},
					}),
				},
			}),
		},
	})

	return &SecurityConstruct{
		Construct:           construct,
		vpc:                 vpc,
		lambdaSecurityGroup: lambdaSecurityGroup,
		lambdaExecutionRole: lambdaExecutionRole,
	}
}

func (s *SecurityConstruct) Vpc() awsec2.Vpc {
	return s.vpc
}

func (s *SecurityConstruct) LambdaSecurityGroup() awsec2.SecurityGroup {
	return s.lambdaSecurityGroup
}

func (s *SecurityConstruct) LambdaExecutionRole() awsiam.Role {
	return s.lambdaExecutionRole
}
```

## 3. Storage Construct (`lib/constructs/storage_construct.go`)

```go
package constructs

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssqs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type StorageConstructProps struct {
	Environment string
	Region      string
}

type StorageConstruct struct {
	constructs.Construct
	deadLetterQueue   awssqs.Queue
	crossRegionTopic  awssns.Topic
}

func NewStorageConstruct(scope constructs.Construct, id *string, props *StorageConstructProps) *StorageConstruct {
	construct := constructs.NewConstruct(scope, id)

	envSuffix := fmt.Sprintf("-%s-%s", props.Environment, props.Region)

	// Dead Letter Queue for failed Lambda invocations
	deadLetterQueue := awssqs.NewQueue(construct, jsii.String("DeadLetterQueue"), &awssqs.QueueProps{
		QueueName:         jsii.String(fmt.Sprintf("tap-dlq%s", envSuffix)),
		RetentionPeriod:   awscdk.Duration_Days(jsii.Number(14)),
		VisibilityTimeout: awscdk.Duration_Seconds(jsii.Number(300)),
		Encryption:        awssqs.QueueEncryption_KMS_MANAGED,
	})

	// SNS Topic for cross-region communication
	crossRegionTopic := awssns.NewTopic(construct, jsii.String("CrossRegionTopic"), &awssns.TopicProps{
		TopicName:   jsii.String(fmt.Sprintf("tap-cross-region%s", envSuffix)),
		DisplayName: jsii.String(fmt.Sprintf("TAP Cross-Region Communication %s", envSuffix)),
	})

	return &StorageConstruct{
		Construct:        construct,
		deadLetterQueue:  deadLetterQueue,
		crossRegionTopic: crossRegionTopic,
	}
}

func (s *StorageConstruct) DeadLetterQueue() awssqs.Queue {
	return s.deadLetterQueue
}

func (s *StorageConstruct) CrossRegionTopic() awssns.Topic {
	return s.crossRegionTopic
}
```

## 4. Enhanced Compute Construct (`lib/constructs/compute_construct.go`)

```go
package constructs

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssqs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type ComputeConstructProps struct {
	Environment      string
	Region           string
	Vpc              awsec2.Vpc
	SecurityGroup    awsec2.SecurityGroup
	ExecutionRole    awsiam.Role
	DeadLetterQueue  awssqs.Queue
	CrossRegionTopic awssns.Topic
}

type ComputeConstruct struct {
	constructs.Construct
	lambdaFunction awslambda.Function
	logGroup       awslogs.LogGroup
	errorAlarm     awscloudwatch.Alarm
	durationAlarm  awscloudwatch.Alarm
	throttleAlarm  awscloudwatch.Alarm
	dlqAlarm       awscloudwatch.Alarm
}

func NewComputeConstruct(scope constructs.Construct, id *string, props *ComputeConstructProps) *ComputeConstruct {
	construct := constructs.NewConstruct(scope, id)

	envSuffix := fmt.Sprintf("-%s-%s", props.Environment, props.Region)

	// Create CloudWatch Log Group
	logGroup := awslogs.NewLogGroup(construct, jsii.String("LambdaLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String(fmt.Sprintf("/aws/lambda/tap-handler%s", envSuffix)),
		RetentionDays: awslogs.RetentionDays_FOURTEEN,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Create Lambda function with enhanced configuration
	lambdaFunction := awslambda.NewFunction(construct, jsii.String("TapHandler"), &awslambda.FunctionProps{
		Runtime:      awslambda.Runtime_PYTHON_3_9(),
		Handler:      jsii.String("handler.lambda_handler"),
		Code:         awslambda.Code_FromAsset(jsii.String("lib/lambda"), nil),
		FunctionName: jsii.String(fmt.Sprintf("tap-handler%s", envSuffix)),
		MemorySize:   jsii.Number(256), // ≤256MB as required
		Timeout:      awscdk.Duration_Seconds(jsii.Number(30)),
		LogGroup:     logGroup,
		Role:         props.ExecutionRole,
		Vpc:          props.Vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
		},
		SecurityGroups: &[]awsec2.ISecurityGroup{props.SecurityGroup},
		Tracing:        awslambda.Tracing_ACTIVE, // X-Ray tracing
		RetryAttempts:  jsii.Number(2),
		DeadLetterQueue: props.DeadLetterQueue,
		Environment: &map[string]*string{
			"LOG_LEVEL":              jsii.String("INFO"),
			"ENVIRONMENT":            jsii.String(props.Environment),
			"REGION":                 jsii.String(props.Region),
			"CROSS_REGION_TOPIC_ARN": props.CrossRegionTopic.TopicArn(),
			"DLQ_URL":                props.DeadLetterQueue.QueueUrl(),
		},
		ReservedConcurrentExecutions: jsii.Number(100), // Prevent runaway costs
	})

	// Enhanced CloudWatch Alarms
	// Error alarm with composite metric
	errorAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaErrorAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String(fmt.Sprintf("tap-lambda-errors%s", envSuffix)),
		AlarmDescription: jsii.String("Lambda function error rate exceeds threshold"),
		Metric: awscloudwatch.NewMathExpression(&awscloudwatch.MathExpressionProps{
			Expression: jsii.String("(errors / invocations) * 100"),
			UsingMetrics: &map[string]awscloudwatch.IMetric{
				"errors": lambdaFunction.MetricErrors(&awscloudwatch.MetricOptions{
					Period: awscdk.Duration_Minutes(jsii.Number(5)),
				}),
				"invocations": lambdaFunction.MetricInvocations(&awscloudwatch.MetricOptions{
					Period: awscdk.Duration_Minutes(jsii.Number(5)),
				}),
			},
		}),
		Threshold:         jsii.Number(5), // 5% error rate
		EvaluationPeriods: jsii.Number(2),
		DatapointsToAlarm: jsii.
```
