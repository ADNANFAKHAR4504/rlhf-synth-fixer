package imports.aws.computeoptimizer_recommendation_preferences;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.368Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.computeoptimizerRecommendationPreferences.ComputeoptimizerRecommendationPreferencesUtilizationPreference")
@software.amazon.jsii.Jsii.Proxy(ComputeoptimizerRecommendationPreferencesUtilizationPreference.Jsii$Proxy.class)
public interface ComputeoptimizerRecommendationPreferencesUtilizationPreference extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#metric_name ComputeoptimizerRecommendationPreferences#metric_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMetricName();

    /**
     * metric_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#metric_parameters ComputeoptimizerRecommendationPreferences#metric_parameters}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMetricParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ComputeoptimizerRecommendationPreferencesUtilizationPreference}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ComputeoptimizerRecommendationPreferencesUtilizationPreference}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ComputeoptimizerRecommendationPreferencesUtilizationPreference> {
        java.lang.String metricName;
        java.lang.Object metricParameters;

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesUtilizationPreference#getMetricName}
         * @param metricName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#metric_name ComputeoptimizerRecommendationPreferences#metric_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder metricName(java.lang.String metricName) {
            this.metricName = metricName;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesUtilizationPreference#getMetricParameters}
         * @param metricParameters metric_parameters block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#metric_parameters ComputeoptimizerRecommendationPreferences#metric_parameters}
         * @return {@code this}
         */
        public Builder metricParameters(com.hashicorp.cdktf.IResolvable metricParameters) {
            this.metricParameters = metricParameters;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesUtilizationPreference#getMetricParameters}
         * @param metricParameters metric_parameters block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#metric_parameters ComputeoptimizerRecommendationPreferences#metric_parameters}
         * @return {@code this}
         */
        public Builder metricParameters(java.util.List<? extends imports.aws.computeoptimizer_recommendation_preferences.ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters> metricParameters) {
            this.metricParameters = metricParameters;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ComputeoptimizerRecommendationPreferencesUtilizationPreference}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ComputeoptimizerRecommendationPreferencesUtilizationPreference build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ComputeoptimizerRecommendationPreferencesUtilizationPreference}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ComputeoptimizerRecommendationPreferencesUtilizationPreference {
        private final java.lang.String metricName;
        private final java.lang.Object metricParameters;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.metricName = software.amazon.jsii.Kernel.get(this, "metricName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.metricParameters = software.amazon.jsii.Kernel.get(this, "metricParameters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.metricName = java.util.Objects.requireNonNull(builder.metricName, "metricName is required");
            this.metricParameters = builder.metricParameters;
        }

        @Override
        public final java.lang.String getMetricName() {
            return this.metricName;
        }

        @Override
        public final java.lang.Object getMetricParameters() {
            return this.metricParameters;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("metricName", om.valueToTree(this.getMetricName()));
            if (this.getMetricParameters() != null) {
                data.set("metricParameters", om.valueToTree(this.getMetricParameters()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.computeoptimizerRecommendationPreferences.ComputeoptimizerRecommendationPreferencesUtilizationPreference"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ComputeoptimizerRecommendationPreferencesUtilizationPreference.Jsii$Proxy that = (ComputeoptimizerRecommendationPreferencesUtilizationPreference.Jsii$Proxy) o;

            if (!metricName.equals(that.metricName)) return false;
            return this.metricParameters != null ? this.metricParameters.equals(that.metricParameters) : that.metricParameters == null;
        }

        @Override
        public final int hashCode() {
            int result = this.metricName.hashCode();
            result = 31 * result + (this.metricParameters != null ? this.metricParameters.hashCode() : 0);
            return result;
        }
    }
}
