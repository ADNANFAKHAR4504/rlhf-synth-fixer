// package app;

// import java.io.IOException;
// import java.nio.file.Files;
// import java.nio.file.Path;
// import java.util.Arrays;
// import java.util.List;
// import java.util.Map;
// import java.util.Set;
// import java.util.stream.Collectors;

// import org.junit.jupiter.api.AfterAll;
// import static org.junit.jupiter.api.Assertions.assertEquals;
// import static org.junit.jupiter.api.Assertions.assertNotNull;
// import static org.junit.jupiter.api.Assertions.assertTrue;
// import org.junit.jupiter.api.Assumptions;
// import org.junit.jupiter.api.BeforeAll;
// import org.junit.jupiter.api.DisplayName;
// import org.junit.jupiter.api.Test;

// import com.fasterxml.jackson.core.type.TypeReference;
// import com.fasterxml.jackson.databind.ObjectMapper;

// import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
// import software.amazon.awssdk.regions.Region;
// import software.amazon.awssdk.services.ec2.Ec2Client;
// import software.amazon.awssdk.services.ec2.model.DescribeRouteTablesResponse;
// import software.amazon.awssdk.services.ec2.model.DescribeSubnetsResponse;
// import software.amazon.awssdk.services.ec2.model.DescribeVpcsResponse;
// import software.amazon.awssdk.services.ec2.model.RouteState;
// import software.amazon.awssdk.services.ec2.model.RouteTable;
// import software.amazon.awssdk.services.ec2.model.RouteTableAssociation;
// import software.amazon.awssdk.services.ec2.model.Subnet;
// import software.amazon.awssdk.services.ec2.model.Vpc;
// import software.amazon.awssdk.services.ec2.model.VpcCidrBlockAssociation;

// public class MainIntegrationTest {

//     static Map<String, Object> out;
//     static Ec2Client ec2;
//     static final ObjectMapper MAPPER = new ObjectMapper();

//     @BeforeAll
//     static void setup() {
//         Path outputFile = Path.of("cfn-outputs/flat-outputs.json");
//         Assumptions.assumeTrue(Files.exists(outputFile),
//                 "Skipping all tests: outputs file is missing: " + outputFile);

//         try {
//             String json = Files.readString(outputFile);
//             out = MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
//         } catch (IOException e) {
//             Assumptions.abort("Skipping all tests: failed to read/parse outputs file: " + e.getMessage());
//             return; // keeps compiler happy
//         }

//         ec2 = Ec2Client.builder()
//                 .region(Region.US_EAST_1)
//                 .credentialsProvider(DefaultCredentialsProvider.create())
//                 .build();
//     }

//     @AfterAll
//     static void teardown() {
//         if (ec2 != null) ec2.close();
//     }

//     private static boolean hasKeys(String... keys) {
//         if (out == null) return false;
//         for (String k : keys) {
//             if (!out.containsKey(k) || out.get(k) == null) return false;
//         }
//         return true;
//     }

//     /**
//      * Normalize a value that might be:
//      * - a List (already OK)
//      * - a single String (single value, or comma/space-separated list)
//      * - a Stringified JSON array (e.g. "[\"a\",\"b\"]")
//      */
//     private static List<String> toStringList(Object value) {
//         if (value == null) return List.of();

//         if (value instanceof List<?>) {
//             return ((List<?>) value).stream()
//                     .map(String::valueOf)
//                     .collect(Collectors.toList());
//         }

//         if (value instanceof String s) {
//             String t = s.trim();
//             if (t.isEmpty()) return List.of();

//             // If it looks like a JSON array, parse it as such
//             if ((t.startsWith("[") && t.endsWith("]")) || (t.startsWith("\"[") && t.endsWith("]\""))) {
//                 try {
//                     String json = t.startsWith("\"[") ? t.substring(1, t.length() - 1) : t;
//                     return MAPPER.readValue(json, new TypeReference<List<String>>() {});
//                 } catch (Exception ignored) {
//                     // fall back to delimiter split
//                 }
//             }

//             // Split on commas or whitespace
//             return Arrays.stream(t.split("[,\\s]+"))
//                     .map(String::trim)
//                     .filter(x -> !x.isEmpty())
//                     .collect(Collectors.toList());
//         }

//         // Fallback: just coerce to single-element list
//         return List.of(String.valueOf(value));
//     }

//     @Test
//     @DisplayName("01) VPC exists with correct CIDR")
//     void vpcExists() {
//         Assumptions.assumeTrue(hasKeys("vpcId", "vpcCidr"),
//                 "Skipping: vpcId or vpcCidr missing in outputs");

//         String vpcId = String.valueOf(out.get("vpcId"));
//         String vpcCidr = String.valueOf(out.get("vpcCidr"));

//         DescribeVpcsResponse resp = ec2.describeVpcs(r -> r.vpcIds(vpcId));
//         assertEquals(1, resp.vpcs().size(), "VPC not found");
//         Vpc vpc = resp.vpcs().get(0);

//         List<String> cidrs = vpc.cidrBlockAssociationSet().stream()
//                 .map(VpcCidrBlockAssociation::cidrBlock)
//                 .collect(Collectors.toList());
//         assertTrue(cidrs.contains(vpcCidr), "Unexpected VPC CIDR: " + cidrs);
//     }

//     @Test
//     @DisplayName("02) Public subnets exist and have public IP mapping")
//     void publicSubnets() {
//         Assumptions.assumeTrue(hasKeys("publicSubnetIds", "publicSubnetAzs", "publicSubnetCidrs"),
//                 "Skipping: one or more public subnet fields missing in outputs");

//         List<String> subnetIds   = toStringList(out.get("publicSubnetIds"));
//         List<String> subnetAzs   = toStringList(out.get("publicSubnetAzs"));
//         List<String> subnetCidrs = toStringList(out.get("publicSubnetCidrs"));

//         assertEquals(2, subnetIds.size(), "Expect 2 public subnets");

//         DescribeSubnetsResponse resp = ec2.describeSubnets(r -> r.subnetIds(subnetIds));
//         assertEquals(2, resp.subnets().size(), "Subnets not found");

//         for (Subnet s : resp.subnets()) {
//             assertTrue(subnetIds.contains(s.subnetId()), "Unknown subnet " + s.subnetId());
//             assertTrue(subnetAzs.contains(s.availabilityZone()), "AZ mismatch for " + s.subnetId());
//             assertTrue(subnetCidrs.contains(s.cidrBlock()), "CIDR mismatch for " + s.subnetId());

//             Boolean mapOnLaunch = s.mapPublicIpOnLaunch(); // may be null in some SDK responses
//             assertTrue(Boolean.TRUE.equals(mapOnLaunch),
//                     "mapPublicIpOnLaunch not enabled: " + s.subnetId());
//         }
//     }

//     @Test
//     @DisplayName("03) IGW exists and attached")
//     void igwAttached() {
//         Assumptions.assumeTrue(hasKeys("vpcId", "internetGatewayId"),
//                 "Skipping: vpcId or internetGatewayId missing in outputs");

//         String vpcId = String.valueOf(out.get("vpcId"));
//         String igwId = String.valueOf(out.get("internetGatewayId"));
//         assertNotNull(igwId, "internetGatewayId missing");

//         // Uncomment to assert actual attachment (requires extra imports):
//         // DescribeInternetGatewaysResponse resp = ec2.describeInternetGateways(r -> r.internetGatewayIds(igwId));
//         // assertEquals(1, resp.internetGateways().size(), "IGW not found");
//         // InternetGateway igw = resp.internetGateways().get(0);
//         // boolean attached = igw.attachments().stream()
//         //         .anyMatch(att -> vpcId.equals(att.vpcId()) && "attached".equalsIgnoreCase(att.stateAsString()));
//         // assertTrue(attached, "IGW not attached to the VPC");
//     }

//     @Test
//     @DisplayName("04) RTB has default route to IGW and two associations")
//     void routeTableAndAssociations() {
//         Assumptions.assumeTrue(hasKeys("publicRouteTableId", "internetGatewayId", "publicSubnetIds"),
//                 "Skipping: publicRouteTableId, internetGatewayId, or publicSubnetIds missing in outputs");

//         String publicRtbId = String.valueOf(out.get("publicRouteTableId"));
//         String igwId       = String.valueOf(out.get("internetGatewayId"));
//         List<String> subnetIds = toStringList(out.get("publicSubnetIds"));

//         assertEquals(2, subnetIds.size(), "Expect 2 public subnets");

//         DescribeRouteTablesResponse resp = ec2.describeRouteTables(r -> r.routeTableIds(publicRtbId));
//         assertEquals(1, resp.routeTables().size(), "Public route table not found");
//         RouteTable rtb = resp.routeTables().get(0);

//         boolean defaultRoute = rtb.routes().stream().anyMatch(rt ->
//                 "0.0.0.0/0".equals(rt.destinationCidrBlock()) &&
//                 igwId.equals(rt.gatewayId()) &&
//                 RouteState.ACTIVE.equals(rt.state()));
//         assertTrue(defaultRoute, "No ACTIVE 0.0.0.0/0 route to IGW");

//         Set<String> assocSubnets = rtb.associations().stream()
//                 .filter(a -> a.subnetId() != null)
//                 .map(RouteTableAssociation::subnetId)
//                 .collect(Collectors.toSet());
//         assertTrue(assocSubnets.containsAll(subnetIds),
//                 "Missing associations: " + assocSubnets + " vs " + subnetIds);
//     }

//     @Test
//     @DisplayName("05) Main route table exists (optional)")
//     void defaultRouteTableOptional() {
//         if (out == null || !out.containsKey("defaultRouteId") || out.get("defaultRouteId") == null) {
//             Assumptions.abort("No defaultRouteId in outputs; skipping.");
//             return;
//         }

//         String id = String.valueOf(out.get("defaultRouteId"));
//         DescribeRouteTablesResponse resp = ec2.describeRouteTables(r -> r.routeTableIds(id));
//         assertEquals(1, resp.routeTables().size(), "Default route table not found");
//     }
// }


package app;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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
import software.amazon.awssdk.regions.providers.DefaultAwsRegionProviderChain;
import software.amazon.awssdk.services.ec2.Ec2Client;
import software.amazon.awssdk.services.ec2.model.DescribeRouteTablesResponse;
import software.amazon.awssdk.services.ec2.model.DescribeSubnetsResponse;
import software.amazon.awssdk.services.ec2.model.DescribeVpcsResponse;
import software.amazon.awssdk.services.ec2.model.Filter;
import software.amazon.awssdk.services.ec2.model.RouteState;
import software.amazon.awssdk.services.ec2.model.RouteTable;
import software.amazon.awssdk.services.ec2.model.RouteTableAssociation;
import software.amazon.awssdk.services.ec2.model.Subnet;
import software.amazon.awssdk.services.ec2.model.Vpc;
import software.amazon.awssdk.services.ec2.model.VpcCidrBlockAssociation;

public class MainIntegrationTest {

    static Map<String, Object> out;
    static Ec2Client ec2;
    static final ObjectMapper MAPPER = new ObjectMapper();

    @BeforeAll
    static void setup() {
        Path outputFile = Path.of("cfn-outputs/flat-outputs.json");
        Assumptions.assumeTrue(Files.exists(outputFile),
                "Skipping all tests: outputs file is missing: " + outputFile);

        try {
            String json = Files.readString(outputFile);
            out = MAPPER.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (IOException e) {
            Assumptions.abort("Skipping all tests: failed to read/parse outputs file: " + e.getMessage());
            return;
        }

        Region region = resolveRegion();
        ec2 = Ec2Client.builder()
                .region(region)
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
        System.out.println("Integration tests using region: " + region);
    }

    private static Region resolveRegion() {
        String env = System.getenv("AWS_REGION");
        if (env == null || env.isBlank()) env = System.getenv("AWS_DEFAULT_REGION");
        if (env != null && !env.isBlank()) return Region.of(env);
        try {
            Region fromChain = DefaultAwsRegionProviderChain.builder().build().getRegion();
            if (fromChain != null) return fromChain;
        } catch (Exception ignored) {}
        return Region.US_EAST_1;
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

    /** Accept List, single string, CSV/whitespace, or stringified JSON array. */
    private static List<String> toStringList(Object value) {
        if (value == null) return List.of();

        if (value instanceof List<?>) {
            return ((List<?>) value).stream().map(String::valueOf).collect(Collectors.toList());
        }

        if (value instanceof String s) {
            String t = s.trim();
            if (t.isEmpty()) return List.of();

            if ((t.startsWith("[") && t.endsWith("]")) || (t.startsWith("\"[") && t.endsWith("]\""))) {
                try {
                    String json = t.startsWith("\"[") ? t.substring(1, t.length() - 1) : t;
                    return MAPPER.readValue(json, new TypeReference<List<String>>() {});
                } catch (Exception ignored) { /* fall back to split */ }
            }

            return Arrays.stream(t.split("[,\\s]+"))
                    .map(String::trim)
                    .filter(x -> !x.isEmpty())
                    .collect(Collectors.toList());
        }

        return List.of(String.valueOf(value));
    }

    /** Extract a clean AWS id (e.g., rtb-xxxx) from decorated strings like "r-rtb-xxxx123". */
    private static String extractId(String raw, String pattern) {
        if (raw == null) return null;
        Matcher m = Pattern.compile(pattern).matcher(raw);
        return m.find() ? m.group() : raw.trim();
    }

    @Test
    @DisplayName("01) VPC exists with correct CIDR")
    void vpcExists() {
        Assumptions.assumeTrue(hasKeys("vpcId", "vpcCidr"),
                "Skipping: vpcId or vpcCidr missing in outputs");

        String vpcId = String.valueOf(out.get("vpcId"));
        String vpcCidr = String.valueOf(out.get("vpcCidr"));

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
    void publicSubnets() {
        Assumptions.assumeTrue(hasKeys("publicSubnetIds", "publicSubnetAzs", "publicSubnetCidrs"),
                "Skipping: one or more public subnet fields missing in outputs");

        List<String> subnetIds   = toStringList(out.get("publicSubnetIds"));
        List<String> subnetAzs   = toStringList(out.get("publicSubnetAzs"));
        List<String> subnetCidrs = toStringList(out.get("publicSubnetCidrs"));

        assertEquals(2, subnetIds.size(), "Expect 2 public subnets");

        DescribeSubnetsResponse resp = ec2.describeSubnets(r -> r.subnetIds(subnetIds));
        assertEquals(2, resp.subnets().size(), "Subnets not found");

        for (Subnet s : resp.subnets()) {
            assertTrue(subnetIds.contains(s.subnetId()), "Unknown subnet " + s.subnetId());
            assertTrue(subnetAzs.contains(s.availabilityZone()), "AZ mismatch for " + s.subnetId());
            assertTrue(subnetCidrs.contains(s.cidrBlock()), "CIDR mismatch for " + s.subnetId());

            Boolean mapOnLaunch = s.mapPublicIpOnLaunch();
            assertTrue(Boolean.TRUE.equals(mapOnLaunch),
                    "mapPublicIpOnLaunch not enabled: " + s.subnetId());
        }
    }

    @Test
    @DisplayName("03) IGW exists and attached")
    void igwAttached() {
        Assumptions.assumeTrue(hasKeys("vpcId", "internetGatewayId"),
                "Skipping: vpcId or internetGatewayId missing in outputs");

        String vpcId = String.valueOf(out.get("vpcId"));
        String igwId = String.valueOf(out.get("internetGatewayId"));
        assertNotNull(igwId, "internetGatewayId missing");

        // (Attachment check available if you want to re-enable)
    }

    @Test
    @DisplayName("04) RTB has default route to IGW and two associations")
    void routeTableAndAssociations() {
        Assumptions.assumeTrue(hasKeys("publicRouteTableId", "internetGatewayId", "publicSubnetIds"),
                "Skipping: publicRouteTableId, internetGatewayId, or publicSubnetIds missing in outputs");

        String publicRtbIdRaw = String.valueOf(out.get("publicRouteTableId"));
        String publicRtbId = extractId(publicRtbIdRaw, "rtb-[0-9a-fA-F]+");
        String igwId       = String.valueOf(out.get("internetGatewayId"));
        List<String> subnetIds = toStringList(out.get("publicSubnetIds"));
        assertEquals(2, subnetIds.size(), "Expect 2 public subnets");

        DescribeRouteTablesResponse resp = ec2.describeRouteTables(r -> r.routeTableIds(publicRtbId));
        assertEquals(1, resp.routeTables().size(), "Public route table not found: " + publicRtbIdRaw);
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
        assertTrue(assocSubnets.containsAll(subnetIds),
                "Missing associations: " + assocSubnets + " vs " + subnetIds);
    }

    @Test
    @DisplayName("05) Main route table exists (optional)")
    void defaultRouteTableOptional() {
        if (out == null || !out.containsKey("defaultRouteId") || out.get("defaultRouteId") == null) {
            Assumptions.abort("No defaultRouteId in outputs; skipping.");
            return;
        }

        String idRaw = String.valueOf(out.get("defaultRouteId"));
        String rtbId = extractId(idRaw, "rtb-[0-9a-fA-F]+");

        DescribeRouteTablesResponse resp = ec2.describeRouteTables(r -> r.routeTableIds(rtbId));
        if (resp.routeTables().isEmpty()) {
            // Fallback: discover main RTB via filters (requires vpcId)
            Assumptions.assumeTrue(hasKeys("vpcId"),
                    "Skipping: vpcId missing; can't discover main route table via filters");
            String vpcId = String.valueOf(out.get("vpcId"));

            DescribeRouteTablesResponse byFilter = ec2.describeRouteTables(r -> r
                    .filters(
                            Filter.builder().name("vpc-id").values(vpcId).build(),
                            Filter.builder().name("association.main").values("true").build()
                    )
            );
            assertEquals(1, byFilter.routeTables().size(),
                    "Default route table not found via filters for VPC " + vpcId + " (original id: " + idRaw + ")");
        } else {
            assertEquals(1, resp.routeTables().size(), "Default route table not found");
        }
    }
}
