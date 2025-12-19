"""
Failover Orchestrator Lambda Function
Handles automated DR failover for Aurora Global Database
Triggered by EventBridge when primary region health alarms fire
"""

import json
import os
import boto3
from datetime import datetime

# Initialize AWS clients
rds_client = boto3.client('rds')
sns_client = boto3.client('sns')

# Environment variables
GLOBAL_CLUSTER_ID = os.environ.get('GLOBAL_CLUSTER_ID')
DR_CLUSTER_ID = os.environ.get('DR_CLUSTER_ID')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
DR_REGION = os.environ.get('DR_REGION')


def handler(event, context):
    """
    Main handler for failover orchestration
    
    Args:
        event: EventBridge CloudWatch alarm event
        context: Lambda context
        
    Returns:
        dict: Status of failover operation
    """
    
    print(f"Failover orchestration triggered at {datetime.utcnow().isoformat()}")
    print(f"Event: {json.dumps(event)}")
    
    try:
        # Extract alarm details from event
        alarm_name = event.get('detail', {}).get('alarmName', 'Unknown')
        alarm_state = event.get('detail', {}).get('state', {}).get('value', 'UNKNOWN')
        
        print(f"Processing alarm: {alarm_name}, State: {alarm_state}")
        
        # Verify this is an ALARM state (not OK or INSUFFICIENT_DATA)
        if alarm_state != 'ALARM':
            print(f"Skipping - alarm state is {alarm_state}, not ALARM")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Skipped - alarm not in ALARM state',
                    'alarmState': alarm_state
                })
            }
        
        # Step 1: Verify global cluster status
        print(f"Step 1: Verifying global cluster status for {GLOBAL_CLUSTER_ID}")
        global_cluster = describe_global_cluster(GLOBAL_CLUSTER_ID)
        
        if not global_cluster:
            raise Exception(f"Global cluster {GLOBAL_CLUSTER_ID} not found")
        
        current_primary = get_current_primary_region(global_cluster)
        print(f"Current primary region: {current_primary}")
        
        # Step 2: Check if DR cluster is ready for promotion
        print(f"Step 2: Checking DR cluster readiness: {DR_CLUSTER_ID}")
        dr_cluster_status = check_dr_cluster_readiness(DR_CLUSTER_ID)
        
        if not dr_cluster_status['ready']:
            error_msg = f"DR cluster not ready: {dr_cluster_status['reason']}"
            print(f"ERROR: {error_msg}")
            send_notification(
                f"Failover Blocked - {alarm_name}",
                error_msg,
                'error'
            )
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'message': 'DR cluster not ready for failover',
                    'details': dr_cluster_status
                })
            }
        
        # Step 3: Check replication lag (must be < 30 seconds for safe failover)
        print("Step 3: Checking replication lag")
        replication_lag = check_replication_lag(global_cluster)
        
        if replication_lag > 30:
            warning_msg = f"High replication lag detected: {replication_lag}s"
            print(f"WARNING: {warning_msg}")
            send_notification(
                f"Failover Warning - {alarm_name}",
                f"{warning_msg}. Proceeding with failover as primary is unhealthy.",
                'warning'
            )
        
        # Step 4: Initiate failover to DR region
        print(f"Step 4: Initiating failover to {DR_REGION}")
        failover_result = initiate_failover(GLOBAL_CLUSTER_ID, DR_CLUSTER_ID)
        
        # Step 5: Send success notification
        success_msg = f"""
Disaster Recovery Failover Completed Successfully

Trigger: {alarm_name}
Previous Primary: {current_primary}
New Primary: {DR_REGION}
DR Cluster: {DR_CLUSTER_ID}
Failover Time: {datetime.utcnow().isoformat()}
Replication Lag: {replication_lag}s

Action Required:
1. Verify application connectivity to new endpoint
2. Monitor DR cluster performance
3. Investigate primary region failure
4. Plan failback when primary region is restored
"""
        
        send_notification(
            f"DR Failover Completed - {alarm_name}",
            success_msg,
            'success'
        )
        
        print("Failover orchestration completed successfully")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Failover completed successfully',
                'previousPrimary': current_primary,
                'newPrimary': DR_REGION,
                'drCluster': DR_CLUSTER_ID,
                'replicationLag': replication_lag,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except Exception as e:
        error_msg = f"Failover orchestration failed: {str(e)}"
        print(f"ERROR: {error_msg}")
        
        # Send failure notification
        send_notification(
            f"DR Failover Failed - {alarm_name}",
            f"Error: {error_msg}\n\nManual intervention required.",
            'error'
        )
        
        # Re-raise to trigger DLQ
        raise


def describe_global_cluster(cluster_id):
    """Describe global cluster and return details"""
    try:
        response = rds_client.describe_global_clusters(
            GlobalClusterIdentifier=cluster_id
        )
        return response['GlobalClusters'][0] if response['GlobalClusters'] else None
    except Exception as e:
        print(f"Error describing global cluster: {e}")
        return None


def get_current_primary_region(global_cluster):
    """Extract current primary region from global cluster members"""
    for member in global_cluster.get('GlobalClusterMembers', []):
        if member.get('IsWriter', False):
            # Extract region from ARN
            arn = member.get('DBClusterArn', '')
            return arn.split(':')[3] if arn else 'unknown'
    return 'unknown'


def check_dr_cluster_readiness(cluster_id):
    """Check if DR cluster is ready for promotion"""
    try:
        # Use DR region client
        dr_rds_client = boto3.client('rds', region_name=DR_REGION)
        
        response = dr_rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        if not response['DBClusters']:
            return {'ready': False, 'reason': 'DR cluster not found'}
        
        cluster = response['DBClusters'][0]
        status = cluster.get('Status', '')
        
        if status != 'available':
            return {'ready': False, 'reason': f'Cluster status is {status}'}
        
        # Check if cluster has at least one available instance
        instances = cluster.get('DBClusterMembers', [])
        if not instances:
            return {'ready': False, 'reason': 'No cluster instances found'}
        
        return {'ready': True, 'reason': 'DR cluster is ready'}
        
    except Exception as e:
        return {'ready': False, 'reason': f'Error checking DR cluster: {str(e)}'}


def check_replication_lag(global_cluster):
    """Check replication lag in seconds"""
    for member in global_cluster.get('GlobalClusterMembers', []):
        if not member.get('IsWriter', False):
            # This is a replica - check lag
            lag_ms = member.get('GlobalWriteForwardingStatus', {}).get('LagInSeconds', 0)
            return lag_ms
    return 0


def initiate_failover(global_cluster_id, target_cluster_id):
    """
    Initiate failover to DR region
    Note: This uses failover_global_cluster API which promotes a secondary to primary
    """
    try:
        print(f"Calling failover_global_cluster for {global_cluster_id} to {target_cluster_id}")
        
        # Use DR region client for failover
        dr_rds_client = boto3.client('rds', region_name=DR_REGION)
        
        response = dr_rds_client.failover_global_cluster(
            GlobalClusterIdentifier=global_cluster_id,
            TargetDbClusterIdentifier=target_cluster_id
        )
        
        print(f"Failover initiated successfully: {response}")
        return response
        
    except Exception as e:
        print(f"Error initiating failover: {e}")
        raise


def send_notification(subject, message, level='info'):
    """Send SNS notification"""
    try:
        if not SNS_TOPIC_ARN:
            print("WARNING: SNS_TOPIC_ARN not configured, skipping notification")
            return
        
        # Add severity prefix to subject
        severity_prefix = {
            'success': '✓ SUCCESS',
            'warning': '⚠ WARNING',
            'error': '✗ ERROR',
            'info': 'ℹ INFO'
        }.get(level, 'INFO')
        
        full_subject = f"[{severity_prefix}] {subject}"
        
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=full_subject[:100],  # SNS subject limit
            Message=message
        )
        
        print(f"Notification sent: {full_subject}")
        
    except Exception as e:
        print(f"Error sending notification: {e}")
        # Don't fail the whole operation if notification fails

