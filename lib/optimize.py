#!/usr/bin/env python3

"""
IaC Code Optimization Script for Pulumi TypeScript

This script analyzes Pulumi TypeScript infrastructure code and identifies
optimization opportunities based on best practices.
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple


class PulumiCodeOptimizer:
    """Analyzes and optimizes Pulumi TypeScript infrastructure code."""

    def __init__(self, project_dir: str = "."):
        """
        Initialize the optimizer.
        Args:
            project_dir: Path to the Pulumi project directory
        """
        self.project_dir = Path(project_dir)
        self.issues_found: List[Dict[str, Any]] = []
        self.optimizations: List[Dict[str, Any]] = []

        print(f"Analyzing Pulumi project in: {self.project_dir}")
        print("-" * 60)

    def analyze_project(self) -> Dict[str, Any]:
        """
        Run all analysis checks on the project.
        Returns:
            Dictionary with analysis results
        """
        results = {
            "issues": [],
            "optimizations": [],
            "cost_savings": [],
            "best_practices": []
        }

        # Find TypeScript files
        ts_files = list(self.project_dir.glob("**/*.ts"))
        if not ts_files:
            print("No TypeScript files found")
            return results

        print(f"Found {len(ts_files)} TypeScript file(s)")
        print()

        for ts_file in ts_files:
            if "node_modules" in str(ts_file):
                continue

            print(f"Analyzing: {ts_file.relative_to(self.project_dir)}")

            with open(ts_file, 'r') as f:
                content = f.read()

            # Run checks
            results["issues"].extend(self.check_hardcoded_values(content, ts_file))
            results["issues"].extend(self.check_resource_naming(content, ts_file))
            results["issues"].extend(self.check_tags(content, ts_file))
            results["issues"].extend(self.check_duplicate_resources(content, ts_file))
            results["issues"].extend(self.check_health_checks(content, ts_file))
            results["issues"].extend(self.check_log_retention(content, ts_file))
            results["issues"].extend(self.check_exports(content, ts_file))
            results["optimizations"].extend(self.check_resource_loops(content, ts_file))
            results["cost_savings"].extend(self.identify_cost_optimizations(content, ts_file))

        # Check for configuration files
        results["best_practices"].extend(self.check_config_files())

        return results

    def check_hardcoded_values(self, content: str, file: Path) -> List[Dict[str, Any]]:
        """Check for hardcoded configuration values."""
        issues = []

        # Pattern for hardcoded memory/CPU values
        hardcoded_patterns = [
            (r'const\s+container(?:Memory|Cpu)\s*=\s*["\']?\d+["\']?',
             "Hardcoded container configuration found"),
            (r'memory:\s*\d+', "Hardcoded memory value"),
            (r'cpu:\s*\d+', "Hardcoded CPU value"),
        ]

        for pattern, message in hardcoded_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                # Skip if it's using config
                if "config.get" not in content[:match.start()]:
                    issues.append({
                        "type": "hardcoded_config",
                        "severity": "medium",
                        "file": str(file.relative_to(self.project_dir)),
                        "message": message,
                        "line": content[:match.start()].count('\n') + 1,
                        "suggestion": "Use Pulumi Config instead: config.get('containerMemory')"
                    })

        return issues

    def check_resource_naming(self, content: str, file: Path) -> List[Dict[str, Any]]:
        """Check for consistent resource naming with environmentSuffix."""
        issues = []

        # Pattern for resource creation without suffix
        resource_pattern = r'new\s+aws\.[\w\.]+\("([^"]+)"'
        matches = re.finditer(resource_pattern, content)

        for match in matches:
            resource_name = match.group(1)
            # Check if name includes variable interpolation
            if "${" not in resource_name and "`" not in content[match.start():match.end()+50]:
                issues.append({
                    "type": "resource_naming",
                    "severity": "high",
                    "file": str(file.relative_to(self.project_dir)),
                    "message": f"Resource '{resource_name}' missing environmentSuffix",
                    "line": content[:match.start()].count('\n') + 1,
                    "suggestion": f"Use: `{resource_name}-${{environmentSuffix}}`"
                })

        return issues

    def check_tags(self, content: str, file: Path) -> List[Dict[str, Any]]:
        """Check for missing cost allocation tags."""
        issues = []

        # Find AWS resource creations
        resource_pattern = r'new\s+aws\.([\w\.]+)\('
        matches = list(re.finditer(resource_pattern, content))

        for match in matches:
            resource_type = match.group(1)

            # Skip resources that don't support tags
            if resource_type.startswith("iam.RolePolicyAttachment"):
                continue

            # Find the closing brace for this resource
            start = match.start()
            brace_count = 0
            in_resource = False
            resource_end = start

            for i in range(start, len(content)):
                if content[i] == '{':
                    brace_count += 1
                    in_resource = True
                elif content[i] == '}':
                    brace_count -= 1
                    if in_resource and brace_count == 0:
                        resource_end = i
                        break

            resource_block = content[start:resource_end]

            # Check if tags are present
            if "tags:" not in resource_block and "tags :" not in resource_block:
                issues.append({
                    "type": "missing_tags",
                    "severity": "medium",
                    "file": str(file.relative_to(self.project_dir)),
                    "message": f"Resource of type '{resource_type}' missing cost allocation tags",
                    "line": content[:start].count('\n') + 1,
                    "suggestion": "Add tags: { Environment, Team, Project }"
                })

        return issues

    def check_duplicate_resources(self, content: str, file: Path) -> List[Dict[str, Any]]:
        """Check for duplicate IAM roles or similar resources."""
        issues = []

        # Check for multiple execution roles
        role_pattern = r'new\s+aws\.iam\.Role\("([^"]+)"'
        roles = re.findall(role_pattern, content)

        if len(roles) > len(set(roles)):
            issues.append({
                "type": "duplicate_resources",
                "severity": "high",
                "file": str(file.relative_to(self.project_dir)),
                "message": "Duplicate IAM roles detected",
                "suggestion": "Consolidate IAM roles to eliminate duplication"
            })

        # Check for similar role names (e.g., role-1, role-2)
        execution_roles = [r for r in roles if "execution" in r.lower()]
        if len(execution_roles) > 1:
            issues.append({
                "type": "duplicate_resources",
                "severity": "high",
                "file": str(file.relative_to(self.project_dir)),
                "message": f"Multiple execution roles found: {execution_roles}",
                "suggestion": "Use a single execution role for all tasks"
            })

        return issues

    def check_health_checks(self, content: str, file: Path) -> List[Dict[str, Any]]:
        """Check for missing health check configurations."""
        issues = []

        # Find target group creations
        tg_pattern = r'new\s+aws\.lb\.TargetGroup\('
        matches = list(re.finditer(tg_pattern, content))

        for match in matches:
            # Check for health check in the next 500 characters
            block = content[match.start():match.start()+500]
            if "healthCheck" not in block:
                issues.append({
                    "type": "missing_health_check",
                    "severity": "medium",
                    "file": str(file.relative_to(self.project_dir)),
                    "message": "Target group missing health check configuration",
                    "line": content[:match.start()].count('\n') + 1,
                    "suggestion": "Add healthCheck with path, interval, timeout, and thresholds"
                })

        return issues

    def check_log_retention(self, content: str, file: Path) -> List[Dict[str, Any]]:
        """Check for missing log retention policies."""
        issues = []

        # Find CloudWatch log group creations
        log_pattern = r'new\s+aws\.cloudwatch\.LogGroup\('
        matches = list(re.finditer(log_pattern, content))

        for match in matches:
            # Check for retention in the next 300 characters
            block = content[match.start():match.start()+300]
            if "retentionInDays" not in block and "retention_in_days" not in block:
                issues.append({
                    "type": "missing_log_retention",
                    "severity": "high",
                    "file": str(file.relative_to(self.project_dir)),
                    "message": "CloudWatch log group missing retention policy",
                    "line": content[:match.start()].count('\n') + 1,
                    "suggestion": "Add retentionInDays: 7 to reduce storage costs"
                })

        return issues

    def check_exports(self, content: str, file: Path) -> List[Dict[str, Any]]:
        """Check for missing stack outputs/exports."""
        issues = []

        # Check if file has exports
        if "export const" not in content and "exports." not in content:
            # Check if this is a main file (index.ts or similar)
            if file.name in ["index.ts", "main.ts", "app.ts"]:
                issues.append({
                    "type": "missing_exports",
                    "severity": "medium",
                    "file": str(file.relative_to(self.project_dir)),
                    "message": "No stack outputs found",
                    "suggestion": "Export key values like ALB DNS, service ARN for external use"
                })

        return issues

    def check_resource_loops(self, content: str, file: Path) -> List[Dict[str, Any]]:
        """Check for inefficient resource creation loops."""
        optimizations = []

        # Pattern for loops creating resources
        loop_pattern = r'for\s*\([^)]+\)\s*\{[^}]*new\s+aws\.'
        matches = re.finditer(loop_pattern, content, re.DOTALL)

        for match in matches:
            block = match.group(0)
            # Count how many iterations
            iteration_match = re.search(r'<\s*(\d+)', block)
            if iteration_match:
                count = int(iteration_match.group(1))
                if count > 3:
                    optimizations.append({
                        "type": "inefficient_loop",
                        "severity": "high",
                        "file": str(file.relative_to(self.project_dir)),
                        "message": f"Loop creating {count} resources - may be inefficient",
                        "line": content[:match.start()].count('\n') + 1,
                        "suggestion": "Consider if all resources are necessary or use dynamic configuration"
                    })

        return optimizations

    def identify_cost_optimizations(self, content: str, file: Path) -> List[Dict[str, Any]]:
        """Identify potential cost optimization opportunities."""
        optimizations = []

        # Check for indefinite log retention
        if "LogGroup" in content and "retentionInDays" not in content:
            optimizations.append({
                "type": "cost_saving",
                "service": "CloudWatch Logs",
                "message": "Add log retention policy to reduce storage costs",
                "estimated_savings": "~$0.50-5.00/month per log group"
            })

        # Check for multiple target groups
        tg_count = len(re.findall(r'new\s+aws\.lb\.TargetGroup\(', content))
        if tg_count > 3:
            optimizations.append({
                "type": "cost_saving",
                "service": "Application Load Balancer",
                "message": f"{tg_count} target groups found - consolidate if possible",
                "estimated_savings": f"~${(tg_count - 1) * 0.008 * 730:.2f}/month"
            })

        return optimizations

    def check_config_files(self) -> List[Dict[str, Any]]:
        """Check for required configuration files."""
        recommendations = []

        required_files = {
            "Pulumi.yaml": "Project definition file",
            "Pulumi.dev.yaml": "Development environment configuration",
            "package.json": "Node.js dependencies",
            "tsconfig.json": "TypeScript configuration"
        }

        for file, description in required_files.items():
            file_path = self.project_dir / file
            if not file_path.exists():
                recommendations.append({
                    "type": "missing_config",
                    "severity": "medium",
                    "file": file,
                    "message": f"Missing {description}",
                    "suggestion": f"Create {file} for proper project configuration"
                })

        return recommendations

    def print_results(self, results: Dict[str, Any]) -> None:
        """Print analysis results in a formatted way."""
        print()
        print("=" * 60)
        print("PULUMI CODE OPTIMIZATION ANALYSIS")
        print("=" * 60)
        print()

        # Print issues
        issues = results["issues"]
        if issues:
            print(f"ISSUES FOUND: {len(issues)}")
            print("-" * 60)

            for issue in issues:
                severity_symbol = "🔴" if issue["severity"] == "high" else "🟡"
                print(f"\n{severity_symbol} {issue['type'].upper()}")
                print(f"   File: {issue['file']}")
                if "line" in issue:
                    print(f"   Line: {issue['line']}")
                print(f"   Issue: {issue['message']}")
                print(f"   Fix: {issue['suggestion']}")
        else:
            print("✅ No issues found")

        print()

        # Print optimizations
        optimizations = results["optimizations"]
        if optimizations:
            print(f"\nOPTIMIZATION OPPORTUNITIES: {len(optimizations)}")
            print("-" * 60)

            for opt in optimizations:
                print(f"\n💡 {opt['type'].upper()}")
                print(f"   File: {opt['file']}")
                if "line" in opt:
                    print(f"   Line: {opt['line']}")
                print(f"   {opt['message']}")
                print(f"   Suggestion: {opt['suggestion']}")

        # Print cost savings
        cost_savings = results["cost_savings"]
        if cost_savings:
            print(f"\n\nCOST OPTIMIZATION OPPORTUNITIES: {len(cost_savings)}")
            print("-" * 60)

            for saving in cost_savings:
                print(f"\n💰 {saving['service']}")
                print(f"   {saving['message']}")
                print(f"   Estimated Savings: {saving['estimated_savings']}")

        # Print best practices
        best_practices = results["best_practices"]
        if best_practices:
            print(f"\n\nBEST PRACTICE RECOMMENDATIONS: {len(best_practices)}")
            print("-" * 60)

            for rec in best_practices:
                print(f"\n📋 {rec['file']}")
                print(f"   {rec['message']}")
                print(f"   Action: {rec['suggestion']}")

        # Summary
        print()
        print("=" * 60)
        print("SUMMARY")
        print("-" * 60)
        total_findings = len(issues) + len(optimizations) + len(cost_savings) + len(best_practices)
        print(f"Total findings: {total_findings}")
        print(f"  - Issues: {len(issues)}")
        print(f"  - Optimizations: {len(optimizations)}")
        print(f"  - Cost savings: {len(cost_savings)}")
        print(f"  - Best practices: {len(best_practices)}")
        print("=" * 60)


def main():
    """Main execution function."""
    import argparse

    parser = argparse.ArgumentParser(
        description="Analyze and optimize Pulumi TypeScript infrastructure code"
    )
    parser.add_argument(
        '--project-dir',
        '-p',
        default='.',
        help='Path to Pulumi project directory (default: current directory)'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output results as JSON'
    )

    args = parser.parse_args()

    try:
        optimizer = PulumiCodeOptimizer(args.project_dir)
        results = optimizer.analyze_project()

        if args.json:
            print(json.dumps(results, indent=2))
        else:
            optimizer.print_results(results)

        # Exit with error code if critical issues found
        critical_issues = [i for i in results["issues"] if i["severity"] == "high"]
        if critical_issues:
            sys.exit(1)

    except KeyboardInterrupt:
        print("\n\nAnalysis interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nError during analysis: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

