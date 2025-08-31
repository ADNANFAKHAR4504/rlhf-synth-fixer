package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.322Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling")
@software.amazon.jsii.Jsii.Proxy(SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling.Jsii$Proxy.class)
public interface SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#max_instance_count SagemakerEndpointConfiguration#max_instance_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxInstanceCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#min_instance_count SagemakerEndpointConfiguration#min_instance_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinInstanceCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#status SagemakerEndpointConfiguration#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling> {
        java.lang.Number maxInstanceCount;
        java.lang.Number minInstanceCount;
        java.lang.String status;

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling#getMaxInstanceCount}
         * @param maxInstanceCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#max_instance_count SagemakerEndpointConfiguration#max_instance_count}.
         * @return {@code this}
         */
        public Builder maxInstanceCount(java.lang.Number maxInstanceCount) {
            this.maxInstanceCount = maxInstanceCount;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling#getMinInstanceCount}
         * @param minInstanceCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#min_instance_count SagemakerEndpointConfiguration#min_instance_count}.
         * @return {@code this}
         */
        public Builder minInstanceCount(java.lang.Number minInstanceCount) {
            this.minInstanceCount = minInstanceCount;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_endpoint_configuration#status SagemakerEndpointConfiguration#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling {
        private final java.lang.Number maxInstanceCount;
        private final java.lang.Number minInstanceCount;
        private final java.lang.String status;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxInstanceCount = software.amazon.jsii.Kernel.get(this, "maxInstanceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minInstanceCount = software.amazon.jsii.Kernel.get(this, "minInstanceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxInstanceCount = builder.maxInstanceCount;
            this.minInstanceCount = builder.minInstanceCount;
            this.status = builder.status;
        }

        @Override
        public final java.lang.Number getMaxInstanceCount() {
            return this.maxInstanceCount;
        }

        @Override
        public final java.lang.Number getMinInstanceCount() {
            return this.minInstanceCount;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMaxInstanceCount() != null) {
                data.set("maxInstanceCount", om.valueToTree(this.getMaxInstanceCount()));
            }
            if (this.getMinInstanceCount() != null) {
                data.set("minInstanceCount", om.valueToTree(this.getMinInstanceCount()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling.Jsii$Proxy that = (SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling.Jsii$Proxy) o;

            if (this.maxInstanceCount != null ? !this.maxInstanceCount.equals(that.maxInstanceCount) : that.maxInstanceCount != null) return false;
            if (this.minInstanceCount != null ? !this.minInstanceCount.equals(that.minInstanceCount) : that.minInstanceCount != null) return false;
            return this.status != null ? this.status.equals(that.status) : that.status == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxInstanceCount != null ? this.maxInstanceCount.hashCode() : 0;
            result = 31 * result + (this.minInstanceCount != null ? this.minInstanceCount.hashCode() : 0);
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            return result;
        }
    }
}
