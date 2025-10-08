import json
import boto3
import os
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
sagemaker_runtime = boto3.client('sagemaker-runtime')

table_name = os.environ['TABLE_NAME']
bucket_name = os.environ['BUCKET_NAME']
endpoint_name = os.environ['ENDPOINT_NAME']

table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    print(f"Starting batch processing at {datetime.utcnow().isoformat()}")

    processed_users = 0
    recommendations_generated = 0

    try:
        # Scan DynamoDB for active users (last interaction within 30 days)
        cutoff_date = (datetime.utcnow() - timedelta(days=30)).isoformat()

        response = table.scan(
            FilterExpression='lastInteraction > :cutoff',
            ExpressionAttributeValues={
                ':cutoff': cutoff_date
            }
        )

        users = response.get('Items', [])

        # Process users in batches
        for user in users:
            user_id = user['userId']

            # Generate recommendations using SageMaker endpoint
            try:
                inference_response = sagemaker_runtime.invoke_endpoint(
                    EndpointName=endpoint_name,
                    ContentType='application/json',
                    Body=json.dumps({
                        'userId': user_id,
                        'interactionCount': user.get('interactionCount', 0),
                        'lastItemId': user.get('lastItemId', '')
                    })
                )

                recommendations = json.loads(inference_response['Body'].read().decode())

                # Update user profile with recommendations
                table.update_item(
                    Key={'userId': user_id},
                    UpdateExpression='SET recommendations = :recs, lastUpdated = :timestamp',
                    ExpressionAttributeValues={
                        ':recs': recommendations,
                        ':timestamp': datetime.utcnow().isoformat()
                    }
                )

                recommendations_generated += 1

            except Exception as e:
                print(f"Error generating recommendations for user {user_id}: {str(e)}")

            processed_users += 1

        # Store batch processing results in S3
        result = {
            'timestamp': datetime.utcnow().isoformat(),
            'processedUsers': processed_users,
            'recommendationsGenerated': recommendations_generated
        }

        s3.put_object(
            Bucket=bucket_name,
            Key=f"batch-results/{datetime.utcnow().strftime('%Y-%m-%d')}/results.json",
            Body=json.dumps(result)
        )

        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }

    except Exception as e:
        print(f"Batch processing error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
