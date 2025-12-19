import json
import os
import sys
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "lib"))
from analyse import EventBridgeAnalyzer  # noqa: E402


def _build_analyzer(mock_boto):
    mock_boto.return_value = MagicMock()
    return EventBridgeAnalyzer(region="us-east-1")


class TestEventBridgeAnalyzerUnit:
    @patch.dict(os.environ, {"AWS_ENDPOINT_URL": "http://localhost:5000"})
    @patch("analyse.boto_client")
    def test_initialization_invokes_all_clients(self, mock_boto):
        _ = EventBridgeAnalyzer(region="us-east-1")
        call_names = [c.args[0] for c in mock_boto.call_args_list]
        assert call_names == ["events", "cloudwatch", "sqs", "lambda", "sts"]

    @patch("analyse.boto_client")
    def test_missing_required_tags(self, mock_boto):
        analyzer = _build_analyzer(mock_boto)
        missing = analyzer._missing_required_tags({"Environment": "prod"})
        assert missing == ["Application", "Owner"]

    @patch("analyse.boto_client")
    def test_overly_broad_pattern_detection_and_optimization(self, mock_boto):
        analyzer = _build_analyzer(mock_boto)
        broad = {"source": ["*"]}
        assert analyzer._is_overly_broad_pattern(broad) is True
        optimized = analyzer._optimize_pattern(broad)
        assert optimized["source"] != ["*"]
        assert "detail-type" in optimized

    @patch("analyse.boto_client")
    def test_get_tag_metric(self, mock_boto):
        analyzer = _build_analyzer(mock_boto)
        tags = {"metric:DailyInvocations": "42", "Owner": "ops"}
        metric = analyzer._get_tag_metric(tags, ["metric:dailyinvocations"])
        assert metric == 42

    @patch("analyse.boto_client")
    def test_retry_policy_detection(self, mock_boto):
        analyzer = _build_analyzer(mock_boto)
        targets = [
            {"retry_policy": {"MaximumRetryAttempts": 10, "MaximumEventAge": 3600}},
            {"retry_policy": {}},
        ]
        assert analyzer._has_custom_retry_policy(targets) is True

    @patch("analyse.boto_client")
    def test_fifo_target_without_group_id_flagged(self, mock_boto):
        analyzer = _build_analyzer(mock_boto)
        target = {
            "Id": "fifo-target",
            "Arn": "arn:aws:sqs:us-east-1:123456789012:queue.fifo",
            "SqsParameters": {"MessageGroupId": ""},
        }
        analyzed = analyzer._analyze_target(target)
        issue_types = {i["type"] for i in analyzed["issues"]}
        assert "sqs_fifo_no_group_id" in issue_types

    @patch("analyse.boto_client")
    def test_lambda_throttling_issue_surface(self, mock_boto):
        analyzer = _build_analyzer(mock_boto)
        analyzer.lambda_client = MagicMock()
        analyzer.lambda_client.get_function_configuration.return_value = {
            "ReservedConcurrentExecutions": 1
        }
        issues = analyzer._check_lambda_target(
            "arn:aws:lambda:us-east-1:123456789012:function:test-fn"
        )
        assert any(i["type"] == "lambda_throttling" for i in issues)

    @patch("analyse.boto_client")
    def test_prepare_topology_data_links_nodes(self, mock_boto):
        analyzer = _build_analyzer(mock_boto)
        analyzer.event_buses = [{"name": "bus-a", "issues": []}]
        analyzer.rules = [
            {
                "name": "rule-a",
                "event_bus": "bus-a",
                "issues": [],
                "targets": [{"id": "t1", "arn": "arn:aws:sqs:::q1", "issues": []}],
            }
        ]
        topology = analyzer._prepare_topology_data()
        node_ids = {n["id"] for n in topology["nodes"]}
        assert "bus_bus-a" in node_ids
        assert any(l["source"] == "bus_bus-a" and l["target"].startswith("rule_") for l in topology["links"])

    @patch("analyse.boto_client")
    def test_run_end_to_end_with_mocked_clients(self, mock_boto):
        # Build service mocks
        events = MagicMock()
        cloudwatch = MagicMock()
        sqs = MagicMock()
        lambda_client = MagicMock()
        sts = MagicMock()
        sts.get_caller_identity.return_value = {"Account": "111122223333"}

        # Paginators
        bus_paginator = MagicMock()
        bus_paginator.paginate.return_value = [
            {"EventBuses": [{"Name": "app-bus", "Arn": "arn:aws:events:::app-bus"}]}
        ]
        rule_paginator = MagicMock()
        rule_paginator.paginate.return_value = [
            {"Rules": [{"Name": "broad-rule", "Arn": "arn:aws:events:::rule/broad-rule", "State": "ENABLED"}]}
        ]

        def paginator_side_effect(name):
            return bus_paginator if name == "list_event_buses" else rule_paginator

        events.get_paginator.side_effect = paginator_side_effect
        events.list_archives.return_value = {"Archives": []}
        events.describe_event_bus.return_value = {"Policy": None}
        events.describe_rule.return_value = {
            "EventPattern": json.dumps({"source": ["*"]}),
            "ScheduleExpression": None,
        }
        events.list_targets_by_rule.return_value = {
            "Targets": [
                {
                    "Id": "t1",
                    "Arn": "arn:aws:sqs:us-east-1:111122223333:q.fifo",
                    "SqsParameters": {"MessageGroupId": ""},
                }
            ]
        }
        events.list_tags_for_resource.return_value = {"Tags": [{"Key": "Owner", "Value": "ops"}]}

        # CloudWatch metrics with data to pass invocation filter
        cloudwatch.get_metric_statistics.return_value = {"Datapoints": [{"Sum": 140}]}
        cloudwatch.describe_alarms.return_value = {"MetricAlarms": []}

        sqs.get_queue_url.return_value = {"QueueUrl": "https://sqs.mock/queue"}
        sqs.get_queue_attributes.return_value = {
            "Attributes": {"ApproximateNumberOfMessages": "3", "ApproximateAgeOfOldestMessage": "10"}
        }

        lambda_client.get_function_configuration.return_value = {"ReservedConcurrentExecutions": 1}

        def boto_side_effect(service, region):
            return {
                "events": events,
                "cloudwatch": cloudwatch,
                "sqs": sqs,
                "lambda": lambda_client,
                "sts": sts,
            }[service]

        mock_boto.side_effect = boto_side_effect

        analyzer = EventBridgeAnalyzer(region="us-east-1")
        payload = analyzer.run()

        assert payload["summary"]["buses_audited"] >= 0
        assert payload["summary"]["rules_audited"] == 1
        issues = {i["type"] for i in payload["rules"][0]["issues"]}
        assert "sqs_fifo_no_group_id" in issues

    @patch("analyse.boto_client")
    def test_analyze_single_bus_paths(self, mock_boto):
        analyzer = _build_analyzer(mock_boto)
        analyzer.events_client = MagicMock()
        analyzer.events_client.list_tags_for_resource.return_value = {"Tags": [{"Key": "DataClassification", "Value": "sensitive"}]}
        analyzer.events_client.list_archives.return_value = {"Archives": [{"State": "ENABLED", "KmsKeyId": ""}]}
        analyzer.events_client.describe_event_bus.return_value = {"Policy": None}
        analyzer.events_client.get_paginator.return_value.paginate.return_value = [{"Rules": [{"Name": "r1"}]}]
        bus = {"Name": "payment-bus", "Arn": "arn:aws:events:::payment-bus"}
        result = analyzer._analyze_single_bus(bus)
        issue_types = {i["type"] for i in result["issues"]}
        assert "no_encryption" in issue_types
        assert "missing_resource_policy" in issue_types

    @patch("analyse.boto_client")
    def test_analyze_single_rule_with_metrics(self, mock_boto):
        analyzer = _build_analyzer(mock_boto)
        analyzer.events_client = MagicMock()
        analyzer.cloudwatch = MagicMock()
        analyzer.lambda_client = MagicMock()
        analyzer.sqs_client = MagicMock()
        analyzer.events_client.describe_rule.return_value = {"EventPattern": json.dumps({"source": ["aws.test"]}), "ScheduleExpression": None}
        analyzer.events_client.list_targets_by_rule.return_value = {
            "Targets": [
                {"Id": "t1", "Arn": "arn:aws:sqs:us-east-1:1111:q.fifo", "SqsParameters": {"MessageGroupId": ""}},
                {"Id": "t2", "Arn": "arn:aws:lambda:us-east-1:1111:function:fn"},
            ]
        }
        analyzer.events_client.list_tags_for_resource.return_value = {"Tags": [{"Key": "Metric:DailyInvocations", "Value": "20"}]}
        analyzer.cloudwatch.get_metric_statistics.return_value = {"Datapoints": [{"Sum": 14}]}
        analyzer.cloudwatch.describe_alarms.return_value = {"MetricAlarms": []}
        analyzer.lambda_client.get_function_configuration.return_value = {"ReservedConcurrentExecutions": 1}
        analyzer.sqs_client.get_queue_url.return_value = {"QueueUrl": "url"}
        analyzer.sqs_client.get_queue_attributes.return_value = {"Attributes": {"ApproximateNumberOfMessages": "2"}}

        rule = {"Name": "t-rule", "Arn": "arn:aws:events:::rule/t-rule", "State": "ENABLED"}
        analyzed = analyzer._analyze_single_rule(rule, "default")
        assert analyzed is not None
        issue_types = {i["type"] for i in analyzed["issues"]}
        assert "sqs_fifo_no_group_id" in issue_types or any("sqs_fifo_no_group_id" in i.get("details", "") for i in analyzed["issues"])
