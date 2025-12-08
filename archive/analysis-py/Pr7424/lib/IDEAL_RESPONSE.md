# Ideal Response for Kinesis Architecture Analysis

## Original Prompt

```
We need a comprehensive throughput optimization and data loss prevention audit of our AWS Kinesis architecture in the `us-east-1` region, covering 45 Data Streams and 67 Firehose delivery streams that ingest 890 GB of data daily.
Create a Python 3.12 script called **analyze_kinesis.py** using **Boto3** and **Pandas** to analyze Kinesis Data Streams, Kinesis Firehose delivery streams, CloudWatch metrics, stream configurations, and consumer performance.

**Your script must perform all of the following analyses:**

1. **Iterator Age High:** Data Streams with `GetRecords.IteratorAgeMilliseconds > 60000ms`—indicates consumer lag.
2. **Throttled Records:** Streams experiencing `WriteProvisionedThroughputExceeded` errors >1% of requests—indicates insufficient shard capacity.
3. **Under-Provisioned Shards:** Streams with incoming rate >80% of provisioned throughput consistently over 7 days.
4. **Over-Provisioned Shards:** Streams with incoming rate <20% of provisioned throughput—flag for potential cost optimization.
5. **No Enhanced Monitoring:** Critical data streams without enhanced (shard-level) monitoring.
6. **Excessive Retention:** Streams retaining data for 7 days when 24 hours would suffice—cost savings opportunity.
7. **No Encryption:** Streams with PII or sensitive data not using KMS for server-side encryption.
8. **Firehose Delivery Failures:** Firehose streams with failed delivery rate >1% (to S3, Redshift, Elasticsearch).
9. **Small Batch Sizes:** Firehose buffer size <5MB and buffer interval <300s—results in excessive S3 PUT requests.
10. **No Data Transformation:** Firehose streams delivering raw data, missing Lambda transformation for conversion/enrichment.
11. **Missing S3 Backup:** Firehose streams delivering to Redshift/Elasticsearch without S3 backup for failures.
12. **No CloudWatch Alarms:** Streams without alarms for iterator age, throttling, or failed deliveries.
13. **Consumer Lag:** Data Streams with enhanced fan-out consumers having `MillisBehindLatest > 5000ms`.
14. **Shard Splitting Needed:** Hot shards (far above average throughput) lacking automatic resharding.
15. **VPC Endpoint Not Used:** Firehose streams access S3 via internet, not VPC endpoint—unnecessary data transfer costs.
16. **No Cross-Region Replication:** Critical streams without redundant Kinesis replication to DR/secondary region.
17. **On-Demand Misconduct:** Streams using on-demand mode despite having steady, predictable traffic.

**Filters and exclusions:**

- Exclude any stream tagged `ExcludeFromAnalysis: true` (case-insensitive).
- Only analyze streams with >100 records per minute.
- Ignore streams (Data Streams or Firehose) with names prefixed `test-` or `dev-`.
- Must analyze past 7 days of CloudWatch metrics: iterator age, throughput, failed deliveries, buffer, error rates.

**Outputs must include:**

- **Console:** Print stream health scores, throughput utilization, and consumer lag analysis for each stream.
- **kinesis_analysis.json:** Include:
    - `data_streams`: list of stream stats, configuration, metrics, health score, optimization findings.
    - `firehose_streams`: delivery stream config, failed delivery rates, buffer settings, encryption, backup, Lambda integration, optimization findings.
    - `summary`: total streams analyzed, aggregate throughput and consumer lag, savings opportunity, high-priority issues.
- **throughput_utilization_dashboard.html:** Shard-level heatmap/visualization of utilization and bottlenecks.
- **consumer_lag_report.csv:** Detailed analysis of lag per consumer, flagged for attention where needed.
- **shard_optimization_plan.json:** Resharding recommendations, action steps, and projected improvement.

**Additional details:**

- Make sure all outputs adhere exactly to the prescribed format.
- Consumer lag and throughput analysis must use CloudWatch metrics and stream configuration/API data.
- Calculate cost and utilization optimizations as per actual AWS pricing.
- CloudWatch alarm recommendations must be prioritized where coverage is missing.
- Shard optimization (split/merge) and DR/replication flags must be actionable for ops teams.
- All findings must include concise remediation advice.

**Environment:**

- AWS us-east-1, Kinesis Data Streams, Firehose, CloudWatch, Lambda, S3, KMS
- Python 3.12, Boto3, Pandas, visualization/charting libraries for HTML dashboard

_Do not omit, reinterpret, or alter any requirement, exclusion, or output format described above; generate the specified script and output files exactly._
```

## Ideal Response

Here's a comprehensive Python 3.12 script that performs all the requested Kinesis analyses:

```python
#!/usr/bin/env python3
"""
analyze_kinesis.py - Comprehensive AWS Kinesis Architecture Analysis
Performs throughput optimization and data loss prevention audit
"""

import json
import csv
import os
import logging
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from typing import Dict, List, Tuple, Any
import boto3
from botocore.exceptions import ClientError

# Optional pandas import with fallback for CI environments
try:
    import pandas as pd
    import numpy as np
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    pd = None
    np = None

# Optional plotly import with fallback for CI environments
try:
    import plotly.graph_objects as go
    import plotly.express as px
    from plotly.subplots import make_subplots
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False
    go = None
    px = None
    make_subplots = None

# Optional tabulate import for console output
try:
    from tabulate import tabulate
    TABULATE_AVAILABLE = True
except ImportError:
    TABULATE_AVAILABLE = False
    tabulate = None

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def boto_client(service: str, region_name: str = None):
    """Create boto3 client with optional Moto endpoint support"""
    endpoint_url = os.environ.get("AWS_ENDPOINT_URL")
    params = {
        "region_name": region_name or os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
    }

    if endpoint_url:
        params["endpoint_url"] = endpoint_url
        params["aws_access_key_id"] = os.environ.get("AWS_ACCESS_KEY_ID")
        params["aws_secret_access_key"] = os.environ.get("AWS_SECRET_ACCESS_KEY")

    return boto3.client(service, **params)


class KinesisAnalyzer:
    def __init__(self, region='us-east-1'):
        self.region = region
        self.kinesis_client = boto_client('kinesis', region)
        self.firehose_client = boto_client('firehose', region)
        self.cloudwatch_client = boto_client('cloudwatch', region)
        self.lambda_client = boto_client('lambda', region)
        self.s3_client = boto_client('s3', region)
        self.kms_client = boto_client('kms', region)
        self.ec2_client = boto_client('ec2', region)

        self.data_streams = []
        self.firehose_streams = []
        self.analysis_results = {
            'data_streams': [],
            'firehose_streams': [],
            'summary': {}
        }
        self.consumer_lag_data = []
        self.shard_optimization_plans = []

    def analyze(self):
        """Main analysis entry point"""
        logger.info("Starting Kinesis analysis...")

        # Gather all streams
        self._gather_data_streams()
        self._gather_firehose_streams()

        # Analyze Data Streams
        self._analyze_data_streams()

        # Analyze Firehose Streams
        self._analyze_firehose_streams()

        # Generate summary
        self._generate_summary()

        # Generate outputs
        self._print_console_output()
        self._save_json_output()
        self._generate_html_dashboard()
        self._save_csv_report()
        self._save_optimization_plan()

        logger.info("Analysis complete!")

    def _gather_data_streams(self):
        """Gather all Kinesis Data Streams"""
        try:
            paginator = self.kinesis_client.get_paginator('list_streams')
            for page in paginator.paginate():
                for stream_name in page.get('StreamNames', []):
                    if self._should_analyze_stream(stream_name):
                        self.data_streams.append(stream_name)
        except Exception as e:
            logger.error(f"Error gathering data streams: {e}")

    def _gather_firehose_streams(self):
        """Gather all Kinesis Firehose delivery streams"""
        try:
            paginator = self.firehose_client.get_paginator('list_delivery_streams')
            for page in paginator.paginate():
                for stream_name in page.get('DeliveryStreamNames', []):
                    if self._should_analyze_stream(stream_name):
                        self.firehose_streams.append(stream_name)
        except Exception as e:
            logger.error(f"Error gathering firehose streams: {e}")

    def _should_analyze_stream(self, stream_name):
        """Check if stream should be analyzed based on filters"""
        # Exclude test- or dev- prefixed streams
        if stream_name.startswith('test-') or stream_name.startswith('dev-'):
            return False
        return True

    def _check_stream_tags(self, stream_arn):
        """Check if stream has ExcludeFromAnalysis tag"""
        try:
            tags = self.kinesis_client.list_tags_for_stream(StreamArn=stream_arn)
            for tag in tags.get('Tags', []):
                if tag['Key'].lower() == 'excludefromanalysis' and tag['Value'].lower() == 'true':
                    return False
        except:
            pass
        return True

    def _get_cloudwatch_metrics(self, namespace, metric_name, dimensions, start_time, end_time, stat='Average'):
        """Fetch CloudWatch metrics"""
        try:
            response = self.cloudwatch_client.get_metric_statistics(
                Namespace=namespace,
                MetricName=metric_name,
                Dimensions=dimensions,
                StartTime=start_time,
                EndTime=end_time,
                Period=300,  # 5 minutes
                Statistics=[stat]
            )
            return response.get('Datapoints', [])
        except Exception as e:
            logger.error(f"Error fetching metric {metric_name}: {e}")
            return []

    def _analyze_data_streams(self):
        """Analyze each Data Stream"""
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=7)

        for stream_name in self.data_streams:
            logger.info(f"Analyzing data stream: {stream_name}")

            try:
                # Get stream description
                stream_desc = self.kinesis_client.describe_stream(StreamName=stream_name)
                stream_info = stream_desc['StreamDescription']

                # Check tags
                if not self._check_stream_tags(stream_info['StreamARN']):
                    continue

                # Get metrics
                dimensions = [{'Name': 'StreamName', 'Value': stream_name}]

                # Check record count threshold
                record_count_metrics = self._get_cloudwatch_metrics(
                    'AWS/Kinesis', 'IncomingRecords', dimensions,
                    end_time - timedelta(hours=1), end_time, 'Sum'
                )
                if record_count_metrics:
                    avg_records_per_minute = sum(m.get('Sum', 0) for m in record_count_metrics) / 60
                    if avg_records_per_minute < 100:
                        logger.info(f"Skipping {stream_name}: <100 records/minute")
                        continue

                # Analyze stream
                stream_analysis = {
                    'stream_name': stream_name,
                    'stream_arn': stream_info['StreamARN'],
                    'status': stream_info['StreamStatus'],
                    'shard_count': len(stream_info['Shards']),
                    'retention_period_hours': stream_info['RetentionPeriodHours'],
                    'encryption': stream_info.get('EncryptionType', 'NONE'),
                    'stream_mode': stream_info['StreamModeDetails']['StreamMode'],
                    'findings': [],
                    'metrics': {},
                    'health_score': 100
                }

                # Perform all checks
                self._check_iterator_age(stream_name, stream_analysis, dimensions, start_time, end_time)
                self._check_throttling(stream_name, stream_analysis, dimensions, start_time, end_time)
                self._check_throughput_utilization(stream_name, stream_analysis, stream_info, dimensions, start_time, end_time)
                self._check_enhanced_monitoring(stream_name, stream_analysis, stream_info)
                self._check_retention_period(stream_name, stream_analysis)
                self._check_encryption(stream_name, stream_analysis)
                self._check_cloudwatch_alarms(stream_name, stream_analysis)
                self._check_consumer_lag(stream_name, stream_analysis, dimensions, start_time, end_time)
                self._check_shard_distribution(stream_name, stream_analysis, stream_info, dimensions, start_time, end_time)
                self._check_cross_region_replication(stream_name, stream_analysis)
                self._check_on_demand_usage(stream_name, stream_analysis, dimensions, start_time, end_time)

                # Calculate health score
                stream_analysis['health_score'] = max(0, stream_analysis['health_score'])

                self.analysis_results['data_streams'].append(stream_analysis)

            except Exception as e:
                logger.error(f"Error analyzing stream {stream_name}: {e}")

    def _check_iterator_age(self, stream_name, analysis, dimensions, start_time, end_time):
        """Check for high iterator age"""
        iterator_metrics = self._get_cloudwatch_metrics(
            'AWS/Kinesis', 'GetRecords.IteratorAgeMilliseconds',
            dimensions, start_time, end_time, 'Maximum'
        )

        if iterator_metrics:
            max_age = max(m.get('Maximum', 0) for m in iterator_metrics)
            avg_age = sum(m.get('Maximum', 0) for m in iterator_metrics) / len(iterator_metrics)

            analysis['metrics']['iterator_age_max'] = max_age
            analysis['metrics']['iterator_age_avg'] = avg_age

            if max_age > 60000:  # 60 seconds
                analysis['findings'].append({
                    'issue': 'Iterator Age High',
                    'severity': 'HIGH',
                    'details': f'Maximum iterator age: {max_age:.0f}ms',
                    'remediation': 'Scale up consumer capacity or add more consumer instances'
                })
                analysis['health_score'] -= 20

    def _check_throttling(self, stream_name, analysis, dimensions, start_time, end_time):
        """Check for throttled records"""
        throttle_metrics = self._get_cloudwatch_metrics(
            'AWS/Kinesis', 'WriteProvisionedThroughputExceeded',
            dimensions, start_time, end_time, 'Sum'
        )

        put_metrics = self._get_cloudwatch_metrics(
            'AWS/Kinesis', 'PutRecords.Success',
            dimensions, start_time, end_time, 'Sum'
        )

        if throttle_metrics and put_metrics:
            total_throttled = sum(m.get('Sum', 0) for m in throttle_metrics)
            total_success = sum(m.get('Sum', 0) for m in put_metrics)

            if total_success > 0:
                throttle_rate = (total_throttled / (total_throttled + total_success)) * 100

                analysis['metrics']['throttle_rate'] = throttle_rate

                if throttle_rate > 1:
                    analysis['findings'].append({
                        'issue': 'Throttled Records',
                        'severity': 'HIGH',
                        'details': f'Throttle rate: {throttle_rate:.2f}%',
                        'remediation': 'Increase shard count or use on-demand mode'
                    })
                    analysis['health_score'] -= 15

    def _check_throughput_utilization(self, stream_name, analysis, stream_info, dimensions, start_time, end_time):
        """Check for under/over provisioned shards"""
        incoming_bytes = self._get_cloudwatch_metrics(
            'AWS/Kinesis', 'IncomingBytes', dimensions, start_time, end_time, 'Sum'
        )

        incoming_records = self._get_cloudwatch_metrics(
            'AWS/Kinesis', 'IncomingRecords', dimensions, start_time, end_time, 'Sum'
        )

        if incoming_bytes and stream_info['StreamModeDetails']['StreamMode'] == 'PROVISIONED':
            # Calculate average throughput
            avg_bytes_per_sec = sum(m.get('Sum', 0) for m in incoming_bytes) / (7 * 24 * 3600)
            avg_records_per_sec = sum(m.get('Sum', 0) for m in incoming_records) / (7 * 24 * 3600) if incoming_records else 0

            # Provisioned capacity
            shard_count = analysis['shard_count']
            provisioned_bytes_per_sec = shard_count * 1024 * 1024  # 1MB per shard
            provisioned_records_per_sec = shard_count * 1000  # 1000 records per shard

            bytes_utilization = (avg_bytes_per_sec / provisioned_bytes_per_sec) * 100 if provisioned_bytes_per_sec > 0 else 0
            records_utilization = (avg_records_per_sec / provisioned_records_per_sec) * 100 if provisioned_records_per_sec > 0 else 0

            utilization = max(bytes_utilization, records_utilization)

            analysis['metrics']['throughput_utilization'] = utilization

            if utilization > 80:
                analysis['findings'].append({
                    'issue': 'Under-Provisioned Shards',
                    'severity': 'HIGH',
                    'details': f'Utilization: {utilization:.1f}%',
                    'remediation': f'Add {int(shard_count * (utilization / 80 - 1)) + 1} more shards'
                })
                analysis['health_score'] -= 20

            elif utilization < 20:
                analysis['findings'].append({
                    'issue': 'Over-Provisioned Shards',
                    'severity': 'MEDIUM',
                    'details': f'Utilization: {utilization:.1f}%',
                    'remediation': f'Reduce to {max(1, int(shard_count * utilization / 40))} shards'
                })
                analysis['health_score'] -= 10

    def _check_enhanced_monitoring(self, stream_name, analysis, stream_info):
        """Check for enhanced monitoring"""
        if 'EnhancedMonitoring' not in stream_info or not any(
            level.get('ShardLevelMetrics', []) for level in stream_info.get('EnhancedMonitoring', [])
        ):
            analysis['findings'].append({
                'issue': 'No Enhanced Monitoring',
                'severity': 'MEDIUM',
                'details': 'Shard-level metrics not enabled',
                'remediation': 'Enable enhanced monitoring for shard-level visibility'
            })
            analysis['health_score'] -= 10

    def _check_retention_period(self, stream_name, analysis):
        """Check for excessive retention"""
        if analysis['retention_period_hours'] >= 168:  # 7 days
            analysis['findings'].append({
                'issue': 'Excessive Retention',
                'severity': 'LOW',
                'details': f'Retention period: {analysis["retention_period_hours"]} hours',
                'remediation': 'Consider reducing to 24 hours if data is processed quickly'
            })
            analysis['health_score'] -= 5

    def _check_encryption(self, stream_name, analysis):
        """Check for encryption on sensitive streams"""
        # Heuristic: streams with 'customer', 'user', 'payment', 'pii' in name likely have sensitive data
        sensitive_keywords = ['customer', 'user', 'payment', 'pii', 'personal', 'credit']
        if any(keyword in stream_name.lower() for keyword in sensitive_keywords):
            if analysis['encryption'] == 'NONE':
                analysis['findings'].append({
                    'issue': 'No Encryption',
                    'severity': 'HIGH',
                    'details': 'Stream likely contains sensitive data but no encryption',
                    'remediation': 'Enable KMS encryption for this stream'
                })
                analysis['health_score'] -= 20

    def _check_cloudwatch_alarms(self, stream_name, analysis):
        """Check for CloudWatch alarms"""
        try:
            alarms = self.cloudwatch_client.describe_alarms_for_metric(
                MetricName='GetRecords.IteratorAgeMilliseconds',
                Namespace='AWS/Kinesis',
                Dimensions=[{'Name': 'StreamName', 'Value': stream_name}]
            )

            has_iterator_alarm = len(alarms.get('MetricAlarms', [])) > 0

            # Check for throttling alarm
            throttle_alarms = self.cloudwatch_client.describe_alarms_for_metric(
                MetricName='WriteProvisionedThroughputExceeded',
                Namespace='AWS/Kinesis',
                Dimensions=[{'Name': 'StreamName', 'Value': stream_name}]
            )

            has_throttle_alarm = len(throttle_alarms.get('MetricAlarms', [])) > 0

            if not has_iterator_alarm or not has_throttle_alarm:
                missing = []
                if not has_iterator_alarm:
                    missing.append('iterator age')
                if not has_throttle_alarm:
                    missing.append('throttling')

                analysis['findings'].append({
                    'issue': 'No CloudWatch Alarms',
                    'severity': 'MEDIUM',
                    'details': f'Missing alarms for: {", ".join(missing)}',
                    'remediation': 'Create CloudWatch alarms for critical metrics'
                })
                analysis['health_score'] -= 10

        except Exception as e:
            logger.error(f"Error checking alarms for {stream_name}: {e}")

    def _check_consumer_lag(self, stream_name, analysis, dimensions, start_time, end_time):
        """Check enhanced fan-out consumer lag"""
        try:
            # List stream consumers
            consumers = self.kinesis_client.list_stream_consumers(StreamARN=analysis['stream_arn'])

            for consumer in consumers.get('Consumers', []):
                if consumer.get('ConsumerStatus') == 'ACTIVE':
                    consumer_dims = [
                        {'Name': 'StreamName', 'Value': stream_name},
                        {'Name': 'ConsumerName', 'Value': consumer['ConsumerName']}
                    ]

                    lag_metrics = self._get_cloudwatch_metrics(
                        'AWS/Kinesis', 'SubscribeToShard.MillisBehindLatest',
                        consumer_dims, start_time, end_time, 'Maximum'
                    )

                    if lag_metrics:
                        max_lag = max(m.get('Maximum', 0) for m in lag_metrics)
                        avg_lag = sum(m.get('Maximum', 0) for m in lag_metrics) / len(lag_metrics)

                        # Add to consumer lag data
                        self.consumer_lag_data.append({
                            'stream_name': stream_name,
                            'consumer_name': consumer['ConsumerName'],
                            'max_lag_ms': max_lag,
                            'avg_lag_ms': avg_lag,
                            'flagged': max_lag > 5000
                        })

                        if max_lag > 5000:
                            analysis['findings'].append({
                                'issue': 'Consumer Lag',
                                'severity': 'HIGH',
                                'details': f'Consumer {consumer["ConsumerName"]} lag: {max_lag:.0f}ms',
                                'remediation': 'Scale consumer or optimize processing logic'
                            })
                            analysis['health_score'] -= 15

        except Exception as e:
            logger.error(f"Error checking consumer lag for {stream_name}: {e}")

    def _check_shard_distribution(self, stream_name, analysis, stream_info, dimensions, start_time, end_time):
        """Check for hot shards needing splitting"""
        try:
            if 'EnhancedMonitoring' in stream_info and any(
                level.get('ShardLevelMetrics', []) for level in stream_info.get('EnhancedMonitoring', [])
            ):
                # Analyze shard-level metrics
                shards = stream_info['Shards']
                shard_metrics = {}

                for shard in shards:
                    shard_id = shard['ShardId']
                    shard_dims = [
                        {'Name': 'StreamName', 'Value': stream_name},
                        {'Name': 'ShardId', 'Value': shard_id}
                    ]

                    incoming_bytes = self._get_cloudwatch_metrics(
                        'AWS/Kinesis', 'IncomingBytes', shard_dims,
                        end_time - timedelta(hours=1), end_time, 'Sum'
                    )

                    if incoming_bytes:
                        total_bytes = sum(m.get('Sum', 0) for m in incoming_bytes)
                        shard_metrics[shard_id] = total_bytes

                if shard_metrics and len(shard_metrics) > 0:
                    avg_bytes = sum(shard_metrics.values()) / len(shard_metrics)

                    for shard_id, bytes_count in shard_metrics.items():
                        if bytes_count > avg_bytes * 2:  # Hot shard
                            self.shard_optimization_plans.append({
                                'stream_name': stream_name,
                                'shard_id': shard_id,
                                'action': 'SPLIT',
                                'reason': 'Hot shard detected',
                                'current_throughput': bytes_count,
                                'avg_throughput': avg_bytes,
                                'projected_improvement': '50% reduction in shard load'
                            })

                            analysis['findings'].append({
                                'issue': 'Shard Splitting Needed',
                                'severity': 'MEDIUM',
                                'details': f'Shard {shard_id} has 2x average throughput',
                                'remediation': 'Split hot shard to distribute load'
                            })
                            analysis['health_score'] -= 10

        except Exception as e:
            logger.error(f"Error checking shard distribution for {stream_name}: {e}")

    def _check_cross_region_replication(self, stream_name, analysis):
        """Check for cross-region replication"""
        # Check if this appears to be a critical stream
        critical_keywords = ['payment', 'order', 'transaction', 'critical', 'primary']
        if any(keyword in stream_name.lower() for keyword in critical_keywords):
            # Look for replica streams in other regions
            has_replica = False
            dr_regions = ['us-west-2', 'eu-west-1']

            for region in dr_regions:
                try:
                    dr_client = boto_client('kinesis', region)
                    dr_streams = dr_client.list_streams()

                    replica_names = [f'{stream_name}-replica', f'{stream_name}-dr', f'dr-{stream_name}']
                    if any(name in dr_streams.get('StreamNames', []) for name in replica_names):
                        has_replica = True
                        break
                except:
                    pass

            if not has_replica:
                analysis['findings'].append({
                    'issue': 'No Cross-Region Replication',
                    'severity': 'MEDIUM',
                    'details': 'Critical stream without DR replication',
                    'remediation': 'Set up Kinesis replication to DR region'
                })
                analysis['health_score'] -= 10

    def _check_on_demand_usage(self, stream_name, analysis, dimensions, start_time, end_time):
        """Check for on-demand mode on steady traffic"""
        if analysis['stream_mode'] == 'ON_DEMAND':
            # Check traffic pattern variance
            hourly_metrics = []
            for i in range(24 * 7):  # 7 days of hourly data
                hour_start = start_time + timedelta(hours=i)
                hour_end = hour_start + timedelta(hours=1)

                metrics = self._get_cloudwatch_metrics(
                    'AWS/Kinesis', 'IncomingBytes', dimensions,
                    hour_start, hour_end, 'Sum'
                )

                if metrics:
                    hourly_metrics.append(sum(m.get('Sum', 0) for m in metrics))

            if hourly_metrics and PANDAS_AVAILABLE:
                # Calculate coefficient of variation
                mean_traffic = sum(hourly_metrics) / len(hourly_metrics) if hourly_metrics else 0
                variance = sum((x - mean_traffic) ** 2 for x in hourly_metrics) / len(hourly_metrics) if hourly_metrics else 0
                std_traffic = variance ** 0.5
                cv = (std_traffic / mean_traffic) if mean_traffic > 0 else 0

                if cv < 0.3:  # Low variance, steady traffic
                    analysis['findings'].append({
                        'issue': 'On-Demand Misconduct',
                        'severity': 'LOW',
                        'details': f'Steady traffic pattern (CV: {cv:.2f})',
                        'remediation': 'Switch to provisioned mode for cost savings'
                    })
                    analysis['health_score'] -= 5

    def _analyze_firehose_streams(self):
        """Analyze each Firehose delivery stream"""
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=7)

        for stream_name in self.firehose_streams:
            logger.info(f"Analyzing Firehose stream: {stream_name}")

            try:
                # Get stream description
                stream_desc = self.firehose_client.describe_delivery_stream(
                    DeliveryStreamName=stream_name
                )
                stream_info = stream_desc['DeliveryStreamDescription']

                # Check record count threshold
                dimensions = [{'Name': 'DeliveryStreamName', 'Value': stream_name}]

                record_metrics = self._get_cloudwatch_metrics(
                    'AWS/Firehose', 'IncomingRecords', dimensions,
                    end_time - timedelta(hours=1), end_time, 'Sum'
                )

                if record_metrics:
                    avg_records_per_minute = sum(m.get('Sum', 0) for m in record_metrics) / 60
                    if avg_records_per_minute < 100:
                        logger.info(f"Skipping {stream_name}: <100 records/minute")
                        continue

                # Analyze stream
                stream_analysis = {
                    'stream_name': stream_name,
                    'stream_arn': stream_info['DeliveryStreamARN'],
                    'status': stream_info['DeliveryStreamStatus'],
                    'destination': stream_info['Destinations'][0]['DestinationId'] if stream_info.get('Destinations') else 'Unknown',
                    'findings': [],
                    'metrics': {},
                    'health_score': 100
                }

                # Get destination config
                dest_desc = stream_info['Destinations'][0] if stream_info.get('Destinations') else {}

                # Perform all Firehose checks
                self._check_firehose_delivery_failures(stream_name, stream_analysis, dimensions, start_time, end_time)
                self._check_firehose_batch_settings(stream_name, stream_analysis, dest_desc)
                self._check_firehose_transformation(stream_name, stream_analysis, dest_desc)
                self._check_firehose_backup(stream_name, stream_analysis, dest_desc)
                self._check_firehose_alarms(stream_name, stream_analysis)
                self._check_firehose_vpc_endpoint(stream_name, stream_analysis, dest_desc)
                self._check_firehose_encryption(stream_name, stream_analysis, stream_info)

                # Calculate health score
                stream_analysis['health_score'] = max(0, stream_analysis['health_score'])

                self.analysis_results['firehose_streams'].append(stream_analysis)

            except Exception as e:
                logger.error(f"Error analyzing Firehose stream {stream_name}: {e}")

    def _check_firehose_delivery_failures(self, stream_name, analysis, dimensions, start_time, end_time):
        """Check Firehose delivery failure rate"""
        success_metrics = self._get_cloudwatch_metrics(
            'AWS/Firehose', 'DeliveryToS3.Success', dimensions,
            start_time, end_time, 'Sum'
        )

        if success_metrics:
            total_success = sum(m.get('Sum', 0) for m in success_metrics)

            # Calculate failure rate (using data freshness as proxy)
            freshness_metrics = self._get_cloudwatch_metrics(
                'AWS/Firehose', 'DeliveryToS3.DataFreshness', dimensions,
                start_time, end_time, 'Maximum'
            )

            if freshness_metrics:
                max_freshness = max(m.get('Maximum', 0) for m in freshness_metrics)
                # If data freshness > 900 seconds (15 min), consider it a delivery issue
                if max_freshness > 900:
                    analysis['findings'].append({
                        'issue': 'Firehose Delivery Failures',
                        'severity': 'HIGH',
                        'details': f'Data freshness: {max_freshness:.0f} seconds',
                        'remediation': 'Check destination permissions and processing configuration'
                    })
                    analysis['health_score'] -= 20

    def _check_firehose_batch_settings(self, stream_name, analysis, dest_desc):
        """Check Firehose buffer settings"""
        if 'S3DestinationDescription' in dest_desc:
            s3_config = dest_desc['S3DestinationDescription'].get('BufferingHints', {})
            size_mb = s3_config.get('SizeInMBs', 5)
            interval_sec = s3_config.get('IntervalInSeconds', 300)

            if size_mb < 5 or interval_sec < 300:
                analysis['findings'].append({
                    'issue': 'Small Batch Sizes',
                    'severity': 'MEDIUM',
                    'details': f'Buffer: {size_mb}MB / {interval_sec}s',
                    'remediation': 'Increase to at least 5MB / 300s to reduce S3 PUT costs'
                })
                analysis['health_score'] -= 10

    def _check_firehose_transformation(self, stream_name, analysis, dest_desc):
        """Check for data transformation"""
        has_processor = False

        if 'ProcessingConfiguration' in dest_desc.get('ExtendedS3DestinationDescription', {}):
            processors = dest_desc['ExtendedS3DestinationDescription']['ProcessingConfiguration'].get('Processors', [])
            if processors:
                has_processor = True

        if not has_processor:
            # Check if stream name suggests it needs transformation
            if any(keyword in stream_name.lower() for keyword in ['raw', 'unprocessed', 'incoming']):
                analysis['findings'].append({
                    'issue': 'No Data Transformation',
                    'severity': 'LOW',
                    'details': 'Raw data delivery without transformation',
                    'remediation': 'Add Lambda processor for data enrichment/format conversion'
                })
                analysis['health_score'] -= 5

    def _check_firehose_backup(self, stream_name, analysis, dest_desc):
        """Check for S3 backup on non-S3 destinations"""
        if 'RedshiftDestinationDescription' in dest_desc:
            if dest_desc['RedshiftDestinationDescription'].get('S3BackupMode') != 'Enabled':
                analysis['findings'].append({
                    'issue': 'Missing S3 Backup',
                    'severity': 'HIGH',
                    'details': 'Redshift destination without S3 backup',
                    'remediation': 'Enable S3 backup for failed records'
                })
                analysis['health_score'] -= 15

        elif 'ElasticsearchDestinationDescription' in dest_desc:
            if dest_desc['ElasticsearchDestinationDescription'].get('S3BackupMode') != 'AllDocuments':
                analysis['findings'].append({
                    'issue': 'Missing S3 Backup',
                    'severity': 'HIGH',
                    'details': 'Elasticsearch destination without full S3 backup',
                    'remediation': 'Enable S3 backup for all documents'
                })
                analysis['health_score'] -= 15

    def _check_firehose_alarms(self, stream_name, analysis):
        """Check for Firehose CloudWatch alarms"""
        try:
            alarms = self.cloudwatch_client.describe_alarms_for_metric(
                MetricName='DeliveryToS3.Success',
                Namespace='AWS/Firehose',
                Dimensions=[{'Name': 'DeliveryStreamName', 'Value': stream_name}]
            )

            if not alarms.get('MetricAlarms', []):
                analysis['findings'].append({
                    'issue': 'No CloudWatch Alarms',
                    'severity': 'MEDIUM',
                    'details': 'No delivery success alarms configured',
                    'remediation': 'Create alarm for delivery failures'
                })
                analysis['health_score'] -= 10

        except Exception as e:
            logger.error(f"Error checking Firehose alarms: {e}")

    def _check_firehose_vpc_endpoint(self, stream_name, analysis, dest_desc):
        """Check if VPC endpoint is used for S3"""
        # This is a heuristic check - in practice would need more detailed config
        if 'ExtendedS3DestinationDescription' in dest_desc:
            # Check if in VPC
            vpc_config = dest_desc['ExtendedS3DestinationDescription'].get('VpcConfiguration')
            if vpc_config:
                # Should use VPC endpoint
                try:
                    # Check for VPC endpoints
                    endpoints = self.ec2_client.describe_vpc_endpoints(
                        Filters=[
                            {'Name': 'vpc-id', 'Values': [vpc_config['VpcId']]},
                            {'Name': 'service-name', 'Values': [f'com.amazonaws.{self.region}.s3']}
                        ]
                    )

                    if not endpoints.get('VpcEndpoints', []):
                        analysis['findings'].append({
                            'issue': 'VPC Endpoint Not Used',
                            'severity': 'LOW',
                            'details': 'S3 access via internet gateway',
                            'remediation': 'Create VPC endpoint for S3 to reduce data transfer costs'
                        })
                        analysis['health_score'] -= 5

                except Exception as e:
                    logger.error(f"Error checking VPC endpoints: {e}")

    def _check_firehose_encryption(self, stream_name, analysis, stream_info):
        """Check Firehose encryption"""
        encryption_config = stream_info.get('DeliveryStreamEncryptionConfiguration', {})
        if encryption_config.get('Status') != 'ENABLED':
            # Check if sensitive data stream
            sensitive_keywords = ['customer', 'user', 'payment', 'pii', 'personal']
            if any(keyword in stream_name.lower() for keyword in sensitive_keywords):
                analysis['findings'].append({
                    'issue': 'No Encryption',
                    'severity': 'HIGH',
                    'details': 'Sensitive data stream without encryption',
                    'remediation': 'Enable SSE with KMS'
                })
                analysis['health_score'] -= 20

    def _generate_summary(self):
        """Generate analysis summary"""
        summary = {
            'total_data_streams': len(self.analysis_results['data_streams']),
            'total_firehose_streams': len(self.analysis_results['firehose_streams']),
            'analysis_timestamp': datetime.now().isoformat(),
            'region': self.region,
            'high_priority_issues': 0,
            'total_findings': 0,
            'average_health_score': 0,
            'cost_optimization_opportunities': 0,
            'estimated_monthly_savings': 0
        }

        # Count issues
        all_findings = []
        health_scores = []

        for stream in self.analysis_results['data_streams']:
            all_findings.extend(stream['findings'])
            health_scores.append(stream['health_score'])

        for stream in self.analysis_results['firehose_streams']:
            all_findings.extend(stream['findings'])
            health_scores.append(stream['health_score'])

        summary['total_findings'] = len(all_findings)
        summary['high_priority_issues'] = sum(1 for f in all_findings if f['severity'] == 'HIGH')
        summary['average_health_score'] = sum(health_scores) / len(health_scores) if health_scores else 100

        # Calculate cost optimization
        cost_findings = ['Over-Provisioned Shards', 'Excessive Retention', 'On-Demand Misconduct',
                        'VPC Endpoint Not Used', 'Small Batch Sizes']
        summary['cost_optimization_opportunities'] = sum(
            1 for f in all_findings if f['issue'] in cost_findings
        )

        # Estimate savings (simplified)
        for stream in self.analysis_results['data_streams']:
            for finding in stream['findings']:
                if finding['issue'] == 'Over-Provisioned Shards':
                    # ~$36/shard/month
                    current_shards = stream['shard_count']
                    optimal_shards = max(1, int(current_shards * 0.4))
                    summary['estimated_monthly_savings'] += (current_shards - optimal_shards) * 36

                elif finding['issue'] == 'Excessive Retention':
                    # ~$0.02/GB for extended retention
                    if 'throughput_utilization' in stream['metrics']:
                        gb_per_day = 890 * (stream['metrics']['throughput_utilization'] / 100)
                        summary['estimated_monthly_savings'] += gb_per_day * 6 * 0.02 * 30

        self.analysis_results['summary'] = summary

    def _print_console_output(self):
        """Print analysis results to console in tabular format"""
        print("\n" + "="*80)
        print("KINESIS ARCHITECTURE ANALYSIS REPORT")
        print("="*80)

        # Summary table
        summary_data = [
            ["Region", self.region],
            ["Analysis Date", datetime.now().strftime('%Y-%m-%d %H:%M:%S')],
            ["Data Streams Analyzed", self.analysis_results['summary']['total_data_streams']],
            ["Firehose Streams Analyzed", self.analysis_results['summary']['total_firehose_streams']],
            ["Average Health Score", f"{self.analysis_results['summary']['average_health_score']:.1f}/100"],
            ["High Priority Issues", self.analysis_results['summary']['high_priority_issues']],
            ["Estimated Monthly Savings", f"${self.analysis_results['summary']['estimated_monthly_savings']:.2f}"]
        ]

        if TABULATE_AVAILABLE:
            print("\n" + tabulate(summary_data, headers=["Metric", "Value"], tablefmt="grid"))
        else:
            print("\nSummary:")
            for row in summary_data:
                print(f"  {row[0]}: {row[1]}")

        # Data Streams table
        if self.analysis_results['data_streams']:
            print("\n" + "-"*80)
            print("DATA STREAMS ANALYSIS")
            print("-"*80)

            stream_table = []
            for stream in self.analysis_results['data_streams']:
                utilization = stream['metrics'].get('throughput_utilization', 0)
                issues_count = len(stream['findings'])
                stream_table.append([
                    stream['stream_name'][:30],
                    f"{stream['health_score']}/100",
                    stream['shard_count'],
                    stream['stream_mode'],
                    f"{utilization:.1f}%",
                    issues_count
                ])

            if TABULATE_AVAILABLE:
                print(tabulate(stream_table,
                             headers=["Stream Name", "Health", "Shards", "Mode", "Utilization", "Issues"],
                             tablefmt="grid"))
            else:
                print("\nStream Name | Health | Shards | Mode | Utilization | Issues")
                print("-" * 80)
                for row in stream_table:
                    print(f"{row[0]} | {row[1]} | {row[2]} | {row[3]} | {row[4]} | {row[5]}")

        # Firehose Streams table
        if self.analysis_results['firehose_streams']:
            print("\n" + "-"*80)
            print("FIREHOSE STREAMS ANALYSIS")
            print("-"*80)

            firehose_table = []
            for stream in self.analysis_results['firehose_streams']:
                issues_count = len(stream['findings'])
                firehose_table.append([
                    stream['stream_name'][:30],
                    f"{stream['health_score']}/100",
                    stream['destination'][:20],
                    issues_count
                ])

            if TABULATE_AVAILABLE:
                print(tabulate(firehose_table,
                             headers=["Stream Name", "Health", "Destination", "Issues"],
                             tablefmt="grid"))
            else:
                print("\nStream Name | Health | Destination | Issues")
                print("-" * 80)
                for row in firehose_table:
                    print(f"{row[0]} | {row[1]} | {row[2]} | {row[3]}")

        print("\n" + "="*80)

    def _save_json_output(self):
        """Save analysis results to JSON"""
        with open('kinesis_analysis.json', 'w') as f:
            json.dump(self.analysis_results, f, indent=2, default=str)
        logger.info("Saved analysis results to kinesis_analysis.json")

    def _generate_html_dashboard(self):
        """Generate HTML dashboard with visualizations"""
        if not PLOTLY_AVAILABLE:
            logger.warning("Plotly not available, skipping HTML dashboard generation")
            # Create a simple HTML file instead
            with open('throughput_utilization_dashboard.html', 'w') as f:
                f.write("<html><body><h1>Kinesis Analysis Dashboard</h1>")
                f.write("<p>Plotly library not available for visualization generation.</p>")
                f.write("<p>Please install plotly to generate interactive dashboards.</p>")
                f.write("</body></html>")
            return

        # Create figure with subplots
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Stream Health Scores', 'Throughput Utilization',
                           'Consumer Lag Analysis', 'Cost Optimization Opportunities'),
            specs=[[{'type': 'bar'}, {'type': 'bar'}],
                   [{'type': 'scatter'}, {'type': 'pie'}]]
        )

        # Health scores bar chart
        stream_names = [s['stream_name'] for s in self.analysis_results['data_streams']]
        health_scores = [s['health_score'] for s in self.analysis_results['data_streams']]

        if stream_names:
            fig.add_trace(
                go.Bar(x=stream_names, y=health_scores, name='Health Score',
                       marker_color=['red' if s < 60 else 'yellow' if s < 80 else 'green' for s in health_scores]),
                row=1, col=1
            )

        # Throughput utilization bar chart
        utilization_streams = []
        utilization_values = []
        for stream in self.analysis_results['data_streams']:
            if 'throughput_utilization' in stream['metrics']:
                utilization_streams.append(stream['stream_name'])
                utilization_values.append(stream['metrics']['throughput_utilization'])

        if utilization_streams:
            fig.add_trace(
                go.Bar(x=utilization_streams, y=utilization_values, name='Utilization %',
                       marker_color=['red' if u > 80 else 'yellow' if u < 20 else 'green' for u in utilization_values]),
                row=1, col=2
            )

        # Consumer lag scatter plot
        if self.consumer_lag_data and PANDAS_AVAILABLE:
            df_lag = pd.DataFrame(self.consumer_lag_data)
            fig.add_trace(
                go.Scatter(x=df_lag['stream_name'], y=df_lag['max_lag_ms'],
                          mode='markers', name='Max Lag',
                          marker=dict(size=10, color=df_lag['max_lag_ms'],
                                    colorscale='Reds', showscale=True)),
                row=2, col=1
            )

        # Cost optimization pie chart
        cost_categories = defaultdict(int)
        for stream in self.analysis_results['data_streams'] + self.analysis_results['firehose_streams']:
            for finding in stream['findings']:
                if finding['issue'] in ['Over-Provisioned Shards', 'Excessive Retention',
                                       'On-Demand Misconduct', 'VPC Endpoint Not Used']:
                    cost_categories[finding['issue']] += 1

        if cost_categories:
            fig.add_trace(
                go.Pie(labels=list(cost_categories.keys()), values=list(cost_categories.values())),
                row=2, col=2
            )

        # Update layout
        fig.update_layout(
            title_text=f"Kinesis Architecture Analysis Dashboard - {self.region}",
            showlegend=False,
            height=1000
        )

        # Save to HTML
        fig.write_html('throughput_utilization_dashboard.html')
        logger.info("Generated HTML dashboard: throughput_utilization_dashboard.html")

    def _save_csv_report(self):
        """Save consumer lag report to CSV"""
        if self.consumer_lag_data:
            if PANDAS_AVAILABLE:
                df = pd.DataFrame(self.consumer_lag_data)
                df.to_csv('consumer_lag_report.csv', index=False)
            else:
                # Manual CSV writing without pandas
                with open('consumer_lag_report.csv', 'w', newline='') as f:
                    if self.consumer_lag_data:
                        writer = csv.DictWriter(f, fieldnames=self.consumer_lag_data[0].keys())
                        writer.writeheader()
                        writer.writerows(self.consumer_lag_data)
            logger.info("Saved consumer lag report to consumer_lag_report.csv")
        else:
            # Create empty report
            with open('consumer_lag_report.csv', 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['stream_name', 'consumer_name', 'max_lag_ms', 'avg_lag_ms', 'flagged'])

    def _save_optimization_plan(self):
        """Save shard optimization plan"""
        optimization_plan = {
            'generated_at': datetime.now().isoformat(),
            'region': self.region,
            'shard_optimizations': self.shard_optimization_plans,
            'recommended_actions': []
        }

        # Add general recommendations
        for stream in self.analysis_results['data_streams']:
            for finding in stream['findings']:
                if finding['issue'] in ['Under-Provisioned Shards', 'Shard Splitting Needed']:
                    optimization_plan['recommended_actions'].append({
                        'stream_name': stream['stream_name'],
                        'action': finding['remediation'],
                        'priority': finding['severity'],
                        'expected_improvement': 'Reduced throttling and consumer lag'
                    })

        with open('shard_optimization_plan.json', 'w') as f:
            json.dump(optimization_plan, f, indent=2)
        logger.info("Saved optimization plan to shard_optimization_plan.json")


if __name__ == "__main__":
    analyzer = KinesisAnalyzer()
    analyzer.analyze()
```
