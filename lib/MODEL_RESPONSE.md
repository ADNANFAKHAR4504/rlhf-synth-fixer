# Multi-Region Disaster Recovery Solution - CloudFormation Implementation

This implementation provides a complete multi-region disaster recovery solution using CloudFormation JSON templates. Due to CloudFormation's single-region deployment model, we'll create two separate stacks that work together.

## Architecture Overview

The solution consists of:
- Primary stack deployed to us-east-1 with all primary resources
- Secondary stack deployed to us-west-2 with DR resources
- Global resources (Route 53, IAM roles) in the primary stack
- Cross-region replication for S3 and Aurora Global Database

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-Region Disaster Recovery Solution for Payment Processing - Primary Region (us-east-1)",
  "Parameters": {
    "environmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to enable multiple deployments",
      "Default": "dev",
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "DBMasterUsername": {
      "Type": "String",
      "Description": "Master username for Aurora database",
      "Default": "admin",
      "NoEcho": true
    },
    "DBMasterPassword": {
      "Type": "String",
      "Description": "Master password for Aurora database",
      "NoEcho": true,
      "MinLength": 8
    },
    "HostedZoneName": {
      "Type": "String",
      "Description": "Route 53 hosted zone name (e.g., example.com)",
      "Default": "payment-dr.local"
    },
    "AlertEmail": {
      "Type": "String",
      "Description": "Email address for CloudWatch alarm notifications",
      "Default": "alerts@example.com"
    },
    "SecondaryRegion": {
      "Type": "String",
      "Description": "Secondary DR region",
      "Default": "us-west-2"
    }
  },
  "Resources": {
    "PrimaryVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-primary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrimaryPublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "PrimaryVPC"
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
              "Fn::Sub": "subnet-public-1-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrimaryPublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "PrimaryVPC"
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
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "subnet-public-2-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrimaryPrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "PrimaryVPC"
        },
        "CidrBlock": "10.0.11.0/24",
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
            "Value": {
              "Fn::Sub": "subnet-private-1-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrimaryPrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "PrimaryVPC"
        },
        "CidrBlock": "10.0.12.0/24",
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
            "Value": {
              "Fn::Sub": "subnet-private-2-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrimaryInternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "igw-primary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrimaryVPCGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {
          "Ref": "PrimaryVPC"
        },
        "InternetGatewayId": {
          "Ref": "PrimaryInternetGateway"
        }
      }
    },
    "PrimaryPublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "PrimaryVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "rt-public-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrimaryPublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "PrimaryVPCGatewayAttachment",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrimaryPublicRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {
          "Ref": "PrimaryInternetGateway"
        }
      }
    },
    "PrimaryPublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrimaryPublicSubnet1"
        },
        "RouteTableId": {
          "Ref": "PrimaryPublicRouteTable"
        }
      }
    },
    "PrimaryPublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrimaryPublicSubnet2"
        },
        "RouteTableId": {
          "Ref": "PrimaryPublicRouteTable"
        }
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "aurora-subnet-group-${environmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for Aurora Global Database",
        "SubnetIds": [
          {
            "Ref": "PrimaryPrivateSubnet1"
          },
          {
            "Ref": "PrimaryPrivateSubnet2"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-subnet-group-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "AuroraSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "sg-aurora-${environmentSuffix}"
        },
        "GroupDescription": "Security group for Aurora database",
        "VpcId": {
          "Ref": "PrimaryVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "LambdaSecurityGroup"
            },
            "Description": "Allow MySQL from Lambda functions"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": "20.0.0.0/16",
            "Description": "Allow MySQL from secondary region VPC"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "sg-aurora-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "GlobalDBCluster": {
      "Type": "AWS::RDS::GlobalCluster",
      "Properties": {
        "GlobalClusterIdentifier": {
          "Fn::Sub": "global-payment-cluster-${environmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "DeletionProtection": false,
        "StorageEncrypted": true
      },
      "DeletionPolicy": "Delete"
    },
    "PrimaryDBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DependsOn": "GlobalDBCluster",
      "Properties": {
        "DBClusterIdentifier": {
          "Fn::Sub": "primary-payment-cluster-${environmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "MasterUsername": {
          "Ref": "DBMasterUsername"
        },
        "MasterUserPassword": {
          "Ref": "DBMasterPassword"
        },
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "AuroraSecurityGroup"
          }
        ],
        "GlobalClusterIdentifier": {
          "Ref": "GlobalDBCluster"
        },
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "StorageEncrypted": true,
        "EnableCloudwatchLogsExports": [
          "error",
          "slowquery"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "primary-payment-cluster-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrimaryDBInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "primary-payment-instance-${environmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "PrimaryDBCluster"
        },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.r5.large",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "primary-payment-instance-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "TransactionLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "transaction-logs-primary-${environmentSuffix}-${AWS::AccountId}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
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
        "ReplicationConfiguration": {
          "Role": {
            "Fn::GetAtt": [
              "S3ReplicationRole",
              "Arn"
            ]
          },
          "Rules": [
            {
              "Id": "ReplicateToSecondary",
              "Status": "Enabled",
              "Priority": 1,
              "DeleteMarkerReplication": {
                "Status": "Enabled"
              },
              "Filter": {
                "Prefix": ""
              },
              "Destination": {
                "Bucket": {
                  "Fn::Sub": "arn:aws:s3:::transaction-logs-secondary-${environmentSuffix}-${AWS::AccountId}"
                },
                "ReplicationTime": {
                  "Status": "Enabled",
                  "Time": {
                    "Minutes": 15
                  }
                },
                "Metrics": {
                  "Status": "Enabled",
                  "EventThreshold": {
                    "Minutes": 15
                  }
                }
              }
            }
          ]
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
            "Value": {
              "Fn::Sub": "transaction-logs-primary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "S3ReplicationRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "s3-replication-role-${environmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "s3.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "S3ReplicationPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetReplicationConfiguration",
                    "s3:ListBucket"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "TransactionLogsBucket",
                      "Arn"
                    ]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObjectVersionForReplication",
                    "s3:GetObjectVersionAcl",
                    "s3:GetObjectVersionTagging"
                  ],
                  "Resource": {
                    "Fn::Sub": "${TransactionLogsBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:ReplicateObject",
                    "s3:ReplicateDelete",
                    "s3:ReplicateTags"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:s3:::transaction-logs-secondary-${environmentSuffix}-${AWS::AccountId}/*"
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
              "Fn::Sub": "s3-replication-role-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "sg-lambda-${environmentSuffix}"
        },
        "GroupDescription": "Security group for Lambda functions",
        "VpcId": {
          "Ref": "PrimaryVPC"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "sg-lambda-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "lambda-execution-role-${environmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "LambdaPaymentProcessingPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:GetObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "${TransactionLogsBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": "arn:aws:logs:*:*:*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sts:AssumeRole"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/lambda-execution-role-*"
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
              "Fn::Sub": "lambda-execution-role-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PaymentProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "payment-processor-${environmentSuffix}"
        },
        "Runtime": "nodejs18.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Timeout": 30,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "DB_ENDPOINT": {
              "Fn::GetAtt": [
                "PrimaryDBCluster",
                "Endpoint.Address"
              ]
            },
            "DB_NAME": "payments",
            "BUCKET_NAME": {
              "Ref": "TransactionLogsBucket"
            },
            "REGION": {
              "Ref": "AWS::Region"
            }
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "LambdaSecurityGroup"
            }
          ],
          "SubnetIds": [
            {
              "Ref": "PrimaryPrivateSubnet1"
            },
            {
              "Ref": "PrimaryPrivateSubnet2"
            }
          ]
        },
        "Code": {
          "ZipFile": "const AWS = require('aws-sdk');\nconst s3 = new AWS.S3();\n\nexports.handler = async (event) => {\n  console.log('Processing payment:', JSON.stringify(event));\n  \n  try {\n    const transactionId = event.transactionId || Date.now().toString();\n    const amount = event.amount || 0;\n    const timestamp = new Date().toISOString();\n    \n    // Log transaction to S3\n    const logData = {\n      transactionId,\n      amount,\n      timestamp,\n      status: 'processed',\n      region: process.env.REGION\n    };\n    \n    await s3.putObject({\n      Bucket: process.env.BUCKET_NAME,\n      Key: `transactions/${timestamp}/${transactionId}.json`,\n      Body: JSON.stringify(logData),\n      ContentType: 'application/json'\n    }).promise();\n    \n    return {\n      statusCode: 200,\n      body: JSON.stringify({\n        message: 'Payment processed successfully',\n        transactionId,\n        region: process.env.REGION\n      })\n    };\n  } catch (error) {\n    console.error('Payment processing error:', error);\n    throw error;\n  }\n};\n"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-processor-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "sg-alb-${environmentSuffix}"
        },
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {
          "Ref": "PrimaryVPC"
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
              "Fn::Sub": "sg-alb-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrimaryALB": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "alb-primary-${environmentSuffix}"
        },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          {
            "Ref": "PrimaryPublicSubnet1"
          },
          {
            "Ref": "PrimaryPublicSubnet2"
          }
        ],
        "SecurityGroups": [
          {
            "Ref": "ALBSecurityGroup"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "alb-primary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrimaryTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "tg-primary-${environmentSuffix}"
        },
        "TargetType": "lambda",
        "Targets": [
          {
            "Id": {
              "Fn::GetAtt": [
                "PaymentProcessorFunction",
                "Arn"
              ]
            }
          }
        ],
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTPS",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "tg-primary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "LambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "PaymentProcessorFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "elasticloadbalancing.amazonaws.com",
        "SourceArn": {
          "Ref": "PrimaryTargetGroup"
        }
      }
    },
    "PrimaryALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {
          "Ref": "PrimaryALB"
        },
        "Protocol": "HTTP",
        "Port": 80,
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "PrimaryTargetGroup"
            }
          }
        ]
      }
    },
    "PrimaryALBHealthCheck": {
      "Type": "AWS::Route53::HealthCheck",
      "Properties": {
        "HealthCheckConfig": {
          "Type": "HTTPS",
          "ResourcePath": "/health",
          "FullyQualifiedDomainName": {
            "Fn::GetAtt": [
              "PrimaryALB",
              "DNSName"
            ]
          },
          "Port": 443,
          "RequestInterval": 30,
          "FailureThreshold": 3
        },
        "HealthCheckTags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "health-check-primary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "HostedZone": {
      "Type": "AWS::Route53::HostedZone",
      "Properties": {
        "Name": {
          "Ref": "HostedZoneName"
        },
        "HostedZoneConfig": {
          "Comment": {
            "Fn::Sub": "Hosted zone for payment DR solution - ${environmentSuffix}"
          }
        },
        "HostedZoneTags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "hz-payment-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrimaryRecordSet": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneId": {
          "Ref": "HostedZone"
        },
        "Name": {
          "Fn::Sub": "payments.${HostedZoneName}"
        },
        "Type": "A",
        "SetIdentifier": "Primary",
        "Failover": "PRIMARY",
        "HealthCheckId": {
          "Ref": "PrimaryALBHealthCheck"
        },
        "AliasTarget": {
          "HostedZoneId": {
            "Fn::GetAtt": [
              "PrimaryALB",
              "CanonicalHostedZoneID"
            ]
          },
          "DNSName": {
            "Fn::GetAtt": [
              "PrimaryALB",
              "DNSName"
            ]
          },
          "EvaluateTargetHealth": true
        }
      }
    },
    "PrimarySNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "payment-alerts-primary-${environmentSuffix}"
        },
        "DisplayName": "Payment Processing Alerts - Primary Region",
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
              "Fn::Sub": "payment-alerts-primary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "AuroraReplicationLagAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "aurora-replication-lag-${environmentSuffix}"
        },
        "AlarmDescription": "Alert when Aurora replication lag exceeds 5 seconds",
        "MetricName": "AuroraGlobalDBReplicationLag",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 5000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "PrimaryDBCluster"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "PrimarySNSTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "ALBTargetHealthAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "alb-target-health-${environmentSuffix}"
        },
        "AlarmDescription": "Alert when ALB has no healthy targets",
        "MetricName": "HealthyHostCount",
        "Namespace": "AWS/ApplicationELB",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 1,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "TargetGroup",
            "Value": {
              "Fn::GetAtt": [
                "PrimaryTargetGroup",
                "TargetGroupFullName"
              ]
            }
          },
          {
            "Name": "LoadBalancer",
            "Value": {
              "Fn::GetAtt": [
                "PrimaryALB",
                "LoadBalancerFullName"
              ]
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "PrimarySNSTopic"
          }
        ]
      }
    },
    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "lambda-errors-${environmentSuffix}"
        },
        "AlarmDescription": "Alert when Lambda function has errors",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "PaymentProcessorFunction"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "PrimarySNSTopic"
          }
        ]
      }
    },
    "HealthCheckAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "route53-health-check-${environmentSuffix}"
        },
        "AlarmDescription": "Alert when Route 53 health check fails",
        "MetricName": "HealthCheckStatus",
        "Namespace": "AWS/Route53",
        "Statistic": "Minimum",
        "Period": 60,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "HealthCheckId",
            "Value": {
              "Ref": "PrimaryALBHealthCheck"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "PrimarySNSTopic"
          }
        ]
      }
    }
  },
  "Outputs": {
    "PrimaryVPCId": {
      "Description": "VPC ID for primary region",
      "Value": {
        "Ref": "PrimaryVPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPCId"
        }
      }
    },
    "PrimaryALBDNSName": {
      "Description": "DNS name of the primary Application Load Balancer",
      "Value": {
        "Fn::GetAtt": [
          "PrimaryALB",
          "DNSName"
        ]
      }
    },
    "GlobalDBClusterArn": {
      "Description": "ARN of the Aurora Global Database cluster",
      "Value": {
        "Fn::Sub": "arn:aws:rds::${AWS::AccountId}:global-cluster:${GlobalDBCluster}"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-GlobalDBClusterArn"
        }
      }
    },
    "PrimaryDBClusterEndpoint": {
      "Description": "Writer endpoint for the primary Aurora cluster",
      "Value": {
        "Fn::GetAtt": [
          "PrimaryDBCluster",
          "Endpoint.Address"
        ]
      }
    },
    "TransactionLogsBucketName": {
      "Description": "S3 bucket for transaction logs in primary region",
      "Value": {
        "Ref": "TransactionLogsBucket"
      }
    },
    "Route53HostedZoneId": {
      "Description": "Hosted Zone ID for Route 53",
      "Value": {
        "Ref": "HostedZone"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-HostedZoneId"
        }
      }
    },
    "PaymentEndpoint": {
      "Description": "Route 53 payment processing endpoint",
      "Value": {
        "Fn::Sub": "payments.${HostedZoneName}"
      }
    }
  }
}
```

## File: lib/TapStack-Secondary.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-Region Disaster Recovery Solution for Payment Processing - Secondary Region (us-west-2)",
  "Parameters": {
    "environmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to enable multiple deployments",
      "Default": "dev",
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "PrimaryVPCCidr": {
      "Type": "String",
      "Description": "CIDR block of primary VPC for peering",
      "Default": "10.0.0.0/16"
    },
    "PrimaryVPCId": {
      "Type": "String",
      "Description": "VPC ID from primary region for peering"
    },
    "GlobalClusterIdentifier": {
      "Type": "String",
      "Description": "Global cluster identifier from primary region"
    },
    "HostedZoneId": {
      "Type": "String",
      "Description": "Route 53 Hosted Zone ID from primary region"
    },
    "HostedZoneName": {
      "Type": "String",
      "Description": "Route 53 hosted zone name",
      "Default": "payment-dr.local"
    },
    "AlertEmail": {
      "Type": "String",
      "Description": "Email address for CloudWatch alarm notifications",
      "Default": "alerts@example.com"
    }
  },
  "Resources": {
    "SecondaryVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "20.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-secondary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryPublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "SecondaryVPC"
        },
        "CidrBlock": "20.0.1.0/24",
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
              "Fn::Sub": "subnet-secondary-public-1-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryPublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "SecondaryVPC"
        },
        "CidrBlock": "20.0.2.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            1,
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
              "Fn::Sub": "subnet-secondary-public-2-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryPrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "SecondaryVPC"
        },
        "CidrBlock": "20.0.11.0/24",
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
            "Value": {
              "Fn::Sub": "subnet-secondary-private-1-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryPrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "SecondaryVPC"
        },
        "CidrBlock": "20.0.12.0/24",
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
            "Value": {
              "Fn::Sub": "subnet-secondary-private-2-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryInternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "igw-secondary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryVPCGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {
          "Ref": "SecondaryVPC"
        },
        "InternetGatewayId": {
          "Ref": "SecondaryInternetGateway"
        }
      }
    },
    "SecondaryPublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "SecondaryVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "rt-secondary-public-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryPublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "SecondaryVPCGatewayAttachment",
      "Properties": {
        "RouteTableId": {
          "Ref": "SecondaryPublicRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {
          "Ref": "SecondaryInternetGateway"
        }
      }
    },
    "SecondaryPublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "SecondaryPublicSubnet1"
        },
        "RouteTableId": {
          "Ref": "SecondaryPublicRouteTable"
        }
      }
    },
    "SecondaryPublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "SecondaryPublicSubnet2"
        },
        "RouteTableId": {
          "Ref": "SecondaryPublicRouteTable"
        }
      }
    },
    "SecondaryDBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "aurora-subnet-group-secondary-${environmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for Aurora secondary cluster",
        "SubnetIds": [
          {
            "Ref": "SecondaryPrivateSubnet1"
          },
          {
            "Ref": "SecondaryPrivateSubnet2"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-subnet-group-secondary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryAuroraSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "sg-aurora-secondary-${environmentSuffix}"
        },
        "GroupDescription": "Security group for Aurora secondary database",
        "VpcId": {
          "Ref": "SecondaryVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "SecondaryLambdaSecurityGroup"
            },
            "Description": "Allow MySQL from Lambda functions"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": {
              "Ref": "PrimaryVPCCidr"
            },
            "Description": "Allow MySQL from primary region VPC"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "sg-aurora-secondary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryDBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": {
          "Fn::Sub": "secondary-payment-cluster-${environmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "DBSubnetGroupName": {
          "Ref": "SecondaryDBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "SecondaryAuroraSecurityGroup"
          }
        ],
        "GlobalClusterIdentifier": {
          "Ref": "GlobalClusterIdentifier"
        },
        "StorageEncrypted": true,
        "EnableCloudwatchLogsExports": [
          "error",
          "slowquery"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "secondary-payment-cluster-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryDBInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "secondary-payment-instance-${environmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "SecondaryDBCluster"
        },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.r5.large",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "secondary-payment-instance-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "TransactionLogsSecondaryBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "transaction-logs-secondary-${environmentSuffix}-${AWS::AccountId}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
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
            "Value": {
              "Fn::Sub": "transaction-logs-secondary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryLambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "sg-lambda-secondary-${environmentSuffix}"
        },
        "GroupDescription": "Security group for Lambda functions in secondary region",
        "VpcId": {
          "Ref": "SecondaryVPC"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "sg-lambda-secondary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryLambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "lambda-execution-role-secondary-${environmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "LambdaPaymentProcessingPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:GetObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "${TransactionLogsSecondaryBucket.Arn}/*"
                  }
                },
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
              "Fn::Sub": "lambda-execution-role-secondary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryPaymentProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "payment-processor-secondary-${environmentSuffix}"
        },
        "Runtime": "nodejs18.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": [
            "SecondaryLambdaExecutionRole",
            "Arn"
          ]
        },
        "Timeout": 30,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "DB_ENDPOINT": {
              "Fn::GetAtt": [
                "SecondaryDBCluster",
                "ReadEndpoint.Address"
              ]
            },
            "DB_NAME": "payments",
            "BUCKET_NAME": {
              "Ref": "TransactionLogsSecondaryBucket"
            },
            "REGION": {
              "Ref": "AWS::Region"
            }
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "SecondaryLambdaSecurityGroup"
            }
          ],
          "SubnetIds": [
            {
              "Ref": "SecondaryPrivateSubnet1"
            },
            {
              "Ref": "SecondaryPrivateSubnet2"
            }
          ]
        },
        "Code": {
          "ZipFile": "const AWS = require('aws-sdk');\nconst s3 = new AWS.S3();\n\nexports.handler = async (event) => {\n  console.log('Processing payment (DR):', JSON.stringify(event));\n  \n  try {\n    const transactionId = event.transactionId || Date.now().toString();\n    const amount = event.amount || 0;\n    const timestamp = new Date().toISOString();\n    \n    // Log transaction to S3\n    const logData = {\n      transactionId,\n      amount,\n      timestamp,\n      status: 'processed',\n      region: process.env.REGION,\n      failover: true\n    };\n    \n    await s3.putObject({\n      Bucket: process.env.BUCKET_NAME,\n      Key: `transactions/${timestamp}/${transactionId}.json`,\n      Body: JSON.stringify(logData),\n      ContentType: 'application/json'\n    }).promise();\n    \n    return {\n      statusCode: 200,\n      body: JSON.stringify({\n        message: 'Payment processed successfully (DR)',\n        transactionId,\n        region: process.env.REGION,\n        failover: true\n      })\n    };\n  } catch (error) {\n    console.error('Payment processing error:', error);\n    throw error;\n  }\n};\n"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-processor-secondary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "sg-alb-secondary-${environmentSuffix}"
        },
        "GroupDescription": "Security group for Application Load Balancer in secondary region",
        "VpcId": {
          "Ref": "SecondaryVPC"
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
              "Fn::Sub": "sg-alb-secondary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryALB": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "alb-secondary-${environmentSuffix}"
        },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          {
            "Ref": "SecondaryPublicSubnet1"
          },
          {
            "Ref": "SecondaryPublicSubnet2"
          }
        ],
        "SecurityGroups": [
          {
            "Ref": "SecondaryALBSecurityGroup"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "alb-secondary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "tg-secondary-${environmentSuffix}"
        },
        "TargetType": "lambda",
        "Targets": [
          {
            "Id": {
              "Fn::GetAtt": [
                "SecondaryPaymentProcessorFunction",
                "Arn"
              ]
            }
          }
        ],
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTPS",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "tg-secondary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryLambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "SecondaryPaymentProcessorFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "elasticloadbalancing.amazonaws.com",
        "SourceArn": {
          "Ref": "SecondaryTargetGroup"
        }
      }
    },
    "SecondaryALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {
          "Ref": "SecondaryALB"
        },
        "Protocol": "HTTP",
        "Port": 80,
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "SecondaryTargetGroup"
            }
          }
        ]
      }
    },
    "SecondaryALBHealthCheck": {
      "Type": "AWS::Route53::HealthCheck",
      "Properties": {
        "HealthCheckConfig": {
          "Type": "HTTPS",
          "ResourcePath": "/health",
          "FullyQualifiedDomainName": {
            "Fn::GetAtt": [
              "SecondaryALB",
              "DNSName"
            ]
          },
          "Port": 443,
          "RequestInterval": 30,
          "FailureThreshold": 3
        },
        "HealthCheckTags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "health-check-secondary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryRecordSet": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneId": {
          "Ref": "HostedZoneId"
        },
        "Name": {
          "Fn::Sub": "payments.${HostedZoneName}"
        },
        "Type": "A",
        "SetIdentifier": "Secondary",
        "Failover": "SECONDARY",
        "HealthCheckId": {
          "Ref": "SecondaryALBHealthCheck"
        },
        "AliasTarget": {
          "HostedZoneId": {
            "Fn::GetAtt": [
              "SecondaryALB",
              "CanonicalHostedZoneID"
            ]
          },
          "DNSName": {
            "Fn::GetAtt": [
              "SecondaryALB",
              "DNSName"
            ]
          },
          "EvaluateTargetHealth": true
        }
      }
    },
    "SecondarySNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "payment-alerts-secondary-${environmentSuffix}"
        },
        "DisplayName": "Payment Processing Alerts - Secondary Region",
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
              "Fn::Sub": "payment-alerts-secondary-${environmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "SecondaryLambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "lambda-errors-secondary-${environmentSuffix}"
        },
        "AlarmDescription": "Alert when Lambda function has errors in secondary region",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "SecondaryPaymentProcessorFunction"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SecondarySNSTopic"
          }
        ]
      }
    },
    "SecondaryHealthCheckAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "route53-health-check-secondary-${environmentSuffix}"
        },
        "AlarmDescription": "Alert when Route 53 health check fails in secondary region",
        "MetricName": "HealthCheckStatus",
        "Namespace": "AWS/Route53",
        "Statistic": "Minimum",
        "Period": 60,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "HealthCheckId",
            "Value": {
              "Ref": "SecondaryALBHealthCheck"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SecondarySNSTopic"
          }
        ]
      }
    }
  },
  "Outputs": {
    "SecondaryVPCId": {
      "Description": "VPC ID for secondary region",
      "Value": {
        "Ref": "SecondaryVPC"
      }
    },
    "SecondaryALBDNSName": {
      "Description": "DNS name of the secondary Application Load Balancer",
      "Value": {
        "Fn::GetAtt": [
          "SecondaryALB",
          "DNSName"
        ]
      }
    },
    "SecondaryDBClusterEndpoint": {
      "Description": "Reader endpoint for the secondary Aurora cluster",
      "Value": {
        "Fn::GetAtt": [
          "SecondaryDBCluster",
          "ReadEndpoint.Address"
        ]
      }
    },
    "TransactionLogsSecondaryBucketName": {
      "Description": "S3 bucket for transaction logs in secondary region",
      "Value": {
        "Ref": "TransactionLogsSecondaryBucket"
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# Multi-Region Disaster Recovery Solution

This CloudFormation solution implements a complete multi-region disaster recovery infrastructure for payment processing with active-passive failover between us-east-1 and us-west-2.

## Architecture

- **Primary Region (us-east-1)**: Active writer database, primary ALB, Lambda functions
- **Secondary Region (us-west-2)**: Read replica database, secondary ALB, Lambda functions
- **Route 53**: Health check-based failover routing
- **Aurora Global Database**: Multi-region replication with <1 second lag
- **S3 Cross-Region Replication**: Transaction logs replicated to DR region

## Deployment Instructions

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. Two AWS regions available (us-east-1 and us-west-2)
3. Email address for SNS notifications
4. Database master password (minimum 8 characters)

### Step 1: Deploy Primary Stack (us-east-1)

```bash
aws cloudformation create-stack \
  --stack-name payment-dr-primary \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=environmentSuffix,ParameterValue=prod \
    ParameterKey=DBMasterUsername,ParameterValue=admin \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123 \
    ParameterKey=HostedZoneName,ParameterValue=payment-dr.example.com \
    ParameterKey=AlertEmail,ParameterValue=alerts@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

Wait for stack creation to complete:

```bash
aws cloudformation wait stack-create-complete \
  --stack-name payment-dr-primary \
  --region us-east-1
```

### Step 2: Get Primary Stack Outputs

```bash
PRIMARY_VPC_ID=$(aws cloudformation describe-stacks \
  --stack-name payment-dr-primary \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`PrimaryVPCId`].OutputValue' \
  --output text)

GLOBAL_CLUSTER=$(aws cloudformation describe-stacks \
  --stack-name payment-dr-primary \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`GlobalDBClusterArn`].OutputValue' \
  --output text | cut -d: -f6)

HOSTED_ZONE_ID=$(aws cloudformation describe-stacks \
  --stack-name payment-dr-primary \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`Route53HostedZoneId`].OutputValue' \
  --output text)

echo "Primary VPC ID: $PRIMARY_VPC_ID"
echo "Global Cluster: $GLOBAL_CLUSTER"
echo "Hosted Zone ID: $HOSTED_ZONE_ID"
```

### Step 3: Create Secondary S3 Bucket First

The primary stack's S3 replication requires the secondary bucket to exist:

```bash
aws s3api create-bucket \
  --bucket transaction-logs-secondary-prod-$(aws sts get-caller-identity --query Account --output text) \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2

aws s3api put-bucket-versioning \
  --bucket transaction-logs-secondary-prod-$(aws sts get-caller-identity --query Account --output text) \
  --versioning-configuration Status=Enabled \
  --region us-west-2
```

### Step 4: Deploy Secondary Stack (us-west-2)

```bash
aws cloudformation create-stack \
  --stack-name payment-dr-secondary \
  --template-body file://lib/TapStack-Secondary.json \
  --parameters \
    ParameterKey=environmentSuffix,ParameterValue=prod \
    ParameterKey=PrimaryVPCId,ParameterValue=$PRIMARY_VPC_ID \
    ParameterKey=GlobalClusterIdentifier,ParameterValue=$GLOBAL_CLUSTER \
    ParameterKey=HostedZoneId,ParameterValue=$HOSTED_ZONE_ID \
    ParameterKey=HostedZoneName,ParameterValue=payment-dr.example.com \
    ParameterKey=AlertEmail,ParameterValue=alerts@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

Wait for stack creation to complete:

```bash
aws cloudformation wait stack-create-complete \
  --stack-name payment-dr-secondary \
  --region us-west-2
```

### Step 5: Configure VPC Peering

Note: VPC peering between regions in the same account requires manual setup as CloudFormation doesn't support cross-region peering creation directly.

```bash
# Create peering connection from primary to secondary
PEERING_ID=$(aws ec2 create-vpc-peering-connection \
  --vpc-id $PRIMARY_VPC_ID \
  --peer-vpc-id $(aws ec2 describe-vpcs --region us-west-2 --filters "Name=tag:Name,Values=vpc-secondary-prod" --query 'Vpcs[0].VpcId' --output text) \
  --peer-region us-west-2 \
  --region us-east-1 \
  --query 'VpcPeeringConnection.VpcPeeringConnectionId' \
  --output text)

# Accept peering connection in secondary region
aws ec2 accept-vpc-peering-connection \
  --vpc-peering-connection-id $PEERING_ID \
  --region us-west-2
```

## Testing the Deployment

### Test Primary Region

```bash
PRIMARY_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name payment-dr-primary \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`PaymentEndpoint`].OutputValue' \
  --output text)

# Invoke Lambda function directly
aws lambda invoke \
  --function-name payment-processor-prod \
  --payload '{"transactionId": "test-123", "amount": 100.00}' \
  --region us-east-1 \
  response.json

cat response.json
```

### Test Secondary Region

```bash
aws lambda invoke \
  --function-name payment-processor-secondary-prod \
  --payload '{"transactionId": "test-456", "amount": 200.00}' \
  --region us-west-2 \
  response-secondary.json

cat response-secondary.json
```

### Verify S3 Replication

```bash
# Upload test file to primary bucket
echo "test transaction" > test-transaction.txt
aws s3 cp test-transaction.txt s3://transaction-logs-primary-prod-$(aws sts get-caller-identity --query Account --output text)/test/

# Wait 15 minutes (replication time)
sleep 900

# Check secondary bucket
aws s3 ls s3://transaction-logs-secondary-prod-$(aws sts get-caller-identity --query Account --output text)/test/ --region us-west-2
```

### Monitor Aurora Replication

```bash
# Check replication lag
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name AuroraGlobalDBReplicationLag \
  --dimensions Name=DBClusterIdentifier,Value=primary-payment-cluster-prod \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average \
  --region us-east-1
```

## Cleanup

To delete the infrastructure:

```bash
# Delete secondary stack first
aws cloudformation delete-stack \
  --stack-name payment-dr-secondary \
  --region us-west-2

aws cloudformation wait stack-delete-complete \
  --stack-name payment-dr-secondary \
  --region us-west-2

# Delete secondary S3 bucket
aws s3 rm s3://transaction-logs-secondary-prod-$(aws sts get-caller-identity --query Account --output text) --recursive --region us-west-2
aws s3api delete-bucket \
  --bucket transaction-logs-secondary-prod-$(aws sts get-caller-identity --query Account --output text) \
  --region us-west-2

# Delete primary stack
aws cloudformation delete-stack \
  --stack-name payment-dr-primary \
  --region us-east-1

aws cloudformation wait stack-delete-complete \
  --stack-name payment-dr-primary \
  --region us-east-1
```

## Important Notes

1. **Aurora Global Database**: The global cluster must be created in the primary region first, then the secondary cluster joins it.

2. **S3 Replication**: The secondary bucket must exist before the primary stack is created, or you'll need to update the primary stack after creating the secondary bucket.

3. **VPC Peering**: Manual configuration required for cross-region peering. Update route tables to allow traffic between VPCs.

4. **Health Checks**: Route 53 health checks monitor ALB endpoints. Failover happens automatically when primary health check fails.

5. **Costs**: This infrastructure runs continuously. Consider using Aurora Serverless v2 for cost optimization in DR region.

6. **DNS Propagation**: After Route 53 failover, DNS changes may take up to TTL duration to propagate (default 60 seconds).

7. **Testing Failover**: To test failover, stop the primary ALB or RDS instance and monitor Route 53 health check status.

## Monitoring

CloudWatch alarms are configured for:
- Aurora replication lag (threshold: 5 seconds)
- ALB target health
- Lambda function errors
- Route 53 health check status

All alarms publish to SNS topics in their respective regions.

## Security

- All data encrypted at rest (Aurora, S3)
- VPC security groups restrict access
- IAM roles follow least privilege principle
- Database credentials passed securely via CloudFormation parameters
- Lambda functions run in private subnets with VPC configuration
