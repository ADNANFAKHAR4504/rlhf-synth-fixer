# CloudFormation Multi-Environment Payment Processing Infrastructure - Ideal Implementation

This implementation provides a complete and production-ready CloudFormation JSON template for deploying a payment processing infrastructure across multiple AWS accounts using StackSets. The template uses AWS Secrets Manager for secure password management and includes comprehensive integration tests that dynamically discover deployed resources.

## Key Improvements Over MODEL_RESPONSE

1. **Secure Password Management**: Replaced DBPassword parameter with AWS Secrets Manager secret that automatically generates secure passwords
2. **Dynamic Reference Implementation**: Uses CloudFormation dynamic references to Secrets Manager for RDS password
3. **Integration Test Enhancement**: Integration tests dynamically discover stack name and resources from AWS instead of using static files
4. **Updated PostgreSQL Version**: Upgraded to PostgreSQL 14.15 for latest security patches

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-environment payment processing infrastructure with CloudFormation StackSets support",

  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming (e.g., dev-123, staging-456, prod-789)",
      "MinLength": 1
    },
    "EnvironmentType": {
      "Type": "String",
      "Description": "Environment type for configuration mapping",
      "AllowedValues": ["dev", "staging", "prod"],
      "Default": "dev"
    },
    "InstanceType": {
      "Type": "String",
      "Description": "EC2 instance type for the application servers",
      "Default": "t3.micro",
      "AllowedValues": ["t3.micro", "t3.small", "m5.large"]
    },
    "DBInstanceClass": {
      "Type": "String",
      "Description": "RDS instance class",
      "Default": "db.t3.small",
      "AllowedValues": ["db.t3.small", "db.t3.medium", "db.r5.large"]
    },
    "DBMultiAZ": {
      "Type": "String",
      "Description": "Enable Multi-AZ for RDS",
      "AllowedValues": ["true", "false"],
      "Default": "false"
    },
    "DBUsername": {
      "Type": "String",
      "Description": "Master username for RDS PostgreSQL",
      "Default": "postgres",
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*"
    },
    "CPUAlarmThreshold": {
      "Type": "Number",
      "Description": "CPU utilization alarm threshold percentage",
      "Default": 80,
      "MinValue": 1,
      "MaxValue": 100
    },
    "QueueDepthAlarmThreshold": {
      "Type": "Number",
      "Description": "SQS queue depth alarm threshold",
      "Default": 100,
      "MinValue": 1
    },
    "SQSVisibilityTimeout": {
      "Type": "Number",
      "Description": "SQS visibility timeout in seconds",
      "Default": 30,
      "MinValue": 0,
      "MaxValue": 43200
    },
    "PaymentAPIEndpoint": {
      "Type": "String",
      "Description": "Payment validation API endpoint URL",
      "Default": "https://api.payment.example.com/validate"
    }
  },

  "Mappings": {
    "RegionAMI": {
      "us-east-1": {
        "AmazonLinux2": "ami-0c02fb55b34e5f3c1"
      },
      "us-west-2": {
        "AmazonLinux2": "ami-0873b46c45c11058d"
      },
      "eu-west-1": {
        "AmazonLinux2": "ami-0d71ea30463e0ff8d"
      },
      "eu-central-1": {
        "AmazonLinux2": "ami-0a1ee2fb28fe05df3"
      }
    },
    "EnvironmentConfig": {
      "dev": {
        "MinSize": "1",
        "MaxSize": "2",
        "DesiredCapacity": "1"
      },
      "staging": {
        "MinSize": "2",
        "MaxSize": "4",
        "DesiredCapacity": "2"
      },
      "prod": {
        "MinSize": "2",
        "MaxSize": "10",
        "DesiredCapacity": "4"
      }
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
            "Value": {"Fn::Sub": "vpc-${EnvironmentSuffix}"}
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
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "public-subnet-1-${EnvironmentSuffix}"}
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
            "Value": {"Fn::Sub": "public-subnet-2-${EnvironmentSuffix}"}
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
            "Value": {"Fn::Sub": "private-subnet-1-${EnvironmentSuffix}"}
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
            "Value": {"Fn::Sub": "private-subnet-2-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "EIP1": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "eip-nat-1-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "EIP2": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "eip-nat-2-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["EIP1", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "nat-gateway-1-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "NATGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["EIP2", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet2"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "nat-gateway-2-${EnvironmentSuffix}"}
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

    "PublicSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet1"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },

    "PublicSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet2"},
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
            "Value": {"Fn::Sub": "private-rt-1-${EnvironmentSuffix}"}
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

    "PrivateSubnetRouteTableAssociation1": {
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
            "Value": {"Fn::Sub": "private-rt-2-${EnvironmentSuffix}"}
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

    "PrivateSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "RouteTableId": {"Ref": "PrivateRouteTable2"}
      }
    },

    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "alb-sg-${EnvironmentSuffix}"},
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
        "GroupName": {"Fn::Sub": "ec2-sg-${EnvironmentSuffix}"},
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
        "GroupName": {"Fn::Sub": "rds-sg-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for RDS PostgreSQL",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": {"Ref": "EC2SecurityGroup"}
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": {"Ref": "LambdaSecurityGroup"}
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
            "Value": {"Fn::Sub": "rds-sg-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "lambda-sg-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for Lambda functions",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "lambda-sg-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {"Fn::Sub": "alb-${EnvironmentSuffix}"},
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          {"Ref": "PublicSubnet1"},
          {"Ref": "PublicSubnet2"}
        ],
        "SecurityGroups": [{"Ref": "ALBSecurityGroup"}],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "alb-${EnvironmentSuffix}"}
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
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
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
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {"Ref": "ALBTargetGroup"}
          }
        ],
        "LoadBalancerArn": {"Ref": "ApplicationLoadBalancer"},
        "Port": 80,
        "Protocol": "HTTP"
      }
    },

    "EC2InstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "ec2-instance-role-${EnvironmentSuffix}"},
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
                    {"Fn::GetAtt": ["PaymentLogsBucket", "Arn"]},
                    {"Fn::Sub": "${PaymentLogsBucket.Arn}/*"},
                    {"Fn::GetAtt": ["TransactionArchiveBucket", "Arn"]},
                    {"Fn::Sub": "${TransactionArchiveBucket.Arn}/*"}
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "SQSAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "sqs:SendMessage",
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes"
                  ],
                  "Resource": {"Fn::GetAtt": ["PaymentQueue", "Arn"]}
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "ec2-instance-role-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {"Fn::Sub": "ec2-instance-profile-${EnvironmentSuffix}"},
        "Roles": [{"Ref": "EC2InstanceRole"}]
      }
    },

    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {"Fn::Sub": "launch-template-${EnvironmentSuffix}"},
        "LaunchTemplateData": {
          "ImageId": {"Fn::FindInMap": ["RegionAMI", {"Ref": "AWS::Region"}, "AmazonLinux2"]},
          "InstanceType": {"Ref": "InstanceType"},
          "IamInstanceProfile": {
            "Arn": {"Fn::GetAtt": ["EC2InstanceProfile", "Arn"]}
          },
          "SecurityGroupIds": [{"Ref": "EC2SecurityGroup"}],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd\nsystemctl enable httpd\necho '<h1>Payment Processing Server - ${EnvironmentSuffix}</h1>' > /var/www/html/index.html\necho 'OK' > /var/www/html/health\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {"Fn::Sub": "payment-server-${EnvironmentSuffix}"}
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
        "AutoScalingGroupName": {"Fn::Sub": "asg-${EnvironmentSuffix}"},
        "LaunchTemplate": {
          "LaunchTemplateId": {"Ref": "LaunchTemplate"},
          "Version": {"Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"]}
        },
        "MinSize": {"Fn::FindInMap": ["EnvironmentConfig", {"Ref": "EnvironmentType"}, "MinSize"]},
        "MaxSize": {"Fn::FindInMap": ["EnvironmentConfig", {"Ref": "EnvironmentType"}, "MaxSize"]},
        "DesiredCapacity": {"Fn::FindInMap": ["EnvironmentConfig", {"Ref": "EnvironmentType"}, "DesiredCapacity"]},
        "VPCZoneIdentifier": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"}
        ],
        "TargetGroupARNs": [{"Ref": "ALBTargetGroup"}],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "asg-${EnvironmentSuffix}"},
            "PropagateAtLaunch": true
          }
        ]
      }
    },

    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {"Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"},
        "DBSubnetGroupDescription": "Subnet group for RDS PostgreSQL",
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

    "DBPasswordSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {"Fn::Sub": "rds/${EnvironmentSuffix}/db-password"},
        "Description": {"Fn::Sub": "RDS master password for ${EnvironmentSuffix} environment"},
        "GenerateSecretString": {
          "SecretStringTemplate": {"Fn::Sub": "{\"username\": \"${DBUsername}\"}"},
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        }
      }
    },

    "RDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "payment-db-${EnvironmentSuffix}"},
        "DBInstanceClass": {"Ref": "DBInstanceClass"},
        "Engine": "postgres",
        "EngineVersion": "14.15",
        "MasterUsername": {"Ref": "DBUsername"},
        "MasterUserPassword": {"Fn::Sub": "{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}"},
        "AllocatedStorage": "20",
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "MultiAZ": {"Ref": "DBMultiAZ"},
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "VPCSecurityGroups": [{"Ref": "RDSSecurityGroup"}],
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "payment-db-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "PaymentLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {"Fn::Sub": "payment-logs-${EnvironmentSuffix}"},
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
                },
                {
                  "TransitionInDays": 90,
                  "StorageClass": "GLACIER"
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
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "payment-logs-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "TransactionArchiveBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {"Fn::Sub": "transaction-archive-${EnvironmentSuffix}"},
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
              "Id": "TransitionToGlacier",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 60,
                  "StorageClass": "GLACIER"
                },
                {
                  "TransitionInDays": 180,
                  "StorageClass": "DEEP_ARCHIVE"
                }
              ]
            },
            {
              "Id": "ExpireOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionExpirationInDays": 365
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
            "Value": {"Fn::Sub": "transaction-archive-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "lambda-execution-role-${EnvironmentSuffix}"},
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "LambdaPermissions",
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
                  "Resource": "arn:aws:logs:*:*:*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                  ],
                  "Resource": [
                    {"Fn::Sub": "${PaymentLogsBucket.Arn}/*"}
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes",
                    "sqs:SendMessage"
                  ],
                  "Resource": [
                    {"Fn::GetAtt": ["PaymentQueue", "Arn"]},
                    {"Fn::GetAtt": ["PaymentDLQ", "Arn"]}
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "lambda-execution-role-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "PaymentValidationFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {"Fn::Sub": "payment-validation-${EnvironmentSuffix}"},
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
        "Code": {
          "ZipFile": "import json\nimport os\nimport boto3\nfrom datetime import datetime\n\ns3_client = boto3.client('s3')\nlogs_bucket = os.environ['LOGS_BUCKET']\napi_endpoint = os.environ['API_ENDPOINT']\n\ndef lambda_handler(event, context):\n    try:\n        for record in event['Records']:\n            body = json.loads(record['body'])\n            payment_id = body.get('payment_id')\n            amount = body.get('amount')\n            \n            # Validate payment\n            is_valid = validate_payment(payment_id, amount)\n            \n            # Log result\n            log_entry = {\n                'payment_id': payment_id,\n                'amount': amount,\n                'validation_result': is_valid,\n                'timestamp': datetime.utcnow().isoformat(),\n                'api_endpoint': api_endpoint\n            }\n            \n            # Store in S3\n            log_key = f\"validations/{datetime.utcnow().strftime('%Y/%m/%d')}/{payment_id}.json\"\n            s3_client.put_object(\n                Bucket=logs_bucket,\n                Key=log_key,\n                Body=json.dumps(log_entry),\n                ContentType='application/json'\n            )\n            \n        return {\n            'statusCode': 200,\n            'body': json.dumps('Payment validation completed')\n        }\n    except Exception as e:\n        print(f\"Error: {str(e)}\")\n        raise\n\ndef validate_payment(payment_id, amount):\n    # Placeholder validation logic\n    if amount and float(amount) > 0:\n        return True\n    return False\n"
        },
        "Environment": {
          "Variables": {
            "LOGS_BUCKET": {"Ref": "PaymentLogsBucket"},
            "API_ENDPOINT": {"Ref": "PaymentAPIEndpoint"},
            "ENVIRONMENT": {"Ref": "EnvironmentType"}
          }
        },
        "Timeout": 60,
        "MemorySize": 256,
        "VpcConfig": {
          "SecurityGroupIds": [{"Ref": "LambdaSecurityGroup"}],
          "SubnetIds": [
            {"Ref": "PrivateSubnet1"},
            {"Ref": "PrivateSubnet2"}
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "payment-validation-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "PaymentDLQ": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": {"Fn::Sub": "payment-dlq-${EnvironmentSuffix}"},
        "MessageRetentionPeriod": 1209600,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "payment-dlq-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "PaymentQueue": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": {"Fn::Sub": "payment-queue-${EnvironmentSuffix}"},
        "VisibilityTimeout": {"Ref": "SQSVisibilityTimeout"},
        "MessageRetentionPeriod": 345600,
        "ReceiveMessageWaitTimeSeconds": 20,
        "RedrivePolicy": {
          "deadLetterTargetArn": {"Fn::GetAtt": ["PaymentDLQ", "Arn"]},
          "maxReceiveCount": 3
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "payment-queue-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "LambdaEventSourceMapping": {
      "Type": "AWS::Lambda::EventSourceMapping",
      "Properties": {
        "EventSourceArn": {"Fn::GetAtt": ["PaymentQueue", "Arn"]},
        "FunctionName": {"Ref": "PaymentValidationFunction"},
        "BatchSize": 10,
        "MaximumBatchingWindowInSeconds": 5
      }
    },

    "EC2CPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "ec2-cpu-alarm-${EnvironmentSuffix}"},
        "AlarmDescription": "Alarm when EC2 CPU exceeds threshold",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {"Ref": "CPUAlarmThreshold"},
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {"Ref": "AutoScalingGroup"}
          }
        ]
      }
    },

    "RDSCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "rds-cpu-alarm-${EnvironmentSuffix}"},
        "AlarmDescription": "Alarm when RDS CPU exceeds threshold",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {"Ref": "CPUAlarmThreshold"},
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {"Ref": "RDSInstance"}
          }
        ]
      }
    },

    "RDSMemoryAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "rds-memory-alarm-${EnvironmentSuffix}"},
        "AlarmDescription": "Alarm when RDS freeable memory is low",
        "MetricName": "FreeableMemory",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 1000000000,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {"Ref": "RDSInstance"}
          }
        ]
      }
    },

    "SQSQueueDepthAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "sqs-depth-alarm-${EnvironmentSuffix}"},
        "AlarmDescription": "Alarm when SQS queue depth exceeds threshold",
        "MetricName": "ApproximateNumberOfMessagesVisible",
        "Namespace": "AWS/SQS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {"Ref": "QueueDepthAlarmThreshold"},
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "QueueName",
            "Value": {"Fn::GetAtt": ["PaymentQueue", "QueueName"]}
          }
        ]
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
    "LoadBalancerDNS": {
      "Description": "Application Load Balancer DNS name",
      "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ALBDNSName"}
      }
    },
    "RDSEndpoint": {
      "Description": "RDS PostgreSQL endpoint",
      "Value": {"Fn::GetAtt": ["RDSInstance", "Endpoint.Address"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-RDSEndpoint"}
      }
    },
    "PaymentLogsBucketName": {
      "Description": "Payment logs S3 bucket name",
      "Value": {"Ref": "PaymentLogsBucket"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-LogsBucket"}
      }
    },
    "TransactionArchiveBucketName": {
      "Description": "Transaction archive S3 bucket name",
      "Value": {"Ref": "TransactionArchiveBucket"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ArchiveBucket"}
      }
    },
    "PaymentQueueURL": {
      "Description": "Payment processing SQS queue URL",
      "Value": {"Ref": "PaymentQueue"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-QueueURL"}
      }
    },
    "LambdaFunctionArn": {
      "Description": "Payment validation Lambda function ARN",
      "Value": {"Fn::GetAtt": ["PaymentValidationFunction", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-LambdaArn"}
      }
    }
  }
}
```

## File: test/tap-stack.int.test.ts

The integration test dynamically discovers the deployed stack and validates all resources using AWS SDK calls:

```typescript
// Integration tests for Payment Processing Stack
// These tests dynamically discover the deployed stack and validate all resources
import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStacksCommand,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import { SQSClient, GetQueueAttributesCommand } from '@aws-sdk/client-sqs';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';

interface DiscoveredResources {
  stackName: string;
  environmentSuffix: string;
  outputs: Record<string, string>;
  resources: Map<string, { logicalId: string; physicalId: string; resourceType: string }>;
  stackStatus: string;
}

describe('Payment Processing Stack - Integration Tests', () => {
  let discovered: DiscoveredResources;
  const region = process.env.AWS_REGION || 'us-east-1';

  // Initialize AWS clients
  const cfnClient = new CloudFormationClient({ region });
  const ec2Client = new EC2Client({ region });
  const elbClient = new ElasticLoadBalancingV2Client({ region });
  const rdsClient = new RDSClient({ region });
  const s3Client = new S3Client({ region });
  const sqsClient = new SQSClient({ region });
  const lambdaClient = new LambdaClient({ region });

  beforeAll(async () => {
    // Dynamically discover the stack and all resources
    discovered = await discoverStackAndResources(cfnClient);
    
    console.log(`✅ Discovered stack: ${discovered.stackName}`);
    console.log(`✅ Environment suffix: ${discovered.environmentSuffix}`);
    console.log(`✅ Stack status: ${discovered.stackStatus}`);
    console.log(`✅ Found ${Object.keys(discovered.outputs).length} outputs`);
    console.log(`✅ Found ${discovered.resources.size} resources`);
  }, 30000);

  /**
   * Dynamically discover the CloudFormation stack and all its resources
   */
  async function discoverStackAndResources(cfnClient: CloudFormationClient): Promise<DiscoveredResources> {
    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    
    // Try to get stack name from environment variable first
    let stackName: string | undefined = process.env.STACK_NAME;
    
    // If ENVIRONMENT_SUFFIX is provided, construct stack name
    if (!stackName) {
      stackName = `TapStack${environmentSuffix}`;
    }

    // Try to find the stack by exact name first
    if (stackName) {
      try {
        const describeCommand = new DescribeStacksCommand({ StackName: stackName });
        const response = await cfnClient.send(describeCommand);
        if (response.Stacks && response.Stacks.length > 0) {
          const stackStatus = response.Stacks[0].StackStatus;
          if (stackStatus === 'CREATE_COMPLETE' || stackStatus === 'UPDATE_COMPLETE') {
            return await extractStackResources(cfnClient, stackName);
          }
        }
      } catch (error: any) {
        console.log(`Stack ${stackName} not found, falling back to discovery: ${error.message}`);
      }
    }

    // Fallback: Discover stack by pattern
    const listCommand = new ListStacksCommand({
      StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'REVIEW_IN_PROGRESS'],
    });

    const stacks = await cfnClient.send(listCommand);
    
    // Find stacks matching TapStack pattern, prioritizing exact matches
    const tapStacks = (stacks.StackSummaries || [])
      .filter((stack) => {
        const name = stack.StackName || '';
        return name.startsWith('TapStack') && 
               !name.includes('-') &&
               (stack.StackStatus === 'CREATE_COMPLETE' || 
                stack.StackStatus === 'UPDATE_COMPLETE' ||
                stack.StackStatus === 'REVIEW_IN_PROGRESS');
      })
      .sort((a, b) => {
        const aTime = a.CreationTime?.getTime() || 0;
        const bTime = b.CreationTime?.getTime() || 0;
        return bTime - aTime;
      });

    if (tapStacks.length === 0) {
      throw new Error(
        `No TapStack found. Searched for: TapStack${environmentSuffix} or TapStack*. ` +
        `Please deploy the stack first using: npm run cfn:deploy-json`
      );
    }

    const selectedStack = tapStacks[0];
    return await extractStackResources(cfnClient, selectedStack.StackName!);
  }

  /**
   * Extract all resources and outputs from a stack
   */
  async function extractStackResources(
    cfnClient: CloudFormationClient,
    stackName: string
  ): Promise<DiscoveredResources> {
    // Get stack details including outputs
    const describeCommand = new DescribeStacksCommand({ StackName: stackName });
    const stackResponse = await cfnClient.send(describeCommand);
    
    if (!stackResponse.Stacks || stackResponse.Stacks.length === 0) {
      throw new Error(`Stack ${stackName} not found`);
    }

    const stack = stackResponse.Stacks[0];
    const stackStatus = stack.StackStatus || 'UNKNOWN';
    
    if (stackStatus !== 'CREATE_COMPLETE' && 
        stackStatus !== 'UPDATE_COMPLETE' && 
        stackStatus !== 'REVIEW_IN_PROGRESS') {
      throw new Error(`Stack ${stackName} is not in a valid state. Current status: ${stackStatus}`);
    }
    
    // Extract outputs dynamically
    const outputs: Record<string, string> = {};
    if (stack.Outputs) {
      for (const output of stack.Outputs) {
        if (output.OutputKey && output.OutputValue) {
          outputs[output.OutputKey] = output.OutputValue;
        }
      }
    }

    // Extract environment suffix from stack name
    const environmentSuffix = stackName.replace(/^TapStack/, '') || 'dev';

    // Get all stack resources dynamically
    const resources = new Map<string, { logicalId: string; physicalId: string; resourceType: string }>();
    let nextToken: string | undefined;
    
    do {
      const resourcesCommand = new ListStackResourcesCommand({
        StackName: stackName,
        NextToken: nextToken,
      });
      const resourcesResponse = await cfnClient.send(resourcesCommand);
      
      if (resourcesResponse.StackResourceSummaries) {
        for (const resource of resourcesResponse.StackResourceSummaries) {
          if (resource.LogicalResourceId && resource.PhysicalResourceId) {
            resources.set(resource.LogicalResourceId, {
              logicalId: resource.LogicalResourceId,
              physicalId: resource.PhysicalResourceId,
              resourceType: resource.ResourceType || 'Unknown',
            });
          }
        }
      }
      
      nextToken = resourcesResponse.NextToken;
    } while (nextToken);

    return {
      stackName,
      environmentSuffix,
      outputs,
      resources,
      stackStatus,
    };
  }

  // Test cases validate all resources using discovered outputs and resources
  // ... (test implementation continues)
});
```

## File: test/tap-stack.unit.test.ts

The unit test validates the template structure and verifies the use of dynamic references:

```typescript
test('should use dynamic reference for RDS password (not DBPassword parameter)', () => {
  // Verify DBPassword parameter does not exist
  expect(template.Parameters.DBPassword).toBeUndefined();
  // Verify RDS instance uses dynamic reference for password
  const rds = template.Resources.RDSInstance;
  expect(rds).toBeDefined();
  const password = rds.Properties.MasterUserPassword;
  expect(password).toBeDefined();
  // Should use Fn::Sub with dynamic reference
  expect(password['Fn::Sub']).toBeDefined();
  expect(password['Fn::Sub']).toContain('resolve:secretsmanager');
});

test('should have expected number of parameters', () => {
  const parameterCount = Object.keys(template.Parameters).length;
  expect(parameterCount).toBe(10);
});
```
