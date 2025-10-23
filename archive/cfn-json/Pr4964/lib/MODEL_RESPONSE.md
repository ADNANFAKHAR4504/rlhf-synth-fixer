```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Carbon Credit Trading Platform - Serverless Architecture with Blockchain",
  "Resources": {
    "CarbonCreditBlockchainNetwork": {
      "Type": "AWS::ManagedBlockchain::Network",
      "Properties": {
        "Name": "CarbonCreditNetwork",
        "Description": "Hyperledger Fabric network for carbon credit trading",
        "Framework": "HYPERLEDGER_FABRIC",
        "FrameworkVersion": "2.2",
        "NetworkConfiguration": {
          "Name": "CarbonCreditNetwork",
          "Description": "Network for carbon credit trading and tracking",
          "Framework": "HYPERLEDGER_FABRIC",
          "FrameworkVersion": "2.2",
          "NetworkFrameworkConfiguration": {
            "NetworkFabricConfiguration": {
              "Edition": "STANDARD"
            }
          },
          "VotingPolicy": {
            "ApprovalThresholdPolicy": {
              "ProposalDurationInHours": 24,
              "ThresholdComparator": "GREATER_THAN_OR_EQUAL_TO",
              "ThresholdPercentage": 51
            }
          }
        }
      }
    },
    "BlockchainMember": {
      "Type": "AWS::ManagedBlockchain::Member",
      "DependsOn": "CarbonCreditBlockchainNetwork",
      "Properties": {
        "NetworkId": {
          "Ref": "CarbonCreditBlockchainNetwork"
        },
        "MemberConfiguration": {
          "Name": "CarbonTradingMember",
          "Description": "Primary member for carbon credit platform",
          "MemberFrameworkConfiguration": {
            "MemberFabricConfiguration": {
              "AdminUsername": "admin",
              "AdminPassword": "Admin123!"
            }
          }
        }
      }
    },
    "BlockchainNode": {
      "Type": "AWS::ManagedBlockchain::Node",
      "DependsOn": "BlockchainMember",
      "Properties": {
        "MemberId": {
          "Ref": "BlockchainMember"
        },
        "NetworkId": {
          "Ref": "CarbonCreditBlockchainNetwork"
        },
        "NodeConfiguration": {
          "AvailabilityZone": {
            "Fn::Select": [
              0,
              {
                "Fn::GetAZs": ""
              }
            ]
          },
          "InstanceType": "bc.t3.small"
        }
      }
    },
    "TradeTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": "CarbonCreditTradeTable",
        "AttributeDefinitions": [
          {
            "AttributeName": "TradeID",
            "AttributeType": "S"
          },
          {
            "AttributeName": "Status",
            "AttributeType": "S"
          },
          {
            "AttributeName": "VintageYear",
            "AttributeType": "N"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "TradeID",
            "KeyType": "HASH"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "StatusIndex",
            "Keys": [
              {
                "AttributeName": "Status",
                "KeyType": "HASH"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            },
            "ProvisionedThroughput": {
              "ReadCapacityUnits": 10,
              "WriteCapacityUnits": 10
            }
          },
          {
            "IndexName": "VintageYearIndex",
            "Keys": [
              {
                "AttributeName": "VintageYear",
                "KeyType": "HASH"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            },
            "ProvisionedThroughput": {
              "ReadCapacityUnits": 5,
              "WriteCapacityUnits": 5
            }
          }
        ],
        "BillingMode": "PROVISIONED",
        "ProvisionedThroughput": {
          "ReadCapacityUnits": 25,
          "WriteCapacityUnits": 25
        },
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "SSESpecification": {
          "SSEEnabled": true
        }
      }
    },
    "TradeTableScalingTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "MaxCapacity": 100,
        "MinCapacity": 25,
        "ResourceId": {
          "Fn::Sub": "table/${TradeTable}"
        },
        "RoleARN": {
          "Fn::GetAtt": ["DynamoDBAutoScalingRole", "Arn"]
        },
        "ScalableDimension": "dynamodb:table:WriteCapacityUnits",
        "ServiceNamespace": "dynamodb"
      }
    },
    "TradeTableScalingPolicy": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": "TradeTableScalingPolicy",
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {
          "Ref": "TradeTableScalingTarget"
        },
        "TargetTrackingScalingPolicyConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "DynamoDBWriteCapacityUtilization"
          },
          "TargetValue": 70.0
        }
      }
    },
    "CertificateTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": "CarbonCreditCertificateTable",
        "AttributeDefinitions": [
          {
            "AttributeName": "CertificateID",
            "AttributeType": "S"
          },
          {
            "AttributeName": "CreditID",
            "AttributeType": "S"
          },
          {
            "AttributeName": "OwnerID",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "CertificateID",
            "KeyType": "HASH"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "CreditIDIndex",
            "Keys": [
              {
                "AttributeName": "CreditID",
                "KeyType": "HASH"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            },
            "ProvisionedThroughput": {
              "ReadCapacityUnits": 5,
              "WriteCapacityUnits": 5
            }
          },
          {
            "IndexName": "OwnerIDIndex",
            "Keys": [
              {
                "AttributeName": "OwnerID",
                "KeyType": "HASH"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            },
            "ProvisionedThroughput": {
              "ReadCapacityUnits": 5,
              "WriteCapacityUnits": 5
            }
          }
        ],
        "BillingMode": "PROVISIONED",
        "ProvisionedThroughput": {
          "ReadCapacityUnits": 10,
          "WriteCapacityUnits": 10
        },
        "SSESpecification": {
          "SSEEnabled": true
        }
      }
    },
    "DynamoDBAutoScalingRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "application-autoscaling.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/DynamoDBAutoscalingRole"
        ]
      }
    },
    "TradeMatchingEngineFunctionRole": {
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "TradeMatchingEnginePolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:BatchWriteItem"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["TradeTable", "Arn"]
                    },
                    {
                      "Fn::Sub": "${TradeTable.Arn}/index/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:DescribeStream",
                    "dynamodb:GetRecords",
                    "dynamodb:GetShardIterator",
                    "dynamodb:ListStreams"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["TradeTable", "StreamArn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "managedblockchain:InvokeRawTransaction"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "TradeMatchingEngineFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "TradeMatchingEngine",
        "Runtime": "nodejs18.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["TradeMatchingEngineFunctionRole", "Arn"]
        },
        "Timeout": 30,
        "MemorySize": 1024,
        "ReservedConcurrentExecutions": 100,
        "Environment": {
          "Variables": {
            "TRADE_TABLE": {
              "Ref": "TradeTable"
            },
            "NETWORK_ID": {
              "Ref": "CarbonCreditBlockchainNetwork"
            },
            "MEMBER_ID": {
              "Ref": "BlockchainMember"
            }
          }
        },
        "Code": {
          "ZipFile": "exports.handler = async (event) => { console.log('Trade matching logic implementation'); return { statusCode: 200 }; };"
        }
      }
    },
    "TradeTableStreamMapping": {
      "Type": "AWS::Lambda::EventSourceMapping",
      "Properties": {
        "EventSourceArn": {
          "Fn::GetAtt": ["TradeTable", "StreamArn"]
        },
        "FunctionName": {
          "Ref": "TradeMatchingEngineFunction"
        },
        "StartingPosition": "LATEST",
        "MaximumBatchingWindowInSeconds": 1
      }
    },
    "ApiGatewayHandlerFunctionRole": {
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "ApiGatewayHandlerPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:Query"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["TradeTable", "Arn"]
                    },
                    {
                      "Fn::Sub": "${TradeTable.Arn}/index/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "states:StartExecution"
                  ],
                  "Resource": {
                    "Ref": "VerificationStateMachine"
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "ApiGatewayHandlerFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "ApiGatewayHandler",
        "Runtime": "nodejs18.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["ApiGatewayHandlerFunctionRole", "Arn"]
        },
        "Timeout": 10,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "TRADE_TABLE": {
              "Ref": "TradeTable"
            },
            "STATE_MACHINE_ARN": {
              "Ref": "VerificationStateMachine"
            }
          }
        },
        "Code": {
          "ZipFile": "exports.handler = async (event) => { console.log('API Gateway handler implementation'); return { statusCode: 200, body: JSON.stringify({ message: 'Success' }) }; };"
        }
      }
    },
    "CertificateGenerationFunctionRole": {
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "CertificateGenerationPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                  ],
                  "Resource": {
                    "Fn::Sub": "${CertificateBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["CertificateTable", "Arn"]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "CertificateGenerationFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "CertificateGeneration",
        "Runtime": "nodejs18.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["CertificateGenerationFunctionRole", "Arn"]
        },
        "Timeout": 60,
        "MemorySize": 1024,
        "Environment": {
          "Variables": {
            "CERTIFICATE_BUCKET": {
              "Ref": "CertificateBucket"
            },
            "CERTIFICATE_TABLE": {
              "Ref": "CertificateTable"
            }
          }
        },
        "Code": {
          "ZipFile": "exports.handler = async (event) => { console.log('Certificate generation with QR code implementation'); return { statusCode: 200 }; };"
        }
      }
    },
    "QLDBAuditLoggerFunctionRole": {
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "QLDBAuditLoggerPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "qldb:SendCommand",
                    "qldb:ExecuteStatement"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["CarbonPlatformAuditTrail", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:Query"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["TradeTable", "Arn"]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "QLDBAuditLoggerFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "QLDBAuditLogger",
        "Runtime": "nodejs18.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["QLDBAuditLoggerFunctionRole", "Arn"]
        },
        "Timeout": 15,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "LEDGER_NAME": "CarbonPlatformAuditTrail"
          }
        },
        "Code": {
          "ZipFile": "exports.handler = async (event) => { console.log('QLDB audit logging implementation'); return { statusCode: 200 }; };"
        }
      }
    },
    "TradingAPI": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": "CarbonCreditTradingAPI",
        "Description": "REST API for carbon credit trading platform",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        }
      }
    },
    "TradeResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "ParentId": {
          "Fn::GetAtt": ["TradingAPI", "RootResourceId"]
        },
        "PathPart": "trade",
        "RestApiId": {
          "Ref": "TradingAPI"
        }
      }
    },
    "TradeIdResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "ParentId": {
          "Ref": "TradeResource"
        },
        "PathPart": "{id}",
        "RestApiId": {
          "Ref": "TradingAPI"
        }
      }
    },
    "TradePostMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "HttpMethod": "POST",
        "ResourceId": {
          "Ref": "TradeResource"
        },
        "RestApiId": {
          "Ref": "TradingAPI"
        },
        "AuthorizationType": "AWS_IAM",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ApiGatewayHandlerFunction.Arn}/invocations"
          }
        }
      }
    },
    "TradeGetMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "HttpMethod": "GET",
        "ResourceId": {
          "Ref": "TradeIdResource"
        },
        "RestApiId": {
          "Ref": "TradingAPI"
        },
        "AuthorizationType": "AWS_IAM",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ApiGatewayHandlerFunction.Arn}/invocations"
          }
        }
      }
    },
    "ApiGatewayDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": ["TradePostMethod", "TradeGetMethod"],
      "Properties": {
        "RestApiId": {
          "Ref": "TradingAPI"
        },
        "StageName": "prod"
      }
    },
    "ApiGatewayInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "ApiGatewayHandlerFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${TradingAPI}/*/*"
        }
      }
    },
    "CertificateBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "carbon-credit-certificates-${AWS::AccountId}"
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
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "ArchiveOldCertificates",
              "Status": "Enabled",
              "Transitions": [
                {
                  "StorageClass": "GLACIER",
                  "TransitionInDays": 365
                }
              ]
            }
          ]
        }
      }
    },
    "CarbonPlatformAuditTrail": {
      "Type": "AWS::QLDB::Ledger",
      "Properties": {
        "Name": "CarbonPlatformAuditTrail",
        "DeletionProtection": true,
        "PermissionsMode": "STANDARD"
      }
    },
    "VerificationStateMachineRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "states.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "StepFunctionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "lambda:InvokeFunction"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "VerificationStateMachine": {
      "Type": "AWS::StepFunctions::StateMachine",
      "Properties": {
        "StateMachineName": "CarbonCreditVerificationWorkflow",
        "RoleArn": {
          "Fn::GetAtt": ["VerificationStateMachineRole", "Arn"]
        },
        "DefinitionString": {
          "Fn::Sub": "{\"Comment\":\"Carbon credit verification workflow\",\"StartAt\":\"InitiateVerification\",\"States\":{\"InitiateVerification\":{\"Type\":\"Task\",\"Resource\":\"${ApiGatewayHandlerFunction.Arn}\",\"Next\":\"ThirdPartyValidation\"},\"ThirdPartyValidation\":{\"Type\":\"Task\",\"Resource\":\"${ApiGatewayHandlerFunction.Arn}\",\"Next\":\"CheckValidationStatus\"},\"CheckValidationStatus\":{\"Type\":\"Choice\",\"Choices\":[{\"Variable\":\"$.status\",\"StringEquals\":\"APPROVED\",\"Next\":\"GenerateCertificate\"},{\"Variable\":\"$.status\",\"StringEquals\":\"REJECTED\",\"Next\":\"VerificationFailed\"}],\"Default\":\"PendingReview\"},\"PendingReview\":{\"Type\":\"Wait\",\"Seconds\":300,\"Next\":\"ThirdPartyValidation\"},\"GenerateCertificate\":{\"Type\":\"Task\",\"Resource\":\"${CertificateGenerationFunction.Arn}\",\"Next\":\"LogToAudit\"},\"LogToAudit\":{\"Type\":\"Task\",\"Resource\":\"${QLDBAuditLoggerFunction.Arn}\",\"End\":true},\"VerificationFailed\":{\"Type\":\"Fail\",\"Error\":\"VerificationFailed\",\"Cause\":\"Third-party validation rejected\"}}}"
        }
      }
    }
  }
}
```