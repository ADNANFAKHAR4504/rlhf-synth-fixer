package app;

import com.hashicorp.cdktf.Testing;
import com.hashicorp.cdktf.TerraformStack;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for CDKTF Java MainStack template.
 *
 * These tests validate the stack configuration and resource creation
 * without deploying actual infrastructure using CDKTF's Testing framework.
 */
@DisplayName("CDKTF MainStack Unit Tests")
public class MainTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String TEST_REGION = "us-east-1";
    private static final String TEST_STACK_ID = "test-stack";

    @Nested
    @DisplayName("Network Infrastructure Tests")
    class NetworkInfrastructureTests {

        @Test
        @DisplayName("Should create VPC with correct CIDR block")
        void testVpcCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            // Verify VPC resource exists
            assertTrue(hasResourceOfType(resources, "aws_vpc"), "VPC should be created");

            // Get VPC configuration
            JsonNode vpc = getResourceByType(resources, "aws_vpc");
            assertNotNull(vpc, "VPC resource should exist");
            assertEquals("10.0.0.0/16", vpc.get("cidr_block").asText(), "VPC CIDR should be 10.0.0.0/16");
            assertTrue(vpc.get("enable_dns_hostnames").asBoolean(), "DNS hostnames should be enabled");
            assertTrue(vpc.get("enable_dns_support").asBoolean(), "DNS support should be enabled");
        }

        @Test
        @DisplayName("Should create two public subnets in different AZs")
        void testPublicSubnetsCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            // Count public subnets
            List<JsonNode> publicSubnets = getResourcesByPattern(resources, "aws_subnet", "public-subnet");
            assertEquals(2, publicSubnets.size(), "Should create 2 public subnets");

            // Verify public subnets are in different AZs
            String az1 = publicSubnets.get(0).get("availability_zone").asText();
            String az2 = publicSubnets.get(1).get("availability_zone").asText();
            assertNotEquals(az1, az2, "Public subnets should be in different availability zones");

            // Verify map_public_ip_on_launch is true for public subnets
            for (JsonNode subnet : publicSubnets) {
                assertTrue(subnet.get("map_public_ip_on_launch").asBoolean(),
                    "Public subnets should auto-assign public IPs");
            }
        }

        @Test
        @DisplayName("Should create two private subnets in different AZs")
        void testPrivateSubnetsCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            // Count private subnets
            List<JsonNode> privateSubnets = getResourcesByPattern(resources, "aws_subnet", "private-subnet");
            assertEquals(2, privateSubnets.size(), "Should create 2 private subnets");

            // Verify private subnets are in different AZs
            String az1 = privateSubnets.get(0).get("availability_zone").asText();
            String az2 = privateSubnets.get(1).get("availability_zone").asText();
            assertNotEquals(az1, az2, "Private subnets should be in different availability zones");

            // Verify map_public_ip_on_launch is false for private subnets
            for (JsonNode subnet : privateSubnets) {
                assertFalse(subnet.get("map_public_ip_on_launch").asBoolean(),
                    "Private subnets should not auto-assign public IPs");
            }
        }

        @Test
        @DisplayName("Should create Internet Gateway")
        void testInternetGatewayCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            assertTrue(hasResourceOfType(resources, "aws_internet_gateway"),
                "Internet Gateway should be created");
        }

        @Test
        @DisplayName("Should create NAT Gateway with Elastic IP")
        void testNatGatewayCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            assertTrue(hasResourceOfType(resources, "aws_nat_gateway"),
                "NAT Gateway should be created");
            assertTrue(hasResourceOfType(resources, "aws_eip"),
                "Elastic IP for NAT Gateway should be created");

            // Verify EIP is for VPC
            JsonNode eip = getResourceByType(resources, "aws_eip");
            assertEquals("vpc", eip.get("domain").asText(), "EIP should be for VPC");
        }

        @Test
        @DisplayName("Should create route tables with correct routes")
        void testRouteTablesCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            // Should have public and private route tables
            List<JsonNode> routeTables = getAllResourcesOfType(resources, "aws_route_table");
            assertTrue(routeTables.size() >= 2, "Should create at least 2 route tables");

            // Verify routes exist
            List<JsonNode> routes = getAllResourcesOfType(resources, "aws_route");
            assertTrue(routes.size() >= 2, "Should create routes for public and private subnets");

            // Verify route table associations
            List<JsonNode> associations = getAllResourcesOfType(resources, "aws_route_table_association");
            assertEquals(4, associations.size(),
                "Should have 4 route table associations (2 public + 2 private)");
        }
    }

    @Nested
    @DisplayName("Security Infrastructure Tests")
    class SecurityInfrastructureTests {

        @Test
        @DisplayName("Should create security groups for instances and ALB")
        void testSecurityGroupsCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            List<JsonNode> securityGroups = getAllResourcesOfType(resources, "aws_security_group");
            assertTrue(securityGroups.size() >= 2,
                "Should create at least 2 security groups (instance and ALB)");
        }

        @Test
        @DisplayName("Should configure security group rules for HTTP/HTTPS traffic")
        void testSecurityGroupRulesForAlb() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            List<JsonNode> rules = getAllResourcesOfType(resources, "aws_security_group_rule");

            // Verify HTTP rule exists (port 80)
            boolean hasHttpRule = rules.stream().anyMatch(rule ->
                rule.has("from_port") && rule.get("from_port").asInt() == 80);
            assertTrue(hasHttpRule, "Should have HTTP ingress rule on port 80");

            // Verify HTTPS rule exists (port 443)
            boolean hasHttpsRule = rules.stream().anyMatch(rule ->
                rule.has("from_port") && rule.get("from_port").asInt() == 443);
            assertTrue(hasHttpsRule, "Should have HTTPS ingress rule on port 443");

            // Verify egress rule exists
            boolean hasEgressRule = rules.stream().anyMatch(rule ->
                "egress".equals(rule.get("type").asText()));
            assertTrue(hasEgressRule, "Should have egress rule");
        }

        @Test
        @DisplayName("Should create KMS key with encryption enabled")
        void testKmsKeyCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            assertTrue(hasResourceOfType(resources, "aws_kms_key"),
                "KMS key should be created");

            JsonNode kmsKey = getResourceByType(resources, "aws_kms_key");
            assertTrue(kmsKey.get("enable_key_rotation").asBoolean(),
                "KMS key rotation should be enabled");
            assertNotNull(kmsKey.get("policy"), "KMS key should have a policy");
        }

        @Test
        @DisplayName("Should create KMS alias")
        void testKmsAliasCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            assertTrue(hasResourceOfType(resources, "aws_kms_alias"),
                "KMS alias should be created");

            JsonNode kmsAlias = getResourceByType(resources, "aws_kms_alias");
            assertEquals("alias/vpc-migration-key", kmsAlias.get("name").asText(),
                "KMS alias should have correct name");
        }

        @Test
        @DisplayName("Should create IAM role for EC2 instances")
        void testIamRoleCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            assertTrue(hasResourceOfType(resources, "aws_iam_role"),
                "IAM role should be created");

            JsonNode iamRole = getResourceByType(resources, "aws_iam_role");
            assertNotNull(iamRole.get("assume_role_policy"),
                "IAM role should have assume role policy");

            // Verify assume role policy allows EC2
            String assumePolicy = iamRole.get("assume_role_policy").asText();
            assertTrue(assumePolicy.contains("ec2.amazonaws.com"),
                "Assume role policy should allow EC2 service");
        }

        @Test
        @DisplayName("Should create IAM instance profile")
        void testIamInstanceProfileCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            assertTrue(hasResourceOfType(resources, "aws_iam_instance_profile"),
                "IAM instance profile should be created");
        }

        @Test
        @DisplayName("Should attach required IAM policies")
        void testIamPolicyAttachments() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            List<JsonNode> policyAttachments = getAllResourcesOfType(resources, "aws_iam_role_policy_attachment");
            assertTrue(policyAttachments.size() >= 2,
                "Should attach at least CloudWatch and SSM policies");
        }
    }

    @Nested
    @DisplayName("Compute Infrastructure Tests")
    class ComputeInfrastructureTests {

        @Test
        @DisplayName("Should create launch template for Auto Scaling Group")
        void testLaunchTemplateCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            assertTrue(hasResourceOfType(resources, "aws_launch_template"),
                "Launch template should be created");

            JsonNode launchTemplate = getResourceByType(resources, "aws_launch_template");
            assertNotNull(launchTemplate.get("image_id"), "Launch template should have AMI ID");
            assertNotNull(launchTemplate.get("instance_type"), "Launch template should have instance type");
            assertEquals("t3.medium", launchTemplate.get("instance_type").asText(),
                "Instance type should be t3.medium");
        }

        @Test
        @DisplayName("Should configure launch template with encryption")
        void testLaunchTemplateEncryption() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            JsonNode launchTemplate = getResourceByType(resources, "aws_launch_template");

            // Verify block device mappings exist
            assertTrue(launchTemplate.has("block_device_mappings"),
                "Launch template should have block device mappings");

            JsonNode blockDevices = launchTemplate.get("block_device_mappings");
            if (blockDevices.isArray() && blockDevices.size() > 0) {
                JsonNode ebs = blockDevices.get(0).get("ebs");
                assertEquals("true", ebs.get("encrypted").asText(),
                    "EBS volumes should be encrypted");
            }
        }

        @Test
        @DisplayName("Should configure launch template with monitoring enabled")
        void testLaunchTemplateMonitoring() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            JsonNode launchTemplate = getResourceByType(resources, "aws_launch_template");
            assertTrue(launchTemplate.has("monitoring"),
                "Launch template should have monitoring configuration");
        }

        @Test
        @DisplayName("Should create Auto Scaling Group")
        void testAutoScalingGroupCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            assertTrue(hasResourceOfType(resources, "aws_autoscaling_group"),
                "Auto Scaling Group should be created");
        }

        @Test
        @DisplayName("Should configure Auto Scaling Group with correct capacity")
        void testAutoScalingGroupCapacity() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            JsonNode asg = getResourceByType(resources, "aws_autoscaling_group");
            assertEquals(2, asg.get("min_size").asInt(), "Min size should be 2");
            assertEquals(6, asg.get("max_size").asInt(), "Max size should be 6");
            assertEquals(2, asg.get("desired_capacity").asInt(), "Desired capacity should be 2");
        }

        @Test
        @DisplayName("Should configure Auto Scaling Group with ELB health check")
        void testAutoScalingGroupHealthCheck() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            JsonNode asg = getResourceByType(resources, "aws_autoscaling_group");
            assertEquals("ELB", asg.get("health_check_type").asText(),
                "Health check type should be ELB");
            assertEquals(300, asg.get("health_check_grace_period").asInt(),
                "Health check grace period should be 300 seconds");
        }

        @Test
        @DisplayName("Should create migration instances")
        void testMigrationInstancesCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            List<JsonNode> instances = getResourcesByPattern(resources, "aws_instance", "migration-instance");
            assertEquals(2, instances.size(), "Should create 2 migration instances");
        }

        @Test
        @DisplayName("Should configure instances with encryption")
        void testInstanceEncryption() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            List<JsonNode> instances = getResourcesByPattern(resources, "aws_instance", "migration-instance");
            for (JsonNode instance : instances) {
                assertTrue(instance.has("root_block_device"),
                    "Instance should have root block device configuration");

                JsonNode rootBlock = instance.get("root_block_device");
                assertTrue(rootBlock.get("encrypted").asBoolean(),
                    "Root volume should be encrypted");
            }
        }

        @Test
        @DisplayName("Should configure instances with monitoring enabled")
        void testInstanceMonitoring() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            List<JsonNode> instances = getResourcesByPattern(resources, "aws_instance", "migration-instance");
            for (JsonNode instance : instances) {
                assertTrue(instance.get("monitoring").asBoolean(),
                    "Instance monitoring should be enabled");
            }
        }
    }

    @Nested
    @DisplayName("Load Balancer Infrastructure Tests")
    class LoadBalancerInfrastructureTests {

        @Test
        @DisplayName("Should create Application Load Balancer")
        void testAlbCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            assertTrue(hasResourceOfType(resources, "aws_lb"),
                "Application Load Balancer should be created");

            JsonNode alb = getResourceByType(resources, "aws_lb");
            assertEquals("application", alb.get("load_balancer_type").asText(),
                "Load balancer should be of type application");
            assertFalse(alb.get("internal").asBoolean(),
                "Load balancer should be internet-facing");
        }

        @Test
        @DisplayName("Should configure ALB with HTTP/2 enabled")
        void testAlbHttp2Configuration() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            JsonNode alb = getResourceByType(resources, "aws_lb");
            assertTrue(alb.get("enable_http2").asBoolean(),
                "HTTP/2 should be enabled");
        }

        @Test
        @DisplayName("Should create target group")
        void testTargetGroupCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            assertTrue(hasResourceOfType(resources, "aws_lb_target_group"),
                "Target group should be created");

            JsonNode targetGroup = getResourceByType(resources, "aws_lb_target_group");
            assertEquals(80, targetGroup.get("port").asInt(), "Target group port should be 80");
            assertEquals("HTTP", targetGroup.get("protocol").asText(),
                "Target group protocol should be HTTP");
            assertEquals("instance", targetGroup.get("target_type").asText(),
                "Target type should be instance");
        }

        @Test
        @DisplayName("Should configure target group health check")
        void testTargetGroupHealthCheck() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            JsonNode targetGroup = getResourceByType(resources, "aws_lb_target_group");
            assertTrue(targetGroup.has("health_check"),
                "Target group should have health check configuration");

            JsonNode healthCheck = targetGroup.get("health_check");
            assertEquals("/health", healthCheck.get("path").asText(),
                "Health check path should be /health");
            assertEquals(30, healthCheck.get("interval").asInt(),
                "Health check interval should be 30 seconds");
            assertEquals(2, healthCheck.get("healthy_threshold").asInt(),
                "Healthy threshold should be 2");
            assertEquals(2, healthCheck.get("unhealthy_threshold").asInt(),
                "Unhealthy threshold should be 2");
        }

        @Test
        @DisplayName("Should configure target group with session stickiness")
        void testTargetGroupStickiness() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            JsonNode targetGroup = getResourceByType(resources, "aws_lb_target_group");
            assertTrue(targetGroup.has("stickiness"),
                "Target group should have stickiness configuration");

            JsonNode stickiness = targetGroup.get("stickiness");
            assertTrue(stickiness.get("enabled").asBoolean(),
                "Stickiness should be enabled");
            assertEquals("lb_cookie", stickiness.get("type").asText(),
                "Stickiness type should be lb_cookie");
        }

        @Test
        @DisplayName("Should create HTTP listener")
        void testHttpListenerCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            assertTrue(hasResourceOfType(resources, "aws_lb_listener"),
                "HTTP listener should be created");

            JsonNode listener = getResourceByType(resources, "aws_lb_listener");
            assertEquals(80, listener.get("port").asInt(), "Listener port should be 80");
            assertEquals("HTTP", listener.get("protocol").asText(),
                "Listener protocol should be HTTP");
        }

        @Test
        @DisplayName("Should configure listener default action as forward")
        void testListenerDefaultAction() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            JsonNode listener = getResourceByType(resources, "aws_lb_listener");
            assertTrue(listener.has("default_action"),
                "Listener should have default action");

            JsonNode defaultAction = listener.get("default_action").get(0);
            assertEquals("forward", defaultAction.get("type").asText(),
                "Default action should be forward");
        }
    }

    @Nested
    @DisplayName("Monitoring Infrastructure Tests")
    class MonitoringInfrastructureTests {

        @Test
        @DisplayName("Should create SNS topic for alarms")
        void testSnsTopicCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            assertTrue(hasResourceOfType(resources, "aws_sns_topic"),
                "SNS topic should be created");

            JsonNode snsTopic = getResourceByType(resources, "aws_sns_topic");
            assertEquals("VPC Migration Alarms", snsTopic.get("display_name").asText(),
                "SNS topic display name should be correct");
        }

        @Test
        @DisplayName("Should create SNS topic subscription")
        void testSnsTopicSubscription() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            assertTrue(hasResourceOfType(resources, "aws_sns_topic_subscription"),
                "SNS topic subscription should be created");

            JsonNode subscription = getResourceByType(resources, "aws_sns_topic_subscription");
            assertEquals("email", subscription.get("protocol").asText(),
                "Subscription protocol should be email");
        }

        @Test
        @DisplayName("Should create CloudWatch CPU alarm")
        void testCpuAlarmCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            List<JsonNode> alarms = getAllResourcesOfType(resources, "aws_cloudwatch_metric_alarm");

            // Find CPU alarm
            boolean hasCpuAlarm = alarms.stream().anyMatch(alarm ->
                alarm.has("metric_name") && "CPUUtilization".equals(alarm.get("metric_name").asText()));
            assertTrue(hasCpuAlarm, "CPU utilization alarm should be created");

            // Verify CPU alarm configuration
            JsonNode cpuAlarm = alarms.stream()
                .filter(alarm -> alarm.has("metric_name") &&
                    "CPUUtilization".equals(alarm.get("metric_name").asText()))
                .findFirst()
                .orElse(null);

            assertNotNull(cpuAlarm);
            assertEquals("GreaterThanThreshold", cpuAlarm.get("comparison_operator").asText(),
                "CPU alarm should use GreaterThanThreshold");
            assertEquals(80.0, cpuAlarm.get("threshold").asDouble(),
                "CPU alarm threshold should be 80%");
        }

        @Test
        @DisplayName("Should create CloudWatch target health alarm")
        void testTargetHealthAlarmCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            List<JsonNode> alarms = getAllResourcesOfType(resources, "aws_cloudwatch_metric_alarm");

            // Find target health alarm
            boolean hasHealthAlarm = alarms.stream().anyMatch(alarm ->
                alarm.has("metric_name") && "HealthyHostCount".equals(alarm.get("metric_name").asText()));
            assertTrue(hasHealthAlarm, "Target health alarm should be created");
        }

        @Test
        @DisplayName("Should create CloudWatch request count alarm")
        void testRequestCountAlarmCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            List<JsonNode> alarms = getAllResourcesOfType(resources, "aws_cloudwatch_metric_alarm");

            // Find request count alarm
            boolean hasRequestAlarm = alarms.stream().anyMatch(alarm ->
                alarm.has("metric_name") && "RequestCount".equals(alarm.get("metric_name").asText()));
            assertTrue(hasRequestAlarm, "Request count alarm should be created");
        }

        @Test
        @DisplayName("Should create CloudWatch dashboard")
        void testCloudWatchDashboardCreation() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            assertTrue(hasResourceOfType(resources, "aws_cloudwatch_dashboard"),
                "CloudWatch dashboard should be created");

            JsonNode dashboard = getResourceByType(resources, "aws_cloudwatch_dashboard");
            assertEquals("vpc-migration-dashboard", dashboard.get("dashboard_name").asText(),
                "Dashboard name should be correct");
            assertNotNull(dashboard.get("dashboard_body"),
                "Dashboard should have body configuration");
        }

        @Test
        @DisplayName("Should configure alarms with actions enabled")
        void testAlarmsActionsEnabled() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            List<JsonNode> alarms = getAllResourcesOfType(resources, "aws_cloudwatch_metric_alarm");

            for (JsonNode alarm : alarms) {
                assertTrue(alarm.get("actions_enabled").asBoolean(),
                    "Alarm actions should be enabled");
                assertTrue(alarm.has("alarm_actions"),
                    "Alarm should have alarm actions configured");
            }
        }
    }

    @Nested
    @DisplayName("Stack Configuration Tests")
    class StackConfigurationTests {

        @Test
        @DisplayName("Should apply correct tags to all resources")
        void testResourceTagging() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);
            JsonNode resources = parseResources(synthesized);

            // Get all resources that support tagging
            List<String> taggableTypes = List.of(
                "aws_vpc", "aws_subnet", "aws_security_group",
                "aws_lb", "aws_lb_target_group", "aws_autoscaling_group"
            );

            for (String type : taggableTypes) {
                List<JsonNode> resourcesOfType = getAllResourcesOfType(resources, type);
                for (JsonNode resource : resourcesOfType) {
                    if (resource.has("tags")) {
                        JsonNode tags = resource.get("tags");
                        assertTrue(tags.has("Environment") || tags.has("ManagedBy"),
                            type + " should have standard tags");
                    }
                }
            }
        }

        @Test
        @DisplayName("Should create all expected outputs")
        void testStackOutputs() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);

            try {
                JsonNode root = MAPPER.readTree(synthesized);
                JsonNode outputs = root.path("output");

                // Verify key outputs exist
                assertTrue(outputs.has("vpc-id"), "Should have vpc-id output");
                assertTrue(outputs.has("public-subnet-ids"), "Should have public-subnet-ids output");
                assertTrue(outputs.has("private-subnet-ids"), "Should have private-subnet-ids output");
                assertTrue(outputs.has("alb-dns-name"), "Should have alb-dns-name output");
                assertTrue(outputs.has("alb-arn"), "Should have alb-arn output");
                assertTrue(outputs.has("target-group-arn"), "Should have target-group-arn output");
                assertTrue(outputs.has("autoscaling-group-name"), "Should have autoscaling-group-name output");
                assertTrue(outputs.has("alarm-topic-arn"), "Should have alarm-topic-arn output");
                assertTrue(outputs.has("kms-key-id"), "Should have kms-key-id output");
                assertTrue(outputs.has("instance-security-group-id"), "Should have instance-security-group-id output");

            } catch (Exception e) {
                fail("Failed to parse outputs: " + e.getMessage());
            }
        }

        @Test
        @DisplayName("Should use correct AWS provider region")
        void testAwsProviderRegion() {
            MainStack stack = new MainStack(Testing.app(), TEST_STACK_ID, TEST_REGION);
            

            String synthesized = Testing.synth(stack);

            try {
                JsonNode root = MAPPER.readTree(synthesized);
                JsonNode provider = root.path("provider").path("aws").get(0);

                assertEquals(TEST_REGION, provider.get("region").asText(),
                    "Provider region should match specified region");
            } catch (Exception e) {
                fail("Failed to parse provider configuration: " + e.getMessage());
            }
        }
    }

    // Helper methods

    private JsonNode parseResources(String synthesized) {
        try {
            JsonNode root = MAPPER.readTree(synthesized);
            return root.path("resource");
        } catch (Exception e) {
            fail("Failed to parse synthesized JSON: " + e.getMessage());
            return null;
        }
    }

    private boolean hasResourceOfType(JsonNode resources, String resourceType) {
        return resources.has(resourceType) && resources.get(resourceType).size() > 0;
    }

    private JsonNode getResourceByType(JsonNode resources, String resourceType) {
        if (!resources.has(resourceType)) {
            return null;
        }
        JsonNode typeNode = resources.get(resourceType);
        if (typeNode.size() == 0) {
            return null;
        }
        // Return the first resource of this type
        return typeNode.elements().next();
    }

    private List<JsonNode> getAllResourcesOfType(JsonNode resources, String resourceType) {
        List<JsonNode> result = new java.util.ArrayList<>();
        if (!resources.has(resourceType)) {
            return result;
        }
        JsonNode typeNode = resources.get(resourceType);
        typeNode.elements().forEachRemaining(result::add);
        return result;
    }

    private List<JsonNode> getResourcesByPattern(JsonNode resources, String resourceType, String pattern) {
        List<JsonNode> result = new java.util.ArrayList<>();
        if (!resources.has(resourceType)) {
            return result;
        }
        JsonNode typeNode = resources.get(resourceType);
        typeNode.fieldNames().forEachRemaining(name -> {
            if (name.contains(pattern)) {
                result.add(typeNode.get(name));
            }
        });
        return result;
    }
}
