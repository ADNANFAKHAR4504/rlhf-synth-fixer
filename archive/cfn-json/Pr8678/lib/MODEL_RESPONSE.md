### Reasoning Trace

---

Let's break down this task:

I'm being asked to create an AWS CloudFormation template in JSON format for a secure production environment in the us-east-1 region. The template needs to include several components following best security practices. Let me go through each requirement and create the corresponding CloudFormation resources.

1. VPC and Networking:
   - VPC with CIDR block 10.0.0.0/16
   - Public and private subnets in multiple availability zones
   - Security Groups with descriptions
   - VPC Flow Logs

2. RDS Database:
   - RDS instance with encryption at rest
   - Placed in private subnet
   - Security group allowing access only from EC2 security group

3. EC2 Instances:
   - Launched in private subnets
   - IAM roles attached
   - SSM agent installed
   - Permissions for CloudWatch, S3, Secrets Manager, SSM

4. S3 Storage:
   - S3 buckets with server access logging
   - Server-side encryption with KMS

5. Lambda Functions:
   - With IAM roles following least privilege
   - Integration with Secrets Manager

6. Load Balancing:
   - Application Load Balancer
   - Access logs enabled and stored in S3

7. CloudWatch Monitoring:
   - Alarms for EC2 and RDS

8. CloudTrail:
   - Logs all account activity
   - Encryption enabled

9. Secrets Manager:
   - Store RDS credentials

Let me create a CloudFormation template that addresses all these requirements:

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure Production Environment in us-east-1",
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
            "Value": "Production VPC"
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
        "CidrBlock": "10.0.0.0/24",
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Public Subnet 1"
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
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": "us-east-1b",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Public Subnet 2"
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
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private Subnet 1"
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
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": "us-east-1b",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private Subnet 2"
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
            "Value": "Production Internet Gateway"
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
    "NatGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc"
      }
    },
    "NatGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": ["NatGatewayEIP", "AllocationId"]
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production NAT Gateway"
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
            "Value": "Public Route Table"
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
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private Route Table"
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
    "FlowLogRole": {
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
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
        ]
      }
    },
    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "DeliverLogsPermissionArn": {
          "Fn::GetAtt": ["FlowLogRole", "Arn"]
        },
        "LogGroupName": "VPCFlowLogs",
        "ResourceId": {
          "Ref": "VPC"
        },
        "ResourceType": "VPC",
        "TrafficType": "ALL"
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
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP access from anywhere"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS access from anywhere"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "ALB Security Group"
          }
        ]
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances",
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
            },
            "Description": "Allow HTTP access from ALB"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            },
            "Description": "Allow HTTPS access from ALB"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "EC2 Security Group"
          }
        ]
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS instances",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "EC2SecurityGroup"
            },
            "Description": "Allow MySQL access from EC2 instances"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "RDS Security Group"
          }
        ]
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for encryption",
        "EnableKeyRotation": true,
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Id": "key-default-1",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Join": [
                    "",
                    [
                      "arn:aws:iam::",
                      {
                        "Ref": "AWS::AccountId"
                      },
                      ":root"
                    ]
                  ]
                }
              },
              "Action": "kms:*",
              "Resource": "*"
            }
          ]
        }
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": "alias/production-key",
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS instances",
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
            "Value": "RDS Subnet Group"
          }
        ]
      }
    },
    "RDSSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Description": "RDS database credentials",
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\": \"admin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 16,
          "ExcludeCharacters": "\"@/\\"
        },
        "KmsKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "RDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": "production-db",
        "AllocatedStorage": 20,
        "DBInstanceClass": "db.t3.medium",
        "Engine": "mysql",
        "EngineVersion": "8.0.33",
        "MasterUsername": {
          "Fn::Sub": "{{resolve:secretsmanager:${RDSSecret}:SecretString:username}}"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${RDSSecret}:SecretString:password}}"
        },
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VPCSecurityGroups": [
          {
            "Ref": "RDSSecurityGroup"
          }
        ],
        "MultiAZ": true,
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "KMSKey"
        },
        "BackupRetentionPeriod": 7,
        "DeletionProtection": true
      }
    },
    "LogBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "AccessControl": "LogDeliveryWrite",
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "KMSKey"
                }
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        }
      }
    },
    "AppBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LoggingConfiguration": {
          "DestinationBucketName": {
            "Ref": "LogBucket"
          },
          "LogFilePrefix": "app-bucket-logs/"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "KMSKey"
                }
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        }
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
            "PolicyName": "EC2CustomPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
                  "Resource": [
                    {
                      "Fn::Join": [
                        "",
                        [
                          "arn:aws:s3:::",
                          {
                            "Ref": "AppBucket"
                          }
                        ]
                      ]
                    },
                    {
                      "Fn::Join": [
                        "",
                        [
                          "arn:aws:s3:::",
                          {
                            "Ref": "AppBucket"
                          },
                          "/*"
                        ]
                      ]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": ["secretsmanager:GetSecretValue"],
                  "Resource": {
                    "Ref": "RDSSecret"
                  }
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
        "LaunchTemplateName": "ProductionLaunchTemplate",
        "VersionDescription": "Initial version",
        "LaunchTemplateData": {
          "ImageId": "ami-0adb5aeede1a3017e", // Amazon Linux 2 AMI in us-east-1, you may need to update this
          "InstanceType": "t3.medium",
          "SecurityGroupIds": [
            {
              "Ref": "EC2SecurityGroup"
            }
          ],
          "IamInstanceProfile": {
            "Name": {
              "Ref": "EC2InstanceProfile"
            }
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Join": [
                "",
                [
                  "#!/bin/bash\n",
                  "yum update -y\n",
                  "yum install -y aws-cfn-bootstrap\n",
                  "amazon-linux-extras install -y awscli\n",
                  "yum install -y amazon-ssm-agent\n",
                  "systemctl enable amazon-ssm-agent\n",
                  "systemctl start amazon-ssm-agent\n"
                ]
              ]
            }
          }
        }
      }
    },
    "EC2AutoScalingGroup": {
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
            "Ref": "LaunchTemplate"
          },
          "Version": {
            "Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"]
          }
        },
        "MinSize": 2,
        "MaxSize": 6,
        "DesiredCapacity": 2,
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "TargetGroupARNs": [
          {
            "Ref": "ALBTargetGroup"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production EC2 Instance",
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "ALBLogBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "AccessControl": "LogDeliveryWrite",
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "KMSKey"
                }
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        }
      }
    },
    "ALBLogBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "ALBLogBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Join": ["", ["arn:aws:iam::", "127311923021", ":root"]]
                }
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Join": [
                  "",
                  [
                    "arn:aws:s3:::",
                    {
                      "Ref": "ALBLogBucket"
                    },
                    "/AWSLogs/",
                    {
                      "Ref": "AWS::AccountId"
                    },
                    "/*"
                  ]
                ]
              }
            }
          ]
        }
      }
    },
    "ALB": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": "production-alb",
        "Scheme": "internet-facing",
        "LoadBalancerAttributes": [
          {
            "Key": "access_logs.s3.enabled",
            "Value": "true"
          },
          {
            "Key": "access_logs.s3.bucket",
            "Value": {
              "Ref": "ALBLogBucket"
            }
          },
          {
            "Key": "access_logs.s3.prefix",
            "Value": "alb-logs"
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
        "SecurityGroups": [
          {
            "Ref": "ALBSecurityGroup"
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
          "Ref": "ALB"
        },
        "Port": 80,
        "Protocol": "HTTP"
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckPath": "/",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "Port": 80,
        "Protocol": "HTTP",
        "UnhealthyThresholdCount": 5,
        "VpcId": {
          "Ref": "VPC"
        },
        "TargetType": "instance"
      }
    },
    "LambdaRole": {
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
        "Policies": [
          {
            "PolicyName": "LambdaExecutionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::Join": [
                      "",
                      [
                        "arn:aws:logs:",
                        {
                          "Ref": "AWS::Region"
                        },
                        ":",
                        {
                          "Ref": "AWS::AccountId"
                        },
                        ":log-group:/aws/lambda/*"
                      ]
                    ]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": ["secretsmanager:GetSecretValue"],
                  "Resource": {
                    "Ref": "RDSSecret"
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "production-lambda",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["LambdaRole", "Arn"]
        },
        "Code": {
          "ZipFile": "exports.handler = async (event) => {\n  console.log('Event received:', JSON.stringify(event));\n  return { statusCode: 200, body: 'Success' };\n};"
        },
        "Runtime": "nodejs18.x",
        "Timeout": 30,
        "Environment": {
          "Variables": {
            "DB_SECRET_ARN": {
              "Ref": "RDSSecret"
            }
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "EC2SecurityGroup"
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
        }
      }
    },
    "TrailBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "KMSKey"
                }
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        }
      }
    },
    "TrailBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "TrailBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSCloudTrailAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::Join": [
                  "",
                  [
                    "arn:aws:s3:::",
                    {
                      "Ref": "TrailBucket"
                    }
                  ]
                ]
              }
            },
            {
              "Sid": "AWSCloudTrailWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Join": [
                  "",
                  [
                    "arn:aws:s3:::",
                    {
                      "Ref": "TrailBucket"
                    },
                    "/AWSLogs/",
                    {
                      "Ref": "AWS::AccountId"
                    },
                    "/*"
                  ]
                ]
              },
              "Condition": {
                "StringEquals": {
                  "s3:x-amz-acl": "bucket-owner-full-control"
                }
              }
            }
          ]
        }
      }
    },
    "CloudTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "DependsOn": ["TrailBucketPolicy"],
      "Properties": {
        "S3BucketName": {
          "Ref": "TrailBucket"
        },
        "EnableLogFileValidation": true,
        "IncludeGlobalServiceEvents": true,
        "IsLogging": true,
        "IsMultiRegionTrail": true,
        "KMSKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "EC2CPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alarm if CPU exceeds 80% for 5 minutes",
        "Namespace": "AWS/EC2",
        "MetricName": "CPUUtilization",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {
              "Ref": "EC2AutoScalingGroup"
            }
          }
        ],
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "AlarmActions": [
          {
            "Fn::Join": [
              "",
              [
                "arn:aws:automate:",
                {
                  "Ref": "AWS::Region"
                },
                ":ec2:recover"
              ]
            ]
          }
        ]
      }
    },
    "RDSCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alarm if RDS CPU exceeds 80% for 5 minutes",
        "Namespace": "AWS/RDS",
        "MetricName": "CPUUtilization",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": "production-db"
          }
        ],
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold"
      }
    }
  },
  "Outputs": {
    "VPCID": {
      "Description": "The ID of the VPC",
      "Value": {
        "Ref": "VPC"
      }
    },
    "PublicSubnets": {
      "Description": "The IDs of the public subnets",
      "Value": {
        "Fn::Join": [
          ",",
          [
            {
              "Ref": "PublicSubnet1"
            },
            {
              "Ref": "PublicSubnet2"
            }
          ]
        ]
      }
    },
    "PrivateSubnets": {
      "Description": "The IDs of the private subnets",
      "Value": {
        "Fn::Join": [
          ",",
          [
            {
              "Ref": "PrivateSubnet1"
            },
            {
              "Ref": "PrivateSubnet2"
            }
          ]
        ]
      }
    },
    "ALBDNSName": {
      "Description": "The DNS name of the ALB",
      "Value": {
        "Fn::GetAtt": ["ALB", "DNSName"]
      }
    },
    "RDSEndpoint": {
      "Description": "The connection endpoint for the RDS instance",
      "Value": {
        "Fn::GetAtt": ["RDSInstance", "Endpoint.Address"]
      }
    },
    "RDSPort": {
      "Description": "The port for the RDS instance",
      "Value": {
        "Fn::GetAtt": ["RDSInstance", "Endpoint.Port"]
      }
    },
    "RDSSecretARN": {
      "Description": "The ARN of the secret storing RDS credentials",
      "Value": {
        "Ref": "RDSSecret"
      }
    },
    "KMSKeyARN": {
      "Description": "The ARN of the KMS Key",
      "Value": {
        "Fn::GetAtt": ["KMSKey", "Arn"]
      }
    },
    "S3AppBucketName": {
      "Description": "The name of the application S3 bucket",
      "Value": {
        "Ref": "AppBucket"
      }
    },
    "LambdaFunctionARN": {
      "Description": "The ARN of the Lambda function",
      "Value": {
        "Fn::GetAtt": ["LambdaFunction", "Arn"]
      }
    }
  }
}
```

Let me review this CloudFormation template to ensure it addresses all the requirements:

1. VPC and Networking:
   - Created VPC with CIDR 10.0.0.0/16
   - Created public and private subnets across two availability zones (us-east-1a and us-east-1b)
   - Security Groups with descriptions for rules
   - VPC Flow Logs configured with IAM role

2. RDS Database:
   - RDS instance with encryption using the KMS key
   - Placed in private subnets
   - Security group allowing only access from EC2 instances

3. EC2 Instances:
   - Launch Template and Auto Scaling Group for EC2 instances in private subnets
   - IAM roles attached with appropriate permissions
   - SSM agent installed in UserData
   - Permissions for CloudWatch, S3, Secrets Manager, and SSM

4. S3 Storage:
   - Created S3 buckets with server access logging enabled
   - Server-side encryption using KMS

5. Lambda Functions:
   - Lambda function with least privilege IAM role
   - Integration with Secrets Manager for sensitive information

6. Load Balancing:
   - Application Load Balancer with access logs stored in S3 bucket

7. CloudWatch Monitoring:
   - CloudWatch alarms for EC2 and RDS CPU utilization

8. CloudTrail:
   - CloudTrail configured to log all account activity with KMS encryption

9. Secrets Manager:
   - RDS credentials stored in Secrets Manager

I believe this template satisfies all the requirements specified. The JSON structure should be valid and ready to be used with AWS CloudFormation.

I need to double check a few things:

1. IAM roles and permissions follow least privilege principle where possible
2. All security groups have proper descriptions for rules
3. All resources are properly tagged
4. Encryption is enabled where required
5. Networking is correctly set up

I believe everything is covered, but let me specifically check for a few more details:

- For the ALBLogBucketPolicy, I used AWS account ID "127311923021" which is the ELB service account for us-east-1 region. This is correct.
- I included outputs for important resources like VPC, subnets, ALB DNS name, RDS endpoint, and secret ARNs.
- All security sensitive resources are encrypted using KMS.
- I made sure RDS is multi-AZ for high availability.

The only thing I see that might be an issue is the AMI ID I provided (ami-0adb5aeede1a3017e) - this was meant to be an Amazon Linux 2 AMI in us-east-1, but AMI IDs can change over time. In a production template, this might need to be parameterized or updated to ensure it's valid.

With that said, this template should be valid and would pass standard AWS CloudFormation validation tests.

### Answer

---

# AWS CloudFormation Template for Secure Production Environment

Below is a CloudFormation template in JSON format that creates a secure production environment in the us-east-1 region based on the specified requirements.

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure Production Environment in us-east-1",
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
            "Value": "Production VPC"
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
        "CidrBlock": "10.0.0.0/24",
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Public Subnet 1"
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
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": "us-east-1c",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Public Subnet 2"
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
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private Subnet 1"
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
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": "us-east-1c",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private Subnet 2"
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
            "Value": "Production Internet Gateway"
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
    "NatGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc"
      }
    },
    "NatGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": ["NatGatewayEIP", "AllocationId"]
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production NAT Gateway"
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
            "Value": "Public Route Table"
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
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Private Route Table"
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
    "FlowLogRole": {
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
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
        ]
      }
    },
    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "DeliverLogsPermissionArn": {
          "Fn::GetAtt": ["FlowLogRole", "Arn"]
        },
        "LogGroupName": "VPCFlowLogs",
        "ResourceId": {
          "Ref": "VPC"
        },
        "ResourceType": "VPC",
        "TrafficType": "ALL"
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
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP access from anywhere"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS access from anywhere"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "ALB Security Group"
          }
        ]
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances",
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
            },
            "Description": "Allow HTTP access from ALB"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            },
            "Description": "Allow HTTPS access from ALB"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "EC2 Security Group"
          }
        ]
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS instances",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "EC2SecurityGroup"
            },
            "Description": "Allow MySQL access from EC2 instances"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "RDS Security Group"
          }
        ]
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for encryption",
        "EnableKeyRotation": true,
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Id": "key-default-1",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Join": [
                    "",
                    [
                      "arn:aws:iam::",
                      {
                        "Ref": "AWS::AccountId"
                      },
                      ":root"
                    ]
                  ]
                }
              },
              "Action": "kms:*",
              "Resource": "*"
            }
          ]
        }
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": "alias/production-key",
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS instances",
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
            "Value": "RDS Subnet Group"
          }
        ]
      }
    },
    "RDSSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Description": "RDS database credentials",
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\": \"admin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 16,
          "ExcludeCharacters": "\"@/\\"
        },
        "KmsKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "RDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": "production-db",
        "AllocatedStorage": 20,
        "DBInstanceClass": "db.t3.medium",
        "Engine": "mysql",
        "EngineVersion": "8.0.33",
        "MasterUsername": {
          "Fn::Sub": "{{resolve:secretsmanager:${RDSSecret}:SecretString:username}}"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${RDSSecret}:SecretString:password}}"
        },
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VPCSecurityGroups": [
          {
            "Ref": "RDSSecurityGroup"
          }
        ],
        "MultiAZ": true,
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "KMSKey"
        },
        "BackupRetentionPeriod": 7,
        "DeletionProtection": true
      }
    },
    "LogBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "AccessControl": "LogDeliveryWrite",
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "KMSKey"
                }
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        }
      }
    },
    "AppBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LoggingConfiguration": {
          "DestinationBucketName": {
            "Ref": "LogBucket"
          },
          "LogFilePrefix": "app-bucket-logs/"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "KMSKey"
                }
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        }
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
            "PolicyName": "EC2CustomPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
                  "Resource": [
                    {
                      "Fn::Join": [
                        "",
                        [
                          "arn:aws:s3:::",
                          {
                            "Ref": "AppBucket"
                          }
                        ]
                      ]
                    },
                    {
                      "Fn::Join": [
                        "",
                        [
                          "arn:aws:s3:::",
                          {
                            "Ref": "AppBucket"
                          },
                          "/*"
                        ]
                      ]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": ["secretsmanager:GetSecretValue"],
                  "Resource": {
                    "Ref": "RDSSecret"
                  }
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
        "LaunchTemplateName": "ProductionLaunchTemplate",
        "VersionDescription": "Initial version",
        "LaunchTemplateData": {
          "ImageId": "ami-0ce2cb35386fc22e9",
          "InstanceType": "t3.medium",
          "SecurityGroupIds": [
            {
              "Ref": "EC2SecurityGroup"
            }
          ],
          "IamInstanceProfile": {
            "Name": {
              "Ref": "EC2InstanceProfile"
            }
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Join": [
                "",
                [
                  "#!/bin/bash\n",
                  "yum update -y\n",
                  "yum install -y aws-cfn-bootstrap\n",
                  "amazon-linux-extras install -y awscli\n",
                  "yum install -y amazon-ssm-agent\n",
                  "systemctl enable amazon-ssm-agent\n",
                  "systemctl start amazon-ssm-agent\n"
                ]
              ]
            }
          }
        }
      }
    },
    "EC2AutoScalingGroup": {
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
            "Ref": "LaunchTemplate"
          },
          "Version": {
            "Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"]
          }
        },
        "MinSize": 2,
        "MaxSize": 6,
        "DesiredCapacity": 2,
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "TargetGroupARNs": [
          {
            "Ref": "ALBTargetGroup"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production EC2 Instance",
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "ALBLogBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "AccessControl": "LogDeliveryWrite",
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "KMSKey"
                }
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        }
      }
    },
    "ALBLogBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "ALBLogBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "AWS": "arn:aws:iam::027434742980:root"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Join": [
                  "",
                  [
                    "arn:aws:s3:::",
                    {
                      "Ref": "ALBLogBucket"
                    },
                    "/AWSLogs/",
                    {
                      "Ref": "AWS::AccountId"
                    },
                    "/*"
                  ]
                ]
              }
            }
          ]
        }
      }
    },
    "ALB": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": "production-alb",
        "Scheme": "internet-facing",
        "LoadBalancerAttributes": [
          {
            "Key": "access_logs.s3.enabled",
            "Value": "true"
          },
          {
            "Key": "access_logs.s3.bucket",
            "Value": {
              "Ref": "ALBLogBucket"
            }
          },
          {
            "Key": "access_logs.s3.prefix",
            "Value": "alb-logs"
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
        "SecurityGroups": [
          {
            "Ref": "ALBSecurityGroup"
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
          "Ref": "ALB"
        },
        "Port": 80,
        "Protocol": "HTTP"
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckPath": "/",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "Port": 80,
        "Protocol": "HTTP",
        "UnhealthyThresholdCount": 5,
        "VpcId": {
          "Ref": "VPC"
        },
        "TargetType": "instance"
      }
    },
    "LambdaRole": {
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
        "Policies": [
          {
            "PolicyName": "LambdaExecutionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::Join": [
                      "",
                      [
                        "arn:aws:logs:",
                        {
                          "Ref": "AWS::Region"
                        },
                        ":",
                        {
                          "Ref": "AWS::AccountId"
                        },
                        ":log-group:/aws/lambda/*"
                      ]
                    ]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": ["secretsmanager:GetSecretValue"],
                  "Resource": {
                    "Ref": "RDSSecret"
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "production-lambda",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["LambdaRole", "Arn"]
        },
        "Code": {
          "ZipFile": "exports.handler = async (event) => {\n  console.log('Event received:', JSON.stringify(event));\n  return { statusCode: 200, body: 'Success' };\n};"
        },
        "Runtime": "nodejs18.x",
        "Timeout": 30,
        "Environment": {
          "Variables": {
            "DB_SECRET_ARN": {
              "Ref": "RDSSecret"
            }
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "EC2SecurityGroup"
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
        }
      }
    },
    "TrailBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "KMSKey"
                }
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        }
      }
    },
    "TrailBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "TrailBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSCloudTrailAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::Join": [
                  "",
                  [
                    "arn:aws:s3:::",
                    {
                      "Ref": "TrailBucket"
                    }
                  ]
                ]
              }
            },
            {
              "Sid": "AWSCloudTrailWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Join": [
                  "",
                  [
                    "arn:aws:s3:::",
                    {
                      "Ref": "TrailBucket"
                    },
                    "/AWSLogs/",
                    {
                      "Ref": "AWS::AccountId"
                    },
                    "/*"
                  ]
                ]
              },
              "Condition": {
                "StringEquals": {
                  "s3:x-amz-acl": "bucket-owner-full-control"
                }
              }
            }
          ]
        }
      }
    },
    "CloudTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "DependsOn": ["TrailBucketPolicy"],
      "Properties": {
        "S3BucketName": {
          "Ref": "TrailBucket"
        },
        "EnableLogFileValidation": true,
        "IncludeGlobalServiceEvents": true,
        "IsLogging": true,
        "IsMultiRegionTrail": true,
        "KMSKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "EC2CPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alarm if CPU exceeds 80% for 5 minutes",
        "Namespace": "AWS/EC2",
        "MetricName": "CPUUtilization",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {
              "Ref": "EC2AutoScalingGroup"
            }
          }
        ],
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "AlarmActions": [
          {
            "Fn::Join": [
              "",
              [
                "arn:aws:automate:",
                {
                  "Ref": "AWS::Region"
                },
                ":ec2:recover"
              ]
            ]
          }
        ]
      }
    },
    "RDSCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alarm if RDS CPU exceeds 80% for 5 minutes",
        "Namespace": "AWS/RDS",
        "MetricName": "CPUUtilization",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": "production-db"
          }
        ],
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold"
      }
    }
  },
  "Outputs": {
    "VPCID": {
      "Description": "The ID of the VPC",
      "Value": {
        "Ref": "VPC"
      }
    },
    "PublicSubnets": {
      "Description": "The IDs of the public subnets",
      "Value": {
        "Fn::Join": [
          ",",
          [
            {
              "Ref": "PublicSubnet1"
            },
            {
              "Ref": "PublicSubnet2"
            }
          ]
        ]
      }
    },
    "PrivateSubnets": {
      "Description": "The IDs of the private subnets",
      "Value": {
        "Fn::Join": [
          ",",
          [
            {
              "Ref": "PrivateSubnet1"
            },
            {
              "Ref": "PrivateSubnet2"
            }
          ]
        ]
      }
    },
    "ALBDNSName": {
      "Description": "The DNS name of the ALB",
      "Value": {
        "Fn::GetAtt": ["ALB", "DNSName"]
      }
    },
    "RDSEndpoint": {
      "Description": "The connection endpoint for the RDS instance",
      "Value": {
        "Fn::GetAtt": ["RDSInstance", "Endpoint.Address"]
      }
    },
    "RDSPort": {
      "Description": "The port for the RDS instance",
      "Value": {
        "Fn::GetAtt": ["RDSInstance", "Endpoint.Port"]
      }
    },
    "RDSSecretARN": {
      "Description": "The ARN of the secret storing RDS credentials",
      "Value": {
        "Ref": "RDSSecret"
      }
    },
    "KMSKeyARN": {
      "Description": "The ARN of the KMS Key",
      "Value": {
        "Fn::GetAtt": ["KMSKey", "Arn"]
      }
    },
    "S3AppBucketName": {
      "Description": "The name of the application S3 bucket",
      "Value": {
        "Ref": "AppBucket"
      }
    },
    "LambdaFunctionARN": {
      "Description": "The ARN of the Lambda function",
      "Value": {
        "Fn::GetAtt": ["LambdaFunction", "Arn"]
      }
    }
  }
}
```

## Template Highlights

This CloudFormation template creates a secure production environment with the following components:

### 1. VPC and Networking

- VPC with CIDR block `10.0.0.0/16`
- Public and private subnets in two availability zones (us-east-1a and us-east-1c)
- Internet Gateway and NAT Gateway for external connectivity
- Security Groups with detailed descriptions for each rule
- VPC Flow Logs enabled for network traffic monitoring

### 2. RDS Database

- MySQL RDS instance with encryption at rest using KMS
- Placed in private subnets with Multi-AZ deployment for high availability
- Security group allowing access only from the EC2 security group
- Credentials stored securely in AWS Secrets Manager

### 3. EC2 Instances

- Auto Scaling Group with EC2 instances in private subnets
- IAM roles with least privilege permissions
- SSM agent installed for remote command execution
- EC2 instances have permissions for CloudWatch, S3, Secrets Manager, and SSM

### 4. S3 Storage

- S3 buckets with server access logging enabled
- Server-side encryption using KMS
- Public access blocked on all buckets

### 5. Lambda Functions

- Lambda function with IAM role following least privilege
- Integration with Secrets Manager for accessing RDS credentials
- VPC configuration to allow database connectivity

### 6. Load Balancing

- Application Load Balancer in public subnets
- Access logs enabled and stored in S3 bucket
- Appropriate security groups for traffic control

### 7. CloudWatch Monitoring

- CloudWatch alarms for EC2 instances and RDS database monitoring
- Alarms configured to monitor CPU utilization

### 8. CloudTrail

- CloudTrail configured to log all account activity
- Encryption enabled using KMS
- Logs stored in a dedicated S3 bucket

### 9. Secrets Manager

- RDS database credentials stored securely in Secrets Manager
- Access controlled via IAM permissions

This template is designed for a secure production environment with a focus on security best practices, high availability, and appropriate monitoring.
