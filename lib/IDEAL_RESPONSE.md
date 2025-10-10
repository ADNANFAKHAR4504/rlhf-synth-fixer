

```json

{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure Web Application Infrastructure with S3, Lambda, CloudFront, WAF, and API Gateway",

  "Parameters": {
    "VpcId": {
      "Type": "String",
      "Default": "",
      "Description": "The VPC ID where resources will be deployed (optional, not currently used)"
    },
    "Environment": {
      "Type": "String",
      "Default": "Development",
      "AllowedValues": ["Development", "Staging", "Production"],
      "Description": "Environment name for tagging"
    },
    "ProjectName": {
      "Type": "String",
      "Default": "secure-web-app",
      "Description": "Project name for tagging"
    },
    "Owner": {
      "Type": "String",
      "Default": "DevOps Team",
      "Description": "Owner name for tagging"
    },
    "ACMCertificateArn": {
      "Type": "String",
      "Default": "",
      "Description": "ARN of the ACM certificate for CloudFront (optional, must be in us-east-1 if provided)"
    }
  },

  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": { "default": "Network Configuration" },
          "Parameters": ["VpcId"]
        },
        {
          "Label": { "default": "SSL Configuration" },
          "Parameters": ["ACMCertificateArn"]
        },
        {
          "Label": { "default": "Tagging Configuration" },
          "Parameters": ["Environment", "ProjectName", "Owner"]
        }
      ]
    }
  },

  "Conditions": {
    "HasSSLCertificate": {
      "Fn::Not": [
        {
          "Fn::Equals": [
            { "Ref": "ACMCertificateArn" },
            ""
          ]
        }
      ]
    },
    "IsUsEast1": {
      "Fn::Equals": [
        { "Ref": "AWS::Region" },
        "us-east-1"
      ]
    }
  },

  "Resources": {
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "Customer-managed KMS key for S3 bucket encryption",
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": { "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root" }
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow S3 to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "s3.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:Encrypt",
                "kms:GenerateDataKey"
              ],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } }
        ]
      }
    },

    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": { "Fn::Sub": "alias/${ProjectName}-s3-key" },
        "TargetKeyId": { "Ref": "KMSKey" }
      }
    },

    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "${ProjectName}-assets-${AWS::AccountId}" },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": { "Ref": "KMSKey" }
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } }
        ]
      }
    },

    "S3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": { "Ref": "S3Bucket" },
        "PolicyDocument": {
          "Statement": [
            {
              "Sid": "AllowCloudFrontAccess",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudfront.amazonaws.com"
              },
              "Action": "s3:GetObject",
              "Resource": { "Fn::Sub": "${S3Bucket.Arn}/*" },
              "Condition": {
                "StringEquals": {
                  "AWS:SourceArn": { "Fn::Sub": "arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}" }
                }
              }
            }
          ]
        }
      }
    },

    "OriginAccessControl": {
      "Type": "AWS::CloudFront::OriginAccessControl",
      "Properties": {
        "OriginAccessControlConfig": {
          "Name": { "Fn::Sub": "${ProjectName}-OAC" },
          "OriginAccessControlOriginType": "s3",
          "SigningBehavior": "always",
          "SigningProtocol": "sigv4"
        }
      }
    },

    "ApiSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": { "Fn::Sub": "${ProjectName}-api-key" },
        "Description": "API key for Lambda function",
        "SecretString": {
          "Fn::Sub": "{\"apiKey\":\"${AWS::StackId}\"}"
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } }
        ]
      }
    },

    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": { "Fn::Sub": "${ProjectName}-lambda-execution-role" },
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "SecretsManagerReadOnly",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                  ],
                  "Resource": { "Ref": "ApiSecret" }
                }
              ]
            }
          },
          {
            "PolicyName": "S3ReadOnly",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion"
                  ],
                  "Resource": { "Fn::Sub": "${S3Bucket.Arn}/*" }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:ListBucket"
                  ],
                  "Resource": { "Fn::GetAtt": ["S3Bucket", "Arn"] }
                }
              ]
            }
          },
          {
            "PolicyName": "KMSDecrypt",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:DescribeKey"
                  ],
                  "Resource": { "Fn::GetAtt": ["KMSKey", "Arn"] }
                }
              ]
            }
          }
        ],
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } }
        ]
      }
    },

    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": { "Fn::Sub": "${ProjectName}-function" },
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\n\ndef lambda_handler(event, context):\n    secrets_client = boto3.client('secretsmanager')\n    secret_name = os.environ['SECRET_NAME']\n    \n    try:\n        response = secrets_client.get_secret_value(SecretId=secret_name)\n        secret = json.loads(response['SecretString'])\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({'message': 'Function executed successfully'})\n        }\n    except Exception as e:\n        return {\n            'statusCode': 500,\n            'body': json.dumps({'error': str(e)})\n        }\n"
        },
        "Environment": {
          "Variables": {
            "SECRET_NAME": { "Ref": "ApiSecret" },
            "S3_BUCKET": { "Ref": "S3Bucket" }
          }
        },
        "Timeout": 30,
        "MemorySize": 256,
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } }
        ]
      }
    },

    "WAFWebACL": {
      "Type": "AWS::WAFv2::WebACL",
      "Condition": "IsUsEast1",
      "Properties": {
        "Name": { "Fn::Sub": "${ProjectName}-WebACL" },
        "Scope": "CLOUDFRONT",
        "DefaultAction": {
          "Allow": {}
        },
        "Rules": [
          {
            "Name": "RateLimitRule",
            "Priority": 1,
            "Statement": {
              "RateBasedStatement": {
                "Limit": 2000,
                "AggregateKeyType": "IP"
              }
            },
            "Action": {
              "Block": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "RateLimitRule"
            }
          },
          {
            "Name": "AWSManagedRulesCommonRuleSet",
            "Priority": 2,
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesCommonRuleSet"
              }
            },
            "OverrideAction": {
              "None": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "CommonRuleSetMetric"
            }
          },
          {
            "Name": "AWSManagedRulesKnownBadInputsRuleSet",
            "Priority": 3,
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesKnownBadInputsRuleSet"
              }
            },
            "OverrideAction": {
              "None": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "KnownBadInputsMetric"
            }
          }
        ],
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": { "Fn::Sub": "${ProjectName}-WebACL" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } }
        ]
      }
    },

    "CloudFrontDistribution": {
      "Type": "AWS::CloudFront::Distribution",
      "Properties": {
        "DistributionConfig": {
          "Enabled": true,
          "Comment": { "Fn::Sub": "${ProjectName} CloudFront Distribution" },
          "DefaultRootObject": "index.html",
          "Origins": [
            {
              "Id": "S3Origin",
              "DomainName": { "Fn::GetAtt": ["S3Bucket", "RegionalDomainName"] },
              "S3OriginConfig": {
                "OriginAccessIdentity": ""
              },
              "OriginAccessControlId": { "Ref": "OriginAccessControl" }
            }
          ],
          "DefaultCacheBehavior": {
            "TargetOriginId": "S3Origin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
            "CachedMethods": ["GET", "HEAD"],
            "Compress": true,
            "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
            "ResponseHeadersPolicyId": "67f7725c-6f97-4210-82d7-5512b31e9d03"
          },
          "PriceClass": "PriceClass_100",
          "ViewerCertificate": {
            "Fn::If": [
              "HasSSLCertificate",
              {
                "AcmCertificateArn": { "Ref": "ACMCertificateArn" },
                "SslSupportMethod": "sni-only",
                "MinimumProtocolVersion": "TLSv1.2_2021"
              },
              {
                "CloudFrontDefaultCertificate": true
              }
            ]
          },
          "WebACLId": {
            "Fn::If": [
              "IsUsEast1",
              { "Fn::GetAtt": ["WAFWebACL", "Arn"] },
              { "Ref": "AWS::NoValue" }
            ]
          },
          "HttpVersion": "http2and3"
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } }
        ]
      }
    },

    "ApiGatewayLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": { "Fn::Sub": "/aws/apigateway/${ProjectName}" },
        "RetentionInDays": 30
      }
    },

    "ApiGatewayRestApi": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": { "Fn::Sub": "${ProjectName}-API" },
        "Description": "Secure API Gateway for web application",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } }
        ]
      }
    },

    "ApiGatewayAccount": {
      "Type": "AWS::ApiGateway::Account",
      "Properties": {
        "CloudWatchRoleArn": { "Fn::GetAtt": ["ApiGatewayCloudWatchRole", "Arn"] }
      }
    },

    "ApiGatewayCloudWatchRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "apigateway.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
        ],
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } }
        ]
      }
    },

    "ApiGatewayResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "ParentId": { "Fn::GetAtt": ["ApiGatewayRestApi", "RootResourceId"] },
        "PathPart": "data",
        "RestApiId": { "Ref": "ApiGatewayRestApi" }
      }
    },

    "ApiGatewayMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "HttpMethod": "GET",
        "ResourceId": { "Ref": "ApiGatewayResource" },
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": { "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations" }
        }
      }
    },

    "ApiGatewayDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": ["ApiGatewayMethod"],
      "Properties": {
        "RestApiId": { "Ref": "ApiGatewayRestApi" }
      }
    },

    "ApiGatewayStage": {
      "Type": "AWS::ApiGateway::Stage",
      "Properties": {
        "StageName": "prod",
        "RestApiId": { "Ref": "ApiGatewayRestApi" },
        "DeploymentId": { "Ref": "ApiGatewayDeployment" },
        "MethodSettings": [
          {
            "ResourcePath": "/*",
            "HttpMethod": "*",
            "LoggingLevel": "INFO",
            "DataTraceEnabled": true,
            "MetricsEnabled": true,
            "ThrottlingBurstLimit": 5000,
            "ThrottlingRateLimit": 10000
          }
        ],
        "AccessLogSetting": {
          "DestinationArn": { "Fn::GetAtt": ["ApiGatewayLogGroup", "Arn"] },
          "Format": "$context.requestId $context.error.message $context.error.messageString $context.extendedRequestId"
        },
        "TracingEnabled": true,
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "ProjectName" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } }
        ]
      }
    },

    "LambdaApiGatewayPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": { "Ref": "LambdaFunction" },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": { "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/*" }
      }
    }
  },

  "Outputs": {
    "S3BucketName": {
      "Description": "Name of the S3 bucket",
      "Value": { "Ref": "S3Bucket" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-S3Bucket" }
      }
    },
    "CloudFrontDistributionDomain": {
      "Description": "CloudFront distribution domain name",
      "Value": { "Fn::GetAtt": ["CloudFrontDistribution", "DomainName"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-CloudFrontDomain" }
      }
    },
    "ApiGatewayUrl": {
      "Description": "API Gateway URL",
      "Value": { "Fn::Sub": "https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/prod" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-ApiUrl" }
      }
    },
    "LambdaFunctionArn": {
      "Description": "Lambda function ARN",
      "Value": { "Fn::GetAtt": ["LambdaFunction", "Arn"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-LambdaArn" }
      }
    }
  }
}
```