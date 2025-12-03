import json
import boto3
import psycopg2
import redis

# ISSUE: No error handling
# ISSUE: Hardcoded connection logic
# ISSUE: Missing environment variable validation

def handler(event, context):
    s3_client = boto3.client('s3')
    secrets_client = boto3.client('secretsmanager')

    for record in event['Records']:
        data = json.loads(record['kinesis']['data'])

        # Archive to S3 (ISSUE: No error handling)
        s3_client.put_object(
            Bucket='product-inventory-archive',
            Key=f'inventory/{data["product_id"]}.json',
            Body=json.dumps(data)
        )

        # Update database (ISSUE: Connection not managed properly)
        db_conn = psycopg2.connect(
            host='localhost',
            database='productcatalog',
            user='postgres',
            password='password123'
        )

        cursor = db_conn.cursor()
        cursor.execute("UPDATE products SET inventory = %s WHERE id = %s",
                      (data['inventory'], data['product_id']))
        db_conn.commit()

        # Update Redis cache (ISSUE: No error handling)
        cache = redis.Redis(host='localhost', port=6379)
        cache.delete(f"product:{data['product_id']}")

    return {'statusCode': 200}
