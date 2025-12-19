```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless static website infrastructure with contact form backend",

  "Parameters": {
    "DomainName": {
      "Type": "String",
      "Description": "The custom domain name for the website",
      "AllowedPattern": "^[a-z0-9]+([\\-\\.]{1}[a-z0-9]+)*\\.[a-z]{2,6}$",
      "ConstraintDescription": "Must be a valid domain name format"
    },
    "SenderEmail": {
      "Type": "String",
      "Description": "Verified SES sender email address",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "ConstraintDescription": "Must be a valid email address"
    },
    "ReceiverEmail": {
      "Type": "String",
      "Description": "Email address to receive contact form submissions",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "ConstraintDescription": "Must be a valid email address"
    }
  },

  "Resources": {
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${AWS::StackName}-website-bucket"
        },
        "WebsiteConfiguration": {
          "IndexDocument": "index.html",
          "ErrorDocument": "error.html"
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": false,
          "BlockPublicPolicy": false,
          "IgnorePublicAcls": false,
          "RestrictPublicBuckets": false
        },
        "Tags": [
          {
            "Key": "Project",
            "Value": "iac-rlhf-amazon"
          }
        ]
      }
    },

    "S3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "S3Bucket"
        },
        "PolicyDocument": {
          "Statement": [
            {
              "Sid": "PublicReadGetObject",
              "Effect": "Allow",
              "Principal": "*",
              "Action": "s3:GetObject",
              "Resource": {
                "Fn::Sub": "${S3Bucket.Arn}/*"
              }
            }
          ]
        }
      }
    },

    "CloudFrontOriginAccessIdentity": {
      "Type": "AWS::CloudFront::CloudFrontOriginAccessIdentity",
      "Properties": {
        "CloudFrontOriginAccessIdentityConfig": {
          "Comment": {
            "Fn::Sub": "OAI for ${AWS::StackName}"
          }
        }
      }
    },

    "CloudFrontDistribution": {
      "Type": "AWS::CloudFront::Distribution",
      "DependsOn": ["S3Bucket"],
      "Properties": {
        "DistributionConfig": {
          "Enabled": true,
          "Comment": {
            "Fn::Sub": "CloudFront distribution for ${DomainName}"
          },
          "DefaultRootObject": "index.html",
          "Origins": [
            {
              "Id": "S3Origin",
              "DomainName": {
                "Fn::GetAtt": ["S3Bucket", "RegionalDomainName"]
              },
              "S3OriginConfig": {
                "OriginAccessIdentity": {
                  "Fn::Sub": "origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}"
                }
              }
            }
          ],
          "DefaultCacheBehavior": {
            "TargetOriginId": "S3Origin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "AllowedMethods": ["GET", "HEAD"],
            "CachedMethods": ["GET", "HEAD"],
            "Compress": true,
            "ForwardedValues": {
              "QueryString": false,
              "Cookies": {
                "Forward": "none"
              }
            }
          },
          "ViewerCertificate": {
            "CloudFrontDefaultCertificate": true
          },
          "Aliases": [
            {
              "Ref": "DomainName"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Project",
            "Value": "iac-rlhf-amazon"
          }
        ]
      }
    },

    "Route53RecordSet": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneName": {
          "Fn::Sub": "${DomainName}."
        },
        "Name": {
          "Ref": "DomainName"
        },
        "Type": "A",
        "AliasTarget": {
          "DNSName": {
            "Fn::GetAtt": ["CloudFrontDistribution", "DomainName"]
          },
          "HostedZoneId": "Z2FDTNDATAQYW2",
          "EvaluateTargetHealth": false
        }
      }
    },

    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "${AWS::StackName}-lambda-execution-role"
        },
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
            "PolicyName": "SESPermissions",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["ses:SendEmail", "ses:SendRawEmail"],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Project",
            "Value": "iac-rlhf-amazon"
          }
        ]
      }
    },

    "ContactFormLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${AWS::StackName}-contact-form-processor"
        },
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "Environment": {
          "Variables": {
            "SENDER_EMAIL": {
              "Ref": "SenderEmail"
            },
            "RECEIVER_EMAIL": {
              "Ref": "ReceiverEmail"
            },
            "REGION": "us-west-2"
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nfrom botocore.exceptions import ClientError\n\ndef lambda_handler(event, context):\n    try:\n        # Parse the incoming request\n        body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']\n        \n        name = body.get('name', '')\n        email = body.get('email', '')\n        message = body.get('message', '')\n        \n        # Validate required fields\n        if not all([name, email, message]):\n            return {\n                'statusCode': 400,\n                'headers': {\n                    'Access-Control-Allow-Origin': '*',\n                    'Access-Control-Allow-Headers': 'Content-Type',\n                    'Access-Control-Allow-Methods': 'POST, OPTIONS'\n                },\n                'body': json.dumps({'error': 'Missing required fields'})\n            }\n        \n        # Initialize SES client\n        ses = boto3.client('ses', region_name=os.environ['REGION'])\n        \n        # Compose email\n        email_body = f\"\"\"New contact form submission:\n        \nName: {name}\nEmail: {email}\nMessage: {message}\"\"\"\n        \n        # Send email\n        response = ses.send_email(\n            Source=os.environ['SENDER_EMAIL'],\n            Destination={'ToAddresses': [os.environ['RECEIVER_EMAIL']]},\n            Message={\n                'Subject': {'Data': f'Contact Form Submission from {name}'},\n                'Body': {'Text': {'Data': email_body}}\n            }\n        )\n        \n        return {\n            'statusCode': 200,\n            'headers': {\n                'Access-Control-Allow-Origin': '*',\n                'Access-Control-Allow-Headers': 'Content-Type',\n                'Access-Control-Allow-Methods': 'POST, OPTIONS'\n            },\n            'body': json.dumps({'message': 'Email sent successfully'})\n        }\n        \n    except ClientError as e:\n        print(f\"Error sending email: {e}\")\n        return {\n            'statusCode': 500,\n            'headers': {\n                'Access-Control-Allow-Origin': '*',\n                'Access-Control-Allow-Headers': 'Content-Type',\n                'Access-Control-Allow-Methods': 'POST, OPTIONS'\n            },\n            'body': json.dumps({'error': 'Failed to send email'})\n        }\n    except Exception as e:\n        print(f\"Unexpected error: {e}\")\n        return {\n            'statusCode': 500,\n            'headers': {\n                'Access-Control-Allow-Origin': '*',\n                'Access-Control-Allow-Headers': 'Content-Type',\n                'Access-Control-Allow-Methods': 'POST, OPTIONS'\n            },\n            'body': json.dumps({'error': 'Internal server error'})\n        }\n"
        },
        "Timeout": 30,
        "Tags": [
          {
            "Key": "Project",
            "Value": "iac-rlhf-amazon"
          }
        ]
      }
    },

    "ApiGatewayRestApi": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-contact-api"
        },
        "Description": "API for contact form submissions",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        },
        "Tags": [
          {
            "Key": "Project",
            "Value": "iac-rlhf-amazon"
          }
        ]
      }
    },

    "ApiGatewayResourceContact": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGatewayRestApi"
        },
        "ParentId": {
          "Fn::GetAtt": ["ApiGatewayRestApi", "RootResourceId"]
        },
        "PathPart": "contact"
      }
    },

    "ApiGatewayMethodContactOptions": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGatewayRestApi"
        },
        "ResourceId": {
          "Ref": "ApiGatewayResourceContact"
        },
        "HttpMethod": "OPTIONS",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "MOCK",
          "IntegrationResponses": [
            {
              "StatusCode": "200",
              "ResponseParameters": {
                "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                "method.response.header.Access-Control-Allow-Methods": "'POST,OPTIONS'",
                "method.response.header.Access-Control-Allow-Origin": "'*'"
              },
              "ResponseTemplates": {
                "application/json": ""
              }
            }
          ],
          "PassthroughBehavior": "WHEN_NO_MATCH",
          "RequestTemplates": {
            "application/json": "{\"statusCode\": 200}"
          }
        },
        "MethodResponses": [
          {
            "StatusCode": "200",
            "ResponseModels": {
              "application/json": "Empty"
            },
            "ResponseParameters": {
              "method.response.header.Access-Control-Allow-Headers": false,
              "method.response.header.Access-Control-Allow-Methods": false,
              "method.response.header.Access-Control-Allow-Origin": false
            }
          }
        ]
      }
    },

    "ApiGatewayMethodContactPost": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGatewayRestApi"
        },
        "ResourceId": {
          "Ref": "ApiGatewayResourceContact"
        },
        "HttpMethod": "POST",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ContactFormLambda.Arn}/invocations"
          }
        },
        "MethodResponses": [
          {
            "StatusCode": "200",
            "ResponseParameters": {
              "method.response.header.Access-Control-Allow-Origin": false
            }
          }
        ]
      }
    },

    "LambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "ContactFormLambda"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/*"
        }
      }
    },

    "ApiGatewayDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": [
        "ApiGatewayMethodContactPost",
        "ApiGatewayMethodContactOptions"
      ],
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGatewayRestApi"
        },
        "StageName": "prod",
        "StageDescription": {
          "Tags": [
            {
              "Key": "Project",
              "Value": "iac-rlhf-amazon"
            }
          ]
        }
      }
    },

    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${AWS::StackName}-lambda-errors"
        },
        "AlarmDescription": "Alarm when Lambda function has errors",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 0,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "ContactFormLambda"
            }
          }
        ],
        "TreatMissingData": "notBreaching",
        "Tags": [
          {
            "Key": "Project",
            "Value": "iac-rlhf-amazon"
          }
        ]
      }
    }
  },

  "Outputs": {
    "WebsiteURL": {
      "Description": "URL of the website via CloudFront",
      "Value": {
        "Fn::Sub": "https://${CloudFrontDistribution.DomainName}"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-WebsiteURL"
        }
      }
    },
    "ApiEndpoint": {
      "Description": "API Gateway endpoint for contact form",
      "Value": {
        "Fn::Sub": "https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/prod/contact"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ApiEndpoint"
        }
      }
    },
    "S3BucketName": {
      "Description": "Name of the S3 bucket for website content",
      "Value": {
        "Ref": "S3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3BucketName"
        }
      }
    },
    "CloudFrontDistributionId": {
      "Description": "CloudFront Distribution ID",
      "Value": {
        "Ref": "CloudFrontDistribution"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CloudFrontDistributionId"
        }
      }
    }
  }
}
```
