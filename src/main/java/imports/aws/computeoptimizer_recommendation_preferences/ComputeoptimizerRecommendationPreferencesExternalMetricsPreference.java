package imports.aws.computeoptimizer_recommendation_preferences;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.367Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.computeoptimizerRecommendationPreferences.ComputeoptimizerRecommendationPreferencesExternalMetricsPreference")
@software.amazon.jsii.Jsii.Proxy(ComputeoptimizerRecommendationPreferencesExternalMetricsPreference.Jsii$Proxy.class)
public interface ComputeoptimizerRecommendationPreferencesExternalMetricsPreference extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#source ComputeoptimizerRecommendationPreferences#source}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSource();

    /**
     * @return a {@link Builder} of {@link ComputeoptimizerRecommendationPreferencesExternalMetricsPreference}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ComputeoptimizerRecommendationPreferencesExternalMetricsPreference}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ComputeoptimizerRecommendationPreferencesExternalMetricsPreference> {
        java.lang.String source;

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesExternalMetricsPreference#getSource}
         * @param source Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#source ComputeoptimizerRecommendationPreferences#source}. This parameter is required.
         * @return {@code this}
         */
        public Builder source(java.lang.String source) {
            this.source = source;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ComputeoptimizerRecommendationPreferencesExternalMetricsPreference}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ComputeoptimizerRecommendationPreferencesExternalMetricsPreference build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ComputeoptimizerRecommendationPreferencesExternalMetricsPreference}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ComputeoptimizerRecommendationPreferencesExternalMetricsPreference {
        private final java.lang.String source;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.source = java.util.Objects.requireNonNull(builder.source, "source is required");
        }

        @Override
        public final java.lang.String getSource() {
            return this.source;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("source", om.valueToTree(this.getSource()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.computeoptimizerRecommendationPreferences.ComputeoptimizerRecommendationPreferencesExternalMetricsPreference"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ComputeoptimizerRecommendationPreferencesExternalMetricsPreference.Jsii$Proxy that = (ComputeoptimizerRecommendationPreferencesExternalMetricsPreference.Jsii$Proxy) o;

            return this.source.equals(that.source);
        }

        @Override
        public final int hashCode() {
            int result = this.source.hashCode();
            return result;
        }
    }
}
