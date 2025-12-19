from aws_cdk import (
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    NestedStack,
    CfnOutput,
    RemovalPolicy,
)
from constructs import Construct


class S3CloudFrontStack(NestedStack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # S3 bucket for product images
        self.image_bucket = s3.Bucket(
            self,
            "ProductImagesBucket",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # CloudFront distribution
        self.distribution = cloudfront.Distribution(
            self,
            "ImageCDN",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(
                    self.image_bucket
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                compress=True,
            ),
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            enabled=True,
        )

        CfnOutput(
            self,
            "BucketName",
            value=self.image_bucket.bucket_name,
            export_name="ProductImagesBucketName",
        )

        CfnOutput(
            self,
            "CloudFrontDomain",
            value=self.distribution.distribution_domain_name,
            export_name="CloudFrontDistributionDomain",
        )
