import json
import os

def handler(event, context):
    """
    Process DynamoDB Stream records for real-time analytics.
    Triggered by changes to the transactions table.
    """
    try:
        processed_count = 0

        for record in event['Records']:
            if record['eventName'] in ['INSERT', 'MODIFY']:
                # Extract new image from DynamoDB stream
                new_image = record['dynamodb'].get('NewImage', {})

                # Process analytics (in production, this would send to analytics service)
                transaction_id = new_image.get('transaction_id', {}).get('S')
                amount = new_image.get('amount', {}).get('N')
                provider = new_image.get('provider', {}).get('S')
                status = new_image.get('status', {}).get('S')

                print(f"Analytics: Transaction {transaction_id} - Amount: {amount}, Provider: {provider}, Status: {status}")

                # Here you would typically:
                # - Update aggregated metrics
                # - Send to data warehouse
                # - Update real-time dashboards
                # - Trigger fraud detection

                processed_count += 1

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Processed {processed_count} records',
                'processed_count': processed_count
            })
        }

    except Exception as e:
        print(f"Error processing analytics: {str(e)}")
        raise
