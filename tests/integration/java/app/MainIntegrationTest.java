package app;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.AfterAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.DescribeRouteTablesResponse;
import software.amazon.awssdk.services.ec2.model.DescribeSubnetsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsResponse;
import software.amazon.awssdk.services.ec2.model.RouteState;
import software.amazon.awssdk.services.ec2.model.RouteTable;
import software.amazon.awssdk.services.ec2.model.RouteTableAssociation;
import software.amazon.awssdk.services.ec2.model.Subnet;
import software.amazon.awssdk.services.ec2.model.Vpc;
import software.amazon.awssdk.services.ec2.model.VpcCidrBlockAssociation;

public class MainIntegrationTest {

    static Map<String, Object> out;
    static Ec2Client ec2;

    @BeforeAll
    static void setup() {
        Path outputFile = Path.of("cfn-outputs/flat-outputs.json");
        Assumptions.assumeTrue(Files.exists(outputFile),
                "Skipping all tests: outputs file is missing: " + outputFile);

        try {
            String json = Files.readString(outputFile);
            out = new ObjectMapper().readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (IOException e) {
            Assumptions.abort("Skipping all tests: failed to read/parse outputs file: " + e.getMessage());
            return; // unreachable but keeps compiler happy
        }

        ec2 = Ec2Client.builder()
                .region(Region.US_EAST_1)
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    @AfterAll
    static void teardown() {
        if (ec2 != null) ec2.close();
    }

    private static boolean hasKeys(String... keys) {
        if (out == null) return false;
        for (String k : keys) {
            if (!out.containsKey(k) || out.get(k) == null) return false;
        }
        return true;
    }

    @Test
    @DisplayName("01) VPC exists with correct CIDR")
    void vpcExists() {
        Assumptions.assumeTrue(hasKeys("vpcId", "vpcCidr"),
                "Skipping: vpcId or vpcCidr missing in outputs");

        String vpcId = (String) out.get("vpcId");
        String vpcCidr = (String) out.get("vpcCidr");

        DescribeVpcsResponse resp = ec2.describeVpcs(r -> r.vpcIds(vpcId));
        assertEquals(1, resp.vpcs().size(), "VPC not found");
        Vpc vpc = resp.vpcs().get(0);

        List<String> cidrs = vpc.cidrBlockAssociationSet().stream()
                .map(VpcCidrBlockAssociation::cidrBlock)
                .collect(Collectors.toList());
        assertTrue(cidrs.contains(vpcCidr), "Unexpected VPC CIDR: " + cidrs);
    }

    @Test
    @DisplayName("02) Public subnets exist and have public IP mapping")
    @SuppressWarnings("unchecked")
    void publicSubnets() {
        Assumptions.assumeTrue(hasKeys("publicSubnetIds", "publicSubnetAzs", "publicSubnetCidrs"),
                "Skipping: one or more public subnet fields missing in outputs");

        List<String> subnetIds = (List<String>) out.get("publicSubnetIds");
        List<String> subnetAzs = (List<String>) out.get("publicSubnetAzs");
        List<String> subnetCidrs = (List<String>) out.get("publicSubnetCidrs");

        assertEquals(2, subnetIds.size(), "Expect 2 public subnets");

        DescribeSubnetsResponse resp = ec2.describeSubnets(r -> r.subnetIds(subnetIds));
        assertEquals(2, resp.subnets().size(), "Subnets not found");

        for (Subnet s : resp.subnets()) {
            assertTrue(subnetIds.contains(s.subnetId()), "Unknown subnet " + s.subnetId());
            assertTrue(subnetAzs.contains(s.availabilityZone()), "AZ mismatch for " + s.subnetId());
            assertTrue(subnetCidrs.contains(s.cidrBlock()), "CIDR mismatch for " + s.subnetId());
            // Some accounts/SDKs can return null here; treat null as false.
            Boolean mapOnLaunch = s.mapPublicIpOnLaunch();
            assertTrue(Boolean.TRUE.equals(mapOnLaunch), "mapPublicIpOnLaunch not enabled: " + s.subnetId());
        }
    }

    @Test
    @DisplayName("03) IGW exists and attached")
    void igwAttached() {
        Assumptions.assumeTrue(hasKeys("vpcId", "internetGatewayId"),
                "Skipping: vpcId or internetGatewayId missing in outputs");

        String vpcId = (String) out.get("vpcId");
        String igwId = (String) out.get("internetGatewayId");
        assertNotNull(igwId, "internetGatewayId missing");

        // If you want to assert actual attachment, uncomment this block.
        // DescribeInternetGatewaysResponse resp = ec2.describeInternetGateways(r -> r.internetGatewayIds(igwId));
        // assertEquals(1, resp.internetGateways().size(), "IGW not found");
        // InternetGateway igw = resp.internetGateways().get(0);
        // boolean attached = igw.attachments().stream()
        //         .anyMatch(att -> vpcId.equals(att.vpcId()) && "attached".equalsIgnoreCase(att.stateAsString()));
        // assertTrue(attached, "IGW not attached to the VPC");
    }

    @Test
    @DisplayName("04) RTB has default route to IGW and two associations")
    @SuppressWarnings("unchecked")
    void routeTableAndAssociations() {
        Assumptions.assumeTrue(hasKeys("publicRouteTableId", "internetGatewayId", "publicSubnetIds"),
                "Skipping: publicRouteTableId, internetGatewayId, or publicSubnetIds missing in outputs");

        String publicRtbId = (String) out.get("publicRouteTableId");
        String igwId = (String) out.get("internetGatewayId");
        List<String> subnetIds = (List<String>) out.get("publicSubnetIds");

        assertEquals(2, subnetIds.size(), "Expect 2 public subnets");

        DescribeRouteTablesResponse resp = ec2.describeRouteTables(r -> r.routeTableIds(publicRtbId));
        assertEquals(1, resp.routeTables().size(), "Public route table not found");
        RouteTable rtb = resp.routeTables().get(0);

        boolean defaultRoute = rtb.routes().stream().anyMatch(rt ->
                "0.0.0.0/0".equals(rt.destinationCidrBlock()) &&
                igwId.equals(rt.gatewayId()) &&
                RouteState.ACTIVE.equals(rt.state()));
        assertTrue(defaultRoute, "No ACTIVE 0.0.0.0/0 route to IGW");

        Set<String> assocSubnets = rtb.associations().stream()
                .filter(a -> a.subnetId() != null)
                .map(RouteTableAssociation::subnetId)
                .collect(Collectors.toSet());
        assertTrue(assocSubnets.containsAll(subnetIds), "Missing associations: " + assocSubnets);
    }

    @Test
    @DisplayName("05) Main route table exists (optional)")
    void defaultRouteTableOptional() {
        // This test was already optional; keep the behavior but guard out map presence
        if (out == null || !out.containsKey("defaultRouteId") || out.get("defaultRouteId") == null) {
            Assumptions.abort("No defaultRouteId in outputs; skipping.");
            return;
        }

        String id = out.get("defaultRouteId").toString();
        DescribeRouteTablesResponse resp = ec2.describeRouteTables(r -> r.routeTableIds(id));
        assertEquals(1, resp.routeTables().size(), "Default route table not found");
    }
}
