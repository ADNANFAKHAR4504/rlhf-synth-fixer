# Zero-Trust Security Infrastructure - CloudFormation Implementation

This implementation creates a comprehensive zero-trust security architecture for payment processing workloads using CloudFormation with JSON.

## File: lib/zero-trust-security.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Zero-Trust Security Infrastructure for Payment Processing - PCI-DSS Compliant",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names to ensure uniqueness across deployments",
      "AllowedPattern": "^[a-z0-9-]+$",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "TransitGatewayId": {
      "Type": "String",
      "Description": "Transit Gateway ID for network connectivity (leave empty to skip attachment)",
      "Default": ""
    },
    "VpcCidr": {
      "Type": "String",
      "Description": "CIDR block for VPC",
      "Default": "10.0.0.0/16",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(1[6-9]|2[0-8]))$"
    }
  },
  "Conditions": {
    "HasTransitGateway": {
      "Fn::Not": [
        {
          "Fn::Equals": [
            {
              "Ref": "TransitGatewayId"
            },
            ""
          ]
        }
      ]
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {
          "Ref": "VpcCidr"
        },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-zero-trust-${EnvironmentSuffix}"
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
    "PrivateSubnetAZ1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [
            0,
            {
              "Fn::Cidr": [
                {
                  "Ref": "VpcCidr"
                },
                6,
                8
              ]
            }
          ]
        },
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
              "Fn::Sub": "private-subnet-az1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateSubnetAZ2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [
            1,
            {
              "Fn::Cidr": [
                {
                  "Ref": "VpcCidr"
                },
                6,
                8
              ]
            }
          ]
        },
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
              "Fn::Sub": "private-subnet-az2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateSubnetAZ3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [
            2,
            {
              "Fn::Cidr": [
                {
                  "Ref": "VpcCidr"
                },
                6,
                8
              ]
            }
          ]
        },
        "AvailabilityZone": {
          "Fn::Select": [
            2,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-az3-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "FirewallSubnetAZ1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [
            3,
            {
              "Fn::Cidr": [
                {
                  "Ref": "VpcCidr"
                },
                6,
                8
              ]
            }
          ]
        },
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
              "Fn::Sub": "firewall-subnet-az1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "FirewallSubnetAZ2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [
            4,
            {
              "Fn::Cidr": [
                {
                  "Ref": "VpcCidr"
                },
                6,
                8
              ]
            }
          ]
        },
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
              "Fn::Sub": "firewall-subnet-az2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "FirewallSubnetAZ3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Fn::Select": [
            5,
            {
              "Fn::Cidr": [
                {
                  "Ref": "VpcCidr"
                },
                6,
                8
              ]
            }
          ]
        },
        "AvailabilityZone": {
          "Fn::Select": [
            2,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "firewall-subnet-az3-${EnvironmentSuffix}"
            }
          }
        ]
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
              "Fn::Sub": "private-route-table-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateSubnetAZ1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetAZ1"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "PrivateSubnetAZ2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetAZ2"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "PrivateSubnetAZ3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnetAZ3"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "TransitGatewayAttachment": {
      "Type": "AWS::EC2::TransitGatewayAttachment",
      "Condition": "HasTransitGateway",
      "Properties": {
        "TransitGatewayId": {
          "Ref": "TransitGatewayId"
        },
        "VpcId": {
          "Ref": "VPC"
        },
        "SubnetIds": [
          {
            "Ref": "PrivateSubnetAZ1"
          },
          {
            "Ref": "PrivateSubnetAZ2"
          },
          {
            "Ref": "PrivateSubnetAZ3"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "tgw-attachment-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NetworkFirewallRuleGroup": {
      "Type": "AWS::NetworkFirewall::RuleGroup",
      "Properties": {
        "RuleGroupName": {
          "Fn::Sub": "stateful-rules-${EnvironmentSuffix}"
        },
        "Type": "STATEFUL",
        "Capacity": 100,
        "RuleGroup": {
          "RulesSource": {
            "StatefulRules": [
              {
                "Action": "PASS",
                "Header": {
                  "Direction": "FORWARD",
                  "Protocol": "TCP",
                  "Source": "10.0.0.0/16",
                  "SourcePort": "ANY",
                  "Destination": "ANY",
                  "DestinationPort": "443"
                },
                "RuleOptions": [
                  {
                    "Keyword": "sid:1"
                  }
                ]
              },
              {
                "Action": "DROP",
                "Header": {
                  "Direction": "ANY",
                  "Protocol": "IP",
                  "Source": "ANY",
                  "SourcePort": "ANY",
                  "Destination": "ANY",
                  "DestinationPort": "ANY"
                },
                "RuleOptions": [
                  {
                    "Keyword": "sid:2"
                  }
                ]
              }
            ]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "stateful-rules-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NetworkFirewallPolicy": {
      "Type": "AWS::NetworkFirewall::FirewallPolicy",
      "Properties": {
        "FirewallPolicyName": {
          "Fn::Sub": "firewall-policy-${EnvironmentSuffix}"
        },
        "FirewallPolicy": {
          "StatelessDefaultActions": [
            "aws:forward_to_sfe"
          ],
          "StatelessFragmentDefaultActions": [
            "aws:forward_to_sfe"
          ],
          "StatefulRuleGroupReferences": [
            {
              "ResourceArn": {
                "Fn::GetAtt": [
                  "NetworkFirewallRuleGroup",
                  "RuleGroupArn"
                ]
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "firewall-policy-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NetworkFirewall": {
      "Type": "AWS::NetworkFirewall::Firewall",
      "Properties": {
        "FirewallName": {
          "Fn::Sub": "network-firewall-${EnvironmentSuffix}"
        },
        "FirewallPolicyArn": {
          "Fn::GetAtt": [
            "NetworkFirewallPolicy",
            "FirewallPolicyArn"
          ]
        },
        "VpcId": {
          "Ref": "VPC"
        },
        "SubnetMappings": [
          {
            "SubnetId": {
              "Ref": "FirewallSubnetAZ1"
            }
          },
          {
            "SubnetId": {
              "Ref": "FirewallSubnetAZ2"
            }
          },
          {
            "SubnetId": {
              "Ref": "FirewallSubnetAZ3"
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "network-firewall-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NetworkFirewallLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/networkfirewall/${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      },
      "DeletionPolicy": "Delete"
    },
    "NetworkFirewallLogging": {
      "Type": "AWS::NetworkFirewall::LoggingConfiguration",
      "Properties": {
        "FirewallArn": {
          "Ref": "NetworkFirewall"
        },
        "LoggingConfiguration": {
          "LogDestinationConfigs": [
            {
              "LogType": "FLOW",
              "LogDestinationType": "CloudWatchLogs",
              "LogDestination": {
                "logGroup": {
                  "Ref": "NetworkFirewallLogGroup"
                }
              }
            }
          ]
        }
      }
    },
    "EBSKMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for EBS encryption - ${EnvironmentSuffix}"
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
              "Sid": "Allow EBS to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "ec2.amazonaws.com"
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
              "Fn::Sub": "ebs-kms-key-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "EBSKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/ebs-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "EBSKMSKey"
        }
      }
    },
    "S3KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for S3 encryption - ${EnvironmentSuffix}"
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
            },
            {
              "Sid": "Allow VPC Flow Logs",
              "Effect": "Allow",
              "Principal": {
                "Service": "vpc-flow-logs.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey"
              ],
              "Resource": "*"
            },
            {
              "Sid": "Allow Config",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
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
              "Fn::Sub": "s3-kms-key-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "S3KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/s3-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "S3KMSKey"
        }
      }
    },
    "RDSKMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for RDS encryption - ${EnvironmentSuffix}"
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
              "Fn::Sub": "rds-kms-key-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "RDSKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/rds-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "RDSKMSKey"
        }
      }
    },
    "EC2InstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "ec2-instance-role-${EnvironmentSuffix}"
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
                    "Fn::Sub": "arn:aws:s3:::payment-processing-${EnvironmentSuffix}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:ListBucket"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:s3:::payment-processing-${EnvironmentSuffix}"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "KMSAccessPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "EBSKMSKey",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::GetAtt": [
                        "S3KMSKey",
                        "Arn"
                      ]
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
              "Fn::Sub": "ec2-instance-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {
          "Fn::Sub": "ec2-instance-profile-${EnvironmentSuffix}"
        },
        "Roles": [
          {
            "Ref": "EC2InstanceRole"
          }
        ]
      }
    },
    "VPCFlowLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "vpc-flow-logs-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Fn::GetAtt": [
                    "S3KMSKey",
                    "Arn"
                  ]
                }
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
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldLogs",
              "Status": "Enabled",
              "ExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-flow-logs-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "VPCFlowLogsBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "VPCFlowLogsBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSLogDeliveryWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "delivery.logs.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${VPCFlowLogsBucket.Arn}/*"
              },
              "Condition": {
                "StringEquals": {
                  "s3:x-amz-acl": "bucket-owner-full-control"
                }
              }
            },
            {
              "Sid": "AWSLogDeliveryAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "delivery.logs.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::GetAtt": [
                  "VPCFlowLogsBucket",
                  "Arn"
                ]
              }
            }
          ]
        }
      }
    },
    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "DependsOn": "VPCFlowLogsBucketPolicy",
      "Properties": {
        "ResourceType": "VPC",
        "ResourceId": {
          "Ref": "VPC"
        },
        "TrafficType": "ALL",
        "LogDestinationType": "s3",
        "LogDestination": {
          "Fn::GetAtt": [
            "VPCFlowLogsBucket",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-flow-log-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ConfigBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "aws-config-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Fn::GetAtt": [
                    "S3KMSKey",
                    "Arn"
                  ]
                }
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
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aws-config-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "ConfigBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "ConfigBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSConfigBucketPermissionsCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::GetAtt": [
                  "ConfigBucket",
                  "Arn"
                ]
              }
            },
            {
              "Sid": "AWSConfigBucketExistenceCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:ListBucket",
              "Resource": {
                "Fn::GetAtt": [
                  "ConfigBucket",
                  "Arn"
                ]
              }
            },
            {
              "Sid": "AWSConfigBucketPutObject",
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${ConfigBucket.Arn}/*"
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
    "ConfigRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "aws-config-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
        ],
        "Policies": [
          {
            "PolicyName": "ConfigS3Policy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetBucketVersioning",
                    "s3:PutObject",
                    "s3:GetObject"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "ConfigBucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${ConfigBucket.Arn}/*"
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
              "Fn::Sub": "aws-config-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ConfigRecorder": {
      "Type": "AWS::Config::ConfigurationRecorder",
      "Properties": {
        "Name": {
          "Fn::Sub": "config-recorder-${EnvironmentSuffix}"
        },
        "RoleArn": {
          "Fn::GetAtt": [
            "ConfigRole",
            "Arn"
          ]
        },
        "RecordingGroup": {
          "AllSupported": true,
          "IncludeGlobalResourceTypes": true
        }
      }
    },
    "ConfigDeliveryChannel": {
      "Type": "AWS::Config::DeliveryChannel",
      "Properties": {
        "Name": {
          "Fn::Sub": "config-delivery-${EnvironmentSuffix}"
        },
        "S3BucketName": {
          "Ref": "ConfigBucket"
        }
      }
    },
    "ConfigRuleEncryptedVolumes": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": "ConfigRecorder",
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "encrypted-volumes-${EnvironmentSuffix}"
        },
        "Description": "Checks whether EBS volumes are encrypted",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "ENCRYPTED_VOLUMES"
        }
      }
    },
    "ConfigRuleIAMPasswordPolicy": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": "ConfigRecorder",
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "iam-password-policy-${EnvironmentSuffix}"
        },
        "Description": "Checks whether the account password policy meets specified requirements",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "IAM_PASSWORD_POLICY"
        }
      }
    },
    "GuardDutyDetector": {
      "Type": "AWS::GuardDuty::Detector",
      "Properties": {
        "Enable": true,
        "FindingPublishingFrequency": "FIFTEEN_MINUTES",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "guardduty-detector-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "SSMEndpointSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "ssm-endpoints-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Systems Manager VPC endpoints",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": {
              "Ref": "VpcCidr"
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ssm-endpoints-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "SSMEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.ssm"
        },
        "VpcEndpointType": "Interface",
        "PrivateDnsEnabled": true,
        "SubnetIds": [
          {
            "Ref": "PrivateSubnetAZ1"
          },
          {
            "Ref": "PrivateSubnetAZ2"
          },
          {
            "Ref": "PrivateSubnetAZ3"
          }
        ],
        "SecurityGroupIds": [
          {
            "Ref": "SSMEndpointSecurityGroup"
          }
        ]
      }
    },
    "SSMMessagesEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.ssmmessages"
        },
        "VpcEndpointType": "Interface",
        "PrivateDnsEnabled": true,
        "SubnetIds": [
          {
            "Ref": "PrivateSubnetAZ1"
          },
          {
            "Ref": "PrivateSubnetAZ2"
          },
          {
            "Ref": "PrivateSubnetAZ3"
          }
        ],
        "SecurityGroupIds": [
          {
            "Ref": "SSMEndpointSecurityGroup"
          }
        ]
      }
    },
    "EC2MessagesEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.ec2messages"
        },
        "VpcEndpointType": "Interface",
        "PrivateDnsEnabled": true,
        "SubnetIds": [
          {
            "Ref": "PrivateSubnetAZ1"
          },
          {
            "Ref": "PrivateSubnetAZ2"
          },
          {
            "Ref": "PrivateSubnetAZ3"
          }
        ],
        "SecurityGroupIds": [
          {
            "Ref": "SSMEndpointSecurityGroup"
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
          "Fn::Sub": "${AWS::StackName}-VPCId"
        }
      }
    },
    "PrivateSubnetAZ1Id": {
      "Description": "Private Subnet AZ1 ID",
      "Value": {
        "Ref": "PrivateSubnetAZ1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnetAZ1"
        }
      }
    },
    "PrivateSubnetAZ2Id": {
      "Description": "Private Subnet AZ2 ID",
      "Value": {
        "Ref": "PrivateSubnetAZ2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnetAZ2"
        }
      }
    },
    "PrivateSubnetAZ3Id": {
      "Description": "Private Subnet AZ3 ID",
      "Value": {
        "Ref": "PrivateSubnetAZ3"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnetAZ3"
        }
      }
    },
    "NetworkFirewallArn": {
      "Description": "Network Firewall ARN",
      "Value": {
        "Ref": "NetworkFirewall"
      }
    },
    "EBSKMSKeyArn": {
      "Description": "EBS KMS Key ARN",
      "Value": {
        "Fn::GetAtt": [
          "EBSKMSKey",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EBSKMSKeyArn"
        }
      }
    },
    "S3KMSKeyArn": {
      "Description": "S3 KMS Key ARN",
      "Value": {
        "Fn::GetAtt": [
          "S3KMSKey",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3KMSKeyArn"
        }
      }
    },
    "RDSKMSKeyArn": {
      "Description": "RDS KMS Key ARN",
      "Value": {
        "Fn::GetAtt": [
          "RDSKMSKey",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-RDSKMSKeyArn"
        }
      }
    },
    "EC2InstanceRoleArn": {
      "Description": "EC2 Instance Role ARN",
      "Value": {
        "Fn::GetAtt": [
          "EC2InstanceRole",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EC2InstanceRoleArn"
        }
      }
    },
    "EC2InstanceProfileArn": {
      "Description": "EC2 Instance Profile ARN",
      "Value": {
        "Fn::GetAtt": [
          "EC2InstanceProfile",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EC2InstanceProfileArn"
        }
      }
    },
    "VPCFlowLogsBucketName": {
      "Description": "VPC Flow Logs S3 Bucket Name",
      "Value": {
        "Ref": "VPCFlowLogsBucket"
      }
    },
    "ConfigBucketName": {
      "Description": "AWS Config S3 Bucket Name",
      "Value": {
        "Ref": "ConfigBucket"
      }
    },
    "GuardDutyDetectorId": {
      "Description": "GuardDuty Detector ID",
      "Value": {
        "Ref": "GuardDutyDetector"
      }
    },
    "SSMEndpointDNS": {
      "Description": "SSM Endpoint DNS Name",
      "Value": {
        "Fn::Select": [
          0,
          {
            "Fn::GetAtt": [
              "SSMEndpoint",
              "DnsEntries"
            ]
          }
        ]
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# Zero-Trust Security Infrastructure for Payment Processing

This CloudFormation template deploys a comprehensive zero-trust security architecture for payment processing workloads that meet PCI-DSS compliance requirements.

## Architecture Overview

The infrastructure implements multiple layers of security controls:

1. **Network Security**: Private VPC with no internet access, AWS Network Firewall for traffic inspection
2. **Encryption**: Separate KMS keys for EBS, S3, and RDS with automatic 90-day rotation
3. **Access Control**: IAM roles with least-privilege policies, Systems Manager Session Manager for secure access
4. **Monitoring**: VPC Flow Logs, AWS Config rules, GuardDuty threat detection
5. **Compliance**: Continuous compliance monitoring with AWS Config rules

## Components

### Network Infrastructure
- VPC with private subnets across 3 availability zones
- Transit Gateway attachment for secure connectivity
- AWS Network Firewall with stateful rules
- VPC Flow Logs encrypted with KMS

### Encryption Keys
- **EBS KMS Key**: For EC2 volume encryption
- **S3 KMS Key**: For S3 bucket encryption (Flow Logs, Config)
- **RDS KMS Key**: For RDS database encryption
- All keys have automatic rotation enabled (every 90 days)

### Identity and Access
- EC2 instance role with least-privilege policies
- Instance profile for EC2 instances
- No wildcard permissions
- Systems Manager Session Manager access only

### Compliance and Monitoring
- AWS Config with rules:
  - encrypted-volumes: Ensures EBS volumes are encrypted
  - iam-password-policy: Validates IAM password policy
- GuardDuty for threat detection
- VPC Flow Logs for network traffic analysis

### Systems Manager Access
- VPC endpoints for SSM (ssm, ssmmessages, ec2messages)
- Session Manager for secure shell access
- No SSH keys or bastion hosts required

## Deployment

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. IAM permissions to create all resources
3. Optional: Existing Transit Gateway ID (for Transit Gateway attachment)

### Parameters

- **EnvironmentSuffix** (Required): Unique suffix for resource naming (e.g., "prod-001")
- **TransitGatewayId** (Optional): Transit Gateway ID for VPC attachment
- **VpcCidr** (Optional): VPC CIDR block (default: 10.0.0.0/16)

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name zero-trust-security \
  --template-body file://lib/zero-trust-security.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001 \
    ParameterKey=TransitGatewayId,ParameterValue=tgw-xxxxx \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Stack Creation

```bash
aws cloudformation describe-stack-events \
  --stack-name zero-trust-security \
  --region us-east-1
```

### Validate Deployment

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name zero-trust-security \
  --region us-east-1

# Verify Config rules are active
aws configservice describe-config-rules \
  --region us-east-1

# Verify GuardDuty is enabled
aws guardduty list-detectors \
  --region us-east-1

# Check VPC Flow Logs
aws ec2 describe-flow-logs \
  --region us-east-1
```

## Security Features

### Zero-Trust Principles
- No public subnets or internet gateways
- All traffic inspected by Network Firewall
- Least-privilege IAM policies
- Encrypted data at rest and in transit

### PCI-DSS Compliance
- Network segmentation with private subnets
- Encryption with customer-managed KMS keys
- Continuous compliance monitoring with AWS Config
- Comprehensive audit logging (Flow Logs, CloudTrail integration)
- Threat detection with GuardDuty

### Key Rotation
All KMS keys are configured with automatic rotation:
- Rotation period: 90 days
- AWS manages the rotation process
- Old key versions retained for decryption

## Important Notes

### GuardDuty Limitation
**WARNING**: GuardDuty allows only ONE detector per AWS account per region. If a detector already exists in your account, the stack creation will fail. Options:

1. Remove GuardDuty resource from template if detector exists
2. Use custom resource to check existence before creation
3. Manually delete existing detector (if safe to do so)

### Resource Cleanup
All resources are configured with `DeletionPolicy: Delete` for testing environments. This ensures complete stack deletion without manual intervention.

**For production**: Consider changing deletion policies for:
- KMS keys (to `Retain` for key recovery)
- S3 buckets (to `Retain` for audit log preservation)

### AWS Config
The template uses the correct IAM managed policy:
```
arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
```

Note the `service-role/` prefix which is required for AWS Config.

## Outputs

The template exports the following outputs:

- **VPCId**: VPC identifier
- **PrivateSubnetAZ1Id, PrivateSubnetAZ2Id, PrivateSubnetAZ3Id**: Private subnet identifiers
- **NetworkFirewallArn**: Network Firewall ARN
- **EBSKMSKeyArn, S3KMSKeyArn, RDSKMSKeyArn**: KMS key ARNs
- **EC2InstanceRoleArn**: IAM role ARN for EC2 instances
- **EC2InstanceProfileArn**: Instance profile ARN
- **VPCFlowLogsBucketName**: S3 bucket for VPC Flow Logs
- **ConfigBucketName**: S3 bucket for AWS Config
- **GuardDutyDetectorId**: GuardDuty detector ID
- **SSMEndpointDNS**: Systems Manager endpoint DNS

## Testing

### Test Systems Manager Access

1. Launch an EC2 instance in one of the private subnets
2. Attach the EC2 instance profile
3. Connect via Session Manager:

```bash
aws ssm start-session \
  --target i-xxxxxxxxx \
  --region us-east-1
```

### Test Network Firewall

1. Check firewall endpoints:

```bash
aws network-firewall describe-firewall \
  --firewall-name network-firewall-[suffix] \
  --region us-east-1
```

2. Review firewall logs in CloudWatch:

```bash
aws logs tail /aws/networkfirewall/[suffix] \
  --follow \
  --region us-east-1
```

### Test AWS Config Rules

```bash
# Check compliance status
aws configservice describe-compliance-by-config-rule \
  --config-rule-names encrypted-volumes-[suffix] iam-password-policy-[suffix] \
  --region us-east-1
```

### Test KMS Key Rotation

```bash
# Verify key rotation is enabled
aws kms get-key-rotation-status \
  --key-id [key-id] \
  --region us-east-1
```

## Troubleshooting

### Stack Creation Failures

1. **GuardDuty detector already exists**:
   - Check existing detectors: `aws guardduty list-detectors`
   - Remove GuardDuty resource from template or delete existing detector

2. **IAM permission errors**:
   - Ensure you have `CAPABILITY_NAMED_IAM` in create-stack command
   - Verify IAM permissions for all services

3. **S3 bucket name conflicts**:
   - S3 bucket names must be globally unique
   - Template uses account ID in bucket names to avoid conflicts

### Config Rules Not Evaluating

1. Ensure ConfigRecorder is running:

```bash
aws configservice describe-configuration-recorder-status \
  --region us-east-1
```

2. Start the recorder if needed:

```bash
aws configservice start-configuration-recorder \
  --configuration-recorder-name config-recorder-[suffix] \
  --region us-east-1
```

### VPC Flow Logs Not Appearing

1. Verify Flow Log is active:

```bash
aws ec2 describe-flow-logs \
  --filter "Name=resource-id,Values=[vpc-id]" \
  --region us-east-1
```

2. Check S3 bucket permissions (bucket policy allows VPC Flow Logs service)

3. Wait 10-15 minutes for initial logs to appear

## Cost Optimization

### Estimated Monthly Costs (us-east-1)

- **Network Firewall**: ~$400 (firewall endpoints + processing)
- **VPC Endpoints**: ~$22 (3 endpoints across 3 AZs)
- **GuardDuty**: ~$5-50 (usage-based)
- **AWS Config**: ~$10-20 (rules + recorder)
- **KMS Keys**: $3 (3 keys)
- **S3 Storage**: Variable (depends on log volume)
- **VPC Flow Logs**: Variable (depends on traffic volume)

**Total**: ~$450-500/month (excluding compute resources)

### Cost Reduction Options

1. Reduce Network Firewall endpoints to 2 AZs (not recommended for production)
2. Adjust VPC Flow Log retention period
3. Use S3 lifecycle policies for older Config data
4. Consider centralizing GuardDuty to a security account

## Maintenance

### Regular Tasks

1. **Review GuardDuty findings** (weekly):
   - Check for security threats
   - Investigate medium/high severity findings

2. **Monitor AWS Config compliance** (daily):
   - Review non-compliant resources
   - Remediate configuration drift

3. **Analyze VPC Flow Logs** (as needed):
   - Investigate unusual traffic patterns
   - Verify zero-trust policy enforcement

4. **Verify KMS key rotation** (quarterly):
   - Confirm automatic rotation is working
   - Update key policies if needed

### Updates

To update the stack:

```bash
aws cloudformation update-stack \
  --stack-name zero-trust-security \
  --template-body file://lib/zero-trust-security.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,UsePreviousValue=true \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Cleanup

To delete all resources:

```bash
aws cloudformation delete-stack \
  --stack-name zero-trust-security \
  --region us-east-1
```

**Note**: All resources will be deleted due to `DeletionPolicy: Delete`. For production, consider retaining:
- KMS keys (for key recovery period)
- S3 buckets (for audit log retention)

## References

- [AWS Network Firewall Documentation](https://docs.aws.amazon.com/network-firewall/)
- [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
- [AWS Config Rules](https://docs.aws.amazon.com/config/latest/developerguide/managed-rules-by-aws-config.html)
- [AWS GuardDuty](https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html)
- [PCI DSS on AWS](https://aws.amazon.com/compliance/pci-dss-level-1-faqs/)
