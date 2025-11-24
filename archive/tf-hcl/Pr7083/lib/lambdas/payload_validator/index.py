import os
import json
import boto3

SQS = boto3.client('sqs')
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


def validate_payload(payload):
    # Simple but realistic validation example: expect 'transaction_id' and 'amount'
    if not isinstance(payload, dict):
        return False, 'payload not json'
    if 'transaction_id' not in payload:
        return False, 'missing transaction_id'
    if 'amount' not in payload:
        return False, 'missing amount'
    return True, ''

def handler(event, context):
    # event from SQS: Records -> body contains s3 pointer
    records = event.get('Records', [])
    # Load validation rules from SSM if provided (expects JSON string)
    validation_rules_param = os.environ.get('VALIDATION_RULES_PARAM')
    validation_rules = None
    if validation_rules_param:
        raw = get_ssm_param(validation_rules_param)
        try:
            validation_rules = json.loads(raw) if raw else None
        except Exception:
            validation_rules = None
    for r in records:
        try:
            body = json.loads(r['body'])
            # fetch S3 object here in production; assume body contains payload for this simplified example
            payload = body.get('payload') or body
            ok, reason = validate_payload(payload)
            # Optionally apply extra validation rules from SSM (example)
            if ok and validation_rules and isinstance(validation_rules, dict):
                # example rule: minimum_amount
                min_amount = validation_rules.get('minimum_amount')
                if min_amount is not None and payload.get('amount', 0) < min_amount:
                    ok = False
                    reason = f'amount below minimum {min_amount}'
            if not ok:
                # send to DLQ by sending to DLQ queue directly
                SQS.send_message(QueueUrl=os.environ['DLQ_URL'], MessageBody=json.dumps({ 'error': reason, 'original': payload }))
                continue
            # forward to validated queue
            SQS.send_message(QueueUrl=os.environ['VALIDATED_QUEUE_URL'], MessageBody=json.dumps(payload))
        except Exception as e:
            SQS.send_message(QueueUrl=os.environ['DLQ_URL'], MessageBody=json.dumps({'error': str(e)}))

    return {'statusCode': 200}
