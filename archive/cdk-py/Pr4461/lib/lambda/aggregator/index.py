import json
import os
import time
from datetime import (
    datetime,  # Import 'timezone' for non-deprecated methods
    timedelta,
    timezone,
)

import boto3

# Initialize AWS clients
DYNAMODB_CLIENT = boto3.resource("dynamodb")
S3_CLIENT = boto3.client("s3")

DYNAMODB_TABLE_NAME = os.environ.get("DYNAMODB_TABLE_NAME")
ANALYTICS_BUCKET_NAME = os.environ.get("ANALYTICS_BUCKET_NAME")
TRAFFIC_TABLE = DYNAMODB_CLIENT.Table(DYNAMODB_TABLE_NAME)


def handler(event, context):
    """
    EventBridge-triggered function to perform hourly aggregation on data
    stored in DynamoDB and write the summary to S3 for long-term analytics.
    """
    # Define the aggregation window (e.g., the last hour)
    end_time = int(time.time())
    start_time = end_time - 3600  # Data from 1 hour ago (3600 seconds)

    # In a real-world scenario, you would need to scan/query large amounts of data
    # which can be costly. For simplicity, we demonstrate querying for aggregation.

    # We will aggregate by 'location_id'. First, we need to know all unique locations.
    # For this example, we'll assume a fixed list or query a dedicated metadata table.
    # Since DynamoDB read can be expensive, we simulate the aggregation logic.

    # --- 1. Simulation: Fetch and Aggregate Data (Simplified for demonstration) ---
    print(f"Starting aggregation for period: {start_time} to {end_time}")

    # In a production environment, you would use DynamoDB Streams/Kinesis Firehose
    # for full data export rather than directly querying the OLTP table for aggregation.

    # Mock aggregation result
    aggregated_data = {}

    # Mock data fetch (as a full scan is not feasible in prod)
    # The aggregation_lambda is granted read access to the DynamoDB table.

    # Mocking data to demonstrate aggregation logic:
    # A full table scan is avoided by assuming data is retrieved efficiently.
    mock_sensor_data = [
        {"location_id": "Downtown-A1", "congestion_level": 75, "average_speed": 25.5},
        {"location_id": "Downtown-A1", "congestion_level": 85, "average_speed": 15.0},
        {"location_id": "Highway-B3", "congestion_level": 30, "average_speed": 80.2},
        {"location_id": "Highway-B3", "congestion_level": 40, "average_speed": 75.8},
    ]

    for record in mock_sensor_data:
        location = record["location_id"]
        if location not in aggregated_data:
            aggregated_data[location] = {
                "total_congestion": 0.0,
                "total_speed": 0.0,
                "count": 0,
            }

        aggregated_data[location]["total_congestion"] += record["congestion_level"]
        aggregated_data[location]["total_speed"] += record["average_speed"]
        aggregated_data[location]["count"] += 1

    # Finalize Aggregations
    final_aggregations = []
    # FIX: Replaced datetime.utcfromtimestamp() with timezone-aware datetime.fromtimestamp()
    current_time_str = datetime.fromtimestamp(end_time, timezone.utc).isoformat()

    for location, data in aggregated_data.items():
        if data["count"] > 0:
            final_aggregations.append(
                json.dumps(
                    {
                        "aggregation_time": current_time_str,
                        "location_id": location,
                        "num_samples": data["count"],
                        "avg_congestion": round(
                            data["total_congestion"] / data["count"], 2
                        ),
                        "avg_speed": round(data["total_speed"] / data["count"], 2),
                    }
                )
            )

    # --- 2. Write aggregated result to S3 ---
    if final_aggregations:
        try:
            # Partitioning for hourly aggregation results
            # FIX: Replaced datetime.utcfromtimestamp() with timezone-aware datetime.fromtimestamp()
            dt_object = datetime.fromtimestamp(end_time, timezone.utc)
            s3_key = f"aggregated_data/year={dt_object.year}/month={dt_object.month:02d}/day={dt_object.day:02d}/hour={dt_object.hour:02d}/agg_{end_time}.json"

            s3_payload = "\n".join(final_aggregations).encode("utf-8")

            S3_CLIENT.put_object(
                Bucket=ANALYTICS_BUCKET_NAME, Key=s3_key, Body=s3_payload
            )
            print(
                f"Successfully wrote {len(final_aggregations)} aggregated records to S3: {s3_key}"
            )
        except Exception as e:
            print(f"Error writing aggregation results to S3: {e}")
            raise e

    return {"statusCode": 200, "body": json.dumps({"message": "Aggregation complete"})}
