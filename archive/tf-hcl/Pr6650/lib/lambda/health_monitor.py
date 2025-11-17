import boto3
import json
import os
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

rds = boto3.client('rds')
cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')

REGION = os.environ['REGION']
RDS_CLUSTER_ID = os.environ['RDS_CLUSTER_ID']
IS_PRIMARY = os.environ.get('IS_PRIMARY', 'true').lower() == 'true'

def lambda_handler(event, context):
    """
    Health monitor Lambda function
    Checks RDS cluster health and replication status
    """
    try:
        logger.info(f"Health check started for cluster: {RDS_CLUSTER_ID} in region: {REGION}")

        # Get RDS cluster details
        response = rds.describe_db_clusters(
            DBClusterIdentifier=RDS_CLUSTER_ID
        )

        if not response['DBClusters']:
            logger.error(f"Cluster {RDS_CLUSTER_ID} not found")
            return {
                'statusCode': 404,
                'body': json.dumps({'status': 'error', 'message': 'Cluster not found'})
            }

        cluster = response['DBClusters'][0]
        cluster_status = cluster['Status']

        logger.info(f"Cluster status: {cluster_status}")

        # Check cluster health
        is_healthy = cluster_status == 'available'

        # For primary region, check replication lag
        if IS_PRIMARY:
            replication_lag = get_replication_lag(RDS_CLUSTER_ID)
            logger.info(f"Replication lag: {replication_lag} seconds")

            # Publish custom metric
            cloudwatch.put_metric_data(
                Namespace='DR/Health',
                MetricData=[
                    {
                        'MetricName': 'ReplicationLag',
                        'Value': replication_lag,
                        'Unit': 'Seconds',
                        'Timestamp': datetime.utcnow(),
                        'Dimensions': [
                            {
                                'Name': 'ClusterIdentifier',
                                'Value': RDS_CLUSTER_ID
                            }
                        ]
                    }
                ]
            )

            # Check if replication lag is critical
            if replication_lag > 60:
                logger.warning(f"High replication lag detected: {replication_lag}s")

        # Publish cluster health metric
        cloudwatch.put_metric_data(
            Namespace='DR/Health',
            MetricData=[
                {
                    'MetricName': 'ClusterHealth',
                    'Value': 1 if is_healthy else 0,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'ClusterIdentifier',
                            'Value': RDS_CLUSTER_ID
                        },
                        {
                            'Name': 'Region',
                            'Value': REGION
                        }
                    ]
                }
            ]
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'healthy' if is_healthy else 'unhealthy',
                'cluster_status': cluster_status,
                'region': REGION,
                'timestamp': datetime.utcnow().isoformat()
            })
        }

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'status': 'error', 'message': str(e)})
        }

def get_replication_lag(cluster_id):
    """
    Get replication lag from CloudWatch metrics
    """
    try:
        response = cloudwatch.get_metric_data(
            MetricDataQueries=[
                {
                    'Id': 'm1',
                    'MetricStat': {
                        'Metric': {
                            'Namespace': 'AWS/RDS',
                            'MetricName': 'AuroraGlobalDBReplicationLag',
                            'Dimensions': [
                                {
                                    'Name': 'DBClusterIdentifier',
                                    'Value': cluster_id
                                }
                            ]
                        },
                        'Period': 60,
                        'Stat': 'Average'
                    }
                }
            ],
            StartTime=datetime.utcnow().timestamp() - 300,
            EndTime=datetime.utcnow().timestamp()
        )

        if response['MetricDataResults'] and response['MetricDataResults'][0]['Values']:
            return response['MetricDataResults'][0]['Values'][0]

        return 0

    except Exception as e:
        logger.error(f"Failed to get replication lag: {str(e)}")
        return 0
