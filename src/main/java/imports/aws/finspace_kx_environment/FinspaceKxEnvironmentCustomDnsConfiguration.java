package imports.aws.finspace_kx_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.224Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxEnvironment.FinspaceKxEnvironmentCustomDnsConfiguration")
@software.amazon.jsii.Jsii.Proxy(FinspaceKxEnvironmentCustomDnsConfiguration.Jsii$Proxy.class)
public interface FinspaceKxEnvironmentCustomDnsConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#custom_dns_server_ip FinspaceKxEnvironment#custom_dns_server_ip}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCustomDnsServerIp();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#custom_dns_server_name FinspaceKxEnvironment#custom_dns_server_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCustomDnsServerName();

    /**
     * @return a {@link Builder} of {@link FinspaceKxEnvironmentCustomDnsConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FinspaceKxEnvironmentCustomDnsConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FinspaceKxEnvironmentCustomDnsConfiguration> {
        java.lang.String customDnsServerIp;
        java.lang.String customDnsServerName;

        /**
         * Sets the value of {@link FinspaceKxEnvironmentCustomDnsConfiguration#getCustomDnsServerIp}
         * @param customDnsServerIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#custom_dns_server_ip FinspaceKxEnvironment#custom_dns_server_ip}. This parameter is required.
         * @return {@code this}
         */
        public Builder customDnsServerIp(java.lang.String customDnsServerIp) {
            this.customDnsServerIp = customDnsServerIp;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxEnvironmentCustomDnsConfiguration#getCustomDnsServerName}
         * @param customDnsServerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_environment#custom_dns_server_name FinspaceKxEnvironment#custom_dns_server_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder customDnsServerName(java.lang.String customDnsServerName) {
            this.customDnsServerName = customDnsServerName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FinspaceKxEnvironmentCustomDnsConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FinspaceKxEnvironmentCustomDnsConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FinspaceKxEnvironmentCustomDnsConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FinspaceKxEnvironmentCustomDnsConfiguration {
        private final java.lang.String customDnsServerIp;
        private final java.lang.String customDnsServerName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.customDnsServerIp = software.amazon.jsii.Kernel.get(this, "customDnsServerIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customDnsServerName = software.amazon.jsii.Kernel.get(this, "customDnsServerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.customDnsServerIp = java.util.Objects.requireNonNull(builder.customDnsServerIp, "customDnsServerIp is required");
            this.customDnsServerName = java.util.Objects.requireNonNull(builder.customDnsServerName, "customDnsServerName is required");
        }

        @Override
        public final java.lang.String getCustomDnsServerIp() {
            return this.customDnsServerIp;
        }

        @Override
        public final java.lang.String getCustomDnsServerName() {
            return this.customDnsServerName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("customDnsServerIp", om.valueToTree(this.getCustomDnsServerIp()));
            data.set("customDnsServerName", om.valueToTree(this.getCustomDnsServerName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.finspaceKxEnvironment.FinspaceKxEnvironmentCustomDnsConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FinspaceKxEnvironmentCustomDnsConfiguration.Jsii$Proxy that = (FinspaceKxEnvironmentCustomDnsConfiguration.Jsii$Proxy) o;

            if (!customDnsServerIp.equals(that.customDnsServerIp)) return false;
            return this.customDnsServerName.equals(that.customDnsServerName);
        }

        @Override
        public final int hashCode() {
            int result = this.customDnsServerIp.hashCode();
            result = 31 * result + (this.customDnsServerName.hashCode());
            return result;
        }
    }
}
