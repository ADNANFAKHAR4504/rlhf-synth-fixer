import json
import time
import os
import logging
from datetime import datetime
import boto3

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients (these will be reused across invocations)
lambda_client = boto3.client('lambda')
cloudwatch_client = boto3.client('cloudwatch')

def handler(event, context):
    """
    Cold start optimized Python Lambda handler with provisioned concurrency.
    This function demonstrates cold start optimization techniques.
    """
    start_time = time.time()
    
    # Log function details
    function_name = context.function_name
    request_id = context.aws_request_id
    memory_limit = context.memory_limit_in_mb
    remaining_time = context.get_remaining_time_in_millis()
    
    logger.info(f"Cold start optimized Python Lambda started at: {datetime.now()}")
    logger.info(f"Function: {function_name}, Request ID: {request_id}")
    logger.info(f"Memory: {memory_limit}MB, Time remaining: {remaining_time}ms")
    
    # Simulate some processing work
    processing_result = simulate_processing()
    
    # Calculate execution time
    execution_time = (time.time() - start_time) * 1000  # Convert to milliseconds
    
    # Prepare response
    response = {
        "statusCode": 200,
        "message": "Cold start optimized Python Lambda executed successfully",
        "timestamp": datetime.now().isoformat(),
        "functionName": function_name,
        "requestId": request_id,
        "executionTimeMs": round(execution_time, 2),
        "memoryLimitMB": memory_limit,
        "coldStartOptimized": True,
        "runtime": "python3.9",
        "optimizationTechnique": "provisioned_concurrency",
        "processingResult": processing_result
    }
    
    # Log completion
    logger.info(f"Function completed in {execution_time:.2f}ms")
    
    return response

def simulate_processing():
    """
    Simulate some processing work to demonstrate the function's capabilities.
    In a real scenario, this would be your actual business logic.
    """
    # Simulate database query, API call, or computation
    time.sleep(0.05)  # 50ms processing simulation
    
    return {
        "dataProcessed": True,
        "recordsCount": 100,
        "processingType": "batch_optimization"
    }

def get_function_metrics():
    """
    Get function performance metrics for monitoring.
    This demonstrates integration with CloudWatch metrics.
    """
    try:
        # Get function metrics (this would be used for monitoring)
        metrics = cloudwatch_client.get_metric_statistics(
            Namespace='AWS/Lambda',
            MetricName='Duration',
            Dimensions=[
                {
                    'Name': 'FunctionName',
                    'Value': os.environ.get('AWS_LAMBDA_FUNCTION_NAME', 'unknown')
                }
            ],
            StartTime=datetime.utcnow(),
            EndTime=datetime.utcnow(),
            Period=300,
            Statistics=['Average', 'Maximum', 'Minimum']
        )
        return metrics
    except Exception as e:
        logger.warning(f"Could not retrieve metrics: {str(e)}")
        return None

