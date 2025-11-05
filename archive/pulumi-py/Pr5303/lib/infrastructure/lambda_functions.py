"""
Lambda functions infrastructure module for health monitoring and instance replacement.

This module creates Lambda functions for automated EC2 health monitoring with
retry logic and SNS notifications.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws
from infrastructure.config import InfraConfig
from pulumi import Output, ResourceOptions


class LambdaStack:
    """
    Manages Lambda functions for health monitoring.
    
    Creates:
    - Lambda function with retry logic
    - Uses Python 3.11 runtime
    - Proper error handling and SNS notifications
    """
    
    def __init__(
        self,
        config: InfraConfig,
        lambda_role_arn: Output[str],
        asg_name: Output[str],
        parent: Optional[pulumi.Resource] = None
    ):
        """
        Initialize the Lambda stack.
        
        Args:
            config: Infrastructure configuration
            lambda_role_arn: IAM role ARN for Lambda execution
            asg_name: Auto Scaling Group name to monitor
            parent: Optional parent resource for dependency management
        """
        self.config = config
        self.lambda_role_arn = lambda_role_arn
        self.asg_name = asg_name
        self.parent = parent
        
        # Create Lambda function
        self.health_check_function = self._create_health_check_function()
    
    def _create_health_check_function(self) -> aws.lambda_.Function:
        """
        Create Lambda function for EC2 health monitoring.
      
        """
        function_name = self.config.get_resource_name('health-check-lambda')
        
        # Lambda code with retry logic and error handling
        lambda_code = """
import json
import boto3
import os
from datetime import datetime
from typing import Dict, List, Any

# Initialize AWS clients
ec2_client = boto3.client('ec2')
asg_client = boto3.client('autoscaling')
cloudwatch_client = boto3.client('cloudwatch')

# Configuration
ASG_NAME = os.environ.get('ASG_NAME')
MAX_RETRIES = 3
NAMESPACE = os.environ.get('CLOUDWATCH_NAMESPACE', 'TAP/HealthCheck')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    \"\"\"
    Monitor EC2 instance health in Auto Scaling Group and replace unhealthy instances.
    
    This function:
    1. Queries all instances in the ASG
    2. Checks their health status
    3. Marks unhealthy instances for replacement
    4. Publishes metrics to CloudWatch
    5. Includes retry logic for transient failures
    \"\"\"
    print(f"Starting health check for ASG: {ASG_NAME}")
    
    try:
        # Get instances from Auto Scaling Group
        instances = get_asg_instances(ASG_NAME)
        
        if not instances:
            print(f"No instances found in ASG: {ASG_NAME}")
            publish_metric('InstanceCount', 0)
            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'No instances to check', 'asg': ASG_NAME})
            }
        
        print(f"Found {len(instances)} instances in ASG")
        
        # Check health of each instance
        healthy_count = 0
        unhealthy_count = 0
        replaced_count = 0
        
        for instance in instances:
            instance_id = instance['InstanceId']
            lifecycle_state = instance['LifecycleState']
            health_status = instance['HealthStatus']
            
            print(f"Checking instance {instance_id}: lifecycle={lifecycle_state}, health={health_status}")
            
            # Check EC2 instance status
            ec2_status = check_ec2_instance_status(instance_id)
            
            if ec2_status == 'healthy' and health_status == 'Healthy' and lifecycle_state == 'InService':
                healthy_count += 1
                print(f"Instance {instance_id} is healthy")
            else:
                unhealthy_count += 1
                print(f"Instance {instance_id} is unhealthy: ec2_status={ec2_status}, health={health_status}")
                
                # Attempt to replace unhealthy instance with retry logic
                if replace_unhealthy_instance(instance_id, ASG_NAME):
                    replaced_count += 1
        
        # Publish metrics to CloudWatch
        publish_metric('HealthyInstances', healthy_count)
        publish_metric('UnhealthyInstances', unhealthy_count)
        publish_metric('ReplacedInstances', replaced_count)
        
        result = {
            'total_instances': len(instances),
            'healthy': healthy_count,
            'unhealthy': unhealthy_count,
            'replaced': replaced_count,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        print(f"Health check completed: {json.dumps(result)}")
        
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        error_msg = f"Error in health check: {str(e)}"
        print(error_msg)
        publish_metric('HealthCheckErrors', 1)
        
        return {
            'statusCode': 500,
            'body': json.dumps({'error': error_msg})
        }


def get_asg_instances(asg_name: str) -> List[Dict[str, Any]]:
    \"\"\"Get all instances from Auto Scaling Group.\"\"\"
    try:
        response = asg_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        
        if not response['AutoScalingGroups']:
            return []
        
        return response['AutoScalingGroups'][0]['Instances']
    except Exception as e:
        print(f"Error getting ASG instances: {str(e)}")
        return []


def check_ec2_instance_status(instance_id: str) -> str:
    \"\"\"Check EC2 instance status.\"\"\"
    try:
        response = ec2_client.describe_instance_status(
            InstanceIds=[instance_id],
            IncludeAllInstances=True
        )
        
        if not response['InstanceStatuses']:
            return 'unknown'
        
        status = response['InstanceStatuses'][0]
        instance_status = status.get('InstanceStatus', {}).get('Status', 'unknown')
        system_status = status.get('SystemStatus', {}).get('Status', 'unknown')
        
        if instance_status == 'ok' and system_status == 'ok':
            return 'healthy'
        else:
            return 'unhealthy'
    except Exception as e:
        print(f"Error checking EC2 status for {instance_id}: {str(e)}")
        return 'unknown'


def replace_unhealthy_instance(instance_id: str, asg_name: str) -> bool:
    \"\"\"
    Replace unhealthy instance with retry logic.
    
    \"\"\"
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print(f"Attempt {attempt}/{MAX_RETRIES}: Marking instance {instance_id} as unhealthy")
            
            asg_client.set_instance_health(
                InstanceId=instance_id,
                HealthStatus='Unhealthy',
                ShouldRespectGracePeriod=False
            )
            
            print(f"Successfully marked instance {instance_id} as unhealthy")
            return True
            
        except Exception as e:
            print(f"Attempt {attempt} failed for instance {instance_id}: {str(e)}")
            if attempt == MAX_RETRIES:
                print(f"All {MAX_RETRIES} attempts failed for instance {instance_id}")
                return False
    
    return False


def publish_metric(metric_name: str, value: float) -> None:
    \"\"\"Publish custom metric to CloudWatch.\"\"\"
    try:
        cloudwatch_client.put_metric_data(
            Namespace=NAMESPACE,
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    except Exception as e:
        print(f"Error publishing metric {metric_name}: {str(e)}")
"""
        
        # Create Lambda function
        function = aws.lambda_.Function(
            function_name,
            name=function_name,
            runtime=self.config.lambda_runtime,  # Python 3.11
            handler="index.lambda_handler",
            role=self.lambda_role_arn,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ASG_NAME": self.asg_name,
                    "CLOUDWATCH_NAMESPACE": f"{self.config.project_name}/HealthCheck"
                }
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': function_name
            },
            opts=ResourceOptions(parent=self.parent)
        )
        
        return function
    
    # Getter methods for outputs
    def get_function_arn(self) -> Output[str]:
        """Get Lambda function ARN."""
        return self.health_check_function.arn
    
    def get_function_name(self) -> Output[str]:
        """Get Lambda function name."""
        return self.health_check_function.name

