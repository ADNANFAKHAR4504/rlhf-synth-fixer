"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import json
import os
import re
from pathlib import Path
import pytest


@pytest.fixture(scope="module")
def outputs():
    """Load stack outputs from flat-outputs.json."""
    outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
    
    if not outputs_path.exists():
        pytest.skip(f"Outputs file not found at {outputs_path}")
    
    with open(outputs_path, 'r') as f:
        return json.load(f)


@pytest.fixture(scope="module")
def environment_suffix():
    """Get environment suffix from environment variable."""
    return os.getenv('ENVIRONMENT_SUFFIX', 'dev')


class TestDeploymentOutputs:
    """Test that all required deployment outputs are present."""
    
    def test_cluster_endpoint_exists(self, outputs):
        """Test that cluster endpoint is defined."""
        assert 'cluster_endpoint' in outputs
        assert outputs['cluster_endpoint'] is not None
        assert len(outputs['cluster_endpoint']) > 0
    
    def test_cluster_name_exists(self, outputs):
        """Test that cluster name is defined."""
        assert 'cluster_name' in outputs
        assert outputs['cluster_name'] is not None
        assert len(outputs['cluster_name']) > 0
    
    def test_kubeconfig_command_exists(self, outputs):
        """Test that kubeconfig command is defined."""
        assert 'kubeconfig_command' in outputs
        assert outputs['kubeconfig_command'] is not None
        assert len(outputs['kubeconfig_command']) > 0
    
    def test_oidc_issuer_url_exists(self, outputs):
        """Test that OIDC issuer URL is defined."""
        assert 'oidc_issuer_url' in outputs
        assert outputs['oidc_issuer_url'] is not None
        assert len(outputs['oidc_issuer_url']) > 0
    
    def test_tenant_bucket_name_exists(self, outputs):
        """Test that tenant bucket name is defined."""
        assert 'tenant_bucket_name' in outputs
        assert outputs['tenant_bucket_name'] is not None
        assert len(outputs['tenant_bucket_name']) > 0
    
    def test_vpc_id_exists(self, outputs):
        """Test that VPC ID is defined."""
        assert 'vpc_id' in outputs
        assert outputs['vpc_id'] is not None
        assert len(outputs['vpc_id']) > 0


class TestEKSCluster:
    """Test EKS cluster configuration and endpoints."""
    
    def test_cluster_endpoint_is_https(self, outputs):
        """Test that cluster endpoint uses HTTPS."""
        cluster_endpoint = outputs['cluster_endpoint']
        assert cluster_endpoint.startswith('https://')
    
    def test_cluster_endpoint_is_eks_domain(self, outputs):
        """Test that cluster endpoint is on EKS domain."""
        cluster_endpoint = outputs['cluster_endpoint']
        assert '.eks.' in cluster_endpoint or '.gr7.' in cluster_endpoint
    
    def test_cluster_endpoint_includes_region(self, outputs):
        """Test that cluster endpoint includes AWS region."""
        cluster_endpoint = outputs['cluster_endpoint']
        region_pattern = r'(us|eu|ap|ca|sa|me|af)-(east|west|north|south|central|southeast|northeast)-[1-3]'
        assert re.search(region_pattern, cluster_endpoint)
    
    def test_cluster_name_format(self, outputs):
        """Test that cluster name follows naming convention."""
        cluster_name = outputs['cluster_name']
        assert cluster_name.startswith('eks-cluster-')
    
    def test_cluster_name_includes_suffix(self, outputs, environment_suffix):
        """Test that cluster name includes environment suffix."""
        cluster_name = outputs['cluster_name']
        assert environment_suffix in cluster_name


class TestKubeconfigCommand:
    """Test kubeconfig command format and contents."""
    
    def test_command_is_aws_eks(self, outputs):
        """Test that command uses AWS EKS CLI."""
        command = outputs['kubeconfig_command']
        assert command.startswith('aws eks update-kubeconfig')
    
    def test_command_includes_cluster_name(self, outputs):
        """Test that command includes cluster name."""
        command = outputs['kubeconfig_command']
        cluster_name = outputs['cluster_name']
        assert f'--name {cluster_name}' in command
    
    def test_command_includes_region(self, outputs):
        """Test that command includes region flag."""
        command = outputs['kubeconfig_command']
        assert '--region' in command
        region_pattern = r'--region (us|eu|ap|ca|sa|me|af)-(east|west|north|south|central|southeast|northeast)-[1-3]'
        assert re.search(region_pattern, command)


class TestOIDCProvider:
    """Test OIDC provider configuration for IRSA."""
    
    def test_oidc_url_is_https(self, outputs):
        """Test that OIDC issuer URL uses HTTPS."""
        oidc_url = outputs['oidc_issuer_url']
        assert oidc_url.startswith('https://')
    
    def test_oidc_url_is_eks_domain(self, outputs):
        """Test that OIDC issuer URL is on EKS OIDC domain."""
        oidc_url = outputs['oidc_issuer_url']
        assert 'oidc.eks.' in oidc_url
    
    def test_oidc_url_includes_region(self, outputs):
        """Test that OIDC issuer URL includes AWS region."""
        oidc_url = outputs['oidc_issuer_url']
        region_pattern = r'(us|eu|ap|ca|sa|me|af)-(east|west|north|south|central|southeast|northeast)-[1-3]'
        assert re.search(region_pattern, oidc_url)
    
    def test_oidc_url_includes_issuer_id(self, outputs):
        """Test that OIDC issuer URL includes issuer ID."""
        oidc_url = outputs['oidc_issuer_url']
        assert '/id/' in oidc_url
        issuer_id = oidc_url.split('/id/')[-1]
        assert len(issuer_id) == 32
        assert re.match(r'^[A-F0-9]{32}$', issuer_id)


class TestTenantBucket:
    """Test tenant S3 bucket configuration."""
    
    def test_bucket_name_format(self, outputs):
        """Test that bucket name follows naming convention."""
        bucket_name = outputs['tenant_bucket_name']
        assert bucket_name.startswith('eks-tenant-data-')
    
    def test_bucket_name_includes_suffix(self, outputs, environment_suffix):
        """Test that bucket name includes environment suffix."""
        bucket_name = outputs['tenant_bucket_name']
        assert environment_suffix in bucket_name
    
    def test_bucket_name_is_lowercase(self, outputs):
        """Test that bucket name is lowercase."""
        bucket_name = outputs['tenant_bucket_name']
        assert bucket_name == bucket_name.lower()
    
    def test_bucket_name_no_invalid_chars(self, outputs):
        """Test that bucket name contains no invalid characters."""
        bucket_name = outputs['tenant_bucket_name']
        assert re.match(r'^[a-z0-9-]+$', bucket_name)


class TestVPC:
    """Test VPC configuration."""
    
    def test_vpc_id_format(self, outputs):
        """Test that VPC ID follows AWS format."""
        vpc_id = outputs['vpc_id']
        assert vpc_id.startswith('vpc-')
    
    def test_vpc_id_valid_format(self, outputs):
        """Test that VPC ID matches valid AWS format."""
        vpc_id = outputs['vpc_id']
        assert re.match(r'^vpc-[a-f0-9]{8,17}$', vpc_id)


class TestResourceNaming:
    """Test that all resources follow consistent naming conventions."""
    
    def test_all_resources_include_suffix(self, outputs, environment_suffix):
        """Test that all named resources include environment suffix."""
        cluster_name = outputs['cluster_name']
        bucket_name = outputs['tenant_bucket_name']
        
        assert environment_suffix in cluster_name
        assert environment_suffix in bucket_name
    
    def test_cluster_name_convention(self, outputs):
        """Test cluster name follows eks-cluster-{suffix} pattern."""
        cluster_name = outputs['cluster_name']
        assert re.match(r'^eks-cluster-[a-z0-9]+$', cluster_name)
    
    def test_bucket_name_convention(self, outputs):
        """Test bucket name follows eks-tenant-data-{suffix} pattern."""
        bucket_name = outputs['tenant_bucket_name']
        assert re.match(r'^eks-tenant-data-[a-z0-9]+$', bucket_name)
