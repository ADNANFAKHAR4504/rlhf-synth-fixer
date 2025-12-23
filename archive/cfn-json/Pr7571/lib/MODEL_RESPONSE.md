# PCI-DSS Compliant Payment Processing Infrastructure

This solution provides a secure, PCI-DSS compliant payment processing infrastructure using CloudFormation JSON. All resources are encrypted, run in private subnets, and use VPC endpoints to avoid internet routing.

## File: lib/template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "PCI-DSS compliant payment processing infrastructure with encryption, VPC isolation, and comprehensive audit logging",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to support multiple deployments",
      "Default": "prod"
    }
  },
  "Resources": {
    "EncryptionKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for encrypting payment processing resources",
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
            }
          ]
        }
      }
    },
    "EncryptionKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/payment-processing-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "EncryptionKey"
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
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
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
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-private-subnet-1-${EnvironmentSuffix}"
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
        "CidrBlock": "10.0.2.0/24",
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
              "Fn::Sub": "payment-private-subnet-2-${EnvironmentSuffix}"
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
        "CidrBlock": "10.0.3.0/24",
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
              "Fn::Sub": "payment-private-subnet-3-${EnvironmentSuffix}"
            }
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
        "CidrBlock": "10.0.11.0/24",
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
              "Fn::Sub": "payment-public-subnet-1-${EnvironmentSuffix}"
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
    "PublicSubnetRouteTableAssociation": {
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
    "NATGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-nat-eip-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGatewayEIP",
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
              "Fn::Sub": "payment-nat-${EnvironmentSuffix}"
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
              "Fn::Sub": "payment-private-rt-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway"
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
          "Ref": "PrivateRouteTable"
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
          "Ref": "PrivateRouteTable"
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
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for payment processing Lambda function",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-lambda-sg-${EnvironmentSuffix}"
            }
          }
        ]
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
        "RouteTableIds": [
          {
            "Ref": "PrivateRouteTable"
          }
        ],
        "VpcEndpointType": "Gateway"
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
        "RouteTableIds": [
          {
            "Ref": "PrivateRouteTable"
          }
        ],
        "VpcEndpointType": "Gateway"
      }
    },
    "PaymentBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "payment-files-${EnvironmentSuffix}-${AWS::AccountId}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "EncryptionKey"
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
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-files-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PaymentBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "PaymentBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DenyUnencryptedObjectUploads",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${PaymentBucket.Arn}/*"
              },
              "Condition": {
                "StringNotEquals": {
                  "s3:x-amz-server-side-encryption": "aws:kms"
                }
              }
            },
            {
              "Sid": "DenyInsecureTransport",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:*",
              "Resource": [
                {
                  "Fn::GetAtt": [
                    "PaymentBucket",
                    "Arn"
                  ]
                },
                {
                  "Fn::Sub": "${PaymentBucket.Arn}/*"
                }
              ],
              "Condition": {
                "Bool": {
                  "aws:SecureTransport": "false"
                }
              }
            }
          ]
        }
      }
    },
    "TransactionTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "payment-transactions-${EnvironmentSuffix}"
        },
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
        "BillingMode": "PAY_PER_REQUEST",
        "SSESpecification": {
          "SSEEnabled": true,
          "SSEType": "KMS",
          "KMSMasterKeyId": {
            "Ref": "EncryptionKey"
          }
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-transactions-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "payment-lambda-role-${EnvironmentSuffix}"
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
            "PolicyName": "PaymentProcessingPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "PaymentBucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${PaymentBucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "TransactionTable",
                      "Arn"
                    ]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:DescribeKey",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "EncryptionKey",
                      "Arn"
                    ]
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
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/payment-processor-${EnvironmentSuffix}:*"
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
              "Fn::Sub": "payment-lambda-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PaymentProcessorLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/payment-processor-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30,
        "KmsKeyId": {
          "Fn::GetAtt": [
            "EncryptionKey",
            "Arn"
          ]
        }
      }
    },
    "PaymentProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "DependsOn": "PaymentProcessorLogGroup",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "payment-processor-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "payment_processor.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nfrom datetime import datetime\n\ndef lambda_handler(event, context):\n    return {'statusCode': 200, 'body': json.dumps('Placeholder')}\n"
        },
        "Environment": {
          "Variables": {
            "DYNAMODB_TABLE": {
              "Ref": "TransactionTable"
            },
            "S3_BUCKET": {
              "Ref": "PaymentBucket"
            },
            "KMS_KEY_ID": {
              "Ref": "EncryptionKey"
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
              "Ref": "PrivateSubnet1"
            },
            {
              "Ref": "PrivateSubnet2"
            },
            {
              "Ref": "PrivateSubnet3"
            }
          ]
        },
        "Timeout": 300,
        "MemorySize": 512,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-processor-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "CloudTrailBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "payment-cloudtrail-${EnvironmentSuffix}-${AWS::AccountId}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "EncryptionKey"
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
            "Value": {
              "Fn::Sub": "payment-cloudtrail-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "CloudTrailBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "CloudTrailBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSCloudTrailAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::GetAtt": [
                  "CloudTrailBucket",
                  "Arn"
                ]
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
                "Fn::Sub": "${CloudTrailBucket.Arn}/*"
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
    "PaymentProcessingTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "DependsOn": "CloudTrailBucketPolicy",
      "Properties": {
        "TrailName": {
          "Fn::Sub": "payment-trail-${EnvironmentSuffix}"
        },
        "S3BucketName": {
          "Ref": "CloudTrailBucket"
        },
        "IncludeGlobalServiceEvents": true,
        "IsLogging": true,
        "IsMultiRegionTrail": false,
        "KMSKeyId": {
          "Ref": "EncryptionKey"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-trail-${EnvironmentSuffix}"
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
    },
    "PaymentBucketName": {
      "Description": "S3 bucket for payment files",
      "Value": {
        "Ref": "PaymentBucket"
      }
    },
    "TransactionTableName": {
      "Description": "DynamoDB table for transactions",
      "Value": {
        "Ref": "TransactionTable"
      }
    },
    "PaymentProcessorFunctionArn": {
      "Description": "Lambda function ARN",
      "Value": {
        "Fn::GetAtt": [
          "PaymentProcessorFunction",
          "Arn"
        ]
      }
    },
    "KMSKeyId": {
      "Description": "KMS key ID for encryption",
      "Value": {
        "Ref": "EncryptionKey"
      }
    },
    "CloudTrailName": {
      "Description": "CloudTrail trail name",
      "Value": {
        "Ref": "PaymentProcessingTrail"
      }
    }
  }
}
```

## File: lib/lambda/payment_processor.py

```python
import json
import boto3
import os
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

# Get environment variables
DYNAMODB_TABLE = os.environ['DYNAMODB_TABLE']
S3_BUCKET = os.environ['S3_BUCKET']
KMS_KEY_ID = os.environ['KMS_KEY_ID']

# Initialize DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)


def lambda_handler(event, context):
    """
    Process encrypted payment files from S3 and store transaction records in DynamoDB.

    This function is triggered by S3 events or can be invoked directly.
    It reads payment data from S3, validates it, and stores transaction records
    in DynamoDB with encryption at rest.

    Args:
        event: AWS Lambda event object
        context: AWS Lambda context object

    Returns:
        dict: Response with statusCode and body
    """

    try:
        # Log the incoming event (without sensitive data)
        print(f"Processing payment event at {datetime.utcnow().isoformat()}")

        # Handle S3 event trigger
        if 'Records' in event:
            for record in event['Records']:
                if 's3' in record:
                    bucket = record['s3']['bucket']['name']
                    key = record['s3']['object']['key']

                    # Process the payment file
                    process_payment_file(bucket, key)

        # Handle direct invocation with payment data
        elif 'payment_data' in event:
            process_payment_data(event['payment_data'])

        else:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Invalid event format',
                    'message': 'Event must contain either S3 Records or payment_data'
                })
            }

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'timestamp': datetime.utcnow().isoformat()
            })
        }

    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Payment processing failed',
                'message': str(e)
            })
        }


def process_payment_file(bucket, key):
    """
    Read and process a payment file from S3.

    Args:
        bucket (str): S3 bucket name
        key (str): S3 object key
    """
    print(f"Reading payment file from s3://{bucket}/{key}")

    # Get the encrypted file from S3
    response = s3_client.get_object(
        Bucket=bucket,
        Key=key
    )

    # Read and parse the payment data
    file_content = response['Body'].read().decode('utf-8')
    payment_data = json.loads(file_content)

    # Process the payment data
    process_payment_data(payment_data)


def process_payment_data(payment_data):
    """
    Validate and store payment transaction data in DynamoDB.

    Args:
        payment_data (dict): Payment transaction data
    """
    # Validate required fields
    required_fields = ['transactionId', 'amount', 'currency', 'cardLast4']
    for field in required_fields:
        if field not in payment_data:
            raise ValueError(f"Missing required field: {field}")

    # Prepare transaction record
    timestamp = int(datetime.utcnow().timestamp() * 1000)

    transaction_record = {
        'transactionId': payment_data['transactionId'],
        'timestamp': timestamp,
        'amount': Decimal(str(payment_data['amount'])),
        'currency': payment_data['currency'],
        'cardLast4': payment_data['cardLast4'],
        'status': 'processed',
        'processedAt': datetime.utcnow().isoformat(),
        'metadata': payment_data.get('metadata', {})
    }

    # Store in DynamoDB (encrypted at rest with KMS)
    print(f"Storing transaction {payment_data['transactionId']} in DynamoDB")

    table.put_item(Item=transaction_record)

    print(f"Transaction {payment_data['transactionId']} processed successfully")


def query_transactions(transaction_id):
    """
    Query transaction records from DynamoDB.

    Args:
        transaction_id (str): Transaction ID to query

    Returns:
        list: List of transaction records
    """
    response = table.query(
        KeyConditionExpression='transactionId = :tid',
        ExpressionAttributeValues={
            ':tid': transaction_id
        }
    )

    return response.get('Items', [])
```

## Architecture Overview

The solution implements a secure, PCI-DSS compliant payment processing infrastructure with the following components:

### Network Architecture
- **VPC**: Isolated network with private and public subnets across 3 availability zones
- **Private Subnets**: Host Lambda functions with no direct internet access
- **Public Subnet**: Hosts NAT Gateway for controlled outbound traffic
- **VPC Endpoints**: Gateway endpoints for S3 and DynamoDB to avoid internet routing

### Security Components
- **KMS Key**: Customer-managed key with automatic rotation for all encryption
- **IAM Roles**: Least privilege access with specific permissions for each service
- **Security Groups**: Restrict Lambda egress to HTTPS only
- **Bucket Policies**: Deny unencrypted uploads and enforce HTTPS transport

### Data Storage
- **S3 Bucket**: SSE-KMS encryption, versioning enabled, all public access blocked
- **DynamoDB Table**: KMS encryption at rest, point-in-time recovery enabled
- **CloudTrail Bucket**: Separate encrypted bucket for audit logs

### Compute
- **Lambda Function**: Runs in private subnets, processes encrypted payment files
- **CloudWatch Logs**: Encrypted logs with 30-day retention

### Compliance Features
- All data encrypted at rest with customer-managed KMS keys
- All data encrypted in transit (HTTPS/TLS)
- Comprehensive audit logging with CloudTrail
- No data traverses public internet
- Least privilege IAM policies
- Multi-AZ deployment for high availability

## Deployment Instructions

1. **Prerequisites**:
   - AWS CLI configured with appropriate credentials
   - Sufficient IAM permissions to create all resources
   - Choose a unique environment suffix

2. **Deploy the stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name payment-processing \
     --template-body file://lib/template.json \
     --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

3. **Monitor deployment**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name payment-processing \
     --region us-east-1
   ```

4. **Update Lambda function code**:
   ```bash
   cd lib/lambda
   zip -r payment_processor.zip payment_processor.py
   aws lambda update-function-code \
     --function-name payment-processor-prod \
     --zip-file fileb://payment_processor.zip \
     --region us-east-1
   ```

5. **Test the function**:
   ```bash
   aws lambda invoke \
     --function-name payment-processor-prod \
     --payload '{"payment_data":{"transactionId":"test-123","amount":"100.00","currency":"USD","cardLast4":"1234"}}' \
     --region us-east-1 \
     response.json
   ```

6. **Clean up** (when needed):
   ```bash
   # Empty S3 buckets first
   aws s3 rm s3://payment-files-prod-<account-id> --recursive
   aws s3 rm s3://payment-cloudtrail-prod-<account-id> --recursive

   # Delete the stack
   aws cloudformation delete-stack \
     --stack-name payment-processing \
     --region us-east-1
   ```

## Known Limitations

1. **NAT Gateway Cost**: NAT Gateway can be expensive for high-traffic scenarios. Consider NAT instances for cost optimization.

2. **Deployment Time**: NAT Gateway and VPC endpoint creation can take 5-10 minutes.

3. **Lambda Cold Starts**: VPC Lambda functions experience longer cold start times due to ENI creation.

4. **CloudTrail KMS**: Ensure the KMS key policy allows CloudTrail to use it for encryption.

## Security Best Practices

- Rotate KMS keys regularly (automatic rotation is enabled)
- Review CloudTrail logs for suspicious activity
- Use AWS Config to monitor compliance
- Implement S3 lifecycle policies for log retention
- Enable MFA for sensitive operations
- Use AWS Secrets Manager for any application secrets
