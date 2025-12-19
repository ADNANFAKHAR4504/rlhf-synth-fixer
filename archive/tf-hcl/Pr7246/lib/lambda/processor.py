import json
import os
import logging
import sys

logger = logging.getLogger()
log_level = os.environ.get('LOG_LEVEL', 'INFO')
logger.setLevel(getattr(logging, log_level))

def handler(event, context):
    """
    Lambda function to process background tasks
    
    This function processes events and can interact with the Aurora database
    and other AWS services as needed.
    """
    try:
        logger.info(f"Processing event: {json.dumps(event)}")
        
        environment = os.environ.get('ENVIRONMENT', 'unknown')
        db_host = os.environ.get('DB_HOST', 'not-configured')
        db_name = os.environ.get('DB_NAME', 'not-configured')
        
        # Validate environment variables
        if db_host == 'not-configured':
            logger.warning("Database host not configured")
        
        # Process the event based on event type
        event_type = event.get('type', 'unknown')
        
        if event_type == 'data_processing':
            result = process_data(event.get('data', {}))
        elif event_type == 'batch_job':
            result = process_batch(event.get('items', []))
        else:
            result = {'status': 'processed', 'type': event_type}
        
        logger.info(f"Processing completed successfully: {result}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Event processed successfully',
                'environment': environment,
                'db_host': db_host,
                'db_name': db_name,
                'result': result
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing event: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error processing event',
                'error': str(e)
            })
        }


def process_data(data):
    """Process individual data item"""
    logger.info(f"Processing data: {data}")
    # Add actual data processing logic here
    return {'processed': True, 'items': 1}


def process_batch(items):
    """Process batch of items"""
    logger.info(f"Processing batch of {len(items)} items")
    processed_count = 0
    
    for item in items:
        try:
            # Add actual batch processing logic here
            processed_count += 1
        except Exception as e:
            logger.error(f"Error processing item: {str(e)}")
    
    return {'processed': processed_count, 'total': len(items)}
