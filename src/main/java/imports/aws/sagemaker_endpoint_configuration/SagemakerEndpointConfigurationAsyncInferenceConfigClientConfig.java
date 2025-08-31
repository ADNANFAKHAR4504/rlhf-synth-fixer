package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.320Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig.Jsii$Proxy.class)
public interface SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#max_concurrent_invocations_per_instance SagemakerEndpointConfiguration#max_concurrent_invocations_per_instance}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxConcurrentInvocationsPerInstance() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig> {
        java.lang.Number maxConcurrentInvocationsPerInstance;

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig#getMaxConcurrentInvocationsPerInstance}
         * @param maxConcurrentInvocationsPerInstance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#max_concurrent_invocations_per_instance SagemakerEndpointConfiguration#max_concurrent_invocations_per_instance}.
         * @return {@code this}
         */
        public Builder maxConcurrentInvocationsPerInstance(java.lang.Number maxConcurrentInvocationsPerInstance) {
            this.maxConcurrentInvocationsPerInstance = maxConcurrentInvocationsPerInstance;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig {
        private final java.lang.Number maxConcurrentInvocationsPerInstance;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxConcurrentInvocationsPerInstance = software.amazon.jsii.Kernel.get(this, "maxConcurrentInvocationsPerInstance", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxConcurrentInvocationsPerInstance = builder.maxConcurrentInvocationsPerInstance;
        }

        @Override
        public final java.lang.Number getMaxConcurrentInvocationsPerInstance() {
            return this.maxConcurrentInvocationsPerInstance;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMaxConcurrentInvocationsPerInstance() != null) {
                data.set("maxConcurrentInvocationsPerInstance", om.valueToTree(this.getMaxConcurrentInvocationsPerInstance()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig.Jsii$Proxy that = (SagemakerEndpointConfigurationAsyncInferenceConfigClientConfig.Jsii$Proxy) o;

            return this.maxConcurrentInvocationsPerInstance != null ? this.maxConcurrentInvocationsPerInstance.equals(that.maxConcurrentInvocationsPerInstance) : that.maxConcurrentInvocationsPerInstance == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxConcurrentInvocationsPerInstance != null ? this.maxConcurrentInvocationsPerInstance.hashCode() : 0;
            return result;
        }
    }
}
