package lib

import (
	"fmt"

	myConstructs "github.com/TuringGpt/iac-test-automations/lib/constructs"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awswafv2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type TapStackProps struct {
	awscdk.StackProps
	Environment string
	Region      string
}

type TapStack struct {
	awscdk.Stack
	ApiEndpoint         awscdk.CfnOutput
	LambdaArn           awscdk.CfnOutput
	LogGroups           awscdk.CfnOutput
	ApiKeyOutput        awscdk.CfnOutput
	CrossRegionTopicArn awscdk.CfnOutput
	VpcId               awscdk.CfnOutput
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
	securityConstruct := myConstructs.NewSecurityConstruct(stack, jsii.String("SecurityConstruct"), &myConstructs.SecurityConstructProps{
		Environment: props.Environment,
		Region:      props.Region,
	})

	// Create storage construct (DLQ, SNS for cross-region)
	storageConstruct := myConstructs.NewStorageConstruct(stack, jsii.String("StorageConstruct"), &myConstructs.StorageConstructProps{
		Environment: props.Environment,
		Region:      props.Region,
	})

	// Create compute construct with enhanced features
	computeConstruct := myConstructs.NewComputeConstruct(stack, jsii.String("ComputeConstruct"), &myConstructs.ComputeConstructProps{
		Environment:      props.Environment,
		Region:           props.Region,
		Vpc:              securityConstruct.Vpc(),
		SecurityGroup:    securityConstruct.LambdaSecurityGroup(),
		ExecutionRole:    securityConstruct.LambdaExecutionRole(),
		DeadLetterQueue:  storageConstruct.DeadLetterQueue(),
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
			StageName:            jsii.String("prod"),
			TracingEnabled:       jsii.Bool(true),
			DataTraceEnabled:     jsii.Bool(true),
			LoggingLevel:         awsapigateway.MethodLoggingLevel_INFO,
			MetricsEnabled:       jsii.Bool(true),
			ThrottlingRateLimit:  jsii.Number(1000),
			ThrottlingBurstLimit: jsii.Number(2000),
		},
		Policy: awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
			Statements: &[]awsiam.PolicyStatement{
				awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
					Effect: awsiam.Effect_ALLOW,
					Principals: &[]awsiam.IPrincipal{
						awsiam.NewAnyPrincipal(),
					},
					Actions:   &[]*string{jsii.String("execute-api:Invoke")},
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
		Proxy:           jsii.Bool(true),
		AllowTestInvoke: jsii.Bool(false),
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
						Limit:            jsii.Number(2000),
						AggregateKeyType: jsii.String("IP"),
					},
				},
				Action: &awswafv2.CfnWebACL_RuleActionProperty{
					Block: &awswafv2.CfnWebACL_BlockActionProperty{},
				},
				VisibilityConfig: &awswafv2.CfnWebACL_VisibilityConfigProperty{
					SampledRequestsEnabled:   jsii.Bool(true),
					CloudWatchMetricsEnabled: jsii.Bool(true),
					MetricName:               jsii.String(fmt.Sprintf("TapApiRateLimit%s", envSuffix)),
				},
			},
		},
		VisibilityConfig: &awswafv2.CfnWebACL_VisibilityConfigProperty{
			SampledRequestsEnabled:   jsii.Bool(true),
			CloudWatchMetricsEnabled: jsii.Bool(true),
			MetricName:               jsii.String(fmt.Sprintf("TapApiWaf%s", envSuffix)),
		},
	})

	// Associate WAF with API Gateway
	awswafv2.NewCfnWebACLAssociation(stack, jsii.String("WebAclAssociation"), &awswafv2.CfnWebACLAssociationProps{
		ResourceArn: api.DeploymentStage().StageArn(),
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
		LambdaArn:           lambdaArn,
		LogGroups:           logGroups,
		ApiKeyOutput:        apiKeyOutput,
		CrossRegionTopicArn: crossRegionTopicArn,
		VpcId:               vpcId,
	}
}
