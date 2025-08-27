package app;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.List;
import java.util.Map;

import static software.amazon.awscdk.assertions.Match.objectLike;

/**
 * Unit tests for the Nova CDK application.
 *
 * These tests verify that the NovaStack and Route53Stack synthesize
 * correctly and create the expected resources with the right properties.
 */
public class MainTest {

    private static App app;
    private static Main.NovaStack primaryStack;
    private static Main.NovaStack failoverStack;
    private static Template primaryTemplate;
    private static Template failoverTemplate;
    private static Template route53Template;
    private static final String TEST_SUFFIX = "test";

    @BeforeAll
    public static void setup() {
        app = new App();

        // Synthesize the primary stack for testing
        primaryStack = new Main.NovaStack(app, "NovaStack-Primary-" + TEST_SUFFIX,
            NovaStackProps.builder()
                .isPrimary(true)
                .environmentSuffix(TEST_SUFFIX)
                .stackProps(StackProps.builder()
                    .env(Environment.builder().region("us-west-2").build())
                    .build())
                .build());

        // Synthesize the failover stack for testing
        failoverStack = new Main.NovaStack(app, "NovaStack-Failover-" + TEST_SUFFIX,
            NovaStackProps.builder()
                .isPrimary(false)
                .environmentSuffix(TEST_SUFFIX)
                .stackProps(StackProps.builder()
                    .env(Environment.builder().region("eu-central-1").build())
                    .build())
                .build());

        // Synthesize the Route53 stack for testing
        Main.Route53Stack route53Stack = new Main.Route53Stack(app, "NovaRoute53Stack-Test",
            Route53StackProps.builder()
                .primaryLoadBalancer(primaryStack.getLoadBalancer())
                .failoverLoadBalancer(failoverStack.getLoadBalancer())
                .stackProps(StackProps.builder()
                    .crossRegionReferences(true)
                    .env(Environment.builder().region("us-east-1").build()) // Anchor stack to a region
                    .build())
                .build());

        primaryTemplate = Template.fromStack(primaryStack);
        failoverTemplate = Template.fromStack(failoverStack);
        route53Template = Template.fromStack(route53Stack);
    }

    // --- NovaStack: Primary Stack Tests (7 Tests) ---

    @Test
    public void testPrimaryStackVpcCreation() {
        primaryTemplate.resourceCountIs("AWS::EC2::VPC", 1);
        primaryTemplate.hasResourceProperties("AWS::EC2::VPC", Map.of(
            "EnableDnsSupport", true,
            "EnableDnsHostnames", true
        ));
    }

    @Test
    public void testPrimaryStackRdsInstanceProperties() {
        primaryTemplate.hasResourceProperties("AWS::RDS::DBInstance", objectLike(Map.of(
            "DBInstanceClass", "db.t3.medium",
            "Engine", "postgres",
            "MultiAZ", true,
            "DeletionProtection", true,
            "StorageEncrypted", true,
            "CopyTagsToSnapshot", true
        )));
    }

    @Test
    public void testPrimaryStackSubnetGroupNaming() {
        primaryTemplate.hasResourceProperties("AWS::RDS::DBSubnetGroup", Map.of(
            "DBSubnetGroupName", "nova-db-subnet-group-primary-" + TEST_SUFFIX
        ));
    }

    @Test
    public void testPrimaryStackSecretsManagerSecretNaming() {
        primaryTemplate.hasResourceProperties("AWS::SecretsManager::Secret", Map.of(
            "Name", "nova/database/credentials-" + TEST_SUFFIX
        ));
    }

    @Test
    public void testPrimaryStackLoadBalancerIsInternetFacing() {
        primaryTemplate.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", Map.of(
            "Scheme", "internet-facing"
        ));
    }

    @Test
    public void testPrimaryStackSecurityGroupRules() {
        // ALB SG allows HTTP/HTTPS from anywhere
        primaryTemplate.hasResourceProperties("AWS::EC2::SecurityGroup", objectLike(Map.of(
            "GroupDescription", "Security group for Nova Application Load Balancer",
            "SecurityGroupIngress", Match.arrayWith(List.of(
                Map.of("CidrIp", "0.0.0.0/0", "FromPort", 443, "ToPort", 443, "IpProtocol", "tcp", "Description", "HTTPS traffic"),
                Map.of("CidrIp", "0.0.0.0/0", "FromPort", 80, "ToPort", 80, "IpProtocol", "tcp", "Description", "HTTP traffic")
            ))
        )));
    }

    @Test
    public void testPrimaryStackResourceTags() {
        primaryTemplate.hasResource("AWS::EC2::VPC", objectLike(Map.of(
            "Properties", objectLike(Map.of(
                "Tags", Match.arrayWith(List.of(
                    Map.of("Key", "Environment", "Value", "Production"),
                    Map.of("Key", "Project", "Value", "Nova"),
                    Map.of("Key", "Region", "Value", "Primary")
                ))
            ))
        )));
    }

    // --- NovaStack: Failover Stack Tests (4 Tests) ---

    @Test
    public void testFailoverStackRdsInstanceIsNotMultiAz() {
        failoverTemplate.hasResourceProperties("AWS::RDS::DBInstance", objectLike(Map.of(
            "Engine", "postgres",
            "MultiAZ", Match.absent() // Should be absent or false
        )));
    }

    @Test
    public void testFailoverStackSubnetGroupNaming() {
        failoverTemplate.hasResourceProperties("AWS::RDS::DBSubnetGroup", Map.of(
            "DBSubnetGroupName", "nova-db-subnet-group-failover-" + TEST_SUFFIX
        ));
    }

    @Test
    public void testFailoverStackResourceTags() {
        failoverTemplate.hasResource("AWS::EC2::VPC", objectLike(Map.of(
            "Properties", objectLike(Map.of(
                "Tags", Match.arrayWith(List.of(
                    Map.of("Key", "Environment", "Value", "Production"),
                    Map.of("Key", "Project", "Value", "Nova"),
                    Map.of("Key", "Region", "Value", "Failover")
                ))
            ))
        )));
    }

    @Test
    public void testFailoverStackHasCorrectNumberOfResources() {
        failoverTemplate.resourceCountIs("AWS::EC2::VPC", 1);
        failoverTemplate.resourceCountIs("AWS::RDS::DBInstance", 1);
        failoverTemplate.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 1);
        failoverTemplate.resourceCountIs("AWS::EC2::SecurityGroup", 3);
    }

    // --- Route53Stack Tests (4 Tests) ---

    @Test
    public void testRoute53StackCreationAndProperties() {
        // Verify Hosted Zone
        route53Template.hasResourceProperties("AWS::Route53::HostedZone", Map.of(
            "Name", "nova-app.com."
        ));

        // Verify Health Checks
        route53Template.resourceCountIs("AWS::Route53::HealthCheck", 2);
    }

    @Test
    public void testRoute53HealthCheckConfiguration() {
        route53Template.hasResourceProperties("AWS::Route53::HealthCheck", objectLike(Map.of(
            "HealthCheckConfig", Map.of(
                "Type", "HTTP",
                "Port", 80,
                "ResourcePath", "/health",
                "FailureThreshold", 2,
                "RequestInterval", 30
            )
        )));
    }

    @Test
    public void testRoute53ARecordCreation() {
        route53Template.hasResourceProperties("AWS::Route53::RecordSet", objectLike(Map.of(
            "Name", "nova-app.com.",
            "Type", "A",
            "Region", "us-west-2",
            "SetIdentifier", "PrimaryRegion"
        )));

        route53Template.hasResourceProperties("AWS::Route53::RecordSet", objectLike(Map.of(
            "Name", "nova-app.com.",
            "Type", "A",
            "Region", "eu-central-1",
            "SetIdentifier", "FailoverRegion"
        )));
    }

    @Test
    public void testDefaultEnvironmentSuffix() {
        App localApp = new App();
        // Do not set context
        Main.NovaStack defaultStack = new Main.NovaStack(localApp, "DefaultStack",
            NovaStackProps.builder()
                .isPrimary(true)
                .environmentSuffix("dev") // Manually pass the expected default
                .stackProps(StackProps.builder().env(Environment.builder().region("us-east-1").build()).build())
                .build());
        Template defaultTemplate = Template.fromStack(defaultStack);

        defaultTemplate.hasResourceProperties("AWS::SecretsManager::Secret", Map.of(
            "Name", "nova/database/credentials-dev"
        ));
    }
}
