# Initial Model Response - CloudFormation Loan Processing Infrastructure

This is the initial AI-generated response with some common issues that need to be fixed.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Loan Processing Application Infrastructure",
  "Parameters": {
    "EnvironmentName": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment name for resource naming"
    },
    "CertificateArn": {
      "Type": "String",
      "Description": "ARN of ACM certificate for HTTPS"
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
            "Value": "LoanProcessingVPC"
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
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": "us-east-2a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "PublicSubnet1"
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
        "CidrBlock": "10.0.10.0/24",
        "AvailabilityZone": "us-east-2a",
        "Tags": [
          {
            "Key": "Name",
            "Value": "PrivateSubnet1"
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
            "Value": "MainIGW"
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
    "DocumentBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Retain",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "loan-documents-${AWS::AccountId}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        }
      }
    },
    "DatabaseCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "Engine": "aurora-postgresql",
        "EngineVersion": "13.7",
        "DatabaseName": "loanprocessing",
        "MasterUsername": "admin",
        "MasterUserPassword": "TempPassword123!",
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "DatabaseSecurityGroup"
          }
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for Aurora",
        "SubnetIds": [
          {
            "Ref": "PrivateSubnet1"
          }
        ]
      }
    },
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Aurora database",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "CidrIp": "0.0.0.0/0"
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": "LoanProcessingALB",
        "Subnets": [
          {
            "Ref": "PublicSubnet1"
          }
        ],
        "SecurityGroups": [
          {
            "Ref": "ALBSecurityGroup"
          }
        ],
        "Scheme": "internet-facing",
        "Type": "application"
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for ALB",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0"
          }
        ]
      }
    },
    "LogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": "/aws/loan-processing",
        "RetentionInDays": 30
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "VPC"
      }
    },
    "BucketName": {
      "Description": "S3 Bucket Name",
      "Value": {
        "Ref": "DocumentBucket"
      }
    }
  }
}
```

## Issues in this response:

1. Missing environmentSuffix in resource names
2. Only 1 subnet per type instead of 3 AZs
3. S3 bucket has Retain deletion policy (not destroyable)
4. S3 bucket missing versioning
5. S3 bucket missing lifecycle policies
6. Database is not Serverless v2
7. Database missing ServerlessV2ScalingConfiguration
8. Database missing KMS encryption
9. Hard-coded password in template (security issue)
10. Database security group allows 0.0.0.0/0 (overly permissive)
11. Missing NAT Gateways
12. Missing route tables for private subnets
13. Missing EC2 auto-scaling configuration
14. Missing target groups for ALB
15. Missing HTTPS listener configuration
16. Log retention is 30 days instead of 365 days
17. Missing IAM roles
18. ALB only has 1 subnet instead of multiple AZs
19. Missing KMS key for database encryption
20. Missing proper resource dependencies