package imports.aws.dataexchange_revision_assets;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.937Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataexchangeRevisionAssets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant")
@software.amazon.jsii.Jsii.Proxy(DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant.Jsii$Proxy.class)
public interface DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#kms_key_arn DataexchangeRevisionAssets#kms_key_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyArn();

    /**
     * @return a {@link Builder} of {@link DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant> {
        java.lang.String kmsKeyArn;

        /**
         * Sets the value of {@link DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#kms_key_arn DataexchangeRevisionAssets#kms_key_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant {
        private final java.lang.String kmsKeyArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kmsKeyArn = java.util.Objects.requireNonNull(builder.kmsKeyArn, "kmsKeyArn is required");
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataexchangeRevisionAssets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant.Jsii$Proxy that = (DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant.Jsii$Proxy) o;

            return this.kmsKeyArn.equals(that.kmsKeyArn);
        }

        @Override
        public final int hashCode() {
            int result = this.kmsKeyArn.hashCode();
            return result;
        }
    }
}
