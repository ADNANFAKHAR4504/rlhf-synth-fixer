import json
import boto3
import os
import logging
from datetime import datetime
import uuid
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.event_handler.exceptions import (
    BadRequestError,
    InternalServerError,
    NotFoundError
)

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="ServerlessApp")
app = APIGatewayRestResolver(enable_validation=True)

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME')
table = dynamodb.Table(table_name)

@app.get("/data")
@tracer.capture_method
def get_data():
    """Get all data items"""
    try:
        logger.info("Getting all data items")
        
        response = table.scan()
        items = response.get('Items', [])
        
        metrics.add_metric(name="DataItemsRetrieved", unit=MetricUnit.Count, value=len(items))
        logger.info(f"Retrieved {len(items)} items")
        
        return {
            "statusCode": 200,
            "items": items,
            "count": len(items)
        }
    except Exception as e:
        logger.error(f"Error getting data: {str(e)}")
        metrics.add_metric(name="DataRetrievalErrors", unit=MetricUnit.Count, value=1)
        raise InternalServerError("Failed to retrieve data")

@app.post("/data")
@tracer.capture_method
def create_data():
    """Create a new data item"""
    try:
        data = app.current_event.json_body
        
        if not data:
            raise BadRequestError("Request body is required")
        
        # Generate unique ID and timestamp
        item_id = str(uuid.uuid4())
        timestamp = int(datetime.now().timestamp())
        
        item = {
            'id': item_id,
            'timestamp': timestamp,
            'data': data,
            'created_at': datetime.now().isoformat(),
            'environment': os.environ.get('ENVIRONMENT', 'dev')
        }
        
        logger.info(f"Creating item with ID: {item_id}")
        table.put_item(Item=item)
        
        metrics.add_metric(name="DataItemsCreated", unit=MetricUnit.Count, value=1)
        logger.info(f"Successfully created item: {item_id}")
        
        return {
            "statusCode": 201,
            "message": "Item created successfully",
            "item_id": item_id,
            "item": item
        }
    except BadRequestError:
        raise
    except Exception as e:
        logger.error(f"Error creating data: {str(e)}")
        metrics.add_metric(name="DataCreationErrors", unit=MetricUnit.Count, value=1)
        raise InternalServerError("Failed to create data item")

@app.put("/data/<item_id>")
@tracer.capture_method
def update_data(item_id: str):
    """Update an existing data item"""
    try:
        data = app.current_event.json_body
        
        if not data:
            raise BadRequestError("Request body is required")
        
        logger.info(f"Updating item with ID: {item_id}")
        
        # Check if item exists
        try:
            response = table.get_item(Key={'id': item_id})
            if 'Item' not in response:
                raise NotFoundError(f"Item with ID {item_id} not found")
        except Exception as e:
            logger.error(f"Error checking item existence: {str(e)}")
            raise NotFoundError(f"Item with ID {item_id} not found")
        
        # Update the item
        timestamp = int(datetime.now().timestamp())
        update_expression = "SET #data = :data, #updated_at = :updated_at, #timestamp = :timestamp"
        expression_attribute_names = {
            '#data': 'data',
            '#updated_at': 'updated_at',
            '#timestamp': 'timestamp'
        }
        expression_attribute_values = {
            ':data': data,
            ':updated_at': datetime.now().isoformat(),
            ':timestamp': timestamp
        }
        
        response = table.update_item(
            Key={'id': item_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="ALL_NEW"
        )
        
        updated_item = response['Attributes']
        
        metrics.add_metric(name="DataItemsUpdated", unit=MetricUnit.Count, value=1)
        logger.info(f"Successfully updated item: {item_id}")
        
        return {
            "statusCode": 200,
            "message": "Item updated successfully",
            "item_id": item_id,
            "item": updated_item
        }
    except (BadRequestError, NotFoundError):
        raise
    except Exception as e:
        logger.error(f"Error updating data: {str(e)}")
        metrics.add_metric(name="DataUpdateErrors", unit=MetricUnit.Count, value=1)
        raise InternalServerError("Failed to update data item")

@app.delete("/data/<item_id>")
@tracer.capture_method
def delete_data(item_id: str):
    """Delete a data item"""
    try:
        logger.info(f"Deleting item with ID: {item_id}")
        
        # Check if item exists
        try:
            response = table.get_item(Key={'id': item_id})
            if 'Item' not in response:
                raise NotFoundError(f"Item with ID {item_id} not found")
        except Exception as e:
            logger.error(f"Error checking item existence: {str(e)}")
            raise NotFoundError(f"Item with ID {item_id} not found")
        
        # Delete the item
        table.delete_item(Key={'id': item_id})
        
        metrics.add_metric(name="DataItemsDeleted", unit=MetricUnit.Count, value=1)
        logger.info(f"Successfully deleted item: {item_id}")
        
        return {
            "statusCode": 200,
            "message": f"Item {item_id} deleted successfully"
        }
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"Error deleting data: {str(e)}")
        metrics.add_metric(name="DataDeletionErrors", unit=MetricUnit.Count, value=1)
        raise InternalServerError("Failed to delete data item")

@logger.inject_lambda_context(correlation_id_path="requestContext.requestId")
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event, context):
    """Main Lambda handler"""
    try:
        logger.info(f"Received event: {json.dumps(event, default=str)}")
        
        # Add custom metrics
        metrics.add_metadata(key="environment", value=os.environ.get('ENVIRONMENT', 'dev'))
        metrics.add_metadata(key="function_name", value=context.function_name)
        
        return app.resolve(event, context)
    except Exception as e:
        logger.error(f"Unhandled error: {str(e)}")
        metrics.add_metric(name="UnhandledErrors", unit=MetricUnit.Count, value=1)
        return {
            "statusCode": 500,
            "body": json.dumps({"message": "Internal server error"})
        }