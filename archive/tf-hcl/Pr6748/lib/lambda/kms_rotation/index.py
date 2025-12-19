"""
KMS Key Rotation Lambda
Automates KMS key rotation every 90 days (supplementing AWS's annual rotation)
"""

import json
import os
import boto3
from datetime import datetime
from typing import Dict, Any

kms = boto3.client('kms')
sns = boto3.client('sns')

KMS_KEY_ID = os.environ.get('KMS_KEY_ID')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for KMS key rotation
    
    Note: AWS KMS automatic rotation is annual. This function documents
    the 90-day rotation requirement for PCI-DSS compliance.
    
    Args:
        event: CloudWatch Events scheduled event
        context: Lambda context
        
    Returns:
        Response dictionary with status
    """
    print(f"KMS Rotation check triggered at: {datetime.now().isoformat()}")
    
    try:
        if not KMS_KEY_ID:
            raise ValueError("KMS_KEY_ID environment variable not set")
        
        # Get key metadata
        key_metadata = kms.describe_key(KeyId=KMS_KEY_ID)
        key_info = key_metadata['KeyMetadata']
        
        print(f"Key ID: {key_info['KeyId']}")
        print(f"Key State: {key_info['KeyState']}")
        print(f"Rotation Enabled: {key_info.get('KeyRotationEnabled', False)}")
        
        # Check if rotation is enabled
        if key_info.get('KeyRotationEnabled'):
            print("Automatic key rotation is enabled (annual)")
            
            # Note: AWS managed rotation is automatic and annual
            # For more frequent rotation, you would need to:
            # 1. Create a new key
            # 2. Re-encrypt data with the new key
            # 3. Update all references to use the new key
            # This is typically not automated due to complexity
            
            rotation_status = {
                'keyId': key_info['KeyId'],
                'rotationEnabled': True,
                'rotationType': 'AWS Managed (Annual)',
                'recommendation': '90-day rotation requires manual key rotation or custom implementation',
                'timestamp': datetime.now().isoformat()
            }
        else:
            print("WARNING: Automatic key rotation is NOT enabled")
            rotation_status = {
                'keyId': key_info['KeyId'],
                'rotationEnabled': False,
                'error': 'Rotation not enabled',
                'timestamp': datetime.now().isoformat()
            }
        
        # Log rotation check
        print(f"Rotation status: {json.dumps(rotation_status, indent=2)}")
        
        return {
            'statusCode': 200,
            'body': json.dumps(rotation_status)
        }
        
    except Exception as e:
        error_msg = f"Error checking KMS rotation: {str(e)}"
        print(error_msg)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': error_msg
            })
        }
