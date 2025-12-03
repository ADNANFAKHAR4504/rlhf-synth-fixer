"""Lambda function to handle automated rollback during migration."""

import json
import boto3
from typing import Dict, Any
from datetime import datetime
import os

s3 = boto3.client('s3')
ssm = boto3.client('ssm')
sns = boto3.client('sns')
stepfunctions = boto3.client('stepfunctions')


def get_parameter(parameter_name: str) -> str:
    """Retrieve configuration from Parameter Store."""
    try:
        response = ssm.get_parameter(Name=parameter_name, WithDecryption=True)
        return response['Parameter']['Value']
    except Exception as e:
        raise Exception(f"Error retrieving parameter {parameter_name}: {str(e)}")


def retrieve_checkpoint(bucket: str, checkpoint_key: str) -> Dict[str, Any]:
    """Retrieve migration checkpoint from S3."""
    try:
        response = s3.get_object(Bucket=bucket, Key=checkpoint_key)
        checkpoint_data = json.loads(response['Body'].read().decode('utf-8'))
        return checkpoint_data
    except Exception as e:
        raise Exception(f"Error retrieving checkpoint from S3: {str(e)}")


def save_rollback_state(bucket: str, state: Dict[str, Any], environment_suffix: str) -> str:
    """Save rollback state to S3."""
    try:
        timestamp = datetime.utcnow().isoformat()
        rollback_key = f"rollback/{environment_suffix}/{timestamp}/state.json"

        s3.put_object(
            Bucket=bucket,
            Key=rollback_key,
            Body=json.dumps(state, indent=2),
            ServerSideEncryption='AES256'
        )

        return rollback_key
    except Exception as e:
        raise Exception(f"Error saving rollback state to S3: {str(e)}")


def update_routing_configuration(environment_suffix: str, route_to_source: bool) -> None:
    """Update Parameter Store to control API Gateway routing."""
    try:
        routing_param = f"/migration/{environment_suffix}/routing/target"
        routing_value = "source" if route_to_source else "target"

        ssm.put_parameter(
            Name=routing_param,
            Value=routing_value,
            Type='String',
            Overwrite=True
        )

        print(f"Updated routing configuration to: {routing_value}")
    except Exception as e:
        raise Exception(f"Error updating routing configuration: {str(e)}")


def send_notification(topic_arn: str, subject: str, message: str) -> None:
    """Send notification via SNS."""
    try:
        sns.publish(
            TopicArn=topic_arn,
            Subject=subject,
            Message=message
        )
    except Exception as e:
        print(f"Error sending notification: {str(e)}")


def stop_replication_tasks(dms_task_arns: list) -> None:
    """Stop DMS replication tasks."""
    dms = boto3.client('dms')

    for task_arn in dms_task_arns:
        try:
            response = dms.describe_replication_tasks(
                Filters=[
                    {
                        'Name': 'replication-task-arn',
                        'Values': [task_arn]
                    }
                ]
            )

            if response['ReplicationTasks']:
                task = response['ReplicationTasks'][0]
                status = task['Status']

                if status in ['running', 'starting']:
                    dms.stop_replication_task(
                        ReplicationTaskArn=task_arn
                    )
                    print(f"Stopped replication task: {task_arn}")
                else:
                    print(f"Replication task {task_arn} already in status: {status}")

        except Exception as e:
            print(f"Error stopping replication task {task_arn}: {str(e)}")


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for rollback operations.

    Expected event structure:
    {
        "checkpoint_bucket": "migration-checkpoints-dev",
        "checkpoint_key": "checkpoints/dev/2025-12-03/state.json",
        "reason": "Validation failed - data mismatch detected",
        "validation_results": {...},
        "dms_task_arns": ["arn:aws:dms:..."],
        "environment_suffix": "dev"
    }
    """

    try:
        checkpoint_bucket = event['checkpoint_bucket']
        checkpoint_key = event.get('checkpoint_key')
        reason = event.get('reason', 'Rollback initiated')
        environment_suffix = event.get('environment_suffix', 'dev')
        dms_task_arns = event.get('dms_task_arns', [])

        print(f"Starting rollback process for environment: {environment_suffix}")
        print(f"Reason: {reason}")

        rollback_state = {
            'timestamp': datetime.utcnow().isoformat(),
            'environment': environment_suffix,
            'reason': reason,
            'validation_results': event.get('validation_results', {}),
            'steps_completed': []
        }

        if checkpoint_key:
            print(f"Retrieving checkpoint: {checkpoint_key}")
            checkpoint_data = retrieve_checkpoint(checkpoint_bucket, checkpoint_key)
            rollback_state['checkpoint'] = checkpoint_data
            rollback_state['steps_completed'].append('checkpoint_retrieved')

        print("Updating routing configuration to source")
        update_routing_configuration(environment_suffix, route_to_source=True)
        rollback_state['steps_completed'].append('routing_updated')

        if dms_task_arns:
            print(f"Stopping {len(dms_task_arns)} DMS replication tasks")
            stop_replication_tasks(dms_task_arns)
            rollback_state['steps_completed'].append('dms_tasks_stopped')

        rollback_key = save_rollback_state(checkpoint_bucket, rollback_state, environment_suffix)
        print(f"Rollback state saved to: {rollback_key}")

        topic_arn_param = f"/migration/{environment_suffix}/sns/topic-arn"
        try:
            topic_arn = get_parameter(topic_arn_param)
            notification_message = f"""
Migration Rollback Executed

Environment: {environment_suffix}
Timestamp: {rollback_state['timestamp']}
Reason: {reason}

Steps Completed:
{chr(10).join('- ' + step for step in rollback_state['steps_completed'])}

Rollback State Location: s3://{checkpoint_bucket}/{rollback_key}

The system has been rolled back to the source environment.
Please review the rollback state and validation results before attempting migration again.
            """

            send_notification(
                topic_arn=topic_arn,
                subject=f"Migration Rollback - {environment_suffix}",
                message=notification_message
            )
            rollback_state['steps_completed'].append('notification_sent')
        except Exception as e:
            print(f"Could not send notification: {str(e)}")

        print("Rollback completed successfully")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Rollback completed successfully',
                'rollback_state': rollback_state,
                'rollback_key': rollback_key
            })
        }

    except Exception as e:
        error_message = f"Rollback failed: {str(e)}"
        print(error_message)

        try:
            topic_arn_param = f"/migration/{environment_suffix}/sns/topic-arn"
            topic_arn = get_parameter(topic_arn_param)
            send_notification(
                topic_arn=topic_arn,
                subject=f"CRITICAL: Migration Rollback Failed - {environment_suffix}",
                message=f"Rollback process encountered an error:\n\n{error_message}\n\nImmediate manual intervention required."
            )
        except Exception:
            pass

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': error_message,
                'rollback_failed': True
            })
        }
