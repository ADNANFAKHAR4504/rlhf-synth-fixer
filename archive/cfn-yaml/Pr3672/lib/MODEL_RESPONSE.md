Reasoning Trace
Let's break down this request and create a comprehensive CloudFormation template for a language learning application.

First, I'll organize the template structure:

AWSTemplateFormatVersion and Description
Parameters for customizable inputs
Mappings if needed for region-specific settings
Resources section (bulk of the template)
Core Application Services
AI/ML Services Integration
Storage and Content Delivery
Notification and Scheduling
Monitoring and Analytics
Security and Access Management
Outputs for important resource references

Let's start building the template:

### Reasoning Trace
---

Let's break down this request and create a comprehensive CloudFormation template for a language learning application.

First, I'll organize the template structure:

1. AWSTemplateFormatVersion and Description
2. Parameters for customizable inputs
3. Mappings if needed for region-specific settings
4. Resources section (bulk of the template)
   - Core Application Services
   - AI/ML Services Integration
   - Storage and Content Delivery
   - Notification and Scheduling
   - Monitoring and Analytics
   - Security and Access Management
5. Outputs for important resource references

Let's start building the template:

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "CloudFormation template for Language Learning Application supporting 6,000 students across 20 languages",
  
  "Parameters": {
    "Environment": {
      "Description": "Environment type",
      "Type": "String",
      "Default": "Production",
      "AllowedValues": ["Development", "Testing", "Production"],
      "ConstraintDescription": "Must be a valid environment type"
    },
    "PythonRuntime": {
      "Description": "Python runtime for Lambda functions",
      "Type": "String",
      "Default": "python3.10",
      "AllowedValues": ["python3.8", "python3.9", "python3.10"],
      "ConstraintDescription": "Must be a supported Python runtime"
    },
    "ApiStageName": {
      "Description": "Stage name for the API Gateway deployment",
      "Type": "String",
      "Default": "v1"
    },
    "LogRetentionInDays": {
      "Description": "Number of days to retain CloudWatch logs",
      "Type": "Number",
      "Default": 30,
      "AllowedValues": [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653]
    }
  },

  "Resources": {
    // Resources will be defined here
  },

  "Outputs": {
    // Outputs will be defined here
  }
}
```

Now, let's define the resources according to the requirements:

1. Core Application Services:
   - API Gateway
   - Lambda Functions
   - DynamoDB Tables

2. AI/ML Services Integration:
   - Amazon Transcribe (through IAM permissions)
   - Amazon Polly (through IAM permissions)
   - Amazon Translate (through IAM permissions)
   - Amazon Comprehend (through IAM permissions)
   - Amazon Personalize (through IAM permissions)

3. Storage and Content Delivery:
   - S3 Buckets
   - CloudFront Distribution

4. Notification and Scheduling:
   - EventBridge Rules
   - SNS Topics

5. Monitoring and Analytics:
   - CloudWatch Dashboards
   - CloudWatch Alarms

6. Security and Access Management:
   - IAM Roles
   - VPC Endpoints
   - WAF for API Gateway
   - Secrets Manager

Let's build each section one by one.

Let's start with the Core Application Services:

```json
"Resources": {
  "ApiGateway": {
    "Type": "AWS::ApiGateway::RestApi",
    "Properties": {
      "Name": "LanguageLearningApi",
      "Description": "API for Language Learning Application",
      "EndpointConfiguration": {
        "Types": ["REGIONAL"]
      },
      "ApiKeySourceType": "HEADER",
      "MinimumCompressionSize": 1024
    }
  },
  
  "ApiGatewayDeployment": {
    "Type": "AWS::ApiGateway::Deployment",
    "DependsOn": [
      "LessonResource",
      "UserProgressResource",
      "SpeechRecognitionResource",
      "GrammarAnalysisResource",
      "RecommendationsResource"
    ],
    "Properties": {
      "RestApiId": {"Ref": "ApiGateway"},
      "Description": "Initial deployment of the API"
    }
  },
  
  "ApiGatewayStage": {
    "Type": "AWS::ApiGateway::Stage",
    "Properties": {
      "RestApiId": {"Ref": "ApiGateway"},
      "DeploymentId": {"Ref": "ApiGatewayDeployment"},
      "StageName": {"Ref": "ApiStageName"},
      "MethodSettings": [
        {
          "HttpMethod": "*",
          "ResourcePath": "/*",
          "ThrottlingBurstLimit": 7000,
          "ThrottlingRateLimit": 6000
        }
      ],
      "AccessLogSetting": {
        "DestinationArn": {"Fn::GetAtt": ["ApiGatewayAccessLogGroup", "Arn"]},
        "Format": "{\"requestId\":\"$context.requestId\",\"ip\":\"$context.identity.sourceIp\",\"requestTime\":\"$context.requestTime\",\"httpMethod\":\"$context.httpMethod\",\"routeKey\":\"$context.routeKey\",\"status\":\"$context.status\",\"protocol\":\"$context.protocol\",\"responseLength\":\"$context.responseLength\"}"
      }
    }
  },
  
  "ApiGatewayAccessLogGroup": {
    "Type": "AWS::Logs::LogGroup",
    "Properties": {
      "LogGroupName": {"Fn::Sub": "/aws/apigateway/${ApiGateway}/access-logs"},
      "RetentionInDays": {"Ref": "LogRetentionInDays"}
    }
  },

  "ApiGatewayCorsResponse": {
    "Type": "AWS::ApiGateway::GatewayResponse",
    "Properties": {
      "RestApiId": {"Ref": "ApiGateway"},
      "ResponseType": "DEFAULT_4XX",
      "ResponseParameters": {
        "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
        "gatewayresponse.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        "gatewayresponse.header.Access-Control-Allow-Methods": "'GET,POST,PUT,DELETE,OPTIONS'"
      }
    }
  }
}
```

Now, let's define the API Gateway resources and methods:

```json
"LessonResource": {
  "Type": "AWS::ApiGateway::Resource",
  "Properties": {
    "RestApiId": {"Ref": "ApiGateway"},
    "ParentId": {"Fn::GetAtt": ["ApiGateway", "RootResourceId"]},
    "PathPart": "lessons"
  }
},

"LessonGetMethod": {
  "Type": "AWS::ApiGateway::Method",
  "Properties": {
    "RestApiId": {"Ref": "ApiGateway"},
    "ResourceId": {"Ref": "LessonResource"},
    "HttpMethod": "GET",
    "AuthorizationType": "COGNITO_USER_POOLS",
    "AuthorizerId": {"Ref": "ApiGatewayCognitoAuthorizer"},
    "Integration": {
      "Type": "AWS_PROXY",
      "IntegrationHttpMethod": "POST",
      "Uri": {"Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LessonDeliveryFunction.Arn}/invocations"}
    }
  }
},

"UserProgressResource": {
  "Type": "AWS::ApiGateway::Resource",
  "Properties": {
    "RestApiId": {"Ref": "ApiGateway"},
    "ParentId": {"Fn::GetAtt": ["ApiGateway", "RootResourceId"]},
    "PathPart": "progress"
  }
},

"UserProgressGetMethod": {
  "Type": "AWS::ApiGateway::Method",
  "Properties": {
    "RestApiId": {"Ref": "ApiGateway"},
    "ResourceId": {"Ref": "UserProgressResource"},
    "HttpMethod": "GET",
    "AuthorizationType": "COGNITO_USER_POOLS",
    "AuthorizerId": {"Ref": "ApiGatewayCognitoAuthorizer"},
    "Integration": {
      "Type": "AWS_PROXY",
      "IntegrationHttpMethod": "POST",
      "Uri": {"Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${UserProgressFunction.Arn}/invocations"}
    }
  }
},

"SpeechRecognitionResource": {
  "Type": "AWS::ApiGateway::Resource",
  "Properties": {
    "RestApiId": {"Ref": "ApiGateway"},
    "ParentId": {"Fn::GetAtt": ["ApiGateway", "RootResourceId"]},
    "PathPart": "speech"
  }
},

"SpeechRecognitionPostMethod": {
  "Type": "AWS::ApiGateway::Method",
  "Properties": {
    "RestApiId": {"Ref": "ApiGateway"},
    "ResourceId": {"Ref": "SpeechRecognitionResource"},
    "HttpMethod": "POST",
    "AuthorizationType": "COGNITO_USER_POOLS",
    "AuthorizerId": {"Ref": "ApiGatewayCognitoAuthorizer"},
    "Integration": {
      "Type": "AWS_PROXY",
      "IntegrationHttpMethod": "POST",
      "Uri": {"Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${SpeechRecognitionFunction.Arn}/invocations"}
    }
  }
},

"GrammarAnalysisResource": {
  "Type": "AWS::ApiGateway::Resource",
  "Properties": {
    "RestApiId": {"Ref": "ApiGateway"},
    "ParentId": {"Fn::GetAtt": ["ApiGateway", "RootResourceId"]},
    "PathPart": "grammar"
  }
},

"GrammarAnalysisPostMethod": {
  "Type": "AWS::ApiGateway::Method",
  "Properties": {
    "RestApiId": {"Ref": "ApiGateway"},
    "ResourceId": {"Ref": "GrammarAnalysisResource"},
    "HttpMethod": "POST",
    "AuthorizationType": "COGNITO_USER_POOLS",
    "AuthorizerId": {"Ref": "ApiGatewayCognitoAuthorizer"},
    "Integration": {
      "Type": "AWS_PROXY",
      "IntegrationHttpMethod": "POST",
      "Uri": {"Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${GrammarAnalysisFunction.Arn}/invocations"}
    }
  }
},

"RecommendationsResource": {
  "Type": "AWS::ApiGateway::Resource",
  "Properties": {
    "RestApiId": {"Ref": "ApiGateway"},
    "ParentId": {"Fn::GetAtt": ["ApiGateway", "RootResourceId"]},
    "PathPart": "recommendations"
  }
},

"RecommendationsGetMethod": {
  "Type": "AWS::ApiGateway::Method",
  "Properties": {
    "RestApiId": {"Ref": "ApiGateway"},
    "ResourceId": {"Ref": "RecommendationsResource"},
    "HttpMethod": "GET",
    "AuthorizationType": "COGNITO_USER_POOLS",
    "AuthorizerId": {"Ref": "ApiGatewayCognitoAuthorizer"},
    "Integration": {
      "Type": "AWS_PROXY",
      "IntegrationHttpMethod": "POST",
      "Uri": {"Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${RecommendationsFunction.Arn}/invocations"}
    }
  }
}
```

Now, let's define the Lambda functions:

```json
"LessonDeliveryFunction": {
  "Type": "AWS::Lambda::Function",
  "Properties": {
    "FunctionName": "LessonDeliveryFunction",
    "Handler": "index.handler",
    "Role": {"Fn::GetAtt": ["LessonDeliveryFunctionRole", "Arn"]},
    "Code": {
      "ZipFile": "exports.handler = async (event) => {\n  return {\n    statusCode: 200,\n    body: JSON.stringify({ message: 'Lesson delivery function' }),\n  };\n};"
    },
    "Runtime": {"Ref": "PythonRuntime"},
    "Timeout": 30,
    "MemorySize": 512,
    "Environment": {
      "Variables": {
        "LESSONS_TABLE": {"Ref": "LessonsTable"}
      }
    },
    "DeadLetterConfig": {
      "TargetArn": {"Ref": "LessonDeliveryDLQ"}
    },
    "TracingConfig": {
      "Mode": "Active"
    },
    "Tags": [
      {
        "Key": "Application",
        "Value": "LanguageLearningApp"
      }
    ]
  }
},

"LessonDeliveryDLQ": {
  "Type": "AWS::SQS::Queue",
  "Properties": {
    "QueueName": "LessonDeliveryDLQ",
    "MessageRetentionPeriod": 1209600,
    "VisibilityTimeout": 60
  }
},

"LessonDeliveryFunctionRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "AssumeRolePolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
    ],
    "Policies": [
      {
        "PolicyName": "LessonDeliveryFunctionPolicy",
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "dynamodb:GetItem",
                "dynamodb:Query",
                "dynamodb:Scan"
              ],
              "Resource": [
                {"Fn::GetAtt": ["LessonsTable", "Arn"]},
                {"Fn::Sub": "${LessonsTable.Arn}/index/*"}
              ]
            },
            {
              "Effect": "Allow",
              "Action": [
                "sqs:SendMessage"
              ],
              "Resource": {"Fn::GetAtt": ["LessonDeliveryDLQ", "Arn"]}
            }
          ]
        }
      }
    ]
  }
},

"UserProgressFunction": {
  "Type": "AWS::Lambda::Function",
  "Properties": {
    "FunctionName": "UserProgressFunction",
    "Handler": "index.handler",
    "Role": {"Fn::GetAtt": ["UserProgressFunctionRole", "Arn"]},
    "Code": {
      "ZipFile": "exports.handler = async (event) => {\n  return {\n    statusCode: 200,\n    body: JSON.stringify({ message: 'User progress function' }),\n  };\n};"
    },
    "Runtime": {"Ref": "PythonRuntime"},
    "Timeout": 30,
    "MemorySize": 512,
    "Environment": {
      "Variables": {
        "USER_PROGRESS_TABLE": {"Ref": "UserProgressTable"}
      }
    },
    "DeadLetterConfig": {
      "TargetArn": {"Ref": "UserProgressDLQ"}
    },
    "TracingConfig": {
      "Mode": "Active"
    },
    "Tags": [
      {
        "Key": "Application",
        "Value": "LanguageLearningApp"
      }
    ]
  }
},

"UserProgressDLQ": {
  "Type": "AWS::SQS::Queue",
  "Properties": {
    "QueueName": "UserProgressDLQ",
    "MessageRetentionPeriod": 1209600,
    "VisibilityTimeout": 60
  }
},

"UserProgressFunctionRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "AssumeRolePolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
    ],
    "Policies": [
      {
        "PolicyName": "UserProgressFunctionPolicy",
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "dynamodb:GetItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem"
              ],
              "Resource": [
                {"Fn::GetAtt": ["UserProgressTable", "Arn"]},
                {"Fn::Sub": "${UserProgressTable.Arn}/index/*"}
              ]
            },
            {
              "Effect": "Allow",
              "Action": [
                "sqs:SendMessage"
              ],
              "Resource": {"Fn::GetAtt": ["UserProgressDLQ", "Arn"]}
            }
          ]
        }
      }
    ]
  }
},

"SpeechRecognitionFunction": {
  "Type": "AWS::Lambda::Function",
  "Properties": {
    "FunctionName": "SpeechRecognitionFunction",
    "Handler": "index.handler",
    "Role": {"Fn::GetAtt": ["SpeechRecognitionFunctionRole", "Arn"]},
    "Code": {
      "ZipFile": "exports.handler = async (event) => {\n  return {\n    statusCode: 200,\n    body: JSON.stringify({ message: 'Speech recognition function' }),\n  };\n};"
    },
    "Runtime": {"Ref": "PythonRuntime"},
    "Timeout": 60,
    "MemorySize": 1024,
    "Environment": {
      "Variables": {
        "AUDIO_BUCKET": {"Ref": "AudioBucket"}
      }
    },
    "DeadLetterConfig": {
      "TargetArn": {"Ref": "SpeechRecognitionDLQ"}
    },
    "TracingConfig": {
      "Mode": "Active"
    },
    "Tags": [
      {
        "Key": "Application",
        "Value": "LanguageLearningApp"
      }
    ]
  }
},

"SpeechRecognitionDLQ": {
  "Type": "AWS::SQS::Queue",
  "Properties": {
    "QueueName": "SpeechRecognitionDLQ",
    "MessageRetentionPeriod": 1209600,
    "VisibilityTimeout": 60
  }
},

"SpeechRecognitionFunctionRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "AssumeRolePolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
    ],
    "Policies": [
      {
        "PolicyName": "SpeechRecognitionFunctionPolicy",
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "s3:GetObject",
                "s3:PutObject"
              ],
              "Resource": [
                {"Fn::Sub": "arn:aws:s3:::${AudioBucket}/*"}
              ]
            },
            {
              "Effect": "Allow",
              "Action": [
                "transcribe:StartTranscriptionJob",
                "transcribe:GetTranscriptionJob"
              ],
              "Resource": "*"
            },
            {
              "Effect": "Allow",
              "Action": [
                "sqs:SendMessage"
              ],
              "Resource": {"Fn::GetAtt": ["SpeechRecognitionDLQ", "Arn"]}
            }
          ]
        }
      }
    ]
  }
},

"GrammarAnalysisFunction": {
  "Type": "AWS::Lambda::Function",
  "Properties": {
    "FunctionName": "GrammarAnalysisFunction",
    "Handler": "index.handler",
    "Role": {"Fn::GetAtt": ["GrammarAnalysisFunctionRole", "Arn"]},
    "Code": {
      "ZipFile": "exports.handler = async (event) => {\n  return {\n    statusCode: 200,\n    body: JSON.stringify({ message: 'Grammar analysis function' }),\n  };\n};"
    },
    "Runtime": {"Ref": "PythonRuntime"},
    "Timeout": 30,
    "MemorySize": 512,
    "Environment": {
      "Variables": {
        "USER_PROGRESS_TABLE": {"Ref": "UserProgressTable"}
      }
    },
    "DeadLetterConfig": {
      "TargetArn": {"Ref": "GrammarAnalysisDLQ"}
    },
    "TracingConfig": {
      "Mode": "Active"
    },
    "Tags": [
      {
        "Key": "Application",
        "Value": "LanguageLearningApp"
      }
    ]
  }
},

"GrammarAnalysisDLQ": {
  "Type": "AWS::SQS::Queue",
  "Properties": {
    "QueueName": "GrammarAnalysisDLQ",
    "MessageRetentionPeriod": 1209600,
    "VisibilityTimeout": 60
  }
},

"GrammarAnalysisFunctionRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "AssumeRolePolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
    ],
    "Policies": [
      {
        "PolicyName": "GrammarAnalysisFunctionPolicy",
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "comprehend:DetectSyntax",
                "comprehend:DetectDominantLanguage"
              ],
              "Resource": "*"
            },
            {
              "Effect": "Allow",
              "Action": [
                "dynamodb:UpdateItem"
              ],
              "Resource": {"Fn::GetAtt": ["UserProgressTable", "Arn"]}
            },
            {
              "Effect": "Allow",
              "Action": [
                "sqs:SendMessage"
              ],
              "Resource": {"Fn::GetAtt": ["GrammarAnalysisDLQ", "Arn"]}
            }
          ]
        }
      }
    ]
  }
},

"RecommendationsFunction": {
  "Type": "AWS::Lambda::Function",
  "Properties": {
    "FunctionName": "RecommendationsFunction",
    "Handler": "index.handler",
    "Role": {"Fn::GetAtt": ["RecommendationsFunctionRole", "Arn"]},
    "Code": {
      "ZipFile": "exports.handler = async (event) => {\n  return {\n    statusCode: 200,\n    body: JSON.stringify({ message: 'Recommendations function' }),\n  };\n};"
    },
    "Runtime": {"Ref": "PythonRuntime"},
    "Timeout": 30,
    "MemorySize": 512,
    "Environment": {
      "Variables": {
        "USER_PROGRESS_TABLE": {"Ref": "UserProgressTable"},
        "LESSONS_TABLE": {"Ref": "LessonsTable"}
      }
    },
    "DeadLetterConfig": {
      "TargetArn": {"Ref": "RecommendationsDLQ"}
    },
    "TracingConfig": {
      "Mode": "Active"
    },
    "Tags": [
      {
        "Key": "Application",
        "Value": "LanguageLearningApp"
      }
    ]
  }
},

"RecommendationsDLQ": {
  "Type": "AWS::SQS::Queue",
  "Properties": {
    "QueueName": "RecommendationsDLQ",
    "MessageRetentionPeriod": 1209600,
    "VisibilityTimeout": 60
  }
},

"RecommendationsFunctionRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "AssumeRolePolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
    ],
    "Policies": [
      {
        "PolicyName": "RecommendationsFunctionPolicy",
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "dynamodb:GetItem",
                "dynamodb:Query",
                "dynamodb:Scan"
              ],
              "Resource": [
                {"Fn::GetAtt": ["UserProgressTable", "Arn"]},
                {"Fn::GetAtt": ["LessonsTable", "Arn"]},
                {"Fn::Sub": "${UserProgressTable.Arn}/index/*"},
                {"Fn::Sub": "${LessonsTable.Arn}/index/*"}
              ]
            },
            {
              "Effect": "Allow",
              "Action": [
                "personalize:GetRecommendations"
              ],
              "Resource": "*"
            },
            {
              "Effect": "Allow",
              "Action": [
                "sqs:SendMessage"
              ],
              "Resource": {"Fn::GetAtt": ["RecommendationsDLQ", "Arn"]}
            }
          ]
        }
      }
    ]
  }
}
```

Now let's define the DynamoDB tables:

```json
"LessonsTable": {
  "Type": "AWS::DynamoDB::Table",
  "Properties": {
    "TableName": "LessonsTable",
    "AttributeDefinitions": [
      {
        "AttributeName": "LessonId",
        "AttributeType": "S"
      },
      {
        "AttributeName": "Language",
        "AttributeType": "S"
      },
      {
        "AttributeName": "DifficultyLevel",
        "AttributeType": "N"
      }
    ],
    "KeySchema": [
      {
        "AttributeName": "LessonId",
        "KeyType": "HASH"
      }
    ],
    "GlobalSecondaryIndexes": [
      {
        "IndexName": "LanguageIndex",
        "KeySchema": [
          {
            "AttributeName": "Language",
            "KeyType": "HASH"
          }
        ],
        "Projection": {
          "ProjectionType": "ALL"
        }
      },
      {
        "IndexName": "DifficultyIndex",
        "KeySchema": [
          {
            "AttributeName": "DifficultyLevel",
            "KeyType": "HASH"
          }
        ],
        "Projection": {
          "ProjectionType": "ALL"
        }
      }
    ],
    "BillingMode": "PAY_PER_REQUEST",
    "PointInTimeRecoverySpecification": {
      "PointInTimeRecoveryEnabled": true
    },
    "SSESpecification": {
      "SSEEnabled": true
    },
    "Tags": [
      {
        "Key": "Application",
        "Value": "LanguageLearningApp"
      }
    ]
  }
},

"UserProgressTable": {
  "Type": "AWS::DynamoDB::Table",
  "Properties": {
    "TableName": "UserProgressTable",
    "AttributeDefinitions": [
      {
        "AttributeName": "UserId",
        "AttributeType": "S"
      },
      {
        "AttributeName": "Language",
        "AttributeType": "S"
      },
      {
        "AttributeName": "ProgressLevel",
        "AttributeType": "N"
      }
    ],
    "KeySchema": [
      {
        "AttributeName": "UserId",
        "KeyType": "HASH"
      },
      {
        "AttributeName": "Language",
        "KeyType": "RANGE"
      }
    ],
    "GlobalSecondaryIndexes": [
      {
        "IndexName": "ProgressLevelIndex",
        "KeySchema": [
          {
            "AttributeName": "ProgressLevel",
            "KeyType": "HASH"
          }
        ],
        "Projection": {
          "ProjectionType": "ALL"
        }
      }
    ],
    "BillingMode": "PAY_PER_REQUEST",
    "PointInTimeRecoverySpecification": {
      "PointInTimeRecoveryEnabled": true
    },
    "SSESpecification": {
      "SSEEnabled": true
    },
    "Tags": [
      {
        "Key": "Application",
        "Value": "LanguageLearningApp"
      }
    ]
  }
}
```

Now, let's define S3 buckets and CloudFront distribution:

```json
"AudioBucket": {
  "Type": "AWS::S3::Bucket",
  "Properties": {
    "AccessControl": "Private",
    "VersioningConfiguration": {
      "Status": "Enabled"
    },
    "BucketEncryption": {
      "ServerSideEncryptionConfiguration": [
        {
          "ServerSideEncryptionByDefault": {
            "SSEAlgorithm": "AES256"
          }
        }
      ]
    },
    "LifecycleConfiguration": {
      "Rules": [
        {
          "Id": "TransitionToInfrequentAccessAndGlacier",
          "Status": "Enabled",
          "Transitions": [
            {
              "StorageClass": "STANDARD_IA",
              "TransitionInDays": 90
            },
            {
              "StorageClass": "GLACIER",
              "TransitionInDays": 180
            }
          ],
          "NoncurrentVersionTransitions": [
            {
              "StorageClass": "GLACIER",
              "TransitionInDays": 30
            }
          ],
          "NoncurrentVersionExpirationInDays": 365
        }
      ]
    },
    "Tags": [
      {
        "Key": "Application",
        "Value": "LanguageLearningApp"
      }
    ]
  }
},

"AudioBucketPolicy": {
  "Type": "AWS::S3::BucketPolicy",
  "Properties": {
    "Bucket": {"Ref": "AudioBucket"},
    "PolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "AWS": {"Fn::GetAtt": ["CloudFrontOriginAccessIdentity", "S3CanonicalUserId"]}
          },
          "Action": "s3:GetObject",
          "Resource": {"Fn::Sub": "arn:aws:s3:::${AudioBucket}/*"}
        }
      ]
    }
  }
},

"StaticContentBucket": {
  "Type": "AWS::S3::Bucket",
  "Properties": {
    "AccessControl": "Private",
    "VersioningConfiguration": {
      "Status": "Enabled"
    },
    "BucketEncryption": {
      "ServerSideEncryptionConfiguration": [
        {
          "ServerSideEncryptionByDefault": {
            "SSEAlgorithm": "AES256"
          }
        }
      ]
    },
    "Tags": [
      {
        "Key": "Application",
        "Value": "LanguageLearningApp"
      }
    ]
  }
},

"StaticContentBucketPolicy": {
  "Type": "AWS::S3::BucketPolicy",
  "Properties": {
    "Bucket": {"Ref": "StaticContentBucket"},
    "PolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "AWS": {"Fn::GetAtt": ["CloudFrontOriginAccessIdentity", "S3CanonicalUserId"]}
          },
          "Action": "s3:GetObject",
          "Resource": {"Fn::Sub": "arn:aws:s3:::${StaticContentBucket}/*"}
        }
      ]
    }
  }
},

"CloudFrontOriginAccessIdentity": {
  "Type": "AWS::CloudFront::CloudFrontOriginAccessIdentity",
  "Properties": {
    "CloudFrontOriginAccessIdentityConfig": {
      "Comment": "OAI for language learning app content"
    }
  }
},

"CloudFrontDistribution": {
  "Type": "AWS::CloudFront::Distribution",
  "Properties": {
    "DistributionConfig": {
      "Enabled": true,
      "DefaultRootObject": "index.html",
      "HttpVersion": "http2",
      "PriceClass": "PriceClass_All",
      "Origins": [
        {
          "Id": "StaticContent",
          "DomainName": {"Fn::GetAtt": ["StaticContentBucket", "DomainName"]},
          "S3OriginConfig": {
            "OriginAccessIdentity": {"Fn::Sub": "origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}"}
          }
        },
        {
          "Id": "AudioContent",
          "DomainName": {"Fn::GetAtt": ["AudioBucket", "DomainName"]},
          "S3OriginConfig": {
            "OriginAccessIdentity": {"Fn::Sub": "origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}"}
          }
        }
      ],
      "DefaultCacheBehavior": {
        "TargetOriginId": "StaticContent",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
        "CachedMethods": ["GET", "HEAD", "OPTIONS"],
        "ForwardedValues": {
          "QueryString": false,
          "Cookies": {
            "Forward": "none"
          }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "Compress": true
      },
      "CacheBehaviors": [
        {
          "PathPattern": "audio/*",
          "TargetOriginId": "AudioContent",
          "ViewerProtocolPolicy": "redirect-to-https",
          "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
          "CachedMethods": ["GET", "HEAD", "OPTIONS"],
          "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
              "Forward": "none"
            }
          },
          "MinTTL": 0,
          "DefaultTTL": 86400,
          "MaxTTL": 31536000,
          "Compress": true
        }
      ],
      "ViewerCertificate": {
        "CloudFrontDefaultCertificate": true
      }
    },
    "Tags": [
      {
        "Key": "Application",
        "Value": "LanguageLearningApp"
      }
    ]
  }
}
```

Now, let's define EventBridge rules and SNS topics:

```json
"DailyLessonReminderRule": {
  "Type": "AWS::Events::Rule",
  "Properties": {
    "Name": "DailyLessonReminder",
    "Description": "Daily reminder for language learning lessons",
    "ScheduleExpression": "cron(0 8 * * ? *)",
    "State": "ENABLED",
    "Targets": [
      {
        "Arn": {"Ref": "DailyReminderTopic"},
        "Id": "DailyReminderTarget"
      }
    ]
  }
},

"LearningMilestoneRule": {
  "Type": "AWS::Events::Rule",
  "Properties": {
    "Name": "LearningMilestoneRule",
    "Description": "Rule to detect learning milestones",
    "EventPattern": {
      "source": ["custom.languagelearning"],
      "detail-type": ["learning-milestone"],
      "detail": {
        "type": ["level-completion", "streak-achievement", "course-completion"]
      }
    },
    "State": "ENABLED",
    "Targets": [
      {
        "Arn": {"Ref": "AchievementTopic"},
        "Id": "AchievementTopicTarget"
      }
    ]
  }
},

"DailyReminderTopic": {
  "Type": "AWS::SNS::Topic",
  "Properties": {
    "TopicName": "DailyLessonReminderTopic",
    "DisplayName": "Daily Lesson Reminder",
    "KmsMasterKeyId": {"Ref": "SNSEncryptionKey"}
  }
},

"AchievementTopic": {
  "Type": "AWS::SNS::Topic",
  "Properties": {
    "TopicName": "LearningAchievementTopic",
    "DisplayName": "Learning Achievement",
    "KmsMasterKeyId": {"Ref": "SNSEncryptionKey"}
  }
},

"SNSEncryptionKey": {
  "Type": "AWS::KMS::Key",
  "Properties": {
    "Description": "KMS key for SNS encryption",
    "EnableKeyRotation": true,
    "KeyPolicy": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "Enable IAM User Permissions",
          "Effect": "Allow",
          "Principal": {
            "AWS": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"}
          },
          "Action": "kms:*",
          "Resource": "*"
        },
        {
          "Sid": "Allow SNS to use the key",
          "Effect": "Allow",
          "Principal": {
            "Service": "sns.amazonaws.com"
          },
          "Action": [
            "kms:GenerateDataKey*",
            "kms:Decrypt"
          ],
          "Resource": "*"
        }
      ]
    },
    "Tags": [
      {
        "Key": "Application",
        "Value": "LanguageLearningApp"
      }
    ]
  }
}
```

Let's define the CloudWatch resources:

```json
"LanguageLearningDashboard": {
  "Type": "AWS::CloudWatch::Dashboard",
  "Properties": {
    "DashboardName": "LanguageLearningMetrics",
    "DashboardBody": {
      "Fn::Sub": "{\"widgets\":[{\"type\":\"metric\",\"x\":0,\"y\":0,\"width\":12,\"height\":6,\"properties\":{\"metrics\":[[\"AWS/ApiGateway\",\"Count\",\"ApiName\",\"${ApiGateway}\"]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"${AWS::Region}\",\"title\":\"API Gateway Requests\",\"period\":300}},{\"type\":\"metric\",\"x\":12,\"y\":0,\"width\":12,\"height\":6,\"properties\":{\"metrics\":[[\"AWS/Lambda\",\"Invocations\",\"FunctionName\",\"${LessonDeliveryFunction}\"]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"${AWS::Region}\",\"title\":\"Lesson Delivery Invocations\",\"period\":300}},{\"type\":\"metric\",\"x\":0,\"y\":6,\"width\":12,\"height\":6,\"properties\":{\"metrics\":[[\"AWS/Lambda\",\"Invocations\",\"FunctionName\",\"${SpeechRecognitionFunction}\"]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"${AWS::Region}\",\"title\":\"Speech Recognition Invocations\",\"period\":300}},{\"type\":\"metric\",\"x\":12,\"y\":6,\"width\":12,\"height\":6,\"properties\":{\"metrics\":[[\"AWS/DynamoDB\",\"ConsumedReadCapacityUnits\",\"TableName\",\"${LessonsTable}\"],[\"AWS/DynamoDB\",\"ConsumedWriteCapacityUnits\",\"TableName\",\"${LessonsTable}\"]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"${AWS::Region}\",\"title\":\"Lessons Table Capacity\",\"period\":300}},{\"type\":\"metric\",\"x\":0,\"y\":12,\"width\":12,\"height\":6,\"properties\":{\"metrics\":[[\"AWS/CloudFront\",\"Requests\",\"DistributionId\",\"${CloudFrontDistribution}\"]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"us-east-1\",\"title\":\"CloudFront Requests\",\"period\":300}}]}"
    }
  }
},

"ApiGatewayErrorAlarm": {
  "Type": "AWS::CloudWatch::Alarm",
  "Properties": {
    "AlarmName": "ApiGateway4xxErrors",
    "AlarmDescription": "Alarm when API Gateway 4xx errors exceed threshold",
    "MetricName": "4XXError",
    "Namespace": "AWS/ApiGateway",
    "Statistic": "Sum",
    "Dimensions": [
      {
        "Name": "ApiName",
        "Value": {"Ref": "ApiGateway"}
      }
    ],
    "Period": 300,
    "EvaluationPeriods": 2,
    "Threshold": 100,
    "ComparisonOperator": "GreaterThanThreshold",
    "AlarmActions": [
      {"Ref": "AlarmNotificationTopic"}
    ]
  }
},

"LambdaErrorAlarm": {
  "Type": "AWS::CloudWatch::Alarm",
  "Properties": {
    "AlarmName": "LambdaErrors",
    "AlarmDescription": "Alarm when Lambda errors exceed threshold",
    "MetricName": "Errors",
    "Namespace": "AWS/Lambda",
    "Statistic": "Sum",
    "Dimensions": [
      {
        "Name": "FunctionName",
        "Value": {"Ref": "LessonDeliveryFunction"}
      }
    ],
    "Period": 300,
    "EvaluationPeriods": 2,
    "Threshold": 10,
    "ComparisonOperator": "GreaterThanThreshold",
    "AlarmActions": [
      {"Ref": "AlarmNotificationTopic"}
    ]
  }
},

"AlarmNotificationTopic": {
  "Type": "AWS::SNS::Topic",
  "Properties": {
    "TopicName": "SystemAlarmTopic",
    "DisplayName": "System Alarms",
    "KmsMasterKeyId": {"Ref": "SNSEncryptionKey"}
  }
}
```

Let's define the security resources:

```json
"ApiGatewayCognitoAuthorizer": {
  "Type": "AWS::ApiGateway::Authorizer",
  "Properties": {
    "Name": "CognitoUserPoolAuthorizer",
    "Type": "COGNITO_USER_POOLS",
    "IdentitySource": "method.request.header.Authorization",
    "RestApiId": {"Ref": "ApiGateway"},
    "ProviderARNs": [{"Ref": "UserPool"}]
  }
},

"UserPool": {
  "Type": "AWS::Cognito::UserPool",
  "Properties": {
    "UserPoolName": "LanguageLearningUserPool",
    "AutoVerifiedAttributes": ["email"],
    "MfaConfiguration": "OFF",
    "Schema": [
      {
        "Name": "email",
        "Required": true,
        "Mutable": true
      },
      {
        "Name": "preferred_language",
        "AttributeDataType": "String",
        "Mutable": true
      }
    ],
    "Policies": {
      "PasswordPolicy": {
        "MinimumLength": 8,
        "RequireLowercase": true,
        "RequireNumbers": true,
        "RequireSymbols": true,
        "RequireUppercase": true
      }
    },
    "AdminCreateUserConfig": {
      "AllowAdminCreateUserOnly": false
    },
    "UserPoolAddOns": {
      "AdvancedSecurityMode": "ENFORCED"
    }
  }
},

"UserPoolClient": {
  "Type": "AWS::Cognito::UserPoolClient",
  "Properties": {
    "UserPoolId": {"Ref": "UserPool"},
    "ClientName": "language-learning-app-client",
    "GenerateSecret": false,
    "ExplicitAuthFlows": [
      "ALLOW_USER_SRP_AUTH",
      "ALLOW_REFRESH_TOKEN_AUTH"
    ],
    "PreventUserExistenceErrors": "ENABLED"
  }
},

"ApiSecrets": {
  "Type": "AWS::SecretsManager::Secret",
  "Properties": {
    "Name": "LanguageLearningApiKeys",
    "Description": "API keys and credentials for external services",
    "SecretString": "{\"transcribeApiKey\":\"placeholder\",\"translateApiKey\":\"placeholder\",\"comprehendApiKey\":\"placeholder\",\"pollyApiKey\":\"placeholder\"}",
    "Tags": [
      {
        "Key": "Application",
        "Value": "LanguageLearningApp"
      }
    ]
  }
},

"WebApplicationFirewallAcl": {
  "Type": "AWS::WAFv2::WebACL",
  "Properties": {
    "Name": "LanguageLearningWafAcl",
    "Scope": "REGIONAL",
    "Description": "Web ACL for Language Learning API",
    "DefaultAction": {
      "Allow": {}
    },
    "VisibilityConfig": {
      "SampledRequestsEnabled": true,
      "CloudWatchMetricsEnabled": true,
      "MetricName": "LanguageLearningWafAcl"
    },
    "Rules": [
      {
        "Name": "RateLimitRule",
        "Priority": 0,
        "Action": {
          "Block": {}
        },
        "Statement": {
          "RateBasedStatement": {
            "Limit": 7000,
            "AggregateKeyType": "IP"
          }
        },
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "RateLimitRule"
        }
      },
      {
        "Name": "SQLiRule",
        "Priority": 1,
        "Action": {
          "Block": {}
        },
        "Statement": {
          "ManagedRuleGroupStatement": {
            "VendorName": "AWS",
            "Name": "AWSManagedRulesSQLiRuleSet",
            "ExcludedRules": []
          }
        },
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "SQLiRule"
        }
      },
      {
        "Name": "XSSRule",
        "Priority": 2,
        "Action": {
          "Block": {}
        },
        "Statement": {
          "ManagedRuleGroupStatement": {
            "VendorName": "AWS",
            "Name": "AWSManagedRulesCommonRuleSet",
            "ExcludedRules": []
          }
        },
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "XSSRule"
        }
      }
    ]
  }
},

"WafApiAssociation": {
  "Type": "AWS::WAFv2::WebACLAssociation",
  "Properties": {
    "ResourceArn": {"Fn::Sub": "arn:aws:apigateway:${AWS::Region}::/restapis/${ApiGateway}/stages/${ApiStageName}"},
    "WebACLArn": {"Fn::GetAtt": ["WebApplicationFirewallAcl", "Arn"]}
  },
  "DependsOn": ["ApiGatewayStage"]
}
```

Finally, let's define the Outputs section:

```json
"Outputs": {
  "ApiGatewayUrl": {
    "Description": "URL of the API Gateway",
    "Value": {"Fn::Sub": "https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${ApiStageName}"}
  },
  "CloudFrontDistributionUrl": {
    "Description": "URL of the CloudFront Distribution",
    "Value": {"Fn::Sub": "https://${CloudFrontDistribution.DomainName}"}
  },
  "UserPoolId": {
    "Description": "ID of the Cognito User Pool",
    "Value": {"Ref": "UserPool"}
  },
  "UserPoolClientId": {
    "Description": "ID of the Cognito User Pool Client",
    "Value": {"Ref": "UserPoolClient"}
  },
  "LessonsTableName": {
    "Description": "Name of the Lessons DynamoDB Table",
    "Value": {"Ref": "LessonsTable"}
  },
  "UserProgressTableName": {
    "Description": "Name of the User Progress DynamoDB Table",
    "Value": {"Ref": "UserProgressTable"}
  },
  "AudioBucketName": {
    "Description": "Name of the Audio S3 Bucket",
    "Value": {"Ref": "AudioBucket"}
  },
  "StaticContentBucketName": {
    "Description": "Name of the Static Content S3 Bucket",
    "Value": {"Ref": "StaticContentBucket"}
  },
  "LessonDeliveryFunctionArn": {
    "Description": "ARN of the Lesson Delivery Lambda Function",
    "Value": {"Fn::GetAtt": ["LessonDeliveryFunction", "Arn"]}
  },
  "SpeechRecognitionFunctionArn": {
    "Description": "ARN of the Speech Recognition Lambda Function",
    "Value": {"Fn::GetAtt": ["SpeechRecognitionFunction", "Arn"]}
  },
  "DashboardUrl": {
    "Description": "URL of the CloudWatch Dashboard",
    "Value": {"Fn::Sub": "https://${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${LanguageLearningDashboard}"}
  }
}
```

Now I need to put everything together into a complete JSON CloudFormation template. Since I've defined all the major components, I'll now combine them into a single template that meets all the requirements specified.

I'll need to ensure:
1. All resources are properly organized and dependencies are correctly defined
2. Security best practices are followed
3. The template follows AWS Well-Architected Framework principles
4. The infrastructure supports 6,000 concurrent users with the specified features

My complete CloudFormation template will be structured as:

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "CloudFormation template for Language Learning Application supporting 6,000 students across 20 languages",
  
  "Parameters": {
    "Environment": {
      "Description": "Environment type",
      "Type": "String",
      "Default": "Production",
      "AllowedValues": ["Development", "Testing", "Production"],
      "ConstraintDescription": "Must be a valid environment type"
    },
    "PythonRuntime": {
      "Description": "Python runtime for Lambda functions",
      "Type": "String",
      "Default": "python3.10",
      "AllowedValues": ["python3.8", "python3.9", "python3.10"],
      "ConstraintDescription": "Must be a supported Python runtime"
    },
    "ApiStageName": {
      "Description": "Stage name for the API Gateway deployment",
      "Type": "String",
      "Default": "v1"
    },
    "LogRetentionInDays": {
      "Description": "Number of days to retain CloudWatch logs",
      "Type": "Number",
      "Default": 30,
      "AllowedValues": [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653]
    }
  },
  
  "Resources": {
    // API Gateway and related resources
    ... (ApiGateway, ApiGatewayDeployment, ApiGatewayStage, etc.)
    
    // Lambda Functions
    ... (LessonDeliveryFunction, UserProgressFunction, etc.)
    
    // DynamoDB Tables
    ... (LessonsTable, UserProgressTable)
    
    // S3 and CloudFront
    ... (AudioBucket, StaticContentBucket, CloudFrontDistribution, etc.)
    
    // EventBridge and SNS
    ... (DailyLessonReminderRule, AchievementTopic, etc.)
    
    // CloudWatch
    ... (LanguageLearningDashboard, ApiGatewayErrorAlarm, etc.)
    
    // Security
    ... (UserPool, ApiSecrets, WebApplicationFirewallAcl, etc.)
  },
  
  "Outputs": {
    ... (ApiGatewayUrl, CloudFrontDistributionUrl, etc.)
  }
}
```

The complete template would include all the sections defined above with proper organization and dependencies between resources.
### Answer 
---

# AWS CloudFormation Template for Language Learning Application

I've created a comprehensive CloudFormation template that defines the infrastructure for your language learning application. This template follows AWS best practices, implements security measures, and provides the scalability needed for 6,000 students across 20 languages.

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "CloudFormation template for a secure language learning application supporting 6,000 students across 20 languages with speech recognition, adaptive learning, and multi-language content",
  
  "Parameters": {
    "Environment": {
      "Description": "Environment type",
      "Type": "String",
      "Default": "Production",
      "AllowedValues": ["Development", "Testing", "Production"],
      "ConstraintDescription": "Must be a valid environment type"
    },
    "PythonRuntime": {
      "Description": "Python runtime for Lambda functions",
      "Type": "String",
      "Default": "python3.10",
      "AllowedValues": ["python3.8", "python3.9", "python3.10"],
      "ConstraintDescription": "Must be a supported Python runtime"
    },
    "ApiStageName": {
      "Description": "Stage name for the API Gateway deployment",
      "Type": "String",
      "Default": "v1"
    },
    "LogRetentionInDays": {
      "Description": "Number of days to retain CloudWatch logs",
      "Type": "Number",
      "Default": 30,
      "AllowedValues": [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653]
    }
  },

  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsSupport": true,
        "EnableDnsHostnames": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "LanguageLearningVPC"
          }
        ]
      }
    },
    
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {"Fn::Sub": "${AWS::Region}a"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "PrivateSubnet1"
          }
        ]
      }
    },
    
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": {"Fn::Sub": "${AWS::Region}b"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "PrivateSubnet2"
          }
        ]
      }
    },
    
    "DynamoDBVPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": "*",
              "Action": [
                "dynamodb:*"
              ],
              "Resource": "*"
            }
          ]
        },
        "RouteTableIds": [
          {"Ref": "PrivateRouteTable"}
        ],
        "ServiceName": {"Fn::Sub": "com.amazonaws.${AWS::Region}.dynamodb"},
        "VpcId": {"Ref": "VPC"}
      }
    },
    
    "S3VPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": "*",
              "Action": [
                "s3:GetObject",
                "s3:PutObject"
              ],
              "Resource": [
                {"Fn::Sub": "arn:aws:s3:::${AudioBucket}/*"},
                {"Fn::Sub": "arn:aws:s3:::${StaticContentBucket}/*"}
              ]
            }
          ]
        },
        "RouteTableIds": [
          {"Ref": "PrivateRouteTable"}
        ],
                "ServiceName": {"Fn::Sub": "com.amazonaws.${AWS::Region}.s3"},
        "VpcId": {"Ref": "VPC"}
      }
    },
    
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "PrivateRouteTable"
          }
        ]
      }
    },
    
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },

    "ApiGateway": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": "LanguageLearningApi",
        "Description": "API for Language Learning Application",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        },
        "ApiKeySourceType": "HEADER",
        "MinimumCompressionSize": 1024
      }
    },
    
    "ApiGatewayDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": [
        "LessonGetMethod",
        "UserProgressGetMethod",
        "SpeechRecognitionPostMethod",
        "GrammarAnalysisPostMethod",
        "RecommendationsGetMethod"
      ],
      "Properties": {
        "RestApiId": {"Ref": "ApiGateway"},
        "Description": "Initial deployment of the Language Learning API"
      }
    },
    
    "ApiGatewayStage": {
      "Type": "AWS::ApiGateway::Stage",
      "Properties": {
        "RestApiId": {"Ref": "ApiGateway"},
        "DeploymentId": {"Ref": "ApiGatewayDeployment"},
        "StageName": {"Ref": "ApiStageName"},
        "MethodSettings": [
          {
            "HttpMethod": "*",
            "ResourcePath": "/*",
            "ThrottlingBurstLimit": 7000,
            "ThrottlingRateLimit": 6000
          }
        ],
        "AccessLogSetting": {
          "DestinationArn": {"Fn::GetAtt": ["ApiGatewayAccessLogGroup", "Arn"]},
          "Format": "{\"requestId\":\"$context.requestId\",\"ip\":\"$context.identity.sourceIp\",\"requestTime\":\"$context.requestTime\",\"httpMethod\":\"$context.httpMethod\",\"routeKey\":\"$context.routeKey\",\"status\":\"$context.status\",\"protocol\":\"$context.protocol\",\"responseLength\":\"$context.responseLength\"}"
        }
      }
    },
    
    "ApiGatewayAccessLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {"Fn::Sub": "/aws/apigateway/${ApiGateway}/access-logs"},
        "RetentionInDays": {"Ref": "LogRetentionInDays"}
      }
    },

    "ApiGatewayCorsResponse": {
      "Type": "AWS::ApiGateway::GatewayResponse",
      "Properties": {
        "RestApiId": {"Ref": "ApiGateway"},
        "ResponseType": "DEFAULT_4XX",
        "ResponseParameters": {
          "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
          "gatewayresponse.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
          "gatewayresponse.header.Access-Control-Allow-Methods": "'GET,POST,PUT,DELETE,OPTIONS'"
        }
      }
    },

    "LessonResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {"Ref": "ApiGateway"},
        "ParentId": {"Fn::GetAtt": ["ApiGateway", "RootResourceId"]},
        "PathPart": "lessons"
      }
    },

    "LessonGetMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {"Ref": "ApiGateway"},
        "ResourceId": {"Ref": "LessonResource"},
        "HttpMethod": "GET",
        "AuthorizationType": "COGNITO_USER_POOLS",
        "AuthorizerId": {"Ref": "ApiGatewayCognitoAuthorizer"},
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {"Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LessonDeliveryFunction.Arn}/invocations"}
        }
      }
    },

    "UserProgressResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {"Ref": "ApiGateway"},
        "ParentId": {"Fn::GetAtt": ["ApiGateway", "RootResourceId"]},
        "PathPart": "progress"
      }
    },

    "UserProgressGetMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {"Ref": "ApiGateway"},
        "ResourceId": {"Ref": "UserProgressResource"},
        "HttpMethod": "GET",
        "AuthorizationType": "COGNITO_USER_POOLS",
        "AuthorizerId": {"Ref": "ApiGatewayCognitoAuthorizer"},
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {"Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${UserProgressFunction.Arn}/invocations"}
        }
      }
    },

    "SpeechRecognitionResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {"Ref": "ApiGateway"},
        "ParentId": {"Fn::GetAtt": ["ApiGateway", "RootResourceId"]},
        "PathPart": "speech"
      }
    },

    "SpeechRecognitionPostMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {"Ref": "ApiGateway"},
        "ResourceId": {"Ref": "SpeechRecognitionResource"},
        "HttpMethod": "POST",
        "AuthorizationType": "COGNITO_USER_POOLS",
        "AuthorizerId": {"Ref": "ApiGatewayCognitoAuthorizer"},
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {"Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${SpeechRecognitionFunction.Arn}/invocations"}
        }
      }
    },

    "GrammarAnalysisResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {"Ref": "ApiGateway"},
        "ParentId": {"Fn::GetAtt": ["ApiGateway", "RootResourceId"]},
        "PathPart": "grammar"
      }
    },

    "GrammarAnalysisPostMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {"Ref": "ApiGateway"},
        "ResourceId": {"Ref": "GrammarAnalysisResource"},
        "HttpMethod": "POST",
        "AuthorizationType": "COGNITO_USER_POOLS",
        "AuthorizerId": {"Ref": "ApiGatewayCognitoAuthorizer"},
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {"Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${GrammarAnalysisFunction.Arn}/invocations"}
        }
      }
    },

    "RecommendationsResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {"Ref": "ApiGateway"},
        "ParentId": {"Fn::GetAtt": ["ApiGateway", "RootResourceId"]},
        "PathPart": "recommendations"
      }
    },

    "RecommendationsGetMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {"Ref": "ApiGateway"},
        "ResourceId": {"Ref": "RecommendationsResource"},
        "HttpMethod": "GET",
        "AuthorizationType": "COGNITO_USER_POOLS",
        "AuthorizerId": {"Ref": "ApiGatewayCognitoAuthorizer"},
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {"Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${RecommendationsFunction.Arn}/invocations"}
        }
      }
    },

    "LessonDeliveryFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "LessonDeliveryFunction",
        "Handler": "index.handler",
        "Role": {"Fn::GetAtt": ["LessonDeliveryFunctionRole", "Arn"]},
        "Code": {
          "ZipFile": "def handler(event, context):\n    return {\n        'statusCode': 200,\n        'body': '{\"message\": \"Lesson delivery function\"}',\n        'headers': {'Content-Type': 'application/json'}\n    }"
        },
        "Runtime": {"Ref": "PythonRuntime"},
        "Timeout": 30,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "LESSONS_TABLE": {"Ref": "LessonsTable"}
          }
        },
        "DeadLetterConfig": {
          "TargetArn": {"Ref": "LessonDeliveryDLQ"}
        },
        "TracingConfig": {
          "Mode": "Active"
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "LanguageLearningApp"
          }
        ]
      }
    },

    "LessonDeliveryDLQ": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": "LessonDeliveryDLQ",
        "MessageRetentionPeriod": 1209600,
        "VisibilityTimeout": 60,
        "SqsManagedSseEnabled": true
      }
    },

    "LessonDeliveryFunctionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "LessonDeliveryFunctionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": [
                    {"Fn::GetAtt": ["LessonsTable", "Arn"]},
                    {"Fn::Sub": "${LessonsTable.Arn}/index/*"}
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sqs:SendMessage"
                  ],
                  "Resource": {"Fn::GetAtt": ["LessonDeliveryDLQ", "Arn"]}
                }
              ]
            }
          }
        ]
      }
    },

    "UserProgressFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "UserProgressFunction",
        "Handler": "index.handler",
        "Role": {"Fn::GetAtt": ["UserProgressFunctionRole", "Arn"]},
        "Code": {
          "ZipFile": "def handler(event, context):\n    return {\n        'statusCode': 200,\n        'body': '{\"message\": \"User progress function\"}',\n        'headers': {'Content-Type': 'application/json'}\n    }"
        },
        "Runtime": {"Ref": "PythonRuntime"},
        "Timeout": 30,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "USER_PROGRESS_TABLE": {"Ref": "UserProgressTable"}
          }
        },
        "DeadLetterConfig": {
          "TargetArn": {"Ref": "UserProgressDLQ"}
        },
        "TracingConfig": {
          "Mode": "Active"
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "LanguageLearningApp"
          }
        ]
      }
    },

    "UserProgressDLQ": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": "UserProgressDLQ",
        "MessageRetentionPeriod": 1209600,
        "VisibilityTimeout": 60,
        "SqsManagedSseEnabled": true
      }
    },

    "UserProgressFunctionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "UserProgressFunctionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem"
                  ],
                  "Resource": [
                    {"Fn::GetAtt": ["UserProgressTable", "Arn"]},
                    {"Fn::Sub": "${UserProgressTable.Arn}/index/*"}
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sqs:SendMessage"
                  ],
                  "Resource": {"Fn::GetAtt": ["UserProgressDLQ", "Arn"]}
                }
              ]
            }
          }
        ]
      }
    },

    "SpeechRecognitionFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "SpeechRecognitionFunction",
        "Handler": "index.handler",
        "Role": {"Fn::GetAtt": ["SpeechRecognitionFunctionRole", "Arn"]},
        "Code": {
          "ZipFile": "def handler(event, context):\n    return {\n        'statusCode': 200,\n        'body': '{\"message\": \"Speech recognition function\"}',\n        'headers': {'Content-Type': 'application/json'}\n    }"
        },
        "Runtime": {"Ref": "PythonRuntime"},
        "Timeout": 60,
        "MemorySize": 1024,
        "Environment": {
          "Variables": {
            "AUDIO_BUCKET": {"Ref": "AudioBucket"}
          }
        },
        "DeadLetterConfig": {
          "TargetArn": {"Ref": "SpeechRecognitionDLQ"}
        },
        "TracingConfig": {
          "Mode": "Active"
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "LanguageLearningApp"
          }
        ]
      }
    },

    "SpeechRecognitionDLQ": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": "SpeechRecognitionDLQ",
        "MessageRetentionPeriod": 1209600,
        "VisibilityTimeout": 60,
        "SqsManagedSseEnabled": true
      }
    },

    "SpeechRecognitionFunctionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "SpeechRecognitionFunctionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                  ],
                  "Resource": [
                    {"Fn::Sub": "arn:aws:s3:::${AudioBucket}/*"}
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "transcribe:StartTranscriptionJob",
                    "transcribe:GetTranscriptionJob",
                    "transcribe:CreateVocabulary",
                    "transcribe:GetVocabulary"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sqs:SendMessage"
                  ],
                  "Resource": {"Fn::GetAtt": ["SpeechRecognitionDLQ", "Arn"]}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue"
                  ],
                  "Resource": {"Ref": "ApiSecrets"}
                }
              ]
            }
          }
        ]
      }
    },

    "GrammarAnalysisFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "GrammarAnalysisFunction",
        "Handler": "index.handler",
        "Role": {"Fn::GetAtt": ["GrammarAnalysisFunctionRole", "Arn"]},
        "Code": {
          "ZipFile": "def handler(event, context):\n    return {\n        'statusCode': 200,\n        'body': '{\"message\": \"Grammar analysis function\"}',\n        'headers': {'Content-Type': 'application/json'}\n    }"
        },
        "Runtime": {"Ref": "PythonRuntime"},
        "Timeout": 30,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "USER_PROGRESS_TABLE": {"Ref": "UserProgressTable"}
          }
        },
        "DeadLetterConfig": {
          "TargetArn": {"Ref": "GrammarAnalysisDLQ"}
        },
        "TracingConfig": {
          "Mode": "Active"
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "LanguageLearningApp"
          }
        ]
      }
    },

    "GrammarAnalysisDLQ": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": "GrammarAnalysisDLQ",
        "MessageRetentionPeriod": 1209600,
        "VisibilityTimeout": 60,
        "SqsManagedSseEnabled": true
      }
    },

    "GrammarAnalysisFunctionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "GrammarAnalysisFunctionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "comprehend:DetectSyntax",
                    "comprehend:DetectDominantLanguage",
                    "comprehend:DetectSentiment"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:UpdateItem"
                  ],
                  "Resource": {"Fn::GetAtt": ["UserProgressTable", "Arn"]}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sqs:SendMessage"
                  ],
                  "Resource": {"Fn::GetAtt": ["GrammarAnalysisDLQ", "Arn"]}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue"
                  ],
                  "Resource": {"Ref": "ApiSecrets"}
                }
              ]
            }
          }
        ]
      }
    },

    "RecommendationsFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "RecommendationsFunction",
        "Handler": "index.handler",
        "Role": {"Fn::GetAtt": ["RecommendationsFunctionRole", "Arn"]},
        "Code": {
          "ZipFile": "def handler(event, context):\n    return {\n        'statusCode': 200,\n        'body': '{\"message\": \"Recommendations function\"}',\n        'headers': {'Content-Type': 'application/json'}\n    }"
        },
        "Runtime": {"Ref": "PythonRuntime"},
        "Timeout": 30,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "USER_PROGRESS_TABLE": {"Ref": "UserProgressTable"},
            "LESSONS_TABLE": {"Ref": "LessonsTable"}
          }
        },
        "DeadLetterConfig": {
          "TargetArn": {"Ref": "RecommendationsDLQ"}
        },
        "TracingConfig": {
          "Mode": "Active"
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "LanguageLearningApp"
          }
        ]
      }
    },

    "RecommendationsDLQ": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": "RecommendationsDLQ",
        "MessageRetentionPeriod": 1209600,
        "VisibilityTimeout": 60,
        "SqsManagedSseEnabled": true
      }
    },

    "RecommendationsFunctionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "RecommendationsFunctionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": [
                    {"Fn::GetAtt": ["UserProgressTable", "Arn"]},
                    {"Fn::GetAtt": ["LessonsTable", "Arn"]},
                    {"Fn::Sub": "${UserProgressTable.Arn}/index/*"},
                    {"Fn::Sub": "${LessonsTable.Arn}/index/*"}
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "personalize:GetRecommendations",
                    "personalize:RecordEvent"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sqs:SendMessage"
                  ],
                  "Resource": {"Fn::GetAtt": ["RecommendationsDLQ", "Arn"]}
                }
              ]
            }
          }
        ]
      }
    },

    "LessonsTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": "LessonsTable",
        "AttributeDefinitions": [
          {
            "AttributeName": "LessonId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "Language",
            "AttributeType": "S"
          },
          {
            "AttributeName": "DifficultyLevel",
            "AttributeType": "N"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "LessonId",
            "KeyType": "HASH"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "LanguageIndex",
            "KeySchema": [
              {
                "AttributeName": "Language",
                "KeyType": "HASH"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            }
          },
          {
            "IndexName": "DifficultyIndex",
            "KeySchema": [
              {
                "AttributeName": "DifficultyLevel",
                "KeyType": "HASH"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            }
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "SSESpecification": {
          "SSEEnabled": true
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "LanguageLearningApp"
          }
        ]
      }
    },

    "UserProgressTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": "UserProgressTable",
        "AttributeDefinitions": [
          {
            "AttributeName": "UserId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "Language",
            "AttributeType": "S"
          },
          {
            "AttributeName": "ProgressLevel",
            "AttributeType": "N"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "UserId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "Language",
            "KeyType": "RANGE"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "ProgressLevelIndex",
            "KeySchema": [
              {
                "AttributeName": "ProgressLevel",
                "KeyType": "HASH"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            }
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "SSESpecification": {
          "SSEEnabled": true
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "LanguageLearningApp"
          }
        ]
      }
    },

    "AudioBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "AccessControl": "Private",
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "TransitionToInfrequentAccessAndGlacier",
              "Status": "Enabled",
              "Transitions": [
                {
                  "StorageClass": "STANDARD_IA",
                  "TransitionInDays": 90
                },
                {
                  "StorageClass": "GLACIER",
                  "TransitionInDays": 180
                }
              ],
              "NoncurrentVersionTransitions": [
                {
                  "StorageClass": "GLACIER",
                  "TransitionInDays": 30
                }
              ],
              "NoncurrentVersionExpirationInDays": 365
            }
          ]
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "LanguageLearningApp"
          }
        ]
      }
    },

    "AudioBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {"Ref": "AudioBucket"},
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "AWS": {"Fn::GetAtt": ["CloudFrontOriginAccessIdentity", "S3CanonicalUserId"]}
              },
              "Action": "s3:GetObject",
              "Resource": {"Fn::Sub": "arn:aws:s3:::${AudioBucket}/*"}
            }
          ]
        }
      }
    },

    "StaticContentBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "AccessControl": "Private",
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "LanguageLearningApp"
          }
        ]
      }
    },

    "StaticContentBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {"Ref": "StaticContentBucket"},
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "AWS": {"Fn::GetAtt": ["CloudFrontOriginAccessIdentity", "S3CanonicalUserId"]}
              },
              "Action": "s3:GetObject",
              "Resource": {"Fn::Sub": "arn:aws:s3:::${StaticContentBucket}/*"}
            }
          ]
        }
      }
    },

    "CloudFrontOriginAccessIdentity": {
      "Type": "AWS::CloudFront::CloudFrontOriginAccessIdentity",
      "Properties": {
        "CloudFrontOriginAccessIdentityConfig": {
          "Comment": "OAI for language learning app content"
        }
      }
    },

    "CloudFrontDistribution": {
      "Type": "AWS::CloudFront::Distribution",
      "Properties": {
        "DistributionConfig": {
          "Enabled": true,
          "DefaultRootObject": "index.html",
          "HttpVersion": "http2",
          "PriceClass": "PriceClass_All",
          "Origins": [
            {
              "Id": "StaticContent",
              "DomainName": {"Fn::GetAtt": ["StaticContentBucket", "DomainName"]},
              "S3OriginConfig": {
                "OriginAccessIdentity": {"Fn::Sub": "origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}"}
              }
            },
            {
              "Id": "AudioContent",
              "DomainName": {"Fn::GetAtt": ["AudioBucket", "DomainName"]},
              "S3OriginConfig": {
                "OriginAccessIdentity": {"Fn::Sub": "origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}"}
              }
            }
          ],
          "DefaultCacheBehavior": {
            "TargetOriginId": "StaticContent",
            "ViewerProtocolPolicy": "redirect-to-https",
            "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
            "CachedMethods": ["GET", "HEAD", "OPTIONS"],
            "ForwardedValues": {
              "QueryString": false,
              "Cookies": {
                "Forward": "none"
              }
            },
            "MinTTL": 0,
            "DefaultTTL": 86400,
            "MaxTTL": 31536000,
            "Compress": true
          },
          "CacheBehaviors": [
            {
              "PathPattern": "audio/*",
              "TargetOriginId": "AudioContent",
              "ViewerProtocolPolicy": "redirect-to-https",
              "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
              "CachedMethods": ["GET", "HEAD", "OPTIONS"],
              "ForwardedValues": {
                "QueryString": false,
                "Cookies": {
                  "Forward": "none"
                }
              },
              "MinTTL": 0,
              "DefaultTTL": 86400,
              "MaxTTL": 31536000,
              "Compress": true
            }
          ],
          "ViewerCertificate": {
            "CloudFrontDefaultCertificate": true
          }
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "LanguageLearningApp"
          }
        ]
      }
    },

    "DailyLessonReminderRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": "DailyLessonReminder",
        "Description": "Daily reminder for language learning lessons",
        "ScheduleExpression": "cron(0 8 * * ? *)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {"Ref": "DailyReminderTopic"},
            "Id": "DailyReminderTarget"
          }
        ]
      }
    },

    "LearningMilestoneRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": "LearningMilestoneRule",
        "Description": "Rule to detect learning milestones",
        "EventPattern": {
          "source": ["custom.languagelearning"],
          "detail-type": ["learning-milestone"],
          "detail": {
            "type": ["level-completion", "streak-achievement", "course-completion"]
          }
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {"Ref": "AchievementTopic"},
            "Id": "AchievementTopicTarget"
          }
        ]
      }
    },

    "DailyReminderTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": "DailyLessonReminderTopic",
        "DisplayName": "Daily Lesson Reminder",
        "KmsMasterKeyId": {"Ref": "SNSEncryptionKey"}
      }
    },

    "AchievementTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": "LearningAchievementTopic",
        "DisplayName": "Learning Achievement",
        "KmsMasterKeyId": {"Ref": "SNSEncryptionKey"}
      }
    },

    "SNSEncryptionKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for SNS encryption",
        "EnableKeyRotation": true,
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"}
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow SNS to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "sns.amazonaws.com"
              },
              "Action": [
                "kms:GenerateDataKey*",
                "kms:Decrypt"
              ],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "LanguageLearningApp"
          }
        ]
      }
    },

    "LanguageLearningDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": "LanguageLearningMetrics",
        "DashboardBody": {
          "Fn::Sub": "{\"widgets\":[{\"type\":\"metric\",\"x\":0,\"y\":0,\"width\":12,\"height\":6,\"properties\":{\"metrics\":[[\"AWS/ApiGateway\",\"Count\",\"ApiName\",\"${ApiGateway}\"]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"${AWS::Region}\",\"title\":\"API Gateway Requests\",\"period\":300}},{\"type\":\"metric\",\"x\":12,\"y\":0,\"width\":12,\"height\":6,\"properties\":{\"metrics\":[[\"AWS/Lambda\",\"Invocations\",\"FunctionName\",\"${LessonDeliveryFunction}\"]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"${AWS::Region}\",\"title\":\"Lesson Delivery Invocations\",\"period\":300}},{\"type\":\"metric\",\"x\":0,\"y\":6,\"width\":12,\"height\":6,\"properties\":{\"metrics\":[[\"AWS/Lambda\",\"Invocations\",\"FunctionName\",\"${SpeechRecognitionFunction}\"]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"${AWS::Region}\",\"title\":\"Speech Recognition Invocations\",\"period\":300}},{\"type\":\"metric\",\"x\":12,\"y\":6,\"width\":12,\"height\":6,\"properties\":{\"metrics\":[[\"AWS/DynamoDB\",\"ConsumedReadCapacityUnits\",\"TableName\",\"${LessonsTable}\"],[\"AWS/DynamoDB\",\"ConsumedWriteCapacityUnits\",\"TableName\",\"${LessonsTable}\"]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"${AWS::Region}\",\"title\":\"Lessons Table Capacity\",\"period\":300}},{\"type\":\"metric\",\"x\":0,\"y\":12,\"width\":12,\"height\":6,\"properties\":{\"metrics\":[[\"AWS/CloudFront\",\"Requests\",\"DistributionId\",\"${CloudFrontDistribution}\"]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"us-east-1\",\"title\":\"CloudFront Requests\",\"period\":300}}]}"
        }
      }
    },

    "ApiGatewayErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "ApiGateway4xxErrors",
        "AlarmDescription": "Alarm when API Gateway 4xx errors exceed threshold",
        "MetricName": "4XXError",
        "Namespace": "AWS/ApiGateway",
        "Statistic": "Sum",
        "Dimensions": [
          {
            "Name": "ApiName",
            "Value": {"Ref": "ApiGateway"}
          }
        ],
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 100,
        "ComparisonOperator": "GreaterThanThreshold",
        "AlarmActions": [
          {"Ref": "AlarmNotificationTopic"}
        ]
      }
    },

    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "LambdaErrors",
        "AlarmDescription": "Alarm when Lambda errors exceed threshold",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {"Ref": "LessonDeliveryFunction"}
          }
        ],
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "AlarmActions": [
          {"Ref": "AlarmNotificationTopic"}
        ]
      }
    },

    "AlarmNotificationTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": "SystemAlarmTopic",
        "DisplayName": "System Alarms",
        "KmsMasterKeyId": {"Ref": "SNSEncryptionKey"}
      }
    },

    "ApiGatewayCognitoAuthorizer": {
      "Type": "AWS::ApiGateway::Authorizer",
      "Properties": {
        "Name": "CognitoUserPoolAuthorizer",
        "Type": "COGNITO_USER_POOLS",
        "IdentitySource": "method.request.header.Authorization",
        "RestApiId": {"Ref": "ApiGateway"},
        "ProviderARNs": [{"Fn::GetAtt": ["UserPool", "Arn"]}]
      }
    },

    "UserPool": {
      "Type": "AWS::Cognito::UserPool",
      "Properties": {
        "UserPoolName": "LanguageLearningUserPool",
        "AutoVerifiedAttributes": ["email"],
        "MfaConfiguration": "OFF",
        "Schema": [
          {
            "Name": "email",
            "Required": true,
            "Mutable": true
          },
          {
            "Name": "preferred_language",
            "AttributeDataType": "String",
            "Mutable": true
          }
        ],
        "Policies": {
          "PasswordPolicy": {
            "MinimumLength": 8,
            "RequireLowercase": true,
            "RequireNumbers": true,
            "RequireSymbols": true,
            "RequireUppercase": true
          }
        },
        "AdminCreateUserConfig": {
          "AllowAdminCreateUserOnly": false
        },
        "UserPoolAddOns": {
          "AdvancedSecurityMode": "ENFORCED"
        }
      }
    },

    "UserPoolClient": {
      "Type": "AWS::Cognito::UserPoolClient",
      "Properties": {
        "UserPoolId": {"Ref": "UserPool"},
        "ClientName": "language-learning-app-client",
        "GenerateSecret": false,
        "ExplicitAuthFlows": [
          "ALLOW_USER_SRP_AUTH",
          "ALLOW_REFRESH_TOKEN_AUTH"
        ],
        "PreventUserExistenceErrors": "ENABLED"
      }
    },

    "ApiSecrets": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": "LanguageLearningApiKeys",
        "Description": "API keys and credentials for external services",
        "SecretString": "{\"transcribeApiKey\":\"placeholder\",\"translateApiKey\":\"placeholder\",\"comprehendApiKey\":\"placeholder\",\"pollyApiKey\":\"placeholder\"}",
        "Tags": [
          {
            "Key": "Application",
            "Value": "LanguageLearningApp"
          }
        ]
      }
    },

    "WebApplicationFirewallAcl": {
      "Type": "AWS::WAFv2::WebACL",
      "Properties": {
        "Name": "LanguageLearningWafAcl",
        "Scope": "REGIONAL",
        "Description": "Web ACL for Language Learning API",
        "DefaultAction": {
          "Allow": {}
        },
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "LanguageLearningWafAcl"
        },
        "Rules": [
          {
            "Name": "RateLimitRule",
            "Priority": 0,
            "Action": {
              "Block": {}
            },
            "Statement": {
              "RateBasedStatement": {
                "Limit": 7000,
                "AggregateKeyType": "IP"
              }
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "RateLimitRule"
            }
          },
          {
            "Name": "SQLiRule",
            "Priority": 1,
            "Action": {
              "Block": {}
            },
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesSQLiRuleSet",
                "ExcludedRules": []
              }
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "SQLiRule"
            }
          },
          {
            "Name": "XSSRule",
            "Priority": 2,
            "Action": {
              "Block": {}
            },
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesCommonRuleSet",
                "ExcludedRules": []
              }
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "XSSRule"
            }
          }
        ]
      }
    },

    "WafApiAssociation": {
      "Type": "AWS::WAFv2::WebACLAssociation",
      "Properties": {
        "ResourceArn": {"Fn::Sub": "arn:aws:apigateway:${AWS::Region}::/restapis/${ApiGateway}/stages/${ApiStageName}"},
        "WebACLArn": {"Fn::GetAtt": ["WebApplicationFirewallAcl", "Arn"]}
      },
      "DependsOn": ["ApiGatewayStage"]
    }
  },

  "Outputs": {
    "ApiGatewayUrl": {
      "Description": "URL of the API Gateway",
      "Value": {"Fn::Sub": "https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${ApiStageName}"}
    },
    "CloudFrontDistributionUrl": {
      "Description": "URL of the CloudFront Distribution",
      "Value": {"Fn::Sub": "https://${CloudFrontDistribution.DomainName}"}
    },
    "UserPoolId": {
      "Description": "ID of the Cognito User Pool",
      "Value": {"Ref": "UserPool"}
    },
    "UserPoolClientId": {
      "Description": "ID of the Cognito User Pool Client",
      "Value": {"Ref": "UserPoolClient"}
    },
    "LessonsTableName": {
      "Description": "Name of the Lessons DynamoDB Table",
      "Value": {"Ref": "LessonsTable"}
    },
    "UserProgressTableName": {
      "Description": "Name of the User Progress DynamoDB Table",
      "Value": {"Ref": "UserProgressTable"}
    },
    "AudioBucketName": {
      "Description": "Name of the Audio S3 Bucket",
      "Value": {"Ref": "AudioBucket"}
    },
    "StaticContentBucketName": {
      "Description": "Name of the Static Content S3 Bucket",
      "Value": {"Ref": "StaticContentBucket"}
    },
    "LessonDeliveryFunctionArn": {
      "Description": "ARN of the Lesson Delivery Lambda Function",
      "Value": {"Fn::GetAtt": ["LessonDeliveryFunction", "Arn"]}
    },
    "SpeechRecognitionFunctionArn": {
      "Description": "ARN of the Speech Recognition Lambda Function",
      "Value": {"Fn::GetAtt": ["SpeechRecognitionFunction", "Arn"]}
    },
    "DashboardUrl": {
      "Description": "URL of the CloudWatch Dashboard",
      "Value": {"Fn::Sub": "https://${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${LanguageLearningDashboard}"}
    }
  }
}