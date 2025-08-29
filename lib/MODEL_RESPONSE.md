```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-grade web application infrastructure with high availability, security, and scalability",
  "Parameters": {
    "DBUsername": {
      "Type": "String",
      "Default": "admin",
      "Description": "Database administrator username"
    },
    "DBPassword": {
      "Type": "String",
      "NoEcho": true,
      "MinLength": 8,
      "Description": "Database administrator password"
    },
    "KeyPairName": {
      "Type": "AWS::EC2::KeyPair::KeyName",
      "Description": "EC2 Key Pair for SSH access"
    },
    "DomainName": {
      "Type": "String",
      "Description": "Domain name for the application"
    }
  },
  "Resources": {
    "ProductionVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-VPC"
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
            "Value": "Production-IGW"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {
          "Ref": "ProductionVPC"
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
          "Ref": "ProductionVPC"
        },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Public-Subnet-1"
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
          "Ref": "ProductionVPC"
        },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": "us-east-1b",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Public-Subnet-2"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": "us-east-1a",
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private-Subnet-1"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "CidrBlock": "10.0.4.0/24",
        "AvailabilityZone": "us-east-1b",
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private-Subnet-2"
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
          "Ref": "ProductionVPC"
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
    "PublicRoute": {
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
    "PublicSubnetRouteTableAssociation1": {
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
    "PublicSubnetRouteTableAssociation2": {
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
    "NATGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": "NAT-Gateway-1-EIP"
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
            "Value": "NAT-Gateway-1"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private-Route-Table-1"
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
    "PrivateSubnetRouteTableAssociation1": {
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
    "PrivateSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
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
          "Ref": "ProductionVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {
              "Ref": "LoadBalancerSecurityGroup"
            }
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
            "Value": "WebServer-SecurityGroup"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "LoadBalancerSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for load balancer",
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
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
            "Value": "LoadBalancer-SecurityGroup"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS database",
        "VpcId": {
          "Ref": "ProductionVPC"
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
            "Value": "Database-SecurityGroup"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "RedisSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Redis cluster",
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 6379,
            "ToPort": 6379,
            "SourceSecurityGroupId": {
              "Ref": "WebServerSecurityGroup"
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Redis-SecurityGroup"
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
        "Name": "Production-ALB",
        "Scheme": "internet-facing",
        "Type": "application",
        "SecurityGroups": [
          {
            "Ref": "LoadBalancerSecurityGroup"
          }
        ],
        "Subnets": [
          {
            "Ref": "PublicSubnet1"
          },
          {
            "Ref": "PublicSubnet2"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-ALB"
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
        "Name": "Production-TG",
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-TG"
          },
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
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
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
                    "s3:PutObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "${S3Bucket}/*"
                  }
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
        "Roles": [
          {
            "Ref": "EC2Role"
          }
        ]
      }
    },
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": "Production-LaunchTemplate",
        "LaunchTemplateData": {
          "ImageId": "ami-0c02fb55956c7d316",
          "InstanceType": "t3.medium",
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
          "BlockDeviceMappings": [
            {
              "DeviceName": "/dev/xvda",
              "Ebs": {
                "VolumeSize": 20,
                "VolumeType": "gp3",
                "Encrypted": true,
                "DeleteOnTermination": true
              }
            }
          ],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y amazon-cloudwatch-agent\n/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": "Production-WebServer"
                },
                {
                  "Key": "Environment",
                  "Value": "Production"
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
        "AutoScalingGroupName": "Production-ASG",
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
        "MinSize": "2",
        "MaxSize": "10",
        "DesiredCapacity": "2",
        "VPCZoneIdentifier": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          }
        ],
        "TargetGroupARNs": [
          {
            "Ref": "ALBTargetGroup"
          }
        ],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-ASG",
            "PropagateAtLaunch": false
          },
          {
            "Key": "Environment",
            "Value": "Production",
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "ScaleUpPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AdjustmentType": "ChangeInCapacity",
        "AutoScalingGroupName": {
          "Ref": "AutoScalingGroup"
        },
        "Cooldown": "300",
        "ScalingAdjustment": "1"
      }
    },
    "ScaleDownPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AdjustmentType": "ChangeInCapacity",
        "AutoScalingGroupName": {
          "Ref": "AutoScalingGroup"
        },
        "Cooldown": "300",
        "ScalingAdjustment": "-1"
      }
    },
    "CPUAlarmHigh": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Scale-up if CPU > 70% for 10 minutes",
        "AlarmActions": [
          {
            "Ref": "ScaleUpPolicy"
          },
          {
            "Ref": "SNSTopic"
          }
        ],
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": "300",
        "EvaluationPeriods": "2",
        "Threshold": "70",
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {
              "Ref": "AutoScalingGroup"
            }
          }
        ]
      }
    },
    "CPUAlarmLow": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Scale-down if CPU < 10% for 10 minutes",
        "AlarmActions": [
          {
            "Ref": "ScaleDownPolicy"
          }
        ],
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": "300",
        "EvaluationPeriods": "2",
        "Threshold": "10",
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {
              "Ref": "AutoScalingGroup"
            }
          }
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS database",
        "SubnetIds": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-DB-SubnetGroup"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "RDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": "production-database",
        "DBInstanceClass": "db.t3.micro",
        "Engine": "mysql",
        "EngineVersion": "8.0.35",
        "MasterUsername": {
          "Ref": "DBUsername"
        },
        "MasterUserPassword": {
          "Ref": "DBPassword"
        },
        "AllocatedStorage": "20",
        "StorageType": "gp2",
        "StorageEncrypted": true,
        "MultiAZ": true,
        "VPCSecurityGroups": [
          {
            "Ref": "DatabaseSecurityGroup"
          }
        ],
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "BackupRetentionPeriod": 7,
        "DeletionProtection": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Database"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "RedisSubnetGroup": {
      "Type": "AWS::ElastiCache::SubnetGroup",
      "Properties": {
        "Description": "Subnet group for Redis cluster",
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
    "RedisCluster": {
      "Type": "AWS::ElastiCache::CacheCluster",
      "Properties": {
        "ClusterName": "production-redis",
        "CacheNodeType": "cache.t3.micro",
        "Engine": "redis",
        "NumCacheNodes": 1,
        "VpcSecurityGroupIds": [
          {
            "Ref": "RedisSecurityGroup"
          }
        ],
        "CacheSubnetGroupName": {
          "Ref": "RedisSubnetGroup"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Redis"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "production-app-bucket-${AWS::AccountId}-${AWS::Region}"
        },
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
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-S3-Bucket"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
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
            "PolicyName": "VPCAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ec2:CreateNetworkInterface",
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:DeleteNetworkInterface"
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
    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "ProductionLambdaFunction",
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Code": {
          "ZipFile": "import json\ndef lambda_handler(event, context):\n    return {\n        'statusCode': 200,\n        'body': json.dumps('Hello from Lambda!')\n    }\n"
        },
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "WebServerSecurityGroup"
            }
          ],
          "SubnetIds": [
            {
              "Ref": "PrivateSubnet1"
            },
            {
              "Ref": "PrivateSubnet2"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Lambda"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "ApiGateway": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": "ProductionAPI",
        "Description": "Production API Gateway",
        "EndpointConfiguration": {
          "Types": [
            "REGIONAL"
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-API"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "ApiGatewayResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ParentId": {
          "Fn::GetAtt": [
            "ApiGateway",
            "RootResourceId"
          ]
        },
        "PathPart": "api"
      }
    },
    "ApiGatewayMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ResourceId": {
          "Ref": "ApiGatewayResource"
        },
        "HttpMethod": "GET",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations"
          }
        }
      }
    },
    "ApiGatewayDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": "ApiGatewayMethod",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "StageName": "prod"
      }
    },
    "LambdaApiGatewayPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "LambdaFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*/*"
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
    "LoadBalancerDNS": {
      "Description": "Load Balancer DNS Name",
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
    "RDSEndpoint": {
      "Description": "RDS Instance Endpoint",
      "Value": {
        "Fn::GetAtt": [
          "RDSInstance",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-RDS-Endpoint"
        }
      }
    },
    "S3BucketName": {
      "Description": "S3 Bucket Name",
      "Value": {
        "Ref": "S3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3-Bucket"
        }
      }
    },
    "ApiGatewayURL": {
      "Description": "API Gateway URL",
      "Value": {
        "Fn::Sub": "https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/prod"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-API-URL"
        }
      }
    },
    "CloudFrontURL": {
      "Description": "CloudFront Distribution URL",
      "Value": {
        "Fn::Sub": "https://${CloudFrontDistribution.DomainName}"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CloudFront-URL"
        }
      }
    }
  }
}
```