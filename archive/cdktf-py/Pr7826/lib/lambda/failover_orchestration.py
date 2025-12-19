"""Failover orchestration Lambda function."""
import json
import os
import boto3
from datetime import datetime

cloudwatch = boto3.client('cloudwatch')
route53 = boto3.client('route53')
sns = boto3.client('sns')

HOSTED_ZONE_ID = os.environ['HOSTED_ZONE_ID']
PRIMARY_RECORD_NAME = os.environ['PRIMARY_RECORD_NAME']
ALERTS_TOPIC_ARN = os.environ['ALERTS_TOPIC_ARN']

def check_health_status(alarm_data):
    """Analyze CloudWatch alarm data to determine health status."""
    alarm_name = alarm_data['AlarmName']
    new_state = alarm_data['NewStateValue']
    reason = alarm_data['NewStateReason']

    # Check if this is a critical alarm
    critical_keywords = ['API', 'Lambda', 'DynamoDB', 'Error', 'Latency', 'Throttle']
    is_critical = any(keyword in alarm_name for keyword in critical_keywords)

    return {
        'is_critical': is_critical,
        'alarm_name': alarm_name,
        'state': new_state,
        'reason': reason,
        'timestamp': datetime.utcnow().isoformat()
    }

def trigger_failover(health_status):
    """Trigger failover to secondary region if necessary."""
    try:
        # Get current health check status for primary region
        primary_region = os.environ.get('PRIMARY_REGION', 'us-east-1')
        secondary_region = os.environ.get('SECONDARY_REGION', 'us-east-2')

        # In a real scenario, you would update Route 53 health checks
        # and resource record sets to fail over to the secondary region

        # Log failover event
        print(f"Triggering failover from {primary_region} to {secondary_region}")
        print(f"Reason: {health_status['reason']}")

        # Send SNS notification
        sns.publish(
            TopicArn=ALERTS_TOPIC_ARN,
            Subject='CRITICAL: Failover Triggered',
            Message=json.dumps({
                'event': 'failover_initiated',
                'from_region': primary_region,
                'to_region': secondary_region,
                'trigger_alarm': health_status['alarm_name'],
                'reason': health_status['reason'],
                'timestamp': health_status['timestamp']
            })
        )

        return {
            'failover_triggered': True,
            'from_region': primary_region,
            'to_region': secondary_region
        }

    except Exception as e:
        print(f"Error triggering failover: {str(e)}")
        return {
            'failover_triggered': False,
            'error': str(e)
        }

def lambda_handler(event, context):
    """Handle CloudWatch alarm events for failover orchestration."""
    try:
        # Parse SNS message from CloudWatch alarm
        for record in event['Records']:
            sns_message = json.loads(record['Sns']['Message'])

            # Check health status
            health_status = check_health_status(sns_message)

            # If critical alarm in ALARM state, trigger failover
            if health_status['is_critical'] and health_status['state'] == 'ALARM':
                result = trigger_failover(health_status)

                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'status': 'failover_initiated',
                        'details': result
                    })
                }
            else:
                # Log non-critical alarm
                print(f"Non-critical alarm or OK state: {health_status['alarm_name']}")

                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'status': 'no_action_required',
                        'alarm': health_status['alarm_name'],
                        'state': health_status['state']
                    })
                }

    except Exception as e:
        print(f"Error processing alarm event: {str(e)}")

        # Send error notification
        try:
            sns.publish(
                TopicArn=ALERTS_TOPIC_ARN,
                Subject='ERROR: Failover Orchestration Failed',
                Message=json.dumps({
                    'error': str(e),
                    'timestamp': datetime.utcnow().isoformat()
                })
            )
        except Exception as sns_error:
            print(f"Failed to send error notification: {str(sns_error)}")

        return {
            'statusCode': 500,
            'body': json.dumps({
                'status': 'error',
                'message': str(e)
            })
        }
