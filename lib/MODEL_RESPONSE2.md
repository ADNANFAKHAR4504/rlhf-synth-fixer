I'll help you create a serverless infrastructure using AWS CDK with Go. This solution will include Lambda functions, API Gateway, CloudWatch logging, and proper tagging for a production environment.

## Project Structure

First, let's set up the project structure:

```
serverless-app/
├── cmd/
│   └── main.go
├── internal/
│   ├── stacks/
│   │   └── serverless_stack.go
│   └── constructs/
│       ├── lambda_construct.go
│       └── api_gateway_construct.go
├── lambda/
│   └── handlers/
│       ├── hello/
│       │   └── main.go
│       └── users/
│           └── main.go
├── go.mod
├── go.sum
└── cdk.json
```

## 1. Go Module Setup (`go.mod`)

```go
module serverless-app

go 1.21

require (
    github.com/aws/aws-cdk-go/awscdk/v2 v2.100.0
    github.com/aws/constructs-go/constructs/v10 v10.3.0
    github.com/aws/jsii-runtime-go v1.89.0
)
```

## 2. CDK Configuration (`cdk.json`)

```json
{
  "app": "go run cmd/main.go",
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
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipal": true,
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
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingForLambdaInvoke": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-s3:autoDeleteObjectsPolicy": true,
    "@aws-cdk/aws-ec2:vpnConnectionLogging": true,
    "@aws-cdk/aws-route53:splitHorizon": true,
    "@aws-cdk/aws-lambda:codeBundlingHashCheck": true
  }
}
```

## 3. Lambda Function Handlers

### Hello Handler (`lambda/handlers/hello/main.go`)

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log"

    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
)

type Response struct {
    StatusCode int               `json:"statusCode"`
    Headers    map[string]string `json:"headers"`
    Body       string            `json:"body"`
}

type HelloResponse struct {
    Message   string `json:"message"`
    RequestID string `json:"requestId"`
    Path      string `json:"path"`
    Method    string `json:"method"`
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (Response, error) {
    log.Printf("Processing request: %s %s", request.HTTPMethod, request.Path)
    
    response := HelloResponse{
        Message:   "Hello from Serverless Lambda!",
        RequestID: request.RequestContext.RequestID,
        Path:      request.Path,
        Method:    request.HTTPMethod,
    }

    jsonResponse, err := json.Marshal(response)
    if err != nil {
        log.Printf("Error marshaling response: %v", err)
        return Response{
            StatusCode: 500,
            Headers: map[string]string{
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            Body: `{"error": "Internal server error"}`,
        }, nil
    }

    log.Printf("Returning successful response")
    return Response{
        StatusCode: 200,
        Headers: map[string]string{
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        Body: string(jsonResponse),
    }, nil
}

func main() {
    lambda.Start(handler)
}
```

### Users Handler (`lambda/handlers/users/main.go`)

```go
package main

import (
    "context"
    "encoding/json"
    "log"
    "strconv"

    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
)

type Response struct {
    StatusCode int               `json:"statusCode"`
    Headers    map[string]string `json:"headers"`
    Body       string            `json:"body"`
}

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

type UsersResponse struct {
    Users     []User `json:"users"`
    Count     int    `json:"count"`
    RequestID string `json:"requestId"`
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (Response, error) {
    log.Printf("Processing users request: %s %s", request.HTTPMethod, request.Path)

    // Mock users data
    users := []User{
        {ID: 1, Name: "John Doe", Email: "john@example.com"},
        {ID: 2, Name: "Jane Smith", Email: "jane@example.com"},
        {ID: 3, Name: "Bob Johnson", Email: "bob@example.com"},
    }

    // Handle specific user ID if provided
    if userID := request.PathParameters["id"]; userID != "" {
        id, err := strconv.Atoi(userID)
        if err != nil {
            return Response{
                StatusCode: 400,
                Headers: map[string]string{
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                Body: `{"error": "Invalid user ID"}`,
            }, nil
        }

        for _, user := range users {
            if user.ID == id {
                jsonResponse, _ := json.Marshal(user)
                return Response{
                    StatusCode: 200,
                    Headers: map[string]string{
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*",
                    },
                    Body: string(jsonResponse),
                }, nil
            }
        }

        return Response{
            StatusCode: 404,
            Headers: map[string]string{
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            Body: `{"error": "User not found"}`,
        }, nil
    }

    response := UsersResponse{
        Users:     users,
        Count:     len(users),
        RequestID: request.RequestContext.RequestID,
    }

    jsonResponse, err := json.Marshal(response)
    if err != nil {
        log.Printf("Error marshaling response: %v", err)
        return Response{
            StatusCode: 500,
            Headers: map[string]string{
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            Body: `{"error": "Internal server error"}`,
        }, nil
    }

    log.Printf("Returning users list with %d users", len(users))
    return Response{
        StatusCode: 200,
        Headers: map[string]string{
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        Body: string(jsonResponse),
    }, nil
}

func main() {
    lambda.Start(handler)
}
```

## 4. Lambda Construct (`internal/constructs/lambda_construct.go`)

```go
package constructs

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
    "github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
)

type LambdaConstructProps struct {
    FunctionName    string
    CodePath        string
    Handler         string
    Environment     map[string]*string
    EnvironmentSuffix string
}

type LambdaConstruct struct {
    constructs.Construct
    Function awslambda.Function
    LogGroup awslogs.LogGroup
}

func NewLambdaConstruct(scope constructs.Construct, id *string, props *LambdaConstructProps) *LambdaConstruct {
    this := &LambdaConstruct{}
    this.Construct = constructs.NewConstruct(scope, id)

    // Create CloudWatch Log Group
    logGroupName := jsii.String("/aws/lambda/" + props.FunctionName + "-" + props.EnvironmentSuffix)
    this.LogGroup = awslogs.NewLogGroup(this, jsii.String("LogGroup"), &awslogs.LogGroupProps{
        LogGroupName:  logGroupName,
        Retention:     awslogs.RetentionDays_ONE_MONTH,
        RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
    })

    // Add tags to log group
    awscdk.Tags_Of(this.LogGroup).Add(jsii.String("Environment"), jsii.String(props.EnvironmentSuffix), nil)

    // Create Lambda function
    this.Function = awslambda.NewFunction(this, jsii.String("Function"), &awslambda.FunctionProps{
        FunctionName: jsii.String(props.FunctionName + "-" + props.EnvironmentSuffix),
        Runtime:      awslambda.Runtime_GO_1_X(),
        Code:         awslambda.Code_FromAsset(jsii.String(props.CodePath), nil),
        Handler:      jsii.String(props.Handler),
        MemorySize:   jsii.Number(256), // 256MB as requested
        Timeout:      awscdk.Duration_Seconds(jsii.Number(30)),
        Environment:  &props.Environment,
        LogGroup:     this.LogGroup,
        Architecture: awslambda.Architecture_X86_64(),
        DeadLetterQueueEnabled: jsii.Bool(true),
        ReservedConcurrentExecutions: jsii.Number(100), // Prevent runaway costs
    })

    // Add tags to Lambda function
    awscdk.Tags_Of(this.Function).Add(jsii.String("Environment"), jsii.String(props.EnvironmentSuffix), nil)

    return this
}

func (l *LambdaConstruct) GetFunction() awslambda.Function {
    return l.Function
}

func (l *LambdaConstruct) GetLogGroup() awslogs.LogGroup {
    return l.LogGroup
}
```

## 5. API Gateway Construct (`internal/constructs/api_gateway_construct.go`)

```go
package constructs

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
    "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
    "github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
)

type ApiGatewayConstructProps struct {
    ApiName           string
    EnvironmentSuffix string
    LambdaFunctions   map[string]awslambda.Function
}

type ApiGatewayConstruct struct {
    constructs.Construct
    Api      awsapigateway.RestApi
    LogGroup awslogs.LogGroup
}

func NewApiGatewayConstruct(scope constructs.Construct, id *string, props *ApiGatewayConstructProps) *ApiGatewayConstruct {
    this := &ApiGatewayConstruct{}
    this.Construct = constructs.NewConstruct(scope, id)

    // Create CloudWatch Log Group for API Gateway
    logGroupName := jsii.String("/aws/apigateway/" + props.ApiName + "-" + props.EnvironmentSuffix)
    this.LogGroup = awslogs.NewLogGroup(this, jsii.String("ApiLogGroup"), &awslogs.LogGroupProps{
        LogGroupName:  logGroupName,
        Retention:     awslogs.RetentionDays_ONE_MONTH,
        RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
    })

    // Add tags to log group
    awscdk.Tags_Of(this.LogGroup).Add(jsii.String("Environment"), jsii.String(props.EnvironmentSuffix), nil)

    // Create REST API
    this.Api = awsapigateway.NewRestApi(this, jsii.String("RestApi"), &awsapigateway.RestApiProps{
        RestApiName: jsii.String(props.ApiName + "-" + props.EnvironmentSuffix),
        Description: jsii.String("Serverless API for " + props.EnvironmentSuffix + " environment"),
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
        },
        CloudWatchRole: jsii.Bool(true),
        DeployOptions: &awsapigateway.StageOptions{
            StageName: jsii.String(props.EnvironmentSuffix),
            LoggingLevel: awsapigateway.MethodLoggingLevel_INFO,
            DataTraceEnabled: jsii.Bool(true),
            MetricsEnabled: jsii.Bool(true),
            AccessLogDestination: awsapigateway.NewLogGroupLogDestination(this.LogGroup),
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
        },
        EndpointConfiguration: &awsapigateway.EndpointConfiguration{
            Types: &[]awsapigateway.EndpointType{awsapigateway.EndpointType_REGIONAL},
        },
    })

    // Add tags to API Gateway
    awscdk.Tags_Of(this.Api).Add(jsii.String("Environment"), jsii.String(props.EnvironmentSuffix), nil)

    // Create integrations for Lambda functions
    this.createRoutes(props.LambdaFunctions)

    return this
}

func (a *ApiGatewayConstruct) createRoutes(lambdaFunctions map[string]awslambda.Function) {
    // Hello endpoint
    if helloFunction, exists := lambdaFunctions["hello"]; exists {
        helloIntegration := awsapigateway.NewLambdaIntegration(helloFunction, &awsapigateway.LambdaIntegrationOptions{
            RequestTemplates: &map[string]*string{
                "application/json": jsii.String(`{"statusCode": "200"}`),
            },
        })

        helloResource := a.Api.Root().AddResource(jsii.String("hello"), nil)
        helloResource.AddMethod(jsii.String("GET"), helloIntegration, &awsapigateway.MethodOptions{
            MethodResponses: &[]*awsapigateway.MethodResponse{
                {
                    StatusCode: jsii.String("200"),
                    ResponseHeaders: &map[string]*bool{
                        "Access-Control-Allow-Origin": jsii.Bool(true),
                        "Content-Type": jsii.Bool(true),
                    },
                },
            },
        })
    }

    // Users endpoints
    if usersFunction, exists := lambdaFunctions["users"]; exists {
        usersIntegration := awsapigateway.NewLambdaIntegration(usersFunction, &awsapigateway.LambdaIntegrationOptions{
            RequestTemplates: &map[string]*string{
                "application/json": jsii.String(`{"statusCode": "200"}`),
            },
        })

        usersResource := a.Api.Root().AddResource(jsii.String("users"), nil)
        
        // GET /users
        usersResource.AddMethod(jsii.String("GET"), usersIntegration, &awsapigateway.MethodOptions{
            MethodResponses: &[]*awsapigateway.MethodResponse{
                {
                    StatusCode: jsii.String("200"),
                    ResponseHeaders: &map[string]*bool{
                        "Access-Control-Allow-Origin": jsii.Bool(true),
                        "Content-Type": jsii.Bool(true),
                    },
                },
            },
        })

        // GET /users/{id}
        userResource := usersResource.AddResource(jsii.String("{id}"), nil)
        userResource.AddMethod(jsii.String("GET"), usersIntegration, &awsapigateway.MethodOptions{
            MethodResponses: &[]*awsapigateway.MethodResponse{
                {
                    StatusCode: jsii.String("200"),
                    ResponseHeaders: &map[string]*bool{
                        "Access-Control-Allow-Origin": jsii.Bool(true),
                        "Content-Type": jsii.Bool(true),
                    },
                },
                {
                    StatusCode: jsii.String("404"),
                    ResponseHeaders: &map[string]*bool{
                        "Access-Control-Allow-Origin": jsii.Bool(true),
                        "Content-Type": jsii.Bool(true),
                    },
                },
            },
        })
    }
}

func (a *ApiGatewayConstruct) GetApi() awsapigateway.RestApi {
    return a.Api
}

func (a *ApiGatewayConstruct) GetLogGroup() awslogs.LogGroup {
    return a.LogGroup
}
```

## 6. Main Stack (`internal/stacks/serverless_stack.go`)

```go
package stacks

import (
    "serverless-app/internal/constructs"

    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
)

type ServerlessStackProps struct {
    awscdk.StackProps
    EnvironmentSuffix string
}

type ServerlessStack struct {
    awscdk.Stack
    ApiGateway      *constructs.ApiGatewayConstruct
    LambdaFunctions map[string]*constructs.LambdaConstruct
}

func NewServerlessStack(scope constructs.Construct, id string, props *ServerlessStackProps) *ServerlessStack {
    var sprops awscdk.StackProps
    if props != nil {
        sprops = props.StackProps
    }
    stack := awscdk.NewStack(scope, &id, &sprops)

    // Create the serverless stack instance
    serverlessStack := &ServerlessStack{
        Stack:           stack,
        LambdaFunctions: make(map[string]*constructs.LambdaConstruct),
    }

    // Add stack-level tags
    awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String(props.EnvironmentSuffix), nil)
    awscdk.Tags_Of(stack).Add(jsii.String("Project"), jsii.String("ServerlessApp"), nil)
    awscdk.Tags_Of(stack).Add(jsii.String("ManagedBy"), jsii.String("CDK"), nil)

    // Create Lambda functions
    serverlessStack.createLambdaFunctions(props.EnvironmentSuffix)

    // Create API Gateway
    serverlessStack.createApiGateway(props.EnvironmentSuffix)

    // Create outputs
    serverlessStack.createOutputs()

    return serverlessStack
}

func (s *ServerlessStack) createLambdaFunctions(environmentSuffix string) {
    // Hello Lambda function
    s.LambdaFunctions["hello"] = constructs.NewLambdaConstruct(s, jsii.String("HelloLambda"), &constructs.LambdaConstructProps{
        FunctionName: "hello-handler",
        CodePath:     "./lambda/handlers/hello",
        Handler:      "main",
        Environment: map[string]*string{
            "ENVIRONMENT": jsii.String(environmentSuffix),
            "LOG_LEVEL":   jsii.String("INFO"),
        },
        EnvironmentSuffix: environmentSuffix,
    })

    // Users Lambda function
    s.LambdaFunctions["users"] = constructs.NewLambdaConstruct(s, jsii.String("UsersLambda"), &constructs.LambdaConstructProps{
        FunctionName: "users-handler",
        CodePath:     "./lambda/handlers/users",
        Handler:      "main",
        Environment: map[string]*string{
            "ENVIRONMENT": jsii.String(environmentSuffix),
            "LOG_LEVEL":   jsii.String("INFO"),
        },
        EnvironmentSuffix: environmentSuffix,
    })
}

func (s *ServerlessStack) createApiGateway(environmentSuffix string) {
    // Extract Lambda functions for API Gateway
    lambdaFunctions := make(map[string]awslambda.Function)
    for name, construct := range s.LambdaFunctions {
        lambdaFunctions[name] = construct.GetFunction()
    }

    // Create API Gateway
    s.ApiGateway = constructs.NewApiGatewayConstruct(s, jsii.String("ApiGateway"), &constructs.ApiGatewayConstructProps{
        ApiName:           "serverless-api",
        EnvironmentSuffix: environmentSuffix,
        LambdaFunctions:   lambdaFunctions,
    })
}

func (s *ServerlessStack) createOutputs() {
    // API Gateway URL
    awscdk.NewCfnOutput(s, jsii.String("ApiGatewayUrl"), &awscdk.CfnOutputProps{
        Value:       s.ApiGateway.GetApi().Url(),
        Description: jsii.String("API Gateway endpoint URL"),
        ExportName:  jsii.String("ServerlessApiUrl"),
    })

    // Lambda function ARNs
    for name, lambdaConstruct := range s.LambdaFunctions {
        awscdk.NewCfnOutput(s, jsii.String(name+"LambdaArn"), &awscdk.CfnOutputProps{
            Value:       lambdaConstruct.GetFunction().FunctionArn(),
            Description: jsii.String("ARN of the " + name + " Lambda function"),
            ExportName:  jsii.String(name + "LambdaArn"),
        })
    }

    // CloudWatch Log Groups
    awscdk.NewCfnOutput(s, jsii.String("ApiLogGroupName"), &awscdk.CfnOutputProps{
        Value:       s.ApiGateway.GetLogGroup().LogGroupName(),
        Description: jsii.String("API Gateway CloudWatch Log Group name"),
        ExportName:  jsii.String("ApiLogGroupName"),
    })
}
```

## 7. Main Application (`cmd/main.go`)

```go
package main

import (
    "os"
    "serverless-app/internal/stacks"

    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
)

func main() {
    defer jsii.Close()

    app := awscdk.NewApp(nil)

    // Get environment suffix from context or environment variable
    environmentSuffix := "prod"
    if envSuffix := os.Getenv("ENVIRONMENT_SUFFIX"); envSuffix != "" {
        environmentSuffix = envSuffix
    }
    if contextEnv := app.Node().TryGetContext(jsii.String("environmentSuffix")); contextEnv != nil {
        if envStr, ok := contextEnv.(string); ok {
            environmentSuffix = envStr
        }
    }

    // Create the serverless stack for US-West-2
    stacks.NewServerlessStack(app, "ServerlessStack-"+environmentSuffix, &stacks.ServerlessStackProps{
        StackProps: awscdk.StackProps{
            Env: &awscdk.Environment{
                Account: jsii.String(os.Getenv("CDK_DEFAULT_ACCOUNT")),
                Region:  jsii.String("us-west-2"),
            },
            Description: jsii.String("Serverless application stack with Lambda functions and API Gateway"),
        },
        EnvironmentSuffix: environmentSuffix,
    })

    app.Synth(nil)
}
```

## 8. Lambda Dependencies

Create `go.mod` files for each Lambda function:

### `lambda/handlers/hello/go.mod`
```go
module hello

go 1.21

require github.com/aws/aws-lambda-go v1.41.0
```

### `lambda/handlers/users/go.mod`
```go
module users

go 1.21

require github.com/aws/aws-lambda-go v1.41.0
```

## 9. Build and Deploy Scripts

Create a `Makefile` for easy building and deployment:

```makefile
.PHONY: build-lambdas deploy destroy clean

# Build all Lambda functions
build-lambdas:
	@echo "Building Lambda functions..."
	cd lambda/handlers/hello && GOOS=linux GOARCH=amd64 go build -o main main.go
	cd lambda/handlers/users && GOOS=linux GOARCH=amd64 go build -o main main.go

# Deploy the stack
deploy: build-lambdas
	@echo "Deploying serverless stack..."
	cdk deploy --require-approval never

# Deploy with specific environment
deploy-env: build-lambdas
	@echo "Deploying serverless stack for environment: $(ENV)"
	cdk deploy --require-approval never -c environmentSuffix=$(ENV)

# Destroy the stack
destroy:
	@echo "Destroying serverless stack..."
	cdk destroy --force

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f lambda/handlers/hello/main
	rm -f lambda/handlers/users/main

# Bootstrap CDK (run once per account/region)
bootstrap:
	cdk bootstrap

# Show diff
diff: build-lambdas
	cdk diff

# List stacks
list:
	cdk list
```

## Deployment Instructions

1. **Initialize the project:**
```bash
go mod tidy
cd lambda/handlers/hello && go mod tidy && cd ../../..
cd lambda/handlers/users && go mod tidy && cd ../../..
```

2. **Bootstrap CDK (first time only):**
```bash
make bootstrap
```

3. **Build and deploy:**
```bash
# Deploy with default environment (prod)
make deploy

# Or deploy with specific environment
make deploy-env ENV=staging
```

4. **Test the API:**
```bash
# Get the API URL from the output
API_URL=$(aws cloudformation describe-stacks --stack-name ServerlessStack-prod --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' --output text)

# Test endpoints
curl $API_URL/hello
curl $API_URL/users
curl $API_URL/users/1
```

## Key Features Implemented

✅ **AWS Lambda Functions**: Two example functions with 256MB memory limit  
✅ **API Gateway Integration**: RESTful API with proper routing  
✅ **CloudWatch Logging**: Comprehensive logging