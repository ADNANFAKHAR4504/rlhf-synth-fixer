import gzip
import os
import boto3
from datetime import datetime, timedelta
from collections import Counter
import io

s3_client = boto3.client('s3')
cloudwatch = boto3.client('cloudwatch')

LOG_BUCKET = os.environ.get('LOG_BUCKET')
LOG_PREFIX = os.environ.get('LOG_PREFIX', 'cdn-access-logs/')
CLOUDWATCH_NS = os.environ.get('CLOUDWATCH_NS', 'Publishing/CDN')
AWS_REGION_LOGS = os.environ.get('AWS_REGION_LOGS', 'us-east-1')


def parse_log_line(line):
    if line.startswith('#'):
        return None

    try:
        fields = line.split('\t')
        if len(fields) < 24:
            return None

        return {
            'date': fields[0],
            'time': fields[1],
            'edge_location': fields[2],
            'bytes': int(fields[3]) if fields[3] != '-' else 0,
            'client_ip': fields[4],
            'method': fields[5],
            'host': fields[6],
            'uri': fields[7],
            'status': int(fields[8]) if fields[8] != '-' else 0,
            'referrer': fields[9],
            'user_agent': fields[10],
            'query_string': fields[11],
            'cookie': fields[12],
            'result_type': fields[13],
            'request_id': fields[14],
            'host_header': fields[15],
            'protocol': fields[16],
            'request_bytes': int(fields[17]) if fields[17] != '-' else 0,
            'time_taken': float(fields[18]) if fields[18] != '-' else 0.0,
            'xforwarded_for': fields[19],
            'ssl_protocol': fields[20],
            'ssl_cipher': fields[21],
            'response_result_type': fields[22],
            'http_version': fields[23]
        }
    except Exception as e:
        print(f"Error parsing log line: {str(e)}")
        return None


def process_log_file(bucket, key):
    try:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        body = response['Body'].read()

        if key.endswith('.gz'):
            body = gzip.decompress(body)

        content = body.decode('utf-8')
        lines = content.split('\n')

        return [parse_log_line(line) for line in lines if line and parse_log_line(line)]
    except Exception as e:
        print(f"Error processing log file {key}: {str(e)}")
        return []


def calculate_metrics(log_entries):
    total_requests = len(log_entries)
    if total_requests == 0:
        return {}

    total_bytes = sum(entry['bytes'] for entry in log_entries)
    premium_requests = sum(1 for entry in log_entries if '/premium/' in entry['uri'])
    free_requests = total_requests - premium_requests

    status_4xx = sum(1 for entry in log_entries if 400 <= entry['status'] < 500)
    status_5xx = sum(1 for entry in log_entries if 500 <= entry['status'] < 600)

    cache_hits = sum(1 for entry in log_entries if entry['result_type'] in ['Hit', 'RefreshHit'])
    cache_misses = sum(1 for entry in log_entries if entry['result_type'] in ['Miss', 'Error'])

    cache_hit_ratio = (cache_hits / total_requests * 100) if total_requests > 0 else 0

    uri_counter = Counter(entry['uri'] for entry in log_entries)
    top_10_uris = uri_counter.most_common(10)

    location_counter = Counter(entry['edge_location'] for entry in log_entries)

    avg_response_time = sum(entry['time_taken'] for entry in log_entries) / total_requests

    return {
        'total_requests': total_requests,
        'total_bytes': total_bytes,
        'premium_requests': premium_requests,
        'free_requests': free_requests,
        'status_4xx': status_4xx,
        'status_5xx': status_5xx,
        'cache_hits': cache_hits,
        'cache_misses': cache_misses,
        'cache_hit_ratio': cache_hit_ratio,
        'top_10_uris': top_10_uris,
        'geographic_distribution': dict(location_counter),
        'avg_response_time': avg_response_time
    }


def publish_metrics_to_cloudwatch(metrics):
    timestamp = datetime.utcnow()

    metric_data = [
        {
            'MetricName': 'TotalRequests',
            'Value': metrics['total_requests'],
            'Unit': 'Count',
            'Timestamp': timestamp
        },
        {
            'MetricName': 'TotalBytes',
            'Value': metrics['total_bytes'],
            'Unit': 'Bytes',
            'Timestamp': timestamp
        },
        {
            'MetricName': 'PremiumRequests',
            'Value': metrics['premium_requests'],
            'Unit': 'Count',
            'Timestamp': timestamp
        },
        {
            'MetricName': 'FreeRequests',
            'Value': metrics['free_requests'],
            'Unit': 'Count',
            'Timestamp': timestamp
        },
        {
            'MetricName': '4xxErrors',
            'Value': metrics['status_4xx'],
            'Unit': 'Count',
            'Timestamp': timestamp
        },
        {
            'MetricName': '5xxErrors',
            'Value': metrics['status_5xx'],
            'Unit': 'Count',
            'Timestamp': timestamp
        },
        {
            'MetricName': 'CacheHits',
            'Value': metrics['cache_hits'],
            'Unit': 'Count',
            'Timestamp': timestamp
        },
        {
            'MetricName': 'CacheMisses',
            'Value': metrics['cache_misses'],
            'Unit': 'Count',
            'Timestamp': timestamp
        },
        {
            'MetricName': 'CacheHitRatio',
            'Value': metrics['cache_hit_ratio'],
            'Unit': 'Percent',
            'Timestamp': timestamp
        },
        {
            'MetricName': 'AverageResponseTime',
            'Value': metrics['avg_response_time'],
            'Unit': 'Seconds',
            'Timestamp': timestamp
        }
    ]

    try:
        cloudwatch.put_metric_data(
            Namespace=CLOUDWATCH_NS,
            MetricData=metric_data
        )
        print(f"Published {len(metric_data)} metrics to CloudWatch namespace {CLOUDWATCH_NS}")
    except Exception as e:
        print(f"Error publishing metrics to CloudWatch: {str(e)}")


def lambda_handler(event, context):
    try:
        yesterday = datetime.utcnow() - timedelta(days=1)
        date_prefix = yesterday.strftime('%Y-%m-%d')

        prefix = f"{LOG_PREFIX}"

        print(f"Processing CloudFront logs from bucket {LOG_BUCKET} with prefix {prefix}")

        paginator = s3_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=LOG_BUCKET, Prefix=prefix)

        all_log_entries = []
        file_count = 0

        for page in pages:
            if 'Contents' not in page:
                continue

            for obj in page['Contents']:
                key = obj['Key']
                if not key.endswith('.gz'):
                    continue

                log_entries = process_log_file(LOG_BUCKET, key)
                all_log_entries.extend(log_entries)
                file_count += 1

                if file_count >= 100:
                    break

            if file_count >= 100:
                break

        print(f"Processed {file_count} log files with {len(all_log_entries)} total log entries")

        if len(all_log_entries) == 0:
            print("No log entries found to process")
            return {
                'statusCode': 200,
                'body': 'No log entries found to process'
            }

        metrics = calculate_metrics(all_log_entries)

        print(f"Calculated metrics:")
        print(f"  Total Requests: {metrics['total_requests']}")
        print(f"  Premium Requests: {metrics['premium_requests']}")
        print(f"  Free Requests: {metrics['free_requests']}")
        print(f"  Cache Hit Ratio: {metrics['cache_hit_ratio']:.2f}%")
        print(f"  4xx Errors: {metrics['status_4xx']}")
        print(f"  5xx Errors: {metrics['status_5xx']}")
        print(f"  Average Response Time: {metrics['avg_response_time']:.3f}s")

        print(f"Top 10 E-Books:")
        for uri, count in metrics['top_10_uris']:
            print(f"  {uri}: {count} requests")

        print(f"Geographic Distribution:")
        for location, count in sorted(metrics['geographic_distribution'].items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  {location}: {count} requests")

        publish_metrics_to_cloudwatch(metrics)

        return {
            'statusCode': 200,
            'body': f"Processed {len(all_log_entries)} log entries and published metrics to CloudWatch"
        }

    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': f"Error processing logs: {str(e)}"
        }
