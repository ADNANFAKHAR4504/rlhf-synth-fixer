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
