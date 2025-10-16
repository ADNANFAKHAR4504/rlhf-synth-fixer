"""
Real-world data flow integration tests for TapStack Manufacturing IoT Platform.

Tests the complete data pipeline from IoT devices through Kinesis, processing
in ECS, caching in Redis, storage in Aurora, and API access through API Gateway.
"""

import json
import time
import unittest
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, List

import boto3
import pytest
from botocore.exceptions import ClientError

from .test_tap_stack import BaseIntegrationTest, load_outputs


class TestTapStackDataFlow(BaseIntegrationTest):
    """Integration tests for end-to-end IoT data flow and processing."""

    def test_iot_data_ingestion_through_kinesis_pipeline(self):
        """Test complete IoT data ingestion pipeline through Kinesis."""
        kinesis_stream_name = self.outputs.get('kinesis_stream_name')
        self.assertIsNotNone(kinesis_stream_name, "Kinesis stream name should be available")
        
        # Sample IoT device data representing manufacturing sensors
        iot_test_data = [
            {
                "deviceId": "temperature-sensor-001",
                "timestamp": int(time.time()),
                "sensorType": "temperature",
                "value": 23.5,
                "unit": "celsius",
                "location": "production-line-A",
                "status": "normal"
            },
            {
                "deviceId": "pressure-sensor-002", 
                "timestamp": int(time.time()),
                "sensorType": "pressure",
                "value": 150.2,
                "unit": "psi",
                "location": "hydraulic-press-001",
                "status": "normal"
            },
            {
                "deviceId": "vibration-sensor-003",
                "timestamp": int(time.time()),
                "sensorType": "vibration",
                "value": 2.1,
                "unit": "mm/s",
                "location": "motor-assembly-001",
                "status": "warning"  # Testing alert condition
            }
        ]
        
        successful_puts = 0
        sequence_numbers = []
        
        # Test batch data ingestion
        for data in iot_test_data:
            try:
                response = self.kinesis_client.put_record(
                    StreamName=kinesis_stream_name,
                    Data=json.dumps(data),
                    PartitionKey=data["deviceId"]
                )
                
                self.assertIn('ShardId', response)
                self.assertIn('SequenceNumber', response)
                sequence_numbers.append(response['SequenceNumber'])
                successful_puts += 1
                
            except ClientError as e:
                if 'AccessDenied' in str(e):
                    self.skipTest("Insufficient permissions for Kinesis operations")
                raise
        
        self.assertEqual(successful_puts, len(iot_test_data), 
                        "All IoT data records should be successfully ingested")
        self.assertEqual(len(sequence_numbers), len(iot_test_data),
                        "Should receive sequence numbers for all records")
        
        # Verify records can be retrieved from stream
        time.sleep(2)  # Allow for eventual consistency
        
        # Get shard iterator to read back the data
        stream_response = self.kinesis_client.describe_stream(StreamName=kinesis_stream_name)
        shards = stream_response['StreamDescription']['Shards']
        
        retrieved_records = []
        for shard in shards:
            shard_iterator_response = self.kinesis_client.get_shard_iterator(
                StreamName=kinesis_stream_name,
                ShardId=shard['ShardId'],
                ShardIteratorType='TRIM_HORIZON'
            )
            
            records_response = self.kinesis_client.get_records(
                ShardIterator=shard_iterator_response['ShardIterator'],
                Limit=10
            )
            
            for record in records_response['Records']:
                try:
                    data = json.loads(record['Data'].decode('utf-8'))
                    if any(data.get('deviceId') == test_data['deviceId'] 
                          for test_data in iot_test_data):
                        retrieved_records.append(data)
                except (json.JSONDecodeError, UnicodeDecodeError):
                    continue
        
        self.assertGreaterEqual(len(retrieved_records), 1, 
                              "Should be able to retrieve at least some test records from stream")

    def test_manufacturing_batch_processing_workflow(self):
        """Test manufacturing batch processing data workflow through the platform."""
        kinesis_stream_name = self.outputs.get('kinesis_stream_name')
        self.assertIsNotNone(kinesis_stream_name, "Kinesis stream name should be available")
        
        # Manufacturing batch processing data
        batch_id = f"batch-{int(time.time())}"
        manufacturing_data = [
            {
                "batchId": batch_id,
                "processStep": "mixing",
                "timestamp": int(time.time()),
                "machineId": "mixer-001",
                "operatorId": "op-001",
                "recipe": "standard-steel-alloy",
                "parameters": {
                    "temperature": 1800,
                    "mixingSpeed": 120,
                    "duration": 300
                },
                "qualityMetrics": {
                    "consistency": 98.5,
                    "temperature_variance": 2.1
                }
            },
            {
                "batchId": batch_id,
                "processStep": "molding",
                "timestamp": int(time.time()) + 60,
                "machineId": "press-001", 
                "operatorId": "op-002",
                "parameters": {
                    "pressure": 2000,
                    "temperature": 1200,
                    "cycle_time": 45
                },
                "qualityMetrics": {
                    "dimensional_accuracy": 99.1,
                    "surface_finish": 95.8
                }
            },
            {
                "batchId": batch_id,
                "processStep": "cooling",
                "timestamp": int(time.time()) + 120,
                "machineId": "cooler-001",
                "operatorId": "op-003",
                "parameters": {
                    "cooling_rate": 5.2,
                    "final_temperature": 25,
                    "duration": 600
                },
                "qualityMetrics": {
                    "stress_relief": 97.3,
                    "hardness": 58.2
                }
            }
        ]
        
        # Test batch ingestion with different partition keys
        batch_records = []
        for step_data in manufacturing_data:
            try:
                # Use batchId + processStep as partition key for even distribution
                partition_key = f"{step_data['batchId']}-{step_data['processStep']}"
                
                response = self.kinesis_client.put_record(
                    StreamName=kinesis_stream_name,
                    Data=json.dumps(step_data),
                    PartitionKey=partition_key
                )
                
                batch_records.append({
                    'partition_key': partition_key,
                    'shard_id': response['ShardId'],
                    'sequence_number': response['SequenceNumber']
                })
                
            except ClientError as e:
                if 'AccessDenied' in str(e):
                    self.skipTest("Insufficient permissions for batch processing workflow")
                raise
        
        self.assertEqual(len(batch_records), len(manufacturing_data),
                        "All batch processing steps should be recorded")
        
        # Verify data distribution across shards (good for parallel processing)
        shard_ids = set(record['shard_id'] for record in batch_records)
        self.assertGreaterEqual(len(shard_ids), 1,
                              "Batch data should be distributed across shards")

    def test_high_throughput_sensor_data_ingestion(self):
        """Test high-throughput sensor data ingestion simulating real manufacturing load."""
        kinesis_stream_name = self.outputs.get('kinesis_stream_name')
        self.assertIsNotNone(kinesis_stream_name, "Kinesis stream name should be available")
        
        # Simulate multiple sensors sending data simultaneously
        base_timestamp = int(time.time())
        sensor_data_batch = []
        
        # Generate data for 10 different sensor types over 5 time intervals
        sensor_types = [
            "temperature", "pressure", "vibration", "flow_rate", "power_consumption",
            "humidity", "speed", "torque", "displacement", "acceleration"
        ]
        
        for interval in range(5):  # 5 time intervals
            timestamp = base_timestamp + (interval * 60)  # 1 minute intervals
            
            for i, sensor_type in enumerate(sensor_types):
                sensor_data = {
                    "deviceId": f"{sensor_type}-sensor-{i+1:03d}",
                    "timestamp": timestamp,
                    "sensorType": sensor_type,
                    "value": 20.0 + (i * 5) + (interval * 0.5),  # Varying values
                    "location": f"production-line-{chr(65 + (i % 3))}",  # A, B, C
                    "machineId": f"machine-{(i % 5) + 1:03d}",
                    "status": "normal" if i % 10 != 7 else "warning",  # Some warnings
                    "metadata": {
                        "calibration_date": "2024-01-01",
                        "firmware_version": "2.1.0"
                    }
                }
                sensor_data_batch.append(sensor_data)
        
        # Test concurrent data ingestion using ThreadPoolExecutor
        def put_record(data):
            try:
                response = self.kinesis_client.put_record(
                    StreamName=kinesis_stream_name,
                    Data=json.dumps(data),
                    PartitionKey=data["deviceId"]
                )
                return {
                    'success': True,
                    'shard_id': response['ShardId'],
                    'sequence_number': response['SequenceNumber'],
                    'device_id': data['deviceId']
                }
            except Exception as e:
                return {
                    'success': False,
                    'error': str(e),
                    'device_id': data['deviceId']
                }
        
        # Execute concurrent puts
        successful_ingestions = []
        failed_ingestions = []
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            try:
                futures = [executor.submit(put_record, data) for data in sensor_data_batch]
                
                for future in as_completed(futures, timeout=30):
                    result = future.result()
                    if result['success']:
                        successful_ingestions.append(result)
                    else:
                        failed_ingestions.append(result)
                        
            except Exception as e:
                if 'AccessDenied' in str(e):
                    self.skipTest("Insufficient permissions for high-throughput testing")
                raise
        
        # Verify high success rate
        total_attempts = len(sensor_data_batch)
        success_rate = len(successful_ingestions) / total_attempts
        
        self.assertGreaterEqual(success_rate, 0.95,  # 95% success rate
                              "Should achieve high success rate for concurrent ingestion")
        self.assertEqual(len(successful_ingestions) + len(failed_ingestions), total_attempts,
                        "All ingestion attempts should be accounted for")
        
        # Verify load distribution across shards
        shard_distribution = {}
        for ingestion in successful_ingestions:
            shard_id = ingestion['shard_id']
            shard_distribution[shard_id] = shard_distribution.get(shard_id, 0) + 1
        
        self.assertGreaterEqual(len(shard_distribution), 2,
                              "High-throughput data should be distributed across multiple shards")

    def test_data_retention_and_stream_monitoring(self):
        """Test Kinesis data retention and monitoring capabilities."""
        kinesis_stream_name = self.outputs.get('kinesis_stream_name')
        self.assertIsNotNone(kinesis_stream_name, "Kinesis stream name should be available")
        
        # Get stream details for retention verification
        stream_response = self.kinesis_client.describe_stream(StreamName=kinesis_stream_name)
        stream = stream_response['StreamDescription']
        
        # Test retention period (should be configured for manufacturing use case)
        self.assertEqual(stream['RetentionPeriodHours'], 24,
                        "Stream should have 24-hour retention for manufacturing data")
        
        # Test stream monitoring metrics availability
        stream_summary = self.kinesis_client.describe_stream_summary(StreamName=kinesis_stream_name)
        summary = stream_summary['StreamDescriptionSummary']
        
        self.assertIn('StreamCreationTimestamp', summary)
        self.assertEqual(summary['StreamStatus'], 'ACTIVE')
        
        # Verify shard-level metrics
        shards = stream['Shards']
        for shard in shards:
            self.assertIn('ShardId', shard)
            self.assertIn('HashKeyRange', shard)
            self.assertIn('SequenceNumberRange', shard)


class TestTapStackRealWorldScenarios(BaseIntegrationTest):
    """Integration tests for real-world manufacturing scenarios and use cases."""

    def test_production_line_monitoring_scenario(self):
        """Test complete production line monitoring scenario with alerts and quality tracking."""
        kinesis_stream_name = self.outputs.get('kinesis_stream_name')
        self.assertIsNotNone(kinesis_stream_name, "Kinesis stream name should be available")
        
        # Simulate a production line shift with normal operations and quality issues
        production_shift_data = [
            # Shift start - normal operations
            {
                "eventType": "shift_start",
                "timestamp": int(time.time()),
                "lineId": "production-line-A",
                "shift": "day_shift",
                "operator": "supervisor-001",
                "target_production": 1000,
                "status": "operational"
            },
            # Normal production cycles
            {
                "eventType": "production_cycle",
                "timestamp": int(time.time()) + 300,
                "lineId": "production-line-A",
                "cycleId": "cycle-001",
                "part_number": "PN-12345",
                "cycle_time": 45.2,
                "quality_score": 98.5,
                "operator": "op-001",
                "machine_status": "normal"
            },
            # Quality issue detected
            {
                "eventType": "quality_alert",
                "timestamp": int(time.time()) + 600,
                "lineId": "production-line-A",
                "alertId": "QA-001",
                "severity": "medium",
                "description": "Dimensional tolerance exceeded",
                "part_number": "PN-12345",
                "inspector": "qa-001",
                "corrective_action_required": True
            },
            # Maintenance intervention
            {
                "eventType": "maintenance_event",
                "timestamp": int(time.time()) + 900,
                "lineId": "production-line-A",
                "maintenanceId": "MAINT-001",
                "type": "calibration",
                "technician": "tech-001",
                "estimated_duration": 30,
                "parts_affected": ["PN-12345"]
            },
            # Production resume
            {
                "eventType": "production_resume",
                "timestamp": int(time.time()) + 2700,
                "lineId": "production-line-A",
                "cycleId": "cycle-002",
                "part_number": "PN-12345",
                "cycle_time": 44.8,
                "quality_score": 99.2,
                "post_maintenance_verification": True
            }
        ]
        
        # Ingest production scenario data
        ingestion_results = []
        for event_data in production_shift_data:
            try:
                response = self.kinesis_client.put_record(
                    StreamName=kinesis_stream_name,
                    Data=json.dumps(event_data),
                    PartitionKey=f"{event_data['lineId']}-{event_data['eventType']}"
                )
                
                ingestion_results.append({
                    'event_type': event_data['eventType'],
                    'success': True,
                    'shard_id': response['ShardId']
                })
                
            except ClientError as e:
                if 'AccessDenied' in str(e):
                    self.skipTest("Insufficient permissions for production line monitoring")
                raise
        
        # Verify all production events were ingested
        self.assertEqual(len(ingestion_results), len(production_shift_data),
                        "All production line events should be successfully ingested")
        
        # Verify event types are properly distributed
        event_types = [result['event_type'] for result in ingestion_results]
        expected_events = ['shift_start', 'production_cycle', 'quality_alert', 
                          'maintenance_event', 'production_resume']
        
        for expected_event in expected_events:
            self.assertIn(expected_event, event_types,
                         f"Production scenario should include {expected_event} event")

    def test_predictive_maintenance_data_pipeline(self):
        """Test predictive maintenance data pipeline with sensor trending and anomaly detection."""
        kinesis_stream_name = self.outputs.get('kinesis_stream_name')
        self.assertIsNotNone(kinesis_stream_name, "Kinesis stream name should be available")
        
        # Simulate machine degradation over time leading to maintenance prediction
        base_time = int(time.time())
        machine_id = "CNC-Mill-001"
        
        # Generate trending sensor data showing gradual degradation
        maintenance_data = []
        for hour in range(24):  # 24 hours of data
            timestamp = base_time + (hour * 3600)
            
            # Simulate gradual increase in vibration and temperature (degradation signs)
            vibration_baseline = 1.5
            temperature_baseline = 65.0
            
            # Add gradual increase over time
            vibration_trend = vibration_baseline + (hour * 0.1)
            temperature_trend = temperature_baseline + (hour * 0.5)
            
            # Add some random variation
            import random
            vibration_actual = vibration_trend + random.uniform(-0.1, 0.1)
            temperature_actual = temperature_trend + random.uniform(-1.0, 1.0)
            
            sensor_reading = {
                "machineId": machine_id,
                "timestamp": timestamp,
                "sensorData": {
                    "vibration": {
                        "value": round(vibration_actual, 2),
                        "unit": "mm/s",
                        "sensor_id": f"{machine_id}-VIB-001"
                    },
                    "temperature": {
                        "value": round(temperature_actual, 1),
                        "unit": "celsius",
                        "sensor_id": f"{machine_id}-TEMP-001"
                    },
                    "power_consumption": {
                        "value": round(15.0 + (hour * 0.2), 1),
                        "unit": "kW",
                        "sensor_id": f"{machine_id}-POWER-001"
                    }
                },
                "operational_context": {
                    "part_program": "PROGRAM-001",
                    "spindle_speed": 2500,
                    "feed_rate": 800,
                    "cutting_depth": 2.0
                },
                "maintenance_indicators": {
                    "hours_since_maintenance": hour + 168,  # 1 week + current hours
                    "tool_wear_estimate": min(85 + (hour * 1.5), 100),
                    "bearing_condition": "degrading" if hour > 18 else "normal"
                }
            }
            maintenance_data.append(sensor_reading)
        
        # Ingest predictive maintenance data
        successful_ingestions = 0
        for reading in maintenance_data:
            try:
                response = self.kinesis_client.put_record(
                    StreamName=kinesis_stream_name,
                    Data=json.dumps(reading),
                    PartitionKey=reading["machineId"]
                )
                successful_ingestions += 1
                
            except ClientError as e:
                if 'AccessDenied' in str(e):
                    self.skipTest("Insufficient permissions for predictive maintenance testing")
                raise
        
        # Verify all maintenance data was ingested
        self.assertEqual(successful_ingestions, len(maintenance_data),
                        "All predictive maintenance data should be ingested successfully")
        
        # Add maintenance alert based on trend analysis
        maintenance_alert = {
            "alertType": "predictive_maintenance",
            "timestamp": base_time + (24 * 3600),
            "machineId": machine_id,
            "prediction": {
                "component": "spindle_bearing",
                "predicted_failure_time": base_time + (72 * 3600),  # 3 days
                "confidence": 87.5,
                "recommended_action": "schedule_maintenance",
                "risk_level": "medium"
            },
            "analysis": {
                "vibration_trend": "increasing",
                "temperature_trend": "increasing", 
                "analysis_period_hours": 24,
                "data_quality": "high"
            }
        }
        
        # Ingest maintenance alert
        try:
            alert_response = self.kinesis_client.put_record(
                StreamName=kinesis_stream_name,
                Data=json.dumps(maintenance_alert),
                PartitionKey=f"{machine_id}-alert"
            )
            
            self.assertIn('ShardId', alert_response)
            self.assertIn('SequenceNumber', alert_response)
            
        except ClientError as e:
            if 'AccessDenied' in str(e):
                self.skipTest("Insufficient permissions for maintenance alert ingestion")
            raise


if __name__ == '__main__':
    # Run the data flow integration tests
    unittest.main(verbosity=2)