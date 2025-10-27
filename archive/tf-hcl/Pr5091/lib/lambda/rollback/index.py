# Rollback Lambda - Rolls back feature flag changes if inconsistencies detected
import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    """
    Rolls back feature flag to previous state
    Logs rollback to OpenSearch for auditing
    Triggered by Step Functions on consistency failure
    """
    try:
        table_name = os.environ.get('DYNAMODB_TABLE')
        opensearch_endpoint = os.environ.get('OPENSEARCH_DOMAIN')
        environment = os.environ.get('ENVIRONMENT')
        
        flag_id = event.get('flagId')
        reason = event.get('reason', 'Consistency check failed')
        
        table = dynamodb.Table(table_name)
        
        # Get current and previous versions
        response = table.query(
            KeyConditionExpression='flag_id = :fid',
            ExpressionAttributeValues={':fid': flag_id},
            ScanIndexForward=False,
            Limit=2
        )
        
        items = response.get('Items', [])
        if len(items) < 2:
            return {
                'statusCode': 400,
                'error': 'No previous version to rollback to'
            }
        
        previous_version = items[1]
        
        # Restore previous version
        table.put_item(Item={
            'flag_id': flag_id,
            'version': int(items[0]['version']) + 1,
            'value': previous_version['value'],
            'rollback': True,
            'rollback_reason': reason,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Log to OpenSearch (placeholder)
        audit_log = {
            'action': 'rollback',
            'flag_id': flag_id,
            'reason': reason,
            'timestamp': datetime.utcnow().isoformat(),
            'environment': environment
        }
        print(f"Audit log: {json.dumps(audit_log)}")
        
        return {
            'statusCode': 200,
            'body': 'Rollback completed successfully',
            'flagId': flag_id,
            'reason': reason
        }
    
    except Exception as e:
        print(f"Error: {str(e)}")
        raise
