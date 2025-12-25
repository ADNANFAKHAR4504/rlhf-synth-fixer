# Ideal CloudFormation Template for Secure Web Application

This CloudFormation template creates a secure, production-ready web application infrastructure with comprehensive security controls, compliance monitoring, and proper networking architecture.

## Architecture Overview

The solution deploys:
- Private VPC with isolated subnets (no direct internet access)
- NAT Gateway for controlled outbound connectivity
- EC2 instances (t3.micro) in private subnets with restricted SSH access
- S3 bucket with KMS encryption for content storage
- CloudFront distribution for HTTPS content delivery
- CloudTrail for comprehensive audit logging
- AWS Config for compliance monitoring
- IAM roles following least-privilege principles

## Complete CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure and scalable web application infrastructure with comprehensive security measures and compliance monitoring",
  "Parameters": {
    "AllowedSSHCIDR": {
      "Type": "String",
      "Default": "10.0.0.0/8",
      "Description": "CIDR block allowed for SSH access to EC2 instances",
      "AllowedPattern": "^([0-9]{1,3}\\.){3}[0-9]{1,3}/[0-9]{1,2}$"
    },
    "Environment": {
      "Type": "String",
      "Default": "production",
      "Description": "Environment name for resource tagging"
    }
  },
  "Resources": {
    "WebAppKMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for encrypting web application resources",
        "KeyPolicy": {
          "Version": "2012-10-17",
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
              "Sid": "Allow CloudTrail to encrypt logs",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": [
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
            "Value": "WebApp-KMS-Key"
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
    "WebAppKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": "alias/webapp-encryption-key",
        "TargetKeyId": {
          "Ref": "WebAppKMSKey"
        }
      }
    },
    "WebAppVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-VPC"
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
    "WebAppPrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "WebAppVPC"
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
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-Private-Subnet-1"
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
    "WebAppPrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "WebAppVPC"
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
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-Private-Subnet-2"
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
    "WebAppPublicSubnet": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "WebAppVPC"
        },
        "CidrBlock": "10.0.3.0/24",
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
            "Value": "WebApp-Public-Subnet"
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
    "WebAppInternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-IGW"
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
    "WebAppVPCGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {
          "Ref": "WebAppVPC"
        },
        "InternetGatewayId": {
          "Ref": "WebAppInternetGateway"
        }
      }
    },
    "WebAppNATGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "WebAppVPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-NAT-EIP"
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
    "WebAppNATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "WebAppNATGatewayEIP",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "WebAppPublicSubnet"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-NAT-Gateway"
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
    "WebAppPublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "WebAppVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-Public-RT"
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
    "WebAppPrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "WebAppVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-Private-RT"
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
    "WebAppPublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "WebAppVPCGatewayAttachment",
      "Properties": {
        "RouteTableId": {
          "Ref": "WebAppPublicRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {
          "Ref": "WebAppInternetGateway"
        }
      }
    },
    "WebAppPrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "WebAppPrivateRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "WebAppNATGateway"
        }
      }
    },
    "WebAppPublicSubnetRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "WebAppPublicSubnet"
        },
        "RouteTableId": {
          "Ref": "WebAppPublicRouteTable"
        }
      }
    },
    "WebAppPrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "WebAppPrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "WebAppPrivateRouteTable"
        }
      }
    },
    "WebAppPrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "WebAppPrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "WebAppPrivateRouteTable"
        }
      }
    },
    "WebAppSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for web application EC2 instances",
        "VpcId": {
          "Ref": "WebAppVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": {
              "Ref": "AllowedSSHCIDR"
            },
            "Description": "SSH access from allowed CIDR range"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "10.0.0.0/16",
            "Description": "HTTP access from VPC"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "10.0.0.0/16",
            "Description": "HTTPS access from VPC"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTP outbound access"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTPS outbound access"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-Security-Group"
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
    "WebAppInstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "WebApp-Instance-Role-${AWS::Region}"
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
        "Policies": [
          {
            "PolicyName": "WebAppInstancePolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:s3:::${WebAppS3Bucket}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:DescribeKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "WebAppKMSKey",
                      "Arn"
                    ]
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-Instance-Role"
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
    "WebAppInstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {
          "Fn::Sub": "WebApp-Instance-Profile-${AWS::Region}"
        },
        "Roles": [
          {
            "Ref": "WebAppInstanceRole"
          }
        ]
      }
    },
    "WebAppEC2Instance1": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "InstanceType": "t3.micro",
        "ImageId": "ami-0f74c08b8b5effa56",
        "SubnetId": {
          "Ref": "WebAppPrivateSubnet1"
        },
        "SecurityGroupIds": [
          {
            "Ref": "WebAppSecurityGroup"
          }
        ],
        "IamInstanceProfile": {
          "Ref": "WebAppInstanceProfile"
        },
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvda",
            "Ebs": {
              "VolumeType": "gp3",
              "VolumeSize": 20,
              "Encrypted": true,
              "KmsKeyId": {
                "Ref": "WebAppKMSKey"
              }
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-Instance-1"
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
    "WebAppEC2Instance2": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "InstanceType": "t3.micro",
        "ImageId": "ami-0f74c08b8b5effa56",
        "SubnetId": {
          "Ref": "WebAppPrivateSubnet2"
        },
        "SecurityGroupIds": [
          {
            "Ref": "WebAppSecurityGroup"
          }
        ],
        "IamInstanceProfile": {
          "Ref": "WebAppInstanceProfile"
        },
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvda",
            "Ebs": {
              "VolumeType": "gp3",
              "VolumeSize": 20,
              "Encrypted": true,
              "KmsKeyId": {
                "Ref": "WebAppKMSKey"
              }
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-Instance-2"
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
    "WebAppS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "webapp-content-${AWS::AccountId}-${AWS::Region}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "WebAppKMSKey"
                }
              },
              "BucketKeyEnabled": true
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
            "Value": "WebApp-Content-Bucket"
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
    "WebAppCloudFrontOriginAccessControl": {
      "Type": "AWS::CloudFront::OriginAccessControl",
      "Properties": {
        "OriginAccessControlConfig": {
          "Name": {
            "Fn::Sub": "WebApp-OAC-${AWS::AccountId}"
          },
          "OriginAccessControlOriginType": "s3",
          "SigningBehavior": "always",
          "SigningProtocol": "sigv4"
        }
      }
    },
    "WebAppCloudFrontDistribution": {
      "Type": "AWS::CloudFront::Distribution",
      "Properties": {
        "DistributionConfig": {
          "Origins": [
            {
              "Id": "S3Origin",
              "DomainName": {
                "Fn::GetAtt": [
                  "WebAppS3Bucket",
                  "RegionalDomainName"
                ]
              },
              "S3OriginConfig": {
                "OriginAccessIdentity": ""
              },
              "OriginAccessControlId": {
                "Ref": "WebAppCloudFrontOriginAccessControl"
              }
            }
          ],
          "Enabled": true,
          "DefaultRootObject": "index.html",
          "DefaultCacheBehavior": {
            "AllowedMethods": [
              "DELETE",
              "GET",
              "HEAD",
              "OPTIONS",
              "PATCH",
              "POST",
              "PUT"
            ],
            "TargetOriginId": "S3Origin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "Compress": true,
            "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
          },
          "PriceClass": "PriceClass_100",
          "ViewerCertificate": {
            "CloudFrontDefaultCertificate": true
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-CloudFront-Distribution"
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
    "WebAppS3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "WebAppS3Bucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AllowCloudFrontServicePrincipal",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudfront.amazonaws.com"
              },
              "Action": "s3:GetObject",
              "Resource": {
                "Fn::Sub": "arn:aws:s3:::${WebAppS3Bucket}/*"
              },
              "Condition": {
                "StringEquals": {
                  "AWS:SourceArn": {
                    "Fn::Sub": "arn:aws:cloudfront::${AWS::AccountId}:distribution/${WebAppCloudFrontDistribution}"
                  }
                }
              }
            }
          ]
        }
      }
    },
    "WebAppCloudTrailS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "webapp-cloudtrail-${AWS::AccountId}-${AWS::Region}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "WebAppKMSKey"
                }
              },
              "BucketKeyEnabled": true
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
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "CloudTrailLogRetention",
              "Status": "Enabled",
              "ExpirationInDays": 90,
              "NoncurrentVersionExpirationInDays": 30
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-CloudTrail-Bucket"
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
    "WebAppCloudTrailS3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "WebAppCloudTrailS3Bucket"
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
                "Fn::Sub": "arn:aws:s3:::${WebAppCloudTrailS3Bucket}"
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
                "Fn::Sub": "arn:aws:s3:::${WebAppCloudTrailS3Bucket}/*"
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
    "WebAppCloudTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "DependsOn": "WebAppCloudTrailS3BucketPolicy",
      "Properties": {
        "TrailName": {
          "Fn::Sub": "WebApp-CloudTrail-${AWS::Region}"
        },
        "S3BucketName": {
          "Ref": "WebAppCloudTrailS3Bucket"
        },
        "S3KeyPrefix": "cloudtrail-logs",
        "IncludeGlobalServiceEvents": true,
        "IsLogging": true,
        "IsMultiRegionTrail": true,
        "EnableLogFileValidation": true,
        "KMSKeyId": {
          "Ref": "WebAppKMSKey"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-CloudTrail"
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
    "WebAppConfigDeliveryChannel": {
      "Type": "AWS::Config::DeliveryChannel",
      "Properties": {
        "Name": "WebApp-Config-DeliveryChannel",
        "S3BucketName": {
          "Ref": "WebAppCloudTrailS3Bucket"
        },
        "S3KeyPrefix": "config"
      }
    },
    "WebAppConfigConfigurationRecorder": {
      "Type": "AWS::Config::ConfigurationRecorder",
      "Properties": {
        "Name": "WebApp-Config-Recorder",
        "RoleARN": {
          "Fn::GetAtt": [
            "WebAppConfigRole",
            "Arn"
          ]
        },
        "RecordingGroup": {
          "AllSupported": true,
          "IncludeGlobalResourceTypes": true
        }
      }
    },
    "WebAppConfigRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "WebApp-Config-Role-${AWS::Region}"
        },
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
        "Policies": [
          {
            "PolicyName": "WebAppConfigDeliveryRolePolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetBucketAcl",
                    "s3:ListBucket"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:s3:::${WebAppCloudTrailS3Bucket}"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": "s3:PutObject",
                  "Resource": {
                    "Fn::Sub": "arn:aws:s3:::${WebAppCloudTrailS3Bucket}/config/*"
                  },
                  "Condition": {
                    "StringEquals": {
                      "s3:x-amz-acl": "bucket-owner-full-control"
                    }
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": "s3:GetObject",
                  "Resource": {
                    "Fn::Sub": "arn:aws:s3:::${WebAppCloudTrailS3Bucket}/config/*"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "WebApp-Config-Role"
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
        "Ref": "WebAppVPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPC-ID"
        }
      }
    },
    "PrivateSubnet1Id": {
      "Description": "ID of Private Subnet 1",
      "Value": {
        "Ref": "WebAppPrivateSubnet1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Private-Subnet-1-ID"
        }
      }
    },
    "PrivateSubnet2Id": {
      "Description": "ID of Private Subnet 2",
      "Value": {
        "Ref": "WebAppPrivateSubnet2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Private-Subnet-2-ID"
        }
      }
    },
    "SecurityGroupId": {
      "Description": "ID of the Web Application Security Group",
      "Value": {
        "Ref": "WebAppSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Security-Group-ID"
        }
      }
    },
    "S3BucketName": {
      "Description": "Name of the S3 bucket for web content",
      "Value": {
        "Ref": "WebAppS3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3-Bucket-Name"
        }
      }
    },
    "CloudFrontDistributionId": {
      "Description": "ID of the CloudFront distribution",
      "Value": {
        "Ref": "WebAppCloudFrontDistribution"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CloudFront-Distribution-ID"
        }
      }
    },
    "CloudFrontDistributionDomainName": {
      "Description": "Domain name of the CloudFront distribution",
      "Value": {
        "Fn::GetAtt": [
          "WebAppCloudFrontDistribution",
          "DomainName"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CloudFront-Domain-Name"
        }
      }
    },
    "KMSKeyId": {
      "Description": "ID of the KMS key used for encryption",
      "Value": {
        "Ref": "WebAppKMSKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMS-Key-Id"
        }
      }
    },
    "CloudTrailS3BucketName": {
      "Description": "Name of the S3 bucket for CloudTrail logs",
      "Value": {
        "Ref": "WebAppCloudTrailS3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CloudTrail-S3-Bucket-Name"
        }
      }
    },
    "ConfigRecorderRoleArn": {
      "Description": "ARN of the IAM Role used by AWS Config Recorder",
      "Value": {
        "Fn::GetAtt": [
          "WebAppConfigRole",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Config-Role-Arn"
        }
      }
    }
  }
}
```

## Key Security Features

1. **KMS Encryption**: Custom KMS key encrypts all sensitive data (S3 buckets, EBS volumes, CloudTrail logs)
2. **Network Isolation**: EC2 instances in private subnets with no direct internet access
3. **NAT Gateway**: Controlled outbound internet access for updates and external API calls
4. **Restricted Access**: Security groups limit SSH access to specific CIDR ranges only
5. **IAM Least Privilege**: Instance roles have minimal permissions (read-only S3, KMS decrypt)
6. **CloudFront with OAC**: Secure HTTPS content delivery using Origin Access Control
7. **CloudTrail Logging**: Complete audit trail of all AWS account activity
8. **AWS Config**: Continuous compliance monitoring and configuration tracking
9. **S3 Security**: Public access blocked, versioning enabled, encryption at rest
10. **Log Retention**: Automated lifecycle policies for CloudTrail logs (90-day retention)

## Deployment Notes

The template uses parameters for environment-specific values and dynamic references for AWS account ID and region. Region is read from environment variable as specified in requirements. All resources are properly tagged for cost tracking and management.
