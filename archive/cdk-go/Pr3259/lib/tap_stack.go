package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsdynamodb"
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
}

// ServerlessNestedStack represents a nested stack containing serverless resources
type ServerlessNestedStack struct {
	awscdk.NestedStack
	Table    awsdynamodb.Table
	Function awslambda.Function
	Api      awsapigateway.RestApi
}

// NewServerlessNestedStack creates a new nested stack with serverless resources
func NewServerlessNestedStack(scope constructs.Construct, id *string, environmentSuffix string, props *awscdk.NestedStackProps) *ServerlessNestedStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props)

	// ==========================================
	// DynamoDB Table Configuration
	// ==========================================
	tableName := fmt.Sprintf("tap-serverless-table-%s", environmentSuffix)
	table := awsdynamodb.NewTable(nestedStack, jsii.String("ServerlessTable"), &awsdynamodb.TableProps{
		TableName: jsii.String(tableName),
		// Define partition key for the table
		PartitionKey: &awsdynamodb.Attribute{
			Name: jsii.String("id"),
			Type: awsdynamodb.AttributeType_STRING,
		},
		// Use on-demand billing mode as required
		BillingMode: awsdynamodb.BillingMode_PAY_PER_REQUEST,
		// Enable point-in-time recovery for data protection
		PointInTimeRecoverySpecification: &awsdynamodb.PointInTimeRecoverySpecification{
			PointInTimeRecoveryEnabled: jsii.Bool(true),
		},
		// Set removal policy based on environment
		RemovalPolicy: func() awscdk.RemovalPolicy {
			if environmentSuffix == "prod" {
				return awscdk.RemovalPolicy_RETAIN
			}
			return awscdk.RemovalPolicy_DESTROY
		}(),
	})

	// Add tags to the DynamoDB table
	awscdk.Tags_Of(table).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
	awscdk.Tags_Of(table).Add(jsii.String("Application"), jsii.String("TapServerlessAPI"), nil)
	awscdk.Tags_Of(table).Add(jsii.String("Component"), jsii.String("Database"), nil)

	// ==========================================
	// Lambda Function Configuration
	// ==========================================
	// Create IAM role for Lambda function with necessary permissions
	lambdaRoleName := fmt.Sprintf("tap-lambda-role-%s", environmentSuffix)
	lambdaRole := awsiam.NewRole(nestedStack, jsii.String("LambdaExecutionRole"), &awsiam.RoleProps{
		RoleName:    jsii.String(lambdaRoleName),
		AssumedBy:   awsiam.NewServicePrincipal(jsii.String("lambda.amazonaws.com"), nil),
		Description: jsii.String(fmt.Sprintf("Execution role for Tap Serverless API Lambda function (%s)", environmentSuffix)),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			// Attach basic Lambda execution policy for CloudWatch Logs
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AWSLambdaBasicExecutionRole")),
		},
	})

	// Grant DynamoDB permissions to Lambda role
	table.GrantReadWriteData(lambdaRole)

	// Create log group for Lambda function
	functionName := fmt.Sprintf("tap-api-handler-%s", environmentSuffix)
	logGroupName := fmt.Sprintf("/aws/lambda/%s", functionName)
	logGroup := awslogs.NewLogGroup(nestedStack, jsii.String("LambdaLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String(logGroupName),
		Retention:     awslogs.RetentionDays_ONE_WEEK,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Create Lambda function with Python runtime
	lambdaFunction := awslambda.NewFunction(nestedStack, jsii.String("APIHandler"), &awslambda.FunctionProps{
		FunctionName: jsii.String(functionName),
		Runtime:      awslambda.Runtime_PYTHON_3_12(), // Using latest Python runtime as required
		Handler:      jsii.String("index.handler"),    // Handler function in index.py
		Code: awslambda.Code_FromInline(jsii.String(`
import json
import boto3
import os
from datetime import datetime
import uuid

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Main Lambda handler for processing API requests
    Supports GET, POST, PUT, and DELETE operations
    """
    try:
        # Extract HTTP method and path from the event
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        query_params = event.get('queryStringParameters', {})
        body = event.get('body', '{}')
        
        # Parse request body if present
        if body:
            try:
                request_data = json.loads(body)
            except json.JSONDecodeError:
                request_data = {}
        else:
            request_data = {}
        
        # Route based on HTTP method
        if http_method == 'GET':
            # Handle GET request - retrieve items
            if query_params and 'id' in query_params:
                # Get specific item by ID
                response = table.get_item(Key={'id': query_params['id']})
                if 'Item' in response:
                    result = response['Item']
                    status_code = 200
                else:
                    result = {'message': 'Item not found'}
                    status_code = 404
            else:
                # Scan all items (use with caution in production)
                response = table.scan(Limit=100)
                result = response.get('Items', [])
                status_code = 200
                
        elif http_method == 'POST':
            # Handle POST request - create new item
            item_id = str(uuid.uuid4())
            item = {
                'id': item_id,
                'created_at': datetime.utcnow().isoformat(),
                **request_data
            }
            table.put_item(Item=item)
            result = {'message': 'Item created successfully', 'id': item_id}
            status_code = 201
            
        elif http_method == 'PUT':
            # Handle PUT request - update existing item
            if 'id' not in request_data:
                result = {'error': 'ID is required for update'}
                status_code = 400
            else:
                item = {
                    'id': request_data['id'],
                    'updated_at': datetime.utcnow().isoformat(),
                    **request_data
                }
                table.put_item(Item=item)
                result = {'message': 'Item updated successfully'}
                status_code = 200
                
        elif http_method == 'DELETE':
            # Handle DELETE request - remove item
            if query_params and 'id' in query_params:
                table.delete_item(Key={'id': query_params['id']})
                result = {'message': 'Item deleted successfully'}
                status_code = 200
            else:
                result = {'error': 'ID is required for deletion'}
                status_code = 400
        else:
            # Method not supported
            result = {'error': 'Method not allowed'}
            status_code = 405
            
        # Return successful response
        return {
            'statusCode': status_code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': json.dumps(result)
        }
        
    except Exception as e:
        # Handle any unexpected errors
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)})
        }
`)),
		Role:        lambdaRole,
		Timeout:     awscdk.Duration_Seconds(jsii.Number(30)), // 30 second timeout
		MemorySize:  jsii.Number(256),                         // 256 MB memory
		Description: jsii.String(fmt.Sprintf("Lambda function for handling REST API requests (%s)", environmentSuffix)),
		Environment: &map[string]*string{
			"TABLE_NAME":  table.TableName(), // Pass table name as environment variable
			"ENVIRONMENT": jsii.String(environmentSuffix),
		},
		// Use the log group created earlier
		LogGroup: logGroup,
		// Enable X-Ray tracing for better observability
		Tracing: awslambda.Tracing_ACTIVE,
	})

	// ==========================================
	// API Gateway Configuration
	// ==========================================
	// Create REST API with API Gateway
	apiName := fmt.Sprintf("tap-serverless-api-%s", environmentSuffix)
	api := awsapigateway.NewRestApi(nestedStack, jsii.String("ServerlessAPI"), &awsapigateway.RestApiProps{
		RestApiName: jsii.String(apiName),
		Description: jsii.String(fmt.Sprintf("Serverless REST API with Lambda backend (%s)", environmentSuffix)),
		// Configure deployment options
		DeployOptions: &awsapigateway.StageOptions{
			StageName:    jsii.String(environmentSuffix),
			LoggingLevel: awsapigateway.MethodLoggingLevel_INFO,
			DataTraceEnabled: func() *bool {
				// Enable data tracing only in non-production environments
				if environmentSuffix != "prod" {
					return jsii.Bool(true)
				}
				return jsii.Bool(false)
			}(),
			MetricsEnabled:       jsii.Bool(true),
			ThrottlingRateLimit:  jsii.Number(1000), // 1000 requests per second
			ThrottlingBurstLimit: jsii.Number(2000), // Burst of 2000 requests
		},
		// Configure default CORS settings for all origins as required
		DefaultCorsPreflightOptions: &awsapigateway.CorsOptions{
			AllowOrigins: awsapigateway.Cors_ALL_ORIGINS(),
			AllowMethods: awsapigateway.Cors_ALL_METHODS(),
			AllowHeaders: &[]*string{
				jsii.String("Content-Type"),
				jsii.String("X-Amz-Date"),
				jsii.String("Authorization"),
				jsii.String("X-Api-Key"),
				jsii.String("X-Amz-Security-Token"),
			},
			AllowCredentials: jsii.Bool(true),
			MaxAge:           awscdk.Duration_Hours(jsii.Number(1)),
		},
		// Use REGIONAL endpoint for better performance
		EndpointConfiguration: &awsapigateway.EndpointConfiguration{
			Types: &[]awsapigateway.EndpointType{
				awsapigateway.EndpointType_REGIONAL,
			},
		},
		// Enable CloudWatch logs
		CloudWatchRole: jsii.Bool(true),
	})

	// Create Lambda integration for API Gateway
	lambdaIntegration := awsapigateway.NewLambdaIntegration(lambdaFunction, &awsapigateway.LambdaIntegrationOptions{
		RequestTemplates: &map[string]*string{
			"application/json": jsii.String("{ \"statusCode\": \"200\" }"),
		},
		// Enable proxy integration to pass all request data to Lambda
		Proxy: jsii.Bool(true),
		IntegrationResponses: &[]*awsapigateway.IntegrationResponse{
			{
				StatusCode: jsii.String("200"),
				ResponseParameters: &map[string]*string{
					"method.response.header.Access-Control-Allow-Origin": jsii.String("'*'"),
				},
			},
		},
	})

	// Configure root resource methods
	root := api.Root()

	// Add proxy resource to handle all paths
	proxyResource := root.AddResource(jsii.String("{proxy+}"), &awsapigateway.ResourceOptions{
		DefaultCorsPreflightOptions: &awsapigateway.CorsOptions{
			AllowOrigins: awsapigateway.Cors_ALL_ORIGINS(),
			AllowMethods: &[]*string{
				jsii.String("GET"),
				jsii.String("POST"),
				jsii.String("PUT"),
				jsii.String("DELETE"),
				jsii.String("OPTIONS"),
			},
			AllowHeaders: &[]*string{jsii.String("*")},
		},
	})

	// Add methods to proxy resource
	proxyResource.AddMethod(jsii.String("ANY"), lambdaIntegration, &awsapigateway.MethodOptions{
		MethodResponses: &[]*awsapigateway.MethodResponse{
			{
				StatusCode: jsii.String("200"),
				ResponseParameters: &map[string]*bool{
					"method.response.header.Access-Control-Allow-Origin": jsii.Bool(true),
				},
			},
		},
	})

	// Add method to root resource as well
	root.AddMethod(jsii.String("ANY"), lambdaIntegration, &awsapigateway.MethodOptions{
		MethodResponses: &[]*awsapigateway.MethodResponse{
			{
				StatusCode: jsii.String("200"),
				ResponseParameters: &map[string]*bool{
					"method.response.header.Access-Control-Allow-Origin": jsii.Bool(true),
				},
			},
		},
	})

	// ==========================================
	// Stack Outputs
	// ==========================================
	// Output the API endpoint URL
	awscdk.NewCfnOutput(nestedStack, jsii.String("APIEndpoint"), &awscdk.CfnOutputProps{
		Value:       api.Url(),
		Description: jsii.String(fmt.Sprintf("REST API endpoint URL (%s)", environmentSuffix)),
		ExportName:  jsii.String(fmt.Sprintf("TapServerlessAPIEndpoint-%s", environmentSuffix)),
	})

	// Output the DynamoDB table name
	awscdk.NewCfnOutput(nestedStack, jsii.String("TableName"), &awscdk.CfnOutputProps{
		Value:       table.TableName(),
		Description: jsii.String(fmt.Sprintf("DynamoDB table name (%s)", environmentSuffix)),
		ExportName:  jsii.String(fmt.Sprintf("TapServerlessTableName-%s", environmentSuffix)),
	})

	// Output the Lambda function ARN
	awscdk.NewCfnOutput(nestedStack, jsii.String("LambdaFunctionArn"), &awscdk.CfnOutputProps{
		Value:       lambdaFunction.FunctionArn(),
		Description: jsii.String(fmt.Sprintf("Lambda function ARN (%s)", environmentSuffix)),
		ExportName:  jsii.String(fmt.Sprintf("TapServerlessLambdaArn-%s", environmentSuffix)),
	})

	return &ServerlessNestedStack{
		NestedStack: nestedStack,
		Table:       table,
		Function:    lambdaFunction,
		Api:         api,
	}
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

	// Create separate stacks for each resource type
	// Create the Serverless stack as a nested stack
	serverlessStackId := fmt.Sprintf("ServerlessStack-%s", environmentSuffix)

	// Call the function but don't store the returned custom struct
	// to avoid JSII proxy conflicts
	NewServerlessNestedStack(
		stack,
		jsii.String(serverlessStackId),
		environmentSuffix,
		&awscdk.NestedStackProps{
			Description: jsii.String(fmt.Sprintf("Serverless REST API resources for Tap project (%s)", environmentSuffix)),
		},
	)

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}
