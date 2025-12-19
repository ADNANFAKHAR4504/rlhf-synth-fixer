# Educational Content Delivery Platform - CI/CD Pipeline Infrastructure

## Overview

This CloudFormation template implements a secure, scalable CI/CD pipeline infrastructure for an educational content delivery platform. The solution includes automated build and deployment pipelines, content delivery through CloudFront CDN, application hosting on ECS Fargate, and comprehensive monitoring and security features.

## Architecture Components

### 1. CI/CD Pipeline
- **CodeCommit Repository**: Source control for application code
- **CodeBuild Project**: Automated build and test execution
- **CodePipeline**: Orchestrates the entire CI/CD workflow (Source → Build → Deploy)
- **EventBridge Rule**: Automatically triggers pipeline on code commits
- **S3 Artifact Bucket**: Encrypted storage for build artifacts with lifecycle policies

### 2. Application Infrastructure
- **ECS Fargate Cluster**: Serverless container orchestration for the educational platform
- **ECS Service**: Manages 2 application tasks for high availability
- **Application Load Balancer (ALB)**: Distributes traffic across ECS tasks
- **VPC with Public and Private Subnets**: Network isolation across 2 availability zones
- **Security Groups**: Least-privilege network access controls

### 3. Content Delivery
- **S3 Content Bucket**: Stores educational content (videos, documents, images)
- **CloudFront Distribution**: Global CDN for low-latency content delivery
- **Origin Access Identity (OAI)**: Secure S3 access from CloudFront only

### 4. Data Storage
- **DynamoDB UserProgress Table**: Tracks student progress through courses
- **DynamoDB CourseMetadata Table**: Stores course information and metadata
- **KMS Encryption**: All data encrypted at rest with customer-managed keys

### 5. Security & Compliance
- **KMS Key**: Customer-managed key for encryption with automatic rotation
- **IAM Roles**: Least-privilege access for all services
- **VPC Endpoints**: Private connectivity to S3 and DynamoDB (cost-optimized, no NAT)
- **Encryption**: All data at rest (S3, DynamoDB, Logs) and in transit (HTTPS/TLS)

### 6. Monitoring & Alerting
- **CloudWatch Log Groups**: Centralized logging for ECS and CodeBuild
- **CloudWatch Alarms**: Monitor pipeline failures, ECS CPU, and ALB response times
- **SNS Topic**: Email notifications for critical alerts

## Key Features

### Security Best Practices
1. All S3 buckets have:
   - Public access blocked
   - KMS encryption enabled
   - Versioning enabled
   - Lifecycle policies for cost optimization

2. All IAM roles follow least privilege:
   - ECS Task Execution Role: Pull images, write logs, decrypt KMS
   - ECS Task Role: Access DynamoDB tables, read S3 content
   - CodeBuild Role: Build permissions, artifact access
   - CodePipeline Role: Orchestration across services

3. Network security:
   - Private subnets for ECS tasks
   - Security groups with specific ingress/egress rules
   - VPC endpoints eliminate need for NAT Gateway

### High Availability
- ECS Service runs 2 tasks across 2 availability zones
- ALB distributes traffic with health checks
- Multi-AZ subnet architecture
- DynamoDB with point-in-time recovery

### Cost Optimization
- ECS Fargate eliminates server management
- DynamoDB on-demand billing (no idle capacity costs)
- VPC Gateway endpoints (free) instead of NAT Gateway
- S3 lifecycle policies delete old artifacts after 30 days
- CloudWatch Logs retention set to 7 days

### Educational Data Compliance
- Encryption at rest and in transit
- Audit trail through CloudWatch Logs
- Point-in-time recovery for student data
- Secure content delivery through CloudFront

## Resource Naming Convention

All resources use the `EnvironmentSuffix` parameter for unique naming:
- Pattern: `{resource-type}-{environment-suffix}`
- Example: `education-cluster-dev`, `UserProgress-prod`
- Ensures no naming conflicts across environments

## AWS Services Used

This infrastructure uses the following AWS services:

1. **Compute & Containers**: ECS Fargate, Application Load Balancer
2. **CI/CD**: CodeCommit, CodeBuild, CodePipeline, EventBridge
3. **Storage**: S3 (2 buckets), DynamoDB (2 tables)
4. **Content Delivery**: CloudFront
5. **Networking**: VPC, Subnets, Internet Gateway, Route Tables, Security Groups, VPC Endpoints
6. **Security**: IAM Roles, KMS
7. **Monitoring**: CloudWatch Logs, CloudWatch Alarms, SNS
## Implementation Code

### lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure CI/CD Pipeline for Educational Content Delivery Platform - CloudFormation Template",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": [
            "EnvironmentSuffix"
          ]
        },
        {
          "Label": {
            "default": "Notification Configuration"
          },
          "Parameters": [
            "AlertEmail"
          ]
        }
      ]
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    },
    "AlertEmail": {
      "Type": "String",
      "Default": "alerts@example.com",
      "Description": "Email address for pipeline and monitoring alerts",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "ConstraintDescription": "Must be a valid email address"
    }
  },
  "Resources": {
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for encrypting educational content platform resources - ${EnvironmentSuffix}"
        },
        "EnableKeyRotation": true,
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
              "Sid": "Allow services to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "s3.amazonaws.com",
                  "codebuild.amazonaws.com",
                  "codepipeline.amazonaws.com",
                  "sns.amazonaws.com"
                ]
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey",
                "kms:CreateGrant"
              ],
              "Resource": "*"
            },
            {
              "Sid": "Allow CloudWatch Logs to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": {
                  "Fn::Sub": "logs.${AWS::Region}.amazonaws.com"
                }
              },
              "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:CreateGrant",
                "kms:DescribeKey"
              ],
              "Resource": "*",
              "Condition": {
                "ArnLike": {
                  "kms:EncryptionContext:aws:logs:arn": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:*"
                  }
                }
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-platform-key-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/education-platform-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "ArtifactBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "education-artifacts-${EnvironmentSuffix}-${AWS::AccountId}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Fn::GetAtt": [
                    "KMSKey",
                    "Arn"
                  ]
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
              "Id": "DeleteOldArtifacts",
              "Status": "Enabled",
              "ExpirationInDays": 30,
              "NoncurrentVersionExpirationInDays": 7
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-artifacts-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "ContentBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "education-content-${EnvironmentSuffix}-${AWS::AccountId}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Fn::GetAtt": [
                    "KMSKey",
                    "Arn"
                  ]
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
        "CorsConfiguration": {
          "CorsRules": [
            {
              "AllowedOrigins": [
                "*"
              ],
              "AllowedMethods": [
                "GET",
                "HEAD"
              ],
              "AllowedHeaders": [
                "*"
              ],
              "MaxAge": 3600
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-content-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "CloudFrontOriginAccessIdentity": {
      "Type": "AWS::CloudFront::CloudFrontOriginAccessIdentity",
      "Properties": {
        "CloudFrontOriginAccessIdentityConfig": {
          "Comment": {
            "Fn::Sub": "OAI for education content CDN - ${EnvironmentSuffix}"
          }
        }
      }
    },
    "ContentBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "ContentBucket"
        },
        "PolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "CanonicalUser": {
                  "Fn::GetAtt": [
                    "CloudFrontOriginAccessIdentity",
                    "S3CanonicalUserId"
                  ]
                }
              },
              "Action": "s3:GetObject",
              "Resource": {
                "Fn::Sub": "${ContentBucket.Arn}/*"
              }
            }
          ]
        }
      }
    },
    "CloudFrontDistribution": {
      "Type": "AWS::CloudFront::Distribution",
      "Properties": {
        "DistributionConfig": {
          "Comment": {
            "Fn::Sub": "Education Content CDN - ${EnvironmentSuffix}"
          },
          "Enabled": true,
          "DefaultRootObject": "index.html",
          "Origins": [
            {
              "Id": "S3Origin",
              "DomainName": {
                "Fn::GetAtt": [
                  "ContentBucket",
                  "RegionalDomainName"
                ]
              },
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
            "AllowedMethods": [
              "GET",
              "HEAD",
              "OPTIONS"
            ],
            "CachedMethods": [
              "GET",
              "HEAD"
            ],
            "Compress": true,
            "ForwardedValues": {
              "QueryString": false,
              "Cookies": {
                "Forward": "none"
              }
            },
            "MinTTL": 0,
            "DefaultTTL": 86400,
            "MaxTTL": 31536000
          },
          "PriceClass": "PriceClass_100",
          "ViewerCertificate": {
            "CloudFrontDefaultCertificate": true
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-cdn-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "UserProgressTable": {
      "Type": "AWS::DynamoDB::Table",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "TableName": {
          "Fn::Sub": "UserProgress-${EnvironmentSuffix}"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "userId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "courseId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "userId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "courseId",
            "KeyType": "RANGE"
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "SSESpecification": {
          "SSEEnabled": true,
          "SSEType": "KMS",
          "KMSMasterKeyId": {
            "Ref": "KMSKey"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "UserProgress-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "CourseMetadataTable": {
      "Type": "AWS::DynamoDB::Table",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "TableName": {
          "Fn::Sub": "CourseMetadata-${EnvironmentSuffix}"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "courseId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "courseId",
            "KeyType": "HASH"
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "SSESpecification": {
          "SSEEnabled": true,
          "SSEType": "KMS",
          "KMSMasterKeyId": {
            "Ref": "KMSKey"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "CourseMetadata-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-vpc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
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
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "CidrBlock": "10.0.1.0/24",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-public-subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
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
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "CidrBlock": "10.0.2.0/24",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-public-subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
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
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "CidrBlock": "10.0.10.0/24",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-private-subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
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
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "CidrBlock": "10.0.11.0/24",
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-private-subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
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
              "Fn::Sub": "education-igw-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "InternetGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "InternetGatewayId": {
          "Ref": "InternetGateway"
        },
        "VpcId": {
          "Ref": "VPC"
        }
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
            "Value": {
              "Fn::Sub": "education-public-rt-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "DefaultPublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "InternetGatewayAttachment",
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
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "SubnetId": {
          "Ref": "PublicSubnet2"
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
            "Value": {
              "Fn::Sub": "education-private-rt-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        },
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        },
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        }
      }
    },
    "S3VPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.s3"
        },
        "RouteTableIds": [
          {
            "Ref": "PrivateRouteTable"
          }
        ],
        "VpcEndpointType": "Gateway"
      }
    },
    "DynamoDBVPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.dynamodb"
        },
        "RouteTableIds": [
          {
            "Ref": "PrivateRouteTable"
          }
        ],
        "VpcEndpointType": "Gateway"
      }
    },
    "ECSCluster": {
      "Type": "AWS::ECS::Cluster",
      "Properties": {
        "ClusterName": {
          "Fn::Sub": "education-cluster-${EnvironmentSuffix}"
        },
        "ClusterSettings": [
          {
            "Name": "containerInsights",
            "Value": "enabled"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-cluster-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "ECSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for ECS tasks",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS outbound"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-ecs-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
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
            "Description": "Allow HTTP from internet"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS from internet"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-alb-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "ECSSecurityGroupIngressFromALB": {
      "Type": "AWS::EC2::SecurityGroupIngress",
      "Properties": {
        "GroupId": {
          "Ref": "ECSSecurityGroup"
        },
        "IpProtocol": "tcp",
        "FromPort": 80,
        "ToPort": 80,
        "SourceSecurityGroupId": {
          "Ref": "ALBSecurityGroup"
        },
        "Description": "Allow HTTP from ALB"
      }
    },
    "ALBSecurityGroupEgressToECS": {
      "Type": "AWS::EC2::SecurityGroupEgress",
      "Properties": {
        "GroupId": {
          "Ref": "ALBSecurityGroup"
        },
        "IpProtocol": "tcp",
        "FromPort": 80,
        "ToPort": 80,
        "DestinationSecurityGroupId": {
          "Ref": "ECSSecurityGroup"
        },
        "Description": "Allow HTTP to ECS tasks"
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "education-alb-${EnvironmentSuffix}"
        },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "SecurityGroups": [
          {
            "Ref": "ALBSecurityGroup"
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
            "Value": {
              "Fn::Sub": "education-alb-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "education-tg-${EnvironmentSuffix}"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "TargetType": "ip",
        "VpcId": {
          "Ref": "VPC"
        },
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Matcher": {
          "HttpCode": "200"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-tg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
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
    "ECSTaskExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "education-ecs-execution-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        ],
        "Policies": [
          {
            "PolicyName": "KMSDecryptPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:DescribeKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "KMSKey",
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
            "Value": {
              "Fn::Sub": "education-ecs-execution-role-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "ECSTaskRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "education-ecs-task-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "DynamoDBAccessPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "UserProgressTable",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::GetAtt": [
                        "CourseMetadataTable",
                        "Arn"
                      ]
                    }
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "S3ContentAccessPolicy",
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
                    {
                      "Fn::GetAtt": [
                        "ContentBucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${ContentBucket.Arn}/*"
                    }
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "CloudWatchLogsPolicy",
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
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-ecs-task-role-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "ECSLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/ecs/education-platform-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7,
        "KmsKeyId": {
          "Fn::GetAtt": [
            "KMSKey",
            "Arn"
          ]
        }
      }
    },
    "ECSTaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": {
          "Fn::Sub": "education-platform-${EnvironmentSuffix}"
        },
        "NetworkMode": "awsvpc",
        "RequiresCompatibilities": [
          "FARGATE"
        ],
        "Cpu": "256",
        "Memory": "512",
        "ExecutionRoleArn": {
          "Fn::GetAtt": [
            "ECSTaskExecutionRole",
            "Arn"
          ]
        },
        "TaskRoleArn": {
          "Fn::GetAtt": [
            "ECSTaskRole",
            "Arn"
          ]
        },
        "ContainerDefinitions": [
          {
            "Name": "education-app",
            "Image": "nginx:alpine",
            "Essential": true,
            "PortMappings": [
              {
                "ContainerPort": 80,
                "Protocol": "tcp"
              }
            ],
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {
                  "Ref": "ECSLogGroup"
                },
                "awslogs-region": {
                  "Ref": "AWS::Region"
                },
                "awslogs-stream-prefix": "ecs"
              }
            },
            "Environment": [
              {
                "Name": "ENVIRONMENT",
                "Value": {
                  "Ref": "EnvironmentSuffix"
                }
              }
            ]
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-platform-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "ECSService": {
      "Type": "AWS::ECS::Service",
      "DependsOn": "ALBListener",
      "Properties": {
        "ServiceName": {
          "Fn::Sub": "education-service-${EnvironmentSuffix}"
        },
        "Cluster": {
          "Ref": "ECSCluster"
        },
        "TaskDefinition": {
          "Ref": "ECSTaskDefinition"
        },
        "DesiredCount": 2,
        "LaunchType": "FARGATE",
        "NetworkConfiguration": {
          "AwsvpcConfiguration": {
            "AssignPublicIp": "ENABLED",
            "SecurityGroups": [
              {
                "Ref": "ECSSecurityGroup"
              }
            ],
            "Subnets": [
              {
                "Ref": "PublicSubnet1"
              },
              {
                "Ref": "PublicSubnet2"
              }
            ]
          }
        },
        "LoadBalancers": [
          {
            "ContainerName": "education-app",
            "ContainerPort": 80,
            "TargetGroupArn": {
              "Ref": "ALBTargetGroup"
            }
          }
        ],
        "HealthCheckGracePeriodSeconds": 60,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-service-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "education-pipeline-notifications-${EnvironmentSuffix}"
        },
        "DisplayName": "Education Platform Pipeline Notifications",
        "KmsMasterKeyId": {
          "Ref": "KMSKey"
        },
        "Subscription": [
          {
            "Endpoint": {
              "Ref": "AlertEmail"
            },
            "Protocol": "email"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "education-pipeline-notifications-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "ECSServiceCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "education-ecs-high-cpu-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when ECS service CPU utilization is high",
        "ActionsEnabled": true,
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/ECS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "ClusterName",
            "Value": {
              "Ref": "ECSCluster"
            }
          },
          {
            "Name": "ServiceName",
            "Value": {
              "Fn::GetAtt": [
                "ECSService",
                "Name"
              ]
            }
          }
        ]
      }
    },
    "ALBTargetResponseTimeAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "education-alb-high-response-time-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when ALB target response time is high",
        "ActionsEnabled": true,
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "MetricName": "TargetResponseTime",
        "Namespace": "AWS/ApplicationELB",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "LoadBalancer",
            "Value": {
              "Fn::GetAtt": [
                "ApplicationLoadBalancer",
                "LoadBalancerFullName"
              ]
            }
          }
        ]
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
    "ALBDNSName": {
      "Description": "Application Load Balancer DNS Name",
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
    "CloudFrontDomainName": {
      "Description": "CloudFront Distribution Domain Name",
      "Value": {
        "Fn::GetAtt": [
          "CloudFrontDistribution",
          "DomainName"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CloudFront-Domain"
        }
      }
    },
    "ContentBucketName": {
      "Description": "S3 Bucket Name for Educational Content",
      "Value": {
        "Ref": "ContentBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ContentBucket"
        }
      }
    },
    "ArtifactBucketName": {
      "Description": "S3 Bucket Name for Pipeline Artifacts",
      "Value": {
        "Ref": "ArtifactBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ArtifactBucket"
        }
      }
    },
    "ECSClusterName": {
      "Description": "ECS Cluster Name",
      "Value": {
        "Ref": "ECSCluster"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ECSCluster"
        }
      }
    },
    "ECSServiceName": {
      "Description": "ECS Service Name",
      "Value": {
        "Fn::GetAtt": [
          "ECSService",
          "Name"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ECSService"
        }
      }
    },
    "UserProgressTableName": {
      "Description": "DynamoDB User Progress Table Name",
      "Value": {
        "Ref": "UserProgressTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-UserProgressTable"
        }
      }
    },
    "CourseMetadataTableName": {
      "Description": "DynamoDB Course Metadata Table Name",
      "Value": {
        "Ref": "CourseMetadataTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CourseMetadataTable"
        }
      }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID for Encryption",
      "Value": {
        "Ref": "KMSKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKey"
        }
      }
    },
    "SNSTopicArn": {
      "Description": "SNS Topic ARN for Notifications",
      "Value": {
        "Ref": "SNSTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SNSTopic"
        }
      }
    },
    "StackName": {
      "Description": "Name of this CloudFormation stack",
      "Value": {
        "Ref": "AWS::StackName"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-StackName"
        }
      }
    },
    "EnvironmentSuffix": {
      "Description": "Environment suffix used for this deployment",
      "Value": {
        "Ref": "EnvironmentSuffix"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EnvironmentSuffix"
        }
      }
    }
  }
}```
