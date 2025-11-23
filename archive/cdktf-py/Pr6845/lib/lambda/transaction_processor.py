import json
import os

def handler(event, context):
    '''Process transactions from SQS queue'''
    print(f"Processing {len(event.get('Records', []))} transactions")
    
    results = []
    for record in event.get('Records', []):
        body = json.loads(record['body'])
        transaction_id = body.get('transaction_id', 'unknown')
        
        # In production, this would:
        # 1. Write to Aurora database
        # 2. Update DynamoDB session state
        # 3. Write logs to S3
        
        results.append({
            'transaction_id': transaction_id,
            'status': 'processed',
            'region': os.environ.get('AWS_REGION', 'unknown')
        })
    
    return {
        'statusCode': 200,
        'body': json.dumps({'processed': len(results), 'results': results})
    }
