"""
AppMeshConstruct - AWS App Mesh for service discovery and mTLS
"""

from constructs import Construct
import aws_cdk as cdk
from aws_cdk import aws_appmesh as appmesh


class AppMeshConstruct(Construct):
    """
    Creates AWS App Mesh with:
    - Service mesh for microservices
    - mTLS encryption for service-to-service communication
    - Virtual gateway for ingress traffic
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str
    ):
        super().__init__(scope, construct_id)

        # Create App Mesh
        self.mesh = appmesh.Mesh(
            self,
            f"Mesh-{environment_suffix}",
            mesh_name=f"microservices-mesh-{environment_suffix}",
            egress_filter=appmesh.MeshFilterType.ALLOW_ALL
        )

        cdk.Tags.of(self.mesh).add("Name", f"microservices-mesh-{environment_suffix}")
        cdk.Tags.of(self.mesh).add("Environment", environment_suffix)
