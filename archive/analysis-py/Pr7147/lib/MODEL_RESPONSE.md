### Reasoning Trace

---

Let me break down this comprehensive AWS SNS/SQS auditing script requirement:

Required Checks:

1. Message Loss & Resilience Checks:
   - Missing DLQs
   - DLQ Message Accumulation
   - High DLQ Depth
   - Excessive Retry Configuration
   - Visibility Timeout Issues (too short <30s or too long >12h)
   - DLQ Retention Gap

2. Cost & Efficiency Checks:
   - Short Polling (ReceiveMessageWaitTimeSeconds = 0)
   - Stale Queues (no messages and no recent activity)

3. Security Checks:
   - Unencrypted Sensitive Resources (with DataClassification: Confidential tag)

4. SNS-Specific Checks:
   - Missing Subscription Filters
   - Subscription Status (not Confirmed or delivery issues)
   - FIFO Deduplication disabled

Output Requirements:

- JSON report (sns_sqs_analysis.json) with structured findings, severity ratings
- Console output with summary ranked by severity, affected resource counts, total message volume at risk

I'll need to:

1. Use boto3 to interact with SQS and SNS
2. Collect all necessary data from queues and topics
3. Perform all the checks
4. Generate both JSON and console outputs
5. Include severity ratings (critical, high, medium, low)
6. Handle errors gracefully

Let me write a comprehensive script:

### Answer

---

Here's a comprehensive Python script for auditing SNS topics and SQS queues:

```python
#!/usr/bin/env python3
"""
AWS SNS/SQS Configuration Audit Script
Analyzes SNS topics and SQS queues for misconfigurations, security gaps, and reliability risks.
"""

import json
import boto3
from datetime import datetime, timezone
from collections import defaultdict
from typing import Dict, List, Any, Tuple
import sys

class SNSSQSAuditor:
    def __init__(self, region_name='us-east-1'):
        self.region = region_name
        self.sqs = boto3.client('sqs', region_name=region_name)
        self.sns = boto3.client('sns', region_name=region_name)
        self.findings = defaultdict(list)
        self.severity_counts = defaultdict(int)

    def run_audit(self):
        """Execute all audit checks"""
        print(f"Starting SNS/SQS audit in region {self.region}...")

        # Collect resources
        queues = self._get_all_queues()
        topics = self._get_all_topics()

        print(f"Found {len(queues)} queues and {len(topics)} topics")

        # Run SQS checks
        self._check_missing_dlqs(queues)
        self._check_dlq_message_accumulation(queues)
        self._check_high_dlq_depth(queues)
        self._check_excessive_retry_config(queues)
        self._check_visibility_timeout_issues(queues)
        self._check_dlq_retention_gap(queues)
        self._check_short_polling(queues)
        self._check_stale_queues(queues)
        self._check_unencrypted_sensitive_queues(queues)
        self._check_fifo_deduplication(queues)

        # Run SNS checks
        self._check_sns_subscriptions(topics)
        self._check_unencrypted_sensitive_topics(topics)

        # Generate reports
        self._generate_json_report()
        self._generate_console_report()

    def _get_all_queues(self) -> List[Dict[str, Any]]:
        """Get all SQS queues with their attributes"""
        queues = []
        try:
            paginator = self.sqs.get_paginator('list_queues')
            for page in paginator.paginate():
                if 'QueueUrls' in page:
                    for queue_url in page['QueueUrls']:
                        try:
                            # Get queue attributes
                            attrs = self.sqs.get_queue_attributes(
                                QueueUrl=queue_url,
                                AttributeNames=['All']
                            )['Attributes']

                            # Get tags
                            try:
                                tags = self.sqs.list_queue_tags(QueueUrl=queue_url).get('Tags', {})
                            except:
                                tags = {}

                            queues.append({
                                'QueueUrl': queue_url,
                                'Attributes': attrs,
                                'Tags': tags,
                                'QueueName': queue_url.split('/')[-1],
                                'QueueArn': attrs.get('QueueArn', '')
                            })
                        except Exception as e:
                            print(f"Error getting attributes for queue {queue_url}: {e}")
        except Exception as e:
            print(f"Error listing queues: {e}")
        return queues

    def _get_all_topics(self) -> List[Dict[str, Any]]:
        """Get all SNS topics with their attributes and subscriptions"""
        topics = []
        try:
            paginator = self.sns.get_paginator('list_topics')
            for page in paginator.paginate():
                if 'Topics' in page:
                    for topic in page['Topics']:
                        topic_arn = topic['TopicArn']
                        try:
                            # Get topic attributes
                            attrs = self.sns.get_topic_attributes(TopicArn=topic_arn)['Attributes']

                            # Get tags
                            try:
                                tags_response = self.sns.list_tags_for_resource(ResourceArn=topic_arn)
                                tags = {tag['Key']: tag['Value'] for tag in tags_response.get('Tags', [])}
                            except:
                                tags = {}

                            # Get subscriptions
                            subscriptions = []
                            sub_paginator = self.sns.get_paginator('list_subscriptions_by_topic')
                            for sub_page in sub_paginator.paginate(TopicArn=topic_arn):
                                if 'Subscriptions' in sub_page:
                                    for sub in sub_page['Subscriptions']:
                                        try:
                                            # Get subscription attributes
                                            sub_attrs = self.sns.get_subscription_attributes(
                                                SubscriptionArn=sub['SubscriptionArn']
                                            )['Attributes'] if sub['SubscriptionArn'] != 'PendingConfirmation' else {}

                                            subscriptions.append({
                                                **sub,
                                                'Attributes': sub_attrs
                                            })
                                        except:
                                            subscriptions.append(sub)

                            topics.append({
                                'TopicArn': topic_arn,
                                'TopicName': topic_arn.split(':')[-1],
                                'Attributes': attrs,
                                'Tags': tags,
                                'Subscriptions': subscriptions
                            })
                        except Exception as e:
                            print(f"Error getting attributes for topic {topic_arn}: {e}")
        except Exception as e:
            print(f"Error listing topics: {e}")
        return topics

    def _add_finding(self, category: str, check: str, severity: str, resources: List[Dict[str, Any]], details: str = ""):
        """Add a finding to the results"""
        finding = {
            'category': category,
            'check': check,
            'severity': severity,
            'affected_resources': resources,
            'details': details,
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        self.findings[category].append(finding)
        self.severity_counts[severity] += len(resources)

    def _check_missing_dlqs(self, queues: List[Dict[str, Any]]):
        """Check for queues without DLQs"""
        affected = []
        for queue in queues:
            # Skip if this is a DLQ itself
            if queue['QueueName'].endswith('dlq') or 'dead' in queue['QueueName'].lower():
                continue

            redrive_policy = queue['Attributes'].get('RedrivePolicy')
            if not redrive_policy:
                affected.append({
                    'queue_arn': queue['QueueArn'],
                    'queue_name': queue['QueueName']
                })

        if affected:
            self._add_finding(
                category='Message Loss & Resilience',
                check='Missing Dead Letter Queues',
                severity='high',
                resources=affected,
                details='Queues without DLQ configuration risk permanent message loss after retry failures'
            )

    def _check_dlq_message_accumulation(self, queues: List[Dict[str, Any]]):
        """Check for DLQs with accumulated messages"""
        affected = []
        total_messages = 0

        for queue in queues:
            if 'dlq' in queue['QueueName'].lower() or 'dead' in queue['QueueName'].lower():
                msg_count = int(queue['Attributes'].get('ApproximateNumberOfMessages', 0))
                if msg_count > 0:
                    affected.append({
                        'queue_arn': queue['QueueArn'],
                        'queue_name': queue['QueueName'],
                        'message_count': msg_count
                    })
                    total_messages += msg_count

        if affected:
            self._add_finding(
                category='Message Loss & Resilience',
                check='DLQ Message Accumulation',
                severity='high',
                resources=affected,
                details=f'Total {total_messages} unprocessed messages in DLQs indicate processing failures'
            )

    def _check_high_dlq_depth(self, queues: List[Dict[str, Any]]):
        """Check for DLQs approaching capacity"""
        affected = []
        max_messages = 120000
        threshold = max_messages * 0.9

        for queue in queues:
            if 'dlq' in queue['QueueName'].lower() or 'dead' in queue['QueueName'].lower():
                msg_count = int(queue['Attributes'].get('ApproximateNumberOfMessages', 0))
                if msg_count >= threshold:
                    affected.append({
                        'queue_arn': queue['QueueArn'],
                        'queue_name': queue['QueueName'],
                        'message_count': msg_count,
                        'percentage_full': round((msg_count / max_messages) * 100, 2)
                    })

        if affected:
            self._add_finding(
                category='Message Loss & Resilience',
                check='High DLQ Depth',
                severity='critical',
                resources=affected,
                details='DLQs approaching capacity (90%+ of 120,000 message limit)'
            )

    def _check_excessive_retry_config(self, queues: List[Dict[str, Any]]):
        """Check for excessive retry configurations"""
        affected = []

        for queue in queues:
            redrive_policy = queue['Attributes'].get('RedrivePolicy')
            if redrive_policy:
                policy = json.loads(redrive_policy)
                max_receive = policy.get('maxReceiveCount', 0)
                if max_receive > 10:
                    affected.append({
                        'queue_arn': queue['QueueArn'],
                        'queue_name': queue['QueueName'],
                        'max_receive_count': max_receive
                    })

        if affected:
            self._add_finding(
                category='Message Loss & Resilience',
                check='Excessive Retry Configuration',
                severity='medium',
                resources=affected,
                details='Queues with maxReceiveCount > 10 may delay DLQ delivery unnecessarily'
            )

    def _check_visibility_timeout_issues(self, queues: List[Dict[str, Any]]):
        """Check for problematic visibility timeout settings"""
        too_short = []
        too_long = []

        for queue in queues:
            timeout = int(queue['Attributes'].get('VisibilityTimeout', 30))

            if timeout < 30:
                too_short.append({
                    'queue_arn': queue['QueueArn'],
                    'queue_name': queue['QueueName'],
                    'visibility_timeout_seconds': timeout
                })
            elif timeout > 43200:  # 12 hours
                too_long.append({
                    'queue_arn': queue['QueueArn'],
                    'queue_name': queue['QueueName'],
                    'visibility_timeout_seconds': timeout
                })

        if too_short:
            self._add_finding(
                category='Message Loss & Resilience',
                check='Visibility Timeout Too Short',
                severity='medium',
                resources=too_short,
                details='Visibility timeout < 30 seconds may cause duplicate processing'
            )

        if too_long:
            self._add_finding(
                category='Message Loss & Resilience',
                check='Visibility Timeout Too Long',
                severity='medium',
                resources=too_long,
                details='Visibility timeout > 12 hours delays failure recovery'
            )

    def _check_dlq_retention_gap(self, queues: List[Dict[str, Any]]):
        """Check for DLQ retention period issues"""
        affected = []
        queue_map = {q['QueueArn']: q for q in queues}

        for queue in queues:
            redrive_policy = queue['Attributes'].get('RedrivePolicy')
            if redrive_policy:
                policy = json.loads(redrive_policy)
                dlq_arn = policy.get('deadLetterTargetArn')

                if dlq_arn and dlq_arn in queue_map:
                    dlq = queue_map[dlq_arn]

                    source_retention = int(queue['Attributes'].get('MessageRetentionPeriod', 345600))
                    dlq_retention = int(dlq['Attributes'].get('MessageRetentionPeriod', 345600))

                    if dlq_retention <= source_retention:
                        affected.append({
                            'source_queue_arn': queue['QueueArn'],
                            'source_queue_name': queue['QueueName'],
                            'source_retention_days': source_retention // 86400,
                            'dlq_arn': dlq_arn,
                            'dlq_name': dlq['QueueName'],
                            'dlq_retention_days': dlq_retention // 86400
                        })

        if affected:
            self._add_finding(
                category='Message Loss & Resilience',
                check='DLQ Retention Gap',
                severity='high',
                resources=affected,
                details='DLQ retention period should exceed source queue retention for investigation time'
            )

    def _check_short_polling(self, queues: List[Dict[str, Any]]):
        """Check for queues using short polling"""
        affected = []

        for queue in queues:
            wait_time = int(queue['Attributes'].get('ReceiveMessageWaitTimeSeconds', 0))
            if wait_time == 0:
                affected.append({
                    'queue_arn': queue['QueueArn'],
                    'queue_name': queue['QueueName']
                })

        if affected:
            self._add_finding(
                category='Cost & Efficiency',
                check='Short Polling Enabled',
                severity='low',
                resources=affected,
                details='Queues using short polling (WaitTimeSeconds=0) increase API costs'
            )

    def _check_stale_queues(self, queues: List[Dict[str, Any]]):
        """Check for stale/unused queues"""
        affected = []

        for queue in queues:
            messages = int(queue['Attributes'].get('ApproximateNumberOfMessages', 0))
            not_visible = int(queue['Attributes'].get('ApproximateNumberOfMessagesNotVisible', 0))
            delayed = int(queue['Attributes'].get('ApproximateNumberOfMessagesDelayed', 0))

            # Check if queue is empty
            if messages == 0 and not_visible == 0 and delayed == 0:
                # Check last modified time if available
                created_timestamp = int(queue['Attributes'].get('CreatedTimestamp', 0))
                last_modified = int(queue['Attributes'].get('LastModifiedTimestamp', created_timestamp))

                # Consider stale if not modified in 30 days
                current_time = int(datetime.now(timezone.utc).timestamp())
                days_since_modified = (current_time - last_modified) // 86400

                if days_since_modified > 30:
                    affected.append({
                        'queue_arn': queue['QueueArn'],
                        'queue_name': queue['QueueName'],
                        'days_since_modified': days_since_modified
                    })

        if affected:
            self._add_finding(
                category='Cost & Efficiency',
                check='Stale Queues',
                severity='low',
                resources=affected,
                details='Empty queues with no recent activity (>30 days) may be unused'
            )

    def _check_unencrypted_sensitive_queues(self, queues: List[Dict[str, Any]]):
        """Check for unencrypted queues with sensitive data classification"""
        affected = []

        for queue in queues:
            tags = queue.get('Tags', {})
            if tags.get('DataClassification', '').lower() == 'confidential':
                kms_key = queue['Attributes'].get('KmsMasterKeyId')
                if not kms_key:
                    affected.append({
                        'queue_arn': queue['QueueArn'],
                        'queue_name': queue['QueueName'],
                        'data_classification': tags.get('DataClassification')
                    })

        if affected:
            self._add_finding(
                category='Security',
                check='Unencrypted Sensitive Queues',
                severity='critical',
                resources=affected,
                details='Queues tagged as Confidential lack KMS encryption'
            )

    def _check_fifo_deduplication(self, queues: List[Dict[str, Any]]):
        """Check for FIFO queues without content-based deduplication"""
        affected = []

        for queue in queues:
            if queue['QueueName'].endswith('.fifo'):
                dedup = queue['Attributes'].get('ContentBasedDeduplication', 'false')
                if dedup.lower() == 'false':
                    affected.append({
                        'queue_arn': queue['QueueArn'],
                        'queue_name': queue['QueueName']
                    })

        if affected:
            self._add_finding(
                category='Message Loss & Resilience',
                check='FIFO Deduplication Disabled',
                severity='medium',
                resources=affected,
                details='FIFO queues without ContentBasedDeduplication risk duplicate messages'
            )

    def _check_sns_subscriptions(self, topics: List[Dict[str, Any]]):
        """Check SNS subscription configurations"""
        missing_filters = []
        unconfirmed = []

        for topic in topics:
            for sub in topic['Subscriptions']:
                sub_arn = sub.get('SubscriptionArn', '')

                # Check subscription status
                if sub_arn == 'PendingConfirmation':
                    unconfirmed.append({
                        'topic_arn': topic['TopicArn'],
                        'topic_name': topic['TopicName'],
                        'endpoint': sub.get('Endpoint', ''),
                        'protocol': sub.get('Protocol', '')
                    })
                elif sub_arn and sub_arn != 'PendingConfirmation':
                    # Check for filter policy
                    filter_policy = sub.get('Attributes', {}).get('FilterPolicy')
                    if not filter_policy:
                        missing_filters.append({
                            'subscription_arn': sub_arn,
                            'topic_arn': topic['TopicArn'],
                            'topic_name': topic['TopicName'],
                            'endpoint': sub.get('Endpoint', ''),
                            'protocol': sub.get('Protocol', '')
                        })

        if missing_filters:
            self._add_finding(
                category='SNS Configuration',
                check='Missing Subscription Filters',
                severity='low',
                resources=missing_filters,
                details='SNS subscriptions without filter policies receive all messages'
            )

        if unconfirmed:
            self._add_finding(
                category='SNS Configuration',
                check='Unconfirmed Subscriptions',
                severity='high',
                resources=unconfirmed,
                details='Unconfirmed SNS subscriptions will not receive messages'
            )

    def _check_unencrypted_sensitive_topics(self, topics: List[Dict[str, Any]]):
        """Check for unencrypted topics with sensitive data classification"""
        affected = []

        for topic in topics:
            tags = topic.get('Tags', {})
            if tags.get('DataClassification', '').lower() == 'confidential':
                kms_key = topic['Attributes'].get('KmsMasterKeyId')
                if not kms_key:
                    affected.append({
                        'topic_arn': topic['TopicArn'],
                        'topic_name': topic['TopicName'],
                        'data_classification': tags.get('DataClassification')
                    })

        if affected:
            self._add_finding(
                category='Security',
                check='Unencrypted Sensitive Topics',
                severity='critical',
                resources=affected,
                details='Topics tagged as Confidential lack KMS encryption'
            )

    def _generate_json_report(self):
        """Generate JSON report file"""
        report = {
            'audit_timestamp': datetime.now(timezone.utc).isoformat(),
            'region': self.region,
            'severity_summary': dict(self.severity_counts),
            'findings': dict(self.findings)
        }

        with open('sns_sqs_analysis.json', 'w') as f:
            json.dump(report, f, indent=2)
        print("\nJSON report saved to sns_sqs_analysis.json")

    def _generate_console_report(self):
        """Generate console output with summary"""
        print("\n" + "="*80)
        print("SNS/SQS AUDIT SUMMARY")
        print("="*80)

        # Severity summary
        print(f"\nSeverity Counts:")
        severity_order = ['critical', 'high', 'medium', 'low']
        for severity in severity_order:
            count = self.severity_counts.get(severity, 0)
            print(f"  {severity.upper()}: {count} resources affected")

        # Detailed findings by severity
        print(f"\nDetailed Findings (sorted by severity):")
        print("-"*80)

        # Flatten and sort findings
        all_findings = []
        for category, findings in self.findings.items():
            all_findings.extend(findings)

        # Sort by severity
        severity_rank = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        all_findings.sort(key=lambda x: severity_rank.get(x['severity'], 999))

        # Print findings
        for finding in all_findings:
            print(f"\n[{finding['severity'].upper()}] {finding['check']}")
            print(f"Category: {finding['category']}")
            print(f"Details: {finding['details']}")
            print(f"Affected Resources ({len(finding['affected_resources'])}):")

            # Show first 5 resources
            for i, resource in enumerate(finding['affected_resources'][:5]):
                if 'queue_name' in resource:
                    print(f"  - Queue: {resource['queue_name']}", end="")
                elif 'topic_name' in resource:
                    print(f"  - Topic: {resource['topic_name']}", end="")

                # Add extra details if available
                if 'message_count' in resource:
                    print(f" ({resource['message_count']} messages)", end="")
                elif 'max_receive_count' in resource:
                    print(f" (retry count: {resource['max_receive_count']})", end="")
                elif 'visibility_timeout_seconds' in resource:
                    print(f" (timeout: {resource['visibility_timeout_seconds']}s)", end="")
                print()

            if len(finding['affected_resources']) > 5:
                print(f"  ... and {len(finding['affected_resources']) - 5} more")

        # Calculate total messages at risk
        print("\n" + "-"*80)
        print("MESSAGE VOLUME AT RISK:")

        total_dlq_messages = 0
        for finding in all_findings:
            if finding['check'] == 'DLQ Message Accumulation':
                for resource in finding['affected_resources']:
                    total_dlq_messages += resource.get('message_count', 0)

        if total_dlq_messages > 0:
            print(f"Total messages in DLQs: {total_dlq_messages:,}")
            print("These messages represent failed processing attempts requiring investigation")


def main():
    """Main execution function"""
    try:
        # Get region from environment or use default
        import os
        region = os.environ.get('AWS_REGION', 'us-east-1')

        # Run audit
        auditor = SNSSQSAuditor(region_name=region)
        auditor.run_audit()

    except Exception as e:
        print(f"Error during audit: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
```

## Script Overview

This comprehensive audit script analyzes SNS topics and SQS queues for various misconfigurations and risks:

### Key Features:

1. **Message Loss & Resilience Checks**:
   - Identifies queues without DLQs configured
   - Detects DLQs with accumulated messages
   - Warns about DLQs approaching capacity limits
   - Flags excessive retry configurations
   - Checks for problematic visibility timeout settings
   - Identifies DLQ retention period gaps
   - Checks FIFO queue deduplication settings

2. **Cost & Efficiency Checks**:
   - Identifies queues using expensive short polling
   - Finds potentially unused stale queues

3. **Security Checks**:
   - Detects unencrypted queues/topics tagged as confidential

4. **SNS-Specific Checks**:
   - Identifies subscriptions without filter policies
   - Finds unconfirmed subscriptions

### Usage:

```bash
# Run with default region (us-east-1)
python analyze.py

# Run with specific region
export AWS_REGION=eu-west-1
python analyze.py
```

### Output:

1. **JSON Report** (`sns_sqs_analysis.json`):
   - Structured findings by category
   - Severity ratings for each issue
   - Complete resource details
   - Timestamp and region information

2. **Console Output**:
   - Summary of findings by severity
   - Detailed findings sorted by criticality
   - Total message volume at risk
   - Sample affected resources for each finding

The script uses boto3 pagination to handle large numbers of resources and includes comprehensive error handling to continue auditing even if individual resources fail to load.
