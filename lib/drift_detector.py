"""
Drift Detection Script using Pulumi Automation API
Compares actual AWS resource state vs desired Pulumi state
"""

import sys
import json
import argparse
from typing import Dict, List, Any
from datetime import datetime, timezone
import pulumi
from pulumi import automation as auto


class DriftDetector:
    """
    Detect configuration drift between Pulumi state and actual AWS resources.
    """

    def __init__(self, project_name: str, stack_name: str, work_dir: str = "."):
        """
        Initialize drift detector.
        
        Args:
            project_name: Name of the Pulumi project
            stack_name: Name of the stack to check (dev, staging, prod)
            work_dir: Working directory containing Pulumi project
        """
        self.project_name = project_name
        self.stack_name = stack_name
        self.work_dir = work_dir
        self.stack = None

    def initialize_stack(self) -> bool:
        """
        Initialize Pulumi stack using Automation API.

        Returns:
            True if successful, False otherwise
        """
        try:
            # Create or select stack
            self.stack = auto.select_stack(
                stack_name=self.stack_name,
                work_dir=self.work_dir,
                project_name=self.project_name,
            )

            print(f"✓ Initialized stack: {self.stack_name}")
            return True

        except Exception as e:
            print(f"✗ Failed to initialize stack: {e}")
            return False

    def refresh_stack(self) -> bool:
        """
        Refresh stack to get latest state from AWS.

        Returns:
            True if successful, False otherwise
        """
        if self.stack is None:
            print(f"✗ Failed to refresh stack: Stack not initialized")
            return False

        try:
            print(f"Refreshing stack {self.stack_name}...")
            refresh_result = self.stack.refresh(on_output=print)

            if refresh_result.stderr:
                print(f"Refresh warnings: {refresh_result.stderr}")

            print(f"✓ Refreshed stack successfully")
            return True

        except Exception as e:
            print(f"✗ Failed to refresh stack: {e}")
            return False

    def preview_changes(self) -> Dict[str, Any]:
        """
        Preview changes to detect drift.

        Returns:
            Dictionary containing drift information
        """
        if self.stack is None:
            print(f"✗ Failed to check drift: Stack not initialized")
            return None

        try:
            print(f"Checking for drift in stack {self.stack_name}...")
            preview_result = self.stack.preview(on_output=print)

            drift_info = {
                "stack": self.stack_name,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "has_drift": False,
                "changes": {
                    "create": 0,
                    "update": 0,
                    "delete": 0,
                },
                "summary": {
                    "create": 0,
                    "update": 0,
                    "delete": 0,
                    "same": 0,
                },
                "total_changes": 0,
            }

            # Parse preview output for changes
            if preview_result.change_summary:
                summary = preview_result.change_summary

                drift_info["summary"]["create"] = summary.get("create", 0)
                drift_info["summary"]["update"] = summary.get("update", 0)
                drift_info["summary"]["delete"] = summary.get("delete", 0)
                drift_info["summary"]["same"] = summary.get("same", 0)

                # Set changes dict
                drift_info["changes"]["create"] = drift_info["summary"]["create"]
                drift_info["changes"]["update"] = drift_info["summary"]["update"]
                drift_info["changes"]["delete"] = drift_info["summary"]["delete"]

                # Calculate total changes
                drift_info["total_changes"] = (
                    drift_info["summary"]["create"]
                    + drift_info["summary"]["update"]
                    + drift_info["summary"]["delete"]
                )

                # Check if there's any drift
                drift_info["has_drift"] = drift_info["total_changes"] > 0

                if drift_info["has_drift"]:
                    print(f"⚠️  DRIFT DETECTED in stack {self.stack_name}")
                    print(f"   Create: {drift_info['summary']['create']}")
                    print(f"   Update: {drift_info['summary']['update']}")
                    print(f"   Delete: {drift_info['summary']['delete']}")
                else:
                    print(f"✓ No drift detected in stack {self.stack_name}")

            return drift_info

        except Exception as e:
            print(f"✗ Failed to check drift: {e}")
            return None

    def get_stack_outputs(self) -> Dict[str, Any]:
        """
        Get stack outputs for reporting.

        Returns:
            Dictionary of stack outputs
        """
        if self.stack is None:
            print(f"Warning: Could not retrieve outputs: Stack not initialized")
            return {}

        try:
            outputs = self.stack.outputs()
            return {k: v.value for k, v in outputs.items()}
        except Exception as e:
            print(f"Warning: Could not retrieve outputs: {e}")
            return {}

    def detect_drift(self) -> Dict[str, Any]:
        """
        Main method to detect drift.

        Returns:
            Dictionary containing drift report, or None if initialization fails
        """
        # Initialize stack
        if not self.initialize_stack():
            return None

        # Refresh to get latest state
        if not self.refresh_stack():
            return None

        # Preview to detect drift
        drift_info = self.preview_changes()

        if drift_info is None:
            return None

        # Add stack outputs to report
        drift_info["outputs"] = self.get_stack_outputs()

        return drift_info


def check_all_environments(
    project_name: str,
    environments: List[str] = None,
    work_dir: str = ".",
) -> Dict[str, Any]:
    """
    Check drift across all environments.
    
    Args:
        project_name: Name of the Pulumi project
        environments: List of environment names (default: dev, staging, prod)
        work_dir: Working directory
        
    Returns:
        Dictionary containing drift report for all environments
    """
    if environments is None:
        environments = ["dev", "staging", "prod"]
    
    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "project": project_name,
        "environments": {},
        "summary": {
            "total_environments": len(environments),
            "environments_with_drift": 0,
            "total_changes": 0,
        },
    }
    
    for env in environments:
        print(f"\n{'='*60}")
        print(f"Checking environment: {env}")
        print(f"{'='*60}\n")
        
        detector = DriftDetector(project_name, env, work_dir)
        drift_info = detector.detect_drift()
        
        report["environments"][env] = drift_info
        
        if drift_info.get("has_drift"):
            report["summary"]["environments_with_drift"] += 1
            summary = drift_info.get("summary", {})
            report["summary"]["total_changes"] += (
                summary.get("create", 0)
                + summary.get("update", 0)
                + summary.get("delete", 0)
            )
    
    return report


def main():
    """
    Main entry point for drift detection script.
    """
    parser = argparse.ArgumentParser(
        description="Detect configuration drift in Pulumi stacks"
    )
    parser.add_argument(
        "--project",
        required=True,
        help="Name of the Pulumi project",
    )
    parser.add_argument(
        "--stack",
        help="Specific stack to check (if not specified, checks all environments)",
    )
    parser.add_argument(
        "--environments",
        nargs="+",
        default=["dev", "staging", "prod"],
        help="List of environments to check",
    )
    parser.add_argument(
        "--work-dir",
        default=".",
        help="Working directory containing Pulumi project",
    )
    parser.add_argument(
        "--output",
        help="Output file for drift report (JSON)",
    )
    
    args = parser.parse_args()
    
    if args.stack:
        # Check single stack
        print(f"Checking drift for stack: {args.stack}\n")
        detector = DriftDetector(args.project, args.stack, args.work_dir)
        report = {"environments": {args.stack: detector.detect_drift()}}
    else:
        # Check all environments
        print(f"Checking drift for all environments\n")
        report = check_all_environments(
            args.project,
            args.environments,
            args.work_dir,
        )
    
    # Print summary
    print(f"\n{'='*60}")
    print("DRIFT DETECTION SUMMARY")
    print(f"{'='*60}\n")
    
    if "summary" in report:
        summary = report["summary"]
        print(f"Total environments checked: {summary['total_environments']}")
        print(f"Environments with drift: {summary['environments_with_drift']}")
        print(f"Total changes detected: {summary['total_changes']}")
    
    # Save report to file if specified
    if args.output:
        with open(args.output, "w") as f:
            json.dump(report, f, indent=2)
        print(f"\n✓ Drift report saved to: {args.output}")
    
    # Exit with error code if drift detected
    if report.get("summary", {}).get("environments_with_drift", 0) > 0:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == "__main__":
    main()
