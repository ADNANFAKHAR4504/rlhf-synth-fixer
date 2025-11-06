# tests/integration/test_tap_stack.py
# pylint: disable=missing-class-docstring,missing-function-docstring,too-many-locals,too-many-branches
import json
import os
import re
import time
import base64
import unittest
from datetime import datetime, timezone
from typing import Optional

import boto3
import requests
from botocore.exceptions import ClientError
from pytest import mark

# --- Load CloudFormation outputs if available (optional) ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FLAT_OUTPUTS_PATH = os.path.join(BASE_DIR, "..", "..", "cfn-outputs", "flat-outputs.json")
if os.path.exists(FLAT_OUTPUTS_PATH):
    with open(FLAT_OUTPUTS_PATH, "r", encoding="utf-8") as f:
        FLAT = json.load(f)
else:
    FLAT = {}

DEFAULT_REGION = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "eu-central-1"


def _stage_from_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    m = re.match(r"^https?://[^/]+/([^/]+)/?", url)
    return m.group(1) if m else None


class LiveResources:
    """
    Discovers deployed resources using the AWS SDK to avoid hard dependence on flat-outputs.json.
    Falls back to names: tap-<stage>-*
    """

    def __init__(self):
        # Prefer outputs, else discover
        self.api_base_url = FLAT.get("ApiBaseUrl") or FLAT.get("TransactionAPIEndpointF9B09F4E")
        self.stage = _stage_from_url(self.api_base_url) or FLAT.get("Stage") or os.environ.get("ENV_SUFFIX") or "dev"
        self.region = DEFAULT_REGION

        # Names used by the stack
        self.api_name = f"tap-{self.stage}-api"
        self.api_key_name = f"tap-{self.stage}-api-key"
        self.bus_txn_name = f"tap-{self.stage}-transaction"
        self.bus_audit_name = f"tap-{self.stage}-audit"
        self.bus_system_name = f"tap-{self.stage}-system"
        self.archive_name = f"tap-{self.stage}-transaction-archive"
        self.tbl_txn = f"tap-{self.stage}-transactions"
        self.tbl_rules = f"tap-{self.stage}-rules"
        self.tbl_audit = f"tap-{self.stage}-audit-logs"
        self.bucket = FLAT.get("ProcessedBucketName") or f"tap-{self.stage}-{self.region}-{self._account_id()}-processed-data"
        self.fn_ingest = FLAT.get("IngestFnName") or f"tap-{self.stage}-ingest_processor"
        self.fn_fraud = FLAT.get("FraudFnName") or f"tap-{self.stage}-fraud_detector"
        self.fn_notifier = FLAT.get("NotifierFnName") or f"tap-{self.stage}-notifier"
        self.lambda_dlq_url = FLAT.get("LambdaDLQUrl") or self._queue_url(f"tap-{self.stage}-lambda-failures-dlq")
        self.eb_dlq_url = FLAT.get("EventBridgeDLQUrl") or self._queue_url(f"tap-{self.stage}-eventbridge-failures-dlq")

        # API endpoint discovery if flat outputs missing
        if not self.api_base_url:
            self.api_base_url = self._discover_api_base_url()
        self.transactions_endpoint = (
            FLAT.get("TransactionsEndpoint")
            or (self.api_base_url.rstrip("/") + "/transactions" if self.api_base_url else None)
        )

        # Clients
        self.events = boto3.client("events", region_name=self.region)
        self.apigw = boto3.client("apigateway", region_name=self.region)
        self.ddb_client = boto3.client("dynamodb", region_name=self.region)
        self.ddb_resource = boto3.resource("dynamodb", region_name=self.region)
        self.s3 = boto3.client("s3", region_name=self.region)
        self.lambda_ = boto3.client("lambda", region_name=self.region)
        self.logs = boto3.client("logs", region_name=self.region)
        self.sqs = boto3.client("sqs", region_name=self.region)

    def _account_id(self) -> str:
        return boto3.client("sts", region_name=self.region).get_caller_identity()["Account"]

    def _queue_url(self, name: str) -> Optional[str]:
        try:
            return boto3.client("sqs", region_name=self.region).get_queue_url(QueueName=name)["QueueUrl"]
        except ClientError:
            return None

    def _discover_api_base_url(self) -> Optional[str]:
        # find REST API by name and produce the URL for the current stage
        rest_id = self._rest_api_id_by_name(self.api_name)
        if not rest_id:
            return None
        # Stage is known; construct URL
        return f"https://{rest_id}.execute-api.{self.region}.amazonaws.com/{self.stage}/"

    def _rest_api_id_by_name(self, name: str) -> Optional[str]:
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

    def get_api_key_value(self) -> Optional[str]:
        position = None
        while True:
            kwargs = {"includeValues": False, "limit": 500}
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

    def wait_ddb_item(self, table_name: str, key_name: str, key_value: str, timeout_s: int = 240) -> bool:
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
            time.sleep(3)
        return False


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests using AWS SDK against live resources."""

    @classmethod
    def setUpClass(cls):
        cls.res = LiveResources()

    # ---------------------- Lambda ----------------------
    @mark.it("Lambda configuration: runtime, memory, reserved concurrency")
    def test_lambda_config(self):
        for fn_name in (self.res.fn_ingest, self.res.fn_fraud, self.res.fn_notifier):
            conf = self.res.lambda_.get_function(FunctionName=fn_name)["Configuration"]
            self.assertEqual(conf["Runtime"], "nodejs18.x")
            self.assertIn(conf["MemorySize"], (512, 3008))
            # dev/pr* use reserved concurrency 10 in this stack; prod may differ
            rce = conf.get("ReservedConcurrentExecutions")
            self.assertTrue(rce is None or rce >= 1)

    # ---------------------- S3 ----------------------
    @mark.it("S3: versioning enabled and unencrypted PUT is denied; SSE-S3 PUT succeeds")
    def test_s3_bucket_versioning_and_encryption(self):
        ver = self.res.s3.get_bucket_versioning(Bucket=self.res.bucket)
        self.assertEqual(ver.get("Status"), "Enabled", "S3 versioning must be enabled")

        # Unencrypted PUT must be denied by bucket policy
        key_plain = f"it-tests/plain-{int(time.time())}.json"
        denied = False
        try:
            self.res.s3.put_object(Bucket=self.res.bucket, Key=key_plain, Body=b"{}", ContentType="application/json")
        except ClientError as err:
            code = err.response.get("Error", {}).get("Code")
            denied = code in ("AccessDenied", "AccessDeniedException")
        self.assertTrue(denied, "Expected AccessDenied for unencrypted PUT")

        # Encrypted PUT succeeds
        key_sse = f"it-tests/sse-{int(time.time())}.json"
        self.res.s3.put_object(
            Bucket=self.res.bucket,
            Key=key_sse,
            Body=b"{}",
            ContentType="application/json",
            ServerSideEncryption="AES256",
        )
        # cleanup (best effort)
        try:
            self.res.s3.delete_object(Bucket=self.res.bucket, Key=key_sse)
        except ClientError:
            pass

    # ---------------------- API Gateway ----------------------
    @mark.it("API: POST /transactions without API key returns 401/403")
    def test_api_requires_api_key(self):
        if not self.res.transactions_endpoint:
            self.skipTest("API endpoint not discovered; skipping")
        body = {
            "transactionId": f"it-no-key-{int(time.time())}",
            "accountId": "acc-403",
            "amount": 1.23,
            "currency": "USD",
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
        self.assertTrue(self.res.wait_ddb_item(self.res.tbl_txn, "transactionId", txn_id), "DynamoDB write not found")

    # ---------------------- EventBridge ----------------------
    @mark.it("EventBridge: three buses exist and archive is present")
    def test_event_buses_and_archive_exist(self):
        for name in (self.res.bus_txn_name, self.res.bus_audit_name, self.res.bus_system_name):
            resp = self.res.events.describe_event_bus(Name=name)
            self.assertEqual(resp.get("Name"), name)
        arc = self.res.events.describe_archive(ArchiveName=self.res.archive_name)
        self.assertTrue(arc.get("ArchiveArn"))

    @mark.it("EventBridge rule → Lambda → DynamoDB audit path works (high-risk MCC)")
    def test_eventbridge_rule_and_audit(self):
        bus_name = self.res.bus_txn_name
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
        self.res.events.put_events(
            Entries=[
                {"Source": "tap.transactions", "DetailType": "Transaction", "Detail": json.dumps(detail), "EventBusName": bus_name}
            ]
        )

        # Buffer queue receives a message via SQS target
        q_name = f"tap-{self.res.stage}-buffer-queue"
        q_url = self.res.sqs.get_queue_url(QueueName=q_name)["QueueUrl"]

        found_msg = False
        deadline = time.time() + 120
        while time.time() < deadline and not found_msg:
            msgs = self.res.sqs.receive_message(QueueUrl=q_url, MaxNumberOfMessages=1, WaitTimeSeconds=5)
            if msgs.get("Messages"):
                found_msg = True
                break
        self.assertTrue(found_msg, "No message received on SQS buffer queue from EventBridge rule")

        # Fraud detector should write to audit table
        self.assertTrue(
            self.res.wait_ddb_item(self.res.tbl_audit, "transactionId", txn_id),
            "Audit log record not found in DynamoDB",
        )

    # ---------------------- CloudWatch Logs ----------------------
    @mark.it("CloudWatch Logs: ingest function has >=30 day retention and receives log events")
    def test_logs_for_ingest(self):
        # invoke to ensure log activity
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
        deadline = time.time() + 180
        while time.time() < deadline and not have_events:
            groups = self.res.logs.describe_log_groups(logGroupNamePrefix=lg_name, limit=1).get("logGroups", [])
            if not groups:
                time.sleep(3)
                continue
            # Some orgs pin retention (e.g., 731). Accept >= 30.
            retention = groups[0].get("retentionInDays")
            self.assertTrue(retention is None or retention >= 30, f"Unexpected retention: {retention}")
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
    @mark.it("DynamoDB: three PAY_PER_REQUEST tables with PITR enabled")
    def test_dynamodb_basics(self):
        for tbl in (self.res.tbl_txn, self.res.tbl_rules, self.res.tbl_audit):
            desc = self.res.ddb_client.describe_table(TableName=tbl)["Table"]
            mode = desc.get("BillingModeSummary", {}).get("BillingMode")
            self.assertEqual(mode, "PAY_PER_REQUEST")
            pitr = self.res.ddb_client.describe_continuous_backups(TableName=tbl)
            status = (
                pitr.get("ContinuousBackupsDescription", {})
                .get("PointInTimeRecoveryDescription", {})
                .get("PointInTimeRecoveryStatus")
            )
            self.assertEqual(status, "ENABLED")

    @mark.it("SQS: DLQs exist with expected defaults")
    def test_sqs_dlqs(self):
        for url in (self.res.lambda_dlq_url, self.res.eb_dlq_url):
            self.assertIsNotNone(url, "Expected DLQ URL to be present")
            attrs = self.res.sqs.get_queue_attributes(QueueUrl=url, AttributeNames=["All"]).get("Attributes", {})
            self.assertEqual(attrs.get("VisibilityTimeout"), "300")
            self.assertIn("ApproximateNumberOfMessages", attrs)


# Helpers for current UTC ISO (avoid utcnow deprecation noise)
def _utc_now_iso():
    return datetime.now(timezone.utc).isoformat()
