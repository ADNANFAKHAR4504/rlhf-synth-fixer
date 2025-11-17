### Reasoning Trace

---

Alright, I need to create a Python script using Boto3 that analyzes Lambda functions for several security and cost issues. Let me break down the requirements:

1. Over-provisioned functions: Memory > 3GB AND Timeout < 30 seconds
2. Unencrypted environment variables: Has env vars but no KMS key
3. Risky VPC access: Attached to VPC with security groups having outbound 0.0.0.0/0 rules
4. Old runtimes: Deprecated runtime versions

Additional constraints:

- Only check functions created more than 30 days ago (using LastModified)
- Skip functions with tag ExcludeFromAnalysis=true
- Output both to console (tabular) and JSON file

I'll need to:

- List all Lambda functions
- Get configuration and tags for each
- For VPC functions, check security groups
- Filter by age and exclusion tag
- Generate both console and JSON output

Let me structure the code:

1. Main analysis class/functions
2. Helper functions for each check
3. Output formatting
4. CLI interface

I'll use:

- boto3 for AWS API
- datetime for date calculations
- json for file output
- tabulate or similar for console output (or build a simple table formatter)
- argparse for CLI

Let me code this step by step:

### Answer

---

I'll create a comprehensive Python script that analyzes Lambda functions based on your requirements. Here's the implementation:

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
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Set, Optional, Tuple
from collections import defaultdict

import boto3
from botocore.exceptions import ClientError


class LambdaAnalyzer:
    """Analyzes Lambda functions for configuration issues."""

    # Deprecated runtimes as of 2024
    DEPRECATED_RUNTIMES = {
        'python2.7', 'python3.6', 'python3.7',
        'nodejs', 'nodejs4.3', 'nodejs6.10', 'nodejs8.10', 'nodejs10.x', 'nodejs12.x',
        'ruby2.5',
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

        # Filter functions based on age and exclusion tag
        eligible_functions = self._filter_functions(functions)
        print(f"Analyzing {len(eligible_functions)} eligible functions (>30 days old, not excluded)")

        # Analyze each function
        for func in eligible_functions:
            self._analyze_function(func)

        return dict(self.issues)

    def _list_all_functions(self) -> List[Dict]:
        """List all Lambda functions with pagination."""
        functions = []
        paginator = self.lambda_client.get_paginator('list_functions')

        for page in paginator.paginate():
            functions.extend(page['Functions'])

        return functions

    def _filter_functions(self, functions: List[Dict]) -> List[Dict]:
        """Filter functions based on age and exclusion tags."""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=30)
        eligible_functions = []

        for func in functions:
            # Check age
            last_modified = datetime.fromisoformat(func['LastModified'].replace('Z', '+00:00'))
            if last_modified >= cutoff_date:
                continue

            # Check exclusion tag
            try:
                tags_response = self.lambda_client.list_tags(Resource=func['FunctionArn'])
                tags = tags_response.get('Tags', {})

                if tags.get('ExcludeFromAnalysis', '').lower() == 'true':
                    continue

            except ClientError as e:
                print(f"Warning: Could not get tags for {func['FunctionName']}: {e}")

            eligible_functions.append(func)

        return eligible_functions

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
        """Print a formatted console report."""
        print("\n" + "="*80)
        print("Lambda Configuration Analysis Report")
        print("="*80)

        if not any(issues.values()):
            print("\n✅ No issues found!")
            return

        total_issues = sum(len(items) for items in issues.values())
        print(f"\n⚠️  Found {total_issues} issues across {len(issues)} categories\n")

        for issue_type, functions in issues.items():
            if not functions:
                continue

            print(f"\n{issue_type} ({len(functions)} functions)")
            print("-" * len(f"{issue_type} ({len(functions)} functions)"))

            # Create table headers based on issue type
            headers = ['Function Name']
            if issue_type == 'Over-Provisioned':
                headers.extend(['Memory (MB)', 'Timeout (s)', 'Runtime'])
            elif issue_type == 'Unencrypted Environment Variables':
                headers.extend(['Env Var Count', 'Runtime'])
            elif issue_type == 'Risky VPC Access':
                headers.extend(['VPC ID', 'Risky Security Groups', 'Runtime'])
            elif issue_type == 'Deprecated Runtime':
                headers.extend(['Runtime', 'Last Modified'])

            # Print table header
            ReportGenerator._print_table_header(headers)

            # Print rows
            for func in functions:
                row = [func['FunctionName']]

                if issue_type == 'Over-Provisioned':
                    row.extend([
                        str(func['MemorySize']),
                        str(func['Timeout']),
                        func['Runtime']
                    ])
                elif issue_type == 'Unencrypted Environment Variables':
                    row.extend([
                        str(func['EnvironmentVariableCount']),
                        func['Runtime']
                    ])
                elif issue_type == 'Risky VPC Access':
                    row.extend([
                        func['VpcId'],
                        ', '.join(func['SecurityGroups']),
                        func['Runtime']
                    ])
                elif issue_type == 'Deprecated Runtime':
                    row.extend([
                        func['Runtime'],
                        func['LastModified'][:19]  # Trim microseconds
                    ])

                ReportGenerator._print_table_row(row)

        print("\n" + "="*80)

    @staticmethod
    def _print_table_header(headers: List[str]) -> None:
        """Print a simple table header."""
        widths = [max(25, len(h) + 2) for h in headers]

        # Print headers
        row = ""
        for header, width in zip(headers, widths):
            row += header.ljust(width)
        print(row)

        # Print separator
        row = ""
        for width in widths:
            row += "-" * (width - 1) + " "
        print(row)

    @staticmethod
    def _print_table_row(values: List[str]) -> None:
        """Print a simple table row."""
        widths = [max(25, len(str(v)) + 2) for v in values]
        row = ""
        for value, width in zip(values, widths):
            # Truncate long values
            display_val = str(value)
            if len(display_val) > width - 3:
                display_val = display_val[:width-6] + "..."
            row += display_val.ljust(width)
        print(row)

    @staticmethod
    def save_json_report(issues: Dict[str, List[Dict]], filename: str = "lambda_config_report.json") -> None:
        """Save analysis results to JSON file."""
        report = {
            'analysis_timestamp': datetime.now(timezone.utc).isoformat(),
            'region': 'us-east-1',
            'issues': issues,
            'summary': {
                'total_issues': sum(len(items) for items in issues.values()),
                'issues_by_type': {k: len(v) for k, v in issues.items()}
            }
        }

        with open(filename, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        print(f"\n📄 Detailed report saved to: {filename}")


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
        ReportGenerator.save_json_report(issues, args.output)

        # Exit with error code if issues found
        if any(issues.values()):
            sys.exit(1)
        else:
            sys.exit(0)

    except ClientError as e:
        print(f"\n❌ AWS API Error: {e}", file=sys.stderr)
        sys.exit(2)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}", file=sys.stderr)
        sys.exit(2)


if __name__ == '__main__':
    main()
```

## Key Features of the Script:

1. **Over-Provisioned Functions Detection**: Identifies functions with >3GB memory but <30 second timeout
2. **Unencrypted Environment Variables**: Flags functions with env vars but no KMS encryption
3. **Risky VPC Access**: Detects security groups with outbound 0.0.0.0/0 rules
4. **Deprecated Runtime Detection**: Maintains a list of deprecated runtimes and flags their usage

## Implementation Details:

- **Age Filtering**: Only analyzes functions created >30 days ago using `LastModified`
- **Tag-based Exclusion**: Skips functions with `ExcludeFromAnalysis=true` tag
- **Comprehensive Error Handling**: Gracefully handles API errors and permission issues
- **Clean Console Output**: Tabular format grouped by issue type
- **JSON Report**: Detailed findings with timestamp and summary statistics
- **Exit Codes**: Returns 0 for no issues, 1 if issues found, 2 for errors

## Usage Examples:

```bash
# Basic usage (analyzes us-east-1)
python lib/analyse.py

# Analyze different region
python lib/analyse.py --region us-west-2

# Custom output file
python lib/analyse.py --output custom_report.json
```

The script provides actionable insights for both cost optimization (over-provisioned functions, old runtimes) and security improvements (unencrypted variables, risky VPC configurations).
