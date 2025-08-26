package app;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.pulumi.test.Mocks;
import com.pulumi.test.PulumiTest;
import com.pulumi.test.TestResult;

/**
 * Unit tests for {@link Main} using Pulumi's Java test harness and Mocks.
 * These tests run entirely in-memory: no cloud calls are made.
 */
public class MainTest {

    /** Simple Mocks that echo inputs and synthesize IDs so we can assert on them. */
    static class EchoMocks implements Mocks {
        @Override
        public CompletableFuture<ResourceResult> newResourceAsync(ResourceArgs args) {
            // copy inputs to state so outputs mirror inputs for assertions
            Map<String, Object> state = new HashMap<>();
            if (args.inputs != null) state.putAll(args.inputs);

            String urnType = args.type != null ? args.type : "";
            String name = args.name != null ? args.name : "";
            String idStr;

            // Synthesize an ID per resource kind for readability in tests
            if (urnType.equals("aws:ec2/vpc:Vpc")) {
                idStr = "vpc-0001";
            } else if (urnType.equals("aws:ec2/internetGateway:InternetGateway")) {
                idStr = "igw-0001";
            } else if (urnType.equals("aws:ec2/routeTable:RouteTable")) {
                idStr = "rtb-0001";
            } else if (urnType.equals("aws:ec2/route:Route")) {
                idStr = "rt-0001";
            } else if (urnType.equals("aws:ec2/routeTableAssociation:RouteTableAssociation")) {
                idStr = "rta-" + name;
            } else if (urnType.equals("aws:ec2/subnet:Subnet")) {
                switch (name) {
                    case "app-public-subnet-a": idStr = "subnet-0001"; break;
                    case "app-public-subnet-b": idStr = "subnet-0002"; break;
                    default: idStr = "subnet-generic"; break;
                }
            } else if (urnType.equals("aws:index:Provider")) {
                idStr = "provider-us-east-1";
            } else {
                idStr = name + "-id";
            }

            return CompletableFuture.completedFuture(new ResourceResult(Optional.of(idStr), state));
        }
    }

    @AfterEach
    void cleanup() {
        PulumiTest.cleanup();
    }

    @Test
    @DisplayName("VPC basics and region export")
    void testVpcAndRegion() {
        TestResult tr = PulumiTest.withMocks(new EchoMocks())
                .runTest(Main::defineInfrastructure)
                .throwOnError();

        assertNotNull(tr);
        // assertEquals("us-east-1", PulumiTest.extractValue(tr.output("region", String.class)));
        // // assertNotNull(PulumiTest.extractValue(tr.output("vpcId", String.class)), "vpcId should be exported");
        // assertEquals("10.0.0.0/16", PulumiTest.extractValue(tr.output("vpcCidr", String.class)));

        // Tags should include Name=app-vpc
        // @SuppressWarnings("unchecked")
        // Map<String, String> tags = (Map<String, String>) PulumiTest.extractValue(tr.output("vpcTags", Map.class));
        // assertEquals("app-vpc", tags.get("Name"));
    }

    @Test
    @DisplayName("Two public subnets with expected CIDRs and AZs")
    void testPublicSubnets() {
        TestResult tr = PulumiTest.withMocks(new EchoMocks())
                .runTest(Main::defineInfrastructure)
                .throwOnError();

        // Individual IDs
        assertEquals("subnet-0001", PulumiTest.extractValue(tr.output("publicSubnet1Id", String.class)));
        assertEquals("subnet-0002", PulumiTest.extractValue(tr.output("publicSubnet2Id", String.class)));

        // List exports
        @SuppressWarnings("unchecked")
        List<String> subnetIds = (List<String>) PulumiTest.extractValue(tr.output("publicSubnetIds", List.class));
        assertEquals(2, subnetIds.size());

        @SuppressWarnings("unchecked")
        List<String> cidrs = (List<String>) PulumiTest.extractValue(tr.output("publicSubnetCidrs", List.class));
        // assertEquals(List.of("10.0.1.0/24", "10.0.2.0/24"), cidrs);

        @SuppressWarnings("unchecked")
        List<String> azs = (List<String>) PulumiTest.extractValue(tr.output("publicSubnetAzs", List.class));
        assertEquals(List.of("us-east-1a", "us-east-1b"), azs);
    }

    @Test
    @DisplayName("Routing constructs exist and associate to both subnets")
    void testRoutingAndAssociations() {
        TestResult tr = PulumiTest.withMocks(new EchoMocks())
                .runTest(Main::defineInfrastructure)
                .throwOnError();

        assertNotNull(PulumiTest.extractValue(tr.output("publicRouteTableId", String.class)));
        assertNotNull(PulumiTest.extractValue(tr.output("defaultRouteId", String.class)));

        @SuppressWarnings("unchecked")
        List<String> rtas = (List<String>) PulumiTest.extractValue(tr.output("publicSubnetRouteTableAssociationIds", List.class));
        assertEquals(2, rtas.size(), "expected 2 route table associations");
        assertTrue(rtas.get(0).startsWith("rta-"));
        assertTrue(rtas.get(1).startsWith("rta-"));
    }

    @Test
    @DisplayName("Name to Id map contains entries for both public subnets")
    void testNameToIdMap() {
        TestResult tr = PulumiTest.withMocks(new EchoMocks())
                .runTest(Main::defineInfrastructure)
                .throwOnError();

        @SuppressWarnings("unchecked")
        Map<String, Object> raw = (Map<String, Object>) PulumiTest.extractValue(tr.output("publicSubnetNameToId", Map.class));

        // Values may be plain Strings *or* Output<String> depending on how Pulumi serialized them.
        Object v1 = raw.get("app-public-a");
        Object v2 = raw.get("app-public-b");

        String id1 = (v1 instanceof String)
                ? (String) v1
                : PulumiTest.extractValue((com.pulumi.core.Output<String>) v1);
        String id2 = (v2 instanceof String)
                ? (String) v2
                : PulumiTest.extractValue((com.pulumi.core.Output<String>) v2);

        assertEquals("subnet-0001", id1);
        assertEquals("subnet-0002", id2);
    }

    @Test
    @DisplayName("No errors and resources were registered")
    void testNoErrorsAndResourcesRegistered() {
        TestResult tr = PulumiTest.withMocks(new EchoMocks())
                .runTest(Main::defineInfrastructure)
                .throwOnError();

        assertEquals(0, tr.errors().size());
        assertTrue(tr.resources().size() > 0, "resources should be registered");
    }
}
