import json
import os
import boto3
from datetime import datetime

ssm = boto3.client('ssm')
environment = os.environ['ENVIRONMENT']

def handler(event, context):
    """
    Enriches trade data with market metadata
    """
    try:
        # Extract trade data
        trade_data = event.get('Payload', event)
        
        # Get API endpoint from SSM
        api_endpoint_param = f"/trade-processing/{environment}/api-endpoint"
        api_endpoint = ssm.get_parameter(Name=api_endpoint_param)['Parameter']['Value']
        
        # Enrich with metadata (mock implementation)
        enriched_data = {
            **trade_data,
            'enrichedAt': datetime.utcnow().isoformat(),
            'marketPrice': 100.50,  # Would call real API
            'exchangeRate': 1.0,
            'apiEndpoint': api_endpoint
        }
        
        return {
            'statusCode': 200,
            'body': enriched_data
        }
    
    except Exception as e:
        print(f"Enrichment error: {str(e)}")
        raise
