# CloudFormation Template - Three-Tier Migration Infrastructure

This CloudFormation template creates a complete three-tier migration infrastructure for moving a legacy application to AWS. The template includes VPC, ALB, Auto Scaling, and RDS PostgreSQL with Multi-AZ deployment.

## Architecture Overview

The template creates:

- VPC with public and private subnets across 2 availability zones
- Application Load Balancer for distributing traffic
- Auto Scaling Groups for application servers
- RDS PostgreSQL database with Multi-AZ
- Security groups with least privilege access
- AWS Secrets Manager for database credentials

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Three-Tier Migration Infrastructure - VPC, ALB, Auto Scaling, RDS PostgreSQL with Multi-AZ",
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
            "default": "Database Configuration"
          },
          "Parameters": [
            "DBUsername",
            "DBPassword",
            "DBAllocatedStorage",
            "DBInstanceClass"
          ]
        },
        {
          "Label": {
            "default": "Application Configuration"
          },
          "Parameters": ["InstanceType", "KeyName", "LatestAmiId"]
        }
      ]
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "migration",
      "Description": "Environment suffix for resource naming uniqueness",
      "AllowedPattern": "^[a-zA-Z0-9-]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters and hyphens"
    },
    "DBUsername": {
      "Type": "String",
      "Default": "postgres",
      "Description": "Database master username",
      "MinLength": "1",
      "MaxLength": "16",
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$"
    },
    "DBPassword": {
      "Type": "String",
      "NoEcho": true,
      "Description": "Database master password (min 8 characters)",
      "MinLength": "8",
      "MaxLength": "41"
    },
    "DBAllocatedStorage": {
      "Type": "Number",
      "Default": 20,
      "Description": "Database allocated storage in GB",
      "MinValue": 20,
      "MaxValue": 100
    },
    "DBInstanceClass": {
      "Type": "String",
      "Default": "db.t3.micro",
      "Description": "Database instance class",
      "AllowedValues": [
        "db.t3.micro",
        "db.t3.small",
        "db.t3.medium",
        "db.r5.large"
      ]
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "Description": "EC2 instance type for application servers",
      "AllowedValues": ["t3.micro", "t3.small", "t3.medium", "t3.large"]
    },
    "KeyName": {
      "Type": "AWS::EC2::KeyPair::KeyName",
      "Description": "EC2 key pair name for SSH access"
    },
    "LatestAmiId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Default": "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2",
      "Description": "Latest Amazon Linux 2 AMI ID"
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
            "Value": { "Fn::Sub": "migration-vpc-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "migration"
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
            "Value": "migration-igw"
          }
        ]
      }
    },
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "InternetGatewayId": { "Ref": "InternetGateway" }
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "migration-public-subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Tier",
            "Value": "public"
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "migration-public-subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Tier",
            "Value": "public"
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "migration-private-subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Tier",
            "Value": "private"
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "migration-private-subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Tier",
            "Value": "private"
          }
        ]
      }
    },
    "DBSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.21.0/24",
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "migration-db-subnet-1-${EnvironmentSuffix}" }
          },
          {
            "Key": "Tier",
            "Value": "database"
          }
        ]
      }
    },
    "DBSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.22.0/24",
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "migration-db-subnet-2-${EnvironmentSuffix}" }
          },
          {
            "Key": "Tier",
            "Value": "database"
          }
        ]
      }
    },
    "NatGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "migration-nat-eip-1-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "NatGateway2EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "migration-nat-eip-2-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "NatGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["NatGateway1EIP", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet1" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "migration-nat-1-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "NatGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["NatGateway2EIP", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet2" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "migration-nat-2-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "migration-public-rt-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": { "Ref": "InternetGateway" }
      }
    },
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet1" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet2" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "migration-private-rt-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable1" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NatGateway1" }
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet1" },
        "RouteTableId": { "Ref": "PrivateRouteTable1" }
      }
    },
    "PrivateRouteTable2": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "migration-private-rt-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable2" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NatGateway2" }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet2" },
        "RouteTableId": { "Ref": "PrivateRouteTable2" }
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "migration-db-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for RDS PostgreSQL database",
        "SubnetIds": [{ "Ref": "DBSubnet1" }, { "Ref": "DBSubnet2" }],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "migration-db-subnet-group-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": { "Fn::Sub": "migration-alb-sg-${EnvironmentSuffix}" },
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
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
            "Value": { "Fn::Sub": "migration-alb-sg-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "AppSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": { "Fn::Sub": "migration-app-sg-${EnvironmentSuffix}" },
        "GroupDescription": "Security group for application servers",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 8080,
            "ToPort": 8080,
            "SourceSecurityGroupId": { "Ref": "ALBSecurityGroup" },
            "Description": "Allow traffic from ALB on port 8080"
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
            "Value": { "Fn::Sub": "migration-app-sg-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": { "Fn::Sub": "migration-db-sg-${EnvironmentSuffix}" },
        "GroupDescription": "Security group for RDS PostgreSQL database",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": { "Ref": "AppSecurityGroup" },
            "Description": "Allow PostgreSQL from application servers"
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
            "Value": { "Fn::Sub": "migration-db-sg-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": { "Fn::Sub": "migration-alb-${EnvironmentSuffix}" },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [{ "Ref": "PublicSubnet1" }, { "Ref": "PublicSubnet2" }],
        "SecurityGroups": [{ "Ref": "ALBSecurityGroup" }],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "migration-alb-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "BlueTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": { "Fn::Sub": "migration-blue-tg-${EnvironmentSuffix}" },
        "Port": 8080,
        "Protocol": "HTTP",
        "VpcId": { "Ref": "VPC" },
        "HealthCheckEnabled": true,
        "HealthCheckProtocol": "HTTP",
        "HealthCheckPath": "/health",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "TargetType": "instance",
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "migration-blue-tg-${EnvironmentSuffix}" }
          },
          {
            "Key": "DeploymentColor",
            "Value": "blue"
          }
        ]
      }
    },
    "GreenTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": { "Fn::Sub": "migration-green-tg-${EnvironmentSuffix}" },
        "Port": 8080,
        "Protocol": "HTTP",
        "VpcId": { "Ref": "VPC" },
        "HealthCheckEnabled": true,
        "HealthCheckProtocol": "HTTP",
        "HealthCheckPath": "/health",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "TargetType": "instance",
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "migration-green-tg-${EnvironmentSuffix}" }
          },
          {
            "Key": "DeploymentColor",
            "Value": "green"
          }
        ]
      }
    },
    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": { "Ref": "ApplicationLoadBalancer" },
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": { "Ref": "BlueTargetGroup" }
          }
        ]
      }
    },
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "migration-launch-template-${EnvironmentSuffix}"
        },
        "LaunchTemplateData": {
          "ImageId": { "Ref": "LatestAmiId" },
          "InstanceType": { "Ref": "InstanceType" },
          "KeyName": { "Ref": "KeyName" },
          "SecurityGroupIds": [{ "Ref": "AppSecurityGroup" }],
          "IamInstanceProfile": {
            "Arn": { "Fn::GetAtt": ["EC2InstanceProfile", "Arn"] }
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y java-11-amazon-corretto\n\n# Install application (placeholder)\nmkdir -p /opt/app\necho 'Application server starting on port 8080' > /opt/app/server.log\n\n# Simple health check endpoint\nyum install -y python3\ncat > /opt/app/health_server.py <<'EOF'\nimport http.server\nimport socketserver\n\nclass HealthHandler(http.server.SimpleHTTPRequestHandler):\n    def do_GET(self):\n        if self.path == '/health':\n            self.send_response(200)\n            self.send_header('Content-type', 'text/plain')\n            self.end_headers()\n            self.wfile.write(b'OK')\n        else:\n            self.send_response(404)\n            self.end_headers()\n\nwith socketserver.TCPServer(('', 8080), HealthHandler) as httpd:\n    httpd.serve_forever()\nEOF\n\npython3 /opt/app/health_server.py &\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "migration-app-server-${EnvironmentSuffix}"
                  }
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
          "Fn::Sub": "migration-asg-${EnvironmentSuffix}"
        },
        "VPCZoneIdentifier": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" }
        ],
        "LaunchTemplate": {
          "LaunchTemplateId": { "Ref": "LaunchTemplate" },
          "Version": { "Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"] }
        },
        "MinSize": "2",
        "MaxSize": "6",
        "DesiredCapacity": "2",
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "TargetGroupARNs": [{ "Ref": "BlueTargetGroup" }],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "migration-asg-instance-${EnvironmentSuffix}"
            },
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "EC2Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": { "Fn::Sub": "migration-ec2-role-${EnvironmentSuffix}" },
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
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "migration-ec2-role-${EnvironmentSuffix}" }
          }
        ]
      }
    },
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {
          "Fn::Sub": "migration-ec2-profile-${EnvironmentSuffix}"
        },
        "Roles": [{ "Ref": "EC2Role" }]
      }
    },
    "DBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": { "Fn::Sub": "migration-db-credentials-${EnvironmentSuffix}" },
        "Description": "Database credentials for RDS PostgreSQL",
        "SecretString": {
          "Fn::Sub": [
            "{\"username\":\"${Username}\",\"password\":\"${Password}\",\"engine\":\"postgres\",\"host\":\"${DBEndpoint}\",\"port\":5432,\"dbname\":\"migrationdb\"}",
            {
              "Username": { "Ref": "DBUsername" },
              "Password": { "Ref": "DBPassword" },
              "DBEndpoint": {
                "Fn::GetAtt": ["RDSInstance", "Endpoint.Address"]
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "migration-db-credentials-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "RDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "migration-postgres-${EnvironmentSuffix}"
        },
        "DBName": "migrationdb",
        "Engine": "postgres",
        "EngineVersion": "14.7",
        "DBInstanceClass": { "Ref": "DBInstanceClass" },
        "AllocatedStorage": { "Ref": "DBAllocatedStorage" },
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "MasterUsername": { "Ref": "DBUsername" },
        "MasterUserPassword": { "Ref": "DBPassword" },
        "MultiAZ": true,
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "VPCSecurityGroups": [{ "Ref": "DBSecurityGroup" }],
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "AutoMinorVersionUpgrade": true,
        "PubliclyAccessible": false,
        "DeletionProtection": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "migration-postgres-${EnvironmentSuffix}" }
          }
        ]
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": { "Ref": "VPC" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-VPCId" }
      }
    },
    "ALBDNSName": {
      "Description": "DNS name of the Application Load Balancer",
      "Value": { "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-ALBDNSName" }
      }
    },
    "RDSEndpoint": {
      "Description": "RDS PostgreSQL endpoint address",
      "Value": { "Fn::GetAtt": ["RDSInstance", "Endpoint.Address"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-RDSEndpoint" }
      }
    }
  }
}
```

## Known Issues in This Implementation

1. **Missing Environment Tags**: Some resources are missing the "Environment" tag that should be applied consistently
2. **Missing MigrationPhase Tag**: VPC has the MigrationPhase tag but other resources don't
3. **Incomplete ALB Security Group**: Missing HTTPS (port 443) ingress rule
4. **Missing SSH Access**: AppSecurityGroup doesn't have SSH access for troubleshooting
5. **Missing Secrets Manager Integration**: User data doesn't retrieve database credentials from Secrets Manager
6. **No Automatic Secret Rotation**: Missing Lambda function and rotation schedule for automatic password rotation
7. **Missing IAM Policy**: EC2 role doesn't have permissions to read from Secrets Manager
8. **Missing CloudWatch Logs**: RDS doesn't export logs to CloudWatch
9. **Missing Output**: No output for database secret ARN or target group ARNs
10. **Missing Internet Gateway Tag**: InternetGateway resource name doesn't include EnvironmentSuffix

## Deployment Instructions

```bash
aws cloudformation create-stack \
  --stack-name migration-infrastructure \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=DBUsername,ParameterValue=postgres \
    ParameterKey=DBPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=KeyName,ParameterValue=your-key-pair \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-central-2
```

## Testing

After deployment:

1. Verify VPC and subnets are created
2. Check ALB DNS name is accessible
3. Verify RDS instance is in Multi-AZ configuration
4. Test application health endpoint
5. Verify blue-green target groups are configured
