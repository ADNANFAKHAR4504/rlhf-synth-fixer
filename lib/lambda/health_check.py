import json
import boto3
import os
from datetime import datetime

# Environment variables
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']
PRIMARY_REGION = os.environ['PRIMARY_REGION']
SECONDARY_REGION = os.environ['SECONDARY_REGION']
PRIMARY_ALB_ARN = os.environ['PRIMARY_ALB_ARN']
SECONDARY_ALB_ARN = os.environ['SECONDARY_ALB_ARN']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

# AWS clients
elb_primary_client = boto3.client('elbv2', region_name=PRIMARY_REGION)
elb_secondary_client = boto3.client('elbv2', region_name=SECONDARY_REGION)
sns_client = boto3.client('sns', region_name=PRIMARY_REGION)
lambda_client = boto3.client('lambda', region_name=PRIMARY_REGION)


def lambda_handler(event, context):
    """
    Periodic health check validation for primary region.
    If primary region is unhealthy, trigger automatic failover.
    """
    try:
        print(f"Running health check validation at {datetime.utcnow().isoformat()}")

        # Check primary region health
        primary_healthy = check_region_health(PRIMARY_ALB_ARN, PRIMARY_REGION, elb_primary_client)

        # Check secondary region health
        secondary_healthy = check_region_health(SECONDARY_ALB_ARN, SECONDARY_REGION, elb_secondary_client)

        print(f"Primary region health: {primary_healthy}")
        print(f"Secondary region health: {secondary_healthy}")

        # If primary is unhealthy but secondary is healthy, trigger failover
        if not primary_healthy and secondary_healthy:
            print("Primary region unhealthy - triggering automatic failover")

            # Invoke failover Lambda function
            lambda_client.invoke(
                FunctionName=f"failover-orchestrator-{ENVIRONMENT_SUFFIX}",
                InvocationType='Event',
                Payload=json.dumps({
                    'trigger': 'automatic',
                    'reason': 'primary_region_unhealthy',
                    'timestamp': datetime.utcnow().isoformat()
                })
            )

            # Send SNS notification
            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f"ALERT: Automatic Failover Triggered - {ENVIRONMENT_SUFFIX}",
                Message=f"""
Automatic failover triggered at {datetime.utcnow().isoformat()}

Reason: Primary region ({PRIMARY_REGION}) health check failed
Action: Initiating failover to secondary region ({SECONDARY_REGION})

Primary Region Status: UNHEALTHY
Secondary Region Status: HEALTHY

Failover orchestration function has been invoked.
"""
            )

        # If both regions are unhealthy, send critical alert
        elif not primary_healthy and not secondary_healthy:
            print("CRITICAL: Both regions unhealthy")

            sns_client.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f"CRITICAL: Both Regions Unhealthy - {ENVIRONMENT_SUFFIX}",
                Message=f"""
CRITICAL ALERT: Both regions are unhealthy at {datetime.utcnow().isoformat()}

Primary Region ({PRIMARY_REGION}): UNHEALTHY
Secondary Region ({SECONDARY_REGION}): UNHEALTHY

Cannot perform automatic failover - manual intervention required.
"""
            )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'primary_healthy': primary_healthy,
                'secondary_healthy': secondary_healthy,
                'timestamp': datetime.utcnow().isoformat()
            })
        }

    except Exception as e:
        error_message = f"Health check failed: {str(e)}"
        print(error_message)

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }


def check_region_health(alb_arn, region, elb_client):
    """Check if a region's ALB has healthy targets."""
    try:
        # Get target groups for the ALB
        target_group_arn = get_target_group_from_alb(alb_arn, region, elb_client)

        # Check target health
        response = elb_client.describe_target_health(
            TargetGroupArn=target_group_arn
        )

        healthy_targets = [
            target for target in response['TargetHealthDescriptions']
            if target['TargetHealth']['State'] == 'healthy'
        ]

        total_targets = len(response['TargetHealthDescriptions'])

        print(f"Region {region}: {len(healthy_targets)}/{total_targets} healthy targets")

        # Region is considered healthy if at least 50% of targets are healthy
        if total_targets == 0:
            return False

        return len(healthy_targets) >= (total_targets * 0.5)

    except Exception as e:
        print(f"Error checking health for region {region}: {str(e)}")
        return False


def get_target_group_from_alb(alb_arn, region, elb_client):
    """Get target group ARN from ALB ARN."""
    try:
        # Get listeners for the ALB
        listeners = elb_client.describe_listeners(LoadBalancerArn=alb_arn)

        if listeners['Listeners']:
            # Get target group from first listener's default action
            default_actions = listeners['Listeners'][0]['DefaultActions']
            if default_actions and 'TargetGroupArn' in default_actions[0]:
                return default_actions[0]['TargetGroupArn']

        raise RuntimeError(f"No target group found for ALB: {alb_arn}")

    except Exception as e:
        print(f"Error getting target group for region {region}: {str(e)}")
        raise
