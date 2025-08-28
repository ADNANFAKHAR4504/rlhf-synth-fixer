I'll help you update the AWS CDK (Go) stack according to the existing structure and requirements. Let me provide the complete implementation:

## 1. Main Stack File (`lib/tap_stack.go`)

```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"iac-test-automations/lib/constructs"
)

type TapStackProps struct {
	awscdk.StackProps
}

type TapStack struct {
	awscdk.Stack
	ApiEndpoint awscdk.CfnOutput
	LambdaArn   awscdk.CfnOutput
	LogGroups   awscdk.CfnOutput
}

func NewTapStack(scope constructs.Construct, id string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}

	stack := awscdk.NewStack(scope, &id, &sprops)

	// Global tags
	awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String("Production"), nil)

	// Create compute construct with Lambda functions
	computeConstruct := constructs.NewComputeConstruct(stack, jsii.String("ComputeConstruct"), &constructs.ComputeConstructProps{})

	// Create API Gateway
	api := awsapigateway.NewRestApi(stack, jsii.String("TapApi"), &awsapigateway.RestApiProps{
		RestApiName: jsii.String("tap-api"),
		Description: jsii.String("TAP API Gateway"),
		DefaultCorsPreflightOptions: &awsapigateway.CorsOptions{
			AllowOrigins: awsapigateway.Cors_ALL_ORIGINS(),
			AllowMethods: awsapigateway.Cors_ALL_METHODS(),
		},
	})

	// API Gateway Lambda integration
	lambdaIntegration := awsapigateway.NewLambdaIntegration(computeConstruct.LambdaFunction(), &awsapigateway.LambdaIntegrationOptions{
		Proxy: jsii.Bool(true),
	})

	// Add proxy resource
	api.Root().AddProxy(&awsapigateway.ProxyResourceOptions{
		DefaultIntegration: lambdaIntegration,
		AnyMethod:         jsii.Bool(true),
	})

	// Create outputs
	apiEndpoint := awscdk.NewCfnOutput(stack, jsii.String("ApiEndpoint"), &awscdk.CfnOutputProps{
		Value:       api.Url(),
		Description: jsii.String("API Gateway endpoint URL"),
		ExportName:  jsii.String("TapApiEndpoint"),
	})

	lambdaArn := awscdk.NewCfnOutput(stack, jsii.String("LambdaArn"), &awscdk.CfnOutputProps{
		Value:       computeConstruct.LambdaFunction().FunctionArn(),
		Description: jsii.String("Lambda function ARN"),
		ExportName:  jsii.String("TapLambdaArn"),
	})

	logGroups := awscdk.NewCfnOutput(stack, jsii.String("LogGroups"), &awscdk.CfnOutputProps{
		Value:       computeConstruct.LogGroup().LogGroupName(),
		Description: jsii.String("CloudWatch Log Group name"),
		ExportName:  jsii.String("TapLogGroups"),
	})

	return &TapStack{
		Stack:       stack,
		ApiEndpoint: apiEndpoint,
		LambdaArn:   lambdaArn,
		LogGroups:   logGroups,
	}
}
```

## 2. Compute Construct (`lib/constructs/compute_construct.go`)

```go
package constructs

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type ComputeConstructProps struct {
}

type ComputeConstruct struct {
	constructs.Construct
	lambdaFunction awslambda.Function
	logGroup       awslogs.LogGroup
	errorAlarm     awscloudwatch.Alarm
	durationAlarm  awscloudwatch.Alarm
	throttleAlarm  awscloudwatch.Alarm
}

func NewComputeConstruct(scope constructs.Construct, id *string, props *ComputeConstructProps) *ComputeConstruct {
	construct := constructs.NewConstruct(scope, id)

	// Create CloudWatch Log Group
	logGroup := awslogs.NewLogGroup(construct, jsii.String("LambdaLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:    jsii.String("/aws/lambda/tap-handler"),
		RetentionDays:   awslogs.RetentionDays_FOURTEEN,
		RemovalPolicy:   awscdk.RemovalPolicy_DESTROY,
	})

	// Create Lambda function
	lambdaFunction := awslambda.NewFunction(construct, jsii.String("TapHandler"), &awslambda.FunctionProps{
		Runtime:      awslambda.Runtime_PYTHON_3_9(),
		Handler:      jsii.String("handler.lambda_handler"),
		Code:         awslambda.Code_FromAsset(jsii.String("lib/lambda"), nil),
		FunctionName: jsii.String("tap-handler"),
		MemorySize:   jsii.Number(256), // ≤256MB as required
		Timeout:      awscdk.Duration_Seconds(jsii.Number(30)),
		LogGroup:     logGroup,
		Environment: &map[string]*string{
			"LOG_LEVEL": jsii.String("INFO"),
		},
	})

	// CloudWatch Alarms
	// Error alarm
	errorAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaErrorAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("tap-lambda-errors"),
		AlarmDescription: jsii.String("Lambda function error rate"),
		Metric: lambdaFunction.MetricErrors(&awscloudwatch.MetricOptions{
			Period: awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:       jsii.Number(1),
		EvaluationPeriods: jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
		TreatMissingData: awscloudwatch.TreatMissingData_NOT_BREACHING,
	})

	// Duration alarm
	durationAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaDurationAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("tap-lambda-duration"),
		AlarmDescription: jsii.String("Lambda function duration"),
		Metric: lambdaFunction.MetricDuration(&awscloudwatch.MetricOptions{
			Period: awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:       jsii.Number(25000), // 25 seconds
		EvaluationPeriods: jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
		TreatMissingData: awscloudwatch.TreatMissingData_NOT_BREACHING,
	})

	// Throttle alarm
	throttleAlarm := awscloudwatch.NewAlarm(construct, jsii.String("LambdaThrottleAlarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("tap-lambda-throttles"),
		AlarmDescription: jsii.String("Lambda function throttles"),
		Metric: lambdaFunction.MetricThrottles(&awscloudwatch.MetricOptions{
			Period: awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:       jsii.Number(1),
		EvaluationPeriods: jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
		TreatMissingData: awscloudwatch.TreatMissingData_NOT_BREACHING,
	})

	return &ComputeConstruct{
		Construct:      construct,
		lambdaFunction: lambdaFunction,
		logGroup:       logGroup,
		errorAlarm:     errorAlarm,
		durationAlarm:  durationAlarm,
		throttleAlarm:  throttleAlarm,
	}
}

func (c *ComputeConstruct) LambdaFunction() awslambda.Function {
	return c.lambdaFunction
}

func (c *ComputeConstruct) LogGroup() awslogs.LogGroup {
	return c.logGroup
}

func (c *ComputeConstruct) ErrorAlarm() awscloudwatch.Alarm {
	return c.errorAlarm
}

func (c *ComputeConstruct) DurationAlarm() awscloudwatch.Alarm {
	return c.durationAlarm
}

func (c *ComputeConstruct) ThrottleAlarm() awscloudwatch.Alarm {
	return c.throttleAlarm
}
```

## 3. Lambda Handler (`lib/lambda/handler.py`)

```python
import json
import logging
import os
from datetime import datetime

# Configure logging
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logger = logging.getLogger()
logger.setLevel(getattr(logging, log_level))

def lambda_handler(event, context):
    """
    Main Lambda handler function
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Extract HTTP method and path
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        
        # Route handling
        if path == '/health':
            return handle_health_check()
        elif path == '/api/data':
            return handle_data_request(http_method, event)
        else:
            return handle_default(path)
            
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

def handle_health_check():
    """Health check endpoint"""
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'service': 'tap-handler'
        })
    }

def handle_data_request(method, event):
    """Handle data API requests"""
    if method == 'GET':
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'data': [
                    {'id': 1, 'name': 'Item 1', 'value': 100},
                    {'id': 2, 'name': 'Item 2', 'value': 200}
                ],
                'timestamp': datetime.utcnow().isoformat()
            })
        }
    elif method == 'POST':
        body = json.loads(event.get('body', '{}'))
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Data created successfully',
                'received_data': body,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
    else:
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Method not allowed',
                'allowed_methods': ['GET', 'POST']
            })
        }

def handle_default(path):
    """Default handler for unmatched paths"""
    return {
        'statusCode': 404,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'error': 'Not found',
            'path': path,
            'available_endpoints': ['/health', '/api/data']
        })
    }
```

## 4. Main CDK App (`bin/tap.go`)

```go
package main

import (
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"

	"iac-test-automations/lib"
)

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	// Get region from environment or default to us-east-1
	region := os.Getenv("CDK_DEFAULT_REGION")
	if region == "" {
		region = "us-east-1"
	}

	account := os.Getenv("CDK_DEFAULT_ACCOUNT")

	// Create stack for us-east-1
	lib.NewTapStack(app, "TapStackEast", &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Account: jsii.String(account),
				Region:  jsii.String("us-east-1"),
			},
			Description: jsii.String("TAP Stack deployed in us-east-1"),
		},
	})

	// Create stack for us-west-2
	lib.NewTapStack(app, "TapStackWest", &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Account: jsii.String(account),
				Region:  jsii.String("us-west-2"),
			},
			Description: jsii.String("TAP Stack deployed in us-west-2"),
		},
	})

	app.Synth(nil)
}
```

## 5. Unit Tests (`tests/unit/tap_stack_test.go`)

```go
package unit

import (
	"encoding/json"
	"testing"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/assertions"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/stretchr/testify/assert"

	"iac-test-automations/lib"
)

func TestTapStack(t *testing.T) {
	// GIVEN
	app := awscdk.NewApp(nil)

	// WHEN
	stack := lib.NewTapStack(app, "TestStack", &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Account: jsii.String("123456789012"),
				Region:  jsii.String("us-east-1"),
			},
		},
	})

	// THEN
	template := assertions.Template_FromStack(stack.Stack, nil)

	// Test Lambda function exists with correct configuration
	template.HasResourceProperties(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
		"Runtime":     "python3.9",
		"Handler":     "handler.lambda_handler",
		"MemorySize":  256,
		"FunctionName": "tap-handler",
	})

	// Test API Gateway exists
	template.HasResourceProperties(jsii.String("AWS::ApiGateway::RestApi"), map[string]interface{}{
		"Name": "tap-api",
	})

	// Test CloudWatch Log Group exists
	template.HasResourceProperties(jsii.String("AWS::Logs::LogGroup"), map[string]interface{}{
		"LogGroupName":    "/aws/lambda/tap-handler",
		"RetentionInDays": 14,
	})

	// Test CloudWatch Alarms exist
	template.ResourceCountIs(jsii.String("AWS::CloudWatch::Alarm"), jsii.Number(3))

	// Test global tags
	template.HasResource(jsii.String("AWS::Lambda::Function"), map[string]interface{}{
		"Properties": map[string]interface{}{
			"Tags": []interface{}{
				map[string]interface{}{
					"Key":   "Environment",
					"Value": "Production",
				},
			},
		},
	})
}

func TestComputeConstruct(t *testing.T) {
	// GIVEN
	app := awscdk.NewApp(nil)
	stack := awscdk.NewStack(app, jsii.String("TestStack"), nil)

	// WHEN
	computeConstruct := lib.NewComputeConstruct(stack, jsii.String("TestCompute"), &lib.ComputeConstructProps{})

	// THEN
	assert.NotNil(t, computeConstruct)
	assert.NotNil(t, computeConstruct.LambdaFunction())
	assert.NotNil(t, computeConstruct.LogGroup())
	assert.NotNil(t, computeConstruct.ErrorAlarm())
	assert.NotNil(t, computeConstruct.DurationAlarm())
	assert.NotNil(t, computeConstruct.ThrottleAlarm())
}

func TestStackOutputs(t *testing.T) {
	// GIVEN
	app := awscdk.NewApp(nil)

	// WHEN
	stack := lib.NewTapStack(app, "TestStack", &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Account: jsii.String("123456789012"),
				Region:  jsii.String("us-east-1"),
			},
		},
	})

	// THEN
	template := assertions.Template_FromStack(stack.Stack, nil)

	// Test outputs exist
	template.HasOutput(jsii.String("ApiEndpoint"), map[string]interface{}{
		"Export": map[string]interface{}{
			"Name": "TapApiEndpoint",
		},
	})

	template.HasOutput(jsii.String("LambdaArn"), map[string]interface{}{
		"Export": map[string]interface{}{
			"Name": "TapLambdaArn",
		},
	})

	template.HasOutput(jsii.String("LogGroups"), map[string]interface{}{
		"Export": map[string]interface{}{
			"Name": "TapLogGroups",
		},
	})
}

func TestMultiRegionDeployment(t *testing.T) {
	// GIVEN
	app := awscdk.NewApp(nil)

	// WHEN
	eastStack := lib.NewTapStack(app, "EastStack", &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Account: jsii.String("123456789012"),
				Region:  jsii.String("us-east-1"),
			},
		},
	})

	westStack := lib.NewTapStack(app, "WestStack", &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Account: jsii.String("123456789012"),
				Region:  jsii.String("us-west-2"),
			},
		},
	})

	// THEN
	assert.NotNil(t, eastStack)
	assert.NotNil(t, westStack)

	// Verify both stacks can be synthesized
	eastTemplate := assertions.Template_FromStack(eastStack.Stack, nil)
	westTemplate := assertions.Template_FromStack(westStack.Stack, nil)

	assert.NotNil(t, eastTemplate)
	assert.NotNil(t, westTemplate)
}
```

## 6. Integration Test (`tests/integration/api_test.go`)

```go
package integration

import (
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type HealthResponse struct {
	Status    string `json:"status"`
	Timestamp string `json:"timestamp"`
	Service   string `json:"service"`
}

type DataResponse struct {
	Data      []DataItem `json:"data"`
	Timestamp string     `json:"timestamp"`
}

type DataItem struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Value int    `json:"value"`
}

func TestHealthEndpoint(t *testing.T) {
	// Skip if not running integration tests
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	apiEndpoint := getAPIEndpoint(t)
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(apiEndpoint + "/health")
	
	require.NoError(t, err)
	defer resp.Body.Close()
	
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	
	var healthResp HealthResponse
	err = json.NewDecoder(resp.Body).Decode(&healthResp)
	require.NoError(t, err)
	
	assert.Equal(t, "healthy", healthResp.Status)
	assert.Equal(t, "tap-handler", healthResp.Service)
	assert.NotEmpty(t, healthResp.Timestamp)
}

func TestDataEndpoint(t *testing.T) {
	// Skip if not running integration tests
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	apiEndpoint := getAPIEndpoint(t)
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(apiEndpoint + "/api/data")
	
	require.NoError(t, err)
	defer resp.Body.Close()
	
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	
	var dataResp DataResponse
	err = json.NewDecoder(resp.Body).Decode(&dataResp)
	require.NoError(t, err)
	
	assert.Len(t, dataResp.Data, 2)
	assert.NotEmpty(t, dataResp.Timestamp)
}

func TestNotFoundEndpoint(t *testing.T) {
	// Skip if not running integration tests
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	apiEndpoint := getAPIEndpoint(t)
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(apiEndpoint + "/nonexistent")
	
	require.NoError(t, err)
	defer resp.Body.Close()
	
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
}

func getAPIEndpoint(t *testing.T) string {
	// In a real scenario, this would get the API endpoint from CDK outputs
	// For testing purposes, you might set this as an environment variable
	// or retrieve it from CloudFormation stack outputs
	endpoint := "https://your-api-id.execute-api.us-east-1.amazonaws.com/prod"
	return endpoint
}
```

## 7. Go Module Files

### `go.mod`
```go
module iac-test-automations

go 1.19

require (
	github.com/aws/aws-cdk-go/awscdk/v2 v2.100.0
	github.com/aws/constructs-go/constructs/v10 v10.3.0
	github.com/aws/jsii-runtime-go v1.89.0
	github.com/stretchr/testify v1.8.4
)

require (
	github.com/Masterminds/semver/v3 v3.2.1 // indirect
	github.com/cdklabs/awscdk-asset-awscli-go/awscliv1/v2 v2.2.200 // indirect
	github.com/cdklabs/awscdk-asset-kubectl-go/kubectlv20/v2 v2.1.2 // indirect
	github.com/cdklabs/awscdk-asset-node-proxy-agent-go/nodeproxyagentv6/v2 v2.0.1 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)
```

## Key Features Implemented:

1. **Lambda Functions**: ≤256MB memory with CloudWatch logging
2. **API Gateway**: Proxy integration with Lambda
3. **Multi-Region**: Deployable in us-east-1 and us-west-2
4. **Global Tagging**: Environment=Production
5. **CloudWatch Alarms**: Error, duration, and throttle monitoring
6. **Outputs**: API endpoint, Lambda ARN, and log groups
7. **Testing**: Comprehensive unit and integration tests

## Deployment Commands:

```bash
# Synthesize the stack
cdk synth

# Deploy to us-east-1
cdk deploy TapStackEast

# Deploy to us-west-2  
cdk deploy TapStackWest

# Run unit tests
go test ./tests/unit/...

# Run integration tests (requires deployed stack)
go test ./tests/integration/...
```

This implementation follows the existing structure, meets all requirements, and provides a robust, testable CDK stack for your TAP automation system.