import json
import os
import boto3
import logging
from datetime import datetime
import uuid
from decimal import Decimal

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
comprehend = boto3.client('comprehend')
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-west-2')
s3 = boto3.client('s3')

# Environment variables
BUGS_TABLE_NAME = os.environ['BUGS_TABLE_NAME']
ATTACHMENTS_BUCKET = os.environ['ATTACHMENTS_BUCKET']
AWS_REGION_NAME = os.environ.get('AWS_REGION_NAME', 'us-west-1')
BEDROCK_REGION = os.environ.get('BEDROCK_REGION', 'us-west-2')

bugs_table = dynamodb.Table(BUGS_TABLE_NAME)


def lambda_handler(event, context):
    """
    Process incoming bug reports and classify severity using AWS Comprehend
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        http_method = event.get('httpMethod', '')
        path = event.get('path', '')

        if http_method == 'POST' and path == '/bugs':
            return handle_create_bug(event)
        elif http_method == 'GET' and path == '/bugs':
            return handle_list_bugs(event)
        elif http_method == 'GET' and '/bugs/' in path:
            return handle_get_bug(event)
        elif http_method == 'PUT' and '/bugs/' in path:
            return handle_update_bug(event)
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Unsupported operation'})
            }

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error', 'message': str(e)})
        }


def handle_create_bug(event):
    """Create a new bug report with AI-powered analysis"""
    try:
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        if not body.get('title') or not body.get('description'):
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Title and description are required'})
            }

        bug_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()

        # Use Comprehend Targeted Sentiment to analyze the bug report
        description = body['description']
        priority = classify_bug_severity(description)

        # Use Bedrock to perform AI-powered bug analysis
        ai_analysis = analyze_bug_with_bedrock(body['title'], description)

        # Create bug item
        bug_item = {
            'bugId': bug_id,
            'timestamp': timestamp,
            'title': body['title'],
            'description': description,
            'priority': priority,
            'status': 'new',
            'reporter': body.get('reporter', 'unknown'),
            'tags': body.get('tags', []),
            'createdAt': timestamp,
            'updatedAt': timestamp,
            'aiAnalysis': ai_analysis
        }

        # Store in DynamoDB
        bugs_table.put_item(Item=bug_item)

        logger.info(f"Created bug {bug_id} with priority {priority}")

        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'bugId': bug_id,
                'priority': priority,
                'status': 'new',
                'aiAnalysis': ai_analysis,
                'message': 'Bug report created successfully'
            })
        }

    except Exception as e:
        logger.error(f"Error creating bug: {str(e)}", exc_info=True)
        raise


def handle_list_bugs(event):
    """List all bugs with optional filtering"""
    try:
        query_params = event.get('queryStringParameters') or {}
        priority = query_params.get('priority')
        status = query_params.get('status')

        if priority:
            # Query using PriorityIndex
            response = bugs_table.query(
                IndexName='PriorityIndex',
                KeyConditionExpression='priority = :priority',
                ExpressionAttributeValues={':priority': priority},
                Limit=100
            )
        elif status:
            # Query using StatusIndex
            response = bugs_table.query(
                IndexName='StatusIndex',
                KeyConditionExpression='#status = :status',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': status},
                Limit=100
            )
        else:
            # Scan for all bugs (limited)
            response = bugs_table.scan(Limit=100)

        items = response.get('Items', [])

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'bugs': items,
                'count': len(items)
            }, default=decimal_default)
        }

    except Exception as e:
        logger.error(f"Error listing bugs: {str(e)}", exc_info=True)
        raise


def handle_get_bug(event):
    """Get a specific bug by ID"""
    try:
        bug_id = event['pathParameters']['bugId']

        # Query for bug
        response = bugs_table.query(
            KeyConditionExpression='bugId = :bugId',
            ExpressionAttributeValues={':bugId': bug_id},
            Limit=1
        )

        items = response.get('Items', [])

        if not items:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Bug not found'})
            }

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(items[0], default=decimal_default)
        }

    except Exception as e:
        logger.error(f"Error getting bug: {str(e)}", exc_info=True)
        raise


def handle_update_bug(event):
    """Update an existing bug"""
    try:
        bug_id = event['pathParameters']['bugId']
        body = json.loads(event.get('body', '{}'))

        # First, get the existing bug to get its timestamp
        response = bugs_table.query(
            KeyConditionExpression='bugId = :bugId',
            ExpressionAttributeValues={':bugId': bug_id},
            Limit=1
        )

        items = response.get('Items', [])

        if not items:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Bug not found'})
            }

        existing_bug = items[0]
        timestamp = existing_bug['timestamp']

        # Update fields
        update_expression = 'SET updatedAt = :updatedAt'
        expression_values = {':updatedAt': datetime.utcnow().isoformat()}

        if 'status' in body:
            update_expression += ', #status = :status'
            expression_values[':status'] = body['status']

        if 'assignedTo' in body:
            update_expression += ', assignedTo = :assignedTo'
            expression_values[':assignedTo'] = body['assignedTo']

        # Update the bug
        update_params = {
            'Key': {'bugId': bug_id, 'timestamp': timestamp},
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_values,
            'ReturnValues': 'ALL_NEW'
        }

        if '#status' in update_expression:
            update_params['ExpressionAttributeNames'] = {'#status': 'status'}

        response = bugs_table.update_item(**update_params)

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'bug': response['Attributes'],
                'message': 'Bug updated successfully'
            }, default=decimal_default)
        }

    except Exception as e:
        logger.error(f"Error updating bug: {str(e)}", exc_info=True)
        raise


def classify_bug_severity(description):
    """
    Use AWS Comprehend Targeted Sentiment to classify bug severity
    """
    try:
        # Use Targeted Sentiment to analyze sentiment towards specific entities
        response = comprehend.detect_targeted_sentiment(
            Text=description[:5000],  # Comprehend has a 5000 byte limit
            LanguageCode='en'
        )

        entities = response.get('Entities', [])

        # Calculate average sentiment score
        negative_count = 0
        total_mentions = 0

        for entity in entities:
            mentions = entity.get('Mentions', [])
            for mention in mentions:
                sentiment_score = mention.get('MentionSentiment', {})
                total_mentions += 1

                # Check if sentiment is negative
                if sentiment_score.get('Sentiment') == 'NEGATIVE':
                    negative_count += 1

        # Determine priority based on negative sentiment
        if total_mentions > 0:
            negative_ratio = negative_count / total_mentions

            if negative_ratio >= 0.6:
                return 'high'
            elif negative_ratio >= 0.3:
                return 'medium'
            else:
                return 'low'

        # Fallback: use general sentiment analysis
        sentiment_response = comprehend.detect_sentiment(
            Text=description[:5000],
            LanguageCode='en'
        )

        sentiment = sentiment_response.get('Sentiment')

        if sentiment == 'NEGATIVE':
            return 'high'
        elif sentiment == 'MIXED':
            return 'medium'
        else:
            return 'low'

    except Exception as e:
        logger.warning(f"Error classifying severity with Comprehend: {str(e)}")
        # Default to medium priority if classification fails
        return 'medium'


def analyze_bug_with_bedrock(title, description):
    """
    Use Amazon Bedrock to perform AI-powered bug analysis
    """
    try:
        prompt = f"""Analyze this bug report and provide the following information:

Bug Title: {title}
Bug Description: {description}

Please provide:
1. Bug Category (choose one: UI, Backend, Database, Security, Network, Performance, Integration, Other)
2. Potential Root Causes (list 2-3 likely causes)
3. Key Technical Entities (extract technical terms, APIs, services, components mentioned)
4. Suggested Investigation Steps (list 2-3 specific steps)

Format your response as JSON with these fields: category, rootCauses (array), technicalEntities (array), investigationSteps (array)."""

        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,
        }

        response = bedrock_runtime.invoke_model(
            modelId='anthropic.claude-3-haiku-20240307-v1:0',
            body=json.dumps(request_body)
        )

        response_body = json.loads(response['body'].read())
        ai_response = response_body['content'][0]['text']

        # Try to parse JSON response
        try:
            # Find JSON content between curly braces
            start_idx = ai_response.find('{')
            end_idx = ai_response.rfind('}') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = ai_response[start_idx:end_idx]
                analysis = json.loads(json_str)
            else:
                # Fallback if JSON parsing fails
                analysis = {
                    'category': 'Other',
                    'rootCauses': ['Unable to determine - see raw analysis'],
                    'technicalEntities': [],
                    'investigationSteps': ['Review the bug description', 'Check logs', 'Reproduce the issue'],
                    'rawAnalysis': ai_response
                }
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            analysis = {
                'category': 'Other',
                'rootCauses': ['Unable to determine - see raw analysis'],
                'technicalEntities': [],
                'investigationSteps': ['Review the bug description', 'Check logs', 'Reproduce the issue'],
                'rawAnalysis': ai_response
            }

        logger.info(f"Bedrock analysis completed: {analysis.get('category', 'Unknown')}")
        return analysis

    except Exception as e:
        logger.warning(f"Error analyzing bug with Bedrock: {str(e)}")
        # Return default analysis if Bedrock fails
        return {
            'category': 'Other',
            'rootCauses': ['Analysis unavailable'],
            'technicalEntities': [],
            'investigationSteps': ['Manual investigation required'],
            'error': str(e)
        }


def decimal_default(obj):
    """JSON serializer for Decimal objects"""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError
