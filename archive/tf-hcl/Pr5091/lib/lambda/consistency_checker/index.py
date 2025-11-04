# Consistency Checker Lambda - Verifies consistency across all microservices
import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    """
    Checks consistency of feature flags across all microservices
    Triggered by Step Functions
    """
    try:
        table_name = os.environ.get('DYNAMODB_TABLE')
        microservices_count = int(os.environ.get('MICROSERVICES_COUNT', 156))
        environment = os.environ.get('ENVIRONMENT')
        
        # Query CloudWatch results from event
        query_results = event.get('results', [])
        
        # Check consistency across services
        inconsistencies = []
        expected_count = microservices_count
        actual_count = len(query_results)
        
        if actual_count != expected_count:
            inconsistencies.append({
                'type': 'count_mismatch',
                'expected': expected_count,
                'actual': actual_count
            })
        
        is_consistent = len(inconsistencies) == 0
        
        return {
            'statusCode': 200,
            'isConsistent': is_consistent,
            'inconsistencies': inconsistencies,
            'flagId': event.get('flagId'),
            'environment': environment
        }
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'isConsistent': False,
            'error': str(e)
        }
