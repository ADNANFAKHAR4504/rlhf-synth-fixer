import json
import os
import time
from datetime import datetime, timedelta, timezone  # Import 'timezone'

import boto3

# Initialize AWS clients
DYNAMODB_CLIENT = boto3.resource("dynamodb")
SNS_CLIENT = boto3.client("sns")
CLOUDWATCH_CLIENT = boto3.client("cloudwatch")

DYNAMODB_TABLE_NAME = os.environ.get("DYNAMODB_TABLE_NAME")
SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN")
CONGESTION_THRESHOLD = float(os.environ.get("CONGESTION_THRESHOLD", 80.0))

TRAFFIC_TABLE = DYNAMODB_CLIENT.Table(DYNAMODB_TABLE_NAME)


def handler(event, context):
    """
    EventBridge-triggered function to analyze current traffic data
    and send alerts via SNS for high congestion levels.
    It also pushes a custom metric to CloudWatch for dashboard monitoring and alarms.
    """

    # Define a time window to check for recent congestion (e.g., last 5 minutes)
    end_timestamp = int(time.time())
    start_timestamp = end_timestamp - 300  # 300 seconds = 5 minutes

    # --- 1. Query DynamoDB for recent highly congested areas ---

    # Using the CongestionIndex to find potentially high congestion areas.
    # This query will fetch all records where congestion_level >= threshold, but since
    # the partition key is congestion_level, we have to iterate over all possible values.
    # Since CongestionLevel is a high-cardinality index, we simplify by targeting
    # a specific mock region for demonstration (as in the CloudWatch alarm).

    # In production, a better approach is to rely on the aggregated data
    # (created by the aggregator lambda) or a dedicated 'congested_areas' table.

    # Mock query results (pretending to check recent data for the Downtown area)
    mock_congested_data = [
        {"location_id": "Downtown-A1", "congestion_level": 82.5, "average_speed": 10.1},
        {"location_id": "Downtown-B2", "congestion_level": 90.0, "average_speed": 5.5},
        {
            "location_id": "Suburban-C4",
            "congestion_level": 55.0,
            "average_speed": 45.0,
        },  # Below threshold
    ]

    congested_locations = []
    max_congestion = 0.0

    for record in mock_congested_data:
        congestion = record.get("congestion_level", 0.0)
        max_congestion = max(max_congestion, congestion)

        if congestion >= CONGESTION_THRESHOLD:
            congested_locations.append(
                {
                    "location_id": record["location_id"],
                    "congestion_level": congestion,
                    "average_speed": record["average_speed"],
                }
            )

    # --- 2. Send SNS Alerts for Congestion ---
    if congested_locations:
        alert_message = f"!!! CONGESTION ALERT !!!\n\nThe following locations have exceeded the {CONGESTION_THRESHOLD}% congestion threshold:\n"
        for loc in congested_locations:
            alert_message += (
                f"- Location: {loc['location_id']} | Congestion: {loc['congestion_level']}% | "
                f"Avg Speed: {loc['average_speed']} mph\n"
            )

        try:
            SNS_CLIENT.publish(
                TopicArn=SNS_TOPIC_ARN,
                Message=alert_message,
                Subject="CRITICAL: High Traffic Congestion Detected",
            )
            print(f"Published {len(congested_locations)} congestion alerts to SNS.")
        except Exception as e:
            print(f"Error publishing SNS alert: {e}")

    # --- 3. Push Custom CloudWatch Metric (Crucial for the CDK's CloudWatch Alarm) ---
    # The CDK's CloudWatch Alarm monitors a metric named 'CongestionLevel' in the
    # 'TrafficAnalytics' namespace for the 'Downtown' region.

    # If no congestion was found, push 0 or the average congestion across monitored area.
    metric_value = max_congestion if max_congestion > 0 else 0.0

    try:
        CLOUDWATCH_CLIENT.put_metric_data(
            Namespace="TrafficAnalytics",
            MetricData=[
                {
                    "MetricName": "CongestionLevel",
                    "Dimensions": [{"Name": "Region", "Value": "Downtown"}],
                    "Timestamp": datetime.now(timezone.utc),  # Use timezone-aware UTC
                    "Value": metric_value,
                    "Unit": "Percent",
                }
            ],
        )
        print(f"Pushed custom CloudWatch metric: CongestionLevel={metric_value}%")
    except Exception as e:
        print(f"Error pushing CloudWatch metric: {e}")
        # Note: The Lambda was granted the cloudwatch:PutMetricData permission in the CDK code.

    return {"statusCode": 200, "body": json.dumps({"message": "Alert check complete"})}
