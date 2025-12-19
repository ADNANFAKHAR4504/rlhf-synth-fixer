import base64
import json
import os
import time

import boto3

# Initialize AWS clients
DYNAMODB_CLIENT = boto3.resource("dynamodb")
S3_CLIENT = boto3.client("s3")
DYNAMODB_TABLE_NAME = os.environ.get("DYNAMODB_TABLE_NAME")
ANALYTICS_BUCKET_NAME = os.environ.get("ANALYTICS_BUCKET_NAME")

# DynamoDB table reference
try:
    TRAFFIC_TABLE = DYNAMODB_CLIENT.Table(DYNAMODB_TABLE_NAME)
except Exception as e:
    print(f"Could not initialize DynamoDB table: {e}")


def handler(event, context):
    """
    Processes raw sensor data from Kinesis, calculates derived metrics,
    and writes the results to DynamoDB (for real-time lookup) and S3 (for long-term analytics).
    """
    records_to_store_in_s3 = []

    for record in event["Records"]:
        try:
            # Kinesis data is base64 encoded
            payload_data = base64.b64decode(record["kinesis"]["data"])
            payload_str = payload_data.decode("utf-8")
            raw_data = json.loads(payload_str)

            # --- 1. Data Transformation and Metric Calculation ---
            # Assume raw_data includes: sensor_id, vehicle_count, max_capacity, average_speed, location_id

            # Simple congestion level calculation (0-100)
            # In a real scenario, this would be based on speed, flow, and road capacity.
            max_capacity = raw_data.get("max_capacity", 100)  # Placeholder max capacity
            vehicle_count = raw_data.get("vehicle_count", 0)

            # Simple calculation: Congestion is the percentage of capacity used
            congestion_level = round((vehicle_count / max_capacity) * 100, 2)

            # Prepare the processed record
            processed_record = {
                "sensor_id": raw_data["sensor_id"],
                "timestamp": raw_data[
                    "timestamp"
                ],  # Unix timestamp for DynamoDB sort key
                "location_id": raw_data["location_id"],
                "congestion_level": float(
                    congestion_level
                ),  # Stored as a Number/Double in DynamoDB
                "vehicle_count": vehicle_count,
                "average_speed": raw_data.get("average_speed", 0.0),
            }

            # --- 2. Write to DynamoDB (Real-Time View) ---
            TRAFFIC_TABLE.put_item(Item=processed_record)

            # --- 3. Prepare for S3 Write (Analytics) ---
            records_to_store_in_s3.append(json.dumps(processed_record))

        except Exception as e:
            print(f"Error processing record: {e}. Record: {record}")
            # Continue to the next record to ensure fault tolerance

    # --- 4. Batch Write to S3 for Athena/QuickSight Analytics ---
    if records_to_store_in_s3:
        try:
            timestamp_ms = int(time.time() * 1000)
            # Use S3 path partitioning (yyyy/mm/dd/hh) for optimal Athena performance
            dt_object = time.gmtime(timestamp_ms / 1000)
            s3_key = f"traffic_data/year={dt_object.tm_year}/month={dt_object.tm_mon:02d}/day={dt_object.tm_mday:02d}/hour={dt_object.tm_hour:02d}/{timestamp_ms}.json"

            s3_payload = "\n".join(records_to_store_in_s3).encode("utf-8")

            S3_CLIENT.put_object(
                Bucket=ANALYTICS_BUCKET_NAME, Key=s3_key, Body=s3_payload
            )
            print(
                f"Successfully wrote {len(records_to_store_in_s3)} records to S3: {s3_key}"
            )
        except Exception as e:
            print(f"Error writing to S3: {e}")

    return {
        "statusCode": 200,
        "body": f"Processed {len(event['Records'])} Kinesis records.",
    }
