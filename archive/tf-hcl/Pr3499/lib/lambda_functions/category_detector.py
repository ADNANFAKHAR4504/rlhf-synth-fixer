import json
import boto3
import os
from typing import Dict, Any, List

comprehend = boto3.client('comprehend')
sqs = boto3.client('sqs')

DLQ_URL = os.environ['DLQ_URL']

# Predefined expense categories and keywords
EXPENSE_CATEGORIES = {
    'FOOD_DINING': ['restaurant', 'food', 'lunch', 'dinner', 'breakfast', 'coffee', 'cafe'],
    'TRANSPORTATION': ['uber', 'lyft', 'taxi', 'gas', 'fuel', 'parking', 'transit'],
    'OFFICE_SUPPLIES': ['staples', 'office', 'supplies', 'paper', 'printer', 'computer'],
    'TRAVEL': ['hotel', 'flight', 'airline', 'accommodation', 'booking'],
    'ENTERTAINMENT': ['movie', 'concert', 'event', 'tickets', 'entertainment'],
    'UTILITIES': ['electric', 'water', 'gas', 'internet', 'phone', 'utility'],
    'HEALTHCARE': ['pharmacy', 'doctor', 'medical', 'hospital', 'clinic'],
    'OTHER': []
}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Detect expense category using Comprehend"""

    try:
        input_data = event.get('Input', event)

        # Get text from either raw event or OCR result
        text_to_analyze = ""
        if 'ocrResult' in input_data and 'Payload' in input_data['ocrResult']:
            ocr_data = input_data['ocrResult']['Payload'].get('extractedData', {})
            vendor = ocr_data.get('vendor', '')
            raw_text = ' '.join(ocr_data.get('raw_text', []))
            text_to_analyze = f"{vendor} {raw_text}"
        else:
            text_to_analyze = str(input_data)

        # Use Comprehend for entity recognition
        entities_response = comprehend.detect_entities(
            Text=text_to_analyze[:5000],  # Comprehend has text length limit
            LanguageCode='en'
        )

        # Use Comprehend for key phrases
        key_phrases_response = comprehend.detect_key_phrases(
            Text=text_to_analyze[:5000],
            LanguageCode='en'
        )

        # Extract entities and key phrases
        entities = [e['Text'].lower() for e in entities_response.get('Entities', [])]
        key_phrases = [kp['Text'].lower() for kp in key_phrases_response.get('KeyPhrases', [])]

        # Combine for category detection
        all_terms = entities + key_phrases + text_to_analyze.lower().split()

        # Detect category based on keywords
        category_scores = {}
        for category, keywords in EXPENSE_CATEGORIES.items():
            score = sum(1 for term in all_terms if any(kw in term for kw in keywords))
            if score > 0:
                category_scores[category] = score

        # Get the category with highest score
        if category_scores:
            detected_category = max(category_scores, key=category_scores.get)
            confidence = min(category_scores[detected_category] / 10, 1.0)  # Normalize confidence
        else:
            detected_category = 'OTHER'
            confidence = 0.5

        # Use Comprehend's custom classification if available (latest feature)
        # This would require a trained custom classifier endpoint
        # Placeholder for custom classification integration

        return {
            'statusCode': 200,
            'category': detected_category,
            'confidence': confidence,
            'entities': entities[:10],  # Top 10 entities
            'keyPhrases': key_phrases[:10],  # Top 10 key phrases
            'receiptId': input_data.get('receiptId'),
            'userId': input_data.get('userId')
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