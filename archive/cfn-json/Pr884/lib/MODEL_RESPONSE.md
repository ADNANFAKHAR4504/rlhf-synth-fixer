{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Enterprise-Grade Secure Multi-Region Cloud Infrastructure",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Default": "Production",
      "AllowedValues": ["Development", "Test", "Production"],
      "Description": "Environment type for resource deployment"
    },
    "Owner": {
      "Type": "String",
      "Default": "DevOps-Team",
      "Description": "Resource owner for tagging"
    },
    "CostCenter": {
      "Type": "String",
      "Default": "IT-Infrastructure",
      "Description": "Cost center for billing allocation"
    },
    "KeyPairName": {
      "Type": "AWS::EC2::KeyPair::KeyName",
      "Description": "EC2 Key Pair for SSH access"
    },
    "DBMasterUsername": {
      "Type": "String",
      "Default": "dbadmin",
      "MinLength": 4,
      "MaxLength": 16,
      "Description": "RDS master username"
    },
    "DBMasterPassword": {
      "Type": "String",
      "NoEcho": true,
      "MinLength": 8,
      "MaxLength": 41,
      "Description": "RDS master password"
    }
  },
  "Mappings": {
    "RegionMap": {
      "us-east-1": {
        "AMI": "ami-0c02fb55956c7d316"
      },
      "us-west-2": {
        "AMI": "ami-0841edc20334f9287"
      }
    },
    "EnvironmentMap": {
      "Development": {
        "InstanceType": "t3.micro",
        "MinSize": 1,
        "MaxSize": 2,
        "DesiredCapacity": 1
      },
      "Test": {
        "InstanceType": "t3.small",
        "MinSize": 1,
        "MaxSize": 3,
        "DesiredCapacity": 2
      },
      "Production": {
        "InstanceType": "t3.medium",
        "MinSize": 2,
        "MaxSize": 10,
        "DesiredCapacity": 3
      }
    }
  },
  "Resources": {
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS Key for encryption",
        "KeyPolicy": {
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
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/${Environment}-encryption-key"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
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
              "Fn::Sub": "${Environment}-VPC"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
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
              "Fn::Sub": "${Environment}-IGW"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
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
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${Environment}-Public-Subnet-1"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
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
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${Environment}-Public-Subnet-2"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
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
        "CidrBlock": "10.0.3.0/24",
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
              "Fn::Sub": "${Environment}-Private-Subnet-1"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
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
        "CidrBlock": "10.0.4.0/24",
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
              "Fn::Sub": "${Environment}-Private-Subnet-2"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
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
              "Fn::Sub": "${Environment}-NAT-Gateway-1-EIP"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
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
              "Fn::Sub": "${Environment}-NAT-Gateway-2-EIP"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
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
              "Fn::Sub": "${Environment}-NAT-Gateway-1"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
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
              "Fn::Sub": "${Environment}-NAT-Gateway-2"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
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
              "Fn::Sub": "${Environment}-Public-Route-Table"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "DefaultPublicRoute": {
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
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "SubnetId": {
          "Ref": "PublicSubnet2"
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
              "Fn::Sub": "${Environment}-Private-Route-Table-1"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "DefaultPrivateRoute1": {
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
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        },
        "SubnetId": {
          "Ref": "PrivateSubnet1"
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
              "Fn::Sub": "${Environment}-Private-Route-Table-2"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "DefaultPrivateRoute2": {
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
        "RouteTableId": {
          "Ref": "PrivateRouteTable2"
        },
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        }
      }
    },
    "WebServerSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for web servers",
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
            }
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            }
          }
        ],
        "SecurityGroupEgress": [
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
            "Value": {
              "Fn::Sub": "${Environment}-WebServer-SG"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
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
            "Value": {
              "Fn::Sub": "${Environment}-ALB-SG"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS database",
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
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${Environment}-Database-SG"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
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
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
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
          "Fn::Sub": "${Environment}-LaunchTemplate"
        },
        "LaunchTemplateData": {
          "ImageId": {
            "Fn::FindInMap": [
              "RegionMap",
              {
                "Ref": "AWS::Region"
              },
              "AMI"
            ]
          },
          "InstanceType": {
            "Fn::FindInMap": [
              "EnvironmentMap",
              {
                "Ref": "Environment"
              },
              "InstanceType"
            ]
          },
          "KeyName": {
            "Ref": "KeyPairName"
          },
          "SecurityGroupIds": [
            {
              "Ref": "WebServerSecurityGroup"
            }
          ],
          "IamInstanceProfile": {
            "Arn": {
              "Fn::GetAtt": [
                "EC2InstanceProfile",
                "Arn"
              ]
            }
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd\nsystemctl enable httpd\necho '<h1>Hello from ${Environment} Environment</h1>' > /var/www/html/index.html\n"
            }
          },
          "BlockDeviceMappings": [
            {
              "DeviceName": "/dev/xvda",
              "Ebs": {
                "VolumeSize": 20,
                "VolumeType": "gp3",
                "Encrypted": true,
                "KmsKeyId": {
                  "Ref": "KMSKey"
                }
              }
            }
          ],
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "${Environment}-WebServer"
                  }
                },
                {
                  "Key": "Environment",
                  "Value": {
                    "Ref": "Environment"
                  }
                },
                {
                  "Key": "Owner",
                  "Value": {
                    "Ref": "Owner"
                  }
                },
                {
                  "Key": "CostCenter",
                  "Value": {
                    "Ref": "CostCenter"
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
          "Fn::Sub": "${Environment}-ASG"
        },
        "VPCZoneIdentifier": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          }
        ],
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
          "Fn::FindInMap": [
            "EnvironmentMap",
            {
              "Ref": "Environment"
            },
            "MinSize"
          ]
        },
        "MaxSize": {
          "Fn::FindInMap": [
            "EnvironmentMap",
            {
              "Ref": "Environment"
            },
            "MaxSize"
          ]
        },
        "DesiredCapacity": {
          "Fn::FindInMap": [
            "EnvironmentMap",
            {
              "Ref": "Environment"
            },
            "DesiredCapacity"
          ]
        },
        "TargetGroupARNs": [
          {
            "Ref": "TargetGroup"
          }
        ],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${Environment}-ASG"
            },
            "PropagateAtLaunch": false
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            },
            "PropagateAtLaunch": true
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            },
            "PropagateAtLaunch": true
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            },
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "${Environment}-ALB"
        },
        "Scheme": "internet-facing",
        "Type": "application",
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
              "Fn::Sub": "${Environment}-ALB"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "TargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "${Environment}-TG"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {
          "Ref": "VPC"
        },
        "HealthCheckPath": "/",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "Health