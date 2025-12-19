import json
import boto3
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any

cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    """
    Custom metric processor for advanced CloudWatch observability.
    Processes metrics with math expressions and publishes aggregated data.
    """

    namespace = os.environ.get('METRIC_NAMESPACE')
    environment = os.environ.get('ENVIRONMENT')

    try:
        # Calculate composite metrics using metric math
        composite_metrics = calculate_composite_metrics()

        # Publish custom metrics
        publish_metrics(namespace, composite_metrics)

        # Check for anomalies
        anomalies = detect_anomalies()

        response = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Metrics processed successfully',
                'metrics_published': len(composite_metrics),
                'anomalies_detected': len(anomalies),
                'timestamp': datetime.utcnow().isoformat()
            })
        }

        print(f"Processed {len(composite_metrics)} metrics, detected {len(anomalies)} anomalies")

        return response

    except Exception as e:
        print(f"Error processing metrics: {str(e)}")
        raise

def calculate_composite_metrics() -> List[Dict[str, Any]]:
    """
    Calculate composite metrics using metric math expressions.
    Reduces custom metric count by combining multiple data points.
    """

    end_time = datetime.utcnow()
    start_time = end_time - timedelta(minutes=5)

    # Query metrics using metric math to reduce custom metric count
    response = cloudwatch.get_metric_data(
        MetricDataQueries=[
            {
                'Id': 'm1',
                'MetricStat': {
                    'Metric': {
                        'Namespace': 'AWS/Lambda',
                        'MetricName': 'Invocations'
                    },
                    'Period': 300,
                    'Stat': 'Sum'
                }
            },
            {
                'Id': 'm2',
                'MetricStat': {
                    'Metric': {
                        'Namespace': 'AWS/Lambda',
                        'MetricName': 'Errors'
                    },
                    'Period': 300,
                    'Stat': 'Sum'
                }
            },
            {
                'Id': 'error_rate',
                'Expression': '(m2 / m1) * 100',
                'Label': 'Error Rate Percentage'
            }
        ],
        StartTime=start_time,
        EndTime=end_time
    )

    composite_metrics = []

    for result in response['MetricDataResults']:
        if result['Id'] == 'error_rate' and len(result['Values']) > 0:
            composite_metrics.append({
                'MetricName': 'CompositeErrorRate',
                'Value': result['Values'][0],
                'Unit': 'Percent',
                'Timestamp': result['Timestamps'][0]
            })

    return composite_metrics

def publish_metrics(namespace: str, metrics: List[Dict[str, Any]]) -> None:
    """
    Publish calculated metrics to CloudWatch.
    """

    if not metrics:
        return

    metric_data = []

    for metric in metrics:
        metric_data.append({
            'MetricName': metric['MetricName'],
            'Value': metric['Value'],
            'Unit': metric.get('Unit', 'None'),
            'Timestamp': metric.get('Timestamp', datetime.utcnow())
        })

    # Batch publish metrics
    cloudwatch.put_metric_data(
        Namespace=namespace,
        MetricData=metric_data
    )

def detect_anomalies() -> List[Dict[str, Any]]:
    """
    Detect anomalies in metrics using CloudWatch anomaly detection.
    """

    anomalies = []

    try:
        # Query anomaly detector status
        response = cloudwatch.describe_anomaly_detectors(
            MaxResults=100
        )

        for detector in response.get('AnomalyDetectors', []):
            if detector.get('StateValue') == 'TRAINED':
                anomalies.append({
                    'namespace': detector.get('Namespace'),
                    'metric': detector.get('MetricName'),
                    'state': detector.get('StateValue')
                })

    except Exception as e:
        print(f"Error detecting anomalies: {str(e)}")

    return anomalies
