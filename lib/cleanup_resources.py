#!/usr/bin/env python3
"""
Cleanup Orphaned AWS Resources

This script removes orphaned AWS resources from previous failed deployments.
It's designed to be run before CDKTF deployment to ensure a clean slate.
"""

import os
import sys
import boto3
from botocore.exceptions import ClientError

# Configuration
ENVIRONMENT_SUFFIX = os.getenv("ENVIRONMENT_SUFFIX", "pr7292")
REGIONS = ["us-east-1", "us-west-2", "eu-west-1"]


def delete_log_group(logs_client, log_group_name, region):
    """Delete CloudWatch Log Group if it exists."""
    try:
        logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)
        response = logs_client.describe_log_groups(logGroupNamePrefix=log_group_name)

        # Check if exact match exists
        for group in response.get('logGroups', []):
            if group['logGroupName'] == log_group_name:
                print(f"  Deleting log group: {log_group_name} in {region}")
                logs_client.delete_log_group(logGroupName=log_group_name)
                print(f"  ✓ Deleted log group: {log_group_name}")
                return

        print(f"  ℹ️  Log group not found: {log_group_name}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"  ℹ️  Log group not found: {log_group_name}")
        else:
            print(f"  ⚠️  Error checking log group: {e}")


def delete_iam_role(iam_client, role_name):
    """Delete IAM Role and its attached policies."""
    try:
        # Check if role exists
        iam_client.get_role(RoleName=role_name)
        print(f"  Deleting IAM role: {role_name}")

        # Detach managed policies
        try:
            attached_policies = iam_client.list_attached_role_policies(RoleName=role_name)
            for policy in attached_policies.get('AttachedPolicies', []):
                print(f"    Detaching managed policy: {policy['PolicyArn']}")
                iam_client.detach_role_policy(
                    RoleName=role_name,
                    PolicyArn=policy['PolicyArn']
                )
        except ClientError:
            pass

        # Delete inline policies
        try:
            inline_policies = iam_client.list_role_policies(RoleName=role_name)
            for policy_name in inline_policies.get('PolicyNames', []):
                print(f"    Deleting inline policy: {policy_name}")
                iam_client.delete_role_policy(
                    RoleName=role_name,
                    PolicyName=policy_name
                )
        except ClientError:
            pass

        # Delete the role
        iam_client.delete_role(RoleName=role_name)
        print(f"  ✓ Deleted IAM role: {role_name}")

    except ClientError as e:
        if e.response['Error']['Code'] == 'NoSuchEntity':
            print(f"  ℹ️  IAM role not found: {role_name}")
        else:
            print(f"  ⚠️  Error deleting IAM role: {e}")


def delete_kms_alias(kms_client, alias_name):
    """Delete KMS Alias if it exists."""
    try:
        # Check if alias exists
        kms_client.describe_key(KeyId=alias_name)
        print(f"  Deleting KMS alias: {alias_name}")
        kms_client.delete_alias(AliasName=alias_name)
        print(f"  ✓ Deleted KMS alias: {alias_name}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'NotFoundException':
            print(f"  ℹ️  KMS alias not found: {alias_name}")
        else:
            print(f"  ⚠️  Error deleting KMS alias: {e}")


def delete_s3_bucket(s3_client, bucket_name, region):
    """Delete S3 Bucket and all its contents."""
    try:
        # Check if bucket exists
        s3_client.head_bucket(Bucket=bucket_name)
        print(f"  Deleting S3 bucket: {bucket_name} in {region}")

        # Empty the bucket first
        try:
            # Delete all objects
            paginator = s3_client.get_paginator('list_object_versions')
            for page in paginator.paginate(Bucket=bucket_name):
                objects_to_delete = []

                # Add versions
                for version in page.get('Versions', []):
                    objects_to_delete.append({
                        'Key': version['Key'],
                        'VersionId': version['VersionId']
                    })

                # Add delete markers
                for marker in page.get('DeleteMarkers', []):
                    objects_to_delete.append({
                        'Key': marker['Key'],
                        'VersionId': marker['VersionId']
                    })

                # Delete in batches
                if objects_to_delete:
                    print(f"    Deleting {len(objects_to_delete)} objects/versions...")
                    s3_client.delete_objects(
                        Bucket=bucket_name,
                        Delete={'Objects': objects_to_delete}
                    )
        except ClientError as e:
            print(f"    ⚠️  Error emptying bucket: {e}")

        # Delete the bucket
        s3_client.delete_bucket(Bucket=bucket_name)
        print(f"  ✓ Deleted S3 bucket: {bucket_name}")

    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            print(f"  ℹ️  S3 bucket not found: {bucket_name}")
        elif e.response['Error']['Code'] == 'NoSuchBucket':
            print(f"  ℹ️  S3 bucket not found: {bucket_name}")
        else:
            print(f"  ⚠️  Error deleting S3 bucket: {e}")


def delete_lambda_function(lambda_client, function_name, region):
    """Delete Lambda Function if it exists."""
    try:
        lambda_client.get_function(FunctionName=function_name)
        print(f"  Deleting Lambda function: {function_name} in {region}")
        lambda_client.delete_function(FunctionName=function_name)
        print(f"  ✓ Deleted Lambda function: {function_name}")
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print(f"  ℹ️  Lambda function not found: {function_name}")
        else:
            print(f"  ⚠️  Error deleting Lambda function: {e}")


def main():
    """Main cleanup function."""
    print("🧹 Cleaning up orphaned AWS resources")
    print("=" * 60)
    print(f"Environment: {ENVIRONMENT_SUFFIX}")
    print(f"Regions: {', '.join(REGIONS)}")
    print("=" * 60)
    print()

    # 1. Delete CloudWatch Log Groups
    print("1️⃣  Cleaning up CloudWatch Log Groups...")
    print("-" * 60)

    # Primary region log group for Lambda
    logs_client_primary = boto3.client('logs', region_name='us-east-1')
    delete_log_group(
        logs_client_primary,
        f"/aws/lambda/config-remediation-{ENVIRONMENT_SUFFIX}",
        "us-east-1"
    )

    # Regional log groups
    for region in REGIONS:
        logs_client = boto3.client('logs', region_name=region)
        delete_log_group(
            logs_client,
            f"/aws/config/{region}-{ENVIRONMENT_SUFFIX}",
            region
        )

    print()

    # 2. Delete Lambda Functions (before IAM roles)
    print("2️⃣  Cleaning up Lambda Functions...")
    print("-" * 60)
    lambda_client = boto3.client('lambda', region_name='us-east-1')
    delete_lambda_function(
        lambda_client,
        f"s3-versioning-remediation-{ENVIRONMENT_SUFFIX}",
        "us-east-1"
    )
    delete_lambda_function(
        lambda_client,
        f"s3-encryption-remediation-{ENVIRONMENT_SUFFIX}",
        "us-east-1"
    )
    print()

    # 3. Delete IAM Roles
    print("3️⃣  Cleaning up IAM Roles...")
    print("-" * 60)
    iam_client = boto3.client('iam')

    # Lambda role
    delete_iam_role(iam_client, f"lambda-remediation-role-{ENVIRONMENT_SUFFIX}")

    # Config roles per region
    for region in REGIONS:
        delete_iam_role(iam_client, f"config-role-{region}-{ENVIRONMENT_SUFFIX}")

    print()

    # 4. Delete KMS Alias
    print("4️⃣  Cleaning up KMS Alias...")
    print("-" * 60)
    kms_client = boto3.client('kms', region_name='us-east-1')
    delete_kms_alias(kms_client, f"alias/config-key-{ENVIRONMENT_SUFFIX}")
    print()

    # 5. Delete S3 Buckets
    print("5️⃣  Cleaning up S3 Buckets...")
    print("-" * 60)
    for region in REGIONS:
        s3_client = boto3.client('s3', region_name=region)
        delete_s3_bucket(
            s3_client,
            f"config-bucket-{region}-{ENVIRONMENT_SUFFIX}",
            region
        )

    print()
    print("=" * 60)
    print("✅ Cleanup completed successfully!")
    print()
    print("Resources cleaned for:", ENVIRONMENT_SUFFIX)
    print("Regions processed:", ", ".join(REGIONS))
    print()
    print("You can now proceed with deployment.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Cleanup failed with error: {e}", file=sys.stderr)
        sys.exit(1)
