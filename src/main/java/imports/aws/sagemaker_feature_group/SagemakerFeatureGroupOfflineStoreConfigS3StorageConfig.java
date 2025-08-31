package imports.aws.sagemaker_feature_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.324Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFeatureGroup.SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig.Jsii$Proxy.class)
public interface SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#s3_uri SagemakerFeatureGroup#s3_uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Uri();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#kms_key_id SagemakerFeatureGroup#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#resolved_output_s3_uri SagemakerFeatureGroup#resolved_output_s3_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResolvedOutputS3Uri() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig> {
        java.lang.String s3Uri;
        java.lang.String kmsKeyId;
        java.lang.String resolvedOutputS3Uri;

        /**
         * Sets the value of {@link SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig#getS3Uri}
         * @param s3Uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#s3_uri SagemakerFeatureGroup#s3_uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Uri(java.lang.String s3Uri) {
            this.s3Uri = s3Uri;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#kms_key_id SagemakerFeatureGroup#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig#getResolvedOutputS3Uri}
         * @param resolvedOutputS3Uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#resolved_output_s3_uri SagemakerFeatureGroup#resolved_output_s3_uri}.
         * @return {@code this}
         */
        public Builder resolvedOutputS3Uri(java.lang.String resolvedOutputS3Uri) {
            this.resolvedOutputS3Uri = resolvedOutputS3Uri;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig {
        private final java.lang.String s3Uri;
        private final java.lang.String kmsKeyId;
        private final java.lang.String resolvedOutputS3Uri;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Uri = software.amazon.jsii.Kernel.get(this, "s3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resolvedOutputS3Uri = software.amazon.jsii.Kernel.get(this, "resolvedOutputS3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Uri = java.util.Objects.requireNonNull(builder.s3Uri, "s3Uri is required");
            this.kmsKeyId = builder.kmsKeyId;
            this.resolvedOutputS3Uri = builder.resolvedOutputS3Uri;
        }

        @Override
        public final java.lang.String getS3Uri() {
            return this.s3Uri;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.String getResolvedOutputS3Uri() {
            return this.resolvedOutputS3Uri;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3Uri", om.valueToTree(this.getS3Uri()));
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getResolvedOutputS3Uri() != null) {
                data.set("resolvedOutputS3Uri", om.valueToTree(this.getResolvedOutputS3Uri()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerFeatureGroup.SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig.Jsii$Proxy that = (SagemakerFeatureGroupOfflineStoreConfigS3StorageConfig.Jsii$Proxy) o;

            if (!s3Uri.equals(that.s3Uri)) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            return this.resolvedOutputS3Uri != null ? this.resolvedOutputS3Uri.equals(that.resolvedOutputS3Uri) : that.resolvedOutputS3Uri == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3Uri.hashCode();
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.resolvedOutputS3Uri != null ? this.resolvedOutputS3Uri.hashCode() : 0);
            return result;
        }
    }
}
