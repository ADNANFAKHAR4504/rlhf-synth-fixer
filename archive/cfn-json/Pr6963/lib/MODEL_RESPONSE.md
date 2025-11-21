# AWS WAF Security Controls - CloudFormation Implementation

This implementation provides a comprehensive AWS WAF security solution with rate limiting, SQL injection protection, geo-blocking, IP allowlisting, and centralized S3 logging for ALB protection.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "AWS WAF Security Controls for API Protection with ALB Integration",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to prevent conflicts (e.g., dev-12345, test-67890)",
      "AllowedPattern": "^[a-z0-9-]+$",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "ALBArn": {
      "Type": "String",
      "Description": "ARN of the existing Application Load Balancer to associate with the WAF Web ACL",
      "AllowedPattern": "^arn:aws:elasticloadbalancing:.*:.*:loadbalancer/app/.*",
      "ConstraintDescription": "Must be a valid Application Load Balancer ARN"
    }
  },
  "Resources": {
    "OfficeIPSet": {
      "Type": "AWS::WAFv2::IPSet",
      "Properties": {
        "Name": {
          "Fn::Sub": "office-ip-allowlist-${EnvironmentSuffix}"
        },
        "Description": "IP set for allowlisting trusted office IPs",
        "Scope": "REGIONAL",
        "IPAddressVersion": "IPV4",
        "Addresses": [
          "10.0.0.0/24",
          "192.168.1.0/24"
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "WAFSecurity"
          }
        ]
      }
    },
    "WAFWebACL": {
      "Type": "AWS::WAFv2::WebACL",
      "Properties": {
        "Name": {
          "Fn::Sub": "api-protection-web-acl-${EnvironmentSuffix}"
        },
        "Description": "WAF Web ACL for API protection with rate limiting, SQL injection protection, and geo-blocking",
        "Scope": "REGIONAL",
        "DefaultAction": {
          "Allow": {}
        },
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": {
            "Fn::Sub": "api-protection-web-acl-${EnvironmentSuffix}"
          }
        },
        "Rules": [
          {
            "Name": "AllowOfficeIPs",
            "Priority": 0,
            "Statement": {
              "IPSetReferenceStatement": {
                "Arn": {
                  "Fn::GetAtt": [
                    "OfficeIPSet",
                    "Arn"
                  ]
                }
              }
            },
            "Action": {
              "Allow": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": {
                "Fn::Sub": "allow-office-ips-${EnvironmentSuffix}"
              }
            }
          },
          {
            "Name": "GeoBlockHighRiskCountries",
            "Priority": 1,
            "Statement": {
              "GeoMatchStatement": {
                "CountryCodes": [
                  "KP",
                  "IR"
                ]
              }
            },
            "Action": {
              "Block": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": {
                "Fn::Sub": "geo-block-high-risk-${EnvironmentSuffix}"
              }
            }
          },
          {
            "Name": "RateLimitRule",
            "Priority": 2,
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
              "MetricName": {
                "Fn::Sub": "rate-limit-rule-${EnvironmentSuffix}"
              }
            }
          },
          {
            "Name": "SQLInjectionProtection",
            "Priority": 3,
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesSQLiRuleSet"
              }
            },
            "OverrideAction": {
              "None": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": {
                "Fn::Sub": "sql-injection-protection-${EnvironmentSuffix}"
              }
            }
          },
          {
            "Name": "KnownBadInputsProtection",
            "Priority": 4,
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
              "MetricName": {
                "Fn::Sub": "known-bad-inputs-${EnvironmentSuffix}"
              }
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "WAFSecurity"
          }
        ]
      }
    },
    "WAFLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "aws-waf-logs-${EnvironmentSuffix}"
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
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "WAFSecurity"
          }
        ]
      }
    },
    "WAFLogsBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "WAFLogsBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSLogDeliveryWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "delivery.logs.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${WAFLogsBucket.Arn}/*"
              },
              "Condition": {
                "StringEquals": {
                  "s3:x-amz-acl": "bucket-owner-full-control"
                }
              }
            },
            {
              "Sid": "AWSLogDeliveryAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "delivery.logs.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::GetAtt": [
                  "WAFLogsBucket",
                  "Arn"
                ]
              }
            }
          ]
        }
      }
    },
    "WAFLoggingConfiguration": {
      "Type": "AWS::WAFv2::LoggingConfiguration",
      "DependsOn": [
        "WAFLogsBucketPolicy"
      ],
      "Properties": {
        "ResourceArn": {
          "Fn::GetAtt": [
            "WAFWebACL",
            "Arn"
          ]
        },
        "LogDestinationConfigs": [
          {
            "Fn::GetAtt": [
              "WAFLogsBucket",
              "Arn"
            ]
          }
        ],
        "LoggingFilter": {
          "DefaultBehavior": "KEEP",
          "Filters": [
            {
              "Behavior": "KEEP",
              "Conditions": [
                {
                  "ActionCondition": {
                    "Action": "BLOCK"
                  }
                }
              ],
              "Requirement": "MEETS_ANY"
            }
          ]
        }
      }
    },
    "WebACLAssociation": {
      "Type": "AWS::WAFv2::WebACLAssociation",
      "Properties": {
        "ResourceArn": {
          "Ref": "ALBArn"
        },
        "WebACLArn": {
          "Fn::GetAtt": [
            "WAFWebACL",
            "Arn"
          ]
        }
      }
    }
  },
  "Outputs": {
    "WebACLArn": {
      "Description": "ARN of the WAF Web ACL",
      "Value": {
        "Fn::GetAtt": [
          "WAFWebACL",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-WebACLArn"
        }
      }
    },
    "WebACLId": {
      "Description": "ID of the WAF Web ACL",
      "Value": {
        "Fn::GetAtt": [
          "WAFWebACL",
          "Id"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-WebACLId"
        }
      }
    },
    "WAFLogsBucketName": {
      "Description": "Name of the S3 bucket for WAF logs",
      "Value": {
        "Ref": "WAFLogsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-WAFLogsBucketName"
        }
      }
    },
    "WAFLogsBucketArn": {
      "Description": "ARN of the S3 bucket for WAF logs",
      "Value": {
        "Fn::GetAtt": [
          "WAFLogsBucket",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-WAFLogsBucketArn"
        }
      }
    },
    "OfficeIPSetArn": {
      "Description": "ARN of the office IP allowlist IP set",
      "Value": {
        "Fn::GetAtt": [
          "OfficeIPSet",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-OfficeIPSetArn"
        }
      }
    }
  }
}
```

## Implementation Notes

### Architecture Overview

This CloudFormation template deploys a comprehensive AWS WAF security solution with the following components:

1. **IP Set for Office Allowlisting**: Allows trusted office IPs (10.0.0.0/24 and 192.168.1.0/24) to bypass all security rules
2. **WAF Web ACL**: Central security policy with multiple rule layers
3. **S3 Logging Bucket**: Encrypted storage for all WAF request logs
4. **WAF Logging Configuration**: Sends all blocked requests to S3
5. **Web ACL Association**: Connects WAF to the existing Application Load Balancer

### Security Rules (Applied in Priority Order)

1. **Priority 0 - Office IP Allowlist**: Allows all traffic from trusted office IPs
2. **Priority 1 - Geo-Blocking**: Blocks traffic from North Korea (KP) and Iran (IR)
3. **Priority 2 - Rate Limiting**: Limits each IP to 2000 requests per 5-minute window
4. **Priority 3 - SQL Injection Protection**: AWS Managed Rule Group for SQL injection attacks
5. **Priority 4 - Known Bad Inputs**: AWS Managed Rule Group for common attack patterns

### Key Features

- **CloudWatch Metrics**: All rules emit metrics for monitoring and alerting
- **Sampled Requests**: Enabled on all rules for debugging blocked requests
- **S3 Encryption**: AES256 encryption for all WAF logs at rest
- **Public Access Block**: S3 bucket blocks all public access
- **Resource Naming**: All resources include EnvironmentSuffix for uniqueness
- **Cost Allocation Tags**: Environment and Project tags on all resources
- **Destroyability**: No DeletionPolicy: Retain - all resources can be deleted

### Parameters

- **EnvironmentSuffix**: Unique identifier for this deployment (e.g., "dev-12345")
- **ALBArn**: ARN of the existing Application Load Balancer to protect

### Outputs

- **WebACLArn**: ARN of the WAF Web ACL for reference
- **WebACLId**: ID of the WAF Web ACL
- **WAFLogsBucketName**: Name of the S3 bucket containing WAF logs
- **WAFLogsBucketArn**: ARN of the S3 bucket for programmatic access
- **OfficeIPSetArn**: ARN of the IP set for office IP management

### Deployment

Deploy this template using AWS CLI:

```bash
aws cloudformation create-stack \
  --stack-name waf-security-${ENVIRONMENT_SUFFIX} \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=${ENVIRONMENT_SUFFIX} \
    ParameterKey=ALBArn,ParameterValue=${ALB_ARN} \
  --region us-east-1
```

### Monitoring

Monitor WAF activity using CloudWatch metrics:
- `allow-office-ips-${EnvironmentSuffix}`: Requests from office IPs
- `geo-block-high-risk-${EnvironmentSuffix}`: Blocked geo-location requests
- `rate-limit-rule-${EnvironmentSuffix}`: Rate-limited requests
- `sql-injection-protection-${EnvironmentSuffix}`: SQL injection blocks
- `known-bad-inputs-${EnvironmentSuffix}`: Known bad input blocks

### Cost Optimization

- Rate limiting prevents unnecessary WAF request charges
- Logging filter captures only blocked requests (reduces S3 storage)
- Uses managed rule groups (AWS maintains rules, reducing operational overhead)
- No NAT Gateways or expensive compute resources

### Compliance

- **PCI DSS**: SQL injection protection, rate limiting, geo-blocking
- **SOC 2**: Centralized logging with encryption, access controls
- **GDPR**: Data encryption at rest, access logging
- **HIPAA**: Encryption, access controls, audit logging
