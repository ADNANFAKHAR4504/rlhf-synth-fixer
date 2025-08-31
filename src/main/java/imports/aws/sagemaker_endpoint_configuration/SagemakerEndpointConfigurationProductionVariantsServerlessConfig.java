package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.322Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationProductionVariantsServerlessConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerEndpointConfigurationProductionVariantsServerlessConfig.Jsii$Proxy.class)
public interface SagemakerEndpointConfigurationProductionVariantsServerlessConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#max_concurrency SagemakerEndpointConfiguration#max_concurrency}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxConcurrency();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#memory_size_in_mb SagemakerEndpointConfiguration#memory_size_in_mb}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMemorySizeInMb();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#provisioned_concurrency SagemakerEndpointConfiguration#provisioned_concurrency}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getProvisionedConcurrency() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerEndpointConfigurationProductionVariantsServerlessConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerEndpointConfigurationProductionVariantsServerlessConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerEndpointConfigurationProductionVariantsServerlessConfig> {
        java.lang.Number maxConcurrency;
        java.lang.Number memorySizeInMb;
        java.lang.Number provisionedConcurrency;

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariantsServerlessConfig#getMaxConcurrency}
         * @param maxConcurrency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#max_concurrency SagemakerEndpointConfiguration#max_concurrency}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxConcurrency(java.lang.Number maxConcurrency) {
            this.maxConcurrency = maxConcurrency;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariantsServerlessConfig#getMemorySizeInMb}
         * @param memorySizeInMb Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#memory_size_in_mb SagemakerEndpointConfiguration#memory_size_in_mb}. This parameter is required.
         * @return {@code this}
         */
        public Builder memorySizeInMb(java.lang.Number memorySizeInMb) {
            this.memorySizeInMb = memorySizeInMb;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationProductionVariantsServerlessConfig#getProvisionedConcurrency}
         * @param provisionedConcurrency Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#provisioned_concurrency SagemakerEndpointConfiguration#provisioned_concurrency}.
         * @return {@code this}
         */
        public Builder provisionedConcurrency(java.lang.Number provisionedConcurrency) {
            this.provisionedConcurrency = provisionedConcurrency;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerEndpointConfigurationProductionVariantsServerlessConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerEndpointConfigurationProductionVariantsServerlessConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerEndpointConfigurationProductionVariantsServerlessConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerEndpointConfigurationProductionVariantsServerlessConfig {
        private final java.lang.Number maxConcurrency;
        private final java.lang.Number memorySizeInMb;
        private final java.lang.Number provisionedConcurrency;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxConcurrency = software.amazon.jsii.Kernel.get(this, "maxConcurrency", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.memorySizeInMb = software.amazon.jsii.Kernel.get(this, "memorySizeInMb", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.provisionedConcurrency = software.amazon.jsii.Kernel.get(this, "provisionedConcurrency", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxConcurrency = java.util.Objects.requireNonNull(builder.maxConcurrency, "maxConcurrency is required");
            this.memorySizeInMb = java.util.Objects.requireNonNull(builder.memorySizeInMb, "memorySizeInMb is required");
            this.provisionedConcurrency = builder.provisionedConcurrency;
        }

        @Override
        public final java.lang.Number getMaxConcurrency() {
            return this.maxConcurrency;
        }

        @Override
        public final java.lang.Number getMemorySizeInMb() {
            return this.memorySizeInMb;
        }

        @Override
        public final java.lang.Number getProvisionedConcurrency() {
            return this.provisionedConcurrency;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maxConcurrency", om.valueToTree(this.getMaxConcurrency()));
            data.set("memorySizeInMb", om.valueToTree(this.getMemorySizeInMb()));
            if (this.getProvisionedConcurrency() != null) {
                data.set("provisionedConcurrency", om.valueToTree(this.getProvisionedConcurrency()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationProductionVariantsServerlessConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerEndpointConfigurationProductionVariantsServerlessConfig.Jsii$Proxy that = (SagemakerEndpointConfigurationProductionVariantsServerlessConfig.Jsii$Proxy) o;

            if (!maxConcurrency.equals(that.maxConcurrency)) return false;
            if (!memorySizeInMb.equals(that.memorySizeInMb)) return false;
            return this.provisionedConcurrency != null ? this.provisionedConcurrency.equals(that.provisionedConcurrency) : that.provisionedConcurrency == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxConcurrency.hashCode();
            result = 31 * result + (this.memorySizeInMb.hashCode());
            result = 31 * result + (this.provisionedConcurrency != null ? this.provisionedConcurrency.hashCode() : 0);
            return result;
        }
    }
}
