package imports.aws.networkfirewall_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.952Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallLoggingConfiguration.NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig.Jsii$Proxy.class)
public interface NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_logging_configuration#log_destination NetworkfirewallLoggingConfiguration#log_destination}.
     */
    @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getLogDestination();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_logging_configuration#log_destination_type NetworkfirewallLoggingConfiguration#log_destination_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLogDestinationType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_logging_configuration#log_type NetworkfirewallLoggingConfiguration#log_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLogType();

    /**
     * @return a {@link Builder} of {@link NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig> {
        java.util.Map<java.lang.String, java.lang.String> logDestination;
        java.lang.String logDestinationType;
        java.lang.String logType;

        /**
         * Sets the value of {@link NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig#getLogDestination}
         * @param logDestination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_logging_configuration#log_destination NetworkfirewallLoggingConfiguration#log_destination}. This parameter is required.
         * @return {@code this}
         */
        public Builder logDestination(java.util.Map<java.lang.String, java.lang.String> logDestination) {
            this.logDestination = logDestination;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig#getLogDestinationType}
         * @param logDestinationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_logging_configuration#log_destination_type NetworkfirewallLoggingConfiguration#log_destination_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder logDestinationType(java.lang.String logDestinationType) {
            this.logDestinationType = logDestinationType;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig#getLogType}
         * @param logType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_logging_configuration#log_type NetworkfirewallLoggingConfiguration#log_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder logType(java.lang.String logType) {
            this.logType = logType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig {
        private final java.util.Map<java.lang.String, java.lang.String> logDestination;
        private final java.lang.String logDestinationType;
        private final java.lang.String logType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.logDestination = software.amazon.jsii.Kernel.get(this, "logDestination", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.logDestinationType = software.amazon.jsii.Kernel.get(this, "logDestinationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logType = software.amazon.jsii.Kernel.get(this, "logType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.logDestination = java.util.Objects.requireNonNull(builder.logDestination, "logDestination is required");
            this.logDestinationType = java.util.Objects.requireNonNull(builder.logDestinationType, "logDestinationType is required");
            this.logType = java.util.Objects.requireNonNull(builder.logType, "logType is required");
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getLogDestination() {
            return this.logDestination;
        }

        @Override
        public final java.lang.String getLogDestinationType() {
            return this.logDestinationType;
        }

        @Override
        public final java.lang.String getLogType() {
            return this.logType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("logDestination", om.valueToTree(this.getLogDestination()));
            data.set("logDestinationType", om.valueToTree(this.getLogDestinationType()));
            data.set("logType", om.valueToTree(this.getLogType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallLoggingConfiguration.NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig.Jsii$Proxy that = (NetworkfirewallLoggingConfigurationLoggingConfigurationLogDestinationConfig.Jsii$Proxy) o;

            if (!logDestination.equals(that.logDestination)) return false;
            if (!logDestinationType.equals(that.logDestinationType)) return false;
            return this.logType.equals(that.logType);
        }

        @Override
        public final int hashCode() {
            int result = this.logDestination.hashCode();
            result = 31 * result + (this.logDestinationType.hashCode());
            result = 31 * result + (this.logType.hashCode());
            return result;
        }
    }
}
