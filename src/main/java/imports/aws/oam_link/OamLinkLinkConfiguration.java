package imports.aws.oam_link;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.981Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.oamLink.OamLinkLinkConfiguration")
@software.amazon.jsii.Jsii.Proxy(OamLinkLinkConfiguration.Jsii$Proxy.class)
public interface OamLinkLinkConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * log_group_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/oam_link#log_group_configuration OamLink#log_group_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.oam_link.OamLinkLinkConfigurationLogGroupConfiguration getLogGroupConfiguration() {
        return null;
    }

    /**
     * metric_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/oam_link#metric_configuration OamLink#metric_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.oam_link.OamLinkLinkConfigurationMetricConfiguration getMetricConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OamLinkLinkConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OamLinkLinkConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OamLinkLinkConfiguration> {
        imports.aws.oam_link.OamLinkLinkConfigurationLogGroupConfiguration logGroupConfiguration;
        imports.aws.oam_link.OamLinkLinkConfigurationMetricConfiguration metricConfiguration;

        /**
         * Sets the value of {@link OamLinkLinkConfiguration#getLogGroupConfiguration}
         * @param logGroupConfiguration log_group_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/oam_link#log_group_configuration OamLink#log_group_configuration}
         * @return {@code this}
         */
        public Builder logGroupConfiguration(imports.aws.oam_link.OamLinkLinkConfigurationLogGroupConfiguration logGroupConfiguration) {
            this.logGroupConfiguration = logGroupConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link OamLinkLinkConfiguration#getMetricConfiguration}
         * @param metricConfiguration metric_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/oam_link#metric_configuration OamLink#metric_configuration}
         * @return {@code this}
         */
        public Builder metricConfiguration(imports.aws.oam_link.OamLinkLinkConfigurationMetricConfiguration metricConfiguration) {
            this.metricConfiguration = metricConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OamLinkLinkConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OamLinkLinkConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OamLinkLinkConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OamLinkLinkConfiguration {
        private final imports.aws.oam_link.OamLinkLinkConfigurationLogGroupConfiguration logGroupConfiguration;
        private final imports.aws.oam_link.OamLinkLinkConfigurationMetricConfiguration metricConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.logGroupConfiguration = software.amazon.jsii.Kernel.get(this, "logGroupConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.oam_link.OamLinkLinkConfigurationLogGroupConfiguration.class));
            this.metricConfiguration = software.amazon.jsii.Kernel.get(this, "metricConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.oam_link.OamLinkLinkConfigurationMetricConfiguration.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.logGroupConfiguration = builder.logGroupConfiguration;
            this.metricConfiguration = builder.metricConfiguration;
        }

        @Override
        public final imports.aws.oam_link.OamLinkLinkConfigurationLogGroupConfiguration getLogGroupConfiguration() {
            return this.logGroupConfiguration;
        }

        @Override
        public final imports.aws.oam_link.OamLinkLinkConfigurationMetricConfiguration getMetricConfiguration() {
            return this.metricConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getLogGroupConfiguration() != null) {
                data.set("logGroupConfiguration", om.valueToTree(this.getLogGroupConfiguration()));
            }
            if (this.getMetricConfiguration() != null) {
                data.set("metricConfiguration", om.valueToTree(this.getMetricConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.oamLink.OamLinkLinkConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OamLinkLinkConfiguration.Jsii$Proxy that = (OamLinkLinkConfiguration.Jsii$Proxy) o;

            if (this.logGroupConfiguration != null ? !this.logGroupConfiguration.equals(that.logGroupConfiguration) : that.logGroupConfiguration != null) return false;
            return this.metricConfiguration != null ? this.metricConfiguration.equals(that.metricConfiguration) : that.metricConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.logGroupConfiguration != null ? this.logGroupConfiguration.hashCode() : 0;
            result = 31 * result + (this.metricConfiguration != null ? this.metricConfiguration.hashCode() : 0);
            return result;
        }
    }
}
