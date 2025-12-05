#!/usr/bin/env python3
"""
Lambda Function for Custom Metric Collection using CloudWatch EMF
Purpose: Collect and publish custom metrics using Embedded Metric Format
for efficient metric ingestion and processing
"""

import json
import os
import random
import time
from datetime import datetime


def lambda_handler(event, context):
    """
    Main Lambda handler function that generates and publishes custom metrics
    using CloudWatch Embedded Metric Format (EMF)
    
    Args:
        event: Lambda event object (EventBridge scheduled event)
        context: Lambda context object with runtime information
    
    Returns:
        dict: Response indicating successful execution
    """
    
    # Get environment variables
    namespace = os.environ.get('NAMESPACE', 'fintech/payments/metrics')
    environment = os.environ.get('ENVIRONMENT', 'dev')
    
    # Simulate metric values for demonstration
    # In production, these would be collected from actual services
    request_count = random.randint(100, 1000)
    error_count = random.randint(0, 50)
    processing_time = random.uniform(50, 500)  # milliseconds
    transaction_volume = random.randint(5000, 20000)
    total_requests = request_count + error_count
    
    # Create EMF log entry with _aws metadata block
    emf_log = {
        "_aws": {
            "Timestamp": int(time.time() * 1000),  # Milliseconds since epoch
            "CloudWatchMetrics": [
                {
                    "Namespace": namespace,
                    "Dimensions": [
                        ["Service", "Environment"],
                        ["Service"],
                        ["Environment"]
                    ],
                    "Metrics": [
                        {
                            "Name": "RequestCount",
                            "Unit": "Count"
                        },
                        {
                            "Name": "ErrorCount",
                            "Unit": "Count"
                        },
                        {
                            "Name": "ProcessingTime",
                            "Unit": "Milliseconds"
                        },
                        {
                            "Name": "PaymentTransactionVolume",
                            "Unit": "Count"
                        },
                        {
                            "Name": "TotalRequests",
                            "Unit": "Count"
                        }
                    ]
                }
            ]
        },
        # Dimension values
        "Service": "payment-processor",
        "Environment": environment,
        
        # Metric values
        "RequestCount": request_count,
        "ErrorCount": error_count,
        "ProcessingTime": processing_time,
        "PaymentTransactionVolume": transaction_volume,
        "TotalRequests": total_requests,
        
        # Additional properties for context
        "executionTime": datetime.utcnow().isoformat(),
        "functionName": context.function_name,
        "functionVersion": context.function_version,
        "requestId": context.aws_request_id,
        "logGroupName": context.log_group_name,
        "logStreamName": context.log_stream_name,
        
        # Trace information
        "traceId": os.environ.get('_X_AMZN_TRACE_ID', 'none')
    }
    
    # Print EMF log to stdout - CloudWatch will parse and extract metrics
    print(json.dumps(emf_log))
    
    # Simulate additional service-specific metrics
    services = ['payment-gateway', 'fraud-detection', 'transaction-validator']
    for service in services:
        service_emf = {
            "_aws": {
                "Timestamp": int(time.time() * 1000),
                "CloudWatchMetrics": [
                    {
                        "Namespace": namespace,
                        "Dimensions": [["Service", "Environment"]],
                        "Metrics": [
                            {"Name": "ServiceLatency", "Unit": "Milliseconds"},
                            {"Name": "ServiceAvailability", "Unit": "Percent"}
                        ]
                    }
                ]
            },
            "Service": service,
            "Environment": environment,
            "ServiceLatency": random.uniform(10, 200),
            "ServiceAvailability": random.uniform(99.0, 99.99)
        }
        print(json.dumps(service_emf))
    
    # Return success response
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Metrics published successfully',
            'timestamp': datetime.utcnow().isoformat(),
            'metrics': {
                'RequestCount': request_count,
                'ErrorCount': error_count,
                'ProcessingTime': processing_time,
                'TransactionVolume': transaction_volume
            }
        })
    }


# Additional helper function for testing locally
if __name__ == "__main__":
    # Mock context for local testing
    class Context:
        function_name = "lambda-metric-collector-dev"
        function_version = "$LATEST"
        aws_request_id = "test-request-id"
        log_group_name = "/aws/lambda/lambda-metric-collector-dev"
        log_stream_name = "test-stream"
    
    # Test the handler
    result = lambda_handler({}, Context())
    print(f"\nHandler Response: {json.dumps(result, indent=2)}")