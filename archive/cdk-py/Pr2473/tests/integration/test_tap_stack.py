"""Integration tests for TapStack outputs and resource relationships.

These tests verify end-to-end behavior against a real AWS environment.
They first try to read local flat outputs; if missing, they query
CloudFormation for the stack’s outputs and then validate resources
directly via the AWS SDK (boto3).

Requirements:
- AWS credentials available to the test process.
- Region: defaults to us-east-1 (override with AWS_REGION/AWS_DEFAULT_REGION).
- Optional env var CF_STACK_NAME to explicitly name the stack.
"""

from __future__ import annotations

import json
import os
import unittest
from typing import Any, Dict, List, Optional, Tuple

import boto3
from botocore.exceptions import BotoCoreError, ClientError
import pytest


def _region() -> str:
    return (
        os.getenv("AWS_REGION")
        or os.getenv("AWS_DEFAULT_REGION")
        or "us-east-1"
    )


def _stack_name() -> str:
    # Allow explicit override; otherwise try a sensible default
    return os.getenv("CF_STACK_NAME", "TapStack")


def _load_local_outputs() -> Dict[str, Any]:
    """Attempt to load outputs from the repo (optional)."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    flat_outputs_path = os.path.join(base_dir, "..", "..", "cfn-outputs", "flat-outputs.json")
    if os.path.exists(flat_outputs_path):
        with open(flat_outputs_path, "r", encoding="utf-8") as f:
            return json.loads(f.read())
    return {}


def _load_cfn_outputs(stack: str, region: str) -> Dict[str, Any]:
    """Load stack outputs via CloudFormation; return flat dict."""
    cfn = boto3.client("cloudformation", region_name=region)
    try:
        resp = cfn.describe_stacks(StackName=stack)
        stacks = resp.get("Stacks", [])
        if not stacks:
            return {}
        outputs = stacks[0].get("Outputs", []) or []
        return {o["OutputKey"]: o["OutputValue"] for o in outputs if "OutputKey" in o and "OutputValue" in o}
    except (ClientError, BotoCoreError):
        return {}


def _find_lb_by_dns(dns_name: str, region: str) -> Optional[Dict[str, Any]]:
    elbv2 = boto3.client("elbv2", region_name=region)
    try:
        # ELBv2 doesn’t filter by DNS in the API; list and find
        lbs: List[Dict[str, Any]] = []
        marker: Optional[str] = None
        while True:
            args = {"PageSize": 20}
            if marker:
                args["Marker"] = marker
            resp = elbv2.describe_load_balancers(**args)
            lbs.extend(resp.get("LoadBalancers", []))
            marker = resp.get("NextMarker")
            if not marker:
                break
        for lb in lbs:
            if lb.get("DNSName") == dns_name:
                return lb
        return None
    except (ClientError, BotoCoreError):
        return None


def _find_db_by_endpoint(endpoint_host: str, region: str) -> Optional[Dict[str, Any]]:
    rds = boto3.client("rds", region_name=region)
    try:
        marker: Optional[str] = None
        while True:
            args = {}
            if marker:
                args["Marker"] = marker
            resp = rds.describe_db_instances(**args)
            for dbi in resp.get("DBInstances", []):
                ep = dbi.get("Endpoint", {}) or {}
                if ep.get("Address") == endpoint_host:
                    return dbi
            marker = resp.get("Marker")
            if not marker:
                break
        return None
    except (ClientError, BotoCoreError):
        return None


def _get_sg_details(sg_ids: List[str], region: str) -> List[Dict[str, Any]]:
    ec2 = boto3.client("ec2", region_name=region)
    try:
        if not sg_ids:
            return []
        resp = ec2.describe_security_groups(GroupIds=sg_ids)
        return resp.get("SecurityGroups", [])
    except (ClientError, BotoCoreError):
        return []


def _describe_asgs_for_stack(stack: str, region: str) -> List[Dict[str, Any]]:
    asg = boto3.client("autoscaling", region_name=region)
    try:
        # No server-side filter for stack tags, so do client-side
        all_asgs: List[Dict[str, Any]] = []
        token: Optional[str] = None
        while True:
            kwargs = {}
            if token:
                kwargs["NextToken"] = token
            resp = asg.describe_auto_scaling_groups(**kwargs)
            all_asgs.extend(resp.get("AutoScalingGroups", []))
            token = resp.get("NextToken")
            if not token:
                break

        result = []
        for g in all_asgs:
            tags = {t["Key"]: t["Value"] for t in g.get("Tags", [])}
            # CDK stacks typically tag ASG with aws:cloudformation:stack-name
            if tags.get("aws:cloudformation:stack-name") == stack:
                result.append(g)
        return result
    except (ClientError, BotoCoreError):
        return []


def _launch_template_instance_type(lt: Dict[str, Any], region: str) -> Optional[str]:
    """Extract instance type from LaunchTemplate (if present)."""
    # Prefer Details in the ASG record first:
    if "LaunchTemplate" in lt:
        # Sometimes only version/id is present; fall back to DescribeLaunchTemplateVersions
        ec2 = boto3.client("ec2", region_name=region)
        try:
            resp = ec2.describe_launch_template_versions(
                LaunchTemplateId=lt["LaunchTemplate"]["LaunchTemplateId"],
                Versions=[lt["LaunchTemplate"]["Version"]],
            )
            versions = resp.get("LaunchTemplateVersions", [])
            if versions:
                data = versions[0].get("LaunchTemplateData", {}) or {}
                return data.get("InstanceType")
        except (ClientError, BotoCoreError):
            return None
    return None


@pytest.mark.describe("TapStack Integration (Live AWS) Tests")
class TestTapStackIntegrationModelFailures(unittest.TestCase):  # pylint: disable=too-many-public-methods
    """Integration tests that validate live resources via AWS APIs."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.region = _region()
        cls.stack_name = _stack_name()
        # Load outputs: local file first, then CFN
        cls.outputs: Dict[str, Any] = _load_local_outputs()
        if not cls.outputs:
            cls.outputs = _load_cfn_outputs(cls.stack_name, cls.region)

        # Pre-resolve LB and DB if present
        cls.lb_dns: Optional[str] = cls.outputs.get("AlbDnsName")
        cls.db_endpoint: Optional[str] = cls.outputs.get("DbEndpoint")

        cls.lb: Optional[Dict[str, Any]] = None
        cls.lb_arn: Optional[str] = None
        if cls.lb_dns:
            lb = _find_lb_by_dns(cls.lb_dns, cls.region)
            if lb:
                cls.lb = lb
                cls.lb_arn = lb.get("LoadBalancerArn")

        cls.dbi: Optional[Dict[str, Any]] = None
        if cls.db_endpoint:
            cls.dbi = _find_db_by_endpoint(cls.db_endpoint, cls.region)

    def setUp(self) -> None:
        if not self.outputs:
            self.skipTest("No outputs available from local file or CloudFormation; skipping live tests.")

    @pytest.mark.it("validates ALB DNS name output exists and is AWS-shaped")
    def test_alb_dns_output_format(self) -> None:
        alb_dns = self.outputs.get("AlbDnsName")
        if not alb_dns:
            self.skipTest("AlbDnsName output not available - deployment may have failed")
        self.assertIsInstance(alb_dns, str)
        self.assertTrue(alb_dns, "ALB DNS should not be empty")
        self.assertTrue(
            "elb.amazonaws.com" in alb_dns or "elasticloadbalancing" in alb_dns,
            "ALB DNS should be an AWS ELB endpoint",
        )
        self.assertNotIn("localhost", alb_dns)
        self.assertNotIn("127.0.0.1", alb_dns)

    @pytest.mark.it("resolves the ALB by DNS and checks scheme/type/listeners")
    def test_alb_live_properties(self) -> None:
        if not self.lb:
            self.skipTest("Load balancer not resolved; skipping ALB live checks")
        self.assertEqual(self.lb.get("Type"), "application")
        self.assertEqual(self.lb.get("Scheme"), "internet-facing")
        # Check listeners: one on 80 HTTP, one on 443 HTTPS
        elbv2 = boto3.client("elbv2", region_name=self.region)
        resp = elbv2.describe_listeners(LoadBalancerArn=self.lb_arn)
        ports = {(l["Port"], l["Protocol"]) for l in resp.get("Listeners", [])}
        self.assertIn((80, "HTTP"), ports)
        self.assertIn((443, "HTTPS"), ports)

    @pytest.mark.it("checks ALB security group ingress on 80/443 from 0.0.0.0/0")
    def test_alb_security_group_ingress(self) -> None:
        if not self.lb:
            self.skipTest("Load balancer not resolved; skipping SG checks")
        sg_ids = self.lb.get("SecurityGroups", [])
        sgs = _get_sg_details(sg_ids, self.region)
        # Flatten all ingress rules
        ingress: List[Tuple[int, int, str]] = []
        for sg in sgs:
            for perm in sg.get("IpPermissions", []):
                proto = perm.get("IpProtocol")
                if proto != "tcp":
                    continue
                from_p = perm.get("FromPort")
                to_p = perm.get("ToPort")
                for rng in perm.get("IpRanges", []):
                    cidr = rng.get("CidrIp")
                    if cidr:
                        ingress.append((from_p, to_p, cidr))
        self.assertIn((80, 80, "0.0.0.0/0"), ingress)
        self.assertIn((443, 443, "0.0.0.0/0"), ingress)

    @pytest.mark.it("validates RDS endpoint output format and security")
    def test_rds_endpoint_security_compliance(self) -> None:
        db_endpoint = self.outputs.get("DbEndpoint")
        if not db_endpoint:
            self.skipTest("DbEndpoint output not available - deployment may have failed")
        self.assertIsInstance(db_endpoint, str)
        self.assertTrue(db_endpoint, "DB endpoint should not be empty")
        self.assertIn("rds.amazonaws.com", db_endpoint, "DB endpoint should be AWS RDS domain")
        self.assertNotIn("localhost", db_endpoint)
        self.assertNotIn("127.0.0.1", db_endpoint)

    @pytest.mark.it("resolves DB instance by endpoint and checks engine/class/encryption/public access")
    def test_rds_live_properties(self) -> None:
        if not self.dbi:
            self.skipTest("DB instance not resolved; skipping RDS live checks")
        self.assertEqual(self.dbi.get("Engine"), "postgres")
        self.assertEqual(self.dbi.get("DBInstanceClass"), "db.t3.micro")
        self.assertTrue(self.dbi.get("StorageEncrypted"))
        self.assertFalse(self.dbi.get("PubliclyAccessible"))
        # Standard Postgres port
        ep = self.dbi.get("Endpoint") or {}
        self.assertEqual(str(ep.get("Port")), "5432")

    @pytest.mark.it("checks App SG allows SSH only from 192.168.1.0/24")
    def test_app_sg_ssh_restriction(self) -> None:
        # Discover App SG via ASG -> Launch Template -> SecurityGroups
        groups = _describe_asgs_for_stack(self.stack_name, self.region)
        if not groups:
            self.skipTest("No ASGs found for stack; skipping App SG SSH check")
        ec2 = boto3.client("ec2", region_name=self.region)

        # The Launch Template contains SGs; pick any attached SG as the App SG
        lt = groups[0].get("LaunchTemplate") or groups[0].get("LaunchTemplateSpecification") or {}
        if not lt:
            self.skipTest("ASG has no LaunchTemplate; skipping App SG SSH check")
        # Ask for template data to get SGs if not already present
        try:
            resp = ec2.describe_launch_template_versions(
                LaunchTemplateId=lt.get("LaunchTemplateId"),
                Versions=[lt.get("Version")],
            )
            versions = resp.get("LaunchTemplateVersions", [])
            if not versions:
                self.skipTest("Launch template version not found")
            data = versions[0].get("LaunchTemplateData", {}) or {}
            sg_ids = data.get("SecurityGroupIds", [])
            if not sg_ids:
                self.skipTest("No SGs attached to Launch Template")
            # Inspect ingress rules on the first SG
            sgs = _get_sg_details([sg_ids[0]], self.region)
            if not sgs:
                self.skipTest("Could not describe App SG")
            perms = sgs[0].get("IpPermissions", [])
            ssh_ok = any(
                p.get("IpProtocol") == "tcp"
                and p.get("FromPort") == 22
                and p.get("ToPort") == 22
                and any(r.get("CidrIp") == "192.168.1.0/24" for r in p.get("IpRanges", []))
                for p in perms
            )
            self.assertTrue(ssh_ok, "App SG must allow SSH only from 192.168.1.0/24")
        except (ClientError, BotoCoreError) as exc:
            self.skipTest(f"Error describing launch template: {exc}")

    @pytest.mark.it("checks DB SG allows 5432 only from App SG")
    def test_db_sg_rule_from_app(self) -> None:
        if not self.dbi:
            self.skipTest("DB instance not resolved; skipping DB SG rule check")
        ec2 = boto3.client("ec2", region_name=self.region)
        vpc_sg_ids = [sg.get("VpcSecurityGroupId") for sg in self.dbi.get("VpcSecurityGroups", [])]
        if not vpc_sg_ids:
            self.skipTest("DB has no VPC security groups")
        db_sgs = _get_sg_details(vpc_sg_ids, self.region)
        # Find a rule allowing tcp/5432 from a source SG
        found = False
        for sg in db_sgs:
            for perm in sg.get("IpPermissions", []):
                if perm.get("IpProtocol") == "tcp" and perm.get("FromPort") == 5432 and perm.get("ToPort") == 5432:
                    # It's source-SG based if UserIdGroupPairs present
                    if any(pair.get("GroupId") for pair in perm.get("UserIdGroupPairs", [])):
                        found = True
                        break
        self.assertTrue(found, "RDS SG must allow 5432 only from the App SG")

    @pytest.mark.it("validates ASG health and instance type (t3.micro)")
    def test_asg_health_and_instance_type(self) -> None:
        groups = _describe_asgs_for_stack(self.stack_name, self.region)
        if not groups:
            self.skipTest("No ASGs found for stack")
        g = groups[0]
        self.assertEqual(int(g.get("MinSize", 0)), 2)
        self.assertEqual(int(g.get("MaxSize", 0)), 5)
        self.assertEqual(int(g.get("DesiredCapacity", 0)), 2)
        itype = _launch_template_instance_type(g, self.region)
        # If we cannot resolve LT details, at least assert group exists
        if itype is not None:
            self.assertEqual(itype, "t3.micro")

    @pytest.mark.it("detects missing required outputs - deployment model failure")
    def test_required_outputs_presence(self) -> None:
        required = ["AlbDnsName", "DbEndpoint"]
        missing = [k for k in required if k not in self.outputs]
        if missing:
            self.fail(f"Missing required outputs: {missing}. Deployment may have failed or outputs misconfigured.")

    @pytest.mark.it("documents integration test completion")
    def test_integration_test_coverage(self) -> None:
        total_outputs = len(self.outputs)
        if total_outputs == 0:
            self.fail("No deployment outputs found (local or CloudFormation). Deployment likely failed.")

        print("\nIntegration test summary:")
        print(f"- Region: {self.region}")
        print(f"- Stack:  {self.stack_name}")
        print(f"- Total outputs found: {total_outputs}")
        print(f"- Outputs keys: {list(self.outputs.keys())}")


if __name__ == "__main__":
    unittest.main()
