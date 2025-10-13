package app.config;

import java.util.List;

public record NetworkConfig(String vpcCidr, List<String> publicSubnetCidrs, List<String> privateSubnetCidrs,
                            List<String> availabilityZones, boolean enableNatGateway, boolean enableVpnGateway) {
    public static NetworkConfig defaultConfig() {
        return new NetworkConfig("10.0.0.0/16", List.of("10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"),
                List.of("10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"),
                List.of("us-east-1a", "us-east-1b", "us-east-1c"), true, false
        );
    }
}
