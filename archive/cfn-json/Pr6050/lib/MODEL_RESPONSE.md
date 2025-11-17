# Model Response

This CloudFormation JSON template creates a complete auto-scaling infrastructure for a Node.js e-commerce application with VPC, ALB, Auto Scaling Group, RDS PostgreSQL with read replica, and Secrets Manager integration.

## File: lib/ecommerce-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Auto-scaling Node.js e-commerce application infrastructure with RDS PostgreSQL read replica",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming uniqueness",
      "Default": "dev"
    },
    "ProjectName": {
      "Type": "String",
      "Description": "Project name for resource tagging",
      "Default": "ecommerce"
    },
    "EnvironmentTag": {
      "Type": "String",
      "Description": "Environment tag value",
      "Default": "development",
      "AllowedValues": ["development", "staging", "production"]
    },
    "ACMCertificateArn": {
      "Type": "String",
      "Description": "ARN of ACM certificate for HTTPS listener"
    },
    "LatestAmiId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Description": "Latest Amazon Linux 2 AMI ID from SSM Parameter Store",
      "Default": "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"
    },
    "DBMasterUsername": {
      "Type": "String",
      "Description": "Master username for RDS instance",
      "Default": "dbadmin",
      "MinLength": "1",
      "MaxLength": "16",
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
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
              "Fn::Sub": "igw-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
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
        "CidrBlock": "10.0.1.0/24",
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
              "Fn::Sub": "public-subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
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
        "CidrBlock": "10.0.2.0/24",
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
              "Fn::Sub": "public-subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
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
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
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
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
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
              "Fn::Sub": "public-rt-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
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
    "NATGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "nat-eip-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "NATGateway2EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "nat-eip-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGateway1EIP",
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
              "Fn::Sub": "nat-gateway-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "NATGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGateway2EIP",
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
              "Fn::Sub": "nat-gateway-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
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
              "Fn::Sub": "private-rt-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
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
              "Fn::Sub": "private-rt-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
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
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "alb-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS from internet"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP from internet"
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
              "Fn::Sub": "alb-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "ec2-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3000,
            "ToPort": 3000,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            },
            "Description": "Allow traffic from ALB on port 3000"
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
              "Fn::Sub": "ec2-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "rds-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for RDS PostgreSQL",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": {
              "Ref": "EC2SecurityGroup"
            },
            "Description": "Allow PostgreSQL access from EC2 instances"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "rds-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for RDS PostgreSQL",
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
              "Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "DBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "db-credentials-${EnvironmentSuffix}"
        },
        "Description": "Database credentials for RDS PostgreSQL",
        "GenerateSecretString": {
          "SecretStringTemplate": {
            "Fn::Sub": "{\"username\":\"${DBMasterUsername}\"}"
          },
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "db-credentials-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "DBInstance": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Snapshot",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "postgres-db-${EnvironmentSuffix}"
        },
        "Engine": "postgres",
        "EngineVersion": "14.13",
        "DBInstanceClass": "db.t3.medium",
        "AllocatedStorage": "100",
        "StorageType": "gp3",
        "MasterUsername": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:username}}"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:password}}"
        },
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VPCSecurityGroups": [
          {
            "Ref": "RDSSecurityGroup"
          }
        ],
        "MultiAZ": true,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "DeletionProtection": true,
        "EnableCloudwatchLogsExports": [
          "postgresql"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "postgres-db-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "DBReadReplica": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Snapshot",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "postgres-db-replica-${EnvironmentSuffix}"
        },
        "SourceDBInstanceIdentifier": {
          "Ref": "DBInstance"
        },
        "DBInstanceClass": "db.t3.medium",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "postgres-db-replica-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "SecretAttachment": {
      "Type": "AWS::SecretsManager::SecretTargetAttachment",
      "Properties": {
        "SecretId": {
          "Ref": "DBSecret"
        },
        "TargetId": {
          "Ref": "DBInstance"
        },
        "TargetType": "AWS::RDS::DBInstance"
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "app-alb-${EnvironmentSuffix}"
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
              "Fn::Sub": "app-alb-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "app-tg-${EnvironmentSuffix}"
        },
        "Port": 3000,
        "Protocol": "HTTP",
        "VpcId": {
          "Ref": "VPC"
        },
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "TargetType": "instance",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-tg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "ALBHTTPSListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "Port": 443,
        "Protocol": "HTTPS",
        "Certificates": [
          {
            "CertificateArn": {
              "Ref": "ACMCertificateArn"
            }
          }
        ],
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
    "ALBHTTPListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Type": "redirect",
            "RedirectConfig": {
              "Protocol": "HTTPS",
              "Port": "443",
              "StatusCode": "HTTP_301"
            }
          }
        ]
      }
    },
    "EC2InstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "ec2-instance-role-${EnvironmentSuffix}"
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
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
        "Policies": [
          {
            "PolicyName": "SecretsManagerAccess",
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
              "Fn::Sub": "ec2-instance-role-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          }
        ]
      }
    },
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {
          "Fn::Sub": "ec2-instance-profile-${EnvironmentSuffix}"
        },
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
          "Fn::Sub": "app-launch-template-${EnvironmentSuffix}"
        },
        "LaunchTemplateData": {
          "ImageId": {
            "Ref": "LatestAmiId"
          },
          "InstanceType": "t3.medium",
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
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y nodejs npm aws-cli jq\n\n# Get database credentials from Secrets Manager\nSECRET=$(aws secretsmanager get-secret-value --secret-id ${DBSecret} --region ${AWS::Region} --query SecretString --output text)\nDB_USERNAME=$(echo $SECRET | jq -r .username)\nDB_PASSWORD=$(echo $SECRET | jq -r .password)\nDB_HOST=${DBInstance.Endpoint.Address}\nDB_PORT=${DBInstance.Endpoint.Port}\nDB_NAME=ecommerce\n\n# Create connection string\nDB_CONNECTION_STRING=\"postgresql://$DB_USERNAME:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME\"\n\n# Export environment variables for application\necho \"export DATABASE_URL=$DB_CONNECTION_STRING\" >> /etc/environment\necho \"export DB_HOST=$DB_HOST\" >> /etc/environment\necho \"export DB_PORT=$DB_PORT\" >> /etc/environment\necho \"export DB_NAME=$DB_NAME\" >> /etc/environment\necho \"export DB_USERNAME=$DB_USERNAME\" >> /etc/environment\necho \"export DB_PASSWORD=$DB_PASSWORD\" >> /etc/environment\n\n# Create application directory\nmkdir -p /home/ec2-user/app\ncd /home/ec2-user/app\n\n# Create sample Node.js application\ncat > package.json <<'EOF'\n{\n  \"name\": \"ecommerce-app\",\n  \"version\": \"1.0.0\",\n  \"main\": \"server.js\",\n  \"dependencies\": {\n    \"express\": \"^4.18.2\",\n    \"pg\": \"^8.11.0\"\n  }\n}\nEOF\n\ncat > server.js <<'EOF'\nconst express = require('express');\nconst { Pool } = require('pg');\nconst app = express();\nconst PORT = 3000;\n\nconst pool = new Pool({\n  connectionString: process.env.DATABASE_URL,\n  ssl: { rejectUnauthorized: false }\n});\n\napp.get('/health', (req, res) => {\n  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });\n});\n\napp.get('/', async (req, res) => {\n  try {\n    const result = await pool.query('SELECT NOW()');\n    res.json({ message: 'E-commerce application is running', dbTime: result.rows[0].now });\n  } catch (err) {\n    res.status(500).json({ error: err.message });\n  }\n});\n\napp.listen(PORT, () => {\n  console.log(`Server running on port ${PORT}`);\n});\nEOF\n\n# Install dependencies and start application\nnpm install\nnode server.js > /var/log/app.log 2>&1 &\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "app-instance-${EnvironmentSuffix}"
                  }
                },
                {
                  "Key": "Environment",
                  "Value": {
                    "Ref": "EnvironmentTag"
                  }
                },
                {
                  "Key": "Project",
                  "Value": {
                    "Ref": "ProjectName"
                  }
                }
              ]
            }
          ]
        },
        "TagSpecifications": [
          {
            "ResourceType": "launch-template",
            "Tags": [
              {
                "Key": "Name",
                "Value": {
                  "Fn::Sub": "app-launch-template-${EnvironmentSuffix}"
                }
              },
              {
                "Key": "Environment",
                "Value": {
                  "Ref": "EnvironmentTag"
                }
              },
              {
                "Key": "Project",
                "Value": {
                  "Ref": "ProjectName"
                }
              }
            ]
          }
        ]
      }
    },
    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "DependsOn": [
        "DBInstance"
      ],
      "Properties": {
        "AutoScalingGroupName": {
          "Fn::Sub": "app-asg-${EnvironmentSuffix}"
        },
        "MinSize": "2",
        "MaxSize": "6",
        "DesiredCapacity": "2",
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
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
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-asg-instance-${EnvironmentSuffix}"
            },
            "PropagateAtLaunch": true
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentTag"
            },
            "PropagateAtLaunch": true
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            },
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "ScaleUpPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AutoScalingGroupName": {
          "Ref": "AutoScalingGroup"
        },
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
          },
          "TargetValue": 70.0
        }
      }
    },
    "ScaleDownPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AutoScalingGroupName": {
          "Ref": "AutoScalingGroup"
        },
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
          },
          "TargetValue": 30.0
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
    "LoadBalancerDNS": {
      "Description": "DNS name of the Application Load Balancer",
      "Value": {
        "Fn::GetAtt": [
          "ApplicationLoadBalancer",
          "DNSName"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ALBDNSName"
        }
      }
    },
    "LoadBalancerURL": {
      "Description": "URL of the Application Load Balancer",
      "Value": {
        "Fn::Sub": "https://${ApplicationLoadBalancer.DNSName}"
      }
    },
    "RDSEndpoint": {
      "Description": "RDS PostgreSQL primary instance endpoint",
      "Value": {
        "Fn::GetAtt": [
          "DBInstance",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-RDSEndpoint"
        }
      }
    },
    "RDSPort": {
      "Description": "RDS PostgreSQL port",
      "Value": {
        "Fn::GetAtt": [
          "DBInstance",
          "Endpoint.Port"
        ]
      }
    },
    "RDSReadReplicaEndpoint": {
      "Description": "RDS PostgreSQL read replica endpoint",
      "Value": {
        "Fn::GetAtt": [
          "DBReadReplica",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-RDSReadReplicaEndpoint"
        }
      }
    },
    "DBSecretArn": {
      "Description": "ARN of the database credentials secret in Secrets Manager",
      "Value": {
        "Ref": "DBSecret"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DBSecretArn"
        }
      }
    },
    "AutoScalingGroupName": {
      "Description": "Name of the Auto Scaling Group",
      "Value": {
        "Ref": "AutoScalingGroup"
      }
    }
  }
}
```

## Implementation Notes

This CloudFormation template provides a complete, production-ready infrastructure with the following key features:

1. **Network Architecture**: VPC with 2 public and 2 private subnets across 2 availability zones, NAT Gateways for outbound internet access from private subnets.

2. **Application Load Balancer**: Deployed in public subnets with HTTPS listener using ACM certificate, HTTP to HTTPS redirect, and health checks targeting /health endpoint.

3. **Auto Scaling**: EC2 instances deployed in private subnets with minimum 2 and maximum 6 instances, CPU-based scaling policies (scale up at 70%, scale down at 30%).

4. **Database**: RDS PostgreSQL 14.13 with Multi-AZ deployment, one read replica, automated backups, and deletion protection enabled.

5. **Security**: Security groups restricting ALB to HTTPS/HTTP, EC2 to port 3000 from ALB only, and RDS to port 5432 from EC2 only. Database credentials stored in AWS Secrets Manager.

6. **IAM Roles**: EC2 instances have IAM role with permissions to access Secrets Manager for database credentials.

7. **User Data**: Automated Node.js application deployment with database connection string retrieved from Secrets Manager.

8. **Resource Naming**: All resources include environmentSuffix parameter for unique identification.

9. **Tagging**: All resources tagged with Environment and Project tags for cost tracking and management.

10. **Outputs**: ALB DNS name, RDS primary endpoint, RDS read replica endpoint, and Secrets Manager ARN.
