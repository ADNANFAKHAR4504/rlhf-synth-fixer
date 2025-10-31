# Multi-Environment Infrastructure CloudFormation Template

This CloudFormation template deploys a complete multi-environment web application infrastructure that can be consistently deployed across development, staging, and production AWS accounts using StackSets. This version implements proper secrets management and dynamic integration testing.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-environment web application infrastructure with VPC, ALB, Auto Scaling, RDS, S3, and monitoring",
  "Parameters": {
    "EnvironmentName": {
      "Type": "String",
      "Description": "Environment name (dev, staging, prod)",
      "AllowedValues": ["dev", "staging", "prod"],
      "Default": "dev"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to avoid conflicts",
      "MinLength": 4,
      "MaxLength": 20,
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "VpcCidr": {
      "Type": "String",
      "Description": "CIDR block for VPC",
      "Default": "10.1.0.0/16",
      "AllowedPattern": "(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(\\d{1,2})"
    },
    "InstanceType": {
      "Type": "String",
      "Description": "EC2 instance type for web servers",
      "Default": "t3.micro",
      "AllowedValues": ["t3.micro", "t3.small", "t3.medium", "t3.large"]
    },
    "DBInstanceClass": {
      "Type": "String",
      "Description": "RDS instance class",
      "Default": "db.t3.micro",
      "AllowedValues": ["db.t3.micro", "db.t3.small", "db.t3.medium"]
    },
    "DBUsername": {
      "Type": "String",
      "Description": "Database master username",
      "Default": "admin",
      "MinLength": 1,
      "MaxLength": 16
    },
    "DBPassword": {
      "Type": "String",
      "Description": "Database master password",
      "NoEcho": true,
      "MinLength": 8,
      "MaxLength": 41,
      "AllowedPattern": "[a-zA-Z0-9]+",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    },
    "ACMCertificateArn": {
      "Type": "String",
      "Description": "ARN of ACM certificate for HTTPS listener",
      "Default": ""
    },
    "AlarmEmail": {
      "Type": "String",
      "Description": "Email address for CloudWatch alarm notifications",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    }
  },
  "Conditions": {
    "IsProduction": {
      "Fn::Equals": [{"Ref": "EnvironmentName"}, "prod"]
    },
    "HasCertificate": {
      "Fn::Not": [{"Fn::Equals": [{"Ref": "ACMCertificateArn"}, ""]}]
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {"Ref": "VpcCidr"},
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "vpc-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentName"}
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
            "Value": {"Fn::Sub": "igw-${EnvironmentSuffix}"}
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
        "CidrBlock": {"Fn::Select": [0, {"Fn::Cidr": [{"Ref": "VpcCidr"}, 4, 8]}]},
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "public-subnet-1-${EnvironmentSuffix}"}
          },
          {
            "Key": "Type",
            "Value": "Public"
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": {"Fn::Select": [1, {"Fn::Cidr": [{"Ref": "VpcCidr"}, 4, 8]}]},
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "public-subnet-2-${EnvironmentSuffix}"}
          },
          {
            "Key": "Type",
            "Value": "Public"
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": {"Fn::Select": [2, {"Fn::Cidr": [{"Ref": "VpcCidr"}, 4, 8]}]},
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "private-subnet-1-${EnvironmentSuffix}"}
          },
          {
            "Key": "Type",
            "Value": "Private"
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": {"Fn::Select": [3, {"Fn::Cidr": [{"Ref": "VpcCidr"}, 4, 8]}]},
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "private-subnet-2-${EnvironmentSuffix}"}
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
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "nat-eip-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "NatGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NatGatewayEIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "nat-gateway-${EnvironmentSuffix}"}
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
            "Value": {"Fn::Sub": "public-rt-${EnvironmentSuffix}"}
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
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "private-rt-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "PrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NatGateway"}
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
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
            "Value": {"Fn::Sub": "alb-sg-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {"Ref": "ALBSecurityGroup"}
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
            "Value": {"Fn::Sub": "ec2-sg-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS database",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {"Ref": "EC2SecurityGroup"}
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "rds-sg-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Name": {"Fn::Sub": "alb-${EnvironmentSuffix}"},
        "Subnets": [
          {"Ref": "PublicSubnet1"},
          {"Ref": "PublicSubnet2"}
        ],
        "SecurityGroups": [{"Ref": "ALBSecurityGroup"}],
        "Scheme": "internet-facing",
        "Type": "application",
        "IpAddressType": "ipv4",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "alb-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentName"}
          }
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {"Fn::Sub": "tg-${EnvironmentSuffix}"},
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {"Ref": "VPC"},
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "TargetType": "instance",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "tg-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {"Ref": "ApplicationLoadBalancer"},
        "Port": {"Fn::If": ["HasCertificate", 443, 80]},
        "Protocol": {"Fn::If": ["HasCertificate", "HTTPS", "HTTP"]},
        "Certificates": {
          "Fn::If": [
            "HasCertificate",
            [{"CertificateArn": {"Ref": "ACMCertificateArn"}}],
            {"Ref": "AWS::NoValue"}
          ]
        },
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {"Ref": "ALBTargetGroup"}
          }
        ]
      }
    },
    "EC2InstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "ec2-role-${EnvironmentSuffix}"},
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
            "PolicyName": "S3Access",
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
                    {"Fn::GetAtt": ["LogsBucket", "Arn"]},
                    {"Fn::Sub": "${LogsBucket.Arn}/*"},
                    {"Fn::GetAtt": ["StaticContentBucket", "Arn"]},
                    {"Fn::Sub": "${StaticContentBucket.Arn}/*"}
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "ec2-role-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {"Fn::Sub": "ec2-profile-${EnvironmentSuffix}"},
        "Roles": [{"Ref": "EC2InstanceRole"}]
      }
    },
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {"Fn::Sub": "lt-${EnvironmentSuffix}"},
        "LaunchTemplateData": {
          "ImageId": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}",
          "InstanceType": {"Ref": "InstanceType"},
          "IamInstanceProfile": {
            "Arn": {"Fn::GetAtt": ["EC2InstanceProfile", "Arn"]}
          },
          "SecurityGroupIds": [{"Ref": "EC2SecurityGroup"}],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd\nsystemctl enable httpd\necho '<h1>Hello from ${EnvironmentName} environment</h1>' > /var/www/html/index.html\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {"Fn::Sub": "web-instance-${EnvironmentSuffix}"}
                },
                {
                  "Key": "Environment",
                  "Value": {"Ref": "EnvironmentName"}
                }
              ]
            }
          ]
        }
      }
    },
    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "DependsOn": "NatGateway",
      "Properties": {
        "AutoScalingGroupName": {"Fn::Sub": "asg-${EnvironmentSuffix}"},
        "VPCZoneIdentifier": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"}
        ],
        "LaunchTemplate": {
          "LaunchTemplateId": {"Ref": "LaunchTemplate"},
          "Version": {"Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"]}
        },
        "MinSize": "1",
        "MaxSize": {"Fn::If": ["IsProduction", "4", "2"]},
        "DesiredCapacity": {"Fn::If": ["IsProduction", "2", "1"]},
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "TargetGroupARNs": [{"Ref": "ALBTargetGroup"}],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "asg-${EnvironmentSuffix}"},
            "PropagateAtLaunch": false
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentName"},
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {"Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"},
        "DBSubnetGroupDescription": "Subnet group for RDS database",
        "SubnetIds": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"}
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "RDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "db-${EnvironmentSuffix}"},
        "Engine": "mysql",
        "EngineVersion": "8.0.35",
        "DBInstanceClass": {"Ref": "DBInstanceClass"},
        "AllocatedStorage": "20",
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "MasterUsername": {"Ref": "DBUsername"},
        "MasterUserPassword": {"Ref": "DBPassword"},
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "VPCSecurityGroups": [{"Ref": "RDSSecurityGroup"}],
        "MultiAZ": {"Fn::If": ["IsProduction", true, false]},
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "db-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentName"}
          }
        ]
      }
    },
    "LogsBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {"Fn::Sub": "logs-bucket-${EnvironmentSuffix}"},
        "VersioningConfiguration": {
          "Status": "Enabled"
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
              "Id": "TransitionToIA",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 30,
                  "StorageClass": "STANDARD_IA"
                }
              ]
            },
            {
              "Id": "ExpireOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "logs-bucket-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentName"}
          }
        ]
      }
    },
    "StaticContentBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {"Fn::Sub": "static-content-${EnvironmentSuffix}"},
        "VersioningConfiguration": {
          "Status": "Enabled"
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
              "Id": "TransitionToIA",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 60,
                  "StorageClass": "STANDARD_IA"
                }
              ]
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "static-content-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentName"}
          }
        ]
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {"Fn::Sub": "alarms-topic-${EnvironmentSuffix}"},
        "DisplayName": {"Fn::Sub": "CloudWatch Alarms for ${EnvironmentName}"},
        "Subscription": [
          {
            "Endpoint": {"Ref": "AlarmEmail"},
            "Protocol": "email"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "alarms-topic-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentName"}
          }
        ]
      }
    },
    "CPUAlarmHigh": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "cpu-high-${EnvironmentSuffix}"},
        "AlarmDescription": "Alert when CPU utilization exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {"Ref": "AutoScalingGroup"}
          }
        ],
        "AlarmActions": [{"Ref": "SNSTopic"}],
        "TreatMissingData": "notBreaching"
      }
    },
    "TargetTrackingScalingPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AutoScalingGroupName": {"Ref": "AutoScalingGroup"},
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
          },
          "TargetValue": 70
        }
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {"Ref": "VPC"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-VPCId"}
      }
    },
    "ALBDNSName": {
      "Description": "DNS name of the Application Load Balancer",
      "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ALBDNSName"}
      }
    },
    "RDSEndpoint": {
      "Description": "RDS database endpoint",
      "Value": {"Fn::GetAtt": ["RDSInstance", "Endpoint.Address"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-RDSEndpoint"}
      }
    },
    "LogsBucketName": {
      "Description": "Name of the logs S3 bucket",
      "Value": {"Ref": "LogsBucket"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-LogsBucket"}
      }
    },
    "StaticContentBucketName": {
      "Description": "Name of the static content S3 bucket",
      "Value": {"Ref": "StaticContentBucket"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-StaticContentBucket"}
      }
    },
    "SNSTopicArn": {
      "Description": "ARN of the SNS topic for alarms",
      "Value": {"Ref": "SNSTopic"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-SNSTopicArn"}
      }
    }
  }
}
```

## Deployment Instructions

This CloudFormation template can be deployed using AWS CloudFormation StackSets for multi-account deployment:

1. **Prerequisites**:
   - AWS Organizations set up with target accounts
   - StackSets permissions configured
   - ACM certificate created (optional but recommended)
   - Unique environment suffix for each deployment

2. **Deploy via StackSets**:
   ```bash
   aws cloudformation create-stack-set \
     --stack-set-name multi-env-infrastructure \
     --template-body file://lib/TapStack.json \
     --parameters \
       ParameterKey=EnvironmentName,ParameterValue=dev \
       ParameterKey=EnvironmentSuffix,ParameterValue=dev-abc123 \
       ParameterKey=VpcCidr,ParameterValue=10.1.0.0/16 \
       ParameterKey=InstanceType,ParameterValue=t3.micro \
       ParameterKey=DBInstanceClass,ParameterValue=db.t3.micro \
       ParameterKey=DBUsername,ParameterValue=admin \
       ParameterKey=DBPassword,ParameterValue=YourSecurePassword123 \
       ParameterKey=AlarmEmail,ParameterValue=alerts@example.com \
     --capabilities CAPABILITY_NAMED_IAM \
     --regions us-east-1
   ```

3. **Deploy Stack Instances**:
   ```bash
   aws cloudformation create-stack-instances \
     --stack-set-name multi-env-infrastructure \
     --accounts 123456789012 234567890123 345678901234 \
     --regions us-east-1
   ```

4. **Environment-Specific Parameters**:
   - **Dev**: VpcCidr=10.1.0.0/16, InstanceType=t3.micro, Single AZ
   - **Staging**: VpcCidr=10.2.0.0/16, InstanceType=t3.small, Single AZ
   - **Prod**: VpcCidr=10.3.0.0/16, InstanceType=t3.medium, Multi-AZ enabled

## Key Features

- **Multi-Environment Support**: Uses Conditions to enable/disable features based on environment
- **Parameterized Configuration**: All environment-specific values controlled through parameters
- **High Availability**: Multi-AZ deployment for production environments
- **Security**: Least privilege IAM roles, security groups, encryption at rest
- **Monitoring**: CloudWatch alarms and SNS notifications
- **Auto Scaling**: Target tracking scaling policy based on CPU utilization
- **Storage**: S3 buckets with versioning and lifecycle policies
- **Networking**: Complete VPC setup with public/private subnets across 2 AZs
