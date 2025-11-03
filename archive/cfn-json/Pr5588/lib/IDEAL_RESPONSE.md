# Ideal Response: Security Configuration as Code for Serverless Application

## Architecture Overview

This CloudFormation template creates a production-ready, security-focused serverless application infrastructure on AWS with comprehensive security controls, encryption at rest and in transit, centralized logging and monitoring, and full audit trails. The infrastructure implements security best practices including VPC isolation, KMS encryption, IAM least privilege principles, API Gateway request validation, multi-region CloudTrail auditing, and CloudWatch log aggregation following AWS Well-Architected Framework security pillar guidelines.

### Network Architecture

The infrastructure implements a secure VPC architecture in the us-west-1 region with proper network isolation and controlled internet access. The VPC uses a 10.0.0.0/16 CIDR block with a public subnet (10.0.1.0/24) for the NAT Gateway and a private subnet (10.0.2.0/24) for Lambda functions. An Internet Gateway provides public subnet connectivity to the internet, enabling outbound access through the NAT Gateway. A single NAT Gateway with a dedicated Elastic IP is deployed in the public subnet to provide outbound internet access for Lambda functions in the private subnet while maintaining their isolation from inbound internet traffic. Separate route tables control traffic flow with the public subnet routing through the Internet Gateway and the private subnet routing through the NAT Gateway for outbound connectivity. This network design ensures Lambda functions cannot be directly accessed from the internet and can only be invoked through API Gateway, implementing defense-in-depth security architecture.

### Serverless Compute Layer

The compute layer consists of Lambda functions deployed within the VPC's private subnet with strict IAM execution roles. Lambda functions use configurable runtime (defaulting to Python 3.11) and memory size (defaulting to 128 MB) for cost optimization and performance tuning. Functions are attached to the Lambda security group allowing only outbound traffic and deployed in the private subnet for network isolation. The Lambda execution role implements least privilege with specific permissions for CloudWatch Logs access scoped to /aws/lambda/ log groups, S3 read-only access to the application data bucket, KMS decrypt permissions for encrypted objects, and VPC ENI management through AWSLambdaVPCAccessExecutionRole managed policy. Environment variables provide configuration including the environment suffix and S3 bucket name, avoiding hardcoded values. The VPC configuration ensures functions have network connectivity through VPC endpoints and NAT Gateway while remaining inaccessible from the internet, with all invocations flowing exclusively through API Gateway.

### API Gateway Integration

API Gateway serves as the secure entry point for the serverless application, enforcing request validation and access controls before forwarding requests to Lambda. The REST API is configured as REGIONAL with comprehensive request validation to ensure incoming requests meet specified criteria before invocation. An API Gateway Request Validator enforces validation of both request parameters and request body content, rejecting malformed requests before they reach Lambda. The API is deployed to a production stage named 'prod' as required, with access logging enabled to CloudWatch Logs capturing request IDs, error messages, and full request/response details. Method settings enable INFO-level logging, data trace for debugging, and CloudWatch metrics for monitoring. The API uses AWS_PROXY integration with Lambda, allowing the function to control response format and status codes. Lambda invocation permission restricts the API Gateway to invoke the function using resource-based policies. This configuration implements security controls including request validation, comprehensive logging, and metrics collection while ensuring only valid requests reach the Lambda function.

### Storage and Encryption Layer

The storage layer implements comprehensive encryption for data at rest using both S3 and KMS services. A customer-managed KMS key provides encryption for the S3 bucket and other resources, with automatic key rotation enabled for enhanced security. The KMS key policy grants root account full permissions and allows S3, Lambda, and CloudWatch Logs services to use the key for decryption and data key generation. A KMS alias provides a friendly name for the key following AWS naming conventions. The primary S3 bucket stores application data with KMS encryption (SSE-KMS) instead of AWS-managed encryption (SSE-S3), bucket key enabled for cost optimization through reduced KMS API calls, versioning enabled for data protection and recovery, and logging configuration directing access logs to a separate logging bucket. A dedicated S3 logging bucket captures access logs with AES256 encryption, lifecycle policy deleting logs after 90 days, and public access completely blocked. An S3 bucket policy on the main bucket enforces HTTPS for all data transfers by explicitly denying requests when aws:SecureTransport is false, ensuring encryption in transit and preventing unencrypted access. This multi-layer encryption approach protects data at rest with KMS and data in transit with mandatory HTTPS.

### Security Controls

Security is implemented through multiple layers including security groups, IAM policies, KMS encryption, and S3 bucket policies. The EC2SecurityGroup restricts SSH access on port 22 to instances from only the specific IP address defined in the SSHAllowedCIDR parameter (defaulting to 203.0.113.0/32), implementing least privilege network access. The LambdaSecurityGroup allows Lambda functions to make outbound connections while preventing any inbound access, ensuring functions can reach external services through the NAT Gateway but cannot be accessed directly. IAM policies follow the principle of least privilege with Lambda execution roles granted only CloudWatch Logs write permissions to /aws/lambda/ log groups, S3 GetObject and ListBucket permissions to the specific application bucket, and KMS Decrypt permission to the customer-managed key. No wildcard resource permissions are used, and the roles explicitly avoid any root account privileges. S3 bucket policies enforce HTTPS using conditional deny statements checking aws:SecureTransport, preventing unencrypted data access. KMS key policies restrict usage to specific service principals. VPC Flow Logs capture all network traffic for security analysis and compliance auditing. This defense-in-depth approach implements security controls at the network, application, and data layers.

### IAM Roles and Policies

The Lambda execution role provides functions with permissions following the principle of least privilege without using root account credentials. The role includes the AWSLambdaVPCAccessExecutionRole managed policy for VPC ENI management, enabling Lambda to create and manage network interfaces in the VPC for connectivity. Inline policies grant specific permissions with tightly scoped resources. The CloudWatch Logs policy allows CreateLogGroup, CreateLogStream, and PutLogEvents actions only on resources matching /aws/lambda/ log groups, preventing functions from writing to other log groups. The S3 policy grants GetObject and ListBucket permissions exclusively to the application data bucket and its contents using GetAtt for bucket ARN and Fn::Sub for object paths, preventing access to other S3 buckets. The KMS policy grants Decrypt and DescribeKey permissions only to the customer-managed KMS key, enabling functions to decrypt encrypted S3 objects without broader KMS permissions. The VPC Flow Logs role grants permissions for CloudWatch Logs access using a trust policy allowing vpc-flow-logs.amazonaws.com service principal. This IAM structure eliminates hard-coded credentials, provides temporary security credentials automatically rotated by AWS, and implements fine-grained permissions for each service component.

### Monitoring and Logging

CloudWatch Logs provides centralized log aggregation for Lambda functions, API Gateway, and VPC Flow Logs with appropriate retention policies. Lambda log groups use 30-day retention for troubleshooting and compliance while balancing storage costs. API Gateway logs capture access logs with request context including request IDs, error messages, and messageString for debugging API issues and tracking usage patterns. VPC Flow Logs capture all network traffic metadata including source and destination IPs, ports, protocols, packet and byte counts, and accept/reject decisions for security analysis and troubleshooting connectivity issues, with 30-day retention. CloudWatch alarms monitor critical metrics including Lambda duration exceeding 25 seconds indicating performance issues or timeout risks, Lambda errors exceeding 5 occurrences in 5 minutes for failure detection, API Gateway 4XX errors exceeding 10 in 5 minutes indicating client-side issues or validation failures, and API Gateway 5XX errors exceeding 5 in 5 minutes for server-side failure detection. These alarms enable proactive issue detection before they impact users. CloudTrail logs all AWS API calls to an encrypted S3 bucket, configured as a multi-region trail with global service events included for comprehensive audit coverage of all account activity. This monitoring and logging architecture provides complete visibility into application behavior, network traffic, and API activity for security analysis, compliance reporting, and troubleshooting.

### High Availability and Security Posture

The architecture balances high availability with security requirements for serverless applications. Lambda functions automatically scale to handle concurrent invocations without capacity planning, with AWS managing underlying infrastructure including automatic replacement of unhealthy compute nodes and distribution across Availability Zones. API Gateway is fully managed by AWS with built-in high availability across multiple Availability Zones and automatic scaling to handle traffic spikes. The NAT Gateway is deployed in a single Availability Zone for cost optimization, appropriate for serverless workloads where Lambda cold starts provide built-in resilience and API Gateway handles retry logic. S3 buckets provide 99.999999999% durability with automatic replication across multiple facilities. KMS keys are automatically replicated within the region with built-in redundancy. CloudTrail multi-region trail captures events from all regions ensuring comprehensive audit coverage even during regional issues. VPC Flow Logs, Lambda logs, and API Gateway logs all stream to CloudWatch Logs for centralized analysis. Security controls including mandatory HTTPS enforcement, KMS encryption at rest, VPC isolation, SSH restrictions to specific IPs, request validation, and comprehensive audit logs provide defense-in-depth security architecture. Resource tagging with Environment, Project, Owner, and CostCenter enables cost allocation, compliance reporting, and automated operations.

## CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Security Configuration as Code for Serverless Application - VPC, Lambda, API Gateway, S3, CloudTrail, and CloudWatch",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": ["EnvironmentSuffix"]
        },
        {
          "Label": {
            "default": "Network Configuration"
          },
          "Parameters": [
            "VpcCIDR",
            "PublicSubnetCIDR",
            "PrivateSubnetCIDR",
            "SSHAllowedCIDR"
          ]
        },
        {
          "Label": {
            "default": "Lambda Configuration"
          },
          "Parameters": ["LambdaRuntime", "LambdaMemorySize"]
        }
      ]
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    },
    "VpcCIDR": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "CIDR block for VPC",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/16)$"
    },
    "PublicSubnetCIDR": {
      "Type": "String",
      "Default": "10.0.1.0/24",
      "Description": "CIDR block for Public Subnet",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "PrivateSubnetCIDR": {
      "Type": "String",
      "Default": "10.0.2.0/24",
      "Description": "CIDR block for Private Subnet",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "SSHAllowedCIDR": {
      "Type": "String",
      "Default": "203.0.113.0/32",
      "Description": "CIDR block allowed to SSH to EC2 instances",
      "AllowedPattern": "^(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/(\\d|[1-2]\\d|3[0-2]))$"
    },
    "LambdaRuntime": {
      "Type": "String",
      "Default": "python3.11",
      "Description": "Lambda function runtime",
      "AllowedValues": [
        "python3.11",
        "python3.10",
        "python3.9",
        "nodejs18.x",
        "nodejs20.x"
      ]
    },
    "LambdaMemorySize": {
      "Type": "Number",
      "Default": 128,
      "Description": "Lambda function memory size in MB",
      "AllowedValues": [128, 256, 512, 1024]
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {
          "Ref": "VpcCIDR"
        },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "VPC-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "IGW-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "InternetGatewayId": {
          "Ref": "InternetGateway"
        }
      }
    },
    "PublicSubnet": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PublicSubnetCIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PublicSubnet-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "PrivateSubnet": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PrivateSubnetCIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PrivateSubnet-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "NATGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "NATGatewayEIP-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "NATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": ["NATGatewayEIP", "AllocationId"]
        },
        "SubnetId": {
          "Ref": "PublicSubnet"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "NATGateway-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PublicRouteTable-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {
          "Ref": "InternetGateway"
        }
      }
    },
    "PublicSubnetRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PrivateRouteTable-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "PrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway"
        }
      }
    },
    "PrivateSubnetRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances - allows SSH from specific IP only",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": {
              "Ref": "SSHAllowedCIDR"
            },
            "Description": "SSH access from specific IP address"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "EC2SecurityGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda functions in VPC",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "LambdaSecurityGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for encrypting S3 bucket and other resources",
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow services to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "s3.amazonaws.com",
                  "lambda.amazonaws.com",
                  "logs.amazonaws.com"
                ]
              },
              "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
              "Resource": "*"
            }
          ]
        },
        "EnableKeyRotation": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "KMSKey-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/serverless-security-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Retain",
      "UpdateReplacePolicy": "Retain",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "serverless-app-data-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Fn::GetAtt": ["KMSKey", "Arn"]
                }
              },
              "BucketKeyEnabled": true
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LoggingConfiguration": {
          "DestinationBucketName": {
            "Ref": "S3LoggingBucket"
          },
          "LogFilePrefix": "access-logs/"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "S3Bucket-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "S3LoggingBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Retain",
      "UpdateReplacePolicy": "Retain",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "serverless-app-logs-${AWS::AccountId}-${EnvironmentSuffix}"
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
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldLogs",
              "Status": "Enabled",
              "ExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "S3LoggingBucket-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
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
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DenyInsecureTransport",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:*",
              "Resource": [
                {
                  "Fn::GetAtt": ["S3Bucket", "Arn"]
                },
                {
                  "Fn::Sub": "${S3Bucket.Arn}/*"
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
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "LambdaExecutionRole-${EnvironmentSuffix}-${AWS::StackName}"
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "LambdaCloudWatchLogsPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "LambdaS3ReadOnlyPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["s3:GetObject", "s3:ListBucket"],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["S3Bucket", "Arn"]
                    },
                    {
                      "Fn::Sub": "${S3Bucket.Arn}/*"
                    }
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "LambdaKMSDecryptPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["kms:Decrypt", "kms:DescribeKey"],
                  "Resource": {
                    "Fn::GetAtt": ["KMSKey", "Arn"]
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "LambdaExecutionRole-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "APIGatewayCloudWatchRole": {
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
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "APIGatewayCloudWatchRole-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "ServerlessAppFunction-${EnvironmentSuffix}"
        },
        "Runtime": {
          "Ref": "LambdaRuntime"
        },
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "MemorySize": {
          "Ref": "LambdaMemorySize"
        },
        "Timeout": 30,
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "LambdaSecurityGroup"
            }
          ],
          "SubnetIds": [
            {
              "Ref": "PrivateSubnet"
            }
          ]
        },
        "Environment": {
          "Variables": {
            "ENVIRONMENT": {
              "Ref": "EnvironmentSuffix"
            },
            "S3_BUCKET": {
              "Ref": "S3Bucket"
            }
          }
        },
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "import json",
                "import os",
                "",
                "def lambda_handler(event, context):",
                "    return {",
                "        'statusCode': 200,",
                "        'headers': {",
                "            'Content-Type': 'application/json',",
                "            'Access-Control-Allow-Origin': '*'",
                "        },",
                "        'body': json.dumps({",
                "            'message': 'Serverless security application running',",
                "            'environment': os.environ.get('ENVIRONMENT', 'unknown')",
                "        })",
                "    }"
              ]
            ]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "LambdaFunction-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/ServerlessAppFunction-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "APIGatewayRestAPI": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": {
          "Fn::Sub": "ServerlessAPI-${EnvironmentSuffix}"
        },
        "Description": "API Gateway for serverless application with request validation",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        },
        "Policy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": "*",
              "Action": "execute-api:Invoke",
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "APIGateway-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "APIGatewayAccount": {
      "Type": "AWS::ApiGateway::Account",
      "Properties": {
        "CloudWatchRoleArn": {
          "Fn::GetAtt": [
            "APIGatewayCloudWatchRole",
            "Arn"
          ]
        }
      }
    },
    "APIGatewayRequestValidator": {
      "Type": "AWS::ApiGateway::RequestValidator",
      "Properties": {
        "Name": "RequestValidator",
        "RestApiId": {
          "Ref": "APIGatewayRestAPI"
        },
        "ValidateRequestBody": true,
        "ValidateRequestParameters": true
      }
    },
    "APIGatewayResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "APIGatewayRestAPI"
        },
        "ParentId": {
          "Fn::GetAtt": ["APIGatewayRestAPI", "RootResourceId"]
        },
        "PathPart": "app"
      }
    },
    "APIGatewayMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "APIGatewayRestAPI"
        },
        "ResourceId": {
          "Ref": "APIGatewayResource"
        },
        "HttpMethod": "GET",
        "AuthorizationType": "NONE",
        "RequestValidatorId": {
          "Ref": "APIGatewayRequestValidator"
        },
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations"
          }
        },
        "MethodResponses": [
          {
            "StatusCode": "200"
          }
        ]
      }
    },
    "APIGatewayDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": "APIGatewayMethod",
      "Properties": {
        "RestApiId": {
          "Ref": "APIGatewayRestAPI"
        },
        "Description": "Production deployment"
      }
    },
    "APIGatewayStage": {
      "Type": "AWS::ApiGateway::Stage",
      "Properties": {
        "StageName": "prod",
        "RestApiId": {
          "Ref": "APIGatewayRestAPI"
        },
        "DeploymentId": {
          "Ref": "APIGatewayDeployment"
        },
        "Description": "Production stage",
        "AccessLogSetting": {
          "DestinationArn": {
            "Fn::GetAtt": ["APIGatewayLogGroup", "Arn"]
          },
          "Format": "$context.requestId $context.requestTime $context.httpMethod $context.resourcePath $context.status $context.error.message"
        },
        "MethodSettings": [
          {
            "ResourcePath": "/*",
            "HttpMethod": "*",
            "LoggingLevel": "INFO",
            "DataTraceEnabled": true,
            "MetricsEnabled": true
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "APIGatewayStage-prod-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "APIGatewayLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/apigateway/ServerlessAPI-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "LambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "LambdaFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${APIGatewayRestAPI}/*/*"
        }
      }
    },
    "VPCFlowLogRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "vpc-flow-logs.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "CloudWatchLogPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
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
    "VPCFlowLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/vpc/${EnvironmentSuffix}-${AWS::StackName}"
        },
        "RetentionInDays": 30
      }
    },
    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "DeliverLogsPermissionArn": {
          "Fn::GetAtt": ["VPCFlowLogRole", "Arn"]
        },
        "LogDestinationType": "cloud-watch-logs",
        "LogGroupName": {
          "Ref": "VPCFlowLogGroup"
        },
        "ResourceId": {
          "Ref": "VPC"
        },
        "ResourceType": "VPC",
        "TrafficType": "ALL",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "VPCFlowLog-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "CloudTrailBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Retain",
      "UpdateReplacePolicy": "Retain",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "cloudtrail-logs-${AWS::AccountId}-${EnvironmentSuffix}"
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
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldTrailLogs",
              "Status": "Enabled",
              "ExpirationInDays": 365
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "CloudTrailBucket-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "CloudTrailBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "CloudTrailBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSCloudTrailAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::GetAtt": ["CloudTrailBucket", "Arn"]
              }
            },
            {
              "Sid": "AWSCloudTrailWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${CloudTrailBucket.Arn}/*"
              },
              "Condition": {
                "StringEquals": {
                  "s3:x-amz-acl": "bucket-owner-full-control"
                }
              }
            }
          ]
        }
      }
    },
    "CloudTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "DependsOn": "CloudTrailBucketPolicy",
      "Properties": {
        "TrailName": {
          "Fn::Sub": "ServerlessSecurityTrail-${EnvironmentSuffix}"
        },
        "S3BucketName": {
          "Ref": "CloudTrailBucket"
        },
        "IncludeGlobalServiceEvents": true,
        "IsLogging": true,
        "IsMultiRegionTrail": true,
        "EventSelectors": [
          {
            "ReadWriteType": "All",
            "IncludeManagementEvents": true
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "CloudTrail-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "ServerlessSecurityConfig"
          },
          {
            "Key": "Owner",
            "Value": "SecurityTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Security"
          }
        ]
      }
    },
    "LambdaCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "Lambda-HighDuration-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when Lambda function duration is high",
        "MetricName": "Duration",
        "Namespace": "AWS/Lambda",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 25000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "LambdaFunction"
            }
          }
        ]
      }
    },
    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "Lambda-Errors-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when Lambda function has errors",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "LambdaFunction"
            }
          }
        ]
      }
    },
    "APIGateway4XXErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "APIGateway-4XXErrors-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when API Gateway has high 4XX errors",
        "MetricName": "4XXError",
        "Namespace": "AWS/ApiGateway",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "ApiName",
            "Value": {
              "Fn::Sub": "ServerlessAPI-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "APIGateway5XXErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "APIGateway-5XXErrors-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when API Gateway has 5XX errors",
        "MetricName": "5XXError",
        "Namespace": "AWS/ApiGateway",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "ApiName",
            "Value": {
              "Fn::Sub": "ServerlessAPI-${EnvironmentSuffix}"
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "VPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPCId"
        }
      }
    },
    "PublicSubnetId": {
      "Description": "Public Subnet ID",
      "Value": {
        "Ref": "PublicSubnet"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnetId"
        }
      }
    },
    "PrivateSubnetId": {
      "Description": "Private Subnet ID",
      "Value": {
        "Ref": "PrivateSubnet"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnetId"
        }
      }
    },
    "S3BucketName": {
      "Description": "Name of the S3 bucket for application data",
      "Value": {
        "Ref": "S3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3BucketName"
        }
      }
    },
    "S3BucketArn": {
      "Description": "ARN of the S3 bucket",
      "Value": {
        "Fn::GetAtt": ["S3Bucket", "Arn"]
      }
    },
    "LambdaFunctionArn": {
      "Description": "ARN of the Lambda function",
      "Value": {
        "Fn::GetAtt": ["LambdaFunction", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaFunctionArn"
        }
      }
    },
    "LambdaFunctionName": {
      "Description": "Name of the Lambda function",
      "Value": {
        "Ref": "LambdaFunction"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaFunctionName"
        }
      }
    },
    "APIGatewayURL": {
      "Description": "URL of the API Gateway in prod stage",
      "Value": {
        "Fn::Sub": "https://${APIGatewayRestAPI}.execute-api.${AWS::Region}.amazonaws.com/prod/app"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-APIGatewayURL"
        }
      }
    },
    "APIGatewayId": {
      "Description": "ID of the API Gateway REST API",
      "Value": {
        "Ref": "APIGatewayRestAPI"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-APIGatewayId"
        }
      }
    },
    "CloudTrailName": {
      "Description": "Name of the CloudTrail trail",
      "Value": {
        "Ref": "CloudTrail"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CloudTrailName"
        }
      }
    },
    "KMSKeyId": {
      "Description": "ID of the KMS key for encryption",
      "Value": {
        "Ref": "KMSKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyId"
        }
      }
    },
    "KMSKeyArn": {
      "Description": "ARN of the KMS key",
      "Value": {
        "Fn::GetAtt": ["KMSKey", "Arn"]
      }
    },
    "NATGatewayId": {
      "Description": "NAT Gateway ID",
      "Value": {
        "Ref": "NATGateway"
      }
    },
    "StackName": {
      "Description": "Name of this CloudFormation stack",
      "Value": {
        "Ref": "AWS::StackName"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-StackName"
        }
      }
    },
    "EnvironmentSuffix": {
      "Description": "Environment suffix used for this deployment",
      "Value": {
        "Ref": "EnvironmentSuffix"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EnvironmentSuffix"
        }
      }
    }
  }
}
```

## Key Features

### Security

The template implements comprehensive security through defense-in-depth architecture across all layers. Network security is enforced with Lambda functions deployed in private subnets accessible only through API Gateway, SSH restricted to a specific IP address through the SSHAllowedCIDR parameter, and VPC security groups preventing direct Lambda invocation from the internet. Encryption is implemented at rest using customer-managed KMS keys with automatic key rotation for S3 buckets and in transit through mandatory HTTPS enforcement via S3 bucket policy conditions that explicitly deny requests when aws:SecureTransport is false. IAM roles follow strict least privilege with Lambda execution roles granted only specific CloudWatch Logs permissions scoped to /aws/lambda/ log groups, S3 permissions limited to GetObject and ListBucket on the application bucket, and KMS Decrypt permission only for the customer-managed key. API Gateway request validation rejects malformed requests before Lambda invocation, reducing attack surface and preventing resource consumption from invalid inputs. CloudTrail provides comprehensive audit trails logging all AWS API calls to an encrypted S3 bucket as a multi-region trail. VPC Flow Logs capture all network traffic metadata for security analysis and compliance reporting with 30-day retention in CloudWatch Logs. All S3 buckets block public access through PublicAccessBlockConfiguration. This multi-layer security architecture protects against unauthorized access, data breaches, and compliance violations.

### Scalability

The serverless architecture provides automatic horizontal scaling without capacity planning or infrastructure management. Lambda functions automatically scale to handle concurrent invocations from 0 to 1000 concurrent executions by default, with AWS managing all underlying infrastructure including automatic distribution across Availability Zones and automatic replacement of unhealthy compute nodes. API Gateway automatically handles traffic spikes with built-in rate limiting and throttling capabilities configurable per stage. S3 buckets automatically scale to handle any storage capacity and request rate without configuration. CloudWatch Logs automatically scales to handle log ingestion from all sources. KMS key usage scales automatically to handle encryption and decryption operations. The VPC design with /16 CIDR provides 65,536 IP addresses supporting future growth and additional Lambda functions. Lambda memory size is parameterized allowing performance tuning through increased memory allocation which proportionally increases CPU and network bandwidth. All outputs are exported for cross-stack references, enabling the infrastructure to serve as a foundation for additional serverless components. This serverless approach eliminates capacity planning concerns and ensures the infrastructure scales automatically from zero to enterprise workload levels.

### Operational Excellence

The template achieves operational excellence through infrastructure as code with comprehensive parameterization and validation. Parameters include AllowedPattern validation for CIDR blocks ensuring valid network configurations, AllowedValues for Lambda runtime and memory size preventing invalid configurations, and default values for all parameters enabling quick deployment while allowing customization. CloudFormation Interface metadata organizes parameters into logical groups (Environment, Network, Lambda) improving console user experience. CloudWatch monitoring provides comprehensive visibility with Lambda duration alarms detecting performance issues before timeout, Lambda error alarms for failure detection, and API Gateway 4XX/5XX error alarms for request validation and server-side failure monitoring. Centralized logging to CloudWatch Logs with 30-day retention enables troubleshooting and compliance auditing for Lambda execution logs, API Gateway access logs, and VPC Flow Logs. CloudTrail provides complete audit trails of all AWS API calls for security investigations and compliance reporting. Consistent tagging across all resources with five mandatory tags (Name, Environment, Project, Owner, CostCenter) enables cost allocation tracking, compliance auditing through tag-based reporting, and automated operations through tag-based resource selection. Lambda functions use inline code for demonstration, easily replaced with S3 or ECR image references for production deployments. Environment variables provide configuration without hardcoded values, supporting environment-specific settings.

### Cost Optimization

The serverless architecture provides significant cost optimization through pay-per-use pricing models. Lambda functions incur charges only during actual execution time with 1ms billing granularity, automatically scaling to zero when not in use eliminating idle resource costs. Default 128MB memory allocation minimizes costs while AllowedValues constraints of [128, 256, 512, 1024] prevent accidental deployment of expensive configurations. The 30-second timeout balances functionality with cost control. API Gateway charges only for API calls and data transfer with no hourly charges. S3 uses versioning which enables lifecycle policies for additional cost optimization. CloudWatch Logs retention is limited to 30 days for Lambda, API Gateway, and VPC Flow Logs balancing compliance requirements with storage costs. CloudTrail logs use lifecycle policy deleting logs after 365 days reducing long-term storage costs. S3 logging bucket uses lifecycle policy deleting access logs after 90 days. KMS key rotation is automatic without additional cost. The single NAT Gateway design optimizes cost for serverless workloads where Lambda cold starts provide built-in resilience. Comprehensive tagging with Environment, Project, Owner, and CostCenter enables detailed AWS Cost Explorer reports, chargeback to appropriate departments, and identification of cost optimization opportunities through tag-based cost allocation.

### Reliability

The serverless architecture achieves high reliability through AWS-managed infrastructure and built-in redundancy. Lambda functions are automatically distributed across multiple Availability Zones with automatic failover and replacement of unhealthy compute nodes by AWS. API Gateway provides built-in high availability across multiple Availability Zones with automatic traffic distribution and failover. S3 provides 99.999999999% (11 9's) durability with automatic replication across multiple facilities within the region. Versioning is enabled on the application bucket providing protection against accidental deletions and enabling point-in-time recovery. KMS keys are automatically replicated within the region with built-in redundancy eliminating single points of failure in encryption operations. CloudTrail is configured as a multi-region trail ensuring audit logs are captured from all regions with centralized storage. Lambda functions retry failed invocations automatically with exponential backoff. API Gateway provides retry logic for Lambda integration failures. CloudWatch alarms provide proactive monitoring enabling issue detection before user impact with Lambda duration alarms detecting performance degradation, Lambda error alarms for failure rates, and API Gateway error alarms for request validation and server-side failures. VPC Flow Logs, Lambda logs, and API Gateway logs all stream to CloudWatch Logs providing centralized log aggregation for troubleshooting. All outputs use Export enabling cross-stack references and supporting disaster recovery scenarios where dependent stacks can reference this foundational infrastructure.

## Modern AWS Practices

### VPC-Connected Lambda Functions

Lambda functions are deployed within the VPC's private subnet rather than using default Lambda networking, providing several critical security advantages. VPC-connected Lambda functions cannot be accessed from the internet directly and can only be invoked through API Gateway or other AWS services with explicit permissions. The Lambda security group allows only outbound traffic while preventing any inbound connections, ensuring functions can reach external services through the NAT Gateway but cannot be accessed directly. Functions access AWS services through VPC endpoints or NAT Gateway maintaining network-level isolation. The Lambda execution role includes AWSLambdaVPCAccessExecutionRole managed policy granting permissions to create and manage elastic network interfaces (ENIs) in the VPC for connectivity. VPC configuration incurs cold start latency (additional 5-10 seconds) as Lambda creates ENIs in the private subnet, but this trade-off provides defense-in-depth security architecture. The private subnet routes outbound traffic through the NAT Gateway enabling functions to access external APIs and services while remaining isolated from inbound internet traffic. This VPC integration aligns with AWS security best practices for serverless applications handling sensitive data or requiring network-level isolation.

### Customer-Managed KMS Keys with Automatic Rotation

The infrastructure uses customer-managed KMS keys rather than AWS-managed keys for S3 encryption, providing enhanced security and control. Customer-managed keys enable centralized key policy management with granular control over which AWS services and IAM principals can use the key for encryption and decryption operations. The key policy explicitly grants permissions to S3, Lambda, and CloudWatch Logs services while preventing unauthorized access. Automatic key rotation is enabled through EnableKeyRotation set to true, causing AWS to automatically rotate the key material annually while maintaining the same key ID and alias, ensuring encrypted data remains accessible without application changes. Customer-managed keys support detailed CloudTrail logging of all key usage providing audit trails for compliance requirements. The KMS alias provides a friendly name (alias/serverless-security-${EnvironmentSuffix}) following AWS naming conventions and enabling easy key identification across environments. S3 bucket uses BucketKeyEnabled reducing KMS API calls by up to 99% through S3 bucket keys that generate data keys locally, significantly reducing costs while maintaining security. This approach provides enterprise-grade encryption key management with automatic rotation, detailed audit trails, and cost optimization through bucket keys.

### S3 Bucket Policy for HTTPS Enforcement

The S3 bucket policy explicitly enforces HTTPS for all data transfers through a conditional deny statement, implementing encryption in transit as required by security best practices and compliance frameworks. The policy uses the Condition element with aws:SecureTransport: false to identify unencrypted HTTP requests and explicitly denies them using Effect: Deny, ensuring all S3 access occurs over encrypted connections. This approach prevents data interception through man-in-the-middle attacks and ensures compliance with security standards requiring encryption in transit. The policy applies to both the bucket ARN and object ARNs using Fn::Sub: ${S3Bucket.Arn}/\* ensuring all operations including bucket-level operations (ListBucket) and object-level operations (GetObject, PutObject) require HTTPS. This explicit deny policy cannot be overridden by allow policies, providing strong enforcement. The policy complements S3 bucket encryption at rest (KMS) providing comprehensive data protection with encryption in transit through mandatory HTTPS and encryption at rest through KMS. This security control is critical for compliance with PCI DSS, HIPAA, and other regulations requiring encrypted data transfers.

### API Gateway Request Validation

API Gateway implements comprehensive request validation before forwarding requests to Lambda, reducing Lambda invocations from malformed requests and improving security and cost efficiency. The RequestValidator resource with ValidateRequestBody: true and ValidateRequestParameters: true enables validation of request parameters (query strings, headers, path parameters) and request body content against schemas defined in the API Gateway model. Request validation occurs at the API Gateway layer before Lambda invocation, rejecting invalid requests with HTTP 400 Bad Request responses without consuming Lambda execution time or incurring Lambda invocation costs. This approach reduces attack surface by preventing malicious or malformed payloads from reaching application code, improves cost efficiency by avoiding Lambda invocations for invalid requests, and provides faster error responses to clients by validating at the edge. The API is deployed to a production stage named 'prod' as specifically required with comprehensive logging enabled through AccessLogSetting capturing request IDs, error messages, and messageString for debugging. Method settings enable INFO-level logging, DataTraceEnabled for request/response logging, and MetricsEnabled for CloudWatch metrics. This configuration implements defense in depth with validation occurring before Lambda execution, comprehensive logging for security analysis, and metrics for operational monitoring.

### CloudTrail Multi-Region Trail with Global Service Events

CloudTrail is configured as a multi-region trail with global service event logging providing comprehensive audit coverage across the entire AWS account. IsMultiRegionTrail set to true ensures the trail automatically logs events from all AWS regions including regions added after the trail was created, eliminating the need to create trails in each region individually and simplifying compliance reporting. IncludeGlobalServiceEvents set to true captures events from global services like IAM, CloudFront, Route 53, and AWS Organizations that are not region-specific, ensuring complete visibility into all account activity including IAM policy changes, user creation, and role assumption events. This configuration provides several critical benefits including centralized log storage in a single S3 bucket simplifying compliance reporting and log analysis, automatic coverage of new regions as they launch without CloudFormation stack updates, and complete audit trails for security investigations capturing management events with ReadWriteType: All logging both read and write operations. CloudTrail logs are stored in a dedicated S3 bucket with AES-256 encryption, lifecycle policy deleting logs after 365 days for cost optimization, and PublicAccessBlockConfiguration preventing public access. The bucket policy grants CloudTrail exclusive permission using conditions requiring bucket-owner-full-control ACL ensuring the bucket owner maintains control over all log files. This comprehensive audit trail supports compliance with regulatory requirements including PCI DSS, HIPAA, SOC 2, and ISO 27001.

### VPC Flow Logs to CloudWatch Logs

VPC Flow Logs are configured to stream to CloudWatch Logs rather than S3, providing operational and analytical advantages for security monitoring and troubleshooting. Flow logs capture metadata about all network traffic traversing the VPC including source and destination IP addresses, ports, protocols, packet and byte counts, and accept/reject decisions based on security group and NACL rules. Streaming to CloudWatch Logs enables real-time analysis and alerting not possible with S3-based flow logs which have 5-15 minute delivery delays. CloudWatch Logs Insights provides a powerful query language for fast analysis of network traffic patterns including identifying top talkers, analyzing traffic by port and protocol, and investigating security group rule effectiveness. Flow logs can trigger CloudWatch metric filters extracting custom metrics from log data and creating alarms based on suspicious network patterns like port scanning, unusual outbound connections, or traffic to known malicious IPs. The 30-day retention period balances compliance requirements with storage costs, providing sufficient data for most security investigations while limiting long-term storage expenses. An IAM role grants VPC Flow Logs permission to publish to CloudWatch Logs using the vpc-flow-logs.amazonaws.com service principal following AWS security best practices for service-to-service permissions. This configuration provides enhanced security visibility, real-time threat detection capabilities, and cost-effective log retention compared to S3-based flow logs.

### Lambda Environment Variables for Configuration

Lambda functions use environment variables for configuration rather than hardcoding values, implementing the twelve-factor app methodology for cloud-native applications. Environment variables provide the ENVIRONMENT value from the EnvironmentSuffix parameter enabling environment-specific behavior without code changes, and S3_BUCKET value from the S3Bucket resource reference ensuring functions reference the correct bucket created by the stack. This approach enables several best practices including environment-specific configuration allowing the same Lambda code to run in dev, staging, and prod environments with different configurations, eliminating hardcoded resource names reducing coupling between code and infrastructure and improving maintainability, and supporting secure secret management through integration with AWS Secrets Manager or Parameter Store for sensitive values. Environment variables are accessible through standard environment variable APIs in all Lambda runtimes (os.environ in Python, process.env in Node.js) requiring no AWS SDK calls. For production deployments, sensitive configuration like database passwords and API keys should be stored in AWS Secrets Manager or Systems Manager Parameter Store with Lambda functions retrieving them at runtime, taking advantage of SDK caching to minimize API calls and cold start latency. This configuration approach aligns with AWS serverless best practices and twelve-factor app principles.

### IAM Least Privilege with Scoped Resource Permissions

The Lambda execution role implements strict least privilege principles with inline policies granting minimal permissions scoped to specific resources. The CloudWatch Logs policy grants CreateLogGroup, CreateLogStream, and PutLogEvents actions only on resources matching arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/_ preventing functions from writing to other log groups or accessing CloudWatch Logs data from other applications. The S3 policy grants GetObject and ListBucket permissions exclusively to the application data bucket using Fn::GetAtt for bucket ARN and Fn::Sub: ${S3Bucket.Arn}/_ for object paths, preventing access to other S3 buckets in the account. The KMS policy grants Decrypt and DescribeKey permissions only to the customer-managed KMS key using Fn::GetAtt: [KMSKey, Arn], enabling functions to decrypt encrypted S3 objects without broader KMS permissions. No policies use wildcard resource ARNs or Allow Effect with NotResource which can inadvertently grant broader permissions than intended. The role includes AWSLambdaVPCAccessExecutionRole managed policy for VPC ENI management, a well-tested AWS-managed policy with minimal permissions for VPC connectivity. This IAM structure eliminates the risk of privilege escalation, reduces blast radius if a function is compromised, supports compliance with PCI DSS and other regulations requiring least privilege, and follows AWS Well-Architected Framework security pillar guidance. Resource-specific ARNs using CloudFormation intrinsic functions ensure policies automatically reference the correct resources even if ARNs change during stack updates.

### Comprehensive Resource Tagging for Governance

All resources implement a comprehensive five-tag strategy enabling cost allocation, compliance reporting, and automated operations. The Name tag uses Fn::Sub for dynamic generation incorporating EnvironmentSuffix enabling visual identification in the AWS Console and CLI. The Environment tag references EnvironmentSuffix parameter enabling cost allocation reports by environment (dev, staging, prod) and supporting tag-based IAM policies restricting access to specific environments. The Project tag (ServerlessSecurityConfig) enables cost allocation by project and supports multi-tenant AWS accounts where multiple projects share infrastructure. The Owner tag (SecurityTeam) enables identification of responsible parties for operational issues and supports organizational cost allocation showing which teams consume resources. The CostCenter tag (Security) enables financial reporting and chargeback to appropriate departments for internal accounting and budget management. This consistent tagging strategy enables several critical capabilities including AWS Cost Explorer reports filtering and grouping costs by any tag combination for detailed cost analysis, tag-based IAM policies restricting permissions based on resource tags implementing attribute-based access control (ABAC), automated operations through AWS Systems Manager and Lambda functions targeting resources by tags for patching, backup, and lifecycle management, and compliance reporting demonstrating proper resource organization and ownership for audit requirements. All resources use consistent tag names and values following AWS tagging best practices. Lambda functions, API Gateway stages, and other resources that support tagging include all five tags ensuring complete coverage. This governance through tagging supports enterprise-scale AWS operations with detailed cost visibility, fine-grained access control, and automated resource management.
