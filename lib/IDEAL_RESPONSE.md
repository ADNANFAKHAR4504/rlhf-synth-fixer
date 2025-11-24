# AWS WAF Security Infrastructure - Ideal CloudFormation Implementation

This document provides the ideal CloudFormation template solution for the AWS WAF Security Infrastructure task, including all necessary fixes to make it production-ready and testable.

## Overview

The ideal solution creates a complete, self-sufficient AWS WAF security stack that includes:

1. **Network Infrastructure**: VPC, subnets, internet gateway, route tables, and security groups
2. **Application Load Balancer**: Test ALB for WAF association and testing
3. **WAF Resources**: Web ACL with rate limiting, geo-blocking, SQL injection protection, and IP allowlisting
4. **Logging Infrastructure**: S3 bucket with proper encryption and bucket policies for WAF logs
5. **Proper Outputs**: All resource identifiers needed for integration testing and operations

## Key Improvements Over MODEL_RESPONSE

### 1. Self-Sufficient Infrastructure
- Creates complete test infrastructure (VPC, subnets, ALB) instead of requiring external ALB ARN
- Removes dependency on pre-existing resources
- Enables isolated deployment and testing

### 2. Correct S3 Bucket Policy
- Uses `delivery.logs.amazonaws.com` service principal for WAF logging
- Includes required `s3:x-amz-acl` condition for bucket-owner-full-control
- Adds proper source account restrictions

### 3. Complete Network Stack
- VPC with DNS support enabled
- Two public subnets in different availability zones
- Internet Gateway and routing for internet-facing ALB
- Security group with HTTP/HTTPS ingress rules

### 4. Functional ALB Configuration
- Target group with health checks
- HTTP listener with fixed response for testing
- Proper dependency management

### 5. Comprehensive Outputs
- ALB ARN and DNS name for integration testing
- Web ACL ARN and ID
- S3 bucket name and ARN
- IP Set ARN

## File: lib/template-fixed.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "AWS WAF Security Infrastructure for API Protection with rate limiting, geo-blocking, SQL injection protection, S3 logging, and test ALB for self-sufficient deployment",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming to support multiple PR environments",
      "MinLength": 1,
      "MaxLength": 20,
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "ProjectName": {
      "Type": "String",
      "Description": "Project name for cost allocation tagging",
      "Default": "WAFSecurityProject"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment name for cost allocation tagging",
      "Default": "test",
      "AllowedValues": ["production", "staging", "development", "test"]
    }
  },
  "Resources": {
    "TestVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "waf-test-vpc-${EnvironmentSuffix}" }
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
    "TestSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "TestVPC" },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "waf-test-subnet-1-${EnvironmentSuffix}" }
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
    "TestSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "TestVPC" },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "waf-test-subnet-2-${EnvironmentSuffix}" }
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
    "TestInternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "waf-test-igw-${EnvironmentSuffix}" }
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
    "TestAttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": { "Ref": "TestVPC" },
        "InternetGatewayId": { "Ref": "TestInternetGateway" }
      }
    },
    "TestRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "TestVPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "waf-test-rt-${EnvironmentSuffix}" }
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
    "TestRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "TestAttachGateway",
      "Properties": {
        "RouteTableId": { "Ref": "TestRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": { "Ref": "TestInternetGateway" }
      }
    },
    "TestSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "TestSubnet1" },
        "RouteTableId": { "Ref": "TestRouteTable" }
      }
    },
    "TestSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "TestSubnet2" },
        "RouteTableId": { "Ref": "TestRouteTable" }
      }
    },
    "TestALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for test ALB",
        "VpcId": { "Ref": "TestVPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "waf-test-alb-sg-${EnvironmentSuffix}" }
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
    "TestALB": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "DependsOn": "TestAttachGateway",
      "Properties": {
        "Name": { "Fn::Sub": "waf-test-alb-${EnvironmentSuffix}" },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          { "Ref": "TestSubnet1" },
          { "Ref": "TestSubnet2" }
        ],
        "SecurityGroups": [
          { "Ref": "TestALBSecurityGroup" }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "waf-test-alb-${EnvironmentSuffix}" }
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
    "TestTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": { "Fn::Sub": "waf-test-tg-${EnvironmentSuffix}" },
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": { "Ref": "TestVPC" },
        "HealthCheckEnabled": true,
        "HealthCheckProtocol": "HTTP",
        "HealthCheckPath": "/",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 2,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "waf-test-tg-${EnvironmentSuffix}" }
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
    "TestALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": { "Ref": "TestALB" },
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Type": "fixed-response",
            "FixedResponseConfig": {
              "StatusCode": "200",
              "ContentType": "text/plain",
              "MessageBody": "WAF Test ALB - OK"
            }
          }
        ]
      }
    },
    "OfficeIPSet": {
      "Type": "AWS::WAFv2::IPSet",
      "Properties": {
        "Name": { "Fn::Sub": "office-allowlist-ipset-${EnvironmentSuffix}" },
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
            "Value": { "Fn::Sub": "office-allowlist-ipset-${EnvironmentSuffix}" }
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
        "BucketName": { "Fn::Sub": "aws-waf-logs-${EnvironmentSuffix}-${AWS::AccountId}" },
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
            "Value": { "Fn::Sub": "aws-waf-logs-${EnvironmentSuffix}" }
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
                "Service": "delivery.logs.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": { "Fn::Sub": "${WAFLogBucket.Arn}/*" },
              "Condition": {
                "StringEquals": {
                  "s3:x-amz-acl": "bucket-owner-full-control",
                  "aws:SourceAccount": { "Ref": "AWS::AccountId" }
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
              "Resource": { "Fn::GetAtt": ["WAFLogBucket", "Arn"] },
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
        "Name": { "Fn::Sub": "api-protection-webacl-${EnvironmentSuffix}" },
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
                "Arn": { "Fn::GetAtt": ["OfficeIPSet", "Arn"] }
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
          "MetricName": { "Fn::Sub": "ApiProtectionWebACL-${EnvironmentSuffix}" }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "api-protection-webacl-${EnvironmentSuffix}" }
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
      "DependsOn": ["WAFWebACL", "TestALB"],
      "Properties": {
        "ResourceArn": { "Ref": "TestALB" },
        "WebACLArn": { "Fn::GetAtt": ["WAFWebACL", "Arn"] }
      }
    },
    "WAFLoggingConfiguration": {
      "Type": "AWS::WAFv2::LoggingConfiguration",
      "DependsOn": ["WAFWebACL", "WAFLogBucket", "WAFLogBucketPolicy"],
      "Properties": {
        "ResourceArn": { "Fn::GetAtt": ["WAFWebACL", "Arn"] },
        "LogDestinationConfigs": [
          { "Fn::Sub": "arn:aws:s3:::${WAFLogBucket}" }
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
    "TestALBArn": {
      "Description": "ARN of the Test Application Load Balancer",
      "Value": { "Ref": "TestALB" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-TestALBArn" }
      }
    },
    "TestALBDNSName": {
      "Description": "DNS name of the Test Application Load Balancer",
      "Value": { "Fn::GetAtt": ["TestALB", "DNSName"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-TestALBDNSName" }
      }
    },
    "WebACLArn": {
      "Description": "ARN of the WAF Web ACL for API protection",
      "Value": { "Fn::GetAtt": ["WAFWebACL", "Arn"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-WebACLArn" }
      }
    },
    "WebACLId": {
      "Description": "ID of the WAF Web ACL",
      "Value": { "Fn::GetAtt": ["WAFWebACL", "Id"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-WebACLId" }
      }
    },
    "WAFLogBucketName": {
      "Description": "Name of the S3 bucket for WAF logs",
      "Value": { "Ref": "WAFLogBucket" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-WAFLogBucketName" }
      }
    },
    "WAFLogBucketArn": {
      "Description": "ARN of the S3 bucket for WAF logs",
      "Value": { "Fn::GetAtt": ["WAFLogBucket", "Arn"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-WAFLogBucketArn" }
      }
    },
    "OfficeIPSetArn": {
      "Description": "ARN of the Office IP Set for allowlisting",
      "Value": { "Fn::GetAtt": ["OfficeIPSet", "Arn"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-OfficeIPSetArn" }
      }
    }
  }
}
```

## Architecture Overview

### Network Layer
1. **VPC** (10.0.0.0/16): Isolated network with DNS support
2. **Public Subnets**: Two subnets (10.0.1.0/24, 10.0.2.0/24) in different AZs for ALB high availability
3. **Internet Gateway**: Enables internet access for public subnets
4. **Route Table**: Routes internet traffic through the IGW
5. **Security Group**: Allows HTTP/HTTPS traffic to ALB

### Application Layer
1. **Application Load Balancer**: Internet-facing ALB for testing WAF rules
2. **Target Group**: Configures health checks for ALB targets
3. **HTTP Listener**: Returns fixed "200 OK" response for testing

### Security Layer
1. **WAF Web ACL**: Main security component with four rules:
   - **Priority 0**: Allow office IPs (bypasses all other rules)
   - **Priority 1**: Block geo-restricted countries (KP, IR)
   - **Priority 2**: Rate limiting (2000 requests per 5 minutes per IP)
   - **Priority 3**: SQL injection protection (AWS Managed Rules)

2. **IP Set**: Allowlist for office IP ranges (10.0.0.0/24, 192.168.1.0/24)

3. **Web ACL Association**: Links WAF to the test ALB

### Logging Layer
1. **S3 Bucket**: Stores WAF logs with AES256 encryption and versioning
2. **Bucket Policy**: Grants WAF Log Delivery service permissions with proper conditions
3. **Logging Configuration**: Configures WAF to send logs to S3, filtering for blocked requests
4. **Lifecycle Policy**: Retains logs for 90 days, old versions for 30 days

## Deployment Instructions

### Prerequisites
- AWS CLI configured with appropriate credentials
- Permissions for CloudFormation, EC2, ELB, WAF, and S3

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name waf-security-synth101912633 \
  --template-body file://lib/template-fixed.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=synth101912633 \
    ParameterKey=ProjectName,ParameterValue=WAFSecurityProject \
    ParameterKey=Environment,ParameterValue=test \
  --region us-east-1 \
  --capabilities CAPABILITY_IAM
```

### Monitor Deployment

```bash
aws cloudformation describe-stack-events \
  --stack-name waf-security-synth101912633 \
  --region us-east-1 \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
```

### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name waf-security-synth101912633 \
  --region us-east-1 \
  --query 'Stacks[0].Outputs' \
  --output table
```

## Testing the Deployment

### 1. Verify ALB is Accessible

```bash
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name waf-security-synth101912633 \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`TestALBDNSName`].OutputValue' \
  --output text)

curl -I http://$ALB_DNS
# Expected: HTTP/1.1 200 OK
```

### 2. Verify WAF Association

```bash
WEB_ACL_ARN=$(aws cloudformation describe-stacks \
  --stack-name waf-security-synth101912633 \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`WebACLArn`].OutputValue' \
  --output text)

aws wafv2 list-resources-for-web-acl \
  --web-acl-arn $WEB_ACL_ARN \
  --region us-east-1
# Expected: Should show the test ALB ARN
```

### 3. Test Rate Limiting

```bash
# Send multiple requests to test rate limiting
for i in {1..2100}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://$ALB_DNS
done
# Expected: First 2000 requests return 200, subsequent requests return 403
```

### 4. Verify WAF Logs in S3

```bash
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name waf-security-synth101912633 \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`WAFLogBucketName`].OutputValue' \
  --output text)

aws s3 ls s3://$BUCKET_NAME/ --recursive --region us-east-1
# Expected: WAF log files with timestamps
```

### 5. Check CloudWatch Metrics

```bash
WEB_ACL_ID=$(aws cloudformation describe-stacks \
  --stack-name waf-security-synth101912633 \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`WebACLId`].OutputValue' \
  --output text)

aws cloudwatch get-metric-statistics \
  --namespace AWS/WAFV2 \
  --metric-name AllowedRequests \
  --dimensions Name=WebACL,Value=api-protection-webacl-synth101912633 Name=Region,Value=us-east-1 Name=Rule,Value=ALL \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-east-1
```

## Cleanup

### Delete the Stack

```bash
# First, empty the S3 bucket (required before stack deletion)
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name waf-security-synth101912633 \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`WAFLogBucketName`].OutputValue' \
  --output text)

aws s3 rm s3://$BUCKET_NAME --recursive --region us-east-1

# Then delete the stack
aws cloudformation delete-stack \
  --stack-name waf-security-synth101912633 \
  --region us-east-1

# Monitor deletion
aws cloudformation wait stack-delete-complete \
  --stack-name waf-security-synth101912633 \
  --region us-east-1
```

## Key Differences from MODEL_RESPONSE

| Aspect | MODEL_RESPONSE | IDEAL_RESPONSE |
|--------|----------------|----------------|
| **Self-Sufficiency** | Requires external ALB ARN | Creates complete test infrastructure |
| **Parameters** | 4 (including ALBArn) | 3 (removed ALBArn) |
| **Network Resources** | 0 | 10 (VPC, subnets, IGW, routes, SG) |
| **ALB Resources** | 0 | 4 (ALB, target group, listener, SG) |
| **S3 Bucket Policy** | Incorrect principal (logging.s3) | Correct principal (delivery.logs) |
| **Bucket Policy Conditions** | Missing x-amz-acl | Includes required x-amz-acl |
| **Outputs** | 5 (WAF-only) | 7 (includes ALB DNS and ARN) |
| **Deployability** | Blocked without external ALB | Fully deployable in isolation |
| **Testability** | Cannot test WAF rules | Complete end-to-end testing |
| **Default Environment** | production | test |

## Cost Estimate

### Monthly Costs (us-east-1)

| Resource | Cost |
|----------|------|
| WAF Web ACL | $5.00/month |
| WAF Rules (4) | $4.00/month |
| WAF Requests | $0.60 per million |
| Application Load Balancer | $16.20/month (730 hours) |
| Data Processing | $0.008 per GB |
| S3 Storage | $0.023 per GB |
| S3 Requests | Minimal |
| VPC/Subnets/IGW | Free |
| **Estimated Total** | **$26-35/month** |

### Cost Optimization Notes

- ALB is the largest fixed cost component
- For production with existing ALB, remove test infrastructure to save $16/month
- S3 lifecycle policies reduce storage costs over time
- WAF request charges scale with traffic volume

## Security Considerations

1. **Public Subnets**: Test ALB is internet-facing for testing; production should use private subnets
2. **Security Group**: Allows all HTTP/HTTPS traffic; production should restrict to specific IPs/ranges
3. **Fixed Response**: Test listener returns fixed response; production should route to actual targets
4. **Encryption**: S3 bucket uses AES256; consider KMS for production
5. **Access Logging**: Consider enabling ALB access logs for complete audit trail

## Production Deployment Notes

For production deployment:

1. **Remove Test Infrastructure**: Delete TestVPC, TestSubnet*, TestALB, TestALBSecurityGroup, TestTargetGroup, TestALBListener
2. **Restore ALBArn Parameter**: Add ALBArn parameter back for existing ALB
3. **Update WAFWebACLAssociation**: Change ResourceArn to use ALBArn parameter
4. **HTTPS Listener**: Replace HTTP listener with HTTPS and proper SSL certificate
5. **Private Subnets**: Move ALB to private subnets if needed
6. **Monitoring**: Add CloudWatch alarms for WAF metrics (blocked requests, rate limits)
7. **Log Analysis**: Set up log analysis tools (Athena, QuickSight, or third-party SIEM)
8. **Backup and DR**: Consider cross-region replication for WAF logs

## References

- [AWS WAF Developer Guide](https://docs.aws.amazon.com/waf/latest/developerguide/)
- [AWS WAFv2 CloudFormation Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/AWS_WAFv2.html)
- [WAF Logging to S3](https://docs.aws.amazon.com/waf/latest/developerguide/logging-s3.html)
- [AWS Managed Rules](https://docs.aws.amazon.com/waf/latest/developerguide/aws-managed-rule-groups.html)
- [Application Load Balancer Documentation](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/)
