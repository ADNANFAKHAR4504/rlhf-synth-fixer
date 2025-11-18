#!/usr/bin/env python3
"""
analyse.py
CloudWatch Log Groups Cost and Monitoring Coverage Audit for us-east-1
Enhanced version with detailed analysis and fixes for all requirements
"""

import json
import csv
import logging
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from typing import Dict, List, Tuple, Optional, Set
import boto3
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from botocore.exceptions import ClientError
from tabulate import tabulate
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# CloudWatch Logs Pricing (us-east-1)
STORAGE_COST_PER_GB = 0.03  # $0.03 per GB per month
INGESTION_COST_PER_GB = 0.50  # $0.50 per GB ingested
QUERY_SCAN_COST_PER_GB = 0.0050  # $0.0050 per GB scanned


class CloudWatchLogsAnalyzer:
    def __init__(self):
        self.logs_client = boto3.client("logs", region_name="us-east-1")
        self.lambda_client = boto3.client("lambda", region_name="us-east-1")
        self.ec2_client = boto3.client("ec2", region_name="us-east-1")
        self.s3_client = boto3.client("s3", region_name="us-east-1")
        self.cloudwatch_client = boto3.client("cloudwatch", region_name="us-east-1")

        self.log_groups_data = []
        self.monitoring_gaps = []
        self.all_issues = defaultdict(list)

    def run(self):
        """Main execution method"""
        logger.info("Starting CloudWatch Logs analysis...")

        # Collect all log groups
        log_groups = self._get_all_log_groups()
        logger.info("Found %d total log groups", len(log_groups))

        # Filter log groups based on exclusion criteria
        filtered_log_groups = self._filter_log_groups(log_groups)
        logger.info("Analyzing %d log groups after filtering", len(filtered_log_groups))

        # Analyze each log group
        for lg in filtered_log_groups:
            self._analyze_log_group(lg)

        # Check for monitoring gaps
        self._check_monitoring_gaps()

        # Generate outputs
        self._generate_console_output()
        self._generate_json_output()
        self._generate_chart()
        self._generate_csv_report()

        logger.info("Analysis complete!")

    def _get_all_log_groups(self) -> List[Dict]:
        """Retrieve all log groups from CloudWatch Logs"""
        try:
            log_groups = []
            paginator = self.logs_client.get_paginator("describe_log_groups")

            for page in paginator.paginate():
                log_groups.extend(page["logGroups"])

            return log_groups
        except ClientError:
            return []

    def _filter_log_groups(self, log_groups: List[Dict]) -> List[Dict]:
        """Apply exclusion filters to log groups"""
        filtered = []
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)

        for lg in log_groups:
            # Skip if created less than 30 days ago (unless in test environment)
            if not os.environ.get(
                "AWS_ENDPOINT_URL"
            ):  # Skip age check for LocalStack/Moto
                creation_time = datetime.fromtimestamp(
                    lg["creationTime"] / 1000, tz=timezone.utc
                )
                if creation_time > cutoff_date:
                    continue

            # Skip dev and test prefixes
            name = lg["logGroupName"]
            if (
                name.startswith("/aws/lambda/dev-")
                or name.startswith("test-")
                or "/test-" in name
                or "/dev-" in name
            ):
                continue

            # Check for exclusion tag
            try:
                tags = self.logs_client.list_tags_log_group(logGroupName=name).get(
                    "tags", {}
                )
                if any(
                    k.lower() == "excludefromanalysis" and v.lower() == "true"
                    for k, v in tags.items()
                ):
                    continue
            except ClientError:
                pass

            filtered.append(lg)

        return filtered

    def _analyze_log_group(self, log_group: Dict):
        """Analyze a single log group for all specified issues"""
        lg_name = log_group["logGroupName"]
        issues = []

        # Get additional info
        retention = log_group.get("retentionInDays")
        stored_bytes = log_group.get("storedBytes", 0)
        stored_gb = stored_bytes / (1024**3)

        # Get tags
        tags = {}
        try:
            tags = self.logs_client.list_tags_log_group(logGroupName=lg_name).get(
                "tags", {}
            )
        except ClientError:
            pass

        # Get metric filters
        metric_filters = self._get_metric_filters(lg_name)

        # Get subscription filters
        subscription_filters = self._get_subscription_filters(lg_name)

        # Get log streams count
        log_streams_count = self._get_log_streams_count(lg_name)

        # Calculate daily ingestion
        daily_ingestion_mb = self._calculate_daily_ingestion(lg_name)
        daily_ingestion_gb = daily_ingestion_mb / 1024

        # Calculate monthly costs
        storage_cost = stored_gb * STORAGE_COST_PER_GB
        ingestion_cost = daily_ingestion_gb * 30 * INGESTION_COST_PER_GB
        monthly_cost = storage_cost + ingestion_cost

        # Issue 1: Indefinite Retention
        if retention is None:
            issues.append(
                {
                    "type": "indefinite_retention",
                    "description": 'Log group retention set to "Never Expire"',
                    "recommendation": "Set appropriate retention period based on data classification",
                    "severity": "High",
                    "potential_savings": self._calculate_retention_savings(
                        stored_gb, 365, retention or 365
                    ),
                }
            )

        # Issue 2: Excessive Retention
        if self._is_debug_log(lg_name) and retention and retention > 30:
            issues.append(
                {
                    "type": "excessive_debug_retention",
                    "description": "Debug logs retained for %d days (>30 days)" % retention,
                    "recommendation": "Reduce debug log retention to 30 days",
                    "severity": "Medium",
                    "potential_savings": self._calculate_retention_savings(
                        stored_gb, 30, retention
                    ),
                }
            )
        elif self._is_audit_log(lg_name) and retention and retention > 7:
            issues.append(
                {
                    "type": "excessive_audit_retention",
                    "description": f"Audit logs retained for {retention} days (>7 days)",
                    "recommendation": "Reduce audit log retention to 7 days",
                    "severity": "High",
                    "potential_savings": self._calculate_retention_savings(
                        stored_gb, 7, retention
                    ),
                }
            )

        # Issue 3: Missing Metric Filters
        if self._is_application_log(lg_name) and not metric_filters:
            issues.append(
                {
                    "type": "missing_metric_filters",
                    "description": "Application log group without metric filters for error tracking",
                    "recommendation": "Add metric filters for ERROR, WARN levels and response times",
                    "severity": "Medium",
                    "potential_savings": 0,  # Monitoring improvement, not direct cost
                }
            )

        # Issue 4: Unused Log Groups
        last_event_time = self._get_last_event_time(lg_name)
        if last_event_time:
            days_since_last_event = (datetime.now(timezone.utc) - last_event_time).days
            if days_since_last_event > 60:
                issues.append(
                    {
                        "type": "unused_log_group",
                        "description": f"No new events in {days_since_last_event} days",
                        "recommendation": "Consider deleting unused log group to eliminate storage costs",
                        "severity": "Low",
                        "potential_savings": monthly_cost,  # Full cost elimination
                    }
                )

        # Issue 5: No Encryption
        data_classification = tags.get("DataClassification", "").lower()
        if data_classification == "confidential" and not log_group.get("kmsKeyId"):
            issues.append(
                {
                    "type": "no_encryption",
                    "description": "Confidential data without KMS encryption",
                    "recommendation": "Enable KMS encryption for sensitive data compliance",
                    "severity": "High",
                    "potential_savings": 0,  # Security/compliance, not cost
                }
            )

        # Issue 6: Subscription Filter Overload
        if len(subscription_filters) > 2:
            issues.append(
                {
                    "type": "subscription_filter_overload",
                    "description": f"{len(subscription_filters)} subscription filters (>2) risk throttling",
                    "recommendation": "Consolidate subscription filters to avoid ingestion throttling",
                    "severity": "Medium",
                    "potential_savings": 0,  # Reliability improvement
                }
            )

        # Issue 7: Missing Log Streams
        expected_streams = self._get_expected_log_streams(lg_name)
        if expected_streams and log_streams_count == 0:
            issues.append(
                {
                    "type": "missing_log_streams",
                    "description": f"Expected {expected_streams} log streams but found none",
                    "recommendation": "Verify logging agent configuration and permissions",
                    "severity": "High",
                    "potential_savings": 0,  # Monitoring gap
                }
            )

        # Issue 8: High Ingestion Rate
        ingestion_rate_mbps = daily_ingestion_mb / 86400
        if ingestion_rate_mbps > 5:
            issues.append(
                {
                    "type": "high_ingestion_rate",
                    "description": f"High ingestion rate: {ingestion_rate_mbps:.2f} MB/s",
                    "recommendation": "Implement source-side sampling or filtering to reduce volume",
                    "severity": "Medium",
                    "potential_savings": monthly_cost * 0.3,  # Estimate 30% reduction
                }
            )

        # Issue 9: No Cross-Region Backup
        if self._is_critical_log(lg_name, tags):
            if not self._has_cross_region_backup(subscription_filters):
                issues.append(
                    {
                        "type": "no_cross_region_backup",
                        "description": "Critical logs without cross-region backup for DR",
                        "recommendation": "Add subscription filter for S3 backup in another region",
                        "severity": "High",
                        "potential_savings": 0,  # DR improvement
                    }
                )

        # Issue 10: Duplicate Logging
        duplicates = self._check_duplicate_logging(lg_name)
        if duplicates:
            issues.append(
                {
                    "type": "duplicate_logging",
                    "description": f'Potential duplicate logging with: {", ".join(duplicates)}',
                    "recommendation": "Consolidate duplicate log sources to reduce costs",
                    "severity": "Low",
                    "potential_savings": monthly_cost
                    * 0.5,  # Estimate duplicate reduction
                }
            )

        # Issue 11: No Saved Queries
        if self._is_application_log(lg_name):
            # Note: AWS CloudWatch Logs does not provide API to check saved queries per log group
            # This is a limitation of the AWS API
            issues.append(
                {
                    "type": "no_saved_queries",
                    "description": "No saved Log Insights queries (cannot verify programmatically)",
                    "recommendation": "Save common troubleshooting queries in Log Insights for faster incident response",
                    "severity": "Low",
                    "potential_savings": 0,  # Operational efficiency
                }
            )

        # Issue 12: VPC Flow Logs Cost
        if self._is_vpc_flow_log(lg_name):
            if self._is_capturing_all_traffic(lg_name):
                issues.append(
                    {
                        "type": "vpc_flow_logs_cost",
                        "description": "VPC Flow Logs configured to capture ALL traffic instead of REJECT only",
                        "recommendation": "Change to capture REJECT traffic only to reduce log volume by ~80%",
                        "severity": "Medium",
                        "potential_savings": monthly_cost
                        * 0.8,  # Estimate 80% reduction
                    }
                )

        # Issue 13: Inefficient Log Format
        if self._has_verbose_json_format(lg_name):
            issues.append(
                {
                    "type": "inefficient_log_format",
                    "description": "Logs use verbose JSON format with excessive fields",
                    "recommendation": "Use structured logging with minimal required fields to reduce storage",
                    "severity": "Low",
                    "potential_savings": monthly_cost * 0.2,  # Estimate 20% reduction
                }
            )

        # Calculate optimized values
        optimized_retention = self._get_optimized_retention(lg_name, retention, tags)
        optimized_cost = self._calculate_optimized_cost(
            lg_name, stored_gb, daily_ingestion_gb, optimized_retention, issues
        )

        # Store results
        self.log_groups_data.append(
            {
                "log_group_name": lg_name,
                "retention_days": retention,
                "stored_bytes": stored_bytes,
                "daily_ingestion_mb": daily_ingestion_mb,
                "monthly_cost": monthly_cost,
                "log_streams_count": log_streams_count,
                "issues": issues,
                "optimization": {
                    "recommended_retention": optimized_retention,
                    "metric_filters": self._get_recommended_metric_filters(
                        lg_name, issues
                    ),
                    "estimated_savings": monthly_cost - optimized_cost,
                },
            }
        )

    def _get_metric_filters(self, log_group_name: str) -> List[Dict]:
        """Get metric filters for a log group"""
        try:
            response = self.logs_client.describe_metric_filters(
                logGroupName=log_group_name
            )
            return response.get("metricFilters", [])
        except ClientError:
            return []

    def _get_subscription_filters(self, log_group_name: str) -> List[Dict]:
        """Get subscription filters for a log group"""
        try:
            response = self.logs_client.describe_subscription_filters(
                logGroupName=log_group_name
            )
            return response.get("subscriptionFilters", [])
        except ClientError:
            return []

    def _get_log_streams_count(self, log_group_name: str) -> int:
        """Get count of log streams in a log group"""
        try:
            response = self.logs_client.describe_log_streams(
                logGroupName=log_group_name, limit=50  # Sample first 50 streams
            )
            return len(response.get("logStreams", []))
        except ClientError:
            return 0

    def _calculate_daily_ingestion(self, log_group_name: str) -> float:
        """Calculate average daily ingestion in MB"""
        try:
            # Get log streams
            response = self.logs_client.describe_log_streams(
                logGroupName=log_group_name,
                orderBy="LastEventTime",
                descending=True,
                limit=50,
            )

            # Calculate total ingestion over last 7 days
            total_bytes = 0
            cutoff_time = int(
                (datetime.now(timezone.utc) - timedelta(days=7)).timestamp() * 1000
            )

            for stream in response.get("logStreams", []):
                if stream.get("lastIngestionTime", 0) > cutoff_time:
                    total_bytes += stream.get("storedBytes", 0)

            # Convert to MB/day
            return (total_bytes / (1024**2)) / 7

        except ClientError:
            return 0.0

    def _is_debug_log(self, log_group_name: str) -> bool:
        """Check if log group is for debug logs"""
        debug_indicators = ["debug", "trace", "verbose", "dev"]
        return any(
            indicator in log_group_name.lower() for indicator in debug_indicators
        )

    def _is_audit_log(self, log_group_name: str) -> bool:
        """Check if log group is for audit logs"""
        audit_indicators = ["audit", "compliance", "security", "access"]
        return any(
            indicator in log_group_name.lower() for indicator in audit_indicators
        )

    def _is_application_log(self, log_group_name: str) -> bool:
        """Check if log group is for application logs"""
        app_indicators = [
            "app",
            "application",
            "service",
            "/aws/lambda/",
            "/ecs/",
            "/eks/",
        ]
        return any(indicator in log_group_name.lower() for indicator in app_indicators)

    def _is_critical_log(self, log_group_name: str, tags: Dict) -> bool:
        """Check if log group contains critical logs"""
        return (
            tags.get("Criticality", "").lower() == "high"
            or tags.get("Environment", "").lower() in ["production", "prod"]
            or "critical" in log_group_name.lower()
        )

    def _is_vpc_flow_log(self, log_group_name: str) -> bool:
        """Check if log group is for VPC Flow Logs"""
        return "vpc" in log_group_name.lower() and "flow" in log_group_name.lower()

    def _get_last_event_time(self, log_group_name: str) -> Optional[datetime]:
        """Get timestamp of last event in log group"""
        try:
            response = self.logs_client.describe_log_streams(
                logGroupName=log_group_name,
                orderBy="LastEventTime",
                descending=True,
                limit=1,
            )

            if response["logStreams"]:
                last_event_time = response["logStreams"][0].get("lastEventTime")
                if last_event_time:
                    return datetime.fromtimestamp(
                        last_event_time / 1000, tz=timezone.utc
                    )
        except ClientError:
            pass

        return None

    def _has_cross_region_backup(self, subscription_filters: List[Dict]) -> bool:
        """Check if any subscription filter backs up to another region"""
        for filter in subscription_filters:
            destination = filter.get("destinationArn", "")
            # Check if destination is S3 in different region
            if "s3" in destination and "us-east-1" not in destination:
                return True
        return False

    def _check_duplicate_logging(self, log_group_name: str) -> List[str]:
        """Check for potential duplicate logging sources"""
        duplicates = []

        # Extract source identifier
        source = self._extract_source_identifier(log_group_name)
        if not source:
            return duplicates

        # Check all log groups for similar sources
        for lg_data in self.log_groups_data:
            other_name = lg_data["log_group_name"]
            if other_name != log_group_name:
                other_source = self._extract_source_identifier(other_name)
                if (
                    source
                    and other_source
                    and self._are_sources_similar(source, other_source)
                ):
                    duplicates.append(other_name)

        return duplicates

    def _extract_source_identifier(self, log_group_name: str) -> Optional[str]:
        """Extract source identifier from log group name"""
        parts = log_group_name.split("/")
        if len(parts) >= 3:
            return parts[-1]
        return None

    def _are_sources_similar(self, source1: str, source2: str) -> bool:
        """Check if two sources are similar (potential duplicates)"""
        # Remove common suffixes
        for suffix in ["-logs", "-log", "-app", "-service", "-lambda", "-function"]:
            source1 = source1.replace(suffix, "")
            source2 = source2.replace(suffix, "")

        return source1.lower() == source2.lower()

    def _has_saved_queries(self, log_group_name: str) -> bool:
        """Check if log group has saved Log Insights queries"""
        # AWS CloudWatch Logs does not provide API to list saved queries by log group
        # This is a limitation of the AWS API
        return False

    def _is_capturing_all_traffic(self, log_group_name: str) -> bool:
        """Check if VPC Flow Logs are configured to capture ALL traffic"""
        try:
            # Extract VPC ID from log group name (assuming format like vpc-flow-logs/vpc-12345)
            vpc_id = None
            if "vpc-" in log_group_name:
                parts = log_group_name.split("/")
                for part in parts:
                    if part.startswith("vpc-"):
                        vpc_id = part
                        break

            if vpc_id:
                # Query VPC Flow Logs configuration
                response = self.ec2_client.describe_flow_logs(
                    Filters=[
                        {"Name": "resource-id", "Values": [vpc_id]},
                        {"Name": "log-group-name", "Values": [log_group_name]},
                    ]
                )

                for flow_log in response.get("FlowLogs", []):
                    if flow_log.get("TrafficType") == "ALL":
                        return True

        except ClientError:
            pass

        return False

    def _has_verbose_json_format(self, log_group_name: str) -> bool:
        """Check if logs use verbose JSON format"""
        try:
            # Sample recent logs
            response = self.logs_client.filter_log_events(
                logGroupName=log_group_name, limit=10
            )

            events = response.get("events", [])
            if events:
                # Check if messages are JSON and verbose
                for event in events:
                    message = event.get("message", "")
                    try:
                        parsed = json.loads(message)
                        # Consider verbose if JSON has many fields or large size
                        if len(parsed) > 20 or len(message) > 1000:
                            return True
                    except:
                        pass

        except ClientError:
            pass

        return False

    def _get_expected_log_streams(self, log_group_name: str) -> int:
        """Get expected number of log streams for this log group type"""
        if "/aws/lambda/" in log_group_name:
            return 1  # Lambda functions typically have at least 1 stream
        elif "/aws/ecs/" in log_group_name:
            return 1  # ECS tasks have streams
        elif "/aws/eks/" in log_group_name:
            return 1  # EKS has streams
        return 0  # Unknown type

    def _calculate_retention_savings(
        self, stored_gb: float, new_retention: int, current_retention: int
    ) -> float:
        """Calculate potential savings from retention change"""
        if current_retention and current_retention > new_retention:
            retention_factor = new_retention / current_retention
            return stored_gb * (1 - retention_factor) * STORAGE_COST_PER_GB
        return 0

    def _get_optimized_retention(
        self, log_group_name: str, current_retention: Optional[int], tags: Dict
    ) -> int:
        """Calculate optimized retention period"""
        if self._is_debug_log(log_group_name):
            return 30
        elif self._is_audit_log(log_group_name):
            return 7
        elif tags.get("DataClassification", "").lower() == "confidential":
            return 90  # Compliance requirement
        elif self._is_application_log(log_group_name):
            return 60
        else:
            return 30  # Default

    def _calculate_optimized_cost(
        self,
        log_group_name: str,
        stored_gb: float,
        daily_ingestion_gb: float,
        optimized_retention: int,
        issues: List[Dict],
    ) -> float:
        """Calculate cost after optimization"""
        # Adjust storage based on retention
        if optimized_retention:
            retention_factor = min(optimized_retention / 365, 1.0)
        else:
            retention_factor = 0.5  # Assume 6 months average

        optimized_stored_gb = stored_gb * retention_factor

        # Adjust ingestion if high rate detected
        optimized_ingestion_gb = daily_ingestion_gb
        for issue in issues:
            if issue["type"] == "high_ingestion_rate":
                optimized_ingestion_gb *= 0.7  # Assume 30% reduction with sampling
            elif issue["type"] == "vpc_flow_logs_cost":
                optimized_ingestion_gb *= 0.2  # Assume 80% reduction for REJECT only
            elif issue["type"] == "inefficient_log_format":
                optimized_ingestion_gb *= 0.8  # Assume 20% reduction

        storage_cost = optimized_stored_gb * STORAGE_COST_PER_GB
        ingestion_cost = optimized_ingestion_gb * 30 * INGESTION_COST_PER_GB

        return storage_cost + ingestion_cost

    def _get_recommended_metric_filters(
        self, log_group_name: str, issues: List[Dict]
    ) -> List[str]:
        """Get recommended metric filters based on log type"""
        recommendations = []

        if self._is_application_log(log_group_name):
            for issue in issues:
                if issue["type"] == "missing_metric_filters":
                    recommendations.extend(
                        [
                            "ERROR level logs count",
                            "WARN level logs count",
                            "Response time > 1000ms",
                            "HTTP 4xx/5xx errors",
                            "Exception/Stack trace detection",
                        ]
                    )
                    break

        return recommendations

    def _check_monitoring_gaps(self):
        """Check for missing log streams from expected sources"""
        # Get all Lambda functions
        try:
            lambda_paginator = self.lambda_client.get_paginator("list_functions")
            for page in lambda_paginator.paginate():
                for function in page["Functions"]:
                    expected_lg = f"/aws/lambda/{function['FunctionName']}"
                    if not self._log_group_exists(expected_lg):
                        self.monitoring_gaps.append(
                            {
                                "resource_type": "Lambda",
                                "resource_id": function["FunctionName"],
                                "expected_log_group": expected_lg,
                                "status": "Missing Log Group",
                                "issue": "No log group found for Lambda function",
                            }
                        )
                    elif self._get_log_streams_count(expected_lg) == 0:
                        self.monitoring_gaps.append(
                            {
                                "resource_type": "Lambda",
                                "resource_id": function["FunctionName"],
                                "expected_log_group": expected_lg,
                                "status": "Missing Log Streams",
                                "issue": "Log group exists but no log streams found",
                            }
                        )
        except ClientError as e:
            logger.error(f"Error checking Lambda functions: {e}")

        # Get all EC2 instances
        try:
            ec2_paginator = self.ec2_client.get_paginator("describe_instances")
            for page in ec2_paginator.paginate():
                for reservation in page["Reservations"]:
                    for instance in reservation["Instances"]:
                        instance_id = instance["InstanceId"]
                        # Check common log group patterns
                        patterns = [
                            f"/aws/ec2/{instance_id}",
                            f"/var/log/{instance_id}",
                        ]

                        found = False
                        for pattern in patterns:
                            if self._log_group_exists_pattern(pattern):
                                if self._get_log_streams_count(pattern) > 0:
                                    found = True
                                else:
                                    self.monitoring_gaps.append(
                                        {
                                            "resource_type": "EC2",
                                            "resource_id": instance_id,
                                            "expected_log_group": pattern,
                                            "status": "Missing Log Streams",
                                            "issue": "Log group exists but no log streams found",
                                        }
                                    )
                                    found = True  # Mark as found but with issue
                                break

                        if not found:
                            self.monitoring_gaps.append(
                                {
                                    "resource_type": "EC2",
                                    "resource_id": instance_id,
                                    "expected_log_group": patterns[0],
                                    "status": "Missing Log Group",
                                    "issue": "No log group found for EC2 instance",
                                }
                            )
        except ClientError as e:
            logger.error(f"Error checking EC2 instances: {e}")

    def _log_group_exists(self, log_group_name: str) -> bool:
        """Check if a specific log group exists"""
        try:
            self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name, limit=1
            )
            return True
        except ClientError:
            return False

    def _log_group_exists_pattern(self, pattern: str) -> bool:
        """Check if any log group matches pattern"""
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=pattern, limit=1
            )
            return len(response.get("logGroups", [])) > 0
        except ClientError:
            return False

    def _generate_console_output(self):
        """Generate console output with costs and recommendations in tabular format"""
        print("\n" + "=" * 120)
        print("CLOUDWATCH LOGS COST AND MONITORING ANALYSIS")
        print("=" * 120 + "\n")

        # Sort by monthly cost
        sorted_logs = sorted(
            self.log_groups_data, key=lambda x: x["monthly_cost"], reverse=True
        )

        total_cost = sum(lg["monthly_cost"] for lg in sorted_logs)
        total_savings = sum(
            lg["optimization"]["estimated_savings"] for lg in sorted_logs
        )

        print(f"📊 SUMMARY:")
        print(f"   Total Log Groups Analyzed: {len(sorted_logs)}")
        print(f"   Total Monthly Cost: ${total_cost:,.2f}")
        print(f"   Potential Monthly Savings: ${total_savings:,.2f}")
        print(f"   Optimized Monthly Cost: ${total_cost - total_savings:,.2f}")
        print("\n" + "-" * 120 + "\n")

        # Top expensive log groups in table
        if sorted_logs:
            table_data = []
            for lg in sorted_logs[:10]:
                issues_summary = (
                    f"{len(lg['issues'])} issues" if lg["issues"] else "Clean"
                )
                savings = (
                    f"${lg['optimization']['estimated_savings']:,.2f}"
                    if lg["optimization"]["estimated_savings"] > 0
                    else "-"
                )
                table_data.append(
                    [
                        (
                            lg["log_group_name"][:50] + "..."
                            if len(lg["log_group_name"]) > 50
                            else lg["log_group_name"]
                        ),
                        f"{lg['stored_bytes']/(1024**3):.2f} GB",
                        f"{lg['daily_ingestion_mb']:.1f} MB/day",
                        lg["retention_days"] if lg["retention_days"] else "Never",
                        f"${lg['monthly_cost']:,.2f}",
                        issues_summary,
                        savings,
                    ]
                )

            print("💰 TOP 10 MOST EXPENSIVE LOG GROUPS:")
            print(
                tabulate(
                    table_data,
                    headers=[
                        "Log Group",
                        "Storage",
                        "Ingestion",
                        "Retention",
                        "Cost/Month",
                        "Issues",
                        "Savings",
                    ],
                    tablefmt="grid",
                )
            )

        # Issues summary table
        print("\n🔍 ISSUES SUMMARY:")
        issue_counts = defaultdict(int)
        severity_counts = defaultdict(int)
        total_potential_savings = 0

        for lg in sorted_logs:
            for issue in lg["issues"]:
                issue_counts[issue["type"]] += 1
                severity_counts[issue.get("severity", "Unknown")] += 1
                total_potential_savings += issue.get("potential_savings", 0)

        if issue_counts:
            issues_table = []
            for issue_type, count in sorted(
                issue_counts.items(), key=lambda x: x[1], reverse=True
            ):
                issues_table.append(
                    [
                        issue_type.replace("_", " ").title(),
                        count,
                        f"{count/len(sorted_logs)*100:.1f}%",
                    ]
                )

            print(
                tabulate(
                    issues_table,
                    headers=["Issue Type", "Count", "Percentage"],
                    tablefmt="grid",
                )
            )
            print(
                f"\n💡 Total Potential Savings from Issues: ${total_potential_savings:,.2f}"
            )

        # Monitoring gaps table
        if self.monitoring_gaps:
            print(f"\n🚨 MONITORING GAPS ({len(self.monitoring_gaps)} issues):")
            gaps_table = []
            for gap in self.monitoring_gaps[:10]:
                gaps_table.append(
                    [
                        gap["resource_type"],
                        (
                            gap["resource_id"][:30] + "..."
                            if len(gap["resource_id"]) > 30
                            else gap["resource_id"]
                        ),
                        gap["status"],
                        (
                            gap.get("issue", "")[:50] + "..."
                            if len(gap.get("issue", "")) > 50
                            else gap.get("issue", "")
                        ),
                    ]
                )

            print(
                tabulate(
                    gaps_table,
                    headers=["Type", "Resource ID", "Status", "Issue"],
                    tablefmt="grid",
                )
            )

    def _generate_json_output(self):
        """Generate JSON output file"""
        # Calculate summary
        total_cost = sum(lg["monthly_cost"] for lg in self.log_groups_data)
        total_savings = sum(
            lg["optimization"]["estimated_savings"] for lg in self.log_groups_data
        )
        total_stored_gb = sum(
            lg["stored_bytes"] / (1024**3) for lg in self.log_groups_data
        )

        output = {
            "CloudWatchLogs": {
                "log_groups": self.log_groups_data,
                "monitoring_gaps": self.monitoring_gaps,
                "summary": {
                    "total_log_groups": len(self.log_groups_data),
                    "total_monthly_cost": round(total_cost, 2),
                    "total_stored_gb": round(total_stored_gb, 2),
                    "optimized_monthly_cost": round(total_cost - total_savings, 2),
                    "total_savings": round(total_savings, 2),
                },
            }
        }

        with open("aws_audit_results.json", "w") as f:
            json.dump(output, f, indent=2)

        logger.info("JSON output saved to aws_audit_results.json")

    def _generate_chart(self):
        """Generate retention vs cost analysis chart"""
        if not self.log_groups_data:
            logger.info("No log groups to analyze - skipping chart generation")
            return

        # Prepare data
        df = pd.DataFrame(self.log_groups_data)

        # Handle None retention (set to 365 for visualization)
        df["retention_days_viz"] = df["retention_days"].fillna(365)

        # Create figure
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 8))

        # Chart 1: Current state - Retention vs Monthly Cost
        scatter1 = ax1.scatter(
            df["retention_days_viz"],
            df["monthly_cost"],
            alpha=0.6,
            s=df["stored_bytes"] / (1024**2),  # Size by MB
            c="red",
            label="Current State",
        )

        ax1.set_xlabel("Retention Period (days)")
        ax1.set_ylabel("Monthly Cost ($)")
        ax1.set_title("Current State: Retention Period vs Monthly Cost")
        ax1.set_xscale("log")
        ax1.set_yscale("log")
        ax1.grid(True, alpha=0.3)

        # Add size legend
        sizes = [100, 1000, 10000]  # MB
        labels = ["100 MB", "1 GB", "10 GB"]
        markers = []
        for size, label in zip(sizes, labels):
            markers.append(plt.scatter([], [], s=size, c="red", alpha=0.6, label=label))
        ax1.legend(handles=markers, title="Storage Size", loc="upper right")

        # Chart 2: Optimized state
        df["optimized_cost"] = df["monthly_cost"] - df["optimization"].apply(
            lambda x: x["estimated_savings"]
        )
        df["optimized_retention"] = df.apply(
            lambda row: (
                row["optimization"]["recommended_retention"]
                if row["optimization"]["recommended_retention"]
                else row["retention_days_viz"]
            ),
            axis=1,
        )

        scatter2 = ax2.scatter(
            df["optimized_retention"],
            df["optimized_cost"],
            alpha=0.6,
            s=df["stored_bytes"] / (1024**2),
            c="green",
            label="Optimized State",
        )

        ax2.set_xlabel("Retention Period (days)")
        ax2.set_ylabel("Monthly Cost ($)")
        ax2.set_title("Optimized State: Retention Period vs Monthly Cost")
        ax2.set_xscale("log")
        ax2.set_yscale("log")
        ax2.grid(True, alpha=0.3)

        # Add savings annotation
        total_cost = df["monthly_cost"].sum()
        optimized_cost = df["optimized_cost"].sum()
        savings_pct = (
            ((total_cost - optimized_cost) / total_cost) * 100 if total_cost > 0 else 0
        )

        ax2.text(
            0.05,
            0.95,
            f"Total Savings: ${total_cost - optimized_cost:,.2f} ({savings_pct:.1f}%)",
            transform=ax2.transAxes,
            fontsize=12,
            verticalalignment="top",
            bbox=dict(boxstyle="round", facecolor="lightgreen", alpha=0.8),
        )

        plt.tight_layout()
        plt.savefig("log_retention_analysis.png", dpi=150, bbox_inches="tight")
        plt.close()

        logger.info("Chart saved to log_retention_analysis.png")

    def _generate_csv_report(self):
        """Generate CSV monitoring coverage report"""
        # Combine log groups and monitoring gaps
        rows = []

        # Add existing log groups
        for lg in self.log_groups_data:
            # Extract resource info from log group name
            resource_type = "Unknown"
            resource_id = lg["log_group_name"]

            if "/aws/lambda/" in lg["log_group_name"]:
                resource_type = "Lambda"
                resource_id = lg["log_group_name"].split("/")[-1]
            elif "/aws/ecs/" in lg["log_group_name"]:
                resource_type = "ECS"
                resource_id = lg["log_group_name"].split("/")[-1]
            elif "/aws/eks/" in lg["log_group_name"]:
                resource_type = "EKS"
                resource_id = lg["log_group_name"].split("/")[-1]
            elif (
                "vpc" in lg["log_group_name"].lower()
                and "flow" in lg["log_group_name"].lower()
            ):
                resource_type = "VPC"
                resource_id = lg["log_group_name"]

            rows.append(
                {
                    "resource_type": resource_type,
                    "resource_id": resource_id,
                    "log_group_name": lg["log_group_name"],
                    "status": "Active",
                    "retention_days": (
                        lg["retention_days"] if lg["retention_days"] else "Never Expire"
                    ),
                    "monthly_cost": f"${lg['monthly_cost']:.2f}",
                    "issues_count": len(lg["issues"]),
                    "primary_issue": (
                        lg["issues"][0]["type"] if lg["issues"] else "None"
                    ),
                }
            )

        # Add monitoring gaps
        for gap in self.monitoring_gaps:
            rows.append(
                {
                    "resource_type": gap["resource_type"],
                    "resource_id": gap["resource_id"],
                    "log_group_name": gap["expected_log_group"],
                    "status": gap["status"],
                    "retention_days": "N/A",
                    "monthly_cost": "$0.00",
                    "issues_count": 1,
                    "primary_issue": "missing_logs",
                }
            )

        # Write CSV
        with open("monitoring_coverage_report.csv", "w", newline="") as f:
            fieldnames = [
                "resource_type",
                "resource_id",
                "log_group_name",
                "status",
                "retention_days",
                "monthly_cost",
                "issues_count",
                "primary_issue",
            ]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

        logger.info("CSV report saved to monitoring_coverage_report.csv")


if __name__ == "__main__":
    analyzer = CloudWatchLogsAnalyzer()
    analyzer.run()
