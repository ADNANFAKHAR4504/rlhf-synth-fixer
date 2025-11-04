"""
efs_stack.py

EFS file system for persistent storage across ECS tasks.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions
from typing import Optional, List


class EfsStack(pulumi.ComponentResource):
    """
    Creates EFS file system with mount targets in multiple AZs.
    """

    def __init__(
        self,
        name: str,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        tags: Optional[dict] = None,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('custom:efs:EfsStack', name, None, opts)

        self.tags = tags or {}
        child_opts = ResourceOptions(parent=self)

        # Create security group for EFS
        self.security_group = aws.ec2.SecurityGroup(
            f'{name}-efs-sg',
            vpc_id=vpc_id,
            description='Security group for EFS file system',
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                from_port=2049,
                to_port=2049,
                protocol='tcp',
                cidr_blocks=['10.0.0.0/16']
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol='-1',
                cidr_blocks=['0.0.0.0/0']
            )],
            tags={**self.tags, 'Name': f'{name}-efs-sg'},
            opts=child_opts
        )

        # Create EFS file system
        self.file_system = aws.efs.FileSystem(
            f'{name}-efs',
            encrypted=True,
            performance_mode='generalPurpose',
            throughput_mode='bursting',
            lifecycle_policies=[
                aws.efs.FileSystemLifecyclePolicyArgs(
                    transition_to_ia='AFTER_30_DAYS'
                )
            ],
            tags={**self.tags, 'Name': f'{name}-efs'},
            opts=child_opts
        )

        # Create mount targets in each private subnet
        self.mount_targets = []
        for i, subnet_id in enumerate(private_subnet_ids):
            mount_target = aws.efs.MountTarget(
                f'{name}-mount-target-{i+1}',
                file_system_id=self.file_system.id,
                subnet_id=subnet_id,
                security_groups=[self.security_group.id],
                opts=child_opts
            )
            self.mount_targets.append(mount_target)

        # Create access point for ECS
        self.access_point = aws.efs.AccessPoint(
            f'{name}-access-point',
            file_system_id=self.file_system.id,
            posix_user=aws.efs.AccessPointPosixUserArgs(
                gid=1000,
                uid=1000
            ),
            root_directory=aws.efs.AccessPointRootDirectoryArgs(
                path='/ecs-data',
                creation_info=aws.efs.AccessPointRootDirectoryCreationInfoArgs(
                    owner_gid=1000,
                    owner_uid=1000,
                    permissions='755'
                )
            ),
            tags=self.tags,
            opts=child_opts
        )

        # Store outputs
        self.file_system_id = self.file_system.id
        self.access_point_id = self.access_point.id
        self.security_group_id = self.security_group.id

        self.register_outputs({
            'file_system_id': self.file_system_id,
            'access_point_id': self.access_point_id,
        })
