```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-grade multi-AZ networking and compute environment with VPC, subnets, EC2 instances, security groups, and VPC Flow Logs",

  "Parameters": {
    "ProjectName": {
      "Type": "String",
      "Default": "MyWebApp",
      "Description": "Project name used as prefix for resource naming and tagging",
      "MinLength": 2,
      "MaxLength": 32,
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9-]*$",
      "ConstraintDescription": "Must begin with a letter and contain only alphanumeric characters and hyphens"
    },
    "SshCidrBlock": {
      "Type": "String",
      "Default": "203.0.113.0/24",
      "Description": "CIDR block from which SSH access is permitted",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$",
      "ConstraintDescription": "Must be a valid CIDR block (e.g., 10.0.0.0/8)"
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "Description": "EC2 instance type for all instances",
      "AllowedValues": [
        "t3.micro", "t3.small", "t3.medium", "t3.large",
        "t2.micro", "t2.small", "t2.medium", "t2.large",
        "m5.large", "m5.xlarge", "m5.2xlarge"
      ],
      "ConstraintDescription": "Must be a valid EC2 instance type"
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
              "Fn::Sub": "${ProjectName}-VPC"
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

    "InternetGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "InternetGatewayId": {
          "Ref": "InternetGateway"
        },
        "VpcId": {
          "Ref": "VPC"
        }
      }
    },

    "PublicSubnet": {
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
        "CidrBlock": "10.0.1.0/24",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": [
                "${ProjectName}-Public-Subnet-${AZ}",
                {
                  "AZ": {
                    "Fn::Select": [
                      2,
                      {
                        "Fn::Split": [
                          "",
                          {
                            "Fn::Select": [
                              0,
                              {
                                "Fn::GetAZs": ""
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                }
              ]
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
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "CidrBlock": "10.0.2.0/24",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": [
                "${ProjectName}-Private-Subnet-A-${AZ}",
                {
                  "AZ": {
                    "Fn::Select": [
                      2,
                      {
                        "Fn::Split": [
                          "",
                          {
                            "Fn::Select": [
                              1,
                              {
                                "Fn::GetAZs": ""
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                }
              ]
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
        "AvailabilityZone": {
          "Fn::Select": [
            2,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "CidrBlock": "10.0.3.0/24",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": [
                "${ProjectName}-Private-Subnet-B-${AZ}",
                {
                  "AZ": {
                    "Fn::Select": [
                      2,
                      {
                        "Fn::Split": [
                          "",
                          {
                            "Fn::Select": [
                              2,
                              {
                                "Fn::GetAZs": ""
                              }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },

    "NATGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-NAT-EIP"
            }
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
          "Ref": "PublicSubnet"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-NAT-Gateway"
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

    "PublicSubnetRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "SubnetId": {
          "Ref": "PublicSubnet"
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
              "Fn::Sub": "${ProjectName}-Private-Route-Table"
            }
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
          "Ref": "NATGateway"
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

    "PrivateSubnetBRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        },
        "SubnetId": {
          "Ref": "PrivateSubnetB"
        }
      }
    },

    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "${ProjectName}-EC2-Security-Group"
        },
        "GroupDescription": "Security group for EC2 instances allowing SSH and intra-group communication",
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
            },
            "Description": "SSH access from specified CIDR block"
          },
          {
            "IpProtocol": "-1",
            "SourceSecurityGroupId": {
              "Ref": "AWS::NoValue"
            }
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "All outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-EC2-Security-Group"
            }
          }
        ]
      }
    },

    "EC2SecurityGroupSelfReferenceRule": {
      "Type": "AWS::EC2::SecurityGroupIngress",
      "Properties": {
        "GroupId": {
          "Ref": "EC2SecurityGroup"
        },
        "IpProtocol": "-1",
        "SourceSecurityGroupId": {
          "Ref": "EC2SecurityGroup"
        },
        "Description": "Allow all traffic from instances in the same security group"
      }
    },

    "PublicEC2Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": {
          "Fn::Sub": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}"
        },
        "InstanceType": {
          "Ref": "InstanceType"
        },
        "SubnetId": {
          "Ref": "PublicSubnet"
        },
        "SecurityGroupIds": [
          {
            "Ref": "EC2SecurityGroup"
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
        "ImageId": {
          "Fn::Sub": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}"
        },
        "InstanceType": {
          "Ref": "InstanceType"
        },
        "SubnetId": {
          "Ref": "PrivateSubnetA"
        },
        "SecurityGroupIds": [
          {
            "Ref": "EC2SecurityGroup"
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
        "ImageId": {
          "Fn::Sub": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}"
        },
        "InstanceType": {
          "Ref": "InstanceType"
        },
        "SubnetId": {
          "Ref": "PrivateSubnetB"
        },
        "SecurityGroupIds": [
          {
            "Ref": "EC2SecurityGroup"
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
            "PolicyName": "flowlogsDeliveryRolePolicy",
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
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-VPC-FlowLogs-Role"
            }
          }
        ]
      }
    },

    "VPCFlowLogsGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/vpc/flowlogs/${ProjectName}"
        },
        "RetentionInDays": 14,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-VPC-FlowLogs-Group"
            }
          }
        ]
      }
    },

    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "DeliverLogsPermissionArn": {
          "Fn::GetAtt": [
            "VPCFlowLogsRole",
            "Arn"
          ]
        },
        "LogDestination": {
          "Fn::GetAtt": [
            "VPCFlowLogsGroup",
            "Arn"
          ]
        },
        "LogDestinationType": "cloud-watch-logs",
        "LogFormat": "${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${windowstart} ${windowend} ${action} ${flowlogstatus}",
        "ResourceId": {
          "Ref": "VPC"
        },
        "ResourceType": "VPC",
        "TrafficType": "ALL",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${ProjectName}-VPC-FlowLog"
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
          "Fn::Sub": "${AWS::StackName}-VPC-ID"
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
          "Fn::Sub": "${AWS::StackName}-Public-Instance-ID"
        }
      }
    },
    "NATGatewayEIP": {
      "Description": "Elastic IP address of the NAT Gateway",
      "Value": {
        "Ref": "NATGatewayEIP"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NAT-Gateway-EIP"
        }
      }
    },
    "PrivateInstanceAId": {
      "Description": "Instance ID of the private EC2 instance in subnet A",
      "Value": {
        "Ref": "PrivateEC2InstanceA"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Private-Instance-A-ID"
        }
      }
    },
    "PrivateInstanceBId": {
      "Description": "Instance ID of the private EC2 instance in subnet B",
      "Value": {
        "Ref": "PrivateEC2InstanceB"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Private-Instance-B-ID"
        }
      }
    },
    "SecurityGroupId": {
      "Description": "ID of the EC2 security group",
      "Value": {
        "Ref": "EC2SecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Security-Group-ID"
        }
      }
    },
    "VPCFlowLogsGroup": {
      "Description": "CloudWatch Logs Group for VPC Flow Logs",
      "Value": {
        "Ref": "VPCFlowLogsGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-FlowLogs-Group"
        }
      }
    }
  }
}
```
