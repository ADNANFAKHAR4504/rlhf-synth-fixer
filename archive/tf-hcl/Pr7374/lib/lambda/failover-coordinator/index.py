import json
import boto3
import os
from datetime import datetime

rds = boto3.client('rds')
sns = boto3.client('sns')

def handler(event, context):
    """Handle RDS failover events and coordinate failover process"""
    print(f"Failover event received: {json.dumps(event)}")
    
    cluster_id = os.environ['CLUSTER_IDENTIFIER']
    sns_topic = os.environ['SNS_TOPIC_ARN']
    
    try:
        # Get cluster status
        response = rds.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response['DBClusters'][0]
        
        message = f"""
        RDS Failover Event Detected
        Cluster: {cluster_id}
        Status: {cluster['Status']}
        Endpoint: {cluster['Endpoint']}
        Reader Endpoint: {cluster['ReaderEndpoint']}
        Time: {datetime.utcnow().isoformat()}
        """
        
        # Send notification
        sns.publish(
            TopicArn=sns_topic,
            Subject='RDS Failover Event',
            Message=message
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps('Failover coordination completed')
        }
    except Exception as e:
        print(f"Error: {str(e)}")
        sns.publish(
            TopicArn=sns_topic,
            Subject='RDS Failover Coordinator Error',
            Message=f"Error during failover coordination: {str(e)}"
        )
        raise
