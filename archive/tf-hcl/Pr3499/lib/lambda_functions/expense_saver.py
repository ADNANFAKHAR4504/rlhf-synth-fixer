import json
import boto3
import os
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any
import uuid

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

EXPENSES_TABLE = os.environ['EXPENSES_TABLE']
DLQ_URL = os.environ['DLQ_URL']

table = dynamodb.Table(EXPENSES_TABLE)

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Save processed expense record to DynamoDB"""

    try:
        # Extract data from combined results
        receipt_id = event.get('receiptId', str(uuid.uuid4()))
        user_id = event.get('userId', 'unknown')

        ocr_data = event.get('ocrData', {}).get('extractedData', {})
        category_data = event.get('categoryData', {})

        # Parse amount
        total_amount = ocr_data.get('total', '0')
        try:
            # Remove currency symbols and parse
            amount = Decimal(total_amount.replace('$', '').replace(',', ''))
        except:
            amount = Decimal('0')

        # Parse date
        expense_date = ocr_data.get('date', datetime.utcnow().isoformat())
        if not expense_date:
            expense_date = datetime.utcnow().isoformat()

        # Prepare item for DynamoDB
        expense_item = {
            'expense_id': receipt_id,
            'user_id': user_id,
            'expense_date': expense_date,
            'amount': amount,
            'vendor': ocr_data.get('vendor', 'Unknown'),
            'category': category_data.get('category', 'OTHER'),
            'category_confidence': Decimal(str(category_data.get('confidence', 0))),
            'items': json.dumps(ocr_data.get('items', [])),
            'entities': category_data.get('entities', []),
            'key_phrases': category_data.get('keyPhrases', []),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat(),
            'processing_status': 'completed'
        }

        # Save to DynamoDB
        table.put_item(Item=expense_item)

        return {
            'statusCode': 200,
            'expenseId': receipt_id,
            'userId': user_id,
            'category': expense_item['category'],
            'amount': json.dumps(amount, default=decimal_default),
            'message': 'Expense record saved successfully'
        }

    except Exception as e:
        error_message = {
            'error': str(e),
            'event': event
        }

        # Send to DLQ
        sqs.send_message(
            QueueUrl=DLQ_URL,
            MessageBody=json.dumps(error_message)
        )

        raise e