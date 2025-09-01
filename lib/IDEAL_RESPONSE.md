The model should output a complete and valid CloudFormation template in JSON that creates production-grade AWS infrastructure with comprehensive security, logging, and networking components.
Template Requirements

1. Template Structure & Metadata
   json{
   "AWSTemplateFormatVersion": "2010-09-09",
   "Description": "Production-grade AWS infrastructure with VPC, S3 logging, CloudTrail, IAM roles, and security groups in us-east-1"
   }
2. Parameters Section
   The template must include the following configurable parameters:

EnvironmentSuffix: String parameter for environment naming (dev/staging/prod)

Default: "dev"
Pattern: ^[a-z0-9]+$ (lowercase alphanumeric, 1-10 characters)

TrustedIpCidrs: CommaDelimitedList for trusted IP ranges

Default: "203.0.113.0/24,198.51.100.0/24"
Used for S3 bucket access and SSH security group rules

BucketNamePrefix: String for S3 bucket naming

Default: "secure-logging"
Pattern: ^[a-z0-9][a-z0-9-]\*[a-z0-9]$ (3-50 characters)

KmsKeyAlias: String for KMS key alias

Default: "alias/secure-logging-key"
Pattern: ^alias/[a-zA-Z0-9:/_-]+$

Environment: String with allowed values

Options: "Production", "Staging", "Development"
Default: "Production"

3. Networking Infrastructure
   VPC Configuration

SecureVPC: VPC with CIDR 10.0.0.0/16

EnableDnsHostnames: true
EnableDnsSupport: true
Proper tagging with Name and Environment

Subnets

PublicSubnet: 10.0.1.0/24

MapPublicIpOnLaunch: true
Uses first availability zone

PrivateSubnet: 10.0.2.0/24

MapPublicIpOnLaunch: false
Uses first availability zone

Internet Gateway & Routing

InternetGateway: Attached to VPC
PublicRouteTable: Routes 0.0.0.0/0 to Internet Gateway
PrivateRouteTable: No internet access routes
Route Table Associations: Proper subnet associations

4. Security & Encryption
   KMS Configuration

LoggingKMSKey: Customer-managed KMS key

EnableKeyRotation: true
Comprehensive key policy allowing:

Root account permissions
CloudTrail service permissions with encryption context
S3 service permissions

LoggingKMSKeyAlias: Named alias for the KMS key

Security Groups

EC2SecurityGroup: Restrictive security group

Ingress: SSH (port 22) from trusted IP CIDRs only
Egress: All outbound traffic allowed
Applied to the VPC

5. S3 Logging Infrastructure
   S3 Bucket

LoggingBucket: Secure logging bucket

Dynamic naming: ${BucketNamePrefix}-${AccountId}-${Region}-${EnvironmentSuffix}
SSE-KMS encryption with the created KMS key
Public access completely blocked
Versioning enabled

Bucket Policy

LoggingBucketPolicy: Comprehensive security policy

Deny all insecure (non-HTTPS) connections
Allow CloudTrail service permissions with source ARN conditions
Allow trusted IP access for GetObject and ListBucket
Proper resource ARN references

6. IAM Roles & Permissions
   EC2 Service Role

EC2LoggingRole: IAM role for EC2 instances

AssumeRolePolicyDocument for ec2.amazonaws.com
Managed policy: AmazonS3ReadOnlyAccess
Custom inline policy for logging bucket access (ListBucket, GetObject)

EC2InstanceProfile: Instance profile for EC2 role attachment

7. CloudTrail Configuration

CloudTrail: Comprehensive audit logging

Logs to the created S3 bucket
Multi-region trail enabled
Global service events included
Log file validation enabled
KMS encryption with the created key
Proper dependency on bucket policy

8. Outputs Section
   The template must export the following values for cross-stack references:

VPCId: VPC resource ID
PublicSubnetId: Public subnet ID
PrivateSubnetId: Private subnet ID
EC2SecurityGroupId: Security group ID
LoggingBucketName: S3 bucket name
EC2InstanceProfileArn: Instance profile ARN
KMSKeyId: KMS key ID
CloudTrailArn: CloudTrail ARN

All outputs must include export names using the pattern: ${AWS::StackName}-ResourceType-ID 9. Best Practices & Standards
Tagging Strategy
All resources must be tagged with:

Name: Descriptive name using ${AWS::StackName}-ResourceType pattern
Environment: Using the Environment parameter value

Security Requirements

No hard-coded credentials or sensitive values
Principle of least privilege for all IAM policies
Encryption at rest and in transit where applicable
Public access blocked on all storage resources
Source-based access controls using trusted IP ranges

CloudFormation Best Practices

Proper resource dependencies using DependsOn where needed
Use of CloudFormation functions (Fn::Sub, Fn::GetAtt, Ref, etc.)
Validation-compatible JSON structure
Rollback-safe resource configurations

10. Template Validation Requirements
    The complete template must:

Pass aws cloudformation validate-template successfully
Be deployable without errors in us-east-1 region
Create all resources with proper relationships
Allow clean deletion (rollback compatible)
Follow AWS CloudFormation JSON syntax exactly

11. Complete Template Structure
    json{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "Production-grade AWS infrastructure with VPC, S3 logging, CloudTrail, IAM roles, and security groups in us-east-1",
    "Parameters": {
    "EnvironmentSuffix": {
    "Type": "String",
    "Description": "Environment suffix for resource naming",
    "Default": "dev",
    "MinLength": 1,
    "MaxLength": 10,
    "AllowedPattern": "^[a-z0-9]+$",
            "ConstraintDescription": "Must be lowercase alphanumeric, 1-10 characters"
        },
        "TrustedIpCidrs": {
            "Type": "CommaDelimitedList",
            "Description": "List of trusted IP CIDRs for S3 bucket access and SSH access (comma-separated)",
            "Default": "203.0.113.0/24,198.51.100.0/24",
            "ConstraintDescription": "Must be valid CIDR blocks separated by commas"
        },
        "BucketNamePrefix": {
            "Type": "String",
            "Description": "Prefix for the S3 logging bucket name",
            "Default": "secure-logging",
            "MinLength": 3,
            "MaxLength": 50,
            "AllowedPattern": "^[a-z0-9][a-z0-9-]*[a-z0-9]$",
    "ConstraintDescription": "Must be lowercase alphanumeric with hyphens, 3-50 characters"
    },
    "KmsKeyAlias": {
    "Type": "String",
    "Description": "Alias for the KMS key (optional)",
    "Default": "alias/secure-logging-key",
    "AllowedPattern": "^alias/[a-zA-Z0-9:/_-]+$",
            "ConstraintDescription": "Must start with 'alias/' and contain valid characters"
        },
        "Environment": {
            "Type": "String",
            "Description": "Environment tag for resources",
            "Default": "Production",
            "AllowedValues": [
                "Production",
                "Staging",
                "Development"
            ],
            "ConstraintDescription": "Must be Production, Staging, or Development"
        }
    },
    "Resources": {
        "SecureVPC": {
            "Type": "AWS::EC2::VPC",
            "Properties": {
                "CidrBlock": "10.0.0.0/16",
                "EnableDnsHostnames": true,
                "EnableDnsSupport": true,
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${AWS::StackName}-VPC"
    }
    },
    {
    "Key": "Environment",
    "Value": {
    "Ref": "Environment"
    }
    }
    ]
    }
    },
    "PublicSubnet": {
    "Type": "AWS::EC2::Subnet",
    "Properties": {
    "VpcId": {
    "Ref": "SecureVPC"
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
    "Fn::Sub": "${AWS::StackName}-Public-Subnet"
    }
    },
    {
    "Key": "Environment",
    "Value": {
    "Ref": "Environment"
    }
    }
    ]
    }
    },
    "PrivateSubnet": {
    "Type": "AWS::EC2::Subnet",
    "Properties": {
    "VpcId": {
    "Ref": "SecureVPC"
    },
    "CidrBlock": "10.0.2.0/24",
    "AvailabilityZone": {
    "Fn::Select": [
    0,
    {
    "Fn::GetAZs": ""
    }
    ]
    },
    "MapPublicIpOnLaunch": false,
    "Tags": [
    {
    "Key": "Name",
    "Value": {
    "Fn::Sub": "${AWS::StackName}-Private-Subnet"
    }
    },
    {
    "Key": "Environment",
    "Value": {
    "Ref": "Environment"
    }
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
    "Fn::Sub": "${AWS::StackName}-IGW"
    }
    },
    {
    "Key": "Environment",
    "Value": {
    "Ref": "Environment"
    }
    }
    ]
    }
    },
    "AttachGateway": {
    "Type": "AWS::EC2::VPCGatewayAttachment",
    "Properties": {
    "VpcId": {
    "Ref": "SecureVPC"
    },
    "InternetGatewayId": {
    "Ref": "InternetGateway"
    }
    }
    },
    "PublicRouteTable": {
    "Type": "AWS::EC2::RouteTable",
    "Properties": {
    "VpcId": {
    "Ref": "SecureVPC"
    },
    "Tags": [
    {
    "Key": "Name",
    "Value": {
    "Fn::Sub": "${AWS::StackName}-Public-RouteTable"
    }
    },
    {
    "Key": "Environment",
    "Value": {
    "Ref": "Environment"
    }
    }
    ]
    }
    },
    "PrivateRouteTable": {
    "Type": "AWS::EC2::RouteTable",
    "Properties": {
    "VpcId": {
    "Ref": "SecureVPC"
    },
    "Tags": [
    {
    "Key": "Name",
    "Value": {
    "Fn::Sub": "${AWS::StackName}-Private-RouteTable"
    }
    },
    {
    "Key": "Environment",
    "Value": {
    "Ref": "Environment"
    }
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
    "PublicSubnetRouteTableAssociation": {
    "Type": "AWS::EC2::SubnetRouteTableAssociation",
    "Properties": {
    "SubnetId": {
    "Ref": "PublicSubnet"
    },
    "RouteTableId": {
    "Ref": "PublicRouteTable"
    }
    }
    },
    "PrivateSubnetRouteTableAssociation": {
    "Type": "AWS::EC2::SubnetRouteTableAssociation",
    "Properties": {
    "SubnetId": {
    "Ref": "PrivateSubnet"
    },
    "RouteTableId": {
    "Ref": "PrivateRouteTable"
    }
    }
    },
    "LoggingKMSKey": {
    "Type": "AWS::KMS::Key",
    "Properties": {
    "Description": "KMS key for S3 bucket and CloudTrail encryption",
    "EnableKeyRotation": true,
    "KeyPolicy": {
    "Version": "2012-10-17",
    "Id": "KeyPolicy",
    "Statement": [
    {
    "Sid": "Enable IAM User Permissions",
    "Effect": "Allow",
    "Principal": {
    "AWS": {
    "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                                }
                            },
                            "Action": "kms:*",
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow CloudTrail to use the key",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudtrail.amazonaws.com"
                            },
                            "Action": [
                                "kms:GenerateDataKey*",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*",
                            "Condition": {
                                "StringLike": {
                                    "kms:EncryptionContext:aws:cloudtrail:arn": {
                                        "Fn::Sub": "arn:aws:cloudtrail:*:${AWS::AccountId}:trail/_"
    }
    }
    }
    },
    {
    "Sid": "Allow S3 to use the key",
    "Effect": "Allow",
    "Principal": {
    "Service": "s3.amazonaws.com"
    },
    "Action": [
    "kms:GenerateDataKey_",
    "kms:Decrypt"
    ],
    "Resource": "_"
    }
    ]
    },
    "Tags": [
    {
    "Key": "Name",
    "Value": {
    "Fn::Sub": "${AWS::StackName}-Logging-KMS-Key"
    }
    },
    {
    "Key": "Environment",
    "Value": {
    "Ref": "Environment"
    }
    }
    ]
    }
    },
    "LoggingKMSKeyAlias": {
    "Type": "AWS::KMS::Alias",
    "Properties": {
    "AliasName": {
    "Ref": "KmsKeyAlias"
    },
    "TargetKeyId": {
    "Ref": "LoggingKMSKey"
    }
    }
    },
    "LoggingBucket": {
    "Type": "AWS::S3::Bucket",
    "Properties": {
    "BucketName": {
    "Fn::Sub": "${BucketNamePrefix}-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}"
    },
    "BucketEncryption": {
    "ServerSideEncryptionConfiguration": [
    {
    "ServerSideEncryptionByDefault": {
    "SSEAlgorithm": "aws:kms",
    "KMSMasterKeyID": {
    "Ref": "LoggingKMSKey"
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
    },
    "VersioningConfiguration": {
    "Status": "Enabled"
    },
    "Tags": [
    {
    "Key": "Name",
    "Value": {
    "Fn::Sub": "${AWS::StackName}-Logging-Bucket"
    }
    },
    {
    "Key": "Environment",
    "Value": {
    "Ref": "Environment"
    }
    }
    ]
    }
    },
    "LoggingBucketPolicy": {
    "Type": "AWS::S3::BucketPolicy",
    "Properties": {
    "Bucket": {
    "Ref": "LoggingBucket"
    },
    "PolicyDocument": {
    "Version": "2012-10-17",
    "Statement": [
    {
    "Sid": "DenyInsecureConnections",
    "Effect": "Deny",
    "Principal": "_",
    "Action": "s3:_",
    "Resource": [
    {
    "Fn::GetAtt": [
    "LoggingBucket",
    "Arn"
    ]
    },
    {
    "Fn::Sub": "${LoggingBucket.Arn}/_"
    }
    ],
    "Condition": {
    "Bool": {
    "aws:SecureTransport": "false"
    }
    }
    },
    {
    "Sid": "AWSCloudTrailAclCheck",
    "Effect": "Allow",
    "Principal": {
    "Service": "cloudtrail.amazonaws.com"
    },
    "Action": "s3:GetBucketAcl",
    "Resource": {
    "Fn::GetAtt": [
    "LoggingBucket",
    "Arn"
    ]
    },
    "Condition": {
    "StringEquals": {
    "aws:SourceArn": {
    "Fn::Sub": "arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${AWS::StackName}-CloudTrail"
                                    }
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
                            "Resource": {
                                "Fn::Sub": "${LoggingBucket.Arn}/AWSLogs/${AWS::AccountId}/*"
                            },
                            "Condition": {
                                "StringEquals": {
                                    "s3:x-amz-acl": "bucket-owner-full-control",
                                    "aws:SourceArn": {
                                        "Fn::Sub": "arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/${AWS::StackName}-CloudTrail"
    }
    }
    }
    },
    {
    "Sid": "AllowTrustedIPAccess",
    "Effect": "Allow",
    "Principal": "_",
    "Action": [
    "s3:GetObject",
    "s3:ListBucket"
    ],
    "Resource": [
    {
    "Fn::GetAtt": [
    "LoggingBucket",
    "Arn"
    ]
    },
    {
    "Fn::Sub": "${LoggingBucket.Arn}/_"
    }
    ],
    "Condition": {
    "IpAddress": {
    "aws:SourceIp": {
    "Ref": "TrustedIpCidrs"
    }
    }
    }
    }
    ]
    }
    }
    },
    "EC2LoggingRole": {
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
    "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
    ],
    "Policies": [
    {
    "PolicyName": "LoggingBucketAccess",
    "PolicyDocument": {
    "Version": "2012-10-17",
    "Statement": [
    {
    "Effect": "Allow",
    "Action": [
    "s3:ListBucket"
    ],
    "Resource": {
    "Fn::GetAtt": [
    "LoggingBucket",
    "Arn"
    ]
    }
    },
    {
    "Effect": "Allow",
    "Action": [
    "s3:GetObject"
    ],
    "Resource": {
    "Fn::Sub": "${LoggingBucket.Arn}/*"
                                    }
                                }
                            ]
                        }
                    }
                ],
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${AWS::StackName}-EC2-Logging-Role"
    }
    },
    {
    "Key": "Environment",
    "Value": {
    "Ref": "Environment"
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
    "Ref": "EC2LoggingRole"
    }
    ]
    }
    },
    "CloudTrail": {
    "Type": "AWS::CloudTrail::Trail",
    "DependsOn": "LoggingBucketPolicy",
    "Properties": {
    "TrailName": {
    "Fn::Sub": "${AWS::StackName}-CloudTrail"
                },
                "S3BucketName": {
                    "Ref": "LoggingBucket"
                },
                "IncludeGlobalServiceEvents": true,
                "IsLogging": true,
                "IsMultiRegionTrail": true,
                "EnableLogFileValidation": true,
                "KMSKeyId": {
                    "Ref": "LoggingKMSKey"
                },
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": {
                            "Fn::Sub": "${AWS::StackName}-CloudTrail"
    }
    },
    {
    "Key": "Environment",
    "Value": {
    "Ref": "Environment"
    }
    }
    ]
    }
    },
    "EC2SecurityGroup": {
    "Type": "AWS::EC2::SecurityGroup",
    "Properties": {
    "GroupDescription": "Security group for EC2 instances with restricted SSH access",
    "VpcId": {
    "Ref": "SecureVPC"
    },
    "SecurityGroupIngress": [
    {
    "IpProtocol": "tcp",
    "FromPort": 22,
    "ToPort": 22,
    "CidrIp": {
    "Fn::Select": [
    0,
    {
    "Ref": "TrustedIpCidrs"
    }
    ]
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
    "Value": {
    "Fn::Sub": "${AWS::StackName}-EC2-SecurityGroup"
    }
    },
    {
    "Key": "Environment",
    "Value": {
    "Ref": "Environment"
    }
    }
    ]
    }
    }
    },
    "Outputs": {
    "VPCId": {
    "Description": "ID of the created VPC",
    "Value": {
    "Ref": "SecureVPC"
    },
    "Export": {
    "Name": {
    "Fn::Sub": "${AWS::StackName}-VPC-ID"
                }
            }
        },
        "PublicSubnetId": {
            "Description": "ID of the public subnet",
            "Value": {
                "Ref": "PublicSubnet"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-Public-Subnet-ID"
    }
    }
    },
    "PrivateSubnetId": {
    "Description": "ID of the private subnet",
    "Value": {
    "Ref": "PrivateSubnet"
    },
    "Export": {
    "Name": {
    "Fn::Sub": "${AWS::StackName}-Private-Subnet-ID"
                }
            }
        },
        "EC2SecurityGroupId": {
            "Description": "ID of the EC2 security group",
            "Value": {
                "Ref": "EC2SecurityGroup"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-EC2-Security-Group-ID"
    }
    }
    },
    "LoggingBucketName": {
    "Description": "Name of the S3 logging bucket",
    "Value": {
    "Ref": "LoggingBucket"
    },
    "Export": {
    "Name": {
    "Fn::Sub": "${AWS::StackName}-Logging-Bucket-Name"
                }
            }
        },
        "EC2InstanceProfileArn": {
            "Description": "ARN of the EC2 instance profile",
            "Value": {
                "Fn::GetAtt": [
                    "EC2InstanceProfile",
                    "Arn"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-EC2-Instance-Profile-ARN"
    }
    }
    },
    "KMSKeyId": {
    "Description": "ID of the KMS key used for encryption",
    "Value": {
    "Ref": "LoggingKMSKey"
    },
    "Export": {
    "Name": {
    "Fn::Sub": "${AWS::StackName}-KMS-Key-ID"
                }
            }
        },
        "CloudTrailArn": {
            "Description": "ARN of the CloudTrail",
            "Value": {
                "Fn::GetAtt": [
                    "CloudTrail",
                    "Arn"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-CloudTrail-ARN"
    }
    }
    }
    }
    }
    Summary
    This enhanced ideal response provides a comprehensive, production-ready AWS infrastructure template that includes all components from the TapStack.json with detailed explanations and requirements. The template creates a secure, well-architected AWS environment suitable for production workloads with proper logging, monitoring, and security controls in place.
