import boto3
import os
import json
import logging
import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients (consider initializing outside handler for potential reuse)
region = os.environ.get('REGION', 'us-east-1')
dynamodb = boto3.resource('dynamodb', region_name=region)
autoscaling = boto3.client('autoscaling', region_name=region)
ec2 = boto3.client('ec2', region_name=region)

# Read environment variables
dynamodb_table_name = os.environ.get('DYNAMODB_TABLE')
asg_name = os.environ.get('ASG_NAME')
min_healthy_str = os.environ.get('MIN_HEALTHY', '2')

try:
    min_healthy_hosts = int(min_healthy_str)
except ValueError:
    logger.error(f"Invalid MIN_HEALTHY value: {min_healthy_str}. Defaulting to 2.")
    min_healthy_hosts = 2

def lambda_handler(event, context):
    """
    Handles events triggered by CloudWatch alarm state changes.
    This is a basic stub - implement actual recovery logic here.
    """
    logger.info(f"Received event: {json.dumps(event)}")

    # Extract alarm details (example assumes CloudWatch Alarm event source)
    alarm_name = event.get('detail', {}).get('alarmName', 'Unknown Alarm')
    alarm_state = event.get('detail', {}).get('state', {}).get('value', 'UNKNOWN')
    timestamp = event.get('time', datetime.datetime.utcnow().isoformat())

    logger.info(f"Alarm '{alarm_name}' entered state: {alarm_state}")

    if not dynamodb_table_name or not asg_name:
        logger.error("Missing required environment variables: DYNAMODB_TABLE or ASG_NAME")
        return {'statusCode': 500, 'body': 'Configuration error'}

    table = dynamodb.Table(dynamodb_table_name)

    # Example: Record the alarm event in DynamoDB
    try:
        table.put_item(
            Item={
                'stateKey': f"ALARM_{alarm_name}_{timestamp}",
                'alarmName': alarm_name,
                'alarmState': alarm_state,
                'timestamp': timestamp,
                'details': json.dumps(event.get('detail', {})) # Store alarm details
            }
        )
        logger.info(f"Recorded alarm state change in DynamoDB table {dynamodb_table_name}")
    except Exception as e:
        logger.error(f"Error writing to DynamoDB: {str(e)}")
        # Decide if you should continue recovery despite DB write failure

    # --- Implement Recovery Logic Here ---
    if alarm_state == 'ALARM':
        logger.warning("Recovery required! Implementing recovery steps...")

        # Example Step 1: Check current ASG status
        try:
            asg_response = autoscaling.describe_auto_scaling_groups(AutoScalingGroupNames=[asg_name])
            if not asg_response['AutoScalingGroups']:
                logger.error(f"ASG '{asg_name}' not found.")
                return {'statusCode': 404, 'body': 'ASG not found'}

            current_asg = asg_response['AutoScalingGroups'][0]
            instances = current_asg.get('Instances', [])
            desired_capacity = current_asg.get('DesiredCapacity', 0)
            in_service_count = sum(1 for inst in instances if inst.get('LifecycleState') == 'InService' and inst.get('HealthStatus') == 'Healthy')

            logger.info(f"ASG '{asg_name}': Desired={desired_capacity}, InService & Healthy={in_service_count}, MinHealthyRequired={min_healthy_hosts}")

            # Example Step 2: Identify unhealthy instances (basic example)
            # A more robust check might involve DescribeInstanceHealth or custom metrics
            unhealthy_instance_ids = [
                inst['InstanceId'] for inst in instances
                if inst.get('HealthStatus') != 'Healthy' or inst.get('LifecycleState') != 'InService'
            ]
            logger.info(f"Unhealthy/OutOfService instance IDs: {unhealthy_instance_ids}")

            # --- Placeholder for Actual Recovery Actions ---
            # if unhealthy_instance_ids:
            #    logger.warning(f"Terminating unhealthy instances: {unhealthy_instance_ids}")
            #    # Add logic to terminate instances carefully, respecting desired capacity, cooldowns etc.
            #    # Example (USE WITH CAUTION - THIS WILL TERMINATE INSTANCES):
            #    # try:
            #    #     ec2.terminate_instances(InstanceIds=unhealthy_instance_ids)
            #    #     logger.info("Termination request sent.")
            #    # except Exception as term_error:
            #    #     logger.error(f"Failed to terminate instances: {str(term_error)}")
            # else:
            #    logger.info("No specific unhealthy instances identified by basic check, ASG might be scaling.")

            # Add further steps: Check target group health, potentially adjust ASG desired count, etc.

            logger.info("Placeholder recovery steps completed.")

        except Exception as e:
            logger.error(f"Error during recovery steps: {str(e)}")
            return {'statusCode': 500, 'body': f"Recovery failed: {str(e)}"}

    else: # OK or INSUFFICIENT_DATA
        logger.info("Alarm is not in ALARM state. No recovery action taken.")

    return {
        'statusCode': 200,
        'body': json.dumps(f"Processed alarm state '{alarm_state}' for '{alarm_name}'")
    }