import boto3
import json
import os
from datetime import datetime, timezone
from typing import Dict, List, Any

iam = boto3.client('iam')
cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')

SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN', '')
PROJECT_NAME = os.environ.get('PROJECT_NAME', 'zero-trust-iam')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda function to check and revoke time-based access grants.

    This function:
    1. Scans for IAM policies with time-based conditions
    2. Checks if any temporary access grants have expired
    3. Detaches expired policies from roles/users
    4. Sends notifications for revoked access
    """

    print(f"Starting access expiration check at {datetime.now(timezone.utc)}")

    revoked_count = 0
    errors = []

    try:
        # Get all customer-managed policies
        policies = get_customer_managed_policies()
        print(f"Found {len(policies)} customer-managed policies to check")

        # Check each policy for time-based conditions
        for policy in policies:
            try:
                # Get policy details
                policy_arn = policy['Arn']
                policy_name = policy['PolicyName']

                # Get policy version
                policy_version = iam.get_policy_version(
                    PolicyArn=policy_arn,
                    VersionId=policy['DefaultVersionId']
                )

                policy_document = policy_version['PolicyVersion']['Document']

                # Check if policy has expired time-based conditions
                if is_policy_expired(policy_document):
                    print(f"Policy {policy_name} has expired - revoking access")

                    # Detach from all attached entities
                    detached = detach_policy_from_all(policy_arn, policy_name)
                    revoked_count += detached

            except Exception as e:
                error_msg = f"Error processing policy {policy.get('PolicyName', 'Unknown')}: {str(e)}"
                print(error_msg)
                errors.append(error_msg)

        # Send summary notification
        if revoked_count > 0 or errors:
            send_notification(revoked_count, errors)

        # Publish CloudWatch metric
        publish_metric('AccessRevocations', revoked_count)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Access expiration check completed',
                'revoked_count': revoked_count,
                'errors': len(errors)
            })
        }

    except Exception as e:
        print(f"Fatal error in access expiration check: {str(e)}")
        raise


def get_customer_managed_policies() -> List[Dict[str, Any]]:
    """Get all customer-managed policies."""
    policies = []
    marker = None

    while True:
        if marker:
            response = iam.list_policies(Scope='Local', Marker=marker, MaxItems=100)
        else:
            response = iam.list_policies(Scope='Local', MaxItems=100)

        policies.extend(response['Policies'])

        if response['IsTruncated']:
            marker = response['Marker']
        else:
            break

    return policies


def is_policy_expired(policy_document: Dict[str, Any]) -> bool:
    """Check if policy has expired based on time conditions."""

    if 'Statement' not in policy_document:
        return False

    current_time = datetime.now(timezone.utc)

    for statement in policy_document['Statement']:
        if 'Condition' not in statement:
            continue

        condition = statement['Condition']

        # Check for DateLessThan condition (expiration time)
        if 'DateLessThan' in condition:
            for key, value in condition['DateLessThan'].items():
                if 'aws:CurrentTime' in key:
                    expiration_time = datetime.fromisoformat(value.replace('Z', '+00:00'))
                    if current_time >= expiration_time:
                        print(f"Policy expired: {current_time} >= {expiration_time}")
                        return True

        # Check for custom expiration tags
        if 'StringEquals' in condition:
            for key, value in condition['StringEquals'].items():
                if 'ExpirationDate' in key:
                    try:
                        expiration_time = datetime.fromisoformat(value.replace('Z', '+00:00'))
                        if current_time >= expiration_time:
                            return True
                    except ValueError:
                        pass

    return False


def detach_policy_from_all(policy_arn: str, policy_name: str) -> int:
    """Detach policy from all attached users, groups, and roles."""

    detached_count = 0

    # Detach from users
    try:
        users_response = iam.list_entities_for_policy(
            PolicyArn=policy_arn,
            EntityFilter='User'
        )

        for user in users_response.get('PolicyUsers', []):
            iam.detach_user_policy(
                UserName=user['UserName'],
                PolicyArn=policy_arn
            )
            print(f"Detached policy {policy_name} from user {user['UserName']}")
            detached_count += 1
    except Exception as e:
        print(f"Error detaching from users: {str(e)}")

    # Detach from groups
    try:
        groups_response = iam.list_entities_for_policy(
            PolicyArn=policy_arn,
            EntityFilter='Group'
        )

        for group in groups_response.get('PolicyGroups', []):
            iam.detach_group_policy(
                GroupName=group['GroupName'],
                PolicyArn=policy_arn
            )
            print(f"Detached policy {policy_name} from group {group['GroupName']}")
            detached_count += 1
    except Exception as e:
        print(f"Error detaching from groups: {str(e)}")

    # Detach from roles
    try:
        roles_response = iam.list_entities_for_policy(
            PolicyArn=policy_arn,
            EntityFilter='Role'
        )

        for role in roles_response.get('PolicyRoles', []):
            iam.detach_role_policy(
                RoleName=role['RoleName'],
                PolicyArn=policy_arn
            )
            print(f"Detached policy {policy_name} from role {role['RoleName']}")
            detached_count += 1
    except Exception as e:
        print(f"Error detaching from roles: {str(e)}")

    return detached_count


def send_notification(revoked_count: int, errors: List[str]) -> None:
    """Send SNS notification about access revocations."""

    if not SNS_TOPIC_ARN:
        print("No SNS topic configured, skipping notification")
        return

    subject = f"IAM Access Expiration Report - {revoked_count} policies revoked"

    message = f"""
IAM Access Expiration Check Completed

Time: {datetime.now(timezone.utc).isoformat()}
Revoked Policies: {revoked_count}
Errors: {len(errors)}

"""

    if errors:
        message += "\nErrors:\n"
        for error in errors:
            message += f"- {error}\n"

    try:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )
        print(f"Notification sent to {SNS_TOPIC_ARN}")
    except Exception as e:
        print(f"Error sending notification: {str(e)}")


def publish_metric(metric_name: str, value: float) -> None:
    """Publish custom CloudWatch metric."""

    try:
        cloudwatch.put_metric_data(
            Namespace=f'{PROJECT_NAME}/Security',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': 'Count',
                    'Timestamp': datetime.now(timezone.utc)
                }
            ]
        )
        print(f"Published metric {metric_name}: {value}")
    except Exception as e:
        print(f"Error publishing metric: {str(e)}")
