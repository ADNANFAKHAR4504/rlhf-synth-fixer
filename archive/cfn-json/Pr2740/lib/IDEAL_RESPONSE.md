```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "A complete CloudFormation template for a highly available web application with VPC, subnets, EC2, ELB, RDS, S3, and IAM roles, updated to use modern security best practices.",
  "Parameters": {
    "VpcCIDR": {
      "Description": "CIDR block for the VPC",
      "Type": "String",
      "Default": "10.0.0.0/16"
    },
    "PublicSubnet1CIDR": {
      "Description": "CIDR block for public subnet in AZ1",
      "Type": "String",
      "Default": "10.0.1.0/24"
    },
    "PublicSubnet2CIDR": {
      "Description": "CIDR block for public subnet in AZ2",
      "Type": "String",
      "Default": "10.0.2.0/24"
    },
    "PrivateSubnet1CIDR": {
      "Description": "CIDR block for private subnet in AZ1",
      "Type": "String",
      "Default": "10.0.3.0/24"
    },
    "PrivateSubnet2CIDR": {
      "Description": "CIDR block for private subnet in AZ2",
      "Type": "String",
      "Default": "10.0.4.0/24"
    },
    "InstanceType": {
      "Description": "EC2 instance type for the web servers",
      "Type": "String",
      "Default": "t2.micro"
    },
    "KeyName": {
      "Description": "The name of an existing EC2 KeyPair to enable SSH access to the instances",
      "Type": "AWS::EC2::KeyPair::KeyName",
      "Default": "tap-dev-keypair",
      "ConstraintDescription": "Must be the name of an existing EC2 KeyPair."
    },
    "DBInstanceType": {
      "Description": "Database instance type",
      "Type": "String",
      "Default": "db.t3.micro"
    },
    "DBName": {
      "Description": "The name of the database to be created.",
      "Type": "String",
      "Default": "webappdb"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {
          "Ref": "VpcCIDR"
        },
        "EnableDnsSupport": "true",
        "EnableDnsHostnames": "true",
        "Tags": [
          {
            "Key": "Name",
            "Value": "Web-App-VPC"
          }
        ]
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
        "MapPublicIpOnLaunch": "true",
        "Tags": [
          {
            "Key": "Name",
            "Value": "Public-Subnet-1"
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
        "MapPublicIpOnLaunch": "true",
        "Tags": [
          {
            "Key": "Name",
            "Value": "Public-Subnet-2"
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
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private-Subnet-1"
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
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private-Subnet-2"
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
            "Value": "Web-App-IGW"
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
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
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
    "EIPNatGateway": {
      "Type": "AWS::EC2::EIP",
      "Properties": {
        "Domain": "vpc"
      }
    },
    "NatGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "EIPNatGateway",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Web-App-NAT-Gateway"
          }
        ]
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
          "Ref": "NatGateway"
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
    "LogBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": "web-app-logs"
          }
        ]
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": "Web-App-EC2-Security-Group",
        "GroupDescription": "Allows HTTP/HTTPS from ALB and SSH from bastion host.",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {
              "Fn::GetAtt": [
                "ALBSecurityGroup",
                "GroupId"
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Web-App-EC2-SG"
          }
        ]
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": "Web-App-ALB-Security-Group",
        "GroupDescription": "Allows HTTP access from anywhere.",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Web-App-ALB-SG"
          }
        ]
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": "Web-App-RDS-Security-Group",
        "GroupDescription": "Allows inbound traffic from EC2 instances.",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Fn::GetAtt": [
                "EC2SecurityGroup",
                "GroupId"
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Web-App-RDS-SG"
          }
        ]
      }
    },
    "ALB": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": "WebAppALB",
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
            "Fn::GetAtt": [
              "ALBSecurityGroup",
              "GroupId"
            ]
          }
        ]
      }
    },
    "TargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": "WebAppTargetGroup",
        "VpcId": {
          "Ref": "VPC"
        },
        "Port": 80,
        "Protocol": "HTTP"
      }
    },
    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "TargetGroupArn": {
              "Ref": "TargetGroup"
            },
            "Type": "forward"
          }
        ],
        "LoadBalancerArn": {
          "Ref": "ALB"
        },
        "Port": 80,
        "Protocol": "HTTP"
      }
    },
    "WebServerIAMRole": {
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
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-EC2-Role"
          }
        ]
      }
    },
    "WebServerInstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Roles": [
          {
            "Ref": "WebServerIAMRole"
          }
        ]
      }
    },
    "WebLaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateData": {
          "InstanceType": {
            "Ref": "InstanceType"
          },
          "ImageId": "ami-00ca32bbc84273381",
          "KeyName": {
            "Ref": "KeyName"
          },
          "SecurityGroupIds": [
            {
              "Fn::GetAtt": [
                "EC2SecurityGroup",
                "GroupId"
              ]
            }
          ],
          "UserData": {
            "Fn::Base64": {
              "Fn::Join": [
                "\n",
                [
                  "#!/bin/bash",
                  "sudo yum update -y",
                  "sudo yum install -y httpd",
                  "sudo systemctl start httpd",
                  "sudo systemctl enable httpd",
                  "echo \"<h1>Hello from EC2!</h1>\" > /var/www/html/index.html"
                ]
              ]
            }
          }
        }
      }
    },
    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
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
            "Ref": "WebLaunchTemplate"
          },
          "Version": {
            "Fn::GetAtt": [
              "WebLaunchTemplate",
              "LatestVersionNumber"
            ]
          }
        },
        "MinSize": "2",
        "MaxSize": "2",
        "DesiredCapacity": "2",
        "TargetGroupARNs": [
          {
            "Ref": "TargetGroup"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-EC2-Instance",
            "PropagateAtLaunch": "true"
          }
        ]
      }
    },
    "RDSSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for the RDS instance",
        "SubnetIds": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          }
        ]
      }
    },
    "DatabaseSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": "DatabaseSecret",
        "Description": "Secret for the RDS master user and password",
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\":\"admin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 16,
          "ExcludeCharacters": "\"@/\\'"
        }
      }
    },
    "RDSDBInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "Engine": "mysql",
        "DBInstanceClass": {
          "Ref": "DBInstanceType"
        },
        "MasterUsername": "{{resolve:secretsmanager:DatabaseSecret:SecretString:username}}",
        "MasterUserPassword": "{{resolve:secretsmanager:DatabaseSecret:SecretString:password}}",
        "DBName": {
          "Ref": "DBName"
        },
        "DBSubnetGroupName": {
          "Ref": "RDSSubnetGroup"
        },
        "VPCSecurityGroups": [
          {
            "Fn::GetAtt": [
              "RDSSecurityGroup",
              "GroupId"
            ]
          }
        ],
        "MultiAZ": "true",
        "PubliclyAccessible": "false",
        "AllocatedStorage": "20",
        "BackupRetentionPeriod": "7",
        "Tags": [
          {
            "Key": "Name",
            "Value": "Web-App-RDS-DB"
          }
        ]
      }
    },
    "CPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alarm when CPU exceeds 70%",
        "Namespace": "AWS/EC2",
        "MetricName": "CPUUtilization",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {
              "Ref": "AutoScalingGroup"
            }
          }
        ],
        "Statistic": "Average",
        "Period": "60",
        "EvaluationPeriods": "1",
        "Threshold": "70",
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "TreatMissingData": "notBreaching"
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "VPC"
      }
    },
    "ALBDNSName": {
      "Description": "DNS Name of the Web Application Load Balancer",
      "Value": {
        "Fn::GetAtt": [
          "ALB",
          "DNSName"
        ]
      }
    },
    "DBEndpoint": {
      "Description": "The endpoint of the RDS instance",
      "Value": {
        "Fn::GetAtt": [
          "RDSDBInstance",
          "Endpoint.Address"
        ]
      }
    },
    "DatabaseSecretARN": {
      "Description": "The ARN of the Secrets Manager secret for the database credentials",
      "Value": {
        "Ref": "DatabaseSecret"
      }
    }
  }
}


```