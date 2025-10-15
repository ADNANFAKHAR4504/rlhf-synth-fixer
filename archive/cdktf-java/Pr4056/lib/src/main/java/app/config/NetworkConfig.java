package app.config;

import java.util.List;

public record NetworkConfig(String vpcCidr, List<String> publicSubnetCidrs, List<String> privateSubnetCidrs,
                            List<String> availabilityZones, boolean enableDnsHostnames, boolean enableDnsSupport,
                            boolean enableNatGateway) {
    public static NetworkConfig defaultConfig() {
        return new NetworkConfig(
                "10.0.0.0/16", List.of("10.0.1.0/24", "10.0.2.0/24"), List.of("10.0.10.0/24", "10.0.11.0/24"),
                List.of("us-east-1a", "us-east-1b"), true, true, true
        );
    }
}
