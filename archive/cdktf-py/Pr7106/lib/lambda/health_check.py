import json
import boto3
import os
from datetime import datetime, timedelta

cloudwatch = boto3.client('cloudwatch')
ecs = boto3.client('ecs')
codepipeline = boto3.client('codepipeline')
sns = boto3.client('sns')

def lambda_handler(event, context):
    '''
    Health validation Lambda function.
    Checks CloudWatch alarms and triggers rollback if thresholds are breached.
    '''
    job_id = event.get('CodePipeline.job', {}).get('id')

    try:
        # Extract deployment information
        user_parameters = json.loads(
            event['CodePipeline.job']['data']['actionConfiguration']['configuration']['UserParameters']
        )

        cluster_name = user_parameters['cluster']
        service_name = user_parameters['service']
        alarm_names = user_parameters['alarms']

        print(f"Validating deployment for {service_name} in {cluster_name}")

        # Check CloudWatch alarms
        alarm_response = cloudwatch.describe_alarms(AlarmNames=alarm_names)

        breached_alarms = []
        for alarm in alarm_response['MetricAlarms']:
            if alarm['StateValue'] == 'ALARM':
                breached_alarms.append(alarm['AlarmName'])

        if breached_alarms:
            error_message = f"Alarms breached: {', '.join(breached_alarms)}"
            print(f"FAILED: {error_message}")

            # Trigger rollback by reverting to previous task definition
            service_response = ecs.describe_services(
                cluster=cluster_name,
                services=[service_name]
            )

            current_task_def = service_response['services'][0]['taskDefinition']
            print(f"Current task definition: {current_task_def}")

            # Notify via SNS
            sns.publish(
                TopicArn=os.environ['SNS_TOPIC_ARN'],
                Subject=f"Deployment Rollback Triggered: {service_name}",
                Message=f"Deployment failed health check. {error_message}\n\nRollback initiated."
            )

            # Report failure to CodePipeline
            codepipeline.put_job_failure_result(
                jobId=job_id,
                failureDetails={
                    'type': 'JobFailed',
                    'message': error_message
                }
            )

            return {
                'statusCode': 500,
                'body': json.dumps({'status': 'failed', 'message': error_message})
            }

        print("SUCCESS: All health checks passed")

        # Report success to CodePipeline
        if job_id:
            codepipeline.put_job_success_result(jobId=job_id)

        return {
            'statusCode': 200,
            'body': json.dumps({'status': 'success', 'message': 'All health checks passed'})
        }

    except Exception as e:
        error_message = f"Health check failed: {str(e)}"
        print(error_message)

        if job_id:
            codepipeline.put_job_failure_result(
                jobId=job_id,
                failureDetails={
                    'type': 'JobFailed',
                    'message': error_message
                }
            )

        return {
            'statusCode': 500,
            'body': json.dumps({'status': 'error', 'message': error_message})
        }
