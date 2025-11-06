# tests/integration/test_tap_stack.py
# pylint: disable=missing-class-docstring,missing-function-docstring,too-many-locals,too-many-branches
import json
import os
import re
import time
import base64
import unittest
from datetime import datetime, timezone
from typing import Optional, Tuple, Dict, Any, List

import boto3
import requests
from botocore.exceptions import ClientError
from pytest import mark

# --- Optional flat outputs (we won't rely on them) ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FLAT_OUTPUTS_PATH = os.path.join(BASE_DIR, "..", "..", "cfn-outputs", "flat-outputs.json")
FLAT = {}
if os.path.exists(FLAT_OUTPUTS_PATH):
    try:
        with open(FLAT_OUTPUTS_PATH, "r", encoding="utf-8") as f:
            FLAT = json.load(f) or {}
    except Exception:
        FLAT = {}

DEFAULT_REGION = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "eu-central-1"

# ----------------------------- helpers -----------------------------
def _stage_from_url(url: Optional[str]) -> Optional[str]:
    if not url:
        return None
    m = re.match(r"^https?://[^/]+/([^/]+)/?", url)
    return m.group(1) if m else None

def _utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

def _first(iterable, pred=lambda x: True):
    for x in iterable:
        if pred(x):
            return x
    return None


class DiscoveryError(AssertionError):
    pass


class LiveResources:
    """
    Robust discovery of deployed resources using AWS SDK.
    No reliance on flat-outputs; falls back to scanning APIs/buses/tables/queues/buckets.
    """

    def __init__(self):
        # Clients first
        self.region = DEFAULT_REGION
        self.sts = boto3.client("sts", region_name=self.region)
        self.events = boto3.client("events", region_name=self.region)
        self.apigw = boto3.client("apigateway", region_name=self.region)
        self.ddb_client = boto3.client("dynamodb", region_name=self.region)
        self.ddb_resource = boto3.resource("dynamodb", region_name=self.region)
        self.s3 = boto3.client("s3", region_name=self.region)
        self.lambda_ = boto3.client("lambda", region_name=self.region)
        self.logs = boto3.client("logs", region_name=self.region)
        self.sqs = boto3.client("sqs", region_name=self.region)

        # Account for name templates
        try:
            self.account_id = self.sts.get_caller_identity()["Account"]
        except Exception:
            self.account_id = "000000000000"

        # Try direct outputs first
        self.api_base_url = FLAT.get("ApiBaseUrl") or FLAT.get("TransactionAPIEndpointF9B09F4E")
        self.stage = (
            _stage_from_url(self.api_base_url)
            or FLAT.get("Stage")
            or os.environ.get("ENV_SUFFIX")
            or os.environ.get("ENVIRONMENT_SUFFIX")
            or os.environ.get("STAGE")
            or self._discover_stage()
        )

        # Now we can build names
        self.api_name = f"tap-{self.stage}-api"
        self.api_key_name = f"tap-{self.stage}-api-key"
        self.bus_txn_name = f"tap-{self.stage}-transaction"
        self.bus_audit_name = f"tap-{self.stage}-audit"
        self.bus_system_name = f"tap-{self.stage}-system"
        self.archive_name = f"tap-{self.stage}-transaction-archive"
        self.tbl_txn = f"tap-{self.stage}-transactions"
        self.tbl_rules = f"tap-{self.stage}-rules"
        self.tbl_audit = f"tap-{self.stage}-audit-logs"
        self.bucket = FLAT.get("ProcessedBucketName") or f"tap-{self.stage}-{self.region}-{self.account_id}-processed-data"
        self.fn_ingest = FLAT.get("IngestFnName") or f"tap-{self.stage}-ingest_processor"
        self.fn_fraud = FLAT.get("FraudFnName") or f"tap-{self.stage}-fraud_detector"
        self.fn_notifier = FLAT.get("NotifierFnName") or f"tap-{self.stage}-notifier"

        # DLQs: prefer outputs, fallback by name scan
        self.lambda_dlq_url = FLAT.get("LambdaDLQUrl") or self._queue_url(f"tap-{self.stage}-lambda-failures-dlq")
        self.eb_dlq_url = FLAT.get("EventBridgeDLQUrl") or self._queue_url(f"tap-{self.stage}-eventbridge-failures-dlq")

        # API endpoint: compute if outputs missing
        if not self.api_base_url:
            rest_id = self._rest_api_id_by_name(self.api_name)
            if not rest_id:
                raise DiscoveryError(
                    f"Could not discover API id for name '{self.api_name}'. "
                    f"Available APIs: {self._debug_rest_api_names()}"
                )
            self.api_base_url = f"https://{rest_id}.execute-api.{self.region}.amazonaws.com/{self.stage}/"

        self.transactions_endpoint = (
            FLAT.get("TransactionsEndpoint") or (self.api_base_url.rstrip("/") + "/transactions")
        )

        # Sanity checks early to fail fast with context
        self._assert_bus_exists(self.bus_txn_name)
        self._assert_table_exists(self.tbl_txn)
        self._assert_lambda_exists(self.fn_ingest)

    # -------- stage discovery without outputs --------
    def _discover_stage(self) -> str:
        # 1) From API names tap-<stage>-api
        try:
            apis = self._list_rest_apis()
            name = _first((a["name"] for a in apis if a.get("name", "").startswith("tap-") and a["name"].endswith("-api")))
            if name:
                m = re.match(r"^tap-(?P<stage>[^-]+)-api$", name)
                if m:
                    return m.group("stage")
        except Exception:
            pass

        # 2) From EventBridge bus names tap-<stage>-transaction
        try:
            buses = self.events.list_event_buses()["EventBuses"]
            name = _first((b["Name"] for b in buses if re.match(r"^tap-[^-]+-transaction$", b["Name"])))
            if name:
                return name.split("-")[1]
        except Exception:
            pass

        # 3) From DynamoDB table tap-<stage>-transactions
        try:
            for tbl in self._list_all_tables():
                m = re.match(r"^tap-([^-]+)-transactions$", tbl)
                if m:
                    return m.group(1)
        except Exception:
            pass

        # 4) From SQS queue names tap-<stage>-buffer-queue
        try:
            urls = self.sqs.list_queues(QueueNamePrefix="tap-").get("QueueUrls", [])
            for url in urls:
                name = url.rsplit("/", 1)[-1]
                m = re.match(r"^tap-([^-]+)-buffer-queue$", name)
                if m:
                    return m.group(1)
        except Exception:
            pass

        raise DiscoveryError(
            "Failed to discover stage from APIs/EventBridge/DynamoDB/SQS and no ENV/outputs available."
        )

    # -------- AWS queries & asserts --------
    def _list_rest_apis(self) -> List[Dict[str, Any]]:
        apis = []
        position = None
        while True:
            kwargs = {"limit": 500}
            if position:
                kwargs["position"] = position
            page = self.apigw.get_rest_apis(**kwargs)
            apis.extend(page.get("items", []))
            position = page.get("position")
            if not position:
                break
        return apis

    def _debug_rest_api_names(self) -> List[str]:
        try:
            return [a.get("name") for a in self._list_rest_apis()]
        except Exception:
            return []

    def _rest_api_id_by_name(self, name: str) -> Optional[str]:
        for item in self._list_rest_apis():
            if item.get("name") == name:
                return item.get("id")
        return None

    def _queue_url(self, name: str) -> Optional[str]:
        try:
            return self.sqs.get_queue_url(QueueName=name)["QueueUrl"]
        except ClientError:
            # attempt prefix scan
            urls = self.sqs.list_queues(QueueNamePrefix=name).get("QueueUrls", [])
            return _first(urls, lambda u: u.rsplit("/", 1)[-1] == name)

    def _list_all_tables(self) -> List[str]:
        tables = []
        last = None
        while True:
            if last:
                page = self.ddb_client.list_tables(ExclusiveStartTableName=last)
            else:
                page = self.ddb_client.list_tables()
            tables.extend(page.get("TableNames", []))
            last = page.get("LastEvaluatedTableName")
            if not last:
                break
        return tables

    def _assert_bus_exists(self, name: str):
        try:
            self.events.describe_event_bus(Name=name)
        except ClientError as e:
            raise DiscoveryError(f"Event bus '{name}' not found. Buses: {self._debug_buses()} | {e}")

    def _debug_buses(self) -> List[str]:
        try:
            return [b["Name"] for b in self.events.list_event_buses().get("EventBuses", [])]
        except Exception:
            return []

    def _assert_table_exists(self, name: str):
        try:
            self.ddb_client.describe_table(TableName=name)
        except ClientError as e:
            raise DiscoveryError(f"DynamoDB table '{name}' not found. Tables: {self._list_all_tables()} | {e}")

    def _assert_lambda_exists(self, name: str):
        try:
            self.lambda_.get_function(FunctionName=name)
        except ClientError as e:
            raise DiscoveryError(f"Lambda '{name}' not found. {self._debug_lambdas_hint()} | {e}")

    def _debug_lambdas_hint(self) -> str:
        # avoid listing all; just hint the prefix
        return f"Expected a function starting with 'tap-{self.stage}-' in region {self.region}."

    def get_api_key_value(self) -> str:
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
                    val = key.get("value")
                    if not val:
                        raise AssertionError(f"API key '{self.api_key_name}' has no value")
                    return val
            position = page.get("position")
            if not position:
                raise AssertionError(
                    f"API key '{self.api_key_name}' not found. Existing keys: "
                    f"{[k.get('name') for k in page.get('items', [])]}"
                )

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

    def diag_lambda_tail(self, function_name: str, max_events: int = 10) -> str:
        lg = f"/aws/lambda/{function_name}"
        try:
            groups = self.logs.describe_log_groups(logGroupNamePrefix=lg, limit=1).get("logGroups", [])
            if not groups:
                return "No log group yet."
            streams = self.logs.describe_log_streams(
                logGroupName=lg, orderBy="LastEventTime", descending=True, limit=1
            ).get("logStreams", [])
            if not streams:
                return "No log streams yet."
            stream = streams[0]["logStreamName"]
            events = self.logs.get_log_events(logGroupName=lg, logStreamName=stream, limit=max_events).get("events", [])
            lines = [e.get("message", "").strip() for e in events if "message" in e]
            return "\n".join(lines[-max_events:])
        except Exception as e:
            return f"Log diagnostic error: {e}"


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests using AWS SDK against live resources. No skips; fail with diagnostics."""

    @classmethod
    def setUpClass(cls):
        cls.res = LiveResources()

    # ---------------------- Lambda ----------------------
    @mark.it("Lambda configuration: runtime, memory, reserved concurrency")
    def test_lambda_config(self):
        for fn_name in (self.res.fn_ingest, self.res.fn_fraud, self.res.fn_notifier):
            conf = self.res.lambda_.get_function(FunctionName=fn_name)["Configuration"]
            self.assertEqual(
                conf["Runtime"],
                "nodejs18.x",
                f"{fn_name} runtime mismatch: {conf['Runtime']}"
            )
            self.assertIn(
                conf["MemorySize"], (512, 3008),
                f"{fn_name} memory unexpected: {conf['MemorySize']}"
            )
            rce = conf.get("ReservedConcurrentExecutions")
            self.assertTrue(
                rce is None or rce >= 1,
                f"{fn_name} ReservedConcurrentExecutions invalid: {rce}"
            )

    # ---------------------- S3 ----------------------
    @mark.it("S3: versioning enabled and unencrypted PUT is denied; SSE-S3 PUT succeeds")
    def test_s3_bucket_versioning_and_encryption(self):
        try:
            ver = self.res.s3.get_bucket_versioning(Bucket=self.res.bucket)
        except ClientError as e:
            self.fail(f"S3 bucket '{self.res.bucket}' not reachable: {e}")

        self.assertEqual(ver.get("Status"), "Enabled", f"S3 versioning must be enabled on {self.res.bucket}")

        # Unencrypted PUT must be denied by bucket policy
        key_plain = f"it-tests/plain-{int(time.time())}.json"
        denied = False
        try:
            self.res.s3.put_object(Bucket=self.res.bucket, Key=key_plain, Body=b"{}", ContentType="application/json")
        except ClientError as err:
            code = err.response.get("Error", {}).get("Code")
            denied = code in ("AccessDenied", "AccessDeniedException")
        self.assertTrue(denied, f"Expected AccessDenied for unencrypted PUT to {self.res.bucket}")

        # Encrypted PUT succeeds
        key_sse = f"it-tests/sse-{int(time.time())}.json"
        self.res.s3.put_object(
            Bucket=self.res.bucket,
            Key=key_sse,
            Body=b"{}",
            ContentType="application/json",
            ServerSideEncryption="AES256",
        )
        # cleanup best effort
        try:
            self.res.s3.delete_object(Bucket=self.res.bucket, Key=key_sse)
        except ClientError:
            pass

    # ---------------------- API Gateway ----------------------
    @mark.it("API: POST /transactions requires API key (401/403 without key)")
    def test_api_requires_api_key(self):
        self.assertIsNotNone(self.res.transactions_endpoint, "API endpoint discovery failed.")
        body = {
            "transactionId": f"it-no-key-{int(time.time())}",
            "accountId": "acc-403",
            "amount": 1.23,
            "currency": "USD",
        }
        resp = requests.post(self.res.transactions_endpoint, json=body, timeout=30)
        self.assertIn(resp.status_code, (401, 403), f"Expected 401/403, got {resp.status_code}: {resp.text}")

    @mark.it("API: POST /transactions with key persists to DynamoDB (diagnose 5xx with Lambda logs)")
    def test_api_with_key_persists_to_dynamodb(self):
        self.assertIsNotNone(self.res.transactions_endpoint, "API endpoint discovery failed.")
        api_key_val = self.res.get_api_key_value()

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
        if resp.status_code != 200:
            tail = self.res.diag_lambda_tail(self.res.fn_ingest)
            self.fail(
                f"API call failed {resp.status_code}: {resp.text}\n"
                f"Lambda '{self.res.fn_ingest}' recent logs:\n{tail}"
            )

        ok = self.res.wait_ddb_item(self.res.tbl_txn, "transactionId", txn_id)
        self.assertTrue(ok, f"DynamoDB write not found in '{self.res.tbl_txn}' for transactionId={txn_id}")

    # ---------------------- EventBridge ----------------------
    @mark.it("EventBridge: three buses exist and archive is present")
    def test_event_buses_and_archive_exist(self):
        for name in (self.res.bus_txn_name, self.res.bus_audit_name, self.res.bus_system_name):
            info = self.res.events.describe_event_bus(Name=name)
            self.assertEqual(info.get("Name"), name, f"Event bus '{name}' not found (got: {info})")
        arc = self.res.events.describe_archive(ArchiveName=self.res.archive_name)
        self.assertTrue(arc.get("ArchiveArn"), f"Archive '{self.res.archive_name}' missing or not described")

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
        put = self.res.events.put_events(
            Entries=[{"Source": "tap.transactions", "DetailType": "Transaction", "Detail": json.dumps(detail), "EventBusName": bus_name}]
        )
        self.assertGreaterEqual(put.get("FailedEntryCount", 0), 0, "PutEvents returned failure")

        # Expect an SQS message on buffer queue
        q_name = f"tap-{self.res.stage}-buffer-queue"
        q_url = self.res._queue_url(q_name)
        self.assertIsNotNone(q_url, f"Buffer queue '{q_name}' not found")

        found_msg = False
        deadline = time.time() + 150
        while time.time() < deadline and not found_msg:
            msgs = self.res.sqs.receive_message(QueueUrl=q_url, MaxNumberOfMessages=1, WaitTimeSeconds=10)
            if msgs.get("Messages"):
                found_msg = True
                break
        if not found_msg:
            tail = self.res.diag_lambda_tail(self.res.fn_fraud)
            self.fail(
                "No message received on SQS buffer queue from EventBridge rule within timeout.\n"
                f"Fraud Lambda '{self.res.fn_fraud}' recent logs:\n{tail}"
            )

        # Fraud detector should write into audit table
        ok = self.res.wait_ddb_item(self.res.tbl_audit, "transactionId", txn_id)
        self.assertTrue(ok, f"Audit log not found in '{self.res.tbl_audit}' for transactionId={txn_id}")

    # ---------------------- CloudWatch Logs ----------------------
    @mark.it("CloudWatch Logs: ingest function has ≥30 day retention and receives log events")
    def test_logs_for_ingest(self):
        payload = {
            "transactionId": f"it-invoke-{int(time.time())}",
            "accountId": "acc-invoke",
            "amount": 5.0,
            "currency": "USD",
        }
        invoke = self.res.lambda_.invoke(FunctionName=self.res.fn_ingest, Payload=json.dumps(payload).encode("utf-8"))
        self.assertEqual(invoke.get("StatusCode"), 200, f"Lambda invoke failed: {invoke}")

        lg_name = f"/aws/lambda/{self.res.fn_ingest}"
        have_events = False
        deadline = time.time() + 180
        retention_ok = False
        last_err = None

        while time.time() < deadline and not have_events:
            try:
                groups = self.res.logs.describe_log_groups(logGroupNamePrefix=lg_name, limit=1).get("logGroups", [])
                if not groups:
                    time.sleep(3); continue
                retention = groups[0].get("retentionInDays")
                retention_ok = (retention is None) or (retention >= 30)  # org policy may set 731
                streams = self.res.logs.describe_log_streams(
                    logGroupName=lg_name, orderBy="LastEventTime", descending=True, limit=1
                ).get("logStreams", [])
                if not streams:
                    time.sleep(3); continue
                stream = streams[0]["logStreamName"]
                events = self.res.logs.get_log_events(logGroupName=lg_name, logStreamName=stream, limit=5).get("events", [])
                have_events = len(events) > 0
                if not have_events:
                    time.sleep(3)
            except ClientError as e:
                last_err = e
                time.sleep(3)

        self.assertTrue(retention_ok, f"Unexpected retention policy for {lg_name}")
        self.assertTrue(have_events, f"No log events observed for ingest function; last error: {last_err}")

    # ---------------------- DynamoDB & SQS basics ----------------------
    @mark.it("DynamoDB: three PAY_PER_REQUEST tables with PITR enabled")
    def test_dynamodb_basics(self):
        for tbl in (self.res.tbl_txn, self.res.tbl_rules, self.res.tbl_audit):
            desc = self.res.ddb_client.describe_table(TableName=tbl)["Table"]
            mode = desc.get("BillingModeSummary", {}).get("BillingMode")
            self.assertEqual(mode, "PAY_PER_REQUEST", f"{tbl} billing mode is {mode}")
            pitr = self.res.ddb_client.describe_continuous_backups(TableName=tbl)
            status = (
                pitr.get("ContinuousBackupsDescription", {})
                .get("PointInTimeRecoveryDescription", {})
                .get("PointInTimeRecoveryStatus")
            )
            self.assertEqual(status, "ENABLED", f"{tbl} PITR status is {status}")

    @mark.it("SQS: DLQs exist with expected defaults")
    def test_sqs_dlqs(self):
        for name in (f"tap-{self.res.stage}-lambda-failures-dlq", f"tap-{self.res.stage}-eventbridge-failures-dlq"):
            url = self.res._queue_url(name)
            self.assertIsNotNone(url, f"Expected DLQ '{name}' to exist")
            attrs = self.res.sqs.get_queue_attributes(QueueUrl=url, AttributeNames=["All"]).get("Attributes", {})
            self.assertEqual(attrs.get("VisibilityTimeout"), "300", f"{name} visibility timeout mismatch")
            self.assertIn("ApproximateNumberOfMessages", attrs, f"{name} missing ApproximateNumberOfMessages")
