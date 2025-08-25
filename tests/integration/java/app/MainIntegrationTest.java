package app;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import software.amazon.awscdk.App;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

/**
 * Integration tests for the RegionalStack.
 *
 * These validate full-stack behavior, outputs, compliance, and
 * edge-case handling across environments.
 */
public class MainIntegrationTest {

    /**
     * Validate full stack deployment and required outputs.
     */
    @Test
    public void testFullStackDeployment() {
        App app = new App();
        RegionalStack stack = new RegionalStack(app, "NovaStackProd",
                StackProps.builder().build(), "prod");

        Template template = Template.fromStack(stack);

        assertThat(stack).isNotNull();
        assertThat(template).isNotNull();

        // Validate Outputs
        template.hasOutput("VpcId", Map.of());
        template.hasOutput("AlbDns", Map.of());
        template.hasOutput("CpuAlarmName", Map.of());
        template.hasOutput("LogBucketName", Map.of());
        template.hasOutput("RdsEndpoint", Map.of());
    }

    /**
     * Validate multi-environment configuration consistency.
     */
    @Test
    public void testMultiEnvironmentConfiguration() {
        String[] environments = {"dev", "staging", "prod"};

        for (String env : environments) {
            App app = new App();
            RegionalStack stack = new RegionalStack(app, "NovaStack" + env,
                    StackProps.builder().build(), env);

            Template template = Template.fromStack(stack);

            assertThat(stack).isNotNull();
            assertThat(template).isNotNull();

            // Check VPC exists in all envs
            template.hasResourceProperties("AWS::EC2::VPC", Map.of(
                    "CidrBlock", "10.0.0.0/16"
            ));
        }
    }

    /**
     * Validate S3 bucket compliance (encryption + versioning).
     */
    @Test
    public void testLogBucketCompliance() {
        App app = new App();
        RegionalStack stack = new RegionalStack(app, "NovaStackCompliance",
                StackProps.builder().build(), "qa");

        Template template = Template.fromStack(stack);

        template.hasResourceProperties("AWS::S3::Bucket", Map.of(
                "BucketEncryption", Map.of(
                    "ServerSideEncryptionConfiguration", List.of(
                        Map.of("ServerSideEncryptionByDefault", Map.of("SSEAlgorithm", "AES256"))
                    )
                ),
                "VersioningConfiguration", Map.of("Status", "Enabled")
        ));
    }


    /**
     * Validate RDS instance is Multi-AZ.
     */
    @Test
    public void testRdsMultiAzCompliance() {
        App app = new App();
        RegionalStack stack = new RegionalStack(app, "NovaStackRds",
                StackProps.builder().build(), "prod");

        Template template = Template.fromStack(stack);

        template.hasResourceProperties("AWS::RDS::DBInstance", Map.of(
                "MultiAZ", true
        ));
    }

    /**
     * Validate edge case: invalid environment suffix.
     */
    @Test
    public void testInvalidEnvironmentSuffix() {
        App app = new App();
        RegionalStack stack = new RegionalStack(app, "NovaStackInvalid",
                StackProps.builder().build(), "invalid-env");

        Template template = Template.fromStack(stack);

        assertThat(stack).isNotNull();
        assertThat(template).isNotNull();
        // Ensure stack still synthesizes, even with bad suffix
    }

    /**
     * Validate nested components & scalability (multi-region).
     */
    @Test
    public void testMultiRegionDeployment() {
        String[] regions = {"use1", "usw2"};

        for (String region : regions) {
            App app = new App();
            RegionalStack stack = new RegionalStack(app, "NovaStack-" + region,
                    StackProps.builder().build(), region);

            Template template = Template.fromStack(stack);

            assertThat(stack).isNotNull();
            assertThat(template).isNotNull();

            // Ensure ALB + ASG exist in each region
            template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 1);
            template.resourceCountIs("AWS::AutoScaling::AutoScalingGroup", 1);
        }
    }
}
