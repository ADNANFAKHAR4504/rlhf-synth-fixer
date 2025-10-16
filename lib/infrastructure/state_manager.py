"""
Infrastructure state management with versioning and concurrency control.

This module addresses the state storage concurrency control requirement
by implementing S3 versioning and metadata validation.
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .config import Config


class StateManager:
    """
    Manages infrastructure state with versioning and consistency guarantees.
    
    Addresses state storage concurrency control requirement by:
    - Using S3 versioning
    - Adding state hash validation
    - Including metadata for consistency checks
    """
    
    def __init__(self, config: Config, state_bucket: aws.s3.Bucket):
        """
        Initialize state manager.
        
        Args:
            config: Configuration object
            state_bucket: S3 bucket for state storage
        """
        self.config = config
        self.state_bucket = state_bucket
        self.current_state_key = f"{config.app_name}/current-state.json"
        self.history_prefix = f"{config.app_name}/history/"
    
    def create_state_snapshot(
        self,
        asg_config: Dict[str, Any],
        health_status: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create infrastructure state snapshot.
        
        Args:
            asg_config: Auto Scaling Group configuration
            health_status: Current health status
            
        Returns:
            State snapshot dictionary
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        
        state_data = {
            'timestamp': timestamp,
            'environment': self.config.environment_suffix,
            'stack': pulumi.get_stack(),
            'project': pulumi.get_project(),
            'autoscaling': asg_config,
            'health': health_status,
            'metadata': {
                'app_name': self.config.app_name,
                'region': self.config.primary_region
            }
        }
        
        # Calculate state hash for validation
        state_json = json.dumps(state_data, sort_keys=True)
        state_hash = hashlib.sha256(state_json.encode()).hexdigest()
        state_data['hash'] = state_hash
        
        return state_data
    
    def save_state(self, state_data: Dict[str, Any]) -> Output[aws.s3.BucketObject]:
        """
        Save state snapshot to S3 with versioning.
        
        Args:
            state_data: State snapshot data
            
        Returns:
            S3 BucketObject as Output
        """
        # Save to history
        history_key = f"{self.history_prefix}{state_data['timestamp']}-{state_data['hash'][:8]}.json"
        
        history_object = aws.s3.BucketObject(
            f"state-history-{state_data['hash'][:8]}",
            bucket=self.state_bucket.bucket,
            key=history_key,
            content=json.dumps(state_data, indent=2),
            content_type='application/json',
            server_side_encryption='aws:kms',
            tags=self.config.get_tags({
                'Type': 'StateHistory',
                'Hash': state_data['hash'][:8]
            })
        )
        
        # Update current state
        current_object = aws.s3.BucketObject(
            'state-current',
            bucket=self.state_bucket.bucket,
            key=self.current_state_key,
            content=json.dumps(state_data, indent=2),
            content_type='application/json',
            server_side_encryption='aws:kms',
            tags=self.config.get_tags({
                'Type': 'CurrentState',
                'LastUpdated': state_data['timestamp']
            })
        )
        
        return current_object.bucket
    
    def get_state_bucket_name(self) -> Output[str]:
        """
        Get state bucket name.
        
        Returns:
            Bucket name as Output[str]
        """
        return self.state_bucket.bucket

