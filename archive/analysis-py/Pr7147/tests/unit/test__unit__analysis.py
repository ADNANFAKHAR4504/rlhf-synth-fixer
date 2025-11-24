"""
Unit Tests for AWS SNS/SQS Configuration Audit Script

These tests use unittest.mock to test the SNSSQSAuditor class logic
WITHOUT external services (no Moto server required).

Tests cover:
- Initialization and AWS client creation
- All 12+ finding types (Missing DLQ, Short Polling, etc.)
- Helper methods and report generation
- Error handling
"""

import sys
import os
import json
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch, mock_open

import pytest

# Add parent directory to path to import the analysis module
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

from analyse import SNSSQSAuditor


class TestSNSSQSAuditor:
    """Test suite for SNSSQSAuditor class"""

    # =========================================================================
    # INITIALIZATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_initialization_creates_aws_clients(self, mock_boto_client):
        """Test that analyzer initializes with correct AWS clients"""
        auditor = SNSSQSAuditor(region_name='us-east-1')

        assert auditor.region == 'us-east-1'
        assert mock_boto_client.call_count == 2  # SQS and SNS clients
        mock_boto_client.assert_any_call('sqs', region_name='us-east-1')
        mock_boto_client.assert_any_call('sns', region_name='us-east-1')

    @patch('analyse.boto3.client')
    def test_initialization_default_region(self, mock_boto_client):
        """Test analyzer uses default region when not specified"""
        auditor = SNSSQSAuditor()
        assert auditor.region == 'us-east-1'

    @patch('analyse.boto3.client')
    def test_initialization_custom_region(self, mock_boto_client):
        """Test analyzer uses custom region"""
        auditor = SNSSQSAuditor(region_name='eu-west-1')
        assert auditor.region == 'eu-west-1'

    # =========================================================================
    # MISSING DLQ TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_missing_dlqs_finds_queues_without_dlq(self, mock_boto_client):
        """Test _check_missing_dlqs identifies queues without DLQ configuration"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        # Mock queues - one without DLQ, one with DLQ
        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/orders-queue',
                'QueueName': 'orders-queue',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:orders-queue',
                'Attributes': {
                    'VisibilityTimeout': '30',
                    'MessageRetentionPeriod': '345600'
                },
                'Tags': {}
            },
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/queue-with-dlq',
                'QueueName': 'queue-with-dlq',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:queue-with-dlq',
                'Attributes': {
                    'RedrivePolicy': json.dumps({'deadLetterTargetArn': 'arn:aws:sqs:us-east-1:123456789:dlq', 'maxReceiveCount': 5}),
                    'VisibilityTimeout': '30',
                    'MessageRetentionPeriod': '345600'
                },
                'Tags': {}
            }
        ]

        auditor._check_missing_dlqs(queues)

        # Should have one finding
        assert 'Message Loss & Resilience' in auditor.findings
        findings = auditor.findings['Message Loss & Resilience']
        missing_dlq_findings = [f for f in findings if f['check'] == 'Missing Dead Letter Queues']
        assert len(missing_dlq_findings) == 1
        assert len(missing_dlq_findings[0]['affected_resources']) == 1
        assert missing_dlq_findings[0]['affected_resources'][0]['queue_name'] == 'orders-queue'
        assert missing_dlq_findings[0]['affected_resources'][0]['retention_days'] == 4

    @patch('analyse.boto3.client')
    def test_check_missing_dlqs_skips_dlq_queues(self, mock_boto_client):
        """Test _check_missing_dlqs skips queues that are DLQs themselves"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        # Mock DLQ queue (should be skipped)
        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/orders-dlq',
                'QueueName': 'orders-dlq',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:orders-dlq',
                'Attributes': {'VisibilityTimeout': '30', 'MessageRetentionPeriod': '345600'},
                'Tags': {}
            },
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/dead-letter-queue',
                'QueueName': 'dead-letter-queue',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:dead-letter-queue',
                'Attributes': {'VisibilityTimeout': '30', 'MessageRetentionPeriod': '345600'},
                'Tags': {}
            }
        ]

        auditor._check_missing_dlqs(queues)

        # Should have no findings (both queues are DLQs)
        missing_dlq_findings = [f for category in auditor.findings.values()
                               for f in category if f['check'] == 'Missing Dead Letter Queues']
        assert len(missing_dlq_findings) == 0

    # =========================================================================
    # DLQ MESSAGE ACCUMULATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_dlq_message_accumulation_finds_messages(self, mock_boto_client):
        """Test _check_dlq_message_accumulation identifies DLQs with messages"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/orders-dlq',
                'QueueName': 'orders-dlq',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:orders-dlq',
                'Attributes': {'ApproximateNumberOfMessages': '100'},
                'Tags': {}
            }
        ]

        auditor._check_dlq_message_accumulation(queues)

        assert auditor.total_messages_at_risk == 100
        findings = auditor.findings['Message Loss & Resilience']
        accumulation_findings = [f for f in findings if f['check'] == 'DLQ Message Accumulation']
        assert len(accumulation_findings) == 1
        assert accumulation_findings[0]['affected_resources'][0]['message_count'] == 100

    @patch('analyse.boto3.client')
    def test_check_dlq_message_accumulation_ignores_empty_dlqs(self, mock_boto_client):
        """Test _check_dlq_message_accumulation ignores empty DLQs"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/orders-dlq',
                'QueueName': 'orders-dlq',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:orders-dlq',
                'Attributes': {'ApproximateNumberOfMessages': '0'},
                'Tags': {}
            }
        ]

        auditor._check_dlq_message_accumulation(queues)

        assert auditor.total_messages_at_risk == 0
        accumulation_findings = [f for category in auditor.findings.values()
                                for f in category if f['check'] == 'DLQ Message Accumulation']
        assert len(accumulation_findings) == 0

    # =========================================================================
    # EXCESSIVE RETRY CONFIGURATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_excessive_retry_config_finds_high_retry(self, mock_boto_client):
        """Test _check_excessive_retry_config identifies queues with maxReceiveCount > 10"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/high-retry-queue',
                'QueueName': 'high-retry-queue',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:high-retry-queue',
                'Attributes': {
                    'RedrivePolicy': json.dumps({'deadLetterTargetArn': 'arn:aws:sqs:us-east-1:123456789:dlq', 'maxReceiveCount': 15})
                },
                'Tags': {}
            },
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/normal-retry-queue',
                'QueueName': 'normal-retry-queue',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:normal-retry-queue',
                'Attributes': {
                    'RedrivePolicy': json.dumps({'deadLetterTargetArn': 'arn:aws:sqs:us-east-1:123456789:dlq', 'maxReceiveCount': 5})
                },
                'Tags': {}
            }
        ]

        auditor._check_excessive_retry_config(queues)

        findings = auditor.findings['Message Loss & Resilience']
        retry_findings = [f for f in findings if f['check'] == 'Excessive Retry Configuration']
        assert len(retry_findings) == 1
        assert retry_findings[0]['affected_resources'][0]['max_receive_count'] == 15

    # =========================================================================
    # VISIBILITY TIMEOUT TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_visibility_timeout_too_short(self, mock_boto_client):
        """Test _check_visibility_timeout_issues identifies timeouts < 30 seconds"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/short-timeout',
                'QueueName': 'short-timeout',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:short-timeout',
                'Attributes': {'VisibilityTimeout': '10'},
                'Tags': {}
            }
        ]

        auditor._check_visibility_timeout_issues(queues)

        findings = auditor.findings['Message Loss & Resilience']
        timeout_findings = [f for f in findings if f['check'] == 'Visibility Timeout Too Short']
        assert len(timeout_findings) == 1
        assert timeout_findings[0]['affected_resources'][0]['visibility_timeout_seconds'] == 10

    @patch('analyse.boto3.client')
    def test_check_visibility_timeout_too_long(self, mock_boto_client):
        """Test _check_visibility_timeout_issues identifies timeouts > 12 hours"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/long-timeout',
                'QueueName': 'long-timeout',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:long-timeout',
                'Attributes': {'VisibilityTimeout': '50000'},
                'Tags': {}
            }
        ]

        auditor._check_visibility_timeout_issues(queues)

        findings = auditor.findings['Message Loss & Resilience']
        timeout_findings = [f for f in findings if f['check'] == 'Visibility Timeout Too Long']
        assert len(timeout_findings) == 1
        assert timeout_findings[0]['affected_resources'][0]['visibility_timeout_seconds'] == 50000

    # =========================================================================
    # SHORT POLLING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_short_polling_finds_zero_wait_time(self, mock_boto_client):
        """Test _check_short_polling identifies queues with WaitTimeSeconds=0"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/short-polling',
                'QueueName': 'short-polling',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:short-polling',
                'Attributes': {'ReceiveMessageWaitTimeSeconds': '0', 'VisibilityTimeout': '30'},
                'Tags': {}
            },
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/long-polling',
                'QueueName': 'long-polling',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:long-polling',
                'Attributes': {'ReceiveMessageWaitTimeSeconds': '20', 'VisibilityTimeout': '30'},
                'Tags': {}
            }
        ]

        auditor._check_short_polling(queues)

        findings = auditor.findings['Cost & Efficiency']
        polling_findings = [f for f in findings if f['check'] == 'Short Polling Enabled']
        assert len(polling_findings) == 1
        assert polling_findings[0]['affected_resources'][0]['queue_name'] == 'short-polling'
        assert polling_findings[0]['affected_resources'][0]['wait_time_seconds'] == 0
        assert polling_findings[0]['affected_resources'][0]['visibility_timeout'] == 30

    # =========================================================================
    # UNENCRYPTED SENSITIVE QUEUES TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_unencrypted_sensitive_queues_finds_unencrypted(self, mock_boto_client):
        """Test _check_unencrypted_sensitive_queues finds confidential queues without KMS"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/confidential-queue',
                'QueueName': 'confidential-queue',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:confidential-queue',
                'Attributes': {},
                'Tags': {'DataClassification': 'Confidential'}
            }
        ]

        auditor._check_unencrypted_sensitive_queues(queues)

        findings = auditor.findings['Security']
        security_findings = [f for f in findings if f['check'] == 'Unencrypted Sensitive Queues']
        assert len(security_findings) == 1
        assert security_findings[0]['severity'] == 'critical'

    @patch('analyse.boto3.client')
    def test_check_unencrypted_sensitive_queues_ignores_encrypted(self, mock_boto_client):
        """Test _check_unencrypted_sensitive_queues ignores encrypted confidential queues"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/encrypted-confidential',
                'QueueName': 'encrypted-confidential',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:encrypted-confidential',
                'Attributes': {'KmsMasterKeyId': 'alias/aws/sqs'},
                'Tags': {'DataClassification': 'Confidential'}
            }
        ]

        auditor._check_unencrypted_sensitive_queues(queues)

        security_findings = [f for category in auditor.findings.values()
                           for f in category if f['check'] == 'Unencrypted Sensitive Queues']
        assert len(security_findings) == 0

    # =========================================================================
    # FIFO DEDUPLICATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_fifo_deduplication_disabled(self, mock_boto_client):
        """Test _check_fifo_deduplication finds FIFO queues without deduplication"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/orders.fifo',
                'QueueName': 'orders.fifo',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:orders.fifo',
                'Attributes': {'ContentBasedDeduplication': 'false'},
                'Tags': {}
            }
        ]

        auditor._check_fifo_deduplication(queues)

        findings = auditor.findings['Message Loss & Resilience']
        fifo_findings = [f for f in findings if f['check'] == 'FIFO Deduplication Disabled']
        assert len(fifo_findings) == 1
        assert fifo_findings[0]['affected_resources'][0]['dedup_enabled'] == False

    # =========================================================================
    # DLQ RETENTION GAP TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_dlq_retention_gap_finds_gap(self, mock_boto_client):
        """Test _check_dlq_retention_gap finds when DLQ retention <= source retention"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        dlq_arn = 'arn:aws:sqs:us-east-1:123456789:orders-dlq'
        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/orders-dlq',
                'QueueName': 'orders-dlq',
                'QueueArn': dlq_arn,
                'Attributes': {'MessageRetentionPeriod': '259200'},  # 3 days
                'Tags': {}
            },
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/orders',
                'QueueName': 'orders',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:orders',
                'Attributes': {
                    'MessageRetentionPeriod': '345600',  # 4 days
                    'RedrivePolicy': json.dumps({'deadLetterTargetArn': dlq_arn, 'maxReceiveCount': 3})
                },
                'Tags': {}
            }
        ]

        auditor._check_dlq_retention_gap(queues)

        findings = auditor.findings['Message Loss & Resilience']
        gap_findings = [f for f in findings if f['check'] == 'DLQ Retention Gap']
        assert len(gap_findings) == 1
        assert gap_findings[0]['affected_resources'][0]['source_retention_days'] == 4
        assert gap_findings[0]['affected_resources'][0]['dlq_retention_days'] == 3

    # =========================================================================
    # SNS SUBSCRIPTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_sns_subscriptions_finds_missing_filters(self, mock_boto_client):
        """Test _check_sns_subscriptions finds subscriptions without filter policies"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        topics = [
            {
                'TopicArn': 'arn:aws:sns:us-east-1:123456789:orders-topic',
                'TopicName': 'orders-topic',
                'Attributes': {},
                'Tags': {},
                'Subscriptions': [
                    {
                        'SubscriptionArn': 'arn:aws:sns:us-east-1:123456789:orders-topic:sub1',
                        'TopicArn': 'arn:aws:sns:us-east-1:123456789:orders-topic',
                        'Protocol': 'sqs',
                        'Endpoint': 'arn:aws:sqs:us-east-1:123456789:orders-queue',
                        'Attributes': {}  # No FilterPolicy
                    }
                ]
            }
        ]

        auditor._check_sns_subscriptions(topics)

        findings = auditor.findings['SNS Configuration']
        filter_findings = [f for f in findings if f['check'] == 'Missing Subscription Filters']
        assert len(filter_findings) == 1

    @patch('analyse.boto3.client')
    def test_check_sns_subscriptions_finds_unconfirmed(self, mock_boto_client):
        """Test _check_sns_subscriptions finds unconfirmed subscriptions"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        topics = [
            {
                'TopicArn': 'arn:aws:sns:us-east-1:123456789:notifications',
                'TopicName': 'notifications',
                'Attributes': {},
                'Tags': {},
                'Subscriptions': [
                    {
                        'SubscriptionArn': 'PendingConfirmation',
                        'TopicArn': 'arn:aws:sns:us-east-1:123456789:notifications',
                        'Protocol': 'email',
                        'Endpoint': 'user@example.com'
                    }
                ]
            }
        ]

        auditor._check_sns_subscriptions(topics)

        findings = auditor.findings['SNS Configuration']
        unconfirmed_findings = [f for f in findings if f['check'] == 'Unconfirmed Subscriptions']
        assert len(unconfirmed_findings) == 1
        assert unconfirmed_findings[0]['severity'] == 'high'

    # =========================================================================
    # UNENCRYPTED SENSITIVE TOPICS TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_unencrypted_sensitive_topics(self, mock_boto_client):
        """Test _check_unencrypted_sensitive_topics finds confidential topics without KMS"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        topics = [
            {
                'TopicArn': 'arn:aws:sns:us-east-1:123456789:confidential-topic',
                'TopicName': 'confidential-topic',
                'Attributes': {},
                'Tags': {'DataClassification': 'Confidential'},
                'Subscriptions': []
            }
        ]

        auditor._check_unencrypted_sensitive_topics(topics)

        findings = auditor.findings['Security']
        topic_findings = [f for f in findings if f['check'] == 'Unencrypted Sensitive Topics']
        assert len(topic_findings) == 1
        assert topic_findings[0]['severity'] == 'critical'

    # =========================================================================
    # GET ALL QUEUES TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_get_all_queues_paginates_correctly(self, mock_boto_client):
        """Test _get_all_queues handles pagination"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        # Setup pagination mock
        mock_paginator = MagicMock()
        mock_sqs.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'QueueUrls': ['https://sqs.us-east-1.amazonaws.com/123456789/queue1']},
            {'QueueUrls': ['https://sqs.us-east-1.amazonaws.com/123456789/queue2']}
        ]

        mock_sqs.get_queue_attributes.return_value = {
            'Attributes': {'QueueArn': 'arn:aws:sqs:us-east-1:123456789:queue1', 'VisibilityTimeout': '30'}
        }
        mock_sqs.list_queue_tags.return_value = {'Tags': {}}

        auditor = SNSSQSAuditor()
        queues = auditor._get_all_queues()

        assert len(queues) == 2
        mock_sqs.get_paginator.assert_called_with('list_queues')

    @patch('analyse.boto3.client')
    def test_get_all_queues_handles_errors(self, mock_boto_client):
        """Test _get_all_queues handles errors gracefully"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        mock_paginator = MagicMock()
        mock_sqs.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.side_effect = Exception("API Error")

        auditor = SNSSQSAuditor()
        queues = auditor._get_all_queues()

        assert queues == []

    # =========================================================================
    # GET ALL TOPICS TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_get_all_topics_paginates_correctly(self, mock_boto_client):
        """Test _get_all_topics handles pagination"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        # Setup topic pagination mock
        topic_paginator = MagicMock()
        sub_paginator = MagicMock()
        mock_sns.get_paginator.side_effect = [topic_paginator, sub_paginator]

        topic_paginator.paginate.return_value = [
            {'Topics': [{'TopicArn': 'arn:aws:sns:us-east-1:123456789:topic1'}]}
        ]

        mock_sns.get_topic_attributes.return_value = {'Attributes': {}}
        mock_sns.list_tags_for_resource.return_value = {'Tags': []}

        sub_paginator.paginate.return_value = [{'Subscriptions': []}]

        auditor = SNSSQSAuditor()
        topics = auditor._get_all_topics()

        assert len(topics) == 1
        assert topics[0]['TopicName'] == 'topic1'

    # =========================================================================
    # ADD FINDING TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_add_finding_updates_severity_counts(self, mock_boto_client):
        """Test _add_finding correctly updates severity counts"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        auditor._add_finding(
            category='Security',
            check='Test Check',
            severity='critical',
            resources=[{'id': '1'}, {'id': '2'}],
            details='Test details'
        )

        assert auditor.severity_counts['critical'] == 2
        assert len(auditor.findings['Security']) == 1
        assert auditor.findings['Security'][0]['check'] == 'Test Check'

    # =========================================================================
    # REPORT GENERATION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.open', new_callable=mock_open)
    @patch('json.dump')
    def test_generate_json_report_creates_file(self, mock_json_dump, mock_file, mock_boto_client):
        """Test _generate_json_report creates JSON file with correct structure"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()
        auditor.severity_counts = {'critical': 1, 'high': 2}
        auditor.total_messages_at_risk = 100

        auditor._generate_json_report()

        mock_file.assert_called_once_with('sns_sqs_analysis.json', 'w')
        assert mock_json_dump.called

        # Verify report structure
        call_args = mock_json_dump.call_args[0][0]
        assert 'audit_timestamp' in call_args
        assert 'region' in call_args
        assert 'severity_summary' in call_args
        assert 'total_messages_at_risk' in call_args
        assert 'findings' in call_args

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_generate_console_report_prints_tables(self, mock_print, mock_boto_client):
        """Test _generate_console_report outputs tabulate format"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()
        auditor.severity_counts = {'critical': 1, 'high': 2, 'medium': 1, 'low': 3}
        auditor._add_finding('Security', 'Test', 'critical', [{'queue_name': 'test'}], 'details')

        auditor._generate_console_report()

        # Check that print was called multiple times (for tables and headers)
        assert mock_print.call_count > 10

        # Check key sections were printed
        printed_output = ' '.join(str(call) for call in mock_print.call_args_list)
        assert 'SNS/SQS AUDIT SUMMARY' in printed_output
        assert 'SEVERITY SUMMARY' in printed_output

    # =========================================================================
    # MAIN FUNCTION TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_main_function_executes_successfully(self, mock_print, mock_boto_client):
        """Test main() function runs without errors"""
        from analyse import main

        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        # Setup empty responses
        mock_paginator = MagicMock()
        mock_sqs.get_paginator.return_value = mock_paginator
        mock_sns.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = []

        with patch('analyse.SNSSQSAuditor') as MockAuditor:
            mock_instance = MockAuditor.return_value
            mock_instance.run_audit.return_value = None

            # main() doesn't return a value, it just runs
            main()

            mock_instance.run_audit.assert_called_once()

    @patch('analyse.boto3.client')
    def test_main_function_handles_exception(self, mock_boto_client):
        """Test main() function handles exceptions gracefully"""
        from analyse import main

        with patch('analyse.SNSSQSAuditor') as MockAuditor:
            MockAuditor.side_effect = Exception("Test error")

            # Should not raise, but exit with code 1
            with pytest.raises(SystemExit) as exc_info:
                main()

            assert exc_info.value.code == 1

    # =========================================================================
    # HIGH DLQ DEPTH TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_high_dlq_depth_finds_near_capacity(self, mock_boto_client):
        """Test _check_high_dlq_depth identifies DLQs at 90%+ capacity"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/critical-dlq',
                'QueueName': 'critical-dlq',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:critical-dlq',
                'Attributes': {'ApproximateNumberOfMessages': '110000'},  # > 90% of 120000
                'Tags': {}
            }
        ]

        auditor._check_high_dlq_depth(queues)

        findings = auditor.findings['Message Loss & Resilience']
        depth_findings = [f for f in findings if f['check'] == 'High DLQ Depth']
        assert len(depth_findings) == 1
        assert depth_findings[0]['severity'] == 'critical'
        assert depth_findings[0]['affected_resources'][0]['percentage_full'] > 90

    # =========================================================================
    # STALE QUEUES TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_stale_queues_finds_old_empty_queues(self, mock_boto_client):
        """Test _check_stale_queues identifies empty queues not modified in 30+ days"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        # Create timestamp 60 days ago
        import time
        old_timestamp = str(int(time.time()) - (60 * 86400))

        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/stale-queue',
                'QueueName': 'stale-queue',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:stale-queue',
                'Attributes': {
                    'ApproximateNumberOfMessages': '0',
                    'ApproximateNumberOfMessagesNotVisible': '0',
                    'ApproximateNumberOfMessagesDelayed': '0',
                    'CreatedTimestamp': old_timestamp,
                    'LastModifiedTimestamp': old_timestamp
                },
                'Tags': {}
            }
        ]

        auditor._check_stale_queues(queues)

        findings = auditor.findings['Cost & Efficiency']
        stale_findings = [f for f in findings if f['check'] == 'Stale Queues']
        assert len(stale_findings) == 1
        assert stale_findings[0]['affected_resources'][0]['days_since_modified'] > 30

    @patch('analyse.boto3.client')
    def test_check_stale_queues_ignores_active_queues(self, mock_boto_client):
        """Test _check_stale_queues ignores queues with messages"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/active-queue',
                'QueueName': 'active-queue',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:active-queue',
                'Attributes': {
                    'ApproximateNumberOfMessages': '10',
                    'ApproximateNumberOfMessagesNotVisible': '0',
                    'ApproximateNumberOfMessagesDelayed': '0'
                },
                'Tags': {}
            }
        ]

        auditor._check_stale_queues(queues)

        stale_findings = [f for category in auditor.findings.values()
                        for f in category if f['check'] == 'Stale Queues']
        assert len(stale_findings) == 0

    # =========================================================================
    # RUN AUDIT TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_run_audit_calls_all_checks(self, mock_boto_client):
        """Test run_audit executes all check methods"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        # Setup empty paginators
        mock_paginator = MagicMock()
        mock_sqs.get_paginator.return_value = mock_paginator
        mock_sns.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = []

        auditor = SNSSQSAuditor()

        # Mock the methods to verify they're called
        with patch.object(auditor, '_get_all_queues', return_value=[]) as mock_queues:
            with patch.object(auditor, '_get_all_topics', return_value=[]) as mock_topics:
                with patch.object(auditor, '_generate_json_report') as mock_json:
                    with patch.object(auditor, '_generate_console_report') as mock_console:
                        auditor.run_audit()

                        mock_queues.assert_called_once()
                        mock_topics.assert_called_once()
                        mock_json.assert_called_once()
                        mock_console.assert_called_once()

    @patch('analyse.boto3.client')
    def test_run_audit_with_findings(self, mock_boto_client):
        """Test run_audit processes queues and topics with findings"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        mock_queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
                'QueueName': 'test-queue',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:test-queue',
                'Attributes': {
                    'VisibilityTimeout': '30',
                    'MessageRetentionPeriod': '345600',
                    'ReceiveMessageWaitTimeSeconds': '0'
                },
                'Tags': {}
            }
        ]

        with patch.object(auditor, '_get_all_queues', return_value=mock_queues):
            with patch.object(auditor, '_get_all_topics', return_value=[]):
                with patch.object(auditor, '_generate_json_report'):
                    with patch.object(auditor, '_generate_console_report'):
                        auditor.run_audit()

        # Should have findings for missing DLQ and short polling
        assert len(auditor.findings) > 0

    # =========================================================================
    # GET ALL QUEUES DETAILED TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_get_all_queues_with_tags(self, mock_boto_client):
        """Test _get_all_queues retrieves queue tags"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        mock_paginator = MagicMock()
        mock_sqs.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'QueueUrls': ['https://sqs.us-east-1.amazonaws.com/123456789/tagged-queue']}
        ]

        mock_sqs.get_queue_attributes.return_value = {
            'Attributes': {
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:tagged-queue',
                'VisibilityTimeout': '30'
            }
        }
        mock_sqs.list_queue_tags.return_value = {
            'Tags': {'Environment': 'Production', 'DataClassification': 'Confidential'}
        }

        auditor = SNSSQSAuditor()
        queues = auditor._get_all_queues()

        assert len(queues) == 1
        assert queues[0]['Tags']['Environment'] == 'Production'
        assert queues[0]['Tags']['DataClassification'] == 'Confidential'

    @patch('analyse.boto3.client')
    def test_get_all_queues_handles_tag_error(self, mock_boto_client):
        """Test _get_all_queues handles tag retrieval errors gracefully"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        mock_paginator = MagicMock()
        mock_sqs.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'QueueUrls': ['https://sqs.us-east-1.amazonaws.com/123456789/queue1']}
        ]

        mock_sqs.get_queue_attributes.return_value = {
            'Attributes': {'QueueArn': 'arn:aws:sqs:us-east-1:123456789:queue1'}
        }
        mock_sqs.list_queue_tags.side_effect = Exception("Tag access denied")

        auditor = SNSSQSAuditor()
        queues = auditor._get_all_queues()

        assert len(queues) == 1
        assert queues[0]['Tags'] == {}

    @patch('analyse.boto3.client')
    def test_get_all_queues_handles_attribute_error(self, mock_boto_client):
        """Test _get_all_queues handles attribute retrieval errors"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        mock_paginator = MagicMock()
        mock_sqs.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [
            {'QueueUrls': ['https://sqs.us-east-1.amazonaws.com/123456789/queue1']}
        ]

        mock_sqs.get_queue_attributes.side_effect = Exception("Access denied")

        auditor = SNSSQSAuditor()
        queues = auditor._get_all_queues()

        # Should return empty list or skip the problematic queue
        assert len(queues) == 0

    # =========================================================================
    # GET ALL TOPICS DETAILED TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_get_all_topics_with_subscriptions(self, mock_boto_client):
        """Test _get_all_topics retrieves topic subscriptions"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        topic_paginator = MagicMock()
        sub_paginator = MagicMock()

        def get_paginator_side_effect(operation):
            if operation == 'list_topics':
                return topic_paginator
            elif operation == 'list_subscriptions_by_topic':
                return sub_paginator

        mock_sns.get_paginator.side_effect = get_paginator_side_effect

        topic_paginator.paginate.return_value = [
            {'Topics': [{'TopicArn': 'arn:aws:sns:us-east-1:123456789:orders-topic'}]}
        ]

        mock_sns.get_topic_attributes.return_value = {'Attributes': {'TopicArn': 'arn:aws:sns:us-east-1:123456789:orders-topic'}}
        mock_sns.list_tags_for_resource.return_value = {'Tags': [{'Key': 'Env', 'Value': 'Prod'}]}

        sub_paginator.paginate.return_value = [
            {
                'Subscriptions': [
                    {
                        'SubscriptionArn': 'arn:aws:sns:us-east-1:123456789:orders-topic:sub1',
                        'Protocol': 'sqs',
                        'Endpoint': 'arn:aws:sqs:us-east-1:123456789:orders-queue'
                    }
                ]
            }
        ]

        mock_sns.get_subscription_attributes.return_value = {
            'Attributes': {'FilterPolicy': '{"type": ["order"]}'}
        }

        auditor = SNSSQSAuditor()
        topics = auditor._get_all_topics()

        assert len(topics) == 1
        assert topics[0]['TopicName'] == 'orders-topic'
        assert len(topics[0]['Subscriptions']) == 1
        assert topics[0]['Tags']['Env'] == 'Prod'

    @patch('analyse.boto3.client')
    def test_get_all_topics_handles_pending_confirmation(self, mock_boto_client):
        """Test _get_all_topics handles pending confirmation subscriptions"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        topic_paginator = MagicMock()
        sub_paginator = MagicMock()

        def get_paginator_side_effect(operation):
            if operation == 'list_topics':
                return topic_paginator
            return sub_paginator

        mock_sns.get_paginator.side_effect = get_paginator_side_effect

        topic_paginator.paginate.return_value = [
            {'Topics': [{'TopicArn': 'arn:aws:sns:us-east-1:123456789:topic1'}]}
        ]

        mock_sns.get_topic_attributes.return_value = {'Attributes': {}}
        mock_sns.list_tags_for_resource.return_value = {'Tags': []}

        sub_paginator.paginate.return_value = [
            {
                'Subscriptions': [
                    {
                        'SubscriptionArn': 'PendingConfirmation',
                        'Protocol': 'email',
                        'Endpoint': 'user@example.com'
                    }
                ]
            }
        ]

        auditor = SNSSQSAuditor()
        topics = auditor._get_all_topics()

        assert len(topics) == 1
        assert topics[0]['Subscriptions'][0]['SubscriptionArn'] == 'PendingConfirmation'

    @patch('analyse.boto3.client')
    def test_get_all_topics_handles_errors(self, mock_boto_client):
        """Test _get_all_topics handles errors gracefully"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        mock_paginator = MagicMock()
        mock_sns.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.side_effect = Exception("API Error")

        auditor = SNSSQSAuditor()
        topics = auditor._get_all_topics()

        assert topics == []

    @patch('analyse.boto3.client')
    def test_get_all_topics_handles_attribute_error(self, mock_boto_client):
        """Test _get_all_topics handles topic attribute errors"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        topic_paginator = MagicMock()
        mock_sns.get_paginator.return_value = topic_paginator

        topic_paginator.paginate.return_value = [
            {'Topics': [{'TopicArn': 'arn:aws:sns:us-east-1:123456789:topic1'}]}
        ]

        mock_sns.get_topic_attributes.side_effect = Exception("Access denied")

        auditor = SNSSQSAuditor()
        topics = auditor._get_all_topics()

        # Should skip the problematic topic
        assert len(topics) == 0

    # =========================================================================
    # CONSOLE REPORT DETAIL TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_console_report_shows_all_detail_types(self, mock_print, mock_boto_client):
        """Test console report displays various detail types correctly"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        # Add findings with various detail types
        auditor._add_finding('Test', 'Message Count', 'high',
            [{'queue_name': 'q1', 'message_count': 100}], 'test')
        auditor._add_finding('Test', 'Retry Count', 'medium',
            [{'queue_name': 'q2', 'max_receive_count': 15}], 'test')
        auditor._add_finding('Test', 'Timeout', 'medium',
            [{'queue_name': 'q3', 'visibility_timeout_seconds': 10}], 'test')
        auditor._add_finding('Test', 'Stale', 'low',
            [{'queue_name': 'q4', 'days_since_modified': 45}], 'test')
        auditor._add_finding('Test', 'Classification', 'critical',
            [{'queue_name': 'q5', 'data_classification': 'Confidential'}], 'test')
        auditor._add_finding('Test', 'Retention Gap', 'high',
            [{'source_queue_name': 'q6', 'source_retention_days': 4, 'dlq_retention_days': 3}], 'test')
        auditor._add_finding('Test', 'Percentage', 'critical',
            [{'queue_name': 'q7', 'percentage_full': 95.5}], 'test')
        auditor._add_finding('Test', 'Short Poll', 'low',
            [{'queue_name': 'q8', 'wait_time_seconds': 0, 'visibility_timeout': 30}], 'test')
        auditor._add_finding('Test', 'Dedup', 'medium',
            [{'queue_name': 'q9', 'dedup_enabled': False}], 'test')
        auditor._add_finding('Test', 'Missing DLQ', 'high',
            [{'queue_name': 'q10', 'visibility_timeout': 30, 'retention_days': 4}], 'test')
        auditor._add_finding('Test', 'SNS Sub', 'low',
            [{'topic_name': 't1', 'protocol': 'sqs', 'endpoint': 'arn:aws:sqs:us-east-1:123:queue'}], 'test')
        auditor._add_finding('SNS', 'Topic', 'low',
            [{'topic_name': 't2'}], 'test')

        auditor._generate_console_report()

        # Verify print was called many times
        assert mock_print.call_count > 20

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_console_report_handles_more_than_10_resources(self, mock_print, mock_boto_client):
        """Test console report shows '... and X more' for >10 resources"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        # Add finding with 15 resources
        resources = [{'queue_name': f'queue-{i}'} for i in range(15)]
        auditor._add_finding('Test', 'Many Resources', 'high', resources, 'test')

        auditor._generate_console_report()

        # Check that "... and X more" was printed
        printed_output = ' '.join(str(call) for call in mock_print.call_args_list)
        assert '5 more' in printed_output

    @patch('analyse.boto3.client')
    @patch('builtins.print')
    def test_console_report_no_findings(self, mock_print, mock_boto_client):
        """Test console report handles no findings gracefully"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()
        auditor._generate_console_report()

        printed_output = ' '.join(str(call) for call in mock_print.call_args_list)
        assert 'No findings detected' in printed_output

    # =========================================================================
    # EDGE CASE TESTS
    # =========================================================================

    @patch('analyse.boto3.client')
    def test_check_dlq_retention_gap_no_dlq_found(self, mock_boto_client):
        """Test _check_dlq_retention_gap when DLQ ARN not in queue list"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/orders',
                'QueueName': 'orders',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:orders',
                'Attributes': {
                    'MessageRetentionPeriod': '345600',
                    'RedrivePolicy': json.dumps({
                        'deadLetterTargetArn': 'arn:aws:sqs:us-east-1:123456789:nonexistent-dlq',
                        'maxReceiveCount': 3
                    })
                },
                'Tags': {}
            }
        ]

        auditor._check_dlq_retention_gap(queues)

        # Should not find any gap since DLQ doesn't exist in queue list
        gap_findings = [f for category in auditor.findings.values()
                       for f in category if f['check'] == 'DLQ Retention Gap']
        assert len(gap_findings) == 0

    @patch('analyse.boto3.client')
    def test_visibility_timeout_normal_range(self, mock_boto_client):
        """Test _check_visibility_timeout_issues passes normal timeout values"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/normal-queue',
                'QueueName': 'normal-queue',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:normal-queue',
                'Attributes': {'VisibilityTimeout': '300'},  # 5 minutes - normal
                'Tags': {}
            }
        ]

        auditor._check_visibility_timeout_issues(queues)

        timeout_findings = [f for category in auditor.findings.values()
                          for f in category if 'Visibility Timeout' in f['check']]
        assert len(timeout_findings) == 0

    @patch('analyse.boto3.client')
    def test_fifo_deduplication_enabled(self, mock_boto_client):
        """Test _check_fifo_deduplication passes when dedup is enabled"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/orders.fifo',
                'QueueName': 'orders.fifo',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:orders.fifo',
                'Attributes': {'ContentBasedDeduplication': 'true'},
                'Tags': {}
            }
        ]

        auditor._check_fifo_deduplication(queues)

        fifo_findings = [f for category in auditor.findings.values()
                        for f in category if f['check'] == 'FIFO Deduplication Disabled']
        assert len(fifo_findings) == 0

    @patch('analyse.boto3.client')
    def test_sns_subscription_with_filter_policy(self, mock_boto_client):
        """Test _check_sns_subscriptions passes subscriptions with filter policies"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        topics = [
            {
                'TopicArn': 'arn:aws:sns:us-east-1:123456789:orders-topic',
                'TopicName': 'orders-topic',
                'Attributes': {},
                'Tags': {},
                'Subscriptions': [
                    {
                        'SubscriptionArn': 'arn:aws:sns:us-east-1:123456789:orders-topic:sub1',
                        'Protocol': 'sqs',
                        'Endpoint': 'arn:aws:sqs:us-east-1:123456789:orders-queue',
                        'Attributes': {'FilterPolicy': '{"type": ["order"]}'}
                    }
                ]
            }
        ]

        auditor._check_sns_subscriptions(topics)

        filter_findings = [f for category in auditor.findings.values()
                         for f in category if f['check'] == 'Missing Subscription Filters']
        assert len(filter_findings) == 0

    @patch('analyse.boto3.client')
    def test_unencrypted_non_confidential_queue(self, mock_boto_client):
        """Test _check_unencrypted_sensitive_queues ignores non-confidential queues"""
        mock_sqs = MagicMock()
        mock_sns = MagicMock()
        mock_boto_client.side_effect = [mock_sqs, mock_sns]

        auditor = SNSSQSAuditor()

        queues = [
            {
                'QueueUrl': 'https://sqs.us-east-1.amazonaws.com/123456789/public-queue',
                'QueueName': 'public-queue',
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:public-queue',
                'Attributes': {},
                'Tags': {'DataClassification': 'Public'}  # Not confidential
            }
        ]

        auditor._check_unencrypted_sensitive_queues(queues)

        security_findings = [f for category in auditor.findings.values()
                           for f in category if f['check'] == 'Unencrypted Sensitive Queues']
        assert len(security_findings) == 0
