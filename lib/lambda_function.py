import json
import boto3
import os
import time
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
stepfunctions = boto3.client('stepfunctions')
sqs = boto3.client('sqs')

# Get environment variables
TABLE_NAME = os.environ.get('DYNAMODB_TABLE', 'transactions')
PRIORITY = os.environ.get('PRIORITY', 'medium')
STEP_FUNCTION_ARN = os.environ.get('STEP_FUNCTION_ARN', '')

table = dynamodb.Table(TABLE_NAME)

def handler(event, context):
    print(f"Processing {len(event.get('Records', []))} messages with {PRIORITY} priority")
    
    # Handle different types of invocations
    if 'Records' in event:
        # SQS trigger
        return handle_sqs_messages(event['Records'])
    elif 'operation' in event:
        # Direct invocation from Step Functions
        return handle_step_function_operation(event)
    else:
        return {
            'statusCode': 400,
            'body': json.dumps('Unknown event type')
        }

def handle_sqs_messages(records):
    for record in records:
        try:
            # Parse SQS message
            message_body = json.loads(record['body'])
            
            # Extract transaction details
            transaction_id = message_body.get('transactionId')
            amount = Decimal(str(message_body.get('amount', 0)))
            
            print(f"Processing transaction {transaction_id} with amount ${amount}")
            
            # Store transaction metadata in DynamoDB
            ttl_timestamp = int(time.time()) + (90 * 24 * 60 * 60)  # 90 days from now
            
            table.put_item(
                Item={
                    'transactionId': transaction_id,
                    'amount': amount,
                    'priority': PRIORITY,
                    'status': 'processing',
                    'timestamp': int(time.time()),
                    'expirationTime': ttl_timestamp
                }
            )
            
            # Start Step Functions execution for complex validation
            # Note: STEP_FUNCTION_ARN will be set via deployment scripts or environment
            step_function_arn = os.environ.get('STEP_FUNCTION_ARN')
            if step_function_arn:
                step_input = {
                    'transactionId': transaction_id,
                    'amount': float(amount),
                    'priority': PRIORITY,
                    'fraudCheck': True,
                    'balanceVerification': True,
                    'complianceScreening': True
                }
                
                sf_response = stepfunctions.start_execution(
                    stateMachineArn=step_function_arn,
                    name=f"{transaction_id}-{int(time.time())}",
                    input=json.dumps(step_input)
                )
                
                print(f"Started Step Functions execution: {sf_response['executionArn']}")
                
                # Update transaction status
                table.update_item(
                    Key={'transactionId': transaction_id},
                    UpdateExpression='SET #status = :status, executionArn = :arn',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={
                        ':status': 'validation_started',
                        ':arn': sf_response['executionArn']
                    }
                )
            
        except Exception as e:
            print(f"Error processing message: {str(e)}")
            raise e
    
    return {
        'statusCode': 200,
        'body': json.dumps(f'Successfully processed {len(records)} messages')
    }

def handle_step_function_operation(event):
    operation = event.get('operation')
    transaction_id = event.get('transactionId')
    amount = event.get('amount', 0)
    
    print(f"Handling {operation} for transaction {transaction_id}")
    
    try:
        if operation == 'fraud_check':
            # Simulate fraud detection logic
            fraud_detected = amount > 50000  # Simple rule: flag transactions > $50k
            return {
                'fraudDetected': fraud_detected,
                'reason': 'High amount transaction' if fraud_detected else 'Normal transaction'
            }
        
        elif operation == 'balance_check':
            # Simulate balance verification
            # In real implementation, this would check account balance
            sufficient_balance = amount < 100000  # Simple rule: approve if < $100k
            return {
                'sufficientBalance': sufficient_balance,
                'reason': 'Insufficient funds' if not sufficient_balance else 'Sufficient balance'
            }
        
        elif operation == 'compliance_check':
            # Simulate compliance screening
            requires_review = amount > 10000  # Transactions > $10k need human review
            return {
                'requiresHumanReview': requires_review,
                'compliancePassed': True,
                'reason': 'Requires manual review' if requires_review else 'Auto-approved'
            }
        
        elif operation == 'request_human_approval':
            # In real implementation, this would trigger a human approval workflow
            # For demo purposes, we'll simulate approval based on amount
            task_token = event.get('taskToken')
            
            # Simulate human approval logic
            # In production, this would integrate with an approval system
            approved = amount < 75000  # Auto-approve transactions < $75k for demo
            
            # Send task success back to Step Functions
            if task_token:
                if approved:
                    stepfunctions.send_task_success(
                        taskToken=task_token,
                        output=json.dumps({'approved': True, 'reviewer': 'system-auto'})
                    )
                else:
                    stepfunctions.send_task_failure(
                        taskToken=task_token,
                        error='ApprovalRejected',
                        cause='Transaction amount exceeds auto-approval threshold'
                    )
            
            return {
                'approved': approved,
                'reviewer': 'system-auto'
            }
        
        else:
            raise ValueError(f"Unknown operation: {operation}")
    
    except Exception as e:
        print(f"Error in operation {operation}: {str(e)}")
        raise e