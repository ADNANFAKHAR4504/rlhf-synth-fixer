
```json

{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Highly Available Web Environment with VPC, EC2, S3, and CloudWatch monitoring",

  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for unique resource naming",
      "AllowedPattern": "^[a-z0-9-]+$",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
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
      "Description": "EC2 Instance Type"
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
            "Value": "HA-Web-VPC"
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
            "Value": "HA-Web-IGW"
          }
        ]
      }
    },

    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "InternetGatewayId": {"Ref": "InternetGateway"}
      }
    },

    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Public-Subnet-AZ1"
          }
        ]
      }
    },

    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Public-Subnet-AZ2"
          }
        ]
      }
    },

    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Public-Subnet-AZ3"
          }
        ]
      }
    },

    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private-Subnet-AZ1"
          }
        ]
      }
    },

    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private-Subnet-AZ2"
          }
        ]
      }
    },

    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.13.0/24",
        "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private-Subnet-AZ3"
          }
        ]
      }
    },

    "NATGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc"
      }
    },

    "NATGateway2EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc"
      }
    },

    "NATGateway3EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc"
      }
    },

    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NATGateway1EIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "NAT-Gateway-AZ1"
          }
        ]
      }
    },

    "NATGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NATGateway2EIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet2"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "NAT-Gateway-AZ2"
          }
        ]
      }
    },

    "NATGateway3": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NATGateway3EIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet3"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "NAT-Gateway-AZ3"
          }
        ]
      }
    },

    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
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
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": {"Ref": "PublicRouteTable"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {"Ref": "InternetGateway"}
      }
    },

    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet1"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },

    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet2"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },

    "PublicSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet3"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },

    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private-Route-Table-AZ1"
          }
        ]
      }
    },

    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable1"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NATGateway1"}
      }
    },

    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "RouteTableId": {"Ref": "PrivateRouteTable1"}
      }
    },

    "PrivateRouteTable2": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private-Route-Table-AZ2"
          }
        ]
      }
    },

    "PrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable2"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NATGateway2"}
      }
    },

    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "RouteTableId": {"Ref": "PrivateRouteTable2"}
      }
    },

    "PrivateRouteTable3": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private-Route-Table-AZ3"
          }
        ]
      }
    },

    "PrivateRoute3": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable3"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NATGateway3"}
      }
    },

    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet3"},
        "RouteTableId": {"Ref": "PrivateRouteTable3"}
      }
    },

    "WebSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for web servers",
        "VpcId": {"Ref": "VPC"},
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
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Web-Security-Group"
          }
        ]
      }
    },

    "EC2Role": {
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
                    {"Fn::Sub": "arn:aws:s3:::${ApplicationS3Bucket}"},
                    {"Fn::Sub": "arn:aws:s3:::${ApplicationS3Bucket}/*"}
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
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
            "Value": "EC2-Instance-Role"
          }
        ]
      }
    },

    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Roles": [{"Ref": "EC2Role"}]
      }
    },

    "LoggingS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "logging-bucket-${EnvironmentSuffix}-${AWS::AccountId}"},
        "OwnershipControls": {
          "Rules": [
            {
              "ObjectOwnership": "BucketOwnerPreferred"
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
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
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldLogs",
              "Status": "Enabled",
              "ExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Logging-Bucket"
          }
        ]
      }
    },

    "ApplicationS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "app-bucket-${EnvironmentSuffix}-${AWS::AccountId}"},
        "OwnershipControls": {
          "Rules": [
            {
              "ObjectOwnership": "BucketOwnerPreferred"
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
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
        "LoggingConfiguration": {
          "DestinationBucketName": {"Ref": "LoggingS3Bucket"},
          "LogFilePrefix": "application-logs/"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Application-Bucket"
          }
        ]
      }
    },

    "EC2Instance1": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": {"Ref": "LatestAmiId"},
        "InstanceType": {"Ref": "InstanceType"},
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "SecurityGroupIds": [{"Ref": "WebSecurityGroup"}],
        "IamInstanceProfile": {"Ref": "EC2InstanceProfile"},
        "Monitoring": true,
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": ["", [
              "#!/bin/bash\n",
              "yum update -y\n",
              "yum install -y amazon-cloudwatch-agent\n",
              "yum install -y httpd\n",
              "systemctl start httpd\n",
              "systemctl enable httpd\n",
              "echo '<h1>Web Server in AZ1</h1>' > /var/www/html/index.html\n",
              "/opt/aws/bin/cfn-signal -e $? ",
              "         --stack ", {"Ref": "AWS::StackName"},
              "         --resource EC2Instance1 ",
              "         --region ", {"Ref": "AWS::Region"}, "\n"
            ]]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Web-Server-AZ1"
          }
        ]
      },
      "CreationPolicy": {
        "ResourceSignal": {
          "Timeout": "PT10M"
        }
      }
    },

    "EC2Instance2": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": {"Ref": "LatestAmiId"},
        "InstanceType": {"Ref": "InstanceType"},
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "SecurityGroupIds": [{"Ref": "WebSecurityGroup"}],
        "IamInstanceProfile": {"Ref": "EC2InstanceProfile"},
        "Monitoring": true,
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": ["", [
              "#!/bin/bash\n",
              "yum update -y\n",
              "yum install -y amazon-cloudwatch-agent\n",
              "yum install -y httpd\n",
              "systemctl start httpd\n",
              "systemctl enable httpd\n",
              "echo '<h1>Web Server in AZ2</h1>' > /var/www/html/index.html\n",
              "/opt/aws/bin/cfn-signal -e $? ",
              "         --stack ", {"Ref": "AWS::StackName"},
              "         --resource EC2Instance2 ",
              "         --region ", {"Ref": "AWS::Region"}, "\n"
            ]]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Web-Server-AZ2"
          }
        ]
      },
      "CreationPolicy": {
        "ResourceSignal": {
          "Timeout": "PT10M"
        }
      }
    },

    "EC2Instance3": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": {"Ref": "LatestAmiId"},
        "InstanceType": {"Ref": "InstanceType"},
        "SubnetId": {"Ref": "PrivateSubnet3"},
        "SecurityGroupIds": [{"Ref": "WebSecurityGroup"}],
        "IamInstanceProfile": {"Ref": "EC2InstanceProfile"},
        "Monitoring": true,
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": ["", [
              "#!/bin/bash\n",
              "yum update -y\n",
              "yum install -y amazon-cloudwatch-agent\n",
              "yum install -y httpd\n",
              "systemctl start httpd\n",
              "systemctl enable httpd\n",
              "echo '<h1>Web Server in AZ3</h1>' > /var/www/html/index.html\n",
              "/opt/aws/bin/cfn-signal -e $? ",
              "         --stack ", {"Ref": "AWS::StackName"},
              "         --resource EC2Instance3 ",
              "         --region ", {"Ref": "AWS::Region"}, "\n"
            ]]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Web-Server-AZ3"
          }
        ]
      },
      "CreationPolicy": {
        "ResourceSignal": {
          "Timeout": "PT10M"
        }
      }
    },

    "CPUAlarmInstance1": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alarm when CPU exceeds 80% on Instance 1",
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
            "Value": {"Ref": "EC2Instance1"}
          }
        ],
        "AlarmActions": [],
        "TreatMissingData": "notBreaching"
      }
    },

    "CPUAlarmInstance2": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alarm when CPU exceeds 80% on Instance 2",
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
            "Value": {"Ref": "EC2Instance2"}
          }
        ],
        "AlarmActions": [],
        "TreatMissingData": "notBreaching"
      }
    },

    "CPUAlarmInstance3": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alarm when CPU exceeds 80% on Instance 3",
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
            "Value": {"Ref": "EC2Instance3"}
          }
        ],
        "AlarmActions": [],
        "TreatMissingData": "notBreaching"
      }
    }
  },

  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {"Ref": "VPC"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-VPC-ID"}
      }
    },
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": {"Ref": "PublicSubnet1"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet1-ID"}
      }
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": {"Ref": "PublicSubnet2"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet2-ID"}
      }
    },
    "PublicSubnet3Id": {
      "Description": "Public Subnet 3 ID",
      "Value": {"Ref": "PublicSubnet3"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet3-ID"}
      }
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": {"Ref": "PrivateSubnet1"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet1-ID"}
      }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": {"Ref": "PrivateSubnet2"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet2-ID"}
      }
    },
    "PrivateSubnet3Id": {
      "Description": "Private Subnet 3 ID",
      "Value": {"Ref": "PrivateSubnet3"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet3-ID"}
      }
    },
    "NATGateway1Id": {
      "Description": "NAT Gateway 1 ID",
      "Value": {"Ref": "NATGateway1"}
    },
    "NATGateway2Id": {
      "Description": "NAT Gateway 2 ID",
      "Value": {"Ref": "NATGateway2"}
    },
    "NATGateway3Id": {
      "Description": "NAT Gateway 3 ID",
      "Value": {"Ref": "NATGateway3"}
    },
    "ApplicationS3BucketName": {
      "Description": "Application S3 Bucket Name",
      "Value": {"Ref": "ApplicationS3Bucket"}
    },
    "SecurityGroupId": {
      "Description": "Web Security Group ID",
      "Value": {"Ref": "WebSecurityGroup"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-SecurityGroup-ID"}
      }
    },
    "EC2Instance1Id": {
      "Description": "EC2 Instance 1 ID",
      "Value": {"Ref": "EC2Instance1"}
    },
    "EC2Instance2Id": {
      "Description": "EC2 Instance 2 ID",
      "Value": {"Ref": "EC2Instance2"}
    },
    "EC2Instance3Id": {
      "Description": "EC2 Instance 3 ID",
      "Value": {"Ref": "EC2Instance3"}
    }
  }
}

```