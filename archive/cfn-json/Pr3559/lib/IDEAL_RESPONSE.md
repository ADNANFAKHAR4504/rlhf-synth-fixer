```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Complete infrastructure for a serverless static portfolio website with a secure contact form backend. Best practices include using a CloudFront OAI for private S3 bucket access.",
  "Parameters": {
    "DomainName": {
      "Type": "String",
      "Description": "The custom domain name for the portfolio website (e.g., my-portfolio.example.com)",
      "Default": "my-portfolio.example.com"
    },
    "SenderEmail": {
      "Type": "String",
      "Description": "The verified SES email address that will send emails from the contact form.",
      "Default": "sender@example.com"
    },
    "ReceiverEmail": {
      "Type": "String",
      "Description": "The email address that will receive the contact form submissions.",
      "Default": "receiver@example.com"
    }
  },
  "Resources": {
    "WebsiteBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "WebsiteConfiguration": {
          "IndexDocument": "index.html",
          "ErrorDocument": "error.html"
        },
        "Tags": [
          {
            "Key": "Project",
            "Value": "iac-rlhf-amazon"
          }
        ]
      }
    },
    "CloudFrontOriginAccessIdentity": {
      "Type": "AWS::CloudFront::CloudFrontOriginAccessIdentity",
      "Properties": {
        "CloudFrontOriginAccessIdentityConfig": {
          "Comment": {
            "Fn::Sub": "OAI for ${DomainName}"
          }
        }
      }
    },
    "WebsiteBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "WebsiteBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AllowCloudFrontAccess",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOriginAccessIdentity}"
                }
              },
              "Action": "s3:GetObject",
              "Resource": {
                "Fn::Sub": "${WebsiteBucket.Arn}/*"
              }
            }
          ]
        }
      }
    },
    "CloudFrontDistribution": {
      "Type": "AWS::CloudFront::Distribution",
      "Properties": {
        "DistributionConfig": {
          "Enabled": true,
          "DefaultRootObject": "index.html",
          "Origins": [
            {
              "Id": "S3Origin",
              "DomainName": {
                "Fn::GetAtt": ["WebsiteBucket", "DomainName"]
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
            "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
            "CachedMethods": ["GET", "HEAD"],
            "ForwardedValues": {
              "QueryString": false
            },
            "Compress": true
          },
          "PriceClass": "PriceClass_100",
          "ViewerCertificate": {
            "CloudFrontDefaultCertificate": true
          }
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
          "HostedZoneId": "Z2FDTNDATAQYW2"
        }
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
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "SESEmailPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": "ses:SendEmail",
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
        "Runtime": "python3.12",
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
            }
          }
        },
        "Code": {
          "ZipFile": "import json\nimport os\nimport boto3\nfrom botocore.exceptions import ClientError\n\nses_client = boto3.client('ses')\n\ndef lambda_handler(event, context):\n    try:\n        body = json.loads(event.get('body', '{}'))\n        name = body.get('name', 'Unknown')\n        email = body.get('email', 'no-reply@example.com')\n        message = body.get('message', '')\n        \n        sender_email = os.environ['SENDER_EMAIL']\n        receiver_email = os.environ['RECEIVER_EMAIL']\n        \n        email_subject = f'Portfolio Contact Form Submission from {name}'\n        email_body = f\"\"\"You have received a new contact form submission:\\n\\nName: {name}\\nEmail: {email}\\n\\nMessage:\\n{message}\n\"\"\"\n        \n        ses_client.send_email(\n            Source=sender_email,\n            Destination={'ToAddresses': [receiver_email]},\n            Message={\n                'Subject': {'Data': email_subject, 'Charset': 'UTF-8'},\n                'Body': {'Text': {'Data': email_body, 'Charset': 'UTF-8'}}\n            }\n        )\n        \n        return {\n            'statusCode': 200,\n            'headers': {\n                'Access-Control-Allow-Origin': '*',\n                'Access-Control-Allow-Headers': 'Content-Type',\n                'Access-Control-Allow-Methods': 'POST, OPTIONS'\n            },\n            'body': json.dumps({'message': 'Contact form submission successful'})\n        }\n    \n    except Exception as e:\n        print(f'Error: {str(e)}')\n        return {\n            'statusCode': 500,\n            'headers': {\n                'Access-Control-Allow-Origin': '*',\n                'Access-Control-Allow-Headers': 'Content-Type',\n                'Access-Control-Allow-Methods': 'POST, OPTIONS'\n            },\n            'body': json.dumps({'message': 'An error occurred', 'error': str(e)})\n        }\n"
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
    "ContactFormApi": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": {
          "Fn::Sub": "portfolio-contact-api-${AWS::StackName}"
        },
        "Description": "REST API for portfolio contact form submissions",
        "Tags": [
          {
            "Key": "Project",
            "Value": "iac-rlhf-amazon"
          }
        ]
      }
    },
    "ContactResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "ContactFormApi"
        },
        "ParentId": {
          "Fn::GetAtt": ["ContactFormApi", "RootResourceId"]
        },
        "PathPart": "contact"
      }
    },
    "ContactPostMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "ContactFormApi"
        },
        "ResourceId": {
          "Ref": "ContactResource"
        },
        "HttpMethod": "POST",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ContactFormLambda.Arn}/invocations"
          }
        }
      }
    },
    "ContactOptionsMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "ContactFormApi"
        },
        "ResourceId": {
          "Ref": "ContactResource"
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
              }
            }
          ],
          "RequestTemplates": {
            "application/json": "{\"statusCode\": 200}"
          }
        },
        "MethodResponses": [
          {
            "StatusCode": "200",
            "ResponseParameters": {
              "method.response.header.Access-Control-Allow-Headers": true,
              "method.response.header.Access-Control-Allow-Methods": true,
              "method.response.header.Access-Control-Allow-Origin": true
            }
          }
        ]
      }
    },
    "ApiDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": ["ContactPostMethod", "ContactOptionsMethod"],
      "Properties": {
        "RestApiId": {
          "Ref": "ContactFormApi"
        },
        "StageName": "prod"
      }
    },
    "LambdaApiGatewayPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "ContactFormLambda"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ContactFormApi}/*/*"
        }
      }
    },
    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alarm when the portfolio contact form Lambda function encounters errors",
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
        "TreatMissingData": "notBreaching"
      }
    }
  },
  "Outputs": {
    "WebsiteURL": {
      "Description": "URL of the CloudFront distribution for the portfolio website",
      "Value": {
        "Fn::Sub": "https://${CloudFrontDistribution.DomainName}"
      }
    },
    "ApiEndpoint": {
      "Description": "API Gateway endpoint URL for contact form submissions",
      "Value": {
        "Fn::Sub": "https://${ContactFormApi}.execute-api.${AWS::Region}[.amazonaws.com/prod/contact](https://.amazonaws.com/prod/contact)"
      }
    },
    "S3BucketName": {
      "Description": "Name of the S3 bucket hosting the website files",
      "Value": {
        "Ref": "WebsiteBucket"
      }
    },
    "CloudFrontDistributionId": {
      "Description": "ID of the CloudFront distribution",
      "Value": {
        "Ref": "CloudFrontDistribution"
      }
    }
  }
}
```
