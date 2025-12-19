# Ideal CloudFormation Template (JSON)

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure Data Processing Pipeline for Financial Services with comprehensive encryption, VPC isolation, and compliance controls",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Suffix for resource naming to ensure uniqueness across deployments",
      "Default": "prod",
      "AllowedPattern": "^[a-z0-9-]+$",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "SecretRotationDays": {
      "Type": "Number",
      "Description": "Number of days between automatic secret rotations",
      "Default": 30,
      "MinValue": 1,
      "MaxValue": 365
    },
    "LogRetentionDays": {
      "Type": "Number",
      "Description": "CloudWatch Logs retention period in days",
      "Default": 90,
      "AllowedValues": [1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653]
    },
    "VpcCidr": {
      "Type": "String",
      "Description": "CIDR block for the VPC",
      "Default": "10.0.0.0/16",
      "AllowedPattern": "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(1[6-9]|2[0-8]))$"
    }
  },
  "Resources": {
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "Customer-managed KMS key for encrypting all pipeline resources - ${EnvironmentSuffix}"
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
              "Sid": "Allow CloudWatch Logs",
              "Effect": "Allow",
              "Principal": {
                "Service": {
                  "Fn::Sub": "logs.${AWS::Region}.amazonaws.com"
                }
              },
              "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:CreateGrant",
                "kms:DescribeKey"
              ],
              "Resource": "*",
              "Condition": {
                "ArnLike": {
                  "kms:EncryptionContext:aws:logs:arn": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
                  }
                }
              }
            },
            {
              "Sid": "Allow Lambda Service",
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:DescribeKey"
              ],
              "Resource": "*"
            },
            {
              "Sid": "Allow Secrets Manager",
              "Effect": "Allow",
              "Principal": {
                "Service": "secretsmanager.amazonaws.com"
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
              "Fn::Sub": "kms-key-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/secure-pipeline-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
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
              "Fn::Sub": "vpc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
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
        "CidrBlock": {
          "Fn::Select": [0, {
            "Fn::Cidr": [{
              "Ref": "VpcCidr"
            }, 6, 8]
          }]
        },
        "AvailabilityZone": {
          "Fn::Select": [0, {
            "Fn::GetAZs": ""
          }]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
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
        "CidrBlock": {
          "Fn::Select": [1, {
            "Fn::Cidr": [{
              "Ref": "VpcCidr"
            }, 6, 8]
          }]
        },
        "AvailabilityZone": {
          "Fn::Select": [1, {
            "Fn::GetAZs": ""
          }]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
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
        "CidrBlock": {
          "Fn::Select": [2, {
            "Fn::Cidr": [{
              "Ref": "VpcCidr"
            }, 6, 8]
          }]
        },
        "AvailabilityZone": {
          "Fn::Select": [2, {
            "Fn::GetAZs": ""
          }]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
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
              "Fn::Sub": "private-rt-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
          }
        ]
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet3"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "S3VPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.s3"
        },
        "VpcEndpointType": "Gateway",
        "RouteTableIds": [
          {
            "Ref": "PrivateRouteTable"
          }
        ]
      }
    },
    "DynamoDBVPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.dynamodb"
        },
        "VpcEndpointType": "Gateway",
        "RouteTableIds": [
          {
            "Ref": "PrivateRouteTable"
          }
        ]
      }
    },
    "SecretsManagerVPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "ServiceName": {
          "Fn::Sub": "com.amazonaws.${AWS::Region}.secretsmanager"
        },
        "VpcEndpointType": "Interface",
        "PrivateDnsEnabled": true,
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
        "SecurityGroupIds": [
          {
            "Ref": "VPCEndpointSecurityGroup"
          }
        ]
      }
    },
    "VPCEndpointSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for VPC endpoints with explicit rules",
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
            },
            "Description": "HTTPS from VPC CIDR"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": {
              "Ref": "VpcCidr"
            },
            "Description": "HTTPS to VPC CIDR"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-endpoint-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
          }
        ]
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda functions with explicit egress rules",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": {
              "Ref": "VpcCidr"
            },
            "Description": "HTTPS to VPC endpoints"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "lambda-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
          }
        ]
      }
    },
    "DataBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "data-bucket-${EnvironmentSuffix}-${AWS::AccountId}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Fn::GetAtt": ["KMSKey", "Arn"]
                }
              },
              "BucketKeyEnabled": true
            }
          ]
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
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
              "Id": "ArchiveOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionTransitions": [
                {
                  "StorageClass": "GLACIER",
                  "TransitionInDays": 90
                }
              ],
              "NoncurrentVersionExpiration": {
                "NoncurrentDays": 365
              }
            },
            {
              "Id": "DeleteOldData",
              "Status": "Enabled",
              "ExpirationInDays": 2555,
              "Transitions": [
                {
                  "StorageClass": "STANDARD_IA",
                  "TransitionInDays": 90
                },
                {
                  "StorageClass": "GLACIER",
                  "TransitionInDays": 180
                }
              ]
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "data-bucket-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
          }
        ]
      }
    },
    "TransactionTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "transaction-table-${EnvironmentSuffix}"
        },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "transactionId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "timestamp",
            "AttributeType": "N"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "transactionId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "timestamp",
            "KeyType": "RANGE"
          }
        ],
        "SSESpecification": {
          "SSEEnabled": true,
          "SSEType": "KMS",
          "KMSMasterKeyId": {
            "Fn::GetAtt": ["KMSKey", "Arn"]
          }
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "ContributorInsightsSpecification": {
          "Enabled": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "transaction-table-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
          }
        ]
      }
    },
    "DatabaseSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "rds-credentials-${EnvironmentSuffix}"
        },
        "Description": "RDS database credentials with automatic rotation",
        "KmsKeyId": {
          "Ref": "KMSKey"
        },
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\": \"admin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "rds-secret-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
          }
        ]
      }
    },
    "SecretRotationSchedule": {
      "Type": "AWS::SecretsManager::RotationSchedule",
      "Properties": {
        "SecretId": {
          "Ref": "DatabaseSecret"
        },
        "RotationLambdaARN": {
          "Fn::GetAtt": ["SecretRotationFunction", "Arn"]
        },
        "RotationRules": {
          "AutomaticallyAfterDays": {
            "Ref": "SecretRotationDays"
          }
        }
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "lambda-execution-role-${EnvironmentSuffix}"
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
            "PolicyName": "LambdaExecutionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:UpdateItem"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["TransactionTable", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "${DataBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["KMSKey", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue"
                  ],
                  "Resource": {
                    "Ref": "DatabaseSecret"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/data-processor-*"
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
              "Fn::Sub": "lambda-role-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
          }
        ]
      }
    },
    "DataProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "data-processor-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nfrom datetime import datetime\n\ndynamodb = boto3.resource('dynamodb')\ns3 = boto3.client('s3')\ntable_name = os.environ['TABLE_NAME']\nbucket_name = os.environ['BUCKET_NAME']\n\ndef handler(event, context):\n    try:\n        # Process transaction data\n        transaction_id = event.get('transactionId', 'unknown')\n        timestamp = int(datetime.now().timestamp())\n        amount = event.get('amount', 0)\n        \n        # Store in DynamoDB\n        table = dynamodb.Table(table_name)\n        table.put_item(\n            Item={\n                'transactionId': transaction_id,\n                'timestamp': timestamp,\n                'amount': amount,\n                'status': 'processed'\n            }\n        )\n        \n        # Store in S3 for archival\n        s3.put_object(\n            Bucket=bucket_name,\n            Key=f'transactions/{transaction_id}.json',\n            Body=json.dumps(event),\n            ServerSideEncryption='aws:kms'\n        )\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': 'Transaction processed successfully',\n                'transactionId': transaction_id\n            })\n        }\n    except Exception as e:\n        print(f'Error processing transaction: {str(e)}')\n        return {\n            'statusCode': 500,\n            'body': json.dumps({'error': str(e)})\n        }\n"
        },
        "Environment": {
          "Variables": {
            "TABLE_NAME": {
              "Ref": "TransactionTable"
            },
            "BUCKET_NAME": {
              "Ref": "DataBucket"
            },
            "KMS_KEY_ID": {
              "Ref": "KMSKey"
            }
          }
        },
        "VpcConfig": {
          "SubnetIds": [
            {
              "Ref": "PrivateSubnet1"
            },
            {
              "Ref": "PrivateSubnet2"
            }
          ],
          "SecurityGroupIds": [
            {
              "Ref": "LambdaSecurityGroup"
            }
          ]
        },
        "KmsKeyArn": {
          "Fn::GetAtt": ["KMSKey", "Arn"]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "data-processor-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
          }
        ]
      }
    },
    "DataProcessorLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/data-processor-${EnvironmentSuffix}"
        },
        "RetentionInDays": {
          "Ref": "LogRetentionDays"
        },
        "KmsKeyId": {
          "Fn::GetAtt": ["KMSKey", "Arn"]
        }
      }
    },
    "SecretRotationFunctionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "secret-rotation-role-${EnvironmentSuffix}"
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
            "PolicyName": "SecretRotationPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:DescribeSecret",
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:PutSecretValue",
                    "secretsmanager:UpdateSecretVersionStage"
                  ],
                  "Resource": {
                    "Ref": "DatabaseSecret"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetRandomPassword"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["KMSKey", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/secret-rotation-*"
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
              "Fn::Sub": "rotation-role-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
          }
        ]
      }
    },
    "SecretRotationFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "secret-rotation-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["SecretRotationFunctionRole", "Arn"]
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\n\nsecretsmanager = boto3.client('secretsmanager')\n\ndef handler(event, context):\n    arn = event['SecretId']\n    token = event['ClientRequestToken']\n    step = event['Step']\n    \n    if step == 'createSecret':\n        create_secret(arn, token)\n    elif step == 'setSecret':\n        set_secret(arn, token)\n    elif step == 'testSecret':\n        test_secret(arn, token)\n    elif step == 'finishSecret':\n        finish_secret(arn, token)\n    else:\n        raise ValueError('Invalid step parameter')\n\ndef create_secret(arn, token):\n    secretsmanager.get_secret_value(SecretId=arn, VersionStage='AWSCURRENT')\n    try:\n        secretsmanager.get_secret_value(SecretId=arn, VersionId=token, VersionStage='AWSPENDING')\n    except secretsmanager.exceptions.ResourceNotFoundException:\n        passwd = secretsmanager.get_random_password(ExcludeCharacters='\"@/\\\\')\n        secretsmanager.put_secret_value(SecretId=arn, ClientRequestToken=token, SecretString=json.dumps({'password': passwd['RandomPassword']}), VersionStages=['AWSPENDING'])\n\ndef set_secret(arn, token):\n    pass\n\ndef test_secret(arn, token):\n    pass\n\ndef finish_secret(arn, token):\n    metadata = secretsmanager.describe_secret(SecretId=arn)\n    current_version = None\n    for version in metadata['VersionIdsToStages']:\n        if 'AWSCURRENT' in metadata['VersionIdsToStages'][version]:\n            current_version = version\n            break\n    secretsmanager.update_secret_version_stage(SecretId=arn, VersionStage='AWSCURRENT', MoveToVersionId=token, RemoveFromVersionId=current_version)\n"
        },
        "VpcConfig": {
          "SubnetIds": [
            {
              "Ref": "PrivateSubnet1"
            },
            {
              "Ref": "PrivateSubnet2"
            }
          ],
          "SecurityGroupIds": [
            {
              "Ref": "LambdaSecurityGroup"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "secret-rotation-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
          }
        ]
      }
    },
    "SecretRotationLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/secret-rotation-${EnvironmentSuffix}"
        },
        "RetentionInDays": {
          "Ref": "LogRetentionDays"
        },
        "KmsKeyId": {
          "Fn::GetAtt": ["KMSKey", "Arn"]
        }
      }
    },
    "SecretRotationPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Fn::GetAtt": ["SecretRotationFunction", "Arn"]
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "secretsmanager.amazonaws.com"
      }
    },
    "ApiGatewayRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "api-gateway-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "apigateway.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "ApiGatewayLogsPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/apigateway/*"
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
              "Fn::Sub": "api-gateway-role-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
          }
        ]
      }
    },
    "RestApi": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": {
          "Fn::Sub": "data-processing-api-${EnvironmentSuffix}"
        },
        "Description": "REST API for secure data processing pipeline",
        "ApiKeySourceType": "HEADER",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "api-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
          }
        ]
      }
    },
    "TransactionsResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "RestApi"
        },
        "ParentId": {
          "Fn::GetAtt": ["RestApi", "RootResourceId"]
        },
        "PathPart": "transactions"
      }
    },
    "RequestValidator": {
      "Type": "AWS::ApiGateway::RequestValidator",
      "Properties": {
        "Name": "RequestBodyValidator",
        "RestApiId": {
          "Ref": "RestApi"
        },
        "ValidateRequestBody": true,
        "ValidateRequestParameters": true
      }
    },
    "TransactionModel": {
      "Type": "AWS::ApiGateway::Model",
      "Properties": {
        "RestApiId": {
          "Ref": "RestApi"
        },
        "Name": "TransactionModel",
        "ContentType": "application/json",
        "Schema": {
          "$schema": "http://json-schema.org/draft-04/schema#",
          "type": "object",
          "required": ["transactionId", "amount"],
          "properties": {
            "transactionId": {
              "type": "string"
            },
            "amount": {
              "type": "number"
            }
          }
        }
      }
    },
    "PostTransactionMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "RestApi"
        },
        "ResourceId": {
          "Ref": "TransactionsResource"
        },
        "HttpMethod": "POST",
        "AuthorizationType": "NONE",
        "ApiKeyRequired": true,
        "RequestValidatorId": {
          "Ref": "RequestValidator"
        },
        "RequestModels": {
          "application/json": {
            "Ref": "TransactionModel"
          }
        },
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${DataProcessorFunction.Arn}/invocations"
          }
        }
      }
    },
    "ApiDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": ["PostTransactionMethod"],
      "Properties": {
        "RestApiId": {
          "Ref": "RestApi"
        },
        "StageName": "prod"
      }
    },
    "ApiStage": {
      "Type": "AWS::ApiGateway::Stage",
      "Properties": {
        "RestApiId": {
          "Ref": "RestApi"
        },
        "DeploymentId": {
          "Ref": "ApiDeployment"
        },
        "StageName": "prod",
        "MethodSettings": [
          {
            "ResourcePath": "/*",
            "HttpMethod": "*",
            "LoggingLevel": "INFO",
            "DataTraceEnabled": true,
            "MetricsEnabled": true
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "api-stage-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
          }
        ]
      }
    },
    "ApiKey": {
      "Type": "AWS::ApiGateway::ApiKey",
      "DependsOn": ["ApiDeployment"],
      "Properties": {
        "Name": {
          "Fn::Sub": "api-key-${EnvironmentSuffix}"
        },
        "Description": "API key for secure data processing pipeline",
        "Enabled": true,
        "StageKeys": [
          {
            "RestApiId": {
              "Ref": "RestApi"
            },
            "StageName": "prod"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "api-key-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
          }
        ]
      }
    },
    "UsagePlan": {
      "Type": "AWS::ApiGateway::UsagePlan",
      "DependsOn": ["ApiDeployment"],
      "Properties": {
        "UsagePlanName": {
          "Fn::Sub": "usage-plan-${EnvironmentSuffix}"
        },
        "Description": "Usage plan for secure data processing API",
        "ApiStages": [
          {
            "ApiId": {
              "Ref": "RestApi"
            },
            "Stage": "prod"
          }
        ],
        "Quota": {
          "Limit": 10000,
          "Period": "DAY"
        },
        "Throttle": {
          "BurstLimit": 200,
          "RateLimit": 100
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "usage-plan-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "SecureDataPipeline"
          },
          {
            "Key": "ComplianceLevel",
            "Value": "High"
          }
        ]
      }
    },
    "UsagePlanKey": {
      "Type": "AWS::ApiGateway::UsagePlanKey",
      "Properties": {
        "KeyId": {
          "Ref": "ApiKey"
        },
        "KeyType": "API_KEY",
        "UsagePlanId": {
          "Ref": "UsagePlan"
        }
      }
    },
    "LambdaApiGatewayPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Fn::GetAtt": ["DataProcessorFunction", "Arn"]
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${RestApi}/*"
        }
      }
    },
    "ApiGatewayLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/apigateway/${RestApi}/prod"
        },
        "RetentionInDays": {
          "Ref": "LogRetentionDays"
        },
        "KmsKeyId": {
          "Fn::GetAtt": ["KMSKey", "Arn"]
        }
      }
    },
    "ApiErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "api-errors-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when API Gateway has failed requests",
        "MetricName": "5XXError",
        "Namespace": "AWS/ApiGateway",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "ApiName",
            "Value": {
              "Fn::Sub": "data-processing-api-${EnvironmentSuffix}"
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "lambda-errors-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when Lambda functions have errors",
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
              "Ref": "DataProcessorFunction"
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    }
  },
  "Outputs": {
    "KMSKeyId": {
      "Description": "KMS Key ID for encryption",
      "Value": {
        "Ref": "KMSKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyId"
        }
      }
    },
    "KMSKeyArn": {
      "Description": "KMS Key ARN",
      "Value": {
        "Fn::GetAtt": ["KMSKey", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyArn"
        }
      }
    },
    "VPCId": {
      "Description": "VPC ID for the secure pipeline",
      "Value": {
        "Ref": "VPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPCId"
        }
      }
    },
    "DataBucketName": {
      "Description": "S3 bucket name for data storage",
      "Value": {
        "Ref": "DataBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DataBucket"
        }
      }
    },
    "TransactionTableName": {
      "Description": "DynamoDB table name for transactions",
      "Value": {
        "Ref": "TransactionTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TransactionTable"
        }
      }
    },
    "DataProcessorFunctionArn": {
      "Description": "Lambda function ARN for data processing",
      "Value": {
        "Fn::GetAtt": ["DataProcessorFunction", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DataProcessorArn"
        }
      }
    },
    "ApiEndpoint": {
      "Description": "API Gateway endpoint URL",
      "Value": {
        "Fn::Sub": "https://${RestApi}.execute-api.${AWS::Region}.amazonaws.com/prod"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ApiEndpoint"
        }
      }
    },
    "ApiKeyId": {
      "Description": "API Key ID for authentication",
      "Value": {
        "Ref": "ApiKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ApiKeyId"
        }
      }
    },
    "DatabaseSecretArn": {
      "Description": "Secrets Manager secret ARN for database credentials",
      "Value": {
        "Ref": "DatabaseSecret"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DatabaseSecretArn"
        }
      }
    }
  }
}

```
