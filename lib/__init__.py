"""Blue-Green Deployment Infrastructure"""
from cdktf_cdktf_provider_aws.security_group import SecurityGroupIngress, SecurityGroupEgress


def create_allow_all_egress_rule():
    """Create a standard allow-all egress rule for security groups.

    Returns:
        SecurityGroupEgress: Egress rule allowing all outbound traffic
    """
    return SecurityGroupEgress(
        from_port=0,
        to_port=0,
        protocol='-1',
        cidr_blocks=['0.0.0.0/0'],
        description='Allow all outbound'
    )
