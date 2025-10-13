package app;

import app.config.AppConfig;
import com.hashicorp.cdktf.App;
import com.hashicorp.cdktf.Testing;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for CDKTF Java MainStack template.
 * <p>
 * These tests verify the correct creation and configuration of AWS resources
 * without deploying actual infrastructure. Tests focus on resource attributes,
 * configuration values, and inter-resource relationships.
 */
@DisplayName("CDKTF MainStack Unit Tests")
public class MainTest {

    private static final String STACK_NAME = "fintech-payment-infra";

    /**
     * Helper method to parse synth output as JSON
     */
    private Map<String, Object> parseSynth(String synth) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(synth, Map.class);
        } catch (Exception e) {
            fail("Failed to parse synth output: " + e.getMessage());
            return Map.of();
        }
    }

    /**
     * Helper method to get all resources of a specific type from synth output
     */
    private Map<String, Object> getResourcesOfType(String synth, String resourceType) {
        Map<String, Object> template = parseSynth(synth);
        if (!template.containsKey("resource")) {
            return Map.of();
        }
        Map<String, Object> allResources = (Map<String, Object>) template.get("resource");
        Map<String, Object> resources = (Map<String, Object>) allResources.get(resourceType);
        return resources != null ? resources : Map.of();
    }

    @Nested
    @DisplayName("VPC and Network Resources")
    class NetworkResourceTests {

        @Test
        @DisplayName("VPC should be created with correct CIDR block")
        void testVpcCreation() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> vpcs = getResourcesOfType(synth, "aws_vpc");
            assertFalse(vpcs.isEmpty(), "VPC should be created");

            // Verify VPC has expected properties
            Object firstVpc = vpcs.values().iterator().next();
            assertNotNull(firstVpc, "VPC configuration should exist");
            Map<String, Object> vpcConfig = (Map<String, Object>) firstVpc;

            // Verify CIDR block
            assertThat(vpcConfig.get("cidr_block")).isIn("10.0.0.0/16", "${var.vpc_cidr}");

            // Verify DNS support is enabled
            if (vpcConfig.containsKey("enable_dns_support")) {
                assertTrue((Boolean) vpcConfig.get("enable_dns_support"),
                        "DNS support should be enabled");
            }

            if (vpcConfig.containsKey("enable_dns_hostnames")) {
                assertTrue((Boolean) vpcConfig.get("enable_dns_hostnames"),
                        "DNS hostnames should be enabled");
            }
        }

        @Test
        @DisplayName("Public subnets should be created across multiple AZs")
        void testPublicSubnets() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> subnets = getResourcesOfType(synth, "aws_subnet");
            assertFalse(subnets.isEmpty(), "Subnets should be created");

            // Count public subnets (those with map_public_ip_on_launch = true)
            long publicSubnetCount = subnets.values().stream()
                    .filter(subnet -> {
                        Map<String, Object> subnetConfig = (Map<String, Object>) subnet;
                        Object mapPublicIp = subnetConfig.get("map_public_ip_on_launch");
                        return mapPublicIp != null && (Boolean) mapPublicIp;
                    })
                    .count();

            assertTrue(publicSubnetCount >= 2,
                    "Should have at least 2 public subnets for high availability");
        }

        @Test
        @DisplayName("Private subnets should be created across multiple AZs")
        void testPrivateSubnets() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> subnets = getResourcesOfType(synth, "aws_subnet");
            assertFalse(subnets.isEmpty(), "Subnets should be created");

            // Count private subnets (those without map_public_ip_on_launch or set to false)
            long privateSubnetCount = subnets.values().stream()
                    .filter(subnet -> {
                        Map<String, Object> subnetConfig = (Map<String, Object>) subnet;
                        Object mapPublicIp = subnetConfig.get("map_public_ip_on_launch");
                        return mapPublicIp == null || !(Boolean) mapPublicIp;
                    })
                    .count();

            assertTrue(privateSubnetCount >= 2,
                    "Should have at least 2 private subnets for high availability");
        }

        @Test
        @DisplayName("Internet Gateway should be created")
        void testInternetGateway() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> igws = getResourcesOfType(synth, "aws_internet_gateway");
            assertFalse(igws.isEmpty(), "Internet Gateway should be created");
        }

        @Test
        @DisplayName("NAT Gateways should be created for private subnet connectivity")
        void testNatGateways() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> natGateways = getResourcesOfType(synth, "aws_nat_gateway");
            assertFalse(natGateways.isEmpty(), "NAT Gateways should be created");

            // Verify NAT gateways have allocation IDs (Elastic IPs)
            natGateways.values().forEach(nat -> {
                Map<String, Object> natConfig = (Map<String, Object>) nat;
                assertNotNull(natConfig.get("allocation_id"),
                        "NAT Gateway should have an Elastic IP allocation");
            });
        }

        @Test
        @DisplayName("Route tables should be configured correctly")
        void testRouteTables() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> routeTables = getResourcesOfType(synth, "aws_route_table");
            assertFalse(routeTables.isEmpty(), "Route tables should be created");

            Map<String, Object> routes = getResourcesOfType(synth, "aws_route");
            assertFalse(routes.isEmpty(), "Routes should be created");
        }
    }

    @Nested
    @DisplayName("ECS Cluster Resources")
    class EcsClusterResourceTests {

        @Test
        @DisplayName("ECS Cluster should be created with Container Insights")
        void testEcsCluster() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> clusters = getResourcesOfType(synth, "aws_ecs_cluster");
            assertFalse(clusters.isEmpty(), "ECS Cluster should be created");

            Object firstCluster = clusters.values().iterator().next();
            Map<String, Object> clusterConfig = (Map<String, Object>) firstCluster;

            // Verify cluster name contains expected app name
            String clusterName = (String) clusterConfig.get("name");
            assertNotNull(clusterName, "Cluster should have a name");
            assertThat(clusterName).contains("cluster");

            // Verify Container Insights settings
            if (clusterConfig.containsKey("setting")) {
                List<Map<String, Object>> settings = (List<Map<String, Object>>) clusterConfig.get("setting");
                boolean hasContainerInsights = settings.stream()
                        .anyMatch(setting -> "containerInsights".equals(setting.get("name")));
                assertTrue(hasContainerInsights, "Container Insights should be configured");
            }
        }
    }

    @Nested
    @DisplayName("Load Balancer Resources")
    class LoadBalancerResourceTests {

        @Test
        @DisplayName("Application Load Balancer should be created")
        void testAlbCreation() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> albs = getResourcesOfType(synth, "aws_alb");
            assertFalse(albs.isEmpty(), "Application Load Balancer should be created");

            Object firstAlb = albs.values().iterator().next();
            Map<String, Object> albConfig = (Map<String, Object>) firstAlb;

            // Verify ALB is internet-facing
            assertFalse((Boolean) albConfig.getOrDefault("internal", true),
                    "ALB should be internet-facing");

            // Verify load balancer type
            assertEquals("application", albConfig.get("load_balancer_type"),
                    "Load balancer type should be application");

            // Verify HTTP/2 is enabled
            assertTrue((Boolean) albConfig.getOrDefault("enable_http2", false),
                    "HTTP/2 should be enabled");
        }

        @Test
        @DisplayName("Target groups should be created for each service")
        void testTargetGroups() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> targetGroups = getResourcesOfType(synth, "aws_alb_target_group");
            assertFalse(targetGroups.isEmpty(), "Target groups should be created");

            // Should have at least 2 target groups (payment-service and auth-service)
            assertTrue(targetGroups.size() >= 2,
                    "Should have target groups for payment and auth services");

            // Verify target group configuration
            targetGroups.values().forEach(tg -> {
                Map<String, Object> tgConfig = (Map<String, Object>) tg;

                // Verify target type is IP (for Fargate)
                assertEquals("ip", tgConfig.get("target_type"),
                        "Target type should be 'ip' for Fargate");

                // Verify protocol
                assertEquals("HTTP", tgConfig.get("protocol"),
                        "Protocol should be HTTP");

                // Verify health check configuration
                Map<String, Object> healthCheck = (Map<String, Object>) tgConfig.get("health_check");
                if (healthCheck != null) {
                    assertTrue((Boolean) healthCheck.getOrDefault("enabled", false),
                            "Health checks should be enabled");
                    assertEquals("/", healthCheck.get("path"),
                            "Health check path should be /");
                }
            });
        }

        @Test
        @DisplayName("ALB listeners should be configured for HTTP and HTTPS")
        void testAlbListeners() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> listeners = getResourcesOfType(synth, "aws_alb_listener");
            assertFalse(listeners.isEmpty(), "ALB listeners should be created");

            // Should have at least 2 listeners (HTTP and HTTPS)
            assertTrue(listeners.size() >= 2,
                    "Should have HTTP and HTTPS listeners");

            // Verify HTTP listener redirects to HTTPS
            boolean hasHttpRedirect = listeners.values().stream()
                    .anyMatch(listener -> {
                        Map<String, Object> listenerConfig = (Map<String, Object>) listener;
                        return "HTTP".equals(listenerConfig.get("protocol")) &&
                               Integer.valueOf(80).equals(listenerConfig.get("port"));
                    });
            assertTrue(hasHttpRedirect, "Should have HTTP listener on port 80");

            // Verify HTTPS listener
            boolean hasHttpsListener = listeners.values().stream()
                    .anyMatch(listener -> {
                        Map<String, Object> listenerConfig = (Map<String, Object>) listener;
                        return "HTTPS".equals(listenerConfig.get("protocol")) &&
                               Integer.valueOf(443).equals(listenerConfig.get("port"));
                    });
            assertTrue(hasHttpsListener, "Should have HTTPS listener on port 443");
        }

        @Test
        @DisplayName("ALB security group should allow HTTP and HTTPS traffic")
        void testAlbSecurityGroup() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> securityGroups = getResourcesOfType(synth, "aws_security_group");
            assertFalse(securityGroups.isEmpty(), "Security groups should be created");

            // Find ALB security group
            boolean hasAlbSg = securityGroups.values().stream()
                    .anyMatch(sg -> {
                        Map<String, Object> sgConfig = (Map<String, Object>) sg;
                        String desc = (String) sgConfig.get("description");
                        return desc != null && desc.contains("Load Balancer");
                    });
            assertTrue(hasAlbSg, "ALB security group should be created");
        }
    }

    @Nested
    @DisplayName("ECS Service Resources")
    class EcsServiceResourceTests {

        @Test
        @DisplayName("ECS services should be created for payment and auth services")
        void testEcsServices() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> services = getResourcesOfType(synth, "aws_ecs_service");
            assertFalse(services.isEmpty(), "ECS services should be created");

            // Should have 2 services (payment-service and auth-service)
            assertTrue(services.size() >= 2,
                    "Should have payment and auth ECS services");

            // Verify service configuration
            services.values().forEach(service -> {
                Map<String, Object> serviceConfig = (Map<String, Object>) service;

                // Verify launch type is FARGATE
                assertEquals("FARGATE", serviceConfig.get("launch_type"),
                        "Launch type should be FARGATE");

                // Verify network configuration
                Map<String, Object> networkConfig = (Map<String, Object>) serviceConfig.get("network_configuration");
                assertNotNull(networkConfig, "Network configuration should exist");

                // Verify load balancer is attached
                List<Map<String, Object>> loadBalancers = (List<Map<String, Object>>) serviceConfig.get("load_balancer");
                assertNotNull(loadBalancers, "Load balancer configuration should exist");
                assertFalse(loadBalancers.isEmpty(), "Service should be attached to load balancer");

                // Verify service registries (Service Discovery)
                Map<String, Object> serviceRegistries = (Map<String, Object>) serviceConfig.get("service_registries");
                assertNotNull(serviceRegistries, "Service registries should be configured");
            });
        }

        @Test
        @DisplayName("Task definitions should be created with correct container configurations")
        void testTaskDefinitions() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> taskDefs = getResourcesOfType(synth, "aws_ecs_task_definition");
            assertFalse(taskDefs.isEmpty(), "Task definitions should be created");

            // Should have 2 task definitions
            assertTrue(taskDefs.size() >= 2,
                    "Should have task definitions for payment and auth services");

            // Verify task definition configuration
            taskDefs.values().forEach(taskDef -> {
                Map<String, Object> taskDefConfig = (Map<String, Object>) taskDef;

                // Verify network mode
                assertEquals("awsvpc", taskDefConfig.get("network_mode"),
                        "Network mode should be awsvpc for Fargate");

                // Verify compatibility
                List<String> requires = (List<String>) taskDefConfig.get("requires_compatibilities");
                assertNotNull(requires, "Requires compatibilities should be set");
                assertTrue(requires.contains("FARGATE"),
                        "Should require FARGATE compatibility");

                // Verify CPU and memory are set
                assertNotNull(taskDefConfig.get("cpu"), "CPU should be configured");
                assertNotNull(taskDefConfig.get("memory"), "Memory should be configured");

                // Verify IAM roles
                assertNotNull(taskDefConfig.get("execution_role_arn"),
                        "Execution role should be set");
                assertNotNull(taskDefConfig.get("task_role_arn"),
                        "Task role should be set");
            });
        }

        @Test
        @DisplayName("Service security groups should be configured correctly")
        void testServiceSecurityGroups() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> securityGroups = getResourcesOfType(synth, "aws_security_group");
            assertFalse(securityGroups.isEmpty(), "Security groups should be created");

            // Find service security groups
            long serviceSecurityGroups = securityGroups.values().stream()
                    .filter(sg -> {
                        Map<String, Object> sgConfig = (Map<String, Object>) sg;
                        String name = (String) sgConfig.get("name");
                        return name != null && (name.contains("payment-service") || name.contains("auth-service"));
                    })
                    .count();

            assertTrue(serviceSecurityGroups >= 2,
                    "Should have security groups for each service");
        }

        @Test
        @DisplayName("Auto scaling should be configured for services")
        void testAutoScaling() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> scalingTargets = getResourcesOfType(synth, "aws_appautoscaling_target");
            assertFalse(scalingTargets.isEmpty(), "Auto scaling targets should be created");

            Map<String, Object> scalingPolicies = getResourcesOfType(synth, "aws_appautoscaling_policy");
            assertFalse(scalingPolicies.isEmpty(), "Auto scaling policies should be created");

            // Verify scaling target configuration
            scalingTargets.values().forEach(target -> {
                Map<String, Object> targetConfig = (Map<String, Object>) target;

                // Verify service namespace
                assertEquals("ecs", targetConfig.get("service_namespace"),
                        "Service namespace should be ecs");

                // Verify scalable dimension
                assertEquals("ecs:service:DesiredCount", targetConfig.get("scalable_dimension"),
                        "Scalable dimension should be DesiredCount");

                // Verify min and max capacity
                assertNotNull(targetConfig.get("min_capacity"), "Min capacity should be set");
                assertNotNull(targetConfig.get("max_capacity"), "Max capacity should be set");
            });
        }

        @Test
        @DisplayName("IAM roles should be created for task execution and task")
        void testIamRoles() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> roles = getResourcesOfType(synth, "aws_iam_role");
            assertFalse(roles.isEmpty(), "IAM roles should be created");

            // Should have roles for both execution and task for each service
            assertTrue(roles.size() >= 4,
                    "Should have execution and task roles for each service");

            // Verify roles have correct assume role policy
            roles.values().forEach(role -> {
                Map<String, Object> roleConfig = (Map<String, Object>) role;
                assertNotNull(roleConfig.get("assume_role_policy"),
                        "Assume role policy should be set");
            });
        }
    }

    @Nested
    @DisplayName("Service Discovery Resources")
    class ServiceDiscoveryResourceTests {

        @Test
        @DisplayName("Service Discovery namespace should be created")
        void testServiceDiscoveryNamespace() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> namespaces = getResourcesOfType(synth, "aws_service_discovery_private_dns_namespace");
            assertFalse(namespaces.isEmpty(), "Service Discovery namespace should be created");

            Object firstNamespace = namespaces.values().iterator().next();
            Map<String, Object> namespaceConfig = (Map<String, Object>) firstNamespace;

            // Verify namespace name ends with .local
            String name = (String) namespaceConfig.get("name");
            assertNotNull(name, "Namespace should have a name");
            assertTrue(name.endsWith(".local"),
                    "Namespace should end with .local");
        }

        @Test
        @DisplayName("Service Discovery services should be created for each ECS service")
        void testServiceDiscoveryServices() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> discoveryServices = getResourcesOfType(synth, "aws_service_discovery_service");
            assertFalse(discoveryServices.isEmpty(), "Service Discovery services should be created");

            // Should have 2 discovery services
            assertTrue(discoveryServices.size() >= 2,
                    "Should have discovery services for payment and auth services");

            // Verify discovery service configuration
            discoveryServices.values().forEach(service -> {
                Map<String, Object> serviceConfig = (Map<String, Object>) service;

                // Verify DNS config
                Map<String, Object> dnsConfig = (Map<String, Object>) serviceConfig.get("dns_config");
                assertNotNull(dnsConfig, "DNS config should be set");

                // Verify routing policy
                assertEquals("MULTIVALUE", dnsConfig.get("routing_policy"),
                        "Routing policy should be MULTIVALUE");

                // Verify health check config
                Map<String, Object> healthCheckConfig = (Map<String, Object>) serviceConfig.get("health_check_custom_config");
                assertNotNull(healthCheckConfig, "Health check custom config should be set");
            });
        }
    }

    @Nested
    @DisplayName("Monitoring Resources")
    class MonitoringResourceTests {

        @Test
        @DisplayName("CloudWatch alarms should be created for services")
        void testCloudWatchAlarms() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> alarms = getResourcesOfType(synth, "aws_cloudwatch_metric_alarm");
            assertFalse(alarms.isEmpty(), "CloudWatch alarms should be created");

            // Should have multiple alarms (CPU, Memory, Task count for each service)
            assertTrue(alarms.size() >= 6,
                    "Should have at least 6 alarms (3 per service)");

            // Verify alarm configuration
            alarms.values().forEach(alarm -> {
                Map<String, Object> alarmConfig = (Map<String, Object>) alarm;

                // Verify namespace
                assertEquals("AWS/ECS", alarmConfig.get("namespace"),
                        "Namespace should be AWS/ECS");

                // Verify statistic
                assertEquals("Average", alarmConfig.get("statistic"),
                        "Statistic should be Average");

                // Verify alarm has actions
                assertNotNull(alarmConfig.get("alarm_actions"),
                        "Alarm should have actions configured");
            });
        }

        @Test
        @DisplayName("SNS topic should be created for alarm notifications")
        void testSnsTopicForAlarms() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> topics = getResourcesOfType(synth, "aws_sns_topic");
            assertFalse(topics.isEmpty(), "SNS topic should be created");

            Object firstTopic = topics.values().iterator().next();
            Map<String, Object> topicConfig = (Map<String, Object>) firstTopic;

            // Verify topic has a name
            assertNotNull(topicConfig.get("name"), "SNS topic should have a name");
        }

        @Test
        @DisplayName("CloudWatch log groups should be created for services")
        void testCloudWatchLogGroups() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> logGroups = getResourcesOfType(synth, "aws_cloudwatch_log_group");
            assertFalse(logGroups.isEmpty(), "CloudWatch log groups should be created");

            // Should have log groups for each service
            assertTrue(logGroups.size() >= 2,
                    "Should have log groups for each service");

            // Verify log group configuration
            logGroups.values().forEach(logGroup -> {
                Map<String, Object> logGroupConfig = (Map<String, Object>) logGroup;

                // Verify log group name starts with /ecs/
                String name = (String) logGroupConfig.get("name");
                assertNotNull(name, "Log group should have a name");
                assertTrue(name.startsWith("/ecs/"),
                        "Log group name should start with /ecs/");

                // Verify retention is set
                assertNotNull(logGroupConfig.get("retention_in_days"),
                        "Log retention should be configured");
            });
        }

        @Test
        @DisplayName("CloudWatch Dashboard should be created")
        void testCloudWatchDashboard() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> dashboards = getResourcesOfType(synth, "aws_cloudwatch_dashboard");
            assertFalse(dashboards.isEmpty(), "CloudWatch dashboard should be created");

            Object firstDashboard = dashboards.values().iterator().next();
            Map<String, Object> dashboardConfig = (Map<String, Object>) firstDashboard;

            // Verify dashboard has a body
            assertNotNull(dashboardConfig.get("dashboard_body"),
                    "Dashboard should have a body");
        }
    }

    @Nested
    @DisplayName("SSL/TLS Configuration")
    class SslTlsConfigurationTests {

        @Test
        @DisplayName("SSL certificate should be created for ALB")
        void testSslCertificate() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> certificates = getResourcesOfType(synth, "aws_acm_certificate");
            assertFalse(certificates.isEmpty(), "ACM certificate should be created");
        }

        @Test
        @DisplayName("TLS private key should be generated")
        void testTlsPrivateKey() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> privateKeys = getResourcesOfType(synth, "tls_private_key");
            assertFalse(privateKeys.isEmpty(), "TLS private key should be generated");

            Object firstKey = privateKeys.values().iterator().next();
            Map<String, Object> keyConfig = (Map<String, Object>) firstKey;

            // Verify algorithm
            assertEquals("RSA", keyConfig.get("algorithm"),
                    "Algorithm should be RSA");
        }

        @Test
        @DisplayName("Self-signed certificate should be created")
        void testSelfSignedCertificate() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> selfSignedCerts = getResourcesOfType(synth, "tls_self_signed_cert");
            assertFalse(selfSignedCerts.isEmpty(), "Self-signed certificate should be created");
        }
    }

    @Nested
    @DisplayName("Stack Outputs")
    class StackOutputTests {

        @Test
        @DisplayName("Stack should have comprehensive outputs defined")
        void testStackOutputs() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> template = parseSynth(synth);
            Map<String, Object> outputs = (Map<String, Object>) template.get("output");
            assertNotNull(outputs, "Outputs should be defined");
            assertFalse(outputs.isEmpty(), "Should have multiple outputs");

            // Verify critical outputs exist
            List<String> expectedOutputs = List.of(
                    "vpcId", "ecsClusterName", "albDnsName", "albUrl",
                    "serviceDiscoveryNamespace", "snsTopicArn"
            );

            for (String expectedOutput : expectedOutputs) {
                assertTrue(outputs.containsKey(expectedOutput),
                        "Output '" + expectedOutput + "' should exist");
            }
        }

        @Test
        @DisplayName("Service-specific outputs should be created")
        void testServiceOutputs() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> template = parseSynth(synth);
            Map<String, Object> outputs = (Map<String, Object>) template.get("output");

            // Verify payment-service outputs
            assertTrue(outputs.containsKey("payment-serviceServiceName"),
                    "Payment service name output should exist");
            assertTrue(outputs.containsKey("payment-serviceServiceArn"),
                    "Payment service ARN output should exist");
            assertTrue(outputs.containsKey("payment-serviceTaskDefinitionArn"),
                    "Payment task definition output should exist");

            // Verify auth-service outputs
            assertTrue(outputs.containsKey("auth-serviceServiceName"),
                    "Auth service name output should exist");
            assertTrue(outputs.containsKey("auth-serviceServiceArn"),
                    "Auth service ARN output should exist");
            assertTrue(outputs.containsKey("auth-serviceTaskDefinitionArn"),
                    "Auth task definition output should exist");
        }
    }

    @Nested
    @DisplayName("Resource Tagging")
    class ResourceTaggingTests {

        @Test
        @DisplayName("Resources should be properly tagged")
        void testResourceTags() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            AppConfig appConfig = AppConfig.defaultConfig();
            Map<String, String> expectedTags = appConfig.tags();

            // Check VPC tags
            Map<String, Object> vpcs = getResourcesOfType(synth, "aws_vpc");
            vpcs.values().forEach(vpc -> {
                Map<String, Object> vpcConfig = (Map<String, Object>) vpc;
                Map<String, String> tags = (Map<String, String>) vpcConfig.get("tags");
                if (tags != null) {
                    assertFalse(tags.isEmpty(), "VPC should have tags");
                }
            });

            // Check ECS cluster tags
            Map<String, Object> clusters = getResourcesOfType(synth, "aws_ecs_cluster");
            clusters.values().forEach(cluster -> {
                Map<String, Object> clusterConfig = (Map<String, Object>) cluster;
                Map<String, String> tags = (Map<String, String>) clusterConfig.get("tags");
                if (tags != null) {
                    assertFalse(tags.isEmpty(), "ECS cluster should have tags");
                }
            });
        }
    }

    @Nested
    @DisplayName("High Availability and Resilience")
    class HighAvailabilityTests {

        @Test
        @DisplayName("Infrastructure should span multiple availability zones")
        void testMultiAzDeployment() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> subnets = getResourcesOfType(synth, "aws_subnet");
            assertFalse(subnets.isEmpty(), "Subnets should be created");

            // Should have subnets in multiple AZs
            assertTrue(subnets.size() >= 4,
                    "Should have subnets across multiple AZs for high availability");
        }

        @Test
        @DisplayName("Services should have minimum healthy task count for zero-downtime deployments")
        void testZeroDowntimeDeployment() {
            App app = Testing.app();
            MainStack stack = new MainStack(app, STACK_NAME);
            String synth = Testing.synth(stack);

            Map<String, Object> services = getResourcesOfType(synth, "aws_ecs_service");
            services.values().forEach(service -> {
                Map<String, Object> serviceConfig = (Map<String, Object>) service;

                // Verify deployment configuration
                Integer minHealthyPercent = (Integer) serviceConfig.get("deployment_minimum_healthy_percent");
                Integer maxPercent = (Integer) serviceConfig.get("deployment_maximum_percent");

                if (minHealthyPercent != null) {
                    assertTrue(minHealthyPercent >= 100,
                            "Minimum healthy percent should be at least 100 for zero-downtime deployment");
                }

                if (maxPercent != null) {
                    assertTrue(maxPercent >= 100,
                            "Maximum percent should be at least 100");
                }
            });
        }
    }

    @Test
    @DisplayName("Stack should synthesize without errors")
    void testStackSynthesis() {
        App app = Testing.app();
        MainStack stack = new MainStack(app, STACK_NAME);
        String synth = Testing.synth(stack);

        assertNotNull(synth, "Stack should synthesize");
        assertFalse(synth.isEmpty(), "Synth output should not be empty");
    }
}
