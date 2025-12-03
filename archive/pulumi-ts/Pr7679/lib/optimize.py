#!/usr/bin/env python3
"""
ECS Infrastructure Optimization Analysis Script

This script analyzes Pulumi TypeScript code for common ECS deployment
inefficiencies and provides recommendations for optimization.
"""

import json
import re
import sys
from typing import Any, Dict, List


class OptimizationCheck:
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.passed = False
        self.findings = []

    def add_finding(self, finding: str):
        self.findings.append(finding)


class ECSOptimizationAnalyzer:
    def __init__(self, code_content: str):
        self.code = code_content
        self.checks = []
        self._initialize_checks()

    def _initialize_checks(self):
        """Initialize all optimization checks"""
        self.checks = [
            OptimizationCheck(
                "Service Consolidation",
                "Check for duplicate ECS service definitions"
            ),
            OptimizationCheck(
                "Task Placement Strategy",
                "Verify optimal task placement configuration"
            ),
            OptimizationCheck(
                "Resource Reservations",
                "Ensure proper CPU and memory limits"
            ),
            OptimizationCheck(
                "Configuration Management",
                "Check for hardcoded values"
            ),
            OptimizationCheck(
                "CloudWatch Log Retention",
                "Verify log retention policies are set"
            ),
            OptimizationCheck(
                "ALB Health Check Optimization",
                "Check health check intervals and thresholds"
            ),
            OptimizationCheck(
                "Tagging Strategy",
                "Verify comprehensive tagging"
            ),
            OptimizationCheck(
                "Security Group Cleanup",
                "Check for unused security group rules"
            ),
            OptimizationCheck(
                "Resource Dependencies",
                "Verify explicit dependencies"
            ),
            OptimizationCheck(
                "Auto-scaling Configuration",
                "Check if CPU-based scaling is used"
            ),
        ]

    def check_service_consolidation(self) -> OptimizationCheck:
        """Check for duplicate ECS service definitions"""
        check = self.checks[0]

        # Count ECS service definitions
        service_pattern = r'new\s+aws\.ecs\.Service\('
        services = re.findall(service_pattern, self.code)

        # Check for reusable component pattern
        component_pattern = r'class\s+\w+ECSService|function\s+create\w*Service'
        has_reusable = re.search(component_pattern, self.code)

        if len(services) > 1 and not has_reusable:
            check.add_finding(f"Found {len(services)} service definitions without reusable component")
            check.add_finding("RECOMMENDATION: Create a reusable component function or class")
        elif has_reusable:
            check.passed = True
            check.add_finding("✓ Using reusable service component pattern")
        else:
            check.passed = True
            check.add_finding("✓ Single service definition found")

        return check

    def check_placement_strategy(self) -> OptimizationCheck:
        """Check task placement strategy configuration"""
        check = self.checks[1]

        # Check if using FARGATE (placement strategies not supported)
        uses_fargate = re.search(r"launchType:\s*['\"]FARGATE['\"]", self.code) or \
                       re.search(r"requiresCompatibilities:\s*\[['\"]FARGATE['\"]\]", self.code)

        # Look for placement strategy configuration
        spread_all = re.search(r'field:\s*["\']attribute:ecs\.availability-zone["\']', self.code)
        binpack = re.search(r'type:\s*["\']binpack["\']', self.code)

        if uses_fargate:
            check.passed = True
            check.add_finding("✓ Using FARGATE launch type (placement managed by AWS)")
        elif spread_all and not binpack:
            check.add_finding("Spreading across all AZs without binpack optimization")
            check.add_finding("RECOMMENDATION: Use binpack strategy for cost optimization")
        elif binpack:
            check.passed = True
            check.add_finding("✓ Using binpack placement strategy")
        else:
            check.add_finding("No explicit placement strategy found")

        return check

    def check_resource_reservations(self) -> OptimizationCheck:
        """Check for proper CPU and memory reservations"""
        check = self.checks[2]

        # Look for soft/hard memory limits
        soft_limit = re.search(r'memoryReservation', self.code)
        hard_limit = re.search(r'memory', self.code)

        if soft_limit and hard_limit:
            check.passed = True
            check.add_finding("✓ Both soft and hard memory limits configured")
        else:
            check.add_finding("Missing proper memory reservation configuration")
            check.add_finding("RECOMMENDATION: Set both memoryReservation and memory")

        return check

    def check_configuration_management(self) -> OptimizationCheck:
        """Check for hardcoded values"""
        check = self.checks[3]

        # Look for hardcoded ARNs, regions, etc.
        hardcoded_arn = re.search(r'arn:aws:[^"\']*123456789012', self.code)
        hardcoded_region = re.search(r'["\']us-east-1["\']', self.code)
        config_usage = re.search(r'config\.(require|get)', self.code)

        issues = []
        if hardcoded_arn:
            issues.append("Hardcoded IAM role ARN found")
        if hardcoded_region and not config_usage:
            issues.append("Hardcoded AWS region without config")

        if issues:
            check.findings.extend(issues)
            check.add_finding("RECOMMENDATION: Use Pulumi config for all environment values")
        elif config_usage:
            check.passed = True
            check.add_finding("✓ Using Pulumi config for configuration")

        return check

    def check_log_retention(self) -> OptimizationCheck:
        """Check CloudWatch log retention policies"""
        check = self.checks[4]

        log_group_pattern = r'new\s+aws\.cloudwatch\.LogGroup'
        # Match retentionInDays with a number or an expression (ternary, variable, etc.)
        retention_pattern = r'retentionInDays:\s*(\d+|[^,}\n]+)'

        has_log_group = re.search(log_group_pattern, self.code)
        has_retention = re.search(retention_pattern, self.code)

        if has_log_group and not has_retention:
            check.add_finding("CloudWatch log group without retention policy")
            check.add_finding("RECOMMENDATION: Set retentionInDays to prevent indefinite storage")
        elif has_retention:
            check.passed = True
            check.add_finding("✓ Log retention policy configured")
        else:
            check.add_finding("No CloudWatch log groups found")

        return check

    def check_health_checks(self) -> OptimizationCheck:
        """Check ALB health check configuration"""
        check = self.checks[5]

        # Look for aggressive health check intervals
        interval_match = re.search(r'interval:\s*(\d+)', self.code)

        if interval_match:
            interval = int(interval_match.group(1))
            if interval < 10:
                check.add_finding(f"Aggressive health check interval: {interval} seconds")
                check.add_finding("RECOMMENDATION: Use 30+ seconds to reduce costs")
            else:
                check.passed = True
                check.add_finding(f"✓ Reasonable health check interval: {interval} seconds")
        else:
            check.add_finding("No health check configuration found")

        return check

    def check_tagging_strategy(self) -> OptimizationCheck:
        """Check for comprehensive tagging"""
        check = self.checks[6]

        standard_tags = ['Environment', 'Project', 'ManagedBy', 'Team']

        # Look for tags in multiple patterns:
        # 1. Direct tags: { ... } blocks
        # 2. commonTags or defaultTags objects
        # 3. Tags spread from variables

        found_tags = []

        # Check for each standard tag anywhere in the code (in object definitions)
        for tag in standard_tags:
            # Match tag as object key: Environment: or 'Environment': or "Environment":
            tag_pattern = rf"['\"]?{tag}['\"]?\s*:"
            if re.search(tag_pattern, self.code):
                found_tags.append(tag)

        # Also check for commonTags or defaultTags usage
        has_common_tags = re.search(r'(commonTags|defaultTags)\s*=\s*\{', self.code)
        uses_spread_tags = re.search(r'tags:\s*\{?\s*\.\.\.', self.code) or \
                          re.search(r'tags:\s*(commonTags|defaultTags)', self.code)

        if len(found_tags) >= 3:
            check.passed = True
            check.add_finding(f"✓ Comprehensive tagging with: {', '.join(found_tags)}")
        elif has_common_tags and uses_spread_tags:
            check.passed = True
            check.add_finding("✓ Using centralized tagging strategy with commonTags/defaultTags")
        elif found_tags:
            check.add_finding(f"Partial tagging found: {', '.join(found_tags)}")
            check.add_finding(f"RECOMMENDATION: Add missing tags from: {standard_tags}")
        else:
            check.add_finding("No tagging strategy found")
            check.add_finding("RECOMMENDATION: Add tags for cost allocation and management")

        return check

    def check_security_groups(self) -> OptimizationCheck:
        """Check for unused security group rules"""
        check = self.checks[7]

        # Look for potentially unused ports
        suspicious_ports = [22, 8080, 8888, 9000]
        ingress_pattern = r'fromPort:\s*(\d+)'

        ports_found = [int(m.group(1)) for m in re.finditer(ingress_pattern, self.code)]
        unused_ports = [p for p in ports_found if p in suspicious_ports]

        if unused_ports:
            check.add_finding(f"Potentially unused ports: {unused_ports}")
            check.add_finding("RECOMMENDATION: Remove unused security group rules")
        else:
            check.passed = True
            check.add_finding("✓ No obviously unused ports detected")

        return check

    def check_dependencies(self) -> OptimizationCheck:
        """Check for explicit resource dependencies"""
        check = self.checks[8]

        # Look for dependsOn usage
        depends_on = re.search(r'dependsOn:\s*\[', self.code)

        # Count resources that might need dependencies
        resource_count = len(re.findall(r'new\s+aws\.\w+\.\w+\(', self.code))

        if resource_count > 5 and not depends_on:
            check.add_finding(f"Found {resource_count} resources without explicit dependencies")
            check.add_finding("RECOMMENDATION: Add dependsOn for proper ordering")
        elif depends_on:
            check.passed = True
            check.add_finding("✓ Explicit dependencies configured")
        else:
            check.passed = True
            check.add_finding("✓ Simple stack, implicit dependencies sufficient")

        return check

    def check_autoscaling(self) -> OptimizationCheck:
        """Check auto-scaling configuration"""
        check = self.checks[9]

        # Look for scaling metric type
        cpu_scaling = re.search(r'ECSServiceAverageCPUUtilization', self.code)
        request_scaling = re.search(r'ALBRequestCountPerTarget', self.code)

        if request_scaling and not cpu_scaling:
            check.add_finding("Using ALB request count for scaling")
            check.add_finding("RECOMMENDATION: Use CPU utilization for better resource management")
        elif cpu_scaling:
            check.passed = True
            check.add_finding("✓ Using CPU-based auto-scaling")
        else:
            check.add_finding("No auto-scaling configuration found")

        return check

    def analyze(self) -> Dict[str, Any]:
        """Run all optimization checks"""
        results = {
            "total_checks": len(self.checks),
            "passed": 0,
            "failed": 0,
            "checks": []
        }

        # Run all checks
        check_methods = [
            self.check_service_consolidation,
            self.check_placement_strategy,
            self.check_resource_reservations,
            self.check_configuration_management,
            self.check_log_retention,
            self.check_health_checks,
            self.check_tagging_strategy,
            self.check_security_groups,
            self.check_dependencies,
            self.check_autoscaling,
        ]

        for i, method in enumerate(check_methods):
            check = method()
            results["checks"].append({
                "name": check.name,
                "description": check.description,
                "passed": check.passed,
                "findings": check.findings
            })

            if check.passed:
                results["passed"] += 1
            else:
                results["failed"] += 1

        return results

    def print_report(self, results: Dict[str, Any]):
        """Print analysis report"""
        print("\n" + "="*70)
        print("ECS INFRASTRUCTURE OPTIMIZATION ANALYSIS")
        print("="*70)
        print(f"\nTotal Checks: {results['total_checks']}")
        print(f"✓ Passed: {results['passed']}")
        print(f"✗ Failed: {results['failed']}")
        print(f"Score: {results['passed']}/{results['total_checks']} ({results['passed']*100//results['total_checks']}%)")
        print("\n" + "-"*70)

        for i, check in enumerate(results['checks'], 1):
            status = "✓ PASS" if check['passed'] else "✗ FAIL"
            print(f"\n{i}. {check['name']} - {status}")
            print(f"   {check['description']}")
            for finding in check['findings']:
                print(f"   {finding}")

        print("\n" + "="*70)

        if results['failed'] == 0:
            print("🎉 All optimization checks passed!")
        else:
            print(f"⚠️  {results['failed']} optimization(s) needed")
        print("="*70 + "\n")


def main():
    """Main entry point"""
    # Default to lib/tap-stack.ts if no argument provided
    if len(sys.argv) < 2:
        file_path = 'lib/tap-stack.ts'
    else:
        file_path = sys.argv[1]

    try:
        with open(file_path, 'r') as f:
            code_content = f.read()
    except FileNotFoundError:
        print(f"Error: File not found: {file_path}")
        sys.exit(1)

    analyzer = ECSOptimizationAnalyzer(code_content)
    results = analyzer.analyze()
    analyzer.print_report(results)

    # Exit with non-zero if any checks failed
    sys.exit(0 if results['failed'] == 0 else 1)


if __name__ == "__main__":
    main()
