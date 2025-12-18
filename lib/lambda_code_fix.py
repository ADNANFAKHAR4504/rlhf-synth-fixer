import json
import boto3
import os
from decimal import Decimal
from datetime import datetime, timedelta
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')
timestream = boto3.client('timestream-write')

TABLE_NAME = os.environ['TABLE_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
TIMESTREAM_DB = os.environ.get('TIMESTREAM_DATABASE', 'WeatherMonitoring')
TIMESTREAM_TABLE = os.environ.get('TIMESTREAM_TABLE', 'SensorData')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def lambda_handler(event, context):
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        # Check if this is an EventBridge scheduled event
        if event.get('source') == 'EventBridge Scheduler':
            action = event.get('action')
            report_type = event.get('reportType')

            if action == 'aggregate':
                return handle_data_aggregation()
            elif report_type == 'daily':
                return handle_daily_report()
            else:
                logger.warning(f"Unknown EventBridge action: {action} or reportType: {report_type}")
                return {
                    'statusCode': 200,
                    'body': json.dumps({'message': 'No action taken'})
                }

        # Otherwise, handle as API Gateway event (sensor data ingestion)
        body = json.loads(event.get('body', '{}'))

        sensor_id = body.get('sensorId')
        temperature = body.get('temperature')
        humidity = body.get('humidity')
        pressure = body.get('pressure')
        wind_speed = body.get('windSpeed')

        if not sensor_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'sensorId is required'})
            }

        # Prepare item for DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        timestamp = int(datetime.now().timestamp())

        item = {
            'sensorId': sensor_id,
            'timestamp': timestamp,
            'temperature': Decimal(str(temperature)) if temperature else None,
            'humidity': Decimal(str(humidity)) if humidity else None,
            'pressure': Decimal(str(pressure)) if pressure else None,
            'windSpeed': Decimal(str(wind_speed)) if wind_speed else None,
            'processedAt': datetime.utcnow().isoformat()
        }

        # Remove None values
        item = {k: v for k, v in item.items() if v is not None}

        # Store in DynamoDB
        table.put_item(Item=item)

        # Check for anomalies
        anomalies = []
        if temperature and (temperature > 50 or temperature < -30):
            anomalies.append(f'Extreme temperature: {temperature}°C')
        if humidity and (humidity > 95 or humidity < 5):
            anomalies.append(f'Extreme humidity: {humidity}%')
        if wind_speed and wind_speed > 150:
            anomalies.append(f'Extreme wind speed: {wind_speed} km/h')

        # Send SNS notification for anomalies
        if anomalies:
            message = {
                'sensorId': sensor_id,
                'timestamp': timestamp,
                'anomalies': anomalies,
                'data': body
            }

            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f'Weather Anomaly Detected - Sensor {sensor_id}',
                Message=json.dumps(message, default=str)
            )

            logger.warning(f'Anomalies detected for sensor {sensor_id}: {anomalies}')

        # Send custom metrics to CloudWatch
        cloudwatch.put_metric_data(
            Namespace='WeatherMonitoring',
            MetricData=[
                {
                    'MetricName': 'ReadingsProcessed',
                    'Value': 1,
                    'Unit': 'Count',
                    'Dimensions': [
                        {
                            'Name': 'SensorId',
                            'Value': sensor_id
                        }
                    ]
                }
            ]
        )

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'Data processed successfully',
                'sensorId': sensor_id,
                'timestamp': timestamp
            })
        }

    except json.JSONDecodeError:
        logger.error('Invalid JSON in request body')
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Invalid JSON format'})
        }
    except Exception as e:
        logger.error(f'Unexpected error: {str(e)}')
        # Log to CloudWatch
        cloudwatch.put_metric_data(
            Namespace='WeatherMonitoring',
            MetricData=[
                {
                    'MetricName': 'ProcessingErrors',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Internal server error'})
        }

def handle_data_aggregation():
    """Handle hourly data aggregation and migration to Timestream"""
    try:
        logger.info("Starting hourly data aggregation")

        table = dynamodb.Table(TABLE_NAME)

        # Get data from the last hour
        one_hour_ago = int((datetime.now() - timedelta(hours=1)).timestamp())
        current_time = int(datetime.now().timestamp())

        # Scan for recent data (in production, use Query with GSI for better performance)
        response = table.scan(
            FilterExpression='#ts BETWEEN :start AND :end',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={
                ':start': one_hour_ago,
                ':end': current_time
            }
        )

        items = response.get('Items', [])
        logger.info(f"Found {len(items)} items to aggregate")

        if items:
            # Calculate aggregates
            temp_values = [float(item.get('temperature', 0)) for item in items if item.get('temperature')]
            humidity_values = [float(item.get('humidity', 0)) for item in items if item.get('humidity')]

            aggregates = {
                'period': datetime.now().strftime('%Y-%m-%d %H:00:00'),
                'itemCount': len(items),
                'avgTemperature': sum(temp_values) / len(temp_values) if temp_values else 0,
                'avgHumidity': sum(humidity_values) / len(humidity_values) if humidity_values else 0,
                'maxTemperature': max(temp_values) if temp_values else 0,
                'minTemperature': min(temp_values) if temp_values else 0
            }

            logger.info(f"Aggregates: {json.dumps(aggregates, default=decimal_default)}")

            # Try to write to Timestream if available
            try:
                if TIMESTREAM_DB and TIMESTREAM_TABLE:
                    write_to_timestream(items)
            except Exception as ts_error:
                logger.warning(f"Could not write to Timestream: {str(ts_error)}")

            # Send metrics to CloudWatch
            cloudwatch.put_metric_data(
                Namespace='WeatherMonitoring',
                MetricData=[
                    {
                        'MetricName': 'HourlyAggregation',
                        'Value': len(items),
                        'Unit': 'Count'
                    }
                ]
            )

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Data aggregation completed',
                    'aggregates': aggregates
                }, default=decimal_default)
            }

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'No data to aggregate'})
        }

    except Exception as e:
        logger.error(f"Error in data aggregation: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Aggregation failed: {str(e)}'})
        }

def handle_daily_report():
    """Generate daily weather report"""
    try:
        logger.info("Generating daily weather report")

        table = dynamodb.Table(TABLE_NAME)

        # Get data from the last 24 hours
        one_day_ago = int((datetime.now() - timedelta(days=1)).timestamp())
        current_time = int(datetime.now().timestamp())

        # Scan for recent data
        response = table.scan(
            FilterExpression='#ts BETWEEN :start AND :end',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={
                ':start': one_day_ago,
                ':end': current_time
            }
        )

        items = response.get('Items', [])
        logger.info(f"Found {len(items)} items for daily report")

        if items:
            # Generate report statistics
            temp_values = [float(item.get('temperature', 0)) for item in items if item.get('temperature')]
            humidity_values = [float(item.get('humidity', 0)) for item in items if item.get('humidity')]
            pressure_values = [float(item.get('pressure', 0)) for item in items if item.get('pressure')]
            wind_values = [float(item.get('windSpeed', 0)) for item in items if item.get('windSpeed')]

            report = {
                'reportDate': datetime.now().strftime('%Y-%m-%d'),
                'totalReadings': len(items),
                'temperature': {
                    'average': sum(temp_values) / len(temp_values) if temp_values else 0,
                    'max': max(temp_values) if temp_values else 0,
                    'min': min(temp_values) if temp_values else 0
                },
                'humidity': {
                    'average': sum(humidity_values) / len(humidity_values) if humidity_values else 0,
                    'max': max(humidity_values) if humidity_values else 0,
                    'min': min(humidity_values) if humidity_values else 0
                },
                'pressure': {
                    'average': sum(pressure_values) / len(pressure_values) if pressure_values else 0,
                    'max': max(pressure_values) if pressure_values else 0,
                    'min': min(pressure_values) if pressure_values else 0
                },
                'windSpeed': {
                    'average': sum(wind_values) / len(wind_values) if wind_values else 0,
                    'max': max(wind_values) if wind_values else 0,
                    'min': min(wind_values) if wind_values else 0
                }
            }

            # Send report via SNS
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f"Daily Weather Report - {report['reportDate']}",
                Message=json.dumps(report, indent=2, default=decimal_default)
            )

            logger.info(f"Daily report generated: {json.dumps(report, default=decimal_default)}")

            # Send metrics to CloudWatch
            cloudwatch.put_metric_data(
                Namespace='WeatherMonitoring',
                MetricData=[
                    {
                        'MetricName': 'DailyReportGenerated',
                        'Value': 1,
                        'Unit': 'Count'
                    }
                ]
            )

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Daily report generated successfully',
                    'report': report
                }, default=decimal_default)
            }

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'No data available for daily report'})
        }

    except Exception as e:
        logger.error(f"Error generating daily report: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Report generation failed: {str(e)}'})
        }

def write_to_timestream(items):
    """Write data to Timestream"""
    try:
        records = []
        current_time_str = str(int(datetime.now().timestamp() * 1000))

        for item in items:
            sensor_id = item.get('sensorId', 'unknown')
            timestamp = str(int(item.get('timestamp', 0) * 1000))

            # Add temperature record
            if 'temperature' in item:
                records.append({
                    'Time': timestamp,
                    'TimeUnit': 'MILLISECONDS',
                    'Dimensions': [
                        {'Name': 'sensorId', 'Value': sensor_id},
                        {'Name': 'measureType', 'Value': 'temperature'}
                    ],
                    'MeasureName': 'value',
                    'MeasureValue': str(item['temperature']),
                    'MeasureValueType': 'DOUBLE'
                })

            # Add humidity record
            if 'humidity' in item:
                records.append({
                    'Time': timestamp,
                    'TimeUnit': 'MILLISECONDS',
                    'Dimensions': [
                        {'Name': 'sensorId', 'Value': sensor_id},
                        {'Name': 'measureType', 'Value': 'humidity'}
                    ],
                    'MeasureName': 'value',
                    'MeasureValue': str(item['humidity']),
                    'MeasureValueType': 'DOUBLE'
                })

        if records:
            response = timestream.write_records(
                DatabaseName=TIMESTREAM_DB,
                TableName=TIMESTREAM_TABLE,
                Records=records[:100]  # Limit to 100 records per write
            )
            logger.info(f"Written {len(records)} records to Timestream")

    except Exception as e:
        logger.warning(f"Failed to write to Timestream: {str(e)}")