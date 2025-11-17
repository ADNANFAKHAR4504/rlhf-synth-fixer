"""
CloudFront module for CDN distribution management.

This module creates CloudFront distributions with S3 origins,
geo-restrictions, and HTTPS-only access.
"""

import pulumi
import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .s3 import S3Stack


class CloudFrontStack:
    """
    Manages CloudFront distributions.
    
    Creates distributions with S3 origins, configurable geo-restrictions,
    and HTTPS enforcement.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        s3_stack: S3Stack
    ):
        """
        Initialize the CloudFront stack.
        
        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            s3_stack: S3Stack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.s3_stack = s3_stack
        self.distributions = {}
        self.oais = {}
        
        self._create_content_distribution()
    
    def _create_content_distribution(self):
        """Create CloudFront distribution for static content."""
        opts = self.provider_manager.get_resource_options()
        
        oai = aws.cloudfront.OriginAccessIdentity(
            'content-oai',
            comment='OAI for content bucket',
            opts=opts
        )
        
        self.oais['content'] = oai
        
        content_bucket = self.s3_stack.get_bucket('content')
        
        bucket_policy = pulumi.Output.all(
            bucket_name=content_bucket.id,
            oai_arn=oai.iam_arn
        ).apply(lambda args: {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "AWS": args['oai_arn']
                },
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{args['bucket_name']}/*"
            }]
        })
        
        aws.s3.BucketPolicy(
            'content-bucket-policy',
            bucket=content_bucket.id,
            policy=bucket_policy.apply(lambda p: pulumi.Output.json_dumps(p)),
            opts=opts
        )
        
        distribution = aws.cloudfront.Distribution(
            'content-distribution',
            enabled=True,
            is_ipv6_enabled=True,
            comment='Content distribution',
            default_root_object='index.html',
            origins=[
                aws.cloudfront.DistributionOriginArgs(
                    domain_name=content_bucket.bucket_regional_domain_name,
                    origin_id='S3-content',
                    s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
                        origin_access_identity=oai.cloudfront_access_identity_path
                    )
                )
            ],
            default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
                allowed_methods=['GET', 'HEAD', 'OPTIONS'],
                cached_methods=['GET', 'HEAD'],
                target_origin_id='S3-content',
                viewer_protocol_policy='redirect-to-https',
                compress=True,
                forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
                    query_string=False,
                    cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                        forward='none'
                    )
                ),
                min_ttl=0,
                default_ttl=3600,
                max_ttl=86400
            ),
            restrictions=aws.cloudfront.DistributionRestrictionsArgs(
                geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                    restriction_type=self.config.cloudfront_geo_restriction_type,
                    locations=self.config.cloudfront_geo_locations
                )
            ),
            viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
                cloudfront_default_certificate=True
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )
        
        self.distributions['content'] = distribution
    
    def get_distribution(self, dist_key: str) -> aws.cloudfront.Distribution:
        """
        Get a distribution by key.
        
        Args:
            dist_key: Key of the distribution
            
        Returns:
            CloudFront Distribution resource
        """
        return self.distributions.get(dist_key)
    
    def get_distribution_domain_name(self, dist_key: str) -> pulumi.Output[str]:
        """
        Get the domain name of a distribution.
        
        Args:
            dist_key: Key of the distribution
            
        Returns:
            Distribution domain name as Output
        """
        dist = self.get_distribution(dist_key)
        return dist.domain_name if dist else None

