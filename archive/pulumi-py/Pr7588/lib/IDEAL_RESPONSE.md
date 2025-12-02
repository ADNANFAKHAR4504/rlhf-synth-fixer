# FastShop Secure Data Pipeline Infrastructure - Pulumi Python Implementation (IDEAL)

This document contains the corrected Pulumi Python implementation for FastShop's secure, LGPD-compliant data pipeline infrastructure.

## Critical Fix Applied

### ElastiCache ReplicationGroup Output Attributes

**Issue**: The MODEL_RESPONSE used incorrect attributes for accessing ElastiCache ReplicationGroup endpoints.

**Incorrect (MODEL_RESPONSE)**:
```python
'redis_endpoint': self.redis_cluster.cache_nodes[0].address,
'redis_port': self.redis_cluster.cache_nodes[0].port,
```

**Correct (IDEAL_RESPONSE)**:
```python
'redis_endpoint': self.redis_cluster.configuration_endpoint_address,
'redis_port': self.redis_cluster.port,
```

**Explanation**: Pulumi's `aws.elasticache.ReplicationGroup` resource does not expose a `cache_nodes` attribute. The correct way to access the endpoint for a ReplicationGroup is through `configuration_endpoint_address` (which provides the configuration endpoint for Redis cluster mode) and `port` attributes.

## Complete Corrected Implementation

```python
"""
tap_stack.py

This module defines the TapStack class for FastShop's secure data pipeline infrastructure.
It creates a complete real-time transaction processing system with LGPD-compliant encryption
and security controls.
"""

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (str): Suffix for identifying the deployment environment (e.g., 'dev', 'prod').
            This is used in resource naming to avoid conflicts across deployments.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: str, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for FastShop's data pipeline infrastructure.

    This component creates a secure, LGPD-compliant real-time transaction processing system
    with encryption at rest, network isolation, and high availability.

    Components:
        - VPC with public and private subnets across 2 AZs
        - KMS key for encryption
        - Kinesis Data Stream for real-time ingestion
        - RDS PostgreSQL for persistent storage
        - ElastiCache Redis for caching with automatic failover
        - Security groups for network isolation

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Create VPC and networking infrastructure
        self._create_vpc()

        # Create KMS key for encryption
        self._create_kms_key()

        # Create security groups
        self._create_security_groups()

        # Create Kinesis Data Stream
        self._create_kinesis_stream()

        # Create RDS PostgreSQL
        self._create_rds_instance()

        # Create ElastiCache Redis cluster
        self._create_elasticache_cluster()

        # Register outputs
        self.register_outputs({
            'vpc_id': self.vpc.id,
            'kinesis_stream_name': self.kinesis_stream.name,
            'kinesis_stream_arn': self.kinesis_stream.arn,
            'rds_endpoint': self.rds_instance.endpoint,
            'rds_arn': self.rds_instance.arn,
            'redis_endpoint': self.redis_cluster.configuration_endpoint_address,  # CORRECTED
            'redis_port': self.redis_cluster.port,  # CORRECTED
            'kms_key_id': self.kms_key.id,
        })

    # All other methods remain unchanged from MODEL_RESPONSE
    # (VPC, KMS, Security Groups, Kinesis, RDS, ElastiCache creation methods)
```

## Summary of Changes

1. **Fixed ElastiCache Output Attributes** (Critical):
   - Changed `self.redis_cluster.cache_nodes[0].address` to `self.redis_cluster.configuration_endpoint_address`
   - Changed `self.redis_cluster.cache_nodes[0].port` to `self.redis_cluster.port`
   - This fix resolves the `AttributeError: 'ReplicationGroup' object has no attribute 'cache_nodes'` error

## Architecture Compliance

The corrected implementation maintains all original requirements:

- **VPC**: Multi-AZ with public and private subnets ✓
- **KMS**: Customer managed encryption key ✓
- **Kinesis**: Real-time data stream with KMS encryption ✓
- **RDS PostgreSQL**: In private subnet with encryption ✓
- **ElastiCache Redis**: Automatic failover with 2 nodes ✓
- **Security**: Least privilege security groups ✓
- **LGPD Compliance**: All data encrypted at rest ✓
- **Destroyability**: No retention policies ✓
- **Naming**: environment_suffix in all resources ✓
