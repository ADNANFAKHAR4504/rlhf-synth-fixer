package imports.aws.computeoptimizer_recommendation_preferences;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.368Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.computeoptimizerRecommendationPreferences.ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters")
@software.amazon.jsii.Jsii.Proxy(ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters.Jsii$Proxy.class)
public interface ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#headroom ComputeoptimizerRecommendationPreferences#headroom}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHeadroom();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#threshold ComputeoptimizerRecommendationPreferences#threshold}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getThreshold() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters> {
        java.lang.String headroom;
        java.lang.String threshold;

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters#getHeadroom}
         * @param headroom Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#headroom ComputeoptimizerRecommendationPreferences#headroom}. This parameter is required.
         * @return {@code this}
         */
        public Builder headroom(java.lang.String headroom) {
            this.headroom = headroom;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters#getThreshold}
         * @param threshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#threshold ComputeoptimizerRecommendationPreferences#threshold}.
         * @return {@code this}
         */
        public Builder threshold(java.lang.String threshold) {
            this.threshold = threshold;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters {
        private final java.lang.String headroom;
        private final java.lang.String threshold;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.headroom = software.amazon.jsii.Kernel.get(this, "headroom", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.threshold = software.amazon.jsii.Kernel.get(this, "threshold", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.headroom = java.util.Objects.requireNonNull(builder.headroom, "headroom is required");
            this.threshold = builder.threshold;
        }

        @Override
        public final java.lang.String getHeadroom() {
            return this.headroom;
        }

        @Override
        public final java.lang.String getThreshold() {
            return this.threshold;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("headroom", om.valueToTree(this.getHeadroom()));
            if (this.getThreshold() != null) {
                data.set("threshold", om.valueToTree(this.getThreshold()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.computeoptimizerRecommendationPreferences.ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters.Jsii$Proxy that = (ComputeoptimizerRecommendationPreferencesUtilizationPreferenceMetricParameters.Jsii$Proxy) o;

            if (!headroom.equals(that.headroom)) return false;
            return this.threshold != null ? this.threshold.equals(that.threshold) : that.threshold == null;
        }

        @Override
        public final int hashCode() {
            int result = this.headroom.hashCode();
            result = 31 * result + (this.threshold != null ? this.threshold.hashCode() : 0);
            return result;
        }
    }
}
