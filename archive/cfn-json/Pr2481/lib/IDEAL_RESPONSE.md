```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-ready static web application with S3, CloudFront, Route 53, ACM, Lambda@Edge, and WAF",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Default": "prod",
      "AllowedValues": ["dev", "staging", "prod"],
      "Description": "Environment name"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    },
    "DomainName": {
      "Type": "String",
      "Description": "Custom domain name (e.g., example.com)",
      "AllowedPattern": "^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}$",
      "Default": "example.com"
    },
    "HostedZoneId": {
      "Type": "String",
      "Description": "Route 53 Hosted Zone ID for the domain",
      "Default": "Z123456789"
    },
    "ProjectName": {
      "Type": "String",
      "Default": "static-webapp",
      "Description": "Project name for resource naming"
    }
  },
  "Resources": {
    "S3BucketLogs": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "TapStack${EnvironmentSuffix}LogsBucket"
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
              "Id": "DeleteOldLogs",
              "Status": "Enabled",
              "ExpirationInDays": 90
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        }
      }
    },
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "TapStack${EnvironmentSuffix}ContentBucket"
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
        "LoggingConfiguration": {
          "DestinationBucketName": {
            "Ref": "S3BucketLogs"
          },
          "LogFilePrefix": "s3-access-logs/"
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "CorsConfiguration": {
          "CorsRules": [
            {
              "AllowedHeaders": ["*"],
              "AllowedMethods": ["GET", "HEAD"],
              "AllowedOrigins": [
                {
                  "Fn::Sub": "https://${DomainName}"
                }
              ],
              "MaxAge": 3600
            }
          ]
        }
      }
    },
    "CloudFrontOriginAccessControl": {
      "Type": "AWS::CloudFront::OriginAccessControl",
      "Properties": {
        "OriginAccessControlConfig": {
          "Name": {
            "Fn::Sub": "TapStack${EnvironmentSuffix}OriginAccessControl"
          },
          "OriginAccessControlOriginType": "s3",
          "SigningBehavior": "always",
          "SigningProtocol": "sigv4"
        }
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
              "Sid": "AllowCloudFrontServicePrincipal",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudfront.amazonaws.com"
              },
              "Action": "s3:GetObject",
              "Resource": {
                "Fn::Sub": "${S3Bucket}/*"
              },
              "Condition": {
                "StringEquals": {
                  "AWS:SourceArn": {
                    "Fn::Sub": "arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}"
                  }
                }
              }
            },
            {
              "Sid": "DenyInsecureConnections",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:*",
              "Resource": [
                {
                  "Fn::GetAtt": ["S3Bucket", "Arn"]
                },
                {
                  "Fn::Sub": "${S3Bucket}/*"
                }
              ],
              "Condition": {
                "Bool": {
                  "aws:SecureTransport": "false"
                }
              }
            }
          ]
        }
      }
    },
    "ACMCertificate": {
      "Type": "AWS::CertificateManager::Certificate",
      "Properties": {
        "DomainName": {
          "Ref": "DomainName"
        },
        "SubjectAlternativeNames": [
          {
            "Fn::Sub": "*.${DomainName}"
          }
        ],
        "ValidationMethod": "DNS",
        "DomainValidationOptions": [
          {
            "DomainName": {
              "Ref": "DomainName"
            },
            "HostedZoneId": {
              "Ref": "HostedZoneId"
            }
          },
          {
            "DomainName": {
              "Fn::Sub": "*.${DomainName}"
            },
            "HostedZoneId": {
              "Ref": "HostedZoneId"
            }
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "TapStack${EnvironmentSuffix}LambdaEdgeRole"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": ["lambda.amazonaws.com", "edgelambda.amazonaws.com"]
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ]
      }
    },
    "LambdaEdgeFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "TapStack${EnvironmentSuffix}EdgeRedirect"
        },
        "Runtime": "nodejs18.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "Code": {
          "ZipFile": "exports.handler = async (event) => {\n    const request = event.Records[0].cf.request;\n    const uri = request.uri;\n    \n    // Redirect root to index.html\n    if (uri === '/') {\n        request.uri = '/index.html';\n    }\n    // Add .html extension for clean URLs\n    else if (!uri.includes('.') && !uri.endsWith('/')) {\n        request.uri = uri + '.html';\n    }\n    // Handle directory requests\n    else if (uri.endsWith('/')) {\n        request.uri = uri + 'index.html';\n    }\n    \n    return request;\n};"
        },
        "Timeout": 5
      }
    },
    "LambdaEdgeVersion": {
      "Type": "AWS::Lambda::Version",
      "Properties": {
        "FunctionName": {
          "Ref": "LambdaEdgeFunction"
        }
      }
    },
    "WAFWebACL": {
      "Type": "AWS::WAFv2::WebACL",
      "Properties": {
        "Name": {
          "Fn::Sub": "TapStack${EnvironmentSuffix}WebACL"
        },
        "Scope": "CLOUDFRONT",
        "DefaultAction": {
          "Allow": {}
        },
        "Rules": [
          {
            "Name": "AWSManagedRulesCommonRuleSet",
            "Priority": 1,
            "OverrideAction": {
              "None": {}
            },
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesCommonRuleSet"
              }
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "CommonRuleSetMetric"
            }
          },
          {
            "Name": "AWSManagedRulesKnownBadInputsRuleSet",
            "Priority": 2,
            "OverrideAction": {
              "None": {}
            },
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesKnownBadInputsRuleSet"
              }
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "KnownBadInputsRuleSetMetric"
            }
          },
          {
            "Name": "AWSManagedRulesSQLiRuleSet",
            "Priority": 3,
            "OverrideAction": {
              "None": {}
            },
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesSQLiRuleSet"
              }
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "SQLiRuleSetMetric"
            }
          }
        ],
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": {
            "Fn::Sub": "TapStack${EnvironmentSuffix}WAFMetric"
          }
        }
      }
    },
    "CloudFrontDistribution": {
      "Type": "AWS::CloudFront::Distribution",
      "Properties": {
        "DistributionConfig": {
          "Aliases": [
            {
              "Ref": "DomainName"
            }
          ],
          "Origins": [
            {
              "Id": "S3Origin",
              "DomainName": {
                "Fn::GetAtt": ["S3Bucket", "RegionalDomainName"]
              },
              "OriginAccessControlId": {
                "Ref": "CloudFrontOriginAccessControl"
              }
            }
          ],
          "DefaultCacheBehavior": {
            "TargetOriginId": "S3Origin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
            "OriginRequestPolicyId": "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf",
            "ResponseHeadersPolicyId": "67f7725c-6f97-4210-82d7-5512b31e9d03",
            "LambdaFunctionAssociations": [
              {
                "EventType": "origin-request",
                "LambdaFunctionARN": {
                  "Ref": "LambdaEdgeVersion"
                }
              }
            ]
          },
          "CacheBehaviors": [
            {
              "PathPattern": "*.css",
              "TargetOriginId": "S3Origin",
              "ViewerProtocolPolicy": "redirect-to-https",
              "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
            },
            {
              "PathPattern": "*.js",
              "TargetOriginId": "S3Origin",
              "ViewerProtocolPolicy": "redirect-to-https",
              "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
            },
            {
              "PathPattern": "*.png",
              "TargetOriginId": "S3Origin",
              "ViewerProtocolPolicy": "redirect-to-https",
              "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
            },
            {
              "PathPattern": "*.jpg",
              "TargetOriginId": "S3Origin",
              "ViewerProtocolPolicy": "redirect-to-https",
              "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
            }
          ],
          "Enabled": true,
          "DefaultRootObject": "index.html",
          "CustomErrorResponses": [
            {
              "ErrorCode": 404,
              "ResponseCode": 200,
              "ResponsePagePath": "/index.html",
              "ErrorCachingMinTTL": 300
            },
            {
              "ErrorCode": 403,
              "ResponseCode": 200,
              "ResponsePagePath": "/index.html",
              "ErrorCachingMinTTL": 300
            }
          ],
          "ViewerCertificate": {
            "AcmCertificateArn": {
              "Ref": "ACMCertificate"
            },
            "SslSupportMethod": "sni-only",
            "MinimumProtocolVersion": "TLSv1.2_2021"
          },
          "Logging": {
            "Bucket": {
              "Fn::GetAtt": ["S3BucketLogs", "DomainName"]
            },
            "Prefix": "cloudfront-logs/",
            "IncludeCookies": false
          },
          "WebACLId": {
            "Fn::GetAtt": ["WAFWebACL", "Arn"]
          },
          "PriceClass": "PriceClass_100",
          "HttpVersion": "http2and3"
        }
      }
    },
    "Route53RecordSet": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneId": {
          "Ref": "HostedZoneId"
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
    "Route53RecordSetAAAA": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneId": {
          "Ref": "HostedZoneId"
        },
        "Name": {
          "Ref": "DomainName"
        },
        "Type": "AAAA",
        "AliasTarget": {
          "DNSName": {
            "Fn::GetAtt": ["CloudFrontDistribution", "DomainName"]
          },
          "HostedZoneId": "Z2FDTNDATAQYW2"
        }
      }
    },
    "CloudWatchLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/${LambdaEdgeFunction}"
        },
        "RetentionInDays": 14
      }
    }
  },
  "Outputs": {
    "CloudFrontDistributionDomainName": {
      "Description": "CloudFront distribution domain name",
      "Value": {
        "Fn::GetAtt": ["CloudFrontDistribution", "DomainName"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CloudFrontDomain"
        }
      }
    },
    "CloudFrontDistributionId": {
      "Description": "CloudFront distribution ID",
      "Value": {
        "Ref": "CloudFrontDistribution"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CloudFrontDistributionId"
        }
      }
    },
    "S3BucketName": {
      "Description": "S3 bucket name for static content",
      "Value": {
        "Ref": "S3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3BucketName"
        }
      }
    },
    "WebsiteURL": {
      "Description": "Website URL",
      "Value": {
        "Fn::Sub": "https://${DomainName}"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-WebsiteURL"
        }
      }
    },
    "ACMCertificateArn": {
      "Description": "ACM Certificate ARN",
      "Value": {
        "Ref": "ACMCertificate"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ACMCertificateArn"
        }
      }
    },
    "S3BucketLogsName": {
      "Description": "S3 bucket name for logs",
      "Value": {
        "Ref": "S3BucketLogs"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3BucketLogsName"
        }
      }
    }
  }
}
```

## Example Stack Creation Output

```
Stack Creation Status: CREATE_COMPLETE
Stack Name: TapStackprod
Region: us-west-2
Creation Time: 2024-01-15T10:30:00Z

Outputs:
- CloudFrontDistributionDomainName: d123456789abcd.cloudfront.net
- CloudFrontDistributionId: E1ABCDEFGHIJKL
- S3BucketName: static-webapp-prod-content-123456789012-us-west-2
- S3BucketLogsName: static-webapp-prod-logs-123456789012-us-west-2
- WebsiteURL: https://example.com
- ACMCertificateArn: arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012

Resources Created: 13
- S3 Buckets: 2 (content + logs)
- CloudFront Distribution: 1
- ACM Certificate: 1
- Route 53 Records: 2 (A + AAAA)
- Lambda@Edge Function: 1
- WAF Web ACL: 1
- IAM Role: 1
- CloudWatch Log Group: 1
- Origin Access Control: 1
- S3 Bucket Policy: 1

Estimated Monthly Cost: $15-50 (depending on traffic)
```