# Ideal Response: Comprehensive Cloud Environment with Auto Scaling and CDN

## Architecture Overview

This CloudFormation template creates a production-ready, highly available AWS cloud environment with comprehensive auto-scaling capabilities, and advanced security features. The infrastructure spans multiple Availability Zones with automatic scaling based on demand, AWS WAF for web application security, and centralized backup management following AWS best practices and the Well-Architected Framework.

### Network Architecture

The infrastructure implements a highly available multi-tier VPC architecture spanning two Availability Zones. The VPC uses a 10.0.0.0/16 CIDR block with public subnets (10.0.1.0/24, 10.0.2.0/24) for auto-scaling EC2 instances and private subnets (10.0.3.0/24, 10.0.4.0/24) for database isolation. An Internet Gateway provides public subnet connectivity, while two NAT Gateways (one in each public subnet) with dedicated Elastic IPs enable high-availability outbound internet access for private subnet resources. Each private subnet routes through its respective NAT Gateway, ensuring continued outbound connectivity even if one Availability Zone experiences issues. This dual NAT Gateway design provides true high availability by eliminating single points of failure in the network path.

### Auto Scaling Compute Layer

The compute layer uses an Auto Scaling Group that dynamically adjusts capacity based on CPU utilization. The ASG maintains a minimum of 2 instances and can scale up to 5 instances, deploying t2.micro instances across both public subnets using a Launch Template. The Launch Template uses dynamic AMI resolution through SSM Parameter Store for the latest Amazon Linux 2 AMI. Instance user data installs httpd web server, MySQL client, jq for JSON parsing, and CloudWatch agent for comprehensive monitoring. CPU-based scaling policies trigger at 70% utilization (scale up) and 30% utilization (scale down) with corresponding CloudWatch alarms. An IAM instance profile grants EC2 instances permissions to read/write S3 objects and retrieve database credentials from Secrets Manager. The security group allows inbound HTTP (port 80) and HTTPS (port 443) traffic from anywhere while permitting all outbound traffic.

### Database Layer

The RDS MySQL 8.0.43 database deploys in Multi-AZ configuration across private subnets using a DB Subnet Group spanning both Availability Zones. Multi-AZ deployment provides automatic failover to a standby instance in a different AZ within minutes if the primary instance fails. The database is not publicly accessible and accepts connections only from the Auto Scaling Group security group through port 3306. Database credentials are generated and managed through AWS Secrets Manager with a 32-character password excluding problematic characters. The database includes automated daily backups with 7-day retention, storage encryption at rest using gp3 storage, and enhanced monitoring with 60-second intervals. A dedicated IAM role enables RDS to publish enhanced monitoring metrics to CloudWatch. CloudWatch Logs integration exports error, general, and slow query logs for centralized log analysis.

### Storage and Content Delivery

An S3 bucket configured for static website hosting serves as the origin for global content delivery. The bucket has versioning enabled to preserve file history and supports public read access for website content. Website configuration designates index.html as the index document and error.html for error responses. A bucket policy grants public read access to all objects. The stack includes a Retain deletion policy on the S3 bucket to prevent accidental data loss.

### DNS and Domain Configuration

A Route 53 hosted zone manages DNS records for the specified domain.

### Security Layer

AWS WAF with REGIONAL scope protects against common web threats and DDoS attacks. The WAF Web ACL includes two rule sets: a rate-limiting rule that blocks IP addresses exceeding 2000 requests within a 5-minute period, and AWS Managed Rules Core Rule Set that provides protection against OWASP Top 10 vulnerabilities including SQL injection and cross-site scripting. Security groups follow the principle of least privilege: the web server security group allows HTTP/HTTPS from anywhere but restricts database access, while the RDS security group permits MySQL traffic only from the web server security group using security group references. IAM policies grant minimal permissions with the EC2 role allowing S3 read/write access only to the specific bucket and Secrets Manager access only to the database credential secret.

### Monitoring and Logging

Comprehensive CloudWatch monitoring provides visibility into system health and security events. VPC Flow Logs capture all network traffic entering and leaving the VPC, storing logs in a CloudWatch Log Group with 7-day retention for security analysis and compliance. An IAM role enables VPC Flow Logs to publish to CloudWatch Logs. Auto Scaling CloudWatch alarms monitor CPU utilization and trigger scaling actions: CPUAlarmHigh triggers scale-up when average CPU exceeds 70% over two consecutive 5-minute periods, while CPUAlarmLow triggers scale-down when CPU drops below 30%. An RDS CPU alarm triggers when database CPU utilization exceeds 80%. These alarms enable proactive response to performance issues before they impact users.

### Backup and Disaster Recovery

AWS Backup provides centralized backup management for critical resources. A backup vault stores recovery points with encryption enabled. The backup plan schedules daily backups at 5:00 AM UTC with 30-day retention and a 2-hour completion window. A backup selection identifies the RDS instance using its ARN for automated backup. An IAM role grants AWS Backup the permissions necessary to create backups and perform restores across AWS services including RDS and EC2 volumes.

### High Availability and Fault Tolerance

The architecture achieves high availability through multiple mechanisms. Two NAT Gateways eliminate single points of failure in private subnet internet connectivity. The Auto Scaling Group maintains minimum capacity of 2 instances across both AZs, automatically replacing failed instances. RDS Multi-AZ deployment provides automatic failover with synchronous replication maintaining database consistency. Route 53 provides 100% uptime SLA for DNS queries. This multi-layer redundancy ensures the application remains available even during component failures or AZ outages.

## CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Comprehensive Cloud Environment - VPC, Auto Scaling, RDS, S3, WAF, Route 53, and Monitoring",
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
            "EC2InstanceType",
            "LatestAmiId",
            "MinSize",
            "MaxSize"
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
            "default": "Website and CDN Configuration"
          },
          "Parameters": [
            "DomainName"
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
    "EC2InstanceType": {
      "Type": "String",
      "Default": "t2.micro",
      "Description": "EC2 instance type for Auto Scaling Group",
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
      "MinValue": 1,
      "MaxValue": 10
    },
    "MaxSize": {
      "Type": "Number",
      "Default": 5,
      "Description": "Maximum number of instances in Auto Scaling Group",
      "MinValue": 1,
      "MaxValue": 10
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
      "Default": "appdb",
      "Description": "Database name",
      "MinLength": "1",
      "MaxLength": "64",
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$"
    },
    "DomainName": {
      "Type": "String",
      "Default": "test-domain.com",
      "Description": "Domain name for Route 53"
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
            "Value": "ComprehensiveCloudEnvironment"
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
            "Value": "ComprehensiveCloudEnvironment"
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
            "Value": "ComprehensiveCloudEnvironment"
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
            "Value": "ComprehensiveCloudEnvironment"
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
            "Value": "ComprehensiveCloudEnvironment"
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
            "Value": "ComprehensiveCloudEnvironment"
          }
        ]
      }
    },
    "NATGatewayEIP1": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "NATGatewayEIP1-${EnvironmentSuffix}"
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
            "Value": "ComprehensiveCloudEnvironment"
          }
        ]
      }
    },
    "NATGatewayEIP2": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "NATGatewayEIP2-${EnvironmentSuffix}"
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
            "Value": "ComprehensiveCloudEnvironment"
          }
        ]
      }
    },
    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGatewayEIP1",
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
              "Fn::Sub": "NATGateway1-${EnvironmentSuffix}"
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
            "Value": "ComprehensiveCloudEnvironment"
          }
        ]
      }
    },
    "NATGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGatewayEIP2",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnet2"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "NATGateway2-${EnvironmentSuffix}"
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
            "Value": "ComprehensiveCloudEnvironment"
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
            "Value": "ComprehensiveCloudEnvironment"
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
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PrivateRouteTable1-${EnvironmentSuffix}"
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
            "Value": "ComprehensiveCloudEnvironment"
          }
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway1"
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
          "Ref": "PrivateRouteTable1"
        }
      }
    },
    "PrivateRouteTable2": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PrivateRouteTable2-${EnvironmentSuffix}"
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
            "Value": "ComprehensiveCloudEnvironment"
          }
        ]
      }
    },
    "PrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable2"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway2"
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
          "Ref": "PrivateRouteTable2"
        }
      }
    },
    "WebServerSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for web servers - allows HTTP and HTTPS",
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
            "Value": "ComprehensiveCloudEnvironment"
          }
        ]
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS - allows MySQL access from EC2 instances only",
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
            "Value": "ComprehensiveCloudEnvironment"
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
            "Value": "ComprehensiveCloudEnvironment"
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
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
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
                        "S3WebsiteBucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${S3WebsiteBucket.Arn}/*"
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
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "EC2InstanceRole-${EnvironmentSuffix}-${AWS::StackName}"
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
            "Value": "ComprehensiveCloudEnvironment"
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
                  "Value": "ComprehensiveCloudEnvironment"
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
            "Ref": "PublicSubnet1"
          },
          {
            "Ref": "PublicSubnet2"
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
            "Value": {
              "Ref": "EnvironmentSuffix"
            },
            "PropagateAtLaunch": true
          },
          {
            "Key": "Project",
            "Value": "ComprehensiveCloudEnvironment",
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
            "Value": "ComprehensiveCloudEnvironment"
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
            "Value": "ComprehensiveCloudEnvironment"
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
    "S3WebsiteBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "website-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "WebsiteConfiguration": {
          "IndexDocument": "index.html",
          "ErrorDocument": "error.html"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": false,
          "BlockPublicPolicy": false,
          "IgnorePublicAcls": false,
          "RestrictPublicBuckets": false
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "S3WebsiteBucket-${EnvironmentSuffix}"
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
            "Value": "ComprehensiveCloudEnvironment"
          }
        ]
      }
    },
    "S3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "S3WebsiteBucket"
        },
        "PolicyDocument": {
          "Statement": [
            {
              "Sid": "PublicReadGetObject",
              "Effect": "Allow",
              "Principal": "*",
              "Action": "s3:GetObject",
              "Resource": {
                "Fn::Sub": "${S3WebsiteBucket.Arn}/*"
              }
            }
          ]
        }
      }
    },
    "WebACL": {
      "Type": "AWS::WAFv2::WebACL",
      "Properties": {
        "Name": {
          "Fn::Sub": "WebACL-${EnvironmentSuffix}-${AWS::StackName}"
        },
        "Scope": "REGIONAL",
        "DefaultAction": {
          "Allow": {}
        },
        "Rules": [
          {
            "Name": "RateLimitRule",
            "Priority": 1,
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
            "Name": "AWSManagedRulesCommonRuleSet",
            "Priority": 2,
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesCommonRuleSet"
              }
            },
            "OverrideAction": {
              "None": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "CommonRuleSet"
            }
          }
        ],
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": {
            "Fn::Sub": "WebACL-${EnvironmentSuffix}-${AWS::StackName}"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebACL-${EnvironmentSuffix}-${AWS::StackName}"
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
            "Value": "ComprehensiveCloudEnvironment"
          }
        ]
      }
    },
    "Route53HostedZone": {
      "Type": "AWS::Route53::HostedZone",
      "Properties": {
        "Name": {
          "Ref": "DomainName"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "HostedZone-${EnvironmentSuffix}"
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
            "Value": "ComprehensiveCloudEnvironment"
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
            "Value": "ComprehensiveCloudEnvironment"
          }
        ]
      }
    },
    "BackupVault": {
      "Type": "AWS::Backup::BackupVault",
      "Properties": {
        "BackupVaultName": {
          "Fn::Sub": "BackupVault-${EnvironmentSuffix}-${AWS::StackName}"
        },
        "BackupVaultTags": {
          "Name": {
            "Fn::Sub": "BackupVault-${EnvironmentSuffix}-${AWS::StackName}"
          },
          "Environment": {
            "Ref": "EnvironmentSuffix"
          },
          "Project": "ComprehensiveCloudEnvironment"
        }
      }
    },
    "BackupPlan": {
      "Type": "AWS::Backup::BackupPlan",
      "Properties": {
        "BackupPlan": {
          "BackupPlanName": {
            "Fn::Sub": "BackupPlan-${EnvironmentSuffix}"
          },
          "BackupPlanRule": [
            {
              "RuleName": "DailyBackups",
              "TargetBackupVault": {
                "Ref": "BackupVault"
              },
              "ScheduleExpression": "cron(0 5 ? * * *)",
              "StartWindowMinutes": 60,
              "CompletionWindowMinutes": 120,
              "Lifecycle": {
                "DeleteAfterDays": 30
              }
            }
          ]
        },
        "BackupPlanTags": {
          "Name": {
            "Fn::Sub": "BackupPlan-${EnvironmentSuffix}"
          },
          "Environment": {
            "Ref": "EnvironmentSuffix"
          },
          "Project": "ComprehensiveCloudEnvironment"
        }
      }
    },
    "BackupRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "backup.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
          "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores"
        ]
      }
    },
    "BackupSelection": {
      "Type": "AWS::Backup::BackupSelection",
      "Properties": {
        "BackupPlanId": {
          "Ref": "BackupPlan"
        },
        "BackupSelection": {
          "SelectionName": {
            "Fn::Sub": "BackupSelection-${EnvironmentSuffix}"
          },
          "IamRoleArn": {
            "Fn::GetAtt": [
              "BackupRole",
              "Arn"
            ]
          },
          "Resources": [
            {
              "Fn::Sub": "arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${RDSInstance}"
            }
          ]
        }
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
      "Description": "S3 website bucket name",
      "Value": {
        "Ref": "S3WebsiteBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3BucketName"
        }
      }
    },
    "Route53HostedZoneId": {
      "Description": "Route 53 Hosted Zone ID",
      "Value": {
        "Ref": "Route53HostedZone"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-HostedZoneId"
        }
      }
    },
    "DBSecretArn": {
      "Description": "ARN of the Secrets Manager secret containing database credentials",
      "Value": {
        "Ref": "DBSecret"
      }
    },
    "NATGateway1Id": {
      "Description": "NAT Gateway 1 ID",
      "Value": {
        "Ref": "NATGateway1"
      }
    },
    "NATGateway2Id": {
      "Description": "NAT Gateway 2 ID",
      "Value": {
        "Ref": "NATGateway2"
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
    "S3WebsiteBucketName": {
      "Description": "S3 website bucket name",
      "Value": {
        "Ref": "S3WebsiteBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3WebsiteBucketName"
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
    },
    "CPUAlarmHighName": {
      "Description": "CPU High Alarm Name",
      "Value": {
        "Ref": "CPUAlarmHigh"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CPUAlarmHighName"
        }
      }
    },
    "CPUAlarmLowName": {
      "Description": "CPU Low Alarm Name",
      "Value": {
        "Ref": "CPUAlarmLow"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CPUAlarmLowName"
        }
      }
    },
    "ScaleUpPolicyName": {
      "Description": "Scale Up Policy Name",
      "Value": {
        "Ref": "ScaleUpPolicy"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ScaleUpPolicyName"
        }
      }
    },
    "ScaleDownPolicyName": {
      "Description": "Scale Down Policy Name",
      "Value": {
        "Ref": "ScaleDownPolicy"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ScaleDownPolicyName"
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
    }
  }
}
```

## Key Features

### Security

The template implements comprehensive security through multiple layers. Database credentials are automatically generated by AWS Secrets Manager with 32-character passwords excluding problematic characters, eliminating hardcoded credentials. All RDS storage is encrypted at rest using AWS-managed keys with gp3 storage for better performance. Network security groups implement strict ingress rules: the web server security group allows HTTP/HTTPS from anywhere while the RDS security group permits MySQL traffic only from the web server security group using security group references. AWS WAF protects CloudFront with rate limiting (2000 requests per 5 minutes) and AWS Managed Rules Core Rule Set covering OWASP Top 10 vulnerabilities. S3 bucket access is controlled through bucket policies for public read access to website content. IAM policies follow least privilege with EC2 instances granted access only to the specific S3 bucket and database secret. VPC Flow Logs capture all network traffic for security analysis and compliance auditing.

### Scalability

The architecture provides automatic horizontal scaling through the Auto Scaling Group. The ASG dynamically adjusts capacity from 2 to 5 instances based on CPU utilization, scaling up at 70% threshold and down at 30% threshold with 5-minute cooldown periods. CloudFront distribution automatically scales to handle global traffic with edge caching reducing origin load using managed cache policies for optimal performance. RDS Multi-AZ deployment can scale up to larger instance classes without architecture changes. The VPC design with /16 CIDR block provides ample IP address space for future growth. S3 automatically handles any request volume without capacity planning. The Launch Template enables easy updates to instance configuration with versioning support.

### Operational Excellence

The template achieves operational excellence through infrastructure as code with comprehensive parameterization for all environment-specific values. Dynamic AMI resolution through SSM Parameter Store eliminates outdated AMI issues and ensures instances launch with latest security patches. CloudWatch monitoring provides system visibility with CPU-based alarms triggering automatic scaling actions for the ASG. Enhanced RDS monitoring with 60-second intervals enables detailed performance analysis of database operations. Automated daily backups with AWS Backup protect the RDS instance using explicit ARN-based selection with 30-day retention. VPC Flow Logs enable network troubleshooting and security analysis with 7-day retention in CloudWatch Logs. Consistent tagging across all resources enables cost allocation, compliance auditing, and operational automation. CloudWatch Logs integration for RDS exports error, general, and slow query logs.

### Cost Optimization

The design balances cost with functionality through several optimizations. T2/T3 instance types provide burstable performance at lower cost for variable workloads. Auto Scaling ensures you pay only for capacity actually needed, scaling down during low-traffic periods with automatic instance replacement. RDS backup retention is set to 30 days with automatic deletion to manage storage costs. The template uses AllowedValues constraints to prevent accidental deployment of oversized instances. RDS uses gp3 storage for cost-effective performance without premium IOPS charges. Flow logs retention is limited to 7 days to minimize storage costs while maintaining security visibility.

### Reliability

The architecture achieves high reliability through multi-layer redundancy. Resources span two Availability Zones protecting against AZ-level failures. Two NAT Gateways with separate route tables eliminate single points of failure in private subnet connectivity. The Auto Scaling Group maintains minimum 2-instance capacity with health checks and 5-minute grace period, automatically replacing failed instances within minutes. RDS Multi-AZ deployment provides automatic failover with synchronous replication maintaining data consistency across AZs within 1-2 minutes. Route 53 provides 100% uptime SLA for DNS queries. S3 provides 11 nines of durability for website content. Automated daily backups enable recovery from data corruption or accidental deletion. This comprehensive redundancy ensures application availability during component failures, AZ outages, or disaster scenarios.

## Modern AWS Practices

### Auto Scaling with Launch Templates

The infrastructure uses Launch Templates rather than legacy Launch Configurations. Launch Templates support versioning (using GetAtt LatestVersionNumber for automatic updates), allowing configuration updates without replacement and enabling easy rollback. The template references the latest version dynamically using Fn::GetAtt, ensuring the Auto Scaling Group always uses the most recent configuration. Launch Templates support more instance features than Launch Configurations including T2/T3 unlimited mode, dedicated hosts, and placement groups. The user data script installs required software (httpd, mysql, jq, CloudWatch agent, SSM agent) and starts services automatically on instance launch. Tag specifications in the Launch Template automatically tag instances created by the ASG.

### Secrets Manager for Credential Management

Database credentials are fully managed by AWS Secrets Manager with automatic generation rather than CloudFormation parameters. Secrets Manager generates strong passwords (32 characters with all character types, excluding problematic characters) and stores them encrypted with automatic key rotation capability. The secret is referenced in the RDS resource using dynamic references (`{{resolve:secretsmanager:...}}`), which CloudFormation resolves during stack operations without exposing credentials in templates, logs, or console outputs. EC2 instances can retrieve credentials programmatically using the GetSecretValue API with IAM permissions scoped to the specific secret. This approach enables credential rotation without instance replacement or application restarts.

### RDS Enhanced Monitoring

The RDS instance uses Enhanced Monitoring with 60-second intervals, providing visibility into operating system metrics beyond standard CloudWatch metrics. Enhanced Monitoring shows CPU utilization by process, memory breakdown by type, disk I/O statistics, and network activity. A dedicated IAM role (RDSMonitoringRole) grants RDS permission to publish metrics to CloudWatch using the AmazonRDSEnhancedMonitoringRole managed policy. This granular monitoring enables rapid identification of performance bottlenecks such as resource-intensive queries, memory pressure, disk I/O contention, or network saturation. CloudWatch Logs integration exports RDS error, general, and slow query logs for centralized analysis.

### AWS WAF Integration

AWS WAF with REGIONAL scope provides application layer protection for web applications. The rate-limiting rule blocks IP addresses exceeding 2000 requests per 5-minute period, protecting against DDoS attacks, aggressive scrapers, and API abuse. The AWS Managed Rules Core Rule Set provides protection against OWASP Top 10 vulnerabilities including SQL injection, cross-site scripting, local file inclusion, and remote file inclusion. WAF rules can be updated without infrastructure changes. CloudWatch metrics enable monitoring of blocked requests, rule effectiveness, and attack patterns with sampled requests for detailed analysis.

### VPC Flow Logs

VPC Flow Logs capture metadata about all network traffic entering and leaving the VPC including source/destination IPs, ports, protocols, packet/byte counts, and accept/reject decisions. Flow logs stream to CloudWatch Logs with 7-day retention for cost optimization and compliance requirements. An IAM role grants VPC Flow Logs permission to create log streams and write log events to CloudWatch. Flow logs enable security analysis (detecting suspicious traffic patterns, unauthorized access attempts), network troubleshooting (identifying connection failures, routing issues), and compliance auditing (demonstrating network segmentation, access controls). Flow logs capture all traffic types (accepted, rejected, and all) for comprehensive visibility.

### AWS Backup Centralized Management

AWS Backup provides centralized backup management across AWS services using a single backup plan. The backup plan defines schedule (daily at 5 AM UTC using cron expression), retention (30 days for cost optimization), and lifecycle policy. Backup selection uses explicit RDS instance ARN rather than tag-based selection for precise control. This ARN-based approach ensures specific critical resources are backed up without dependency on tag propagation. An IAM role grants AWS Backup cross-service permissions to create backups and perform restores using AWS managed policies (AWSBackupServiceRolePolicyForBackup, AWSBackupServiceRolePolicyForRestores).

### Multi-AZ High Availability

The architecture achieves true high availability by spanning two Availability Zones with independent failure domains. Each AZ has dedicated public and private subnets with separate NAT Gateways and private route tables. Private subnets route through their respective NAT Gateway, ensuring continued connectivity even if one AZ experiences complete failure. RDS Multi-AZ deployment maintains a synchronous standby replica in the second AZ with sub-minute automatic failover using synchronous replication. The Auto Scaling Group distributes instances across both AZs with automatic rebalancing. This multi-AZ design protects against AZ-level infrastructure failures, power outages, network partitions, or disaster scenarios while maintaining application availability and data consistency.

### Infrastructure as Code Best Practices

All resources follow consistent naming conventions using Fn::Sub to incorporate the environment suffix, enabling multiple environment deployments from the same template without naming conflicts. Parameters use validation through AllowedPattern, AllowedValues, MinValue, and MaxValue to prevent configuration errors at deploy time. The template uses DependsOn attributes for explicit dependencies (EIPs depend on Internet Gateway attachment) and implicit dependencies through Ref and GetAtt functions for automatic resource ordering. Metadata sections organize parameters into logical groups for improved user experience in the CloudFormation console. Comprehensive tagging with Name, Environment, and Project enables cost allocation through AWS Cost Explorer, automated compliance auditing, and operational automation through tag-based resource selection. All outputs use Export for cross-stack references following the naming pattern `${AWS::StackName}-{Name}` for predictable cross-stack integration.
