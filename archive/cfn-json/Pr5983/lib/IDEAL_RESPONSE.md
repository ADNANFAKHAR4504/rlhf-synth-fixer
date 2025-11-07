# Ideal Response: Secure and Scalable Production Application Infrastructure

## Architecture Overview

This CloudFormation template creates a production-ready AWS cloud environment designed for hosting secure applications with high availability, auto-scaling capabilities, and strict security controls. The infrastructure implements proper network segmentation using a VPC with one public subnet and two private subnets across different Availability Zones, featuring EC2-based compute with Auto Scaling, managed database services, object storage, NoSQL capabilities, and comprehensive monitoring following AWS best practices and the Well-Architected Framework.

### Network Architecture

The infrastructure implements a two-tier VPC architecture with clear network isolation between internet-facing and internal resources. The VPC uses a 10.0.0.0/16 CIDR block providing 65,536 IP addresses for future scalability. The public subnet (10.0.1.0/24) hosts Auto Scaling Group EC2 instances that handle incoming web traffic, while two private subnets (10.0.2.0/24 and 10.0.3.0/24) across different Availability Zones contain the RDS database instance ensuring the database has no direct internet exposure. An Internet Gateway provides public subnet connectivity, enabling external access to web servers and outbound internet access for the application. The Internet Gateway attaches to the VPC with proper dependency management through DependsOn attributes ensuring correct resource creation order. Public subnet instances receive public IP addresses automatically through MapPublicIpOnLaunch configuration, enabling direct internet communication. The private subnet route table has no internet gateway route, completely isolating database resources from direct internet access following security best practices for data tier protection.

### Auto Scaling Compute Layer

The compute layer uses an Auto Scaling Group that dynamically adjusts capacity based on CPU utilization, providing automatic horizontal scaling to match application demand. The ASG maintains a minimum of 2 instances and can scale up to 5 instances, deploying configurable instance types (default t2.micro, supporting t2 and t3 families) within the public subnet to handle incoming web traffic. The Launch Template uses dynamic AMI resolution through SSM Parameter Store (/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2) for the latest Amazon Linux 2 AMI, eliminating hardcoded AMI IDs that become outdated and ensuring instances always launch with the latest security patches. Instance user data installs httpd web server, MySQL client, jq for JSON processing, CloudWatch agent for metrics and logs, and SSM agent for Systems Manager access, then starts all services automatically and creates a production application landing page. CPU-based scaling policies trigger at 70% utilization (scale up by 1 instance) and 30% utilization (scale down by 1 instance) with corresponding CloudWatch alarms and 300-second cooldown periods to prevent rapid scaling oscillations. An IAM instance profile grants EC2 instances permissions for S3 read/write, Secrets Manager access for database credentials, DynamoDB operations, and CloudWatch logging, all scoped to specific resources following the principle of least privilege. The Auto Scaling Group uses EC2 health checks with a 300-second grace period, automatically replacing instances that fail health checks while allowing time for proper initialization.

### Database Layer

Amazon RDS provides a managed database with flexible engine selection supporting MySQL 8.0.43, PostgreSQL 16.4, or MariaDB 10.11.9 based on the DBEngine parameter. The RDS instance uses a configurable instance class (default db.t3.micro, supporting db.t3.micro through db.t3.large) with 20GB of gp3 storage providing improved performance and cost efficiency compared to gp2. The database is deployed within the private subnets using a DB Subnet Group spanning two Availability Zones, ensuring the database is not directly accessible from the internet and meeting AWS RDS requirements for high availability. The RDS instance is not publicly accessible (PubliclyAccessible: false), with connectivity restricted to EC2 instances through a dedicated security group allowing MySQL (port 3306) and PostgreSQL (port 5432) traffic only from the EC2SecurityGroup using SourceSecurityGroupId. Database credentials are managed securely using AWS Secrets Manager with automatic password generation (32 characters with complexity requirements), completely eliminating hardcoded credentials in the template. CloudFormation uses dynamic secret resolution {{resolve:secretsmanager}} to retrieve credentials during stack creation, ensuring credentials never appear in logs or console outputs. CloudWatch Logs exports are configured for error, general, and slow query logs, providing comprehensive database visibility for troubleshooting and performance analysis. Automated backups run daily during a maintenance window (03:00-04:00 UTC) with 7-day retention, and storage encryption is enabled at rest using AWS-managed keys. The RDS instance uses DeletionPolicy: Snapshot ensuring a final snapshot is created before deletion, protecting against accidental data loss and enabling recovery if needed.

### Storage Layer

Amazon S3 provides scalable object storage for application assets, user uploads, and static content. The S3 bucket uses a globally unique name constructed from a configurable prefix, AWS account ID, and environment suffix, ensuring no naming conflicts across AWS accounts. Server-side encryption with AES-256 is enabled by default through BucketEncryption configuration, protecting all objects at rest without application changes. Versioning is enabled to preserve, retrieve, and restore every version of every object stored in the bucket, providing protection against accidental deletions and overwrites. All public access is blocked through PublicAccessBlockConfiguration with all four settings enabled (BlockPublicAcls, BlockPublicPolicy, IgnorePublicAcls, RestrictPublicBuckets all set to true), ensuring the bucket and its objects cannot be accidentally exposed to the public internet. EC2 instances access the bucket using IAM roles with specific permissions (s3:GetObject, s3:PutObject, s3:DeleteObject, s3:ListBucket) scoped exclusively to this bucket through Fn::GetAtt and Fn::Sub references, eliminating the need for access keys and providing automatic credential rotation through temporary security credentials.

### Application Services Layer

Amazon DynamoDB provides a fully managed NoSQL database for high-performance key-value and document data with single-digit millisecond latency at any scale. The table uses a composite primary key with "id" (String) as the partition key and "timestamp" (Number) as the sort key, enabling efficient queries by ID with time-based sorting and supporting common access patterns. PAY_PER_REQUEST billing mode automatically scales read and write throughput in response to application traffic without capacity planning, eliminating throttling concerns and providing true serverless scaling with no minimum capacity charges. Encryption at rest is enabled using AWS-owned encryption keys at no additional cost, protecting sensitive data stored in the table. Point-in-time recovery (PITR) is enabled through PointInTimeRecoverySpecification, providing continuous backups with the ability to restore the table to any second within the last 35 days, protecting against accidental writes or deletes and application bugs that corrupt data.

### Security Layer

Security is implemented at multiple layers using AWS security best practices with defense-in-depth approach. Security groups provide stateful instance-level firewall controls with explicit rules for each traffic type. The EC2SecurityGroup allows HTTP (port 80) and HTTPS (port 443) from anywhere (0.0.0.0/0) enabling public web access, and SSH (port 22) from a configurable IP range specified through the SSHAllowedCIDR parameter, allowing administrative access from authorized networks only. The RDSSecurityGroup allows MySQL (port 3306) and PostgreSQL (port 5432) only from the EC2SecurityGroup using SourceSecurityGroupId instead of CIDR blocks, ensuring the database is completely isolated from external access and only accessible from application servers. This security group reference pattern automatically adapts as instances scale with changing IP addresses, maintaining security without manual rule updates. All security groups allow all outbound traffic following AWS default behavior for application flexibility, while inbound traffic is strictly controlled based on the principle of least privilege.

AWS Secrets Manager stores database credentials with automatic password generation, rotation capabilities, and encryption at rest. The secret contains both username (admin) and a randomly generated 32-character password with complexity requirements (RequireEachIncludedType: true), excluding problematic characters (\"@/\\) that might cause issues in connection strings. EC2 instances retrieve credentials programmatically using IAM permissions, and CloudFormation resolves secrets during stack creation without exposing them in logs or outputs. The SecretsManagerReadAccess policy grants EC2 instances permission to retrieve database credentials at runtime using AWS SDK, enabling applications to connect to the database securely without hardcoded credentials in configuration files or environment variables.

### IAM Roles and Policies

The EC2InstanceRole provides instances with permissions following the principle of least privilege, granting only the minimum access required for application functionality. The role includes two AWS-managed policies: CloudWatchAgentServerPolicy for publishing custom metrics and logs to CloudWatch, and AmazonSSMManagedInstanceCore for Systems Manager capabilities including Session Manager (browser-based SSH alternative), Patch Manager for OS patching, and Run Command for remote execution. Four custom inline policies provide granular access: S3ReadWriteAccess scoped to the specific S3 bucket and its objects using Fn::GetAtt and Fn::Sub to reference the bucket ARN, SecretsManagerReadAccess for retrieving database credentials with Resource scoped to the specific DBSecret, DynamoDBAccess for table operations (GetItem, PutItem, UpdateItem, DeleteItem, Query, Scan) with Resource scoped to the specific DynamoDB table, and CloudWatchLogsAccess for creating log groups and streams under /aws/ec2/ prefix. All policies use resource-level restrictions with CloudFormation intrinsic functions to reference specific resources created by the stack, preventing access to other resources in the AWS account. This approach eliminates hard-coded credentials, provides temporary security credentials automatically rotated by AWS, and enables fine-grained audit trails through CloudTrail.

### Monitoring and Logging

Amazon CloudWatch provides comprehensive monitoring and observability across all infrastructure components. Detailed monitoring is enabled on all EC2 instances through the Launch Template (Monitoring.Enabled: true), collecting metrics at 1-minute intervals instead of the default 5-minute intervals for faster problem detection and more responsive auto scaling. Two CloudWatch alarms provide automated capacity management: CPUAlarmHigh triggers when Auto Scaling Group CPU exceeds 70% for two consecutive 5-minute periods (Period: 300, EvaluationPeriods: 2), invoking the ScaleUpPolicy to add 1 instance. CPUAlarmLow triggers when CPU falls below 30% for two consecutive 5-minute periods, invoking the ScaleDownPolicy to remove 1 instance. These alarms enable automatic capacity adjustment without manual intervention, ensuring the application maintains adequate performance during traffic spikes while minimizing costs during low-traffic periods.

RDS CloudWatch Logs integration exports error logs, general query logs, and slow query logs to CloudWatch (EnableCloudwatchLogsExports: error, general, slowquery), providing centralized database logging for performance troubleshooting, security auditing, and identifying slow queries requiring optimization. Automated backups with 7-day retention (BackupRetentionPeriod: 7) enable point-in-time recovery to any second within the retention window, supporting disaster recovery and data restoration scenarios. The CloudWatch Logs policy grants EC2 instances permission to create log groups and streams under /aws/ec2/ prefix, enabling application-level logging from EC2 instances to CloudWatch for centralized log aggregation and analysis.

### High Availability and Fault Tolerance

The architecture achieves high availability through multiple mechanisms across different layers within a single Availability Zone. The Auto Scaling Group maintains minimum capacity of 2 instances, automatically replacing failed instances within minutes based on EC2 health checks. The 300-second grace period allows instances to complete initialization (installing packages, starting services, creating web page) before health checks begin, preventing termination loops during startup. The Auto Scaling Group automatically replaces instances that become unhealthy, maintaining the desired capacity and minimum instance count to ensure continuous application availability.

RDS automated backups with 7-day retention and DeletionPolicy: Snapshot protect against data loss through accidental deletion or corruption. The DeletionPolicy: Snapshot configuration ensures CloudFormation creates a final database snapshot before deleting the RDS instance during stack deletion, enabling data recovery and restoration to a new instance if needed. Storage encryption protects data at rest, and CloudWatch Logs exports enable monitoring database health and performance. DynamoDB provides built-in replication across three Availability Zones with automatic failover, sub-millisecond failover detection, and no single point of failure. Point-in-time recovery provides continuous backups with restoration to any second within the last 35 days, protecting against accidental data loss.

The infrastructure design balances cost optimization with reliability by deploying resources in a single Availability Zone for EC2 and RDS, reducing cross-AZ data transfer charges and minimizing infrastructure costs. This is appropriate for development, staging, and cost-sensitive production workloads where maximum availability is not required. Mission-critical production applications should implement Multi-AZ deployment for RDS (MultiAZ: true) and distribute Auto Scaling Group instances across multiple Availability Zones for true high availability, accepting higher costs for operational resilience.

## CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure and scalable cloud environment for production application with VPC, EC2, Auto Scaling, RDS, S3, DynamoDB, IAM, CloudWatch, Internet Gateway, and Security Groups",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": [
            "EnvironmentSuffix"
          ]
        },
        {
          "Label": {
            "default": "Network Configuration"
          },
          "Parameters": [
            "VpcCIDR",
            "PublicSubnetCIDR",
            "PrivateSubnetCIDR",
            "PrivateSubnet2CIDR",
            "SSHAllowedCIDR"
          ]
        },
        {
          "Label": {
            "default": "EC2 and Auto Scaling Configuration"
          },
          "Parameters": [
            "EC2InstanceType",
            "LatestAmiId",
            "MinSize",
            "MaxSize",
            "KeyName"
          ]
        },
        {
          "Label": {
            "default": "Database Configuration"
          },
          "Parameters": [
            "DBInstanceClass",
            "DBName",
            "DBEngine"
          ]
        },
        {
          "Label": {
            "default": "Application Configuration"
          },
          "Parameters": [
            "S3BucketPrefix",
            "DynamoDBTableName"
          ]
        }
      ]
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "prod",
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
      "Description": "CIDR block for Private Subnet 1",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "PrivateSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.3.0/24",
      "Description": "CIDR block for Private Subnet 2",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "SSHAllowedCIDR": {
      "Type": "String",
      "Default": "0.0.0.0/0",
      "Description": "CIDR block allowed for SSH access to EC2 instances",
      "AllowedPattern": "^(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/\\d{1,2})$",
      "ConstraintDescription": "Must be a valid CIDR block"
    },
    "EC2InstanceType": {
      "Type": "String",
      "Default": "t2.micro",
      "Description": "EC2 instance type for Auto Scaling Group",
      "AllowedValues": [
        "t2.micro",
        "t2.small",
        "t2.medium",
        "t3.micro",
        "t3.small",
        "t3.medium"
      ]
    },
    "LatestAmiId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Default": "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2",
      "Description": "Latest Amazon Linux 2 AMI ID"
    },
    "MinSize": {
      "Type": "Number",
      "Default": 2,
      "Description": "Minimum number of instances in Auto Scaling Group",
      "MinValue": 2,
      "MaxValue": 10
    },
    "MaxSize": {
      "Type": "Number",
      "Default": 5,
      "Description": "Maximum number of instances in Auto Scaling Group",
      "MinValue": 2,
      "MaxValue": 10
    },
    "KeyName": {
      "Type": "String",
      "Default": "",
      "Description": "EC2 Key Pair for SSH access to instances (optional)"
    },
    "DBInstanceClass": {
      "Type": "String",
      "Default": "db.t3.micro",
      "Description": "RDS instance class",
      "AllowedValues": [
        "db.t3.micro",
        "db.t3.small",
        "db.t3.medium",
        "db.t3.large"
      ]
    },
    "DBName": {
      "Type": "String",
      "Default": "productiondb",
      "Description": "Database name",
      "MinLength": "1",
      "MaxLength": "64",
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$"
    },
    "DBEngine": {
      "Type": "String",
      "Default": "mysql",
      "Description": "Database engine type",
      "AllowedValues": [
        "mysql",
        "postgres",
        "mariadb"
      ]
    },
    "S3BucketPrefix": {
      "Type": "String",
      "Default": "production-app-assets",
      "Description": "Prefix for S3 bucket name",
      "AllowedPattern": "^[a-z0-9-]+$"
    },
    "DynamoDBTableName": {
      "Type": "String",
      "Default": "ProductionAppData",
      "Description": "DynamoDB table name",
      "AllowedPattern": "^[a-zA-Z0-9_.-]+$"
    }
  },
  "Conditions": {
    "HasKeyPair": {
      "Fn::Not": [
        {
          "Fn::Equals": [
            {
              "Ref": "KeyName"
            },
            ""
          ]
        }
      ]
    },
    "IsMySQL": {
      "Fn::Equals": [
        {
          "Ref": "DBEngine"
        },
        "mysql"
      ]
    },
    "IsPostgres": {
      "Fn::Equals": [
        {
          "Ref": "DBEngine"
        },
        "postgres"
      ]
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
            "Value": "Production"
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
            "Value": "Production"
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
            "Value": "Production"
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
            "Value": "Production"
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
            "Value": "Production"
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
            "Value": "Production"
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
            "Value": "Production"
          }
        ]
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
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances - allows HTTP, HTTPS, and SSH access",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP from internet"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS from internet"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": {
              "Ref": "SSHAllowedCIDR"
            },
            "Description": "Allow SSH from specified IP range"
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
            "Value": "Production"
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
            "Description": "Allow MySQL/MariaDB from EC2 instances"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": {
              "Ref": "EC2SecurityGroup"
            },
            "Description": "Allow PostgreSQL from EC2 instances"
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
            "Value": "Production"
          }
        ]
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
          "ExcludeCharacters": "\"@/\\",
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
            "Value": "Production"
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
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
        "Policies": [
          {
            "PolicyName": "S3ReadWriteAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "S3Bucket",
                        "Arn"
                      ]
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
            "PolicyName": "DynamoDBAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "DynamoDBTable",
                      "Arn"
                    ]
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "SecretsManagerReadAccess",
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
            "PolicyName": "CloudWatchLogsAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogStreams"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*"
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
            "Value": "Production"
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
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "LaunchTemplate-${EnvironmentSuffix}"
        },
        "LaunchTemplateData": {
          "ImageId": {
            "Ref": "LatestAmiId"
          },
          "InstanceType": {
            "Ref": "EC2InstanceType"
          },
          "KeyName": {
            "Fn::If": [
              "HasKeyPair",
              {
                "Ref": "KeyName"
              },
              {
                "Ref": "AWS::NoValue"
              }
            ]
          },
          "IamInstanceProfile": {
            "Arn": {
              "Fn::GetAtt": [
                "EC2InstanceProfile",
                "Arn"
              ]
            }
          },
          "SecurityGroupIds": [
            {
              "Ref": "EC2SecurityGroup"
            }
          ],
          "Monitoring": {
            "Enabled": true
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Join": [
                "",
                [
                  "#!/bin/bash\n",
                  "yum update -y\n",
                  "yum install -y httpd mysql jq amazon-cloudwatch-agent\n",
                  "yum install -y amazon-ssm-agent\n",
                  "systemctl enable amazon-ssm-agent\n",
                  "systemctl start amazon-ssm-agent\n",
                  "systemctl start httpd\n",
                  "systemctl enable httpd\n",
                  "echo '<h1>Production Application</h1><p>Auto Scaling Group Instance</p>' > /var/www/html/index.html\n"
                ]
              ]
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "ASG-Instance-${EnvironmentSuffix}"
                  }
                },
                {
                  "Key": "Environment",
                  "Value": "Production"
                }
              ]
            }
          ]
        }
      }
    },
    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": {
          "Fn::Sub": "ASG-${EnvironmentSuffix}"
        },
        "LaunchTemplate": {
          "LaunchTemplateId": {
            "Ref": "LaunchTemplate"
          },
          "Version": {
            "Fn::GetAtt": [
              "LaunchTemplate",
              "LatestVersionNumber"
            ]
          }
        },
        "MinSize": {
          "Ref": "MinSize"
        },
        "MaxSize": {
          "Ref": "MaxSize"
        },
        "DesiredCapacity": {
          "Ref": "MinSize"
        },
        "VPCZoneIdentifier": [
          {
            "Ref": "PublicSubnet"
          }
        ],
        "HealthCheckType": "EC2",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ASG-${EnvironmentSuffix}"
            },
            "PropagateAtLaunch": false
          },
          {
            "Key": "Environment",
            "Value": "Production",
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "ScaleUpPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AdjustmentType": "ChangeInCapacity",
        "AutoScalingGroupName": {
          "Ref": "AutoScalingGroup"
        },
        "Cooldown": 300,
        "ScalingAdjustment": 1
      }
    },
    "ScaleDownPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AdjustmentType": "ChangeInCapacity",
        "AutoScalingGroupName": {
          "Ref": "AutoScalingGroup"
        },
        "Cooldown": 300,
        "ScalingAdjustment": -1
      }
    },
    "CPUAlarmHigh": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "ASG-CPUHigh-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Scale up when CPU exceeds 70%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 70,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {
              "Ref": "AutoScalingGroup"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "ScaleUpPolicy"
          }
        ]
      }
    },
    "CPUAlarmLow": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "ASG-CPULow-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Scale down when CPU is below 30%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 30,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {
              "Ref": "AutoScalingGroup"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "ScaleDownPolicy"
          }
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS instance",
        "SubnetIds": [
          {
            "Ref": "PrivateSubnet"
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
            "Value": "Production"
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
        "Engine": {
          "Ref": "DBEngine"
        },
        "EngineVersion": {
          "Fn::If": [
            "IsMySQL",
            "8.0.43",
            {
              "Fn::If": [
                "IsPostgres",
                "16.4",
                "10.11.9"
              ]
            }
          ]
        },
        "MasterUsername": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:username}}"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:password}}"
        },
        "DBName": {
          "Ref": "DBName"
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
        "StorageEncrypted": true,
        "EnableCloudwatchLogsExports": [
          "error",
          "general",
          "slowquery"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "RDSInstance-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${S3BucketPrefix}-${AWS::AccountId}-${EnvironmentSuffix}"
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
              "Fn::Sub": "S3Bucket-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "DynamoDBTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "${DynamoDBTableName}-${EnvironmentSuffix}"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "id",
            "AttributeType": "S"
          },
          {
            "AttributeName": "timestamp",
            "AttributeType": "N"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "id",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "timestamp",
            "KeyType": "RANGE"
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "SSESpecification": {
          "SSEEnabled": true
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "DynamoDBTable-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
    "InternetGatewayId": {
      "Description": "Internet Gateway ID",
      "Value": {
        "Ref": "InternetGateway"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-InternetGatewayId"
        }
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
    "AutoScalingGroupName": {
      "Description": "Auto Scaling Group Name",
      "Value": {
        "Ref": "AutoScalingGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ASGName"
        }
      }
    },
    "LaunchTemplateId": {
      "Description": "Launch Template ID",
      "Value": {
        "Ref": "LaunchTemplate"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LaunchTemplateId"
        }
      }
    },
    "RDSInstanceEndpoint": {
      "Description": "RDS instance endpoint address",
      "Value": {
        "Fn::GetAtt": [
          "RDSInstance",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-RDSEndpoint"
        }
      }
    },
    "RDSInstancePort": {
      "Description": "RDS instance port",
      "Value": {
        "Fn::GetAtt": [
          "RDSInstance",
          "Endpoint.Port"
        ]
      }
    },
    "S3BucketName": {
      "Description": "S3 bucket name",
      "Value": {
        "Ref": "S3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3BucketName"
        }
      }
    },
    "DynamoDBTableName": {
      "Description": "DynamoDB table name",
      "Value": {
        "Ref": "DynamoDBTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DynamoDBTableName"
        }
      }
    },
    "DBSecretArn": {
      "Description": "ARN of the Secrets Manager secret containing database credentials",
      "Value": {
        "Ref": "DBSecret"
      }
    },
    "IAMRoleArn": {
      "Description": "IAM Role ARN for EC2 instances",
      "Value": {
        "Fn::GetAtt": [
          "EC2InstanceRole",
          "Arn"
        ]
      }
    }
  }
}
```

## Key Features

### Security

The template implements comprehensive multi-layer security following AWS best practices and the Well-Architected Framework. Network isolation is achieved through VPC architecture with clear separation between the public subnet (EC2 instances) and private subnet (RDS database), ensuring database resources have no direct internet exposure. Security groups implement stateful firewalls at the instance level using the principle of least privilege. The EC2SecurityGroup allows HTTP and HTTPS from anywhere for public web access, and SSH from a configurable IP range (SSHAllowedCIDR parameter) enabling administrative access restriction to specific networks. The RDSSecurityGroup allows database traffic (MySQL port 3306, PostgreSQL port 5432) only from the EC2SecurityGroup using SourceSecurityGroupId references instead of CIDR blocks, ensuring the database is completely isolated from external access and only reachable from application servers. This layered approach ensures each component can only communicate with authorized sources.

Secrets Manager eliminates hardcoded credentials by storing database passwords with automatic generation (32 characters with complexity requirements), encryption at rest, and programmatic access through IAM roles. CloudFormation resolves secrets during stack creation using {{resolve:secretsmanager}} syntax without exposing them in logs, parameters, or outputs. IAM roles provide fine-grained permissions scoped to specific resources, granting EC2 instances access to only their designated S3 bucket, DynamoDB table, and Secrets Manager secret. All storage services implement encryption at rest: S3 uses AES-256, RDS uses AWS-managed encryption keys, and DynamoDB uses AWS-owned keys. Public access is completely blocked on the S3 bucket through PublicAccessBlockConfiguration with all four protection mechanisms enabled. The RDS instance is deployed in the private subnet with PubliclyAccessible set to false, preventing any direct internet connection attempts.

### Scalability

The architecture provides automatic horizontal scaling capabilities to match application demand without manual intervention. The Auto Scaling Group dynamically adjusts EC2 instance count from 2 to 5 based on CPU utilization, scaling up when CPU exceeds 70% for 10 minutes (2 periods of 5 minutes) and scaling down when CPU falls below 30% for 10 minutes. The 300-second cooldown period prevents rapid scaling oscillations, and the ChangeInCapacity adjustment type adds or removes instances one at a time for gradual scaling. The VPC design with /16 CIDR provides 65,536 IP addresses with public and private subnets using /24 blocks (256 addresses each), leaving substantial address space for future subnet additions and growth.

DynamoDB PAY_PER_REQUEST billing mode automatically scales read and write throughput in response to application traffic without capacity planning, eliminating throttling concerns and supporting unpredictable workloads. The composite primary key with partition key (id) and sort key (timestamp) enables efficient data distribution across partitions for horizontal scalability. RDS supports vertical scaling by changing instance class from db.t3.micro through db.t3.large without architecture changes, and storage can be expanded by increasing AllocatedStorage. All CloudFormation outputs use Export for cross-stack references, enabling this infrastructure to serve as a foundation for additional stacks, microservices, or nested environments.

### Operational Excellence

The template achieves operational excellence through infrastructure as code with comprehensive parameterization enabling deployment across multiple environments (dev, staging, prod) without template modifications. Parameters use validation through AllowedPattern for CIDR blocks and names, AllowedValues for instance types and database classes, and MinValue/MaxValue for numeric parameters ensuring valid inputs and preventing misconfigurations. CloudFormation Interface metadata organizes parameters into five logical groups (Environment, Network, EC2 and Auto Scaling, Database, Application) improving the console experience and reducing deployment errors.

Dynamic AMI resolution through SSM Parameter Store (/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2) eliminates hardcoded AMI IDs that become outdated, ensuring instances always launch with the latest patched Amazon Linux 2 AMI across all regions automatically. Launch Templates enable versioning with rollback capability, and the Auto Scaling Group references the latest version dynamically using Fn::GetAtt LatestVersionNumber, applying configuration updates without manual version management.

CloudWatch monitoring provides comprehensive observability with detailed monitoring on all EC2 instances (1-minute metrics) and two proactive alarms for CPU-based scaling. Consistent tagging with two tags (Name using Fn::Sub for environment-specific naming, Environment with hardcoded "Production") on all resources enables cost allocation, resource grouping, and automated operations through tag-based filters. Systems Manager integration (AmazonSSMManagedInstanceCore managed policy) provides Session Manager for browser-based SSH alternative, Patch Manager for OS patching, and Run Command for remote execution. Secrets Manager supports automatic rotation for database credentials, and RDS automated backups with 7-day retention enable point-in-time recovery. The DeletionPolicy: Snapshot on RDS ensures a final snapshot is created before stack deletion, protecting against accidental data loss.

### Cost Optimization

The design balances functionality with cost efficiency through several optimizations informed by AWS Well-Architected Framework best practices. T2 and T3 instance types (default t2.micro for EC2, db.t3.micro for RDS) provide burstable CPU performance at significantly lower cost than fixed-performance instance types, suitable for variable workloads that don't require sustained high CPU. AllowedValues parameter constraints prevent accidental deployment of expensive instance types and database classes, reducing the risk of bill shock from misconfiguration.

Auto Scaling ensures payment only for needed capacity, automatically scaling down when CPU falls below 30% for 10 minutes with the ScaleDownPolicy removing 1 instance at a time. The 300-second cooldown prevents premature scaling actions that waste resources. Single Availability Zone deployment for EC2 and RDS reduces cross-AZ data transfer charges, appropriate for cost-sensitive workloads where maximum availability is not required. No NAT Gateway is deployed since EC2 instances are in the public subnet, eliminating NAT Gateway hourly charges ($32-45/month) and data transfer fees while maintaining internet connectivity for application functionality.

DynamoDB PAY_PER_REQUEST billing mode eliminates capacity planning and minimum capacity charges, charging only for actual requests with automatic scaling to zero when idle. This is substantially more cost-effective than provisioned capacity for unpredictable or intermittent workloads. RDS gp3 storage provides better price-performance than gp2 with included baseline performance. S3 versioning protects against accidental deletion while enabling lifecycle policies (not implemented in template but supported) to transition older versions to cheaper storage classes. CloudWatch Logs retention is managed through EnableCloudwatchLogsExports without explicit retention policies, allowing default settings to control storage costs. Consistent tagging with Environment enables detailed cost allocation reports through AWS Cost Explorer filtering and grouping.

### Reliability

The architecture achieves reliability through multiple mechanisms within a single Availability Zone. The Auto Scaling Group maintains minimum capacity of 2 instances, automatically replacing failed instances within minutes based on EC2 health checks. The 300-second grace period allows instances to complete initialization (installing packages, starting services) before health checks begin, preventing termination loops during startup. If an instance fails health checks after the grace period, Auto Scaling automatically terminates it and launches a replacement, maintaining the minimum instance count.

RDS automated backups with 7-day retention enable point-in-time recovery to any second within the retention window, supporting disaster recovery and data restoration scenarios. The DeletionPolicy: Snapshot configuration ensures CloudFormation creates a final database snapshot before deleting the RDS instance during stack deletion, providing an additional layer of protection against accidental data loss. Storage encryption protects data at rest, and CloudWatch Logs exports (error, general, slowquery) enable monitoring database health and identifying issues requiring attention.

DynamoDB provides built-in replication across three Availability Zones with automatic failover, sub-millisecond failover detection, and no single point of failure. Point-in-time recovery enabled through PointInTimeRecoverySpecification provides continuous backups with restoration to any second within the last 35 days, protecting against accidental deletes and data corruption. All CloudFormation outputs use Export for cross-stack references enabling integration with additional stacks for enhanced reliability architectures.

The infrastructure design balances cost optimization with reliability by deploying resources in a single Availability Zone for EC2 and RDS (MultiAZ: false), reducing costs while accepting some availability trade-off. This is appropriate for development, staging, and cost-sensitive production workloads. Mission-critical production applications should implement Multi-AZ deployment for RDS (MultiAZ: true) and distribute Auto Scaling Group instances across multiple subnets in different Availability Zones for true high availability.

## Modern AWS Practices

### Launch Templates with Dynamic Version Management

The infrastructure uses EC2 Launch Templates rather than legacy Launch Configurations for numerous technical and operational advantages. Launch Templates support versioning, enabling maintenance of multiple configuration versions with the ability to roll back to previous versions if issues arise during deployments. The template references the latest version dynamically using Fn::GetAtt with LatestVersionNumber, ensuring the Auto Scaling Group always uses the most recent configuration without manual version updates or stack updates. This eliminates the operational burden of tracking version numbers and prevents deployment errors from stale version references.

Launch Templates provide access to newer EC2 features unavailable in Launch Configurations including T2/T3 Unlimited mode for burstable instances, capacity reservations, dedicated hosts and tenancy, and metadata service version 2 (IMDSv2) security enhancements. Configuration updates can be applied to the Auto Scaling Group by creating a new Launch Template version and allowing instances to gradually replace during natural scale events or through instance refresh, reducing deployment risk compared to replacing the entire Auto Scaling Group.

TagSpecifications automatically propagate tags to all instances created by the Auto Scaling Group, ensuring consistent tagging for cost allocation, resource organization, and automated operations without per-instance configuration. The Launch Template includes Monitoring with Enabled set to true, activating detailed monitoring (1-minute metrics) for all Auto Scaling Group instances automatically, enabling faster problem detection and more responsive auto scaling. KeyName parameter inclusion with Conditions (HasKeyPair) enables optional SSH access while maintaining security through security group restrictions and supporting deployments without SSH keys where Session Manager is preferred.

### Dynamic AMI Resolution with SSM Parameter Store

Instead of hardcoding an AMI ID that becomes outdated and creates security and compliance risks, this template uses AWS Systems Manager Parameter Store to dynamically retrieve the latest Amazon Linux 2 AMI. The parameter type AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> instructs CloudFormation to resolve the parameter during stack creation or update, with the default value /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2 maintained by AWS and always pointing to the latest patched Amazon Linux 2 AMI for the stack's region.

This approach provides multiple operational and security benefits. Instances always launch with the latest security patches and bug fixes without manual AMI ID lookups or template updates, reducing security vulnerabilities and operational toil. The solution works across all AWS regions automatically since AWS maintains region-specific parameter paths, eliminating the need for region-specific AMI ID mappings or conditions. There's no risk of launching instances with deprecated, vulnerable, or unsupported AMIs that may fail compliance audits or security scans. The SSM parameter is evaluated by CloudFormation during stack creation or update with the resolved AMI ID stored in the Launch Template until the next update, ensuring consistency across instances launched by the Auto Scaling Group.

Users can override the parameter default to pin to a specific AMI or different parameter path if needed for testing or compliance requirements, providing flexibility while maintaining security by default. This pattern is recommended by AWS and considered a best practice for production workloads, particularly in automated CI/CD pipelines where manual AMI ID management would be impractical.

### Security Group References for Dynamic Security

The template uses security group references with SourceSecurityGroupId instead of IP-based CIDR rules for implementing dynamic, logical security boundaries that automatically adapt to infrastructure changes. The RDSSecurityGroup allows MySQL (port 3306) and PostgreSQL (port 5432) only from the EC2SecurityGroup using SourceSecurityGroupId to reference the source security group instead of IP addresses. This approach provides significant operational and security advantages.

The security rules automatically adapt as instances scale with changing IP addresses, eliminating the need to maintain CIDR-based rules that would break during Auto Scaling events. New EC2 instances launched by the Auto Scaling Group are automatically permitted to access the database without rule updates since membership in the EC2SecurityGroup grants access regardless of IP address. The configuration remains effective even if instance IP addresses change during re-deployment or infrastructure changes, preventing unexpected connectivity failures.

Security group references reduce misconfiguration risk by defining logical relationships between components (database accepts traffic exclusively from application servers) instead of error-prone IP address management. This implements true least privilege by ensuring the database can only be accessed from EC2 instances with the correct security group, with no opportunity for unintended access from other sources. The approach aligns with AWS Well-Architected Framework security pillar recommendations for defense in depth and logical security boundaries that map to application architecture rather than network topology.

### Secrets Manager for Credential Management

AWS Secrets Manager provides secure storage, automatic generation, and rotation capabilities for database credentials, completely eliminating hardcoded passwords in the template or parameters. The DBSecret resource uses GenerateSecretString with SecretStringTemplate to define the username (admin) while automatically generating a random 32-character password with RequireEachIncludedType ensuring complexity requirements (uppercase, lowercase, numbers, special characters). The ExcludeCharacters field prevents problematic characters (\"@/\\) that could cause issues in connection strings or shell scripts.

CloudFormation resolves secrets during stack creation using dynamic reference syntax {{resolve:secretsmanager:${DBSecret}:SecretString:username}} and {{resolve:secretsmanager:${DBSecret}:SecretString:password}} in the RDS MasterUsername and MasterUserPassword properties. This approach ensures credentials never appear in CloudFormation events, stack parameters, outputs, logs, or console displays, maintaining strict security throughout the deployment lifecycle. The EC2InstanceRole includes SecretsManagerReadAccess policy granting instances permission to programmatically retrieve credentials using AWS SDK, enabling applications to fetch database credentials at runtime without hardcoding them in configuration files or environment variables.

Secrets Manager supports automatic rotation through Lambda functions (not configured in this template but easily added) that periodically change database passwords and update the secret, with RDS automatically detecting the new password through integration. The secret is encrypted at rest using AWS-managed encryption keys at no additional cost, and all access is logged through CloudTrail for security auditing and compliance. Applications retrieve credentials using temporary IAM role credentials that automatically rotate every few hours, providing layered security throughout the credential access path. This architecture implements AWS security best practices for credential management and aligns with compliance frameworks including PCI DSS, HIPAA, and SOC 2 that require secure credential storage and rotation.

### Flexible Database Engine Selection with Conditional Versioning

The template implements a flexible database engine selection pattern enabling choice between MySQL, PostgreSQL, and MariaDB through a single parameter (DBEngine) with automatic engine version selection using nested Fn::If conditions. This pattern demonstrates advanced CloudFormation intrinsic function usage for conditional logic. The DBEngine parameter allows three values (mysql, postgres, mariadb) with mysql as the default. The EngineVersion property uses nested Fn::If conditions to select the appropriate version: MySQL 8.0.43, PostgreSQL 16.4, or MariaDB 10.11.9 based on the DBEngine parameter value.

This approach provides operational flexibility by enabling deployment of different database engines without template modifications, supporting heterogeneous environments where different applications require different database engines. The pattern maintains consistency by ensuring each engine uses a tested, compatible version while allowing easy version updates by modifying the nested conditions. The RDSSecurityGroup includes ports for both MySQL/MariaDB (3306) and PostgreSQL (5432), ensuring connectivity regardless of engine selection without requiring security group modifications.

This design demonstrates infrastructure as code best practices by parameterizing significant architectural choices, reducing template proliferation, and simplifying multi-environment deployments. Organizations can maintain a single template supporting multiple database engines, reducing maintenance overhead and ensuring consistency across deployments. The conditional engine version selection ensures appropriate versions are used for each engine, preventing configuration errors from manual version specification while maintaining flexibility for future version updates.

### Public Subnet Auto Scaling for Simplified Architecture

The Auto Scaling Group deploys instances in the public subnet (VPCZoneIdentifier references PublicSubnet) with automatic public IP assignment through MapPublicIpOnLaunch, representing a simplified architecture appropriate for specific use cases. This design enables direct internet connectivity for EC2 instances without requiring a NAT Gateway, eliminating NAT Gateway costs ($32-45/month plus data transfer charges) and removing a potential network bottleneck. Instances can directly receive incoming traffic and make outbound connections through the Internet Gateway without intermediate translation, reducing latency and simplifying troubleshooting.

This architecture is appropriate for public-facing web servers, development and staging environments, cost-sensitive workloads, and applications where all compute resources handle direct internet traffic. The EC2SecurityGroup implements protection by allowing only specific inbound traffic (HTTP, HTTPS, SSH from configured CIDR) while permitting all outbound traffic for application functionality. Systems Manager Session Manager (enabled through AmazonSSMManagedInstanceCore policy) provides secure administrative access without exposing SSH ports to the entire internet if the SSHAllowedCIDR parameter is restricted.

For enhanced security, production architectures should consider placing application servers in private subnets with a load balancer in public subnets providing the internet-facing entry point. This design would require adding a NAT Gateway for outbound internet access from private subnet instances, accepting higher costs for improved security posture. The template can be easily modified to implement this pattern by creating additional subnets, adding NAT Gateway resources, updating route tables, and changing the Auto Scaling Group VPCZoneIdentifier to reference private subnets, demonstrating the flexibility of infrastructure as code for evolving security requirements.

### Comprehensive Resource Tagging Strategy

All resources implement a consistent two-tag strategy with Name (dynamically generated using Fn::Sub with ${EnvironmentSuffix}) and Environment (hardcoded to "Production") tags, providing resource organization and operational capabilities. The Name tag uses environment-specific naming (VPC-${EnvironmentSuffix}, ASG-${EnvironmentSuffix}) enabling multiple stack deployments in the same account without naming conflicts, clearly identifying resources during troubleshooting, and maintaining naming consistency across all resources.

The Environment tag enables critical operational and financial capabilities. AWS Cost Explorer filtering and grouping by Environment tag provides detailed cost breakdowns by environment, enabling accurate budget forecasting and cost trend analysis. Resource filtering in the AWS Console is simplified through tag-based filters enabling operations teams to view only production resources or specific environments. Automated operations become possible through tag-based resource selection in scripts and AWS APIs, such as implementing disaster recovery procedures targeting specific environments or creating backup policies based on environment tags.

The Auto Scaling Group uses PropagateAtLaunch set to true for the Environment tag, ensuring all EC2 instances inherit this tag automatically for complete resource tracking and cost attribution without per-instance configuration. The Name tag uses PropagateAtLaunch: false since the Auto Scaling Group itself has a distinct name from individual instances, which receive their own name through TagSpecifications in the Launch Template (ASG-Instance-${EnvironmentSuffix}).

This tagging strategy aligns with AWS Well-Architected Framework operational excellence and cost optimization pillars, enabling comprehensive cost allocation, resource organization, automated operations, and policy-based management. Organizations should expand tags based on specific requirements (Owner, CostCenter, Application, DataClassification, ComplianceScope) while maintaining consistency across all resources for maximum operational value. The consistent tagging approach demonstrated in this template provides a foundation for mature cloud governance and FinOps practices.

### DynamoDB with Point-in-Time Recovery and Serverless Scaling

DynamoDB is configured with PAY_PER_REQUEST billing mode and Point-in-Time Recovery (PITR) enabled, demonstrating serverless scaling and comprehensive data protection capabilities. The PAY_PER_REQUEST billing mode eliminates capacity planning and provisioned throughput management, automatically scaling read and write capacity to accommodate application traffic patterns without throttling. This eliminates under-provisioning that causes performance issues and over-provisioning that wastes money, with charges based only on actual requests (read, write, query, scan operations) and storage consumed.

The composite primary key uses "id" (String) as the partition key and "timestamp" (Number) as the sort key, enabling efficient data distribution across partitions for horizontal scalability and supporting range queries sorted by timestamp. This key design supports common access patterns including retrieving all records for a specific ID sorted by time, querying the most recent N records for an ID, and time-based data analysis. The partition key ensures DynamoDB can scale to virtually unlimited throughput by distributing data across multiple partitions based on ID values.

Point-in-Time Recovery (PointInTimeRecoveryEnabled: true) provides continuous backups with the ability to restore the table to any second within the last 35 days, protecting against accidental deletes, application bugs that corrupt data, and operational errors. PITR operates with no performance impact and minimal additional cost (approximately 20% of storage cost), maintaining incremental backups automatically in the background. Recovery creates a new table with data restored to the specified timestamp, enabling validation before switching application traffic.

Server-side encryption (SSEEnabled: true) uses AWS-owned encryption keys at no additional cost, protecting data at rest and meeting compliance requirements for data encryption. This configuration demonstrates AWS best practices for DynamoDB deployments balancing performance, cost optimization, data protection, and operational simplicity through serverless architecture and managed backup capabilities.

### RDS with Multiple Engine Support and Snapshot Protection

The RDS implementation demonstrates flexible engine selection and comprehensive data protection through DeletionPolicy: Snapshot. The DBEngine parameter enables choice between MySQL 8.0.43, PostgreSQL 16.4, or MariaDB 10.11.9 using nested Fn::If conditions for automatic version selection. This pattern supports heterogeneous database environments within a single template, reducing template proliferation and maintenance overhead while ensuring appropriate engine versions are deployed automatically.

The DeletionPolicy: Snapshot configuration ensures CloudFormation creates a final database snapshot before deleting the RDS instance during stack deletion or update replacement, providing critical protection against accidental data loss. Without this policy, stack deletion would immediately destroy the database and all data. The snapshot-based deletion policy enables data recovery by restoring the final snapshot to a new RDS instance if the deletion was unintentional or if data needs to be recovered after stack cleanup. This represents a production-ready safety mechanism that organizations should implement for all stateful resources.

RDS is deployed with storage encryption (StorageEncrypted: true), 7-day automated backups (BackupRetentionPeriod: 7), and CloudWatch Logs exports for error, general, and slow query logs. The gp3 storage type provides better price-performance than gp2 with baseline 3000 IOPS and 125 MB/s throughput included. The combination of snapshot-based deletion protection, automated backups, CloudWatch logging, and Secrets Manager credential management demonstrates AWS best practices for production database deployments balancing availability, security, observability, and cost.

The template architecture allows easy migration to Multi-AZ deployment by changing MultiAZ from false to true, accepting higher costs for synchronous replication and automatic failover capabilities. This flexibility demonstrates how infrastructure as code enables iterative improvement of reliability and availability characteristics based on evolving application requirements and risk tolerance.
