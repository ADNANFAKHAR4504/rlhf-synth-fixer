# AWS WAF Security Infrastructure - CloudFormation Implementation

This implementation provides a complete AWS WAF security configuration using CloudFormation with JSON. The template creates a WAFv2 Web ACL with rate limiting, SQL injection protection, geo-blocking, IP allowlisting, and centralized logging to S3.

## File: lib/template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "AWS WAF Security Infrastructure for API Protection with rate limiting, geo-blocking, SQL injection protection, and S3 logging",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming to support multiple PR environments",
      "MinLength": 1,
      "MaxLength": 20,
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "ALBArn": {
      "Type": "String",
      "Description": "ARN of the Application Load Balancer to associate with the WAF Web ACL",
      "AllowedPattern": "arn:aws:elasticloadbalancing:.*:.*:loadbalancer/app/.*",
      "ConstraintDescription": "Must be a valid ALB ARN"
    },
    "ProjectName": {
      "Type": "String",
      "Description": "Project name for cost allocation tagging",
      "Default": "WAFSecurityProject"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment name for cost allocation tagging",
      "Default": "production",
      "AllowedValues": ["production", "staging", "development", "test"]
    }
  },
  "Resources": {
    "OfficeIPSet": {
      "Type": "AWS::WAFv2::IPSet",
      "Properties": {
        "Name": {
          "Fn::Sub": "office-allowlist-ipset-${EnvironmentSuffix}"
        },
        "Description": "IP set for allowlisting trusted office IP ranges",
        "Scope": "REGIONAL",
        "IPAddressVersion": "IPV4",
        "Addresses": [
          "10.0.0.0/24",
          "192.168.1.0/24"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "office-allowlist-ipset-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },
    "WAFLogBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "aws-waf-logs-${EnvironmentSuffix}-${AWS::AccountId}"
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
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldLogs",
              "Status": "Enabled",
              "ExpirationInDays": 90,
              "NoncurrentVersionExpirationInDays": 30
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
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aws-waf-logs-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },
    "WAFLogBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": { "Ref": "WAFLogBucket" },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSLogDeliveryWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "logging.s3.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${WAFLogBucket.Arn}/*"
              },
              "Condition": {
                "StringEquals": {
                  "aws:SourceAccount": { "Ref": "AWS::AccountId" }
                }
              }
            },
            {
              "Sid": "AWSLogDeliveryAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "logging.s3.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::GetAtt": ["WAFLogBucket", "Arn"]
              },
              "Condition": {
                "StringEquals": {
                  "aws:SourceAccount": { "Ref": "AWS::AccountId" }
                }
              }
            }
          ]
        }
      }
    },
    "WAFWebACL": {
      "Type": "AWS::WAFv2::WebACL",
      "DependsOn": ["WAFLogBucket", "WAFLogBucketPolicy", "OfficeIPSet"],
      "Properties": {
        "Name": {
          "Fn::Sub": "api-protection-webacl-${EnvironmentSuffix}"
        },
        "Description": "WAF Web ACL for API protection with rate limiting, geo-blocking, and SQL injection protection",
        "Scope": "REGIONAL",
        "DefaultAction": {
          "Allow": {}
        },
        "Rules": [
          {
            "Name": "AllowOfficeIPs",
            "Priority": 0,
            "Statement": {
              "IPSetReferenceStatement": {
                "Arn": {
                  "Fn::GetAtt": ["OfficeIPSet", "Arn"]
                }
              }
            },
            "Action": {
              "Allow": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "AllowOfficeIPsRule"
            }
          },
          {
            "Name": "GeoBlockRule",
            "Priority": 1,
            "Statement": {
              "GeoMatchStatement": {
                "CountryCodes": ["KP", "IR"]
              }
            },
            "Action": {
              "Block": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "GeoBlockRule"
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
              "MetricName": "RateLimitRule"
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
              "MetricName": "SQLInjectionProtection"
            }
          }
        ],
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": {
            "Fn::Sub": "ApiProtectionWebACL-${EnvironmentSuffix}"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "api-protection-webacl-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "Environment" }
          },
          {
            "Key": "Project",
            "Value": { "Ref": "ProjectName" }
          }
        ]
      }
    },
    "WAFWebACLAssociation": {
      "Type": "AWS::WAFv2::WebACLAssociation",
      "DependsOn": "WAFWebACL",
      "Properties": {
        "ResourceArn": { "Ref": "ALBArn" },
        "WebACLArn": {
          "Fn::GetAtt": ["WAFWebACL", "Arn"]
        }
      }
    },
    "WAFLoggingConfiguration": {
      "Type": "AWS::WAFv2::LoggingConfiguration",
      "DependsOn": ["WAFWebACL", "WAFLogBucket", "WAFLogBucketPolicy"],
      "Properties": {
        "ResourceArn": {
          "Fn::GetAtt": ["WAFWebACL", "Arn"]
        },
        "LogDestinationConfigs": [
          {
            "Fn::Sub": "arn:aws:s3:::${WAFLogBucket}"
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
    }
  },
  "Outputs": {
    "WebACLArn": {
      "Description": "ARN of the WAF Web ACL for API protection",
      "Value": {
        "Fn::GetAtt": ["WAFWebACL", "Arn"]
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
        "Fn::GetAtt": ["WAFWebACL", "Id"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-WebACLId"
        }
      }
    },
    "WAFLogBucketName": {
      "Description": "Name of the S3 bucket for WAF logs",
      "Value": {
        "Ref": "WAFLogBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-WAFLogBucketName"
        }
      }
    },
    "WAFLogBucketArn": {
      "Description": "ARN of the S3 bucket for WAF logs",
      "Value": {
        "Fn::GetAtt": ["WAFLogBucket", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-WAFLogBucketArn"
        }
      }
    },
    "OfficeIPSetArn": {
      "Description": "ARN of the Office IP Set for allowlisting",
      "Value": {
        "Fn::GetAtt": ["OfficeIPSet", "Arn"]
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

## File: lib/README.md

```markdown
# AWS WAF Security Infrastructure

This CloudFormation template deploys a comprehensive AWS WAF (Web Application Firewall) security configuration for API protection with rate limiting, geo-blocking, SQL injection protection, and centralized logging.

## Architecture Overview

The infrastructure includes:

- **WAFv2 Web ACL**: Regional Web ACL with CloudWatch metrics enabled
- **Rate Limiting**: Blocks IPs exceeding 2000 requests per 5-minute window
- **Geo-Blocking**: Denies traffic from North Korea (KP) and Iran (IR)
- **SQL Injection Protection**: AWS Managed Rule Group (AWSManagedRulesSQLiRuleSet)
- **IP Allowlisting**: Allows traffic from trusted office IPs (10.0.0.0/24, 192.168.1.0/24)
- **S3 Logging**: Centralized WAF logs with AES256 encryption
- **ALB Integration**: Associates Web ACL with existing Application Load Balancer

## Rule Priority Order

1. **Priority 0 - AllowOfficeIPs**: Allows traffic from allowlisted office IPs (bypasses all other rules)
2. **Priority 1 - GeoBlockRule**: Blocks traffic from North Korea and Iran
3. **Priority 2 - RateLimitRule**: Blocks IPs exceeding 2000 requests per 5 minutes
4. **Priority 3 - SQLInjectionProtection**: AWS Managed Rules for SQL injection attacks

## Prerequisites

- AWS CLI configured with appropriate credentials
- An existing Application Load Balancer (ALB) in the us-east-1 region
- IAM permissions for WAFv2, S3, and CloudFormation operations

## Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| EnvironmentSuffix | Suffix for resource naming (e.g., pr-123, test-1) | - | Yes |
| ALBArn | ARN of the Application Load Balancer | - | Yes |
| ProjectName | Project name for cost allocation | WAFSecurityProject | No |
| Environment | Environment name (production, staging, development, test) | production | No |

## Deployment

### Deploy the stack

```bash
aws cloudformation create-stack \
  --stack-name waf-security-stack \
  --template-body file://lib/template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=pr-001 \
    ParameterKey=ALBArn,ParameterValue=arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/my-alb/1234567890abcdef \
    ParameterKey=ProjectName,ParameterValue=MyProject \
    ParameterKey=Environment,ParameterValue=production \
  --region us-east-1
```

### Check deployment status

```bash
aws cloudformation describe-stacks \
  --stack-name waf-security-stack \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### Get outputs

```bash
aws cloudformation describe-stacks \
  --stack-name waf-security-stack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Outputs

| Output | Description |
|--------|-------------|
| WebACLArn | ARN of the WAF Web ACL |
| WebACLId | ID of the WAF Web ACL |
| WAFLogBucketName | Name of the S3 bucket for WAF logs |
| WAFLogBucketArn | ARN of the S3 bucket for WAF logs |
| OfficeIPSetArn | ARN of the Office IP Set |

## Verification

### Verify WAF Web ACL

```bash
# Get Web ACL details
aws wafv2 get-web-acl \
  --scope REGIONAL \
  --id <WebACLId> \
  --name api-protection-webacl-<EnvironmentSuffix> \
  --region us-east-1

# List WAF Web ACLs
aws wafv2 list-web-acls \
  --scope REGIONAL \
  --region us-east-1
```

### Verify ALB Association

```bash
# List resources associated with the Web ACL
aws wafv2 list-resources-for-web-acl \
  --web-acl-arn <WebACLArn> \
  --region us-east-1
```

### Verify S3 Logging

```bash
# List objects in the WAF log bucket
aws s3 ls s3://aws-waf-logs-<EnvironmentSuffix>-<AccountId>/ \
  --region us-east-1

# Check bucket encryption
aws s3api get-bucket-encryption \
  --bucket aws-waf-logs-<EnvironmentSuffix>-<AccountId> \
  --region us-east-1
```

### Check CloudWatch Metrics

```bash
# View WAF metrics in CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/WAFV2 \
  --metric-name AllowedRequests \
  --dimensions Name=WebACL,Value=api-protection-webacl-<EnvironmentSuffix> Name=Region,Value=us-east-1 Name=Rule,Value=ALL \
  --start-time 2025-01-01T00:00:00Z \
  --end-time 2025-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum \
  --region us-east-1
```

## Testing

### Test Rate Limiting

You can test the rate limiting by sending more than 2000 requests from a single IP within 5 minutes:

```bash
# Example using ab (Apache Bench)
ab -n 2100 -c 10 https://your-alb-endpoint.com/
```

After exceeding the limit, requests from that IP should be blocked for 5 minutes.

### Test Geo-Blocking

Geo-blocking can be tested using a VPN or proxy from North Korea or Iran. Requests should be blocked immediately.

### Test SQL Injection Protection

Try sending requests with SQL injection patterns:

```bash
curl "https://your-alb-endpoint.com/api?id=1' OR '1'='1"
```

These requests should be blocked by the SQL injection protection rule.

### Test Office IP Allowlist

From an IP in the 10.0.0.0/24 or 192.168.1.0/24 range, all requests should be allowed regardless of other rules.

## Monitoring and Logging

### CloudWatch Metrics

The following metrics are available in CloudWatch:

- **AllowOfficeIPsRule**: Requests matched by office IP allowlist
- **GeoBlockRule**: Requests blocked by geo-blocking
- **RateLimitRule**: Requests blocked by rate limiting
- **SQLInjectionProtection**: Requests matched by SQL injection rules
- **ApiProtectionWebACL-{EnvironmentSuffix}**: Overall Web ACL metrics

### S3 Logs

WAF logs are stored in the S3 bucket with the following structure:

```
s3://aws-waf-logs-{EnvironmentSuffix}-{AccountId}/
  AWSLogs/
    {AccountId}/
      WAFLogs/
        {Region}/
          {WebACLName}/
            {Year}/
              {Month}/
                {Day}/
```

Logs are in JSON format and include:

- Timestamp
- Action taken (ALLOW, BLOCK, COUNT)
- Rule matched
- Request details (headers, URI, method)
- Rate limit details

## Cost Considerations

### Monthly Cost Estimate (us-east-1)

- WAF Web ACL: $5.00/month
- WAF Rules (4 rules): $4.00/month ($1.00 per rule)
- WAF Requests: $0.60 per million requests
- S3 Storage: ~$0.023/GB per month
- S3 Requests: Minimal cost for log writes

**Estimated monthly cost**: $10-20 for typical usage (excluding high request volume)

## Cleanup

To delete all resources:

```bash
aws cloudformation delete-stack \
  --stack-name waf-security-stack \
  --region us-east-1
```

Note: The S3 bucket must be empty before the stack can be deleted. You may need to empty it first:

```bash
aws s3 rm s3://aws-waf-logs-<EnvironmentSuffix>-<AccountId>/ --recursive
```

## Troubleshooting

### WAF Not Blocking Traffic

1. Verify Web ACL is associated with the ALB:
   ```bash
   aws wafv2 list-resources-for-web-acl --web-acl-arn <WebACLArn>
   ```

2. Check CloudWatch metrics to see if rules are being evaluated

3. Review WAF logs in S3 for matched rules and actions

### S3 Logging Not Working

1. Verify bucket policy allows WAF log delivery
2. Check logging configuration:
   ```bash
   aws wafv2 get-logging-configuration --resource-arn <WebACLArn>
   ```
3. Ensure bucket name follows AWS WAF logging requirements (must start with `aws-waf-logs-`)

### Rate Limiting Not Working

1. Verify rate limit is set to 2000 requests per 5 minutes
2. Check if test IP is in the office allowlist (priority 0 rule bypasses rate limiting)
3. Review CloudWatch metrics for RateLimitRule

## Security Best Practices

1. **Regular Rule Updates**: Review and update AWS Managed Rules regularly
2. **Log Monitoring**: Set up CloudWatch alarms for blocked requests
3. **IP Set Management**: Regularly review and update office IP allowlist
4. **Access Control**: Restrict S3 bucket access using IAM policies
5. **Cost Monitoring**: Set up AWS Budgets to monitor WAF costs
6. **Testing**: Regularly test WAF rules in non-production environments

## Additional Resources

- [AWS WAF Developer Guide](https://docs.aws.amazon.com/waf/latest/developerguide/)
- [AWS WAF Pricing](https://aws.amazon.com/waf/pricing/)
- [AWS Managed Rules for AWS WAF](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups.html)
- [WAF Security Automations](https://aws.amazon.com/solutions/implementations/security-automations-for-aws-waf/)
```

## Implementation Notes

### Key Design Decisions

1. **Rule Priority Order**: Office IP allowlist has highest priority (0) to ensure trusted IPs bypass all blocking rules, followed by geo-blocking, rate limiting, and SQL injection protection.

2. **Rate Limiting Configuration**: Set to exactly 2000 requests per 5-minute window using `AggregateKeyType: IP` to track per source IP address.

3. **S3 Bucket Naming**: Includes account ID in bucket name to ensure global uniqueness while still using environmentSuffix for multi-environment support.

4. **Logging Filter**: Configured to keep all blocked requests for security analysis while reducing storage costs.

5. **Managed Rule Groups**: Uses AWS-managed SQL injection rule set to benefit from automatic updates without manual rule maintenance.

6. **No Retention Policies**: All resources are fully destroyable (no DeletionPolicy: Retain) to support CI/CD cleanup workflows.

7. **Encryption**: S3 bucket uses AES256 server-side encryption as required by security constraints.

8. **CloudWatch Metrics**: All rules have metrics enabled for monitoring and alerting on blocked traffic patterns.

### Testing Recommendations

- Test rate limiting with load testing tools (ab, wrk, or JMeter)
- Verify geo-blocking using VPN or proxy services
- Test SQL injection protection with common attack patterns from OWASP
- Confirm office IP allowlist works from trusted networks
- Validate WAF logs appear in S3 within 5 minutes of traffic

### Deployment Considerations

- Web ACL association may take 1-2 minutes to propagate to all ALB nodes
- WAF rule changes take effect immediately but may have 1-2 second propagation delay
- S3 logging may have up to 5-minute delay before logs appear
- Rate limiting counter resets every 5 minutes from first request in window
- CloudWatch metrics update with 1-minute granularity
