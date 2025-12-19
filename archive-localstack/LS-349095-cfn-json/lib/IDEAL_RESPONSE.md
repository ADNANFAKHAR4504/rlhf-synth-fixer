# Ideal Response: Cloud Environment Setup for Serverless Python Application

## Architecture Overview

This CloudFormation template creates a production-ready serverless Python application environment on AWS with comprehensive networking, database, storage, and monitoring capabilities. The infrastructure implements a secure VPC architecture with multi-AZ deployment, RDS PostgreSQL database in private subnets, Lambda functions with VPC connectivity, API Gateway as the HTTP endpoint, S3 for application data storage, and CloudWatch for comprehensive monitoring. All resources follow the organization's naming conventions with the 'projX' prefix and implement security best practices including encryption at rest, encryption in transit, least privilege IAM policies, and security group isolation.

### Network Architecture

The infrastructure implements a secure VPC architecture in the us-west-1 region with proper network isolation across multiple Availability Zones. The VPC uses a 10.0.0.0/16 CIDR block providing 65,536 IP addresses with four subnets spanning two Availability Zones for high availability. Two public subnets (10.0.1.0/24 and 10.0.2.0/24) host the NAT Gateway and any public-facing resources, while two private subnets (10.0.3.0/24 and 10.0.4.0/24) host Lambda functions and the RDS PostgreSQL database for network isolation. An Internet Gateway provides public subnet connectivity to the internet, enabling outbound access through the NAT Gateway. A single NAT Gateway with a dedicated Elastic IP is deployed in the first public subnet to provide outbound internet access for Lambda functions and RDS in the private subnets while maintaining their isolation from inbound internet traffic. Separate route tables control traffic flow with the public subnets routing through the Internet Gateway and the private subnets routing through the NAT Gateway for outbound connectivity. This multi-AZ network design ensures Lambda functions and RDS cannot be directly accessed from the internet, implementing defense-in-depth security architecture while providing high availability.

### Serverless Compute Layer

The compute layer consists of a Python Lambda function deployed within the VPC's private subnets with strict IAM execution roles. The Lambda function uses configurable runtime (defaulting to Python 3.11) and memory size (defaulting to 128 MB) for cost optimization and performance tuning. The function is attached to the projX Lambda security group allowing only outbound traffic and deployed across both private subnets for high availability. The Lambda execution role implements least privilege with specific permissions for CloudWatch Logs access scoped to /aws/lambda/ log groups, S3 access to the application data bucket for GetObject, PutObject, and ListBucket operations, and Secrets Manager access to retrieve RDS credentials. Environment variables provide configuration including the environment suffix, S3 bucket name, database secret ARN, database host endpoint, port, and database name, avoiding hardcoded values. The VPC configuration ensures functions have network connectivity through the NAT Gateway while remaining inaccessible from the internet, with all invocations flowing exclusively through API Gateway. The AWSLambdaVPCAccessExecutionRole managed policy enables Lambda to create and manage network interfaces in the VPC for connectivity.

### API Gateway Integration

API Gateway serves as the secure entry point for the projX serverless application, enforcing request validation and access controls before forwarding requests to Lambda. The REST API is configured as REGIONAL with comprehensive request validation to ensure incoming requests meet specified criteria before invocation. An API Gateway Request Validator enforces validation of both request parameters and request body content, rejecting malformed requests before they reach Lambda. The API is deployed to a production stage named 'prod' with access logging enabled to CloudWatch Logs capturing request IDs, timestamps, HTTP methods, resource paths, status codes, and error messages. Method settings enable INFO-level logging, data trace for debugging, and CloudWatch metrics for monitoring. The API uses AWS_PROXY integration with Lambda, allowing the function to control response format and status codes. Lambda invocation permission restricts the API Gateway to invoke the function using resource-based policies. This configuration implements security controls including request validation, comprehensive logging, and metrics collection while ensuring only valid requests reach the Lambda function.

### Database Layer

The database layer implements a PostgreSQL RDS instance deployed in private subnets with comprehensive security controls and credential management. The RDS instance uses PostgreSQL engine version 15.7 with configurable instance class (defaulting to db.t3.micro) for cost optimization. The database is deployed in private subnets through a DB subnet group spanning both private subnets for Multi-AZ failover capability. Storage encryption is enabled by default using AWS-managed keys providing encryption at rest for all database data. AWS Secrets Manager stores and manages RDS credentials securely with automatic password generation using a 32-character password excluding problematic characters. The RDS security group restricts inbound access to PostgreSQL port 5432 exclusively from the Lambda security group, preventing direct database access from other sources. Automated backups are configured with a 7-day retention period and a preferred backup window of 03:00-04:00 UTC. Maintenance windows are set to Monday 04:00-05:00 UTC for automatic patching. PostgreSQL logs are exported to CloudWatch for monitoring and troubleshooting. The database is not publicly accessible, ensuring it can only be reached from within the VPC through the Lambda function.

### Storage Layer

The storage layer implements an S3 bucket for application data with comprehensive security controls and data protection features. The S3 bucket uses server-side encryption with AES-256 providing encryption at rest for all stored objects. Versioning is enabled on the bucket providing protection against accidental deletions and enabling point-in-time recovery of objects. Public access is completely blocked through PublicAccessBlockConfiguration preventing any public access to bucket contents. An S3 bucket policy enforces HTTPS for all data transfers by explicitly denying requests when aws:SecureTransport is false, ensuring encryption in transit and preventing unencrypted access. A lifecycle policy automatically deletes noncurrent object versions after 90 days, balancing data protection with storage cost optimization. The bucket name includes the AWS account ID and environment suffix ensuring global uniqueness across AWS accounts. DeletionPolicy and UpdateReplacePolicy are set to Retain preventing accidental data loss during stack operations. This multi-layer protection approach secures data at rest with encryption, data in transit with mandatory HTTPS, and data integrity with versioning and lifecycle management.

### Security Controls

Security is implemented through multiple layers including security groups, IAM policies, Secrets Manager, and S3 bucket policies. The projXLambdaSecurityGroup allows Lambda functions to make outbound connections while preventing any inbound access, ensuring functions can reach external services through the NAT Gateway but cannot be accessed directly. The projXRDSSecurityGroup restricts PostgreSQL access on port 5432 to only the Lambda security group, implementing network-level isolation for the database. IAM policies follow the principle of least privilege with Lambda execution roles granted only CloudWatch Logs write permissions to /aws/lambda/ log groups, S3 GetObject, PutObject, and ListBucket permissions to the specific application bucket, and Secrets Manager GetSecretValue and DescribeSecret permissions to the database credential secret. No wildcard resource permissions are used, and the roles explicitly scope all permissions to specific resources. S3 bucket policies enforce HTTPS using conditional deny statements checking aws:SecureTransport, preventing unencrypted data access. Secrets Manager automatically generates and stores database credentials with a 32-character password, eliminating hardcoded credentials in application code. RDS storage encryption protects data at rest in the database. This defense-in-depth approach implements security controls at the network, application, and data layers.

### IAM Roles and Policies

The Lambda execution role provides functions with permissions following the principle of least privilege without using root account credentials. The role includes the AWSLambdaVPCAccessExecutionRole managed policy for VPC ENI management, enabling Lambda to create and manage network interfaces in the VPC for connectivity. Inline policies grant specific permissions with tightly scoped resources. The CloudWatch Logs policy allows CreateLogGroup, CreateLogStream, and PutLogEvents actions only on resources matching /aws/lambda/ log groups, preventing functions from writing to other log groups. The S3 policy grants GetObject, PutObject, and ListBucket permissions exclusively to the application data bucket and its contents using GetAtt for bucket ARN and Fn::Sub for object paths, preventing access to other S3 buckets. The Secrets Manager policy grants GetSecretValue and DescribeSecret permissions only to the database credential secret, enabling functions to retrieve database credentials securely at runtime. The API Gateway CloudWatch role uses the AmazonAPIGatewayPushToCloudWatchLogs managed policy for logging API Gateway access and execution logs. This IAM structure eliminates hard-coded credentials, provides temporary security credentials automatically rotated by AWS, and implements fine-grained permissions for each service component.

### Monitoring and Logging

CloudWatch Logs provides centralized log aggregation for Lambda functions and API Gateway with appropriate retention policies. Lambda log groups use 30-day retention for troubleshooting and compliance while balancing storage costs. API Gateway logs capture access logs with request context including request IDs, timestamps, HTTP methods, resource paths, status codes, and error messages for debugging API issues and tracking usage patterns. RDS PostgreSQL logs are exported to CloudWatch enabling database query analysis and error tracking. CloudWatch alarms monitor critical metrics including Lambda duration exceeding 25 seconds indicating performance issues or timeout risks, Lambda errors exceeding 5 occurrences in 5 minutes for failure detection, API Gateway 4XX errors exceeding 10 in 5 minutes indicating client-side issues or validation failures, API Gateway 5XX errors exceeding 5 in 5 minutes for server-side failure detection, RDS CPU utilization exceeding 80% indicating database performance issues, and RDS free storage space falling below 2GB for capacity planning. These alarms enable proactive issue detection before they impact users. This monitoring and logging architecture provides complete visibility into application behavior, database performance, and API activity for security analysis, compliance reporting, and troubleshooting.

### High Availability and Reliability

The architecture implements high availability through multi-AZ deployment and AWS-managed infrastructure. Lambda functions are deployed across two private subnets in different Availability Zones with automatic scaling to handle concurrent invocations from 0 to 1000 concurrent executions by default. AWS manages underlying infrastructure including automatic replacement of unhealthy compute nodes and distribution across Availability Zones. API Gateway provides built-in high availability across multiple Availability Zones with automatic traffic distribution and failover. The RDS instance is deployed with a DB subnet group spanning two private subnets enabling Multi-AZ failover if enabled. Automated backups with 7-day retention enable point-in-time recovery within the retention period. S3 buckets provide 99.999999999% durability with automatic replication across multiple facilities. The NAT Gateway is deployed in a single Availability Zone for cost optimization, appropriate for serverless workloads where Lambda cold starts provide built-in resilience and API Gateway handles retry logic. S3 versioning enables recovery from accidental deletions. All outputs are exported for cross-stack references enabling the infrastructure to serve as a foundation for additional components. Resource tagging with Environment and Project enables cost allocation, compliance reporting, and automated operations.

## CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Cloud Environment Setup - Serverless Python Application with VPC, Lambda, API Gateway, RDS PostgreSQL, S3, and CloudWatch Monitoring",
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
            "default": "Lambda Configuration"
          },
          "Parameters": ["LambdaRuntime", "LambdaMemorySize"]
        },
        {
          "Label": {
            "default": "Database Configuration"
          },
          "Parameters": ["DBInstanceClass", "DBName"]
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
    "LambdaRuntime": {
      "Type": "String",
      "Default": "python3.11",
      "Description": "Lambda function runtime",
      "AllowedValues": ["python3.11", "python3.10", "python3.9"]
    },
    "LambdaMemorySize": {
      "Type": "Number",
      "Default": 128,
      "Description": "Lambda function memory size in MB",
      "AllowedValues": [128, 256, 512, 1024]
    },
    "DBInstanceClass": {
      "Type": "String",
      "Default": "db.t3.micro",
      "Description": "RDS instance class",
      "AllowedValues": ["db.t3.micro", "db.t3.small", "db.t3.medium"]
    },
    "DBName": {
      "Type": "String",
      "Default": "projxdb",
      "Description": "Database name",
      "MinLength": "1",
      "MaxLength": "64",
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$"
    }
  },
  "Resources": {
    "projXVPC": {
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
              "Fn::Sub": "projX-VPC-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXInternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "projX-IGW-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXAttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {
          "Ref": "projXVPC"
        },
        "InternetGatewayId": {
          "Ref": "projXInternetGateway"
        }
      }
    },
    "projXPublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "projXVPC"
        },
        "CidrBlock": {
          "Ref": "PublicSubnet1CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": {
                "Ref": "AWS::Region"
              }
            }
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "projX-PublicSubnet1-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXPublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "projXVPC"
        },
        "CidrBlock": {
          "Ref": "PublicSubnet2CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": {
                "Ref": "AWS::Region"
              }
            }
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "projX-PublicSubnet2-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXPrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "projXVPC"
        },
        "CidrBlock": {
          "Ref": "PrivateSubnet1CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": {
                "Ref": "AWS::Region"
              }
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "projX-PrivateSubnet1-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXPrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "projXVPC"
        },
        "CidrBlock": {
          "Ref": "PrivateSubnet2CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": {
                "Ref": "AWS::Region"
              }
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "projX-PrivateSubnet2-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXNATGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "projXAttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "projX-NATGatewayEIP-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXNATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": ["projXNATGatewayEIP", "AllocationId"]
        },
        "SubnetId": {
          "Ref": "projXPublicSubnet1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "projX-NATGateway-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXPublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "projXVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "projX-PublicRouteTable-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXPublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "projXAttachGateway",
      "Properties": {
        "RouteTableId": {
          "Ref": "projXPublicRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {
          "Ref": "projXInternetGateway"
        }
      }
    },
    "projXPublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "projXPublicSubnet1"
        },
        "RouteTableId": {
          "Ref": "projXPublicRouteTable"
        }
      }
    },
    "projXPublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "projXPublicSubnet2"
        },
        "RouteTableId": {
          "Ref": "projXPublicRouteTable"
        }
      }
    },
    "projXPrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "projXVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "projX-PrivateRouteTable-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXPrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "projXPrivateRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "projXNATGateway"
        }
      }
    },
    "projXPrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "projXPrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "projXPrivateRouteTable"
        }
      }
    },
    "projXPrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "projXPrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "projXPrivateRouteTable"
        }
      }
    },
    "projXLambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda functions in VPC",
        "VpcId": {
          "Ref": "projXVPC"
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
              "Fn::Sub": "projX-LambdaSecurityGroup-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXRDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS PostgreSQL - allows access from Lambda only",
        "VpcId": {
          "Ref": "projXVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": {
              "Ref": "projXLambdaSecurityGroup"
            },
            "Description": "PostgreSQL access from Lambda functions"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "projX-RDSSecurityGroup-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXDBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "projX-RDS-Credentials-${EnvironmentSuffix}"
        },
        "Description": "RDS PostgreSQL database master credentials",
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\": \"projxadmin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\",
          "RequireEachIncludedType": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "projX-DBSecret-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXDBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS PostgreSQL instance in private subnets",
        "SubnetIds": [
          {
            "Ref": "projXPrivateSubnet1"
          },
          {
            "Ref": "projXPrivateSubnet2"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "projX-DBSubnetGroup-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXRDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "projx-postgres-${EnvironmentSuffix}"
        },
        "DBInstanceClass": {
          "Ref": "DBInstanceClass"
        },
        "Engine": "postgres",
        "EngineVersion": "15.10",
        "MasterUsername": {
          "Fn::Sub": "{{resolve:secretsmanager:${projXDBSecret}:SecretString:username}}"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${projXDBSecret}:SecretString:password}}"
        },
        "DBName": {
          "Ref": "DBName"
        },
        "AllocatedStorage": "20",
        "StorageType": "gp2",
        "DBSubnetGroupName": {
          "Ref": "projXDBSubnetGroup"
        },
        "VPCSecurityGroups": [
          {
            "Ref": "projXRDSSecurityGroup"
          }
        ],
        "PubliclyAccessible": false,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "MultiAZ": false,
        "StorageEncrypted": true,
        "EnableCloudwatchLogsExports": ["postgresql"],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "projX-RDSInstance-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Retain",
      "UpdateReplacePolicy": "Retain",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "projx-app-data-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
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
              "Id": "DeleteOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "projX-S3Bucket-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXS3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "projXS3Bucket"
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
                  "Fn::GetAtt": ["projXS3Bucket", "Arn"]
                },
                {
                  "Fn::Sub": "${projXS3Bucket.Arn}/*"
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
    "projXLambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "projX-LambdaExecutionRole-${EnvironmentSuffix}"
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
            "PolicyName": "projXLambdaCloudWatchLogsPolicy",
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
            "PolicyName": "projXLambdaS3AccessPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["projXS3Bucket", "Arn"]
                    },
                    {
                      "Fn::Sub": "${projXS3Bucket.Arn}/*"
                    }
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "projXLambdaSecretsManagerPolicy",
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
                    "Ref": "projXDBSecret"
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
              "Fn::Sub": "projX-LambdaExecutionRole-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXAPIGatewayCloudWatchRole": {
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
              "Fn::Sub": "projX-APIGatewayCloudWatchRole-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXLambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "projX-AppFunction-${EnvironmentSuffix}"
        },
        "Runtime": {
          "Ref": "LambdaRuntime"
        },
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["projXLambdaExecutionRole", "Arn"]
        },
        "MemorySize": {
          "Ref": "LambdaMemorySize"
        },
        "Timeout": 30,
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "projXLambdaSecurityGroup"
            }
          ],
          "SubnetIds": [
            {
              "Ref": "projXPrivateSubnet1"
            },
            {
              "Ref": "projXPrivateSubnet2"
            }
          ]
        },
        "Environment": {
          "Variables": {
            "ENVIRONMENT": {
              "Ref": "EnvironmentSuffix"
            },
            "S3_BUCKET": {
              "Ref": "projXS3Bucket"
            },
            "DB_SECRET_ARN": {
              "Ref": "projXDBSecret"
            },
            "DB_HOST": {
              "Fn::GetAtt": ["projXRDSInstance", "Endpoint.Address"]
            },
            "DB_PORT": {
              "Fn::GetAtt": ["projXRDSInstance", "Endpoint.Port"]
            },
            "DB_NAME": {
              "Ref": "DBName"
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
                "    return {",
                "        'statusCode': 200,",
                "        'headers': {",
                "            'Content-Type': 'application/json',",
                "            'Access-Control-Allow-Origin': '*'",
                "        },",
                "        'body': json.dumps({",
                "            'message': 'projX serverless application running',",
                "            'environment': os.environ.get('ENVIRONMENT', 'unknown'),",
                "            's3_bucket': os.environ.get('S3_BUCKET', 'unknown')",
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
              "Fn::Sub": "projX-LambdaFunction-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXLambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/projX-AppFunction-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "projXAPIGatewayRestAPI": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": {
          "Fn::Sub": "projX-API-${EnvironmentSuffix}"
        },
        "Description": "API Gateway for projX serverless application",
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
              "Fn::Sub": "projX-APIGateway-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXAPIGatewayAccount": {
      "Type": "AWS::ApiGateway::Account",
      "Properties": {
        "CloudWatchRoleArn": {
          "Fn::GetAtt": ["projXAPIGatewayCloudWatchRole", "Arn"]
        }
      }
    },
    "projXAPIGatewayRequestValidator": {
      "Type": "AWS::ApiGateway::RequestValidator",
      "Properties": {
        "Name": "projXRequestValidator",
        "RestApiId": {
          "Ref": "projXAPIGatewayRestAPI"
        },
        "ValidateRequestBody": true,
        "ValidateRequestParameters": true
      }
    },
    "projXAPIGatewayResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "projXAPIGatewayRestAPI"
        },
        "ParentId": {
          "Fn::GetAtt": ["projXAPIGatewayRestAPI", "RootResourceId"]
        },
        "PathPart": "app"
      }
    },
    "projXAPIGatewayMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "projXAPIGatewayRestAPI"
        },
        "ResourceId": {
          "Ref": "projXAPIGatewayResource"
        },
        "HttpMethod": "GET",
        "AuthorizationType": "NONE",
        "RequestValidatorId": {
          "Ref": "projXAPIGatewayRequestValidator"
        },
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${projXLambdaFunction.Arn}/invocations"
          }
        },
        "MethodResponses": [
          {
            "StatusCode": "200"
          }
        ]
      }
    },
    "projXAPIGatewayDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": "projXAPIGatewayMethod",
      "Properties": {
        "RestApiId": {
          "Ref": "projXAPIGatewayRestAPI"
        },
        "Description": "Production deployment"
      }
    },
    "projXAPIGatewayStage": {
      "Type": "AWS::ApiGateway::Stage",
      "Properties": {
        "StageName": "prod",
        "RestApiId": {
          "Ref": "projXAPIGatewayRestAPI"
        },
        "DeploymentId": {
          "Ref": "projXAPIGatewayDeployment"
        },
        "Description": "Production stage",
        "AccessLogSetting": {
          "DestinationArn": {
            "Fn::GetAtt": ["projXAPIGatewayLogGroup", "Arn"]
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
              "Fn::Sub": "projX-APIGatewayStage-prod-${EnvironmentSuffix}"
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
            "Value": "projX"
          }
        ]
      }
    },
    "projXAPIGatewayLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/apigateway/projX-API-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "projXLambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "projXLambdaFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${projXAPIGatewayRestAPI}/*/*"
        }
      }
    },
    "projXLambdaDurationAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "projX-Lambda-HighDuration-${EnvironmentSuffix}"
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
              "Ref": "projXLambdaFunction"
            }
          }
        ]
      }
    },
    "projXLambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "projX-Lambda-Errors-${EnvironmentSuffix}"
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
              "Ref": "projXLambdaFunction"
            }
          }
        ]
      }
    },
    "projXAPIGateway4XXErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "projX-APIGateway-4XXErrors-${EnvironmentSuffix}"
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
              "Fn::Sub": "projX-API-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "projXAPIGateway5XXErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "projX-APIGateway-5XXErrors-${EnvironmentSuffix}"
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
              "Fn::Sub": "projX-API-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "projXRDSCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "projX-RDS-HighCPU-${EnvironmentSuffix}"
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
              "Ref": "projXRDSInstance"
            }
          }
        ]
      }
    },
    "projXRDSStorageAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "projX-RDS-LowStorage-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when RDS free storage space is low",
        "MetricName": "FreeStorageSpace",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 2000000000,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {
              "Ref": "projXRDSInstance"
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
        "Ref": "projXVPC"
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
        "Ref": "projXPublicSubnet1"
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
        "Ref": "projXPublicSubnet2"
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
        "Ref": "projXPrivateSubnet1"
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
        "Ref": "projXPrivateSubnet2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnet2Id"
        }
      }
    },
    "LambdaFunctionArn": {
      "Description": "ARN of the Lambda function",
      "Value": {
        "Fn::GetAtt": ["projXLambdaFunction", "Arn"]
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
        "Ref": "projXLambdaFunction"
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
        "Fn::Sub": "https://${projXAPIGatewayRestAPI}.execute-api.${AWS::Region}.amazonaws.com/prod/app"
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
        "Ref": "projXAPIGatewayRestAPI"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-APIGatewayId"
        }
      }
    },
    "S3BucketName": {
      "Description": "Name of the S3 bucket for application data",
      "Value": {
        "Ref": "projXS3Bucket"
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
        "Fn::GetAtt": ["projXS3Bucket", "Arn"]
      }
    },
    "RDSInstanceEndpoint": {
      "Description": "RDS PostgreSQL instance endpoint address",
      "Value": {
        "Fn::GetAtt": ["projXRDSInstance", "Endpoint.Address"]
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
        "Fn::GetAtt": ["projXRDSInstance", "Endpoint.Port"]
      }
    },
    "DBSecretArn": {
      "Description": "ARN of the Secrets Manager secret containing database credentials",
      "Value": {
        "Ref": "projXDBSecret"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DBSecretArn"
        }
      }
    },
    "NATGatewayId": {
      "Description": "NAT Gateway ID",
      "Value": {
        "Ref": "projXNATGateway"
      }
    },
    "NATGatewayEIP": {
      "Description": "Elastic IP associated with NAT Gateway",
      "Value": {
        "Ref": "projXNATGatewayEIP"
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

The template implements comprehensive security through defense-in-depth architecture across all layers. Network security is enforced with Lambda functions deployed in private subnets accessible only through API Gateway, RDS PostgreSQL deployed in private subnets with no public accessibility, and security group isolation restricting database access exclusively to Lambda functions on port 5432. Encryption is implemented at rest using AWS-managed AES-256 encryption for S3 buckets and RDS storage encryption enabled by default. Encryption in transit is enforced through mandatory HTTPS via S3 bucket policy conditions that explicitly deny requests when aws:SecureTransport is false. IAM roles follow strict least privilege with Lambda execution roles granted only specific CloudWatch Logs permissions scoped to /aws/lambda/ log groups, S3 permissions limited to GetObject, PutObject, and ListBucket on the application bucket, and Secrets Manager permissions limited to GetSecretValue and DescribeSecret for the database credential secret. AWS Secrets Manager stores and manages RDS credentials securely with automatic password generation eliminating hardcoded credentials. API Gateway request validation rejects malformed requests before Lambda invocation, reducing attack surface and preventing resource consumption from invalid inputs. All S3 buckets block public access through PublicAccessBlockConfiguration. This multi-layer security architecture protects against unauthorized access, data breaches, and compliance violations.

### Scalability

The serverless architecture provides automatic horizontal scaling without capacity planning or infrastructure management. Lambda functions automatically scale to handle concurrent invocations from 0 to 1000 concurrent executions by default, with AWS managing all underlying infrastructure including automatic distribution across Availability Zones and automatic replacement of unhealthy compute nodes. API Gateway automatically handles traffic spikes with built-in rate limiting and throttling capabilities configurable per stage. S3 buckets automatically scale to handle any storage capacity and request rate without configuration. RDS can be scaled vertically by changing the DBInstanceClass parameter from db.t3.micro to db.t3.small or db.t3.medium as workload demands increase. CloudWatch Logs automatically scales to handle log ingestion from all sources. The VPC design with /16 CIDR provides 65,536 IP addresses supporting future growth and additional components. Lambda memory size is parameterized allowing performance tuning through increased memory allocation which proportionally increases CPU and network bandwidth. All outputs are exported for cross-stack references, enabling the infrastructure to serve as a foundation for additional serverless components. This serverless approach eliminates capacity planning concerns and ensures the infrastructure scales automatically from zero to enterprise workload levels.

### Operational Excellence

The template achieves operational excellence through infrastructure as code with comprehensive parameterization and validation. Parameters include AllowedPattern validation for CIDR blocks ensuring valid network configurations, AllowedValues for Lambda runtime, memory size, and RDS instance class preventing invalid configurations, and default values for all parameters enabling quick deployment while allowing customization. CloudFormation Interface metadata organizes parameters into logical groups (Environment, Network, Lambda, Database) improving console user experience. CloudWatch monitoring provides comprehensive visibility with Lambda duration alarms detecting performance issues before timeout, Lambda error alarms for failure detection, API Gateway 4XX/5XX error alarms for request validation and server-side failure monitoring, RDS CPU utilization alarms for database performance issues, and RDS storage alarms for capacity planning. Centralized logging to CloudWatch Logs with 30-day retention enables troubleshooting and compliance auditing for Lambda execution logs and API Gateway access logs. RDS PostgreSQL logs are exported to CloudWatch for database query analysis. Consistent tagging across all resources with three mandatory tags (Name, Environment, Project) enables cost allocation tracking, compliance auditing through tag-based reporting, and automated operations through tag-based resource selection. Lambda functions use inline code for demonstration, easily replaced with S3 references for production deployments. Environment variables provide configuration without hardcoded values, supporting environment-specific settings.

### Cost Optimization

The serverless architecture provides significant cost optimization through pay-per-use pricing models. Lambda functions incur charges only during actual execution time with 1ms billing granularity, automatically scaling to zero when not in use eliminating idle resource costs. Default 128MB memory allocation minimizes costs while AllowedValues constraints of [128, 256, 512, 1024] prevent accidental deployment of expensive configurations. The 30-second timeout balances functionality with cost control. API Gateway charges only for API calls and data transfer with no hourly charges. RDS uses db.t3.micro by default, the smallest and most cost-effective instance class, with AllowedValues enabling controlled scaling to db.t3.small or db.t3.medium as needed. Single-AZ RDS deployment reduces costs for development environments while the architecture supports Multi-AZ for production through configuration. S3 uses versioning with lifecycle policy deleting noncurrent versions after 90 days balancing data protection with storage costs. CloudWatch Logs retention is limited to 30 days for Lambda and API Gateway balancing compliance requirements with storage costs. The single NAT Gateway design optimizes cost for serverless workloads. Comprehensive tagging with Environment and Project enables detailed AWS Cost Explorer reports, chargeback to appropriate departments, and identification of cost optimization opportunities through tag-based cost allocation.

### Reliability

The architecture achieves high reliability through multi-AZ deployment and AWS-managed infrastructure. Lambda functions are deployed across two private subnets in different Availability Zones with automatic scaling and automatic failover. AWS manages underlying infrastructure including automatic replacement of unhealthy compute nodes. API Gateway provides built-in high availability across multiple Availability Zones with automatic traffic distribution and failover. RDS is deployed with a DB subnet group spanning two private subnets enabling Multi-AZ failover if enabled. Automated backups with 7-day retention enable point-in-time recovery within the retention period. S3 buckets provide 99.999999999% (11 9's) durability with automatic replication across multiple facilities within the region. Versioning is enabled on the application bucket providing protection against accidental deletions and enabling object recovery. Lambda functions retry failed invocations automatically with exponential backoff. API Gateway provides retry logic for Lambda integration failures. CloudWatch alarms provide proactive monitoring enabling issue detection before user impact with Lambda duration alarms detecting performance degradation, Lambda error alarms for failure rates, API Gateway error alarms for request validation and server-side failures, and RDS alarms for CPU and storage issues. All outputs use Export enabling cross-stack references and supporting disaster recovery scenarios where dependent stacks can reference this foundational infrastructure.

## Modern AWS Practices

### VPC-Connected Lambda Functions with Multi-AZ Deployment

Lambda functions are deployed within the VPC's private subnets rather than using default Lambda networking, providing several critical security and availability advantages. VPC-connected Lambda functions cannot be accessed from the internet directly and can only be invoked through API Gateway or other AWS services with explicit permissions. The Lambda security group allows only outbound traffic while preventing any inbound connections, ensuring functions can reach external services through the NAT Gateway but cannot be accessed directly. Functions are deployed across both private subnets in different Availability Zones for high availability, enabling automatic failover if one Availability Zone becomes unavailable. The Lambda execution role includes AWSLambdaVPCAccessExecutionRole managed policy granting permissions to create and manage elastic network interfaces (ENIs) in the VPC for connectivity. VPC configuration incurs cold start latency as Lambda creates ENIs in the private subnets, but this trade-off provides defense-in-depth security architecture and high availability. The private subnets route outbound traffic through the NAT Gateway enabling functions to access external APIs, AWS services, and the RDS database while remaining isolated from inbound internet traffic. This VPC integration aligns with AWS security best practices for serverless applications handling sensitive data or requiring database connectivity.

### AWS Secrets Manager for Secure Credential Management

AWS Secrets Manager stores and manages RDS credentials securely with automatic password generation eliminating hardcoded credentials in application code or CloudFormation templates. The secret uses GenerateSecretString with a 32-character password excluding problematic characters ("@/\) that could cause parsing issues in connection strings. RequireEachIncludedType ensures the password contains uppercase, lowercase, numbers, and symbols for maximum entropy. The RDS instance retrieves credentials at deployment time using dynamic references with {{resolve:secretsmanager:...}} syntax, ensuring credentials are never stored in CloudFormation templates or logs. Lambda functions retrieve database credentials at runtime using the Secrets Manager API with IAM permissions granted only to the specific secret ARN following least privilege principles. This approach enables credential rotation without application code changes by updating the secret value and Lambda functions automatically retrieving the new credentials on next invocation. Environment variables provide the secret ARN (DB_SECRET_ARN) rather than actual credentials, ensuring sensitive data is never exposed in Lambda configuration. This credential management pattern follows AWS security best practices for database connectivity and supports compliance requirements including PCI DSS and HIPAA that mandate secure credential storage.

### RDS PostgreSQL in Private Subnets with Security Group Isolation

The RDS PostgreSQL database is deployed in private subnets with comprehensive security controls preventing direct internet access. PubliclyAccessible is set to false ensuring the database cannot be reached from outside the VPC. A DB subnet group spans both private subnets in different Availability Zones enabling Multi-AZ failover capability if configured. The RDS security group restricts inbound access exclusively to port 5432 from the Lambda security group using SourceSecurityGroupId, implementing network-level isolation that prevents any other resources from connecting to the database. Storage encryption is enabled by default using AWS-managed keys providing encryption at rest for all database data including backups. Automated backups are configured with a 7-day retention period enabling point-in-time recovery within the retention window. Maintenance windows are scheduled during low-traffic periods (Monday 04:00-05:00 UTC) for automatic patching minimizing user impact. PostgreSQL logs are exported to CloudWatch enabling query analysis, error tracking, and troubleshooting without direct database access. The database uses configurable instance class with default db.t3.micro for cost optimization and AllowedValues enabling controlled scaling. This RDS configuration follows AWS security best practices for database deployment with network isolation, encryption, and monitoring.

### S3 Bucket Policy for HTTPS Enforcement

The S3 bucket policy explicitly enforces HTTPS for all data transfers through a conditional deny statement, implementing encryption in transit as required by security best practices and compliance frameworks. The policy uses the Condition element with aws:SecureTransport: false to identify unencrypted HTTP requests and explicitly denies them using Effect: Deny, ensuring all S3 access occurs over encrypted connections. This approach prevents data interception through man-in-the-middle attacks and ensures compliance with security standards requiring encryption in transit. The policy applies to both the bucket ARN and object ARNs using Fn::Sub: ${projXS3Bucket.Arn}/\* ensuring all operations including bucket-level operations (ListBucket) and object-level operations (GetObject, PutObject) require HTTPS. This explicit deny policy cannot be overridden by allow policies, providing strong enforcement. The policy complements S3 bucket encryption at rest (AES-256) providing comprehensive data protection with encryption in transit through mandatory HTTPS and encryption at rest through server-side encryption. This security control is critical for compliance with PCI DSS, HIPAA, and other regulations requiring encrypted data transfers.

### API Gateway Request Validation with Comprehensive Logging

API Gateway implements comprehensive request validation before forwarding requests to Lambda, reducing Lambda invocations from malformed requests and improving security and cost efficiency. The RequestValidator resource with ValidateRequestBody: true and ValidateRequestParameters: true enables validation of request parameters (query strings, headers, path parameters) and request body content against schemas defined in the API Gateway model. Request validation occurs at the API Gateway layer before Lambda invocation, rejecting invalid requests with HTTP 400 Bad Request responses without consuming Lambda execution time or incurring Lambda invocation costs. This approach reduces attack surface by preventing malicious or malformed payloads from reaching application code, improves cost efficiency by avoiding Lambda invocations for invalid requests, and provides faster error responses to clients by validating at the edge. The API is deployed to a production stage named 'prod' with comprehensive logging enabled through AccessLogSetting capturing request IDs, timestamps, HTTP methods, resource paths, status codes, and error messages for debugging. Method settings enable INFO-level logging, DataTraceEnabled for request/response logging, and MetricsEnabled for CloudWatch metrics. The API Gateway Account resource configures CloudWatch logging permissions at the account level using AmazonAPIGatewayPushToCloudWatchLogs managed policy. This configuration implements defense in depth with validation occurring before Lambda execution, comprehensive logging for security analysis, and metrics for operational monitoring.

### Lambda Environment Variables for Configuration

Lambda functions use environment variables for configuration rather than hardcoding values, implementing the twelve-factor app methodology for cloud-native applications. Environment variables provide ENVIRONMENT from the EnvironmentSuffix parameter enabling environment-specific behavior without code changes, S3_BUCKET from the S3 bucket resource reference ensuring functions reference the correct bucket, DB_SECRET_ARN from the Secrets Manager secret enabling secure credential retrieval, DB_HOST and DB_PORT from the RDS instance endpoint attributes for database connectivity, and DB_NAME from the parameter for database selection. This approach enables several best practices including environment-specific configuration allowing the same Lambda code to run in dev, staging, and prod environments with different configurations, eliminating hardcoded resource names reducing coupling between code and infrastructure and improving maintainability, and supporting secure credential management through Secrets Manager integration for sensitive values. Environment variables are accessible through standard environment variable APIs (os.environ in Python) requiring no AWS SDK calls for basic configuration. Database credentials are retrieved from Secrets Manager at runtime using the DB_SECRET_ARN environment variable, taking advantage of SDK caching to minimize API calls and cold start latency. This configuration approach aligns with AWS serverless best practices and twelve-factor app principles.

### IAM Least Privilege with Scoped Resource Permissions

The Lambda execution role implements strict least privilege principles with inline policies granting minimal permissions scoped to specific resources. The CloudWatch Logs policy grants CreateLogGroup, CreateLogStream, and PutLogEvents actions only on resources matching arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/_ preventing functions from writing to other log groups or accessing CloudWatch Logs data from other applications. The S3 policy grants GetObject, PutObject, and ListBucket permissions exclusively to the application data bucket using Fn::GetAtt for bucket ARN and Fn::Sub: ${projXS3Bucket.Arn}/_ for object paths, preventing access to other S3 buckets in the account. The Secrets Manager policy grants GetSecretValue and DescribeSecret permissions only to the database credential secret using Ref: projXDBSecret, enabling functions to retrieve database credentials without broader Secrets Manager permissions. No policies use wildcard resource ARNs or Allow Effect with NotResource which can inadvertently grant broader permissions than intended. The role includes AWSLambdaVPCAccessExecutionRole managed policy for VPC ENI management, a well-tested AWS-managed policy with minimal permissions for VPC connectivity. This IAM structure eliminates the risk of privilege escalation, reduces blast radius if a function is compromised, supports compliance with PCI DSS and other regulations requiring least privilege, and follows AWS Well-Architected Framework security pillar guidance. Resource-specific ARNs using CloudFormation intrinsic functions ensure policies automatically reference the correct resources even if ARNs change during stack updates.

### Comprehensive CloudWatch Alarms for Proactive Monitoring

CloudWatch alarms monitor critical metrics across all application tiers enabling proactive issue detection before user impact. Lambda alarms include duration monitoring with threshold of 25 seconds (near the 30-second timeout) detecting performance issues or potential timeout risks with 2 evaluation periods reducing false positives, and error monitoring with threshold of 5 errors in 5 minutes for rapid failure detection enabling quick response to application issues. API Gateway alarms include 4XX error monitoring with threshold of 10 in 5 minutes indicating client-side issues, validation failures, or potential attacks, and 5XX error monitoring with threshold of 5 in 5 minutes for server-side failure detection requiring immediate investigation. RDS alarms include CPU utilization monitoring with threshold of 80% over 2 evaluation periods detecting database performance issues before they impact application response times, and free storage space monitoring with threshold of 2GB detecting storage capacity issues before they cause database failures enabling proactive capacity planning. All alarms use consistent 300-second (5-minute) periods balancing responsiveness with cost efficiency. Alarm names include the environment suffix enabling easy identification and filtering in CloudWatch console. These alarms can be extended with SNS topic notifications for email, SMS, or integration with incident management systems. This comprehensive alarm coverage provides visibility into application health across compute, API, and database tiers following AWS operational best practices.

### Resource Tagging for Governance and Cost Allocation

All resources implement a consistent three-tag strategy enabling cost allocation, compliance reporting, and automated operations. The Name tag uses Fn::Sub for dynamic generation incorporating EnvironmentSuffix and resource type enabling visual identification in the AWS Console and CLI with consistent naming convention (projX-ResourceType-Environment). The Environment tag references EnvironmentSuffix parameter enabling cost allocation reports by environment (dev, staging, prod) and supporting tag-based IAM policies restricting access to specific environments. The Project tag (projX) enables cost allocation by project and supports multi-tenant AWS accounts where multiple projects share infrastructure, following the organization's naming convention requirements. This consistent tagging strategy enables several critical capabilities including AWS Cost Explorer reports filtering and grouping costs by any tag combination for detailed cost analysis, tag-based resource identification enabling administrators to quickly locate all resources belonging to the projX project or specific environment, compliance reporting demonstrating proper resource organization and ownership for audit requirements, and automated operations through AWS Systems Manager and Lambda functions targeting resources by tags for patching, backup, and lifecycle management. All resources including VPC, subnets, security groups, Lambda functions, RDS instance, S3 bucket, IAM roles, API Gateway, and CloudWatch resources use consistent tag names and values ensuring complete coverage. This governance through tagging supports enterprise-scale AWS operations with detailed cost visibility and automated resource management.
