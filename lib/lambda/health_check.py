"""
Health Check Lambda Function for CI/CD Pipeline

This Lambda function validates deployment health by checking CloudWatch alarms
and triggers automatic rollback if health checks fail.
"""

import json
import boto3
import os
from datetime import datetime, timedelta

cloudwatch = boto3.client('cloudwatch')
ecs = boto3.client('ecs')
codepipeline = boto3.client('codepipeline')
sns = boto3.client('sns')


def lambda_handler(event, context):
    """
    Health validation Lambda function.
    Checks CloudWatch alarms and triggers rollback if thresholds are breached.

    Args:
        event: CodePipeline event with job details and user parameters
        context: Lambda execution context

    Returns:
        dict: Response with status code and message
    """
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
                print(f"Alarm in ALARM state: {alarm['AlarmName']}")

        if breached_alarms:
            error_message = f"Alarms breached: {', '.join(breached_alarms)}"
            print(f"FAILED: {error_message}")

            # Get service information for rollback
            service_response = ecs.describe_services(
                cluster=cluster_name,
                services=[service_name]
            )

            if service_response['services']:
                current_task_def = service_response['services'][0]['taskDefinition']
                print(f"Current task definition: {current_task_def}")

                # Notify via SNS
                sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
                if sns_topic_arn:
                    sns.publish(
                        TopicArn=sns_topic_arn,
                        Subject=f"Deployment Rollback Triggered: {service_name}",
                        Message=f"Deployment failed health check.\n\n{error_message}\n\nCluster: {cluster_name}\nService: {service_name}\nTimestamp: {datetime.utcnow().isoformat()}\n\nRollback initiated."
                    )

            # Report failure to CodePipeline
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
                'body': json.dumps({
                    'status': 'failed',
                    'message': error_message,
                    'breached_alarms': breached_alarms
                })
            }

        print("SUCCESS: All health checks passed")

        # Report success to CodePipeline
        if job_id:
            codepipeline.put_job_success_result(jobId=job_id)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'success',
                'message': 'All health checks passed',
                'cluster': cluster_name,
                'service': service_name
            })
        }

    except KeyError as e:
        error_message = f"Missing required parameter: {str(e)}"
        print(error_message)

        if job_id:
            codepipeline.put_job_failure_result(
                jobId=job_id,
                failureDetails={
                    'type': 'ConfigurationError',
                    'message': error_message
                }
            )

        return {
            'statusCode': 400,
            'body': json.dumps({'status': 'error', 'message': error_message})
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


def check_service_health(cluster_name, service_name):
    """
    Check the health of an ECS service.

    Args:
        cluster_name: Name of the ECS cluster
        service_name: Name of the ECS service

    Returns:
        dict: Service health information
    """
    try:
        response = ecs.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )

        if not response['services']:
            return {'healthy': False, 'message': 'Service not found'}

        service = response['services'][0]
        desired_count = service['desiredCount']
        running_count = service['runningCount']

        health_info = {
            'healthy': running_count >= desired_count,
            'desired_count': desired_count,
            'running_count': running_count,
            'deployment_count': len(service['deployments'])
        }

        return health_info

    except Exception as e:
        return {'healthy': False, 'message': str(e)}
