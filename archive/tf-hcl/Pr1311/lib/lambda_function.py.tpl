import json
import boto3
import os
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS services for X-Ray tracing
patch_all()

dynamodb = boto3.resource('dynamodb')

@xray_recorder.capture('lambda_handler')
def lambda_handler(event, context):
    service_name = os.environ.get('SERVICE_NAME', '${service_name}')
    
    try:
        # Log the incoming event
        print(f"Processing request for {service_name} service")
        print(f"Event: {json.dumps(event)}")
        
        # Example service logic based on service type
        if service_name == 'user':
            return handle_user_service(event)
        elif service_name == 'order':
            return handle_order_service(event)
        elif service_name == 'notification':
            return handle_notification_service(event)
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Unknown service'})
            }
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }

@xray_recorder.capture('handle_user_service')
def handle_user_service(event):
    table_name = os.environ.get('USERS_TABLE')
    table = dynamodb.Table(table_name)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'User service is healthy',
            'service': 'user',
            'table': table_name
        })
    }

@xray_recorder.capture('handle_order_service')
def handle_order_service(event):
    table_name = os.environ.get('ORDERS_TABLE')
    table = dynamodb.Table(table_name)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Order service is healthy',
            'service': 'order',
            'table': table_name
        })
    }

@xray_recorder.capture('handle_notification_service')
def handle_notification_service(event):
    table_name = os.environ.get('NOTIFICATIONS_TABLE')
    table = dynamodb.Table(table_name)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Notification service is healthy',
            'service': 'notification',
            'table': table_name
        })
    }