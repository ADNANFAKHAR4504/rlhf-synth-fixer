Here's the production-ready implementation with professional output formatting and comprehensive analysis capabilities:

## lib/analyse.py

```python
#!/usr/bin/env python3
"""
Lambda Configuration Analysis Tool

Analyzes AWS Lambda functions for cost optimization and security issues.
"""

import json
import argparse
import sys
from datetime import datetime, timezone
from typing import Dict, List
from collections import defaultdict

import boto3
from botocore.exceptions import ClientError
from tabulate import tabulate


class LambdaAnalyzer:
    """Analyzes Lambda functions for configuration issues."""

    # Deprecated runtimes as of 2024
    DEPRECATED_RUNTIMES = {
        'python2.7', 'python3.6', 'python3.7', 'python3.8',
        'nodejs', 'nodejs4.3', 'nodejs6.10', 'nodejs8.10', 'nodejs10.x', 'nodejs12.x', 'nodejs14.x',
        'ruby2.5', 'ruby2.7',
        'java8',
        'go1.x',
        'dotnetcore2.1', 'dotnetcore3.1'
    }

    def __init__(self, region: str = 'us-east-1'):
        """Initialize the analyzer with AWS clients."""
        self.region = region
        self.lambda_client = boto3.client('lambda', region_name=region)
        self.ec2_client = boto3.client('ec2', region_name=region)
        self.issues = defaultdict(list)

    def analyze_all_functions(self) -> Dict[str, List[Dict]]:
        """Analyze all Lambda functions and return categorized issues."""
        print(f"Analyzing Lambda functions in {self.region}...")

        # Get all functions
        functions = self._list_all_functions()
        print(f"Found {len(functions)} functions total")
        print(f"Analyzing {len(functions)} functions")

        # Analyze each function
        for func in functions:
            self._analyze_function(func)

        return dict(self.issues)

    def _list_all_functions(self) -> List[Dict]:
        """List all Lambda functions with pagination."""
        functions = []
        paginator = self.lambda_client.get_paginator('list_functions')

        for page in paginator.paginate():
            functions.extend(page['Functions'])

        return functions

    def _analyze_function(self, func: Dict) -> None:
        """Analyze a single function for all issue types."""
        func_name = func['FunctionName']

        # Check for over-provisioned functions
        if self._is_over_provisioned(func):
            self.issues['Over-Provisioned'].append({
                'FunctionName': func_name,
                'MemorySize': func['MemorySize'],
                'Timeout': func['Timeout'],
                'Runtime': func['Runtime']
            })

        # Check for unencrypted environment variables
        if self._has_unencrypted_env_vars(func):
            self.issues['Unencrypted Environment Variables'].append({
                'FunctionName': func_name,
                'EnvironmentVariableCount': len(func.get('Environment', {}).get('Variables', {})),
                'Runtime': func['Runtime']
            })

        # Check for risky VPC access
        risky_sg = self._check_vpc_security(func)
        if risky_sg:
            self.issues['Risky VPC Access'].append({
                'FunctionName': func_name,
                'VpcId': func['VpcConfig']['VpcId'],
                'SecurityGroups': risky_sg,
                'Runtime': func['Runtime']
            })

        # Check for old runtimes
        if self._has_deprecated_runtime(func):
            self.issues['Deprecated Runtime'].append({
                'FunctionName': func_name,
                'Runtime': func['Runtime'],
                'LastModified': func['LastModified']
            })

    def _is_over_provisioned(self, func: Dict) -> bool:
        """Check if function is over-provisioned (>3GB memory, <30s timeout)."""
        return func['MemorySize'] > 3072 and func['Timeout'] < 30

    def _has_unencrypted_env_vars(self, func: Dict) -> bool:
        """Check if function has environment variables without KMS encryption."""
        env_vars = func.get('Environment', {}).get('Variables', {})
        kms_key = func.get('KMSKeyArn')

        return bool(env_vars) and not kms_key

    def _check_vpc_security(self, func: Dict) -> List[str]:
        """Check VPC security groups for risky outbound rules."""
        vpc_config = func.get('VpcConfig', {})
        security_group_ids = vpc_config.get('SecurityGroupIds', [])

        if not security_group_ids:
            return []

        risky_groups = []

        try:
            response = self.ec2_client.describe_security_groups(
                GroupIds=security_group_ids
            )

            for sg in response['SecurityGroups']:
                for rule in sg.get('IpPermissionsEgress', []):
                    # Check for all traffic to anywhere
                    if (rule.get('IpProtocol') == '-1' and  # All protocols
                        any(ip_range.get('CidrIp') == '0.0.0.0/0'
                            for ip_range in rule.get('IpRanges', []))):
                        risky_groups.append(sg['GroupId'])
                        break

        except ClientError as e:
            print(f"Warning: Could not check security groups for {func['FunctionName']}: {e}")

        return risky_groups

    def _has_deprecated_runtime(self, func: Dict) -> bool:
        """Check if function uses a deprecated runtime."""
        return func['Runtime'] in self.DEPRECATED_RUNTIMES


class ReportGenerator:
    """Generates reports from analysis results."""

    @staticmethod
    def print_console_report(issues: Dict[str, List[Dict]]) -> None:
        """Print a formatted console report using tabulate."""
        print("\n" + "="*80)
        print("Lambda Configuration Analysis Report")
        print("="*80)

        if not any(issues.values()):
            print("\nNo issues found!")
            return

        total_issues = sum(len(items) for items in issues.values())
        print(f"\nFound {total_issues} issues across {len(issues)} categories\n")

        for issue_type, functions in issues.items():
            if not functions:
                continue

            print(f"\n{issue_type} ({len(functions)} functions)")
            print("-" * 80)

            # Prepare table data based on issue type
            if issue_type == 'Over-Provisioned':
                headers = ['Function Name', 'Memory (MB)', 'Timeout (s)', 'Runtime']
                table_data = [
                    [func['FunctionName'], func['MemorySize'], func['Timeout'], func['Runtime']]
                    for func in functions
                ]
            elif issue_type == 'Unencrypted Environment Variables':
                headers = ['Function Name', 'Env Var Count', 'Runtime']
                table_data = [
                    [func['FunctionName'], func['EnvironmentVariableCount'], func['Runtime']]
                    for func in functions
                ]
            elif issue_type == 'Risky VPC Access':
                headers = ['Function Name', 'VPC ID', 'Risky Security Groups', 'Runtime']
                table_data = [
                    [func['FunctionName'], func['VpcId'], ', '.join(func['SecurityGroups']), func['Runtime']]
                    for func in functions
                ]
            elif issue_type == 'Deprecated Runtime':
                headers = ['Function Name', 'Runtime', 'Last Modified']
                table_data = [
                    [func['FunctionName'], func['Runtime'], func['LastModified'][:19]]
                    for func in functions
                ]
            else:
                # Fallback for unknown issue types
                headers = ['Function Name', 'Details']
                table_data = [[func.get('FunctionName', 'N/A'), str(func)] for func in functions]

            # Print table using tabulate with grid format
            print(tabulate(table_data, headers=headers, tablefmt='grid'))

        print("\n" + "="*80)

    @staticmethod
    def save_json_report(issues: Dict[str, List[Dict]], region: str, filename: str = "lambda_config_report.json") -> None:
        """Save analysis results to JSON file."""
        report = {
            'analysis_timestamp': datetime.now(timezone.utc).isoformat(),
            'region': region,
            'issues': issues,
            'summary': {
                'total_issues': sum(len(items) for items in issues.values()),
                'issues_by_type': {k: len(v) for k, v in issues.items()}
            }
        }

        with open(filename, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        print(f"\nDetailed report saved to: {filename}")


def main():
    """Main entry point for the CLI tool."""
    parser = argparse.ArgumentParser(
        description='Analyze AWS Lambda functions for configuration issues',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                    # Run analysis in us-east-1
  %(prog)s --region us-west-2 # Run analysis in a different region
  %(prog)s --output report.json # Save to custom filename
        """
    )

    parser.add_argument(
        '--region',
        default='us-east-1',
        help='AWS region to analyze (default: us-east-1)'
    )

    parser.add_argument(
        '--output',
        default='lambda_config_report.json',
        help='Output JSON filename (default: lambda_config_report.json)'
    )

    args = parser.parse_args()

    try:
        # Create analyzer and run analysis
        analyzer = LambdaAnalyzer(region=args.region)
        issues = analyzer.analyze_all_functions()

        # Generate reports
        ReportGenerator.print_console_report(issues)
        ReportGenerator.save_json_report(issues, args.region, args.output)

        # Exit with error code if issues found
        if any(issues.values()):
            sys.exit(1)
        else:
            sys.exit(0)

    except ClientError as e:
        print(f"\nAWS API Error: {e}", file=sys.stderr)
        sys.exit(2)
    except Exception as e:
        print(f"\nUnexpected error: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    main()

```
