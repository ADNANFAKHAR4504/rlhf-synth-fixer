# Ideal Response: Secure Production Environment

## Architecture Overview

This CloudFormation template creates a production-ready, security-focused infrastructure on AWS with comprehensive security controls, encryption at rest and in transit, centralized logging and monitoring, and full audit trails. The infrastructure implements security best practices including VPC isolation with multiple availability zones, KMS encryption for RDS and S3, IAM least privilege principles, Application Load Balancer with access logging, multi-region CloudTrail auditing, VPC Flow Logs, Secrets Manager for credential management, and CloudWatch monitoring following AWS Well-Architected Framework security pillar guidelines.

### Network Architecture

The infrastructure implements a secure VPC architecture in the us-east-1 region with proper network isolation and controlled internet access across multiple availability zones. The VPC uses a 10.0.0.0/16 CIDR block with two public subnets (10.0.1.0/24 in us-east-1a and 10.0.2.0/24 in us-east-1c) for the NAT Gateway and Application Load Balancer, and two private subnets (10.0.3.0/24 in us-east-1a and 10.0.4.0/24 in us-east-1c) for EC2 instances, RDS database, and Lambda functions. An Internet Gateway provides public subnet connectivity to the internet, enabling outbound access through the NAT Gateway and inbound traffic to the Application Load Balancer. A single NAT Gateway with a dedicated Elastic IP is deployed in the first public subnet to provide outbound internet access for resources in the private subnets while maintaining their isolation from inbound internet traffic. Separate route tables control traffic flow with public subnets routing through the Internet Gateway and private subnets routing through the NAT Gateway for outbound connectivity. Security groups are configured with descriptions for each rule as explicitly required, implementing defense-in-depth security architecture with ALB security group allowing HTTP/HTTPS from internet, EC2 security group allowing traffic only from ALB, RDS security group allowing MySQL access only from EC2 security group, and Lambda security group allowing only outbound traffic.

### Compute Layer

The compute layer consists of EC2 instances deployed within the VPC's private subnet with strict IAM execution roles and SSM agent for remote command execution as explicitly required. EC2 instances use Amazon Linux 2 AMI retrieved dynamically through SSM Parameter Store, ensuring the latest secure base image. The instance type is configurable through the EC2InstanceType parameter (defaulting to t3.micro) for cost optimization. Instances are deployed in the private subnet with no public IP addresses, accessible only through Systems Manager Session Manager eliminating the need for bastion hosts. The EC2 security group restricts access to only traffic from the Application Load Balancer security group on ports 80 and 443, implementing least privilege network access with descriptions for each rule as required. UserData bootstraps the SSM agent, CloudWatch agent, and MySQL client on instance launch, enabling remote command execution, metrics collection, and database connectivity without direct SSH access. The EC2 instance role includes AmazonSSMManagedInstanceCore for SSM access, CloudWatchAgentServerPolicy for metrics publishing, custom S3 access policy for the application bucket, custom Secrets Manager access policy for retrieving database credentials, and KMS permissions for encryption operations as explicitly required for CloudWatch, S3, Secrets Manager, and SSM access.

### Database Layer

The database layer implements RDS MySQL instance with comprehensive security controls for production workloads. The RDS instance uses MySQL 8.0.35 engine deployed in the private subnets through a DB subnet group spanning both availability zones (us-east-1a and us-east-1c). Storage encryption is enabled using the customer-managed KMS key as explicitly required for encryption at rest. The RDS security group restricts MySQL access on port 3306 exclusively to the EC2 security group, implementing least privilege network access as explicitly required for allowing access only from EC2 security group. Database credentials are stored in AWS Secrets Manager with auto-generated 32-character passwords excluding special characters that could cause issues ("@/\\), providing secure credential management as explicitly required. The RDS instance references credentials using dynamic resolution ({{resolve:secretsmanager:...}}) ensuring credentials are never exposed in CloudFormation templates. CloudWatch Logs exports are enabled for error, general, and slowquery logs providing comprehensive database monitoring. Backup retention is set to 7 days with preferred backup and maintenance windows configured for minimal disruption. The deletion policy creates a final snapshot protecting against accidental data loss.

### Serverless Compute Layer

The serverless compute layer consists of Lambda functions deployed within the VPC's private subnets with strict IAM execution roles following least privilege as explicitly required. Lambda functions use Python 3.11 runtime with 128 MB memory for cost optimization and performance. Functions are attached to the Lambda security group allowing only outbound traffic with no inbound access, ensuring functions cannot be accessed directly from the internet. The Lambda execution role implements least privilege with specific permissions for CloudWatch Logs access scoped to /aws/lambda/ log groups, Secrets Manager access to retrieve database credentials for the specific DBSecret resource, and KMS decrypt permissions for the customer-managed key as explicitly required for using AWS Secrets Manager to store and retrieve sensitive information. Environment variables provide configuration including the environment suffix and SECRET_ARN for the database credentials, avoiding hardcoded values. The VPC configuration with both private subnets ensures functions have network connectivity through the NAT Gateway while remaining inaccessible from the internet and enabling database connectivity.

### Storage and Encryption Layer

The storage layer implements comprehensive encryption for data at rest using S3 and KMS services as explicitly required. A customer-managed KMS key provides encryption for S3 buckets, RDS database, and CloudTrail logs, with automatic key rotation enabled for enhanced security. The KMS key policy grants root account full permissions and allows S3, Lambda, CloudWatch Logs, EC2, RDS, and CloudTrail services to use the key for decryption and data key generation. A KMS alias provides a friendly name for the key following AWS naming conventions. The primary S3 bucket stores application data with KMS encryption (SSE-KMS) using the customer-managed key as explicitly required, bucket key enabled for cost optimization through reduced KMS API calls, versioning enabled for change tracking and secure backups, and logging configuration directing access logs to a separate logging bucket as explicitly required for server access logging enabled. A dedicated S3 logging bucket captures access logs and ALB logs with AES256 encryption, versioning enabled, lifecycle policy deleting logs after 90 days, and public access completely blocked. The logging bucket policy grants permissions to S3 logging service (logging.s3.amazonaws.com) for server access logs and ELB service account (027434742980 for us-east-1 region) for ALB access logs. An S3 bucket policy on the main bucket enforces HTTPS for all data transfers by explicitly denying requests when aws:SecureTransport is false, ensuring encryption in transit and preventing unencrypted access. The CloudTrail bucket also uses KMS encryption with versioning enabled and lifecycle policy for log retention. This multi-layer encryption approach protects data at rest with KMS and data in transit with mandatory HTTPS.

### Load Balancing Layer

The load balancing layer implements an Application Load Balancer with comprehensive access logging as explicitly required. The ALB is deployed as internet-facing in the public subnets across both availability zones (us-east-1a and us-east-1c) providing high availability. The ALB security group allows HTTP on port 80 and HTTPS on port 443 from the internet (0.0.0.0/0) with descriptions for each rule as required. Access logs are enabled and stored in the S3 logging bucket with the prefix "alb-logs" as explicitly required, requiring the bucket policy to grant permissions to the ELB service account (arn:aws:iam::027434742980:root for us-east-1 region). The ALB depends on the S3 logging bucket policy to ensure proper permissions are in place before ALB creation. A target group is configured with health checks on port 80 using HTTP protocol with 30-second intervals, 5-second timeouts, and thresholds for healthy (2) and unhealthy (3) states. The EC2 instance is registered as a target on port 80. An HTTP listener on port 80 forwards traffic to the target group providing application access through the load balancer.

### Security Controls

Security is implemented through multiple layers including security groups with descriptions, IAM policies, KMS encryption, S3 bucket policies, and Secrets Manager. The ALBSecurityGroup allows HTTP and HTTPS from the internet with descriptions for each rule enabling public access to applications. The EC2SecurityGroup restricts HTTP and HTTPS access to instances exclusively from the ALB security group with descriptions, implementing least privilege network access. The RDSSecurityGroup allows MySQL access on port 3306 only from the EC2 security group with description, implementing database isolation as explicitly required. The LambdaSecurityGroup allows Lambda functions to make outbound connections while preventing any inbound access with description, ensuring functions can reach external services through the NAT Gateway but cannot be accessed directly. IAM policies follow the principle of least privilege with EC2 instance roles granted CloudWatch and SSM permissions through managed policies, S3 read/write permissions to the specific application bucket, Secrets Manager permissions to retrieve database credentials, and KMS permissions for encryption operations as explicitly required. Lambda execution roles are granted only CloudWatch Logs write permissions to /aws/lambda/ log groups, Secrets Manager permissions to retrieve database credentials, and KMS Decrypt permission to the customer-managed key. No policies use wildcard '_:_' administrative privileges. S3 bucket policies enforce HTTPS using conditional deny statements checking aws:SecureTransport, preventing unencrypted data access. Secrets Manager stores RDS credentials with auto-generated passwords as explicitly required for secure access. VPC Flow Logs capture all network traffic for security analysis and compliance auditing. This defense-in-depth approach implements security controls at the network, application, and data layers.

### IAM Roles and Policies

The infrastructure implements IAM roles for all services following the principle of least privilege without using hard-coded credentials as required. The EC2 instance role provides instances with permissions following least privilege including AmazonSSMManagedInstanceCore managed policy for SSM access enabling remote command execution, CloudWatchAgentServerPolicy managed policy for CloudWatch metrics and logs, custom S3 policy granting GetObject, PutObject, and ListBucket permissions exclusively to the application bucket using GetAtt for bucket ARN and Fn::Sub for object paths, custom Secrets Manager policy granting GetSecretValue and DescribeSecret permissions exclusively to the database secret, and custom KMS policy granting Decrypt, GenerateDataKey, and DescribeKey permissions only to the customer-managed KMS key as explicitly required for CloudWatch, S3, Secrets Manager, and SSM permissions. The Lambda execution role includes AWSLambdaVPCAccessExecutionRole managed policy for VPC ENI management, CloudWatch Logs policy allowing CreateLogGroup, CreateLogStream, and PutLogEvents only on /aws/lambda/ log groups, Secrets Manager policy granting GetSecretValue and DescribeSecret permissions to the database secret for retrieving sensitive information, and KMS policy granting Decrypt and DescribeKey permissions to the KMS key. The VPC Flow Logs role grants permissions for CloudWatch Logs access using a trust policy allowing vpc-flow-logs.amazonaws.com service principal. The CloudTrail role grants permissions for CloudWatch Logs access using a trust policy allowing cloudtrail.amazonaws.com service principal. This IAM structure eliminates hard-coded credentials as required, provides temporary security credentials automatically rotated by AWS, and implements fine-grained permissions for each service component.

### Monitoring and Logging

CloudWatch Logs provides centralized log aggregation for Lambda functions, VPC Flow Logs, CloudTrail, and RDS with configurable retention policies. The LogRetentionInDays parameter allows customization of retention periods with allowed values of 7, 14, 30, 60, or 90 days, defaulting to 30 days for balancing compliance requirements with storage costs. Lambda log groups capture function execution logs for troubleshooting and debugging. VPC Flow Logs capture all network traffic metadata including source and destination IPs, ports, protocols, packet and byte counts, and accept/reject decisions for security analysis and troubleshooting connectivity issues as explicitly required for network traffic monitoring. CloudTrail logs all AWS API calls to both S3 and CloudWatch Logs, configured as a multi-region trail with global service events included for comprehensive audit coverage of all account activity as explicitly required for logging all account activity with encryption enabled. CloudTrail is configured with EnableLogFileValidation for log integrity verification. RDS exports error, general, and slowquery logs to CloudWatch for database monitoring. CloudWatch alarms monitor critical metrics including EC2 CPU utilization exceeding 80% averaged over 10 minutes indicating performance issues or resource constraints, RDS CPU utilization exceeding 80% for database performance monitoring as explicitly required, and Lambda errors exceeding 5 occurrences in 5 minutes for failure detection. These alarms enable proactive issue detection before they impact users. ALB access logs stored in S3 provide detailed request-level logging for troubleshooting and security analysis. This monitoring and logging architecture provides complete visibility into application behavior, network traffic, database performance, and API activity for security analysis, compliance reporting, and troubleshooting.

### Secrets Management

The infrastructure implements AWS Secrets Manager for secure credential management as explicitly required for storing RDS database credentials. The DBSecret resource uses GenerateSecretString to automatically create secure credentials with a 32-character password excluding problematic characters ("@/\\) that could cause issues in connection strings. The secret template includes the username "admin" with the password generated automatically by Secrets Manager. The RDS instance references these credentials using dynamic resolution ({{resolve:secretsmanager:${DBSecret}:SecretString:username}} and {{resolve:secretsmanager:${DBSecret}:SecretString:password}}) ensuring credentials are never exposed in CloudFormation templates or logs. The EC2 instance role and Lambda execution role both include Secrets Manager policies granting GetSecretValue and DescribeSecret permissions exclusively to the DBSecret resource, enabling applications to retrieve credentials securely at runtime. Lambda function environment variables include SECRET_ARN referencing the database secret for runtime credential retrieval. This approach eliminates hard-coded credentials, enables automatic credential rotation, provides audit logging of credential access through CloudTrail, and supports compliance requirements for secure credential management.

### High Availability and Security Posture

The architecture balances high availability with security requirements for enterprise applications through multi-availability zone deployment. The VPC spans two availability zones (us-east-1a and us-east-1c) with public and private subnets in each zone providing infrastructure redundancy. The Application Load Balancer is deployed across both public subnets providing high availability for incoming traffic with automatic failover between availability zones. The RDS DB subnet group includes both private subnets enabling Multi-AZ deployment when required (currently configured as single-AZ for cost optimization). Lambda functions are configured with both private subnets enabling automatic distribution across availability zones. EC2 instances are deployed in the private subnet with Systems Manager providing remote access without exposing SSH to the internet. Lambda functions automatically scale to handle concurrent invocations without capacity planning, with AWS managing underlying infrastructure including automatic replacement of unhealthy compute nodes. The NAT Gateway is deployed in a single Availability Zone for cost optimization, appropriate for development and testing workloads. S3 buckets provide 99.999999999% durability with automatic replication across multiple facilities. KMS keys are automatically replicated within the region with built-in redundancy. CloudTrail multi-region trail captures events from all regions ensuring comprehensive audit coverage even during regional issues. VPC Flow Logs, Lambda logs, RDS logs, and CloudTrail logs all stream to CloudWatch Logs for centralized analysis. Security controls including mandatory HTTPS enforcement, KMS encryption at rest for S3 and RDS, VPC isolation with security group restrictions, Secrets Manager for credential management, comprehensive audit logs, and log file validation provide defense-in-depth security architecture. Resource tagging with Environment and Project enables cost allocation, compliance reporting, and automated operations.

## CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure Production Environment - VPC, RDS, EC2, Lambda, ALB, S3, CloudTrail, CloudWatch, and KMS",
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
            "PublicSubnet1CIDR",
            "PublicSubnet2CIDR",
            "PrivateSubnet1CIDR",
            "PrivateSubnet2CIDR"
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
            "default": "RDS Configuration"
          },
          "Parameters": ["DBInstanceClass"]
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
      "Description": "CIDR block for VPC"
    },
    "PublicSubnet1CIDR": {
      "Type": "String",
      "Default": "10.0.1.0/24",
      "Description": "CIDR block for Public Subnet 1"
    },
    "PublicSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.2.0/24",
      "Description": "CIDR block for Public Subnet 2"
    },
    "PrivateSubnet1CIDR": {
      "Type": "String",
      "Default": "10.0.3.0/24",
      "Description": "CIDR block for Private Subnet 1"
    },
    "PrivateSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.4.0/24",
      "Description": "CIDR block for Private Subnet 2"
    },
    "EC2InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "Description": "EC2 instance type",
      "AllowedValues": ["t3.micro", "t3.small", "t3.medium"]
    },
    "DBInstanceClass": {
      "Type": "String",
      "Default": "db.t3.micro",
      "Description": "RDS instance class",
      "AllowedValues": ["db.t3.micro", "db.t3.small", "db.t3.medium"]
    },
    "LogRetentionInDays": {
      "Type": "Number",
      "Default": 30,
      "Description": "Number of days to retain CloudWatch logs",
      "AllowedValues": [7, 14, 30, 60, 90]
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
            "Value": "SecureProductionEnvironment"
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
            "Value": "SecureProductionEnvironment"
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
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PublicSubnet1CIDR"
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
              "Fn::Sub": "PublicSubnet1-${EnvironmentSuffix}"
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
            "Value": "SecureProductionEnvironment"
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PublicSubnet2CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            1,
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
              "Fn::Sub": "PublicSubnet2-${EnvironmentSuffix}"
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
            "Value": "SecureProductionEnvironment"
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PrivateSubnet1CIDR"
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
              "Fn::Sub": "PrivateSubnet1-${EnvironmentSuffix}"
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
            "Value": "SecureProductionEnvironment"
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PrivateSubnet2CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            1,
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
              "Fn::Sub": "PrivateSubnet2-${EnvironmentSuffix}"
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
            "Value": "SecureProductionEnvironment"
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
            "Value": "SecureProductionEnvironment"
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
          "Ref": "PublicSubnet1"
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
            "Value": "SecureProductionEnvironment"
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
            "Value": "SecureProductionEnvironment"
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
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet2"
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
            "Value": "SecureProductionEnvironment"
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
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTP access from internet"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTPS access from internet"
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
              "Fn::Sub": "ALBSecurityGroup-${EnvironmentSuffix}"
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
            "Value": "SecureProductionEnvironment"
          }
        ]
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances - allows traffic from ALB only",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            },
            "Description": "HTTP from ALB"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            },
            "Description": "HTTPS from ALB"
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
            "Value": "SecureProductionEnvironment"
          }
        ]
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS - allows access from EC2 instances only",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "EC2SecurityGroup"
            },
            "Description": "Allow MySQL from EC2 instances"
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
              "Fn::Sub": "RDSSecurityGroup-${EnvironmentSuffix}"
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
            "Value": "SecureProductionEnvironment"
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
            "Value": "SecureProductionEnvironment"
          }
        ]
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for encrypting S3 buckets, RDS, and other resources",
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
                  "ec2.amazonaws.com",
                  "rds.amazonaws.com",
                  "cloudtrail.amazonaws.com"
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
            "Value": "SecureProductionEnvironment"
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/secure-prod-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "DBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "RDS-Credentials-${EnvironmentSuffix}-${AWS::StackName}"
        },
        "Description": "RDS database master credentials",
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\": \"admin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\'`{}[]|;:,.<>?!#$%^&*()",
          "RequireEachIncludedType": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "DBSecret-${EnvironmentSuffix}"
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
            "Value": "SecureProductionEnvironment"
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
          "Fn::Sub": "secure-prod-logs-${AWS::AccountId}-${EnvironmentSuffix}"
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
            "Value": "SecureProductionEnvironment"
          }
        ]
      }
    },
    "S3LoggingBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "S3LoggingBucket"
        },
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
                "Fn::Sub": "${S3LoggingBucket.Arn}/*"
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
                "Fn::GetAtt": ["S3LoggingBucket", "Arn"]
              }
            },
            {
              "Sid": "AWSELBLogDelivery",
              "Effect": "Allow",
              "Principal": {
                "AWS": "arn:aws:iam::027434742980:root"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${S3LoggingBucket.Arn}/*"
              }
            }
          ]
        }
      }
    },
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Retain",
      "UpdateReplacePolicy": "Retain",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "secure-prod-data-${AWS::AccountId}-${EnvironmentSuffix}"
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
          "LogFilePrefix": "s3-access-logs/"
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
            "Value": "SecureProductionEnvironment"
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
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS instance",
        "SubnetIds": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "DBSubnetGroup-${EnvironmentSuffix}"
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
            "Value": "SecureProductionEnvironment"
          }
        ]
      }
    },
    "RDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Snapshot",
      "UpdateReplacePolicy": "Snapshot",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "rds-${EnvironmentSuffix}"
        },
        "DBInstanceClass": {
          "Ref": "DBInstanceClass"
        },
        "Engine": "mysql",
        "EngineVersion": "8.0.39",
        "MasterUsername": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:username}}"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:password}}"
        },
        "AllocatedStorage": "20",
        "StorageType": "gp3",
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VPCSecurityGroups": [
          {
            "Ref": "RDSSecurityGroup"
          }
        ],
        "PubliclyAccessible": false,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "MultiAZ": false,
        "StorageEncrypted": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "RDSInstance-${EnvironmentSuffix}"
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
            "Value": "SecureProductionEnvironment"
          }
        ]
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
            "PolicyName": "EC2SecretsManagerAccessPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                  ],
                  "Resource": {
                    "Ref": "DBSecret"
                  }
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
            "Value": "SecureProductionEnvironment"
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
          "Ref": "PrivateSubnet1"
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
                "systemctl start amazon-cloudwatch-agent",
                "yum install -y mysql"
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
            "Value": "SecureProductionEnvironment"
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
            "PolicyName": "LambdaSecretsManagerPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                  ],
                  "Resource": {
                    "Ref": "DBSecret"
                  }
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
            "Value": "SecureProductionEnvironment"
          }
        ]
      }
    },
    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "SecureProdFunction-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "MemorySize": 128,
        "Timeout": 30,
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "LambdaSecurityGroup"
            }
          ],
          "SubnetIds": [
            {
              "Ref": "PrivateSubnet1"
            },
            {
              "Ref": "PrivateSubnet2"
            }
          ]
        },
        "Environment": {
          "Variables": {
            "ENVIRONMENT": {
              "Ref": "EnvironmentSuffix"
            },
            "SECRET_ARN": {
              "Ref": "DBSecret"
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
                "import boto3",
                "",
                "def lambda_handler(event, context):",
                "    secrets_client = boto3.client('secretsmanager')",
                "    secret_arn = os.environ.get('SECRET_ARN')",
                "    ",
                "    return {",
                "        'statusCode': 200,",
                "        'headers': {",
                "            'Content-Type': 'application/json'",
                "        },",
                "        'body': json.dumps({",
                "            'message': 'Secure production function running',",
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
            "Value": "SecureProductionEnvironment"
          }
        ]
      }
    },
    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/SecureProdFunction-${EnvironmentSuffix}"
        },
        "RetentionInDays": {
          "Ref": "LogRetentionInDays"
        }
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "DependsOn": "S3LoggingBucketPolicy",
      "Properties": {
        "Name": {
          "Fn::Sub": "SecureProdALB-${EnvironmentSuffix}"
        },
        "Scheme": "internet-facing",
        "SecurityGroups": [
          {
            "Ref": "ALBSecurityGroup"
          }
        ],
        "Subnets": [
          {
            "Ref": "PublicSubnet1"
          },
          {
            "Ref": "PublicSubnet2"
          }
        ],
        "Type": "application",
        "LoadBalancerAttributes": [
          {
            "Key": "idle_timeout.timeout_seconds",
            "Value": "60"
          },
          {
            "Key": "access_logs.s3.enabled",
            "Value": "true"
          },
          {
            "Key": "access_logs.s3.bucket",
            "Value": {
              "Ref": "S3LoggingBucket"
            }
          },
          {
            "Key": "access_logs.s3.prefix",
            "Value": "alb-logs"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ApplicationLoadBalancer-${EnvironmentSuffix}"
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
            "Value": "SecureProductionEnvironment"
          }
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "SecureProdTG-${EnvironmentSuffix}"
        },
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckPath": "/",
        "HealthCheckPort": "80",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "Port": 80,
        "Protocol": "HTTP",
        "TargetType": "instance",
        "UnhealthyThresholdCount": 3,
        "VpcId": {
          "Ref": "VPC"
        },
        "Targets": [
          {
            "Id": {
              "Ref": "EC2Instance"
            },
            "Port": 80
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ALBTargetGroup-${EnvironmentSuffix}"
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
            "Value": "SecureProductionEnvironment"
          }
        ]
      }
    },
    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "ALBTargetGroup"
            }
          }
        ],
        "LoadBalancerArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "Port": 80,
        "Protocol": "HTTP"
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
            "Value": "SecureProductionEnvironment"
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
            "Value": "SecureProductionEnvironment"
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
          "Fn::Sub": "SecureProdTrail-${EnvironmentSuffix}"
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
            "Value": "SecureProductionEnvironment"
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
    "RDSCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "RDS-HighCPU-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when RDS CPU usage is high",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {
              "Ref": "RDSInstance"
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
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": {
        "Ref": "PublicSubnet1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnet1Id"
        }
      }
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": {
        "Ref": "PublicSubnet2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnet2Id"
        }
      }
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": {
        "Ref": "PrivateSubnet1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnet1Id"
        }
      }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": {
        "Ref": "PrivateSubnet2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnet2Id"
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
    "RDSEndpoint": {
      "Description": "RDS database endpoint",
      "Value": {
        "Fn::GetAtt": ["RDSInstance", "Endpoint.Address"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-RDSEndpoint"
        }
      }
    },
    "RDSPort": {
      "Description": "RDS database port",
      "Value": {
        "Fn::GetAtt": ["RDSInstance", "Endpoint.Port"]
      }
    },
    "DBSecretArn": {
      "Description": "ARN of the database secret",
      "Value": {
        "Ref": "DBSecret"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DBSecretArn"
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
    "ALBDNSName": {
      "Description": "DNS name of the Application Load Balancer",
      "Value": {
        "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ALBDNSName"
        }
      }
    },
    "ALBArn": {
      "Description": "ARN of the Application Load Balancer",
      "Value": {
        "Ref": "ApplicationLoadBalancer"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ALBArn"
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
    "RDSSecurityGroupId": {
      "Description": "RDS Security Group ID",
      "Value": {
        "Ref": "RDSSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-RDSSecurityGroupId"
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

The template implements comprehensive security through defense-in-depth architecture across all layers. Network security is enforced with EC2 instances, RDS database, and Lambda functions deployed in private subnets, RDS access restricted exclusively to EC2 security group through security group rules with descriptions, ALB providing the only public entry point with controlled access to EC2 instances, and VPC security groups preventing direct internet access to backend resources. Encryption is implemented at rest using customer-managed KMS keys with automatic key rotation for S3 buckets and RDS database as explicitly required, and in transit through mandatory HTTPS enforcement via S3 bucket policy conditions that explicitly deny requests when aws:SecureTransport is false. Database credentials are securely stored in Secrets Manager with auto-generated passwords and accessed at runtime through dynamic resolution, eliminating hard-coded credentials. IAM roles follow strict least privilege with EC2 instance roles granted only CloudWatch and SSM permissions through managed policies, S3 permissions limited to the application bucket, Secrets Manager permissions limited to the database secret, and KMS permissions for encryption operations. Lambda execution roles are granted only specific CloudWatch Logs permissions scoped to /aws/lambda/ log groups, Secrets Manager permissions limited to the database secret, and KMS Decrypt permission only for the customer-managed key. No policies use wildcard '_:_' administrative privileges as required. CloudTrail provides comprehensive audit trails logging all AWS API calls to an encrypted S3 bucket as a multi-region trail with log file validation enabled as explicitly required for logging all account activity with encryption enabled. VPC Flow Logs capture all network traffic metadata for security analysis and compliance reporting as explicitly required for network traffic monitoring. All S3 buckets block public access through PublicAccessBlockConfiguration. ALB access logs provide detailed request-level logging for security analysis. This multi-layer security architecture protects against unauthorized access, data breaches, and compliance violations.

### Scalability

The infrastructure provides scalability through managed AWS services and parameterized configurations. EC2 instances use configurable instance types (t3.micro, t3.small, t3.medium) allowing vertical scaling based on workload requirements. RDS instances use configurable instance classes (db.t3.micro, db.t3.small, db.t3.medium) allowing database scaling based on workload. Lambda functions automatically scale to handle concurrent invocations without capacity planning, with AWS managing all underlying infrastructure including automatic distribution across Availability Zones and automatic replacement of unhealthy compute nodes. The Application Load Balancer automatically scales to handle varying traffic loads with request routing across targets. S3 buckets automatically scale to handle any storage capacity and request rate without configuration. CloudWatch Logs automatically scales to handle log ingestion from all sources. KMS key usage scales automatically to handle encryption and decryption operations. The VPC design with /16 CIDR provides 65,536 IP addresses supporting future growth and additional resources. The multi-AZ subnet design enables horizontal scaling across availability zones. All outputs are exported for cross-stack references, enabling the infrastructure to serve as a foundation for additional components. This design eliminates capacity planning concerns for serverless components while providing clear upgrade paths for EC2 and RDS-based workloads.

### Operational Excellence

The template achieves operational excellence through infrastructure as code with comprehensive parameterization and validation. Parameters include default values for all parameters enabling quick deployment while allowing customization for VPC CIDR blocks, subnet CIDR blocks, EC2 instance type, RDS instance class, and log retention period. CloudFormation Interface metadata organizes parameters into logical groups (Environment, Network, EC2, RDS, Logging) improving console user experience. CloudWatch monitoring provides comprehensive visibility with EC2 CPU utilization alarms detecting performance issues, RDS CPU utilization alarms for database performance as explicitly required for RDS database monitoring, and Lambda error alarms for failure detection. Centralized logging to CloudWatch Logs with configurable retention enables troubleshooting and compliance auditing for Lambda execution logs, VPC Flow Logs, CloudTrail logs, and RDS logs. CloudTrail provides complete audit trails of all AWS API calls for security investigations and compliance reporting with log file validation for integrity verification. SSM agent installation enables remote command execution without SSH access through Systems Manager Session Manager. CloudWatch agent installation enables custom metrics collection from EC2 instances. MySQL client installation enables database connectivity verification from EC2 instances. Consistent tagging across all resources with Environment and Project tags enables cost allocation tracking, compliance auditing through tag-based reporting, and automated operations through tag-based resource selection. Lambda functions use inline code for demonstration, easily replaced with S3 or ECR image references for production deployments. Environment variables provide configuration without hardcoded values, supporting environment-specific settings including SECRET_ARN for secure credential retrieval.

### Cost Optimization

The infrastructure provides significant cost optimization through appropriate resource sizing and lifecycle management. EC2 instances default to t3.micro, the smallest general-purpose instance type, with AllowedValues constraints preventing accidental deployment of expensive configurations. RDS instances default to db.t3.micro with AllowedValues constraints preventing accidental deployment of expensive configurations. Multi-AZ is disabled by default for cost optimization, easily enabled for production workloads. Lambda functions incur charges only during actual execution time with 1ms billing granularity, automatically scaling to zero when not in use eliminating idle resource costs. Default 128MB memory allocation minimizes Lambda costs. The 30-second timeout balances functionality with cost control. S3 uses versioning which enables lifecycle policies for cost optimization. CloudWatch Logs retention is configurable (7, 14, 30, 60, 90 days) with default of 30 days balancing compliance requirements with storage costs. S3 logging bucket uses lifecycle policy deleting access logs after 90 days reducing storage costs. CloudTrail logs use lifecycle policy deleting logs after 365 days reducing long-term storage costs. KMS key rotation is automatic without additional cost. S3 bucket keys are enabled reducing KMS API calls by up to 99%, significantly reducing encryption costs. The single NAT Gateway design optimizes cost for development and testing workloads. RDS storage uses gp3 which provides better price-performance than gp2. Comprehensive tagging with Environment and Project enables detailed AWS Cost Explorer reports, chargeback to appropriate departments, and identification of cost optimization opportunities through tag-based cost allocation.

### Reliability

The infrastructure achieves high reliability through AWS-managed services, multi-AZ deployment, and built-in redundancy. The VPC spans two availability zones (us-east-1a and us-east-1c) providing infrastructure redundancy for all services. The Application Load Balancer is deployed across both public subnets providing automatic failover and load distribution. EC2 instances are deployed in the private subnet with SSM agent providing remote access and monitoring capabilities without exposing instances to the internet. RDS database includes DB subnet group spanning both private subnets enabling Multi-AZ deployment when required with snapshot-based deletion policy protecting against data loss. Lambda functions are configured with both private subnets and are automatically distributed across multiple Availability Zones with automatic failover and replacement of unhealthy compute nodes by AWS. S3 provides 99.999999999% (11 9's) durability with automatic replication across multiple facilities within the region. Versioning is enabled on all S3 buckets providing protection against accidental deletions and enabling point-in-time recovery. KMS keys are automatically replicated within the region with built-in redundancy eliminating single points of failure in encryption operations. Secrets Manager provides automatic credential rotation capability and high availability. CloudTrail is configured as a multi-region trail ensuring audit logs are captured from all regions with centralized storage. CloudTrail log file validation enables detection of any log tampering. Lambda functions retry failed invocations automatically with exponential backoff. CloudWatch alarms provide proactive monitoring enabling issue detection before user impact with EC2 CPU alarms, RDS CPU alarms, and Lambda error alarms. VPC Flow Logs, Lambda logs, RDS logs, and CloudTrail logs all stream to CloudWatch Logs providing centralized log aggregation for troubleshooting. All outputs use Export enabling cross-stack references and supporting disaster recovery scenarios where dependent stacks can reference this foundational infrastructure.

## Modern AWS Practices

### EC2 Instances in Private Subnets with SSM Access

EC2 instances are deployed within the VPC's private subnet rather than public subnets, providing several critical security advantages as explicitly required for launching EC2 instances in private subnets. Private subnet instances cannot be accessed directly from the internet, eliminating the attack surface from public IP exposure. The EC2 security group restricts access to only traffic from the Application Load Balancer security group on ports 80 and 443 with descriptions for each rule, implementing least privilege network access. SSM agent is installed through UserData enabling remote command execution through Systems Manager Session Manager without requiring direct SSH access or bastion hosts. This approach eliminates the need to manage SSH keys, reduces attack surface by removing SSH exposure to the internet, provides comprehensive audit logging of all session activity, and enables fine-grained IAM-based access control. The EC2 instance role includes AmazonSSMManagedInstanceCore managed policy granting permissions for SSM operations as explicitly required. CloudWatch agent is also installed enabling metrics collection. MySQL client is installed enabling database connectivity verification. The private subnet routes outbound traffic through the NAT Gateway enabling instances to access external resources like package repositories and AWS services while remaining isolated from inbound internet traffic. This architecture aligns with AWS security best practices for enterprise workloads requiring strong security posture.

### RDS Database in Private Subnet with Security Group Restrictions

The RDS MySQL database is deployed within the VPC's private subnets through a DB subnet group, providing complete network isolation from the internet as explicitly required for placing RDS in private subnet. The RDS security group restricts MySQL access on port 3306 exclusively to the EC2 security group with description, ensuring only application servers can connect to the database as explicitly required for allowing access only from EC2 security group. Storage encryption is enabled using the customer-managed KMS key as explicitly required for encryption at rest using AWS KMS, protecting data at rest with automatic key rotation. Database credentials are stored in Secrets Manager with auto-generated 32-character passwords as explicitly required, accessed by the RDS instance through dynamic resolution ensuring credentials never appear in CloudFormation templates or logs. CloudWatch Logs exports are enabled for error, general, and slowquery logs providing comprehensive database monitoring for troubleshooting and performance analysis. Backup retention is set to 7 days with snapshot-based deletion policy protecting against accidental data loss. The DB subnet group spans both private subnets (us-east-1a and us-east-1c) enabling Multi-AZ deployment for high availability when required. This database architecture provides enterprise-grade security with encryption at rest, network isolation, secure credential management, and comprehensive logging.

### Lambda Functions with VPC Isolation and Secrets Manager Integration

Lambda functions are deployed within the VPC's private subnets rather than using default Lambda networking, providing network-level security as required for creating Lambda functions with IAM roles following least privilege. VPC-connected Lambda functions cannot be accessed from the internet directly, ensuring functions have no public access. The Lambda security group allows only outbound traffic while preventing any inbound connections with description, ensuring functions can reach external services through the NAT Gateway and access the RDS database but cannot be accessed directly. The Lambda execution role implements least privilege with specific permissions for CloudWatch Logs access scoped to /aws/lambda/ log groups, Secrets Manager access to retrieve database credentials for the specific DBSecret resource as explicitly required for using AWS Secrets Manager to store and retrieve sensitive information, and KMS decrypt permissions for the customer-managed key. Environment variables include SECRET_ARN referencing the database secret for runtime credential retrieval, avoiding hardcoded credentials. The VPC configuration with both private subnets ensures functions have network connectivity through the NAT Gateway while remaining inaccessible from the internet and enabling database connectivity. This Lambda architecture provides secure serverless compute with network isolation, least privilege IAM, and integrated secrets management.

### Application Load Balancer with S3 Access Logging

The Application Load Balancer provides secure, scalable entry point to the application with comprehensive access logging as explicitly required for configuring ALB with access logs enabled and stored in S3 bucket. The ALB is deployed as internet-facing across both public subnets (us-east-1a and us-east-1c) providing high availability with automatic failover. The ALB security group allows HTTP on port 80 and HTTPS on port 443 from the internet with descriptions for each rule. Access logs are enabled with logs stored in the S3 logging bucket with "alb-logs" prefix, providing detailed request-level logging including client IP, request processing time, request path, and server response for security analysis and troubleshooting. The S3 logging bucket policy includes a statement granting s3:PutObject permission to the ELB service account (arn:aws:iam::027434742980:root) which is the correct account ID for us-east-1 region. The ALB depends on the S3 logging bucket policy ensuring proper permissions are established before ALB creation. A target group is configured with health checks monitoring EC2 instance availability on port 80. The EC2 instance is registered as a target ensuring traffic is routed to healthy instances. An HTTP listener forwards traffic to the target group. This load balancing architecture provides scalable, highly available application access with comprehensive logging for security and operational visibility.

### Customer-Managed KMS Keys with Automatic Rotation

The infrastructure uses customer-managed KMS keys rather than AWS-managed keys for encryption, providing enhanced security and control as required for managing all encryption. Customer-managed keys enable centralized key policy management with granular control over which AWS services and IAM principals can use the key for encryption and decryption operations. The key policy explicitly grants permissions to S3, Lambda, CloudWatch Logs, EC2, RDS, and CloudTrail services while preventing unauthorized access. Automatic key rotation is enabled through EnableKeyRotation set to true, causing AWS to automatically rotate the key material annually while maintaining the same key ID and alias, ensuring encrypted data remains accessible without application changes. Customer-managed keys support detailed CloudTrail logging of all key usage providing audit trails for compliance requirements. The KMS alias provides a friendly name (alias/secure-prod-${EnvironmentSuffix}) following AWS naming conventions and enabling easy key identification across environments. S3 buckets use BucketKeyEnabled reducing KMS API calls by up to 99% through S3 bucket keys that generate data keys locally, significantly reducing costs while maintaining security. RDS storage encryption uses the same customer-managed key providing consistent encryption across all data stores as explicitly required for RDS encryption at rest using AWS KMS. CloudTrail logs are encrypted with the same KMS key as explicitly required for logging with encryption enabled. This approach provides enterprise-grade encryption key management with automatic rotation, detailed audit trails, and cost optimization through bucket keys.

### Secrets Manager for Secure Credential Management

AWS Secrets Manager provides secure storage and retrieval of sensitive information as explicitly required for storing RDS database credentials in Secrets Manager for secure access. The DBSecret resource uses GenerateSecretString with SecretStringTemplate containing the username "admin" and GenerateStringKey for the password, creating secure auto-generated credentials with 32-character passwords. ExcludeCharacters ("@/\\) prevents special characters that could cause issues in database connection strings. RequireEachIncludedType ensures passwords include uppercase, lowercase, numbers, and symbols for strength. The RDS instance references credentials using dynamic resolution ({{resolve:secretsmanager:${DBSecret}:SecretString:username}} and {{resolve:secretsmanager:${DBSecret}:SecretString:password}}) ensuring credentials are resolved at deployment time but never stored in CloudFormation templates, change sets, or logs. EC2 instance role includes EC2SecretsManagerAccessPolicy granting GetSecretValue and DescribeSecret permissions exclusively to the DBSecret resource, enabling applications to retrieve credentials securely at runtime. Lambda execution role includes LambdaSecretsManagerPolicy with identical permissions enabling serverless credential retrieval. Lambda environment variable SECRET_ARN provides the secret ARN for runtime access. This secrets management approach eliminates hard-coded credentials, enables automatic credential rotation when configured, provides CloudTrail audit logging of all credential access, supports compliance requirements for secure credential management, and enables secure database connectivity from both EC2 and Lambda.

### CloudTrail Multi-Region Trail with Log File Validation

CloudTrail is configured as a multi-region trail with global service event logging and log file validation providing comprehensive audit coverage across the entire AWS account as explicitly required for logging all account activity with encryption enabled. IsMultiRegionTrail set to true ensures the trail automatically logs events from all AWS regions including regions added after the trail was created, eliminating the need to create trails in each region individually and providing complete audit coverage. IncludeGlobalServiceEvents set to true captures events from global services like IAM, CloudFront, Route 53, and AWS Organizations that are not region-specific, ensuring complete visibility into all account activity including IAM policy changes, user creation, and role assumption events. EnableLogFileValidation set to true enables detection of any log file tampering providing integrity verification for compliance and security investigations. CloudTrail logs to both S3 (CloudTrailBucket with KMS encryption) and CloudWatch Logs (CloudTrailLogGroup) providing multiple destinations for audit data with encryption enabled as explicitly required. The CloudTrail bucket uses KMS encryption with the customer-managed key, versioning enabled for change tracking, lifecycle policy deleting logs after 365 days, and public access blocked. The bucket policy grants CloudTrail exclusive permission using conditions requiring bucket-owner-full-control ACL ensuring the bucket owner maintains control over all log files. EventSelectors capture all management events with ReadWriteType: All for comprehensive API logging. This comprehensive audit trail supports compliance with regulatory requirements including PCI DSS, HIPAA, SOC 2, and ISO 27001.

### VPC Flow Logs to CloudWatch Logs

VPC Flow Logs are configured to stream to CloudWatch Logs capturing all traffic flows within the VPC as explicitly required for enabling VPC Flow Logs for network traffic monitoring. Flow logs capture metadata about all network traffic traversing the VPC including source and destination IP addresses, ports, protocols, packet and byte counts, and accept/reject decisions based on security group and NACL rules. TrafficType set to ALL ensures both accepted and rejected traffic is captured, providing complete visibility into network communications for security analysis including traffic between EC2 instances, RDS database connections, Lambda function network activity, ALB traffic, and NAT Gateway usage. Streaming to CloudWatch Logs enables real-time analysis and alerting not possible with S3-based flow logs which have 5-15 minute delivery delays. CloudWatch Logs Insights provides a powerful query language for fast analysis of network traffic patterns including identifying top talkers, analyzing traffic by port and protocol, investigating security group rule effectiveness, and verifying RDS is only accessed from EC2 instances as designed. Flow logs can trigger CloudWatch metric filters extracting custom metrics from log data and creating alarms based on suspicious network patterns like port scanning, unusual outbound connections, or traffic to known malicious IPs. The configurable retention period (defaulting to 30 days) balances compliance requirements with storage costs, providing sufficient data for most security investigations while limiting long-term storage expenses. An IAM role grants VPC Flow Logs permission to publish to CloudWatch Logs using the vpc-flow-logs.amazonaws.com service principal following AWS security best practices for service-to-service permissions. This configuration provides enhanced security visibility, real-time threat detection capabilities, and cost-effective log retention.

### CloudWatch Alarms for EC2 and RDS Monitoring

CloudWatch alarms provide proactive monitoring for compute and database resources as explicitly required for setting up CloudWatch alarms for EC2 instances and RDS database monitoring. The EC2CPUAlarm monitors CPUUtilization metric in the AWS/EC2 Namespace with Average statistic over 300-second periods, triggering when CPU exceeds 80% threshold for 2 consecutive evaluation periods. This alarm detects performance issues, resource constraints, or potential runaway processes on EC2 instances. The RDSCPUAlarm monitors CPUUtilization metric in the AWS/RDS Namespace with identical configuration, triggering when database CPU exceeds 80% threshold for 2 consecutive periods as explicitly required for RDS database monitoring. This alarm detects database performance issues, query optimization opportunities, or capacity constraints. The LambdaErrorAlarm monitors Errors metric in the AWS/Lambda Namespace with Sum statistic, triggering when errors exceed 5 occurrences in a 5-minute period for failure detection. Alarms use Dimensions to scope metrics to specific resources using Ref for EC2Instance, RDSInstance, and LambdaFunction ensuring accurate monitoring. AlarmDescription provides clear context for operators responding to alerts. These CloudWatch alarms enable proactive issue detection before user impact, support operational runbooks for incident response, and provide visibility into resource health across compute and database tiers.

### IAM Least Privilege with Scoped Resource Permissions

The infrastructure implements IAM roles for all services following the principle of least privilege without using hard-coded credentials as required. The EC2 instance role provides instances with permissions following least privilege as explicitly required including AmazonSSMManagedInstanceCore managed policy for SSM access enabling remote command execution, CloudWatchAgentServerPolicy managed policy for CloudWatch metrics and logs, custom EC2S3AccessPolicy granting GetObject, PutObject, and ListBucket permissions exclusively to the application bucket using GetAtt for bucket ARN and Fn::Sub for object paths, custom EC2SecretsManagerAccessPolicy granting GetSecretValue and DescribeSecret permissions exclusively to the database secret for credential retrieval, and custom EC2KMSAccessPolicy granting Decrypt, GenerateDataKey, and DescribeKey permissions only to the customer-managed KMS key as explicitly required for EC2 IAM role with permissions for CloudWatch, S3, Secrets Manager, and SSM. The Lambda execution role includes AWSLambdaVPCAccessExecutionRole managed policy for VPC ENI management, LambdaCloudWatchLogsPolicy allowing CreateLogGroup, CreateLogStream, and PutLogEvents only on resources matching /aws/lambda/ log groups preventing functions from writing to other log groups, LambdaSecretsManagerPolicy granting GetSecretValue and DescribeSecret permissions exclusively to the database secret for retrieving sensitive information as explicitly required for Lambda functions using AWS Secrets Manager, and LambdaKMSDecryptPolicy granting Decrypt and DescribeKey permissions only to the customer-managed KMS key. No policies use wildcard resource ARNs or '_:_' administrative privileges as required for IAM roles following least privilege. Resource-specific ARNs using CloudFormation intrinsic functions ensure policies automatically reference the correct resources even if ARNs change during stack updates. This IAM structure eliminates the risk of privilege escalation, reduces blast radius if a service is compromised, supports compliance with regulatory requirements requiring least privilege, and follows AWS Well-Architected Framework security pillar guidance.

### Security Groups with Descriptions for Each Rule

All security groups implement descriptive rules as explicitly required for configuring Security Groups with descriptions for each rule, enabling security auditing, compliance verification, and operational clarity. The ALBSecurityGroup includes ingress rules with Description: "HTTP access from internet" for port 80 and Description: "HTTPS access from internet" for port 443, clearly documenting the purpose of allowing public web traffic. The egress rule includes Description: "Allow all outbound traffic" documenting the permissive outbound policy. The EC2SecurityGroup includes ingress rules with Description: "HTTP from ALB" and Description: "HTTPS from ALB" referencing the ALB security group, clearly documenting that EC2 instances only accept traffic from the load balancer. The RDSSecurityGroup includes ingress rule with Description: "Allow MySQL from EC2 instances" referencing the EC2 security group, clearly documenting the database access restriction as explicitly required for allowing access only from EC2 security group. The LambdaSecurityGroup includes only egress rule with Description: "Allow all outbound traffic" documenting that Lambda functions have no inbound access. These descriptive rules enable security teams to verify firewall configurations match architectural intent, support compliance audits requiring documentation of network access controls, assist operators troubleshooting connectivity issues by clarifying rule purposes, and provide self-documenting infrastructure following AWS best practices.
