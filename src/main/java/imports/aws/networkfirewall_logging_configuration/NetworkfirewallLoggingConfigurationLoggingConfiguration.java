package imports.aws.networkfirewall_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.952Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallLoggingConfiguration.NetworkfirewallLoggingConfigurationLoggingConfiguration")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallLoggingConfigurationLoggingConfiguration.Jsii$Proxy.class)
public interface NetworkfirewallLoggingConfigurationLoggingConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * log_destination_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_logging_configuration#log_destination_config NetworkfirewallLoggingConfiguration#log_destination_config}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getLogDestinationConfig();

    /**
     * @return a {@link Builder} of {@link NetworkfirewallLoggingConfigurationLoggingConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallLoggingConfigurationLoggingConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallLoggingConfigurationLoggingConfiguration> {
        java.lang.Object logDestinationConfig;

        /**
         * Sets the value of {@link NetworkfirewallLoggingConfigurationLoggingConfiguration#getLogDestinationConfig}
         * @param logDestinationConfig log_destination_config block. This parameter is required.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_logging_configuration#log_destination_config NetworkfirewallLoggingConfiguration#log_destination_config}
         * @return {@code this}
         */
        public Builder logDestinationConfig(com.hashicorp.cdktf.IResolvable logDestinationConfig) {
            this.logDestinationConfig = logDestinationConfig;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallLoggingConfigurationLoggingConfiguration#getLogDestinationConfig}
         * @param logDestinationConfig log_destination_config block. This parameter is required.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_logging_configuration#log_destination_config NetworkfirewallLoggingConfiguration#log_destination_config}
         * @return {@code this}
         */
        public Builder logDestinationConfig(java.util.List<? extends imports.aws.networkfirewall_logging_configuration.NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig> logDestinationConfig) {
            this.logDestinationConfig = logDestinationConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallLoggingConfigurationLoggingConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallLoggingConfigurationLoggingConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallLoggingConfigurationLoggingConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallLoggingConfigurationLoggingConfiguration {
        private final java.lang.Object logDestinationConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.logDestinationConfig = software.amazon.jsii.Kernel.get(this, "logDestinationConfig", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.logDestinationConfig = java.util.Objects.requireNonNull(builder.logDestinationConfig, "logDestinationConfig is required");
        }

        @Override
        public final java.lang.Object getLogDestinationConfig() {
            return this.logDestinationConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("logDestinationConfig", om.valueToTree(this.getLogDestinationConfig()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallLoggingConfiguration.NetworkfirewallLoggingConfigurationLoggingConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallLoggingConfigurationLoggingConfiguration.Jsii$Proxy that = (NetworkfirewallLoggingConfigurationLoggingConfiguration.Jsii$Proxy) o;

            return this.logDestinationConfig.equals(that.logDestinationConfig);
        }

        @Override
        public final int hashCode() {
            int result = this.logDestinationConfig.hashCode();
            return result;
        }
    }
}
