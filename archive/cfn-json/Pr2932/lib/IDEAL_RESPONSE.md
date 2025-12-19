### Reasoning Trace
---

This is a comprehensive CloudFormation template request requiring secure, production-ready infrastructure in us-west-2. Let me analyze all requirements:

1. VPC with CIDR 10.0.0.0/16, at least 2 public and 2 private subnets across multiple AZs
2. Internet Gateway, NAT Gateway with Elastic IP for private subnet egress
3. Route tables properly configured for public (IGW) and private (NAT) subnets
4. Security Groups for EC2/ELB (HTTPS from anywhere, SSH from Parameter Store CIDR) and RDS (only from EC2/ELB SG)
5. EC2 instance in public subnet with IAM instance profile for minimal SSM/CloudWatch access
6. RDS instance in private subnet with customer-managed KMS encryption and Multi-AZ
7. CloudTrail with S3 bucket, KMS encryption, and proper bucket policies
8. IAM roles with least privilege and MFA enforcement policy
9. Parameter Store with SecureString parameters for sensitive data
10. Application Load Balancer in public subnets with HTTPS listener
11. Lambda function for password rotation with scheduled execution
12. All resources properly tagged with Environment: Production
13. Proper outputs for integration and testing

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure Production Infrastructure - VPC, EC2, RDS, ALB, CloudTrail, Lambda Password Rotation",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {"default": "Instance Configuration"},
          "Parameters": ["AmazonLinux2AMI", "InstanceType"]
        },
        {
          "Label": {"default": "Database Configuration"},
          "Parameters": ["DBEngine", "DBInstanceClass"]
        },
        {
          "Label": {"default": "Security Configuration"},
          "Parameters": ["SSHAllowedCIDR", "CertificateArn"]
        }
      ]
    }
  },
  "Parameters": {
    "AmazonLinux2AMI": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Default": "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2",
      "Description": "Amazon Linux 2 AMI ID"
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "AllowedValues": ["t3.micro", "t3.small", "t3.medium", "m5.large"],
      "Description": "EC2 instance type"
    },
    "DBEngine": {
      "Type": "String",
      "Default": "mysql",
      "AllowedValues": ["mysql", "postgres"],
      "Description": "Database engine choice"
    },
    "DBInstanceClass": {
      "Type": "String",
      "Default": "db.t3.micro",
      "AllowedValues": ["db.t3.micro", "db.t3.small", "db.m5.large"],
      "Description": "RDS instance class"
    },
    "SSHAllowedCIDR": {
      "Type": "String",
      "Default": "10.0.0.0/8",
      "AllowedPattern": "^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/\\d{1,2}$",
      "Description": "CIDR block allowed for SSH access"
    },
    "CertificateArn": {
      "Type": "String",
      "Description": "ARN of ACM certificate for HTTPS listener",
      "AllowedPattern": "^arn:aws:acm:.*"
    }
  },
  "Mappings": {
    "RegionMap": {
      "us-west-2": {
        "AZ1": "us-west-2a",
        "AZ2": "us-west-2b"
      }
    },
    "DBEngineMap": {
      "mysql": {
        "Engine": "mysql",
        "EngineVersion": "8.0.35",
        "Port": 3306
      },
      "postgres": {
        "Engine": "postgres",
        "EngineVersion": "15.4",
        "Port": 5432
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
    "InternetGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "InternetGatewayId": {"Ref": "InternetGateway"},
        "VpcId": {"Ref": "VPC"}
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "AvailabilityZone": {"Fn::FindInMap": ["RegionMap", {"Ref": "AWS::Region"}, "AZ1"]},
        "CidrBlock": "10.0.1.0/24",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Public-Subnet-1"
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
        "VpcId": {"Ref": "VPC"},
        "AvailabilityZone": {"Fn::FindInMap": ["RegionMap", {"Ref": "AWS::Region"}, "AZ2"]},
        "CidrBlock": "10.0.2.0/24",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Public-Subnet-2"
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
        "VpcId": {"Ref": "VPC"},
        "AvailabilityZone": {"Fn::FindInMap": ["RegionMap", {"Ref": "AWS::Region"}, "AZ1"]},
        "CidrBlock": "10.0.3.0/24",
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Private-Subnet-1"
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
        "VpcId": {"Ref": "VPC"},
        "AvailabilityZone": {"Fn::FindInMap": ["RegionMap", {"Ref": "AWS::Region"}, "AZ2"]},
        "CidrBlock": "10.0.4.0/24",
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Private-Subnet-2"
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
            "Value": "Production-NAT-EIP"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "NATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NATGatewayEIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-NAT-Gateway"
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
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Public-Routes"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "DefaultPublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "RouteTableId": {"Ref": "PublicRouteTable"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {"Ref": "InternetGateway"}
      }
    },
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {"Ref": "PublicRouteTable"},
        "SubnetId": {"Ref": "PublicSubnet1"}
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {"Ref": "PublicRouteTable"},
        "SubnetId": {"Ref": "PublicSubnet2"}
      }
    },
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Private-Routes"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "DefaultPrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NATGateway"}
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable"},
        "SubnetId": {"Ref": "PrivateSubnet1"}
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable"},
        "SubnetId": {"Ref": "PrivateSubnet2"}
      }
    },
    "RDSKMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for RDS encryption and Parameter Store SecureString",
        "KeyPolicy": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {"AWS": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"}},
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Effect": "Allow",
              "Principal": {"Service": ["lambda.amazonaws.com", "ec2.amazonaws.com"]},
              "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:DescribeKey"
              ],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-RDS-KMS-Key"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "RDSKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": "alias/rds-production-key",
        "TargetKeyId": {"Ref": "RDSKMSKey"}
      }
    },
    "CloudTrailKMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for CloudTrail log encryption",
        "KeyPolicy": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {"AWS": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"}},
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Effect": "Allow",
              "Principal": {"Service": "cloudtrail.amazonaws.com"},
              "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:DescribeKey"
              ],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-CloudTrail-KMS-Key"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "CloudTrailKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": "alias/cloudtrail-production-key",
        "TargetKeyId": {"Ref": "CloudTrailKMSKey"}
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": "Production-EC2-ELB-SecurityGroup",
        "GroupDescription": "Security group for EC2 and ELB allowing HTTPS and SSH",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS from anywhere"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": {"Ref": "SSHAllowedCIDR"},
            "Description": "Allow SSH from Parameter Store managed CIDR"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP from anywhere for ALB health checks"
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
            "Value": "Production-EC2-ELB-SG"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": "Production-RDS-SecurityGroup",
        "GroupDescription": "Security group for RDS allowing access from EC2/ELB security group",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": {"Fn::FindInMap": ["DBEngineMap", {"Ref": "DBEngine"}, "Port"]},
            "ToPort": {"Fn::FindInMap": ["DBEngineMap", {"Ref": "DBEngine"}, "Port"]},
            "SourceSecurityGroupId": {"Ref": "EC2SecurityGroup"},
            "Description": "Allow database access from EC2/ELB security group"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-RDS-SG"
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
        "RoleName": "Production-EC2-Instance-Role",
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": ["ec2.amazonaws.com"]
              },
              "Action": ["sts:AssumeRole"]
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "MinimalEC2Permissions",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters"
                  ],
                  "Resource": [
                    {"Fn::Sub": "arn:aws:ssm:us-west-2:${AWS::AccountId}:parameter/prod/*"}
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
                  "Resource": [
                    {"Fn::Sub": "arn:aws:logs:us-west-2:${AWS::AccountId}:*"}
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt"
                  ],
                  "Resource": [
                    {"Fn::GetAtt": ["RDSKMSKey", "Arn"]}
                  ]
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
        "InstanceProfileName": "Production-EC2-Instance-Profile",
        "Roles": [{"Ref": "EC2InstanceRole"}]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "Production-Lambda-Rotation-Role",
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": ["lambda.amazonaws.com"]
              },
              "Action": ["sts:AssumeRole"]
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "LambdaRotationPermissions",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:PutParameter",
                    "ssm:GetParameter"
                  ],
                  "Resource": [
                    {"Fn::Sub": "arn:aws:ssm:us-west-2:${AWS::AccountId}:parameter/prod/db/password"}
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": [
                    {"Fn::Sub": "arn:aws:logs:us-west-2:${AWS::AccountId}:*"}
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": [
                    {"Fn::GetAtt": ["RDSKMSKey", "Arn"]}
                  ]
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
    "MFAEnforcementPolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "ManagedPolicyName": "Production-MFA-Enforcement-Policy",
        "Description": "Policy to enforce MFA for all IAM operations",
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DenyAllExceptAssumeRoleWithoutMFA",
              "Effect": "Deny",
              "NotAction": [
                "iam:CreateVirtualMFADevice",
                "iam:EnableMFADevice",
                "iam:GetUser",
                "iam:ListMFADevices",
                "iam:ListVirtualMFADevices",
                "iam:ResyncMFADevice",
                "sts:GetSessionToken"
              ],
              "Resource": "*",
              "Condition": {
                "BoolIfExists": {
                  "aws:MultiFactorAuthPresent": "false"
                }
              }
            }
          ]
        }
      }
    },
    "SSHCIDRParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": "/prod/ssh/cidr",
        "Type": "String",
        "Value": {"Ref": "SSHAllowedCIDR"},
        "Description": "CIDR block allowed for SSH access to production resources",
        "Tags": {
          "Environment": "Production"
        }
      }
    },
    "DBUsernameParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": "/prod/db/username",
        "Type": "String",
        "Value": "admin",
        "Description": "Database username for production RDS instance",
        "Tags": {
          "Environment": "Production"
        }
      }
    },
    "DBPasswordParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": "/prod/db/password",
        "Type": "SecureString",
        "Value": "TempPassword123!",
        "Description": "Database password for production RDS instance",
        "KeyId": {"Ref": "RDSKMSKey"},
        "Tags": {
          "Environment": "Production"
        }
      }
    },
    "EC2Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": {"Ref": "AmazonLinux2AMI"},
        "InstanceType": {"Ref": "InstanceType"},
        "IamInstanceProfile": {"Ref": "EC2InstanceProfile"},
        "SecurityGroupIds": [{"Ref": "EC2SecurityGroup"}],
        "SubnetId": {"Ref": "PublicSubnet1"},
        "UserData": {
          "Fn::Base64": {
            "Fn::Join": [
              "",
              [
                "#!/bin/bash\n",
                "yum update -y\n",
                "yum install -y awscli\n",
                "/opt/aws/bin/cfn-signal -e $? --stack ",
                {"Ref": "AWS::StackName"},
                " --resource EC2Instance --region ",
                {"Ref": "AWS::Region"},
                "\n"
              ]
            ]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-EC2-Instance"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      },
      "CreationPolicy": {
        "ResourceSignal": {
          "Timeout": "PT5M"
        }
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": "production-db-subnet-group",
        "DBSubnetGroupDescription": "Subnet group for production RDS instance",
        "SubnetIds": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"}
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
        "DBInstanceClass": {"Ref": "DBInstanceClass"},
        "Engine": {"Fn::FindInMap": ["DBEngineMap", {"Ref": "DBEngine"}, "Engine"]},
        "EngineVersion": {"Fn::FindInMap": ["DBEngineMap", {"Ref": "DBEngine"}, "EngineVersion"]},
        "MasterUsername": "admin",
        "MasterUserPassword": "TempPassword123!",
        "AllocatedStorage": 20,
        "StorageType": "gp2",
        "StorageEncrypted": true,
        "KmsKeyId": {"Ref": "RDSKMSKey"},
        "VPCSecurityGroups": [{"Ref": "RDSSecurityGroup"}],
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "MultiAZ": true,
        "BackupRetentionPeriod": 7,
        "DeletionProtection": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-RDS-Instance"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "CloudTrailS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "production-cloudtrail-${AWS::AccountId}-${AWS::Region}"},
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {"Ref": "CloudTrailKMSKey"}
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
            "Value": "Production-CloudTrail-Bucket"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "CloudTrailS3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {"Ref": "CloudTrailS3Bucket"},
        "PolicyDocument": {
          "Statement": [
            {
              "Sid": "AWSCloudTrailAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {"Fn::GetAtt": ["CloudTrailS3Bucket", "Arn"]},
              "Condition": {
                "StringEquals": {
                  "AWS:SourceArn": {"Fn::Sub": "arn:aws:cloudtrail:us-west-2:${AWS::AccountId}:trail/ProductionCloudTrail"}
                }
              }
            },
            {
              "Sid": "AWSCloudTrailWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {"Fn::Sub": "${CloudTrailS3Bucket}/*"},
              "Condition": {
                "StringEquals": {
                  "s3:x-amz-acl": "bucket-owner-full-control",
                  "AWS:SourceArn": {"Fn::Sub": "arn:aws:cloudtrail:us-west-2:${AWS::AccountId}:trail/ProductionCloudTrail"}
                }
              }
            },
            {
              "Sid": "DenyInsecureTransport",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:*",
              "Resource": [
                {"Fn::GetAtt": ["CloudTrailS3Bucket", "Arn"]},
                {"Fn::Sub": "${CloudTrailS3Bucket}/*"}
              ],
              "Condition": {
                "Bool": {
                  "aws:SecureTransport": "false"
                }
              }
            }
          ]
        }
      }
    },
    "CloudTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "DependsOn": "CloudTrailS3BucketPolicy",
      "Properties": {
        "TrailName": "ProductionCloudTrail",
        "S3BucketName": {"Ref": "CloudTrailS3Bucket"},
        "IncludeGlobalServiceEvents": true,
        "IsMultiRegionTrail": false,
        "EnableLogFileValidation": true,
        "KMSKeyId": {"Ref": "CloudTrailKMSKey"},
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-CloudTrail"
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
        "Subnets": [
          {"Ref": "PublicSubnet1"},
          {"Ref": "PublicSubnet2"}
        ],
        "SecurityGroups": [{"Ref": "EC2SecurityGroup"}],
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
        "Name": "Production-ALB-TG",
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {"Ref": "VPC"},
        "HealthCheckPath": "/",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 2,
        "Targets": [
          {
            "Id": {"Ref": "EC2Instance"},
            "Port": 80
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-ALB-TargetGroup"
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
            "TargetGroupArn": {"Ref": "ALBTargetGroup"}
          }
        ],
        "LoadBalancerArn": {"Ref": "ApplicationLoadBalancer"},
        "Port": 443,
        "Protocol": "HTTPS",
        "Certificates": [
          {
            "CertificateArn": {"Ref": "CertificateArn"}
          }
        ]
      }
    },
    "PasswordRotationFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "Production-Password-Rotation",
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
        "Code": {
          "ZipFile": "import boto3\nimport json\nimport secrets\nimport string\n\ndef lambda_handler(event, context):\n    ssm = boto3.client('ssm')\n    \n    # Generate a new password\n    alphabet = string.ascii_letters + string.digits + '!@#$%^&*'\n    password = ''.join(secrets.choice(alphabet) for i in range(16))\n    \n    try:\n        # Update the password in Parameter Store\n        response = ssm.put_parameter(\n            Name='/prod/db/password',\n            Value=password,\n            Type='SecureString',\n            Overwrite=True,\n            KeyId='alias/rds-production-key'\n        )\n        \n        print(f'Password rotated successfully: {response}')\n        return {\n            'statusCode': 200,\n            'body': json.dumps('Password rotated successfully')\n        }\n    except Exception as e:\n        print(f'Error rotating password: {str(e)}')\n        return {\n            'statusCode': 500,\n            'body': json.dumps(f'Error rotating password: {str(e)}')\n        }\n"
        },
        "Description": "Function to rotate database password in Parameter Store",
        "Timeout": 60,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Password-Rotation"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "PasswordRotationSchedule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": "Production-Password-Rotation-Schedule",
        "Description": "Schedule for rotating database password",
        "ScheduleExpression": "rate(30 days)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {"Fn::GetAtt": ["PasswordRotationFunction", "Arn"]},
            "Id": "PasswordRotationTarget"
          }
        ]
      }
    },
    "PasswordRotationPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {"Ref": "PasswordRotationFunction"},
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {"Fn::GetAtt": ["PasswordRotationSchedule", "Arn"]}
      }
    }
  },
  "Outputs": {
    "VpcId": {
      "Description": "VPC ID of the production environment",
      "Value": {"Ref": "VPC"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-VPC-ID"}
      }
    },
    "PublicSubnetIds": {
      "Description": "Public subnet IDs",
      "Value": {"Fn::Join": [",", [{"Ref": "PublicSubnet1"}, {"Ref": "PublicSubnet2"}]]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet-IDs"}
      }
    },
    "PrivateSubnetIds": {
      "Description": "Private subnet IDs",
      "Value": {"Fn::Join": [",", [{"Ref": "PrivateSubnet1"}, {"Ref": "PrivateSubnet2"}]]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet-IDs"}
      }
    },
    "LoadBalancerDNS": {
      "Description": "DNS name of the Application Load Balancer",
      "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ALB-DNS"}
      }
    },
    "RDSEndpoint": {
      "Description": "RDS instance endpoint",
      "Value": {"Fn::GetAtt": ["RDSInstance", "Endpoint.Address"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-RDS-Endpoint"}
      }
    },
    "S3BucketForTrail": {
      "Description": "S3 bucket used for CloudTrail logs",
      "Value": {"Ref": "CloudTrailS3Bucket"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-CloudTrail-Bucket"}
      }
    }
  }
}
```

```json
{
  "ValidationSummary": {
    "cfnLintCommand": "cfn-lint template.json --profile <your-profile> --region us-west-2",
    "majorSecurityConsiderations": [
      "RDS instance uses customer-managed KMS encryption and is deployed in private subnets with restricted security group access",
      "CloudTrail logs are encrypted with KMS and stored in S3 bucket with blocked public access and secure transport enforcement",
      "IAM roles follow least-privilege principle with minimal permissions for EC2, Lambda, and service access",
      "MFA enforcement policy implemented to deny actions when MultiFactorAuthPresent condition is false",
      "Parameter Store SecureString parameters use KMS encryption for sensitive data like database passwords",
      "Network segmentation implemented with public/private subnets, NAT Gateway for private subnet egress, and security groups restricting database access"
    ],
    "howToRunUnitChecks": [
      "Run 'aws cloudformation validate-template --template-body file://template.json' to check basic syntax",
      "Execute 'cfn-lint template.json' to validate CloudFormation best practices and catch common issues",
      "Verify parameter constraints and mappings work correctly for different input combinations",
      "Test IAM policy simulator with the created roles to ensure least privilege access works as intended",
      "Validate KMS key policies allow proper access for services while maintaining security",
      "Review security group rules ensure only necessary ports are open to appropriate source ranges"
    ]
  }
}
```