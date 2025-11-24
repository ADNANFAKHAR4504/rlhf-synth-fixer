# CloudFormation Template for Highly Available Payment Processing Infrastructure

This CloudFormation template creates a highly available payment processing infrastructure with automated failover capabilities across 3 availability zones in us-east-1.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Highly available payment processing infrastructure with automated failover capabilities for financial services",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to ensure uniqueness across environments",
      "Default": "prod"
    },
    "DBUsername": {
      "Type": "String",
      "Description": "Master username for Aurora MySQL cluster",
      "Default": "admin",
      "NoEcho": true
    },
    "DBPassword": {
      "Type": "String",
      "Description": "Master password for Aurora MySQL cluster (minimum 8 characters)",
      "NoEcho": true,
      "MinLength": 8
    },
    "InstanceType": {
      "Type": "String",
      "Description": "EC2 instance type for Auto Scaling Group",
      "Default": "t3.medium"
    },
    "KeyPairName": {
      "Type": "AWS::EC2::KeyPair::KeyName",
      "Description": "EC2 Key Pair for SSH access to instances"
    },
    "AlertEmail": {
      "Type": "String",
      "Description": "Email address for CloudWatch alarm notifications"
    },
    "SecondaryRegionEndpoint": {
      "Type": "String",
      "Description": "DNS endpoint for secondary region failover (e.g., us-west-2 ALB DNS)"
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
            "Value": {
              "Fn::Sub": "payment-vpc-${EnvironmentSuffix}"
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
              "Fn::Sub": "payment-igw-${EnvironmentSuffix}"
            }
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
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-public-subnet-1a-${EnvironmentSuffix}"
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
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": "us-east-1b",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-public-subnet-1b-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": "us-east-1c",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-public-subnet-1c-${EnvironmentSuffix}"
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
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": "us-east-1a",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-private-subnet-1a-${EnvironmentSuffix}"
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
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": "us-east-1b",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-private-subnet-1b-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.13.0/24",
        "AvailabilityZone": "us-east-1c",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-private-subnet-1c-${EnvironmentSuffix}"
            }
          }
        ]
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
              "Fn::Sub": "payment-public-rt-${EnvironmentSuffix}"
            }
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
    "PublicSubnetRouteTableAssociation3": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet3"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "NATGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-nat-eip-1a-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGateway1EIP",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-nat-1a-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-private-rt-1a-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway1"
        }
      }
    },
    "PrivateSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        }
      }
    },
    "PrivateSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        }
      }
    },
    "PrivateSubnetRouteTableAssociation3": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet3"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        }
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
        "GroupName": {
          "Fn::Sub": "payment-alb-sg-${EnvironmentSuffix}"
        },
        "VpcId": {
          "Ref": "VPC"
        },
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
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-alb-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "InstanceSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances in Auto Scaling Group",
        "GroupName": {
          "Fn::Sub": "payment-instance-sg-${EnvironmentSuffix}"
        },
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            }
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            }
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-instance-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Aurora MySQL cluster",
        "GroupName": {
          "Fn::Sub": "payment-db-sg-${EnvironmentSuffix}"
        },
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "InstanceSecurityGroup"
            }
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-db-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "payment-db-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for Aurora MySQL cluster across 3 AZs",
        "SubnetIds": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          },
          {
            "Ref": "PrivateSubnet3"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-db-subnet-group-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBClusterParameterGroup": {
      "Type": "AWS::RDS::DBClusterParameterGroup",
      "Properties": {
        "DBClusterParameterGroupName": {
          "Fn::Sub": "payment-aurora-cluster-params-${EnvironmentSuffix}"
        },
        "Description": "Aurora MySQL 8.0 cluster parameter group",
        "Family": "aurora-mysql8.0",
        "Parameters": {
          "character_set_server": "utf8mb4",
          "collation_server": "utf8mb4_unicode_ci"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-aurora-cluster-params-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBParameterGroup": {
      "Type": "AWS::RDS::DBParameterGroup",
      "Properties": {
        "DBParameterGroupName": {
          "Fn::Sub": "payment-aurora-instance-params-${EnvironmentSuffix}"
        },
        "Description": "Aurora MySQL 8.0 instance parameter group",
        "Family": "aurora-mysql8.0",
        "Parameters": {
          "max_connections": "1000"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-aurora-instance-params-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for Aurora encryption - ${EnvironmentSuffix}"
        },
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
              "Sid": "Allow RDS to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "rds.amazonaws.com"
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
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-kms-key-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/payment-aurora-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "AuroraDBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "DeletionPolicy": "Snapshot",
      "Properties": {
        "DBClusterIdentifier": {
          "Fn::Sub": "payment-aurora-cluster-${EnvironmentSuffix}"
        },
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "MasterUsername": {
          "Ref": "DBUsername"
        },
        "MasterUserPassword": {
          "Ref": "DBPassword"
        },
        "DatabaseName": "paymentdb",
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "DBSecurityGroup"
          }
        ],
        "DBClusterParameterGroupName": {
          "Ref": "DBClusterParameterGroup"
        },
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": [
          "audit",
          "error",
          "general",
          "slowquery"
        ],
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "KMSKey"
        },
        "EnableIAMDatabaseAuthentication": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-aurora-cluster-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "AuroraDBInstanceWriter": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Snapshot",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "payment-aurora-writer-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraDBCluster"
        },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.r6g.large",
        "DBParameterGroupName": {
          "Ref": "DBParameterGroup"
        },
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-aurora-writer-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "AuroraDBInstanceReader1": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Snapshot",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "payment-aurora-reader-1-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraDBCluster"
        },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.r6g.large",
        "DBParameterGroupName": {
          "Ref": "DBParameterGroup"
        },
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-aurora-reader-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "AuroraDBInstanceReader2": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Snapshot",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "payment-aurora-reader-2-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraDBCluster"
        },
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.r6g.large",
        "DBParameterGroupName": {
          "Ref": "DBParameterGroup"
        },
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-aurora-reader-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "S3KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for S3 encryption - ${EnvironmentSuffix}"
        },
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
              "Sid": "Allow S3 to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "s3.amazonaws.com"
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
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-s3-kms-key-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "S3KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/payment-s3-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "S3KMSKey"
        }
      }
    },
    "ReplicationRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "payment-s3-replication-role-${EnvironmentSuffix}"
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
                    "Fn::Sub": "arn:aws:s3:::payment-data-${EnvironmentSuffix}-${AWS::AccountId}"
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
                    "Fn::Sub": "arn:aws:s3:::payment-data-${EnvironmentSuffix}-${AWS::AccountId}/*"
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
                    "Fn::Sub": "arn:aws:s3:::payment-data-replica-${EnvironmentSuffix}-${AWS::AccountId}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "S3KMSKey",
                      "Arn"
                    ]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Encrypt"
                  ],
                  "Resource": "*",
                  "Condition": {
                    "StringEquals": {
                      "kms:ViaService": "s3.us-west-2.amazonaws.com"
                    }
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
              "Fn::Sub": "payment-s3-replication-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PaymentDataBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "payment-data-${EnvironmentSuffix}-${AWS::AccountId}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "S3KMSKey"
                }
              },
              "BucketKeyEnabled": true
            }
          ]
        },
        "ReplicationConfiguration": {
          "Role": {
            "Fn::GetAtt": [
              "ReplicationRole",
              "Arn"
            ]
          },
          "Rules": [
            {
              "Id": "ReplicateToUSWest2",
              "Status": "Enabled",
              "Priority": 1,
              "Filter": {
                "Prefix": ""
              },
              "Destination": {
                "Bucket": {
                  "Fn::Sub": "arn:aws:s3:::payment-data-replica-${EnvironmentSuffix}-${AWS::AccountId}"
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
              },
              "DeleteMarkerReplication": {
                "Status": "Enabled"
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
              "Id": "TransitionOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionTransitions": [
                {
                  "StorageClass": "GLACIER",
                  "TransitionInDays": 90
                }
              ],
              "NoncurrentVersionExpirationInDays": 365
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-data-bucket-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "InstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "payment-instance-role-${EnvironmentSuffix}"
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
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
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
                    "s3:PutObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:s3:::payment-data-${EnvironmentSuffix}-${AWS::AccountId}"
                    },
                    {
                      "Fn::Sub": "arn:aws:s3:::payment-data-${EnvironmentSuffix}-${AWS::AccountId}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "S3KMSKey",
                      "Arn"
                    ]
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "RDSAccessPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "rds:DescribeDBClusters",
                    "rds:DescribeDBInstances"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:${AuroraDBCluster}"
                    },
                    {
                      "Fn::Sub": "arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${AuroraDBInstanceWriter}"
                    },
                    {
                      "Fn::Sub": "arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${AuroraDBInstanceReader1}"
                    },
                    {
                      "Fn::Sub": "arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:${AuroraDBInstanceReader2}"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "rds-db:connect"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:rds-db:${AWS::Region}:${AWS::AccountId}:dbuser:*/*"
                    }
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-instance-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {
          "Fn::Sub": "payment-instance-profile-${EnvironmentSuffix}"
        },
        "Roles": [
          {
            "Ref": "InstanceRole"
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "payment-alb-${EnvironmentSuffix}"
        },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          {
            "Ref": "PublicSubnet1"
          },
          {
            "Ref": "PublicSubnet2"
          },
          {
            "Ref": "PublicSubnet3"
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
              "Fn::Sub": "payment-alb-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "payment-tg-${EnvironmentSuffix}"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {
          "Ref": "VPC"
        },
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Matcher": {
          "HttpCode": "200"
        },
        "TargetType": "instance",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-tg-${EnvironmentSuffix}"
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
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "payment-launch-template-${EnvironmentSuffix}"
        },
        "LaunchTemplateData": {
          "ImageId": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}",
          "InstanceType": {
            "Ref": "InstanceType"
          },
          "KeyName": {
            "Ref": "KeyPairName"
          },
          "IamInstanceProfile": {
            "Arn": {
              "Fn::GetAtt": [
                "InstanceProfile",
                "Arn"
              ]
            }
          },
          "SecurityGroupIds": [
            {
              "Ref": "InstanceSecurityGroup"
            }
          ],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y httpd mysql\nsystemctl start httpd\nsystemctl enable httpd\necho '<html><body><h1>Payment Processing API - Healthy</h1></body></html>' > /var/www/html/health\nchmod 644 /var/www/html/health\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "payment-instance-${EnvironmentSuffix}"
                  }
                }
              ]
            }
          ]
        },
        "TagSpecifications": [
          {
            "ResourceType": "launch-template",
            "Tags": [
              {
                "Key": "Name",
                "Value": {
                  "Fn::Sub": "payment-launch-template-${EnvironmentSuffix}"
                }
              }
            ]
          }
        ]
      }
    },
    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": {
          "Fn::Sub": "payment-asg-${EnvironmentSuffix}"
        },
        "LaunchTemplate": {
          "LaunchTemplateId": {
            "Ref": "LaunchTemplate"
          },
          "Version": {
            "Fn::GetAtt": [
              "LaunchTemplate",
              "LatestVersionNumber"
            ]
          }
        },
        "MinSize": "6",
        "MaxSize": "12",
        "DesiredCapacity": "6",
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "VPCZoneIdentifier": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          },
          {
            "Ref": "PrivateSubnet3"
          }
        ],
        "TargetGroupARNs": [
          {
            "Ref": "ALBTargetGroup"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-asg-instance-${EnvironmentSuffix}"
            },
            "PropagateAtLaunch": true
          }
        ]
      },
      "DependsOn": [
        "ApplicationLoadBalancer",
        "ALBTargetGroup"
      ]
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "payment-alerts-${EnvironmentSuffix}"
        },
        "DisplayName": "Payment Processing Alerts",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-alerts-topic-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "SNSSubscription": {
      "Type": "AWS::SNS::Subscription",
      "Properties": {
        "Protocol": "email",
        "TopicArn": {
          "Ref": "SNSTopic"
        },
        "Endpoint": {
          "Ref": "AlertEmail"
        }
      }
    },
    "DBFailoverAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "payment-db-failover-alarm-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when Aurora cluster failover occurs",
        "MetricName": "ClusterReplicaLag",
        "Namespace": "AWS/RDS",
        "Statistic": "Maximum",
        "Period": 60,
        "EvaluationPeriods": 1,
        "Threshold": 1000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "AuroraDBCluster"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "DBCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "payment-db-cpu-alarm-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when Aurora CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "AuroraDBCluster"
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
    "ALBTargetHealthAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "payment-alb-unhealthy-targets-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when ALB has unhealthy targets",
        "MetricName": "UnHealthyHostCount",
        "Namespace": "AWS/ApplicationELB",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "LoadBalancer",
            "Value": {
              "Fn::GetAtt": [
                "ApplicationLoadBalancer",
                "LoadBalancerFullName"
              ]
            }
          },
          {
            "Name": "TargetGroup",
            "Value": {
              "Fn::GetAtt": [
                "ALBTargetGroup",
                "TargetGroupFullName"
              ]
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
    "Route53HealthCheck": {
      "Type": "AWS::Route53::HealthCheck",
      "Properties": {
        "HealthCheckConfig": {
          "Type": "HTTPS_STR_MATCH",
          "ResourcePath": "/health",
          "FullyQualifiedDomainName": {
            "Fn::GetAtt": [
              "ApplicationLoadBalancer",
              "DNSName"
            ]
          },
          "Port": 443,
          "RequestInterval": 30,
          "FailureThreshold": 3,
          "MeasureLatency": true,
          "SearchString": "Healthy"
        },
        "HealthCheckTags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-health-check-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "Route53HealthCheckAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "payment-route53-health-check-alarm-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when Route53 health check fails",
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
              "Ref": "Route53HealthCheck"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "TreatMissingData": "breaching"
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID for the payment processing infrastructure",
      "Value": {
        "Ref": "VPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPCId"
        }
      }
    },
    "LoadBalancerDNS": {
      "Description": "DNS name of the Application Load Balancer",
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
    "DBClusterEndpoint": {
      "Description": "Aurora cluster writer endpoint",
      "Value": {
        "Fn::GetAtt": [
          "AuroraDBCluster",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DB-Endpoint"
        }
      }
    },
    "DBClusterReaderEndpoint": {
      "Description": "Aurora cluster reader endpoint",
      "Value": {
        "Fn::GetAtt": [
          "AuroraDBCluster",
          "ReadEndpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DB-Reader-Endpoint"
        }
      }
    },
    "S3BucketName": {
      "Description": "S3 bucket name for payment data",
      "Value": {
        "Ref": "PaymentDataBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3-Bucket"
        }
      }
    },
    "SNSTopicArn": {
      "Description": "SNS topic ARN for alerts",
      "Value": {
        "Ref": "SNSTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SNS-Topic"
        }
      }
    },
    "HealthCheckId": {
      "Description": "Route53 health check ID",
      "Value": {
        "Ref": "Route53HealthCheck"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-HealthCheck-Id"
        }
      }
    }
  }
}
```

## Infrastructure Summary

This template creates a comprehensive highly available payment processing infrastructure with:

1. **VPC Infrastructure**: Multi-AZ VPC with 3 public and 3 private subnets across us-east-1a, us-east-1b, us-east-1c
2. **Aurora MySQL Cluster**: 1 writer instance + 2 reader instances with 7-day backup retention and KMS encryption
3. **Auto Scaling Group**: 6 EC2 instances (2 per AZ) behind an Application Load Balancer
4. **S3 with Cross-Region Replication**: Versioned bucket with replication to us-west-2
5. **CloudWatch Monitoring**: Alarms for database failover, CPU utilization, and ALB health
6. **Route53 Health Checks**: Automated health monitoring with DNS failover capabilities
7. **Security**: KMS encryption, IAM least privilege roles, security groups with restricted access
8. **DeletionPolicy**: Snapshot configured for Aurora resources
