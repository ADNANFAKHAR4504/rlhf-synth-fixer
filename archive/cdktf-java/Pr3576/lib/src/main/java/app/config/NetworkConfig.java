package app.config;

import java.util.List;
import java.util.Map;

public record NetworkConfig(String vpcCidr, List<String> publicSubnetCidrs, List<String> privateSubnetCidrs,
                             List<String> availabilityZones, Map<String, String> tags) {
    public static NetworkConfig defaultConfig() {
        return new NetworkConfig(
                "10.0.0.0/16",
                List.of("10.0.10.0/24", "10.0.11.0/24"),
                List.of("10.0.20.0/24", "10.0.21.0/24"),
                List.of("us-east-1a", "us-east-1b"),
                Map.of(
                        "Environment", "Production",
                        "ManagedBy", "CDKTF"
                )
        );
    }
}
