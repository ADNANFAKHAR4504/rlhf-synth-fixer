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
