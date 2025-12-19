# lambda/auto_tagging.py
import json
import boto3
import os
from datetime import datetime

def handler(event, context):
    """
    Auto-tag resources when they are created
    """
    print(f"Event: {json.dumps(event)}")
    
    # Get default tags from environment
    default_tags = json.loads(os.environ.get('DEFAULT_TAGS', '{}'))
    
    # Extract event details
    detail = event.get('detail', {})
    event_name = detail.get('eventName', '')
    region = detail.get('awsRegion', '')
    user_identity = detail.get('userIdentity', {})
    
    # Add dynamic tags
    tags = {
        **default_tags,
        'CreatedBy': user_identity.get('principalId', 'unknown'),
        'CreatedDate': datetime.now().strftime('%Y-%m-%d'),
        'CreatedVia': 'Auto-Tagging'
    }
    
    # Handle different resource types
    if event_name == 'RunInstances':
        tag_ec2_instances(detail, tags, region)
    elif event_name == 'CreateVolume':
        tag_ebs_volumes(detail, tags, region)
    elif event_name == 'CreateSecurityGroup':
        tag_security_groups(detail, tags, region)
    elif event_name == 'CreateDBInstance':
        tag_rds_instances(detail, tags, region)
    elif event_name == 'CreateBucket':
        tag_s3_buckets(detail, tags, region)
    
    return {
        'statusCode': 200,
        'body': json.dumps('Tagging completed successfully')
    }

def tag_ec2_instances(detail, tags, region):
    """Tag EC2 instances"""
    ec2 = boto3.client('ec2', region_name=region)
    
    response_elements = detail.get('responseElements', {})
    instances = response_elements.get('instancesSet', {}).get('items', [])
    
    instance_ids = [i['instanceId'] for i in instances if 'instanceId' in i]
    
    if instance_ids:
        ec2.create_tags(
            Resources=instance_ids,
            Tags=[{'Key': k, 'Value': v} for k, v in tags.items()]
        )
        print(f"Tagged EC2 instances: {instance_ids}")

def tag_ebs_volumes(detail, tags, region):
    """Tag EBS volumes"""
    ec2 = boto3.client('ec2', region_name=region)
    
    response_elements = detail.get('responseElements', {})
    volume_id = response_elements.get('volumeId')
    
    if volume_id:
        ec2.create_tags(
            Resources=[volume_id],
            Tags=[{'Key': k, 'Value': v} for k, v in tags.items()]
        )
        print(f"Tagged EBS volume: {volume_id}")

def tag_security_groups(detail, tags, region):
    """Tag security groups"""
    ec2 = boto3.client('ec2', region_name=region)
    
    response_elements = detail.get('responseElements', {})
    group_id = response_elements.get('groupId')
    
    if group_id:
        ec2.create_tags(
            Resources=[group_id],
            Tags=[{'Key': k, 'Value': v} for k, v in tags.items()]
        )
        print(f"Tagged security group: {group_id}")

def tag_rds_instances(detail, tags, region):
    """Tag RDS instances"""
    rds = boto3.client('rds', region_name=region)
    
    response_elements = detail.get('responseElements', {})
    db_instance = response_elements.get('dBInstance', {})
    db_instance_arn = db_instance.get('dBInstanceArn')
    
    if db_instance_arn:
        rds.add_tags_to_resource(
            ResourceName=db_instance_arn,
            Tags=[{'Key': k, 'Value': v} for k, v in tags.items()]
        )
        print(f"Tagged RDS instance: {db_instance_arn}")

def tag_s3_buckets(detail, tags, region):
    """Tag S3 buckets"""
    s3 = boto3.client('s3')
    
    request_parameters = detail.get('requestParameters', {})
    bucket_name = request_parameters.get('bucketName')
    
    if bucket_name:
        try:
            s3.put_bucket_tagging(
                Bucket=bucket_name,
                Tagging={
                    'TagSet': [{'Key': k, 'Value': v} for k, v in tags.items()]
                }
            )
            print(f"Tagged S3 bucket: {bucket_name}")
        except Exception as e:
            print(f"Error tagging S3 bucket {bucket_name}: {str(e)}")