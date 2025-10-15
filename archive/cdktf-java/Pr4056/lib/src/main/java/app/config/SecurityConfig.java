package app.config;

public record SecurityConfig(String allowedSshIp, int sshPort, int httpPort, int httpsPort, String kmsKeyAlias,
                             boolean enableEncryption, String instanceType, String amiId) {
    public static SecurityConfig defaultConfig() {
        return new SecurityConfig("0.0.0.0/32", 22, 80, 443, "alias/vpc-migration-key",
                true, "t3.medium", "ami-0c02fb55956c7d316"
        );
    }
}
