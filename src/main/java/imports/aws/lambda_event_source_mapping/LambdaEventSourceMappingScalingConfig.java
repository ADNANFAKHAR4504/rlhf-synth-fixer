package imports.aws.lambda_event_source_mapping;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.502Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaEventSourceMapping.LambdaEventSourceMappingScalingConfig")
@software.amazon.jsii.Jsii.Proxy(LambdaEventSourceMappingScalingConfig.Jsii$Proxy.class)
public interface LambdaEventSourceMappingScalingConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#maximum_concurrency LambdaEventSourceMapping#maximum_concurrency}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumConcurrency() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LambdaEventSourceMappingScalingConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LambdaEventSourceMappingScalingConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LambdaEventSourceMappingScalingConfig> {
        java.lang.Number maximumConcurrency;

        /**
         * Sets the value of {@link LambdaEventSourceMappingScalingConfig#getMaximumConcurrency}
         * @param maximumConcurrency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_event_source_mapping#maximum_concurrency LambdaEventSourceMapping#maximum_concurrency}.
         * @return {@code this}
         */
        public Builder maximumConcurrency(java.lang.Number maximumConcurrency) {
            this.maximumConcurrency = maximumConcurrency;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LambdaEventSourceMappingScalingConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LambdaEventSourceMappingScalingConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LambdaEventSourceMappingScalingConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LambdaEventSourceMappingScalingConfig {
        private final java.lang.Number maximumConcurrency;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maximumConcurrency = software.amazon.jsii.Kernel.get(this, "maximumConcurrency", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maximumConcurrency = builder.maximumConcurrency;
        }

        @Override
        public final java.lang.Number getMaximumConcurrency() {
            return this.maximumConcurrency;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMaximumConcurrency() != null) {
                data.set("maximumConcurrency", om.valueToTree(this.getMaximumConcurrency()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lambdaEventSourceMapping.LambdaEventSourceMappingScalingConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LambdaEventSourceMappingScalingConfig.Jsii$Proxy that = (LambdaEventSourceMappingScalingConfig.Jsii$Proxy) o;

            return this.maximumConcurrency != null ? this.maximumConcurrency.equals(that.maximumConcurrency) : that.maximumConcurrency == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maximumConcurrency != null ? this.maximumConcurrency.hashCode() : 0;
            return result;
        }
    }
}
