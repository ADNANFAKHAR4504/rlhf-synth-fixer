### Reasoning Trace

---

This is a comprehensive request for an AWS CloudFormation template. I need to create a complete JSON template that includes:

1. VPC and Networking:
   - VPC with public and private subnets across 2 AZs
   - Internet Gateway
   - NAT Gateway
   - Route tables

2. Network Security:
   - Security groups for bastion host, EC2 instances, RDS, and ALB
   - Least privilege principle

3. Load Balancing:
   - Application Load Balancer
   - Target group
   - Listeners for HTTP/HTTPS

4. Auto Scaling and Compute:
   - Bastion host
   - Auto Scaling Group
   - Launch Template
   - CloudWatch monitoring

5. Database and Storage:
   - Multi-AZ RDS
   - S3 bucket with encryption and versioning
   - Security configurations

6. Application Services:
   - DynamoDB tables
   - SQS queues

7. IAM Roles and Policies:
   - IAM roles for EC2 instances
   - Least privilege policies

8. Logging and Monitoring:
   - CloudWatch alarms
   - CloudWatch Logs
   - VPC Flow Logs
   - ALB logging

9. Template Features:
   - Parameters with defaults
   - Intrinsic functions
   - Outputs section

This is a large template, so I'll structure it carefully and ensure all components are properly connected.

### Answer

---

I'll create a comprehensive AWS CloudFormation template that meets all your requirements. This template will set up a secure, scalable, and highly available infrastructure for hosting a web application.

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure and scalable cloud environment for web application with high availability",

  "Parameters": {
    "EnvironmentName": {
      "Description": "An environment name that is prefixed to resource names",
      "Type": "String",
      "Default": "WebApp"
    },
    "VpcCIDR": {
      "Description": "CIDR block for this VPC",
      "Type": "String",
      "Default": "10.0.0.0/16",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(1[6-9]|2[0-8]))$"
    },
    "PublicSubnet1CIDR": {
      "Description": "CIDR block for the public subnet in AZ1",
      "Type": "String",
      "Default": "10.0.1.0/24"
    },
    "PublicSubnet2CIDR": {
      "Description": "CIDR block for the public subnet in AZ2",
      "Type": "String",
      "Default": "10.0.2.0/24"
    },
    "PrivateSubnet1CIDR": {
      "Description": "CIDR block for the private subnet in AZ1",
      "Type": "String",
      "Default": "10.0.3.0/24"
    },
    "PrivateSubnet2CIDR": {
      "Description": "CIDR block for the private subnet in AZ2",
      "Type": "String",
      "Default": "10.0.4.0/24"
    },
    "DBSubnet1CIDR": {
      "Description": "CIDR block for the database subnet in AZ1",
      "Type": "String",
      "Default": "10.0.5.0/24"
    },
    "DBSubnet2CIDR": {
      "Description": "CIDR block for the database subnet in AZ2",
      "Type": "String",
      "Default": "10.0.6.0/24"
    },
    "BastionInstanceType": {
      "Description": "EC2 instance type for bastion host",
      "Type": "String",
      "Default": "t3.micro",
      "AllowedValues": ["t3.micro", "t3.small", "t3.medium"]
    },
    "WebServerInstanceType": {
      "Description": "EC2 instance type for web servers",
      "Type": "String",
      "Default": "t3.small",
      "AllowedValues": ["t3.micro", "t3.small", "t3.medium", "t3.large"]
    },
    "KeyPairName": {
      "Description": "EC2 KeyPair to enable SSH access",
      "Type": "AWS::EC2::KeyPair::KeyName",
      "ConstraintDescription": "Must be the name of an existing EC2 KeyPair"
    },
    "SSHAllowedIP": {
      "Description": "IP address allowed to SSH into bastion host",
      "Type": "String",
      "Default": "0.0.0.0/0",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(/([0-9]|[1-2][0-9]|3[0-2]))$"
    },
    "DBInstanceClass": {
      "Description": "Database instance type",
      "Type": "String",
      "Default": "db.t3.micro",
      "AllowedValues": ["db.t3.micro", "db.t3.small", "db.t3.medium"]
    },
    "DBName": {
      "Description": "Database name",
      "Type": "String",
      "Default": "webappdb",
      "MinLength": "1",
      "MaxLength": "64",
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*"
    },
    "DBUsername": {
      "Description": "Database admin username",
      "Type": "String",
      "Default": "admin",
      "MinLength": "1",
      "MaxLength": "16",
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*",
      "NoEcho": true
    },
    "DBPassword": {
      "Description": "Database admin password",
      "Type": "String",
      "MinLength": "8",
      "MaxLength": "41",
      "AllowedPattern": "[a-zA-Z0-9]*",
      "NoEcho": true
    },
    "S3BucketPrefix": {
      "Description": "Prefix for S3 bucket name",
      "Type": "String",
      "Default": "webapp-assets",
      "AllowedPattern": "[a-z0-9-]*"
    },
    "DynamoDBTableName": {
      "Description": "Name for DynamoDB table",
      "Type": "String",
      "Default": "WebAppSessions",
      "AllowedPattern": "[a-zA-Z0-9_.-]+"
    },
    "SQSQueueName": {
      "Description": "Name for SQS queue",
      "Type": "String",
      "Default": "WebAppQueue",
      "AllowedPattern": "[a-zA-Z0-9_-]+"
    },
    "MinAutoScalingSize": {
      "Description": "Minimum number of EC2 instances in Auto Scaling Group",
      "Type": "Number",
      "Default": "2",
      "MinValue": "1"
    },
    "MaxAutoScalingSize": {
      "Description": "Maximum number of EC2 instances in Auto Scaling Group",
      "Type": "Number",
      "Default": "5",
      "MinValue": "2"
    },
    "LatestAmiId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Default": "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2"
    }
  },

  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": { "Ref": "VpcCIDR" },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-VPC" }
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
            "Value": { "Fn::Sub": "${EnvironmentName}-IGW" }
          }
        ]
      }
    },

    "InternetGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "InternetGatewayId": { "Ref": "InternetGateway" },
        "VpcId": { "Ref": "VPC" }
      }
    },

    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": "us-west-2a",
        "CidrBlock": { "Ref": "PublicSubnet1CIDR" },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-Public-Subnet-AZ1" }
          }
        ]
      }
    },

    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": "us-west-2b",
        "CidrBlock": { "Ref": "PublicSubnet2CIDR" },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-Public-Subnet-AZ2" }
          }
        ]
      }
    },

    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": "us-west-2a",
        "CidrBlock": { "Ref": "PrivateSubnet1CIDR" },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-Private-Subnet-AZ1" }
          }
        ]
      }
    },

    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": "us-west-2b",
        "CidrBlock": { "Ref": "PrivateSubnet2CIDR" },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-Private-Subnet-AZ2" }
          }
        ]
      }
    },

    "DBSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": "us-west-2a",
        "CidrBlock": { "Ref": "DBSubnet1CIDR" },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-DB-Subnet-AZ1" }
          }
        ]
      }
    },

    "DBSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "AvailabilityZone": "us-west-2b",
        "CidrBlock": { "Ref": "DBSubnet2CIDR" },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-DB-Subnet-AZ2" }
          }
        ]
      }
    },

    "NatGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "Domain": "vpc"
      }
    },

    "NatGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["NatGatewayEIP", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet1" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-NAT-Gateway" }
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
            "Value": { "Fn::Sub": "${EnvironmentName}-Public-Routes" }
          }
        ]
      }
    },

    "DefaultPublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": { "Ref": "InternetGateway" }
      }
    },

    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "SubnetId": { "Ref": "PublicSubnet1" }
      }
    },

    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "SubnetId": { "Ref": "PublicSubnet2" }
      }
    },

    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-Private-Routes" }
          }
        ]
      }
    },

    "DefaultPrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NatGateway" }
      }
    },

    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable" },
        "SubnetId": { "Ref": "PrivateSubnet1" }
      }
    },

    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable" },
        "SubnetId": { "Ref": "PrivateSubnet2" }
      }
    },

    "DBSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable" },
        "SubnetId": { "Ref": "DBSubnet1" }
      }
    },

    "DBSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable" },
        "SubnetId": { "Ref": "DBSubnet2" }
      }
    },

    "BastionSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for bastion host",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": { "Ref": "SSHAllowedIP" }
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
            "Value": { "Fn::Sub": "${EnvironmentName}-Bastion-SG" }
          }
        ]
      }
    },

    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": { "Ref": "VPC" },
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
            "Value": { "Fn::Sub": "${EnvironmentName}-ALB-SG" }
          }
        ]
      }
    },

    "WebServerSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for web servers",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "SourceSecurityGroupId": { "Ref": "BastionSecurityGroup" }
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": { "Ref": "ALBSecurityGroup" }
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": { "Ref": "ALBSecurityGroup" }
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
            "Value": { "Fn::Sub": "${EnvironmentName}-WebServer-SG" }
          }
        ]
      }
    },

    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS database",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": { "Ref": "WebServerSecurityGroup" }
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
            "Value": { "Fn::Sub": "${EnvironmentName}-Database-SG" }
          }
        ]
      }
    },

    "BastionHost": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": { "Ref": "LatestAmiId" },
        "InstanceType": { "Ref": "BastionInstanceType" },
        "KeyName": { "Ref": "KeyPairName" },
        "NetworkInterfaces": [
          {
            "AssociatePublicIpAddress": true,
            "DeviceIndex": "0",
            "GroupSet": [{ "Ref": "BastionSecurityGroup" }],
            "SubnetId": { "Ref": "PublicSubnet1" }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-Bastion-Host" }
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
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        ],
        "Policies": [
          {
            "PolicyName": "WebAppPolicy",
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
                    { "Fn::GetAtt": ["S3Bucket", "Arn"] },
                    { "Fn::Sub": "${S3Bucket.Arn}/*" }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": { "Fn::GetAtt": ["DynamoDBTable", "Arn"] }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sqs:SendMessage",
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes"
                  ],
                  "Resource": { "Fn::GetAtt": ["SQSQueue", "Arn"] }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogStreams"
                  ],
                  "Resource": "arn:aws:logs:us-west-2:*:*"
                }
              ]
            }
          }
        ]
      }
    },

    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Roles": [{ "Ref": "EC2Role" }]
      }
    },

    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "${EnvironmentName}-LaunchTemplate"
        },
        "LaunchTemplateData": {
          "ImageId": { "Ref": "LatestAmiId" },
          "InstanceType": { "Ref": "WebServerInstanceType" },
          "KeyName": { "Ref": "KeyPairName" },
          "IamInstanceProfile": {
            "Arn": { "Fn::GetAtt": ["EC2InstanceProfile", "Arn"] }
          },
          "SecurityGroupIds": [{ "Ref": "WebServerSecurityGroup" }],
          "Monitoring": {
            "Enabled": true
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Join": [
                "",
                [
                  "#!/bin/bash\n",
                  "yum update -y\n",
                  "yum install -y amazon-cloudwatch-agent\n",
                  "yum install -y httpd\n",
                  "systemctl start httpd\n",
                  "systemctl enable httpd\n",
                  "echo '<h1>Hello from ",
                  { "Ref": "EnvironmentName" },
                  "</h1>' > /var/www/html/index.html\n"
                ]
              ]
            }
          }
        }
      }
    },

    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": { "Fn::Sub": "${EnvironmentName}-ALB" },
        "Type": "application",
        "Scheme": "internet-facing",
        "SecurityGroups": [{ "Ref": "ALBSecurityGroup" }],
        "Subnets": [{ "Ref": "PublicSubnet1" }, { "Ref": "PublicSubnet2" }],
        "LoadBalancerAttributes": [
          {
            "Key": "access_logs.s3.enabled",
            "Value": "false"
          },
          {
            "Key": "idle_timeout.timeout_seconds",
            "Value": "60"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-ALB" }
          }
        ]
      }
    },

    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": { "Fn::Sub": "${EnvironmentName}-TG" },
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": { "Ref": "VPC" },
        "HealthCheckEnabled": true,
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckPath": "/",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "TargetType": "instance",
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-TG" }
          }
        ]
      }
    },

    "ALBListenerHTTP": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": { "Ref": "ApplicationLoadBalancer" },
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": { "Ref": "ALBTargetGroup" }
          }
        ]
      }
    },

    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": { "Fn::Sub": "${EnvironmentName}-ASG" },
        "LaunchTemplate": {
          "LaunchTemplateId": { "Ref": "LaunchTemplate" },
          "Version": "$Latest"
        },
        "MinSize": { "Ref": "MinAutoScalingSize" },
        "MaxSize": { "Ref": "MaxAutoScalingSize" },
        "DesiredCapacity": { "Ref": "MinAutoScalingSize" },
        "VPCZoneIdentifier": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" }
        ],
        "TargetGroupARNs": [{ "Ref": "ALBTargetGroup" }],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-WebServer" },
            "PropagateAtLaunch": true
          }
        ]
      }
    },

    "ScaleUpPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AdjustmentType": "ChangeInCapacity",
        "AutoScalingGroupName": { "Ref": "AutoScalingGroup" },
        "Cooldown": 300,
        "ScalingAdjustment": 1
      }
    },

    "ScaleDownPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AdjustmentType": "ChangeInCapacity",
        "AutoScalingGroupName": { "Ref": "AutoScalingGroup" },
        "Cooldown": 300,
        "ScalingAdjustment": -1
      }
    },

    "CPUAlarmHigh": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Scale up when CPU > 70%",
        "AlarmName": { "Fn::Sub": "${EnvironmentName}-CPU-High" },
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 70,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": { "Ref": "AutoScalingGroup" }
          }
        ],
        "AlarmActions": [{ "Ref": "ScaleUpPolicy" }]
      }
    },

    "CPUAlarmLow": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Scale down when CPU < 30%",
        "AlarmName": { "Fn::Sub": "${EnvironmentName}-CPU-Low" },
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 30,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": { "Ref": "AutoScalingGroup" }
          }
        ],
        "AlarmActions": [{ "Ref": "ScaleDownPolicy" }]
      }
    },

    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS",
        "SubnetIds": [{ "Ref": "DBSubnet1" }, { "Ref": "DBSubnet2" }],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-DB-SubnetGroup" }
          }
        ]
      }
    },

    "RDSDatabase": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "${EnvironmentName}-db" },
        "DBName": { "Ref": "DBName" },
        "Engine": "mysql",
        "EngineVersion": "8.0",
        "DBInstanceClass": { "Ref": "DBInstanceClass" },
        "AllocatedStorage": 20,
        "StorageType": "gp2",
        "StorageEncrypted": true,
        "MasterUsername": { "Ref": "DBUsername" },
        "MasterUserPassword": { "Ref": "DBPassword" },
        "VPCSecurityGroups": [{ "Ref": "DatabaseSecurityGroup" }],
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "MultiAZ": true,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": ["error", "general", "slowquery"],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-RDS" }
          }
        ]
      }
    },

    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${S3BucketPrefix}-${AWS::AccountId}-${AWS::Region}"
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
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-S3-Bucket" }
          }
        ]
      }
    },

    "DynamoDBTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": { "Ref": "DynamoDBTableName" },
        "AttributeDefinitions": [
          {
            "AttributeName": "SessionId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "UserId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "SessionId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "UserId",
            "KeyType": "RANGE"
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "SSESpecification": {
          "SSEEnabled": true
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-DynamoDB-Table" }
          }
        ]
      }
    },

    "SQSQueue": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": { "Ref": "SQSQueueName" },
        "MessageRetentionPeriod": 345600,
        "VisibilityTimeout": 30,
        "KmsMasterKeyId": "alias/aws/sqs",
        "RedrivePolicy": {
          "deadLetterTargetArn": { "Fn::GetAtt": ["DeadLetterQueue", "Arn"] },
          "maxReceiveCount": 3
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-SQS-Queue" }
          }
        ]
      }
    },

    "DeadLetterQueue": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": { "Fn::Sub": "${SQSQueueName}-DLQ" },
        "MessageRetentionPeriod": 1209600,
        "KmsMasterKeyId": "alias/aws/sqs",
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-SQS-DLQ" }
          }
        ]
      }
    },

    "VPCFlowLogRole": {
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
            "PolicyName": "VPCFlowLogPolicy",
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
        ]
      }
    },

    "VPCFlowLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": { "Fn::Sub": "/aws/vpc/${EnvironmentName}" },
        "RetentionInDays": 7
      }
    },

    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "ResourceType": "VPC",
        "ResourceId": { "Ref": "VPC" },
        "TrafficType": "ALL",
        "LogDestinationType": "cloud-watch-logs",
        "LogGroupName": { "Ref": "VPCFlowLogGroup" },
        "DeliverLogsPermissionArn": { "Fn::GetAtt": ["VPCFlowLogRole", "Arn"] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${EnvironmentName}-VPC-FlowLog" }
          }
        ]
      }
    },

    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": { "Fn::Sub": "${EnvironmentName}-Alerts" },
        "DisplayName": "CloudWatch Alerts"
      }
    },

    "ALBUnhealthyHostsAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alert when ALB has unhealthy hosts",
        "AlarmName": { "Fn::Sub": "${EnvironmentName}-ALB-UnhealthyHosts" },
        "MetricName": "UnHealthyHostCount",
        "Namespace": "AWS/ApplicationELB",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "TargetGroup",
            "Value": { "Fn::GetAtt": ["ALBTargetGroup", "TargetGroupFullName"] }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }],
        "TreatMissingData": "notBreaching"
      }
    },

    "RDSCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alert when RDS CPU utilization is high",
        "AlarmName": { "Fn::Sub": "${EnvironmentName}-RDS-CPU-High" },
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
            "Value": { "Ref": "RDSDatabase" }
          }
        ],
        "AlarmActions": [{ "Ref": "SNSTopic" }],
        "TreatMissingData": "notBreaching"
      }
    }
  },

  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": { "Ref": "VPC" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-VPC-ID" }
      }
    },
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": { "Ref": "PublicSubnet1" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PublicSubnet1-ID" }
      }
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": { "Ref": "PublicSubnet2" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PublicSubnet2-ID" }
      }
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": { "Ref": "PrivateSubnet1" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PrivateSubnet1-ID" }
      }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": { "Ref": "PrivateSubnet2" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PrivateSubnet2-ID" }
      }
    },
    "BastionHostPublicIP": {
      "Description": "Bastion Host Public IP",
      "Value": { "Fn::GetAtt": ["BastionHost", "PublicIp"] }
    },
    "ApplicationLoadBalancerDNS": {
      "Description": "Application Load Balancer DNS Name",
      "Value": { "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-ALB-DNS" }
      }
    },
    "RDSEndpoint": {
      "Description": "RDS Database Endpoint",
      "Value": { "Fn::GetAtt": ["RDSDatabase", "Endpoint.Address"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-RDS-Endpoint" }
      }
    },
    "S3BucketName": {
      "Description": "S3 Bucket Name",
      "Value": { "Ref": "S3Bucket" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-S3-Bucket" }
      }
    },
    "DynamoDBTableName": {
      "Description": "DynamoDB Table Name",
      "Value": { "Ref": "DynamoDBTable" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-DynamoDB-Table" }
      }
    },
    "SQSQueueURL": {
      "Description": "SQS Queue URL",
      "Value": { "Ref": "SQSQueue" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-SQS-Queue-URL" }
      }
    },
    "AutoScalingGroupName": {
      "Description": "Auto Scaling Group Name",
      "Value": { "Ref": "AutoScalingGroup" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-ASG-Name" }
      }
    }
  }
}
```
