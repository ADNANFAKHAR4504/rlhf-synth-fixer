"""
Lambda handler for creating JIRA tickets from CloudWatch alarms.
This is a separate module for better testability.
"""

import json
import os
import urllib.request
import urllib.error
from base64 import b64encode
from typing import Dict, Any


class JiraTicketCreator:
    """Handles JIRA ticket creation from alarm events."""

    def __init__(self, jira_url: str, jira_token: str):
        self.jira_url = jira_url
        self.jira_token = jira_token

    def create_ticket(self, alarm_data: Dict[str, Any]) -> str:
        """
        Create a JIRA ticket for the given alarm.

        Args:
            alarm_data: Dictionary containing alarm information

        Returns:
            JIRA ticket key if successful

        Raises:
            Exception if ticket creation fails
        """
        ticket_data = {
            'fields': {
                'project': {'key': 'OPS'},
                'summary': f"CloudWatch Alarm: {alarm_data.get('alarm_name', 'Unknown')}",
                'description': self._format_description(alarm_data),
                'issuetype': {'name': 'Incident'},
                'priority': {'name': self._determine_priority(alarm_data)}
            }
        }

        auth_string = b64encode(f'api:{self.jira_token}'.encode()).decode()
        headers = {
            'Authorization': f'Basic {auth_string}',
            'Content-Type': 'application/json'
        }

        request = urllib.request.Request(
            f'{self.jira_url}/rest/api/2/issue',
            data=json.dumps(ticket_data).encode(),
            headers=headers,
            method='POST'
        )

        try:
            with urllib.request.urlopen(request, timeout=3) as response:
                result = json.loads(response.read().decode())
                return result.get('key', 'Unknown')
        except urllib.error.URLError as e:
            raise Exception(f"Failed to create JIRA ticket: {str(e)}")

    def _format_description(self, alarm_data: Dict[str, Any]) -> str:
        """Format alarm data into JIRA description."""
        return f'''
Alarm Details:
- Name: {alarm_data.get('alarm_name', 'Unknown')}
- State: {alarm_data.get('new_state', 'UNKNOWN')}
- Description: {alarm_data.get('alarm_description', 'No description')}
- Reason: {alarm_data.get('reason', 'No reason provided')}
- Timestamp: {alarm_data.get('timestamp', 'Unknown')}
- Region: {alarm_data.get('region', 'us-east-1')}

This ticket was automatically created by the observability platform.
'''

    def _determine_priority(self, alarm_data: Dict[str, Any]) -> str:
        """Determine JIRA priority based on alarm state."""
        state = alarm_data.get('new_state', '').upper()
        if state == 'ALARM':
            return 'High'
        elif state == 'INSUFFICIENT_DATA':
            return 'Medium'
        return 'Low'


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler function.

    Args:
        event: SNS event containing alarm notification
        context: Lambda context

    Returns:
        Response dictionary
    """
    print(f"Received event: {json.dumps(event)}")

    jira_url = os.environ.get('JIRA_URL')
    jira_token = os.environ.get('JIRA_API_TOKEN')

    if not jira_url or not jira_token:
        print("ERROR: JIRA credentials not configured")
        return {
            'statusCode': 500,
            'body': json.dumps('JIRA credentials not configured')
        }

    creator = JiraTicketCreator(jira_url, jira_token)
    tickets_created = []

    try:
        if 'Records' in event:
            for record in event['Records']:
                if record.get('EventSource') == 'aws:sns':
                    message = json.loads(record['Sns']['Message'])

                    alarm_data = {
                        'alarm_name': message.get('AlarmName', 'Unknown'),
                        'alarm_description': message.get('AlarmDescription', 'No description'),
                        'new_state': message.get('NewStateValue', 'UNKNOWN'),
                        'reason': message.get('NewStateReason', 'No reason provided'),
                        'timestamp': message.get('StateChangeTime', 'Unknown'),
                        'region': message.get('Region', 'us-east-1')
                    }

                    try:
                        ticket_key = creator.create_ticket(alarm_data)
                        tickets_created.append(ticket_key)
                        print(f"Successfully created JIRA ticket: {ticket_key}")
                    except Exception as e:
                        print(f"ERROR: Failed to create ticket: {str(e)}")
                        # Continue processing other records

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Processed alarm notifications',
                'tickets_created': tickets_created
            })
        }

    except Exception as e:
        print(f"ERROR: Exception processing event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error: {str(e)}')
        }
