
```json

{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure and scalable web infrastructure with VPC, Auto Scaling, RDS, S3, CloudFront, and monitoring",

  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "prod",
      "Description": "Environment suffix for resource naming",
      "AllowedPattern": "^[a-z0-9]+$",
      "ConstraintDescription": "Must be lowercase alphanumeric characters only"
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "Description": "EC2 instance type for web servers",
      "AllowedValues": ["t3.micro", "t3.small", "t3.medium", "t3.large"]
    },
    "MinSize": {
      "Type": "Number",
      "Default": 2,
      "MinValue": 1,
      "MaxValue": 10,
      "Description": "Minimum number of EC2 instances in Auto Scaling group"
    },
    "MaxSize": {
      "Type": "Number",
      "Default": 6,
      "MinValue": 1,
      "MaxValue": 20,
      "Description": "Maximum number of EC2 instances in Auto Scaling group"
    },
    "DesiredCapacity": {
      "Type": "Number",
      "Default": 2,
      "MinValue": 1,
      "MaxValue": 10,
      "Description": "Desired number of EC2 instances in Auto Scaling group"
    },
    "DBInstanceClass": {
      "Type": "String",
      "Default": "db.t3.micro",
      "Description": "RDS instance class",
      "AllowedValues": ["db.t3.micro", "db.t3.small", "db.t3.medium"]
    },
    "DBAllocatedStorage": {
      "Type": "Number",
      "Default": 20,
      "MinValue": 20,
      "MaxValue": 100,
      "Description": "Allocated storage for RDS instance (GB)"
    },
    "DepartmentTag": {
      "Type": "String",
      "Default": "Engineering",
      "Description": "Department tag for cost allocation"
    },
    "DisableApiTermination": {
      "Type": "String",
      "Default": "false",
      "Description": "Enable termination protection for EC2 instances",
      "AllowedValues": ["true", "false"]
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
            "Value": { "Fn::Sub": "vpc-${EnvironmentSuffix}" }
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
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
            "Value": { "Fn::Sub": "igw-${EnvironmentSuffix}" }
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "InternetGatewayId": { "Ref": "InternetGateway" }
      }
    },

    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": { "Ref": "AWS::Region" } }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "public-subnet-1-${EnvironmentSuffix}" }
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": { "Ref": "AWS::Region" } }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "public-subnet-2-${EnvironmentSuffix}" }
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.10.0/24",
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": { "Ref": "AWS::Region" } }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "private-subnet-1-${EnvironmentSuffix}" }
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": { "Ref": "AWS::Region" } }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "private-subnet-2-${EnvironmentSuffix}" }
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "NATGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "nat-eip-${EnvironmentSuffix}" }
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "NATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["NATGatewayEIP", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet1" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "nat-gateway-${EnvironmentSuffix}" }
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
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
            "Value": { "Fn::Sub": "public-rt-${EnvironmentSuffix}" }
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": { "Ref": "InternetGateway" }
      }
    },

    "PublicSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet1" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },

    "PublicSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet2" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },

    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "private-rt-${EnvironmentSuffix}" }
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "PrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NATGateway" }
      }
    },

    "PrivateSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet1" },
        "RouteTableId": { "Ref": "PrivateRouteTable" }
      }
    },

    "PrivateSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet2" },
        "RouteTableId": { "Ref": "PrivateRouteTable" }
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
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "alb-sg-${EnvironmentSuffix}" }
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
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
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": { "Ref": "ALBSecurityGroup" }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "webserver-sg-${EnvironmentSuffix}" }
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "DBSecurityGroup": {
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
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "db-sg-${EnvironmentSuffix}" }
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "EC2InstanceRole": {
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
        "Policies": [
          {
            "PolicyName": "S3ReadOnlyAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    { "Fn::GetAtt": ["S3Bucket", "Arn"] },
                    { "Fn::Sub": "${S3Bucket.Arn}/*" }
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "ec2-role-${EnvironmentSuffix}" }
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Roles": [{ "Ref": "EC2InstanceRole" }]
      }
    },

    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "DependsOn": ["AttachGateway", "PublicRoute", "PublicSubnetRouteTableAssociation1", "PublicSubnetRouteTableAssociation2"],
      "Properties": {
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "SecurityGroups": [{ "Ref": "ALBSecurityGroup" }],
        "Subnets": [
          { "Ref": "PublicSubnet1" },
          { "Ref": "PublicSubnet2" }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "alb-${EnvironmentSuffix}" }
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": { "Ref": "VPC" },
        "HealthCheckEnabled": true,
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckPath": "/",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckTimeoutSeconds": 10,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 5,
        "Matcher": {
          "HttpCode": "200-399"
        },
        "Tags": [
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "ALBListener": {
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

    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": { "Fn::Sub": "lt-${EnvironmentSuffix}" },
        "LaunchTemplateData": {
          "ImageId": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}",
          "InstanceType": { "Ref": "InstanceType" },
          "IamInstanceProfile": {
            "Arn": { "Fn::GetAtt": ["EC2InstanceProfile", "Arn"] }
          },
          "SecurityGroupIds": [{ "Ref": "WebServerSecurityGroup" }],
          "DisableApiTermination": { "Ref": "DisableApiTermination" },
          "BlockDeviceMappings": [
            {
              "DeviceName": "/dev/xvda",
              "Ebs": {
                "DeleteOnTermination": true,
                "VolumeSize": 16,
                "VolumeType": "gp3",
                "Encrypted": false
              }
            }
          ],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd\nsystemctl enable httpd\necho '<h1>Hello from ${EnvironmentSuffix} environment!</h1>' > /var/www/html/index.html"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": { "Fn::Sub": "web-server-${EnvironmentSuffix}" }
                },
                {
                  "Key": "Department",
                  "Value": { "Ref": "DepartmentTag" }
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
        "AutoScalingGroupName": { "Fn::Sub": "asg-${EnvironmentSuffix}" },
        "VPCZoneIdentifier": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" }
        ],
        "LaunchTemplate": {
          "LaunchTemplateId": { "Ref": "LaunchTemplate" },
          "Version": { "Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"] }
        },
        "MinSize": { "Ref": "MinSize" },
        "MaxSize": { "Ref": "MaxSize" },
        "DesiredCapacity": { "Ref": "DesiredCapacity" },
        "TargetGroupARNs": [{ "Ref": "ALBTargetGroup" }],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "asg-instance-${EnvironmentSuffix}" },
            "PropagateAtLaunch": true
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" },
            "PropagateAtLaunch": true
          }
        ]
      }
    },

    "DBKMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for RDS encryption",
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": { "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root" }
              },
              "Action": "kms:*",
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "rds-kms-key-${EnvironmentSuffix}" }
          },
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "DBKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": { "Fn::Sub": "alias/rds-${EnvironmentSuffix}" },
        "TargetKeyId": { "Ref": "DBKMSKey" }
      }
    },

    "DBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": { "Fn::Sub": "rds-credentials-${EnvironmentSuffix}" },
        "Description": "RDS master username and password",
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\": \"admin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "Tags": [
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": { "Fn::Sub": "db-subnet-group-${EnvironmentSuffix}" },
        "DBSubnetGroupDescription": "Subnet group for RDS database",
        "SubnetIds": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" }
        ],
        "Tags": [
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "DBInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": { "Fn::Sub": "rds-${EnvironmentSuffix}" },
        "DBInstanceClass": { "Ref": "DBInstanceClass" },
        "Engine": "mysql",
        "EngineVersion": "8.0.39",
        "MasterUsername": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:username}}"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:password}}"
        },
        "AllocatedStorage": { "Ref": "DBAllocatedStorage" },
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "KmsKeyId": { "Ref": "DBKMSKey" },
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "VPCSecurityGroups": [{ "Ref": "DBSecurityGroup" }],
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "MultiAZ": false,
        "Tags": [
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "web-content-${AWS::AccountId}-${EnvironmentSuffix}-${AWS::Region}" },
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
        "LoggingConfiguration": {
          "DestinationBucketName": { "Ref": "LoggingBucket" },
          "LogFilePrefix": "s3-access-logs/"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "Tags": [
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "LoggingBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "logs-${AWS::AccountId}-${EnvironmentSuffix}" },
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
        "OwnershipControls": {
          "Rules": [
            {
              "ObjectOwnership": "BucketOwnerPreferred"
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
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "LoggingBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": { "Ref": "LoggingBucket" },
        "PolicyDocument": {
          "Statement": [
            {
              "Sid": "S3ServerAccessLogsPolicy",
              "Effect": "Allow",
              "Principal": {
                "Service": "logging.s3.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": { "Fn::Sub": "${LoggingBucket.Arn}/*" },
              "Condition": {
                "StringEquals": {
                  "aws:SourceAccount": { "Ref": "AWS::AccountId" }
                }
              }
            },
            {
              "Sid": "CloudFrontAccessLogsPolicy",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudfront.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": { "Fn::Sub": "${LoggingBucket.Arn}/*" },
              "Condition": {
                "StringEquals": {
                  "aws:SourceAccount": { "Ref": "AWS::AccountId" }
                }
              }
            }
          ]
        }
      }
    },

    "CloudFrontOriginAccessIdentity": {
      "Type": "AWS::CloudFront::CloudFrontOriginAccessIdentity",
      "Properties": {
        "CloudFrontOriginAccessIdentityConfig": {
          "Comment": { "Fn::Sub": "OAI for ${EnvironmentSuffix}" }
        }
      }
    },

    "S3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": { "Ref": "S3Bucket" },
        "PolicyDocument": {
          "Statement": [
            {
              "Sid": "AllowCloudFrontAccess",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOriginAccessIdentity}"
                }
              },
              "Action": "s3:GetObject",
              "Resource": { "Fn::Sub": "${S3Bucket.Arn}/*" }
            }
          ]
        }
      }
    },

    "CloudFrontDistribution": {
      "Type": "AWS::CloudFront::Distribution",
      "DependsOn": "LoggingBucketPolicy",
      "Properties": {
        "DistributionConfig": {
          "Comment": { "Fn::Sub": "CloudFront distribution for ${EnvironmentSuffix}" },
          "Enabled": true,
          "DefaultRootObject": "index.html",
          "Origins": [
            {
              "Id": "S3Origin",
              "DomainName": { "Fn::GetAtt": ["S3Bucket", "RegionalDomainName"] },
              "S3OriginConfig": {
                "OriginAccessIdentity": {
                  "Fn::Sub": "origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}"
                }
              }
            }
          ],
          "DefaultCacheBehavior": {
            "TargetOriginId": "S3Origin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "AllowedMethods": ["GET", "HEAD"],
            "CachedMethods": ["GET", "HEAD"],
            "Compress": true,
            "ForwardedValues": {
              "QueryString": false,
              "Cookies": {
                "Forward": "none"
              }
            }
          },
          "PriceClass": "PriceClass_100",
          "ViewerCertificate": {
            "CloudFrontDefaultCertificate": true
          },
          "Logging": {
            "Bucket": { "Fn::GetAtt": ["LoggingBucket", "DomainName"] },
            "Prefix": "cloudfront-logs/",
            "IncludeCookies": false
          }
        },
        "Tags": [
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "CloudTrailBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "cloudtrail-${AWS::AccountId}-${EnvironmentSuffix}" },
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
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldTrails",
              "Status": "Enabled",
              "ExpirationInDays": 365
            }
          ]
        },
        "Tags": [
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "CloudTrailBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": { "Ref": "CloudTrailBucket" },
        "PolicyDocument": {
          "Statement": [
            {
              "Sid": "AWSCloudTrailAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": { "Fn::GetAtt": ["CloudTrailBucket", "Arn"] }
            },
            {
              "Sid": "AWSCloudTrailWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": { "Fn::Sub": "${CloudTrailBucket.Arn}/*" },
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
      "DependsOn": "CloudTrailBucketPolicy",
      "Properties": {
        "TrailName": { "Fn::Sub": "trail-${EnvironmentSuffix}" },
        "S3BucketName": { "Ref": "CloudTrailBucket" },
        "IsLogging": true,
        "EnableLogFileValidation": true,
        "EventSelectors": [
          {
            "ReadWriteType": "All",
            "IncludeManagementEvents": true,
            "DataResources": [
              {
                "Type": "AWS::S3::Object",
                "Values": [
                  { "Fn::Sub": "${S3Bucket.Arn}/" },
                  { "Fn::Sub": "${S3Bucket.Arn}/*" }
                ]
              }
            ]
          }
        ],
        "Tags": [
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "ConfigRecorderRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
        ],
        "Tags": [
          {
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "ConfigBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "config-${AWS::AccountId}-${EnvironmentSuffix}" },
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
            "Key": "Department",
            "Value": { "Ref": "DepartmentTag" }
          }
        ]
      }
    },

    "ConfigBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": { "Ref": "ConfigBucket" },
        "PolicyDocument": {
          "Statement": [
            {
              "Sid": "AWSConfigBucketPermissionsCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": { "Fn::GetAtt": ["ConfigBucket", "Arn"] }
            },
            {
              "Sid": "AWSConfigBucketExistenceCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:ListBucket",
              "Resource": { "Fn::GetAtt": ["ConfigBucket", "Arn"] }
            },
            {
              "Sid": "AWSConfigBucketWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": { "Fn::Sub": "${ConfigBucket.Arn}/*" },
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

    "ConfigDeliveryChannel": {
      "Type": "AWS::Config::DeliveryChannel",
      "Properties": {
        "Name": { "Fn::Sub": "delivery-channel-${EnvironmentSuffix}" },
        "S3BucketName": { "Ref": "ConfigBucket" },
        "ConfigSnapshotDeliveryProperties": {
          "DeliveryFrequency": "TwentyFour_Hours"
        }
      }
    },

    "ConfigRecorder": {
      "Type": "AWS::Config::ConfigurationRecorder",
      "Properties": {
        "Name": { "Fn::Sub": "recorder-${EnvironmentSuffix}" },
        "RoleARN": { "Fn::GetAtt": ["ConfigRecorderRole", "Arn"] },
        "RecordingGroup": {
          "AllSupported": true,
          "IncludeGlobalResourceTypes": true
        }
      }
    }
  },

  "Outputs": {
    "VpcId": {
      "Description": "VPC ID",
      "Value": { "Ref": "VPC" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-VPC" }
      }
    },
    "AlbDnsName": {
      "Description": "Application Load Balancer DNS Name",
      "Value": { "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"] }
    },
    "CloudFrontDistributionDomainName": {
      "Description": "CloudFront Distribution Domain Name",
      "Value": { "Fn::GetAtt": ["CloudFrontDistribution", "DomainName"] }
    },
    "CloudFrontDistributionId": {
      "Description": "CloudFront Distribution ID",
      "Value": { "Ref": "CloudFrontDistribution" }
    },
    "S3BucketName": {
      "Description": "S3 Bucket Name for Web Content",
      "Value": { "Ref": "S3Bucket" }
    },
    "LoggingBucketName": {
      "Description": "Logging Bucket Name",
      "Value": { "Ref": "LoggingBucket" }
    },
    "RdsEndpoint": {
      "Description": "RDS Instance Endpoint",
      "Value": { "Fn::GetAtt": ["DBInstance", "Endpoint.Address"] }
    },
    "KmsKeyId": {
      "Description": "KMS Key ID for RDS Encryption",
      "Value": { "Ref": "DBKMSKey" }
    }
  }
}

```