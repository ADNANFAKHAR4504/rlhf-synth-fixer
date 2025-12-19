```json

{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-ready multi-AZ, multi-tier infrastructure with VPC, EC2, RDS, ALB, S3, and monitoring",
  "Parameters": {
    "EnvironmentName": {
      "Type": "String",
      "Default": "production",
      "Description": "Lowercase environment name used in names and tags (use lowercase to keep S3 naming valid)"
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "AllowedValues": [
        "t3.micro",
        "t3.small",
        "t3.medium",
        "t3.large"
      ],
      "Description": "EC2 instance type"
    },
    "KeyPairName": {
      "Type": "String",
      "Description": "Optional EC2 key pair name. Leave blank to skip attaching a key.",
      "Default": ""
    },
    "DBInstanceClass": {
      "Type": "String",
      "Default": "db.t3.micro",
      "AllowedValues": [
        "db.t3.micro",
        "db.t3.small",
        "db.t3.medium"
      ],
      "Description": "RDS instance class"
    },
    "DBName": {
      "Type": "String",
      "Default": "productiondb",
      "Description": "Database name",
      "MinLength": "1",
      "MaxLength": "64",
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*"
    },
    "LatestAmiId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Default": "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2",
      "Description": "Amazon Linux 2 AMI ID from SSM Parameter Store"
    }
  },
  "Mappings": {
    "SubnetConfig": {
      "VPC": {
        "CIDR": "10.0.0.0/16"
      },
      "PublicSubnetA": {
        "CIDR": "10.0.1.0/24"
      },
      "PublicSubnetB": {
        "CIDR": "10.0.2.0/24"
      },
      "PrivateSubnetA": {
        "CIDR": "10.0.10.0/24"
      }
    }
  },
  "Conditions": {
    "HasKeyPair": {
      "Fn::Not": [
        {
          "Fn::Equals": [
            {
              "Ref": "KeyPairName"
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
          "Fn::FindInMap": [
            "SubnetConfig",
            "VPC",
            "CIDR"
          ]
        },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${EnvironmentName}-vpc"
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
              "Fn::Sub": "${EnvironmentName}-igw"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "InternetGatewayAttachment": {
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
    "PublicSubnetA": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "CidrBlock": {
          "Fn::FindInMap": [
            "SubnetConfig",
            "PublicSubnetA",
            "CIDR"
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Public-Subnet-A"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Type",
            "Value": "Public"
          }
        ]
      }
    },
    "PublicSubnetB": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "CidrBlock": {
          "Fn::FindInMap": [
            "SubnetConfig",
            "PublicSubnetB",
            "CIDR"
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Public-Subnet-B"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Type",
            "Value": "Public"
          }
        ]
      }
    },
    "PrivateSubnetA": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            2,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "CidrBlock": {
          "Fn::FindInMap": [
            "SubnetConfig",
            "PrivateSubnetA",
            "CIDR"
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private-Subnet-A"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Type",
            "Value": "Private"
          }
        ]
      }
    },
    "NatGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${EnvironmentName}-nat-eip"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "NatGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NatGatewayEIP",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnetA"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${EnvironmentName}-nat"
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
            "Value": "Public-Route-Table"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "DefaultPublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "InternetGatewayAttachment",
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
    "PublicSubnetARouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "SubnetId": {
          "Ref": "PublicSubnetA"
        }
      }
    },
    "PublicSubnetBRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "SubnetId": {
          "Ref": "PublicSubnetB"
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
            "Value": "Private-Route-Table"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "DefaultPrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NatGateway"
        }
      }
    },
    "PrivateSubnetARouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        },
        "SubnetId": {
          "Ref": "PrivateSubnetA"
        }
      }
    },
    "VPNGateway": {
      "Type": "AWS::EC2::VPNGateway",
      "Properties": {
        "Type": "ipsec.1",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${EnvironmentName}-vgw"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "VPNGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "VpnGatewayId": {
          "Ref": "VPNGateway"
        }
      }
    },
    "PublicEC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for public EC2 instance",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Public-EC2-SG"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "PrivateEC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for private EC2 instance",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {
              "Ref": "PublicEC2SecurityGroup"
            }
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": {
              "Ref": "PublicEC2SecurityGroup"
            }
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "SourceSecurityGroupId": {
              "Ref": "PublicEC2SecurityGroup"
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private-EC2-SG"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
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
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "ALB-SG"
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
        "Path": "/",
        "Policies": [
          {
            "PolicyName": "S3BackupAccess",
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
                      "Fn::Sub": "arn:aws:s3:::${BackupS3Bucket}"
                    },
                    {
                      "Fn::Sub": "arn:aws:s3:::${BackupS3Bucket}/*"
                    }
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
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
        "Path": "/",
        "Roles": [
          {
            "Ref": "EC2InstanceRole"
          }
        ]
      }
    },
    "PublicEC2Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": {
          "Ref": "LatestAmiId"
        },
        "InstanceType": {
          "Ref": "InstanceType"
        },
        "IamInstanceProfile": {
          "Ref": "EC2InstanceProfile"
        },
        "SecurityGroupIds": [
          {
            "Ref": "PublicEC2SecurityGroup"
          }
        ],
        "SubnetId": {
          "Ref": "PublicSubnetA"
        },
        "KeyName": {
          "Fn::If": [
            "HasKeyPair",
            {
              "Ref": "KeyPairName"
            },
            {
              "Ref": "AWS::NoValue"
            }
          ]
        },
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash\n",
                "yum update -y\n",
                "yum install -y httpd\n",
                "systemctl start httpd\n",
                "systemctl enable httpd\n",
                "echo '<h1>Public EC2 Instance</h1>' > /var/www/html/index.html\n"
              ]
            ]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Public-EC2-Instance"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "PrivateEC2Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": {
          "Ref": "LatestAmiId"
        },
        "InstanceType": {
          "Ref": "InstanceType"
        },
        "IamInstanceProfile": {
          "Ref": "EC2InstanceProfile"
        },
        "SecurityGroupIds": [
          {
            "Ref": "PrivateEC2SecurityGroup"
          }
        ],
        "SubnetId": {
          "Ref": "PrivateSubnetA"
        },
        "KeyName": {
          "Fn::If": [
            "HasKeyPair",
            {
              "Ref": "KeyPairName"
            },
            {
              "Ref": "AWS::NoValue"
            }
          ]
        },
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash\n",
                "yum update -y\n",
                "yum install -y httpd mysql\n",
                "systemctl start httpd\n",
                "systemctl enable httpd\n",
                "echo '<h1>Private EC2 Instance</h1>' > /var/www/html/index.html\n"
              ]
            ]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private-EC2-Instance"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "${EnvironmentName}-alb"
        },
        "Subnets": [
          {
            "Ref": "PublicSubnetA"
          },
          {
            "Ref": "PublicSubnetB"
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
              "Fn::Sub": "${EnvironmentName}-alb"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "${EnvironmentName}-tg"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {
          "Ref": "VPC"
        },
        "TargetType": "instance",
        "Targets": [
          {
            "Id": {
              "Ref": "PublicEC2Instance"
            }
          }
        ],
        "HealthCheckEnabled": true,
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckPath": "/",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 5,
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
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
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS database",
        "SubnetIds": [
          {
            "Ref": "PrivateSubnetA"
          },
          {
            "Ref": "PublicSubnetB"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "DB-SubnetGroup"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS MySQL database",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "PrivateEC2SecurityGroup"
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "RDS-SG"
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
          "Fn::Sub": "${EnvironmentName}-mysql-credentials"
        },
        "Description": "RDS MySQL master credentials (username/password)",
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\":\"dbadmin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 16,
          "ExcludePunctuation": true
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "MySQLDatabase": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "${EnvironmentName}-mysql-db"
        },
        "DBName": {
          "Ref": "DBName"
        },
        "DBInstanceClass": {
          "Ref": "DBInstanceClass"
        },
        "Engine": "mysql",
        "EngineVersion": "8.0.41",
        "MasterUsername": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:username}}"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:password}}"
        },
        "AllocatedStorage": "20",
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "VPCSecurityGroups": [
          {
            "Ref": "DBSecurityGroup"
          }
        ],
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "PubliclyAccessible": false,
        "MultiAZ": false,
        "DeletionProtection": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${EnvironmentName}-mysql-db"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "PublicEC2CPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${EnvironmentName}-public-ec2-cpu-gt80"
        },
        "AlarmDescription": "Alarm when CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": {
              "Ref": "PublicEC2Instance"
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "PrivateEC2CPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${EnvironmentName}-private-ec2-cpu-gt80"
        },
        "AlarmDescription": "Alarm when CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": {
              "Ref": "PrivateEC2Instance"
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "VPCFlowLogsRole": {
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
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "VPCFlowLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/vpc/${EnvironmentName}"
        },
        "RetentionInDays": 7,
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "ResourceType": "VPC",
        "ResourceId": {
          "Ref": "VPC"
        },
        "TrafficType": "ALL",
        "LogDestinationType": "cloud-watch-logs",
        "LogGroupName": {
          "Ref": "VPCFlowLogGroup"
        },
        "DeliverLogsPermissionArn": {
          "Fn::GetAtt": [
            "VPCFlowLogsRole",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${EnvironmentName}-vpc-flowlog"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "BackupS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
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
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${EnvironmentName}-backup-bucket"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "BackupS3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "BackupS3Bucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DenyUnencryptedObjectUploads",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "arn:aws:s3:::${BackupS3Bucket}/*"
              },
              "Condition": {
                "StringNotEquals": {
                  "s3:x-amz-server-side-encryption": "AES256"
                }
              }
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
          "Fn::Sub": "${AWS::StackName}-VPC-ID"
        }
      }
    },
    "PublicSubnetAId": {
      "Description": "Public Subnet A ID",
      "Value": {
        "Ref": "PublicSubnetA"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnetA-ID"
        }
      }
    },
    "PublicSubnetBId": {
      "Description": "Public Subnet B ID",
      "Value": {
        "Ref": "PublicSubnetB"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnetB-ID"
        }
      }
    },
    "PrivateSubnetAId": {
      "Description": "Private Subnet A ID",
      "Value": {
        "Ref": "PrivateSubnetA"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnetA-ID"
        }
      }
    },
    "ALBDNSName": {
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
    "PublicEC2InstanceId": {
      "Description": "Public EC2 Instance ID",
      "Value": {
        "Ref": "PublicEC2Instance"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicEC2-ID"
        }
      }
    },
    "PrivateEC2InstanceId": {
      "Description": "Private EC2 Instance ID",
      "Value": {
        "Ref": "PrivateEC2Instance"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateEC2-ID"
        }
      }
    },
    "DatabaseEndpoint": {
      "Description": "RDS MySQL Database Endpoint",
      "Value": {
        "Fn::GetAtt": [
          "MySQLDatabase",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DB-Endpoint"
        }
      }
    },
    "BackupS3BucketName": {
      "Description": "S3 Backup Bucket Name",
      "Value": {
        "Ref": "BackupS3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-BackupBucket"
        }
      }
    },
    "VPNGatewayId": {
      "Description": "VPN Gateway ID",
      "Value": {
        "Ref": "VPNGateway"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPNGateway-ID"
        }
      }
    },
    "DBSecretArn": {
      "Description": "ARN of Secrets Manager secret storing DB credentials",
      "Value": {
        "Ref": "DBSecret"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DBSecretArn"
        }
      }
    }
  }
}
```