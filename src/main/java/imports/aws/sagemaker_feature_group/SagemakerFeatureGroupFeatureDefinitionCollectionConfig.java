package imports.aws.sagemaker_feature_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.323Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFeatureGroup.SagemakerFeatureGroupFeatureDefinitionCollectionConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerFeatureGroupFeatureDefinitionCollectionConfig.Jsii$Proxy.class)
public interface SagemakerFeatureGroupFeatureDefinitionCollectionConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * vector_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#vector_config SagemakerFeatureGroup#vector_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig getVectorConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerFeatureGroupFeatureDefinitionCollectionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerFeatureGroupFeatureDefinitionCollectionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerFeatureGroupFeatureDefinitionCollectionConfig> {
        imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig vectorConfig;

        /**
         * Sets the value of {@link SagemakerFeatureGroupFeatureDefinitionCollectionConfig#getVectorConfig}
         * @param vectorConfig vector_config block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#vector_config SagemakerFeatureGroup#vector_config}
         * @return {@code this}
         */
        public Builder vectorConfig(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig vectorConfig) {
            this.vectorConfig = vectorConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerFeatureGroupFeatureDefinitionCollectionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerFeatureGroupFeatureDefinitionCollectionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerFeatureGroupFeatureDefinitionCollectionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerFeatureGroupFeatureDefinitionCollectionConfig {
        private final imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig vectorConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.vectorConfig = software.amazon.jsii.Kernel.get(this, "vectorConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.vectorConfig = builder.vectorConfig;
        }

        @Override
        public final imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig getVectorConfig() {
            return this.vectorConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getVectorConfig() != null) {
                data.set("vectorConfig", om.valueToTree(this.getVectorConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerFeatureGroup.SagemakerFeatureGroupFeatureDefinitionCollectionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerFeatureGroupFeatureDefinitionCollectionConfig.Jsii$Proxy that = (SagemakerFeatureGroupFeatureDefinitionCollectionConfig.Jsii$Proxy) o;

            return this.vectorConfig != null ? this.vectorConfig.equals(that.vectorConfig) : that.vectorConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.vectorConfig != null ? this.vectorConfig.hashCode() : 0;
            return result;
        }
    }
}
