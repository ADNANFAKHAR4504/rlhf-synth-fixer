package imports.aws.sagemaker_feature_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.323Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFeatureGroup.SagemakerFeatureGroupFeatureDefinition")
@software.amazon.jsii.Jsii.Proxy(SagemakerFeatureGroupFeatureDefinition.Jsii$Proxy.class)
public interface SagemakerFeatureGroupFeatureDefinition extends software.amazon.jsii.JsiiSerializable {

    /**
     * collection_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#collection_config SagemakerFeatureGroup#collection_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfig getCollectionConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#collection_type SagemakerFeatureGroup#collection_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCollectionType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#feature_name SagemakerFeatureGroup#feature_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFeatureName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#feature_type SagemakerFeatureGroup#feature_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFeatureType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerFeatureGroupFeatureDefinition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerFeatureGroupFeatureDefinition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerFeatureGroupFeatureDefinition> {
        imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfig collectionConfig;
        java.lang.String collectionType;
        java.lang.String featureName;
        java.lang.String featureType;

        /**
         * Sets the value of {@link SagemakerFeatureGroupFeatureDefinition#getCollectionConfig}
         * @param collectionConfig collection_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#collection_config SagemakerFeatureGroup#collection_config}
         * @return {@code this}
         */
        public Builder collectionConfig(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfig collectionConfig) {
            this.collectionConfig = collectionConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupFeatureDefinition#getCollectionType}
         * @param collectionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#collection_type SagemakerFeatureGroup#collection_type}.
         * @return {@code this}
         */
        public Builder collectionType(java.lang.String collectionType) {
            this.collectionType = collectionType;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupFeatureDefinition#getFeatureName}
         * @param featureName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#feature_name SagemakerFeatureGroup#feature_name}.
         * @return {@code this}
         */
        public Builder featureName(java.lang.String featureName) {
            this.featureName = featureName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupFeatureDefinition#getFeatureType}
         * @param featureType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#feature_type SagemakerFeatureGroup#feature_type}.
         * @return {@code this}
         */
        public Builder featureType(java.lang.String featureType) {
            this.featureType = featureType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerFeatureGroupFeatureDefinition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerFeatureGroupFeatureDefinition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerFeatureGroupFeatureDefinition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerFeatureGroupFeatureDefinition {
        private final imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfig collectionConfig;
        private final java.lang.String collectionType;
        private final java.lang.String featureName;
        private final java.lang.String featureType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.collectionConfig = software.amazon.jsii.Kernel.get(this, "collectionConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfig.class));
            this.collectionType = software.amazon.jsii.Kernel.get(this, "collectionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.featureName = software.amazon.jsii.Kernel.get(this, "featureName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.featureType = software.amazon.jsii.Kernel.get(this, "featureType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.collectionConfig = builder.collectionConfig;
            this.collectionType = builder.collectionType;
            this.featureName = builder.featureName;
            this.featureType = builder.featureType;
        }

        @Override
        public final imports.aws.sagemaker_feature_group.SagemakerFeatureGroupFeatureDefinitionCollectionConfig getCollectionConfig() {
            return this.collectionConfig;
        }

        @Override
        public final java.lang.String getCollectionType() {
            return this.collectionType;
        }

        @Override
        public final java.lang.String getFeatureName() {
            return this.featureName;
        }

        @Override
        public final java.lang.String getFeatureType() {
            return this.featureType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCollectionConfig() != null) {
                data.set("collectionConfig", om.valueToTree(this.getCollectionConfig()));
            }
            if (this.getCollectionType() != null) {
                data.set("collectionType", om.valueToTree(this.getCollectionType()));
            }
            if (this.getFeatureName() != null) {
                data.set("featureName", om.valueToTree(this.getFeatureName()));
            }
            if (this.getFeatureType() != null) {
                data.set("featureType", om.valueToTree(this.getFeatureType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerFeatureGroup.SagemakerFeatureGroupFeatureDefinition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerFeatureGroupFeatureDefinition.Jsii$Proxy that = (SagemakerFeatureGroupFeatureDefinition.Jsii$Proxy) o;

            if (this.collectionConfig != null ? !this.collectionConfig.equals(that.collectionConfig) : that.collectionConfig != null) return false;
            if (this.collectionType != null ? !this.collectionType.equals(that.collectionType) : that.collectionType != null) return false;
            if (this.featureName != null ? !this.featureName.equals(that.featureName) : that.featureName != null) return false;
            return this.featureType != null ? this.featureType.equals(that.featureType) : that.featureType == null;
        }

        @Override
        public final int hashCode() {
            int result = this.collectionConfig != null ? this.collectionConfig.hashCode() : 0;
            result = 31 * result + (this.collectionType != null ? this.collectionType.hashCode() : 0);
            result = 31 * result + (this.featureName != null ? this.featureName.hashCode() : 0);
            result = 31 * result + (this.featureType != null ? this.featureType.hashCode() : 0);
            return result;
        }
    }
}
