
"""Lambda function for custom CloudWatch metrics with X-Ray tracing."""

import json
import boto3
import time
import os

# CORRECTED: Proper X-Ray SDK import with error handling
try:
    from aws_xray_sdk.core import xray_recorder
    from aws_xray_sdk.core import patch_all
    # Patch AWS SDK for X-Ray tracing
    patch_all()
    XRAY_ENABLED = True
except ImportError:
    XRAY_ENABLED = False
    print("WARNING: X-Ray SDK not available. Install aws-xray-sdk to enable tracing.")

cloudwatch = boto3.client('cloudwatch')


def lambda_handler(event, context):
    """
    Process payment and emit custom CloudWatch metrics.

    Args:
        event: Lambda event containing payment details
        context: Lambda context

    Returns:
        Response with status and message
    """

    environment = os.environ.get('ENVIRONMENT', 'dev')
    payment_id = event.get('payment_id', 'unknown')

    try:
        # Start custom segment for payment validation
        if XRAY_ENABLED:
            with xray_recorder.begin_subsegment('payment_validation'):
                xray_recorder.put_annotation('environment', environment)
                xray_recorder.put_annotation('payment_id', payment_id)
                xray_recorder.put_metadata('event', event)

                # Simulate payment validation
                time.sleep(0.1)

            # Payment processing segment
            with xray_recorder.begin_subsegment('payment_processing'):
                payment_amount = event.get('amount', 100)
                payment_type = event.get('type', 'credit_card')

                xray_recorder.put_annotation('payment_type', payment_type)
                xray_recorder.put_annotation('payment_amount', payment_amount)

                # Emit custom metrics to CloudWatch
                _emit_metrics(payment_amount, payment_type, environment)

                time.sleep(0.05)

            # Database segment
            with xray_recorder.begin_subsegment('database_write'):
                xray_recorder.put_annotation('database', 'payments-db')
                # Simulate database write
                time.sleep(0.02)
        else:
            # Non-traced execution
            payment_amount = event.get('amount', 100)
            payment_type = event.get('type', 'credit_card')
            _emit_metrics(payment_amount, payment_type, environment)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'payment_id': payment_id,
                'amount': event.get('amount', 100)
            })
        }

    except Exception as e:
        error_msg = f"Error processing payment: {str(e)}"
        print(error_msg)

        if XRAY_ENABLED:
            xray_recorder.put_annotation('error', str(e))

        # Emit error metric
        try:
            cloudwatch.put_metric_data(
                Namespace='PaymentProcessing/Custom',
                MetricData=[
                    {
                        'MetricName': 'PaymentError',
                        'Value': 1,
                        'Unit': 'Count',
                        'Dimensions': [
                            {'Name': 'Environment', 'Value': environment},
                            {'Name': 'ErrorType', 'Value': type(e).__name__}
                        ]
                    }
                ]
            )
        except Exception as metric_error:
            print(f"Failed to emit error metric: {metric_error}")

        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Payment processing failed',
                'error': str(e)
            })
        }


def _emit_metrics(payment_amount, payment_type, environment):
    """Helper function to emit CloudWatch metrics."""
    try:
        cloudwatch.put_metric_data(
            Namespace='PaymentProcessing/Custom',
            MetricData=[
                {
                    'MetricName': 'PaymentAmount',
                    'Value': float(payment_amount),
                    'Unit': 'None',
                    'Dimensions': [
                        {'Name': 'PaymentType', 'Value': payment_type},
                        {'Name': 'Region', 'Value': os.environ.get('AWS_REGION', 'us-east-1')},
                        {'Name': 'Environment', 'Value': environment}
                    ]
                },
                {
                    'MetricName': 'PaymentProcessingTime',
                    'Value': 150,
                    'Unit': 'Milliseconds',
                    'Dimensions': [
                        {'Name': 'PaymentType', 'Value': payment_type},
                        {'Name': 'Environment', 'Value': environment}
                    ]
                },
                {
                    'MetricName': 'PaymentSuccess',
                    'Value': 1,
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'PaymentType', 'Value': payment_type},
                        {'Name': 'Environment', 'Value': environment}
                    ]
                }
            ]
        )

        if XRAY_ENABLED:
            xray_recorder.put_annotation('metrics_sent', True)

    except Exception as e:
        error_msg = f"Error sending metrics: {e}"
        print(error_msg)

        if XRAY_ENABLED:
            xray_recorder.put_annotation('metrics_error', str(e))

        raise

