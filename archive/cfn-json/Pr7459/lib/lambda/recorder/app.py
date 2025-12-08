import json
import os
import boto3
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Records trade to DynamoDB for compliance
    """
    try:
        # Extract parallel results
        parallel_results = event.get('parallelResults', [])
        
        validation_result = parallel_results[0] if len(parallel_results) > 0 else {}
        enrichment_result = parallel_results[1] if len(parallel_results) > 1 else {}
        
        # Extract enriched trade data
        trade_data = enrichment_result.get('Payload', {}).get('body', {})
        
        # Record to DynamoDB
        item = {
            'tradeId': trade_data.get('tradeId', 'unknown'),
            'timestamp': int(datetime.utcnow().timestamp()),
            'sourceSystem': trade_data.get('sourceSystem', 'unknown'),
            'amount': Decimal(str(trade_data.get('amount', 0))),
            'currency': trade_data.get('currency', 'USD'),
            'enrichedData': json.dumps(trade_data),
            'recordedAt': datetime.utcnow().isoformat(),
            'validationStatus': 'passed',
            'enrichmentStatus': 'completed'
        }
        
        table.put_item(Item=item)
        
        return {
            'statusCode': 200,
            'body': {
                'recorded': True,
                'tradeId': item['tradeId'],
                'timestamp': item['timestamp']
            }
        }
    
    except Exception as e:
        print(f"Recording error: {str(e)}")
        raise
