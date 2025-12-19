import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Lambda function for payment validation
    """
    try:
        logger.info("Payment validation request received")
        
        # Sample validation logic
        response = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment validation successful',
                'environment': 'development',
                'status': 'validated'
            })
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Error in payment validation: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Payment validation failed',
                'error': str(e)
            })
        }
