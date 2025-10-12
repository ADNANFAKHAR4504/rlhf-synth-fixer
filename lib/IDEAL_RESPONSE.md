
```json 

{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure multi-region AWS infrastructure with comprehensive security controls (Modernized with SSM Session Manager)",

  "Parameters": {
    "Environment": {
      "Type": "String",
      "Description": "Environment name for tagging",
      "Default": "Production",
      "AllowedValues": ["Development", "Staging", "Production"]
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment name for tagging",
      "Default": "dev"
    },
    "AlertEmail": {
      "Type": "String",
      "Description": "Email address for security alerts",
      "Default": "admin@example.com",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    },
    "LatestAmiId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Description": "Latest Amazon Linux 2023 AMI ID",
      "Default": "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
    }
  },

  "Resources": {
    "DefaultVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {"Key": "Name", "Value": "DefaultVPC"},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "DefaultSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "DefaultVPC"},
        "CidrBlock": "10.0.0.0/20",
        "AvailabilityZone": {
          "Fn::Select": [0, {"Fn::GetAZs": ""}]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Name", "Value": "DefaultSubnet1"},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "DefaultSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "DefaultVPC"},
        "CidrBlock": "10.0.16.0/20",
        "AvailabilityZone": {
          "Fn::Select": [1, {"Fn::GetAZs": ""}]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {"Key": "Name", "Value": "DefaultSubnet2"},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {"Key": "Name", "Value": "DefaultIGW"},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {"Ref": "DefaultVPC"},
        "InternetGatewayId": {"Ref": "InternetGateway"}
      }
    },

    "RouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "DefaultVPC"},
        "Tags": [
          {"Key": "Name", "Value": "DefaultRouteTable"},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "Route": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": {"Ref": "RouteTable"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {"Ref": "InternetGateway"}
      }
    },

    "SubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "DefaultSubnet1"},
        "RouteTableId": {"Ref": "RouteTable"}
      }
    },

    "SubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "DefaultSubnet2"},
        "RouteTableId": {"Ref": "RouteTable"}
      }
    },

    "S3LoggingBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Retain",
      "UpdateReplacePolicy": "Retain",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "secure-logs-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [{
            "ServerSideEncryptionByDefault": {
              "SSEAlgorithm": "AES256"
            }
          }]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "LifecycleConfiguration": {
          "Rules": [{
            "Id": "DeleteOldLogs",
            "Status": "Enabled",
            "ExpirationInDays": 90
          }]
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Purpose", "Value": "SecurityLogs"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "ApplicationDataBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "secure-app-data-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [{
            "ServerSideEncryptionByDefault": {
              "SSEAlgorithm": "aws:kms",
              "KMSMasterKeyID": {"Ref": "KMSKey"}
            }
          }]
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
        "LoggingConfiguration": {
          "DestinationBucketName": {"Ref": "S3LoggingBucket"},
          "LogFilePrefix": "application-data/"
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Purpose", "Value": "ApplicationData"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for encrypting sensitive data",
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM policies",
              "Effect": "Allow",
              "Principal": {
                "AWS": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"}
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
                  "s3.amazonaws.com",
                  "logs.amazonaws.com"
                ]
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey"
              ],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Purpose", "Value": "DataEncryption"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": "alias/secure-infrastructure",
        "TargetKeyId": {"Ref": "KMSKey"}
      }
    },

    "DatabasePasswordSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "/secure-app/database/password-${EnvironmentSuffix}"
        },
        "Description": "RDS database master password",
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\": \"admin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Purpose", "Value": "DatabaseCredentials"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "ApplicationSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for application servers",
        "VpcId": {"Ref": "DefaultVPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS traffic from anywhere"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP traffic from anywhere (redirects to HTTPS)"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": "ApplicationSecurityGroup"},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS database instances",
        "VpcId": {"Ref": "DefaultVPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {"Ref": "ApplicationSecurityGroup"},
            "Description": "Allow MySQL/Aurora access from application servers only"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": "DatabaseSecurityGroup"},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "BastionSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for bastion host (SSM Session Manager only)",
        "VpcId": {"Ref": "DefaultVPC"},
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": "BastionSecurityGroup"},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "EC2Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "SecureEC2Role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Allow",
            "Principal": {
              "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
          }]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
        "Policies": [
          {
            "PolicyName": "S3AccessPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "${ApplicationDataBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": "s3:ListBucket",
                  "Resource": {
                    "Fn::GetAtt": ["ApplicationDataBucket", "Arn"]
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "SecretsManagerAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [{
                "Effect": "Allow",
                "Action": [
                  "secretsmanager:GetSecretValue",
                  "secretsmanager:DescribeSecret"
                ],
                "Resource": {
                  "Ref": "DatabasePasswordSecret"
                }
              }]
            }
          }
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Roles": [{"Ref": "EC2Role"}]
      }
    },

    "HardenedEC2Instance": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": {"Ref": "LatestAmiId"},
        "InstanceType": "t3.micro",
        "IamInstanceProfile": {"Ref": "EC2InstanceProfile"},
        "SecurityGroupIds": [{"Ref": "ApplicationSecurityGroup"}],
        "SubnetId": {"Ref": "DefaultSubnet1"},
        "UserData": {
          "Fn::Base64": "#!/bin/bash\n# Update system\nyum update -y\n# Install CloudWatch agent\nwget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm\nrpm -U ./amazon-cloudwatch-agent.rpm\n# Disable password authentication\nsed -i 's/PasswordAuthentication yes/PasswordAuthentication no/g' /etc/ssh/sshd_config\nsystemctl restart sshd\n# Install fail2ban for brute force protection\nyum install -y fail2ban\nsystemctl enable fail2ban\nsystemctl start fail2ban\n# Configure automatic security updates\nyum install -y yum-cron\nsed -i 's/apply_updates = no/apply_updates = yes/g' /etc/yum/yum-cron.conf\nsystemctl enable yum-cron\nsystemctl start yum-cron\n"
        },
        "Tags": [
          {"Key": "Name", "Value": "HardenedApplicationServer"},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS instances",
        "SubnetIds": [
          {"Ref": "DefaultSubnet1"},
          {"Ref": "DefaultSubnet2"}
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "RDSDatabase": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "secure-db-${EnvironmentSuffix}"
        },
        "DBInstanceClass": "db.t3.micro",
        "Engine": "mysql",
        "EngineVersion": "8.0.39",
        "AllocatedStorage": "20",
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "KmsKeyId": {"Ref": "KMSKey"},
        "MasterUsername": "admin",
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${DatabasePasswordSecret}:SecretString:password}}"
        },
        "VPCSecurityGroups": [{"Ref": "DatabaseSecurityGroup"}],
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "PubliclyAccessible": false,
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "EnableCloudwatchLogsExports": ["error", "general", "slowquery"],
        "DeletionProtection": false,
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Purpose", "Value": "ApplicationDatabase"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "CloudTrailLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "RetentionInDays": 90
      }
    },

    "CloudTrailRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Allow",
            "Principal": {
              "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
          }]
        },
        "Policies": [{
          "PolicyName": "CloudTrailLogPolicy",
          "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [{
              "Effect": "Allow",
              "Action": [
                "logs:CreateLogStream",
                "logs:PutLogEvents"
              ],
              "Resource": {
                "Fn::GetAtt": ["CloudTrailLogGroup", "Arn"]
              }
            }]
          }
        }]
      }
    },

    "CloudTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "DependsOn": "CloudTrailBucketPolicy",
      "Properties": {
        "TrailName": {
          "Fn::Sub": "SecureTrail-${EnvironmentSuffix}"
        },
        "S3BucketName": {"Ref": "S3LoggingBucket"},
        "IncludeGlobalServiceEvents": true,
        "IsLogging": true,
        "IsMultiRegionTrail": true,
        "EnableLogFileValidation": true,
        "CloudWatchLogsLogGroupArn": {
          "Fn::GetAtt": ["CloudTrailLogGroup", "Arn"]
        },
        "CloudWatchLogsRoleArn": {
          "Fn::GetAtt": ["CloudTrailRole", "Arn"]
        },
        "EventSelectors": [
          {
            "ReadWriteType": "All",
            "IncludeManagementEvents": true
          }
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Purpose", "Value": "AuditLogs"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "CloudTrailBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {"Ref": "S3LoggingBucket"},
        "PolicyDocument": {
          "Statement": [
            {
              "Sid": "AWSCloudTrailAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::GetAtt": ["S3LoggingBucket", "Arn"]
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
                "Fn::Sub": "${S3LoggingBucket.Arn}/*"
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

    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "DisplayName": "Security Alert Notifications",
        "Subscription": [
          {
            "Endpoint": {"Ref": "AlertEmail"},
            "Protocol": "email"
          }
        ],
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Purpose", "Value": "SecurityAlerts"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "UnauthorizedAPICallsMetricFilter": {
      "Type": "AWS::Logs::MetricFilter",
      "Properties": {
        "FilterName": "UnauthorizedAPICalls",
        "FilterPattern": "{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }",
        "LogGroupName": {"Ref": "CloudTrailLogGroup"},
        "MetricTransformations": [
          {
            "MetricName": "UnauthorizedAPICalls",
            "MetricNamespace": "CloudTrailMetrics",
            "MetricValue": "1"
          }
        ]
      }
    },

    "UnauthorizedAPICallsAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "UnauthorizedAPICalls",
        "AlarmDescription": "Alert on unauthorized API calls",
        "MetricName": "UnauthorizedAPICalls",
        "Namespace": "CloudTrailMetrics",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanThreshold",
        "TreatMissingData": "notBreaching",
        "AlarmActions": [{"Ref": "SNSTopic"}]
      }
    },

    "RootAccountUsageMetricFilter": {
      "Type": "AWS::Logs::MetricFilter",
      "Properties": {
        "FilterName": "RootAccountUsage",
        "FilterPattern": "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }",
        "LogGroupName": {"Ref": "CloudTrailLogGroup"},
        "MetricTransformations": [
          {
            "MetricName": "RootAccountUsage",
            "MetricNamespace": "CloudTrailMetrics",
            "MetricValue": "1"
          }
        ]
      }
    },

    "RootAccountUsageAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "RootAccountUsage",
        "AlarmDescription": "Alert when root account is used",
        "MetricName": "RootAccountUsage",
        "Namespace": "CloudTrailMetrics",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanThreshold",
        "TreatMissingData": "notBreaching",
        "AlarmActions": [{"Ref": "SNSTopic"}]
      }
    },

    "WebACL": {
      "Type": "AWS::WAFv2::WebACL",
      "Properties": {
        "Name": {
          "Fn::Sub": "SecureWebACL-${EnvironmentSuffix}"
        },
        "Scope": "REGIONAL",
        "DefaultAction": {
          "Allow": {}
        },
        "Rules": [
          {
            "Name": "RateLimitRule",
            "Priority": 1,
            "Statement": {
              "RateBasedStatement": {
                "Limit": 2000,
                "AggregateKeyType": "IP"
              }
            },
            "Action": {
              "Block": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "RateLimitRule"
            }
          },
          {
            "Name": "AWSManagedRulesCommonRuleSet",
            "Priority": 2,
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesCommonRuleSet"
              }
            },
            "OverrideAction": {
              "None": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "CommonRuleSetMetric"
            }
          },
          {
            "Name": "AWSManagedRulesKnownBadInputsRuleSet",
            "Priority": 3,
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesKnownBadInputsRuleSet"
              }
            },
            "OverrideAction": {
              "None": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "KnownBadInputsRuleSetMetric"
            }
          },
          {
            "Name": "AWSManagedRulesSQLiRuleSet",
            "Priority": 4,
            "Statement": {
              "ManagedRuleGroupStatement": {
                "VendorName": "AWS",
                "Name": "AWSManagedRulesSQLiRuleSet"
              }
            },
            "OverrideAction": {
              "None": {}
            },
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "SQLiRuleSetMetric"
            }
          }
        ],
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": "WebACLMetric"
        },
        "Tags": [
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Purpose", "Value": "WebApplicationFirewall"},
          {"Key": "ManagedBy", "Value": "CloudFormation"}
        ]
      }
    },

    "WAFLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "aws-waf-logs-secure-infrastructure-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },

    "WAFLoggingConfiguration": {
      "Type": "AWS::WAFv2::LoggingConfiguration",
      "Properties": {
        "ResourceArn": {
          "Fn::GetAtt": ["WebACL", "Arn"]
        },
        "LogDestinationConfigs": [
          {
            "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:aws-waf-logs-secure-infrastructure-${EnvironmentSuffix}"
          }
        ]
      }
    }
  },

  "Outputs": {
    "VPCId": {
      "Description": "ID of the created VPC",
      "Value": {"Ref": "DefaultVPC"},
      "Export": {
        "Name": {"Fn::Sub": "${EnvironmentSuffix}-VPCId"}
      }
    },
    "S3LoggingBucketName": {
      "Description": "Name of the S3 bucket for logging",
      "Value": {"Ref": "S3LoggingBucket"},
      "Export": {
        "Name": {"Fn::Sub": "${EnvironmentSuffix}-LoggingBucket"}
      }
    },
    "ApplicationDataBucketName": {
      "Description": "Name of the S3 bucket for application data",
      "Value": {"Ref": "ApplicationDataBucket"},
      "Export": {
        "Name": {"Fn::Sub": "${EnvironmentSuffix}-ApplicationBucket"}
      }
    },
    "DatabaseEndpoint": {
      "Description": "RDS database endpoint",
      "Value": {
        "Fn::GetAtt": ["RDSDatabase", "Endpoint.Address"]
      }
    },
    "DatabaseSecretArn": {
      "Description": "ARN of the database password secret",
      "Value": {"Ref": "DatabasePasswordSecret"}
    },
    "EC2InstanceId": {
      "Description": "ID of the hardened EC2 instance (Use SSM Session Manager to connect)",
      "Value": {"Ref": "HardenedEC2Instance"}
    },
    "EC2SessionManagerURL": {
      "Description": "URL to connect to EC2 via SSM Session Manager",
      "Value": {
        "Fn::Sub": "https://${AWS::Region}.console.aws.amazon.com/systems-manager/session-manager/${HardenedEC2Instance}?region=${AWS::Region}"
      }
    },
    "WebACLArn": {
      "Description": "ARN of the WAF WebACL",
      "Value": {
        "Fn::GetAtt": ["WebACL", "Arn"]
      }
    },
    "SNSTopicArn": {
      "Description": "ARN of SNS topic for security alerts",
      "Value": {"Ref": "SNSTopic"}
    },
    "CloudTrailArn": {
      "Description": "ARN of the CloudTrail",
      "Value": {
        "Fn::GetAtt": ["CloudTrail", "Arn"]
      }
    },
    "KMSKeyId": {
      "Description": "ID of the KMS key for encryption",
      "Value": {"Ref": "KMSKey"}
    }
  }
}

```