import os
import json
import boto3
from datetime import datetime

DDB = boto3.resource('dynamodb')
SSM = boto3.client('ssm')

_SSM_CACHE = {}

def get_ssm_param(name, with_decryption=True):
    if name in _SSM_CACHE:
        return _SSM_CACHE[name]
    try:
        resp = SSM.get_parameter(Name=name, WithDecryption=with_decryption)
        val = resp['Parameter']['Value']
        _SSM_CACHE[name] = val
        return val
    except Exception:
        return None


def handler(event, context):
    table_name = os.environ.get('TRANSACTIONS_TABLE')
    table = DDB.Table(table_name)

    # Fetch DB credentials from SSM (expects JSON with keys like username/password)
    db_creds_param = os.environ.get('DB_CREDENTIALS_PARAM')
    db_creds = None
    if db_creds_param:
        raw = get_ssm_param(db_creds_param)
        try:
            db_creds = json.loads(raw) if raw else None
        except Exception:
            db_creds = None

    records = event.get('Records', [])
    for r in records:
        body = json.loads(r['body'])
        item = {
            'transaction_id': body.get('transaction_id'),
            'timestamp': body.get('timestamp') or datetime.utcnow().isoformat(),
            'customer_id': body.get('customer_id', 'unknown'),
            'raw': json.dumps(body)
        }
        # Example use of db_creds: not used to write to DynamoDB but shown as realistic binding
        if db_creds:
            item['ingested_by'] = db_creds.get('username')

        table.put_item(Item=item)

    return {'statusCode': 200}
