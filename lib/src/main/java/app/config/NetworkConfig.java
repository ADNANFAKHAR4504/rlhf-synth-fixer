package app.config;

import java.util.Map;

public record NetworkConfig(String vpcCidr, String publicSubnetCidr, String privateSubnetCidr, String availabilityZone,
                             Map<String, String> tags) {
    public static NetworkConfig defaultConfig() {
        return new NetworkConfig(
                "10.0.0.0/16",
                "10.0.1.0/24",
                "10.0.2.0/24",
                "us-east-1a",
                Map.of(
                        "Environment", "Production",
                        "ManagedBy", "CDKTF"
                )
        );
    }
}
