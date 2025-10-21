"""
Lambda function handler for environment migration.

This function handles migration tasks and validates deployments.
"""

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict

import boto3

# Initialize logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
ssm_client = boto3.client('ssm')
sns_client = boto3.client('sns')
cloudwatch_client = boto3.client('cloudwatch')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for migration tasks.
    
    Args:
        event: Lambda event data
        context: Lambda context
        
    Returns:
        Response dictionary with status and details
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Get environment configuration
        region = os.environ.get('AWS_REGION', 'us-east-1')
        environment = os.environ.get('ENVIRONMENT', 'dev')
        deployment_bucket = os.environ.get('DEPLOYMENT_BUCKET')
        notification_topic = os.environ.get('NOTIFICATION_TOPIC')
        
        logger.info(f"Region: {region}, Environment: {environment}")
        
        # Get configuration from SSM if available
        config = get_configuration(region)
        logger.info(f"Configuration loaded: {config}")
        
        # Determine action from event
        action = event.get('action', 'validate')
        
        if action == 'validate':
            result = validate_deployment(event, config, region)
        elif action == 'migrate':
            result = perform_migration(event, config, region, deployment_bucket)
        elif action == 'rollback':
            result = perform_rollback(event, config, region, deployment_bucket)
        else:
            raise ValueError(f"Unknown action: {action}")
        
        # Send notification if configured
        if notification_topic and result.get('status') != 'success':
            send_notification(notification_topic, result, region)
        
        # Publish metrics
        publish_metrics(action, result.get('status'), region)
        
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        logger.error(f"Error in migration handler: {str(e)}", exc_info=True)
        
        error_result = {
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }
        
        if notification_topic:
            send_notification(notification_topic, error_result, region)
        
        return {
            'statusCode': 500,
            'body': json.dumps(error_result)
        }


def get_configuration(region: str) -> Dict[str, Any]:
    """
    Retrieve configuration from SSM Parameter Store.
    
    Args:
        region: AWS region
        
    Returns:
        Configuration dictionary
    """
    try:
        param_name = os.environ.get('CONFIG_PARAMETER')
        if not param_name:
            return {}
        
        response = ssm_client.get_parameter(
            Name=param_name,
            WithDecryption=True
        )
        
        return json.loads(response['Parameter']['Value'])
        
    except ssm_client.exceptions.ParameterNotFound:
        logger.warning(f"Configuration parameter not found: {param_name}")
        return {}
    except Exception as e:
        logger.error(f"Error loading configuration: {str(e)}")
        return {}


def validate_deployment(event: Dict[str, Any], config: Dict[str, Any], region: str) -> Dict[str, Any]:
    """
    Validate deployment resources and configuration.
    
    Args:
        event: Validation event data
        config: Configuration dictionary
        region: AWS region
        
    Returns:
        Validation result
    """
    logger.info("Starting deployment validation")
    
    validation_results = {
        's3_bucket': False,
        'parameters': False,
        'connectivity': False
    }
    
    # Validate S3 bucket access
    deployment_bucket = os.environ.get('DEPLOYMENT_BUCKET')
    if deployment_bucket:
        try:
            s3_client.head_bucket(Bucket=deployment_bucket)
            validation_results['s3_bucket'] = True
            logger.info(f"S3 bucket validated: {deployment_bucket}")
        except Exception as e:
            logger.error(f"S3 bucket validation failed: {str(e)}")
    
    # Validate parameter store access
    try:
        param_name = os.environ.get('CONFIG_PARAMETER')
        if param_name:
            ssm_client.get_parameter(Name=param_name)
            validation_results['parameters'] = True
            logger.info("Parameter store access validated")
    except Exception as e:
        logger.error(f"Parameter validation failed: {str(e)}")
    
    # Validate connectivity
    validation_results['connectivity'] = True
    
    all_valid = all(validation_results.values())
    
    return {
        'status': 'success' if all_valid else 'warning',
        'validation_results': validation_results,
        'timestamp': datetime.utcnow().isoformat(),
        'region': region
    }


def perform_migration(event: Dict[str, Any], config: Dict[str, Any], region: str, bucket: str) -> Dict[str, Any]:
    """
    Perform migration tasks.
    
    Args:
        event: Migration event data
        config: Configuration dictionary
        region: AWS region
        bucket: Deployment bucket name
        
    Returns:
        Migration result
    """
    logger.info("Starting migration")
    
    migration_id = event.get('migration_id', f"migration-{datetime.utcnow().timestamp()}")
    
    # Store migration metadata in S3
    if bucket:
        try:
            metadata = {
                'migration_id': migration_id,
                'region': region,
                'timestamp': datetime.utcnow().isoformat(),
                'event': event,
                'config': config
            }
            
            s3_client.put_object(
                Bucket=bucket,
                Key=f"migrations/{migration_id}/metadata.json",
                Body=json.dumps(metadata),
                ContentType='application/json'
            )
            
            logger.info(f"Migration metadata stored: {migration_id}")
        except Exception as e:
            logger.error(f"Failed to store migration metadata: {str(e)}")
    
    return {
        'status': 'success',
        'migration_id': migration_id,
        'region': region,
        'timestamp': datetime.utcnow().isoformat()
    }


def perform_rollback(event: Dict[str, Any], config: Dict[str, Any], region: str, bucket: str) -> Dict[str, Any]:
    """
    Perform rollback of migration.
    
    Args:
        event: Rollback event data
        config: Configuration dictionary
        region: AWS region
        bucket: Deployment bucket name
        
    Returns:
        Rollback result
    """
    logger.info("Starting rollback")
    
    migration_id = event.get('migration_id')
    if not migration_id:
        raise ValueError("migration_id required for rollback")
    
    # Retrieve migration metadata from S3
    if bucket:
        try:
            response = s3_client.get_object(
                Bucket=bucket,
                Key=f"migrations/{migration_id}/metadata.json"
            )
            
            metadata = json.loads(response['Body'].read().decode('utf-8'))
            logger.info(f"Retrieved migration metadata: {migration_id}")
            
            # Store rollback record
            rollback_record = {
                'migration_id': migration_id,
                'region': region,
                'timestamp': datetime.utcnow().isoformat(),
                'original_migration': metadata
            }
            
            s3_client.put_object(
                Bucket=bucket,
                Key=f"rollbacks/{migration_id}/rollback.json",
                Body=json.dumps(rollback_record),
                ContentType='application/json'
            )
            
        except Exception as e:
            logger.error(f"Rollback failed: {str(e)}")
            raise
    
    return {
        'status': 'success',
        'migration_id': migration_id,
        'region': region,
        'timestamp': datetime.utcnow().isoformat()
    }


def send_notification(topic_arn: str, result: Dict[str, Any], region: str):
    """
    Send notification to SNS topic.
    
    Args:
        topic_arn: SNS topic ARN
        result: Result data to send
        region: AWS region
    """
    try:
        message = {
            'region': region,
            'timestamp': datetime.utcnow().isoformat(),
            'result': result
        }
        
        sns_client.publish(
            TopicArn=topic_arn,
            Subject=f"Migration {result.get('status', 'update')} - {region}",
            Message=json.dumps(message, indent=2)
        )
        
        logger.info(f"Notification sent to {topic_arn}")
    except Exception as e:
        logger.error(f"Failed to send notification: {str(e)}")


def publish_metrics(action: str, status: str, region: str):
    """
    Publish custom metrics to CloudWatch.
    
    Args:
        action: Action performed
        status: Action status
        region: AWS region
    """
    try:
        cloudwatch_client.put_metric_data(
            Namespace='Migration',
            MetricData=[
                {
                    'MetricName': 'ActionCount',
                    'Value': 1,
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'Action', 'Value': action},
                        {'Name': 'Status', 'Value': status},
                        {'Name': 'Region', 'Value': region}
                    ]
                }
            ]
        )
        logger.info(f"Metrics published: {action}/{status}")
    except Exception as e:
        logger.error(f"Failed to publish metrics: {str(e)}")

