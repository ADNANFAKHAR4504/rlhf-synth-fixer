I'll help you create a comprehensive serverless infrastructure using AWS CDK with Go that meets all your requirements. This solution will be production-ready with proper logging, tagging, and best practices.

## Project Structure

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
│       │   ├── main.go
│       │   └── go.mod
│       └── users/
│           ├── main.go
│           └── go.mod
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
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-lambda:codeBundlingHashCheck": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true
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
    "log"
    "os"

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
    Timestamp   string `json:"timestamp"`
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (Response, error) {
    log.Printf("Processing request: %s %s from IP: %s", 
        request.HTTPMethod, request.Path, request.RequestContext.Identity.SourceIP)
    
    response := HelloResponse{
        Message:     "Hello from Serverless Lambda in US-West-2!",
        RequestID:   request.RequestContext.RequestID,
        Path:        request.Path,
        Method:      request.HTTPMethod,
        Environment: os.Getenv("ENVIRONMENT"),
        Timestamp:   request.RequestContext.RequestTime,
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

func main() {
    lambda.Start(handler)
}
```

### Hello Handler Go Module (`lambda/handlers/hello/go.mod`)

```go
module hello

go 1.21

require github.com/aws/aws-lambda-go v1.41.0
```

### Users Handler (`lambda/handlers/users/main.go`)

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
}

type UsersResponse struct {
    Users       []User `json:"users"`
    Count       int    `json:"count"`
    RequestID   string `json:"requestId"`
    Environment string `json:"environment"`
}

type ErrorResponse struct {
    Error     string `json:"error"`
    RequestID string `json:"requestId"`
    Timestamp string `json:"timestamp"`
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
        },
        {
            ID:        2,
            Name:      "Jane Smith",
            Email:     "jane@example.com",
            CreatedAt: time.Now().AddDate(0, -1, -15),
            Active:    true,
        },
        {
            ID:        3,
            Name:      "Bob Johnson",
            Email:     "bob@example.com",
            CreatedAt: time.Now().AddDate(0, 0, -5),
            Active:    false,
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
                Timestamp: time.Now().UTC().Format(time.RFC3339),
            }
            jsonResponse, _ := json.Marshal(errorResp)
            
            return Response{
                StatusCode: 400,
                Headers: map[string]string{
                    "Content-Type":                "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "X-Request-ID":                request.RequestContext.RequestID,
                },
                Body: string(jsonResponse),
            }, nil
        }

        for _, user := range users {
            if user.ID == id {
                log.Printf("Found user: %s (ID: %d)", user.Name, user.ID)
                jsonResponse, _ := json.Marshal(user)
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
        }

        log.Printf("User not found with ID: %d", id)
        errorResp := ErrorResponse{
            Error:     "User not found",
            RequestID: request.RequestContext.RequestID,
            Timestamp: time.Now().UTC().Format(time.RFC3339),
        }
        jsonResponse, _ := json.Marshal(errorResp)

        return Response{
            StatusCode: 404,
            Headers: map[string]string{
                "Content-Type":                "application/json",
                "Access-Control-Allow-Origin": "*",
                "X-Request-ID":                request.RequestContext.RequestID,
            },
            Body: string(jsonResponse),
        }, nil
    }

    // Return all users
    response := UsersResponse{
        Users:       users,
        Count:       len(users),
        RequestID:   request.RequestContext.RequestID,
        Environment: os.Getenv("ENVIRONMENT"),
    }

    jsonResponse, err := json.Marshal(response)
    if err != nil {
        log.Printf("Error marshaling response: %v", err)
        errorResp := ErrorResponse{
            Error:     "Internal server error",
            RequestID: request.RequestContext.RequestID,
            Timestamp: time.Now().UTC().Format(time.RFC3339),
        }
        jsonError, _ := json.Marshal(errorResp)
        
        return Response{
            StatusCode: 500,
            Headers: map[string]string{
                "Content-Type":                "application/json",
                "Access-Control-Allow-Origin": "*",
                "X-Request-ID":                request.RequestContext.RequestID,
            },
            Body: string(jsonError),
        }, nil
    }

    log.Printf("Successfully returned %d users for request %s", len(users), request.RequestContext.RequestID)
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

func main() {
    lambda.Start(handler)
}
```

### Users Handler Go Module (`lambda/handlers/users/go.mod`)

```go
module users

go 1.21

require github.com/aws/aws-lambda-go v1.41.0
```

## 4. Lambda Construct (`internal/constructs/lambda_construct.go`)

```go
package constructs

import (
    "github.com/aws/aws-cdk-go/awscdk/v2"
    "github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
    "github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
    "github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
)

type LambdaConstructProps struct {
    FunctionName      string
    CodePath          string
    Handler           string
    Environment       map[string]*string
    EnvironmentSuffix string
    Description       string
}

type LambdaConstruct struct {
    constructs.Construct
    Function awslambda.Function
    LogGroup awslogs.LogGroup
    Role     awsiam.Role
}

func NewLambdaConstruct(scope constructs.Construct, id *string, props *LambdaConstructProps) *LambdaConstruct {
    this := &LambdaConstruct{}
    this.Construct = constructs.NewConstruct(scope, id)

    // Create IAM role for Lambda
    this.Role = awsiam.NewRole(this, jsii.String("LambdaRole"), &awsiam.RoleProps{
        RoleName: jsii.String(props.FunctionName + "-role-" + props.EnvironmentSuffix),
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
                },
            }),
        },
    })

    // Create CloudWatch Log Group with retention
    logGroupName := jsii.String("/aws/lambda/" + props.FunctionName + "-" + props.EnvironmentSuffix)
    this.LogGroup = awslogs.NewLogGroup(this, jsii.String("LogGroup"), &awslogs.LogGroupProps{
        LogGroupName:  logGroupName,
        Retention:     awslogs.RetentionDays_ONE_MONTH,
        RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
    })

    // Add environment variables with defaults
    environment := make(map[string]*string)
    for k, v := range props.Environment {
        environment[k] = v
    }
    // Add default environment variables
    environment["AWS_LAMBDA_LOG_LEVEL"] = jsii.String("INFO")
    environment["POWERTOOLS_SERVICE_NAME"] = jsii.String(props.FunctionName)

    // Create Lambda function with optimized settings
    this.Function = awslambda.NewFunction(this, jsii.String("Function"), &awslambda.FunctionProps{
        FunctionName: jsii.String(props.FunctionName + "-" + props.EnvironmentSuffix),
        Runtime:      awslambda.Runtime_GO_1_X(),
        Code:         awslambda.Code_FromAsset(jsii.String(props.CodePath), nil),
        Handler:      jsii.String(props.Handler),
        MemorySize:   jsii.Number(256), // Exactly 256MB as requested
        Timeout:      awscdk.Duration_Seconds(jsii.Number(30)),
        Environment:  &environment,
        LogGroup:     this.LogGroup,
        Role:         this.Role,
        Architecture: awslambda.Architecture_X86_64(),
        Description:  jsii.String(props.Description),
        
        // Production optimizations
        DeadLetterQueueEnabled:       jsii.Bool(true),
        ReservedConcurrentExecutions: jsii.Number(100), // Prevent runaway costs
        RetryAttempts:                jsii.Number(2),
        
        // Tracing for better observability
        Tracing: awslambda.Tracing_ACTIVE,
    })

    // Add comprehensive tags
    awscdk.Tags_Of(this.Function).Add(jsii.String("Environment"), jsii.String(props.EnvironmentSuffix), nil)
    awscdk.Tags_Of(this.Function).Add(jsii.String("Service"), jsii.String("ServerlessApp"), nil)
    awscdk.Tags_Of(this.Function).Add(jsii.String("Component"), jsii.String("Lambda"), nil)
    awscdk.Tags_Of(this.Function).Add(jsii.String("ManagedBy"), jsii.String("CDK"), nil)
    
    awscdk.Tags_Of(this.LogGroup).Add(jsii.String("Environment"), jsii.String(props.EnvironmentSuffix), nil)
    awscdk.Tags_Of(this.LogGroup).Add(jsii.String("Service"), jsii.String("ServerlessApp"), nil)
    awscdk.Tags_Of(this.LogGroup).Add(jsii.String("Component"), jsii.String("Logging"), nil)
    
    awscdk.Tags_Of(this.Role).Add(jsii.String("Environment"), jsii.String(props.EnvironmentSuffix), nil)
    awscdk.Tags_Of(this.Role).Add(jsii.String("Service"), jsii.String("ServerlessApp"), nil)
    awscdk.Tags_Of(this.Role).Add(jsii.String("Component"), jsii.String("IAM"), nil)

    return this
}

func (l *LambdaConstruct) GetFunction() awslambda.Function {
    return l.Function
}

func (l *LambdaConstruct) GetLogGroup() awslogs.LogGroup {
    return l.LogGroup
}

func (l *LambdaConstruct) GetRole() awsiam.Role {
    return l.Role
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
    Description       string
}

type ApiGatewayConstruct struct {
    constructs.Construct
    Api         awsapigateway.RestApi
    LogGroup    awslogs.LogGroup
    Deployment  awsapigateway.Deployment
    Stage       awsapigateway.Stage
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

    // Create REST API with comprehensive configuration
    this.Api = awsapigateway.NewRestApi(this, jsii.String("RestApi"), &awsapigateway.RestApiProps{
        RestApiName: jsii.String(props.ApiName + "-" + props.EnvironmentSuffix),
        Description: jsii.String(props.Description + " (" + props.EnvironmentSuffix + " environment)"),
        
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
        
        // Disable default deployment to create custom stage
        Deploy: jsii.Bool(false),
        
        // API Gateway policy for security
        Policy: this.createApiPolicy(),
    })

    // Create routes and integrations
    this.createRoutes(props.LambdaFunctions)

    // Create custom deployment
    this.Deployment = awsapigateway.NewDeployment(this, jsii.String("Deployment"), &awsapigateway.DeploymentProps{
        Api: this.Api,
    })

    // Create custom stage with detailed logging
    this.Stage = awsapigateway.NewStage(this, jsii.String("Stage"), &awsapigateway.StageProps{
        Deployment: this.Deployment,
        StageName:  jsii.String(props.EnvironmentSuffix),
        
        // Comprehensive logging configuration
        LoggingLevel:     awsapigateway.MethodLoggingLevel_INFO,
        DataTraceEnabled: jsii.Bool(true),
        MetricsEnabled:   jsii.Bool(true),
        
        // Access logging
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
            RequestId:      jsii.Bool(true),
        }),
        
        // Throttling settings for production
        ThrottleSettings: &awsapigateway.ThrottleSettings{
            RateLimit:  jsii.Number(1000), // requests per second
            BurstLimit: jsii.Number(2000), // burst capacity
        },
        
        // Stage variables
        Variables: &map[string]*string{
            "environment": jsii.String(props.EnvironmentSuffix),
            "version":     jsii.String("v1"),
        },
    })

    // Add comprehensive tags
    awscdk.Tags_Of(this.Api).Add(jsii.String("Environment"), jsii.String(props.EnvironmentSuffix), nil)
    awscdk.Tags_Of(this.Api).Add(jsii.String("Service"), jsii.String("ServerlessApp"), nil)
    awscdk.Tags_Of(this.Api).Add(jsii.String("Component"), jsii.String("ApiGateway"), nil)
    awscdk.Tags_Of(this.Api).Add(jsii.String("ManagedBy"), jsii.String("CDK"), nil)
    
    awscdk.Tags_Of(this.LogGroup).Add(jsii.String("Environment"), jsii.String(props.EnvironmentSuffix), nil)
    awscdk.Tags_Of(this.LogGroup).Add(jsii.String("Service"), jsii.String("ServerlessApp"), nil)
    awscdk.Tags_Of(this.LogGroup).Add(jsii.String("Component"), jsii.String("Logging"), nil)

    return this
}

func (a *ApiGatewayConstruct) createApiPolicy() awsapigateway.PolicyDocument {
    return awsapigateway.NewPolicyDocument(&awsapigateway.PolicyDocumentProps{
        Statements: &[]awsapigateway.PolicyStatement{
            awsapigateway.NewPolicyStatement(&awsapigateway.PolicyStatementProps{
                Effect: awsapigateway.Effect_ALLOW,
                Principals: &[]awsapigateway.IPrincipal{
                    awsapigateway.NewAnyPrincipal(),
                },
                Actions: &[]*string{
                    jsii.String("execute-api:Invoke"),
                },
                Resources: &[]*string{
                    jsii.String("*"),
                },
            }),
        },
    })
}

func (a *ApiGatewayConstruct) createRoutes(lambdaFunctions map[string]awslambda.Function) {
    // Health check endpoint
    healthResource := a.Api.Root().AddResource(jsii.String("health"), nil)
    healthResource.AddMethod(jsii.String("GET"), awsapigateway.NewMockIntegration(&awsapigateway.MockIntegrationProps{
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
                ResponseHeaders: &map[string]*bool{
                    "Access-Control-Allow-Origin": jsii.Bool(true),
                    "Content-Type":                jsii.Bool(true),
                },
            },
        },
    })

    // Hello endpoint
    if helloFunction, exists := lambdaFunctions["hello"]; exists {
        helloIntegration := awsapigateway.NewLambdaIntegration(helloFunction, &awsapigateway.LambdaIntegrationOptions{
            Proxy: jsii.Bool(true),
            IntegrationResponses: &[]*awsapigateway.IntegrationResponse{
                {
                    StatusCode: jsii.String("200"),
                    ResponseHeaders: &map[string]*string{
                        "Access-Control-Allow-Origin": jsii.String("'*'"),
                    },
                },
            },
        })

        helloResource := a.Api.Root().AddResource(jsii.String("hello"), nil)
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
    if usersFunction, exists := lambdaFunctions["users"]; exists {
        usersIntegration := awsapigateway.NewLambdaIntegration(usersFunction, &awsapigateway.LambdaIntegrationOptions{
            Proxy: jsii.Bool(true),
            IntegrationResponses: &[]*awsapigateway.IntegrationResponse{
                {
                    StatusCode: jsii.String("200"),
                    ResponseHeaders: &map[string]*string{
                        "Access-Control-Allow-Origin": jsii.String("'*'"),
                    },
                },
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

func (a *ApiGatewayConstruct) GetApi() awsapigateway.RestApi {
    return a.Api
}

func (a *ApiGatewayConstruct) GetLogGroup() awslogs.LogGroup {
    return a.LogGroup