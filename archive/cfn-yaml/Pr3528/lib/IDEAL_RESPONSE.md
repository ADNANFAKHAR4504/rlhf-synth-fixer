# Overview

Please find solution files below.

## ./lib/TapStack.json

```json
{
    "AWSTemplateFormatVersion": "2010-09-09",
    "Description": "TAP Stack - Task Assignment Platform CloudFormation Template with Complete Feedback System",
    "Metadata": {
        "AWS::CloudFormation::Interface": {
            "ParameterGroups": [
                {
                    "Label": {
                        "default": "Environment Configuration"
                    },
                    "Parameters": [
                        "EnvironmentSuffix"
                    ]
                },
                {
                    "Label": {
                        "default": "Notification Configuration"
                    },
                    "Parameters": [
                        "NotificationEmail"
                    ]
                }
            ]
        }
    },
    "Parameters": {
        "EnvironmentSuffix": {
            "Type": "String",
            "Default": "dev",
            "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
            "AllowedPattern": "^[a-zA-Z0-9]+$",
            "ConstraintDescription": "Must contain only alphanumeric characters"
        },
        "NotificationEmail": {
            "Type": "String",
            "Default": "noreply@example.com",
            "Description": "Email address for weekly report notifications",
            "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
            "ConstraintDescription": "Must be a valid email address"
        }
    },
    "Resources": {
        "TurnAroundPromptTable": {
            "Type": "AWS::DynamoDB::Table",
            "DeletionPolicy": "Delete",
            "UpdateReplacePolicy": "Delete",
            "Properties": {
                "TableName": {
                    "Fn::Sub": "TurnAroundPromptTable${EnvironmentSuffix}"
                },
                "AttributeDefinitions": [
                    {
                        "AttributeName": "id",
                        "AttributeType": "S"
                    },
                    {
                        "AttributeName": "timestamp",
                        "AttributeType": "N"
                    },
                    {
                        "AttributeName": "sentiment",
                        "AttributeType": "S"
                    },
                    {
                        "AttributeName": "datePartition",
                        "AttributeType": "S"
                    }
                ],
                "KeySchema": [
                    {
                        "AttributeName": "id",
                        "KeyType": "HASH"
                    }
                ],
                "BillingMode": "PAY_PER_REQUEST",
                "DeletionProtectionEnabled": false,
                "GlobalSecondaryIndexes": [
                    {
                        "IndexName": "DateSentimentIndex",
                        "KeySchema": [
                            {
                                "AttributeName": "datePartition",
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
                        "IndexName": "SentimentTimestampIndex",
                        "KeySchema": [
                            {
                                "AttributeName": "sentiment",
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
                    }
                ],
                "StreamSpecification": {
                    "StreamViewType": "NEW_AND_OLD_IMAGES"
                },
                "Tags": [
                    {
                        "Key": "iac-rlhf-amazon",
                        "Value": "true"
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
        "ReportsBucket": {
            "Type": "AWS::S3::Bucket",
            "Properties": {
                "BucketName": {
                    "Fn::Sub": "feedback-reports-${EnvironmentSuffix}-${AWS::AccountId}"
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
                "VersioningConfiguration": {
                    "Status": "Enabled"
                },
                "LifecycleConfiguration": {
                    "Rules": [
                        {
                            "Id": "DeleteOldReports",
                            "Status": "Enabled",
                            "ExpirationInDays": 90
                        }
                    ]
                },
                "Tags": [
                    {
                        "Key": "iac-rlhf-amazon",
                        "Value": "true"
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
        "FeedbackProcessorRole": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "RoleName": {
                    "Fn::Sub": "FeedbackProcessorRole-${EnvironmentSuffix}"
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
                    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                ],
                "Policies": [
                    {
                        "PolicyName": "FeedbackProcessorPolicy",
                        "PolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "dynamodb:PutItem",
                                        "dynamodb:UpdateItem",
                                        "dynamodb:GetItem"
                                    ],
                                    "Resource": {
                                        "Fn::GetAtt": [
                                            "TurnAroundPromptTable",
                                            "Arn"
                                        ]
                                    }
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "comprehend:DetectSentiment",
                                        "comprehend:DetectKeyPhrases",
                                        "comprehend:DetectEntities"
                                    ],
                                    "Resource": "*"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "logs:CreateLogGroup",
                                        "logs:CreateLogStream",
                                        "logs:PutLogEvents"
                                    ],
                                    "Resource": {
                                        "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
                                    }
                                },
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
                ],
                "Tags": [
                    {
                        "Key": "iac-rlhf-amazon",
                        "Value": "true"
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
        "ReportGeneratorRole": {
            "Type": "AWS::IAM::Role",
            "Properties": {
                "RoleName": {
                    "Fn::Sub": "ReportGeneratorRole-${EnvironmentSuffix}"
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
                    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
                ],
                "Policies": [
                    {
                        "PolicyName": "ReportGeneratorPolicy",
                        "PolicyDocument": {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "dynamodb:Query",
                                        "dynamodb:Scan",
                                        "dynamodb:GetItem"
                                    ],
                                    "Resource": [
                                        {
                                            "Fn::GetAtt": [
                                                "TurnAroundPromptTable",
                                                "Arn"
                                            ]
                                        },
                                        {
                                            "Fn::Sub": "${TurnAroundPromptTable.Arn}/index/*"
                                        }
                                    ]
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "s3:PutObject",
                                        "s3:PutObjectAcl"
                                    ],
                                    "Resource": {
                                        "Fn::Sub": "${ReportsBucket.Arn}/*"
                                    }
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "ses:SendEmail",
                                        "ses:SendRawEmail"
                                    ],
                                    "Resource": "*"
                                },
                                {
                                    "Effect": "Allow",
                                    "Action": [
                                        "logs:CreateLogGroup",
                                        "logs:CreateLogStream",
                                        "logs:PutLogEvents"
                                    ],
                                    "Resource": {
                                        "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
                                    }
                                },
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
                ],
                "Tags": [
                    {
                        "Key": "iac-rlhf-amazon",
                        "Value": "true"
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
        "FeedbackProcessorFunction": {
            "Type": "AWS::Lambda::Function",
            "Properties": {
                "FunctionName": {
                    "Fn::Sub": "FeedbackProcessor-${EnvironmentSuffix}"
                },
                "Runtime": "python3.10",
                "Handler": "index.lambda_handler",
                "Role": {
                    "Fn::GetAtt": [
                        "FeedbackProcessorRole",
                        "Arn"
                    ]
                },
                "Timeout": 30,
                "MemorySize": 256,
                "Environment": {
                    "Variables": {
                        "TABLE_NAME": {
                            "Ref": "TurnAroundPromptTable"
                        },
                        "ENVIRONMENT": {
                            "Ref": "EnvironmentSuffix"
                        }
                    }
                },
                "Code": {
                    "ZipFile": "import json\nimport boto3\nimport uuid\nimport time\nimport logging\nfrom datetime import datetime\nfrom decimal import Decimal\nimport os\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\n\ndynamodb = boto3.resource('dynamodb')\ncomprehend = boto3.client('comprehend')\ncloudwatch = boto3.client('cloudwatch')\n\nTABLE_NAME = os.environ['TABLE_NAME']\nENVIRONMENT = os.environ['ENVIRONMENT']\n\ndef decimal_default(obj):\n    if isinstance(obj, Decimal):\n        return float(obj)\n    raise TypeError\n\ndef validate_input(body):\n    \"\"\"Validate input data\"\"\"\n    errors = []\n    \n    if not body.get('feedback'):\n        errors.append('Feedback text is required')\n    elif len(body['feedback']) < 10:\n        errors.append('Feedback must be at least 10 characters')\n    elif len(body['feedback']) > 5000:\n        errors.append('Feedback must not exceed 5000 characters')\n    \n    if not body.get('userEmail'):\n        errors.append('User email is required')\n    elif '@' not in body['userEmail']:\n        errors.append('Invalid email format')\n    \n    if not body.get('category'):\n        errors.append('Category is required')\n    elif body['category'] not in ['general', 'bug', 'feature', 'improvement']:\n        errors.append('Invalid category. Must be: general, bug, feature, or improvement')\n    \n    return errors\n\ndef analyze_sentiment(text):\n    \"\"\"Analyze sentiment using AWS Comprehend\"\"\"\n    try:\n        response = comprehend.detect_sentiment(\n            Text=text,\n            LanguageCode='en'\n        )\n        \n        key_phrases_response = comprehend.detect_key_phrases(\n            Text=text,\n            LanguageCode='en'\n        )\n        \n        entities_response = comprehend.detect_entities(\n            Text=text,\n            LanguageCode='en'\n        )\n        \n        return {\n            'sentiment': response['Sentiment'],\n            'sentimentScores': response['SentimentScore'],\n            'keyPhrases': [phrase['Text'] for phrase in key_phrases_response.get('KeyPhrases', [])[:5]],\n            'entities': [{'Text': entity['Text'], 'Type': entity['Type']} \n                       for entity in entities_response.get('Entities', [])[:5]]\n        }\n    except Exception as e:\n        logger.error(f\"Comprehend analysis failed: {str(e)}\")\n        return {\n            'sentiment': 'NEUTRAL',\n            'sentimentScores': {'Positive': 0, 'Negative': 0, 'Neutral': 1, 'Mixed': 0},\n            'keyPhrases': [],\n            'entities': []\n        }\n\ndef send_metrics(sentiment):\n    \"\"\"Send custom metrics to CloudWatch\"\"\"\n    try:\n        cloudwatch.put_metric_data(\n            Namespace=f'FeedbackSystem/{ENVIRONMENT}',\n            MetricData=[\n                {\n                    'MetricName': 'FeedbackSubmissions',\n                    'Value': 1,\n                    'Unit': 'Count',\n                    'Dimensions': [\n                        {\n                            'Name': 'Sentiment',\n                            'Value': sentiment\n                        },\n                        {\n                            'Name': 'Environment',\n                            'Value': ENVIRONMENT\n                        }\n                    ]\n                }\n            ]\n        )\n    except Exception as e:\n        logger.error(f\"Failed to send metrics: {str(e)}\")\n\ndef lambda_handler(event, context):\n    \"\"\"Main Lambda handler for processing feedback\"\"\"\n    try:\n        # Parse request body\n        if isinstance(event.get('body'), str):\n            body = json.loads(event['body'])\n        else:\n            body = event.get('body', {})\n        \n        # Validate input\n        validation_errors = validate_input(body)\n        if validation_errors:\n            return {\n                'statusCode': 400,\n                'headers': {\n                    'Content-Type': 'application/json',\n                    'Access-Control-Allow-Origin': '*'\n                },\n                'body': json.dumps({\n                    'error': 'Validation failed',\n                    'details': validation_errors\n                })\n            }\n        \n        # Analyze sentiment\n        sentiment_data = analyze_sentiment(body['feedback'])\n        \n        # Prepare item for DynamoDB\n        timestamp = int(time.time())\n        date_partition = datetime.utcfromtimestamp(timestamp).strftime('%Y-%m')\n        \n        item = {\n            'id': str(uuid.uuid4()),\n            'timestamp': timestamp,\n            'datePartition': date_partition,\n            'feedback': body['feedback'],\n            'userEmail': body['userEmail'],\n            'category': body['category'],\n            'sentiment': sentiment_data['sentiment'],\n            'sentimentScores': sentiment_data['sentimentScores'],\n            'keyPhrases': sentiment_data['keyPhrases'],\n            'entities': sentiment_data['entities'],\n            'createdAt': datetime.utcnow().isoformat(),\n            'environment': ENVIRONMENT,\n            'rating': body.get('rating', 0),\n            'metadata': body.get('metadata', {})\n        }\n        \n        # Store in DynamoDB\n        table = dynamodb.Table(TABLE_NAME)\n        table.put_item(Item=item)\n        \n        # Send metrics\n        send_metrics(sentiment_data['sentiment'])\n        \n        logger.info(f\"Successfully processed feedback: {item['id']}\")\n        \n        return {\n            'statusCode': 200,\n            'headers': {\n                'Content-Type': 'application/json',\n                'Access-Control-Allow-Origin': '*'\n            },\n            'body': json.dumps({\n                'message': 'Feedback processed successfully',\n                'feedbackId': item['id'],\n                'sentiment': sentiment_data['sentiment']\n            }, default=decimal_default)\n        }\n        \n    except Exception as e:\n        logger.error(f\"Error processing feedback: {str(e)}\")\n        return {\n            'statusCode': 500,\n            'headers': {\n                'Content-Type': 'application/json',\n                'Access-Control-Allow-Origin': '*'\n            },\n            'body': json.dumps({\n                'error': 'Internal server error',\n                'message': 'Failed to process feedback'\n            })\n        }\n"
                },
                "Tags": [
                    {
                        "Key": "iac-rlhf-amazon",
                        "Value": "true"
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
        "ReportGeneratorFunction": {
            "Type": "AWS::Lambda::Function",
            "Properties": {
                "FunctionName": {
                    "Fn::Sub": "ReportGenerator-${EnvironmentSuffix}"
                },
                "Runtime": "python3.10",
                "Handler": "index.lambda_handler",
                "Role": {
                    "Fn::GetAtt": [
                        "ReportGeneratorRole",
                        "Arn"
                    ]
                },
                "Timeout": 60,
                "MemorySize": 512,
                "Environment": {
                    "Variables": {
                        "TABLE_NAME": {
                            "Ref": "TurnAroundPromptTable"
                        },
                        "BUCKET_NAME": {
                            "Ref": "ReportsBucket"
                        },
                        "NOTIFICATION_EMAIL": {
                            "Ref": "NotificationEmail"
                        },
                        "ENVIRONMENT": {
                            "Ref": "EnvironmentSuffix"
                        }
                    }
                },
                "Code": {
                    "ZipFile": "import json\nimport boto3\nimport logging\nimport os\nfrom datetime import datetime, timedelta\nfrom collections import defaultdict\nfrom decimal import Decimal\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\n\ndynamodb = boto3.resource('dynamodb')\ns3 = boto3.client('s3')\nses = boto3.client('ses')\ncloudwatch = boto3.client('cloudwatch')\n\nTABLE_NAME = os.environ['TABLE_NAME']\nBUCKET_NAME = os.environ['BUCKET_NAME']\nNOTIFICATION_EMAIL = os.environ['NOTIFICATION_EMAIL']\nENVIRONMENT = os.environ['ENVIRONMENT']\n\ndef decimal_default(obj):\n    if isinstance(obj, Decimal):\n        return float(obj)\n    raise TypeError\n\ndef query_weekly_feedback():\n    \"\"\"Query feedback from the last 7 days\"\"\"\n    table = dynamodb.Table(TABLE_NAME)\n    \n    # Calculate date range\n    end_date = datetime.utcnow()\n    start_date = end_date - timedelta(days=7)\n    start_timestamp = int(start_date.timestamp())\n    end_timestamp = int(end_date.timestamp())\n    \n    # Get current and previous month partitions\n    partitions = [\n        start_date.strftime('%Y-%m'),\n        end_date.strftime('%Y-%m')\n    ]\n    \n    all_items = []\n    \n    for partition in set(partitions):\n        try:\n            response = table.query(\n                IndexName='DateSentimentIndex',\n                KeyConditionExpression='datePartition = :partition AND #ts BETWEEN :start AND :end',\n                ExpressionAttributeNames={\n                    '#ts': 'timestamp'\n                },\n                ExpressionAttributeValues={\n                    ':partition': partition,\n                    ':start': start_timestamp,\n                    ':end': end_timestamp\n                }\n            )\n            all_items.extend(response.get('Items', []))\n            \n            # Handle pagination\n            while 'LastEvaluatedKey' in response:\n                response = table.query(\n                    IndexName='DateSentimentIndex',\n                    KeyConditionExpression='datePartition = :partition AND #ts BETWEEN :start AND :end',\n                    ExpressionAttributeNames={\n                        '#ts': 'timestamp'\n                    },\n                    ExpressionAttributeValues={\n                        ':partition': partition,\n                        ':start': start_timestamp,\n                        ':end': end_timestamp\n                    },\n                    ExclusiveStartKey=response['LastEvaluatedKey']\n                )\n                all_items.extend(response.get('Items', []))\n        except Exception as e:\n            logger.error(f\"Error querying partition {partition}: {str(e)}\")\n    \n    return all_items\n\ndef generate_report(feedback_items):\n    \"\"\"Generate weekly report from feedback items\"\"\"\n    report = {\n        'reportDate': datetime.utcnow().isoformat(),\n        'environment': ENVIRONMENT,\n        'totalFeedback': len(feedback_items),\n        'dateRange': {\n            'start': (datetime.utcnow() - timedelta(days=7)).isoformat(),\n            'end': datetime.utcnow().isoformat()\n        }\n    }\n    \n    # Analyze sentiments\n    sentiment_counts = defaultdict(int)\n    category_counts = defaultdict(int)\n    sentiment_scores_sum = defaultdict(float)\n    ratings = []\n    key_phrases_all = []\n    \n    for item in feedback_items:\n        sentiment_counts[item.get('sentiment', 'UNKNOWN')] += 1\n        category_counts[item.get('category', 'uncategorized')] += 1\n        \n        if 'rating' in item and item['rating']:\n            ratings.append(float(item['rating']))\n        \n        if 'sentimentScores' in item:\n            for key, value in item['sentimentScores'].items():\n                sentiment_scores_sum[key] += float(value)\n        \n        if 'keyPhrases' in item:\n            key_phrases_all.extend(item['keyPhrases'])\n    \n    # Calculate averages\n    if feedback_items:\n        avg_sentiment_scores = {\n            key: value / len(feedback_items) \n            for key, value in sentiment_scores_sum.items()\n        }\n    else:\n        avg_sentiment_scores = {}\n    \n    # Find top key phrases\n    phrase_counts = defaultdict(int)\n    for phrase in key_phrases_all:\n        phrase_counts[phrase] += 1\n    top_phrases = sorted(phrase_counts.items(), key=lambda x: x[1], reverse=True)[:10]\n    \n    report['sentimentDistribution'] = dict(sentiment_counts)\n    report['categoryDistribution'] = dict(category_counts)\n    report['averageSentimentScores'] = avg_sentiment_scores\n    report['averageRating'] = sum(ratings) / len(ratings) if ratings else 0\n    report['topKeyPhrases'] = [{'phrase': phrase, 'count': count} for phrase, count in top_phrases]\n    \n    # Add sample feedback by sentiment\n    report['samplesBysentiment'] = {}\n    for sentiment in ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED']:\n        samples = [item for item in feedback_items if item.get('sentiment') == sentiment][:2]\n        report['samplesBysentiment'][sentiment] = [\n            {\n                'feedback': sample.get('feedback', ''),\n                'category': sample.get('category', ''),\n                'rating': float(sample.get('rating', 0))\n            }\n            for sample in samples\n        ]\n    \n    return report\n\ndef save_report_to_s3(report):\n    \"\"\"Save report to S3\"\"\"\n    timestamp = datetime.utcnow()\n    file_key = f\"reports/{ENVIRONMENT}/{timestamp.strftime('%Y/%m')}/weekly_report_{timestamp.strftime('%Y%m%d_%H%M%S')}.json\"\n    \n    s3.put_object(\n        Bucket=BUCKET_NAME,\n        Key=file_key,\n        Body=json.dumps(report, indent=2, default=decimal_default),\n        ContentType='application/json',\n        Metadata={\n            'environment': ENVIRONMENT,\n            'report_type': 'weekly',\n            'generated_at': timestamp.isoformat()\n        }\n    )\n    \n    return file_key\n\ndef send_email_notification(report, report_url):\n    \"\"\"Send email notification with report summary\"\"\"\n    subject = f\"Weekly Feedback Report - {ENVIRONMENT} - {datetime.utcnow().strftime('%Y-%m-%d')}\"\n    \n    html_body = f\"\"\"\n    <html>\n    <head></head>\n    <body>\n        <h1>Weekly Feedback Report</h1>\n        <p>Environment: <strong>{ENVIRONMENT}</strong></p>\n        <p>Report Date: <strong>{report['reportDate']}</strong></p>\n        \n        <h2>Summary</h2>\n        <ul>\n            <li>Total Feedback: <strong>{report['totalFeedback']}</strong></li>\n            <li>Average Rating: <strong>{report['averageRating']:.2f}</strong></li>\n        </ul>\n        \n        <h2>Sentiment Distribution</h2>\n        <ul>\n            {\"\".join([f\"<li>{k}: {v}</li>\" for k, v in report.get('sentimentDistribution', {}).items()])}\n        </ul>\n        \n        <h2>Category Distribution</h2>\n        <ul>\n            {\"\".join([f\"<li>{k}: {v}</li>\" for k, v in report.get('categoryDistribution', {}).items()])}\n        </ul>\n        \n        <h2>Top Key Phrases</h2>\n        <ol>\n            {\"\".join([f\"<li>{phrase['phrase']} ({phrase['count']} mentions)</li>\" for phrase in report.get('topKeyPhrases', [])[:5]])}\n        </ol>\n        \n        <p>Full report available at: <a href=\"{report_url}\">{report_url}</a></p>\n    </body>\n    </html>\n    \"\"\"\n    \n    text_body = f\"\"\"\n    Weekly Feedback Report\n    Environment: {ENVIRONMENT}\n    Report Date: {report['reportDate']}\n    \n    Summary:\n    - Total Feedback: {report['totalFeedback']}\n    - Average Rating: {report['averageRating']:.2f}\n    \n    Full report available at: {report_url}\n    \"\"\"\n    \n    try:\n        ses.send_email(\n            Source=NOTIFICATION_EMAIL,\n            Destination={'ToAddresses': [NOTIFICATION_EMAIL]},\n            Message={\n                'Subject': {'Data': subject},\n                'Body': {\n                    'Text': {'Data': text_body},\n                    'Html': {'Data': html_body}\n                }\n            }\n        )\n        logger.info(f\"Email notification sent to {NOTIFICATION_EMAIL}\")\n    except Exception as e:\n        logger.error(f\"Failed to send email: {str(e)}\")\n        # Don't fail the entire function if email fails\n\ndef send_metrics(report):\n    \"\"\"Send report metrics to CloudWatch\"\"\"\n    try:\n        cloudwatch.put_metric_data(\n            Namespace=f'FeedbackSystem/{ENVIRONMENT}',\n            MetricData=[\n                {\n                    'MetricName': 'WeeklyReportGenerated',\n                    'Value': 1,\n                    'Unit': 'Count'\n                },\n                {\n                    'MetricName': 'WeeklyFeedbackCount',\n                    'Value': report['totalFeedback'],\n                    'Unit': 'Count'\n                },\n                {\n                    'MetricName': 'WeeklyAverageRating',\n                    'Value': report['averageRating'],\n                    'Unit': 'None'\n                }\n            ]\n        )\n    except Exception as e:\n        logger.error(f\"Failed to send metrics: {str(e)}\")\n\ndef lambda_handler(event, context):\n    \"\"\"Main Lambda handler for generating reports\"\"\"\n    try:\n        logger.info(\"Starting weekly report generation\")\n        \n        # Query feedback data\n        feedback_items = query_weekly_feedback()\n        logger.info(f\"Found {len(feedback_items)} feedback items\")\n        \n        # Generate report\n        report = generate_report(feedback_items)\n        \n        # Save to S3\n        report_key = save_report_to_s3(report)\n        report_url = f\"https://{BUCKET_NAME}.s3.amazonaws.com/{report_key}\"\n        logger.info(f\"Report saved to S3: {report_key}\")\n        \n        # Send email notification\n        send_email_notification(report, report_url)\n        \n        # Send metrics\n        send_metrics(report)\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': 'Report generated successfully',\n                'reportKey': report_key,\n                'totalFeedback': report['totalFeedback']\n            }, default=decimal_default)\n        }\n        \n    except Exception as e:\n        logger.error(f\"Error generating report: {str(e)}\")\n        return {\n            'statusCode': 500,\n            'body': json.dumps({\n                'error': 'Failed to generate report',\n                'details': str(e)\n            })\n        }\n"
                },
                "Tags": [
                    {
                        "Key": "iac-rlhf-amazon",
                        "Value": "true"
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
        "FeedbackApi": {
            "Type": "AWS::ApiGateway::RestApi",
            "Properties": {
                "Name": {
                    "Fn::Sub": "FeedbackAPI-${EnvironmentSuffix}"
                },
                "Description": "REST API for feedback submission",
                "EndpointConfiguration": {
                    "Types": [
                        "REGIONAL"
                    ]
                },
                "Tags": [
                    {
                        "Key": "iac-rlhf-amazon",
                        "Value": "true"
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
        "ApiRequestValidator": {
            "Type": "AWS::ApiGateway::RequestValidator",
            "Properties": {
                "Name": "RequestBodyValidator",
                "RestApiId": {
                    "Ref": "FeedbackApi"
                },
                "ValidateRequestBody": true,
                "ValidateRequestParameters": false
            }
        },
        "FeedbackModel": {
            "Type": "AWS::ApiGateway::Model",
            "Properties": {
                "ContentType": "application/json",
                "Name": "FeedbackModel",
                "RestApiId": {
                    "Ref": "FeedbackApi"
                },
                "Schema": {
                    "$schema": "http://json-schema.org/draft-04/schema#",
                    "title": "Feedback",
                    "type": "object",
                    "required": [
                        "feedback",
                        "userEmail",
                        "category"
                    ],
                    "properties": {
                        "feedback": {
                            "type": "string",
                            "minLength": 10,
                            "maxLength": 5000
                        },
                        "userEmail": {
                            "type": "string",
                            "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
                        },
                        "category": {
                            "type": "string",
                            "enum": [
                                "general",
                                "bug",
                                "feature",
                                "improvement"
                            ]
                        },
                        "rating": {
                            "type": "number",
                            "minimum": 1,
                            "maximum": 5
                        },
                        "metadata": {
                            "type": "object"
                        }
                    }
                }
            }
        },
        "FeedbackResource": {
            "Type": "AWS::ApiGateway::Resource",
            "Properties": {
                "ParentId": {
                    "Fn::GetAtt": [
                        "FeedbackApi",
                        "RootResourceId"
                    ]
                },
                "PathPart": "feedback",
                "RestApiId": {
                    "Ref": "FeedbackApi"
                }
            }
        },
        "FeedbackMethod": {
            "Type": "AWS::ApiGateway::Method",
            "Properties": {
                "AuthorizationType": "NONE",
                "HttpMethod": "POST",
                "ResourceId": {
                    "Ref": "FeedbackResource"
                },
                "RestApiId": {
                    "Ref": "FeedbackApi"
                },
                "RequestValidatorId": {
                    "Ref": "ApiRequestValidator"
                },
                "RequestModels": {
                    "application/json": {
                        "Ref": "FeedbackModel"
                    }
                },
                "Integration": {
                    "Type": "AWS_PROXY",
                    "IntegrationHttpMethod": "POST",
                    "Uri": {
                        "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${FeedbackProcessorFunction.Arn}/invocations"
                    }
                },
                "MethodResponses": [
                    {
                        "StatusCode": 200,
                        "ResponseModels": {
                            "application/json": "Empty"
                        }
                    },
                    {
                        "StatusCode": 400
                    },
                    {
                        "StatusCode": 500
                    }
                ]
            }
        },
        "ApiGatewayInvokePermission": {
            "Type": "AWS::Lambda::Permission",
            "Properties": {
                "FunctionName": {
                    "Ref": "FeedbackProcessorFunction"
                },
                "Action": "lambda:InvokeFunction",
                "Principal": "apigateway.amazonaws.com",
                "SourceArn": {
                    "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${FeedbackApi}/*/*"
                }
            }
        },
        "ApiDeployment": {
            "Type": "AWS::ApiGateway::Deployment",
            "DependsOn": [
                "FeedbackMethod"
            ],
            "Properties": {
                "RestApiId": {
                    "Ref": "FeedbackApi"
                },
                "StageName": {
                    "Ref": "EnvironmentSuffix"
                }
            }
        },
        "WeeklyReportSchedule": {
            "Type": "AWS::Events::Rule",
            "Properties": {
                "Name": {
                    "Fn::Sub": "WeeklyReportSchedule-${EnvironmentSuffix}"
                },
                "Description": "Trigger weekly report generation every Monday at 9 AM UTC",
                "ScheduleExpression": "cron(0 9 ? * MON *)",
                "State": "ENABLED",
                "Targets": [
                    {
                        "Arn": {
                            "Fn::GetAtt": [
                                "ReportGeneratorFunction",
                                "Arn"
                            ]
                        },
                        "Id": "ReportGeneratorTarget"
                    }
                ]
            }
        },
        "EventBridgeInvokePermission": {
            "Type": "AWS::Lambda::Permission",
            "Properties": {
                "FunctionName": {
                    "Ref": "ReportGeneratorFunction"
                },
                "Action": "lambda:InvokeFunction",
                "Principal": "events.amazonaws.com",
                "SourceArn": {
                    "Fn::GetAtt": [
                        "WeeklyReportSchedule",
                        "Arn"
                    ]
                }
            }
        },
        "FeedbackProcessorErrorAlarm": {
            "Type": "AWS::CloudWatch::Alarm",
            "Properties": {
                "AlarmName": {
                    "Fn::Sub": "FeedbackProcessor-Errors-${EnvironmentSuffix}"
                },
                "AlarmDescription": "Alert when feedback processor Lambda has errors",
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
                            "Ref": "FeedbackProcessorFunction"
                        }
                    }
                ],
                "TreatMissingData": "notBreaching"
            }
        },
        "ReportGeneratorErrorAlarm": {
            "Type": "AWS::CloudWatch::Alarm",
            "Properties": {
                "AlarmName": {
                    "Fn::Sub": "ReportGenerator-Errors-${EnvironmentSuffix}"
                },
                "AlarmDescription": "Alert when report generator Lambda has errors",
                "MetricName": "Errors",
                "Namespace": "AWS/Lambda",
                "Statistic": "Sum",
                "Period": 300,
                "EvaluationPeriods": 1,
                "Threshold": 1,
                "ComparisonOperator": "GreaterThanThreshold",
                "Dimensions": [
                    {
                        "Name": "FunctionName",
                        "Value": {
                            "Ref": "ReportGeneratorFunction"
                        }
                    }
                ],
                "TreatMissingData": "notBreaching"
            }
        },
        "ApiGateway4xxAlarm": {
            "Type": "AWS::CloudWatch::Alarm",
            "Properties": {
                "AlarmName": {
                    "Fn::Sub": "API-4xx-Errors-${EnvironmentSuffix}"
                },
                "AlarmDescription": "Alert when API has high 4xx error rate",
                "MetricName": "4XXError",
                "Namespace": "AWS/ApiGateway",
                "Statistic": "Sum",
                "Period": 300,
                "EvaluationPeriods": 2,
                "Threshold": 10,
                "ComparisonOperator": "GreaterThanThreshold",
                "Dimensions": [
                    {
                        "Name": "ApiName",
                        "Value": {
                            "Fn::Sub": "FeedbackAPI-${EnvironmentSuffix}"
                        }
                    },
                    {
                        "Name": "Stage",
                        "Value": {
                            "Ref": "EnvironmentSuffix"
                        }
                    }
                ],
                "TreatMissingData": "notBreaching"
            }
        },
        "ApiGateway5xxAlarm": {
            "Type": "AWS::CloudWatch::Alarm",
            "Properties": {
                "AlarmName": {
                    "Fn::Sub": "API-5xx-Errors-${EnvironmentSuffix}"
                },
                "AlarmDescription": "Alert when API has 5xx errors",
                "MetricName": "5XXError",
                "Namespace": "AWS/ApiGateway",
                "Statistic": "Sum",
                "Period": 300,
                "EvaluationPeriods": 1,
                "Threshold": 3,
                "ComparisonOperator": "GreaterThanThreshold",
                "Dimensions": [
                    {
                        "Name": "ApiName",
                        "Value": {
                            "Fn::Sub": "FeedbackAPI-${EnvironmentSuffix}"
                        }
                    },
                    {
                        "Name": "Stage",
                        "Value": {
                            "Ref": "EnvironmentSuffix"
                        }
                    }
                ],
                "TreatMissingData": "notBreaching"
            }
        },
        "FeedbackProcessorLogGroup": {
            "Type": "AWS::Logs::LogGroup",
            "Properties": {
                "LogGroupName": {
                    "Fn::Sub": "/aws/lambda/FeedbackProcessor-${EnvironmentSuffix}"
                },
                "RetentionInDays": 7
            }
        },
        "ReportGeneratorLogGroup": {
            "Type": "AWS::Logs::LogGroup",
            "Properties": {
                "LogGroupName": {
                    "Fn::Sub": "/aws/lambda/ReportGenerator-${EnvironmentSuffix}"
                },
                "RetentionInDays": 7
            }
        }
    },
    "Outputs": {
        "TurnAroundPromptTableName": {
            "Description": "Name of the DynamoDB table",
            "Value": {
                "Ref": "TurnAroundPromptTable"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-TurnAroundPromptTableName"
                }
            }
        },
        "TurnAroundPromptTableArn": {
            "Description": "ARN of the DynamoDB table",
            "Value": {
                "Fn::GetAtt": [
                    "TurnAroundPromptTable",
                    "Arn"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-TurnAroundPromptTableArn"
                }
            }
        },
        "ApiEndpoint": {
            "Description": "API Gateway endpoint URL for feedback submission",
            "Value": {
                "Fn::Sub": "https://${FeedbackApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}/feedback"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-ApiEndpoint"
                }
            }
        },
        "ReportsBucketName": {
            "Description": "Name of the S3 bucket for reports",
            "Value": {
                "Ref": "ReportsBucket"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-ReportsBucketName"
                }
            }
        },
        "FeedbackProcessorFunctionArn": {
            "Description": "ARN of the Feedback Processor Lambda function",
            "Value": {
                "Fn::GetAtt": [
                    "FeedbackProcessorFunction",
                    "Arn"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-FeedbackProcessorFunctionArn"
                }
            }
        },
        "ReportGeneratorFunctionArn": {
            "Description": "ARN of the Report Generator Lambda function",
            "Value": {
                "Fn::GetAtt": [
                    "ReportGeneratorFunction",
                    "Arn"
                ]
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-ReportGeneratorFunctionArn"
                }
            }
        },
        "StackName": {
            "Description": "Name of this CloudFormation stack",
            "Value": {
                "Ref": "AWS::StackName"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-StackName"
                }
            }
        },
        "EnvironmentSuffix": {
            "Description": "Environment suffix used for this deployment",
            "Value": {
                "Ref": "EnvironmentSuffix"
            },
            "Export": {
                "Name": {
                    "Fn::Sub": "${AWS::StackName}-EnvironmentSuffix"
                }
            }
        }
    }
}
```

## ./lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'TAP Stack - Task Assignment Platform CloudFormation Template with Complete Feedback System'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Notification Configuration'
        Parameters:
          - NotificationEmail

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'
  
  NotificationEmail:
    Type: String
    Default: 'noreply@example.com'
    Description: 'Email address for weekly report notifications'
    AllowedPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    ConstraintDescription: 'Must be a valid email address'

Resources:
  # Enhanced DynamoDB Table with GSI for feedback data
  TurnAroundPromptTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Delete
    UpdateReplacePolicy: Delete
    Properties:
      TableName: !Sub 'TurnAroundPromptTable${EnvironmentSuffix}'
      AttributeDefinitions:
        - AttributeName: 'id'
          AttributeType: 'S'
        - AttributeName: 'timestamp'
          AttributeType: 'N'
        - AttributeName: 'sentiment'
          AttributeType: 'S'
        - AttributeName: 'datePartition'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'id'
          KeyType: 'HASH'
      BillingMode: PAY_PER_REQUEST
      DeletionProtectionEnabled: false
      GlobalSecondaryIndexes:
        - IndexName: 'DateSentimentIndex'
          KeySchema:
            - AttributeName: 'datePartition'
              KeyType: 'HASH'
            - AttributeName: 'timestamp'
              KeyType: 'RANGE'
          Projection:
            ProjectionType: 'ALL'
        - IndexName: 'SentimentTimestampIndex'
          KeySchema:
            - AttributeName: 'sentiment'
              KeyType: 'HASH'
            - AttributeName: 'timestamp'
              KeyType: 'RANGE'
          Projection:
            ProjectionType: 'ALL'
      StreamSpecification:
        StreamViewType: 'NEW_AND_OLD_IMAGES'
      Tags:
        - Key: 'iac-rlhf-amazon'
          Value: 'true'
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix

  # S3 Bucket for storing weekly reports
  ReportsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'feedback-reports-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'AES256'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: 'Enabled'
      LifecycleConfiguration:
        Rules:
          - Id: 'DeleteOldReports'
            Status: 'Enabled'
            ExpirationInDays: 90
      Tags:
        - Key: 'iac-rlhf-amazon'
          Value: 'true'
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix

  # IAM Role for Feedback Processing Lambda
  FeedbackProcessorRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'FeedbackProcessorRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'lambda.amazonaws.com'
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: 'FeedbackProcessorPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: 'Allow'
                Action:
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:GetItem'
                Resource: !GetAtt TurnAroundPromptTable.Arn
              - Effect: 'Allow'
                Action:
                  - 'comprehend:DetectSentiment'
                  - 'comprehend:DetectKeyPhrases'
                  - 'comprehend:DetectEntities'
                Resource: '*'
              - Effect: 'Allow'
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
              - Effect: 'Allow'
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
      Tags:
        - Key: 'iac-rlhf-amazon'
          Value: 'true'
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix

  # IAM Role for Report Generator Lambda
  ReportGeneratorRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'ReportGeneratorRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: 'Allow'
            Principal:
              Service: 'lambda.amazonaws.com'
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: 'ReportGeneratorPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: 'Allow'
                Action:
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                  - 'dynamodb:GetItem'
                Resource:
                  - !GetAtt TurnAroundPromptTable.Arn
                  - !Sub '${TurnAroundPromptTable.Arn}/index/*'
              - Effect: 'Allow'
                Action:
                  - 's3:PutObject'
                  - 's3:PutObjectAcl'
                Resource: !Sub '${ReportsBucket.Arn}/*'
              - Effect: 'Allow'
                Action:
                  - 'ses:SendEmail'
                  - 'ses:SendRawEmail'
                Resource: '*'
              - Effect: 'Allow'
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
              - Effect: 'Allow'
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
      Tags:
        - Key: 'iac-rlhf-amazon'
          Value: 'true'
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix

  # Lambda Function for Processing Feedback
  FeedbackProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'FeedbackProcessor-${EnvironmentSuffix}'
      Runtime: 'python3.10'
      Handler: 'index.lambda_handler'
      Role: !GetAtt FeedbackProcessorRole.Arn
      Timeout: 30
      MemorySize: 256
      Environment:
        Variables:
          TABLE_NAME: !Ref TurnAroundPromptTable
          ENVIRONMENT: !Ref EnvironmentSuffix
      Code:
        ZipFile: |
          import json
          import boto3
          import uuid
          import time
          import logging
          from datetime import datetime
          from decimal import Decimal
          import os

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          dynamodb = boto3.resource('dynamodb')
          comprehend = boto3.client('comprehend')
          cloudwatch = boto3.client('cloudwatch')

          TABLE_NAME = os.environ['TABLE_NAME']
          ENVIRONMENT = os.environ['ENVIRONMENT']

          def decimal_default(obj):
              if isinstance(obj, Decimal):
                  return float(obj)
              raise TypeError

          def validate_input(body):
              """Validate input data"""
              errors = []
              
              if not body.get('feedback'):
                  errors.append('Feedback text is required')
              elif len(body['feedback']) < 10:
                  errors.append('Feedback must be at least 10 characters')
              elif len(body['feedback']) > 5000:
                  errors.append('Feedback must not exceed 5000 characters')
              
              if not body.get('userEmail'):
                  errors.append('User email is required')
              elif '@' not in body['userEmail']:
                  errors.append('Invalid email format')
              
              if not body.get('category'):
                  errors.append('Category is required')
              elif body['category'] not in ['general', 'bug', 'feature', 'improvement']:
                  errors.append('Invalid category. Must be: general, bug, feature, or improvement')
              
              return errors

          def analyze_sentiment(text):
              """Analyze sentiment using AWS Comprehend"""
              try:
                  response = comprehend.detect_sentiment(
                      Text=text,
                      LanguageCode='en'
                  )
                  
                  key_phrases_response = comprehend.detect_key_phrases(
                      Text=text,
                      LanguageCode='en'
                  )
                  
                  entities_response = comprehend.detect_entities(
                      Text=text,
                      LanguageCode='en'
                  )
                  
                  return {
                      'sentiment': response['Sentiment'],
                      'sentimentScores': response['SentimentScore'],
                      'keyPhrases': [phrase['Text'] for phrase in key_phrases_response.get('KeyPhrases', [])[:5]],
                      'entities': [{'Text': entity['Text'], 'Type': entity['Type']} 
                                 for entity in entities_response.get('Entities', [])[:5]]
                  }
              except Exception as e:
                  logger.error(f"Comprehend analysis failed: {str(e)}")
                  return {
                      'sentiment': 'NEUTRAL',
                      'sentimentScores': {'Positive': 0, 'Negative': 0, 'Neutral': 1, 'Mixed': 0},
                      'keyPhrases': [],
                      'entities': []
                  }

          def send_metrics(sentiment):
              """Send custom metrics to CloudWatch"""
              try:
                  cloudwatch.put_metric_data(
                      Namespace=f'FeedbackSystem/{ENVIRONMENT}',
                      MetricData=[
                          {
                              'MetricName': 'FeedbackSubmissions',
                              'Value': 1,
                              'Unit': 'Count',
                              'Dimensions': [
                                  {
                                      'Name': 'Sentiment',
                                      'Value': sentiment
                                  },
                                  {
                                      'Name': 'Environment',
                                      'Value': ENVIRONMENT
                                  }
                              ]
                          }
                      ]
                  )
              except Exception as e:
                  logger.error(f"Failed to send metrics: {str(e)}")

          def lambda_handler(event, context):
              """Main Lambda handler for processing feedback"""
              try:
                  # Parse request body
                  if isinstance(event.get('body'), str):
                      body = json.loads(event['body'])
                  else:
                      body = event.get('body', {})
                  
                  # Validate input
                  validation_errors = validate_input(body)
                  if validation_errors:
                      return {
                          'statusCode': 400,
                          'headers': {
                              'Content-Type': 'application/json',
                              'Access-Control-Allow-Origin': '*'
                          },
                          'body': json.dumps({
                              'error': 'Validation failed',
                              'details': validation_errors
                          })
                      }
                  
                  # Analyze sentiment
                  sentiment_data = analyze_sentiment(body['feedback'])
                  
                  # Prepare item for DynamoDB
                  timestamp = int(time.time())
                  date_partition = datetime.utcfromtimestamp(timestamp).strftime('%Y-%m')
                  
                  item = {
                      'id': str(uuid.uuid4()),
                      'timestamp': timestamp,
                      'datePartition': date_partition,
                      'feedback': body['feedback'],
                      'userEmail': body['userEmail'],
                      'category': body['category'],
                      'sentiment': sentiment_data['sentiment'],
                      'sentimentScores': sentiment_data['sentimentScores'],
                      'keyPhrases': sentiment_data['keyPhrases'],
                      'entities': sentiment_data['entities'],
                      'createdAt': datetime.utcnow().isoformat(),
                      'environment': ENVIRONMENT,
                      'rating': body.get('rating', 0),
                      'metadata': body.get('metadata', {})
                  }
                  
                  # Store in DynamoDB
                  table = dynamodb.Table(TABLE_NAME)
                  table.put_item(Item=item)
                  
                  # Send metrics
                  send_metrics(sentiment_data['sentiment'])
                  
                  logger.info(f"Successfully processed feedback: {item['id']}")
                  
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'message': 'Feedback processed successfully',
                          'feedbackId': item['id'],
                          'sentiment': sentiment_data['sentiment']
                      }, default=decimal_default)
                  }
                  
              except Exception as e:
                  logger.error(f"Error processing feedback: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json',
                          'Access-Control-Allow-Origin': '*'
                      },
                      'body': json.dumps({
                          'error': 'Internal server error',
                          'message': 'Failed to process feedback'
                      })
                  }
      Tags:
        - Key: 'iac-rlhf-amazon'
          Value: 'true'
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix

  # Lambda Function for Generating Reports
  ReportGeneratorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'ReportGenerator-${EnvironmentSuffix}'
      Runtime: 'python3.10'
      Handler: 'index.lambda_handler'
      Role: !GetAtt ReportGeneratorRole.Arn
      Timeout: 60
      MemorySize: 512
      Environment:
        Variables:
          TABLE_NAME: !Ref TurnAroundPromptTable
          BUCKET_NAME: !Ref ReportsBucket
          NOTIFICATION_EMAIL: !Ref NotificationEmail
          ENVIRONMENT: !Ref EnvironmentSuffix
      Code:
        ZipFile: |
          import json
          import boto3
          import logging
          import os
          from datetime import datetime, timedelta
          from collections import defaultdict
          from decimal import Decimal

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          dynamodb = boto3.resource('dynamodb')
          s3 = boto3.client('s3')
          ses = boto3.client('ses')
          cloudwatch = boto3.client('cloudwatch')

          TABLE_NAME = os.environ['TABLE_NAME']
          BUCKET_NAME = os.environ['BUCKET_NAME']
          NOTIFICATION_EMAIL = os.environ['NOTIFICATION_EMAIL']
          ENVIRONMENT = os.environ['ENVIRONMENT']

          def decimal_default(obj):
              if isinstance(obj, Decimal):
                  return float(obj)
              raise TypeError

          def query_weekly_feedback():
              """Query feedback from the last 7 days"""
              table = dynamodb.Table(TABLE_NAME)
              
              # Calculate date range
              end_date = datetime.utcnow()
              start_date = end_date - timedelta(days=7)
              start_timestamp = int(start_date.timestamp())
              end_timestamp = int(end_date.timestamp())
              
              # Get current and previous month partitions
              partitions = [
                  start_date.strftime('%Y-%m'),
                  end_date.strftime('%Y-%m')
              ]
              
              all_items = []
              
              for partition in set(partitions):
                  try:
                      response = table.query(
                          IndexName='DateSentimentIndex',
                          KeyConditionExpression='datePartition = :partition AND #ts BETWEEN :start AND :end',
                          ExpressionAttributeNames={
                              '#ts': 'timestamp'
                          },
                          ExpressionAttributeValues={
                              ':partition': partition,
                              ':start': start_timestamp,
                              ':end': end_timestamp
                          }
                      )
                      all_items.extend(response.get('Items', []))
                      
                      # Handle pagination
                      while 'LastEvaluatedKey' in response:
                          response = table.query(
                              IndexName='DateSentimentIndex',
                              KeyConditionExpression='datePartition = :partition AND #ts BETWEEN :start AND :end',
                              ExpressionAttributeNames={
                                  '#ts': 'timestamp'
                              },
                              ExpressionAttributeValues={
                                  ':partition': partition,
                                  ':start': start_timestamp,
                                  ':end': end_timestamp
                              },
                              ExclusiveStartKey=response['LastEvaluatedKey']
                          )
                          all_items.extend(response.get('Items', []))
                  except Exception as e:
                      logger.error(f"Error querying partition {partition}: {str(e)}")
              
              return all_items

          def generate_report(feedback_items):
              """Generate weekly report from feedback items"""
              report = {
                  'reportDate': datetime.utcnow().isoformat(),
                  'environment': ENVIRONMENT,
                  'totalFeedback': len(feedback_items),
                  'dateRange': {
                      'start': (datetime.utcnow() - timedelta(days=7)).isoformat(),
                      'end': datetime.utcnow().isoformat()
                  }
              }
              
              # Analyze sentiments
              sentiment_counts = defaultdict(int)
              category_counts = defaultdict(int)
              sentiment_scores_sum = defaultdict(float)
              ratings = []
              key_phrases_all = []
              
              for item in feedback_items:
                  sentiment_counts[item.get('sentiment', 'UNKNOWN')] += 1
                  category_counts[item.get('category', 'uncategorized')] += 1
                  
                  if 'rating' in item and item['rating']:
                      ratings.append(float(item['rating']))
                  
                  if 'sentimentScores' in item:
                      for key, value in item['sentimentScores'].items():
                          sentiment_scores_sum[key] += float(value)
                  
                  if 'keyPhrases' in item:
                      key_phrases_all.extend(item['keyPhrases'])
              
              # Calculate averages
              if feedback_items:
                  avg_sentiment_scores = {
                      key: value / len(feedback_items) 
                      for key, value in sentiment_scores_sum.items()
                  }
              else:
                  avg_sentiment_scores = {}
              
              # Find top key phrases
              phrase_counts = defaultdict(int)
              for phrase in key_phrases_all:
                  phrase_counts[phrase] += 1
              top_phrases = sorted(phrase_counts.items(), key=lambda x: x[1], reverse=True)[:10]
              
              report['sentimentDistribution'] = dict(sentiment_counts)
              report['categoryDistribution'] = dict(category_counts)
              report['averageSentimentScores'] = avg_sentiment_scores
              report['averageRating'] = sum(ratings) / len(ratings) if ratings else 0
              report['topKeyPhrases'] = [{'phrase': phrase, 'count': count} for phrase, count in top_phrases]
              
              # Add sample feedback by sentiment
              report['samplesBysentiment'] = {}
              for sentiment in ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED']:
                  samples = [item for item in feedback_items if item.get('sentiment') == sentiment][:2]
                  report['samplesBysentiment'][sentiment] = [
                      {
                          'feedback': sample.get('feedback', ''),
                          'category': sample.get('category', ''),
                          'rating': float(sample.get('rating', 0))
                      }
                      for sample in samples
                  ]
              
              return report

          def save_report_to_s3(report):
              """Save report to S3"""
              timestamp = datetime.utcnow()
              file_key = f"reports/{ENVIRONMENT}/{timestamp.strftime('%Y/%m')}/weekly_report_{timestamp.strftime('%Y%m%d_%H%M%S')}.json"
              
              s3.put_object(
                  Bucket=BUCKET_NAME,
                  Key=file_key,
                  Body=json.dumps(report, indent=2, default=decimal_default),
                  ContentType='application/json',
                  Metadata={
                      'environment': ENVIRONMENT,
                      'report_type': 'weekly',
                      'generated_at': timestamp.isoformat()
                  }
              )
              
              return file_key

          def send_email_notification(report, report_url):
              """Send email notification with report summary"""
              subject = f"Weekly Feedback Report - {ENVIRONMENT} - {datetime.utcnow().strftime('%Y-%m-%d')}"
              
              html_body = f"""
              <html>
              <head></head>
              <body>
                  <h1>Weekly Feedback Report</h1>
                  <p>Environment: <strong>{ENVIRONMENT}</strong></p>
                  <p>Report Date: <strong>{report['reportDate']}</strong></p>
                  
                  <h2>Summary</h2>
                  <ul>
                      <li>Total Feedback: <strong>{report['totalFeedback']}</strong></li>
                      <li>Average Rating: <strong>{report['averageRating']:.2f}</strong></li>
                  </ul>
                  
                  <h2>Sentiment Distribution</h2>
                  <ul>
                      {"".join([f"<li>{k}: {v}</li>" for k, v in report.get('sentimentDistribution', {}).items()])}
                  </ul>
                  
                  <h2>Category Distribution</h2>
                  <ul>
                      {"".join([f"<li>{k}: {v}</li>" for k, v in report.get('categoryDistribution', {}).items()])}
                  </ul>
                  
                  <h2>Top Key Phrases</h2>
                  <ol>
                      {"".join([f"<li>{phrase['phrase']} ({phrase['count']} mentions)</li>" for phrase in report.get('topKeyPhrases', [])[:5]])}
                  </ol>
                  
                  <p>Full report available at: <a href="{report_url}">{report_url}</a></p>
              </body>
              </html>
              """
              
              text_body = f"""
              Weekly Feedback Report
              Environment: {ENVIRONMENT}
              Report Date: {report['reportDate']}
              
              Summary:
              - Total Feedback: {report['totalFeedback']}
              - Average Rating: {report['averageRating']:.2f}
              
              Full report available at: {report_url}
              """
              
              try:
                  ses.send_email(
                      Source=NOTIFICATION_EMAIL,
                      Destination={'ToAddresses': [NOTIFICATION_EMAIL]},
                      Message={
                          'Subject': {'Data': subject},
                          'Body': {
                              'Text': {'Data': text_body},
                              'Html': {'Data': html_body}
                          }
                      }
                  )
                  logger.info(f"Email notification sent to {NOTIFICATION_EMAIL}")
              except Exception as e:
                  logger.error(f"Failed to send email: {str(e)}")
                  # Don't fail the entire function if email fails

          def send_metrics(report):
              """Send report metrics to CloudWatch"""
              try:
                  cloudwatch.put_metric_data(
                      Namespace=f'FeedbackSystem/{ENVIRONMENT}',
                      MetricData=[
                          {
                              'MetricName': 'WeeklyReportGenerated',
                              'Value': 1,
                              'Unit': 'Count'
                          },
                          {
                              'MetricName': 'WeeklyFeedbackCount',
                              'Value': report['totalFeedback'],
                              'Unit': 'Count'
                          },
                          {
                              'MetricName': 'WeeklyAverageRating',
                              'Value': report['averageRating'],
                              'Unit': 'None'
                          }
                      ]
                  )
              except Exception as e:
                  logger.error(f"Failed to send metrics: {str(e)}")

          def lambda_handler(event, context):
              """Main Lambda handler for generating reports"""
              try:
                  logger.info("Starting weekly report generation")
                  
                  # Query feedback data
                  feedback_items = query_weekly_feedback()
                  logger.info(f"Found {len(feedback_items)} feedback items")
                  
                  # Generate report
                  report = generate_report(feedback_items)
                  
                  # Save to S3
                  report_key = save_report_to_s3(report)
                  report_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{report_key}"
                  logger.info(f"Report saved to S3: {report_key}")
                  
                  # Send email notification
                  send_email_notification(report, report_url)
                  
                  # Send metrics
                  send_metrics(report)
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Report generated successfully',
                          'reportKey': report_key,
                          'totalFeedback': report['totalFeedback']
                      }, default=decimal_default)
                  }
                  
              except Exception as e:
                  logger.error(f"Error generating report: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({
                          'error': 'Failed to generate report',
                          'details': str(e)
                      })
                  }
      Tags:
        - Key: 'iac-rlhf-amazon'
          Value: 'true'
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix

  # API Gateway REST API
  FeedbackApi:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: !Sub 'FeedbackAPI-${EnvironmentSuffix}'
      Description: 'REST API for feedback submission'
      EndpointConfiguration:
        Types:
          - 'REGIONAL'
      Tags:
        - Key: 'iac-rlhf-amazon'
          Value: 'true'
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix

  # API Gateway Request Validator
  ApiRequestValidator:
    Type: AWS::ApiGateway::RequestValidator
    Properties:
      Name: 'RequestBodyValidator'
      RestApiId: !Ref FeedbackApi
      ValidateRequestBody: true
      ValidateRequestParameters: false

  # API Gateway Model for Request Validation
  FeedbackModel:
    Type: AWS::ApiGateway::Model
    Properties:
      ContentType: 'application/json'
      Name: 'FeedbackModel'
      RestApiId: !Ref FeedbackApi
      Schema:
        $schema: 'http://json-schema.org/draft-04/schema#'
        title: 'Feedback'
        type: 'object'
        required:
          - 'feedback'
          - 'userEmail'
          - 'category'
        properties:
          feedback:
            type: 'string'
            minLength: 10
            maxLength: 5000
          userEmail:
            type: 'string'
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
          category:
            type: 'string'
            enum:
              - 'general'
              - 'bug'
              - 'feature'
              - 'improvement'
          rating:
            type: 'number'
            minimum: 1
            maximum: 5
          metadata:
            type: 'object'

  # API Gateway Resource
  FeedbackResource:
    Type: AWS::ApiGateway::Resource
    Properties:
      ParentId: !GetAtt FeedbackApi.RootResourceId
      PathPart: 'feedback'
      RestApiId: !Ref FeedbackApi

  # API Gateway Method
  FeedbackMethod:
    Type: AWS::ApiGateway::Method
    Properties:
      AuthorizationType: 'NONE'
      HttpMethod: 'POST'
      ResourceId: !Ref FeedbackResource
      RestApiId: !Ref FeedbackApi
      RequestValidatorId: !Ref ApiRequestValidator
      RequestModels:
        application/json: !Ref FeedbackModel
      Integration:
        Type: 'AWS_PROXY'
        IntegrationHttpMethod: 'POST'
        Uri: !Sub 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${FeedbackProcessorFunction.Arn}/invocations'
      MethodResponses:
        - StatusCode: 200
          ResponseModels:
            application/json: 'Empty'
        - StatusCode: 400
        - StatusCode: 500

  # Lambda Permission for API Gateway
  ApiGatewayInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref FeedbackProcessorFunction
      Action: 'lambda:InvokeFunction'
      Principal: 'apigateway.amazonaws.com'
      SourceArn: !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${FeedbackApi}/*/*'

  # API Gateway Deployment
  ApiDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - FeedbackMethod
    Properties:
      RestApiId: !Ref FeedbackApi
      StageName: !Ref EnvironmentSuffix

  # EventBridge Rule for Weekly Reports (Every Monday at 9 AM UTC)
  WeeklyReportSchedule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub 'WeeklyReportSchedule-${EnvironmentSuffix}'
      Description: 'Trigger weekly report generation every Monday at 9 AM UTC'
      ScheduleExpression: 'cron(0 9 ? * MON *)'
      State: 'ENABLED'
      Targets:
        - Arn: !GetAtt ReportGeneratorFunction.Arn
          Id: 'ReportGeneratorTarget'

  # Permission for EventBridge to invoke Lambda
  EventBridgeInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref ReportGeneratorFunction
      Action: 'lambda:InvokeFunction'
      Principal: 'events.amazonaws.com'
      SourceArn: !GetAtt WeeklyReportSchedule.Arn

  # CloudWatch Alarms
  FeedbackProcessorErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'FeedbackProcessor-Errors-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when feedback processor Lambda has errors'
      MetricName: 'Errors'
      Namespace: 'AWS/Lambda'
      Statistic: 'Sum'
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: 'GreaterThanThreshold'
      Dimensions:
        - Name: 'FunctionName'
          Value: !Ref FeedbackProcessorFunction
      TreatMissingData: 'notBreaching'

  ReportGeneratorErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ReportGenerator-Errors-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when report generator Lambda has errors'
      MetricName: 'Errors'
      Namespace: 'AWS/Lambda'
      Statistic: 'Sum'
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: 'GreaterThanThreshold'
      Dimensions:
        - Name: 'FunctionName'
          Value: !Ref ReportGeneratorFunction
      TreatMissingData: 'notBreaching'

  ApiGateway4xxAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'API-4xx-Errors-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when API has high 4xx error rate'
      MetricName: '4XXError'
      Namespace: 'AWS/ApiGateway'
      Statistic: 'Sum'
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: 'GreaterThanThreshold'
      Dimensions:
        - Name: 'ApiName'
          Value: !Sub 'FeedbackAPI-${EnvironmentSuffix}'
        - Name: 'Stage'
          Value: !Ref EnvironmentSuffix
      TreatMissingData: 'notBreaching'

  ApiGateway5xxAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'API-5xx-Errors-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when API has 5xx errors'
      MetricName: '5XXError'
      Namespace: 'AWS/ApiGateway'
      Statistic: 'Sum'
      Period: 300
      EvaluationPeriods: 1
      Threshold: 3
      ComparisonOperator: 'GreaterThanThreshold'
      Dimensions:
        - Name: 'ApiName'
          Value: !Sub 'FeedbackAPI-${EnvironmentSuffix}'
        - Name: 'Stage'
          Value: !Ref EnvironmentSuffix
      TreatMissingData: 'notBreaching'

  # CloudWatch Log Groups
  FeedbackProcessorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/FeedbackProcessor-${EnvironmentSuffix}'
      RetentionInDays: 7

  ReportGeneratorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/ReportGenerator-${EnvironmentSuffix}'
      RetentionInDays: 7

Outputs:
  TurnAroundPromptTableName:
    Description: 'Name of the DynamoDB table'
    Value: !Ref TurnAroundPromptTable
    Export:
      Name: !Sub '${AWS::StackName}-TurnAroundPromptTableName'

  TurnAroundPromptTableArn:
    Description: 'ARN of the DynamoDB table'
    Value: !GetAtt TurnAroundPromptTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-TurnAroundPromptTableArn'

  ApiEndpoint:
    Description: 'API Gateway endpoint URL for feedback submission'
    Value: !Sub 'https://${FeedbackApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}/feedback'
    Export:
      Name: !Sub '${AWS::StackName}-ApiEndpoint'

  ReportsBucketName:
    Description: 'Name of the S3 bucket for reports'
    Value: !Ref ReportsBucket
    Export:
      Name: !Sub '${AWS::StackName}-ReportsBucketName'

  FeedbackProcessorFunctionArn:
    Description: 'ARN of the Feedback Processor Lambda function'
    Value: !GetAtt FeedbackProcessorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-FeedbackProcessorFunctionArn'

  ReportGeneratorFunctionArn:
    Description: 'ARN of the Report Generator Lambda function'
    Value: !GetAtt ReportGeneratorFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ReportGeneratorFunctionArn'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'

```

## ./test/tap-stack.int.test.ts

```typescript
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  QueryCommand,
} from '@aws-sdk/client-dynamodb';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  EventBridgeClient,
  ListRulesCommand,
  DescribeRuleCommand,
} from '@aws-sdk/client-eventbridge';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  APIGatewayClient,
  GetRestApisCommand,
  GetResourcesCommand,
  GetMethodCommand,
} from '@aws-sdk/client-api-gateway';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

const dynamoClient = new DynamoDBClient({ region });
const lambdaClient = new LambdaClient({ region });
const s3Client = new S3Client({ region });
const eventBridgeClient = new EventBridgeClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const apiGatewayClient = new APIGatewayClient({ region });

describe('TAP Stack Integration Tests', () => {
  const tableName = outputs.TurnAroundPromptTableName;
  const apiEndpoint = outputs.ApiEndpoint;
  const bucketName = outputs.ReportsBucketName;
  const feedbackProcessorArn = outputs.FeedbackProcessorFunctionArn;
  const reportGeneratorArn = outputs.ReportGeneratorFunctionArn;

  describe('DynamoDB Table', () => {
    test('should exist and be accessible', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(tableName);
    });

    test('should have PAY_PER_REQUEST billing mode', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.BillingModeSummary?.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('should have Global Secondary Indexes', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      expect(response.Table?.GlobalSecondaryIndexes).toBeDefined();
      expect(response.Table?.GlobalSecondaryIndexes?.length).toBeGreaterThan(0);
    });

    test('should have DateSentimentIndex GSI', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      const gsi = response.Table?.GlobalSecondaryIndexes?.find(
        index => index.IndexName === 'DateSentimentIndex'
      );
      expect(gsi).toBeDefined();
      expect(gsi?.IndexStatus).toBe('ACTIVE');
    });

    test('should have SentimentTimestampIndex GSI', async () => {
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamoClient.send(command);

      const gsi = response.Table?.GlobalSecondaryIndexes?.find(
        index => index.IndexName === 'SentimentTimestampIndex'
      );
      expect(gsi).toBeDefined();
      expect(gsi?.IndexStatus).toBe('ACTIVE');
    });

    test('should be able to write and read items', async () => {
      const testId = `test-${Date.now()}`;
      const timestampNum = Date.now();
      const putCommand = new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: testId },
          feedback: { S: 'Integration test feedback' },
          timestamp: { N: timestampNum.toString() },
          sentiment: { S: 'POSITIVE' },
          datePartition: { S: new Date().toISOString().split('T')[0] },
        },
      });

      await dynamoClient.send(putCommand);

      const queryCommand = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'id = :id',
        ExpressionAttributeValues: {
          ':id': { S: testId },
        },
      });

      const result = await dynamoClient.send(queryCommand);
      expect(result.Items).toBeDefined();
      expect(result.Items?.length).toBe(1);
      expect(result.Items?.[0].id.S).toBe(testId);
    }, 30000);
  });

  describe('S3 Bucket', () => {
    test('should exist and be accessible', async () => {
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration?.Rules?.length
      ).toBeGreaterThan(0);
    });

    test('should have public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.PublicAccessBlockConfiguration).toBeDefined();
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(
        true
      );
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(
        true
      );
      expect(
        response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);
    });
  });

  describe('Lambda Functions', () => {
    test('FeedbackProcessor function should exist', async () => {
      const command = new GetFunctionCommand({
        FunctionName: feedbackProcessorArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain(
        'FeedbackProcessor'
      );
    });

    test('FeedbackProcessor should use Python 3.10 runtime', async () => {
      const command = new GetFunctionCommand({
        FunctionName: feedbackProcessorArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Runtime).toBe('python3.10');
    });

    test('FeedbackProcessor should have required environment variables', async () => {
      const command = new GetFunctionCommand({
        FunctionName: feedbackProcessorArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.TABLE_NAME
      ).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.ENVIRONMENT
      ).toBeDefined();
    });

    test('ReportGenerator function should exist', async () => {
      const command = new GetFunctionCommand({
        FunctionName: reportGeneratorArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain('ReportGenerator');
    });

    test('ReportGenerator should use Python 3.10 runtime', async () => {
      const command = new GetFunctionCommand({
        FunctionName: reportGeneratorArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Runtime).toBe('python3.10');
    });

    test('ReportGenerator should have required environment variables', async () => {
      const command = new GetFunctionCommand({
        FunctionName: reportGeneratorArn,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.TABLE_NAME
      ).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.BUCKET_NAME
      ).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.NOTIFICATION_EMAIL
      ).toBeDefined();
      expect(
        response.Configuration?.Environment?.Variables?.ENVIRONMENT
      ).toBeDefined();
    });
  });

  describe('API Gateway', () => {
    test('should have feedback endpoint configured', () => {
      expect(apiEndpoint).toBeDefined();
      expect(apiEndpoint).toContain('execute-api');
      expect(apiEndpoint).toContain(region);
      expect(apiEndpoint).toContain('/feedback');
    });

    test('endpoint URL should contain environment suffix', () => {
      expect(apiEndpoint).toContain(environmentSuffix);
    });
  });

  describe('EventBridge Rules', () => {
    test('should have WeeklyReportSchedule rule', async () => {
      const listCommand = new ListRulesCommand({
        NamePrefix: `WeeklyReportSchedule-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(listCommand);

      expect(response.Rules).toBeDefined();
      expect(response.Rules?.length).toBeGreaterThan(0);
    });

    test('WeeklyReportSchedule should be enabled', async () => {
      const command = new DescribeRuleCommand({
        Name: `WeeklyReportSchedule-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(command);

      expect(response.State).toBe('ENABLED');
      expect(response.ScheduleExpression).toContain('cron');
    });

    test('WeeklyReportSchedule should have lambda target', async () => {
      const command = new DescribeRuleCommand({
        Name: `WeeklyReportSchedule-${environmentSuffix}`,
      });
      const response = await eventBridgeClient.send(command);

      expect(response.Arn).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have FeedbackProcessor error alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `FeedbackProcessor-Errors-${environmentSuffix}`,
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);
    });

    test('should have ReportGenerator error alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `ReportGenerator-Errors-${environmentSuffix}`,
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);
    });

    test('should have API Gateway 4xx alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `API-4xx-Errors-${environmentSuffix}`,
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);
    });

    test('should have API Gateway 5xx alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `API-5xx-Errors-${environmentSuffix}`,
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms?.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have FeedbackProcessor log group', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/FeedbackProcessor-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
    });

    test('FeedbackProcessor log group should have retention policy', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/FeedbackProcessor-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups?.[0]?.retentionInDays).toBeDefined();
      expect(response.logGroups?.[0]?.retentionInDays).toBeGreaterThan(0);
    });

    test('should have ReportGenerator log group', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/ReportGenerator-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
    });

    test('ReportGenerator log group should have retention policy', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/ReportGenerator-${environmentSuffix}`,
      });
      const response = await logsClient.send(command);

      expect(response.logGroups?.[0]?.retentionInDays).toBeDefined();
      expect(response.logGroups?.[0]?.retentionInDays).toBeGreaterThan(0);
    });
  });

  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      expect(outputs.TurnAroundPromptTableName).toBeDefined();
      expect(outputs.TurnAroundPromptTableArn).toBeDefined();
      expect(outputs.ApiEndpoint).toBeDefined();
      expect(outputs.ReportsBucketName).toBeDefined();
      expect(outputs.FeedbackProcessorFunctionArn).toBeDefined();
      expect(outputs.ReportGeneratorFunctionArn).toBeDefined();
      expect(outputs.StackName).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBeDefined();
    });

    test('outputs should contain correct environment suffix', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });

    test('resource names should follow naming convention', () => {
      expect(outputs.TurnAroundPromptTableName).toContain(environmentSuffix);
      expect(outputs.ReportsBucketName).toContain(environmentSuffix);
    });
  });

  describe('Integration Tests', () => {
    test('should be able to query DynamoDB using GSI', async () => {
      const datePartition = new Date().toISOString().split('T')[0];

      const command = new QueryCommand({
        TableName: tableName,
        IndexName: 'DateSentimentIndex',
        KeyConditionExpression: 'datePartition = :dp',
        ExpressionAttributeValues: {
          ':dp': { S: datePartition },
        },
        Limit: 5,
      });

      const result = await dynamoClient.send(command);
      expect(result).toBeDefined();
    }, 30000);
  });
});

```

## ./test/tap-stack.unit.test.ts

```typescript
import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('TAP Stack');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
    });

    test('NotificationEmail parameter should have correct properties', () => {
      const emailParam = template.Parameters.NotificationEmail;
      expect(emailParam.Type).toBe('String');
      expect(emailParam.Default).toBe('noreply@example.com');
      expect(emailParam.AllowedPattern).toBeDefined();
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
    });

    test('TurnAroundPromptTable should be a DynamoDB table', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TurnAroundPromptTable should have correct billing mode', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('TurnAroundPromptTable should have Global Secondary Indexes', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.GlobalSecondaryIndexes).toBeDefined();
      expect(Array.isArray(table.Properties.GlobalSecondaryIndexes)).toBe(true);
      expect(table.Properties.GlobalSecondaryIndexes.length).toBeGreaterThan(0);
    });

    test('TurnAroundPromptTable should have DateSentimentIndex GSI', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const gsi = table.Properties.GlobalSecondaryIndexes.find(
        (g: any) => g.IndexName === 'DateSentimentIndex'
      );
      expect(gsi).toBeDefined();
    });

    test('TurnAroundPromptTable should have SentimentTimestampIndex GSI', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const gsi = table.Properties.GlobalSecondaryIndexes.find(
        (g: any) => g.IndexName === 'SentimentTimestampIndex'
      );
      expect(gsi).toBeDefined();
    });

    test('TurnAroundPromptTable should have proper tags', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.Tags).toBeDefined();
      const envTag = table.Properties.Tags.find(
        (t: any) => t.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
    });
  });

  describe('S3 Resources', () => {
    test('should have ReportsBucket resource', () => {
      expect(template.Resources.ReportsBucket).toBeDefined();
    });

    test('ReportsBucket should be an S3 bucket', () => {
      const bucket = template.Resources.ReportsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ReportsBucket should have encryption enabled', () => {
      const bucket = template.Resources.ReportsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('ReportsBucket should have public access blocked', () => {
      const bucket = template.Resources.ReportsBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy
      ).toBe(true);
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls
      ).toBe(true);
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets
      ).toBe(true);
    });

    test('ReportsBucket should have lifecycle policy', () => {
      const bucket = template.Resources.ReportsBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('should have FeedbackProcessorRole resource', () => {
      expect(template.Resources.FeedbackProcessorRole).toBeDefined();
    });

    test('FeedbackProcessorRole should be an IAM role', () => {
      const role = template.Resources.FeedbackProcessorRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('FeedbackProcessorRole should have AssumeRolePolicyDocument', () => {
      const role = template.Resources.FeedbackProcessorRole;
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
    });

    test('FeedbackProcessorRole should have managed policies', () => {
      const role = template.Resources.FeedbackProcessorRole;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(Array.isArray(role.Properties.ManagedPolicyArns)).toBe(true);
    });

    test('should have ReportGeneratorRole resource', () => {
      expect(template.Resources.ReportGeneratorRole).toBeDefined();
    });

    test('ReportGeneratorRole should be an IAM role', () => {
      const role = template.Resources.ReportGeneratorRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Lambda Resources', () => {
    test('should have FeedbackProcessorFunction resource', () => {
      expect(template.Resources.FeedbackProcessorFunction).toBeDefined();
    });

    test('FeedbackProcessorFunction should be a Lambda function', () => {
      const lambda = template.Resources.FeedbackProcessorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('FeedbackProcessorFunction should use Python 3.10 runtime', () => {
      const lambda = template.Resources.FeedbackProcessorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.10');
    });

    test('FeedbackProcessorFunction should have environment variables', () => {
      const lambda = template.Resources.FeedbackProcessorFunction;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
      expect(lambda.Properties.Environment.Variables.TABLE_NAME).toBeDefined();
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT).toBeDefined();
    });

    test('FeedbackProcessorFunction should have proper timeout and memory', () => {
      const lambda = template.Resources.FeedbackProcessorFunction;
      expect(lambda.Properties.Timeout).toBeDefined();
      expect(lambda.Properties.MemorySize).toBeDefined();
      expect(lambda.Properties.Timeout).toBeGreaterThanOrEqual(30);
      expect(lambda.Properties.MemorySize).toBeGreaterThanOrEqual(128);
    });

    test('should have ReportGeneratorFunction resource', () => {
      expect(template.Resources.ReportGeneratorFunction).toBeDefined();
    });

    test('ReportGeneratorFunction should be a Lambda function', () => {
      const lambda = template.Resources.ReportGeneratorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('ReportGeneratorFunction should use Python 3.10 runtime', () => {
      const lambda = template.Resources.ReportGeneratorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.10');
    });

    test('ReportGeneratorFunction should have all required environment variables', () => {
      const lambda = template.Resources.ReportGeneratorFunction;
      expect(lambda.Properties.Environment.Variables.TABLE_NAME).toBeDefined();
      expect(lambda.Properties.Environment.Variables.BUCKET_NAME).toBeDefined();
      expect(
        lambda.Properties.Environment.Variables.NOTIFICATION_EMAIL
      ).toBeDefined();
      expect(lambda.Properties.Environment.Variables.ENVIRONMENT).toBeDefined();
    });
  });

  describe('API Gateway Resources', () => {
    test('should have FeedbackApi resource', () => {
      expect(template.Resources.FeedbackApi).toBeDefined();
    });

    test('FeedbackApi should be a REST API', () => {
      const api = template.Resources.FeedbackApi;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have FeedbackResource', () => {
      expect(template.Resources.FeedbackResource).toBeDefined();
    });

    test('should have FeedbackMethod', () => {
      expect(template.Resources.FeedbackMethod).toBeDefined();
    });

    test('FeedbackMethod should be a POST method', () => {
      const method = template.Resources.FeedbackMethod;
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('POST');
    });

    test('should have ApiRequestValidator', () => {
      expect(template.Resources.ApiRequestValidator).toBeDefined();
    });

    test('should have FeedbackModel for request validation', () => {
      expect(template.Resources.FeedbackModel).toBeDefined();
    });

    test('should have ApiDeployment', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
    });

    test('should have Lambda permission for API Gateway', () => {
      expect(template.Resources.ApiGatewayInvokePermission).toBeDefined();
      const permission = template.Resources.ApiGatewayInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
    });
  });

  describe('EventBridge Resources', () => {
    test('should have WeeklyReportSchedule resource', () => {
      expect(template.Resources.WeeklyReportSchedule).toBeDefined();
    });

    test('WeeklyReportSchedule should be an Events Rule', () => {
      const rule = template.Resources.WeeklyReportSchedule;
      expect(rule.Type).toBe('AWS::Events::Rule');
    });

    test('WeeklyReportSchedule should have cron expression', () => {
      const rule = template.Resources.WeeklyReportSchedule;
      expect(rule.Properties.ScheduleExpression).toBeDefined();
      expect(rule.Properties.ScheduleExpression).toContain('cron');
    });

    test('WeeklyReportSchedule should be enabled', () => {
      const rule = template.Resources.WeeklyReportSchedule;
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('should have EventBridgeInvokePermission', () => {
      expect(template.Resources.EventBridgeInvokePermission).toBeDefined();
      const permission = template.Resources.EventBridgeInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have FeedbackProcessorErrorAlarm', () => {
      expect(template.Resources.FeedbackProcessorErrorAlarm).toBeDefined();
    });

    test('FeedbackProcessorErrorAlarm should be a CloudWatch Alarm', () => {
      const alarm = template.Resources.FeedbackProcessorErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have ReportGeneratorErrorAlarm', () => {
      expect(template.Resources.ReportGeneratorErrorAlarm).toBeDefined();
    });

    test('should have ApiGateway4xxAlarm', () => {
      expect(template.Resources.ApiGateway4xxAlarm).toBeDefined();
    });

    test('should have ApiGateway5xxAlarm', () => {
      expect(template.Resources.ApiGateway5xxAlarm).toBeDefined();
    });

    test('should have FeedbackProcessorLogGroup', () => {
      expect(template.Resources.FeedbackProcessorLogGroup).toBeDefined();
    });

    test('FeedbackProcessorLogGroup should have retention policy', () => {
      const logGroup = template.Resources.FeedbackProcessorLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBeGreaterThan(0);
    });

    test('should have ReportGeneratorLogGroup', () => {
      expect(template.Resources.ReportGeneratorLogGroup).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'ApiEndpoint',
        'ReportsBucketName',
        'FeedbackProcessorFunctionArn',
        'ReportGeneratorFunctionArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('TurnAroundPromptTableName output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toBeDefined();
    });

    test('ApiEndpoint output should be correct', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toContain('API Gateway');
      expect(output.Value).toBeDefined();
    });

    test('ReportsBucketName output should be correct', () => {
      const output = template.Outputs.ReportsBucketName;
      expect(output.Description).toContain('S3 bucket');
      expect(output.Value).toBeDefined();
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have proper number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10);
    });

    test('should have proper number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have proper number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  describe('Resource Naming Convention', () => {
    test('DynamoDB table name should follow naming convention with environment suffix', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const tableName = table.Properties.TableName;
      expect(tableName).toBeDefined();
    });

    test('Lambda functions should have environment suffix in name', () => {
      const feedbackLambda = template.Resources.FeedbackProcessorFunction;
      const reportLambda = template.Resources.ReportGeneratorFunction;
      expect(feedbackLambda.Properties.FunctionName).toBeDefined();
      expect(reportLambda.Properties.FunctionName).toBeDefined();
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Security Configuration', () => {
    test('S3 bucket should have server-side encryption', () => {
      const bucket = template.Resources.ReportsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
      ).toBeDefined();
    });

    test('IAM roles should follow least privilege principle', () => {
      const feedbackRole = template.Resources.FeedbackProcessorRole;
      const reportRole = template.Resources.ReportGeneratorRole;
      expect(feedbackRole.Properties.Policies).toBeDefined();
      expect(reportRole.Properties.Policies).toBeDefined();
    });

    test('Lambda functions should have appropriate IAM roles', () => {
      const feedbackLambda = template.Resources.FeedbackProcessorFunction;
      const reportLambda = template.Resources.ReportGeneratorFunction;
      expect(feedbackLambda.Properties.Role).toBeDefined();
      expect(reportLambda.Properties.Role).toBeDefined();
    });
  });

  describe('Monitoring and Alarms', () => {
    test('should have error monitoring for Lambda functions', () => {
      expect(template.Resources.FeedbackProcessorErrorAlarm).toBeDefined();
      expect(template.Resources.ReportGeneratorErrorAlarm).toBeDefined();
    });

    test('should have API Gateway monitoring', () => {
      expect(template.Resources.ApiGateway4xxAlarm).toBeDefined();
      expect(template.Resources.ApiGateway5xxAlarm).toBeDefined();
    });

    test('alarms should have proper thresholds', () => {
      const feedbackAlarm = template.Resources.FeedbackProcessorErrorAlarm;
      const reportAlarm = template.Resources.ReportGeneratorErrorAlarm;
      expect(feedbackAlarm.Properties.Threshold).toBeDefined();
      expect(reportAlarm.Properties.Threshold).toBeDefined();
    });
  });

  describe('Integration Points', () => {
    test('Lambda should be integrated with DynamoDB', () => {
      const feedbackLambda = template.Resources.FeedbackProcessorFunction;
      expect(
        feedbackLambda.Properties.Environment.Variables.TABLE_NAME
      ).toBeDefined();
    });

    test('Lambda should be integrated with S3', () => {
      const reportLambda = template.Resources.ReportGeneratorFunction;
      expect(
        reportLambda.Properties.Environment.Variables.BUCKET_NAME
      ).toBeDefined();
    });

    test('API Gateway should be integrated with Lambda', () => {
      const method = template.Resources.FeedbackMethod;
      expect(method.Properties.Integration).toBeDefined();
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
    });

    test('EventBridge should trigger Lambda', () => {
      const rule = template.Resources.WeeklyReportSchedule;
      expect(rule.Properties.Targets).toBeDefined();
      expect(Array.isArray(rule.Properties.Targets)).toBe(true);
      expect(rule.Properties.Targets.length).toBeGreaterThan(0);
    });
  });
});

```
