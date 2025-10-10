# Model Response

## lib/src/main/java/app/Main.java

```java
package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;

/**
 * Main class for News Portal infrastructure deployment.
 */
public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    static void defineInfrastructure(final Context ctx) {
        // Create storage infrastructure
        StorageStack storage = new StorageStack(ctx);

        // Create Lambda@Edge function for A/B testing
        EdgeFunctionStack edgeFunction = new EdgeFunctionStack(ctx);

        // Create WAF rules first
        SecurityStack security = new SecurityStack(ctx);

        // Create CloudFront distribution with WAF
        CdnStack cdn = new CdnStack(ctx, storage, edgeFunction, security);

        // Create Route53 DNS with geolocation routing
        DnsStack dns = new DnsStack(ctx, cdn);

        // Create CloudWatch monitoring
        MonitoringStack monitoring = new MonitoringStack(ctx, cdn);

        // Export outputs
        ctx.export("bucketName", storage.getBucket().id());
        ctx.export("distributionDomainName", cdn.getDistribution().domainName());
        ctx.export("distributionId", cdn.getDistribution().id());
        ctx.export("hostedZoneId", dns.getHostedZone().id());
    }
}
```

## lib/src/main/java/app/StorageStack.java

```java
package app;

import com.pulumi.Context;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;
import com.pulumi.aws.s3.BucketLifecycleConfigurationV2;
import com.pulumi.aws.s3.BucketLifecycleConfigurationV2Args;
import com.pulumi.aws.s3.BucketPublicAccessBlock;
import com.pulumi.aws.s3.BucketPublicAccessBlockArgs;
import com.pulumi.aws.s3.inputs.BucketLifecycleConfigurationV2RuleArgs;
import com.pulumi.aws.s3.inputs.BucketLifecycleConfigurationV2RuleTransitionArgs;

import java.util.Map;

/**
 * Storage stack for S3 bucket configuration.
 */
public class StorageStack {
    private final Bucket bucket;

    public StorageStack(final Context ctx) {
        // Create S3 bucket for article storage
        this.bucket = new Bucket("news-articles-bucket",
            BucketArgs.builder()
                .tags(Map.of(
                    "Name", "NewsArticlesBucket",
                    "Environment", "production",
                    "ManagedBy", "pulumi"
                ))
                .build());

        // Block public access
        var publicAccessBlock = new BucketPublicAccessBlock("bucket-public-access-block",
            BucketPublicAccessBlockArgs.builder()
                .bucket(bucket.id())
                .blockPublicAcls(true)
                .blockPublicPolicy(true)
                .ignorePublicAcls(true)
                .restrictPublicBuckets(true)
                .build());

        // Configure lifecycle policy for 120-day archival
        var lifecycleConfig = new BucketLifecycleConfigurationV2("bucket-lifecycle",
            BucketLifecycleConfigurationV2Args.builder()
                .bucket(bucket.id())
                .rules(
                    BucketLifecycleConfigurationV2RuleArgs.builder()
                        .id("archive-old-content")
                        .status("Enabled")
                        .transitions(
                            BucketLifecycleConfigurationV2RuleTransitionArgs.builder()
                                .days(120)
                                .storageClass("GLACIER")
                                .build()
                        )
                        .build()
                )
                .build());
    }

    public Bucket getBucket() {
        return bucket;
    }
}
```

## lib/src/main/java/app/EdgeFunctionStack.java

```java
package app;

import com.pulumi.Context;
import com.pulumi.asset.StringAsset;
import com.pulumi.asset.AssetArchive;
import com.pulumi.aws.iam.Role;
import com.pulumi.aws.iam.RoleArgs;
import com.pulumi.aws.iam.RolePolicyAttachment;
import com.pulumi.aws.iam.RolePolicyAttachmentArgs;
import com.pulumi.aws.lambda.Function;
import com.pulumi.aws.lambda.FunctionArgs;
import com.pulumi.core.Output;

import java.util.Map;

/**
 * Lambda@Edge function stack for A/B testing.
 */
public class EdgeFunctionStack {
    private final Function edgeFunction;

    public EdgeFunctionStack(final Context ctx) {
        // Create IAM role for Lambda@Edge
        var lambdaRole = new Role("lambda-edge-role",
            RoleArgs.builder()
                .assumeRolePolicy("""
                    {
                        "Version": "2012-10-17",
                        "Statement": [
                            {
                                "Effect": "Allow",
                                "Principal": {
                                    "Service": [
                                        "lambda.amazonaws.com",
                                        "edgelambda.amazonaws.com"
                                    ]
                                },
                                "Action": "sts:AssumeRole"
                            }
                        ]
                    }
                    """)
                .build());

        // Attach basic execution role
        var roleAttachment = new RolePolicyAttachment("lambda-edge-policy",
            RolePolicyAttachmentArgs.builder()
                .role(lambdaRole.name())
                .policyArn("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole")
                .build());

        // Create Lambda@Edge function for A/B testing
        String functionCode = """
            exports.handler = async (event) => {
                const request = event.Records[0].cf.request;
                const headers = request.headers;

                // A/B testing logic - route 50% to version A, 50% to version B
                const randomValue = Math.random();

                if (randomValue < 0.5) {
                    headers['x-experiment-variant'] = [{ key: 'X-Experiment-Variant', value: 'A' }];
                } else {
                    headers['x-experiment-variant'] = [{ key: 'X-Experiment-Variant', value: 'B' }];
                }

                return request;
            };
            """;

        this.edgeFunction = new Function("ab-testing-edge-function",
            FunctionArgs.builder()
                .runtime("nodejs20.x")
                .handler("index.handler")
                .role(lambdaRole.arn())
                .code(new AssetArchive(Map.of("index.js", new StringAsset(functionCode))))
                .publish(true)
                .tags(Map.of(
                    "Name", "ABTestingEdgeFunction",
                    "Environment", "production"
                ))
                .build());
    }

    public Function getEdgeFunction() {
        return edgeFunction;
    }

    public Output<String> getQualifiedArn() {
        return edgeFunction.qualifiedArn();
    }
}
```

## lib/src/main/java/app/CdnStack.java

```java
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
```

## lib/src/main/java/app/SecurityStack.java

```java
package app;

import com.pulumi.Context;
import com.pulumi.aws.wafv2.WebAcl;
import com.pulumi.aws.wafv2.WebAclArgs;
import com.pulumi.aws.wafv2.inputs.WebAclDefaultActionArgs;
import com.pulumi.aws.wafv2.inputs.WebAclDefaultActionAllowArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleActionArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleActionBlockArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleStatementArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleStatementRateBasedStatementArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleVisibilityConfigArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleOverrideActionArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleOverrideActionNoneArgs;
import com.pulumi.aws.wafv2.inputs.WebAclRuleStatementManagedRuleGroupStatementArgs;
import com.pulumi.aws.wafv2.inputs.WebAclVisibilityConfigArgs;

import java.util.Map;

/**
 * Security stack for WAF configuration.
 */
public class SecurityStack {
    private final WebAcl webAcl;

    public SecurityStack(final Context ctx) {
        // Create WAF Web ACL with rate limiting
        this.webAcl = new WebAcl("news-portal-waf",
            WebAclArgs.builder()
                .name("news-portal-waf")
                .description("WAF for news portal with rate limiting")
                .scope("CLOUDFRONT")
                .defaultAction(
                    WebAclDefaultActionArgs.builder()
                        .allow(WebAclDefaultActionAllowArgs.builder().build())
                        .build()
                )
                .rules(
                    // Rate limiting rule - 2000 requests per 5 minutes
                    WebAclRuleArgs.builder()
                        .name("rate-limit-rule")
                        .priority(1)
                        .action(
                            WebAclRuleActionArgs.builder()
                                .block(WebAclRuleActionBlockArgs.builder().build())
                                .build()
                        )
                        .statement(
                            WebAclRuleStatementArgs.builder()
                                .rateBasedStatement(
                                    WebAclRuleStatementRateBasedStatementArgs.builder()
                                        .limit(2000)
                                        .aggregateKeyType("IP")
                                        .build()
                                )
                                .build()
                        )
                        .visibilityConfig(
                            WebAclRuleVisibilityConfigArgs.builder()
                                .cloudwatchMetricsEnabled(true)
                                .metricName("RateLimitRule")
                                .sampledRequestsEnabled(true)
                                .build()
                        )
                        .build(),
                    // AWS Managed Rules - Common Rule Set
                    WebAclRuleArgs.builder()
                        .name("aws-managed-rules")
                        .priority(2)
                        .overrideAction(
                            WebAclRuleOverrideActionArgs.builder()
                                .none(WebAclRuleOverrideActionNoneArgs.builder().build())
                                .build()
                        )
                        .statement(
                            WebAclRuleStatementArgs.builder()
                                .managedRuleGroupStatement(
                                    WebAclRuleStatementManagedRuleGroupStatementArgs.builder()
                                        .vendorName("AWS")
                                        .name("AWSManagedRulesCommonRuleSet")
                                        .build()
                                )
                                .build()
                        )
                        .visibilityConfig(
                            WebAclRuleVisibilityConfigArgs.builder()
                                .cloudwatchMetricsEnabled(true)
                                .metricName("AWSManagedRules")
                                .sampledRequestsEnabled(true)
                                .build()
                        )
                        .build()
                )
                .visibilityConfig(
                    WebAclVisibilityConfigArgs.builder()
                        .cloudwatchMetricsEnabled(true)
                        .metricName("NewsPortalWAF")
                        .sampledRequestsEnabled(true)
                        .build()
                )
                .tags(Map.of(
                    "Name", "NewsPortalWAF",
                    "Environment", "production"
                ))
                .build());

        // Note: WAF association with CloudFront is handled in the distribution configuration
    }

    public WebAcl getWebAcl() {
        return webAcl;
    }
}
```

## lib/src/main/java/app/DnsStack.java

```java
package app;

import java.util.Map;

import com.pulumi.Context;
import com.pulumi.aws.route53.Record;
import com.pulumi.aws.route53.RecordArgs;
import com.pulumi.aws.route53.Zone;
import com.pulumi.aws.route53.ZoneArgs;
import com.pulumi.aws.route53.inputs.RecordAliasArgs;
import com.pulumi.aws.route53.inputs.RecordGeolocationRoutingPolicyArgs;

/**
 * DNS stack for Route 53 with geolocation routing.
 */
public class DnsStack {
    private final Zone hostedZone;

    public DnsStack(final Context ctx, final CdnStack cdn) {
        // Create Route 53 hosted zone
        this.hostedZone = new Zone("news-portal-zone",
            ZoneArgs.builder()
                .name("newsportal-pr3916.iac-test.com")
                .comment("Hosted zone for news portal")
                .tags(Map.of(
                    "Name", "NewsPortalZone",
                    "Environment", "production"))
                .build());

        // Default record for all locations (with default geolocation)
        var defaultRecord = new Record("news-portal-default",
            RecordArgs.builder()
                .zoneId(hostedZone.zoneId())
                .name("www")
                .type("A")
                .setIdentifier("Default")
                .aliases(
                    RecordAliasArgs.builder()
                        .name(cdn.getDistribution().domainName())
                        .zoneId(cdn.getDistribution().hostedZoneId())
                        .evaluateTargetHealth(false)
                        .build())
                .geolocationRoutingPolicies(
                    RecordGeolocationRoutingPolicyArgs.builder()
                        // Route53 default geolocation catch-all
                        .country("*")
                        .build())
                .build());

        // North America geolocation record
        var northAmericaRecord = new Record("news-portal-na",
            RecordArgs.builder()
                .zoneId(hostedZone.zoneId())
                .name("www")
                .type("A")
                .setIdentifier("NorthAmerica")
                .aliases(
                    RecordAliasArgs.builder()
                        .name(cdn.getDistribution().domainName())
                        .zoneId(cdn.getDistribution().hostedZoneId())
                        .evaluateTargetHealth(true)
                        .build())
                .geolocationRoutingPolicies(
                    RecordGeolocationRoutingPolicyArgs.builder()
                        .continent("NA")
                        .build())
                .build());

        // Europe geolocation record
        var europeRecord = new Record("news-portal-eu",
            RecordArgs.builder()
                .zoneId(hostedZone.zoneId())
                .name("www")
                .type("A")
                .setIdentifier("Europe")
                .aliases(
                    RecordAliasArgs.builder()
                        .name(cdn.getDistribution().domainName())
                        .zoneId(cdn.getDistribution().hostedZoneId())
                        .evaluateTargetHealth(true)
                        .build())
                .geolocationRoutingPolicies(
                    RecordGeolocationRoutingPolicyArgs.builder()
                        .continent("EU")
                        .build())
                .build());

        // Asia geolocation record
        var asiaRecord = new Record("news-portal-as",
            RecordArgs.builder()
                .zoneId(hostedZone.zoneId())
                .name("www")
                .type("A")
                .setIdentifier("Asia")
                .aliases(
                    RecordAliasArgs.builder()
                        .name(cdn.getDistribution().domainName())
                        .zoneId(cdn.getDistribution().hostedZoneId())
                        .evaluateTargetHealth(true)
                        .build())
                .geolocationRoutingPolicies(
                    RecordGeolocationRoutingPolicyArgs.builder()
                        .continent("AS")
                        .build())
                .build());
    }

    public Zone getHostedZone() {
        return hostedZone;
    }
}
```

## lib/src/main/java/app/MonitoringStack.java

```java
package app;

import com.pulumi.Context;
import com.pulumi.aws.cloudwatch.Dashboard;
import com.pulumi.aws.cloudwatch.DashboardArgs;
import com.pulumi.aws.cloudwatch.MetricAlarm;
import com.pulumi.aws.cloudwatch.MetricAlarmArgs;
import com.pulumi.aws.sns.Topic;
import com.pulumi.aws.sns.TopicArgs;
import com.pulumi.core.Output;

import java.util.List;
import java.util.Map;

/**
 * Monitoring stack for CloudWatch dashboard and alarms.
 */
public class MonitoringStack {
    private final Dashboard dashboard;

    public MonitoringStack(final Context ctx, final CdnStack cdn) {
        // Create SNS topic for alarms
        var alarmTopic = new Topic("cloudfront-alarms",
            TopicArgs.builder()
                .name("news-portal-cloudfront-alarms")
                .tags(Map.of(
                    "Name", "CloudFrontAlarms",
                    "Environment", "production"
                ))
                .build());

        // Create CloudWatch dashboard for viewer metrics
        Output<String> dashboardBody = cdn.getDistribution().id().applyValue(distributionId ->
            String.format("""
                {
                    "widgets": [
                        {
                            "type": "metric",
                            "properties": {
                                "metrics": [
                                    ["AWS/CloudFront", "Requests", {"stat": "Sum", "label": "Total Requests"}]
                                ],
                                "period": 300,
                                "stat": "Sum",
                                "region": "us-east-1",
                                "title": "CloudFront Requests",
                                "yAxis": {
                                    "left": {
                                        "label": "Count"
                                    }
                                }
                            }
                        },
                        {
                            "type": "metric",
                            "properties": {
                                "metrics": [
                                    ["AWS/CloudFront", "BytesDownloaded", {"stat": "Sum", "label": "Bytes Downloaded"}],
                                    [".", "BytesUploaded", {"stat": "Sum", "label": "Bytes Uploaded"}]
                                ],
                                "period": 300,
                                "stat": "Sum",
                                "region": "us-east-1",
                                "title": "Data Transfer",
                                "yAxis": {
                                    "left": {
                                        "label": "Bytes"
                                    }
                                }
                            }
                        },
                        {
                            "type": "metric",
                            "properties": {
                                "metrics": [
                                    ["AWS/CloudFront", "4xxErrorRate", {"stat": "Average", "label": "4xx Error Rate"}],
                                    [".", "5xxErrorRate", {"stat": "Average", "label": "5xx Error Rate"}]
                                ],
                                "period": 300,
                                "stat": "Average",
                                "region": "us-east-1",
                                "title": "Error Rates",
                                "yAxis": {
                                    "left": {
                                        "label": "Percentage"
                                    }
                                }
                            }
                        },
                        {
                            "type": "metric",
                            "properties": {
                                "metrics": [
                                    ["AWS/CloudFront", "CacheHitRate", {"stat": "Average", "label": "Cache Hit Rate"}]
                                ],
                                "period": 300,
                                "stat": "Average",
                                "region": "us-east-1",
                                "title": "Cache Performance",
                                "yAxis": {
                                    "left": {
                                        "label": "Percentage"
                                    }
                                }
                            }
                        }
                    ]
                }
                """, distributionId)
        );

        this.dashboard = new Dashboard("news-portal-dashboard",
            DashboardArgs.builder()
                .dashboardName("NewsPortalMetrics")
                .dashboardBody(dashboardBody)
                .build());

        // Create alarm for high error rate
        var errorRateAlarm = new MetricAlarm("high-error-rate-alarm",
            MetricAlarmArgs.builder()
                .name("news-portal-high-error-rate")
                .comparisonOperator("GreaterThanThreshold")
                .evaluationPeriods(2)
                .metricName("5xxErrorRate")
                .namespace("AWS/CloudFront")
                .period(300)
                .statistic("Average")
                .threshold(5.0)
                .alarmDescription("Alert when 5xx error rate exceeds 5%")
                .alarmActions(alarmTopic.arn().applyValue(arn -> List.of(arn)))
                .treatMissingData("notBreaching")
                .tags(Map.of(
                    "Name", "HighErrorRateAlarm",
                    "Environment", "production"
                ))
                .build());

        // Create alarm for low cache hit rate
        var cacheHitAlarm = new MetricAlarm("low-cache-hit-alarm",
            MetricAlarmArgs.builder()
                .name("news-portal-low-cache-hit")
                .comparisonOperator("LessThanThreshold")
                .evaluationPeriods(3)
                .metricName("CacheHitRate")
                .namespace("AWS/CloudFront")
                .period(300)
                .statistic("Average")
                .threshold(70.0)
                .alarmDescription("Alert when cache hit rate falls below 70%")
                .alarmActions(alarmTopic.arn().applyValue(arn -> List.of(arn)))
                .treatMissingData("notBreaching")
                .tags(Map.of(
                    "Name", "LowCacheHitAlarm",
                    "Environment", "production"
                ))
                .build());
    }

    public Dashboard getDashboard() {
        return dashboard;
    }
}
```
