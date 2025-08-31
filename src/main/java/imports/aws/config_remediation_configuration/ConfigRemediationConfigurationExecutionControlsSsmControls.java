package imports.aws.config_remediation_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.380Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configRemediationConfiguration.ConfigRemediationConfigurationExecutionControlsSsmControls")
@software.amazon.jsii.Jsii.Proxy(ConfigRemediationConfigurationExecutionControlsSsmControls.Jsii$Proxy.class)
public interface ConfigRemediationConfigurationExecutionControlsSsmControls extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#concurrent_execution_rate_percentage ConfigRemediationConfiguration#concurrent_execution_rate_percentage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getConcurrentExecutionRatePercentage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#error_percentage ConfigRemediationConfiguration#error_percentage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getErrorPercentage() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConfigRemediationConfigurationExecutionControlsSsmControls}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConfigRemediationConfigurationExecutionControlsSsmControls}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConfigRemediationConfigurationExecutionControlsSsmControls> {
        java.lang.Number concurrentExecutionRatePercentage;
        java.lang.Number errorPercentage;

        /**
         * Sets the value of {@link ConfigRemediationConfigurationExecutionControlsSsmControls#getConcurrentExecutionRatePercentage}
         * @param concurrentExecutionRatePercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#concurrent_execution_rate_percentage ConfigRemediationConfiguration#concurrent_execution_rate_percentage}.
         * @return {@code this}
         */
        public Builder concurrentExecutionRatePercentage(java.lang.Number concurrentExecutionRatePercentage) {
            this.concurrentExecutionRatePercentage = concurrentExecutionRatePercentage;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationExecutionControlsSsmControls#getErrorPercentage}
         * @param errorPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#error_percentage ConfigRemediationConfiguration#error_percentage}.
         * @return {@code this}
         */
        public Builder errorPercentage(java.lang.Number errorPercentage) {
            this.errorPercentage = errorPercentage;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConfigRemediationConfigurationExecutionControlsSsmControls}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConfigRemediationConfigurationExecutionControlsSsmControls build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConfigRemediationConfigurationExecutionControlsSsmControls}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConfigRemediationConfigurationExecutionControlsSsmControls {
        private final java.lang.Number concurrentExecutionRatePercentage;
        private final java.lang.Number errorPercentage;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.concurrentExecutionRatePercentage = software.amazon.jsii.Kernel.get(this, "concurrentExecutionRatePercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.errorPercentage = software.amazon.jsii.Kernel.get(this, "errorPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.concurrentExecutionRatePercentage = builder.concurrentExecutionRatePercentage;
            this.errorPercentage = builder.errorPercentage;
        }

        @Override
        public final java.lang.Number getConcurrentExecutionRatePercentage() {
            return this.concurrentExecutionRatePercentage;
        }

        @Override
        public final java.lang.Number getErrorPercentage() {
            return this.errorPercentage;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getConcurrentExecutionRatePercentage() != null) {
                data.set("concurrentExecutionRatePercentage", om.valueToTree(this.getConcurrentExecutionRatePercentage()));
            }
            if (this.getErrorPercentage() != null) {
                data.set("errorPercentage", om.valueToTree(this.getErrorPercentage()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.configRemediationConfiguration.ConfigRemediationConfigurationExecutionControlsSsmControls"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConfigRemediationConfigurationExecutionControlsSsmControls.Jsii$Proxy that = (ConfigRemediationConfigurationExecutionControlsSsmControls.Jsii$Proxy) o;

            if (this.concurrentExecutionRatePercentage != null ? !this.concurrentExecutionRatePercentage.equals(that.concurrentExecutionRatePercentage) : that.concurrentExecutionRatePercentage != null) return false;
            return this.errorPercentage != null ? this.errorPercentage.equals(that.errorPercentage) : that.errorPercentage == null;
        }

        @Override
        public final int hashCode() {
            int result = this.concurrentExecutionRatePercentage != null ? this.concurrentExecutionRatePercentage.hashCode() : 0;
            result = 31 * result + (this.errorPercentage != null ? this.errorPercentage.hashCode() : 0);
            return result;
        }
    }
}
