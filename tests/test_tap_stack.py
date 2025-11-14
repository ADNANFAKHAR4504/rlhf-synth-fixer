"""
Unit tests for TapStack component.
"""

import os
import unittest
from unittest.mock import Mock, patch, MagicMock
import pulumi


class TestTapStack(unittest.TestCase):
    """Test cases for TapStack."""

    @pulumi.runtime.test
    def test_tap_stack_creation(self):
        """Test that TapStack can be instantiated."""
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs(
            environment_suffix='test',
            member_account_ids=['123456789012', '234567890123', '345678901234'],
            alert_email='test@example.com',
            jira_url='https://test.atlassian.net',
            jira_api_token='test-token'
        )

        stack = TapStack('test-stack', args)
        self.assertIsNotNone(stack)
        self.assertEqual(stack.environment_suffix, 'test')

    @pulumi.runtime.test
    def test_tap_stack_with_defaults(self):
        """Test TapStack with default arguments."""
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

        from lib.tap_stack import TapStack, TapStackArgs

        args = TapStackArgs()
        stack = TapStack('test-stack-defaults', args)

        self.assertEqual(stack.environment_suffix, 'dev')
        self.assertEqual(len(stack.member_account_ids), 0)

    def test_tap_stack_args(self):
        """Test TapStackArgs initialization."""
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

        from lib.tap_stack import TapStackArgs

        args = TapStackArgs(
            environment_suffix='prod',
            member_account_ids=['111111111111'],
            alert_email='ops@company.com'
        )

        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(len(args.member_account_ids), 1)
        self.assertEqual(args.alert_email, 'ops@company.com')


class TestLambdaHandler(unittest.TestCase):
    """Test cases for Lambda handler."""

    def test_jira_ticket_creator(self):
        """Test JiraTicketCreator class."""
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

        from lib.lambda_functions.jira_handler import JiraTicketCreator

        creator = JiraTicketCreator('https://test.atlassian.net', 'test-token')
        self.assertEqual(creator.jira_url, 'https://test.atlassian.net')
        self.assertEqual(creator.jira_token, 'test-token')

    def test_format_description(self):
        """Test description formatting."""
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

        from lib.lambda_functions.jira_handler import JiraTicketCreator

        creator = JiraTicketCreator('https://test.atlassian.net', 'test-token')
        alarm_data = {
            'alarm_name': 'TestAlarm',
            'new_state': 'ALARM',
            'alarm_description': 'Test description',
            'reason': 'Test reason'
        }

        description = creator._format_description(alarm_data)
        self.assertIn('TestAlarm', description)
        self.assertIn('ALARM', description)

    def test_determine_priority(self):
        """Test priority determination."""
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

        from lib.lambda_functions.jira_handler import JiraTicketCreator

        creator = JiraTicketCreator('https://test.atlassian.net', 'test-token')

        # Test ALARM state
        priority = creator._determine_priority({'new_state': 'ALARM'})
        self.assertEqual(priority, 'High')

        # Test INSUFFICIENT_DATA state
        priority = creator._determine_priority({'new_state': 'INSUFFICIENT_DATA'})
        self.assertEqual(priority, 'Medium')

        # Test OK state
        priority = creator._determine_priority({'new_state': 'OK'})
        self.assertEqual(priority, 'Low')

    @patch.dict(os.environ, {'JIRA_URL': 'https://test.atlassian.net', 'JIRA_API_TOKEN': 'test-token'})
    def test_lambda_handler_missing_credentials(self):
        """Test Lambda handler with missing credentials."""
        import sys
        import os
        sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

        # Clear environment variables
        if 'JIRA_URL' in os.environ:
            del os.environ['JIRA_URL']
        if 'JIRA_API_TOKEN' in os.environ:
            del os.environ['JIRA_API_TOKEN']

        from lib.lambda_functions.jira_handler import handler

        event = {'Records': []}
        context = {}

        response = handler(event, context)
        self.assertEqual(response['statusCode'], 500)


if __name__ == '__main__':
    unittest.main()
