# Blue-Green Deployment Infrastructure - CloudFormation Implementation

This implementation provides a complete blue-green deployment infrastructure for migrating a payment processing system to AWS with zero downtime.

## Architecture Overview

The solution uses CloudFormation nested stacks to create:
- VPC with networking infrastructure
- Aurora MySQL clusters for blue and green environments
- AWS DMS for database replication
- ECS Fargate services for application hosting
- Application Load Balancer with weighted target groups
- Route 53 for DNS-based traffic management
- CloudWatch alarms and Lambda automation
- AWS Backup for disaster recovery
- KMS and Secrets Manager for security
- Systems Manager Parameter Store for configuration

## File: lib/parameters.json

```json
{
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming",
      "Default": "prod"
    },
    "Project": {
      "Type": "String",
      "Description": "Project name for tagging",
      "Default": "PaymentMigration"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center for tagging",
      "Default": "Finance"
    },
    "VpcCidr": {
      "Type": "String",
      "Description": "VPC CIDR block",
      "Default": "10.0.0.0/16"
    },
    "DatabaseMasterUsername": {
      "Type": "String",
      "Description": "Database master username",
      "Default": "dbadmin",
      "NoEcho": true
    },
    "ECSTaskImage": {
      "Type": "String",
      "Description": "Docker image for payment processing application",
      "Default": "nginx:latest"
    },
    "HostedZoneId": {
      "Type": "String",
      "Description": "Route 53 hosted zone ID for DNS management"
    },
    "DomainName": {
      "Type": "String",
      "Description": "Domain name for the application",
      "Default": "payments.example.com"
    }
  }
}
```

## File: lib/master-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Master stack for blue-green payment processing infrastructure",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming"
    },
    "Project": {
      "Type": "String",
      "Description": "Project name for tagging"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center for tagging"
    },
    "VpcCidr": {
      "Type": "String",
      "Description": "VPC CIDR block"
    },
    "DatabaseMasterUsername": {
      "Type": "String",
      "Description": "Database master username",
      "NoEcho": true
    },
    "ECSTaskImage": {
      "Type": "String",
      "Description": "Docker image for payment processing application"
    },
    "HostedZoneId": {
      "Type": "String",
      "Description": "Route 53 hosted zone ID"
    },
    "DomainName": {
      "Type": "String",
      "Description": "Domain name for the application"
    }
  },
  "Resources": {
    "SecurityStack": {
      "Type": "AWS::CloudFormation::Stack",
      "Properties": {
        "TemplateURL": "https://s3.amazonaws.com/your-bucket/security-stack.json",
        "Parameters": {
          "EnvironmentSuffix": { "Ref": "EnvironmentSuffix" },
          "Project": { "Ref": "Project" },
          "CostCenter": { "Ref": "CostCenter" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "NetworkStack": {
      "Type": "AWS::CloudFormation::Stack",
      "Properties": {
        "TemplateURL": "https://s3.amazonaws.com/your-bucket/network-stack.json",
        "Parameters": {
          "EnvironmentSuffix": { "Ref": "EnvironmentSuffix" },
          "VpcCidr": { "Ref": "VpcCidr" },
          "Project": { "Ref": "Project" },
          "CostCenter": { "Ref": "CostCenter" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "DatabaseStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["NetworkStack", "SecurityStack"],
      "Properties": {
        "TemplateURL": "https://s3.amazonaws.com/your-bucket/database-stack.json",
        "Parameters": {
          "EnvironmentSuffix": { "Ref": "EnvironmentSuffix" },
          "VpcId": { "Fn::GetAtt": ["NetworkStack", "Outputs.VpcId"] },
          "PrivateSubnet1": { "Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet1"] },
          "PrivateSubnet2": { "Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet2"] },
          "PrivateSubnet3": { "Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet3"] },
          "DatabaseSecurityGroup": { "Fn::GetAtt": ["NetworkStack", "Outputs.DatabaseSecurityGroup"] },
          "KMSKeyId": { "Fn::GetAtt": ["SecurityStack", "Outputs.KMSKeyId"] },
          "DatabaseMasterUsername": { "Ref": "DatabaseMasterUsername" },
          "Project": { "Ref": "Project" },
          "CostCenter": { "Ref": "CostCenter" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "DMSStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["DatabaseStack"],
      "Properties": {
        "TemplateURL": "https://s3.amazonaws.com/your-bucket/dms-stack.json",
        "Parameters": {
          "EnvironmentSuffix": { "Ref": "EnvironmentSuffix" },
          "VpcId": { "Fn::GetAtt": ["NetworkStack", "Outputs.VpcId"] },
          "PrivateSubnet1": { "Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet1"] },
          "PrivateSubnet2": { "Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet2"] },
          "DMSSecurityGroup": { "Fn::GetAtt": ["NetworkStack", "Outputs.DMSSecurityGroup"] },
          "BlueDBEndpoint": { "Fn::GetAtt": ["DatabaseStack", "Outputs.BlueDBEndpoint"] },
          "GreenDBEndpoint": { "Fn::GetAtt": ["DatabaseStack", "Outputs.GreenDBEndpoint"] },
          "BlueDBSecretArn": { "Fn::GetAtt": ["DatabaseStack", "Outputs.BlueDBSecretArn"] },
          "GreenDBSecretArn": { "Fn::GetAtt": ["DatabaseStack", "Outputs.GreenDBSecretArn"] },
          "Project": { "Ref": "Project" },
          "CostCenter": { "Ref": "CostCenter" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "ECSStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["NetworkStack", "DatabaseStack"],
      "Properties": {
        "TemplateURL": "https://s3.amazonaws.com/your-bucket/ecs-stack.json",
        "Parameters": {
          "EnvironmentSuffix": { "Ref": "EnvironmentSuffix" },
          "VpcId": { "Fn::GetAtt": ["NetworkStack", "Outputs.VpcId"] },
          "PrivateSubnet1": { "Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet1"] },
          "PrivateSubnet2": { "Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet2"] },
          "PrivateSubnet3": { "Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet3"] },
          "ECSSecurityGroup": { "Fn::GetAtt": ["NetworkStack", "Outputs.ECSSecurityGroup"] },
          "ECSTaskImage": { "Ref": "ECSTaskImage" },
          "BlueDBEndpoint": { "Fn::GetAtt": ["DatabaseStack", "Outputs.BlueDBEndpoint"] },
          "GreenDBEndpoint": { "Fn::GetAtt": ["DatabaseStack", "Outputs.GreenDBEndpoint"] },
          "BlueDBSecretArn": { "Fn::GetAtt": ["DatabaseStack", "Outputs.BlueDBSecretArn"] },
          "GreenDBSecretArn": { "Fn::GetAtt": ["DatabaseStack", "Outputs.GreenDBSecretArn"] },
          "Project": { "Ref": "Project" },
          "CostCenter": { "Ref": "CostCenter" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "ALBStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["NetworkStack", "ECSStack"],
      "Properties": {
        "TemplateURL": "https://s3.amazonaws.com/your-bucket/alb-stack.json",
        "Parameters": {
          "EnvironmentSuffix": { "Ref": "EnvironmentSuffix" },
          "VpcId": { "Fn::GetAtt": ["NetworkStack", "Outputs.VpcId"] },
          "PublicSubnet1": { "Fn::GetAtt": ["NetworkStack", "Outputs.PublicSubnet1"] },
          "PublicSubnet2": { "Fn::GetAtt": ["NetworkStack", "Outputs.PublicSubnet2"] },
          "PublicSubnet3": { "Fn::GetAtt": ["NetworkStack", "Outputs.PublicSubnet3"] },
          "ALBSecurityGroup": { "Fn::GetAtt": ["NetworkStack", "Outputs.ALBSecurityGroup"] },
          "BlueECSService": { "Fn::GetAtt": ["ECSStack", "Outputs.BlueECSService"] },
          "GreenECSService": { "Fn::GetAtt": ["ECSStack", "Outputs.GreenECSService"] },
          "Project": { "Ref": "Project" },
          "CostCenter": { "Ref": "CostCenter" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "Route53Stack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["ALBStack"],
      "Properties": {
        "TemplateURL": "https://s3.amazonaws.com/your-bucket/route53-stack.json",
        "Parameters": {
          "EnvironmentSuffix": { "Ref": "EnvironmentSuffix" },
          "HostedZoneId": { "Ref": "HostedZoneId" },
          "DomainName": { "Ref": "DomainName" },
          "ALBDNSName": { "Fn::GetAtt": ["ALBStack", "Outputs.ALBDNSName"] },
          "ALBHostedZoneId": { "Fn::GetAtt": ["ALBStack", "Outputs.ALBHostedZoneId"] },
          "Project": { "Ref": "Project" },
          "CostCenter": { "Ref": "CostCenter" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "MonitoringStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["DatabaseStack", "ECSStack", "ALBStack", "DMSStack"],
      "Properties": {
        "TemplateURL": "https://s3.amazonaws.com/your-bucket/monitoring-stack.json",
        "Parameters": {
          "EnvironmentSuffix": { "Ref": "EnvironmentSuffix" },
          "BlueDBCluster": { "Fn::GetAtt": ["DatabaseStack", "Outputs.BlueDBClusterId"] },
          "GreenDBCluster": { "Fn::GetAtt": ["DatabaseStack", "Outputs.GreenDBClusterId"] },
          "BlueECSService": { "Fn::GetAtt": ["ECSStack", "Outputs.BlueECSService"] },
          "GreenECSService": { "Fn::GetAtt": ["ECSStack", "Outputs.GreenECSService"] },
          "ALBTargetGroup": { "Fn::GetAtt": ["ALBStack", "Outputs.BlueTargetGroup"] },
          "DMSReplicationTask": { "Fn::GetAtt": ["DMSStack", "Outputs.ReplicationTaskArn"] },
          "Project": { "Ref": "Project" },
          "CostCenter": { "Ref": "CostCenter" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "AutomationStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["ALBStack", "MonitoringStack"],
      "Properties": {
        "TemplateURL": "https://s3.amazonaws.com/your-bucket/automation-stack.json",
        "Parameters": {
          "EnvironmentSuffix": { "Ref": "EnvironmentSuffix" },
          "BlueTargetGroup": { "Fn::GetAtt": ["ALBStack", "Outputs.BlueTargetGroup"] },
          "GreenTargetGroup": { "Fn::GetAtt": ["ALBStack", "Outputs.GreenTargetGroup"] },
          "ALBListenerArn": { "Fn::GetAtt": ["ALBStack", "Outputs.ListenerArn"] },
          "BlueHealthAlarm": { "Fn::GetAtt": ["MonitoringStack", "Outputs.BlueHealthAlarm"] },
          "GreenHealthAlarm": { "Fn::GetAtt": ["MonitoringStack", "Outputs.GreenHealthAlarm"] },
          "Project": { "Ref": "Project" },
          "CostCenter": { "Ref": "CostCenter" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "BackupStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["DatabaseStack"],
      "Properties": {
        "TemplateURL": "https://s3.amazonaws.com/your-bucket/backup-stack.json",
        "Parameters": {
          "EnvironmentSuffix": { "Ref": "EnvironmentSuffix" },
          "BlueDBCluster": { "Fn::GetAtt": ["DatabaseStack", "Outputs.BlueDBClusterId"] },
          "GreenDBCluster": { "Fn::GetAtt": ["DatabaseStack", "Outputs.GreenDBClusterId"] },
          "KMSKeyId": { "Fn::GetAtt": ["SecurityStack", "Outputs.KMSKeyId"] },
          "Project": { "Ref": "Project" },
          "CostCenter": { "Ref": "CostCenter" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "SSMParameterStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["DatabaseStack", "ALBStack"],
      "Properties": {
        "TemplateURL": "https://s3.amazonaws.com/your-bucket/ssm-parameter-stack.json",
        "Parameters": {
          "EnvironmentSuffix": { "Ref": "EnvironmentSuffix" },
          "BlueDBEndpoint": { "Fn::GetAtt": ["DatabaseStack", "Outputs.BlueDBEndpoint"] },
          "GreenDBEndpoint": { "Fn::GetAtt": ["DatabaseStack", "Outputs.GreenDBEndpoint"] },
          "ALBDNSName": { "Fn::GetAtt": ["ALBStack", "Outputs.ALBDNSName"] },
          "Project": { "Ref": "Project" },
          "CostCenter": { "Ref": "CostCenter" }
        },
        "Tags": [
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    }
  },
  "Outputs": {
    "VpcId": {
      "Description": "VPC ID",
      "Value": { "Fn::GetAtt": ["NetworkStack", "Outputs.VpcId"] }
    },
    "BlueDBEndpoint": {
      "Description": "Blue environment database endpoint",
      "Value": { "Fn::GetAtt": ["DatabaseStack", "Outputs.BlueDBEndpoint"] }
    },
    "GreenDBEndpoint": {
      "Description": "Green environment database endpoint",
      "Value": { "Fn::GetAtt": ["DatabaseStack", "Outputs.GreenDBEndpoint"] }
    },
    "ALBDNSName": {
      "Description": "Application Load Balancer DNS name",
      "Value": { "Fn::GetAtt": ["ALBStack", "Outputs.ALBDNSName"] }
    },
    "ApplicationURL": {
      "Description": "Application URL",
      "Value": { "Fn::Sub": "https://${DomainName}" }
    }
  }
}
```

## File: lib/nested-stacks/security-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Security resources including KMS keys and Secrets Manager",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming"
    },
    "Project": {
      "Type": "String",
      "Description": "Project name for tagging"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center for tagging"
    }
  },
  "Resources": {
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Description": { "Fn::Sub": "KMS key for encryption-${EnvironmentSuffix}" },
        "EnableKeyRotation": true,
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
            },
            {
              "Sid": "Allow services to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "rds.amazonaws.com",
                  "backup.amazonaws.com",
                  "dms.amazonaws.com",
                  "secretsmanager.amazonaws.com"
                ]
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey",
                "kms:CreateGrant"
              ],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          { "Key": "Name", { "Fn::Sub": "kms-key-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": { "Fn::Sub": "alias/payment-system-${EnvironmentSuffix}" },
        "TargetKeyId": { "Ref": "KMSKey" }
      }
    }
  },
  "Outputs": {
    "KMSKeyId": {
      "Description": "KMS Key ID",
      "Value": { "Ref": "KMSKey" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-KMSKeyId" }
      }
    },
    "KMSKeyArn": {
      "Description": "KMS Key ARN",
      "Value": { "Fn::GetAtt": ["KMSKey", "Arn"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-KMSKeyArn" }
      }
    }
  }
}
```

## File: lib/nested-stacks/network-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "VPC and networking infrastructure",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming"
    },
    "VpcCidr": {
      "Type": "String",
      "Description": "VPC CIDR block"
    },
    "Project": {
      "Type": "String",
      "Description": "Project name for tagging"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center for tagging"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": { "Ref": "VpcCidr" },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "vpc-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "igw-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
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
        "CidrBlock": { "Fn::Select": [0, { "Fn::Cidr": [{ "Ref": "VpcCidr" }, 6, 8] }] },
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "public-subnet-1-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Fn::Select": [1, { "Fn::Cidr": [{ "Ref": "VpcCidr" }, 6, 8] }] },
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "public-subnet-2-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Fn::Select": [2, { "Fn::Cidr": [{ "Ref": "VpcCidr" }, 6, 8] }] },
        "AvailabilityZone": { "Fn::Select": [2, { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "public-subnet-3-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Fn::Select": [3, { "Fn::Cidr": [{ "Ref": "VpcCidr" }, 6, 8] }] },
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "private-subnet-1-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Fn::Select": [4, { "Fn::Cidr": [{ "Ref": "VpcCidr" }, 6, 8] }] },
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "private-subnet-2-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Fn::Select": [5, { "Fn::Cidr": [{ "Ref": "VpcCidr" }, 6, 8] }] },
        "AvailabilityZone": { "Fn::Select": [2, { "Fn::GetAZs": "" }] },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "private-subnet-3-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "NATGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "nat-eip-1-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "NATGateway2EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "nat-eip-2-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "NATGateway3EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "nat-eip-3-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["NATGateway1EIP", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet1" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "nat-gateway-1-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "NATGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["NATGateway2EIP", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet2" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "nat-gateway-2-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "NATGateway3": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["NATGateway3EIP", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet3" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "nat-gateway-3-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "public-rt-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
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
    "PublicSubnetRouteTableAssociation3": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet3" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "private-rt-1-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable1" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NATGateway1" }
      }
    },
    "PrivateSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet1" },
        "RouteTableId": { "Ref": "PrivateRouteTable1" }
      }
    },
    "PrivateRouteTable2": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "private-rt-2-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable2" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NATGateway2" }
      }
    },
    "PrivateSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet2" },
        "RouteTableId": { "Ref": "PrivateRouteTable2" }
      }
    },
    "PrivateRouteTable3": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "private-rt-3-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "PrivateRoute3": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable3" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NATGateway3" }
      }
    },
    "PrivateSubnetRouteTableAssociation3": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet3" },
        "RouteTableId": { "Ref": "PrivateRouteTable3" }
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
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "alb-sg-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "ECSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for ECS tasks",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 8080,
            "ToPort": 8080,
            "SourceSecurityGroupId": { "Ref": "ALBSecurityGroup" }
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "ecs-sg-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Aurora databases",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": { "Ref": "ECSSecurityGroup" }
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": { "Ref": "DMSSecurityGroup" }
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "database-sg-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "DMSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for DMS replication instance",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "dms-sg-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    }
  },
  "Outputs": {
    "VpcId": {
      "Description": "VPC ID",
      "Value": { "Ref": "VPC" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-VpcId" }
      }
    },
    "PublicSubnet1": {
      "Description": "Public Subnet 1",
      "Value": { "Ref": "PublicSubnet1" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PublicSubnet1" }
      }
    },
    "PublicSubnet2": {
      "Description": "Public Subnet 2",
      "Value": { "Ref": "PublicSubnet2" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PublicSubnet2" }
      }
    },
    "PublicSubnet3": {
      "Description": "Public Subnet 3",
      "Value": { "Ref": "PublicSubnet3" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PublicSubnet3" }
      }
    },
    "PrivateSubnet1": {
      "Description": "Private Subnet 1",
      "Value": { "Ref": "PrivateSubnet1" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PrivateSubnet1" }
      }
    },
    "PrivateSubnet2": {
      "Description": "Private Subnet 2",
      "Value": { "Ref": "PrivateSubnet2" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PrivateSubnet2" }
      }
    },
    "PrivateSubnet3": {
      "Description": "Private Subnet 3",
      "Value": { "Ref": "PrivateSubnet3" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PrivateSubnet3" }
      }
    },
    "ALBSecurityGroup": {
      "Description": "ALB Security Group",
      "Value": { "Ref": "ALBSecurityGroup" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-ALBSecurityGroup" }
      }
    },
    "ECSSecurityGroup": {
      "Description": "ECS Security Group",
      "Value": { "Ref": "ECSSecurityGroup" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-ECSSecurityGroup" }
      }
    },
    "DatabaseSecurityGroup": {
      "Description": "Database Security Group",
      "Value": { "Ref": "DatabaseSecurityGroup" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-DatabaseSecurityGroup" }
      }
    },
    "DMSSecurityGroup": {
      "Description": "DMS Security Group",
      "Value": { "Ref": "DMSSecurityGroup" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-DMSSecurityGroup" }
      }
    }
  }
}
```

Due to the length and complexity of this implementation, I'll continue with the remaining nested stack files. Let me create the database stack next:

## File: lib/nested-stacks/database-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Aurora MySQL clusters for blue and green environments",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming"
    },
    "VpcId": {
      "Type": "String",
      "Description": "VPC ID"
    },
    "PrivateSubnet1": {
      "Type": "String",
      "Description": "Private Subnet 1"
    },
    "PrivateSubnet2": {
      "Type": "String",
      "Description": "Private Subnet 2"
    },
    "PrivateSubnet3": {
      "Type": "String",
      "Description": "Private Subnet 3"
    },
    "DatabaseSecurityGroup": {
      "Type": "String",
      "Description": "Database Security Group"
    },
    "KMSKeyId": {
      "Type": "String",
      "Description": "KMS Key ID for encryption"
    },
    "DatabaseMasterUsername": {
      "Type": "String",
      "Description": "Database master username",
      "NoEcho": true
    },
    "Project": {
      "Type": "String",
      "Description": "Project name for tagging"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center for tagging"
    }
  },
  "Resources": {
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": { "Fn::Sub": "Subnet group for databases-${EnvironmentSuffix}" },
        "SubnetIds": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" },
          { "Ref": "PrivateSubnet3" }
        ],
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "db-subnet-group-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": { "Ref": "EnvironmentSuffix" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "BlueDBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": { "Fn::Sub": "blue-db-credentials-${EnvironmentSuffix}" },
        "Description": "Blue environment database credentials",
        "GenerateSecretString": {
          "SecretStringTemplate": { "Fn::Sub": "{\"username\":\"${DatabaseMasterUsername}\"}" },
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "KmsKeyId": { "Ref": "KMSKeyId" },
        "Tags": [
          { "Key": "Environment", "Value": "blue" },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "BlueDBSecretRotationSchedule": {
      "Type": "AWS::SecretsManager::RotationSchedule",
      "DependsOn": ["BlueDBCluster"],
      "Properties": {
        "SecretId": { "Ref": "BlueDBSecret" },
        "RotationLambdaARN": { "Fn::Sub": "arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:rotation-lambda" },
        "RotationRules": {
          "AutomaticallyAfterDays": 30
        }
      }
    },
    "GreenDBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": { "Fn::Sub": "green-db-credentials-${EnvironmentSuffix}" },
        "Description": "Green environment database credentials",
        "GenerateSecretString": {
          "SecretStringTemplate": { "Fn::Sub": "{\"username\":\"${DatabaseMasterUsername}\"}" },
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "KmsKeyId": { "Ref": "KMSKeyId" },
        "Tags": [
          { "Key": "Environment", "Value": "green" },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "GreenDBSecretRotationSchedule": {
      "Type": "AWS::SecretsManager::RotationSchedule",
      "DependsOn": ["GreenDBCluster"],
      "Properties": {
        "SecretId": { "Ref": "GreenDBSecret" },
        "RotationLambdaARN": { "Fn::Sub": "arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:rotation-lambda" },
        "RotationRules": {
          "AutomaticallyAfterDays": 30
        }
      }
    },
    "BlueDBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.05.2",
        "DatabaseName": "paymentdb",
        "MasterUsername": { "Fn::Sub": "{{resolve:secretsmanager:${BlueDBSecret}:SecretString:username}}" },
        "MasterUserPassword": { "Fn::Sub": "{{resolve:secretsmanager:${BlueDBSecret}:SecretString:password}}" },
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "VpcSecurityGroupIds": [{ "Ref": "DatabaseSecurityGroup" }],
        "StorageEncrypted": true,
        "KmsKeyId": { "Ref": "KMSKeyId" },
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": ["error", "general", "slowquery"],
        "DeletionProtection": false,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "blue-db-cluster-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": "blue" },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "BlueDBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": { "Ref": "BlueDBCluster" },
        "DBInstanceClass": "db.r5.large",
        "PubliclyAccessible": false,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "blue-db-instance-1-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": "blue" },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "BlueDBInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": { "Ref": "BlueDBCluster" },
        "DBInstanceClass": "db.r5.large",
        "PubliclyAccessible": false,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "blue-db-instance-2-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": "blue" },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "GreenDBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.05.2",
        "DatabaseName": "paymentdb",
        "MasterUsername": { "Fn::Sub": "{{resolve:secretsmanager:${GreenDBSecret}:SecretString:username}}" },
        "MasterUserPassword": { "Fn::Sub": "{{resolve:secretsmanager:${GreenDBSecret}:SecretString:password}}" },
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "VpcSecurityGroupIds": [{ "Ref": "DatabaseSecurityGroup" }],
        "StorageEncrypted": true,
        "KmsKeyId": { "Ref": "KMSKeyId" },
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": ["error", "general", "slowquery"],
        "DeletionProtection": false,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "green-db-cluster-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": "green" },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "GreenDBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": { "Ref": "GreenDBCluster" },
        "DBInstanceClass": "db.r5.large",
        "PubliclyAccessible": false,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "green-db-instance-1-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": "green" },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },
    "GreenDBInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": { "Ref": "GreenDBCluster" },
        "DBInstanceClass": "db.r5.large",
        "PubliclyAccessible": false,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "green-db-instance-2-${EnvironmentSuffix}" } },
          { "Key": "Environment", "Value": "green" },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    }
  },
  "Outputs": {
    "BlueDBClusterId": {
      "Description": "Blue database cluster ID",
      "Value": { "Ref": "BlueDBCluster" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-BlueDBClusterId" }
      }
    },
    "BlueDBEndpoint": {
      "Description": "Blue database endpoint",
      "Value": { "Fn::GetAtt": ["BlueDBCluster", "Endpoint.Address"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-BlueDBEndpoint" }
      }
    },
    "BlueDBSecretArn": {
      "Description": "Blue database secret ARN",
      "Value": { "Ref": "BlueDBSecret" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-BlueDBSecretArn" }
      }
    },
    "GreenDBClusterId": {
      "Description": "Green database cluster ID",
      "Value": { "Ref": "GreenDBCluster" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-GreenDBClusterId" }
      }
    },
    "GreenDBEndpoint": {
      "Description": "Green database endpoint",
      "Value": { "Fn::GetAtt": ["GreenDBCluster", "Endpoint.Address"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-GreenDBEndpoint" }
      }
    },
    "GreenDBSecretArn": {
      "Description": "Green database secret ARN",
      "Value": { "Ref": "GreenDBSecret" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-GreenDBSecretArn" }
      }
    }
  }
}
```

This implementation is getting very long. Let me create a continuation file with the remaining stacks (DMS, ECS, ALB, Route53, Monitoring, Automation, Backup, and SSM Parameter Store).
