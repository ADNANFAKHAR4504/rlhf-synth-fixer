package imports.aws.prometheus_workspace_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.078Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.prometheusWorkspaceConfiguration.PrometheusWorkspaceConfigurationLimitsPerLabelSet")
@software.amazon.jsii.Jsii.Proxy(PrometheusWorkspaceConfigurationLimitsPerLabelSet.Jsii$Proxy.class)
public interface PrometheusWorkspaceConfigurationLimitsPerLabelSet extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#label_set PrometheusWorkspaceConfiguration#label_set}.
     */
    @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getLabelSet();

    /**
     * limits block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#limits PrometheusWorkspaceConfiguration#limits}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLimits() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PrometheusWorkspaceConfigurationLimitsPerLabelSet}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PrometheusWorkspaceConfigurationLimitsPerLabelSet}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PrometheusWorkspaceConfigurationLimitsPerLabelSet> {
        java.util.Map<java.lang.String, java.lang.String> labelSet;
        java.lang.Object limits;

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationLimitsPerLabelSet#getLabelSet}
         * @param labelSet Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#label_set PrometheusWorkspaceConfiguration#label_set}. This parameter is required.
         * @return {@code this}
         */
        public Builder labelSet(java.util.Map<java.lang.String, java.lang.String> labelSet) {
            this.labelSet = labelSet;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationLimitsPerLabelSet#getLimits}
         * @param limits limits block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#limits PrometheusWorkspaceConfiguration#limits}
         * @return {@code this}
         */
        public Builder limits(com.hashicorp.cdktf.IResolvable limits) {
            this.limits = limits;
            return this;
        }

        /**
         * Sets the value of {@link PrometheusWorkspaceConfigurationLimitsPerLabelSet#getLimits}
         * @param limits limits block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/prometheus_workspace_configuration#limits PrometheusWorkspaceConfiguration#limits}
         * @return {@code this}
         */
        public Builder limits(java.util.List<? extends imports.aws.prometheus_workspace_configuration.PrometheusWorkspaceConfigurationLimitsPerLabelSetLimits> limits) {
            this.limits = limits;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PrometheusWorkspaceConfigurationLimitsPerLabelSet}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PrometheusWorkspaceConfigurationLimitsPerLabelSet build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PrometheusWorkspaceConfigurationLimitsPerLabelSet}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PrometheusWorkspaceConfigurationLimitsPerLabelSet {
        private final java.util.Map<java.lang.String, java.lang.String> labelSet;
        private final java.lang.Object limits;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.labelSet = software.amazon.jsii.Kernel.get(this, "labelSet", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.limits = software.amazon.jsii.Kernel.get(this, "limits", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.labelSet = java.util.Objects.requireNonNull(builder.labelSet, "labelSet is required");
            this.limits = builder.limits;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getLabelSet() {
            return this.labelSet;
        }

        @Override
        public final java.lang.Object getLimits() {
            return this.limits;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("labelSet", om.valueToTree(this.getLabelSet()));
            if (this.getLimits() != null) {
                data.set("limits", om.valueToTree(this.getLimits()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.prometheusWorkspaceConfiguration.PrometheusWorkspaceConfigurationLimitsPerLabelSet"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PrometheusWorkspaceConfigurationLimitsPerLabelSet.Jsii$Proxy that = (PrometheusWorkspaceConfigurationLimitsPerLabelSet.Jsii$Proxy) o;

            if (!labelSet.equals(that.labelSet)) return false;
            return this.limits != null ? this.limits.equals(that.limits) : that.limits == null;
        }

        @Override
        public final int hashCode() {
            int result = this.labelSet.hashCode();
            result = 31 * result + (this.limits != null ? this.limits.hashCode() : 0);
            return result;
        }
    }
}
