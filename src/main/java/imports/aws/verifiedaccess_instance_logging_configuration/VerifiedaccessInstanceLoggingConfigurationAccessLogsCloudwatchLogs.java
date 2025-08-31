package imports.aws.verifiedaccess_instance_logging_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.575Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessInstanceLoggingConfiguration.VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs")
@software.amazon.jsii.Jsii.Proxy(VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs.Jsii$Proxy.class)
public interface VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#enabled VerifiedaccessInstanceLoggingConfiguration#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#log_group VerifiedaccessInstanceLoggingConfiguration#log_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogGroup() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs> {
        java.lang.Object enabled;
        java.lang.String logGroup;

        /**
         * Sets the value of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#enabled VerifiedaccessInstanceLoggingConfiguration#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#enabled VerifiedaccessInstanceLoggingConfiguration#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs#getLogGroup}
         * @param logGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_instance_logging_configuration#log_group VerifiedaccessInstanceLoggingConfiguration#log_group}.
         * @return {@code this}
         */
        public Builder logGroup(java.lang.String logGroup) {
            this.logGroup = logGroup;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs {
        private final java.lang.Object enabled;
        private final java.lang.String logGroup;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.logGroup = software.amazon.jsii.Kernel.get(this, "logGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.logGroup = builder.logGroup;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.String getLogGroup() {
            return this.logGroup;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getLogGroup() != null) {
                data.set("logGroup", om.valueToTree(this.getLogGroup()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedaccessInstanceLoggingConfiguration.VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs.Jsii$Proxy that = (VerifiedaccessInstanceLoggingConfigurationAccessLogsCloudwatchLogs.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            return this.logGroup != null ? this.logGroup.equals(that.logGroup) : that.logGroup == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.logGroup != null ? this.logGroup.hashCode() : 0);
            return result;
        }
    }
}
