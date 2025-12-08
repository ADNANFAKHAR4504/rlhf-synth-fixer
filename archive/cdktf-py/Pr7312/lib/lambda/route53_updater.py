"""
Lambda function to update Route 53 weighted routing during database migration cutover.
Monitors DMS task state and replication lag to determine cutover readiness.
"""

import json
import os
import boto3
from datetime import datetime
from typing import Dict, Any

# Initialize AWS clients
route53 = boto3.client('route53')
ssm = boto3.client('ssm')
dms = boto3.client('dms')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
HOSTED_ZONE_ID = os.environ['HOSTED_ZONE_ID']
ENVIRONMENT_SUFFIX = os.environ['ENVIRONMENT_SUFFIX']
AURORA_ENDPOINT = os.environ['AURORA_ENDPOINT']
DMS_TASK_ARN = os.environ['DMS_TASK_ARN']
SSM_STATE_PARAM = os.environ['SSM_STATE_PARAM']
SSM_CONFIG_PARAM = os.environ['SSM_CONFIG_PARAM']

# Constants
DNS_RECORD_NAME = f"db.migration-{ENVIRONMENT_SUFFIX}.example.com"
ONPREM_SET_ID = f"onprem-{ENVIRONMENT_SUFFIX}"
AURORA_SET_ID = f"aurora-{ENVIRONMENT_SUFFIX}"
LAG_THRESHOLD_SECONDS = 60


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for Route 53 cutover automation.

    Triggered by:
    1. EventBridge rule on DMS task state changes
    2. Manual invocation with cutover parameters

    Args:
        event: Event data from EventBridge or manual invocation
        context: Lambda context object

    Returns:
        Response with cutover status and actions taken
    """
    print(f"Received event: {json.dumps(event)}")

    try:
        # Check if this is a manual cutover request
        if event.get('action') == 'manual_cutover':
            return handle_manual_cutover(event)

        # Check if this is a rollback request
        if event.get('action') == 'rollback':
            return handle_rollback(event)

        # Check if this is a gradual cutover request
        if event.get('action') == 'gradual_cutover':
            return handle_gradual_cutover(event)

        # Otherwise, handle DMS state change event
        return handle_dms_state_change(event)

    except Exception as e:
        print(f"Error in handler: {str(e)}")

        # Send metric for failure
        send_metric('CutoverFailure', 1)

        raise


def handle_dms_state_change(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle DMS task state change events.

    Checks replication lag and decides if cutover should be initiated.
    """
    detail = event.get('detail', {})
    event_message = detail.get('eventMessage', '')

    print(f"DMS event: {event_message}")

    # Get current DMS task status
    task_status = get_dms_task_status()

    # Get migration state from Parameter Store
    migration_state = get_migration_state()

    # Check if task is running and replication is caught up
    if task_status['status'] == 'running':
        cdc_latency = task_status.get('cdc_latency_source', float('inf'))

        print(f"CDC Latency: {cdc_latency} seconds")

        # Send metric
        send_metric('DMSCDCLatency', cdc_latency)

        # Check if lag is below threshold and we're ready for cutover
        if cdc_latency < LAG_THRESHOLD_SECONDS and migration_state['phase'] == 'full-load-complete':
            print("Replication caught up - ready for cutover")

            # Update state to indicate readiness
            update_migration_state({
                'status': 'ready-for-cutover',
                'phase': 'cdc-synced',
                'last_updated': datetime.utcnow().isoformat(),
                'cdc_latency': cdc_latency,
                'onprem_weight': migration_state['onprem_weight'],
                'aurora_weight': migration_state['aurora_weight']
            })

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Ready for cutover',
                    'cdc_latency': cdc_latency,
                    'recommendation': 'Initiate manual cutover when ready'
                })
            }

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'DMS state change processed',
            'status': task_status['status']
        })
    }


def handle_manual_cutover(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle manual cutover request.

    Shifts 100% of traffic from on-premises to Aurora.
    """
    print("Initiating manual cutover")

    # Verify DMS replication is healthy
    task_status = get_dms_task_status()
    cdc_latency = task_status.get('cdc_latency_source', float('inf'))

    if cdc_latency > LAG_THRESHOLD_SECONDS:
        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'Cannot cutover - replication lag too high',
                'cdc_latency': cdc_latency,
                'threshold': LAG_THRESHOLD_SECONDS
            })
        }

    # Update Route 53 weights - 0% onprem, 100% Aurora
    update_route53_weights(onprem_weight=0, aurora_weight=100)

    # Update migration state
    update_migration_state({
        'status': 'cutover-complete',
        'phase': 'running-on-aurora',
        'last_updated': datetime.utcnow().isoformat(),
        'onprem_weight': 0,
        'aurora_weight': 100,
        'cutover_timestamp': datetime.utcnow().isoformat()
    })

    # Send success metric
    send_metric('CutoverSuccess', 1)

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Cutover completed successfully',
            'onprem_weight': 0,
            'aurora_weight': 100
        })
    }


def handle_gradual_cutover(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle gradual cutover request.

    Shifts traffic incrementally (e.g., 80/20, 50/50, 20/80, 0/100).
    """
    target_aurora_weight = event.get('aurora_weight', 50)
    target_onprem_weight = 100 - target_aurora_weight

    print(f"Gradual cutover to {target_aurora_weight}% Aurora")

    # Verify DMS replication is healthy
    task_status = get_dms_task_status()
    cdc_latency = task_status.get('cdc_latency_source', float('inf'))

    if cdc_latency > LAG_THRESHOLD_SECONDS:
        return {
            'statusCode': 400,
            'body': json.dumps({
                'error': 'Cannot adjust weights - replication lag too high',
                'cdc_latency': cdc_latency,
                'threshold': LAG_THRESHOLD_SECONDS
            })
        }

    # Update Route 53 weights
    update_route53_weights(onprem_weight=target_onprem_weight, aurora_weight=target_aurora_weight)

    # Update migration state
    update_migration_state({
        'status': 'gradual-cutover-in-progress',
        'phase': f'traffic-split-{target_aurora_weight}-percent-aurora',
        'last_updated': datetime.utcnow().isoformat(),
        'onprem_weight': target_onprem_weight,
        'aurora_weight': target_aurora_weight
    })

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Gradual cutover applied',
            'onprem_weight': target_onprem_weight,
            'aurora_weight': target_aurora_weight
        })
    }


def handle_rollback(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Handle rollback request.

    Shifts 100% of traffic back to on-premises database.
    """
    print("Initiating rollback to on-premises")

    # Update Route 53 weights - 100% onprem, 0% Aurora
    update_route53_weights(onprem_weight=100, aurora_weight=0)

    # Update migration state
    update_migration_state({
        'status': 'rolled-back',
        'phase': 'running-on-onprem',
        'last_updated': datetime.utcnow().isoformat(),
        'onprem_weight': 100,
        'aurora_weight': 0,
        'rollback_timestamp': datetime.utcnow().isoformat()
    })

    # Send metric
    send_metric('Rollback', 1)

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Rollback completed successfully',
            'onprem_weight': 100,
            'aurora_weight': 0
        })
    }


def get_dms_task_status() -> Dict[str, Any]:
    """Get current DMS replication task status."""
    response = dms.describe_replication_tasks(
        Filters=[
            {
                'Name': 'replication-task-arn',
                'Values': [DMS_TASK_ARN]
            }
        ]
    )

    if not response['ReplicationTasks']:
        raise Exception("DMS task not found")

    task = response['ReplicationTasks'][0]

    return {
        'status': task['Status'],
        'cdc_latency_source': task.get('ReplicationTaskStats', {}).get('ElapsedTimeMillis', 0) / 1000,
        'full_load_progress': task.get('ReplicationTaskStats', {}).get('FullLoadProgressPercent', 0)
    }


def get_migration_state() -> Dict[str, Any]:
    """Get current migration state from Parameter Store."""
    response = ssm.get_parameter(Name=SSM_STATE_PARAM)
    return json.loads(response['Parameter']['Value'])


def update_migration_state(state: Dict[str, Any]) -> None:
    """Update migration state in Parameter Store."""
    ssm.put_parameter(
        Name=SSM_STATE_PARAM,
        Value=json.dumps(state),
        Type='String',
        Overwrite=True
    )
    print(f"Updated migration state: {json.dumps(state)}")


def update_route53_weights(onprem_weight: int, aurora_weight: int) -> None:
    """Update Route 53 weighted routing records."""

    # Get current record sets
    response = route53.list_resource_record_sets(
        HostedZoneId=HOSTED_ZONE_ID,
        StartRecordName=DNS_RECORD_NAME,
        StartRecordType='CNAME',
        MaxItems='10'
    )

    # Find existing records
    onprem_record = None
    aurora_record = None

    for record in response['ResourceRecordSets']:
        if record['Name'].rstrip('.') == DNS_RECORD_NAME and record.get('SetIdentifier') == ONPREM_SET_ID:
            onprem_record = record
        elif record['Name'].rstrip('.') == DNS_RECORD_NAME and record.get('SetIdentifier') == AURORA_SET_ID:
            aurora_record = record

    changes = []

    # Update on-premises weight
    if onprem_record:
        changes.append({
            'Action': 'UPSERT',
            'ResourceRecordSet': {
                'Name': DNS_RECORD_NAME,
                'Type': 'CNAME',
                'SetIdentifier': ONPREM_SET_ID,
                'Weight': onprem_weight,
                'TTL': 60,
                'ResourceRecords': onprem_record['ResourceRecords']
            }
        })

    # Update Aurora weight
    if aurora_record:
        changes.append({
            'Action': 'UPSERT',
            'ResourceRecordSet': {
                'Name': DNS_RECORD_NAME,
                'Type': 'CNAME',
                'SetIdentifier': AURORA_SET_ID,
                'Weight': aurora_weight,
                'TTL': 60,
                'ResourceRecords': [{'Value': AURORA_ENDPOINT}]
            }
        })

    # Apply changes
    if changes:
        route53.change_resource_record_sets(
            HostedZoneId=HOSTED_ZONE_ID,
            ChangeBatch={'Changes': changes}
        )
        print(f"Updated Route 53 weights - Onprem: {onprem_weight}, Aurora: {aurora_weight}")


def send_metric(metric_name: str, value: float) -> None:
    """Send custom CloudWatch metric."""
    cloudwatch.put_metric_data(
        Namespace='DatabaseMigration',
        MetricData=[
            {
                'MetricName': metric_name,
                'Value': value,
                'Unit': 'None',
                'Timestamp': datetime.utcnow(),
                'Dimensions': [
                    {
                        'Name': 'Environment',
                        'Value': ENVIRONMENT_SUFFIX
                    }
                ]
            }
        ]
    )
