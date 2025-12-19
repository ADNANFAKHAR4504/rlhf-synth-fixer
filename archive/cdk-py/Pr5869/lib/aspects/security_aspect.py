"""security_aspect.py

CDK aspect to enforce security policies.
"""

import jsii
from aws_cdk import (
    IAspect,
    aws_s3 as s3,
    aws_rds as rds,
)
from constructs import IConstruct


@jsii.implements(IAspect)
class SecurityPolicyAspect:
    """CDK Aspect to enforce security policies."""

    def visit(self, node: IConstruct) -> None:
        """Visit each construct and apply security policies."""

        if isinstance(node, s3.CfnBucket):
            if not node.bucket_encryption:
                print(f"WARNING: S3 bucket {node.node.id} missing encryption")

        if isinstance(node, rds.CfnDBCluster):
            if not node.storage_encrypted:
                print(f"WARNING: RDS cluster {node.node.id} missing encryption")
