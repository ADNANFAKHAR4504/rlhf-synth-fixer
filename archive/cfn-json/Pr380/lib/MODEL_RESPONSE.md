```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "AWS CloudFormation template to create a foundational, multi-AZ networking and compute environment in us-east-1.",
  "Parameters": {
    "ProjectName": {
      "Type": "String",
      "Default": "MyWebApp",
      "Description": "Prefix for resource naming."
    },
    "SshCidrBlock": {
      "Type": "String",
      "Default": "203.0.113.0/24",
      "Description": "CIDR block for SSH access."
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "Description": "EC2 instance type."
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsSupport": true,
        "EnableDnsHostnames": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-VPC"
            }
          }
        ]
      }
    },
    "PublicSubnet": {
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
              "Fn::Sub": "${ProjectName}-Public-Subnet-1a"
            }
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
        "CidrBlock": "10.0.2.0/24",
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
              "Fn::Sub": "${ProjectName}-Private-Subnet-A"
            }
          }
        ]
      }
    },
    "PrivateSubnetB": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            2,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-Private-Subnet-B"
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
              "Fn::Sub": "${ProjectName}-IGW"
            }
          }
        ]
      }
    },
    "VPCGatewayAttachment": {
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
    "ElasticIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "InternetGateway",
      "Properties": {
        "Domain": "vpc"
      }
    },
    "NATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "ElasticIP",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnet"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-NATGateway"
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
              "Fn::Sub": "${ProjectName}-Public-Route-Table"
            }
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
            "Value": {
              "Fn::Sub": "${ProjectName}-Private-Route-Table"
            }
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "VPCGatewayAttachment",
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
    "PublicRouteTableAssociation": {
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
    "PrivateSubnetARouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetA"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "PrivateSubnetBRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetB"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Enable SSH access and internal communication",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": {
              "Ref": "SshCidrBlock"
            }
          },
          {
            "IpProtocol": "-1",
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
            "Value": {
              "Fn::Sub": "${ProjectName}-SG"
            }
          }
        ]
      }
    },
    "LatestAmiId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Properties": {
        "Name": "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"
      }
    },
    "PublicEC2Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "InstanceType": {
          "Ref": "InstanceType"
        },
        "ImageId": {
          "Ref": "LatestAmiId"
        },
        "SubnetId": {
          "Ref": "PublicSubnet"
        },
        "SecurityGroupIds": [
          {
            "Fn::GetAtt": [
              "EC2SecurityGroup",
              "GroupId"
            ]
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-EC2-Public"
            }
          }
        ]
      }
    },
    "PrivateEC2InstanceA": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "InstanceType": {
          "Ref": "InstanceType"
        },
        "ImageId": {
          "Ref": "LatestAmiId"
        },
        "SubnetId": {
          "Ref": "PrivateSubnetA"
        },
        "SecurityGroupIds": [
          {
            "Fn::GetAtt": [
              "EC2SecurityGroup",
              "GroupId"
            ]
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-EC2-Private-A"
            }
          }
        ]
      }
    },
    "PrivateEC2InstanceB": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "InstanceType": {
          "Ref": "InstanceType"
        },
        "ImageId": {
          "Ref": "LatestAmiId"
        },
        "SubnetId": {
          "Ref": "PrivateSubnetB"
        },
        "SecurityGroupIds": [
          {
            "Fn::GetAtt": [
              "EC2SecurityGroup",
              "GroupId"
            ]
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-EC2-Private-B"
            }
          }
        ]
      }
    },
    "VPCFlowLogsCloudWatchLogsLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/vpcflowlogs/${VPC}/FlowLogs"
        },
        "RetentionInDays": 7
      }
    },
    "VPCFlowLogs": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "ResourceId": {
          "Ref": "VPC"
        },
        "ResourceType": "VPC",
        "TrafficType": "ALL",
        "LogGroupName": {
          "Ref": "VPCFlowLogsCloudWatchLogsLogGroup"
        },
        "DeliverLogsPermissionArn": {
          "Fn::GetAtt": [
            "VPCFlowLogsCloudWatchLogsRole",
            "Arn"
          ]
        }
      }
    },
    "VPCFlowLogsCloudWatchLogsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "vpc-flow-logs.amazonaws.com"
                ]
              },
              "Action": [
                "sts:AssumeRole"
              ]
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "VPCFlowLogsPolicy",
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
                  "Resource": [
                    "*"
                  ]
                }
              ]
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "ID of the VPC",
      "Value": {
        "Ref": "VPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${ProjectName}-VPCId"
        }
      }
    },
    "PublicInstanceId": {
      "Description": "Instance ID of the public EC2 instance",
      "Value": {
        "Ref": "PublicEC2Instance"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${ProjectName}-PublicInstanceId"
        }
      }
    },
    "NATGatewayEIP": {
      "Description": "Elastic IP of the NAT Gateway",
      "Value": {
        "Ref": "ElasticIP"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${ProjectName}-NATGatewayEIP"
        }
      }
    }
  }
}
```
