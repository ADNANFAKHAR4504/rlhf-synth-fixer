import json
import os
import boto3
from decimal import Decimal
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE']
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Matches current cryptocurrency prices against user-defined alert thresholds.
    Triggered every 60 seconds by EventBridge.
    Returns list of matched alerts for processing via Lambda destinations.
    """
    print('AlertMatcher triggered by EventBridge')

    try:
        # Scan for all user alerts
        response = table.scan(
            FilterExpression='attribute_exists(#type) AND #type = :alert_type AND #status = :status',
            ExpressionAttributeNames={
                '#type': 'type',
                '#status': 'status'
            },
            ExpressionAttributeValues={
                ':alert_type': 'user_alert',
                ':status': 'active'
            }
        )

        alerts = response.get('Items', [])
        print(f'Found {len(alerts)} active user alerts to process')

        # Get latest prices for symbols
        price_map = get_latest_prices(alerts)

        matched_alerts = []
        for alert in alerts:
            symbol = alert.get('symbol', 'UNKNOWN')
            threshold = float(alert.get('threshold', 0))
            condition = alert.get('condition', 'above')
            user_id = alert.get('userId', 'unknown')
            alert_id = alert.get('alertId', 'unknown')

            current_price = price_map.get(symbol, 0)

            # Check if alert condition is met
            is_matched = False
            if condition == 'above' and current_price >= threshold:
                is_matched = True
            elif condition == 'below' and current_price <= threshold:
                is_matched = True

            if is_matched:
                matched_alerts.append({
                    'userId': user_id,
                    'alertId': alert_id,
                    'symbol': symbol,
                    'threshold': threshold,
                    'currentPrice': current_price,
                    'condition': condition
                })
                print(f'Alert matched: {symbol} {condition} {threshold}, current: {current_price}')

        print(f'Matched {len(matched_alerts)} alerts')

        return {
            'statusCode': 200,
            'matchedCount': len(matched_alerts),
            'alerts': matched_alerts,
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        print(f'Error matching alerts: {str(e)}')
        raise

def get_latest_prices(alerts):
    """
    Retrieves latest prices for all symbols in alerts.
    For complete implementation, query recent price updates from DynamoDB.
    """
    symbols = set(alert.get('symbol', 'UNKNOWN') for alert in alerts)
    price_map = {}

    # Query latest price updates from DynamoDB
    for symbol in symbols:
        try:
            response = table.query(
                KeyConditionExpression='userId = :system_user AND begins_with(alertId, :symbol)',
                ExpressionAttributeValues={
                    ':system_user': 'system',
                    ':symbol': symbol
                },
                ScanIndexForward=False,
                Limit=1
            )

            items = response.get('Items', [])
            if items:
                price_map[symbol] = float(items[0].get('price', 0))
            else:
                # Default price if not found
                price_map[symbol] = 0
        except Exception as e:
            print(f'Error fetching price for {symbol}: {str(e)}')
            price_map[symbol] = 0

    return price_map
