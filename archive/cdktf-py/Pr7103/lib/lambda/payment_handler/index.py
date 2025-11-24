import json
import logging
import time
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch all supported libraries for X-Ray
patch_all()

logger = logging.getLogger()
logger.setLevel(logging.INFO)


@xray_recorder.capture('payment_handler')
def handler(event, context):
    """
    Payment handler Lambda function with X-Ray tracing
    """
    start_time = time.time()

    try:
        logger.info(f"Processing payment request: {json.dumps(event)}")

        # Simulate payment processing
        payment_id = event.get('payment_id', 'unknown')
        amount = event.get('amount', 0)

        # Add X-Ray metadata
        xray_recorder.put_metadata('payment_id', payment_id)
        xray_recorder.put_metadata('amount', amount)

        # Simulate processing logic
        if amount <= 0:
            raise ValueError("Invalid payment amount")

        # Simulate random errors for testing (10% error rate)
        import random
        if random.random() < 0.1:
            raise Exception("Simulated payment processing error")

        duration = (time.time() - start_time) * 1000
        logger.info(f"Duration: {duration:.2f} ms")

        response = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'payment_id': payment_id,
                'amount': amount,
                'duration_ms': duration
            })
        }

        return response

    except Exception as e:
        duration = (time.time() - start_time) * 1000
        logger.error(f"Payment processing failed: {str(e)}")
        logger.info(f"Duration: {duration:.2f} ms")

        xray_recorder.put_annotation('error', str(e))

        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Payment processing failed',
                'error': str(e)
            })
        }
