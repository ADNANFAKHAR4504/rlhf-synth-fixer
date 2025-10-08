import json
import boto3
import os
from typing import Dict, Any

textract = boto3.client('textract')
s3_client = boto3.client('s3')
sqs = boto3.client('sqs')

DLQ_URL = os.environ['DLQ_URL']
RECEIPTS_BUCKET = os.environ['RECEIPTS_BUCKET']

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Process receipt image with Textract for OCR"""

    try:
        input_data = event.get('Input', event)
        bucket = input_data['bucket']
        key = input_data['key']

        # Use Textract AnalyzeExpense for receipt-specific extraction
        response = textract.analyze_expense(
            Document={
                'S3Object': {
                    'Bucket': bucket,
                    'Name': key
                }
            }
        )

        # Extract expense data
        expense_documents = response.get('ExpenseDocuments', [])

        extracted_data = {
            'vendor': None,
            'total': None,
            'date': None,
            'items': [],
            'raw_text': []
        }

        for doc in expense_documents:
            for field in doc.get('SummaryFields', []):
                field_type = field.get('Type', {}).get('Text', '')
                value_text = field.get('ValueDetection', {}).get('Text', '')

                if field_type == 'VENDOR_NAME':
                    extracted_data['vendor'] = value_text
                elif field_type == 'TOTAL':
                    extracted_data['total'] = value_text
                elif field_type == 'INVOICE_RECEIPT_DATE':
                    extracted_data['date'] = value_text

            # Extract line items
            for line_item in doc.get('LineItemGroups', []):
                for item in line_item.get('LineItems', []):
                    item_data = {}
                    for field in item.get('LineItemExpenseFields', []):
                        field_type = field.get('Type', {}).get('Text', '')
                        value_text = field.get('ValueDetection', {}).get('Text', '')
                        item_data[field_type] = value_text
                    if item_data:
                        extracted_data['items'].append(item_data)

        # Get raw text for fallback processing
        text_response = textract.detect_document_text(
            Document={
                'S3Object': {
                    'Bucket': bucket,
                    'Name': key
                }
            }
        )

        for block in text_response['Blocks']:
            if block['BlockType'] == 'LINE':
                extracted_data['raw_text'].append(block['Text'])

        return {
            'statusCode': 200,
            'extractedData': extracted_data,
            'receiptId': input_data['receiptId'],
            'userId': input_data['userId']
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