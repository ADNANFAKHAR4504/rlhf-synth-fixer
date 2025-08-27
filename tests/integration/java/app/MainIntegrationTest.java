package app;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.File;
import java.io.IOException;
import java.util.Map;

/**
 * Integration tests for TapStack deployments.
 * These tests check synthesized templates and optionally real outputs.
 */
public class MainIntegrationTest {

    private Environment testEnvironment;
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setUp() {
        testEnvironment = Environment.builder()
                .account("123456789012")
                .region("us-west-2")
                .build();
        objectMapper = new ObjectMapper();
    }

    private TapStack synthesizeStack(String id, String envSuffix) {
        App app = new App();
        return new TapStack(app, id,
                TapStackProps.builder()
                        .environmentSuffix(envSuffix)
                        .stackProps(StackProps.builder()
                                .env(testEnvironment)
                                .build())
                        .build());
    }

    @Test
    public void testFullStackSynthesis() {
        TapStack stack = synthesizeStack("TapStackIntegration", "integration");
        Template template = Template.fromStack(stack.getVpcStack());

        assertThat(template).isNotNull();
        template.resourceCountIs("AWS::EC2::VPC", 1);
        template.resourceCountIs("AWS::EC2::Instance", 1);
        template.resourceCountIs("AWS::EC2::SecurityGroup", 1);
        template.resourceCountIs("AWS::IAM::Role", 1);
    }

    @Test
    public void testMultiEnvironmentSynthesis() {
        String[] envs = {"dev", "staging", "prod"};
        for (String env : envs) {
            TapStack stack = synthesizeStack("TapStack" + env, env);
            Template template = Template.fromStack(stack.getVpcStack());

            assertThat(stack.getEnvironmentSuffix()).isEqualTo(env);
            template.resourceCountIs("AWS::EC2::VPC", 1);
        }
    }

    @Test
    public void testDeploymentOutputsFile() throws IOException {
        File outputsFile = new File("cfn-outputs/flat-outputs.json");
        if (outputsFile.exists()) {
            JsonNode outputs = objectMapper.readTree(outputsFile);

            assertThat(outputs.has("VpcId")).isTrue();
            assertThat(outputs.has("InstanceId")).isTrue();
            assertThat(outputs.has("SecurityGroupId")).isTrue();
        } else {
            System.out.println("No deployment outputs file found, skipping output validation.");
        }
    }

    @Test
    public void testNetworkResources() {
        TapStack stack = synthesizeStack("TapStackNetwork", "network");
        Template template = Template.fromStack(stack.getVpcStack());

        template.resourceCountIs("AWS::EC2::InternetGateway", 1);
        template.resourceCountIs("AWS::EC2::Subnet", 2);
        template.hasResource("AWS::EC2::RouteTable", Map.of());
    }
}
