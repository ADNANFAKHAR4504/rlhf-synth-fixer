import json
import os
from datetime import datetime

import boto3


def handler(event, context):
    """
    Lambda function to handle automated failover
    """
    primary_region = os.environ['PRIMARY_REGION']
    secondary_region = os.environ['SECONDARY_REGION']
    
    # Initialize clients
    rds_secondary = boto3.client('rds', region_name=secondary_region)
    route53 = boto3.client('route53')
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
            
            # 3. Update Route53 weights (handled automatically by health checks)
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Failover completed successfully',
                    'timestamp': str(datetime.now()),
                    'action': 'promoted_secondary'
                })
            }
            
    except Exception as e:
        print(f"Error during failover: {str(e)}")
        raise e
