package imports.aws.sagemaker_model;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.333Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerModel.SagemakerModelPrimaryContainerMultiModelConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerModelPrimaryContainerMultiModelConfig.Jsii$Proxy.class)
public interface SagemakerModelPrimaryContainerMultiModelConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_cache_setting SagemakerModel#model_cache_setting}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getModelCacheSetting() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerModelPrimaryContainerMultiModelConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerModelPrimaryContainerMultiModelConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerModelPrimaryContainerMultiModelConfig> {
        java.lang.String modelCacheSetting;

        /**
         * Sets the value of {@link SagemakerModelPrimaryContainerMultiModelConfig#getModelCacheSetting}
         * @param modelCacheSetting Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_cache_setting SagemakerModel#model_cache_setting}.
         * @return {@code this}
         */
        public Builder modelCacheSetting(java.lang.String modelCacheSetting) {
            this.modelCacheSetting = modelCacheSetting;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerModelPrimaryContainerMultiModelConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerModelPrimaryContainerMultiModelConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerModelPrimaryContainerMultiModelConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerModelPrimaryContainerMultiModelConfig {
        private final java.lang.String modelCacheSetting;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.modelCacheSetting = software.amazon.jsii.Kernel.get(this, "modelCacheSetting", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.modelCacheSetting = builder.modelCacheSetting;
        }

        @Override
        public final java.lang.String getModelCacheSetting() {
            return this.modelCacheSetting;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getModelCacheSetting() != null) {
                data.set("modelCacheSetting", om.valueToTree(this.getModelCacheSetting()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerModel.SagemakerModelPrimaryContainerMultiModelConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerModelPrimaryContainerMultiModelConfig.Jsii$Proxy that = (SagemakerModelPrimaryContainerMultiModelConfig.Jsii$Proxy) o;

            return this.modelCacheSetting != null ? this.modelCacheSetting.equals(that.modelCacheSetting) : that.modelCacheSetting == null;
        }

        @Override
        public final int hashCode() {
            int result = this.modelCacheSetting != null ? this.modelCacheSetting.hashCode() : 0;
            return result;
        }
    }
}
