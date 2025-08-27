package lib

import (
	"strings"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
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

// TapStack represents the main CDK stack for the Tap project.
//
// This stack is responsible for orchestrating the instantiation of serverless resources.
// It determines the environment suffix from the provided properties,
// CDK context, or defaults to 'dev'.
type TapStack struct {
	// EnvironmentSuffix stores the environment suffix used for resource naming and configuration.
	EnvironmentSuffix *string
	// Lambda functions
	HelloLambda *awslambda.Function
	UsersLambda *awslambda.Function
	// API Gateway
	RestApi awsapigateway.RestApi
}

// LambdaFunction holds Lambda function and its log group
type LambdaFunction struct {
	Function awslambda.Function
	LogGroup awslogs.LogGroup
}

// LambdaConfig holds configuration for creating Lambda functions
type LambdaConfig struct {
	Name              string
	FunctionName      string
	Code              string
	Handler           string
	Runtime           awslambda.Runtime
	Description       string
	EnvironmentSuffix string
	Environment       map[string]*string
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
		environmentSuffix = *suffix.(*string)
	} else {
		environmentSuffix = "dev"
	}

	// Add stack-level tags
	awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
	awscdk.Tags_Of(stack).Add(jsii.String("Project"), jsii.String("TapStack"), nil)
	awscdk.Tags_Of(stack).Add(jsii.String("ManagedBy"), jsii.String("CDK"), nil)

	// Create the TapStack instance
	tapStack := &TapStack{
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}

	// Create Lambda functions
	lambdaFunctions := createLambdaFunctions(stack, environmentSuffix)

	// Create API Gateway
	tapStack.RestApi = createApiGateway(stack, environmentSuffix, lambdaFunctions)

	// Store Lambda functions
	if helloFunc, exists := lambdaFunctions["hello"]; exists {
		tapStack.HelloLambda = &helloFunc.Function
	}
	if usersFunc, exists := lambdaFunctions["users"]; exists {
		tapStack.UsersLambda = &usersFunc.Function
	}

	// Create outputs
	createOutputs(stack, tapStack.RestApi, lambdaFunctions)

	return tapStack
}

func createLambdaFunctions(stack awscdk.Stack, environmentSuffix string) map[string]*LambdaFunction {
	functions := make(map[string]*LambdaFunction)

	// Hello Lambda function with inline Python code
	helloCode := `
import json
import os
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Simple Hello World Lambda function
    """
    try:
        # Log the incoming event
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Get environment variables
        environment = os.environ.get('ENVIRONMENT', 'unknown')
        service = os.environ.get('SERVICE', 'hello-service')
        
        # Create response
        response_body = {
            'message': 'Hello from AWS Lambda!',
            'environment': environment,
            'service': service,
            'timestamp': context.aws_request_id,
            'function_name': context.function_name,
            'memory_limit': context.memory_limit_in_mb
        }
        
        # Add path parameters if they exist
        if 'pathParameters' in event and event['pathParameters']:
            response_body['path_parameters'] = event['pathParameters']
        
        # Add query parameters if they exist
        if 'queryStringParameters' in event and event['queryStringParameters']:
            response_body['query_parameters'] = event['queryStringParameters']
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
`

	functions["hello"] = createLambdaFunction(stack, &LambdaConfig{
		Name:              "hello",
		FunctionName:      "hello-handler",
		Code:              helloCode,
		Handler:           "index.lambda_handler",
		Runtime:           awslambda.Runtime_PYTHON_3_9(),
		Description:       "Hello world Lambda function",
		EnvironmentSuffix: environmentSuffix,
		Environment: map[string]*string{
			"ENVIRONMENT": jsii.String(environmentSuffix),
			"LOG_LEVEL":   jsii.String("INFO"),
			"SERVICE":     jsii.String("hello-service"),
		},
	})

	// Users Lambda function with inline Python code
	usersCode := `
import json
import os
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Mock users data
USERS_DATA = [
    {
        'id': '1',
        'name': 'John Doe',
        'email': 'john.doe@example.com',
        'created_at': '2023-01-01T00:00:00Z'
    },
    {
        'id': '2',
        'name': 'Jane Smith',
        'email': 'jane.smith@example.com',
        'created_at': '2023-01-02T00:00:00Z'
    },
    {
        'id': '3',
        'name': 'Bob Johnson',
        'email': 'bob.johnson@example.com',
        'created_at': '2023-01-03T00:00:00Z'
    }
]

def lambda_handler(event, context):
    """
    Users management Lambda function
    Handles GET /users and GET /users/{id}
    """
    try:
        # Log the incoming event
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Get HTTP method and path
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '')
        path_parameters = event.get('pathParameters') or {}
        
        # Get environment variables
        environment = os.environ.get('ENVIRONMENT', 'unknown')
        service = os.environ.get('SERVICE', 'users-service')
        
        # Handle different endpoints
        if http_method == 'GET':
            if 'id' in path_parameters and path_parameters['id']:
                # GET /users/{id}
                user_id = path_parameters['id']
                user = next((u for u in USERS_DATA if u['id'] == user_id), None)
                
                if user:
                    response_body = {
                        'user': user,
                        'environment': environment,
                        'service': service,
                        'timestamp': datetime.utcnow().isoformat() + 'Z',
                        'request_id': context.aws_request_id
                    }
                    status_code = 200
                else:
                    response_body = {
                        'error': 'User not found',
                        'user_id': user_id,
                        'timestamp': datetime.utcnow().isoformat() + 'Z',
                        'request_id': context.aws_request_id
                    }
                    status_code = 404
            else:
                # GET /users
                response_body = {
                    'users': USERS_DATA,
                    'count': len(USERS_DATA),
                    'environment': environment,
                    'service': service,
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'request_id': context.aws_request_id
                }
                status_code = 200
        else:
            response_body = {
                'error': 'Method not allowed',
                'method': http_method,
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }
            status_code = 405
        
        return {
            'statusCode': status_code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            })
        }
`

	functions["users"] = createLambdaFunction(stack, &LambdaConfig{
		Name:              "users",
		FunctionName:      "users-handler",
		Code:              usersCode,
		Handler:           "index.lambda_handler",
		Runtime:           awslambda.Runtime_PYTHON_3_9(),
		Description:       "Users management Lambda function",
		EnvironmentSuffix: environmentSuffix,
		Environment: map[string]*string{
			"ENVIRONMENT": jsii.String(environmentSuffix),
			"LOG_LEVEL":   jsii.String("INFO"),
			"SERVICE":     jsii.String("users-service"),
		},
	})

	return functions
}

func createLambdaFunction(stack awscdk.Stack, config *LambdaConfig) *LambdaFunction {
	// Create IAM role for Lambda
	role := awsiam.NewRole(stack, jsii.String(config.Name+"LambdaRole"), &awsiam.RoleProps{
		RoleName:  jsii.String(config.FunctionName + "-role-" + config.EnvironmentSuffix),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("lambda.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AWSLambdaBasicExecutionRole")),
		},
		InlinePolicies: &map[string]awsiam.PolicyDocument{
			"CloudWatchLogs": awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
				Statements: &[]awsiam.PolicyStatement{
					awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
						Effect: awsiam.Effect_ALLOW,
						Actions: &[]*string{
							jsii.String("logs:CreateLogGroup"),
							jsii.String("logs:CreateLogStream"),
							jsii.String("logs:PutLogEvents"),
							jsii.String("logs:DescribeLogStreams"),
						},
						Resources: &[]*string{
							jsii.String("arn:aws:logs:*:*:*"),
						},
					}),
					awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
						Effect: awsiam.Effect_ALLOW,
						Actions: &[]*string{
							jsii.String("xray:PutTraceSegments"),
							jsii.String("xray:PutTelemetryRecords"),
						},
						Resources: &[]*string{
							jsii.String("*"),
						},
					}),
				},
			}),
		},
	})

	// Create CloudWatch Log Group
	logGroupName := jsii.String("/aws/lambda/" + config.FunctionName + "-" + config.EnvironmentSuffix)
	logGroup := awslogs.NewLogGroup(stack, jsii.String(config.Name+"LogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  logGroupName,
		Retention:     awslogs.RetentionDays_ONE_MONTH,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Add environment variables with defaults
	environment := make(map[string]*string)
	for k, v := range config.Environment {
		environment[k] = v
	}
	environment["AWS_LAMBDA_LOG_LEVEL"] = jsii.String("INFO")
	environment["POWERTOOLS_SERVICE_NAME"] = jsii.String(config.FunctionName)

	// Create Lambda function with inline code
	function := awslambda.NewFunction(stack, jsii.String(config.Name+"Lambda"), &awslambda.FunctionProps{
		FunctionName: jsii.String(config.FunctionName + "-" + config.EnvironmentSuffix),
		Runtime:      config.Runtime,
		Code:         awslambda.Code_FromInline(jsii.String(config.Code)),
		Handler:      jsii.String(config.Handler),
		MemorySize:   jsii.Number(256), // Exactly 256MB as requested
		Timeout:      awscdk.Duration_Seconds(jsii.Number(30)),
		Environment:  &environment,
		LogGroup:     logGroup,
		Role:         role,
		Architecture: awslambda.Architecture_X86_64(),
		Description:  jsii.String(config.Description + " (" + config.EnvironmentSuffix + ")"),

		// Production optimizations
		DeadLetterQueueEnabled: jsii.Bool(true),
		RetryAttempts:          jsii.Number(2),

		// Enable X-Ray tracing for better observability
		Tracing: awslambda.Tracing_ACTIVE,
	})

	// Add comprehensive tags
	awscdk.Tags_Of(function).Add(jsii.String("Environment"), jsii.String(config.EnvironmentSuffix), nil)
	awscdk.Tags_Of(function).Add(jsii.String("Service"), jsii.String("TapStack"), nil)
	awscdk.Tags_Of(function).Add(jsii.String("Component"), jsii.String("Lambda"), nil)
	awscdk.Tags_Of(function).Add(jsii.String("FunctionType"), jsii.String(config.Name), nil)

	awscdk.Tags_Of(logGroup).Add(jsii.String("Environment"), jsii.String(config.EnvironmentSuffix), nil)
	awscdk.Tags_Of(logGroup).Add(jsii.String("Service"), jsii.String("TapStack"), nil)
	awscdk.Tags_Of(logGroup).Add(jsii.String("Component"), jsii.String("Logging"), nil)

	awscdk.Tags_Of(role).Add(jsii.String("Environment"), jsii.String(config.EnvironmentSuffix), nil)
	awscdk.Tags_Of(role).Add(jsii.String("Service"), jsii.String("TapStack"), nil)
	awscdk.Tags_Of(role).Add(jsii.String("Component"), jsii.String("IAM"), nil)

	return &LambdaFunction{
		Function: function,
		LogGroup: logGroup,
	}
}

func createApiGateway(stack awscdk.Stack, environmentSuffix string, lambdaFunctions map[string]*LambdaFunction) awsapigateway.RestApi {
	// Create CloudWatch Log Group for API Gateway
	logGroupName := jsii.String("/aws/apigateway/tap-api-" + environmentSuffix)
	apiLogGroup := awslogs.NewLogGroup(stack, jsii.String("ApiLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  logGroupName,
		Retention:     awslogs.RetentionDays_ONE_MONTH,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Create REST API
	api := awsapigateway.NewRestApi(stack, jsii.String("TapApi"), &awsapigateway.RestApiProps{
		RestApiName: jsii.String("tap-api-" + environmentSuffix),
		Description: jsii.String("Serverless API Gateway for " + environmentSuffix + " environment"),

		// CORS configuration
		DefaultCorsPreflightOptions: &awsapigateway.CorsOptions{
			AllowOrigins: awsapigateway.Cors_ALL_ORIGINS(),
			AllowMethods: &[]*string{
				jsii.String("GET"),
				jsii.String("POST"),
				jsii.String("PUT"),
				jsii.String("DELETE"),
				jsii.String("OPTIONS"),
			},
			AllowHeaders: &[]*string{
				jsii.String("Content-Type"),
				jsii.String("X-Amz-Date"),
				jsii.String("Authorization"),
				jsii.String("X-Api-Key"),
				jsii.String("X-Amz-Security-Token"),
				jsii.String("X-Requested-With"),
			},
			MaxAge: awscdk.Duration_Hours(jsii.Number(1)),
		},

		// Enable CloudWatch role for logging
		CloudWatchRole: jsii.Bool(true),

		// Endpoint configuration for regional deployment
		EndpointConfiguration: &awsapigateway.EndpointConfiguration{
			Types: &[]awsapigateway.EndpointType{awsapigateway.EndpointType_REGIONAL},
		},

		// Deploy options with comprehensive logging
		DeployOptions: &awsapigateway.StageOptions{
			StageName:        jsii.String(environmentSuffix),
			LoggingLevel:     awsapigateway.MethodLoggingLevel_INFO,
			DataTraceEnabled: jsii.Bool(true),
			MetricsEnabled:   jsii.Bool(true),

			// Access logging
			AccessLogDestination: awsapigateway.NewLogGroupLogDestination(apiLogGroup),
			AccessLogFormat: awsapigateway.AccessLogFormat_JsonWithStandardFields(&awsapigateway.JsonWithStandardFieldProps{
				Caller:         jsii.Bool(true),
				HttpMethod:     jsii.Bool(true),
				Ip:             jsii.Bool(true),
				Protocol:       jsii.Bool(true),
				RequestTime:    jsii.Bool(true),
				ResourcePath:   jsii.Bool(true),
				ResponseLength: jsii.Bool(true),
				Status:         jsii.Bool(true),
				User:           jsii.Bool(true),
			}),

			// Stage variables
			Variables: &map[string]*string{
				"environment": jsii.String(environmentSuffix),
				"version":     jsii.String("v1"),
			},
		},
	})

	// Create API routes
	createApiRoutes(api, lambdaFunctions)

	// Add comprehensive tags
	awscdk.Tags_Of(api).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
	awscdk.Tags_Of(api).Add(jsii.String("Service"), jsii.String("TapStack"), nil)
	awscdk.Tags_Of(api).Add(jsii.String("Component"), jsii.String("ApiGateway"), nil)

	awscdk.Tags_Of(apiLogGroup).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
	awscdk.Tags_Of(apiLogGroup).Add(jsii.String("Service"), jsii.String("TapStack"), nil)
	awscdk.Tags_Of(apiLogGroup).Add(jsii.String("Component"), jsii.String("Logging"), nil)

	return api
}

func createApiRoutes(api awsapigateway.RestApi, lambdaFunctions map[string]*LambdaFunction) {
	// Health check endpoint
	healthResource := api.Root().AddResource(jsii.String("health"), nil)
	healthResource.AddMethod(jsii.String("GET"), awsapigateway.NewMockIntegration(&awsapigateway.IntegrationOptions{
		IntegrationResponses: &[]*awsapigateway.IntegrationResponse{
			{
				StatusCode: jsii.String("200"),
				ResponseTemplates: &map[string]*string{
					"application/json": jsii.String(`{
                        "status": "healthy",
                        "timestamp": "$context.requestTime",
                        "requestId": "$context.requestId"
                    }`),
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

	// Hello endpoint
	if helloFunc, exists := lambdaFunctions["hello"]; exists {
		helloIntegration := awsapigateway.NewLambdaIntegration(helloFunc.Function, &awsapigateway.LambdaIntegrationOptions{
			Proxy: jsii.Bool(true),
		})

		helloResource := api.Root().AddResource(jsii.String("hello"), nil)
		helloResource.AddMethod(jsii.String("GET"), helloIntegration, &awsapigateway.MethodOptions{
			MethodResponses: &[]*awsapigateway.MethodResponse{
				{
					StatusCode: jsii.String("200"),
				},
				{
					StatusCode: jsii.String("500"),
				},
			},
		})
	}

	// Users endpoints
	if usersFunc, exists := lambdaFunctions["users"]; exists {
		usersIntegration := awsapigateway.NewLambdaIntegration(usersFunc.Function, &awsapigateway.LambdaIntegrationOptions{
			Proxy: jsii.Bool(true),
		})

		usersResource := api.Root().AddResource(jsii.String("users"), nil)

		// GET /users
		usersResource.AddMethod(jsii.String("GET"), usersIntegration, &awsapigateway.MethodOptions{
			MethodResponses: &[]*awsapigateway.MethodResponse{
				{
					StatusCode: jsii.String("200"),
				},
				{
					StatusCode: jsii.String("500"),
				},
			},
		})

		// GET /users/{id}
		userResource := usersResource.AddResource(jsii.String("{id}"), nil)
		userResource.AddMethod(jsii.String("GET"), usersIntegration, &awsapigateway.MethodOptions{
			RequestParameters: &map[string]*bool{
				"method.request.path.id": jsii.Bool(true),
			},
			MethodResponses: &[]*awsapigateway.MethodResponse{
				{
					StatusCode: jsii.String("200"),
				},
				{
					StatusCode: jsii.String("400"),
				},
				{
					StatusCode: jsii.String("404"),
				},
			},
		})
	}
}

func createOutputs(stack awscdk.Stack, api awsapigateway.RestApi, lambdaFunctions map[string]*LambdaFunction) {
	// API Gateway URL
	awscdk.NewCfnOutput(stack, jsii.String("ApiGatewayUrl"), &awscdk.CfnOutputProps{
		Value:       api.Url(),
		Description: jsii.String("API Gateway endpoint URL"),
		ExportName:  jsii.String("TapApiUrl"),
	})

	// API Gateway ID
	awscdk.NewCfnOutput(stack, jsii.String("ApiGatewayId"), &awscdk.CfnOutputProps{
		Value:       api.RestApiId(),
		Description: jsii.String("API Gateway ID"),
		ExportName:  jsii.String("TapApiId"),
	})

	// Lambda function ARNs and names
	for name, lambdaFunc := range lambdaFunctions {
		// Capitalize first letter for output names
		capitalizedName := strings.Title(name)

		awscdk.NewCfnOutput(stack, jsii.String(capitalizedName+"LambdaArn"), &awscdk.CfnOutputProps{
			Value:       lambdaFunc.Function.FunctionArn(),
			Description: jsii.String("ARN of the " + name + " Lambda function"),
			ExportName:  jsii.String(capitalizedName + "LambdaArn"),
		})

		awscdk.NewCfnOutput(stack, jsii.String(capitalizedName+"LambdaName"), &awscdk.CfnOutputProps{
			Value:       lambdaFunc.Function.FunctionName(),
			Description: jsii.String("Name of the " + name + " Lambda function"),
			ExportName:  jsii.String(capitalizedName + "LambdaName"),
		})

		awscdk.NewCfnOutput(stack, jsii.String(capitalizedName+"LogGroupName"), &awscdk.CfnOutputProps{
			Value:       lambdaFunc.LogGroup.LogGroupName(),
			Description: jsii.String("CloudWatch Log Group for " + name + " Lambda function"),
			ExportName:  jsii.String(capitalizedName + "LogGroupName"),
		})
	}
}
