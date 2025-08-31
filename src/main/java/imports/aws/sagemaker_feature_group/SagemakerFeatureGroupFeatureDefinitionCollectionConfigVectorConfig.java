package imports.aws.sagemaker_feature_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.323Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFeatureGroup.SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig.Jsii$Proxy.class)
public interface SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#dimension SagemakerFeatureGroup#dimension}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDimension() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig> {
        java.lang.Number dimension;

        /**
         * Sets the value of {@link SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig#getDimension}
         * @param dimension Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#dimension SagemakerFeatureGroup#dimension}.
         * @return {@code this}
         */
        public Builder dimension(java.lang.Number dimension) {
            this.dimension = dimension;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig {
        private final java.lang.Number dimension;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dimension = software.amazon.jsii.Kernel.get(this, "dimension", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dimension = builder.dimension;
        }

        @Override
        public final java.lang.Number getDimension() {
            return this.dimension;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDimension() != null) {
                data.set("dimension", om.valueToTree(this.getDimension()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerFeatureGroup.SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig.Jsii$Proxy that = (SagemakerFeatureGroupFeatureDefinitionCollectionConfigVectorConfig.Jsii$Proxy) o;

            return this.dimension != null ? this.dimension.equals(that.dimension) : that.dimension == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dimension != null ? this.dimension.hashCode() : 0;
            return result;
        }
    }
}
