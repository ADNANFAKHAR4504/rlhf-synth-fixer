from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    CfnOutput,
)
from constructs import Construct
from .security_constructs import (
    SecurityFoundationConstruct,
    NetworkSecurityConstruct,
    ComputeSecurityConstruct,
    DatabaseSecurityConstruct,
    ApplicationSecurityConstruct,
    LoadBalancerSecurityConstruct,
    MonitoringSecurityConstruct,
    WAFSecurityConstruct,
    CloudFrontSecurityConstruct,
    SecurityHubConstruct
)

class SecurityStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str = "dev", **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        self.environment_suffix = environment_suffix
        
        # Security Foundation (KMS, S3)
        security_foundation = SecurityFoundationConstruct(
            self, "SecurityFoundation",
            environment_suffix=self.environment_suffix
        )
        
        # Network Security (VPC, Security Groups)
        network_security = NetworkSecurityConstruct(
            self, "NetworkSecurity",
            environment_suffix=self.environment_suffix
        )
        
        # Compute Security (EC2, Bastion)
        compute_security = ComputeSecurityConstruct(
            self, "ComputeSecurity",
            vpc=network_security.vpc,
            bastion_sg=network_security.bastion_sg,
            app_sg=network_security.app_sg,
            environment_suffix=self.environment_suffix
        )
        
        # Database Security (RDS)
        database_security = DatabaseSecurityConstruct(
            self, "DatabaseSecurity",
            vpc=network_security.vpc,
            db_sg=network_security.db_sg,
            kms_key=security_foundation.kms_key,
            environment_suffix=self.environment_suffix
        )
        
        # Application Security (Lambda, API Gateway)
        application_security = ApplicationSecurityConstruct(
            self, "ApplicationSecurity",
            vpc=network_security.vpc,
            environment_suffix=self.environment_suffix
        )
        
        # Load Balancer Security (ALB, ACM)
        load_balancer_security = LoadBalancerSecurityConstruct(
            self, "LoadBalancerSecurity",
            vpc=network_security.vpc,
            alb_sg=network_security.alb_sg,
            environment_suffix=self.environment_suffix
        )
        
        # Monitoring Security (CloudTrail, Config)
        monitoring_security = MonitoringSecurityConstruct(
            self, "MonitoringSecurity",
            cloudtrail_bucket=security_foundation.cloudtrail_bucket,
            environment_suffix=self.environment_suffix
        )
        
        # WAF Security
        waf_security = WAFSecurityConstruct(
            self, "WAFSecurity",
            environment_suffix=self.environment_suffix
        )
        
        # CloudFront Security
        cloudfront_security = CloudFrontSecurityConstruct(
            self, "CloudFrontSecurity",
            bucket=security_foundation.secure_bucket,
            web_acl=waf_security.web_acl,
            environment_suffix=self.environment_suffix
        )
        
        # Security Hub
        security_hub = SecurityHubConstruct(
            self, "SecurityHub",
            environment_suffix=self.environment_suffix
        )
        
        # Outputs
        CfnOutput(
            self, "VPCId",
            value=network_security.vpc.vpc_id,
            description="VPC ID"
        )
        
        CfnOutput(
            self, "BastionHostId",
            value=compute_security.bastion_host.instance_id,
            description="Bastion Host Instance ID"
        )
        
        CfnOutput(
            self, "DatabaseEndpoint",
            value=database_security.database.instance_endpoint.hostname,
            description="RDS Database Endpoint"
        )
        
        CfnOutput(
            self, "APIGatewayURL",
            value=application_security.api.url,
            description="API Gateway URL"
        )
        
        CfnOutput(
            self, "LoadBalancerDNS",
            value=load_balancer_security.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS Name"
        )
        
        CfnOutput(
            self, "CloudFrontDomain",
            value=cloudfront_security.distribution.distribution_domain_name,
            description="CloudFront Distribution Domain Name"
        )
        
        CfnOutput(
            self, "SecureBucketName",
            value=security_foundation.secure_bucket.bucket_name,
            description="Secure S3 Bucket Name"
        )
