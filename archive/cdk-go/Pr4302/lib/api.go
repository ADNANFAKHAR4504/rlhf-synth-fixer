package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsecs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awskinesis"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// ApiConstructProps defines properties for the API construct.
type ApiConstructProps struct {
	EnvironmentSuffix *string
	EcsCluster        awsecs.Cluster
	KinesisStream     awskinesis.Stream
}

// ApiConstruct represents the API Gateway infrastructure.
type ApiConstruct struct {
	constructs.Construct
	RestApi awsapigateway.RestApi
}

// NewApiConstruct creates API Gateway REST API for content delivery.
func NewApiConstruct(scope constructs.Construct, id *string, props *ApiConstructProps) *ApiConstruct {
	construct := constructs.NewConstruct(scope, id)

	environmentSuffix := *props.EnvironmentSuffix

	// Create CloudWatch log group for API Gateway
	logGroup := awslogs.NewLogGroup(construct, jsii.String("ApiLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String(fmt.Sprintf("/aws/apigateway/globalstream-%s", environmentSuffix)),
		Retention:     awslogs.RetentionDays_ONE_WEEK,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Create REST API
	api := awsapigateway.NewRestApi(construct, jsii.String("ContentDeliveryApi"), &awsapigateway.RestApiProps{
		RestApiName: jsii.String(fmt.Sprintf("globalstream-api-%s", environmentSuffix)),
		Description: jsii.String("API for content delivery and streaming services"),
		// Enable CloudWatch logging
		DeployOptions: &awsapigateway.StageOptions{
			StageName:            jsii.String("prod"),
			AccessLogDestination: awsapigateway.NewLogGroupLogDestination(logGroup),
			AccessLogFormat:      awsapigateway.AccessLogFormat_Clf(),
			DataTraceEnabled:     jsii.Bool(true),
			LoggingLevel:         awsapigateway.MethodLoggingLevel_INFO,
			MetricsEnabled:       jsii.Bool(true),
		},
		// Enable default CORS
		DefaultCorsPreflightOptions: &awsapigateway.CorsOptions{
			AllowOrigins: awsapigateway.Cors_ALL_ORIGINS(),
			AllowMethods: awsapigateway.Cors_ALL_METHODS(),
		},
		// Enable request validation
		CloudWatchRole: jsii.Bool(true),
	})

	// Create IAM role for Kinesis integration
	kinesisRole := awsiam.NewRole(construct, jsii.String("KinesisIntegrationRole"), &awsiam.RoleProps{
		RoleName:  jsii.String(fmt.Sprintf("globalstream-api-kinesis-%s", environmentSuffix)),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("apigateway.amazonaws.com"), nil),
	})

	// Grant permissions to put records to Kinesis
	props.KinesisStream.GrantWrite(kinesisRole)

	// Create /health endpoint for monitoring
	health := api.Root().AddResource(jsii.String("health"), nil)
	health.AddMethod(jsii.String("GET"), awsapigateway.NewMockIntegration(&awsapigateway.IntegrationOptions{
		IntegrationResponses: &[]*awsapigateway.IntegrationResponse{
			{
				StatusCode: jsii.String("200"),
				ResponseTemplates: &map[string]*string{
					"application/json": jsii.String(`{"status": "healthy", "timestamp": "$context.requestTime"}`),
				},
			},
		},
		RequestTemplates: &map[string]*string{
			"application/json": jsii.String(`{"statusCode": 200}`),
		},
	}), &awsapigateway.MethodOptions{
		MethodResponses: &[]*awsapigateway.MethodResponse{
			{
				StatusCode: jsii.String("200"),
			},
		},
	})

	// Create /analytics endpoint to send data to Kinesis
	analytics := api.Root().AddResource(jsii.String("analytics"), nil)

	// Create request validator
	requestValidator := awsapigateway.NewRequestValidator(construct, jsii.String("RequestValidator"), &awsapigateway.RequestValidatorProps{
		RestApi:                   api,
		ValidateRequestBody:       jsii.Bool(true),
		ValidateRequestParameters: jsii.Bool(true),
	})

	// Add POST method with Kinesis integration
	analytics.AddMethod(jsii.String("POST"), awsapigateway.NewAwsIntegration(&awsapigateway.AwsIntegrationProps{
		Service: jsii.String("kinesis"),
		Action:  jsii.String("PutRecord"),
		Options: &awsapigateway.IntegrationOptions{
			CredentialsRole: kinesisRole,
			RequestParameters: &map[string]*string{
				"integration.request.header.Content-Type": jsii.String("'application/x-amz-json-1.1'"),
			},
			RequestTemplates: &map[string]*string{
				"application/json": jsii.String(fmt.Sprintf(`{
					"StreamName": "%s",
					"Data": "$util.base64Encode($input.json('$.data'))",
					"PartitionKey": "$input.path('$.partitionKey')"
				}`, *props.KinesisStream.StreamName())),
			},
			IntegrationResponses: &[]*awsapigateway.IntegrationResponse{
				{
					StatusCode: jsii.String("200"),
					ResponseTemplates: &map[string]*string{
						"application/json": jsii.String(`{"status": "success"}`),
					},
				},
				{
					StatusCode:       jsii.String("400"),
					SelectionPattern: jsii.String("4\\d{2}"),
					ResponseTemplates: &map[string]*string{
						"application/json": jsii.String(`{"status": "error", "message": "Bad Request"}`),
					},
				},
			},
		},
	}), &awsapigateway.MethodOptions{
		RequestValidator: requestValidator,
		MethodResponses: &[]*awsapigateway.MethodResponse{
			{
				StatusCode: jsii.String("200"),
			},
			{
				StatusCode: jsii.String("400"),
			},
		},
	})

	// Create /content endpoint placeholder
	content := api.Root().AddResource(jsii.String("content"), nil)
	content.AddMethod(jsii.String("GET"), awsapigateway.NewMockIntegration(&awsapigateway.IntegrationOptions{
		IntegrationResponses: &[]*awsapigateway.IntegrationResponse{
			{
				StatusCode: jsii.String("200"),
				ResponseTemplates: &map[string]*string{
					"application/json": jsii.String(`{"message": "Content delivery endpoint", "cluster": "` + *props.EcsCluster.ClusterName() + `"}`),
				},
			},
		},
		RequestTemplates: &map[string]*string{
			"application/json": jsii.String(`{"statusCode": 200}`),
		},
	}), &awsapigateway.MethodOptions{
		MethodResponses: &[]*awsapigateway.MethodResponse{
			{
				StatusCode: jsii.String("200"),
			},
		},
	})

	// Tag API for identification
	awscdk.Tags_Of(api).Add(jsii.String("Purpose"), jsii.String("Content Delivery API"), nil)

	return &ApiConstruct{
		Construct: construct,
		RestApi:   api,
	}
}
