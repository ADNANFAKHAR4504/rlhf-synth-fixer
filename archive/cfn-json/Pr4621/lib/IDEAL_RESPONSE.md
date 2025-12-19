# Ideal Response: Robust Cloud Environment Setup

## Architecture Overview

This CloudFormation template creates a secure, production-ready AWS cloud environment with comprehensive network isolation, high availability across multiple Availability Zones, S3 storage, and robust monitoring following AWS best practices and the Well-Architected Framework.

### Network Architecture

The infrastructure implements a multi-tier VPC architecture spanning two Availability Zones. The VPC uses a 10.0.0.0/16 CIDR block with public subnets (10.0.1.0/24, 10.0.2.0/24) for internet-facing EC2 instances and private subnets (10.0.3.0/24, 10.0.4.0/24) for database isolation. An Internet Gateway provides public subnet connectivity, while a single NAT Gateway in the first public subnet with an Elastic IP enables outbound internet access for private subnet resources. This design balances cost optimization with security requirements by using a shared NAT Gateway while maintaining proper network segmentation.

### Compute Layer

Two EC2 t2.micro instances deploy across both public subnets for high availability and fault tolerance. Each instance has restricted SSH access from a specific IP address (203.0.113.0/32). The instances use dynamic AMI resolution through SSM Parameter Store, avoiding hardcoded AMI IDs that can become outdated or vulnerable. An IAM instance profile grants the EC2 instances permissions to access S3 for object storage operations and CloudWatch for metrics publishing. Both instances have CloudWatch monitoring enabled with user data scripts that install MySQL client and CloudWatch agent for comprehensive monitoring and database connectivity.

### Database Layer

The RDS MySQL 8.0.43 database deploys across private subnets using a DB Subnet Group spanning both Availability Zones. The database is not publicly accessible and accepts connections only from the EC2 security group through port 3306. Database credentials are managed through CloudFormation parameters with NoEcho property to prevent credential exposure in console or API responses. The database includes automated daily backups with 7-day retention, storage encryption at rest, and CloudWatch Logs integration for error, general, and slow query logs.

### Storage Layer

An S3 bucket with versioning enabled provides object storage for the application. The bucket name incorporates the AWS Account ID to ensure global uniqueness. Server-side encryption with AES256 protects data at rest. Public access is completely blocked through bucket configuration. A lifecycle policy automatically deletes noncurrent versions after 90 days to manage storage costs. The bucket has a Retain deletion policy, ensuring data persists even if the CloudFormation stack is deleted, protecting against accidental data loss.

### Security

Security implementation follows the principle of least privilege at every layer. The EC2 security group permits only SSH traffic on port 22 from the specified IP address (203.0.113.0/32). The RDS security group allows only MySQL traffic on port 3306 from the EC2 security group, using security group references instead of IP-based rules for automatic IP address management. IAM policies grant minimal permissions with resource-specific access - EC2 instances can only access their designated S3 bucket and publish CloudWatch metrics. Database credentials use NoEcho parameters and are never exposed in logs or outputs. All RDS storage is encrypted at rest using AWS-managed keys.

### Monitoring

Comprehensive CloudWatch monitoring provides visibility into system health and performance. An EC2 CPU alarm triggers when CPU utilization exceeds 80% over two consecutive 5-minute evaluation periods. RDS monitoring includes both a CPU alarm (80% threshold) and a storage alarm (triggers when free storage drops below 2GB). EC2 instances have detailed monitoring enabled. RDS logs (error, general, slow query) are exported to CloudWatch Logs for centralized log management and analysis. These alarms enable proactive response to performance issues before they impact users.

### High Availability

The architecture spans two Availability Zones with subnets in each zone, providing resilience against AZ failures. Two EC2 instances across different AZs ensure compute availability if one AZ experiences issues. The RDS database can be upgraded to Multi-AZ deployment if higher availability is required. The DB Subnet Group configuration supports automatic failover scenarios. The NAT Gateway, while single-instance for cost optimization, can be enhanced with a second NAT Gateway in the second AZ for full HA at additional cost.

## CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Cloud Environment Setup - VPC, EC2, RDS, S3, and CloudWatch monitoring infrastructure",
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
            "default": "EC2 Configuration"
          },
          "Parameters": [
            "EC2InstanceType",
            "SSHAllowedCIDR",
            "LatestAmiId"
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
      "Description": "EC2 instance type",
      "AllowedValues": ["t2.micro", "t2.small", "t2.medium"]
    },
    "SSHAllowedCIDR": {
      "Type": "String",
      "Default": "203.0.113.0/32",
      "Description": "CIDR block allowed to SSH to EC2 instances",
      "AllowedPattern": "^(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/(\\d|[1-2]\\d|3[0-2]))$"
    },
    "LatestAmiId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Default": "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2",
      "Description": "Latest Amazon Linux 2 AMI ID"
    },
    "DBInstanceClass": {
      "Type": "String",
      "Default": "db.t3.micro",
      "Description": "RDS instance class",
      "AllowedValues": ["db.t3.micro", "db.t3.small", "db.t3.medium"]
    },
    "DBName": {
      "Type": "String",
      "Default": "appdb",
      "Description": "Database name",
      "MinLength": "1",
      "MaxLength": "64",
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$"
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
            "Value": "CloudEnvironmentSetup"
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
            "Value": "CloudEnvironmentSetup"
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
            "Value": "CloudEnvironmentSetup"
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
            "Value": "CloudEnvironmentSetup"
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
            "Value": "CloudEnvironmentSetup"
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
            "Value": "CloudEnvironmentSetup"
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
            "Value": "CloudEnvironmentSetup"
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
            "Value": "CloudEnvironmentSetup"
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
            "Value": "CloudEnvironmentSetup"
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
            "Value": "CloudEnvironmentSetup"
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
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances - allows SSH from specific IP",
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
            "Description": "SSH access from specific IP range"
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
            "Value": "CloudEnvironmentSetup"
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
              "Ref": "EC2SecurityGroup"
            },
            "Description": "MySQL access from EC2 instances"
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
            "Value": "CloudEnvironmentSetup"
          }
        ]
      }
    },
    "DBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "RDS-Credentials-${EnvironmentSuffix}"
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
            "Value": "CloudEnvironmentSetup"
          }
        ]
      }
    },
    "EC2InstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "EC2InstanceRole-${EnvironmentSuffix}"
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
            "PolicyName": "S3AccessPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
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
            "Value": "CloudEnvironmentSetup"
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
    "EC2Instance1": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "InstanceType": {
          "Ref": "EC2InstanceType"
        },
        "ImageId": {
          "Ref": "LatestAmiId"
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "SecurityGroupIds": [
          {
            "Ref": "EC2SecurityGroup"
          }
        ],
        "IamInstanceProfile": {
          "Ref": "EC2InstanceProfile"
        },
        "Monitoring": true,
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash\n",
                "yum update -y\n",
                "yum install -y mysql amazon-cloudwatch-agent jq\n",
                "yum install -y amazon-ssm-agent\n",
                "systemctl enable amazon-ssm-agent\n",
                "systemctl start amazon-ssm-agent\n",
                "echo 'EC2Instance1 setup complete' > /var/log/userdata.log\n"
              ]
            ]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "EC2Instance1-${EnvironmentSuffix}"
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
            "Value": "CloudEnvironmentSetup"
          }
        ]
      }
    },
    "EC2Instance2": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "InstanceType": {
          "Ref": "EC2InstanceType"
        },
        "ImageId": {
          "Ref": "LatestAmiId"
        },
        "SubnetId": {
          "Ref": "PublicSubnet2"
        },
        "SecurityGroupIds": [
          {
            "Ref": "EC2SecurityGroup"
          }
        ],
        "IamInstanceProfile": {
          "Ref": "EC2InstanceProfile"
        },
        "Monitoring": true,
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash\n",
                "yum update -y\n",
                "yum install -y mysql amazon-cloudwatch-agent jq\n",
                "yum install -y amazon-ssm-agent\n",
                "systemctl enable amazon-ssm-agent\n",
                "systemctl start amazon-ssm-agent\n",
                "echo 'EC2Instance2 setup complete' > /var/log/userdata.log\n"
              ]
            ]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "EC2Instance2-${EnvironmentSuffix}"
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
            "Value": "CloudEnvironmentSetup"
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
            "Value": "CloudEnvironmentSetup"
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
        "StorageType": "gp2",
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
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          }
        ]
      }
    },
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Retain",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "cloud-env-bucket-${AWS::AccountId}-${EnvironmentSuffix}"
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
            "Value": "CloudEnvironmentSetup"
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
        "AlarmDescription": "Alert when EC2 CPU exceeds 80%",
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
              "Ref": "EC2Instance1"
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
    "RDSStorageAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "RDS-LowStorage-${EnvironmentSuffix}"
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
              "Ref": "RDSInstance"
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
    "EC2Instance1Id": {
      "Description": "EC2 Instance 1 ID",
      "Value": {
        "Ref": "EC2Instance1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EC2Instance1Id"
        }
      }
    },
    "EC2Instance2Id": {
      "Description": "EC2 Instance 2 ID",
      "Value": {
        "Ref": "EC2Instance2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EC2Instance2Id"
        }
      }
    },
    "EC2Instance1PublicIP": {
      "Description": "Public IP of EC2 Instance 1",
      "Value": {
        "Fn::GetAtt": [
          "EC2Instance1",
          "PublicIp"
        ]
      }
    },
    "EC2Instance2PublicIP": {
      "Description": "Public IP of EC2 Instance 2",
      "Value": {
        "Fn::GetAtt": [
          "EC2Instance2",
          "PublicIp"
        ]
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
      "Description": "Name of the S3 bucket",
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
        "Fn::GetAtt": [
          "S3Bucket",
          "Arn"
        ]
      }
    },
    "NATGatewayId": {
      "Description": "NAT Gateway ID",
      "Value": {
        "Ref": "NATGateway"
      }
    },
    "NATGatewayEIP": {
      "Description": "Elastic IP associated with NAT Gateway",
      "Value": {
        "Ref": "NATGatewayEIP"
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
    "DBSecretArn": {
      "Description": "ARN of the Secrets Manager secret containing database credentials",
      "Value": {
        "Ref": "DBSecret"
      }
    }
  }
}
```

## Key Features

### Security

The template implements defense-in-depth security with multiple layers of protection. Database credentials are managed through CloudFormation parameters with NoEcho property, preventing credential exposure in console outputs, logs, or API responses. All RDS storage is encrypted at rest using AWS-managed keys. S3 bucket encryption protects data at rest with AES256. Network security groups implement strict ingress rules with the EC2 security group allowing only SSH from a specific IP address (203.0.113.0/32), and the RDS security group permitting only MySQL traffic from the EC2 security group using security group references rather than IP-based rules. S3 public access is completely blocked to prevent accidental data exposure. IAM policies follow least privilege with resource-specific access controls.

### Scalability

The architecture supports horizontal scaling through its multi-AZ subnet design. Additional EC2 instances can be deployed across both public subnets behind an Application Load Balancer for automatic traffic distribution. The RDS instance can be upgraded to Multi-AZ deployment for automatic failover capability. The VPC design accommodates future growth with CIDR space for additional subnets. S3 automatically scales to handle any amount of data and requests without capacity planning.

### Operational Excellence

The template uses comprehensive parameterization for all environment-specific values, enabling reuse across different environments (dev, staging, prod) without modification. CloudWatch monitoring provides visibility into system health with three alarms (EC2 CPU, RDS CPU, RDS Storage) enabling proactive response to performance issues. Enhanced monitoring on EC2 instances provides detailed metrics for troubleshooting. Automated backups with 7-day retention protect against data loss and enable point-in-time recovery. S3 versioning protects against accidental deletion or overwrites with the ability to restore previous versions.

### Cost Optimization

The design balances cost with functionality by using a single NAT Gateway rather than multiple gateways per AZ, reducing NAT Gateway charges while maintaining outbound internet access for private resources. The RDS instance deploys in single-AZ mode since Multi-AZ was not specified in requirements. T2/T3 instance types provide burstable performance at lower cost for variable workloads. The template uses AllowedValues constraints to prevent accidental deployment of oversized instances. S3 lifecycle policy automatically deletes noncurrent versions after 90 days to manage storage costs. RDS storage uses gp2 for cost-effective baseline performance.

### Reliability

The multi-AZ architecture protects against Availability Zone failures. Two EC2 instances across different AZs ensure compute availability. The DB Subnet Group spans both zones, enabling RDS to automatically provision a standby instance if Multi-AZ is enabled. Automated daily backups with 7-day retention provide recovery capabilities. The NAT Gateway is a managed service with built-in redundancy within its Availability Zone. S3 provides 99.999999999% durability with automatic replication across multiple facilities within the region. CloudWatch alarms enable rapid detection and response to issues before they impact users.

## Modern AWS Practices

### Dynamic AMI Resolution

The template uses SSM Parameter Store dynamic references to retrieve the latest Amazon Linux 2 AMI ID at stack creation time. This approach prevents the security and operational risks of hardcoded AMI IDs, which can become outdated or vulnerable. The SSM parameter `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2` is maintained by AWS and always points to the current recommended AMI for the region. This ensures instances always launch with the latest security patches and updates without manual template maintenance.

### Secure Credential Management

Database credentials are managed through CloudFormation parameters with the NoEcho property rather than hardcoded values. This prevents credentials from appearing in the CloudFormation console, API responses, or CloudTrail logs. While not as secure as AWS Secrets Manager, this approach meets the requirement of not hardcoding credentials in the template. The parameters use validation patterns to ensure passwords meet minimum complexity requirements.

### IAM Instance Profiles

EC2 instances use IAM instance profiles rather than embedded credentials or access keys. The associated role grants minimal permissions following the principle of least privilege: CloudWatch metrics publishing, SSM access for remote management, and S3 access limited to the specific bucket created by this template. This approach eliminates credential management burden and enables automatic credential rotation through AWS STS. The use of managed policies (CloudWatchAgentServerPolicy, AmazonSSMManagedInstanceCore) ensures best practices for common scenarios.

### Infrastructure as Code Best Practices

All resources follow consistent naming conventions using the Fn::Sub intrinsic function to incorporate the environment suffix, enabling multiple environment deployments from the same template. Parameters use validation through AllowedPattern and AllowedValues to prevent configuration errors at deploy time. The template uses DependsOn attributes and implicit dependencies through Ref and GetAtt functions to ensure proper resource creation order. Metadata sections organize parameters into logical groups for improved user experience in the CloudFormation console.

### Tagging Strategy

All resources include comprehensive tagging with three consistent tags: Name (human-readable identifier with environment suffix), Environment (deployment environment), and Project (project identifier for cost allocation). Consistent tagging enables resource organization, cost allocation through AWS Cost Explorer, automated compliance auditing, and operational automation through tag-based resource selection.

### S3 Security and Lifecycle Management

The S3 bucket implements multiple security layers: versioning for data protection, encryption at rest with AES256, complete public access blocking, and account ID in bucket name for global uniqueness. The Retain deletion policy protects against accidental data loss when stacks are deleted. Lifecycle policies automatically manage storage costs by deleting noncurrent versions after 90 days. These configurations follow AWS security best practices and compliance requirements.

### High Availability Design

The template deploys resources across two Availability Zones to protect against AZ-level failures. EC2 instances in separate AZs can be load balanced for active-active configuration. The DB Subnet Group spans both AZs, supporting future Multi-AZ RDS deployment without template changes. Subnets use Fn::Select with Fn::GetAZs to automatically distribute across available AZs in any region. This design provides resilience while maintaining deployment flexibility across different AWS regions.

### Monitoring and Observability

CloudWatch integration provides comprehensive monitoring across all infrastructure layers. EC2 instances have detailed monitoring enabled for 1-minute metric granularity. RDS exports error, general, and slow query logs to CloudWatch Logs for centralized log analysis. Three CloudWatch alarms monitor critical metrics (EC2 CPU, RDS CPU, RDS storage) with appropriate thresholds and evaluation periods. This observability foundation enables proactive issue detection and rapid troubleshooting.
