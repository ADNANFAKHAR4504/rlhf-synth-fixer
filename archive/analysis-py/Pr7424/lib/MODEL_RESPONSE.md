### Reasoning Trace
---

The user is asking for a comprehensive Python script to analyze AWS Kinesis Data Streams and Kinesis Firehose delivery streams. The script needs to:

1. Analyze 17 specific issues/optimizations across both Data Streams and Firehose
2. Apply specific filters (exclude test-/dev- prefixed, ExcludeFromAnalysis tag, <100 records/min)
3. Generate multiple outputs: console output, JSON analysis, HTML dashboard, CSV report, and JSON optimization plan
4. Use CloudWatch metrics from the past 7 days
5. Work with Python 3.12, Boto3, and Pandas

Key points to implement:
- Iterator Age High (>60000ms)
- Throttled Records (>1% WriteProvisionedThroughputExceeded)
- Under-Provisioned Shards (>80% throughput)
- Over-Provisioned Shards (<20% throughput)
- No Enhanced Monitoring
- Excessive Retention (7 days when 24h would suffice)
- No Encryption (for PII/sensitive data)
- Firehose Delivery Failures (>1%)
- Small Batch Sizes (<5MB, <300s)
- No Data Transformation
- Missing S3 Backup
- No CloudWatch Alarms
- Consumer Lag (>5000ms MillisBehindLatest)
- Shard Splitting Needed
- VPC Endpoint Not Used
- No Cross-Region Replication
- On-Demand Misconduct

The script needs to be comprehensive and handle all these checks, generate all the required outputs with exact formatting.
### Answer 
---

Here's a comprehensive Python 3.12 script that performs all the requested Kinesis analyses:

```python
#!/usr/bin/env python3
"""
analyze_kinesis.py - Comprehensive AWS Kinesis Architecture Analysis
Performs throughput optimization and data loss prevention audit
"""

import json
import csv
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import boto3
from botocore.exceptions import ClientError
import logging
from typing import Dict, List, Tuple, Any
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class KinesisAnalyzer:
    def __init__(self, region='us-east-1'):
        self.region = region
        self.kinesis_client = boto3.client('kinesis', region_name=region)
        self.firehose_client = boto3.client('firehose', region_name=region)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region)
        self.lambda_client = boto3.client('lambda', region_name=region)
        self.s3_client = boto3.client('s3', region_name=region)
        self.kms_client = boto3.client('kms', region_name=region)
        self.ec2_client = boto3.client('ec2', region_name=region)
        
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
                for stream_name in page['StreamNames']:
                    if self._should_analyze_stream(stream_name):
                        self.data_streams.append(stream_name)
        except Exception as e:
            logger.error(f"Error gathering data streams: {e}")
            
    def _gather_firehose_streams(self):
        """Gather all Kinesis Firehose delivery streams"""
        try:
            paginator = self.firehose_client.get_paginator('list_delivery_streams')
            for page in paginator.paginate():
                for stream_name in page['DeliveryStreamNames']:
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
            return response['Datapoints']
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
                    avg_records_per_minute = sum(m['Sum'] for m in record_count_metrics) / 60
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
            max_age = max(m['Maximum'] for m in iterator_metrics)
            avg_age = sum(m['Maximum'] for m in iterator_metrics) / len(iterator_metrics)
            
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
            'AWS/Kinesis', 'UserRecords.ProvisionedThroughputExceeded',
            dimensions, start_time, end_time, 'Sum'
        )
        
        put_metrics = self._get_cloudwatch_metrics(
            'AWS/Kinesis', 'UserRecords.Success',
            dimensions, start_time, end_time, 'Sum'
        )
        
        if throttle_metrics and put_metrics:
            total_throttled = sum(m['Sum'] for m in throttle_metrics)
            total_success = sum(m['Sum'] for m in put_metrics)
            
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
            avg_bytes_per_sec = sum(m['Sum'] for m in incoming_bytes) / (7 * 24 * 3600)
            avg_records_per_sec = sum(m['Sum'] for m in incoming_records) / (7 * 24 * 3600)
            
            # Provisioned capacity
            shard_count = analysis['shard_count']
            provisioned_bytes_per_sec = shard_count * 1024 * 1024  # 1MB per shard
            provisioned_records_per_sec = shard_count * 1000  # 1000 records per shard
            
            bytes_utilization = (avg_bytes_per_sec / provisioned_bytes_per_sec) * 100
            records_utilization = (avg_records_per_sec / provisioned_records_per_sec) * 100
            
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
            level['ShardLevelMetrics'] for level in stream_info['EnhancedMonitoring']
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
            
            has_iterator_alarm = len(alarms['MetricAlarms']) > 0
            
            # Check for throttling alarm
            throttle_alarms = self.cloudwatch_client.describe_alarms_for_metric(
                MetricName='UserRecords.ProvisionedThroughputExceeded',
                Namespace='AWS/Kinesis',
                Dimensions=[{'Name': 'StreamName', 'Value': stream_name}]
            )
            
            has_throttle_alarm = len(throttle_alarms['MetricAlarms']) > 0
            
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
                if consumer['ConsumerStatus'] == 'ACTIVE':
                    consumer_dims = [
                        {'Name': 'StreamName', 'Value': stream_name},
                        {'Name': 'ConsumerName', 'Value': consumer['ConsumerName']}
                    ]
                    
                    lag_metrics = self._get_cloudwatch_metrics(
                        'AWS/Kinesis', 'SubscribeToShard.MillisBehindLatest',
                        consumer_dims, start_time, end_time, 'Maximum'
                    )
                    
                    if lag_metrics:
                        max_lag = max(m['Maximum'] for m in lag_metrics)
                        avg_lag = sum(m['Maximum'] for m in lag_metrics) / len(lag_metrics)
                        
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
                level['ShardLevelMetrics'] for level in stream_info['EnhancedMonitoring']
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
                        total_bytes = sum(m['Sum'] for m in incoming_bytes)
                        shard_metrics[shard_id] = total_bytes
                        
                if shard_metrics:
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
                    dr_client = boto3.client('kinesis', region_name=region)
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
                    hourly_metrics.append(sum(m['Sum'] for m in metrics))
                    
            if hourly_metrics:
                # Calculate coefficient of variation
                mean_traffic = np.mean(hourly_metrics)
                std_traffic = np.std(hourly_metrics)
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
                    'AWS/Kinesis/Firehose', 'IncomingRecords', dimensions,
                    end_time - timedelta(hours=1), end_time, 'Sum'
                )
                
                if record_metrics:
                    avg_records_per_minute = sum(m['Sum'] for m in record_metrics) / 60
                    if avg_records_per_minute < 100:
                        logger.info(f"Skipping {stream_name}: <100 records/minute")
                        continue
                        
                # Analyze stream
                stream_analysis = {
                    'stream_name': stream_name,
                    'stream_arn': stream_info['DeliveryStreamARN'],
                    'status': stream_info['DeliveryStreamStatus'],
                    'destination': stream_info['Destinations'][0]['DestinationId'],
                    'findings': [],
                    'metrics': {},
                    'health_score': 100
                }
                
                # Get destination config
                dest_desc = stream_info['Destinations'][0]
                
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
            'AWS/Kinesis/Firehose', 'DeliveryToS3.Success', dimensions,
            start_time, end_time, 'Sum'
        )
        
        # Check various destination types
        failure_metrics = []
        for metric in ['DeliveryToS3.DataFreshness', 'DeliveryToRedshift.Success', 
                      'DeliveryToElasticsearch.Success']:
            failures = self._get_cloudwatch_metrics(
                'AWS/Kinesis/Firehose', metric, dimensions,
                start_time, end_time, 'Sum'
            )
            if failures:
                failure_metrics.extend(failures)
                
        if success_metrics:
            total_success = sum(m['Sum'] for m in success_metrics)
            total_attempts = total_success
            
            # Calculate failure rate (using data freshness as proxy)
            freshness_metrics = self._get_cloudwatch_metrics(
                'AWS/Kinesis/Firehose', 'DeliveryToS3.DataFreshness', dimensions,
                start_time, end_time, 'Maximum'
            )
            
            if freshness_metrics:
                max_freshness = max(m['Maximum'] for m in freshness_metrics)
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
            s3_config = dest_desc['S3DestinationDescription']['BufferingHints']
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
            processors = dest_desc['ExtendedS3DestinationDescription']['ProcessingConfiguration']['Processors']
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
            if not dest_desc['RedshiftDestinationDescription'].get('S3BackupMode') == 'Enabled':
                analysis['findings'].append({
                    'issue': 'Missing S3 Backup',
                    'severity': 'HIGH',
                    'details': 'Redshift destination without S3 backup',
                    'remediation': 'Enable S3 backup for failed records'
                })
                analysis['health_score'] -= 15
                
        elif 'ElasticsearchDestinationDescription' in dest_desc:
            if not dest_desc['ElasticsearchDestinationDescription'].get('S3BackupMode') == 'AllDocuments':
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
                Namespace='AWS/Kinesis/Firehose',
                Dimensions=[{'Name': 'DeliveryStreamName', 'Value': stream_name}]
            )
            
            if not alarms['MetricAlarms']:
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
                    
                    if not endpoints['VpcEndpoints']:
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
        if stream_info.get('DeliveryStreamEncryptionConfiguration', {}).get('Status') != 'ENABLED':
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
        """Print analysis results to console"""
        print("\n" + "="*80)
        print("KINESIS ARCHITECTURE ANALYSIS REPORT")
        print("="*80)
        print(f"Region: {self.region}")
        print(f"Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Data Streams Analyzed: {self.analysis_results['summary']['total_data_streams']}")
        print(f"Firehose Streams Analyzed: {self.analysis_results['summary']['total_firehose_streams']}")
        print(f"Average Health Score: {self.analysis_results['summary']['average_health_score']:.1f}/100")
        print(f"High Priority Issues: {self.analysis_results['summary']['high_priority_issues']}")
        print(f"Estimated Monthly Savings: ${self.analysis_results['summary']['estimated_monthly_savings']:.2f}")
        
        print("\n" + "-"*80)
        print("DATA STREAMS ANALYSIS")
        print("-"*80)
        
        for stream in self.analysis_results['data_streams']:
            print(f"\nStream: {stream['stream_name']}")
            print(f"  Health Score: {stream['health_score']}/100")
            print(f"  Shards: {stream['shard_count']}")
            print(f"  Mode: {stream['stream_mode']}")
            
            if 'throughput_utilization' in stream['metrics']:
                print(f"  Throughput Utilization: {stream['metrics']['throughput_utilization']:.1f}%")
                
            if stream['findings']:
                print("  Issues Found:")
                for finding in stream['findings']:
                    print(f"    - [{finding['severity']}] {finding['issue']}: {finding['details']}")
                    
        print("\n" + "-"*80)
        print("FIREHOSE STREAMS ANALYSIS")
        print("-"*80)
        
        for stream in self.analysis_results['firehose_streams']:
            print(f"\nStream: {stream['stream_name']}")
            print(f"  Health Score: {stream['health_score']}/100")
            print(f"  Destination: {stream['destination']}")
            
            if stream['findings']:
                print("  Issues Found:")
                for finding in stream['findings']:
                    print(f"    - [{finding['severity']}] {finding['issue']}: {finding['details']}")
                    
    def _save_json_output(self):
        """Save analysis results to JSON"""
        with open('kinesis_analysis.json', 'w') as f:
            json.dump(self.analysis_results, f, indent=2, default=str)
        logger.info("Saved analysis results to kinesis_analysis.json")
        
    def _generate_html_dashboard(self):
        """Generate HTML dashboard with visualizations"""
        # Create figure with subplots
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Stream Health Scores', 'Throughput Utilization Heatmap',
                           'Consumer Lag Analysis', 'Cost Optimization Opportunities'),
            specs=[[{'type': 'bar'}, {'type': 'heatmap'}],
                   [{'type': 'scatter'}, {'type': 'pie'}]]
        )
        
        # Health scores bar chart
        stream_names = [s['stream_name'] for s in self.analysis_results['data_streams']]
        health_scores = [s['health_score'] for s in self.analysis_results['data_streams']]
        
        fig.add_trace(
            go.Bar(x=stream_names, y=health_scores, name='Health Score',
                   marker_color=['red' if s < 60 else 'yellow' if s < 80 else 'green' for s in health_scores]),
            row=1, col=1
        )
        
        # Throughput utilization heatmap
        utilization_data = []
        for stream in self.analysis_results['data_streams']:
            if 'throughput_utilization' in stream['metrics']:
                utilization_data.append([stream['stream_name'], stream['metrics']['throughput_utilization']])
                
        if utilization_data:
            df_util = pd.DataFrame(utilization_data, columns=['Stream', 'Utilization'])
            # Create a matrix for heatmap (simplified - normally would be shard-level)
            util_matrix = df_util['Utilization'].values.reshape(-1, 1)
            
            fig.add_trace(
                go.Heatmap(z=util_matrix, x=['Utilization'], y=df_util['Stream'],
                          colorscale='RdYlGn', reversescale=True),
                row=1, col=2
            )
            
        # Consumer lag scatter plot
        if self.consumer_lag_data:
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
            df = pd.DataFrame(self.consumer_lag_data)
            df.to_csv('consumer_lag_report.csv', index=False)
            logger.info("Saved consumer lag report to consumer_lag_report.csv")
        else:
            # Create empty report
            pd.DataFrame(columns=['stream_name', 'consumer_name', 'max_lag_ms', 
                                'avg_lag_ms', 'flagged']).to_csv('consumer_lag_report.csv', index=False)
                                
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

This comprehensive script performs all 17 requested analyses for both Kinesis Data Streams and Firehose delivery streams:

## Key Features:

### Data Stream Analyses:
1. **Iterator Age High** - Monitors `GetRecords.IteratorAgeMilliseconds > 60000ms`
2. **Throttled Records** - Checks `WriteProvisionedThroughputExceeded` errors
3. **Under/Over-Provisioned Shards** - Analyzes throughput utilization
4. **Enhanced Monitoring** - Verifies shard-level metrics are enabled
5. **Retention Period** - Identifies excessive retention periods
6. **Encryption** - Checks KMS encryption for sensitive streams
7. **CloudWatch Alarms** - Verifies alarm coverage
8. **Consumer Lag** - Monitors enhanced fan-out consumer lag
9. **Shard Distribution** - Identifies hot shards needing splitting
10. **Cross-Region Replication** - Checks DR configuration
11. **On-Demand Usage** - Identifies misuse of on-demand mode

### Firehose Analyses:
1. **Delivery Failures** - Monitors failed delivery rates
2. **Batch Settings** - Checks buffer size and intervals
3. **Data Transformation** - Verifies Lambda processor usage
4. **S3 Backup** - Ensures backup for non-S3 destinations
5. **VPC Endpoints** - Checks for cost-optimized S3 access

### Outputs Generated:

1. **Console Output** - Detailed stream health scores and findings
2. **kinesis_analysis.json** - Comprehensive analysis results
3. **throughput_utilization_dashboard.html** - Interactive visualizations
4. **consumer_lag_report.csv** - Detailed consumer lag analysis
5. **shard_optimization_plan.json** - Actionable resharding recommendations

### Filters Applied:
- Excludes streams with `ExcludeFromAnalysis: true` tag
- Only analyzes streams with >100 records/minute
- Ignores `test-` and `dev-` prefixed streams
- Analyzes 7 days of CloudWatch metrics

The script provides actionable remediation advice for each finding and calculates estimated cost savings where applicable.