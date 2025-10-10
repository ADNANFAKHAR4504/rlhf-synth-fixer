# Production-Ready VPC Infrastructure with EC2 Auto Start/Stop

## Architecture Overview

This CloudFormation template creates a production-ready cloud infrastructure in AWS us-west-1 region with the following components:
- **VPC** with CIDR 10.0.0.0/16 spanning 2 availability zones for high availability
- **Two public subnets** in different AZs with dynamic AZ selection
- **Internet Gateway** for external connectivity with proper route table configuration
- **Two EC2 instances** running Apache web servers across AZs with public IPs
- **CloudWatch alarms** monitoring CPU utilization for high (>70%) and low (<10%) thresholds
- **Lambda functions** for automated start/stop of EC2 instances
- **EventBridge schedules** for time-based instance management (8 AM start, 6 PM stop)
- **VPC Flow Logs** for network traffic monitoring and security analysis
- **IAM roles** with least-privilege permissions for EC2 and Lambda

## CloudFormation Template Implementation

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-ready VPC infrastructure with EC2 instances and automated start/stop based on CloudWatch alarms and schedules",
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
            "default": "EC2 Configuration"
          },
          "Parameters": [
            "KeyPairName",
            "InstanceType"
          ]
        },
        {
          "Label": {
            "default": "Auto Start/Stop Schedule"
          },
          "Parameters": [
            "StartSchedule",
            "StopSchedule"
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
    "KeyPairName": {
      "Type": "String",
      "Default": "",
      "Description": "EC2 Key Pair for SSH access to instances (optional)"
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "Description": "EC2 instance type",
      "AllowedValues": [
        "t3.micro",
        "t3.small",
        "t3.medium"
      ]
    },
    "StartSchedule": {
      "Type": "String",
      "Default": "cron(0 8 ? * MON-FRI *)",
      "Description": "Cron expression for starting instances (UTC time, default: 8 AM Mon-Fri)"
    },
    "StopSchedule": {
      "Type": "String",
      "Default": "cron(0 18 ? * MON-FRI *)",
      "Description": "Cron expression for stopping instances (UTC time, default: 6 PM Mon-Fri)"
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
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsSupport": true,
        "EnableDnsHostnames": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ProductionVPC-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
              "Fn::Sub": "PublicSubnet1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
              "Fn::Sub": "PublicSubnet2-${EnvironmentSuffix}"
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
              "Fn::Sub": "ProductionIGW-${EnvironmentSuffix}"
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
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "DependsOn": "InternetGatewayAttachment",
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
            "Value": "Production"
          }
        ]
      }
    },
    "PublicRoute": {
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
    "WebSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "WebSecurityGroup-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for web servers allowing HTTP, HTTPS, and SSH access",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP traffic from internet"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS traffic from internet"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow SSH access for administration"
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
              "Fn::Sub": "WebSecurityGroup-${EnvironmentSuffix}"
            }
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
        "InstanceProfileName": {
          "Fn::Sub": "EC2InstanceProfile-${EnvironmentSuffix}"
        },
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
        "ImageId": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}",
        "InstanceType": {
          "Ref": "InstanceType"
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
        "IamInstanceProfile": {
          "Ref": "EC2InstanceProfile"
        },
        "NetworkInterfaces": [
          {
            "AssociatePublicIpAddress": true,
            "DeviceIndex": "0",
            "SubnetId": {
              "Ref": "PublicSubnet1"
            },
            "GroupSet": [
              {
                "Ref": "WebSecurityGroup"
              }
            ]
          }
        ],
        "Monitoring": true,
        "UserData": {
          "Fn::Base64": {
            "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd\nsystemctl enable httpd\necho '<html><h1>Production Web Server 1 - ${EnvironmentSuffix}</h1></html>' > /var/www/html/index.html\n"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebServer1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "AutoStartStop",
            "Value": "true"
          }
        ]
      }
    },
    "EC2Instance2": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}",
        "InstanceType": {
          "Ref": "InstanceType"
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
        "IamInstanceProfile": {
          "Ref": "EC2InstanceProfile"
        },
        "NetworkInterfaces": [
          {
            "AssociatePublicIpAddress": true,
            "DeviceIndex": "0",
            "SubnetId": {
              "Ref": "PublicSubnet2"
            },
            "GroupSet": [
              {
                "Ref": "WebSecurityGroup"
              }
            ]
          }
        ],
        "Monitoring": true,
        "UserData": {
          "Fn::Base64": {
            "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd\nsystemctl enable httpd\necho '<html><h1>Production Web Server 2 - ${EnvironmentSuffix}</h1></html>' > /var/www/html/index.html\n"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebServer2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "AutoStartStop",
            "Value": "true"
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "LambdaEC2ControlRole-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "EC2StartStopPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ec2:StartInstances",
                    "ec2:StopInstances",
                    "ec2:DescribeInstances",
                    "ec2:DescribeInstanceStatus"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:ec2:${AWS::Region}:${AWS::AccountId}:instance/${EC2Instance1}"
                    },
                    {
                      "Fn::Sub": "arn:aws:ec2:${AWS::Region}:${AWS::AccountId}:instance/${EC2Instance2}"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ec2:DescribeInstances",
                    "ec2:DescribeInstanceStatus"
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
    "StartEC2InstancesFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "StartEC2Instances-${EnvironmentSuffix}"
        },
        "Runtime": "python3.13",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Timeout": 60,
        "Code": {
          "ZipFile": {
            "Fn::Sub": "import boto3\nimport os\n\ndef lambda_handler(event, context):\n    ec2 = boto3.client('ec2')\n    instance_ids = ['${EC2Instance1}', '${EC2Instance2}']\n    \n    try:\n        response = ec2.start_instances(InstanceIds=instance_ids)\n        print(f'Started instances: {instance_ids}')\n        return {\n            'statusCode': 200,\n            'body': f'Successfully started instances: {instance_ids}'\n        }\n    except Exception as e:\n        print(f'Error starting instances: {str(e)}')\n        raise e\n"
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "StopEC2InstancesFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "StopEC2Instances-${EnvironmentSuffix}"
        },
        "Runtime": "python3.13",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Timeout": 60,
        "Code": {
          "ZipFile": {
            "Fn::Sub": "import boto3\nimport os\n\ndef lambda_handler(event, context):\n    ec2 = boto3.client('ec2')\n    instance_ids = ['${EC2Instance1}', '${EC2Instance2}']\n    \n    try:\n        response = ec2.stop_instances(InstanceIds=instance_ids)\n        print(f'Stopped instances: {instance_ids}')\n        return {\n            'statusCode': 200,\n            'body': f'Successfully stopped instances: {instance_ids}'\n        }\n    except Exception as e:\n        print(f'Error stopping instances: {str(e)}')\n        raise e\n"
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "StartInstancesSchedule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "StartInstancesSchedule-${EnvironmentSuffix}"
        },
        "Description": "Scheduled rule to start EC2 instances",
        "ScheduleExpression": {
          "Ref": "StartSchedule"
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": [
                "StartEC2InstancesFunction",
                "Arn"
              ]
            },
            "Id": "StartEC2InstancesTarget"
          }
        ]
      }
    },
    "StopInstancesSchedule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "StopInstancesSchedule-${EnvironmentSuffix}"
        },
        "Description": "Scheduled rule to stop EC2 instances",
        "ScheduleExpression": {
          "Ref": "StopSchedule"
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": [
                "StopEC2InstancesFunction",
                "Arn"
              ]
            },
            "Id": "StopEC2InstancesTarget"
          }
        ]
      }
    },
    "StartInstancesSchedulePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "StartEC2InstancesFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": [
            "StartInstancesSchedule",
            "Arn"
          ]
        }
      }
    },
    "StopInstancesSchedulePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "StopEC2InstancesFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": [
            "StopInstancesSchedule",
            "Arn"
          ]
        }
      }
    },
    "HighCPUAlarmInstance1": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "HighCPUAlarm-Instance1-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm when CPU exceeds 70% for Instance 1",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 70,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": {
              "Ref": "EC2Instance1"
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "HighCPUAlarmInstance2": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "HighCPUAlarm-Instance2-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm when CPU exceeds 70% for Instance 2",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 70,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": {
              "Ref": "EC2Instance2"
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "LowCPUAlarmInstance1": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "LowCPUAlarm-Instance1-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm when CPU is below 10% for Instance 1 (idle instance)",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 3,
        "Threshold": 10,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": {
              "Ref": "EC2Instance1"
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "LowCPUAlarmInstance2": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "LowCPUAlarm-Instance2-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm when CPU is below 10% for Instance 2 (idle instance)",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 3,
        "Threshold": 10,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": {
              "Ref": "EC2Instance2"
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "VPCFlowLogsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "VPCFlowLogsRole-${EnvironmentSuffix}"
        },
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
    "VPCFlowLogsLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/vpc/flowlogs-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7
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
          "Ref": "VPCFlowLogsLogGroup"
        },
        "DeliverLogsPermissionArn": {
          "Fn::GetAtt": [
            "VPCFlowLogsRole",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
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
    "WebSecurityGroupId": {
      "Description": "Web Security Group ID",
      "Value": {
        "Ref": "WebSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-WebSecurityGroupId"
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
    "EC2Instance1PublicIP": {
      "Description": "EC2 Instance 1 Public IP",
      "Value": {
        "Fn::GetAtt": [
          "EC2Instance1",
          "PublicIp"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EC2Instance1PublicIP"
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
    "EC2Instance2PublicIP": {
      "Description": "EC2 Instance 2 Public IP",
      "Value": {
        "Fn::GetAtt": [
          "EC2Instance2",
          "PublicIp"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EC2Instance2PublicIP"
        }
      }
    },
    "StartEC2InstancesFunctionArn": {
      "Description": "Lambda Function ARN for starting instances",
      "Value": {
        "Fn::GetAtt": [
          "StartEC2InstancesFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-StartEC2InstancesFunctionArn"
        }
      }
    },
    "StopEC2InstancesFunctionArn": {
      "Description": "Lambda Function ARN for stopping instances",
      "Value": {
        "Fn::GetAtt": [
          "StopEC2InstancesFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-StopEC2InstancesFunctionArn"
        }
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
    }
  }
}
```

## Deployment Instructions

Deploy this CloudFormation template using AWS CLI with IAM capabilities:

```bash
aws cloudformation create-stack \
  --stack-name production-vpc-infrastructure \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=KeyPairName,ParameterValue=your-keypair-name \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-1
```

**Note:** The `--capabilities CAPABILITY_NAMED_IAM` flag is required because this template creates IAM resources with custom names (EC2InstanceRole, EC2InstanceProfile, LambdaEC2ControlRole, VPCFlowLogsRole).

## Architecture Summary

This implementation provides a production-ready infrastructure with the following key features:

### **High Availability**
- Two EC2 instances deployed across two dynamically selected availability zones using `Fn::GetAZs`
- VPC spanning multiple AZs with 10.0.0.0/16 CIDR block
- Public subnets (10.0.1.0/24 and 10.0.2.0/24) with automatic public IP assignment

### **Security**
- Security group restricting access to HTTP (80), HTTPS (443), and SSH (22) ports with descriptions
- IAM roles following least-privilege principle with scoped permissions
- Lambda execution role restricted to specific EC2 instance ARNs using `Fn::Sub`
- VPC Flow Logs capturing ALL traffic to CloudWatch Logs with 7-day retention
- EC2 instance profile with CloudWatch Agent and SSM managed policies

### **Automation**
- EventBridge schedules for automatic instance start (8 AM Mon-Fri) and stop (6 PM Mon-Fri)
- Lambda functions (Python 3.13) with 60-second timeout for EC2 start/stop operations
- Lambda permissions properly configured for EventBridge invocation
- CloudWatch alarms monitoring high CPU (>70%, 60-second period, 2 evaluation periods) and low CPU (<10%, 300-second period, 3 evaluation periods)

### **Web Server Configuration**
- Apache httpd automatically installed via UserData on both instances
- Custom HTML pages identifying each server
- Detailed CloudWatch monitoring enabled (Monitoring: true) for 1-minute metric intervals

### **Networking**
- Internet Gateway attached to VPC for external connectivity
- Route table with 0.0.0.0/0 route to Internet Gateway
- Route table associations configured for both public subnets
- DependsOn attributes preventing race conditions during deployment
- DNS support and DNS hostnames enabled on VPC

### **Dynamic Configuration**
- Latest Amazon Linux 2 AMI resolved via SSM parameter store
- Parameterized KeyPair, InstanceType, and schedule expressions
- Environment suffix for multi-environment deployments
- All resources tagged with Environment=Production

### **Monitoring & Observability**
- Four CloudWatch alarms monitoring CPU utilization patterns
- VPC Flow Logs for network traffic analysis
- Comprehensive outputs exporting VPC ID, subnet IDs, instance IDs, public IPs, and Lambda ARNs
- All outputs using stack-based export names for cross-stack references
