import json
import logging
import time
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch all supported libraries for X-Ray
patch_all()

logger = logging.getLogger()
logger.setLevel(logging.INFO)


@xray_recorder.capture('order_processor')
def handler(event, context):
    """
    Order processor Lambda function with X-Ray tracing
    """
    start_time = time.time()

    try:
        logger.info(f"Processing order: {json.dumps(event)}")

        # Simulate order processing
        order_id = event.get('order_id', 'unknown')
        items = event.get('items', [])

        # Add X-Ray metadata
        xray_recorder.put_metadata('order_id', order_id)
        xray_recorder.put_metadata('item_count', len(items))

        # Simulate processing logic
        if not items:
            raise ValueError("Order has no items")

        # Simulate random errors for testing (5% error rate)
        import random
        if random.random() < 0.05:
            raise Exception("Simulated order processing error")

        duration = (time.time() - start_time) * 1000
        logger.info(f"Duration: {duration:.2f} ms")

        response = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Order processed successfully',
                'order_id': order_id,
                'items_processed': len(items),
                'duration_ms': duration
            })
        }

        return response

    except Exception as e:
        duration = (time.time() - start_time) * 1000
        logger.error(f"Order processing failed: {str(e)}")
        logger.info(f"Duration: {duration:.2f} ms")

        xray_recorder.put_annotation('error', str(e))

        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Order processing failed',
                'error': str(e)
            })
        }
