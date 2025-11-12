# Multi-Environment Payment Processing Infrastructure

This implementation provides a complete CloudFormation JSON template that deploys payment processing infrastructure across dev, staging, and production environments.

## File: lib/payment-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-environment payment processing infrastructure with RDS, ALB, Auto Scaling, and S3",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Default": "dev",
      "AllowedValues": ["dev", "staging", "prod"],
      "Description": "Environment name (dev, staging, or prod)"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to prevent collisions",
      "MinLength": 3,
      "MaxLength": 10
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "Existing VPC ID"
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet::Id",
      "Description": "Private subnet 1 ID for RDS"
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet::Id",
      "Description": "Private subnet 2 ID for RDS"
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet::Id",
      "Description": "Private subnet 3 ID for RDS"
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet::Id",
      "Description": "Public subnet 1 ID for ALB"
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet::Id",
      "Description": "Public subnet 2 ID for ALB"
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet::Id",
      "Description": "Public subnet 3 ID for ALB"
    },
    "KeyPairName": {
      "Type": "AWS::EC2::KeyPair::KeyName",
      "Description": "EC2 Key Pair for SSH access"
    }
  },
  "Mappings": {
    "EnvironmentConfig": {
      "dev": {
        "RDSInstanceClass": "db.t3.micro",
        "EC2InstanceType": "t3.micro",
        "BackupRetentionDays": 1,
        "MultiAZ": "false",
        "MinSize": 1,
        "MaxSize": 2,
        "DesiredCapacity": 1,
        "CPUAlarmThreshold": 80,
        "VersioningEnabled": "false"
      },
      "staging": {
        "RDSInstanceClass": "db.t3.small",
        "EC2InstanceType": "t3.small",
        "BackupRetentionDays": 7,
        "MultiAZ": "true",
        "MinSize": 2,
        "MaxSize": 4,
        "DesiredCapacity": 2,
        "CPUAlarmThreshold": 70,
        "VersioningEnabled": "true"
      },
      "prod": {
        "RDSInstanceClass": "db.t3.medium",
        "EC2InstanceType": "t3.medium",
        "BackupRetentionDays": 30,
        "MultiAZ": "true",
        "MinSize": 3,
        "MaxSize": 10,
        "DesiredCapacity": 3,
        "CPUAlarmThreshold": 60,
        "VersioningEnabled": "true"
      }
    }
  },
  "Conditions": {
    "IsMultiAZ": {
      "Fn::Or": [
        {"Fn::Equals": [{"Ref": "Environment"}, "staging"]},
        {"Fn::Equals": [{"Ref": "Environment"}, "prod"]}
      ]
    },
    "EnableVersioning": {
      "Fn::Or": [
        {"Fn::Equals": [{"Ref": "Environment"}, "staging"]},
        {"Fn::Equals": [{"Ref": "Environment"}, "prod"]}
      ]
    }
  },
  "Resources": {
    "DBPassword": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {"Fn::Sub": "payment-db-password-${Environment}-${EnvironmentSuffix}"},
        "Description": {"Fn::Sub": "Database master password for ${Environment}"},
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\": \"dbadmin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\",
          "RequireEachIncludedType": true
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": "PaymentProcessing"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {"Fn::Sub": "payment-db-subnet-${Environment}-${EnvironmentSuffix}"},
        "DBSubnetGroupDescription": {"Fn::Sub": "Subnet group for payment DB in ${Environment}"},
        "SubnetIds": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"},
          {"Ref": "PrivateSubnet3"}
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": "PaymentProcessing"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "payment-db-sg-${Environment}-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for RDS PostgreSQL",
        "VpcId": {"Ref": "VpcId"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": {"Ref": "EC2SecurityGroup"}
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "payment-db-sg-${Environment}-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": "PaymentProcessing"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "RDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "payment-db-${Environment}-${EnvironmentSuffix}"},
        "DBInstanceClass": {"Fn::FindInMap": ["EnvironmentConfig", {"Ref": "Environment"}, "RDSInstanceClass"]},
        "Engine": "postgres",
        "EngineVersion": "14.7",
        "MasterUsername": "dbadmin",
        "MasterUserPassword": {"Fn::Sub": "{{resolve:secretsmanager:${DBPassword}:SecretString:password}}"},
        "AllocatedStorage": "20",
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "MultiAZ": {"Fn::If": ["IsMultiAZ", true, false]},
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "VPCSecurityGroups": [{"Ref": "DBSecurityGroup"}],
        "BackupRetentionPeriod": {"Fn::FindInMap": ["EnvironmentConfig", {"Ref": "Environment"}, "BackupRetentionDays"]},
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "EnableCloudwatchLogsExports": ["postgresql"],
        "DeletionProtection": false,
        "PubliclyAccessible": false,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "payment-db-${Environment}-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": "PaymentProcessing"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "RDSCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "payment-db-cpu-${Environment}-${EnvironmentSuffix}"},
        "AlarmDescription": {"Fn::Sub": "RDS CPU utilization alarm for ${Environment}"},
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {"Fn::FindInMap": ["EnvironmentConfig", {"Ref": "Environment"}, "CPUAlarmThreshold"]},
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {"Ref": "RDSInstance"}
          }
        ]
      }
    },
    "StaticContentBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {"Fn::Sub": "payment-static-${Environment}-${EnvironmentSuffix}"},
        "VersioningConfiguration": {
          "Status": {"Fn::If": ["EnableVersioning", "Enabled", "Suspended"]}
        },
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
              "Id": "DeleteOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": "PaymentProcessing"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "payment-alb-sg-${Environment}-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {"Ref": "VpcId"},
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
          {"Key": "Name", "Value": {"Fn::Sub": "payment-alb-sg-${Environment}-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": "PaymentProcessing"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "payment-ec2-sg-${Environment}-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": {"Ref": "VpcId"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {"Ref": "ALBSecurityGroup"}
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": {"Ref": "ALBSecurityGroup"}
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "payment-ec2-sg-${Environment}-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": "PaymentProcessing"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {"Fn::Sub": "payment-alb-${Environment}-${EnvironmentSuffix}"},
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          {"Ref": "PublicSubnet1"},
          {"Ref": "PublicSubnet2"},
          {"Ref": "PublicSubnet3"}
        ],
        "SecurityGroups": [{"Ref": "ALBSecurityGroup"}],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "payment-alb-${Environment}-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": "PaymentProcessing"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {"Fn::Sub": "payment-tg-${Environment}-${EnvironmentSuffix}"},
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {"Ref": "VpcId"},
        "HealthCheckEnabled": true,
        "HealthCheckProtocol": "HTTP",
        "HealthCheckPath": "/health",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "TargetType": "instance",
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": "PaymentProcessing"},
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
    },
    "InstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "payment-instance-role-${Environment}-${EnvironmentSuffix}"},
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
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
        "Policies": [
          {
            "PolicyName": "S3Access",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {"Fn::GetAtt": ["StaticContentBucket", "Arn"]},
                    {"Fn::Sub": "${StaticContentBucket.Arn}/*"}
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "SecretsAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue"
                  ],
                  "Resource": {"Ref": "DBPassword"}
                }
              ]
            }
          }
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Project", "Value": "PaymentProcessing"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },
    "InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {"Fn::Sub": "payment-instance-profile-${Environment}-${EnvironmentSuffix}"},
        "Roles": [{"Ref": "InstanceRole"}]
      }
    },
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {"Fn::Sub": "payment-lt-${Environment}-${EnvironmentSuffix}"},
        "LaunchTemplateData": {
          "ImageId": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}",
          "InstanceType": {"Fn::FindInMap": ["EnvironmentConfig", {"Ref": "Environment"}, "EC2InstanceType"]},
          "KeyName": {"Ref": "KeyPairName"},
          "IamInstanceProfile": {
            "Arn": {"Fn::GetAtt": ["InstanceProfile", "Arn"]}
          },
          "SecurityGroupIds": [{"Ref": "EC2SecurityGroup"}],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd\nsystemctl enable httpd\necho '<html><body><h1>Payment Processing - ${Environment}</h1></body></html>' > /var/www/html/index.html\necho 'OK' > /var/www/html/health\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {"Key": "Name", "Value": {"Fn::Sub": "payment-instance-${Environment}-${EnvironmentSuffix}"}},
                {"Key": "Environment", "Value": {"Ref": "Environment"}},
                {"Key": "Project", "Value": "PaymentProcessing"},
                {"Key": "ManagedBy", "Value": "CloudFormation"}
              ]
            }
          ]
        }
      }
    },
    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": {"Fn::Sub": "payment-asg-${Environment}-${EnvironmentSuffix}"},
        "LaunchTemplate": {
          "LaunchTemplateId": {"Ref": "LaunchTemplate"},
          "Version": {"Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"]}
        },
        "MinSize": {"Fn::FindInMap": ["EnvironmentConfig", {"Ref": "Environment"}, "MinSize"]},
        "MaxSize": {"Fn::FindInMap": ["EnvironmentConfig", {"Ref": "Environment"}, "MaxSize"]},
        "DesiredCapacity": {"Fn::FindInMap": ["EnvironmentConfig", {"Ref": "Environment"}, "DesiredCapacity"]},
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "VPCZoneIdentifier": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"},
          {"Ref": "PrivateSubnet3"}
        ],
        "TargetGroupARNs": [{"Ref": "ALBTargetGroup"}],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "payment-asg-${Environment}-${EnvironmentSuffix}"}, "PropagateAtLaunch": true},
          {"Key": "Environment", "Value": {"Ref": "Environment"}, "PropagateAtLaunch": true},
          {"Key": "Project", "Value": "PaymentProcessing", "PropagateAtLaunch": true},
          {"Key": "ManagedBy", "Value": "CloudFormation", "PropagateAtLaunch": true}
        ]
      }
    },
    "ScaleUpPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AutoScalingGroupName": {"Ref": "AutoScalingGroup"},
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
          },
          "TargetValue": 70.0
        }
      }
    }
  },
  "Outputs": {
    "RDSEndpoint": {
      "Description": "RDS instance endpoint",
      "Value": {"Fn::GetAtt": ["RDSInstance", "Endpoint.Address"]},
      "Export": {
        "Name": {"Fn::Sub": "payment-db-endpoint-${Environment}-${EnvironmentSuffix}"}
      }
    },
    "RDSPort": {
      "Description": "RDS instance port",
      "Value": {"Fn::GetAtt": ["RDSInstance", "Endpoint.Port"]},
      "Export": {
        "Name": {"Fn::Sub": "payment-db-port-${Environment}-${EnvironmentSuffix}"}
      }
    },
    "LoadBalancerDNS": {
      "Description": "Application Load Balancer DNS name",
      "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]},
      "Export": {
        "Name": {"Fn::Sub": "payment-alb-dns-${Environment}-${EnvironmentSuffix}"}
      }
    },
    "LoadBalancerArn": {
      "Description": "Application Load Balancer ARN",
      "Value": {"Ref": "ApplicationLoadBalancer"},
      "Export": {
        "Name": {"Fn::Sub": "payment-alb-arn-${Environment}-${EnvironmentSuffix}"}
      }
    },
    "S3BucketName": {
      "Description": "S3 bucket name for static content",
      "Value": {"Ref": "StaticContentBucket"},
      "Export": {
        "Name": {"Fn::Sub": "payment-bucket-${Environment}-${EnvironmentSuffix}"}
      }
    },
    "DBSecretArn": {
      "Description": "ARN of database password secret",
      "Value": {"Ref": "DBPassword"},
      "Export": {
        "Name": {"Fn::Sub": "payment-db-secret-${Environment}-${EnvironmentSuffix}"}
      }
    }
  }
}
```

## File: lib/parameters-dev.json

```json
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "dev"
  },
  {
    "ParameterKey": "EnvironmentSuffix",
    "ParameterValue": "test01"
  },
  {
    "ParameterKey": "VpcId",
    "ParameterValue": "vpc-xxxxxxxxx"
  },
  {
    "ParameterKey": "PrivateSubnet1",
    "ParameterValue": "subnet-xxxxxxxxx"
  },
  {
    "ParameterKey": "PrivateSubnet2",
    "ParameterValue": "subnet-yyyyyyyyy"
  },
  {
    "ParameterKey": "PrivateSubnet3",
    "ParameterValue": "subnet-zzzzzzzzz"
  },
  {
    "ParameterKey": "PublicSubnet1",
    "ParameterValue": "subnet-aaaaaaaaa"
  },
  {
    "ParameterKey": "PublicSubnet2",
    "ParameterValue": "subnet-bbbbbbbbb"
  },
  {
    "ParameterKey": "PublicSubnet3",
    "ParameterValue": "subnet-ccccccccc"
  },
  {
    "ParameterKey": "KeyPairName",
    "ParameterValue": "my-keypair"
  }
]
```

## File: lib/parameters-staging.json

```json
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "staging"
  },
  {
    "ParameterKey": "EnvironmentSuffix",
    "ParameterValue": "test01"
  },
  {
    "ParameterKey": "VpcId",
    "ParameterValue": "vpc-xxxxxxxxx"
  },
  {
    "ParameterKey": "PrivateSubnet1",
    "ParameterValue": "subnet-xxxxxxxxx"
  },
  {
    "ParameterKey": "PrivateSubnet2",
    "ParameterValue": "subnet-yyyyyyyyy"
  },
  {
    "ParameterKey": "PrivateSubnet3",
    "ParameterValue": "subnet-zzzzzzzzz"
  },
  {
    "ParameterKey": "PublicSubnet1",
    "ParameterValue": "subnet-aaaaaaaaa"
  },
  {
    "ParameterKey": "PublicSubnet2",
    "ParameterValue": "subnet-bbbbbbbbb"
  },
  {
    "ParameterKey": "PublicSubnet3",
    "ParameterValue": "subnet-ccccccccc"
  },
  {
    "ParameterKey": "KeyPairName",
    "ParameterValue": "my-keypair"
  }
]
```

## File: lib/parameters-prod.json

```json
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "prod"
  },
  {
    "ParameterKey": "EnvironmentSuffix",
    "ParameterValue": "test01"
  },
  {
    "ParameterKey": "VpcId",
    "ParameterValue": "vpc-xxxxxxxxx"
  },
  {
    "ParameterKey": "PrivateSubnet1",
    "ParameterValue": "subnet-xxxxxxxxx"
  },
  {
    "ParameterKey": "PrivateSubnet2",
    "ParameterValue": "subnet-yyyyyyyyy"
  },
  {
    "ParameterKey": "PrivateSubnet3",
    "ParameterValue": "subnet-zzzzzzzzz"
  },
  {
    "ParameterKey": "PublicSubnet1",
    "ParameterValue": "subnet-aaaaaaaaa"
  },
  {
    "ParameterKey": "PublicSubnet2",
    "ParameterValue": "subnet-bbbbbbbbb"
  },
  {
    "ParameterKey": "PublicSubnet3",
    "ParameterValue": "subnet-ccccccccc"
  },
  {
    "ParameterKey": "KeyPairName",
    "ParameterValue": "my-keypair"
  }
]
```

## Deployment Instructions

### Deploy to Dev Environment
```bash
aws cloudformation create-stack \
  --stack-name payment-stack-dev \
  --template-body file://lib/payment-stack.json \
  --parameters file://lib/parameters-dev.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Deploy to Staging Environment
```bash
aws cloudformation create-stack \
  --stack-name payment-stack-staging \
  --template-body file://lib/payment-stack.json \
  --parameters file://lib/parameters-staging.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Deploy to Production Environment
```bash
aws cloudformation create-stack \
  --stack-name payment-stack-prod \
  --template-body file://lib/payment-stack.json \
  --parameters file://lib/parameters-prod.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Architecture Overview

This CloudFormation template creates a complete multi-environment payment processing infrastructure:

1. **Database Layer**: RDS PostgreSQL with environment-specific sizing and Multi-AZ for staging/prod
2. **Application Layer**: Auto Scaling Groups with Launch Templates
3. **Load Balancing**: Application Load Balancer with health checks
4. **Storage**: S3 bucket for static content with encryption
5. **Security**: Secrets Manager for database passwords, security groups for network isolation
6. **Monitoring**: CloudWatch alarms for RDS CPU utilization

All resources are tagged with Environment, Project, and ManagedBy tags for proper resource management.
