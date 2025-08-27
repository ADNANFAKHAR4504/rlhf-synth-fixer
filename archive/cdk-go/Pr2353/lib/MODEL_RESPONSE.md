I'll help you create a comprehensive serverless infrastructure using AWS CDK with Go in a single stack. This solution will be production-ready with proper logging, tagging, and best practices for US-West-2.

## Project Structure

```
serverless-app/
├── main.go
├── lambda/
│   ├── hello/
│   │   ├── main.go
│   │   └── go.mod
│   └── users/
│       ├── main.go
│       └── go.mod
├── go.mod
├── go.sum
├── cdk.json
└── Makefile
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
  "app": "go run main.go",
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
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-lambda:codeBundlingHashCheck": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true
  }
}
```

## 3. Main CDK Application (`main.go`)

```go
package main

import (
    "os"

    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsapigateway"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
    "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
    "github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
)

type ServerlessStackProps struct {
    awscdk.StackProps
    EnvironmentSuffix string
}

type LambdaFunction struct {
    Function awslambda.Function
    LogGroup awslogs.LogGroup
}

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

    // Create the serverless stack
    NewServerlessStack(app, "ServerlessStack-"+environmentSuffix, &ServerlessStackProps{
        StackProps: awscdk.StackProps{
            Env: &awscdk.Environment{
                Account: jsii.String(os.Getenv("CDK_DEFAULT_ACCOUNT")),
                Region:  jsii.String("us-west-2"),
            },
            Description: jsii.String("Highly available serverless application with Lambda and API Gateway"),
        },
        EnvironmentSuffix: environmentSuffix,
    })

    app.Synth(nil)
}

func NewServerlessStack(scope constructs.Construct, id string, props *ServerlessStackProps) awscdk.Stack {
    var sprops awscdk.StackProps
    if props != nil {
        sprops = props.StackProps
    }
    stack := awscdk.NewStack(scope, &id, &sprops)

    // Add stack-level tags
    awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String(props.EnvironmentSuffix), nil)
    awscdk.Tags_Of(stack).Add(jsii.String("Project"), jsii.String("ServerlessApp"), nil)
    awscdk.Tags_Of(stack).Add(jsii.String("ManagedBy"), jsii.String("CDK"), nil)
    awscdk.Tags_Of(stack).Add(jsii.String("Region"), jsii.String("us-west-2"), nil)

    // Create Lambda functions
    lambdaFunctions := createLambdaFunctions(stack, props.EnvironmentSuffix)

    // Create API Gateway
    api := createApiGateway(stack, props.EnvironmentSuffix, lambdaFunctions)

    // Create outputs
    createOutputs(stack, api, lambdaFunctions)

    return stack
}

func createLambdaFunctions(stack awscdk.Stack, environmentSuffix string) map[string]*LambdaFunction {
    functions := make(map[string]*LambdaFunction)

    // Hello Lambda function
    functions["hello"] = createLambdaFunction(stack, &LambdaConfig{
        Name:              "hello",
        FunctionName:      "hello-handler",
        CodePath:          "./lambda/hello",
        Handler:           "main",
        Description:       "Hello world Lambda function",
        EnvironmentSuffix: environmentSuffix,
        Environment: map[string]*string{
            "ENVIRONMENT": jsii.String(environmentSuffix),
            "LOG_LEVEL":   jsii.String("INFO"),
            "SERVICE":     jsii.String("hello-service"),
        },
    })

    // Users Lambda function
    functions["users"] = createLambdaFunction(stack, &LambdaConfig{
        Name:              "users",
        FunctionName:      "users-handler",
        CodePath:          "./lambda/users",
        Handler:           "main",
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

type LambdaConfig struct {
    Name              string
    FunctionName      string
    CodePath          string
    Handler           string
    Description       string
    EnvironmentSuffix string
    Environment       map[string]*string
}

func createLambdaFunction(stack awscdk.Stack, config *LambdaConfig) *LambdaFunction {
    // Create IAM role for Lambda
    role := awsiam.NewRole(stack, jsii.String(config.Name+"LambdaRole"), &awsiam.RoleProps{
        RoleName: jsii.String(config.FunctionName + "-role-" + config.EnvironmentSuffix),
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

    // Create Lambda function
    function := awslambda.NewFunction(stack, jsii.String(config.Name+"Lambda"), &awslambda.FunctionProps{
        FunctionName: jsii.String(config.FunctionName + "-" + config.EnvironmentSuffix),
        Runtime:      awslambda.Runtime_GO_1_X(),
        Code:         awslambda.Code_FromAsset(jsii.String(config.CodePath), nil),
        Handler:      jsii.String(config.Handler),
        MemorySize:   jsii.Number(256), // Exactly 256MB as requested
        Timeout:      awscdk.Duration_Seconds(jsii.Number(30)),
        Environment:  &environment,
        LogGroup:     logGroup,
        Role:         role,
        Architecture: awslambda.Architecture_X86_64(),
        Description:  jsii.String(config.Description + " (" + config.EnvironmentSuffix + ")"),
        
        // Production optimizations
        DeadLetterQueueEnabled:       jsii.Bool(true),
        ReservedConcurrentExecutions: jsii.Number(100), // Prevent runaway costs
        RetryAttempts:                jsii.Number(2),
        
        // Enable X-Ray tracing for better observability
        Tracing: awslambda.Tracing_ACTIVE,
    })

    // Add comprehensive tags
    awscdk.Tags_Of(function).Add(jsii.String("Environment"), jsii.String(config.EnvironmentSuffix), nil)
    awscdk.Tags_Of(function).Add(jsii.String("Service"), jsii.String("ServerlessApp"), nil)
    awscdk.Tags_Of(function).Add(jsii.String("Component"), jsii.String("Lambda"), nil)
    awscdk.Tags_Of(function).Add(jsii.String("FunctionType"), jsii.String(config.Name), nil)
    
    awscdk.Tags_Of(logGroup).Add(jsii.String("Environment"), jsii.String(config.EnvironmentSuffix), nil)
    awscdk.Tags_Of(logGroup).Add(jsii.String("Service"), jsii.String("ServerlessApp"), nil)
    awscdk.Tags_Of(logGroup).Add(jsii.String("Component"), jsii.String("Logging"), nil)
    
    awscdk.Tags_Of(role).Add(jsii.String("Environment"), jsii.String(config.EnvironmentSuffix), nil)
    awscdk.Tags_Of(role).Add(jsii.String("Service"), jsii.String("ServerlessApp"), nil)
    awscdk.Tags_Of(role).Add(jsii.String("Component"), jsii.String("IAM"), nil)

    return &LambdaFunction{
        Function: function,
        LogGroup: logGroup,
    }
}

func createApiGateway(stack awscdk.Stack, environmentSuffix string, lambdaFunctions map[string]*LambdaFunction) awsapigateway.RestApi {
    // Create CloudWatch Log Group for API Gateway
    logGroupName := jsii.String("/aws/apigateway/serverless-api-" + environmentSuffix)
    apiLogGroup := awslogs.NewLogGroup(stack, jsii.String("ApiLogGroup"), &awslogs.LogGroupProps{
        LogGroupName:  logGroupName,
        Retention:     awslogs.RetentionDays_ONE_MONTH,
        RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
    })

    // Create REST API
    api := awsapigateway.NewRestApi(stack, jsii.String("ServerlessApi"), &awsapigateway.RestApiProps{
        RestApiName: jsii.String("serverless-api-" + environmentSuffix),
        Description: jsii.String("Serverless API Gateway for " + environmentSuffix + " environment in US-West-2"),
        
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
                RequestId:      jsii.Bool(true),
            }),
            
            // Throttling settings for production
            ThrottleSettings: &awsapigateway.ThrottleSettings{
                RateLimit:  jsii.Number(1000), // requests per second
                BurstLimit: jsii.Number(2000), // burst capacity
            },
            
            // Stage variables
            Variables: &map[string]*string{
                "environment": jsii.String(environmentSuffix),
                "version":     jsii.String("v1"),
                "region":      jsii.String("us-west-2"),
            },
        },
    })

    // Create API routes
    createApiRoutes(api, lambdaFunctions)

    // Add comprehensive tags
    awscdk.Tags_Of(api).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
    awscdk.Tags_Of(api).Add(jsii.String("Service"), jsii.String("ServerlessApp"), nil)
    awscdk.Tags_Of(api).Add(jsii.String("Component"), jsii.String("ApiGateway"), nil)
    awscdk.Tags_Of(api).Add(jsii.String("Region"), jsii.String("us-west-2"), nil)
    
    awscdk.Tags_Of(apiLogGroup).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
    awscdk.Tags_Of(apiLogGroup).Add(jsii.String("Service"), jsii.String("ServerlessApp"), nil)
    awscdk.Tags_Of(apiLogGroup).Add(jsii.String("Component"), jsii.String("Logging"), nil)

    return api
}

func createApiRoutes(api awsapigateway.RestApi, lambdaFunctions map[string]*LambdaFunction) {
    // Health check endpoint
    healthResource := api.Root().AddResource(jsii.String("health"), nil)
    healthResource.AddMethod(jsii.String("GET"), awsapigateway.NewMockIntegration(&awsapigateway.MockIntegrationProps{
        IntegrationResponses: &[]*awsapigateway.IntegrationResponse{
            {
                StatusCode: jsii.String("200"),
                ResponseTemplates: &map[string]*string{
                    "application/json": jsii.String(`{
                        "status": "healthy",
                        "timestamp": "$context.requestTime",
                        "region": "us-west-2",
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
                ResponseHeaders: &map[string]*bool{
                    "Access-Control-Allow-Origin": jsii.Bool(true),
                    "Content-Type":                jsii.Bool(true),
                },
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
                    ResponseHeaders: &map[string]*bool{
                        "Access-Control-Allow-Origin": jsii.Bool(true),
                        "Content-Type":                jsii.Bool(true),
                        "X-Request-ID":                jsii.Bool(true),
                    },
                },
                {
                    StatusCode: jsii.String("500"),
                    ResponseHeaders: &map[string]*bool{
                        "Access-Control-Allow-Origin": jsii.Bool(true),
                        "Content-Type":                jsii.Bool(true),
                    },
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
                    ResponseHeaders: &map[string]*bool{
                        "Access-Control-Allow-Origin": jsii.Bool(true),
                        "Content-Type":                jsii.Bool(true),
                        "X-Request-ID":                jsii.Bool(true),
                    },
                },
                {
                    StatusCode: jsii.String("500"),
                    ResponseHeaders: &map[string]*bool{
                        "Access-Control-Allow-Origin": jsii.Bool(true),
                        "Content-Type":                jsii.Bool(true),
                    },
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
                    ResponseHeaders: &map[string]*bool{
                        "Access-Control-Allow-Origin": jsii.Bool(true),
                        "Content-Type":                jsii.Bool(true),
                        "X-Request-ID":                jsii.Bool(true),
                    },
                },
                {
                    StatusCode: jsii.String("400"),
                    ResponseHeaders: &map[string]*bool{
                        "Access-Control-Allow-Origin": jsii.Bool(true),
                        "Content-Type":                jsii.Bool(true),
                    },
                },
                {
                    StatusCode: jsii.String("404"),
                    ResponseHeaders: &map[string]*bool{
                        "Access-Control-Allow-Origin": jsii.Bool(true),
                        "Content-Type":                jsii.Bool(true),
                    },
                },
            },
        })
    }
}

func createOutputs(stack awscdk.Stack, api awsapigateway.RestApi, lambdaFunctions map[string]*LambdaFunction) {
    // API Gateway URL
    awscdk.NewCfnOutput(stack, jsii.String("ApiGatewayUrl"), &awscdk.CfnOutputProps{
        Value:       api.Url(),
        Description: jsii.String("API Gateway endpoint URL for US-West-2"),
        ExportName:  jsii.String("ServerlessApiUrl"),
    })

    // API Gateway ID
    awscdk.NewCfnOutput(stack, jsii.String("ApiGatewayId"), &awscdk.CfnOutputProps{
        Value:       api.RestApiId(),
        Description: jsii.String("API Gateway ID"),
        ExportName:  jsii.String("ServerlessApiId"),
    })

    // Lambda function ARNs and names
    for name, lambdaFunc := range lambdaFunctions {
        awscdk.NewCfnOutput(stack, jsii.String(name+"LambdaArn"), &awscdk.CfnOutputProps{
            Value:       lambdaFunc.Function.FunctionArn(),
            Description: jsii.String("ARN of the " + name + " Lambda function"),
            ExportName:  jsii.String(name + "LambdaArn"),
        })

        awscdk.NewCfnOutput(stack, jsii.String(name+"LambdaName"), &awscdk.CfnOutputProps{
            Value:       lambdaFunc.Function.FunctionName(),
            Description: jsii.String("Name of the " + name + " Lambda function"),
            ExportName:  jsii.String(name + "LambdaName"),
        })

        awscdk.NewCfnOutput(stack, jsii.String(name+"LogGroupName"), &awscdk.CfnOutputProps{
            Value:       lambdaFunc.LogGroup.LogGroupName(),
            Description: jsii.String("CloudWatch Log Group for " + name + " Lambda function"),
            ExportName:  jsii.String(name + "LogGroupName"),
        })
    }
}
```

## 4. Lambda Function Handlers

### Hello Handler (`lambda/hello/main.go`)

```go
package main

import (
    "context"
    "encoding/json"
    "log"
    "os"
    "time"

    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
)

type Response struct {
    StatusCode int               `json:"statusCode"`
    Headers    map[string]string `json:"headers"`
    Body       string            `json:"body"`
}

type HelloResponse struct {
    Message     string `json:"message"`
    RequestID   string `json:"requestId"`
    Path        string `json:"path"`
    Method      string `json:"method"`
    Environment string `json:"environment"`
    Region      string `json:"region"`
    Timestamp   string `json:"timestamp"`
    Service     string `json:"service"`
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (Response, error) {
    log.Printf("Processing request: %s %s from IP: %s", 
        request.HTTPMethod, request.Path, request.RequestContext.Identity.SourceIP)
    
    response := HelloResponse{
        Message:     "Hello from Serverless Lambda in US-West-2!",
        RequestID:   request.RequestContext.RequestID,
        Path:        request.Path,
        Method:      request.HTTPMethod,
        Environment: getEnv("ENVIRONMENT", "unknown"),
        Region:      "us-west-2",
        Timestamp:   time.Now().UTC().Format(time.RFC3339),
        Service:     getEnv("SERVICE", "hello-service"),
    }

    jsonResponse, err := json.Marshal(response)
    if err != nil {
        log.Printf("Error marshaling response: %v", err)
        return Response{
            StatusCode: 500,
            Headers: map[string]string{
                "Content-Type":                "application/json",
                "Access-Control-Allow-Origin": "*",
                "X-Request-ID":                request.RequestContext.RequestID,
            },
            Body: `{"error": "Internal server error"}`,
        }, nil
    }

    log.Printf("Successfully processed request %s", request.RequestContext.RequestID)
    return Response{
        StatusCode: 200,
        Headers: map[string]string{
            "Content-Type":                "application/json",
            "Access-Control-Allow-Origin": "*",
            "X-Request-ID":                request.RequestContext.RequestID,
        },
        Body: string(jsonResponse),
    }, nil
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}

func main() {
    lambda.Start(handler)
}
```

### Hello Handler Go Module (`lambda/hello/go.mod`)

```go
module hello

go 1.21

require github.com/aws/aws-lambda-go v1.41.0
```

### Users Handler (`lambda/users/main.go`)

```go
package main

import (
    "context"
    "encoding/json"
    "log"
    "os"
    "strconv"
    "time"

    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
)

type Response struct {
    StatusCode int               `json:"statusCode"`
    Headers    map[string]string `json:"headers"`
    Body       string            `json:"body"`
}

type User struct {
    ID        int       `json:"id"`
    Name      string    `json:"name"`
    Email     string    `json:"email"`
    CreatedAt time.Time `json:"createdAt"`
    Active    bool      `json:"active"`
    Region    string    `json:"region"`
}

type UsersResponse struct {
    Users       []User `json:"users"`
    Count       int    `json:"count"`
    RequestID   string `json:"requestId"`
    Environment string `json:"environment"`
    Region      string `json:"region"`
    Service     string `json:"service"`
}

type ErrorResponse struct {
    Error     string `json:"error"`
    RequestID string `json:"requestId"`
    Timestamp string `json:"timestamp"`
    Region    string `json:"region"`
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (Response, error) {
    log.Printf("Processing users request: %s %s from IP: %s", 
        request.HTTPMethod, request.Path, request.RequestContext.Identity.SourceIP)

    // Mock users data
    users := []User{
        {
            ID:        1,
            Name:      "John Doe",
            Email:     "john@example.com",
            CreatedAt: time.Now().AddDate(0, -2, 0),
            Active:    true,
            Region:    "us-west-2",
        },
        {
            ID:        2,
            Name:      "Jane Smith",
            Email:     "jane@example.com",
            CreatedAt: time.Now().AddDate(0, -1, -15),
            Active:    true,
            Region:    "us-west-2",
        },
        {
            ID:        3,
            Name:      "Bob Johnson",
            Email:     "bob@example.com",
            CreatedAt: time.Now().AddDate(0, 0, -5),
            Active:    false,
            Region:    "us-west-2",
        },
        {
            ID:        4,
            Name:      "Alice Wilson",
            Email:     "alice@example.com",
            CreatedAt: time.Now().AddDate(0, 0, -1),
            Active:    true,
            Region:    "us-west-2",
        },
    }

    // Handle specific user ID if provided
    if userID := request.PathParameters["id"]; userID != "" {
        log.Printf("Fetching user with ID: %s", userID)
        
        id, err := strconv.Atoi(userID)
        if err != nil {
            log.Printf("Invalid user ID format: %s", userID)
            errorResp := ErrorResponse{
                Error:     "Invalid user ID format",
                RequestID: request.RequestContext.RequestID,
                Timestamp: time