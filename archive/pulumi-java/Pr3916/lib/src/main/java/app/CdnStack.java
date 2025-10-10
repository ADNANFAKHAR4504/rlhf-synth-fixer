package app;

import com.pulumi.Context;
import com.pulumi.aws.cloudfront.Distribution;
import com.pulumi.aws.cloudfront.DistributionArgs;
import com.pulumi.aws.cloudfront.OriginAccessControl;
import com.pulumi.aws.cloudfront.OriginAccessControlArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionOriginArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionDefaultCacheBehaviorArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionDefaultCacheBehaviorForwardedValuesArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionDefaultCacheBehaviorLambdaFunctionAssociationArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionOrderedCacheBehaviorArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionOrderedCacheBehaviorForwardedValuesArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionOrderedCacheBehaviorForwardedValuesCookiesArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionRestrictionsArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionRestrictionsGeoRestrictionArgs;
import com.pulumi.aws.cloudfront.inputs.DistributionViewerCertificateArgs;
import com.pulumi.aws.s3.BucketPolicy;
import com.pulumi.aws.s3.BucketPolicyArgs;
import com.pulumi.core.Output;
import com.pulumi.core.Either;

import java.util.List;
import java.util.Map;

/**
 * CloudFront CDN stack with multiple origins and cache behaviors.
 */
public class CdnStack {
    private final Distribution distribution;

    public CdnStack(final Context ctx, final StorageStack storage, final EdgeFunctionStack edgeFunction, final SecurityStack security) {
        // Create Origin Access Control for S3
        var oac = new OriginAccessControl("s3-oac",
            OriginAccessControlArgs.builder()
                .name("news-portal-oac")
                .description("OAC for news portal S3 bucket")
                .originAccessControlOriginType("s3")
                .signingBehavior("always")
                .signingProtocol("sigv4")
                .build());

        // Create CloudFront distribution with multiple origins
        this.distribution = new Distribution("news-portal-cdn",
            DistributionArgs.builder()
                .enabled(true)
                .comment("News portal CDN with A/B testing")
                .defaultRootObject("index.html")
                .priceClass("PriceClass_100")
                .origins(
                    DistributionOriginArgs.builder()
                        .originId("S3-articles")
                        .domainName(storage.getBucket().bucketRegionalDomainName())
                        .originAccessControlId(oac.id())
                        .build()
                )
                .defaultCacheBehavior(
                    DistributionDefaultCacheBehaviorArgs.builder()
                        .targetOriginId("S3-articles")
                        .viewerProtocolPolicy("redirect-to-https")
                        .allowedMethods(List.of("GET", "HEAD", "OPTIONS"))
                        .cachedMethods(List.of("GET", "HEAD"))
                        .compress(true)
                        .forwardedValues(
                            DistributionDefaultCacheBehaviorForwardedValuesArgs.builder()
                                .queryString(true)
                                .cookies(
                                    DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs.builder()
                                        .forward("none")
                                        .build()
                                )
                                .build()
                        )
                        .minTtl(0)
                        .defaultTtl(3600)
                        .maxTtl(86400)
                        .lambdaFunctionAssociations(
                            DistributionDefaultCacheBehaviorLambdaFunctionAssociationArgs.builder()
                                .eventType("viewer-request")
                                .lambdaArn(edgeFunction.getQualifiedArn())
                                .includeBody(false)
                                .build()
                        )
                        .build()
                )
                .orderedCacheBehaviors(
                    // Cache behavior for static assets
                    DistributionOrderedCacheBehaviorArgs.builder()
                        .pathPattern("/static/*")
                        .targetOriginId("S3-articles")
                        .viewerProtocolPolicy("redirect-to-https")
                        .allowedMethods(List.of("GET", "HEAD"))
                        .cachedMethods(List.of("GET", "HEAD"))
                        .compress(true)
                        .forwardedValues(
                            DistributionOrderedCacheBehaviorForwardedValuesArgs.builder()
                                .queryString(false)
                                .cookies(
                                    DistributionOrderedCacheBehaviorForwardedValuesCookiesArgs.builder()
                                        .forward("none")
                                        .build()
                                )
                                .build()
                        )
                        .minTtl(0)
                        .defaultTtl(86400)
                        .maxTtl(31536000)
                        .build(),
                    // Cache behavior for API requests
                    DistributionOrderedCacheBehaviorArgs.builder()
                        .pathPattern("/api/*")
                        .targetOriginId("S3-articles")
                        .viewerProtocolPolicy("redirect-to-https")
                        .allowedMethods(List.of("GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"))
                        .cachedMethods(List.of("GET", "HEAD"))
                        .compress(true)
                        .forwardedValues(
                            DistributionOrderedCacheBehaviorForwardedValuesArgs.builder()
                                .queryString(true)
                                .headers(List.of("Authorization", "CloudFront-Forwarded-Proto"))
                                .cookies(
                                    DistributionOrderedCacheBehaviorForwardedValuesCookiesArgs.builder()
                                        .forward("all")
                                        .build()
                                )
                                .build()
                        )
                        .minTtl(0)
                        .defaultTtl(0)
                        .maxTtl(0)
                        .build()
                )
                .restrictions(
                    DistributionRestrictionsArgs.builder()
                        .geoRestriction(
                            DistributionRestrictionsGeoRestrictionArgs.builder()
                                .restrictionType("none")
                                .build()
                        )
                        .build()
                )
                .viewerCertificate(
                    DistributionViewerCertificateArgs.builder()
                        .cloudfrontDefaultCertificate(true)
                        .build()
                )
                .webAclId(security.getWebAcl().arn())
                .tags(Map.of(
                    "Name", "NewsPortalCDN",
                    "Environment", "production"
                ))
                .build());

        // Update bucket policy to allow CloudFront OAC access
        Output<Either<String, com.pulumi.aws.s3.inputs.PolicyDocumentArgs>> policyDocument =
            Output.tuple(storage.getBucket().arn(), distribution.arn()).applyValue(tuple -> {
                String bucketArn = tuple.t1;
                String distributionArn = tuple.t2;
                String policyJson = String.format("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": "cloudfront.amazonaws.com"
                                },
                                "Action": "s3:GetObject",
                                "Resource": "%s/*",
                                "Condition": {
                                    "StringEquals": {
                                        "AWS:SourceArn": "%s"
                                    }
                                }
                            }
                        ]
                    }
                    """, bucketArn, distributionArn);
                return Either.ofLeft(policyJson);
            });

        var bucketPolicy = new BucketPolicy("bucket-policy",
            BucketPolicyArgs.builder()
                .bucket(storage.getBucket().id())
                .policy(policyDocument)
                .build());
    }

    public Distribution getDistribution() {
        return distribution;
    }
}
