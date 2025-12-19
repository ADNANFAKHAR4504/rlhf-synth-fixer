import json
import base64
import boto3
import os
from datetime import datetime
from decimal import Decimal
import logging
from typing import Dict, List, Any
import hashlib

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
events = boto3.client('events')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
ALERT_THRESHOLD = int(os.environ['ALERT_THRESHOLD'])
EVENT_BUS_NAME = os.environ['EVENT_BUS_NAME']
ENVIRONMENT = os.environ['ENVIRONMENT']

class TrafficDataProcessor:
    """Process traffic sensor data from Kinesis stream"""
    
    def __init__(self):
        self.table = dynamodb.Table(TABLE_NAME)
        self.metrics_buffer = []
        self.alerts_buffer = []
        self.processed_count = 0
        self.error_count = 0
    
    def process_batch(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Process a batch of Kinesis records"""
        batch_items = []
        
        for record in event['Records']:
            try:
                # Decode and parse sensor data
                sensor_data = self._decode_kinesis_record(record)
                
                # Validate and enrich data
                processed_data = self._process_sensor_data(sensor_data)
                
                # Prepare for DynamoDB batch write
                batch_items.append({
                    'PutRequest': {
                        'Item': processed_data
                    }
                })
                
                # Check for alerts
                self._check_congestion_alert(processed_data)
                
                # Collect metrics
                self._collect_metrics(processed_data)
                
                self.processed_count += 1
                
            except Exception as e:
                logger.error(f"Error processing record: {str(e)}", exc_info=True)
                self.error_count += 1
                self._record_error_metric(str(e))
        
        # Write to DynamoDB in batches
        self._batch_write_to_dynamodb(batch_items)
        
        # Send alerts
        self._send_alerts()
        
        # Publish custom metrics
        self._publish_metrics()
        
        return {
            'statusCode': 200,
            'batchItemsProcessed': self.processed_count,
            'errors': self.error_count,
            'alertsSent': len(self.alerts_buffer)
        }
    
    def _decode_kinesis_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Decode Kinesis record data"""
        payload = base64.b64decode(record['kinesis']['data']).decode('utf-8')
        return json.loads(payload)
    
    def _process_sensor_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Process and validate sensor data"""
        # Validate required fields
        required_fields = ['sensor_id', 'zone_id', 'vehicle_count', 'avg_speed', 'congestion_index']
        for field in required_fields:
            if field not in data:
                raise ValueError(f"Missing required field: {field}")
        
        # Process timestamp first (needed for unique ID)
        timestamp = data.get('timestamp', datetime.utcnow().isoformat())
        data_with_timestamp = {**data, 'timestamp': timestamp}
        
        # Generate unique ID for deduplication
        unique_id = self._generate_unique_id(data_with_timestamp)
        
        # Calculate additional metrics
        traffic_flow_score = self._calculate_traffic_flow_score(
            data['vehicle_count'],
            data['avg_speed'],
            data['congestion_index']
        )
        
        processed_item = {
            'sensor_id': str(data['sensor_id']),
            'zone_id': str(data['zone_id']),
            'timestamp': timestamp,
            'unique_id': unique_id,
            'vehicle_count': int(data['vehicle_count']),
            'avg_speed': Decimal(str(round(float(data['avg_speed']), 2))),
            'congestion_index': Decimal(str(round(float(data['congestion_index']), 2))),
            'traffic_flow_score': Decimal(str(round(traffic_flow_score, 2))),
            'processed_at': datetime.utcnow().isoformat(),
            'environment': ENVIRONMENT,
            'ttl': int(datetime.utcnow().timestamp()) + (86400 * 7)  # 7 days TTL
        }
        
        # Add optional fields
        if 'temperature' in data:
            processed_item['temperature'] = Decimal(str(data['temperature']))
        
        if 'weather_condition' in data:
            processed_item['weather_condition'] = str(data['weather_condition'])
        
        return processed_item
    
    def _generate_unique_id(self, data: Dict[str, Any]) -> str:
        """Generate unique ID for deduplication"""
        unique_string = f"{data['sensor_id']}_{data['timestamp']}_{data['vehicle_count']}"
        return hashlib.md5(unique_string.encode()).hexdigest()
    
    def _calculate_traffic_flow_score(self, vehicle_count: int, avg_speed: float, congestion_index: float) -> float:
        """Calculate composite traffic flow score"""
        # Normalize values
        speed_factor = min(avg_speed / 60.0, 1.0)  # Assume 60 mph is optimal
        volume_factor = min(vehicle_count / 100.0, 1.0)  # Normalize to 100 vehicles
        congestion_factor = (100 - congestion_index) / 100.0
        
        # Weighted average
        flow_score = (speed_factor * 0.4 + volume_factor * 0.3 + congestion_factor * 0.3) * 100
        return max(0, min(100, flow_score))
    
    def _check_congestion_alert(self, data: Dict[str, Any]) -> None:
        """Check if congestion alert should be triggered"""
        congestion_index = float(data['congestion_index'])
        
        if congestion_index > ALERT_THRESHOLD:
            alert_level = 'CRITICAL' if congestion_index > 90 else 'WARNING'
            
            alert_event = {
                'Source': 'traffic.analytics',
                'DetailType': 'CongestionAlert',
                'Detail': json.dumps({
                    'alert_id': data['unique_id'],
                    'sensor_id': data['sensor_id'],
                    'zone_id': data['zone_id'],
                    'congestion_index': float(congestion_index),
                    'vehicle_count': data['vehicle_count'],
                    'avg_speed': float(data['avg_speed']),
                    'traffic_flow_score': float(data['traffic_flow_score']),
                    'alert_level': alert_level,
                    'timestamp': data['timestamp'],
                    'threshold': ALERT_THRESHOLD
                }),
                'EventBusName': EVENT_BUS_NAME
            }
            
            self.alerts_buffer.append(alert_event)
    
    def _collect_metrics(self, data: Dict[str, Any]) -> None:
        """Collect metrics for CloudWatch"""
        zone_id = data['zone_id']
        
        metrics = [
            {
                'MetricName': 'ProcessedSensorData',
                'Value': 1,
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'Zone', 'Value': zone_id},
                    {'Name': 'Environment', 'Value': ENVIRONMENT}
                ]
            },
            {
                'MetricName': 'CongestionIndex',
                'Value': float(data['congestion_index']),
                'Unit': 'None',
                'Dimensions': [
                    {'Name': 'Zone', 'Value': zone_id},
                    {'Name': 'SensorId', 'Value': data['sensor_id']}
                ]
            },
            {
                'MetricName': 'VehicleCount',
                'Value': data['vehicle_count'],
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'Zone', 'Value': zone_id}
                ]
            },
            {
                'MetricName': 'TrafficFlowScore',
                'Value': float(data['traffic_flow_score']),
                'Unit': 'None',
                'Dimensions': [
                    {'Name': 'Zone', 'Value': zone_id}
                ]
            }
        ]
        
        self.metrics_buffer.extend(metrics)
    
    def _record_error_metric(self, error_type: str) -> None:
        """Record error metrics"""
        self.metrics_buffer.append({
            'MetricName': 'ProcessingErrors',
            'Value': 1,
            'Unit': 'Count',
            'Dimensions': [
                {'Name': 'ErrorType', 'Value': error_type[:50]},  # Limit dimension value length
                {'Name': 'Environment', 'Value': ENVIRONMENT}
            ]
        })
    
    def _batch_write_to_dynamodb(self, items: List[Dict[str, Any]]) -> None:
        """Write items to DynamoDB in batches"""
        # DynamoDB batch write limit is 25 items
        for i in range(0, len(items), 25):
            batch = items[i:i + 25]
            
            try:
                response = dynamodb.batch_write_item(
                    RequestItems={
                        TABLE_NAME: batch
                    }
                )
                
                # Handle unprocessed items
                unprocessed = response.get('UnprocessedItems', {}).get(TABLE_NAME, [])
                if unprocessed:
                    logger.warning(f"Unprocessed items: {len(unprocessed)}")
                    # In production, implement retry logic here
                
            except Exception as e:
                logger.error(f"DynamoDB batch write error: {str(e)}")
                self._record_error_metric('DynamoDBWriteError')
    
    def _send_alerts(self) -> None:
        """Send alerts to EventBridge"""
        if not self.alerts_buffer:
            return
        
        # EventBridge put_events limit is 10 entries
        for i in range(0, len(self.alerts_buffer), 10):
            batch = self.alerts_buffer[i:i + 10]
            
            try:
                response = events.put_events(Entries=batch)
                
                if response['FailedEntryCount'] > 0:
                    logger.warning(f"Failed to send {response['FailedEntryCount']} alerts")
                    
            except Exception as e:
                logger.error(f"EventBridge put_events error: {str(e)}")
                self._record_error_metric('EventBridgeError')
    
    def _publish_metrics(self) -> None:
        """Publish custom metrics to CloudWatch"""
        if not self.metrics_buffer:
            return
        
        # CloudWatch put_metric_data limit is 20 metrics
        for i in range(0, len(self.metrics_buffer), 20):
            batch = self.metrics_buffer[i:i + 20]
            
            try:
                cloudwatch.put_metric_data(
                    Namespace='TrafficAnalytics',
                    MetricData=batch
                )
            except Exception as e:
                logger.error(f"CloudWatch metrics error: {str(e)}")

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Main Lambda handler"""
    logger.info(f"Processing {len(event['Records'])} Kinesis records")
    
    processor = TrafficDataProcessor()
    result = processor.process_batch(event)
    
    logger.info(f"Processing complete: {result}")
    return result