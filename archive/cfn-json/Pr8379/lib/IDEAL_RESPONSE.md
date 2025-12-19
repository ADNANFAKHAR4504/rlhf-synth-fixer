```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless Polling and Voting System with Real-time Results and Analytics",
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Default": "production",
      "AllowedValues": [
        "development",
        "staging",
        "production"
      ],
      "Description": "Environment name"
    },
    "ApiThrottleRateLimit": {
      "Type": "Number",
      "Default": 100,
      "Description": "API Gateway throttle rate limit per second"
    },
    "ApiThrottleBurstLimit": {
      "Type": "Number",
      "Default": 200,
      "Description": "API Gateway throttle burst limit"
    },
    "ElastiCacheNodeType": {
      "Type": "String",
      "Default": "cache.t3.micro",
      "AllowedValues": [
        "cache.t3.micro",
        "cache.t3.small",
        "cache.t3.medium"
      ],
      "Description": "ElastiCache node instance type"
    },
    "QuickSightUserArn": {
      "Type": "String",
      "Description": "ARN of the QuickSight user/group for dashboard access",
      "Default": ""
    }
  },
  "Conditions": {
    "HasQuickSightUser": {
      "Fn::Not": [
        {
          "Fn::Equals": [
            {
              "Ref": "QuickSightUserArn"
            },
            ""
          ]
        }
      ]
    }
  },
  "Resources": {
    "VotingVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${AWS::StackName}-vpc"
            }
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VotingVPC"
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
              "Fn::Sub": "${AWS::StackName}-private-subnet-1"
            }
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VotingVPC"
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
              "Fn::Sub": "${AWS::StackName}-private-subnet-2"
            }
          }
        ]
      }
    },
    "SecurityGroupLambda": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda functions",
        "VpcId": {
          "Ref": "VotingVPC"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": -1,
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${AWS::StackName}-lambda-sg"
            }
          }
        ]
      }
    },
    "SecurityGroupElastiCache": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for ElastiCache",
        "VpcId": {
          "Ref": "VotingVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 6379,
            "ToPort": 6379,
            "SourceSecurityGroupId": {
              "Ref": "SecurityGroupLambda"
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "${AWS::StackName}-elasticache-sg"
            }
          }
        ]
      }
    },
    "VotesTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "${AWS::StackName}-votes"
        },
        "BillingMode": "PAY_PER_REQUEST",
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "voteId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "pollId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "timestamp",
            "AttributeType": "N"
          },
          {
            "AttributeName": "voterId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "voteId",
            "KeyType": "HASH"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "PollIndex",
            "KeySchema": [
              {
                "AttributeName": "pollId",
                "KeyType": "HASH"
              },
              {
                "AttributeName": "timestamp",
                "KeyType": "RANGE"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            }
          },
          {
            "IndexName": "VoterIndex",
            "KeySchema": [
              {
                "AttributeName": "voterId",
                "KeyType": "HASH"
              },
              {
                "AttributeName": "timestamp",
                "KeyType": "RANGE"
              }
            ],
            "Projection": {
              "ProjectionType": "KEYS_ONLY"
            }
          }
        ],
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "SSESpecification": {
          "SSEEnabled": true
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    },
    "PollsTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "${AWS::StackName}-polls"
        },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "pollId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "status",
            "AttributeType": "S"
          },
          {
            "AttributeName": "createdAt",
            "AttributeType": "N"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "pollId",
            "KeyType": "HASH"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "StatusIndex",
            "KeySchema": [
              {
                "AttributeName": "status",
                "KeyType": "HASH"
              },
              {
                "AttributeName": "createdAt",
                "KeyType": "RANGE"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            }
          }
        ],
        "SSESpecification": {
          "SSEEnabled": true
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    },
    "IdempotencyTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "${AWS::StackName}-idempotency"
        },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "idempotencyKey",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "idempotencyKey",
            "KeyType": "HASH"
          }
        ],
        "TimeToLiveSpecification": {
          "AttributeName": "ttl",
          "Enabled": true
        },
        "SSESpecification": {
          "SSEEnabled": true
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    },
    "ElastiCacheSubnetGroup": {
      "Type": "AWS::ElastiCache::SubnetGroup",
      "Properties": {
        "Description": "Subnet group for ElastiCache",
        "SubnetIds": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          }
        ]
      }
    },
    "ElastiCacheCluster": {
      "Type": "AWS::ElastiCache::ReplicationGroup",
      "Properties": {
        "ReplicationGroupId": {
          "Fn::Sub": "${AWS::StackName}-cache"
        },
        "ReplicationGroupDescription": "Redis cache for real-time vote results",
        "Engine": "redis",
        "CacheNodeType": {
          "Ref": "ElastiCacheNodeType"
        },
        "NumCacheClusters": 2,
        "AutomaticFailoverEnabled": true,
        "MultiAZEnabled": true,
        "CacheSubnetGroupName": {
          "Ref": "ElastiCacheSubnetGroup"
        },
        "SecurityGroupIds": [
          {
            "Ref": "SecurityGroupElastiCache"
          }
        ],
        "AtRestEncryptionEnabled": true,
        "TransitEncryptionEnabled": true,
        "SnapshotRetentionLimit": 7,
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    },
    "ResultsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "ArchiveOldResults",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 30,
                  "StorageClass": "STANDARD_IA"
                },
                {
                  "TransitionInDays": 90,
                  "StorageClass": "GLACIER"
                }
              ]
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
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
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
            "PolicyName": "DynamoDBAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:BatchWriteItem",
                    "dynamodb:DescribeTable"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "VotesTable",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${VotesTable.Arn}/index/*"
                    },
                    {
                      "Fn::GetAtt": [
                        "PollsTable",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${PollsTable.Arn}/index/*"
                    },
                    {
                      "Fn::GetAtt": [
                        "IdempotencyTable",
                        "Arn"
                      ]
                    }
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "ElastiCacheAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "elasticache:DescribeCacheClusters",
                    "elasticache:DescribeReplicationGroups"
                  ],
                  "Resource": "*"
                }
              ]
            }
          },
          {
            "PolicyName": "S3Access",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:GetObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "ResultsBucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${ResultsBucket.Arn}/*"
                    }
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "CloudWatchMetrics",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudwatch:PutMetricData"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "VoteProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${AWS::StackName}-vote-processor"
        },
        "Runtime": "python3.10",
        "Handler": "index.lambda_handler",
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
            "VOTES_TABLE": {
              "Ref": "VotesTable"
            },
            "POLLS_TABLE": {
              "Ref": "PollsTable"
            },
            "IDEMPOTENCY_TABLE": {
              "Ref": "IdempotencyTable"
            },
            "REDIS_ENDPOINT": {
              "Fn::GetAtt": [
                "ElastiCacheCluster",
                "PrimaryEndPoint.Address"
              ]
            },
            "REDIS_PORT": {
              "Fn::GetAtt": [
                "ElastiCacheCluster",
                "PrimaryEndPoint.Port"
              ]
            },
            "ENVIRONMENT": {
              "Ref": "Environment"
            }
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "SecurityGroupLambda"
            }
          ],
          "SubnetIds": [
            {
              "Ref": "PrivateSubnet1"
            },
            {
              "Ref": "PrivateSubnet2"
            }
          ]
        },
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "import json",
                "import boto3",
                "import redis",
                "import hashlib",
                "import time",
                "import os",
                "from datetime import datetime, timedelta",
                "from decimal import Decimal",
                "from botocore.exceptions import ClientError",
                "",
                "# Initialize clients",
                "dynamodb = boto3.resource('dynamodb')",
                "cloudwatch = boto3.client('cloudwatch')",
                "",
                "# Environment variables",
                "VOTES_TABLE = os.environ['VOTES_TABLE']",
                "POLLS_TABLE = os.environ['POLLS_TABLE']",
                "IDEMPOTENCY_TABLE = os.environ['IDEMPOTENCY_TABLE']",
                "REDIS_ENDPOINT = os.environ['REDIS_ENDPOINT']",
                "REDIS_PORT = int(os.environ['REDIS_PORT'])",
                "",
                "# Initialize Redis connection",
                "redis_client = redis.Redis(",
                "    host=REDIS_ENDPOINT,",
                "    port=REDIS_PORT,",
                "    decode_responses=True,",
                "    socket_connect_timeout=5,",
                "    socket_timeout=5",
                ")",
                "",
                "def lambda_handler(event, context):",
                "    try:",
                "        body = json.loads(event['body'])",
                "        ",
                "        # Extract vote data",
                "        poll_id = body['pollId']",
                "        option_id = body['optionId']",
                "        voter_id = body.get('voterId', event['requestContext']['identity']['sourceIp'])",
                "        idempotency_key = body.get('idempotencyKey', '')",
                "        demographics = body.get('demographics', {})",
                "        ",
                "        # Check idempotency",
                "        if idempotency_key:",
                "            if not check_idempotency(idempotency_key):",
                "                return {",
                "                    'statusCode': 409,",
                "                    'body': json.dumps({'message': 'Duplicate vote detected'})",
                "                }",
                "        ",
                "        # Generate vote ID",
                "        vote_id = generate_vote_id(poll_id, voter_id, option_id)",
                "        ",
                "        # Store vote",
                "        vote_data = store_vote(vote_id, poll_id, option_id, voter_id, demographics)",
                "        ",
                "        # Update atomic counters",
                "        update_vote_counts(poll_id, option_id)",
                "        ",
                "        # Update Redis cache",
                "        update_redis_cache(poll_id, option_id)",
                "        ",
                "        # Send metrics to CloudWatch",
                "        send_metrics(poll_id, demographics)",
                "        ",
                "        return {",
                "            'statusCode': 200,",
                "            'body': json.dumps({",
                "                'message': 'Vote processed successfully',",
                "                'voteId': vote_id",
                "            })",
                "        }",
                "        ",
                "    except Exception as e:",
                "        print(f\"Error processing vote: {str(e)}\")",
                "        return {",
                "            'statusCode': 500,",
                "            'body': json.dumps({'message': 'Internal server error'})",
                "        }",
                "",
                "def check_idempotency(idempotency_key):",
                "    \"\"\"Check and set idempotency key with TTL\"\"\"",
                "    table = dynamodb.Table(IDEMPOTENCY_TABLE)",
                "    ttl = int(time.time()) + 86400  # 24 hours TTL",
                "    ",
                "    try:",
                "        table.put_item(",
                "            Item={",
                "                'idempotencyKey': idempotency_key,",
                "                'ttl': ttl,",
                "                'timestamp': int(time.time())",
                "            },",
                "            ConditionExpression='attribute_not_exists(idempotencyKey)'",
                "        )",
                "        return True",
                "    except ClientError as e:",
                "        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':",
                "            return False",
                "        raise",
                "",
                "def generate_vote_id(poll_id, voter_id, option_id):",
                "    \"\"\"Generate unique vote ID\"\"\"",
                "    timestamp = str(int(time.time() * 1000000))",
                "    data = f\"{poll_id}{voter_id}{option_id}{timestamp}\"",
                "    return hashlib.sha256(data.encode()).hexdigest()[:16]",
                "",
                "def store_vote(vote_id, poll_id, option_id, voter_id, demographics):",
                "    \"\"\"Store vote in DynamoDB\"\"\"",
                "    table = dynamodb.Table(VOTES_TABLE)",
                "    ",
                "    vote_data = {",
                "        'voteId': vote_id,",
                "        'pollId': poll_id,",
                "        'optionId': option_id,",
                "        'voterId': voter_id,",
                "        'timestamp': Decimal(str(time.time())),",
                "        'demographics': demographics,",
                "        'createdAt': datetime.utcnow().isoformat()",
                "    }",
                "    ",
                "    table.put_item(Item=vote_data)",
                "    return vote_data",
                "",
                "def update_vote_counts(poll_id, option_id):",
                "    \"\"\"Update atomic counters in DynamoDB\"\"\"",
                "    table = dynamodb.Table(POLLS_TABLE)",
                "    ",
                "    table.update_item(",
                "        Key={'pollId': poll_id},",
                "        UpdateExpression='ADD #votes.#option :val, totalVotes :val',",
                "        ExpressionAttributeNames={",
                "            '#votes': 'votes',",
                "            '#option': option_id",
                "        },",
                "        ExpressionAttributeValues={",
                "            ':val': 1",
                "        }",
                "    )",
                "",
                "def update_redis_cache(poll_id, option_id):",
                "    \"\"\"Update real-time vote counts in Redis\"\"\"",
                "    try:",
                "        # Increment vote count",
                "        redis_client.hincrby(f\"poll:{poll_id}:votes\", option_id, 1)",
                "        redis_client.incr(f\"poll:{poll_id}:total\")",
                "        ",
                "        # Set expiry for 1 hour",
                "        redis_client.expire(f\"poll:{poll_id}:votes\", 3600)",
                "        redis_client.expire(f\"poll:{poll_id}:total\", 3600)",
                "    except Exception as e:",
                "        print(f\"Redis error: {str(e)}\")",
                "        # Continue processing even if Redis fails",
                "",
                "def send_metrics(poll_id, demographics):",
                "    \"\"\"Send custom metrics to CloudWatch\"\"\"",
                "    try:",
                "        metrics = []",
                "        ",
                "        # Vote count metric",
                "        metrics.append({",
                "            'MetricName': 'VoteCount',",
                "            'Dimensions': [",
                "                {'Name': 'PollId', 'Value': poll_id}",
                "            ],",
                "            'Value': 1,",
                "            'Unit': 'Count'",
                "        })",
                "        ",
                "        # Demographics metrics",
                "        if 'ageGroup' in demographics:",
                "            metrics.append({",
                "                'MetricName': 'VotesByAgeGroup',",
                "                'Dimensions': [",
                "                    {'Name': 'AgeGroup', 'Value': demographics['ageGroup']}",
                "                ],",
                "                'Value': 1,",
                "                'Unit': 'Count'",
                "            })",
                "        ",
                "        cloudwatch.put_metric_data(",
                "            Namespace='VotingSystem',",
                "            MetricData=metrics",
                "        )",
                "    except Exception as e:",
                "        print(f\"CloudWatch metrics error: {str(e)}\")",
                ""
              ]
            ]
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    },
    "ResultsExporterFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${AWS::StackName}-results-exporter"
        },
        "Runtime": "python3.10",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Timeout": 300,
        "MemorySize": 1024,
        "Environment": {
          "Variables": {
            "VOTES_TABLE": {
              "Ref": "VotesTable"
            },
            "POLLS_TABLE": {
              "Ref": "PollsTable"
            },
            "RESULTS_BUCKET": {
              "Ref": "ResultsBucket"
            },
            "ENVIRONMENT": {
              "Ref": "Environment"
            }
          }
        },
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "import json",
                "import boto3",
                "import csv",
                "import io",
                "import os",
                "from datetime import datetime, timedelta",
                "from decimal import Decimal",
                "",
                "dynamodb = boto3.resource('dynamodb')",
                "s3 = boto3.client('s3')",
                "",
                "VOTES_TABLE = os.environ['VOTES_TABLE']",
                "POLLS_TABLE = os.environ['POLLS_TABLE']",
                "RESULTS_BUCKET = os.environ['RESULTS_BUCKET']",
                "",
                "def lambda_handler(event, context):",
                "    try:",
                "        # Get all active polls",
                "        polls = get_active_polls()",
                "        ",
                "        for poll in polls:",
                "            export_poll_results(poll['pollId'])",
                "        ",
                "        return {",
                "            'statusCode': 200,",
                "            'body': json.dumps({",
                "                'message': f'Successfully exported results for {len(polls)} polls'",
                "            })",
                "        }",
                "        ",
                "    except Exception as e:",
                "        print(f\"Error exporting results: {str(e)}\")",
                "        return {",
                "            'statusCode': 500,",
                "            'body': json.dumps({'message': 'Error exporting results'})",
                "        }",
                "",
                "def get_active_polls():",
                "    \"\"\"Get all active polls from DynamoDB\"\"\"",
                "    table = dynamodb.Table(POLLS_TABLE)",
                "    ",
                "    response = table.scan(",
                "        FilterExpression='#status = :status',",
                "        ExpressionAttributeNames={'#status': 'status'},",
                "        ExpressionAttributeValues={':status': 'active'}",
                "    )",
                "    ",
                "    return response.get('Items', [])",
                "",
                "def export_poll_results(poll_id):",
                "    \"\"\"Export poll results to S3\"\"\"",
                "    votes_table = dynamodb.Table(VOTES_TABLE)",
                "    ",
                "    # Query all votes for the poll",
                "    votes = []",
                "    last_evaluated_key = None",
                "    ",
                "    while True:",
                "        if last_evaluated_key:",
                "            response = votes_table.query(",
                "                IndexName='PollIndex',",
                "                KeyConditionExpression='pollId = :pollId',",
                "                ExpressionAttributeValues={':pollId': poll_id},",
                "                ExclusiveStartKey=last_evaluated_key",
                "            )",
                "        else:",
                "            response = votes_table.query(",
                "                IndexName='PollIndex',",
                "                KeyConditionExpression='pollId = :pollId',",
                "                ExpressionAttributeValues={':pollId': poll_id}",
                "            )",
                "        ",
                "        votes.extend(response['Items'])",
                "        ",
                "        last_evaluated_key = response.get('LastEvaluatedKey')",
                "        if not last_evaluated_key:",
                "            break",
                "    ",
                "    # Generate CSV",
                "    csv_buffer = io.StringIO()",
                "    csv_writer = csv.DictWriter(",
                "        csv_buffer,",
                "        fieldnames=['voteId', 'pollId', 'optionId', 'voterId', 'timestamp', 'demographics']",
                "    )",
                "    csv_writer.writeheader()",
                "    ",
                "    for vote in votes:",
                "        csv_writer.writerow({",
                "            'voteId': vote.get('voteId'),",
                "            'pollId': vote.get('pollId'),",
                "            'optionId': vote.get('optionId'),",
                "            'voterId': vote.get('voterId'),",
                "            'timestamp': str(vote.get('timestamp')),",
                "            'demographics': json.dumps(vote.get('demographics', {}))",
                "        })",
                "    ",
                "    # Upload to S3",
                "    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')",
                "    key = f\"exports/{poll_id}/{timestamp}_results.csv\"",
                "    ",
                "    s3.put_object(",
                "        Bucket=RESULTS_BUCKET,",
                "        Key=key,",
                "        Body=csv_buffer.getvalue(),",
                "        ContentType='text/csv'",
                "    )",
                "    ",
                "    print(f\"Exported {len(votes)} votes to s3://{RESULTS_BUCKET}/{key}\")",
                ""
              ]
            ]
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    },
    "VotingApi": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-api"
        },
        "Description": "Voting System API",
        "EndpointConfiguration": {
          "Types": [
            "REGIONAL"
          ]
        }
      }
    },
    "VotingApiDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": [
        "VoteMethod",
        "ResultsMethod"
      ],
      "Properties": {
        "RestApiId": {
          "Ref": "VotingApi"
        }
      }
    },
    "VotingApiStage": {
      "Type": "AWS::ApiGateway::Stage",
      "Properties": {
        "StageName": {
          "Ref": "Environment"
        },
        "RestApiId": {
          "Ref": "VotingApi"
        },
        "DeploymentId": {
          "Ref": "VotingApiDeployment"
        },
        "MethodSettings": [
          {
            "ResourcePath": "/*",
            "HttpMethod": "*",
            "MetricsEnabled": true,
            "ThrottlingRateLimit": {
              "Ref": "ApiThrottleRateLimit"
            },
            "ThrottlingBurstLimit": {
              "Ref": "ApiThrottleBurstLimit"
            }
          }
        ]
      }
    },
    "VoteResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "VotingApi"
        },
        "ParentId": {
          "Fn::GetAtt": [
            "VotingApi",
            "RootResourceId"
          ]
        },
        "PathPart": "vote"
      }
    },
    "VoteMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "VotingApi"
        },
        "ResourceId": {
          "Ref": "VoteResource"
        },
        "HttpMethod": "POST",
        "AuthorizationType": "NONE",
        "RequestValidatorId": {
          "Ref": "RequestValidator"
        },
        "RequestModels": {
          "application/json": {
            "Ref": "VoteModel"
          }
        },
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${VoteProcessorFunction.Arn}/invocations"
          }
        }
      }
    },
    "ResultsResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "VotingApi"
        },
        "ParentId": {
          "Fn::GetAtt": [
            "VotingApi",
            "RootResourceId"
          ]
        },
        "PathPart": "results"
      }
    },
    "ResultsMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "VotingApi"
        },
        "ResourceId": {
          "Ref": "ResultsResource"
        },
        "HttpMethod": "GET",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${VoteProcessorFunction.Arn}/invocations"
          }
        }
      }
    },
    "RequestValidator": {
      "Type": "AWS::ApiGateway::RequestValidator",
      "Properties": {
        "RestApiId": {
          "Ref": "VotingApi"
        },
        "Name": "RequestBodyValidator",
        "ValidateRequestBody": true,
        "ValidateRequestParameters": false
      }
    },
    "VoteModel": {
      "Type": "AWS::ApiGateway::Model",
      "Properties": {
        "RestApiId": {
          "Ref": "VotingApi"
        },
        "ContentType": "application/json",
        "Name": "VoteModel",
        "Schema": {
          "$schema": "http://json-schema.org/draft-04/schema#",
          "title": "Vote",
          "type": "object",
          "required": [
            "pollId",
            "optionId"
          ],
          "properties": {
            "pollId": {
              "type": "string",
              "minLength": 1
            },
            "optionId": {
              "type": "string",
              "minLength": 1
            },
            "idempotencyKey": {
              "type": "string"
            },
            "demographics": {
              "type": "object",
              "properties": {
                "ageGroup": {
                  "type": "string"
                },
                "location": {
                  "type": "string"
                },
                "gender": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
    },
    "ApiGatewayInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "VoteProcessorFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${VotingApi}/*/*/*"
        }
      }
    },
    "ResultsExportSchedule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-export-schedule"
        },
        "Description": "Schedule for exporting voting results",
        "ScheduleExpression": "rate(1 hour)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": [
                "ResultsExporterFunction",
                "Arn"
              ]
            },
            "Id": "ResultsExporter"
          }
        ]
      }
    },
    "SchedulePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "ResultsExporterFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": [
            "ResultsExportSchedule",
            "Arn"
          ]
        }
      }
    },
    "HighVoteVolumeAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${AWS::StackName}-high-vote-volume"
        },
        "AlarmDescription": "Alert when vote volume exceeds threshold",
        "MetricName": "VoteCount",
        "Namespace": "VotingSystem",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 100,
        "ComparisonOperator": "GreaterThanThreshold"
      }
    },
    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${AWS::StackName}-lambda-errors"
        },
        "AlarmDescription": "Alert on Lambda function errors",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "VoteProcessorFunction"
            }
          }
        ],
        "Statistic": "Sum",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold"
      }
    },
    "QuickSightDataSource": {
      "Type": "AWS::QuickSight::DataSource",
      "Condition": "HasQuickSightUser",
      "Properties": {
        "DataSourceId": {
          "Fn::Sub": "${AWS::StackName}-datasource"
        },
        "Name": {
          "Fn::Sub": "${AWS::StackName} Voting Data"
        },
        "Type": "S3",
        "AwsAccountId": {
          "Ref": "AWS::AccountId"
        },
        "DataSourceParameters": {
          "S3Parameters": {
            "ManifestFileLocation": {
              "Bucket": {
                "Ref": "ResultsBucket"
              },
              "Key": "quicksight/manifest.json"
            }
          }
        }
      }
    },
    "QuickSightDataSet": {
      "Type": "AWS::QuickSight::DataSet",
      "Condition": "HasQuickSightUser",
      "Properties": {
        "DataSetId": {
          "Fn::Sub": "${AWS::StackName}-dataset"
        },
        "Name": {
          "Fn::Sub": "${AWS::StackName} Voting Dataset"
        },
        "AwsAccountId": {
          "Ref": "AWS::AccountId"
        },
        "ImportMode": "SPICE",
        "PhysicalTableMap": {
          "VotingData": {
            "S3Source": {
              "DataSourceArn": {
                "Fn::GetAtt": [
                  "QuickSightDataSource",
                  "Arn"
                ]
              },
              "InputColumns": [
                {
                  "Name": "voteId",
                  "Type": "STRING"
                },
                {
                  "Name": "pollId",
                  "Type": "STRING"
                },
                {
                  "Name": "optionId",
                  "Type": "STRING"
                },
                {
                  "Name": "timestamp",
                  "Type": "DATETIME"
                },
                {
                  "Name": "demographics",
                  "Type": "STRING"
                }
              ]
            }
          }
        }
      }
    }
  },
  "Outputs": {
    "ApiEndpoint": {
      "Description": "API Gateway endpoint URL",
      "Value": {
        "Fn::Sub": "https://${VotingApi}.execute-api.${AWS::Region}.amazonaws.com/${Environment}"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-api-endpoint"
        }
      }
    },
    "VotesTableName": {
      "Description": "DynamoDB Votes table name",
      "Value": {
        "Ref": "VotesTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-votes-table"
        }
      }
    },
    "PollsTableName": {
      "Description": "DynamoDB Polls table name",
      "Value": {
        "Ref": "PollsTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-polls-table"
        }
      }
    },
    "ResultsBucketName": {
      "Description": "S3 bucket for results",
      "Value": {
        "Ref": "ResultsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-results-bucket"
        }
      }
    },
    "ElastiCacheEndpoint": {
      "Description": "ElastiCache Redis endpoint",
      "Value": {
        "Fn::GetAtt": [
          "ElastiCacheCluster",
          "PrimaryEndPoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-redis-endpoint"
        }
      }
    },
    "VoteProcessorFunctionArn": {
      "Description": "Vote processor Lambda function ARN",
      "Value": {
        "Fn::GetAtt": [
          "VoteProcessorFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-vote-processor-arn"
        }
      }
    }
  }
}```
