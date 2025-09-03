# Secure Production-Ready AWS CloudFormation Template

Here's a comprehensive CloudFormation template that meets all the specified security and compliance requirements:

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure production-ready AWS infrastructure with comprehensive security controls",
  "Metadata": {
    "Purpose": "Production infrastructure with security best practices",
    "SecurityFeatures": [
      "Encryption at rest and in transit",
      "Network isolation with private subnets",
      "Least privilege IAM policies",
      "Comprehensive monitoring and logging",
      "MFA enforcement for sensitive operations"
    ]
  },
  "Parameters": {
    "AllowedSSHCIDR": {
      "Type": "String",
      "Default": "10.0.0.0/8",
      "Description": "CIDR block allowed for SSH access",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
    },
    "DBMasterUsername": {
      "Type": "String",
      "Default": "admin",
      "Description": "Database master username",
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*"
    },
    "DBMasterPassword": {
      "Type": "String",
      "NoEcho": true,
      "Description": "Database master password",
      "MinLength": 8,
      "MaxLength": 41,
      "AllowedPattern": "[a-zA-Z0-9]*"
    }
  },
  "Resources": {
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "Production KMS key for encryption",
        "EnableKeyRotation": true,
        "KeyPolicy": {
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
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Purpose",
            "Value": "Encryption"
          }
        ]
      },
      "Metadata": {
        "SecurityNote": "KMS key with automatic rotation enabled for enhanced security"
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": "alias/production-key",
        "TargetKeyId": {
          "Ref": "KMSKey"
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
            "Value": "Production-VPC"
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
        "AvailabilityZone": "us-west-2a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Public-Subnet-1"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Type",
            "Value": "Public"
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
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": "us-west-2b",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Public-Subnet-2"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Type",
            "Value": "Public"
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
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": "us-west-2a",
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Private-Subnet-1"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Type",
            "Value": "Private"
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
        "CidrBlock": "10.0.4.0/24",
        "AvailabilityZone": "us-west-2b",
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Private-Subnet-2"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Type",
            "Value": "Private"
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
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Public-RT"
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
    "PublicSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PublicSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet2"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "WebServerSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for web servers with restricted SSH access",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTP access from anywhere"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTPS access from anywhere"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": {
              "Ref": "AllowedSSHCIDR"
            },
            "Description": "SSH access from specified CIDR range only"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "All outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-WebServer-SG"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      },
      "Metadata": {
        "SecurityNote": "SSH access restricted to specified CIDR range for enhanced security"
      }
    },
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for database servers",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "WebServerSecurityGroup"
            },
            "Description": "MySQL access from web servers only"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Database-SG"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "LoadBalancerSecurityGroup": {
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
            "Description": "HTTP access"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTPS access"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-LoadBalancer-SG"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "ApplicationLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "production-app-logs-${AWS::AccountId}-${AWS::Region}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "KMSKey"
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
              "Id": "DeleteOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionExpirationInDays": 30
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Application-Logs"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Purpose",
            "Value": "Application Logs"
          }
        ]
      },
      "Metadata": {
        "SecurityNote": "S3 bucket with KMS encryption, versioning, and public access blocked"
      }
    },
    "LoadBalancerLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "production-lb-logs-${AWS::AccountId}-${AWS::Region}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "KMSKey"
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
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-LoadBalancer-Logs"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Purpose",
            "Value": "Load Balancer Logs"
          }
        ]
      }
    },
    "EC2InstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "ProductionEC2InstanceRole",
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ec2.amazonaws.com"
              },
              "Action": "sts:AssumeRole",
              "Condition": {
                "Bool": {
                  "aws:MultiFactorAuthPresent": "true"
                }
              }
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        ],
        "Policies": [
          {
            "PolicyName": "S3LogsAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                  ],
                  "Resource": {
                    "Fn::Sub": "${ApplicationLogsBucket}/*"
                  }
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
      },
      "Metadata": {
        "SecurityNote": "IAM role with MFA requirement and least privilege access"
      }
    },
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Roles": [
          {
            "Ref": "EC2InstanceRole"
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "ProductionLambdaExecutionRole",
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole",
              "Condition": {
                "Bool": {
                  "aws:MultiFactorAuthPresent": "true"
                }
              }
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "KMSAccess",
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
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "WebServerInstance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": "ami-0c02fb55956c7d316",
        "InstanceType": "t3.medium",
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "SecurityGroupIds": [
          {
            "Ref": "WebServerSecurityGroup"
          }
        ],
        "IamInstanceProfile": {
          "Ref": "EC2InstanceProfile"
        },
        "UserData": {
          "Fn::Base64": {
            "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y amazon-cloudwatch-agent\n/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux\n"
          }
        },
        "BlockDeviceMappings": [
          {
            "DeviceName": "/dev/xvda",
            "Ebs": {
              "VolumeType": "gp3",
              "VolumeSize": 20,
              "Encrypted": true,
              "KmsKeyId": {
                "Ref": "KMSKey"
              }
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-WebServer"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Type",
            "Value": "WebServer"
          }
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS database",
        "SubnetIds": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          }
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
        "DBInstanceClass": "db.t3.micro",
        "Engine": "mysql",
        "EngineVersion": "8.0.35",
        "AllocatedStorage": 20,
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "KMSKey"
        },
        "MasterUsername": {
          "Ref": "DBMasterUsername"
        },
        "MasterUserPassword": {
          "Ref": "DBMasterPassword"
        },
        "VPCSecurityGroups": [
          {
            "Ref": "DatabaseSecurityGroup"
          }
        ],
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "BackupRetentionPeriod": 7,
        "MultiAZ": true,
        "PubliclyAccessible": false,
        "DeletionProtection": true,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsKMSKeyId": {
          "Ref": "KMSKey"
        },
        "MonitoringInterval": 60,
        "MonitoringRoleArn": {
          "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/rds-monitoring-role"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-Database"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      },
      "Metadata": {
        "SecurityNote": "RDS instance in private subnet with encryption and enhanced monitoring"
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": "Production-ALB",
        "Type": "application",
        "Scheme": "internet-facing",
        "SecurityGroups": [
          {
            "Ref": "LoadBalancerSecurityGroup"
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
        "LoadBalancerAttributes": [
          {
            "Key": "access_logs.s3.enabled",
            "Value": "true"
          },
          {
            "Key": "access_logs.s3.bucket",
            "Value": {
              "Ref": "LoadBalancerLogsBucket"
            }
          },
          {
            "Key": "access_logs.s3.prefix",
            "Value": "alb-logs"
          }
        ],
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
      },
      "Metadata": {
        "SecurityNote": "Application Load Balancer with access logs enabled"
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": "Production-TG",
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {
          "Ref": "VPC"
        },
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Targets": [
          {
            "Id": {
              "Ref": "WebServerInstance"
            },
            "Port": 80
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "Production-TargetGroup"
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
    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "ProductionFunction",
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Code": {
          "ZipFile": "import json\ndef lambda_handler(event, context):\n    return {\n        'statusCode': 200,\n        'body': json.dumps('Hello from Lambda!')\n    }"
        },
        "Environment": {
          "Variables": {
            "ENVIRONMENT": "Production",
            "ENCRYPTED_VAR": "encrypted-value"
          }
        },
        "KmsKeyArn": {
          "Fn::GetAtt": [
            "KMSKey",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      },
      "Metadata": {
        "SecurityNote": "Lambda function with encrypted environment variables using KMS"
      }
    },
    "CPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "Production-WebServer-HighCPU",
        "AlarmDescription": "Alarm when server CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": {
              "Ref": "WebServerInstance"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ]
      }
    },
    "MemoryAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "Production-WebServer-HighMemory",
        "AlarmDescription": "Alarm when server memory exceeds 80%",
        "MetricName": "MemoryUtilization",
        "Namespace": "CWAgent",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": {
              "Ref": "WebServerInstance"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ]
      }
    },
    "DiskSpaceAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "Production-WebServer-LowDiskSpace",
        "AlarmDescription": "Alarm when server disk space exceeds 80%",
        "MetricName": "DiskSpaceUtilization",
        "Namespace": "CWAgent",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": {
              "Ref": "WebServerInstance"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ]
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": "ProductionAlerts",
        "KmsMasterKeyId": {
          "Ref": "KMSKey"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
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
        "Name": "Production-VPC-ID"
      }
    },
    "LoadBalancerDNS": {
      "Description": "Application Load Balancer DNS Name",
      "Value": {
        "Fn::GetAtt": [
          "ApplicationLoadBalancer",
          "DNSName"
        ]
      }
    },
    "ApplicationLogsBucket": {
      "Description": "S3 Bucket for Application Logs",
      "Value": {
        "Ref": "ApplicationLogsBucket"
      }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID for encryption",
      "Value": {
        "Ref": "KMSKey"
      },
      "Export": {
        "Name": "Production-KMS-Key"
      }
    }
  }
}
```

## Key Security Features Implemented

### 🔐 **Encryption & Key Management**
- **KMS Key