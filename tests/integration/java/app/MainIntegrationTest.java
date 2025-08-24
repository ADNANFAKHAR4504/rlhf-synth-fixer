package com.nova.infrastructure;

import org.junit.jupiter.api.Test;
import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.assertions.Template;
import software.amazon.awscdk.assertions.Match;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static software.amazon.awscdk.assertions.Match.objectLike;

/**
 * Integration tests for the Main CDK application.
 *
 * These tests synthesize the stacks with production-like configurations
 * to ensure they are valid before deployment.
 */
public class MainIntegrationTest {

    /**
     * Synthesizes a complete set of stacks for a given environment suffix.
     * @param app The CDK App construct.
     * @param environmentSuffix The suffix for the environment (e.g., "prod", "dev").
     * @return The synthesized Template for the primary stack.
     */
    private Template synthesizeFullApp(App app, String environmentSuffix) {
        Main.NovaStack primaryStack = new Main.NovaStack(app, "NovaStack-Primary-" + environmentSuffix,
            NovaStackProps.builder()
                .isPrimary(true)
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder().env(Environment.builder().region("us-west-2").build()).build())
                .build());

        Main.NovaStack failoverStack = new Main.NovaStack(app, "NovaStack-Failover-" + environmentSuffix,
            NovaStackProps.builder()
                .isPrimary(false)
                .environmentSuffix(environmentSuffix)
                .stackProps(StackProps.builder().env(Environment.builder().region("eu-central-1").build()).build())
                .build());

        new Main.Route53Stack(app, "NovaRoute53Stack-" + environmentSuffix,
            Route53StackProps.builder()
                .primaryLoadBalancer(primaryStack.getLoadBalancer())
                .failoverLoadBalancer(failoverStack.getLoadBalancer())
                .stackProps(StackProps.builder().crossRegionReferences(true).env(Environment.builder().region("us-east-1").build()).build())
                .build());

        // Synthesize the entire app to resolve cross-stack references
        app.synth();

        return Template.fromStack(primaryStack);
    }

    @Test
    public void testFullStackDeploymentForProd() {
        Template primaryTemplate = synthesizeFullApp(new App(), "prod");
        primaryTemplate.resourceCountIs("AWS::RDS::DBInstance", 1);
        primaryTemplate.hasResourceProperties("AWS::SecretsManager::Secret", Map.of("Name", "nova/database/credentials-prod"));
    }

    @Test
    public void testFullStackDeploymentForDev() {
        Template primaryTemplate = synthesizeFullApp(new App(), "dev");
        primaryTemplate.resourceCountIs("AWS::RDS::DBInstance", 1);
        primaryTemplate.hasResourceProperties("AWS::SecretsManager::Secret", Map.of("Name", "nova/database/credentials-dev"));
    }

    @Test
    public void testFullStackDeploymentForStaging() {
        Template primaryTemplate = synthesizeFullApp(new App(), "staging");
        primaryTemplate.resourceCountIs("AWS::RDS::DBInstance", 1);
        primaryTemplate.hasResourceProperties("AWS::SecretsManager::Secret", Map.of("Name", "nova/database/credentials-staging"));
    }

    @Test
    public void testVpcHasCorrectSubnetAndNatGatewayConfiguration() {
        Template primaryTemplate = synthesizeFullApp(new App(), "integ-vpc");
        primaryTemplate.resourceCountIs("AWS::EC2::Subnet", 6); // 3 AZs * (Public + Private)
        primaryTemplate.resourceCountIs("AWS::EC2::NatGateway", 2);
    }

    @Test
    public void testAlbListenerAndTargetGroupConfiguration() {
        Template primaryTemplate = synthesizeFullApp(new App(), "integ-alb");
        primaryTemplate.hasResourceProperties("AWS::ElasticLoadBalancingV2::TargetGroup", objectLike(Map.of(
            "Port", 8080,
            "Protocol", "HTTP",
            "HealthCheck", objectLike(Map.of("Path", "/health"))
        )));
    }

    @Test
    public void testIamRoleHasSsmAndSecretsManagerPermissions() {
        Template primaryTemplate = synthesizeFullApp(new App(), "integ-iam");
        primaryTemplate.hasResourceProperties("AWS::IAM::Policy", objectLike(Map.of(
            "PolicyDocument", objectLike(Map.of(
                "Statement", Match.arrayWith(List.of(
                    objectLike(Map.of(
                        "Action", Match.arrayWith(List.of("secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret")),
                        "Effect", "Allow"
                    )),
                    objectLike(Map.of(
                        "Action", Match.arrayWith(List.of("logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents")),
                        "Effect", "Allow"
                    ))
                ))
            ))
        )));
    }

    @Test
    public void testDatabaseHasPerformanceInsightsEnabled() {
        Template primaryTemplate = synthesizeFullApp(new App(), "integ-db");
        primaryTemplate.hasResourceProperties("AWS::RDS::DBInstance", objectLike(Map.of(
            "EnablePerformanceInsights", true
        )));
    }

    @Test
    public void testRoute53HealthCheckPointsToCorrectLoadBalancer() {
        App app = new App();
        Main.NovaStack primaryStack = new Main.NovaStack(app, "NovaStack-Primary-r53",
            NovaStackProps.builder().isPrimary(true).environmentSuffix("r53")
                .stackProps(StackProps.builder().env(Environment.builder().region("us-west-2").build()).build())
                .build());
        Main.Route53Stack route53Stack = new Main.Route53Stack(app, "NovaRoute53Stack-r53",
            Route53StackProps.builder()
                .primaryLoadBalancer(primaryStack.getLoadBalancer())
                .failoverLoadBalancer(primaryStack.getLoadBalancer()) // Using same for simplicity
                .stackProps(StackProps.builder().crossRegionReferences(true).env(Environment.builder().region("us-east-1").build()).build())
                .build());

        Template.fromStack(route53Stack).hasResourceProperties("AWS::Route53::HealthCheck", objectLike(Map.of(
            "HealthCheckConfig", objectLike(Map.of(
                "FullyQualifiedDomainName", objectLike(Map.of("Fn::GetAtt", Match.anyValue()))
            ))
        )));
    }

    // Adding more tests to reach the desired count, focusing on different aspects.

    @Test
    public void testPrimaryDbIsDeletionProtected() {
        Template primaryTemplate = synthesizeFullApp(new App(), "integ-del-protect");
        primaryTemplate.hasResourceProperties("AWS::RDS::DBInstance", objectLike(Map.of(
            "DeletionProtection", true
        )));
    }

    @Test
    public void testFailoverDbIsNotDeletionProtected() {
        // In this setup, the replica is not explicitly deletion protected.
        App app = new App();
        Main.NovaStack failoverStack = new Main.NovaStack(app, "NovaStack-Failover-del-protect",
            NovaStackProps.builder().isPrimary(false).environmentSuffix("del-protect")
                .stackProps(StackProps.builder().env(Environment.builder().region("eu-central-1").build()).build())
                .build());
        Template.fromStack(failoverStack).hasResourceProperties("AWS::RDS::DBInstance", objectLike(Map.of(
            "DeletionProtection", Match.absent()
        )));
    }

    @Test
    public void testApplicationSecurityGroupAllowsAlbAccess() {
        Template primaryTemplate = synthesizeFullApp(new App(), "integ-sg");
        primaryTemplate.hasResourceProperties("AWS::EC2::SecurityGroupIngress", objectLike(Map.of(
            "IpProtocol", "tcp",
            "FromPort", 8080,
            "ToPort", 8080,
            "Description", "Application port from ALB"
        )));
    }

    @Test
    public void testDatabaseSecurityGroupAllowsAppAccess() {
        Template primaryTemplate = synthesizeFullApp(new App(), "integ-db-sg");
        primaryTemplate.hasResourceProperties("AWS::EC2::SecurityGroupIngress", objectLike(Map.of(
            "IpProtocol", "tcp",
            "FromPort", 5432,
            "ToPort", 5432,
            "Description", "PostgreSQL from application"
        )));
    }

    @Test
    public void testSecretHasCorrectGenerationRule() {
        Template primaryTemplate = synthesizeFullApp(new App(), "integ-secret");
        primaryTemplate.hasResourceProperties("AWS::SecretsManager::Secret", objectLike(Map.of(
            "GenerateSecretString", objectLike(Map.of(
                "SecretStringTemplate", "{\"username\": \"novaadmin\"}",
                "GenerateStringKey", "password"
            ))
        )));
    }

    @Test
    public void testRoute53ARecordHasCorrectAliasTarget() {
        App app = new App();
        Main.NovaStack primaryStack = new Main.NovaStack(app, "NovaStack-Primary-alias",
            NovaStackProps.builder().isPrimary(true).environmentSuffix("alias")
                .stackProps(StackProps.builder().env(Environment.builder().region("us-west-2").build()).build())
                .build());
        Main.Route53Stack route53Stack = new Main.Route53Stack(app, "NovaRoute53Stack-alias",
            Route53StackProps.builder()
                .primaryLoadBalancer(primaryStack.getLoadBalancer())
                .failoverLoadBalancer(primaryStack.getLoadBalancer())
                .stackProps(StackProps.builder().crossRegionReferences(true).env(Environment.builder().region("us-east-1").build()).build())
                .build());

        Template.fromStack(route53Stack).hasResourceProperties("AWS::Route53::RecordSet", objectLike(Map.of(
            "AliasTarget", objectLike(Map.of(
                "DNSName", objectLike(Map.of("Fn::GetAtt", Match.anyValue()))
            ))
        )));
    }

    @Test
    public void testIamRoleHasManagedSsmPolicy() {
        Template primaryTemplate = synthesizeFullApp(new App(), "integ-ssm-policy");
        primaryTemplate.hasResourceProperties("AWS::IAM::Role", objectLike(Map.of(
            "ManagedPolicyArns", Match.arrayWith(List.of(
                objectLike(Map.of("Fn::Join", Match.arrayWith(List.of(
                    Match.arrayWith(List.of("arn:", Match.anyValue(), ":iam::aws:policy/AmazonSSMManagedInstanceCore"))
                ))))
            ))
        )));
    }
}
