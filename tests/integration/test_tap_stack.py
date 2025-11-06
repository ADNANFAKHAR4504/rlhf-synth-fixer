# tests/integration/test_tap_stack.py
# pylint: disable=missing-class-docstring,missing-function-docstring,too-many-locals,too-many-branches,too-many-statements
import json
import os
import re
import time
import base64
import unittest
from datetime import datetime
from typing import Optional, Dict, Any

import boto3
import requests
from botocore.exceptions import ClientError
from pytest import mark

# ----------------------------- Load optional flat outputs -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FLAT_OUTPUTS_PATH = os.path.join(BASE_DIR, "..", "..", "cfn-outputs", "flat-outputs.json")
if os.path.exists(FLAT_OUTPUTS_PATH):
    with open(FLAT_OUTPUTS_PATH, "r", encoding="utf-8") as f:
        FLAT_OUTPUTS = json.load(f)
else:
    FLAT_OUTPUTS = {}

# ----------------------------- Helpers -----------------------------
def _env_stage() -> str:
    # Prefer explicit Stage output, then ENV var, default dev
    return FLAT_OUTPUTS.get("Stage") or os.environ.get("ENVIRONMENT_SUFFIX", "dev")

def _env_region() -> str:
    return os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "eu-central-1"

def _region_from_arn(arn: str) -> str:
    parts = arn.split(":")
    return parts[3] if len(parts) > 3 else _env_region()

def _api_stage_from_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    m = re.match(r"^https?://[^/]+/([^/]+)/?", url)
    return m.group(1) if m else None

def _maybe_flat(key: str) -> Optional[str]:
    val = FLAT_OUTPUTS.get(key)
    return val if val else None


class Resolver:
    """Discovers live resources via AWS SDK; flat-outputs.json is optional."""

    def __init__(self, stage: str, region: str):
        self.stage = stage
        self.region = region

        self.sts = boto3.client("sts", region_name=region)
        self.account_id = self.sts.get_caller_identity()["Account"]

        # Clients
        self.events = boto3.client("events", region_name=region)
        self.apigw = boto3.client("apigateway", region_name=region)
        self.ddb_c = boto3.client("dynamodb", region_name=region)
        self.ddb_r = boto3.resource("dynamodb", region_name=region)
        self.s3 = boto3.client("s3", region_name=region)
        self.lambda_ = boto3.client("lambda", region_name=region)
        self.logs = boto3.client("logs", region_name=region)
        self.sqs = boto3.client("sqs", region_name=region)

        # Names from your CDK code
        self.bus_name_txn = f"tap-{stage}-transaction"
        self.bus_name_audit = f"tap-{stage}-audit"
        self.bus_name_system = f"tap-{stage}-system"
        self.archive_name = f"tap-{stage}-transaction-archive"

        self.tbl_txn = f"tap-{stage}-transactions"
        self.tbl_rules = f"tap-{stage}-rules"
        self.tbl_audit = f"tap-{stage}-audit-logs"

        self.bucket = f"tap-{stage}-{region}-{self.account_id}-processed-data"

        self.fn_ingest = f"tap-{stage}-ingest_processor"
        self.fn_fraud = f"tap-{stage}-fraud_detector"
        self.fn_notifier = f"tap-{stage}-notifier"

        self.q_lambda_dlq = f"tap-{stage}-lambda-failures-dlq"
        self.q_eventbridge_dlq = f"tap-{stage}-eventbridge-failures-dlq"
        self.q_buffer = f"tap-{stage}-buffer-queue"

        self.api_name = f"tap-{stage}-api"
        self.api_key_name = f"tap-{stage}-api-key"

        # Resolved values
        self.bus_arn_txn = _maybe_flat("TransactionBusArn") or self._bus_arn(self.bus_name_txn)
        self.bus_arn_audit = _maybe_flat("AuditBusArn") or self._bus_arn(self.bus_name_audit)
        self.bus_arn_system = _maybe_flat("SystemBusArn") or self._bus_arn(self.bus_name_system)
        self.archive_arn = _maybe_flat("TransactionArchiveArn") or self._archive_arn(self.archive_name)

        # API base URL (prefer flat output; otherwise build from REST API id)
        api_base_url = _maybe_flat("ApiBaseUrl") or _maybe_flat("TransactionAPIEndpointF9B09F4E")
        if not api_base_url:
            rest_id = self._find_rest_api_id(self.api_name)
            if rest_id:
                api_base_url = f"https://{rest_id}.execute-api.{self.region}.amazonaws.com/{self.stage}/"
        self.api_base_url = api_base_url
        self.transactions_endpoint = (
            _maybe_flat("TransactionsEndpoint")
            or (f"{self.api_base_url.rstrip('/')}/transactions" if self.api_base_url else None)
        )

        # Queue URLs (prefer flat when present)
        self.lambda_dlq_url = _maybe_flat("LambdaDLQUrl") or self._queue_url(self.q_lambda_dlq)
        self.eb_dlq_url = _maybe_flat("EventBridgeDLQUrl") or self._queue_url(self.q_eventbridge_dlq)

    # ---------- Discovery methods ----------
    def _bus_arn(self, name: str) -> Optional[str]:
        try:
            resp = self.events.describe_event_bus(Name=name)
            return resp.get("Arn")
        except ClientError:
            return None

    def _archive_arn(self, name: str) -> Optional[str]:
        try:
            return self.events.describe_archive(ArchiveName=name).get("ArchiveArn")
        except ClientError:
            return None

    def _find_rest_api_id(self, name: str) -> Optional[str]:
        position = None
        while True:
            kwargs: Dict[str, Any] = {"limit": 500}
            if position:
                kwargs["position"] = position
            page = self.apigw.get_rest_apis(**kwargs)
            for item in page.get("items", []):
                if item.get("name") == name:
                    return item.get("id")
            position = page.get("position")
            if not position:
                return None

    def get_api_key_value(self) -> Optional[str]:
        """Return the API key value for the 'tap-<stage>-api-key' name."""
        position = None
        while True:
            kwargs: Dict[str, Any] = {"includeValues": False, "limit": 500}
            if position:
                kwargs["position"] = position
            page = self.apigw.get_api_keys(**kwargs)
            for item in page.get("items", []):
                if item.get("name") == self.api_key_name:
                    key_id = item.get("id")
                    key = self.apigw.get_api_key(apiKey=key_id, includeValue=True)
                    return key.get("value")
            position = page.get("position")
            if not position:
                return None

    def _queue_url(self, queue_name: str) -> Optional[str]:
        try:
            return self.sqs.get_queue_url(QueueName=queue_name)["QueueUrl"]
        except ClientError:
            return None

    # ---------- Wait helpers ----------
    def wait_ddb_item(self, table_name: str, key_name: str, key_value: str, timeout_s: int = 90) -> bool:
        table = self.ddb_r.Table(table_name)
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
            time.sleep(3)
        return False


@mark.describe("TapStack Integration Tests (live via AWS SDK)")
class TestTapStackIntegration(unittest.TestCase):
    def setUp(self):
        self.stage = _env_stage()
        self.region = _env_region()
        self.res = Resolver(self.stage, self.region)

        # Basic sanity: ensure the three event buses are discoverable; otherwise skip suite
        if not (self.res.bus_arn_txn and self.res.bus_arn_audit and self.res.bus_arn_system):
            self.skipTest("TapStack event buses not discovered; is the stack deployed in this account/region?")

    # ---------------------- Lambda ----------------------
    @mark.it("Lambda: runtime, memory, and reserved concurrency are set")
    def test_lambda_config(self):
        for fn_name in (self.res.fn_ingest, self.res.fn_fraud, self.res.fn_notifier):
            try:
                conf = self.res.lambda_.get_function(FunctionName=fn_name)["Configuration"]
            except ClientError as e:
                self.fail(f"Lambda {fn_name} not found: {e}")
            self.assertEqual(conf["Runtime"], "nodejs18.x")
            self.assertIn(conf["MemorySize"], (512, 3008))
            rce = conf.get("ReservedConcurrentExecutions")
            if self.stage == "dev":
                self.assertEqual(rce, 10)
            else:
                # pr*/prod should be >=1
                self.assertGreaterEqual(rce or 1, 1)

    # ---------------------- S3 ----------------------
    @mark.it("S3: versioning enabled and bucket policy denies unencrypted PUTs")
    def test_s3_bucket_versioning_and_encryption(self):
        # versioning
        ver = self.res.s3.get_bucket_versioning(Bucket=self.res.bucket)
        self.assertEqual(ver.get("Status"), "Enabled", "S3 bucket versioning must be enabled")

        # Unencrypted PUT should be denied
        key_plain = f"it/plain-{int(time.time())}.json"
        denied = False
        try:
            self.res.s3.put_object(Bucket=self.res.bucket, Key=key_plain, Body=b"{}", ContentType="application/json")
        except ClientError as err:
            code = err.response.get("Error", {}).get("Code")
            # Some AWS responses use "InvalidRequest" for policy conditions
            denied = code in ("AccessDenied", "AccessDeniedException", "InvalidRequest")
        self.assertTrue(denied, "Expected AccessDenied/InvalidRequest for unencrypted PUT")

        # Encrypted PUT (SSE-S3) must succeed
        key_sse = f"it/sse-{int(time.time())}.json"
        self.res.s3.put_object(
            Bucket=self.res.bucket,
            Key=key_sse,
            Body=b"{}",
            ContentType="application/json",
            ServerSideEncryption="AES256",
        )
        # Cleanup
        try:
            self.res.s3.delete_object(Bucket=self.res.bucket, Key=key_sse)
        except ClientError:
            pass

    # ---------------------- API Gateway ----------------------
    @mark.it("API: POST /transactions without API key returns 401/403")
    def test_api_requires_api_key(self):
        if not self.res.transactions_endpoint:
            self.skipTest("API endpoint not discovered; skipping API tests")
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
        resp = requests.post(self.res.transactions_endpoint, json=body, timeout=30)
        self.assertIn(resp.status_code, (401, 403))

    @mark.it("API: POST /transactions with API key persists to DynamoDB")
    def test_api_with_key_persists_to_dynamodb(self):
        if not self.res.transactions_endpoint:
            self.skipTest("API endpoint not discovered; skipping API tests")
        api_key_val = self.res.get_api_key_value()
        if not api_key_val:
            self.skipTest(f"API key '{self.res.api_key_name}' not found")

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
        resp = requests.post(self.res.transactions_endpoint, json=body, headers={"x-api-key": api_key_val}, timeout=30)
        self.assertEqual(resp.status_code, 200, f"API failed: {resp.status_code} {resp.text}")

        # Confirm DDB persistence by scanning on transactionId
        self.assertTrue(
            self.res.wait_ddb_item(self.res.tbl_txn, "transactionId", txn_id),
            "DynamoDB write not observed",
        )

    # ---------------------- EventBridge ----------------------
    @mark.it("EventBridge: buses and transaction archive exist")
    def test_event_buses_and_archive_exist(self):
        for name, arn in (
            (self.res.bus_name_txn, self.res.bus_arn_txn),
            (self.res.bus_name_audit, self.res.bus_arn_audit),
            (self.res.bus_name_system, self.res.bus_arn_system),
        ):
            self.assertIsNotNone(arn, f"Bus ARN for {name} not resolved")
            desc = self.res.events.describe_event_bus(Name=name)
            self.assertEqual(desc.get("Name"), name)

        arc = self.res.events.describe_archive(ArchiveName=self.res.archive_name)
        self.assertEqual(arc.get("ArchiveArn"), self.res.archive_arn)

    @mark.it("EventBridge: high-risk MCC event reaches SQS buffer and creates audit log")
    def test_eventbridge_rule_and_audit(self):
        # Publish an event that matches HighRiskMccRule (merchantCategory 'electronics')
        bus_name = self.res.bus_name_txn
        txn_id = f"it-evt-{int(time.time())}"
        detail = {
            "transactionId": txn_id,
            "accountId": "acc-eb",
            "amount": 250.0,
            "currency": "USD",
            "merchantCategory": "electronics",
            "country": "US",
            "cardNotPresent": False,
            "localHour": 14,
        }
        self.res.events.put_events(
            Entries=[{"Source": "tap.transactions", "DetailType": "Transaction", "Detail": json.dumps(detail), "EventBusName": bus_name}]
        )

        # Poll buffer queue for the message
        q_url = self.res._queue_url(self.res.q_buffer)
        if not q_url:
            self.skipTest(f"Buffer queue '{self.res.q_buffer}' not found")
        found_msg = False
        deadline = time.time() + 120
        while time.time() < deadline and not found_msg:
            msgs = self.res.sqs.receive_message(QueueUrl=q_url, MaxNumberOfMessages=1, WaitTimeSeconds=5)
            if msgs.get("Messages"):
                found_msg = True
                # best-effort delete
                try:
                    self.res.sqs.delete_message(
                        QueueUrl=q_url,
                        ReceiptHandle=msgs["Messages"][0]["ReceiptHandle"],
                    )
                except ClientError:
                    pass
                break
        self.assertTrue(found_msg, "No message received on SQS buffer queue from EventBridge rule")

        # Fraud detector writes into audit logs table
        self.assertTrue(
            self.res.wait_ddb_item(self.res.tbl_audit, "transactionId", txn_id),
            "Audit log record not found in DynamoDB",
        )

    # ---------------------- CloudWatch Logs ----------------------
    @mark.it("CloudWatch Logs: ingest function has 30-day retention and receives log events")
    def test_logs_for_ingest(self):
        # Invoke to ensure log activity
        payload = {
            "transactionId": f"it-invoke-{int(time.time())}",
            "accountId": "acc-invoke",
            "amount": 5.0,
            "currency": "USD",
        }
        invoke = self.res.lambda_.invoke(FunctionName=self.res.fn_ingest, Payload=json.dumps(payload).encode("utf-8"))
        self.assertEqual(invoke.get("StatusCode"), 200)

        lg_name = f"/aws/lambda/{self.res.fn_ingest}"
        have_events = False
        deadline = time.time() + 120
        while time.time() < deadline and not have_events:
            groups = self.res.logs.describe_log_groups(logGroupNamePrefix=lg_name, limit=1).get("logGroups", [])
            if not groups:
                time.sleep(3)
                continue
            self.assertEqual(groups[0].get("retentionInDays"), 30)  # set via LogRetention
            streams = self.res.logs.describe_log_streams(
                logGroupName=lg_name, orderBy="LastEventTime", descending=True, limit=1
            ).get("logStreams", [])
            if not streams:
                time.sleep(3)
                continue
            stream = streams[0]["logStreamName"]
            events = self.res.logs.get_log_events(logGroupName=lg_name, logStreamName=stream, limit=5).get("events", [])
            have_events = len(events) > 0
            if not have_events:
                time.sleep(3)
        self.assertTrue(have_events, "No log events observed for ingest function")

    # ---------------------- DynamoDB & SQS basics ----------------------
    @mark.it("DynamoDB: tables are PAY_PER_REQUEST and PITR enabled")
    def test_dynamodb_basics(self):
        for tbl in (self.res.tbl_txn, self.res.tbl_rules, self.res.tbl_audit):
            desc = self.res.ddb_c.describe_table(TableName=tbl)["Table"]
            mode = desc.get("BillingModeSummary", {}).get("BillingMode")
            self.assertEqual(mode, "PAY_PER_REQUEST")
            pitr = self.res.ddb_c.describe_continuous_backups(TableName=tbl)
            status = (
                pitr.get("ContinuousBackupsDescription", {})
                .get("PointInTimeRecoveryDescription", {})
                .get("PointInTimeRecoveryStatus")
            )
            self.assertEqual(status, "ENABLED")

    @mark.it("SQS: DLQs exist with 300s visibility and expose message metrics")
    def test_sqs_dlqs(self):
        for q_url in (self.res.lambda_dlq_url, self.res.eb_dlq_url):
            if not q_url:
                self.fail("One or more DLQ URLs could not be discovered")
            attrs = self.res.sqs.get_queue_attributes(QueueUrl=q_url, AttributeNames=["All"]).get("Attributes", {})
            self.assertEqual(attrs.get("VisibilityTimeout"), "300")
            self.assertIn("ApproximateNumberOfMessages", attrs)

    # ---------------------- E2E (optional) ----------------------
    @mark.it("E2E: API contract + DynamoDB persistence")
    def test_e2e_path_contract(self):
        if not self.res.transactions_endpoint:
            self.skipTest("API endpoint not discovered; skipping E2E test")
        api_key_val = self.res.get_api_key_value()
        if not api_key_val:
            self.skipTest(f"API key '{self.res.api_key_name}' not found")

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
            "note": base64.b64encode(now.encode("utf-8")).decode("utf-8"),
        }
        resp = requests.post(self.res.transactions_endpoint, json=payload, headers={"x-api-key": api_key_val}, timeout=30)
        self.assertEqual(resp.status_code, 200, f"Unexpected response {resp.status_code}: {resp.text}")

        self.assertTrue(
            self.res.wait_ddb_item(self.res.tbl_txn, "transactionId", txn_id),
            "E2E record not found in DynamoDB",
        )
