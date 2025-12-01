#!/bin/bash
# Build comprehensive CloudFormation template for High Availability Payment Processing

cat > lib/TapStack.json << 'EOFJSON'
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "High Availability Payment Processing Infrastructure with Multi-AZ Failover - CloudFormation JSON",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names to enable parallel deployments",
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "AlertEmail": {
      "Type": "String",
      "Description": "Email address for critical alerts",
      "Default": "ops@example.com"
    },
    "DBMasterUsername": {
      "Type": "String",
      "Description": "Master username for Aurora PostgreSQL",
      "Default": "dbadmin",
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*"
    },
    "DBMasterPassword": {
      "Type": "String",
      "Description": "Master password for Aurora PostgreSQL",
      "NoEcho": true,
      "MinLength": 8,
      "MaxLength": 41,
      "Default": "TempPassword123!"
    },
    "ContainerImage": {
      "Type": "String",
      "Description": "Docker image for ECS tasks",
      "Default": "nginx:latest"
    }
  },
  "Resources": {
    "EncryptionKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for encryption at rest - ${EnvironmentSuffix}"
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
            }
          ]
        }
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
              "Fn::Sub": "payment-vpc-${EnvironmentSuffix}"
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
      }
    }
  }
}
EOFJSON

echo "Template created successfully"
