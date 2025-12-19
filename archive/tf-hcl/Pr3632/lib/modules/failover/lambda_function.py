import json
import os
from datetime import datetime

import boto3


def handler(event, context):
    """
    Lambda function to handle automated failover using Global Accelerator
    """
    primary_region = os.environ['PRIMARY_REGION']
    secondary_region = os.environ['SECONDARY_REGION']
    
    # Initialize clients
    rds_secondary = boto3.client('rds', region_name=secondary_region)
    globalaccelerator = boto3.client('globalaccelerator')
    autoscaling_secondary = boto3.client('autoscaling', region_name=secondary_region)
    
    try:
        # Parse SNS message
        message = json.loads(event['Records'][0]['Sns']['Message'])
        alarm_name = message['AlarmName']
        
        if 'primary-region-health' in alarm_name:
            print(f"Primary region failure detected at {datetime.now()}")
            
            # 1. Promote read replica to master
            response = rds_secondary.promote_read_replica(
                DBInstanceIdentifier=os.environ['SECONDARY_DB_ARN'].split(':')[-1]
            )
            print(f"Database promotion initiated: {response}")
            
            # 2. Scale up secondary region ASG
            response = autoscaling_secondary.update_auto_scaling_group(
                AutoScalingGroupName=f"production-asg-{secondary_region}",
                MinSize=4,
                DesiredCapacity=6
            )
            print(f"Auto Scaling Group updated: {response}")
            
            # 3. Update Global Accelerator endpoint weights
            # Set primary weight to 0 and secondary weight to 100
            accelerator_arn = os.environ['ACCELERATOR_ARN']
            primary_alb_arn = os.environ['PRIMARY_ALB_ARN']
            secondary_alb_arn = os.environ['SECONDARY_ALB_ARN']
            
            # Get the endpoint group ARN
            listener_arn = f"{accelerator_arn}/listener/443"
            
            response = globalaccelerator.update_endpoint_group(
                EndpointGroupArn=f"{listener_arn}/endpointgroup/primary",
                EndpointConfigurations=[
                    {
                        'EndpointId': primary_alb_arn,
                        'Weight': 0,
                        'ClientIPPreservationEnabled': True
                    },
                    {
                        'EndpointId': secondary_alb_arn,
                        'Weight': 100,
                        'ClientIPPreservationEnabled': True
                    }
                ]
            )
            print(f"Global Accelerator endpoint weights updated: {response}")
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Failover completed successfully',
                    'timestamp': str(datetime.now()),
                    'action': 'promoted_secondary',
                    'global_accelerator_updated': True
                })
            }
            
    except Exception as e:
        print(f"Error during failover: {str(e)}")
        raise e