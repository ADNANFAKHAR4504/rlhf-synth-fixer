"""
Lambda function module for EC2 failure recovery infrastructure.
Implements the core recovery logic with proper retry mechanisms.
"""
from typing import Any, Dict

import pulumi
import pulumi_aws as aws

from .config import EC2RecoveryConfig


class LambdaStack:
    """Lambda function for EC2 recovery."""
    
    def __init__(self, config: EC2RecoveryConfig, iam_role_arn: pulumi.Output[str]):
        self.config = config
        self.iam_role_arn = iam_role_arn
        self.function = self._create_lambda_function()
    
    def _create_lambda_function(self) -> aws.lambda_.Function:
        """Create Lambda function for EC2 recovery."""
        import random
        random_suffix = str(random.randint(1000, 9999))
        return aws.lambda_.Function(
            f"{self.config.get_tag_name('lambda-function')}-{random_suffix}",
            name=self.config.lambda_function_name,
            runtime="python3.11",
            handler="index.lambda_handler",
            role=self.iam_role_arn,
            timeout=300,  # 5 minutes timeout
            memory_size=256,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(self._get_lambda_code())
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "S3_BUCKET": self.config.s3_bucket_name,
                    "SNS_TOPIC_ARN": f"arn:aws:sns:{self.config.region}:*:{self.config.sns_topic_name}",
                    "PARAMETER_PREFIX": self.config.parameter_store_prefix,
                    "MAX_RETRY_ATTEMPTS": str(self.config.max_retry_attempts),
                    "RETRY_INTERVAL_MINUTES": str(self.config.retry_interval_minutes)
                }
            ),
            tags={
                "Name": self.config.get_tag_name("lambda-function"),
                "Environment": self.config.environment,
                "Project": self.config.project_name,
                "Purpose": "EC2-Recovery"
            }
        )
    
    def _get_lambda_code(self) -> str:
        """Get the Lambda function code."""
        return '''
import json
import boto3
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
ec2_client = boto3.client('ec2')
s3_client = boto3.client('s3')
sns_client = boto3.client('sns')
ssm_client = boto3.client('ssm')

def lambda_handler(event, context):
    """Main Lambda handler for EC2 recovery."""
    try:
        logger.info("Starting EC2 recovery process")
        
        # Get configuration from Parameter Store
        config = get_configuration()
        
        # Get instances that need recovery
        instances_to_recover = get_instances_to_recover()
        
        if not instances_to_recover:
            logger.info("No instances need recovery")
            return {"statusCode": 200, "body": "No instances need recovery"}
        
        # Process each instance
        results = []
        for instance in instances_to_recover:
            result = process_instance_recovery(instance, config)
            results.append(result)
        
        logger.info(f"Recovery process completed. Results: {results}")
        return {"statusCode": 200, "body": json.dumps(results)}
        
    except Exception as e:
        logger.error(f"Error in EC2 recovery process: {str(e)}")
        send_alert(f"EC2 Recovery Error: {str(e)}")
        raise

def get_configuration() -> Dict:
    """Get configuration from Parameter Store."""
    try:
        parameter_prefix = os.environ['PARAMETER_PREFIX']
        response = ssm_client.get_parameters_by_path(
            Path=parameter_prefix,
            Recursive=True,
            WithDecryption=True
        )
        
        config = {}
        for param in response['Parameters']:
            key = param['Name'].split('/')[-1]
            config[key] = param['Value']
        
        return config
    except Exception as e:
        logger.error(f"Error getting configuration: {str(e)}")
        raise

def get_instances_to_recover() -> List[Dict]:
    """Get EC2 instances that need recovery."""
    try:
        # Get all instances with Auto-Recover tag
        response = ec2_client.describe_instances(
            Filters=[
                {'Name': 'tag:Auto-Recover', 'Values': ['true']},
                {'Name': 'instance-state-name', 'Values': ['stopped']}
            ]
        )
        
        instances = []
        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                instances.append(instance)
        
        logger.info(f"Found {len(instances)} instances to recover")
        return instances
        
    except Exception as e:
        logger.error(f"Error getting instances: {str(e)}")
        raise

def process_instance_recovery(instance: Dict, config: Dict) -> Dict:
    """Process recovery for a single instance."""
    instance_id = instance['InstanceId']
    logger.info(f"Processing recovery for instance {instance_id}")
    
    try:
        # Check if instance is already being processed
        if is_instance_being_processed(instance_id):
            logger.info(f"Instance {instance_id} is already being processed")
            return {"instance_id": instance_id, "status": "already_processing"}
        
        # Mark instance as being processed
        mark_instance_processing(instance_id)
        
        # Attempt to start the instance
        result = start_instance(instance_id)
        
        if result['success']:
            logger.info(f"Successfully started instance {instance_id}")
            clear_instance_processing(instance_id)
            return {"instance_id": instance_id, "status": "started"}
        else:
            logger.warning(f"Failed to start instance {instance_id}: {result['error']}")
            # Check retry count and handle accordingly
            retry_count = get_retry_count(instance_id)
            max_retries = int(config.get('max_retry_attempts', '3'))
            
            if retry_count < max_retries:
                increment_retry_count(instance_id)
                logger.info(f"Incremented retry count for instance {instance_id}")
                return {"instance_id": instance_id, "status": "retry_scheduled"}
            else:
                logger.error(f"Instance {instance_id} exceeded max retry attempts")
                send_alert(f"Instance {instance_id} failed to start after {max_retries} attempts")
                clear_instance_processing(instance_id)
                return {"instance_id": instance_id, "status": "failed"}
                
    except Exception as e:
        logger.error(f"Error processing instance {instance_id}: {str(e)}")
        clear_instance_processing(instance_id)
        return {"instance_id": instance_id, "status": "error", "error": str(e)}

def is_instance_being_processed(instance_id: str) -> bool:
    """Check if instance is currently being processed."""
    try:
        s3_bucket = os.environ['S3_BUCKET']
        key = f"ec2-recovery/processing/{instance_id}"
        
        response = s3_client.head_object(Bucket=s3_bucket, Key=key)
        return True
    except:
        return False

def mark_instance_processing(instance_id: str):
    """Mark instance as being processed."""
    try:
        s3_bucket = os.environ['S3_BUCKET']
        key = f"ec2-recovery/processing/{instance_id}"
        
        s3_client.put_object(
            Bucket=s3_bucket,
            Key=key,
            Body=json.dumps({"timestamp": datetime.utcnow().isoformat()})
        )
    except Exception as e:
        logger.error(f"Error marking instance {instance_id} as processing: {str(e)}")

def clear_instance_processing(instance_id: str):
    """Clear instance processing status."""
    try:
        s3_bucket = os.environ['S3_BUCKET']
        key = f"ec2-recovery/processing/{instance_id}"
        
        s3_client.delete_object(Bucket=s3_bucket, Key=key)
    except Exception as e:
        logger.error(f"Error clearing instance {instance_id} processing status: {str(e)}")

def get_retry_count(instance_id: str) -> int:
    """Get retry count for instance."""
    try:
        s3_bucket = os.environ['S3_BUCKET']
        key = f"ec2-recovery/retry/{instance_id}"
        
        response = s3_client.get_object(Bucket=s3_bucket, Key=key)
        data = json.loads(response['Body'].read())
        return data.get('count', 0)
    except:
        return 0

def increment_retry_count(instance_id: str):
    """Increment retry count for instance."""
    try:
        s3_bucket = os.environ['S3_BUCKET']
        key = f"ec2-recovery/retry/{instance_id}"
        
        current_count = get_retry_count(instance_id)
        s3_client.put_object(
            Bucket=s3_bucket,
            Key=key,
            Body=json.dumps({"count": current_count + 1})
        )
    except Exception as e:
        logger.error(f"Error incrementing retry count for instance {instance_id}: {str(e)}")

def start_instance(instance_id: str) -> Dict:
    """Start an EC2 instance."""
    try:
        response = ec2_client.start_instances(InstanceIds=[instance_id])
        
        if response['StartingInstances']:
            return {"success": True, "message": "Instance start initiated"}
        else:
            return {"success": False, "error": "No instances were started"}
            
    except Exception as e:
        return {"success": False, "error": str(e)}

def send_alert(message: str):
    """Send alert via SNS."""
    try:
        sns_topic_arn = os.environ['SNS_TOPIC_ARN']
        
        sns_client.publish(
            TopicArn=sns_topic_arn,
            Message=message,
            Subject="EC2 Recovery Alert"
        )
        
        logger.info(f"Alert sent: {message}")
    except Exception as e:
        logger.error(f"Error sending alert: {str(e)}")
'''
    
    def get_function_arn(self) -> pulumi.Output[str]:
        """Get the Lambda function ARN."""
        return self.function.arn
    
    def get_function_name(self) -> pulumi.Output[str]:
        """Get the Lambda function name."""
        return self.function.name
