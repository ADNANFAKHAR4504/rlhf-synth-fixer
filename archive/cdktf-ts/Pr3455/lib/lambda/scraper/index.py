import json
import os
import time
import boto3
import random
from decimal import Decimal
from datetime import datetime
from typing import Dict, Any, List
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
cloudwatch = boto3.client('cloudwatch')
sqs = boto3.client('sqs')

PRICE_TABLE = os.environ['PRICE_TABLE']
S3_BUCKET = os.environ['S3_BUCKET']
QUEUE_URL = os.environ['QUEUE_URL']
ENVIRONMENT = os.environ['ENVIRONMENT']

table = dynamodb.Table(PRICE_TABLE)

def exponential_backoff(attempt: int, max_delay: int = 60) -> float:
    """Calculate exponential backoff with jitter."""
    delay = min(2 ** attempt + random.uniform(0, 1), max_delay)
    return delay

def scrape_price(product_id: str, retailer: str, url: str) -> Dict[str, Any]:
    """
    Simulate price scraping with exponential backoff.
    In production, this would make actual HTTP requests.
    """
    max_attempts = 5

    for attempt in range(max_attempts):
        try:
            # Simulate price scraping (replace with actual scraping logic)
            simulated_price = Decimal(str(round(random.uniform(10, 500), 2)))

            # Random failure simulation for testing retry logic
            if random.random() < 0.1:  # 10% failure rate
                raise Exception("Simulated scraping failure")

            return {
                'product_id': product_id,
                'retailer': retailer,
                'price': simulated_price,
                'url': url,
                'scraped_at': datetime.utcnow().isoformat(),
                'attempt': attempt + 1
            }

        except Exception as e:
            if attempt < max_attempts - 1:
                delay = exponential_backoff(attempt)
                logger.warning(f"Attempt {attempt + 1} failed for {product_id}, retrying in {delay:.2f}s: {str(e)}")
                time.sleep(delay)
            else:
                logger.error(f"Failed to scrape {product_id} after {max_attempts} attempts")
                raise

def store_price(price_data: Dict[str, Any]) -> None:
    """Store price in DynamoDB table."""
    timestamp = int(datetime.utcnow().timestamp() * 1000)

    item = {
        'product_id': price_data['product_id'],
        'timestamp': timestamp,
        'retailer': price_data['retailer'],
        'price': price_data['price'],
        'url': price_data['url'],
        'scraped_at': price_data['scraped_at'],
        'attempts': price_data['attempt']
    }

    table.put_item(Item=item)

    # Archive to S3 for historical analysis
    s3_key = f"prices/{price_data['retailer']}/{price_data['product_id']}/{timestamp}.json"
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=s3_key,
        Body=json.dumps(item, default=str),
        ContentType='application/json'
    )

def send_metrics(success_count: int, failure_count: int) -> None:
    """Send custom metrics to CloudWatch."""
    try:
        cloudwatch.put_metric_data(
            Namespace=f'PriceMonitor/{ENVIRONMENT}',
            MetricData=[
                {
                    'MetricName': 'ScrapingSuccess',
                    'Value': success_count,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'ScrapingFailure',
                    'Value': failure_count,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        logger.error(f"Failed to send metrics: {str(e)}")

def process_batch(records: List[Dict]) -> Dict[str, int]:
    """Process a batch of SQS messages."""
    success_count = 0
    failure_count = 0

    for record in records:
        try:
            body = json.loads(record['body'])

            # Handle batch scraping request
            if body.get('action') == 'scrape_all_products':
                # Generate product list (in production, fetch from database or config)
                products = generate_product_list()

                # Send individual scraping jobs to queue
                for product in products:
                    sqs.send_message(
                        QueueUrl=QUEUE_URL,
                        MessageBody=json.dumps(product)
                    )

                logger.info(f"Queued {len(products)} products for scraping")
                success_count += 1
            else:
                # Handle individual product scraping
                product_id = body.get('product_id')
                retailer = body.get('retailer')
                url = body.get('url')

                if not all([product_id, retailer, url]):
                    raise ValueError("Missing required fields in message")

                price_data = scrape_price(product_id, retailer, url)
                store_price(price_data)

                logger.info(f"Successfully scraped and stored price for {product_id}")
                success_count += 1

        except Exception as e:
            logger.error(f"Failed to process record: {str(e)}")
            failure_count += 1

    return {'success': success_count, 'failure': failure_count}

def generate_product_list() -> List[Dict]:
    """Generate list of products to scrape."""
    products = []
    retailers = ['retailer_a', 'retailer_b', 'retailer_c']

    # Generate 5300 products distributed across retailers
    for i in range(5300):
        retailer = retailers[i % len(retailers)]
        products.append({
            'product_id': f'PROD_{i:06d}',
            'retailer': retailer,
            'url': f'https://{retailer}.com/product/{i}'
        })

    return products

def handler(event: Dict, context: Any) -> Dict:
    """Lambda handler for price scraping."""
    try:
        records = event.get('Records', [])

        if not records:
            logger.warning("No records to process")
            return {'statusCode': 200, 'body': json.dumps('No records to process')}

        results = process_batch(records)
        send_metrics(results['success'], results['failure'])

        response = {
            'statusCode': 200,
            'body': json.dumps({
                'processed': len(records),
                'success': results['success'],
                'failure': results['failure']
            })
        }

        logger.info(f"Processing complete: {response}")
        return response

    except Exception as e:
        logger.error(f"Handler error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }