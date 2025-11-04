# Multi-Environment Infrastructure Migration - CloudFormation Implementation

This implementation provides a complete CloudFormation solution for migrating a legacy application to AWS using a nested stack architecture. The solution supports multiple environments (dev, staging, production) with environment-specific configurations.

## Architecture Overview

The solution uses CloudFormation nested stacks to organize infrastructure into logical components:
- **Main Stack**: Orchestrates all nested stacks and passes parameters
- **Networking Stack**: ALB, target groups, and security groups
- **Compute Stack**: ECS cluster, task definitions, and services
- **Database Stack**: RDS PostgreSQL with conditional Multi-AZ
- **Monitoring Stack**: CloudWatch log groups and Route53 health checks
- **Secrets Stack**: AWS Secrets Manager for credentials

## File: lib/main-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Main stack for multi-environment application infrastructure migration",
  "Parameters": {
    "EnvironmentName": {
      "Type": "String",
      "Description": "Environment name (dev, staging, prod)",
      "AllowedValues": ["dev", "staging", "prod"]
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to avoid conflicts",
      "MinLength": 3,
      "MaxLength": 20
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "Existing VPC ID for the environment"
    },
    "PrivateSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Description": "List of private subnet IDs for ECS tasks and RDS"
    },
    "PublicSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Description": "List of public subnet IDs for Application Load Balancer"
    },
    "ProjectName": {
      "Type": "String",
      "Default": "app-migration",
      "Description": "Project name for tagging"
    },
    "CostCenter": {
      "Type": "String",
      "Default": "engineering",
      "Description": "Cost center for billing"
    },
    "HostedZoneId": {
      "Type": "String",
      "Description": "Route53 hosted zone ID for DNS records"
    },
    "DomainName": {
      "Type": "String",
      "Description": "Domain name for the application (e.g., example.com)"
    },
    "NestedStacksBucketName": {
      "Type": "String",
      "Description": "S3 bucket name where nested stack templates are stored"
    }
  },
  "Mappings": {
    "EnvironmentConfig": {
      "dev": {
        "ECSTaskCPU": "512",
        "ECSTaskMemory": "1024",
        "ECSDesiredCount": "1",
        "DBInstanceClass": "db.t3.micro",
        "DBAllocatedStorage": "20",
        "DBMultiAZ": "false",
        "LogRetentionDays": "7",
        "EnableTerminationProtection": "false"
      },
      "staging": {
        "ECSTaskCPU": "1024",
        "ECSTaskMemory": "2048",
        "ECSDesiredCount": "2",
        "DBInstanceClass": "db.t3.small",
        "DBAllocatedStorage": "50",
        "DBMultiAZ": "false",
        "LogRetentionDays": "30",
        "EnableTerminationProtection": "false"
      },
      "prod": {
        "ECSTaskCPU": "2048",
        "ECSTaskMemory": "4096",
        "ECSDesiredCount": "3",
        "DBInstanceClass": "db.r5.large",
        "DBAllocatedStorage": "100",
        "DBMultiAZ": "true",
        "LogRetentionDays": "90",
        "EnableTerminationProtection": "true"
      }
    }
  },
  "Resources": {
    "SecretsStack": {
      "Type": "AWS::CloudFormation::Stack",
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${NestedStacksBucketName}.s3.amazonaws.com/secrets-stack.json"
        },
        "Parameters": {
          "EnvironmentSuffix": {"Ref": "EnvironmentSuffix"},
          "EnvironmentName": {"Ref": "EnvironmentName"},
          "ProjectName": {"Ref": "ProjectName"}
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "NetworkingStack": {
      "Type": "AWS::CloudFormation::Stack",
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${NestedStacksBucketName}.s3.amazonaws.com/networking-stack.json"
        },
        "Parameters": {
          "EnvironmentSuffix": {"Ref": "EnvironmentSuffix"},
          "EnvironmentName": {"Ref": "EnvironmentName"},
          "VpcId": {"Ref": "VpcId"},
          "PublicSubnetIds": {
            "Fn::Join": [",", {"Ref": "PublicSubnetIds"}]
          },
          "ProjectName": {"Ref": "ProjectName"},
          "CostCenter": {"Ref": "CostCenter"}
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "DatabaseStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["NetworkingStack", "SecretsStack"],
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${NestedStacksBucketName}.s3.amazonaws.com/database-stack.json"
        },
        "Parameters": {
          "EnvironmentSuffix": {"Ref": "EnvironmentSuffix"},
          "EnvironmentName": {"Ref": "EnvironmentName"},
          "VpcId": {"Ref": "VpcId"},
          "PrivateSubnetIds": {
            "Fn::Join": [",", {"Ref": "PrivateSubnetIds"}]
          },
          "DBSecurityGroupId": {
            "Fn::GetAtt": ["NetworkingStack", "Outputs.DBSecurityGroupId"]
          },
          "DBInstanceClass": {
            "Fn::FindInMap": ["EnvironmentConfig", {"Ref": "EnvironmentName"}, "DBInstanceClass"]
          },
          "DBAllocatedStorage": {
            "Fn::FindInMap": ["EnvironmentConfig", {"Ref": "EnvironmentName"}, "DBAllocatedStorage"]
          },
          "DBMultiAZ": {
            "Fn::FindInMap": ["EnvironmentConfig", {"Ref": "EnvironmentName"}, "DBMultiAZ"]
          },
          "DBMasterPasswordSecretArn": {
            "Fn::GetAtt": ["SecretsStack", "Outputs.DBMasterPasswordSecretArn"]
          },
          "ProjectName": {"Ref": "ProjectName"},
          "CostCenter": {"Ref": "CostCenter"}
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "ComputeStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["NetworkingStack", "DatabaseStack", "SecretsStack"],
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${NestedStacksBucketName}.s3.amazonaws.com/compute-stack.json"
        },
        "Parameters": {
          "EnvironmentSuffix": {"Ref": "EnvironmentSuffix"},
          "EnvironmentName": {"Ref": "EnvironmentName"},
          "VpcId": {"Ref": "VpcId"},
          "PrivateSubnetIds": {
            "Fn::Join": [",", {"Ref": "PrivateSubnetIds"}]
          },
          "ECSSecurityGroupId": {
            "Fn::GetAtt": ["NetworkingStack", "Outputs.ECSSecurityGroupId"]
          },
          "ALBTargetGroupArn": {
            "Fn::GetAtt": ["NetworkingStack", "Outputs.ALBTargetGroupArn"]
          },
          "ECSTaskCPU": {
            "Fn::FindInMap": ["EnvironmentConfig", {"Ref": "EnvironmentName"}, "ECSTaskCPU"]
          },
          "ECSTaskMemory": {
            "Fn::FindInMap": ["EnvironmentConfig", {"Ref": "EnvironmentName"}, "ECSTaskMemory"]
          },
          "ECSDesiredCount": {
            "Fn::FindInMap": ["EnvironmentConfig", {"Ref": "EnvironmentName"}, "ECSDesiredCount"]
          },
          "LogRetentionDays": {
            "Fn::FindInMap": ["EnvironmentConfig", {"Ref": "EnvironmentName"}, "LogRetentionDays"]
          },
          "DBEndpoint": {
            "Fn::GetAtt": ["DatabaseStack", "Outputs.DBEndpoint"]
          },
          "DBMasterPasswordSecretArn": {
            "Fn::GetAtt": ["SecretsStack", "Outputs.DBMasterPasswordSecretArn"]
          },
          "AppSecretsArn": {
            "Fn::GetAtt": ["SecretsStack", "Outputs.AppSecretsArn"]
          },
          "ProjectName": {"Ref": "ProjectName"},
          "CostCenter": {"Ref": "CostCenter"}
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "MonitoringStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["NetworkingStack", "ComputeStack"],
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${NestedStacksBucketName}.s3.amazonaws.com/monitoring-stack.json"
        },
        "Parameters": {
          "EnvironmentSuffix": {"Ref": "EnvironmentSuffix"},
          "EnvironmentName": {"Ref": "EnvironmentName"},
          "HostedZoneId": {"Ref": "HostedZoneId"},
          "DomainName": {"Ref": "DomainName"},
          "ALBDNSName": {
            "Fn::GetAtt": ["NetworkingStack", "Outputs.ALBDNSName"]
          },
          "ALBHostedZoneId": {
            "Fn::GetAtt": ["NetworkingStack", "Outputs.ALBHostedZoneId"]
          },
          "ECSClusterName": {
            "Fn::GetAtt": ["ComputeStack", "Outputs.ECSClusterName"]
          },
          "ECSServiceName": {
            "Fn::GetAtt": ["ComputeStack", "Outputs.ECSServiceName"]
          },
          "ProjectName": {"Ref": "ProjectName"},
          "CostCenter": {"Ref": "CostCenter"}
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    }
  },
  "Outputs": {
    "StackName": {
      "Description": "Name of the main CloudFormation stack",
      "Value": {"Ref": "AWS::StackName"}
    },
    "ApplicationURL": {
      "Description": "Application URL",
      "Value": {
        "Fn::Sub": [
          "http://${SubDomain}.${Domain}",
          {
            "SubDomain": {"Fn::Sub": "app-${EnvironmentName}"},
            "Domain": {"Ref": "DomainName"}
          }
        ]
      }
    },
    "ALBDNSName": {
      "Description": "Application Load Balancer DNS name",
      "Value": {"Fn::GetAtt": ["NetworkingStack", "Outputs.ALBDNSName"]}
    },
    "ECSClusterName": {
      "Description": "ECS cluster name",
      "Value": {"Fn::GetAtt": ["ComputeStack", "Outputs.ECSClusterName"]}
    },
    "ECRRepositoryURI": {
      "Description": "ECR repository URI for Docker images",
      "Value": {"Fn::GetAtt": ["ComputeStack", "Outputs.ECRRepositoryURI"]}
    },
    "DBEndpoint": {
      "Description": "RDS database endpoint",
      "Value": {"Fn::GetAtt": ["DatabaseStack", "Outputs.DBEndpoint"]}
    },
    "DBName": {
      "Description": "Database name",
      "Value": {"Fn::GetAtt": ["DatabaseStack", "Outputs.DBName"]}
    }
  }
}
```

## File: lib/secrets-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secrets Manager stack for database credentials and application secrets",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming"
    },
    "EnvironmentName": {
      "Type": "String",
      "Description": "Environment name (dev, staging, prod)"
    },
    "ProjectName": {
      "Type": "String",
      "Description": "Project name for tagging"
    }
  },
  "Resources": {
    "DBMasterPasswordSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "db-master-password-${EnvironmentSuffix}"
        },
        "Description": "RDS PostgreSQL master password",
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\":\"dbadmin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\",
          "RequireEachIncludedType": true
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "AppSecrets": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "app-secrets-${EnvironmentSuffix}"
        },
        "Description": "Application secrets and API keys",
        "SecretString": "{\"api_key\":\"changeme\",\"jwt_secret\":\"changeme\"}",
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    }
  },
  "Outputs": {
    "DBMasterPasswordSecretArn": {
      "Description": "ARN of database master password secret",
      "Value": {"Ref": "DBMasterPasswordSecret"}
    },
    "AppSecretsArn": {
      "Description": "ARN of application secrets",
      "Value": {"Ref": "AppSecrets"}
    }
  }
}
```

## File: lib/networking-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Networking stack with ALB, target groups, and security groups",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming"
    },
    "EnvironmentName": {
      "Type": "String",
      "Description": "Environment name (dev, staging, prod)"
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "VPC ID"
    },
    "PublicSubnetIds": {
      "Type": "CommaDelimitedList",
      "Description": "List of public subnet IDs for ALB"
    },
    "ProjectName": {
      "Type": "String",
      "Description": "Project name for tagging"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center for billing"
    }
  },
  "Resources": {
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "alb-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {"Ref": "VpcId"},
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
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 8080,
            "ToPort": 8080,
            "DestinationSecurityGroupId": {"Ref": "ECSSecurityGroup"},
            "Description": "Allow traffic to ECS tasks"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "alb-sg-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "ECSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "ecs-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for ECS tasks",
        "VpcId": {"Ref": "VpcId"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 8080,
            "ToPort": 8080,
            "SourceSecurityGroupId": {"Ref": "ALBSecurityGroup"},
            "Description": "Allow traffic from ALB"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS to AWS services (ECR, Secrets Manager)"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "DestinationSecurityGroupId": {"Ref": "DBSecurityGroup"},
            "Description": "Allow traffic to RDS PostgreSQL"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "ecs-sg-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "db-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for RDS PostgreSQL",
        "VpcId": {"Ref": "VpcId"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": {"Ref": "ECSSecurityGroup"},
            "Description": "Allow PostgreSQL from ECS tasks"
          }
        ],
        "SecurityGroupEgress": [],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "db-sg-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "alb-${EnvironmentSuffix}"
        },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": {"Ref": "PublicSubnetIds"},
        "SecurityGroups": [{"Ref": "ALBSecurityGroup"}],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "alb-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "tg-${EnvironmentSuffix}"
        },
        "Port": 8080,
        "Protocol": "HTTP",
        "TargetType": "ip",
        "VpcId": {"Ref": "VpcId"},
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Matcher": {
          "HttpCode": "200,301,302"
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "tg-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {"Ref": "ApplicationLoadBalancer"},
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {"Ref": "ALBTargetGroup"}
          }
        ]
      }
    }
  },
  "Outputs": {
    "ALBSecurityGroupId": {
      "Description": "Security group ID for ALB",
      "Value": {"Ref": "ALBSecurityGroup"}
    },
    "ECSSecurityGroupId": {
      "Description": "Security group ID for ECS tasks",
      "Value": {"Ref": "ECSSecurityGroup"}
    },
    "DBSecurityGroupId": {
      "Description": "Security group ID for RDS",
      "Value": {"Ref": "DBSecurityGroup"}
    },
    "ALBArn": {
      "Description": "ARN of the Application Load Balancer",
      "Value": {"Ref": "ApplicationLoadBalancer"}
    },
    "ALBDNSName": {
      "Description": "DNS name of the Application Load Balancer",
      "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]}
    },
    "ALBHostedZoneId": {
      "Description": "Hosted zone ID of the Application Load Balancer",
      "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "CanonicalHostedZoneID"]}
    },
    "ALBTargetGroupArn": {
      "Description": "ARN of the ALB target group",
      "Value": {"Ref": "ALBTargetGroup"}
    }
  }
}
```

## File: lib/database-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Database stack with RDS PostgreSQL and conditional Multi-AZ",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming"
    },
    "EnvironmentName": {
      "Type": "String",
      "Description": "Environment name (dev, staging, prod)"
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "VPC ID"
    },
    "PrivateSubnetIds": {
      "Type": "CommaDelimitedList",
      "Description": "List of private subnet IDs for RDS"
    },
    "DBSecurityGroupId": {
      "Type": "String",
      "Description": "Security group ID for RDS"
    },
    "DBInstanceClass": {
      "Type": "String",
      "Description": "RDS instance class"
    },
    "DBAllocatedStorage": {
      "Type": "String",
      "Description": "Allocated storage in GB"
    },
    "DBMultiAZ": {
      "Type": "String",
      "Description": "Enable Multi-AZ deployment (true/false)",
      "AllowedValues": ["true", "false"]
    },
    "DBMasterPasswordSecretArn": {
      "Type": "String",
      "Description": "ARN of Secrets Manager secret containing DB password"
    },
    "ProjectName": {
      "Type": "String",
      "Description": "Project name for tagging"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center for billing"
    }
  },
  "Resources": {
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for RDS PostgreSQL",
        "SubnetIds": {"Ref": "PrivateSubnetIds"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "DBParameterGroup": {
      "Type": "AWS::RDS::DBParameterGroup",
      "Properties": {
        "DBParameterGroupName": {
          "Fn::Sub": "pg-params-${EnvironmentSuffix}"
        },
        "Description": "PostgreSQL parameter group with optimized settings",
        "Family": "postgres14",
        "Parameters": {
          "shared_preload_libraries": "pg_stat_statements",
          "log_statement": "all",
          "log_min_duration_statement": "1000"
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "pg-params-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "DBInstance": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Snapshot",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "postgres-${EnvironmentSuffix}"
        },
        "DBName": "appdb",
        "Engine": "postgres",
        "EngineVersion": "14.7",
        "DBInstanceClass": {"Ref": "DBInstanceClass"},
        "AllocatedStorage": {"Ref": "DBAllocatedStorage"},
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "MasterUsername": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBMasterPasswordSecretArn}:SecretString:username}}"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBMasterPasswordSecretArn}:SecretString:password}}"
        },
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "DBParameterGroupName": {"Ref": "DBParameterGroup"},
        "VPCSecurityGroups": [{"Ref": "DBSecurityGroupId"}],
        "MultiAZ": {"Ref": "DBMultiAZ"},
        "PubliclyAccessible": false,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "EnableCloudwatchLogsExports": ["postgresql", "upgrade"],
        "DeletionProtection": false,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "postgres-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    }
  },
  "Outputs": {
    "DBInstanceId": {
      "Description": "RDS instance identifier",
      "Value": {"Ref": "DBInstance"}
    },
    "DBEndpoint": {
      "Description": "RDS instance endpoint",
      "Value": {"Fn::GetAtt": ["DBInstance", "Endpoint.Address"]}
    },
    "DBPort": {
      "Description": "RDS instance port",
      "Value": {"Fn::GetAtt": ["DBInstance", "Endpoint.Port"]}
    },
    "DBName": {
      "Description": "Database name",
      "Value": "appdb"
    }
  }
}
```

## File: lib/compute-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Compute stack with ECS Fargate cluster, task definitions, and services",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming"
    },
    "EnvironmentName": {
      "Type": "String",
      "Description": "Environment name (dev, staging, prod)"
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "VPC ID"
    },
    "PrivateSubnetIds": {
      "Type": "CommaDelimitedList",
      "Description": "List of private subnet IDs for ECS tasks"
    },
    "ECSSecurityGroupId": {
      "Type": "String",
      "Description": "Security group ID for ECS tasks"
    },
    "ALBTargetGroupArn": {
      "Type": "String",
      "Description": "ARN of ALB target group"
    },
    "ECSTaskCPU": {
      "Type": "String",
      "Description": "CPU units for ECS task"
    },
    "ECSTaskMemory": {
      "Type": "String",
      "Description": "Memory for ECS task in MB"
    },
    "ECSDesiredCount": {
      "Type": "String",
      "Description": "Desired number of ECS tasks"
    },
    "LogRetentionDays": {
      "Type": "String",
      "Description": "CloudWatch log retention in days"
    },
    "DBEndpoint": {
      "Type": "String",
      "Description": "RDS database endpoint"
    },
    "DBMasterPasswordSecretArn": {
      "Type": "String",
      "Description": "ARN of database password secret"
    },
    "AppSecretsArn": {
      "Type": "String",
      "Description": "ARN of application secrets"
    },
    "ProjectName": {
      "Type": "String",
      "Description": "Project name for tagging"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center for billing"
    }
  },
  "Resources": {
    "ECSCluster": {
      "Type": "AWS::ECS::Cluster",
      "Properties": {
        "ClusterName": {
          "Fn::Sub": "ecs-cluster-${EnvironmentSuffix}"
        },
        "CapacityProviders": ["FARGATE", "FARGATE_SPOT"],
        "DefaultCapacityProviderStrategy": [
          {
            "CapacityProvider": "FARGATE",
            "Weight": 1,
            "Base": 1
          }
        ],
        "ClusterSettings": [
          {
            "Name": "containerInsights",
            "Value": "enabled"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "ecs-cluster-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "ECRRepository": {
      "Type": "AWS::ECR::Repository",
      "Properties": {
        "RepositoryName": {
          "Fn::Sub": "app-repo-${EnvironmentSuffix}"
        },
        "ImageScanningConfiguration": {
          "ScanOnPush": true
        },
        "EncryptionConfiguration": {
          "EncryptionType": "AES256"
        },
        "LifecyclePolicy": {
          "LifecyclePolicyText": "{\"rules\":[{\"rulePriority\":1,\"description\":\"Keep last 10 images\",\"selection\":{\"tagStatus\":\"any\",\"countType\":\"imageCountMoreThan\",\"countNumber\":10},\"action\":{\"type\":\"expire\"}},{\"rulePriority\":2,\"description\":\"Remove untagged images after 7 days\",\"selection\":{\"tagStatus\":\"untagged\",\"countType\":\"sinceImagePushed\",\"countUnit\":\"days\",\"countNumber\":7},\"action\":{\"type\":\"expire\"}}]}"
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "app-repo-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "ECSTaskExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "ecs-task-execution-role-${EnvironmentSuffix}"
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
            "PolicyName": "SecretsManagerAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue"
                  ],
                  "Resource": [
                    {"Ref": "DBMasterPasswordSecretArn"},
                    {"Ref": "AppSecretsArn"}
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "ECRAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ecr:GetAuthorizationToken",
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchGetImage"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "ECSTaskRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "ecs-task-role-${EnvironmentSuffix}"
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
            "PolicyName": "ApplicationPermissions",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue"
                  ],
                  "Resource": [
                    {"Ref": "AppSecretsArn"}
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "ECSLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/ecs/app-${EnvironmentSuffix}"
        },
        "RetentionInDays": {"Ref": "LogRetentionDays"}
      }
    },
    "ECSTaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": {
          "Fn::Sub": "app-task-${EnvironmentSuffix}"
        },
        "NetworkMode": "awsvpc",
        "RequiresCompatibilities": ["FARGATE"],
        "Cpu": {"Ref": "ECSTaskCPU"},
        "Memory": {"Ref": "ECSTaskMemory"},
        "ExecutionRoleArn": {"Fn::GetAtt": ["ECSTaskExecutionRole", "Arn"]},
        "TaskRoleArn": {"Fn::GetAtt": ["ECSTaskRole", "Arn"]},
        "ContainerDefinitions": [
          {
            "Name": "app-container",
            "Image": {
              "Fn::Sub": "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ECRRepository}:latest"
            },
            "Essential": true,
            "PortMappings": [
              {
                "ContainerPort": 8080,
                "Protocol": "tcp"
              }
            ],
            "Environment": [
              {
                "Name": "ENVIRONMENT",
                "Value": {"Ref": "EnvironmentName"}
              },
              {
                "Name": "DB_HOST",
                "Value": {"Ref": "DBEndpoint"}
              },
              {
                "Name": "DB_PORT",
                "Value": "5432"
              },
              {
                "Name": "DB_NAME",
                "Value": "appdb"
              }
            ],
            "Secrets": [
              {
                "Name": "DB_USERNAME",
                "ValueFrom": {
                  "Fn::Sub": "${DBMasterPasswordSecretArn}:username::"
                }
              },
              {
                "Name": "DB_PASSWORD",
                "ValueFrom": {
                  "Fn::Sub": "${DBMasterPasswordSecretArn}:password::"
                }
              },
              {
                "Name": "API_KEY",
                "ValueFrom": {
                  "Fn::Sub": "${AppSecretsArn}:api_key::"
                }
              }
            ],
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {"Ref": "ECSLogGroup"},
                "awslogs-region": {"Ref": "AWS::Region"},
                "awslogs-stream-prefix": "ecs"
              }
            }
          }
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "ECSService": {
      "Type": "AWS::ECS::Service",
      "DependsOn": ["ECSTaskDefinition"],
      "Properties": {
        "ServiceName": {
          "Fn::Sub": "app-service-${EnvironmentSuffix}"
        },
        "Cluster": {"Ref": "ECSCluster"},
        "TaskDefinition": {"Ref": "ECSTaskDefinition"},
        "DesiredCount": {"Ref": "ECSDesiredCount"},
        "LaunchType": "FARGATE",
        "NetworkConfiguration": {
          "AwsvpcConfiguration": {
            "AssignPublicIp": "DISABLED",
            "Subnets": {"Ref": "PrivateSubnetIds"},
            "SecurityGroups": [{"Ref": "ECSSecurityGroupId"}]
          }
        },
        "LoadBalancers": [
          {
            "ContainerName": "app-container",
            "ContainerPort": 8080,
            "TargetGroupArn": {"Ref": "ALBTargetGroupArn"}
          }
        ],
        "HealthCheckGracePeriodSeconds": 60,
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "ServiceScalingTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "MaxCapacity": 10,
        "MinCapacity": {"Ref": "ECSDesiredCount"},
        "ResourceId": {
          "Fn::Sub": "service/${ECSCluster}/${ECSService.Name}"
        },
        "RoleARN": {
          "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService"
        },
        "ScalableDimension": "ecs:service:DesiredCount",
        "ServiceNamespace": "ecs"
      }
    },
    "ServiceScalingPolicy": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": {
          "Fn::Sub": "cpu-scaling-policy-${EnvironmentSuffix}"
        },
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {"Ref": "ServiceScalingTarget"},
        "TargetTrackingScalingPolicyConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
          },
          "TargetValue": 70.0,
          "ScaleInCooldown": 300,
          "ScaleOutCooldown": 60
        }
      }
    }
  },
  "Outputs": {
    "ECSClusterName": {
      "Description": "Name of the ECS cluster",
      "Value": {"Ref": "ECSCluster"}
    },
    "ECSClusterArn": {
      "Description": "ARN of the ECS cluster",
      "Value": {"Fn::GetAtt": ["ECSCluster", "Arn"]}
    },
    "ECSServiceName": {
      "Description": "Name of the ECS service",
      "Value": {"Fn::GetAtt": ["ECSService", "Name"]}
    },
    "ECRRepositoryURI": {
      "Description": "URI of the ECR repository",
      "Value": {
        "Fn::Sub": "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${ECRRepository}"
      }
    },
    "ECSLogGroupName": {
      "Description": "CloudWatch log group for ECS tasks",
      "Value": {"Ref": "ECSLogGroup"}
    }
  }
}
```

## File: lib/monitoring-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Monitoring stack with CloudWatch alarms and Route53 health checks",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming"
    },
    "EnvironmentName": {
      "Type": "String",
      "Description": "Environment name (dev, staging, prod)"
    },
    "HostedZoneId": {
      "Type": "String",
      "Description": "Route53 hosted zone ID"
    },
    "DomainName": {
      "Type": "String",
      "Description": "Domain name for the application"
    },
    "ALBDNSName": {
      "Type": "String",
      "Description": "DNS name of the Application Load Balancer"
    },
    "ALBHostedZoneId": {
      "Type": "String",
      "Description": "Hosted zone ID of the Application Load Balancer"
    },
    "ECSClusterName": {
      "Type": "String",
      "Description": "Name of the ECS cluster"
    },
    "ECSServiceName": {
      "Type": "String",
      "Description": "Name of the ECS service"
    },
    "ProjectName": {
      "Type": "String",
      "Description": "Project name for tagging"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center for billing"
    }
  },
  "Resources": {
    "DNSRecord": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneId": {"Ref": "HostedZoneId"},
        "Name": {
          "Fn::Sub": "app-${EnvironmentName}.${DomainName}"
        },
        "Type": "A",
        "AliasTarget": {
          "DNSName": {"Ref": "ALBDNSName"},
          "HostedZoneId": {"Ref": "ALBHostedZoneId"},
          "EvaluateTargetHealth": true
        }
      }
    },
    "HealthCheck": {
      "Type": "AWS::Route53::HealthCheck",
      "Properties": {
        "HealthCheckConfig": {
          "Type": "HTTPS_STR_MATCH",
          "FullyQualifiedDomainName": {"Ref": "ALBDNSName"},
          "Port": 80,
          "ResourcePath": "/health",
          "SearchString": "ok",
          "RequestInterval": 30,
          "FailureThreshold": 3
        },
        "HealthCheckTags": [
          {"Key": "Name", "Value": {"Fn::Sub": "health-check-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
          {"Key": "Project", "Value": {"Ref": "ProjectName"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "CPUAlarmHigh": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "ecs-cpu-high-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when ECS service CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/ECS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "ServiceName",
            "Value": {"Ref": "ECSServiceName"}
          },
          {
            "Name": "ClusterName",
            "Value": {"Ref": "ECSClusterName"}
          }
        ]
      }
    },
    "MemoryAlarmHigh": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "ecs-memory-high-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when ECS service memory exceeds 80%",
        "MetricName": "MemoryUtilization",
        "Namespace": "AWS/ECS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "ServiceName",
            "Value": {"Ref": "ECSServiceName"}
          },
          {
            "Name": "ClusterName",
            "Value": {"Ref": "ECSClusterName"}
          }
        ]
      }
    }
  },
  "Outputs": {
    "ApplicationDNS": {
      "Description": "Application DNS name",
      "Value": {
        "Fn::Sub": "app-${EnvironmentName}.${DomainName}"
      }
    },
    "HealthCheckId": {
      "Description": "Route53 health check ID",
      "Value": {"Ref": "HealthCheck"}
    }
  }
}
```

## File: lib/parameters/dev-params.json

```json
{
  "Parameters": [
    {
      "ParameterKey": "EnvironmentName",
      "ParameterValue": "dev"
    },
    {
      "ParameterKey": "EnvironmentSuffix",
      "ParameterValue": "dev-001"
    },
    {
      "ParameterKey": "VpcId",
      "ParameterValue": "vpc-0a1b2c3d4e5f"
    },
    {
      "ParameterKey": "PrivateSubnetIds",
      "ParameterValue": "subnet-private1,subnet-private2,subnet-private3"
    },
    {
      "ParameterKey": "PublicSubnetIds",
      "ParameterValue": "subnet-public1,subnet-public2,subnet-public3"
    },
    {
      "ParameterKey": "ProjectName",
      "ParameterValue": "app-migration"
    },
    {
      "ParameterKey": "CostCenter",
      "ParameterValue": "engineering"
    },
    {
      "ParameterKey": "HostedZoneId",
      "ParameterValue": "Z1234567890ABC"
    },
    {
      "ParameterKey": "DomainName",
      "ParameterValue": "example.com"
    },
    {
      "ParameterKey": "NestedStacksBucketName",
      "ParameterValue": "my-cfn-templates-bucket"
    }
  ]
}
```

## File: lib/parameters/staging-params.json

```json
{
  "Parameters": [
    {
      "ParameterKey": "EnvironmentName",
      "ParameterValue": "staging"
    },
    {
      "ParameterKey": "EnvironmentSuffix",
      "ParameterValue": "staging-001"
    },
    {
      "ParameterKey": "VpcId",
      "ParameterValue": "vpc-1a2b3c4d5e6f"
    },
    {
      "ParameterKey": "PrivateSubnetIds",
      "ParameterValue": "subnet-private1-stg,subnet-private2-stg,subnet-private3-stg"
    },
    {
      "ParameterKey": "PublicSubnetIds",
      "ParameterValue": "subnet-public1-stg,subnet-public2-stg,subnet-public3-stg"
    },
    {
      "ParameterKey": "ProjectName",
      "ParameterValue": "app-migration"
    },
    {
      "ParameterKey": "CostCenter",
      "ParameterValue": "engineering"
    },
    {
      "ParameterKey": "HostedZoneId",
      "ParameterValue": "Z1234567890ABC"
    },
    {
      "ParameterKey": "DomainName",
      "ParameterValue": "example.com"
    },
    {
      "ParameterKey": "NestedStacksBucketName",
      "ParameterValue": "my-cfn-templates-bucket"
    }
  ]
}
```

## File: lib/parameters/prod-params.json

```json
{
  "Parameters": [
    {
      "ParameterKey": "EnvironmentName",
      "ParameterValue": "prod"
    },
    {
      "ParameterKey": "EnvironmentSuffix",
      "ParameterValue": "prod-001"
    },
    {
      "ParameterKey": "VpcId",
      "ParameterValue": "vpc-2a3b4c5d6e7f"
    },
    {
      "ParameterKey": "PrivateSubnetIds",
      "ParameterValue": "subnet-private1-prod,subnet-private2-prod,subnet-private3-prod"
    },
    {
      "ParameterKey": "PublicSubnetIds",
      "ParameterValue": "subnet-public1-prod,subnet-public2-prod,subnet-public3-prod"
    },
    {
      "ParameterKey": "ProjectName",
      "ParameterValue": "app-migration"
    },
    {
      "ParameterKey": "CostCenter",
      "ParameterValue": "engineering"
    },
    {
      "ParameterKey": "HostedZoneId",
      "ParameterValue": "Z1234567890ABC"
    },
    {
      "ParameterKey": "DomainName",
      "ParameterValue": "example.com"
    },
    {
      "ParameterKey": "NestedStacksBucketName",
      "ParameterValue": "my-cfn-templates-bucket"
    }
  ]
}
```

## Deployment Instructions

### Prerequisites

1. Upload nested stack templates to S3:
```bash
aws s3 cp lib/secrets-stack.json s3://my-cfn-templates-bucket/
aws s3 cp lib/networking-stack.json s3://my-cfn-templates-bucket/
aws s3 cp lib/database-stack.json s3://my-cfn-templates-bucket/
aws s3 cp lib/compute-stack.json s3://my-cfn-templates-bucket/
aws s3 cp lib/monitoring-stack.json s3://my-cfn-templates-bucket/
```

2. Update parameter files with actual VPC IDs, subnet IDs, and hosted zone ID

### Deploy Dev Environment

```bash
aws cloudformation create-stack \
  --stack-name app-migration-dev \
  --template-body file://lib/main-stack.json \
  --parameters file://lib/parameters/dev-params.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Deploy Staging Environment

```bash
aws cloudformation create-stack \
  --stack-name app-migration-staging \
  --template-body file://lib/main-stack.json \
  --parameters file://lib/parameters/staging-params.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Deploy Production Environment

```bash
aws cloudformation create-stack \
  --stack-name app-migration-prod \
  --template-body file://lib/main-stack.json \
  --parameters file://lib/parameters/prod-params.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --enable-termination-protection \
  --region us-east-1
```

## Key Design Decisions

1. **Nested Stack Architecture**: Organized infrastructure into logical components for maintainability and reusability
2. **Environment Mappings**: Used CloudFormation Mappings to define environment-specific configurations
3. **Conditional Multi-AZ**: Database Multi-AZ is controlled via parameter, enabled only for production
4. **Security Groups**: Implemented strict ingress/egress rules with no blanket 0.0.0.0/0 access except where necessary
5. **Secrets Management**: All credentials stored in Secrets Manager and referenced via dynamic references
6. **ECS Fargate**: Serverless container orchestration for simplified management
7. **Auto-scaling**: ECS service scales based on CPU utilization with configurable min/max
8. **Monitoring**: CloudWatch alarms for CPU/memory and Route53 health checks
9. **Cost Optimization**: Dev/staging use smaller instance types, log retention varies by environment
10. **Resource Naming**: All resources include environmentSuffix for uniqueness
