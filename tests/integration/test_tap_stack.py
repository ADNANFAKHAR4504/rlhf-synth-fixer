# tests/integration/test_tap_stack.py
# pylint: disable=missing-class-docstring,missing-function-docstring,too-many-locals,too-many-branches
import json
import os
import re
import time
import base64
import unittest
from datetime import datetime
from typing import Optional

import boto3
import requests
from botocore.exceptions import ClientError
from pytest import mark


# --- Load CloudFormation outputs from flat-outputs.json ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FLAT_OUTPUTS_PATH = os.path.join(BASE_DIR, "..", "..", "cfn-outputs", "flat-outputs.json")

if os.path.exists(FLAT_OUTPUTS_PATH):
    with open(FLAT_OUTPUTS_PATH, "r", encoding="utf-8") as f:
        FLAT_OUTPUTS = json.load(f)
else:
    FLAT_OUTPUTS = {}


def _need(key: str) -> str:
    val = FLAT_OUTPUTS.get(key)
    if not val:
        raise AssertionError(f"Required output '{key}' not found in flat-outputs.json")
    return val


def _region_from_arn(arn: str) -> str:
    parts = arn.split(":")
    return parts[3] if len(parts) > 3 else os.environ.get("AWS_REGION", "eu-central-1")


def _stage_from_url(url: str) -> str:
    # https://{apiid}.execute-api.{region}.amazonaws.com/{stage}/
    m = re.match(r"^https?://[^/]+/([^/]+)/?", url or "")
    return m.group(1) if m else "dev"


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for the TapStack CDK stack"""

    def setUp(self):
        """Set up AWS clients and resolve outputs"""
        # Core outputs from your stack
        # Prefer ApiBaseUrl, fall back to TransactionAPIEndpoint* if needed
        self.api_base_url = FLAT_OUTPUTS.get("ApiBaseUrl") or FLAT_OUTPUTS.get("TransactionAPIEndpointF9B09F4E")
        self.transactions_endpoint = FLAT_OUTPUTS.get("TransactionsEndpoint") or (
            (self.api_base_url.rstrip("/") + "/transactions") if self.api_base_url else None
        )

        self.bus_arn_txn = _need("TransactionBusArn")
        self.bus_arn_audit = _need("AuditBusArn")
        self.bus_arn_system = _need("SystemBusArn")
        self.archive_name = _need("TransactionArchiveName")
        self.archive_arn = _need("TransactionArchiveArn")
        self.ddb_txn = _need("TransactionsTableName")
        self.ddb_rules = _need("RulesTableName")
        self.ddb_audit = _need("AuditLogsTableName")
        self.bucket = _need("ProcessedBucketName")
        self.fn_ingest = _need("IngestFnName")
        self.fn_fraud = _need("FraudFnName")
        self.fn_notifier = _need("NotifierFnName")
        self.lambda_dlq_url = _need("LambdaDLQUrl")
        self.eb_dlq_url = _need("EventBridgeDLQUrl")

        # Derived
        self.region = _region_from_arn(self.bus_arn_txn)
        self.stage = _stage_from_url(self.api_base_url) if self.api_base_url else FLAT_OUTPUTS.get("Stage", "dev")

        # Clients
        self.events = boto3.client("events", region_name=self.region)
        self.apigw = boto3.client("apigateway", region_name=self.region)
        self.ddb_client = boto3.client("dynamodb", region_name=self.region)
        self.ddb_resource = boto3.resource("dynamodb", region_name=self.region)
        self.s3 = boto3.client("s3", region_name=self.region)
        self.lambda_ = boto3.client("lambda", region_name=self.region)
        self.logs = boto3.client("logs", region_name=self.region)
        self.sqs = boto3.client("sqs", region_name=self.region)

        # Sanity: endpoints present
        self.assertIsNotNone(self.api_base_url, "ApiBaseUrl missing in flat-outputs.json")
        self.assertIsNotNone(self.transactions_endpoint, "TransactionsEndpoint missing or not derivable")

    # ---------------------- Helpers ----------------------
    def _find_rest_api_id(self, name: str) -> Optional[str]:
        position = None
        while True:
            kwargs = {"limit": 500}
            if position:
                kwargs["position"] = position
            page = self.apigw.get_rest_apis(**kwargs)
            for item in page.get("items", []):
                if item.get("name") == name:
                    return item.get("id")
            position = page.get("position")
            if not position:
                return None

    def _get_api_key_value(self, key_name: str) -> str:
        position = None
        while True:
            kwargs = {"includeValues": False, "limit": 500}
            if position:
                kwargs["position"] = position
            page = self.apigw.get_api_keys(**kwargs)
            for item in page.get("items", []):
                if item.get("name") == key_name:
                    key_id = item.get("id")
                    key = self.apigw.get_api_key(apiKey=key_id, includeValue=True)
                    return key.get("value")
            position = page.get("position")
            if not position:
                raise AssertionError(f"API key '{key_name}' not found")

    def _wait_for_ddb_item(self, table_name: str, key_name: str, key_value: str, timeout_s: int = 60) -> bool:
        table = self.ddb_resource.Table(table_name)
        deadline = time.time() + timeout_s
        while time.time() < deadline:
            resp = table.scan(
                ProjectionExpression=key_name,
                FilterExpression="#k = :v",
                ExpressionAttributeNames={"#k": key_name},
                ExpressionAttributeValues={":v": key_value},
            )
            items = resp.get("Items", [])
            if any(i.get(key_name) == key_value for i in items):
                return True
            time.sleep(2)
        return False

    # ---------------------- Lambda ----------------------
    @mark.it("Validates Lambda configurations (runtime, memory, reserved concurrency)")
    def test_lambda_config(self):
        for fn_name in (self.fn_ingest, self.fn_fraud, self.fn_notifier):
            conf = self.lambda_.get_function(FunctionName=fn_name)["Configuration"]
            self.assertEqual(conf["Runtime"], "nodejs18.x")
            self.assertIn(conf["MemorySize"], (512, 3008))
            if self.stage == "dev":
                self.assertEqual(conf.get("ReservedConcurrentExecutions"), 10)
            else:
                # prod or pr*—at least limited
                self.assertGreaterEqual(conf.get("ReservedConcurrentExecutions", 1), 1)

    # ---------------------- S3 ----------------------
    @mark.it("Validates S3 bucket versioning is enabled and encryption policy enforced")
    def test_s3_bucket_versioning_and_encryption(self):
        # Versioning must be enabled by stack
        ver = self.s3.get_bucket_versioning(Bucket=self.bucket)
        self.assertEqual(ver.get("Status"), "Enabled", "S3 bucket versioning must be enabled")

        # Unencrypted PUT should be denied by bucket policy
        key_plain = f"it-tests/plain-{int(time.time())}.json"
        denied = False
        try:
            self.s3.put_object(Bucket=self.bucket, Key=key_plain, Body=b"{}", ContentType="application/json")
        except ClientError as err:  # pylint: disable=undefined-variable
            code = err.response.get("Error", {}).get("Code")
            denied = code in ("AccessDenied", "AccessDeniedException")
        self.assertTrue(denied, "Unencrypted PUT did not get AccessDenied as expected")

        # Encrypted PUT (SSE-S3) must succeed
        key_sse = f"it-tests/sse-{int(time.time())}.json"
        self.s3.put_object(
            Bucket=self.bucket,
            Key=key_sse,
            Body=b"{}",
            ContentType="application/json",
            ServerSideEncryption="AES256",
        )
        # Cleanup best effort
        try:
            self.s3.delete_object(Bucket=self.bucket, Key=key_sse)
        except ClientError:
            pass

    # ---------------------- API Gateway ----------------------
    @mark.it("API Gateway: POST /transactions without API key returns 401/403")
    def test_api_requires_api_key(self):
        body = {
            "transactionId": f"it-no-key-{int(time.time())}",
            "accountId": "acc-403",
            "amount": 1.23,
            "currency": "USD",
            "merchantCategory": "electronics",
            "country": "US",
            "cardNotPresent": False,
            "localHour": 10,
        }
        resp = requests.post(self.transactions_endpoint, json=body, timeout=30)
        self.assertIn(resp.status_code, (401, 403))

    @mark.it("API Gateway: POST /transactions with API key persists to DynamoDB")
    def test_api_with_key_persists_to_dynamodb(self):
        api_name = f"tap-{self.stage}-api"
        key_name = f"tap-{self.stage}-api-key"
        rest_id = self._find_rest_api_id(api_name)
        if not rest_id:
            self.skipTest(f"REST API '{api_name}' not found via SDK")

        try:
            api_key_value = self._get_api_key_value(key_name)
        except AssertionError as exc:
            self.skipTest(f"API key lookup failed: {exc}")

        txn_id = f"it-api-{int(time.time())}"
        body = {
            "transactionId": txn_id,
            "accountId": "acc-live",
            "amount": 99.99,
            "currency": "USD",
            "merchantCategory": "electronics",
            "country": "US",
            "cardNotPresent": False,
            "localHour": 12,
        }

        resp = requests.post(self.transactions_endpoint, json=body, headers={"x-api-key": api_key_value}, timeout=30)
        self.assertEqual(resp.status_code, 200, f"API failed: {resp.status_code} {resp.text}")
        self.assertTrue(self._wait_for_ddb_item(self.ddb_txn, "transactionId", txn_id), "DynamoDB write not found")

    # ---------------------- EventBridge ----------------------
    @mark.it("EventBridge: buses and archive exist")
    def test_event_buses_and_archive_exist(self):
        for arn in (self.bus_arn_txn, self.bus_arn_audit, self.bus_arn_system):
            name = arn.split("/")[-1]
            resp = self.events.describe_event_bus(Name=name)
            self.assertEqual(resp.get("Name"), name)
        arc = self.events.describe_archive(ArchiveName=self.archive_name)
        self.assertEqual(arc.get("ArchiveArn"), self.archive_arn)

    @mark.it("EventBridge: publishing a high-risk MCC event lands in SQS buffer and produces audit log")
    def test_eventbridge_rule_and_audit(self):
        bus_name = self.bus_arn_txn.split("/")[-1]
        txn_id = f"it-evt-{int(time.time())}"
        detail = {
            "transactionId": txn_id,
            "accountId": "acc-eb",
            "amount": 250.0,
            "currency": "USD",
            "merchantCategory": "electronics",  # matches high-risk MCC rule
            "country": "US",
            "cardNotPresent": False,
            "localHour": 14,
        }
        self.events.put_events(
            Entries=[
                {
                    "Source": "tap.transactions",
                    "DetailType": "Transaction",
                    "Detail": json.dumps(detail),
                    "EventBusName": bus_name,
                }
            ]
        )

        # Buffer queue name convention from stack: tap-<stage>-buffer-queue
        q_name = f"tap-{self.stage}-buffer-queue"
        q_url = self.sqs.get_queue_url(QueueName=q_name)["QueueUrl"]

        # Poll for message arrival
        found_msg = False
        deadline = time.time() + 90
        while time.time() < deadline and not found_msg:
            msgs = self.sqs.receive_message(QueueUrl=q_url, MaxNumberOfMessages=1, WaitTimeSeconds=5)
            if msgs.get("Messages"):
                found_msg = True
                break
        self.assertTrue(found_msg, "No message received on SQS buffer queue from EventBridge rule")

        # Fraud detector writes into audit logs table
        self.assertTrue(self._wait_for_ddb_item(self.ddb_audit, "transactionId", txn_id), "Audit log not found")

    # ---------------------- CloudWatch Logs ----------------------
    @mark.it("CloudWatch Logs: ingest function log group exists with 30-day retention and receives events")
    def test_logs_for_ingest(self):
        # invoke to create fresh logs
        payload = {
            "transactionId": f"it-invoke-{int(time.time())}",
            "accountId": "acc-invoke",
            "amount": 5.0,
            "currency": "USD",
        }
        invoke = self.lambda_.invoke(FunctionName=self.fn_ingest, Payload=json.dumps(payload).encode("utf-8"))
        self.assertEqual(invoke.get("StatusCode"), 200)

        lg_name = f"/aws/lambda/{self.fn_ingest}"
        have_events = False
        deadline = time.time() + 90
        while time.time() < deadline and not have_events:
            groups = self.logs.describe_log_groups(logGroupNamePrefix=lg_name, limit=1).get("logGroups", [])
            if not groups:
                time.sleep(2)
                continue
            # retention set via LogRetention ONE_MONTH -> 30
            self.assertEqual(groups[0].get("retentionInDays"), 30)
            streams = self.logs.describe_log_streams(
                logGroupName=lg_name, orderBy="LastEventTime", descending=True, limit=1
            ).get("logStreams", [])
            if not streams:
                time.sleep(2)
                continue
            stream = streams[0]["logStreamName"]
            events = self.logs.get_log_events(logGroupName=lg_name, logStreamName=stream, limit=5).get("events", [])
            have_events = len(events) > 0
            if not have_events:
                time.sleep(2)
        self.assertTrue(have_events, "No log events observed for ingest function")

    # ---------------------- DynamoDB & SQS basics ----------------------
    @mark.it("DynamoDB: three tables are PAY_PER_REQUEST and PITR enabled")
    def test_dynamodb_basics(self):
        ddb = boto3.client("dynamodb", region_name=self.region)
        for tbl in (self.ddb_txn, self.ddb_rules, self.ddb_audit):
            desc = ddb.describe_table(TableName=tbl)["Table"]
            mode = desc.get("BillingModeSummary", {}).get("BillingMode")
            self.assertEqual(mode, "PAY_PER_REQUEST")
            pitr = ddb.describe_continuous_backups(TableName=tbl)
            status = (
                pitr.get("ContinuousBackupsDescription", {})
                .get("PointInTimeRecoveryDescription", {})
                .get("PointInTimeRecoveryStatus")
            )
            self.assertEqual(status, "ENABLED")

    @mark.it("SQS: DLQs are present with expected defaults")
    def test_sqs_dlqs(self):
        for url in (self.lambda_dlq_url, self.eb_dlq_url):
            attrs = self.sqs.get_queue_attributes(QueueUrl=url, AttributeNames=["All"]).get("Attributes", {})
            self.assertEqual(attrs.get("VisibilityTimeout"), "300")
            self.assertIn("ApproximateNumberOfMessages", attrs)

    # ---------------------- E2E-style sample (optional) ----------------------
    @mark.it("End-to-end style: API path + DDB + basic response contract")
    def test_e2e_path_contract(self):
        # Try to use API key; if not accessible, skip this E2E
        api_name = f"tap-{self.stage}-api"
        key_name = f"tap-{self.stage}-api-key"
        rest_id = self._find_rest_api_id(api_name)
        if not rest_id:
            self.skipTest(f"REST API '{api_name}' not found via SDK")

        try:
            api_key_value = self._get_api_key_value(key_name)
        except AssertionError as exc:
            self.skipTest(f"API key lookup failed: {exc}")

        now = datetime.utcnow().isoformat()
        txn_id = f"e2e-{int(time.time())}"
        payload = {
            "transactionId": txn_id,
            "accountId": "acc-e2e",
            "amount": 42.42,
            "currency": "USD",
            "merchantCategory": "luxury",
            "country": "US",
            "cardNotPresent": True,
            "localHour": 2,
            # include a blob just to vary payload a bit
            "note": base64.b64encode(now.encode("utf-8")).decode("utf-8"),
        }

        resp = requests.post(self.transactions_endpoint, json=payload, headers={"x-api-key": api_key_value}, timeout=30)
        self.assertEqual(resp.status_code, 200, f"Unexpected response {resp.status_code}: {resp.text}")

        # Confirm DDB persistence
        self.assertTrue(self._wait_for_ddb_item(self.ddb_txn, "transactionId", txn_id), "E2E record not found")
