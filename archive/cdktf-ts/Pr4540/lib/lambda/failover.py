import os
import json
import boto3
import logging

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    Handles automated RDS Aurora cluster failover.
    
    This function is triggered by a CloudWatch alarm and performs the following actions:
    1. Retrieves the DB cluster ID and SNS topic ARN from environment variables.
    2. Initiates a failover for the specified RDS cluster.
    3. Publishes a notification to the specified SNS topic about the failover status.
    """
    
    # Initialize AWS clients
    rds_client = boto3.client('rds')
    sns_client = boto3.client('sns')
    
    # Get environment variables
    try:
        cluster_id = os.environ['CLUSTER_ID']
        sns_topic_arn = os.environ['SNS_TOPIC_ARN']
    except KeyError as e:
        logger.error(f"Missing environment variable: {str(e)}")
        raise
        
    logger.info(f"Received event, preparing to initiate failover for RDS cluster: {cluster_id}")

    try:
        # Step 1: Initiate the RDS cluster failover
        logger.info(f"Executing rds.failover_db_cluster for {cluster_id}...")
        rds_client.failover_db_cluster(DBClusterIdentifier=cluster_id)
        
        success_message = f"Successfully initiated automated failover for RDS cluster '{cluster_id}'."
        logger.info(success_message)
        
        # Step 2: Publish a success notification to the SNS topic
        sns_client.publish(
            TopicArn=sns_topic_arn,
            Subject='✅ SUCCESS: Automated RDS Failover Initiated',
            Message=success_message
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps(success_message)
        }
        
    except Exception as e:
        error_message = f"Failed to initiate failover for RDS cluster '{cluster_id}'. Error: {str(e)}"
        logger.error(error_message)
        
        # Step 3 (on failure): Publish an error notification to the SNS topic
        sns_client.publish(
            TopicArn=sns_topic_arn,
            Subject='❌ FAILED: Automated RDS Failover',
            Message=error_message
        )
        
        # Raise the exception to mark the Lambda execution as failed
        raise e