package imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.209Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration")
@software.amazon.jsii.Jsii.Proxy(ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration.Jsii$Proxy.class)
public interface ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * rules block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rules ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rules}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getRules();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#disabled ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#disabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration> {
        java.lang.Object rules;
        java.lang.Object disabled;

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration#getRules}
         * @param rules rules block. This parameter is required.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rules ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rules}
         * @return {@code this}
         */
        public Builder rules(com.hashicorp.cdktf.IResolvable rules) {
            this.rules = rules;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration#getRules}
         * @param rules rules block. This parameter is required.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#rules ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#rules}
         * @return {@code this}
         */
        public Builder rules(java.util.List<? extends imports.aws.chimesdkmediapipelines_media_insights_pipeline_configuration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfigurationRules> rules) {
            this.rules = rules;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration#getDisabled}
         * @param disabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#disabled ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#disabled}.
         * @return {@code this}
         */
        public Builder disabled(java.lang.Boolean disabled) {
            this.disabled = disabled;
            return this;
        }

        /**
         * Sets the value of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration#getDisabled}
         * @param disabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkmediapipelines_media_insights_pipeline_configuration#disabled ChimesdkmediapipelinesMediaInsightsPipelineConfiguration#disabled}.
         * @return {@code this}
         */
        public Builder disabled(com.hashicorp.cdktf.IResolvable disabled) {
            this.disabled = disabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration {
        private final java.lang.Object rules;
        private final java.lang.Object disabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.rules = software.amazon.jsii.Kernel.get(this, "rules", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.disabled = software.amazon.jsii.Kernel.get(this, "disabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.rules = java.util.Objects.requireNonNull(builder.rules, "rules is required");
            this.disabled = builder.disabled;
        }

        @Override
        public final java.lang.Object getRules() {
            return this.rules;
        }

        @Override
        public final java.lang.Object getDisabled() {
            return this.disabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("rules", om.valueToTree(this.getRules()));
            if (this.getDisabled() != null) {
                data.set("disabled", om.valueToTree(this.getDisabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.chimesdkmediapipelinesMediaInsightsPipelineConfiguration.ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration.Jsii$Proxy that = (ChimesdkmediapipelinesMediaInsightsPipelineConfigurationRealTimeAlertConfiguration.Jsii$Proxy) o;

            if (!rules.equals(that.rules)) return false;
            return this.disabled != null ? this.disabled.equals(that.disabled) : that.disabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.rules.hashCode();
            result = 31 * result + (this.disabled != null ? this.disabled.hashCode() : 0);
            return result;
        }
    }
}
