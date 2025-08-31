package imports.aws.prometheus_workspace_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.078Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.prometheusWorkspaceConfiguration.PrometheusWorkspaceConfigurationLimitsPerLabelSetLimits")
@software.amazon.jsii.Jsii.Proxy(PrometheusWorkspaceConfigurationLimitsPerLabelSetLimits.Jsii$Proxy.class)
public interface PrometheusWorkspaceConfigurationLimitsPerLabelSetLimits extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#max_series PrometheusWorkspaceConfiguration#max_series}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxSeries();

    /**
     * @return a {@link Builder} of {@link PrometheusWorkspaceConfigurationLimitsPerLabelSetLimits}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PrometheusWorkspaceConfigurationLimitsPerLabelSetLimits}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PrometheusWorkspaceConfigurationLimitsPerLabelSetLimits> {
        java.lang.Number maxSeries;

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationLimitsPerLabelSetLimits#getMaxSeries}
         * @param maxSeries Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#max_series PrometheusWorkspaceConfiguration#max_series}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxSeries(java.lang.Number maxSeries) {
            this.maxSeries = maxSeries;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PrometheusWorkspaceConfigurationLimitsPerLabelSetLimits}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PrometheusWorkspaceConfigurationLimitsPerLabelSetLimits build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PrometheusWorkspaceConfigurationLimitsPerLabelSetLimits}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PrometheusWorkspaceConfigurationLimitsPerLabelSetLimits {
        private final java.lang.Number maxSeries;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxSeries = software.amazon.jsii.Kernel.get(this, "maxSeries", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxSeries = java.util.Objects.requireNonNull(builder.maxSeries, "maxSeries is required");
        }

        @Override
        public final java.lang.Number getMaxSeries() {
            return this.maxSeries;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maxSeries", om.valueToTree(this.getMaxSeries()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.prometheusWorkspaceConfiguration.PrometheusWorkspaceConfigurationLimitsPerLabelSetLimits"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PrometheusWorkspaceConfigurationLimitsPerLabelSetLimits.Jsii$Proxy that = (PrometheusWorkspaceConfigurationLimitsPerLabelSetLimits.Jsii$Proxy) o;

            return this.maxSeries.equals(that.maxSeries);
        }

        @Override
        public final int hashCode() {
            int result = this.maxSeries.hashCode();
            return result;
        }
    }
}
