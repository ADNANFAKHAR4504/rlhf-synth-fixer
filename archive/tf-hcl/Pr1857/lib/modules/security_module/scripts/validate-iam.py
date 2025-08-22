#!/usr/bin/env python3
"""
IAM Policy Validator Script
Validates IAM policies to ensure they follow least privilege principles
and don't contain overly permissive configurations.
"""

import argparse
import boto3
import json
import sys
import re
from botocore.exceptions import ClientError, NoCredentialsError
from typing import List, Dict, Any, Tuple


class IAMValidator:
    def __init__(self):
        try:
            self.iam_client = boto3.client('iam')
            self.sts_client = boto3.client('sts')
        except NoCredentialsError:
            print("ERROR: AWS credentials not configured")
            sys.exit(1)
    
    def get_policy_document(self, policy_arn: str) -> Dict[str, Any]:
        """Retrieve and parse IAM policy document"""
        try:
            response = self.iam_client.get_policy(PolicyArn=policy_arn)
            version_id = response['Policy']['DefaultVersionId']
            
            policy_version = self.iam_client.get_policy_version(
                PolicyArn=policy_arn,
                VersionId=version_id
            )
            
            return policy_version['PolicyVersion']['Document']
        except ClientError as e:
            print(f"ERROR: Failed to retrieve policy {policy_arn}: {e}")
            return {}
    
    def check_wildcard_resources(self, statements: List[Dict]) -> List[str]:
        """Check for wildcard resources that might be overly permissive"""
        issues = []
        
        for i, statement in enumerate(statements):
            if statement.get('Effect') != 'Allow':
                continue
                
            resources = statement.get('Resource', [])
            if isinstance(resources, str):
                resources = [resources]
            
            for resource in resources:
                if resource == '*':
                    actions = statement.get('Action', [])
                    if isinstance(actions, str):
                        actions = [actions]
                    
                    # Check for dangerous actions with wildcard resources
                    dangerous_actions = [
                        's3:*', 'iam:*', 'ec2:*', 'rds:*', 'kms:*',
                        '*:*', 'sts:AssumeRole'
                    ]
                    
                    for action in actions:
                        if any(danger in action for danger in dangerous_actions):
                            issues.append(
                                f"Statement {i+1}: Dangerous action '{action}' "
                                f"with wildcard resource '*'"
                            )
        
        return issues
    
    def check_wildcard_actions(self, statements: List[Dict]) -> List[str]:
        """Check for overly broad action permissions"""
        issues = []
        
        for i, statement in enumerate(statements):
            if statement.get('Effect') != 'Allow':
                continue
                
            actions = statement.get('Action', [])
            if isinstance(actions, str):
                actions = [actions]
            
            # Check for overly broad actions
            broad_actions = ['*', 's3:*', 'iam:*', 'ec2:*', 'rds:*', 'kms:*']
            
            for action in actions:
                if action in broad_actions:
                    issues.append(
                        f"Statement {i+1}: Overly broad action permission '{action}'"
                    )
        
        return issues
    
    def check_missing_conditions(self, statements: List[Dict]) -> List[str]:
        """Check for statements that should have conditions but don't"""
        issues = []
        
        for i, statement in enumerate(statements):
            if statement.get('Effect') != 'Allow':
                continue
            
            actions = statement.get('Action', [])
            if isinstance(actions, str):
                actions = [actions]
            
            # Actions that should typically have conditions
            condition_required_actions = [
                's3:GetObject', 's3:PutObject', 's3:DeleteObject',
                'kms:Decrypt', 'kms:Encrypt', 'sts:AssumeRole'
            ]
            
            has_sensitive_action = any(
                any(req_action in action for req_action in condition_required_actions)
                for action in actions
            )
            
            if has_sensitive_action and 'Condition' not in statement:
                # Exception for very specific resource ARNs
                resources = statement.get('Resource', [])
                if isinstance(resources, str):
                    resources = [resources]
                
                # If resources are very specific, conditions might not be needed
                has_specific_resources = all(
                    '/*' not in resource and '*' != resource 
                    for resource in resources
                )
                
                if not has_specific_resources:
                    issues.append(
                        f"Statement {i+1}: Sensitive actions without conditions. "
                        f"Consider adding conditions for better security."
                    )
        
        return issues
    
    def check_principal_wildcards(self, statements: List[Dict]) -> List[str]:
        """Check for wildcard principals in trust policies"""
        issues = []
        
        for i, statement in enumerate(statements):
            if statement.get('Effect') != 'Allow':
                continue
            
            principal = statement.get('Principal', {})
            
            # Check for wildcard principals
            if principal == '*':
                issues.append(
                    f"Statement {i+1}: Wildcard principal '*' allows anyone to assume role"
                )
            elif isinstance(principal, dict):
                for key, value in principal.items():
                    if isinstance(value, str) and value == '*':
                        issues.append(
                            f"Statement {i+1}: Wildcard principal in {key}: '*'"
                        )
                    elif isinstance(value, list) and '*' in value:
                        issues.append(
                            f"Statement {i+1}: Wildcard principal in {key}: contains '*'"
                        )
        
        return issues
    
    def check_resource_patterns(self, statements: List[Dict]) -> List[str]:
        """Check for suspicious resource patterns"""
        issues = []
        
        for i, statement in enumerate(statements):
            if statement.get('Effect') != 'Allow':
                continue
            
            resources = statement.get('Resource', [])
            if isinstance(resources, str):
                resources = [resources]
            
            for resource in resources:
                # Check for very broad S3 resources
                if 's3:::' in resource and resource.endswith('/*'):
                    bucket_name = resource.split(':::')[1].split('/')[0]
                    if '*' in bucket_name:
                        issues.append(
                            f"Statement {i+1}: S3 resource with wildcard bucket name: {resource}"
                        )
                
                # Check for root account access
                if ':root' in resource:
                    issues.append(
                        f"Statement {i+1}: Direct root account access in resource: {resource}"
                    )
        
        return issues
    
    def validate_policy(self, policy_arn: str) -> Tuple[bool, List[str]]:
        """Validate a single IAM policy"""
        print(f"\nValidating policy: {policy_arn}")
        
        policy_doc = self.get_policy_document(policy_arn)
        if not policy_doc:
            return False, [f"Failed to retrieve policy document for {policy_arn}"]
        
        statements = policy_doc.get('Statement', [])
        if not statements:
            return True, ["Policy has no statements"]
        
        all_issues = []
        
        # Run all validation checks
        all_issues.extend(self.check_wildcard_resources(statements))
        all_issues.extend(self.check_wildcard_actions(statements))
        all_issues.extend(self.check_missing_conditions(statements))
        all_issues.extend(self.check_principal_wildcards(statements))
        all_issues.extend(self.check_resource_patterns(statements))
        
        # Additional check for common misconfigurations
        policy_text = json.dumps(policy_doc, indent=2)
        
        # Check for common typos that could be security issues
        if 'ws_s3_bucket' in policy_text:
            all_issues.append("Potential typo: 'ws_s3_bucket' found (should be 'aws_s3_bucket'?)")
        
        return len(all_issues) == 0, all_issues
    
    def validate_all_policies(self, policy_arns: List[str]) -> bool:
        """Validate multiple IAM policies"""
        all_passed = True
        total_issues = 0
        
        print("=" * 60)
        print("IAM POLICY VALIDATION REPORT")
        print("=" * 60)
        
        for policy_arn in policy_arns:
            passed, issues = self.validate_policy(policy_arn)
            
            if passed:
                print(f"✅ PASSED: {policy_arn}")
            else:
                print(f"❌ FAILED: {policy_arn}")
                all_passed = False
                
                for issue in issues:
                    print(f"   - {issue}")
                    total_issues += 1
        
        print("\n" + "=" * 60)
        print("VALIDATION SUMMARY")
        print("=" * 60)
        
        if all_passed:
            print("✅ All policies passed validation!")
            print("No overly permissive policies detected.")
        else:
            print(f"❌ Validation failed with {total_issues} issues found.")
            print("Please review and fix the identified security issues.")
        
        return all_passed


def main():
    parser = argparse.ArgumentParser(
        description="Validate IAM policies for overly permissive configurations"
    )
    parser.add_argument(
        '--policy-arn',
        action='append',
        required=True,
        help='IAM policy ARN to validate (can be specified multiple times)'
    )
    parser.add_argument(
        '--strict',
        action='store_true',
        help='Enable strict validation mode (treat warnings as errors)'
    )
    parser.add_argument(
        '--output-format',
        choices=['text', 'json'],
        default='text',
        help='Output format (default: text)'
    )
    
    args = parser.parse_args()
    
    try:
        validator = IAMValidator()
        success = validator.validate_all_policies(args.policy_arn)
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)
        
    except Exception as e:
        print(f"ERROR: Validation failed with exception: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()