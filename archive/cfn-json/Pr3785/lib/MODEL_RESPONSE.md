### Reasoning Trace
---

This is a comprehensive CloudFormation template request with many specific requirements. I need to create a single JSON CloudFormation template that provisions a secure AWS environment with:

1. IAM with custom DynamoDB read-only policy
2. Private S3 buckets accessible only by specified IAM roles
3. VPC spanning at least two AZs with public and private subnets
4. Security Groups for EC2 access control
5. S3 encryption using AWS KMS
6. Least privilege principle
7. User access only via IAM roles
8. CloudTrail enabled
9. RDS with encryption at rest in private subnets
10. Bastion host in public subnet

I need to include all the specified parameters, mappings, conditions, and resources. The template must be in JSON format (not YAML) and use intrinsic functions in JSON form.

Let me structure this systematically:

1. Parameters - all listed with constraints
2. Mappings - RegionMap and EnvConfig
3. Conditions - CreateKmsKey, CreateDataBucket, EmailSubscriptionEnabled
4. Resources:
   - Networking (VPC, Subnets, IGW, NAT, Route Tables)
   - Security Groups
   - IAM (Roles, Policies, Instance Profiles)
   - Compute (EC2 instances)
   - Storage (S3)
   - Database (RDS)
   - KMS
   - Logging & Monitoring (CloudTrail, CloudWatch Alarms)
   - Notifications (SNS)
5. Outputs - with exports

Let me create this comprehensive template.
### Answer 
---

I'll create a comprehensive CloudFormation template that implements all your security requirements. This template will provision a secure AWS environment with proper network isolation, encryption, and least-privilege access controls.

## main-template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure AWS environment with VPC, EC2, RDS, S3, CloudTrail, and comprehensive security controls",
  
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": { "default": "Project Configuration" },
          "Parameters": ["ProjectPrefix", "Environment"]
        },
        {
          "Label": { "default": "Network Configuration" },
          "Parameters": ["VpcCidr", "PublicSubnet1Cidr", "PublicSubnet2Cidr", "PrivateSubnet1Cidr", "PrivateSubnet2Cidr", "Az1", "Az2"]
        },
        {
          "Label": { "default": "Compute Configuration" },
          "Parameters": ["BastionInstanceType", "AppInstanceType", "KeyPairName", "AllowedBastionSshCidr"]
        },
        {
          "Label": { "default": "Database Configuration" },
          "Parameters": ["RdsEngineVersion", "RdsInstanceClass", "RdsAllocatedStorage", "RdsUsername", "RdsPassword"]
        },
        {
          "Label": { "default": "Storage & Security" },
          "Parameters": ["S3DataBucketName", "KmsKeyArn", "DynamoDbReadOnlyTableArns"]
        },
        {
          "Label": { "default": "Monitoring" },
          "Parameters": ["SnsEmailForAlarms"]
        }
      ]
    }
  },
  
  "Parameters": {
    "ProjectPrefix": {
      "Type": "String",
      "Default": "securex",
      "Description": "Prefix for resource naming and tagging",
      "AllowedPattern": "^[a-z0-9-]+$",
      "MinLength": 3,
      "MaxLength": 20
    },
    "Environment": {
      "Type": "String",
      "Default": "dev",
      "AllowedValues": ["dev", "stg", "prod"],
      "Description": "Environment name"
    },
    "VpcCidr": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "VPC CIDR block",
      "AllowedPattern": "^(10|172|192)\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(16|17|18|19|20|21|22|23|24)$"
    },
    "PublicSubnet1Cidr": {
      "Type": "String",
      "Default": "10.0.1.0/24",
      "Description": "Public subnet 1 CIDR",
      "AllowedPattern": "^(10|172|192)\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(24|25|26|27|28)$"
    },
    "PublicSubnet2Cidr": {
      "Type": "String",
      "Default": "10.0.2.0/24",
      "Description": "Public subnet 2 CIDR",
      "AllowedPattern": "^(10|172|192)\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(24|25|26|27|28)$"
    },
    "PrivateSubnet1Cidr": {
      "Type": "String",
      "Default": "10.0.11.0/24",
      "Description": "Private subnet 1 CIDR",
      "AllowedPattern": "^(10|172|192)\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(24|25|26|27|28)$"
    },
    "PrivateSubnet2Cidr": {
      "Type": "String",
      "Default": "10.0.12.0/24",
      "Description": "Private subnet 2 CIDR",
      "AllowedPattern": "^(10|172|192)\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(24|25|26|27|28)$"
    },
    "Az1": {
      "Type": "AWS::EC2::AvailabilityZone::Name",
      "Description": "Availability Zone 1"
    },
    "Az2": {
      "Type": "AWS::EC2::AvailabilityZone::Name",
      "Description": "Availability Zone 2"
    },
    "BastionInstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "Description": "Bastion EC2 instance type",
      "AllowedValues": ["t3.micro", "t3.small", "t3.medium"]
    },
    "AppInstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "Description": "Application EC2 instance type",
      "AllowedValues": ["t3.micro", "t3.small", "t3.medium", "t3.large"]
    },
    "KeyPairName": {
      "Type": "String",
      "Default": "",
      "Description": "EC2 key pair name for SSH access (optional)"
    },
    "KmsKeyArn": {
      "Type": "String",
      "Default": "",
      "Description": "Existing KMS key ARN (optional, creates new if empty)"
    },
    "S3DataBucketName": {
      "Type": "String",
      "Default": "",
      "Description": "Existing S3 bucket name (optional, creates new if empty)"
    },
    "RdsEngineVersion": {
      "Type": "String",
      "Default": "15.4",
      "Description": "PostgreSQL engine version"
    },
    "RdsInstanceClass": {
      "Type": "String",
      "Default": "db.t4g.micro",
      "Description": "RDS instance class"
    },
    "RdsAllocatedStorage": {
      "Type": "Number",
      "Default": 20,
      "MinValue": 20,
      "MaxValue": 100,
      "Description": "RDS allocated storage in GB"
    },
    "RdsUsername": {
      "Type": "String",
      "NoEcho": true,
      "MinLength": 1,
      "MaxLength": 16,
      "Description": "RDS master username",
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9_]*$"
    },
    "RdsPassword": {
      "Type": "String",
      "NoEcho": true,
      "MinLength": 8,
      "MaxLength": 41,
      "Description": "RDS master password",
      "AllowedPattern": "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
    },
    "AllowedBastionSshCidr": {
      "Type": "String",
      "Default": "203.0.113.0/32",
      "Description": "CIDR block allowed to SSH to bastion",
      "AllowedPattern": "^(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(\\d{1,2})$"
    },
    "DynamoDbReadOnlyTableArns": {
      "Type": "CommaDelimitedList",
      "Default": "",
      "Description": "Comma-separated list of DynamoDB table ARNs for read-only access"
    },
    "SnsEmailForAlarms": {
      "Type": "String",
      "Default": "",
      "Description": "Email address for alarm notifications (optional)",
      "AllowedPattern": "^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    }
  },
  
  "Mappings": {
    "RegionMap": {
      "us-east-1": {
        "Partition": "aws",
        "S3Principal": "s3.amazonaws.com",
        "CloudTrailPrincipal": "cloudtrail.amazonaws.com",
        "Ec2Principal": "ec2.amazonaws.com"
      },
      "us-west-2": {
        "Partition": "aws",
        "S3Principal": "s3.amazonaws.com",
        "CloudTrailPrincipal": "cloudtrail.amazonaws.com",
        "Ec2Principal": "ec2.amazonaws.com"
      },
      "eu-west-1": {
        "Partition": "aws",
        "S3Principal": "s3.amazonaws.com",
        "CloudTrailPrincipal": "cloudtrail.amazonaws.com",
        "Ec2Principal": "ec2.amazonaws.com"
      },
      "us-gov-west-1": {
        "Partition": "aws-us-gov",
        "S3Principal": "s3.amazonaws.com",
        "CloudTrailPrincipal": "cloudtrail.amazonaws.com",
        "Ec2Principal": "ec2.amazonaws.com"
      }
    },
    "EnvConfig": {
      "dev": {
        "RdsBackupRetention": "7",
        "RdsDeletionProtection": "false",
        "EnableDetailedMonitoring": "true"
      },
      "stg": {
        "RdsBackupRetention": "14",
        "RdsDeletionProtection": "true",
        "EnableDetailedMonitoring": "true"
      },
      "prod": {
        "RdsBackupRetention": "30",
        "RdsDeletionProtection": "true",
        "EnableDetailedMonitoring": "true"
      }
    },
    "AmiMap": {
      "us-east-1": { "AmiId": "ami-0c02fb55731490381" },
      "us-west-2": { "AmiId": "ami-0352d5a37fb4f603f" },
      "eu-west-1": { "AmiId": "ami-0f29c8402f8cce65c" }
    }
  },
  
  "Conditions": {
    "CreateKmsKey": {
      "Fn::Equals": [{"Ref": "KmsKeyArn"}, ""]
    },
    "CreateDataBucket": {
      "Fn::Equals": [{"Ref": "S3DataBucketName"}, ""]
    },
    "EmailSubscriptionEnabled": {
      "Fn::Not": [{"Fn::Equals": [{"Ref": "SnsEmailForAlarms"}, ""]}]
    },
    "HasKeyPair": {
      "Fn::Not": [{"Fn::Equals": [{"Ref": "KeyPairName"}, ""]}]
    },
    "IsProdOrStg": {
      "Fn::Or": [
        {"Fn::Equals": [{"Ref": "Environment"}, "prod"]},
        {"Fn::Equals": [{"Ref": "Environment"}, "stg"]}
      ]
    }
  },
  
  "Resources": {
    "Vpc": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {"Ref": "VpcCidr"},
        "EnableDnsSupport": true,
        "EnableDnsHostnames": true,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-vpc"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": {"Ref": "ProjectPrefix"}}
        ]
      }
    },
    
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-igw"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "VpcGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {"Ref": "Vpc"},
        "InternetGatewayId": {"Ref": "InternetGateway"}
      }
    },
    
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "Vpc"},
        "CidrBlock": {"Ref": "PublicSubnet1Cidr"},
        "AvailabilityZone": {"Ref": "Az1"},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-public-subnet-1"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Type", "Value": "Public"}
        ]
      }
    },
    
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "Vpc"},
        "CidrBlock": {"Ref": "PublicSubnet2Cidr"},
        "AvailabilityZone": {"Ref": "Az2"},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-public-subnet-2"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Type", "Value": "Public"}
        ]
      }
    },
    
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "Vpc"},
        "CidrBlock": {"Ref": "PrivateSubnet1Cidr"},
        "AvailabilityZone": {"Ref": "Az1"},
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-private-subnet-1"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Type", "Value": "Private"}
        ]
      }
    },
    
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "Vpc"},
        "CidrBlock": {"Ref": "PrivateSubnet2Cidr"},
        "AvailabilityZone": {"Ref": "Az2"},
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-private-subnet-2"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Type", "Value": "Private"}
        ]
      }
    },
    
    "ElasticIp": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "VpcGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-nat-eip"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "NatGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["ElasticIp", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-nat"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "Vpc"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-public-rt"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "VpcGatewayAttachment",
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
        "VpcId": {"Ref": "Vpc"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-private-rt"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
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
    
    "S3VpcEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {"Ref": "Vpc"},
        "ServiceName": {"Fn::Sub": "com.amazonaws.${AWS::Region}.s3"},
        "RouteTableIds": [
          {"Ref": "PrivateRouteTable"},
          {"Ref": "PublicRouteTable"}
        ]
      }
    },
    
    "SgBastion": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "${ProjectPrefix}-sg-bastion"},
        "GroupDescription": "Security group for bastion host",
        "VpcId": {"Ref": "Vpc"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": {"Ref": "AllowedBastionSshCidr"},
            "Description": "SSH from allowed CIDR"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-sg-bastion"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "SgAppPrivate": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "${ProjectPrefix}-sg-app"},
        "GroupDescription": "Security group for application instances",
        "VpcId": {"Ref": "Vpc"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-sg-app"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "SgAppPrivateIngressFromBastion": {
      "Type": "AWS::EC2::SecurityGroupIngress",
      "Properties": {
        "GroupId": {"Ref": "SgAppPrivate"},
        "IpProtocol": "tcp",
        "FromPort": 22,
        "ToPort": 22,
        "SourceSecurityGroupId": {"Ref": "SgBastion"},
        "Description": "SSH from bastion"
      }
    },
    
    "SgAppPrivateEgress": {
      "Type": "AWS::EC2::SecurityGroupEgress",
      "Properties": {
        "GroupId": {"Ref": "SgAppPrivate"},
        "IpProtocol": "-1",
        "CidrIp": "0.0.0.0/0",
        "Description": "Allow all outbound"
      }
    },
    
    "SgRds": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "${ProjectPrefix}-sg-rds"},
        "GroupDescription": "Security group for RDS database",
        "VpcId": {"Ref": "Vpc"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-sg-rds"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "SgRdsIngressFromApp": {
      "Type": "AWS::EC2::SecurityGroupIngress",
      "Properties": {
        "GroupId": {"Ref": "SgRds"},
        "IpProtocol": "tcp",
        "FromPort": 5432,
        "ToPort": 5432,
        "SourceSecurityGroupId": {"Ref": "SgAppPrivate"},
        "Description": "PostgreSQL from app instances"
      }
    },
    
    "KmsKey": {
      "Type": "AWS::KMS::Key",
      "Condition": "CreateKmsKey",
      "Properties": {
        "Description": {"Fn::Sub": "KMS key for ${ProjectPrefix}-${Environment}"},
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM policies",
              "Effect": "Allow",
              "Principal": {
                "AWS": {"Fn::Sub": "arn:${AWS::Partition}:iam::${AWS::AccountId}:root"}
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow services to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  {"Fn::FindInMap": ["RegionMap", {"Ref": "AWS::Region"}, "S3Principal"]},
                  {"Fn::FindInMap": ["RegionMap", {"Ref": "AWS::Region"}, "CloudTrailPrincipal"]},
                  {"Fn::FindInMap": ["RegionMap", {"Ref": "AWS::Region"}, "Ec2Principal"]},
                  "rds.amazonaws.com",
                  "logs.amazonaws.com"
                ]
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey",
                "kms:CreateGrant",
                "kms:DescribeKey"
              ],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-kms-key"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "KmsKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Condition": "CreateKmsKey",
      "Properties": {
        "AliasName": {"Fn::Sub": "alias/${ProjectPrefix}-${Environment}"},
        "TargetKeyId": {"Ref": "KmsKey"}
      }
    },
    
    "DataBucket": {
      "Type": "AWS::S3::Bucket",
      "Condition": "CreateDataBucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "${ProjectPrefix}-data-${Environment}-${AWS::AccountId}"},
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Fn::If": [
                    "CreateKmsKey",
                    {"Ref": "KmsKey"},
                    {"Ref": "KmsKeyArn"}
                  ]
                }
              }
            }
          ]
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionExpirationInDays": 30
            }
          ]
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-data-bucket"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "DataBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Condition": "CreateDataBucket",
      "Properties": {
        "Bucket": {"Ref": "DataBucket"},
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DenyInsecureTransport",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:*",
              "Resource": [
                {"Fn::GetAtt": ["DataBucket", "Arn"]},
                {"Fn::Sub": "${DataBucket.Arn}/*"}
              ],
              "Condition": {
                "Bool": {"aws:SecureTransport": "false"}
              }
            },
            {
              "Sid": "AllowSpecificRolesOnly",
              "Effect": "Allow",
              "Principal": {
                "AWS": [
                  {"Fn::GetAtt": ["AppInstanceRole", "Arn"]},
                  {"Fn::Sub": "arn:${AWS::Partition}:iam::${AWS::AccountId}:root"}
                ]
              },
              "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket",
                "s3:GetBucketLocation",
                "s3:GetBucketVersioning"
              ],
              "Resource": [
                {"Fn::GetAtt": ["DataBucket", "Arn"]},
                {"Fn::Sub": "${DataBucket.Arn}/*"}
              ]
            },
            {
              "Sid": "AllowCloudTrailAccess",
              "Effect": "Allow",
              "Principal": {
                "Service": {"Fn::FindInMap": ["RegionMap", {"Ref": "AWS::Region"}, "CloudTrailPrincipal"]}
              },
              "Action": [
                "s3:GetBucketAcl",
                "s3:PutObject"
              ],
              "Resource": [
                {"Fn::GetAtt": ["DataBucket", "Arn"]},
                {"Fn::Sub": "${DataBucket.Arn}/cloudtrail/*"}
              ],
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
    
    "DynamoDbReadOnlyPolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "ManagedPolicyName": {"Fn::Sub": "${ProjectPrefix}-dynamodb-readonly-${Environment}"},
        "Description": "Read-only access to specified DynamoDB tables",
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DynamoDBReadOnly",
              "Effect": "Allow",
              "Action": [
                "dynamodb:DescribeTable",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:GetItem",
                "dynamodb:BatchGetItem",
                "dynamodb:ListTables"
              ],
              "Resource": {"Ref": "DynamoDbReadOnlyTableArns"}
            }
          ]
        }
      }
    },
    
    "AppInstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "${ProjectPrefix}-app-role-${Environment}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": {"Fn::FindInMap": ["RegionMap", {"Ref": "AWS::Region"}, "Ec2Principal"]}
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          {"Ref": "DynamoDbReadOnlyPolicy"}
        ],
        "Policies": [
          {
            "PolicyName": "CloudWatchLogs",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogStreams"
                  ],
                  "Resource": {"Fn::Sub": "arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/${ProjectPrefix}-*"}
                }
              ]
            }
          },
          {
            "PolicyName": "CloudWatchMetrics",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudwatch:PutMetricData",
                    "cloudwatch:GetMetricStatistics",
                    "cloudwatch:ListMetrics"
                  ],
                  "Resource": "*"
                }
              ]
            }
          },
          {
            "PolicyName": "S3DataBucketAccess",
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
                    {
                      "Fn::If": [
                        "CreateDataBucket",
                        {"Fn::GetAtt": ["DataBucket", "Arn"]},
                        {"Fn::Sub": "arn:${AWS::Partition}:s3:::${S3DataBucketName}"}
                      ]
                    },
                    {
                      "Fn::If": [
                        "CreateDataBucket",
                        {"Fn::Sub": "${DataBucket.Arn}/*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:s3:::${S3DataBucketName}/*"}
                      ]
                    }
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "KmsAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:Encrypt",
                    "kms:GenerateDataKey",
                    "kms:DescribeKey"
                  ],
                  "Resource": {
                    "Fn::If": [
                      "CreateKmsKey",
                      {"Fn::GetAtt": ["KmsKey", "Arn"]},
                      {"Ref": "KmsKeyArn"}
                    ]
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-app-role"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "AppInstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {"Fn::Sub": "${ProjectPrefix}-app-profile-${Environment}"},
        "Roles": [{"Ref": "AppInstanceRole"}]
      }
    },
    
    "BastionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "${ProjectPrefix}-bastion-role-${Environment}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": {"Fn::FindInMap": ["RegionMap", {"Ref": "AWS::Region"}, "Ec2Principal"]}
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "SSMSessionManager",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:UpdateInstanceInformation",
                    "ssmmessages:CreateControlChannel",
                    "ssmmessages:CreateDataChannel",
                    "ssmmessages:OpenControlChannel",
                    "ssmmessages:OpenDataChannel"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-bastion-role"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "BastionInstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {"Fn::Sub": "${ProjectPrefix}-bastion-profile-${Environment}"},
        "Roles": [{"Ref": "BastionRole"}]
      }
    },
    
    "BastionInstance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "InstanceType": {"Ref": "BastionInstanceType"},
        "ImageId": {"Fn::FindInMap": ["AmiMap", {"Ref": "AWS::Region"}, "AmiId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "SecurityGroupIds": [{"Ref": "SgBastion"}],
        "KeyName": {
          "Fn::If": [
            "HasKeyPair",
            {"Ref": "KeyPairName"},
            {"Ref": "AWS::NoValue"}
          ]
        },
        "IamInstanceProfile": {"Ref": "BastionInstanceProfile"},
        "Monitoring": true,
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvda",
            "Ebs": {
              "VolumeType": "gp3",
              "VolumeSize": 20,
              "Encrypted": true,
              "KmsKeyId": {
                "Fn::If": [
                  "CreateKmsKey",
                  {"Ref": "KmsKey"},
                  {"Ref": "KmsKeyArn"}
                ]
              },
              "DeleteOnTermination": true
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y amazon-ssm-agent\nsystemctl enable amazon-ssm-agent\nsystemctl start amazon-ssm-agent\n"
          }
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-bastion"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "AppInstance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "InstanceType": {"Ref": "AppInstanceType"},
        "ImageId": {"Fn::FindInMap": ["AmiMap", {"Ref": "AWS::Region"}, "AmiId"]},
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "SecurityGroupIds": [{"Ref": "SgAppPrivate"}],
        "IamInstanceProfile": {"Ref": "AppInstanceProfile"},
        "Monitoring": true,
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvda",
            "Ebs": {
              "VolumeType": "gp3",
              "VolumeSize": 20,
              "Encrypted": true,
              "KmsKeyId": {
                "Fn::If": [
                  "CreateKmsKey",
                  {"Ref": "KmsKey"},
                  {"Ref": "KmsKeyArn"}
                ]
              },
              "DeleteOnTermination": true
            }
          }
        ],
        "UserData": {
          "Fn::Base64": {
            "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y amazon-ssm-agent postgresql15\nsystemctl enable amazon-ssm-agent\nsystemctl start amazon-ssm-agent\n"
          }
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-app-instance"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "DbSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {"Fn::Sub": "${ProjectPrefix}-db-subnet-group"},
        "DBSubnetGroupDescription": "Subnet group for RDS database",
        "SubnetIds": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"}
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-db-subnet-group"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "RdsInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "${ProjectPrefix}-db-${Environment}"},
        "Engine": "postgres",
        "EngineVersion": {"Ref": "RdsEngineVersion"},
        "DBInstanceClass": {"Ref": "RdsInstanceClass"},
        "AllocatedStorage": {"Ref": "RdsAllocatedStorage"},
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Fn::If": [
            "CreateKmsKey",
            {"Ref": "KmsKey"},
            {"Ref": "KmsKeyArn"}
          ]
        },
        "MasterUsername": {"Ref": "RdsUsername"},
        "MasterUserPassword": {"Ref": "RdsPassword"},
        "DBSubnetGroupName": {"Ref": "DbSubnetGroup"},
        "VPCSecurityGroups": [{"Ref": "SgRds"}],
        "PubliclyAccessible": false,
        "BackupRetentionPeriod": {"Fn::FindInMap": ["EnvConfig", {"Ref": "Environment"}, "RdsBackupRetention"]},
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "DeletionProtection": {"Fn::FindInMap": ["EnvConfig", {"Ref": "Environment"}, "RdsDeletionProtection"]},
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "MonitoringInterval": 60,
        "MonitoringRoleArn": {"Fn::GetAtt": ["RdsEnhancedMonitoringRole", "Arn"]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-database"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "RdsEnhancedMonitoringRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {"Service": "monitoring.rds.amazonaws.com"},
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": ["arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"],
        "Path": "/"
      }
    },
    
    "CloudTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "DependsOn": ["DataBucketPolicy"],
      "Properties": {
        "TrailName": {"Fn::Sub": "${ProjectPrefix}-trail-${Environment}"},
        "S3BucketName": {
          "Fn::If": [
            "CreateDataBucket",
            {"Ref": "DataBucket"},
            {"Ref": "S3DataBucketName"}
          ]
        },
        "IncludeGlobalServiceEvents": true,
        "IsLogging": true,
        "IsMultiRegionTrail": true,
        "EnableLogFileValidation": true,
        "EventSelectors": [
          {
            "ReadWriteType": "All",
            "IncludeManagementEvents": true,
            "DataResources": [
              {
                "Type": "AWS::S3::Object",
                "Values": ["arn:aws:s3:::*/*"]
              }
            ]
          }
        ],
        "KMSKeyId": {
          "Fn::If": [
            "CreateKmsKey",
            {"Ref": "KmsKey"},
            {"Ref": "KmsKeyArn"}
          ]
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-cloudtrail"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "OpsSnsTopicEmailSubscription": {
      "Type": "AWS::SNS::Subscription",
      "Condition": "EmailSubscriptionEnabled",
      "Properties": {
        "Protocol": "email",
        "TopicArn": {"Ref": "OpsSnsTopic"},
        "Endpoint": {"Ref": "SnsEmailForAlarms"}
      }
    },
    
    "OpsSnsTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {"Fn::Sub": "${ProjectPrefix}-ops-topic"},
        "DisplayName": {"Fn::Sub": "${ProjectPrefix} Operations Alerts"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "${ProjectPrefix}-ops-topic"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}}
        ]
      }
    },
    
    "OpsSnsTopicPolicy": {
      "Type": "AWS::SNS::TopicPolicy",
      "Properties": {
        "Topics": [{"Ref": "OpsSnsTopic"}],
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AllowCloudWatchToPublish",
              "Effect": "Allow",
              "Principal": {"Service": "cloudwatch.amazonaws.com"},
              "Action": ["SNS:Publish"],
              "Resource": {"Ref": "OpsSnsTopic"}
            }
          ]
        }
      }
    },
    
    "BastionCpuAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "${ProjectPrefix}-bastion-cpu-high"},
        "AlarmDescription": "Bastion CPU utilization is too high",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {"Name": "InstanceId", "Value": {"Ref": "BastionInstance"}}
        ],
        "AlarmActions": [{"Ref": "OpsSnsTopic"}],
        "TreatMissingData": "breaching"
      }
    },
    
    "BastionStatusCheckAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "${ProjectPrefix}-bastion-status-check"},
        "AlarmDescription": "Bastion instance status check failed",
        "MetricName": "StatusCheckFailed",
        "Namespace": "AWS/EC2",
        "Statistic": "Maximum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 0,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {"Name": "InstanceId", "Value": {"Ref": "BastionInstance"}}
        ],
        "AlarmActions": [{"Ref": "OpsSnsTopic"}],
        "TreatMissingData": "breaching"
      }
    },
    
    "AppCpuAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "${ProjectPrefix}-app-cpu-high"},
        "AlarmDescription": "Application instance CPU utilization is too high",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {"Name": "InstanceId", "Value": {"Ref": "AppInstance"}}
        ],
        "AlarmActions": [{"Ref": "OpsSnsTopic"}],
        "TreatMissingData": "breaching"
      }
    },
    
    "RdsCpuAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "${ProjectPrefix}-rds-cpu-high"},
        "AlarmDescription": "RDS CPU utilization is too high",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 600,
        "EvaluationPeriods": 1,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {"Name": "DBInstanceIdentifier", "Value": {"Ref": "RdsInstance"}}
        ],
        "AlarmActions": [{"Ref": "OpsSnsTopic"}],
        "TreatMissingData": "breaching"
      }
    },
    
    "RdsStorageSpaceAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "${ProjectPrefix}-rds-storage-low"},
        "AlarmDescription": "RDS free storage space is low",
        "MetricName": "FreeStorageSpace",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 600,
        "EvaluationPeriods": 1,
        "Threshold": 2147483648,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {"Name": "DBInstanceIdentifier", "Value": {"Ref": "RdsInstance"}}
        ],
        "AlarmActions": [{"Ref": "OpsSnsTopic"}],
        "TreatMissingData": "breaching"
      }
    }
  },
  
  "Outputs": {
    "VpcId": {
      "Description": "VPC ID",
      "Value": {"Ref": "Vpc"},
      "Export": {"Name": {"Fn::Sub": "${ProjectPrefix}-${Environment}-vpc-id"}}
    },
    "PublicSubnetIds": {
      "Description": "Public subnet IDs",
      "Value": {
        "Fn::Join": [",", [{"Ref": "PublicSubnet1"}, {"Ref": "PublicSubnet2"}]]
      },
      "Export": {"Name": {"Fn::Sub": "${ProjectPrefix}-${Environment}-public-subnet-ids"}}
    },
    "PrivateSubnetIds": {
      "Description": "Private subnet IDs",
      "Value": {
        "Fn::Join": [",", [{"Ref": "PrivateSubnet1"}, {"Ref": "PrivateSubnet2"}]]
      },
      "Export": {"Name": {"Fn::Sub": "${ProjectPrefix}-${Environment}-private-subnet-ids"}}
    },
    "BastionSecurityGroupId": {
      "Description": "Bastion security group ID",
      "Value": {"Ref": "SgBastion"},
      "Export": {"Name": {"Fn::Sub": "${ProjectPrefix}-${Environment}-bastion-sg-id"}}
    },
    "AppSecurityGroupId": {
      "Description": "Application security group ID",
      "Value": {"Ref": "SgAppPrivate"},
      "Export": {"Name": {"Fn::Sub": "${ProjectPrefix}-${Environment}-app-sg-id"}}
    },
    "RdsSecurityGroupId": {
      "Description": "RDS security group ID",
      "Value": {"Ref": "SgRds"},
      "Export": {"Name": {"Fn::Sub": "${ProjectPrefix}-${Environment}-rds-sg-id"}}
    },
    "DataBucketName": {
      "Description": "Data bucket name",
      "Value": {
        "Fn::If": [
          "CreateDataBucket",
          {"Ref": "DataBucket"},
          {"Ref": "S3DataBucketName"}
        ]
      },
      "Export": {"Name": {"Fn::Sub": "${ProjectPrefix}-${Environment}-data-bucket-name"}}
    },
    "DataBucketArn": {
      "Description": "Data bucket ARN",
      "Value": {
        "Fn::If": [
          "CreateDataBucket",
          {"Fn::GetAtt": ["DataBucket", "Arn"]},
          {"Fn::Sub": "arn:${AWS::Partition}:s3:::${S3DataBucketName}"}
        ]
      },
      "Export": {"Name": {"Fn::Sub": "${ProjectPrefix}-${Environment}-data-bucket-arn"}}
    },
    "KmsKeyArn": {
      "Description": "KMS key ARN",
      "Value": {
        "Fn::If": [
          "CreateKmsKey",
          {"Fn::GetAtt": ["KmsKey", "Arn"]},
          {"Ref": "KmsKeyArn"}
        ]
      },
      "Export": {"Name": {"Fn::Sub": "${ProjectPrefix}-${Environment}-kms-key-arn"}}
    },
    "DbSubnetGroupName": {
      "Description": "Database subnet group name",
      "Value": {"Ref": "DbSubnetGroup"},
      "Export": {"Name": {"Fn::Sub": "${ProjectPrefix}-${Environment}-db-subnet-group"}}
    },
    "RdsEndpointAddress": {
      "Description": "RDS endpoint address",
      "Value": {"Fn::GetAtt": ["RdsInstance", "Endpoint.Address"]},
      "Export": {"Name": {"Fn::Sub": "${ProjectPrefix}-${Environment}-rds-endpoint"}}
    },
    "RdsInstanceIdentifier": {
      "Description": "RDS instance identifier",
      "Value": {"Ref": "RdsInstance"},
      "Export": {"Name": {"Fn::Sub": "${ProjectPrefix}-${Environment}-rds-instance-id"}}
    },
    "OpsSnsTopicArn": {
      "Description": "Operations SNS topic ARN",
      "Value": {"Ref": "OpsSnsTopic"},
      "Export": {"Name": {"Fn::Sub": "${ProjectPrefix}-${Environment}-ops-topic-arn"}}
    }
  }
}
```

## Key Security Features Implemented

### 1. **Network Isolation**
- Multi-tier architecture with public and private subnets
- NAT Gateway for outbound internet access from private subnets
- Bastion host as the only entry point to private resources
- VPC endpoints for S3 to reduce data transfer costs and improve security

### 2. **Access Control**
- IAM roles with least privilege principles
- No hard-coded credentials or root account access
- Custom DynamoDB read-only policy with parameterized table ARNs
- Security groups with minimal required ports open

### 3. **Encryption**
- KMS encryption for S3, EBS volumes, RDS, and CloudTrail logs
- S3 bucket policy enforcing TLS transport
- RDS encryption at rest with automated backups

### 4. **Monitoring & Compliance**
- CloudTrail for API activity logging
- CloudWatch alarms for critical metrics
- SNS topic for alarm notifications
- Detailed EC2 monitoring enabled
- RDS Performance Insights enabled

### 5. **High Availability**
- Resources spread across two availability zones
- RDS with automated backups and configurable retention
- S3 versioning enabled for data protection
- Deletion protection for production RDS instances

## Usage Instructions

1. **Deploy the template:**
```bash
aws cloudformation create-stack \
  --stack-name secure-environment \
  --template-body file://main-template.json \
  --parameters \
    ParameterKey=RdsUsername,ParameterValue=dbadmin \
    ParameterKey=RdsPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=Az1,ParameterValue=us-east-1a \
    ParameterKey=Az2,ParameterValue=us-east-1b \
    ParameterKey=AllowedBastionSshCidr,ParameterValue=YOUR_IP/32 \
    ParameterKey=KeyPairName,ParameterValue=your-ec2-keypair \
  --capabilities CAPABILITY_NAMED_IAM
```

2. **Access the bastion host:**
```bash
ssh -i your-key.pem ec2-user@<bastion-public-ip>
```

3. **Access private instances through bastion:**
```bash
ssh -i your-key.pem -J ec2-user@<bastion-public-ip> ec2-user@<private-instance-ip>
```

The template follows AWS best practices for security, implements proper tagging for cost management, and uses parameterization to avoid hard-coded values. All resources are properly secured with encryption, least privilege access, and comprehensive monitoring.