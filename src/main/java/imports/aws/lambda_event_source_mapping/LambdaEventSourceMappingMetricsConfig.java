package imports.aws.lambda_event_source_mapping;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.502Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaEventSourceMapping.LambdaEventSourceMappingMetricsConfig")
@software.amazon.jsii.Jsii.Proxy(LambdaEventSourceMappingMetricsConfig.Jsii$Proxy.class)
public interface LambdaEventSourceMappingMetricsConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#metrics LambdaEventSourceMapping#metrics}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getMetrics();

    /**
     * @return a {@link Builder} of {@link LambdaEventSourceMappingMetricsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaEventSourceMappingMetricsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaEventSourceMappingMetricsConfig> {
        java.util.List<java.lang.String> metrics;

        /**
         * Sets the value of {@link LambdaEventSourceMappingMetricsConfig#getMetrics}
         * @param metrics Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#metrics LambdaEventSourceMapping#metrics}. This parameter is required.
         * @return {@code this}
         */
        public Builder metrics(java.util.List<java.lang.String> metrics) {
            this.metrics = metrics;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LambdaEventSourceMappingMetricsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaEventSourceMappingMetricsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaEventSourceMappingMetricsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaEventSourceMappingMetricsConfig {
        private final java.util.List<java.lang.String> metrics;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.metrics = software.amazon.jsii.Kernel.get(this, "metrics", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.metrics = java.util.Objects.requireNonNull(builder.metrics, "metrics is required");
        }

        @Override
        public final java.util.List<java.lang.String> getMetrics() {
            return this.metrics;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("metrics", om.valueToTree(this.getMetrics()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lambdaEventSourceMapping.LambdaEventSourceMappingMetricsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaEventSourceMappingMetricsConfig.Jsii$Proxy that = (LambdaEventSourceMappingMetricsConfig.Jsii$Proxy) o;

            return this.metrics.equals(that.metrics);
        }

        @Override
        public final int hashCode() {
            int result = this.metrics.hashCode();
            return result;
        }
    }
}
