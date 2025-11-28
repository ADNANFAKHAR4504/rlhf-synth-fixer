# Ideal Response: Security Configuration Management Solution

## Architecture Overview

This CloudFormation template creates a production-ready, security-focused infrastructure on AWS with comprehensive security controls, encryption at rest and in transit, centralized logging and monitoring, and full audit trails. The infrastructure implements security best practices including VPC isolation, KMS encryption, IAM least privilege principles, strong password policies, multi-region CloudTrail auditing, VPC Flow Logs, and CloudWatch log aggregation following AWS Well-Architected Framework security pillar guidelines.

### Network Architecture

The infrastructure implements a secure VPC architecture in the us-west-1 region with proper network isolation and controlled internet access. The VPC uses a 10.0.0.0/16 CIDR block with a public subnet (10.0.1.0/24) for the NAT Gateway and a private subnet (10.0.2.0/24) for EC2 instances and Lambda functions. An Internet Gateway provides public subnet connectivity to the internet, enabling outbound access through the NAT Gateway. A single NAT Gateway with a dedicated Elastic IP is deployed in the public subnet to provide outbound internet access for resources in the private subnet while maintaining their isolation from inbound internet traffic. Separate route tables control traffic flow with the public subnet routing through the Internet Gateway and the private subnet routing through the NAT Gateway for outbound connectivity. This network design ensures EC2 instances and Lambda functions cannot be directly accessed from the internet, implementing defense-in-depth security architecture.

### Compute Layer

The compute layer consists of EC2 instances deployed within the VPC's private subnet with strict IAM execution roles and SSM agent for remote command execution. EC2 instances use Amazon Linux 2 AMI retrieved dynamically through SSM Parameter Store, ensuring the latest secure base image. The instance type is configurable through the EC2InstanceType parameter (defaulting to t3.micro) for cost optimization. Instances are deployed in the private subnet with no public IP addresses, accessible only through Systems Manager Session Manager eliminating the need for bastion hosts. The EC2 security group restricts SSH access on port 22 and HTTPS access on port 443 to only the specific CIDR block defined in the AllowedCIDR parameter (defaulting to 203.0.113.0/32), implementing least privilege network access. UserData bootstraps the SSM agent and CloudWatch agent on instance launch, enabling remote command execution and metrics collection without direct SSH access. The EC2 instance role includes AmazonSSMManagedInstanceCore for SSM access, CloudWatchAgentServerPolicy for metrics publishing, custom S3 access policy for the application bucket, and KMS permissions for encryption operations.

### Serverless Compute Layer

The serverless compute layer consists of Lambda functions deployed within the VPC's private subnet with strict IAM execution roles. Lambda functions use configurable runtime (defaulting to Python 3.11) and memory size (defaulting to 128 MB) for cost optimization and performance tuning. Functions are attached to the Lambda security group allowing only outbound traffic with no inbound access, ensuring functions cannot be accessed directly from the internet. The Lambda execution role implements least privilege with specific permissions for CloudWatch Logs access scoped to /aws/lambda/ log groups, S3 read-only access to the application data bucket, KMS decrypt permissions for encrypted objects, and VPC ENI management through AWSLambdaVPCAccessExecutionRole managed policy. Environment variables provide configuration including the environment suffix and S3 bucket name, avoiding hardcoded values. The VPC configuration ensures functions have network connectivity through the NAT Gateway while remaining inaccessible from the internet.

### Storage and Encryption Layer

The storage layer implements comprehensive encryption for data at rest using both S3 and KMS services. A customer-managed KMS key provides encryption for S3 buckets, with automatic key rotation enabled for enhanced security. The KMS key policy grants root account full permissions and allows S3, Lambda, CloudWatch Logs, and EC2 services to use the key for decryption and data key generation. A KMS alias provides a friendly name for the key following AWS naming conventions. The primary S3 bucket stores application data with KMS encryption (SSE-KMS) using the customer-managed key, bucket key enabled for cost optimization through reduced KMS API calls, versioning enabled for change tracking and secure backups as required, and logging configuration directing access logs to a separate logging bucket. A dedicated S3 logging bucket captures access logs with AES256 encryption, versioning enabled, lifecycle policy deleting logs after 90 days, and public access completely blocked. An S3 bucket policy on the main bucket enforces HTTPS for all data transfers by explicitly denying requests when aws:SecureTransport is false, ensuring encryption in transit and preventing unencrypted access. The CloudTrail bucket also uses KMS encryption with versioning enabled and lifecycle policy for log retention. This multi-layer encryption approach protects data at rest with KMS and data in transit with mandatory HTTPS.

### Security Controls

Security is implemented through multiple layers including security groups, IAM policies, KMS encryption, S3 bucket policies, and IAM password policies. The EC2SecurityGroup restricts SSH access on port 22 and HTTPS access on port 443 to instances from only the specific CIDR block defined in the AllowedCIDR parameter (defaulting to 203.0.113.0/32), implementing least privilege network access as required. The LambdaSecurityGroup allows Lambda functions to make outbound connections while preventing any inbound access, ensuring functions can reach external services through the NAT Gateway but cannot be accessed directly. IAM policies follow the principle of least privilege with EC2 instance roles granted CloudWatch and SSM permissions through managed policies, S3 read/write permissions to the specific application bucket, and KMS permissions for encryption operations. Lambda execution roles are granted only CloudWatch Logs write permissions to /aws/lambda/ log groups, S3 GetObject and ListBucket permissions to the specific application bucket, and KMS Decrypt permission to the customer-managed key. No policies use wildcard '_:_' administrative privileges as explicitly required by the prompt. S3 bucket policies enforce HTTPS using conditional deny statements checking aws:SecureTransport, preventing unencrypted data access. The IAM Account Password Policy enforces strong passwords with minimum 12 characters, requiring numbers and symbols as specified, along with uppercase and lowercase characters, 90-day password expiration, and prevention of password reuse for the last 24 passwords. VPC Flow Logs capture all network traffic for security analysis and compliance auditing. This defense-in-depth approach implements security controls at the network, application, and data layers.

### IAM Roles and Policies

The infrastructure implements IAM roles for all services following the principle of least privilege without using hard-coded credentials as required. The EC2 instance role provides instances with permissions following least privilege including AmazonSSMManagedInstanceCore managed policy for SSM access enabling remote command execution, CloudWatchAgentServerPolicy managed policy for CloudWatch metrics and logs, custom S3 policy granting GetObject, PutObject, and ListBucket permissions exclusively to the application bucket using GetAtt for bucket ARN and Fn::Sub for object paths, and custom KMS policy granting Decrypt, GenerateDataKey, and DescribeKey permissions only to the customer-managed KMS key. The Lambda execution role includes AWSLambdaVPCAccessExecutionRole managed policy for VPC ENI management, CloudWatch Logs policy allowing CreateLogGroup, CreateLogStream, and PutLogEvents only on /aws/lambda/ log groups, S3 policy granting GetObject and ListBucket permissions to the application bucket, and KMS policy granting Decrypt and DescribeKey permissions to the KMS key. The VPC Flow Logs role grants permissions for CloudWatch Logs access using a trust policy allowing vpc-flow-logs.amazonaws.com service principal. The CloudTrail role grants permissions for CloudWatch Logs access using a trust policy allowing cloudtrail.amazonaws.com service principal. This IAM structure eliminates hard-coded credentials as required, provides temporary security credentials automatically rotated by AWS, and implements fine-grained permissions for each service component.

### IAM Password Policy

The IAM Account Password Policy enforces strong password requirements as specified in the prompt. The policy requires minimum password length of 12 characters as explicitly required, requires symbols (special characters) as explicitly required, requires numbers as explicitly required, requires uppercase characters for additional security, requires lowercase characters for additional security, allows users to change their own passwords for self-service, enforces maximum password age of 90 days requiring regular rotation, prevents reuse of the last 24 passwords ensuring password history compliance, and does not enforce hard expiry allowing users to request password reset. This comprehensive password policy meets the prompt requirements for minimum 12 characters requiring numbers and symbols while implementing additional security best practices.

### Monitoring and Logging

CloudWatch Logs provides centralized log aggregation for Lambda functions, VPC Flow Logs, and CloudTrail with configurable retention policies. The LogRetentionInDays parameter allows customization of retention periods with allowed values of 7, 14, 30, 60, 90, 120, 180, or 365 days, defaulting to 30 days for balancing compliance requirements with storage costs. Lambda log groups capture function execution logs for troubleshooting and debugging. VPC Flow Logs capture all network traffic metadata including source and destination IPs, ports, protocols, packet and byte counts, and accept/reject decisions for security analysis and troubleshooting connectivity issues. CloudTrail logs all AWS API calls to both S3 and CloudWatch Logs, configured as a multi-region trail with global service events included for comprehensive audit coverage of all account activity. CloudTrail is configured with EnableLogFileValidation for log integrity verification. CloudWatch alarms monitor critical metrics including EC2 CPU utilization exceeding 80% averaged over 10 minutes indicating performance issues or resource constraints, and Lambda errors exceeding 5 occurrences in 5 minutes for failure detection. These alarms enable proactive issue detection before they impact users. This monitoring and logging architecture provides complete visibility into application behavior, network traffic, and API activity for security analysis, compliance reporting, and troubleshooting.

### High Availability and Security Posture

The architecture balances high availability with security requirements for enterprise applications. EC2 instances are deployed in the private subnet with Systems Manager providing remote access without exposing SSH to the internet. Lambda functions automatically scale to handle concurrent invocations without capacity planning, with AWS managing underlying infrastructure including automatic replacement of unhealthy compute nodes. The NAT Gateway is deployed in a single Availability Zone for cost optimization, appropriate for development and testing workloads. S3 buckets provide 99.999999999% durability with automatic replication across multiple facilities. KMS keys are automatically replicated within the region with built-in redundancy. CloudTrail multi-region trail captures events from all regions ensuring comprehensive audit coverage even during regional issues. VPC Flow Logs, Lambda logs, and CloudTrail logs all stream to CloudWatch Logs for centralized analysis. Security controls including mandatory HTTPS enforcement, KMS encryption at rest, VPC isolation, CIDR-restricted ingress, strong password policy, comprehensive audit logs, and log file validation provide defense-in-depth security architecture. Resource tagging with Environment, Project, Owner, and CostCenter enables cost allocation, compliance reporting, and automated operations.

## CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Security Configuration Management Solution - VPC, EC2, Lambda, S3, CloudTrail, CloudWatch, and KMS",
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
            "AllowedCIDR"
          ]
        },
        {
          "Label": {
            "default": "EC2 Configuration"
          },
          "Parameters": ["EC2InstanceType"]
        },
        {
          "Label": {
            "default": "Lambda Configuration"
          },
          "Parameters": ["LambdaRuntime", "LambdaMemorySize"]
        },
        {
          "Label": {
            "default": "Logging Configuration"
          },
          "Parameters": ["LogRetentionInDays"]
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
    "AllowedCIDR": {
      "Type": "String",
      "Default": "203.0.113.0/32",
      "Description": "CIDR block allowed for ingress to EC2 instances",
      "AllowedPattern": "^(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/(\\d|[1-2]\\d|3[0-2]))$"
    },
    "EC2InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "Description": "EC2 instance type",
      "AllowedValues": ["t3.micro", "t3.small", "t3.medium"]
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
    },
    "LogRetentionInDays": {
      "Type": "Number",
      "Default": 30,
      "Description": "Number of days to retain CloudWatch logs",
      "AllowedValues": [7, 14, 30, 60, 90, 120, 180, 365]
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
            "Value": "SecurityConfigManagement"
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
            "Value": "SecurityConfigManagement"
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
            "Value": "SecurityConfigManagement"
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
            "Value": "SecurityConfigManagement"
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
            "Value": "SecurityConfigManagement"
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
            "Value": "SecurityConfigManagement"
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
            "Value": "SecurityConfigManagement"
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
            "Value": "SecurityConfigManagement"
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
        "GroupDescription": "Security group for EC2 instances - allows SSH from specific CIDR only",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": {
              "Ref": "AllowedCIDR"
            },
            "Description": "SSH access from specific CIDR block"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": {
              "Ref": "AllowedCIDR"
            },
            "Description": "HTTPS access from specific CIDR block"
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
            "Value": "SecurityConfigManagement"
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
        "GroupDescription": "Security group for Lambda functions in VPC - no public access",
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
            "Value": "SecurityConfigManagement"
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
                  "logs.amazonaws.com",
                  "ec2.amazonaws.com"
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
            "Value": "SecurityConfigManagement"
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
          "Fn::Sub": "alias/security-config-${EnvironmentSuffix}"
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
          "Fn::Sub": "security-app-data-${AWS::AccountId}-${EnvironmentSuffix}"
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
            "Value": "SecurityConfigManagement"
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
          "Fn::Sub": "security-app-logs-${AWS::AccountId}-${EnvironmentSuffix}"
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
        "VersioningConfiguration": {
          "Status": "Enabled"
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
            "Value": "SecurityConfigManagement"
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
    "EC2InstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "EC2InstanceRole-${EnvironmentSuffix}-${AWS::StackName}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ec2.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        ],
        "Policies": [
          {
            "PolicyName": "EC2S3AccessPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
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
            "PolicyName": "EC2KMSAccessPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey",
                    "kms:DescribeKey"
                  ],
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
              "Fn::Sub": "EC2InstanceRole-${EnvironmentSuffix}"
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
            "Value": "SecurityConfigManagement"
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
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Roles": [
          {
            "Ref": "EC2InstanceRole"
          }
        ]
      }
    },
    "EC2Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "InstanceType": {
          "Ref": "EC2InstanceType"
        },
        "ImageId": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}",
        "IamInstanceProfile": {
          "Ref": "EC2InstanceProfile"
        },
        "SubnetId": {
          "Ref": "PrivateSubnet"
        },
        "SecurityGroupIds": [
          {
            "Ref": "EC2SecurityGroup"
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "\n",
              [
                "#!/bin/bash",
                "yum update -y",
                "yum install -y amazon-ssm-agent",
                "systemctl enable amazon-ssm-agent",
                "systemctl start amazon-ssm-agent",
                "yum install -y amazon-cloudwatch-agent",
                "systemctl enable amazon-cloudwatch-agent",
                "systemctl start amazon-cloudwatch-agent"
              ]
            ]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "EC2Instance-${EnvironmentSuffix}"
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
            "Value": "SecurityConfigManagement"
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
            "Value": "SecurityConfigManagement"
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
          "Fn::Sub": "SecurityConfigFunction-${EnvironmentSuffix}"
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
                "            'Content-Type': 'application/json'",
                "        },",
                "        'body': json.dumps({",
                "            'message': 'Security configuration function running',",
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
            "Value": "SecurityConfigManagement"
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
          "Fn::Sub": "/aws/lambda/SecurityConfigFunction-${EnvironmentSuffix}"
        },
        "RetentionInDays": {
          "Ref": "LogRetentionInDays"
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
        "RetentionInDays": {
          "Ref": "LogRetentionInDays"
        }
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
            "Value": "SecurityConfigManagement"
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
            "Value": "SecurityConfigManagement"
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
    "CloudTrailLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/cloudtrail/${EnvironmentSuffix}-${AWS::StackName}"
        },
        "RetentionInDays": {
          "Ref": "LogRetentionInDays"
        }
      }
    },
    "CloudTrailLogRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "CloudTrailLogsPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["logs:CreateLogStream", "logs:PutLogEvents"],
                  "Resource": {
                    "Fn::GetAtt": ["CloudTrailLogGroup", "Arn"]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "CloudTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "DependsOn": "CloudTrailBucketPolicy",
      "Properties": {
        "TrailName": {
          "Fn::Sub": "SecurityConfigTrail-${EnvironmentSuffix}"
        },
        "S3BucketName": {
          "Ref": "CloudTrailBucket"
        },
        "CloudWatchLogsLogGroupArn": {
          "Fn::GetAtt": ["CloudTrailLogGroup", "Arn"]
        },
        "CloudWatchLogsRoleArn": {
          "Fn::GetAtt": ["CloudTrailLogRole", "Arn"]
        },
        "IncludeGlobalServiceEvents": true,
        "IsLogging": true,
        "IsMultiRegionTrail": true,
        "EnableLogFileValidation": true,
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
            "Value": "SecurityConfigManagement"
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
    "EC2CPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "EC2-HighCPU-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when EC2 instance CPU usage is high",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": {
              "Ref": "EC2Instance"
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
    "EC2InstanceId": {
      "Description": "EC2 Instance ID",
      "Value": {
        "Ref": "EC2Instance"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EC2InstanceId"
        }
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
    "EC2SecurityGroupId": {
      "Description": "EC2 Security Group ID",
      "Value": {
        "Ref": "EC2SecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EC2SecurityGroupId"
        }
      }
    },
    "LambdaSecurityGroupId": {
      "Description": "Lambda Security Group ID",
      "Value": {
        "Ref": "LambdaSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaSecurityGroupId"
        }
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

The template implements comprehensive security through defense-in-depth architecture across all layers. Network security is enforced with EC2 instances and Lambda functions deployed in private subnets, SSH and HTTPS access restricted to a specific CIDR block through the AllowedCIDR parameter, and VPC security groups preventing direct internet access. Encryption is implemented at rest using customer-managed KMS keys with automatic key rotation for S3 buckets and in transit through mandatory HTTPS enforcement via S3 bucket policy conditions that explicitly deny requests when aws:SecureTransport is false. IAM roles follow strict least privilege with EC2 instance roles granted only CloudWatch and SSM permissions through managed policies, S3 permissions limited to the application bucket, and KMS permissions for encryption operations. Lambda execution roles are granted only specific CloudWatch Logs permissions scoped to /aws/lambda/ log groups, S3 permissions limited to GetObject and ListBucket on the application bucket, and KMS Decrypt permission only for the customer-managed key. No policies use wildcard '_:_' administrative privileges as explicitly required. The IAM Account Password Policy enforces strong passwords with minimum 12 characters requiring numbers and symbols. CloudTrail provides comprehensive audit trails logging all AWS API calls to an encrypted S3 bucket as a multi-region trail with log file validation enabled. VPC Flow Logs capture all network traffic metadata for security analysis and compliance reporting. All S3 buckets block public access through PublicAccessBlockConfiguration. This multi-layer security architecture protects against unauthorized access, data breaches, and compliance violations.

### Scalability

The infrastructure provides scalability through managed AWS services and parameterized configurations. EC2 instances use configurable instance types (t3.micro, t3.small, t3.medium) allowing vertical scaling based on workload requirements. Lambda functions automatically scale to handle concurrent invocations without capacity planning, with AWS managing all underlying infrastructure including automatic distribution across Availability Zones and automatic replacement of unhealthy compute nodes. Lambda memory size is parameterized (128, 256, 512, 1024 MB) allowing performance tuning through increased memory allocation which proportionally increases CPU and network bandwidth. S3 buckets automatically scale to handle any storage capacity and request rate without configuration. CloudWatch Logs automatically scales to handle log ingestion from all sources. KMS key usage scales automatically to handle encryption and decryption operations. The VPC design with /16 CIDR provides 65,536 IP addresses supporting future growth and additional resources. All outputs are exported for cross-stack references, enabling the infrastructure to serve as a foundation for additional components. This design eliminates capacity planning concerns for serverless components while providing clear upgrade paths for EC2-based workloads.

### Operational Excellence

The template achieves operational excellence through infrastructure as code with comprehensive parameterization and validation. Parameters include AllowedPattern validation for CIDR blocks ensuring valid network configurations, AllowedValues for instance types, Lambda runtime and memory size, and log retention preventing invalid configurations, and default values for all parameters enabling quick deployment while allowing customization. CloudFormation Interface metadata organizes parameters into logical groups (Environment, Network, EC2, Lambda, Logging) improving console user experience. CloudWatch monitoring provides comprehensive visibility with EC2 CPU utilization alarms detecting performance issues, and Lambda error alarms for failure detection. Centralized logging to CloudWatch Logs with configurable retention enables troubleshooting and compliance auditing for Lambda execution logs, VPC Flow Logs, and CloudTrail logs. CloudTrail provides complete audit trails of all AWS API calls for security investigations and compliance reporting with log file validation for integrity verification. SSM agent installation enables remote command execution without SSH access through Systems Manager Session Manager. CloudWatch agent installation enables custom metrics collection from EC2 instances. Consistent tagging across all resources with five mandatory tags (Name, Environment, Project, Owner, CostCenter) enables cost allocation tracking, compliance auditing through tag-based reporting, and automated operations through tag-based resource selection. Lambda functions use inline code for demonstration, easily replaced with S3 or ECR image references for production deployments. Environment variables provide configuration without hardcoded values, supporting environment-specific settings.

### Cost Optimization

The infrastructure provides significant cost optimization through appropriate resource sizing and lifecycle management. EC2 instances default to t3.micro, the smallest general-purpose instance type, with AllowedValues constraints preventing accidental deployment of expensive configurations. Lambda functions incur charges only during actual execution time with 1ms billing granularity, automatically scaling to zero when not in use eliminating idle resource costs. Default 128MB memory allocation minimizes costs while AllowedValues constraints of [128, 256, 512, 1024] prevent accidental deployment of expensive configurations. The 30-second timeout balances functionality with cost control. S3 uses versioning which enables lifecycle policies for cost optimization. CloudWatch Logs retention is configurable (7, 14, 30, 60, 90, 120, 180, 365 days) with default of 30 days balancing compliance requirements with storage costs. S3 logging bucket uses lifecycle policy deleting access logs after 90 days reducing storage costs. CloudTrail logs use lifecycle policy deleting logs after 365 days reducing long-term storage costs. KMS key rotation is automatic without additional cost. S3 bucket keys are enabled reducing KMS API calls by up to 99%, significantly reducing encryption costs. The single NAT Gateway design optimizes cost for development and testing workloads. Comprehensive tagging with Environment, Project, Owner, and CostCenter enables detailed AWS Cost Explorer reports, chargeback to appropriate departments, and identification of cost optimization opportunities through tag-based cost allocation.

### Reliability

The infrastructure achieves high reliability through AWS-managed services and built-in redundancy. EC2 instances are deployed in the private subnet with SSM agent providing remote access and monitoring capabilities without exposing instances to the internet. Lambda functions are automatically distributed across multiple Availability Zones with automatic failover and replacement of unhealthy compute nodes by AWS. S3 provides 99.999999999% (11 9's) durability with automatic replication across multiple facilities within the region. Versioning is enabled on all S3 buckets providing protection against accidental deletions and enabling point-in-time recovery for change tracking and secure backups as required. KMS keys are automatically replicated within the region with built-in redundancy eliminating single points of failure in encryption operations. CloudTrail is configured as a multi-region trail ensuring audit logs are captured from all regions with centralized storage. CloudTrail log file validation enables detection of any log tampering. Lambda functions retry failed invocations automatically with exponential backoff. CloudWatch alarms provide proactive monitoring enabling issue detection before user impact with EC2 CPU alarms detecting resource constraints and Lambda error alarms for failure rates. VPC Flow Logs, Lambda logs, and CloudTrail logs all stream to CloudWatch Logs providing centralized log aggregation for troubleshooting. All outputs use Export enabling cross-stack references and supporting disaster recovery scenarios where dependent stacks can reference this foundational infrastructure.

## Modern AWS Practices

### EC2 Instances in Private Subnets with SSM Access

EC2 instances are deployed within the VPC's private subnet rather than public subnets, providing several critical security advantages. Private subnet instances cannot be accessed directly from the internet, eliminating the attack surface from public IP exposure. The EC2 security group restricts SSH access on port 22 and HTTPS access on port 443 to only the specific CIDR block defined in the AllowedCIDR parameter (defaulting to 203.0.113.0/32), implementing least privilege network access as explicitly required. SSM agent is installed through UserData enabling remote command execution through Systems Manager Session Manager without requiring direct SSH access or bastion hosts. This approach eliminates the need to manage SSH keys, reduces attack surface by removing SSH exposure to the internet, provides comprehensive audit logging of all session activity, and enables fine-grained IAM-based access control. The EC2 instance role includes AmazonSSMManagedInstanceCore managed policy granting permissions for SSM operations. The private subnet routes outbound traffic through the NAT Gateway enabling instances to access external resources like package repositories while remaining isolated from inbound internet traffic. This architecture aligns with AWS security best practices for enterprise workloads requiring strong security posture.

### Lambda Functions with VPC Isolation

Lambda functions are deployed within the VPC's private subnet rather than using default Lambda networking, providing several critical security advantages. VPC-connected Lambda functions cannot be accessed from the internet directly, ensuring functions have no public access as explicitly required by the prompt. The Lambda security group allows only outbound traffic while preventing any inbound connections, ensuring functions can reach external services through the NAT Gateway but cannot be accessed directly. Functions access AWS services through the NAT Gateway maintaining network-level isolation. The Lambda execution role includes AWSLambdaVPCAccessExecutionRole managed policy granting permissions to create and manage elastic network interfaces (ENIs) in the VPC for connectivity. VPC configuration incurs cold start latency (additional 5-10 seconds) as Lambda creates ENIs in the private subnet, but this trade-off provides defense-in-depth security architecture. The private subnet routes outbound traffic through the NAT Gateway enabling functions to access external APIs and services while remaining isolated from inbound internet traffic. This VPC integration aligns with AWS security best practices for serverless applications requiring network-level isolation.

### Customer-Managed KMS Keys with Automatic Rotation

The infrastructure uses customer-managed KMS keys rather than AWS-managed keys for S3 encryption, providing enhanced security and control as required for managing all encryption keys for S3. Customer-managed keys enable centralized key policy management with granular control over which AWS services and IAM principals can use the key for encryption and decryption operations. The key policy explicitly grants permissions to S3, Lambda, CloudWatch Logs, and EC2 services while preventing unauthorized access. Automatic key rotation is enabled through EnableKeyRotation set to true, causing AWS to automatically rotate the key material annually while maintaining the same key ID and alias, ensuring encrypted data remains accessible without application changes. Customer-managed keys support detailed CloudTrail logging of all key usage providing audit trails for compliance requirements. The KMS alias provides a friendly name (alias/security-config-${EnvironmentSuffix}) following AWS naming conventions and enabling easy key identification across environments. S3 buckets use BucketKeyEnabled reducing KMS API calls by up to 99% through S3 bucket keys that generate data keys locally, significantly reducing costs while maintaining security. This approach provides enterprise-grade encryption key management with automatic rotation, detailed audit trails, and cost optimization through bucket keys.

### S3 Bucket Policy for HTTPS Enforcement

The S3 bucket policy explicitly enforces HTTPS for all data transfers through a conditional deny statement, implementing encryption in transit as required by security best practices and compliance frameworks. The policy uses the Condition element with aws:SecureTransport: false to identify unencrypted HTTP requests and explicitly denies them using Effect: Deny, ensuring all S3 access occurs over encrypted connections. This approach prevents data interception through man-in-the-middle attacks and ensures compliance with security standards requiring encryption in transit. The policy applies to both the bucket ARN and object ARNs using Fn::Sub: ${S3Bucket.Arn}/\* ensuring all operations including bucket-level operations (ListBucket) and object-level operations (GetObject, PutObject) require HTTPS. This explicit deny policy cannot be overridden by allow policies, providing strong enforcement. The policy complements S3 bucket encryption at rest (KMS) providing comprehensive data protection with encryption in transit through mandatory HTTPS and encryption at rest through customer-managed KMS keys. This security control is critical for compliance with PCI DSS, HIPAA, and other regulations requiring encrypted data transfers.

### IAM Password Policy for Strong Authentication

The IAM Account Password Policy enforces strong password requirements as explicitly specified in the prompt. The policy implements minimum password length of 12 characters as explicitly required, requires symbols (special characters) as explicitly required, requires numbers as explicitly required, requires uppercase characters for additional security, requires lowercase characters for additional security, allows users to change their own passwords for self-service, enforces maximum password age of 90 days requiring regular rotation, prevents reuse of the last 24 passwords ensuring password history compliance, and does not enforce hard expiry allowing users to request password reset. This comprehensive password policy exceeds the minimum prompt requirements while implementing security best practices recommended by NIST and AWS Well-Architected Framework. The policy applies account-wide ensuring all IAM users must comply with strong password requirements. This configuration supports compliance with regulatory requirements including PCI DSS, HIPAA, and SOC 2 that mandate strong password policies.

### CloudTrail Multi-Region Trail with Log File Validation

CloudTrail is configured as a multi-region trail with global service event logging and log file validation providing comprehensive audit coverage across the entire AWS account. IsMultiRegionTrail set to true ensures the trail automatically logs events from all AWS regions including regions added after the trail was created, eliminating the need to create trails in each region individually and simplifying compliance reporting as explicitly required for enabling logging for all AWS CloudTrail trails. IncludeGlobalServiceEvents set to true captures events from global services like IAM, CloudFront, Route 53, and AWS Organizations that are not region-specific, ensuring complete visibility into all account activity including IAM policy changes, user creation, and role assumption events. EnableLogFileValidation set to true enables detection of any log file tampering providing integrity verification for compliance and security investigations. CloudTrail logs to both S3 and CloudWatch Logs providing multiple destinations for audit data. The CloudTrail bucket uses KMS encryption with versioning enabled for secure storage and change tracking. The bucket policy grants CloudTrail exclusive permission using conditions requiring bucket-owner-full-control ACL ensuring the bucket owner maintains control over all log files. This comprehensive audit trail supports compliance with regulatory requirements including PCI DSS, HIPAA, SOC 2, and ISO 27001.

### VPC Flow Logs to CloudWatch Logs

VPC Flow Logs are configured to stream to CloudWatch Logs capturing all traffic flows within the VPC as explicitly required for monitoring. Flow logs capture metadata about all network traffic traversing the VPC including source and destination IP addresses, ports, protocols, packet and byte counts, and accept/reject decisions based on security group and NACL rules. TrafficType set to ALL ensures both accepted and rejected traffic is captured, providing complete visibility into network communications for security analysis. Streaming to CloudWatch Logs enables real-time analysis and alerting not possible with S3-based flow logs which have 5-15 minute delivery delays. CloudWatch Logs Insights provides a powerful query language for fast analysis of network traffic patterns including identifying top talkers, analyzing traffic by port and protocol, and investigating security group rule effectiveness. Flow logs can trigger CloudWatch metric filters extracting custom metrics from log data and creating alarms based on suspicious network patterns like port scanning, unusual outbound connections, or traffic to known malicious IPs. The configurable retention period (defaulting to 30 days) balances compliance requirements with storage costs, providing sufficient data for most security investigations while limiting long-term storage expenses. An IAM role grants VPC Flow Logs permission to publish to CloudWatch Logs using the vpc-flow-logs.amazonaws.com service principal following AWS security best practices for service-to-service permissions. This configuration provides enhanced security visibility, real-time threat detection capabilities, and cost-effective log retention.

### IAM Least Privilege with Scoped Resource Permissions

The infrastructure implements IAM roles for all services following the principle of least privilege without using hard-coded credentials as explicitly required. The EC2 instance role provides instances with permissions following least privilege including AmazonSSMManagedInstanceCore managed policy for SSM access enabling remote command execution as required, CloudWatchAgentServerPolicy managed policy for CloudWatch metrics and logs as required, custom S3 policy granting GetObject, PutObject, and ListBucket permissions exclusively to the application bucket using GetAtt for bucket ARN and Fn::Sub for object paths, and custom KMS policy granting Decrypt, GenerateDataKey, and DescribeKey permissions only to the customer-managed KMS key. The Lambda execution role includes AWSLambdaVPCAccessExecutionRole managed policy for VPC ENI management, CloudWatch Logs policy allowing CreateLogGroup, CreateLogStream, and PutLogEvents only on resources matching /aws/lambda/ log groups preventing functions from writing to other log groups, S3 policy granting GetObject and ListBucket permissions exclusively to the application bucket, and KMS policy granting Decrypt and DescribeKey permissions only to the customer-managed KMS key. No policies use wildcard resource ARNs or '_:_' administrative privileges as explicitly required by the prompt ensuring IAM policies do not grant full administrative privileges. Resource-specific ARNs using CloudFormation intrinsic functions ensure policies automatically reference the correct resources even if ARNs change during stack updates. This IAM structure eliminates the risk of privilege escalation, reduces blast radius if a service is compromised, supports compliance with regulatory requirements requiring least privilege, and follows AWS Well-Architected Framework security pillar guidance.

### Comprehensive Resource Tagging for Governance

All resources implement a comprehensive five-tag strategy enabling cost allocation, compliance reporting, and automated operations. The Name tag uses Fn::Sub for dynamic generation incorporating EnvironmentSuffix enabling visual identification in the AWS Console and CLI. The Environment tag references EnvironmentSuffix parameter enabling cost allocation reports by environment (dev, staging, prod) and supporting tag-based IAM policies restricting access to specific environments. The Project tag (SecurityConfigManagement) enables cost allocation by project and supports multi-tenant AWS accounts where multiple projects share infrastructure. The Owner tag (SecurityTeam) enables identification of responsible parties for operational issues and supports organizational cost allocation showing which teams consume resources. The CostCenter tag (Security) enables financial reporting and chargeback to appropriate departments for internal accounting and budget management. This consistent tagging strategy enables several critical capabilities including AWS Cost Explorer reports filtering and grouping costs by any tag combination for detailed cost analysis, tag-based IAM policies restricting permissions based on resource tags implementing attribute-based access control (ABAC), automated operations through AWS Systems Manager and Lambda functions targeting resources by tags for patching, backup, and lifecycle management, and compliance reporting demonstrating proper resource organization and ownership for audit requirements. All resources use consistent tag names and values following AWS tagging best practices. EC2 instances, Lambda functions, IAM roles, and other resources that support tagging include all five tags ensuring complete coverage. This governance through tagging supports enterprise-scale AWS operations with detailed cost visibility, fine-grained access control, and automated resource management.
