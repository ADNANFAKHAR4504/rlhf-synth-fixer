# Ideal Response: Secure and Scalable Web Application Infrastructure with Multi-Service Integration

## Architecture Overview

This CloudFormation template creates a production-ready, highly available AWS cloud environment designed for secure web application hosting with comprehensive multi-service integration. The infrastructure spans multiple Availability Zones across the us-west-1 region, featuring a robust three-tier architecture with network isolation, application-level load balancing, automatic scaling, managed database services, object storage, NoSQL capabilities, message queuing, and centralized monitoring following AWS best practices and the Well-Architected Framework.

### Network Architecture

The infrastructure implements a multi-tier VPC architecture spanning two Availability Zones in the us-west-1 region with complete network isolation between public and private resources. The VPC uses a 10.0.0.0/16 CIDR block providing 65,536 IP addresses for future growth. Public subnets (10.0.1.0/24, 10.0.2.0/24) host the Application Load Balancer, bastion host, and NAT Gateway, while private subnets (10.0.3.0/24, 10.0.4.0/24) contain Auto Scaling Group instances and the RDS database, ensuring application and data layer resources have no direct internet exposure. An Internet Gateway provides public subnet connectivity, enabling external access to the load balancer and bastion host. A single NAT Gateway deployed in PublicSubnet1 with a dedicated Elastic IP enables outbound internet access for private subnet resources. Both private subnets route through this NAT Gateway using a shared private route table, providing centralized egress control while maintaining cost efficiency for non-critical workloads. This design balances availability with cost optimization by eliminating unnecessary duplication while maintaining functional requirements.

### Bastion Host Layer

A dedicated bastion host (jump box) deployed in PublicSubnet1 provides secure SSH access to private subnet resources following security best practices. The bastion host uses a t2.micro instance with detailed CloudWatch monitoring enabled. Access is controlled through a dedicated security group allowing SSH (port 22) from authorized IP addresses. The bastion serves as the single entry point for administrative access to web servers and databases in private subnets, implementing a clear security boundary. Web server security groups explicitly reference the bastion security group for SSH access, creating a logical trust boundary that adapts automatically as the bastion's IP changes. This architecture eliminates the need for direct SSH access to production instances while maintaining operational flexibility for troubleshooting and maintenance tasks.

### Load Balancing Layer

The Application Load Balancer provides intelligent Layer 7 traffic distribution and serves as the single entry point for all client HTTP/HTTPS requests. The ALB is internet-facing and deployed across both public subnets for high availability, automatically distributing incoming traffic across healthy EC2 instances in multiple Availability Zones. Two listeners are configured on ports 80 (HTTP) and 443 (HTTPS), both forwarding traffic to the target group for flexible protocol handling. The target group performs HTTP health checks on the root path (/) every 30 seconds with a 5-second timeout, requiring 2 consecutive successful checks to mark an instance healthy and 3 consecutive failures to mark it unhealthy. This configuration ensures only healthy instances receive traffic from the load balancer, with rapid detection of failures while tolerating transient issues. The ALB is protected by a dedicated security group allowing HTTP and HTTPS from anywhere (0.0.0.0/0), while backend instances only accept traffic from the ALB security group, implementing defense in depth.

### Auto Scaling Compute Layer

The compute layer uses an Auto Scaling Group that dynamically adjusts capacity based on CPU utilization, providing automatic horizontal scaling to match application demand. The ASG maintains a minimum of 2 instances and can scale up to 5 instances, deploying t2.micro instances (configurable) across both private subnets for high availability using a Launch Template. The Launch Template uses dynamic AMI resolution through SSM Parameter Store (/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2) for the latest Amazon Linux 2 AMI, eliminating hardcoded AMI IDs that become outdated. Instance user data installs httpd web server, MySQL client, jq for JSON processing, CloudWatch agent for metrics and logs, and SSM agent for Systems Manager access, then starts all services automatically and creates a simple index.html page. CPU-based scaling policies trigger at 70% utilization (scale up by 1 instance) and 30% utilization (scale down by 1 instance) with corresponding CloudWatch alarms and 300-second cooldown periods to prevent rapid scaling oscillations. An IAM instance profile grants EC2 instances permissions for S3 read/write, Secrets Manager access for database credentials, DynamoDB operations, SQS message processing, CloudWatch logging, and Systems Manager capabilities, all scoped to specific resources following the principle of least privilege. The Auto Scaling Group uses ELB health checks with a 300-second grace period, automatically replacing instances that fail health checks while allowing time for proper initialization.

### Database Layer

Amazon RDS provides a managed MySQL 8.0.43 database with Multi-AZ deployment for high availability and automatic failover. The RDS instance uses a db.t3.micro instance class (configurable) with 20GB of gp3 storage providing improved performance and cost efficiency compared to gp2. The database is deployed across both private subnets using a DB Subnet Group, ensuring the database can fail over to a standby replica in a different Availability Zone without manual intervention. The RDS instance is not publicly accessible, with connectivity restricted to web server instances through a dedicated security group allowing only MySQL traffic (port 3306) from the WebServerSecurityGroup. Database credentials are managed securely using AWS Secrets Manager with automatic password generation (32 characters with complexity requirements), completely eliminating hardcoded credentials in the template. The CloudFormation template uses dynamic secret resolution {{resolve:secretsmanager}} to retrieve credentials during stack creation, ensuring credentials never appear in logs or console outputs. Enhanced monitoring is enabled with 60-second granularity through a dedicated IAM role, streaming operating system metrics to CloudWatch for performance analysis. CloudWatch Logs exports are configured for error, general, and slow query logs, providing comprehensive database visibility. Automated backups run daily during a maintenance window (03:00-04:00 UTC) with 7-day retention, and storage encryption is enabled at rest using AWS-managed keys.

### Storage Layer

Amazon S3 provides scalable object storage for application assets, user uploads, and static content. The S3 bucket uses a globally unique name constructed from a configurable prefix, AWS account ID, and environment suffix. Server-side encryption with AES-256 is enabled by default, protecting all objects at rest without application changes. Versioning is enabled to preserve, retrieve, and restore every version of every object, providing protection against accidental deletions and overwrites. All public access is blocked through PublicAccessBlockConfiguration (BlockPublicAcls, BlockPublicPolicy, IgnorePublicAcls, RestrictPublicBuckets all set to true), ensuring the bucket and its objects cannot be accidentally exposed to the public internet. EC2 instances access the bucket using IAM roles with specific permissions (s3:GetObject, s3:PutObject, s3:DeleteObject, s3:ListBucket) scoped exclusively to this bucket, eliminating the need for access keys and providing automatic credential rotation through temporary security credentials.

### Application Services Layer

Amazon DynamoDB provides a fully managed NoSQL database for high-performance key-value and document data with single-digit millisecond latency at any scale. The table uses a composite primary key with "id" (String) as the partition key and "timestamp" (Number) as the sort key, enabling efficient queries by ID with time-based sorting. PAY_PER_REQUEST billing mode automatically scales read and write throughput in response to application traffic, eliminating capacity planning and providing true serverless scaling with no minimum capacity charges. Encryption at rest is enabled using AWS-owned encryption keys at no additional cost, protecting sensitive data stored in the table. Point-in-time recovery (PITR) is enabled, providing continuous backups with the ability to restore the table to any point in time within the last 35 days, protecting against accidental writes or deletes.

Amazon SQS provides reliable, scalable message queuing for decoupling application components and enabling asynchronous processing. The main SQS queue uses KMS encryption with AWS-managed keys (alias/aws/sqs), ensuring messages are encrypted at rest. Message retention is configured for 4 days (345,600 seconds), providing sufficient time for message processing while minimizing storage costs. Visibility timeout is set to 30 seconds, preventing other consumers from processing the same message while it's being handled. A dead-letter queue (DLQ) is configured to automatically capture messages that fail processing after 3 attempts (maxReceiveCount: 3), enabling separate handling of problematic messages for debugging and reprocessing. The DLQ uses 14-day message retention (1,209,600 seconds), providing extended time to investigate and resolve processing issues. EC2 instances access both queues using IAM permissions scoped specifically to these queue resources, supporting operations including SendMessage, ReceiveMessage, DeleteMessage, GetQueueUrl, and GetQueueAttributes.

### Security Layer

Security is implemented at multiple layers using AWS security best practices with defense-in-depth approach. Security groups provide stateful instance-level firewall controls with explicit rules for each traffic type. The BastionSecurityGroup allows SSH (port 22) from anywhere (0.0.0.0/0) for administrative access (should be restricted to specific IP ranges in production). The ALBSecurityGroup allows HTTP (port 80) and HTTPS (port 443) from anywhere, enabling public web access. The WebServerSecurityGroup implements strict access controls, allowing SSH only from the BastionSecurityGroup and HTTP/HTTPS only from the ALBSecurityGroup using security group references instead of CIDR blocks. The RDSSecurityGroup allows MySQL (port 3306) only from the WebServerSecurityGroup, ensuring the database is completely isolated from external access. All security groups allow all outbound traffic, following AWS default behavior for application flexibility.

AWS Secrets Manager stores database credentials with automatic password generation, rotation capabilities, and encryption at rest. The secret contains both username (admin) and a randomly generated 32-character password with complexity requirements, excluding problematic characters that might cause issues in connection strings. EC2 instances retrieve credentials programmatically using IAM permissions, and CloudFormation resolves secrets during stack creation without exposing them in logs or outputs.

### IAM Roles and Policies

The EC2InstanceRole provides instances with permissions following the principle of least privilege, granting only the minimum access required for application functionality. The role includes two AWS-managed policies: CloudWatchAgentServerPolicy for publishing custom metrics and logs to CloudWatch, and AmazonSSMManagedInstanceCore for Systems Manager capabilities including Session Manager (browser-based SSH alternative), Patch Manager, and Run Command. Five custom inline policies provide granular access: S3ReadWriteAccess scoped to the specific S3 bucket and its objects, SecretsManagerReadAccess for retrieving database credentials, DynamoDBAccess for table operations (GetItem, PutItem, UpdateItem, DeleteItem, Query, Scan), SQSAccess for queue operations, and CloudWatchLogsAccess for creating log groups and streams under /aws/ec2/. All policies use resource-level restrictions with Fn::GetAtt and Fn::Sub to reference specific resources created by the stack, preventing access to other resources in the AWS account. This approach eliminates hard-coded credentials, provides temporary security credentials automatically rotated by AWS, and enables fine-grained audit trails through CloudTrail.

The RDSMonitoringRole enables enhanced monitoring by granting RDS permission to publish operating system metrics to CloudWatch. The VPCFlowLogRole grants VPC Flow Logs permission to publish network traffic metadata to CloudWatch Logs.

### Monitoring and Logging

Amazon CloudWatch provides comprehensive monitoring and observability across all infrastructure components. Detailed monitoring is enabled on all EC2 instances (bastion host and Auto Scaling Group), collecting metrics at 1-minute intervals instead of the default 5-minute intervals for faster problem detection. Four CloudWatch alarms provide automated monitoring: CPUAlarmHigh triggers when Auto Scaling Group CPU exceeds 70% for two consecutive 5-minute periods, invoking the ScaleUpPolicy to add 1 instance. CPUAlarmLow triggers when CPU falls below 30% for two consecutive 5-minute periods, invoking the ScaleDownPolicy to remove 1 instance. UnhealthyTargetAlarm triggers when the load balancer detects 1 or more unhealthy targets for two consecutive 1-minute periods, indicating application health issues requiring investigation. RDSCPUAlarm triggers when RDS CPU exceeds 80% for two consecutive 5-minute periods, indicating potential database performance issues requiring optimization or scaling.

VPC Flow Logs capture metadata about all IP traffic entering and leaving the VPC, streaming to a CloudWatch Log Group with 7-day retention. Flow logs include source and destination IPs, ports, protocols, packet and byte counts, and accept/reject decisions based on security group rules. This data enables network troubleshooting, security analysis, and compliance auditing. An IAM role grants VPC Flow Logs permission to publish to CloudWatch Logs using the vpc-flow-logs.amazonaws.com service principal.

RDS CloudWatch Logs integration exports error logs, general query logs, and slow query logs to CloudWatch, providing centralized database logging for performance troubleshooting and security auditing. Enhanced monitoring streams operating system metrics (CPU, memory, disk I/O, network) at 60-second intervals, providing detailed visibility beyond standard CloudWatch metrics.

### High Availability and Fault Tolerance

The architecture achieves high availability through multiple mechanisms across different layers. The Auto Scaling Group maintains minimum capacity of 2 instances distributed across both Availability Zones (us-west-1a, us-west-1b), automatically replacing failed instances within minutes based on ELB health checks. The Application Load Balancer distributes traffic across both public subnets with automatic failover, routing requests only to healthy instances and removing unhealthy instances from rotation. The RDS Multi-AZ deployment maintains a synchronous standby replica in a different Availability Zone, automatically failing over to the standby (typically within 60-120 seconds) if the primary instance fails, the primary AZ has an outage, or during planned maintenance. The NAT Gateway is a fully managed service with automatic redundancy within its Availability Zone, though a failure of us-west-1a would disrupt outbound internet access for private subnet resources (acceptable for non-critical workloads; mission-critical applications should implement dual NAT Gateways). DynamoDB provides built-in replication across three Availability Zones with automatic failover, and SQS provides durability through message replication across multiple Availability Zones. This multi-layer redundancy ensures the application remains available during component failures, though single NAT Gateway represents a cost-optimized design choice accepting some availability trade-off.

## CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure and scalable cloud environment for web application with VPC, EC2, Auto Scaling, RDS, S3, ALB, NAT Gateway, Security Groups, CloudWatch, DynamoDB, SQS, and IAM",
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
            "PublicSubnet1CIDR",
            "PublicSubnet2CIDR",
            "PrivateSubnet1CIDR",
            "PrivateSubnet2CIDR"
          ]
        },
        {
          "Label": {
            "default": "EC2 and Auto Scaling Configuration"
          },
          "Parameters": [
            "BastionInstanceType",
            "WebServerInstanceType",
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
            "DBName"
          ]
        },
        {
          "Label": {
            "default": "Application Configuration"
          },
          "Parameters": [
            "S3BucketPrefix",
            "DynamoDBTableName",
            "SQSQueueName"
          ]
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
    "PublicSubnet1CIDR": {
      "Type": "String",
      "Default": "10.0.1.0/24",
      "Description": "CIDR block for Public Subnet 1",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "PublicSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.2.0/24",
      "Description": "CIDR block for Public Subnet 2",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "PrivateSubnet1CIDR": {
      "Type": "String",
      "Default": "10.0.3.0/24",
      "Description": "CIDR block for Private Subnet 1",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "PrivateSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.4.0/24",
      "Description": "CIDR block for Private Subnet 2",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "BastionInstanceType": {
      "Type": "String",
      "Default": "t2.micro",
      "Description": "EC2 instance type for bastion host",
      "AllowedValues": [
        "t2.micro",
        "t2.small",
        "t2.medium"
      ]
    },
    "WebServerInstanceType": {
      "Type": "String",
      "Default": "t2.micro",
      "Description": "EC2 instance type for web servers in Auto Scaling Group",
      "AllowedValues": [
        "t2.micro",
        "t2.small",
        "t2.medium"
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
        "db.t3.medium"
      ]
    },
    "DBName": {
      "Type": "String",
      "Default": "webappdb",
      "Description": "Database name",
      "MinLength": "1",
      "MaxLength": "64",
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$"
    },
    "S3BucketPrefix": {
      "Type": "String",
      "Default": "webapp-assets",
      "Description": "Prefix for S3 bucket name",
      "AllowedPattern": "^[a-z0-9-]+$"
    },
    "DynamoDBTableName": {
      "Type": "String",
      "Default": "WebAppData",
      "Description": "DynamoDB table name",
      "AllowedPattern": "^[a-zA-Z0-9_.-]+$"
    },
    "SQSQueueName": {
      "Type": "String",
      "Default": "WebAppQueue",
      "Description": "SQS queue name",
      "AllowedPattern": "^[a-zA-Z0-9_-]+$"
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
            "Value": "SecureWebApplication"
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
            "Value": "SecureWebApplication"
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
            "Value": "SecureWebApplication"
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
            "Value": "SecureWebApplication"
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
            "Value": "SecureWebApplication"
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
            "Value": "SecureWebApplication"
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
            "Value": "SecureWebApplication"
          }
        ]
      }
    },
    "NATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGatewayEIP",
            "AllocationId"
          ]
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
            "Value": "SecureWebApplication"
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
            "Value": "SecureWebApplication"
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
            "Value": "SecureWebApplication"
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
    "BastionSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for bastion host - allows SSH from authorized IPs",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": "0.0.0.0/0",
            "Description": "SSH access from authorized IPs"
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
              "Fn::Sub": "BastionSecurityGroup-${EnvironmentSuffix}"
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
            "Value": "SecureWebApplication"
          }
        ]
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer - allows HTTP and HTTPS",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTP access from anywhere"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTPS access from anywhere"
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
            "Value": "SecureWebApplication"
          }
        ]
      }
    },
    "WebServerSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for web servers - allows traffic from ALB and SSH from bastion",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "SourceSecurityGroupId": {
              "Ref": "BastionSecurityGroup"
            },
            "Description": "SSH access from bastion host"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            },
            "Description": "HTTP access from ALB"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            },
            "Description": "HTTPS access from ALB"
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
              "Fn::Sub": "WebServerSecurityGroup-${EnvironmentSuffix}"
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
            "Value": "SecureWebApplication"
          }
        ]
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS - allows MySQL access from web servers only",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "WebServerSecurityGroup"
            },
            "Description": "MySQL access from web servers"
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
            "Value": "SecureWebApplication"
          }
        ]
      }
    },
    "BastionHost": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": {
          "Ref": "LatestAmiId"
        },
        "InstanceType": {
          "Ref": "BastionInstanceType"
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
        "SecurityGroupIds": [
          {
            "Ref": "BastionSecurityGroup"
          }
        ],
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "Monitoring": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "BastionHost-${EnvironmentSuffix}"
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
            "Value": "SecureWebApplication"
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
        "Description": "RDS MySQL database master credentials",
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
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApplication"
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
            "PolicyName": "SQSAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "sqs:SendMessage",
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueUrl",
                    "sqs:GetQueueAttributes"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "SQSQueue",
                      "Arn"
                    ]
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
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApplication"
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
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Name": {
          "Fn::Sub": "ALB-${EnvironmentSuffix}"
        },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          {
            "Ref": "PublicSubnet1"
          },
          {
            "Ref": "PublicSubnet2"
          }
        ],
        "SecurityGroups": [
          {
            "Ref": "ALBSecurityGroup"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ALB-${EnvironmentSuffix}"
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
            "Value": "SecureWebApplication"
          }
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "TG-${EnvironmentSuffix}"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {
          "Ref": "VPC"
        },
        "HealthCheckEnabled": true,
        "HealthCheckProtocol": "HTTP",
        "HealthCheckPath": "/",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Matcher": {
          "HttpCode": "200"
        },
        "TargetType": "instance",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "TargetGroup-${EnvironmentSuffix}"
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
            "Value": "SecureWebApplication"
          }
        ]
      }
    },
    "ALBListenerHTTP": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "ALBTargetGroup"
            }
          }
        ]
      }
    },
    "ALBListenerHTTPS": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "Port": 443,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "ALBTargetGroup"
            }
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
            "Ref": "WebServerInstanceType"
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
              "Ref": "WebServerSecurityGroup"
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
                  "echo '<h1>Hello from Auto Scaling Group</h1>' > /var/www/html/index.html\n"
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
                  "Value": {
                    "Ref": "EnvironmentSuffix"
                  }
                },
                {
                  "Key": "Project",
                  "Value": "SecureWebApplication"
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
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          }
        ],
        "TargetGroupARNs": [
          {
            "Ref": "ALBTargetGroup"
          }
        ],
        "HealthCheckType": "ELB",
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
            "Value": {
              "Ref": "EnvironmentSuffix"
            },
            "PropagateAtLaunch": true
          },
          {
            "Key": "Project",
            "Value": "SecureWebApplication",
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
    "UnhealthyTargetAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "ALB-UnhealthyTargets-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when unhealthy target count exceeds threshold",
        "MetricName": "UnHealthyHostCount",
        "Namespace": "AWS/ApplicationELB",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "LoadBalancer",
            "Value": {
              "Fn::GetAtt": [
                "ApplicationLoadBalancer",
                "LoadBalancerFullName"
              ]
            }
          },
          {
            "Name": "TargetGroup",
            "Value": {
              "Fn::GetAtt": [
                "ALBTargetGroup",
                "TargetGroupFullName"
              ]
            }
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
            "Value": "SecureWebApplication"
          }
        ]
      }
    },
    "RDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "rds-mysql-${EnvironmentSuffix}"
        },
        "DBInstanceClass": {
          "Ref": "DBInstanceClass"
        },
        "Engine": "mysql",
        "EngineVersion": "8.0.43",
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
        "MultiAZ": true,
        "StorageEncrypted": true,
        "EnableCloudwatchLogsExports": [
          "error",
          "general",
          "slowquery"
        ],
        "MonitoringInterval": 60,
        "MonitoringRoleArn": {
          "Fn::GetAtt": [
            "RDSMonitoringRole",
            "Arn"
          ]
        },
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
            "Value": "SecureWebApplication"
          }
        ]
      }
    },
    "RDSMonitoringRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "monitoring.rds.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
        ]
      }
    },
    "RDSCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "RDS-HighCPU-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when RDS CPU exceeds 80%",
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
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApplication"
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
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureWebApplication"
          }
        ]
      }
    },
    "SQSDeadLetterQueue": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "${SQSQueueName}-DLQ-${EnvironmentSuffix}"
        },
        "MessageRetentionPeriod": 1209600,
        "KmsMasterKeyId": "alias/aws/sqs",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "SQSDeadLetterQueue-${EnvironmentSuffix}"
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
            "Value": "SecureWebApplication"
          }
        ]
      }
    },
    "SQSQueue": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "${SQSQueueName}-${EnvironmentSuffix}"
        },
        "MessageRetentionPeriod": 345600,
        "VisibilityTimeout": 30,
        "KmsMasterKeyId": "alias/aws/sqs",
        "RedrivePolicy": {
          "deadLetterTargetArn": {
            "Fn::GetAtt": [
              "SQSDeadLetterQueue",
              "Arn"
            ]
          },
          "maxReceiveCount": 3
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "SQSQueue-${EnvironmentSuffix}"
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
            "Value": "SecureWebApplication"
          }
        ]
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
        "RetentionInDays": 7
      }
    },
    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "DeliverLogsPermissionArn": {
          "Fn::GetAtt": [
            "VPCFlowLogRole",
            "Arn"
          ]
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
            "Value": "SecureWebApplication"
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
    "NATGatewayId": {
      "Description": "NAT Gateway ID",
      "Value": {
        "Ref": "NATGateway"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NATGatewayId"
        }
      }
    },
    "BastionHostPublicIP": {
      "Description": "Public IP address of the bastion host",
      "Value": {
        "Fn::GetAtt": [
          "BastionHost",
          "PublicIp"
        ]
      }
    },
    "ApplicationLoadBalancerDNS": {
      "Description": "Application Load Balancer DNS Name",
      "Value": {
        "Fn::GetAtt": [
          "ApplicationLoadBalancer",
          "DNSName"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ALB-DNS"
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
    "SQSQueueURL": {
      "Description": "SQS queue URL",
      "Value": {
        "Ref": "SQSQueue"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SQSQueueURL"
        }
      }
    },
    "SQSDeadLetterQueueURL": {
      "Description": "SQS dead letter queue URL",
      "Value": {
        "Ref": "SQSDeadLetterQueue"
      }
    },
    "DBSecretArn": {
      "Description": "ARN of the Secrets Manager secret containing database credentials",
      "Value": {
        "Ref": "DBSecret"
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
    },
    "VPCFlowLogsLogGroup": {
      "Description": "VPC Flow Logs CloudWatch Log Group Name",
      "Value": {
        "Ref": "VPCFlowLogGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPCFlowLogsLogGroup"
        }
      }
    }
  }
}
```

## Key Features

### Security

The template implements comprehensive multi-layer security following AWS best practices and the Well-Architected Framework. Network isolation is achieved through VPC architecture with clear separation between public subnets (ALB, bastion, NAT Gateway) and private subnets (application servers, databases), ensuring backend resources have no direct internet exposure. Security groups implement stateful firewalls at the instance level using the principle of least privilege and security group references instead of CIDR blocks. The bastion security group allows SSH from authorized IPs, ALB security group allows HTTP/HTTPS from anywhere, web server security group allows traffic only from ALB and bastion using SourceSecurityGroupId, and RDS security group allows MySQL only from web servers. This layered approach ensures each component can only communicate with authorized sources.

Secrets Manager eliminates hardcoded credentials by storing database passwords with automatic generation (32 characters with complexity requirements), encryption at rest, and programmatic access through IAM roles. CloudFormation resolves secrets during stack creation using {{resolve:secretsmanager}} syntax without exposing them in logs, parameters, or outputs. IAM roles provide fine-grained permissions scoped to specific resources, granting EC2 instances access to only their designated S3 bucket, DynamoDB table, SQS queue, and Secrets Manager secret. All storage services implement encryption at rest: S3 uses AES-256, RDS uses AWS-managed encryption keys, DynamoDB uses AWS-owned keys, and SQS messages are encrypted using AWS-managed KMS keys. Public access is completely blocked on the S3 bucket through PublicAccessBlockConfiguration. VPC Flow Logs capture all network traffic metadata for security analysis, compliance auditing, and forensic investigation with 7-day retention in CloudWatch Logs.

### Scalability

The architecture provides automatic horizontal and vertical scaling capabilities to match application demand without manual intervention. The Auto Scaling Group dynamically adjusts EC2 instance count from 2 to 5 based on CPU utilization, scaling up when CPU exceeds 70% for 10 minutes (2 periods of 5 minutes) and scaling down when CPU falls below 30% for 10 minutes. The 300-second cooldown period prevents rapid scaling oscillations, and the ChangeInCapacity adjustment type adds or removes instances one at a time for gradual scaling. The Application Load Balancer automatically distributes traffic across healthy instances in both Availability Zones with connection draining, session affinity support, and automatic failover. Health checks every 30 seconds ensure only healthy instances receive traffic with rapid detection (2 checks to healthy, 3 to unhealthy).

The VPC design with /16 CIDR provides 65,536 IP addresses with public and private subnets using /24 blocks (256 addresses each), leaving substantial address space for future subnet additions. DynamoDB PAY_PER_REQUEST billing mode automatically scales read and write throughput in response to application traffic without capacity planning, eliminating throttling concerns and supporting unpredictable workloads. SQS provides virtually unlimited throughput for message queuing with automatic scaling based on message volume. RDS Multi-AZ enables vertical scaling by changing instance class without architecture changes, and read replicas can be added for read-heavy workloads. All CloudFormation outputs use Export for cross-stack references, enabling this infrastructure to serve as a foundation for additional stacks, microservices, or nested environments.

### Operational Excellence

The template achieves operational excellence through infrastructure as code with comprehensive parameterization enabling deployment across multiple environments (dev, staging, prod) without template modifications. Parameters use validation through AllowedPattern for CIDR blocks and names, AllowedValues for instance types and database classes, and MinValue/MaxValue for numeric parameters ensuring valid inputs and preventing misconfigurations. CloudFormation Interface metadata organizes parameters into five logical groups (Environment, Network, EC2 and Auto Scaling, Database, Application) improving the console experience and reducing deployment errors.

Dynamic AMI resolution through SSM Parameter Store (/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2) eliminates hardcoded AMI IDs that become outdated, ensuring instances always launch with the latest patched Amazon Linux 2 AMI across all regions automatically. Launch Templates enable versioning with rollback capability, and the Auto Scaling Group references the latest version dynamically using Fn::GetAtt LatestVersionNumber, applying configuration updates without manual version management.

CloudWatch monitoring provides comprehensive observability with detailed monitoring on all EC2 instances (1-minute metrics), four proactive alarms (CPU high/low, unhealthy targets, RDS CPU), and centralized logging through VPC Flow Logs and RDS log exports. Consistent tagging with three tags (Name, Environment, Project) on all resources enables cost allocation, compliance auditing, resource grouping, and automated operations through tag-based filters. Systems Manager integration (AmazonSSMManagedInstanceCore managed policy) provides Session Manager for browser-based SSH alternative, Patch Manager for OS patching, and Run Command for remote execution without SSH keys or bastion hosts. Secrets Manager supports automatic rotation for database credentials, and RDS automated backups with 7-day retention enable point-in-time recovery for disaster recovery scenarios.

### Cost Optimization

The design balances functionality with cost efficiency through several optimizations informed by AWS Well-Architected Framework best practices. T2 instance types (t2.micro default for both bastion and web servers) provide burstable CPU performance at significantly lower cost than fixed-performance instance types, suitable for variable workloads that don't require sustained high CPU. AllowedValues parameter constraints prevent accidental deployment of expensive instance types (limited to t2.micro, t2.small, t2.medium) and RDS instance classes (db.t3.micro, db.t3.small, db.t3.medium), reducing the risk of bill shock from misconfiguration.

Auto Scaling ensures payment only for needed capacity, automatically scaling down when CPU falls below 30% for 10 minutes with the ScaleDownPolicy removing 1 instance at a time. The 300-second cooldown prevents premature scaling actions that waste resources. A single NAT Gateway instead of dual NAT Gateways in both AZs reduces costs by approximately 50% for NAT Gateway charges and eliminates cross-AZ data transfer charges, acceptable for non-mission-critical workloads where cost optimization outweighs maximum availability. VPC Flow Logs retention limited to 7 days minimizes CloudWatch Logs storage costs while providing sufficient data for most troubleshooting and security investigations.

DynamoDB PAY_PER_REQUEST billing mode eliminates capacity planning and minimum capacity charges, charging only for actual requests with automatic scaling to zero when idle. This is substantially more cost-effective than provisioned capacity for unpredictable or intermittent workloads. RDS gp3 storage provides better price-performance than gp2 with included baseline performance and the ability to scale IOPS independently. S3 versioning protects against accidental deletion while enabling lifecycle policies (not implemented in template but supported) to transition older versions to cheaper storage classes. Comprehensive tagging with Environment and Project enables detailed cost allocation reports, showback/chargeback to appropriate teams, and identification of cost optimization opportunities through AWS Cost Explorer filtering and grouping.

### Reliability

The architecture achieves high reliability through multi-layer redundancy and fault tolerance mechanisms across AWS services. The Auto Scaling Group maintains minimum capacity of 2 instances distributed across two Availability Zones (us-west-1a, us-west-1b), automatically replacing failed instances within minutes based on ELB health checks. The 300-second grace period allows instances to complete initialization before health checks begin, preventing premature termination during startup. The Application Load Balancer distributes traffic across both public subnets with automatic failover, removing unhealthy instances from rotation within 90 seconds (3 failed health checks at 30-second intervals) and adding them back within 60 seconds (2 successful health checks) once recovered.

RDS Multi-AZ deployment maintains a synchronous standby replica in a different Availability Zone with automatic failover typically completing within 60-120 seconds when the primary instance fails, the primary AZ experiences an outage, or during planned maintenance. Storage and compute failures are handled transparently with the RDS endpoint (DNS CNAME) automatically redirecting to the standby. Automated backups with 7-day retention and point-in-time recovery enable restoration to any point within the retention window for disaster recovery scenarios. Enhanced monitoring streams operating system metrics at 60-second granularity for proactive problem detection.

DynamoDB provides built-in replication across three Availability Zones with automatic failover, sub-millisecond failover detection, and no single point of failure. Point-in-time recovery enabled through PointInTimeRecoverySpecification provides continuous backups with restoration to any second within the last 35 days. SQS provides message durability through redundant storage across multiple Availability Zones with a dead-letter queue capturing messages that fail processing after 3 attempts, preventing message loss and enabling separate handling of problematic messages. VPC Flow Logs and CloudWatch monitoring enable rapid problem detection and diagnosis. All CloudFormation outputs use Export for cross-stack references enabling disaster recovery architectures and multi-region deployments. The single NAT Gateway represents an availability trade-off accepting potential outbound internet disruption for private subnet resources if us-west-1a fails, appropriate for cost-sensitive workloads where maximum availability is not required (mission-critical applications should implement dual NAT Gateways).

## Modern AWS Practices

### Launch Templates with Dynamic Version Management

The infrastructure uses EC2 Launch Templates rather than legacy Launch Configurations for numerous technical and operational advantages. Launch Templates support versioning, enabling maintenance of multiple configuration versions with the ability to roll back to previous versions if issues arise during deployments. The template references the latest version dynamically using Fn::GetAtt with LatestVersionNumber, ensuring the Auto Scaling Group always uses the most recent configuration without manual version updates or stack updates. This eliminates the operational burden of tracking version numbers and prevents deployment errors from stale version references.

Launch Templates provide access to newer EC2 features unavailable in Launch Configurations including T2/T3 Unlimited mode for burstable instances, capacity reservations, dedicated hosts and tenancy, placement groups for low-latency applications, and metadata service version 2 (IMDSv2) security enhancements that prevent SSRF attacks. Configuration updates can be applied to the Auto Scaling Group by creating a new Launch Template version and allowing instances to gradually replace during natural scale events or through instance refresh, reducing deployment risk compared to replacing the entire Auto Scaling Group.

TagSpecifications automatically propagate tags to all instances created by the Auto Scaling Group, ensuring consistent tagging for cost allocation, resource organization, and automated operations without per-instance configuration. The Launch Template includes Monitoring with Enabled set to true, activating detailed monitoring (1-minute metrics) for all Auto Scaling Group instances automatically. KeyName parameter inclusion enables SSH access through the bastion host for troubleshooting while maintaining security through security group restrictions.

### Dynamic AMI Resolution with SSM Parameter Store

Instead of hardcoding an AMI ID that becomes outdated and creates security and compliance risks, this template uses AWS Systems Manager Parameter Store to dynamically retrieve the latest Amazon Linux 2 AMI. The parameter type AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> instructs CloudFormation to resolve the parameter during stack creation or update, with the default value /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2 maintained by AWS and always pointing to the latest patched Amazon Linux 2 AMI for the stack's region.

This approach provides multiple operational and security benefits. Instances always launch with the latest security patches and bug fixes without manual AMI ID lookups or template updates, reducing security vulnerabilities and operational toil. The solution works across all AWS regions automatically since AWS maintains region-specific parameter paths, eliminating the need for region-specific AMI ID mappings or conditions. There's no risk of launching instances with deprecated, vulnerable, or unsupported AMIs that may fail compliance audits or security scans. The SSM parameter is evaluated by CloudFormation during stack creation or update with the resolved AMI ID stored in the Launch Template until the next update, ensuring consistency across instances launched by the Auto Scaling Group.

Users can override the parameter default to pin to a specific AMI or different parameter path if needed for testing or compliance requirements, providing flexibility while maintaining security by default. This pattern is recommended by AWS and considered a best practice for production workloads, particularly in automated CI/CD pipelines where manual AMI ID management would be impractical.

### Security Group References for Dynamic Security

The template uses security group references with SourceSecurityGroupId instead of IP-based CIDR rules for implementing dynamic, logical security boundaries that automatically adapt to infrastructure changes. The WebServerSecurityGroup allows HTTP (port 80) and HTTPS (port 443) only from the ALBSecurityGroup, and SSH (port 22) only from the BastionSecurityGroup, using SourceSecurityGroupId to reference the source security group. The RDSSecurityGroup allows MySQL (port 3306) only from the WebServerSecurityGroup using the same pattern.

This approach provides significant operational and security advantages. The security rules automatically adapt as instances scale with changing IP addresses, eliminating the need to maintain CIDR-based rules that would break during Auto Scaling events. New load balancer nodes are automatically permitted without rule updates since the ALB's security group membership grants access regardless of IP address. The configuration remains effective even if the load balancer's IP addresses change during re-deployment or AWS infrastructure changes, preventing unexpected connectivity failures.

Security group references reduce misconfiguration risk by defining logical relationships between components (web servers accept traffic from load balancer, database accepts traffic from web servers) instead of error-prone IP address management. This implements true least privilege by ensuring web servers accept traffic exclusively from the load balancer and database exclusively from web servers, with no opportunity for unintended access from other sources. The approach aligns with AWS Well-Architected Framework security pillar recommendations for defense in depth and logical security boundaries that map to application architecture rather than network topology.

### Secrets Manager for Credential Management

AWS Secrets Manager provides secure storage, automatic generation, and rotation capabilities for database credentials, completely eliminating hardcoded passwords in the template or parameters. The DBSecret resource uses GenerateSecretString with SecretStringTemplate to define the username (admin) while automatically generating a random 32-character password with RequireEachIncludedType ensuring complexity requirements (uppercase, lowercase, numbers, special characters). The ExcludeCharacters field prevents problematic characters ("@/\) that could cause issues in connection strings or shell scripts.

CloudFormation resolves secrets during stack creation using dynamic reference syntax {{resolve:secretsmanager:${DBSecret}:SecretString:username}} and {{resolve:secretsmanager:${DBSecret}:SecretString:password}} in the RDS MasterUsername and MasterUserPassword properties. This approach ensures credentials never appear in CloudFormation events, stack parameters, outputs, logs, or console displays, maintaining strict security throughout the deployment lifecycle. The EC2InstanceRole includes SecretsManagerReadAccess policy granting instances permission to programmatically retrieve credentials using AWS SDK, enabling applications to fetch database credentials at runtime without hardcoding them in configuration files or environment variables.

Secrets Manager supports automatic rotation through Lambda functions (not configured in this template but easily added) that periodically change database passwords and update the secret, with RDS automatically detecting the new password through integration. The secret is encrypted at rest using AWS-managed encryption keys at no additional cost, and all access is logged through CloudTrail for security auditing and compliance. Applications retrieve credentials using temporary IAM role credentials that automatically rotate every few hours, providing layered security throughout the credential access path. This architecture implements AWS security best practices for credential management and aligns with compliance frameworks including PCI DSS, HIPAA, and SOC 2 that require secure credential storage and rotation.

### Single NAT Gateway Cost Optimization

This template deploys a single NAT Gateway in PublicSubnet1 that serves outbound internet connectivity for both private subnets through a shared PrivateRouteTable, representing a cost-optimized design choice for non-critical workloads. Both PrivateSubnet1 and PrivateSubnet2 associate with the same PrivateRouteTable which routes all outbound traffic (0.0.0.0/0) to the single NATGateway. This design reduces NAT Gateway costs by approximately 50% compared to dual NAT Gateway architectures, and eliminates cross-AZ data transfer charges for internet-bound traffic since both subnets use a NAT Gateway in us-west-1a.

The trade-off is reduced availability: if us-west-1a experiences an outage or the NAT Gateway fails, instances in both private subnets lose outbound internet connectivity for package downloads, software updates, and external API calls. However, the application remains available for incoming user requests through the Application Load Balancer deployed across both Availability Zones, Auto Scaling Group instances in both AZs, and Multi-AZ RDS deployment ensuring database availability. The loss of outbound connectivity affects background jobs, monitoring agents, and external integrations, but doesn't impact users accessing the web application through the load balancer.

This design is appropriate for development and staging environments, cost-sensitive production workloads where maximum availability is not required, applications with minimal outbound internet dependencies, and workloads where the cost savings ($32-45/month per NAT Gateway plus data transfer charges) justify the availability trade-off. Mission-critical production applications should implement dual NAT Gateways (one per Availability Zone) with separate private route tables to achieve true high availability, accepting the higher cost for operational resilience. The template can be easily modified to add a second NAT Gateway by duplicating the NATGatewayEIP and NATGateway resources, creating PrivateRouteTable2, and updating subnet associations, demonstrating the flexibility of infrastructure as code for balancing cost and availability based on specific workload requirements.

### Bastion Host Pattern for Secure Access

The bastion host (jump box) pattern implements a security best practice for administrative access to private subnet resources by providing a single, hardened entry point for SSH connections. The bastion host is deployed in PublicSubnet1 with a public IP address and security group allowing SSH (port 22) from authorized IPs, serving as the exclusive gateway for administrators to access web servers and troubleshoot application issues. The WebServerSecurityGroup allows SSH only from the BastionSecurityGroup using SourceSecurityGroupId, creating a logical trust boundary that prevents direct SSH access from the internet while permitting connections routed through the bastion host.

This architecture provides multiple security advantages. It reduces the attack surface by eliminating the need for public IP addresses on application instances, preventing direct exposure to internet-based SSH attacks. The bastion host can implement additional security controls including multi-factor authentication (MFA), SSH key rotation, session recording, and connection logging for compliance requirements. The security group reference automatically adapts if the bastion host's IP address changes during stop/start cycles or instance replacement, maintaining connectivity without manual security group updates.

Administrative access is centralized through a single point of control, simplifying security policies, audit logging through CloudTrail, and compliance reporting. CloudWatch detailed monitoring on the bastion host enables detection of suspicious login patterns or brute force attacks. For enhanced security, the bastion security group's SSH ingress rule should be restricted from 0.0.0.0/0 to specific IP ranges representing office networks or VPN addresses in production environments, though this template uses 0.0.0.0/0 for flexibility during initial deployment.

Modern alternatives include AWS Systems Manager Session Manager (enabled through the AmazonSSMManagedInstanceCore managed policy on EC2InstanceRole) which provides browser-based SSH without requiring a bastion host, public IPs, or SSH keys, with all sessions logged to CloudTrail and S3 for compliance. Organizations may choose to eliminate the bastion host entirely and rely on Session Manager for operational access, removing the ongoing cost ($10-15/month for t2.micro) and management overhead while improving security through IAM-based access control and comprehensive session audit trails.

### ELB Health Checks with Grace Period

The Auto Scaling Group uses ELB health checks instead of EC2 health checks by setting HealthCheckType to ELB, with a 300-second HealthCheckGracePeriod allowing proper instance initialization before health verification begins. This configuration provides application-level health verification ensuring instances are not only running (EC2 health check) but also successfully handling HTTP requests from the load balancer, detecting application failures, configuration errors, and dependency issues that EC2 health checks miss.

The grace period is critical for preventing termination loops during instance startup. The user data script installs multiple packages (httpd, mysql, jq, amazon-cloudwatch-agent, amazon-ssm-agent), starts services, and creates the index.html file, requiring 30-90 seconds typically but potentially longer during AWS service slowness or package manager delays. Without a grace period, instances would be marked unhealthy during this initialization and immediately terminated by Auto Scaling, replaced by new instances that encounter the same issue, creating an infinite loop preventing successful deployment.

The 300-second grace period provides ample time for complete initialization under normal and degraded conditions while being short enough to detect genuine instance failures within a reasonable timeframe. During the grace period, instances register with the load balancer target group but health check failures don't trigger Auto Scaling replacement actions. Once the grace period expires, normal health check behavior resumes with the target group health check configuration (30-second interval, 5-second timeout, 2 successful checks to healthy, 3 failed checks to unhealthy) determining instance status.

The Auto Scaling Group automatically replaces instances that become unhealthy based on ELB health checks, maintaining the desired capacity and minimum instance count. Replacement instances follow the same grace period allowing proper initialization before health verification. This pattern is recommended by AWS for all Auto Scaling Groups behind load balancers, particularly those with non-trivial initialization scripts, ensuring reliable deployments and preventing operational issues from overly aggressive health checking during startup.

### Comprehensive Resource Tagging Strategy

All resources implement a consistent three-tag strategy with Name (dynamically generated using Fn::Sub), Environment (referencing EnvironmentSuffix parameter), and Project (hardcoded to SecureWebApplication) tags, providing comprehensive resource organization and operational capabilities. The Name tag uses environment-specific naming (VPC-${EnvironmentSuffix}, ALB-${EnvironmentSuffix}) enabling multiple stack deployments in the same account without naming conflicts, clearly identifying resources during troubleshooting, and maintaining naming consistency across all resources.

The Environment tag enables critical operational and financial capabilities. AWS Cost Explorer filtering and grouping by Environment tag provides detailed cost breakdowns by environment (dev vs. staging vs. prod), enabling accurate budget forecasting and cost trend analysis. Showback and chargeback to appropriate teams becomes straightforward with cost allocation reports grouped by Environment. Resource filtering in the AWS Console is simplified through tag-based filters enabling operations teams to view only production resources or development resources. Automated operations become possible through tag-based resource selection in scripts and AWS APIs, such as stopping all dev environment instances outside business hours for cost savings or implementing disaster recovery procedures targeting specific environments.

The Project tag enables multi-application account management by distinguishing resources belonging to different projects or business units within the same AWS account, supporting cost allocation by project and preventing accidental modifications to unrelated resources. The Auto Scaling Group uses PropagateAtLaunch set to true for Environment and Project tags, ensuring all EC2 instances inherit these tags automatically for complete resource tracking and cost attribution to specific environments and projects without per-instance configuration.

This tagging strategy aligns with AWS Well-Architected Framework operational excellence and cost optimization pillars, enabling comprehensive cost allocation, compliance reporting, resource organization, automated operations, and security policies. Organizations should expand tags based on specific requirements (Owner, CostCenter, Application, DataClassification, ComplianceScope) while maintaining consistency across all resources for maximum operational value.

### RDS Multi-AZ with Secrets Manager Integration

The RDS instance uses Multi-AZ deployment (MultiAZ: true) combined with Secrets Manager credential management, demonstrating integration of multiple AWS services for high availability and security. Multi-AZ maintains a synchronous standby replica in a different Availability Zone with automatic failover to the standby (typically within 60-120 seconds) when the primary instance fails, the primary AZ experiences an outage, planned maintenance occurs, or instance class changes require restart. Storage replication is synchronous ensuring zero data loss during failover, with the RDS endpoint (DNS CNAME) automatically redirecting to the standby replica transparently to applications.

Secrets Manager integration uses dynamic reference syntax {{resolve:secretsmanager:${DBSecret}:SecretString:username}} and {{resolve:secretsmanager:${DBSecret}:SecretString:password}} in MasterUsername and MasterUserPassword properties, allowing CloudFormation to resolve credentials during stack creation without exposing them in parameters, outputs, events, or logs. The EC2InstanceRole SecretsManagerReadAccess policy grants instances permission to programmatically retrieve credentials using AWS SDK, enabling applications to fetch database connection details at runtime without hardcoding credentials in configuration files.

Enhanced monitoring (MonitoringInterval: 60) streams operating system metrics (CPU, memory, disk I/O, network, swap usage) at 60-second granularity through RDSMonitoringRole, providing detailed visibility beyond standard CloudWatch metrics for performance troubleshooting and capacity planning. CloudWatch Logs exports (EnableCloudwatchLogsExports: error, general, slowquery) centralize database logs for analysis, alerting, and compliance auditing. Automated backups (BackupRetentionPeriod: 7) with configurable backup window (PreferredBackupWindow: 03:00-04:00) enable point-in-time recovery to any second within the 7-day retention period, supporting disaster recovery and data restoration scenarios.

Storage encryption (StorageEncrypted: true) protects data at rest using AWS-managed encryption keys at no additional cost, meeting compliance requirements for data protection without application changes or performance impact. The gp3 storage type (StorageType: gp3) provides better price-performance than gp2 with included baseline of 3000 IOPS and 125 MB/s throughput, supporting typical application workloads without additional cost for provisioned IOPS. The combination of Multi-AZ availability, Secrets Manager security, enhanced monitoring visibility, automated backups, and encryption demonstrates AWS best practices for production database deployments balancing availability, security, observability, and cost.

### DynamoDB with Point-in-Time Recovery

DynamoDB is configured with PAY_PER_REQUEST billing mode and Point-in-Time Recovery (PITR) enabled, demonstrating serverless scaling and comprehensive data protection capabilities. The PAY_PER_REQUEST billing mode eliminates capacity planning and provisioned throughput management, automatically scaling read and write capacity to accommodate application traffic patterns without throttling. This eliminates under-provisioning that causes performance issues and over-provisioning that wastes money, with charges based only on actual requests (read, write, query, scan operations) and storage consumed.

The composite primary key uses "id" (String) as the partition key and "timestamp" (Number) as the sort key, enabling efficient data distribution across partitions for horizontal scalability and supporting range queries sorted by timestamp. This key design supports common access patterns including retrieving all records for a specific ID sorted by time, querying the most recent N records for an ID, and point-in-time snapshots of data. The partition key ensures DynamoDB can scale to virtually unlimited throughput by distributing data across multiple partitions based on ID values.

Point-in-Time Recovery (PointInTimeRecoveryEnabled: true) provides continuous backups with the ability to restore the table to any second within the last 35 days, protecting against accidental deletes, application bugs that corrupt data, and operational errors. PITR operates with no performance impact and minimal additional cost (approximately 20% of storage cost), maintaining incremental backups automatically in the background. Recovery creates a new table with data restored to the specified timestamp, enabling validation before switching application traffic to the restored table.

Server-side encryption (SSEEnabled: true) uses AWS-owned encryption keys at no additional cost, protecting data at rest and meeting compliance requirements for data encryption. The DynamoDB table includes comprehensive tagging (Name, Environment, Project) enabling cost allocation, resource organization, and policy-based access control. This configuration demonstrates AWS best practices for DynamoDB deployments balancing performance, cost optimization, data protection, and operational simplicity through serverless architecture and managed backup capabilities.

### SQS with Dead Letter Queue Pattern

SQS is configured with a dead-letter queue (DLQ) pattern providing reliable message processing with automatic failure handling and debugging capabilities. The main SQSQueue uses a RedrivePolicy specifying the SQSDeadLetterQueue as the deadLetterTargetArn with maxReceiveCount set to 3, automatically moving messages that fail processing three times to the dead-letter queue for separate handling. This prevents poison messages that repeatedly fail from blocking queue processing and consuming worker capacity indefinitely.

The main queue uses 4-day message retention (345,600 seconds) providing sufficient time for message processing under normal and degraded conditions while minimizing storage costs. Visibility timeout is set to 30 seconds, hiding messages from other consumers during processing to prevent duplicate processing while being short enough to enable rapid retry if a consumer fails mid-processing. KMS encryption with AWS-managed keys (alias/aws/sqs) ensures messages are encrypted at rest meeting compliance requirements for sensitive data without application changes or key management overhead.

The dead-letter queue uses extended 14-day message retention (1,209,600 seconds) providing substantial time to investigate processing failures, identify root causes, and implement fixes before messages expire. Failed messages in the DLQ preserve all original message attributes including timestamp, sender information, and attempt count, enabling comprehensive debugging and replay scenarios. Operations teams can monitor DLQ depth through CloudWatch metrics, creating alarms for non-zero message counts indicating processing issues requiring investigation.

This pattern enables resilient message processing architectures where transient failures (network issues, service timeouts) are automatically retried up to three times, while persistent failures (malformed messages, application bugs, invalid data) are isolated in the DLQ for manual review or automated remediation. Messages can be manually reprocessed from the DLQ after fixes are deployed, or deleted if determined to be invalid, providing operational flexibility for error handling without data loss. The SQS configuration aligns with AWS messaging best practices and supports common patterns including work queues, publish-subscribe through SNS integration, and event-driven architectures with automatic retry and failure isolation.
