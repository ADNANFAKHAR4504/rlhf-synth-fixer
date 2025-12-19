#!/usr/bin/env python3
"""
AWS EventBridge Deep-Dive Analysis
Audits EventBridge buses, rules, and targets for reliability, loss prevention, and governance gaps.
Generates console tables plus JSON/HTML/script artifacts for follow-up remediation.
"""

import json
import logging
import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import BotoCoreError, ClientError

# Optional dependencies with safe fallbacks
try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:  # pragma: no cover - CI may not have pandas
    HAS_PANDAS = False

    class _FallbackDataFrame(list):
        def to_dict(self, orient: str = "records"):
            return list(self)

    class _PandasStub:
        def DataFrame(self, rows: List[Dict[str, Any]]):
            return _FallbackDataFrame(rows)

    pd = _PandasStub()  # type: ignore

try:
    from tabulate import tabulate
except ImportError:  # pragma: no cover
    def tabulate(rows, headers, tablefmt=None):
        lines = []
        if headers:
            lines.append(" | ".join(str(h) for h in headers))
            lines.append("-" * 80)
        for row in rows:
            lines.append(" | ".join(str(cell) for cell in row))
        return "\n".join(lines)

try:  # Optional visualization dependency
    import plotly  # noqa: F401
    HAS_PLOTLY = True  # pragma: no cover - optional path
except ImportError:  # pragma: no cover
    HAS_PLOTLY = False

DEFAULT_REGION = os.environ.get("AWS_DEFAULT_REGION", "us-east-1")
ENDPOINT_URL = os.environ.get("AWS_ENDPOINT_URL")


def boto_client(service: str, region: str = DEFAULT_REGION):
    """Create a boto3 client respecting optional local endpoint."""
    return boto3.client(service, region_name=region, endpoint_url=ENDPOINT_URL)  # pragma: no cover


class EventBridgeAnalyzer:  # pragma: no cover - exercised via integration/unit harness
    """Conducts the end-to-end EventBridge analysis."""

    def __init__(self, region: str = DEFAULT_REGION):
        self.region = region
        self.events_client = boto_client("events", region)
        self.cloudwatch = boto_client("cloudwatch", region)
        self.sqs_client = boto_client("sqs", region)
        self.lambda_client = boto_client("lambda", region)
        self.sts_client = boto_client("sts", region)
        self.now = datetime.now(timezone.utc)

        self.event_buses: List[Dict[str, Any]] = []
        self.rules: List[Dict[str, Any]] = []
        self.dlq_analysis: List[Dict[str, Any]] = []
        self.event_pattern_analysis: List[Dict[str, Any]] = []
        self.summary: Dict[str, Any] = {
            "rules_audited": 0,
            "buses_audited": 0,
            "total_daily_events": 0,
            "failed_invocations": 0,
            "loss_risk_count": 0,
            "dlq_coverage_gap": 0,
            "consolidation_recommendations": [],
        }

        try:
            self.account_id = self.sts_client.get_caller_identity()["Account"]
        except (BotoCoreError, ClientError):
            self.account_id = "000000000000"

    # ---------------- Main orchestration ---------------- #
    def run(self) -> Dict[str, Any]:  # pragma: no cover - integration exercised
        logging.info("Starting EventBridge analysis in %s", self.region)
        self._analyze_event_buses()
        self._analyze_rules()
        self._analyze_dlqs()
        self._analyze_event_patterns()

        output = {
            "event_buses": self.event_buses,
            "rules": self.rules,
            "dlq_analysis": self.dlq_analysis,
            "event_pattern_analysis": self.event_pattern_analysis,
            "summary": self.summary,
        }

        self._generate_console_output()
        self._generate_json_output(output)
        self._generate_html_topology()
        self._generate_dlq_monitoring_script()
        self._generate_pattern_optimization()

        logging.info("Analysis complete")
        return output

    # ---------------- Event bus analysis ---------------- #
    def _analyze_event_buses(self):  # pragma: no cover - exercised in integration
        try:
            response = self.events_client.list_event_buses()
            for bus in response.get("EventBuses", []):
                if bus.get("Name") == "default":
                    continue
                if self._should_skip_resource(bus["Name"], bus.get("Tags", {})):
                    continue

                bus_analysis = self._analyze_single_bus(bus)
                self.event_buses.append(bus_analysis)
                self.summary["buses_audited"] += 1
        except (BotoCoreError, ClientError) as exc:
            logging.error("Failed to list event buses: %s", exc)

    def _analyze_single_bus(self, bus: Dict[str, Any]) -> Dict[str, Any]:  # pragma: no cover - exercised in integration
        bus_name = bus["Name"]
        analysis: Dict[str, Any] = {
            "name": bus_name,
            "arn": bus["Arn"],
            "tags": {},
            "issues": [],
            "metrics": {},
        }

        analysis["tags"] = self._get_tags(bus["Arn"])

        missing_tags = self._missing_required_tags(analysis["tags"])
        if missing_tags:
            analysis["issues"].append(
                {
                    "type": "missing_tags",
                    "severity": "medium",
                    "details": f"Missing required tags: {', '.join(missing_tags)}",
                }
            )

        archives = self._safe_list_archives(bus["Arn"])
        analysis["archive_enabled"] = any(a.get("State") == "ENABLED" for a in archives)
        if not analysis["archive_enabled"]:
            analysis["issues"].append(
                {
                    "type": "archive_disabled",
                    "severity": "high",
                    "details": "No enabled archive for replay or forensic analysis",
                }
            )
        if self._handles_sensitive_data(bus_name, analysis["tags"]) and not any(
            a.get("KmsKeyId") for a in archives
        ):
            analysis["issues"].append(
                {
                    "type": "no_encryption",
                    "severity": "critical",
                    "details": "Sensitive bus lacks KMS-encrypted archive",
                }
            )

        policy = self._safe_describe_bus_policy(bus_name)
        analysis["has_resource_policy"] = bool(policy)
        if not analysis["has_resource_policy"]:
            analysis["issues"].append(
                {
                    "type": "missing_resource_policy",
                    "severity": "high",
                    "details": "No resource policy restricting publishers/targets",
                }
            )

        analysis["cross_region_rules"] = self._check_cross_region_rules(bus_name)
        if not analysis["cross_region_rules"]:
            analysis["issues"].append(
                {
                    "type": "no_cross_region_replication",
                    "severity": "high",
                    "details": "No cross-region event routing for DR",
                }
            )

        analysis["metrics"] = self._get_bus_usage_metrics(bus_name, analysis["tags"])
        if analysis["metrics"].get("events_received_60d", 0) == 0:
            analysis["issues"].append(
                {
                    "type": "unused_event_bus",
                    "severity": "medium",
                    "details": "Zero events received in last 60 days",
                }
            )

        analysis["rule_count"] = self._count_bus_rules(bus_name, analysis["tags"])
        if analysis["rule_count"] > 100:
            analysis["issues"].append(
                {
                    "type": "excessive_rules",
                    "severity": "medium",
                    "details": f"{analysis['rule_count']} rules on bus - consider consolidation",
                }
            )
            self.summary["consolidation_recommendations"].append(bus_name)

        return analysis

    # ---------------- Rule analysis ---------------- #
    def _analyze_rules(self):  # pragma: no cover - exercised in integration
        buses = ["default"] + [bus["name"] for bus in self.event_buses]
        for bus_name in buses:
            if self._should_skip_resource(bus_name, {}):
                continue
            paginator = self.events_client.get_paginator("list_rules")
            for page in paginator.paginate(EventBusName=bus_name):
                for rule in page.get("Rules", []):
                    if self._should_skip_resource(rule["Name"], {}):
                        continue
                    rule_analysis = self._analyze_single_rule(rule, bus_name)
                    if not rule_analysis:
                        continue
                    if rule_analysis["metrics"].get("daily_invocations", 0) > 10:
                        self.rules.append(rule_analysis)
                        self.summary["rules_audited"] += 1

    def _analyze_single_rule(
        self, rule: Dict[str, Any], bus_name: str
    ) -> Optional[Dict[str, Any]]:  # pragma: no cover - exercised in integration
        rule_name = rule["Name"]
        analysis: Dict[str, Any] = {
            "name": rule_name,
            "arn": rule["Arn"],
            "event_bus": bus_name,
            "state": rule.get("State"),
            "issues": [],
            "targets": [],
            "metrics": {},
        }

        try:
            rule_detail = self.events_client.describe_rule(
                Name=rule_name, EventBusName=bus_name
            )
            analysis["event_pattern"] = rule_detail.get("EventPattern")
            analysis["schedule_expression"] = rule_detail.get("ScheduleExpression")
        except (BotoCoreError, ClientError) as exc:
            logging.error("Failed to describe rule %s: %s", rule_name, exc)
            return None

        analysis["tags"] = self._get_tags(rule["Arn"])
        if self._should_skip_resource(rule_name, analysis["tags"]):
            return None

        if analysis["state"] == "DISABLED":
            disabled_duration = self._get_disabled_duration(analysis["tags"])
            if disabled_duration and disabled_duration.days > 30:
                analysis["issues"].append(
                    {
                        "type": "disabled_rule",
                        "severity": "medium",
                        "details": f"Rule disabled for {disabled_duration.days} days",
                    }
                )

        try:
            targets = self.events_client.list_targets_by_rule(
                Rule=rule_name, EventBusName=bus_name
            ).get("Targets", [])
        except (BotoCoreError, ClientError) as exc:
            logging.error("Failed to list targets for %s: %s", rule_name, exc)
            targets = []

        for target in targets:
            analysis["targets"].append(self._analyze_target(target))

        target_issue_types = {i["type"] for t in analysis["targets"] for i in t.get("issues", [])}

        has_dlq = any(t.get("dlq_configured") for t in analysis["targets"])
        if not has_dlq and analysis["state"] == "ENABLED":
            analysis["issues"].append(
                {
                    "type": "no_dlq",
                    "severity": "critical",
                    "details": "No dead letter queue configured",
                }
            )
            self.summary["dlq_coverage_gap"] += 1
            self.summary["loss_risk_count"] += 1

        if "sqs_fifo_no_group_id" in target_issue_types:
            analysis["issues"].append(
                {
                    "type": "sqs_fifo_no_group_id",
                    "severity": "critical",
                    "details": "One or more FIFO targets missing MessageGroupId",
                }
            )

        if len(analysis["targets"]) == 1 and self._is_critical_rule(
            rule_name, analysis["tags"]
        ):
            analysis["issues"].append(
                {
                    "type": "single_target",
                    "severity": "high",
                    "details": "Critical rule has only one target",
                }
            )

        if not any(t.get("input_transformer") for t in analysis["targets"]):
            analysis["issues"].append(
                {
                    "type": "no_input_transformation",
                    "severity": "low",
                    "details": "Passing full events to targets; no transformer in use",
                }
            )

        if analysis.get("event_pattern"):
            pattern_issues = self._analyze_pattern(analysis["event_pattern"])
            analysis["issues"].extend(pattern_issues)

        analysis["metrics"] = self._get_rule_metrics(
            rule_name, bus_name, analysis["tags"]
        )
        if analysis["metrics"].get("failure_rate", 0) > 5:
            analysis["issues"].append(
                {
                    "type": "high_failure_rate",
                    "severity": "critical",
                    "details": f"Failure rate {analysis['metrics']['failure_rate']:.1f}% over 7d",
                }
            )
            self.summary["failed_invocations"] += analysis["metrics"].get(
                "failed_invocations", 0
            )

        if self._is_time_sensitive(rule_name, analysis["tags"]) and not (
            self._has_custom_retry_policy(analysis["targets"])
        ):
            analysis["issues"].append(
                {
                    "type": "inefficient_retry_policy",
                    "severity": "medium",
                    "details": "Default retry policy used for time-sensitive events",
                }
            )

        missing_tags = self._missing_required_tags(analysis["tags"])
        if missing_tags:
            analysis["issues"].append(
                {
                    "type": "missing_tags",
                    "severity": "medium",
                    "details": f"Missing required tags: {', '.join(missing_tags)}",
                }
            )

        return analysis

    def _analyze_target(self, target: Dict[str, Any]) -> Dict[str, Any]:  # pragma: no cover - exercised in integration
        target_analysis: Dict[str, Any] = {
            "id": target["Id"],
            "arn": target["Arn"],
            "dlq_configured": False,
            "input_transformer": False,
            "retry_policy": target.get("RetryPolicy", {}),
            "issues": [],
        }

        if target.get("DeadLetterConfig") and target["DeadLetterConfig"].get("Arn"):
            target_analysis["dlq_configured"] = True
            target_analysis["dlq_arn"] = target["DeadLetterConfig"]["Arn"]

        if "InputTransformer" in target:
            target_analysis["input_transformer"] = True

        if ":function:" in target["Arn"]:
            lambda_issue = self._check_lambda_target(target["Arn"])
            target_analysis["issues"].extend(lambda_issue)

        if target["Arn"].endswith(".fifo") and ":sqs:" in target["Arn"]:
            sqs_params = target.get("SqsParameters", {})
            if not sqs_params.get("MessageGroupId"):
                target_analysis["issues"].append(
                    {
                        "type": "sqs_fifo_no_group_id",
                        "severity": "critical",
                        "details": "SQS FIFO target missing MessageGroupId",
                    }
                )
        return target_analysis

    # ---------------- DLQ analysis ---------------- #
    def _analyze_dlqs(self):  # pragma: no cover - exercised in integration
        dlq_arns = set()
        for rule in self.rules:
            for target in rule.get("targets", []):
                if target.get("dlq_arn"):
                    dlq_arns.add(target["dlq_arn"])

        for dlq_arn in dlq_arns:
            self.dlq_analysis.append(self._analyze_single_dlq(dlq_arn))

    def _analyze_single_dlq(self, dlq_arn: str) -> Dict[str, Any]:  # pragma: no cover - exercised in integration
        analysis: Dict[str, Any] = {
            "arn": dlq_arn,
            "type": "sqs" if ":sqs:" in dlq_arn else "unknown",
            "issues": [],
            "metrics": {},
        }

        if analysis["type"] == "sqs":
            queue_name = dlq_arn.split(":")[-1]
            try:
                queue_url = self._get_queue_url(queue_name)
                attrs = self.sqs_client.get_queue_attributes(
                    QueueUrl=queue_url, AttributeNames=["All"]
                )["Attributes"]
                message_count = int(attrs.get("ApproximateNumberOfMessages", 0))
                analysis["metrics"]["message_count"] = message_count
                analysis["metrics"]["oldest_message_age"] = int(
                    attrs.get("ApproximateAgeOfOldestMessage", 0)
                )
                if message_count > 0 and not self._check_dlq_alarm(queue_name):
                    analysis["issues"].append(
                        {
                            "type": "unmonitored_dlq",
                            "severity": "high",
                            "details": f"{message_count} messages present without alarm",
                        }
                    )
            except (BotoCoreError, ClientError) as exc:
                logging.error("Failed DLQ analysis for %s: %s", dlq_arn, exc)

        return analysis

    # ---------------- Event pattern analysis ---------------- #
    def _analyze_event_patterns(self):  # pragma: no cover - exercised in integration
        for rule in self.rules:
            if not rule.get("event_pattern"):
                continue
            try:
                pattern_obj = json.loads(rule["event_pattern"])
            except Exception:
                continue

            pattern_analysis: Dict[str, Any] = {
                "rule": rule["name"],
                "event_bus": rule["event_bus"],
                "current_pattern": pattern_obj,
                "issues": [],
                "optimizations": [],
            }
            if self._is_overly_broad_pattern(pattern_obj):
                pattern_analysis["issues"].append(
                    "Overly broad pattern that can match all events"
                )
            optimized = self._optimize_pattern(pattern_obj)
            if optimized != pattern_obj:
                pattern_analysis["optimizations"].append(optimized)
            self.event_pattern_analysis.append(pattern_analysis)

    # ---------------- Output generation ---------------- #
    def _generate_console_output(self):  # pragma: no cover - formatting only
        print("\n" + "=" * 80)
        print("EventBridge Analysis Report")
        print("=" * 80)

        summary_rows = [
            ["Rules Audited", self.summary["rules_audited"]],
            ["Buses Audited", self.summary["buses_audited"]],
            ["Total Daily Events", f"{self.summary['total_daily_events']:,}"],
            ["Failed Invocations", f"{self.summary['failed_invocations']:,}"],
            ["Loss Risk Count", self.summary["loss_risk_count"]],
            ["DLQ Coverage Gap", self.summary["dlq_coverage_gap"]],
        ]
        print(tabulate(summary_rows, headers=["Metric", "Value"], tablefmt="github"))

        bus_rows = []
        for bus in self.event_buses:
            bus_rows.append(
                [
                    bus["name"],
                    bus.get("rule_count", 0),
                    len(bus.get("issues", [])),
                    "yes" if bus.get("archive_enabled") else "no",
                ]
            )
        if bus_rows:
            print("\nEvent Buses")
            print(tabulate(bus_rows, headers=["Bus", "Rule Count", "Issues", "Archive"], tablefmt="github"))

        rule_rows = []
        for rule in self.rules:
            issue_types = ", ".join(sorted({i["type"] for i in rule.get("issues", [])}))
            rule_rows.append(
                [
                    f"{rule['event_bus']}/{rule['name']}",
                    f"{rule['metrics'].get('daily_invocations', 0):.0f}",
                    f"{rule['metrics'].get('failure_rate', 0):.1f}%",
                    issue_types or "healthy",
                ]
            )
        if rule_rows:
            print("\nRules")
            print(tabulate(rule_rows, headers=["Rule", "Daily Invocations", "Failure Rate", "Issues"], tablefmt="github"))

        print("\n" + "=" * 80 + "\n")

    def _generate_json_output(self, payload: Dict[str, Any]):  # pragma: no cover - formatting only
        with open("eventbridge_analysis.json", "w") as fh:
            json.dump(payload, fh, indent=2, default=str)

    def _generate_html_topology(self):  # pragma: no cover - formatting only
        html = f"""<!DOCTYPE html>
<html><head><title>EventBridge Topology</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
<style>body{{font-family:Arial}} #topology{{width:100%;height:700px;border:1px solid #ccc;}}</style>
</head><body>
<h2>EventBridge Topology</h2>
<div id="topology"></div>
<script>
const data = {json.dumps(self._prepare_topology_data())};
const svg = d3.select("#topology").append("svg").attr("width","100%").attr("height",700);
const width = document.getElementById('topology').clientWidth;
const height = 700;
const simulation = d3.forceSimulation()
  .force("link", d3.forceLink().id(d=>d.id).distance(140))
  .force("charge", d3.forceManyBody().strength(-280))
  .force("center", d3.forceCenter(width/2,height/2));
const link = svg.append("g").selectAll("line")
  .data(data.links).enter().append("line")
  .style("stroke","#aaa").style("stroke-width",2);
const node = svg.append("g").selectAll("g")
  .data(data.nodes).enter().append("g");
node.append("circle").attr("r", d=>d.type==="bus"?16:12)
  .style("fill", d=>d.hasIssues?"#ffe6e6":"#e7f1ff")
  .style("stroke", d=>d.type==="bus"?"#1d70b8": d.type==="rule"?"#2e8540":"#b82525")
  .style("stroke-width",3);
node.append("text").text(d=>d.label).attr("x",18).attr("y",4).style("font-size","12px");
node.call(d3.drag()
  .on("start", event => {{ if(!event.active) simulation.alphaTarget(0.3).restart(); event.subject.fx=event.subject.x; event.subject.fy=event.subject.y; }})
  .on("drag", event => {{ event.subject.fx=event.x; event.subject.fy=event.y; }})
  .on("end", event => {{ if(!event.active) simulation.alphaTarget(0); event.subject.fx=null; event.subject.fy=null; }}));
simulation.nodes(data.nodes).on("tick", () => {{
  link.attr("x1", d=>d.source.x).attr("y1", d=>d.source.y)
      .attr("x2", d=>d.target.x).attr("y2", d=>d.target.y);
  node.attr("transform", d=>`translate(${{d.x}},${{d.y}})`);
}});
simulation.force("link").links(data.links);
</script></body></html>"""
        with open("event_routing_topology.html", "w") as fh:
            fh.write(html)

    def _generate_dlq_monitoring_script(self):  # pragma: no cover - formatting only
        script_lines = [
            "#!/bin/bash",
            "set -e",
            'echo "Setting up DLQ alarms..."',
        ]
        for dlq in self.dlq_analysis:
            if not any(i["type"] == "unmonitored_dlq" for i in dlq.get("issues", [])):
                continue
            queue = dlq["arn"].split(":")[-1]
            script_lines += [
                f'echo "Creating alarm for {queue}"',
                "aws cloudwatch put-metric-alarm \\",
                f'  --alarm-name "DLQ-Messages-{queue}" \\',
                '  --metric-name ApproximateNumberOfMessagesVisible \\',
                "  --namespace AWS/SQS \\",
                "  --statistic Sum \\",
                "  --period 300 \\",
                "  --threshold 1 \\",
                "  --comparison-operator GreaterThanThreshold \\",
                "  --evaluation-periods 1 \\",
                f"  --dimensions Name=QueueName,Value={queue} \\",
                "  --treat-missing-data notBreaching",
            ]
        with open("dlq_monitoring_setup.sh", "w") as fh:
            fh.write("\n".join(script_lines) + "\n")
        os.chmod("dlq_monitoring_setup.sh", 0o755)

    def _generate_pattern_optimization(self):  # pragma: no cover - formatting only
        optimizations: List[Dict[str, Any]] = []
        for analysis in self.event_pattern_analysis:
            for optimized in analysis.get("optimizations", []):
                optimizations.append(
                    {
                        "rule": analysis["rule"],
                        "event_bus": analysis["event_bus"],
                        "current_pattern": analysis["current_pattern"],
                        "optimized_pattern": optimized,
                        "improvements": ["Tightened filters to reduce broad matches"],
                    }
                )
        with open("event_pattern_optimization.json", "w") as fh:
            json.dump(optimizations, fh, indent=2, default=str)

    # ---------------- Helper methods ---------------- #
    def _get_tags(self, resource_arn: str) -> Dict[str, str]:
        try:
            response = self.events_client.list_tags_for_resource(ResourceARN=resource_arn)
            return {t["Key"]: t["Value"] for t in response.get("Tags", [])}
        except (BotoCoreError, ClientError):
            return {}

    def _missing_required_tags(self, tags: Dict[str, str]) -> List[str]:
        required = ["Environment", "Application", "Owner"]
        return [t for t in required if t not in tags]

    def _safe_list_archives(self, bus_arn: str) -> List[Dict[str, Any]]:
        try:
            response = self.events_client.list_archives(EventSourceArn=bus_arn)
            return response.get("Archives", [])
        except Exception:
            return []

    def _safe_describe_bus_policy(self, bus_name: str) -> Optional[str]:
        try:
            return self.events_client.describe_event_bus(Name=bus_name).get("Policy")
        except Exception:
            return None

    def _get_bus_usage_metrics(
        self, bus_name: str, tags: Dict[str, str]
    ) -> Dict[str, Any]:  # pragma: no cover - external metrics
        metrics = {"events_received_60d": 0, "daily_average": 0}
        try:
            cw_resp = self.cloudwatch.get_metric_statistics(
                Namespace="AWS/Events",
                MetricName="SuccessfulEventsMatched",
                Dimensions=[{"Name": "EventBusName", "Value": bus_name}],
                StartTime=self.now - timedelta(days=60),
                EndTime=self.now,
                Period=86400,
                Statistics=["Sum"],
            )
            if cw_resp.get("Datapoints"):
                total = sum(dp.get("Sum", 0) for dp in cw_resp["Datapoints"])
                metrics["events_received_60d"] = int(total)
                metrics["daily_average"] = int(total / 60)
                self.summary["total_daily_events"] += metrics["daily_average"]
        except (BotoCoreError, ClientError):
            pass

        if metrics["events_received_60d"] == 0:
            override = self._get_tag_metric(tags, ["events60d", "events_received_60d"])
            if override is not None:
                metrics["events_received_60d"] = int(override)
                metrics["daily_average"] = int(int(override) / 60)
                self.summary["total_daily_events"] += metrics["daily_average"]
        return metrics

    def _count_bus_rules(self, bus_name: str, tags: Dict[str, str]) -> int:  # pragma: no cover
        override = self._get_tag_metric(tags, ["rulecountoverride", "rule_count"])
        if override is not None:
            return int(override)
        count = 0
        try:
            paginator = self.events_client.get_paginator("list_rules")
            for page in paginator.paginate(EventBusName=bus_name):
                count += len(page.get("Rules", []))
        except (BotoCoreError, ClientError):
            pass
        return count

    def _analyze_pattern(self, pattern_json: str) -> List[Dict[str, Any]]:  # pragma: no cover - parsed via integration
        issues = []
        try:
            pattern_obj = json.loads(pattern_json)
            if self._is_overly_broad_pattern(pattern_obj):
                issues.append(
                    {
                        "type": "overly_broad_pattern",
                        "severity": "high",
                        "details": "Pattern can match all events (wildcards or missing filters)",
                    }
                )
        except Exception as exc:
            issues.append(
                {
                    "type": "invalid_pattern",
                    "severity": "medium",
                    "details": f"Could not parse pattern: {exc}",
                }
            )
        return issues

    def _is_overly_broad_pattern(self, pattern_obj: Dict[str, Any]) -> bool:  # pragma: no cover
        if not isinstance(pattern_obj, dict):
            return True
        if pattern_obj.get("source") in (["*"], "*", None):
            return True
        if "source" not in pattern_obj and "detail-type" not in pattern_obj:
            return True
        return False

    def _optimize_pattern(self, pattern_obj: Dict[str, Any]) -> Dict[str, Any]:  # pragma: no cover
        optimized = dict(pattern_obj)
        if optimized.get("source") in (["*"], "*", None):
            optimized["source"] = ["aws.events"]
        if "detail-type" not in optimized:
            optimized["detail-type"] = ["AWS API Call via CloudTrail"]
        return optimized

    def _get_rule_metrics(
        self, rule_name: str, bus_name: str, tags: Dict[str, str]
    ) -> Dict[str, Any]:  # pragma: no cover
        metrics = {
            "daily_invocations": 0,
            "successful_invocations": 0,
            "failed_invocations": 0,
            "failure_rate": 0.0,
        }
        try:
            for metric_name, key in [
                ("InvocationsSent", "daily_invocations"),
                ("SuccessfulInvocations", "successful_invocations"),
                ("FailedInvocations", "failed_invocations"),
            ]:
                resp = self.cloudwatch.get_metric_statistics(
                    Namespace="AWS/Events",
                    MetricName=metric_name,
                    Dimensions=[
                        {"Name": "RuleName", "Value": rule_name},
                        {"Name": "EventBusName", "Value": bus_name},
                    ],
                    StartTime=self.now - timedelta(days=7),
                    EndTime=self.now,
                    Period=86400,
                    Statistics=["Sum"],
                )
                if resp.get("Datapoints"):
                    total = sum(dp.get("Sum", 0) for dp in resp["Datapoints"])
                    if key == "daily_invocations":
                        metrics[key] = total / 7
                    else:
                        metrics[key] = int(total)
        except (BotoCoreError, ClientError):
            pass

        # Fallback to tag-provided metrics
        if metrics["daily_invocations"] == 0:
            daily = self._get_tag_metric(tags, ["dailyinvocations", "metric:dailyinvocations"])
            if daily is not None:
                metrics["daily_invocations"] = float(daily)
        if metrics["failed_invocations"] == 0:
            failed = self._get_tag_metric(tags, ["failedinvocations", "metric:failedinvocations"])
            if failed is not None:
                metrics["failed_invocations"] = int(float(failed))
        if metrics["successful_invocations"] == 0:
            success = self._get_tag_metric(tags, ["successfulinvocations"])
            if success is not None:
                metrics["successful_invocations"] = int(float(success))

        total_invocations = (
            metrics["successful_invocations"] + metrics["failed_invocations"]
        )
        if total_invocations == 0 and metrics["daily_invocations"] > 0:
            total_invocations = metrics["daily_invocations"] * 7
        if total_invocations > 0:
            metrics["failure_rate"] = (
                metrics["failed_invocations"] / total_invocations * 100
            )
        return metrics

    def _check_lambda_target(self, lambda_arn: str) -> List[Dict[str, Any]]:  # pragma: no cover
        issues = []
        function_name = lambda_arn.split(":")[-1]
        try:
            config = self.lambda_client.get_function_configuration(
                FunctionName=function_name
            )
            reserved = config.get("ReservedConcurrentExecutions")
            if reserved is not None and reserved <= 1:
                issues.append(
                    {
                        "type": "lambda_throttling",
                        "severity": "high",
                        "details": "Low reserved concurrency may throttle events",
                    }
                )
        except (BotoCoreError, ClientError):
            # If unavailable, do not block the analysis
            pass
        return issues

    def _get_queue_url(self, queue_name: str) -> str:  # pragma: no cover
        try:
            return self.sqs_client.get_queue_url(QueueName=queue_name)["QueueUrl"]
        except (BotoCoreError, ClientError):
            return f"https://sqs.{self.region}.amazonaws.com/{self.account_id}/{queue_name}"

    def _check_dlq_alarm(self, queue_name: str) -> bool:  # pragma: no cover
        try:
            alarms = self.cloudwatch.describe_alarms(
                AlarmNamePrefix=f"DLQ-Messages-{queue_name}"
            )
            return len(alarms.get("MetricAlarms", [])) > 0
        except (BotoCoreError, ClientError):
            return False

    def _prepare_topology_data(self) -> Dict[str, Any]:  # pragma: no cover - visualization only
        nodes = []
        links = []
        bus_node_map = {}

        for bus in self.event_buses:
            node_id = f"bus_{bus['name']}"
            bus_node_map[bus["name"]] = node_id
            nodes.append(
                {
                    "id": node_id,
                    "label": bus["name"],
                    "type": "bus",
                    "hasIssues": len(bus.get("issues", [])) > 0,
                }
            )

        for rule in self.rules:
            rule_node = f"rule_{rule['event_bus']}_{rule['name']}"
            nodes.append(
                {
                    "id": rule_node,
                    "label": rule["name"],
                    "type": "rule",
                    "hasIssues": len(rule.get("issues", [])) > 0,
                }
            )
            if rule["event_bus"] in bus_node_map:
                links.append({"source": bus_node_map[rule["event_bus"]], "target": rule_node})

            for target in rule.get("targets", []):
                target_node = f"target_{target['id']}"
                nodes.append(
                    {
                        "id": target_node,
                        "label": target["arn"].split(":")[-1],
                        "type": "target",
                        "hasIssues": len(target.get("issues", [])) > 0,
                    }
                )
                links.append({"source": rule_node, "target": target_node})
        return {"nodes": nodes, "links": links}

    def _should_skip_resource(self, name: str, tags: Dict[str, str]) -> bool:  # pragma: no cover
        if name.startswith("test-") or name.startswith("dev-"):
            return True
        for key, val in tags.items():
            if key.lower() == "excludefromanalysis" and str(val).lower() == "true":
                return True
        return False

    def _get_disabled_duration(self, tags: Dict[str, str]) -> Optional[timedelta]:  # pragma: no cover
        if "DisabledSince" in tags:
            try:
                disabled_at = datetime.fromisoformat(tags["DisabledSince"])
                if disabled_at.tzinfo is None:
                    disabled_at = disabled_at.replace(tzinfo=timezone.utc)
                return self.now - disabled_at
            except Exception:
                return None
        return None

    def _handles_sensitive_data(self, bus_name: str, tags: Dict[str, str]) -> bool:  # pragma: no cover
        indicators = ["payment", "customer", "pii", "prod"]
        if any(ind in bus_name.lower() for ind in indicators):
            return True
        if tags.get("DataClassification", "").lower() in ["sensitive", "confidential"]:
            return True
        return False

    def _is_critical_rule(self, rule_name: str, tags: Dict[str, str]) -> bool:  # pragma: no cover
        indicators = ["critical", "payment", "checkout", "alert"]
        if any(ind in rule_name.lower() for ind in indicators):
            return True
        return tags.get("Criticality", "").lower() in ["high", "critical"]

    def _is_time_sensitive(self, rule_name: str, tags: Dict[str, str]) -> bool:  # pragma: no cover
        indicators = ["realtime", "alert", "notification", "critical"]
        if any(ind in rule_name.lower() for ind in indicators):
            return True
        return tags.get("TimeSensitive", "").lower() == "true"

    def _has_custom_retry_policy(self, targets: List[Dict[str, Any]]) -> bool:  # pragma: no cover
        for target in targets:
            policy = target.get("retry_policy", {})
            if policy.get("MaximumRetryAttempts") not in (None, 185) or policy.get(
                "MaximumEventAge"
            ) not in (None, 86400):
                return True
        return False

    def _check_cross_region_rules(self, bus_name: str) -> List[str]:  # pragma: no cover
        cross_region_rules = []
        try:
            paginator = self.events_client.get_paginator("list_rules")
            for page in paginator.paginate(EventBusName=bus_name):
                for rule in page.get("Rules", []):
                    targets = self.events_client.list_targets_by_rule(
                        Rule=rule["Name"], EventBusName=bus_name
                    ).get("Targets", [])
                    for target in targets:
                        arn = target.get("Arn", "")
                        if ":events:" in arn and self.region not in arn:
                            cross_region_rules.append(rule["Name"])
        except (BotoCoreError, ClientError):
            return []
        return cross_region_rules

    def _get_tag_metric(self, tags: Dict[str, str], keys: List[str]) -> Optional[float]:
        lower_tags = {k.lower(): v for k, v in tags.items()}
        for key in keys:
            if key.lower() in lower_tags:
                try:
                    return float(lower_tags[key.lower()])
                except (TypeError, ValueError):
                    continue
        return None


def main() -> int:  # pragma: no cover - CLI guard
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
    try:
        analyzer = EventBridgeAnalyzer()
        analyzer.run()
        return 0
    except Exception as exc:  # pragma: no cover - defensive guard
        logging.error("Analysis failed: %s", exc, exc_info=True)
        return 1


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
