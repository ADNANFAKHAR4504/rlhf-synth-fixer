{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "Serverless infrastructure with Lambda, S3, API Gateway, IAM roles, and CloudWatch monitoring.",
    "Parameters": {
        "LambdaFunctionName": {
            "Type": "String",
            "Default": "Lambda-api-229220-iac",
            "Description": "The name of the Lambda function."
        },
        "S3BucketName": {
            "Type": "String",
            "Default": "s3-bucket-229220-iac",
            "Description": "The name of the S3 bucket triggering the Lambda.",
            "AllowedPattern": "^[a-z0-9][a-z0-9.-]*[a-z0-9]$",
            "ConstraintDescription": "S3 bucket name must be between 3 and 63 characters, contain only lowercase letters, numbers, hyphens, and periods, and must start and end with a lowercase letter or number."
        },
        "ApiGatewayName": {
            "Type": "String",
            "Default": "apigateway-lambda-229220-iac",
            "Description": "The name of the API Gateway."
        }
    },
    "Resources": {
        "LambdaDLQ": {
            "Type": "AWS::SQS::Queue",
            "Properties": {
                "QueueName": "LambdaDLQ",
                "MessageRetentionPeriod": 1209600
            }
        },
        "LambdaExecutionRole": {
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
                "Policies": [
                    {
                        "PolicyName": "LambdaS3Policy",
                        "PolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "s3:GetObject",
                                        "s3:PutObject"
                                    ],
                                    "Resource": {
                                        "Fn::Sub": "arn:aws:s3:::${S3BucketName}/*"
                                    }
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "logs:CreateLogGroup",
                                        "logs:CreateLogStream",
                                        "logs:PutLogEvents"
                                    ],
                                    "Resource": {
                                        "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${LambdaFunctionName}:*"
                                    }
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "sqs:SendMessage"
                                    ],
                                    "Resource": {
                                        "Fn::GetAtt": [
                                            "LambdaDLQ",
                                            "Arn"
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        "LambdaFunction": {
            "Type": "AWS::Lambda::Function",
            "Properties": {
                "FunctionName": {
                    "Ref": "LambdaFunctionName"
                },
                "Runtime": "nodejs22.x",
                "Role": {
                    "Fn::GetAtt": [
                        "LambdaExecutionRole",
                        "Arn"
                    ]
                },
                "Handler": "index.handler",
                "Code": {
                    "ZipFile": "exports.handler = async (event) => {\n  console.log('Event:', JSON.stringify(event, null, 2));\n  \n  // Example of handling different event sources\n  if (event.Records && event.Records[0] && event.Records[0].s3) {\n      console.log('Triggered by S3 event');\n      const s3Bucket = event.Records[0].s3.bucket.name;\n      const s3Key = event.Records[0].s3.object.key;\n      return { \n        statusCode: 200, \n        body: JSON.stringify(`Lambda processed S3 object: ${s3Bucket}/${s3Key}`)\n      };\n  } else if (event.httpMethod) {\n      console.log('Triggered by API Gateway');\n      return {\n        statusCode: 200,\n        body: JSON.stringify('Lambda function executed successfully via API Gateway!')\n      };\n  } else {\n      console.log('Triggered by unknown event source');\n      return { \n        statusCode: 200, \n        body: JSON.stringify('Lambda function executed successfully with inline code!') \n      };\n  }\n};\n"
                },
                "Environment": {
                    "Variables": {
                        "MY_ENV_VAR": "example-value"
                    }
                },
                "Timeout": 10,
                "MemorySize": 128,
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": "Production"
                    }
                ],
                "TracingConfig": {
                    "Mode": "Active"
                },
                "DeadLetterConfig": {
                    "TargetArn": {
                        "Fn::GetAtt": [
                            "LambdaDLQ",
                            "Arn"
                        ]
                    }
                }
            }
        },
        "S3Bucket": {
            "Type": "AWS::S3::Bucket",
            "Properties": {
                "BucketName": {
                    "Ref": "S3BucketName"
                },
                "NotificationConfiguration": {
                    "LambdaConfigurations": [
                        {
                            "Event": "s3:ObjectCreated:*",
                            "Function": {
                                "Fn::GetAtt": [
                                    "LambdaFunction",
                                    "Arn"
                                ]
                            }
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": "Production"
                    }
                ]
            }
        },
        "LambdaS3InvokePermission": {
            "Type": "AWS::Lambda::Permission",
            "Properties": {
                "Action": "lambda:InvokeFunction",
                "FunctionName": {
                    "Fn::GetAtt": [
                        "LambdaFunction",
                        "Arn"
                    ]
                },
                "Principal": "s3.amazonaws.com",
                "SourceArn": {
                    "Fn::Sub": "arn:aws:s3:::${S3BucketName}"
                }
            }
        },
        "ApiGateway": {
            "Type": "AWS::ApiGateway::RestApi",
            "Properties": {
                "Name": {
                    "Ref": "ApiGatewayName"
                },
                "Description": "API Gateway for triggering Lambda functions.",
                "FailOnWarnings": true,
                "Tags": [
                    {
                        "Key": "Environment",
                        "Value": "Production"
                    }
                ]
            }
        },
        "ApiGatewayResource": {
            "Type": "AWS::ApiGateway::Resource",
            "Properties": {
                "RestApiId": {
                    "Ref": "ApiGateway"
                },
                "ParentId": {
                    "Fn::GetAtt": [
                        "ApiGateway",
                        "RootResourceId"
                    ]
                },
                "PathPart": "invoke"
            }
        },
        "ApiGatewayMethod": {
            "Type": "AWS::ApiGateway::Method",
            "Properties": {
                "AuthorizationType": "NONE",
                "HttpMethod": "POST",
                "ResourceId": {
                    "Ref": "ApiGatewayResource"
                },
                "RestApiId": {
                    "Ref": "ApiGateway"
                },
                "Integration": {
                    "IntegrationHttpMethod": "POST",
                    "Type": "AWS_PROXY",
                    "Uri": {
                        "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations"
                    }
                },
                "MethodResponses": [
                    {
                        "StatusCode": 200
                    }
                ]
            }
        },
        "ApiGatewayDeployment": {
            "Type": "AWS::ApiGateway::Deployment",
            "DependsOn": "ApiGatewayMethod",
            "Properties": {
                "RestApiId": {
                    "Ref": "ApiGateway"
                },
                "StageName": "prod"
            }
        },
        "LambdaApiGatewayInvokePermission": {
            "Type": "AWS::Lambda::Permission",
            "Properties": {
                "Action": "lambda:InvokeFunction",
                "FunctionName": {
                    "Fn::GetAtt": [
                        "LambdaFunction",
                        "Arn"
                    ]
                },
                "Principal": "apigateway.amazonaws.com",
                "SourceArn": {
                    "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*/*"
                }
            }
        },
        "LambdaLogGroup": {
            "Type": "AWS::Logs::LogGroup",
            "Properties": {
                "LogGroupName": {
                    "Fn::Sub": "/aws/lambda/${LambdaFunctionName}"
                },
                "RetentionInDays": 7
            }
        }
    },
    "Outputs": {
        "ApiEndpoint": {
            "Description": "API Gateway URL for /invoke endpoint",
            "Value": {
                "Fn::Sub": "https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/prod/invoke"
            }
        },
        "LambdaFunctionArn": {
            "Description": "Lambda ARN",
            "Value": {
                "Fn::GetAtt": [
                    "LambdaFunction",
                    "Arn"
                ]
            }
        },
        "LambdaFunctionName": {
            "Description": "The name of the Lambda function",
            "Value": {
                "Ref": "LambdaFunctionName"
            }
        },
        "LambdaExecutionRoleArn": {
            "Description": "The ARN of the IAM Role assumed by Lambda",
            "Value": {
                "Fn::GetAtt": [
                    "LambdaExecutionRole",
                    "Arn"
                ]
            }
        },
        "S3BucketName": {
            "Description": "The name of the S3 bucket",
            "Value": {
                "Ref": "S3BucketName"
            }
        },
        "LambdaDLQUrl": {
            "Description": "URL of the Lambda Dead Letter Queue",
            "Value": {
                "Ref": "LambdaDLQ"
            }
        }
    }
}