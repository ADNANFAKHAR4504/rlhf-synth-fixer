package imports.aws.dataexchange_revision_assets;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.937Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataexchangeRevisionAssets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource")
@software.amazon.jsii.Jsii.Proxy(DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource.Jsii$Proxy.class)
public interface DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#bucket DataexchangeRevisionAssets#bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#key_prefixes DataexchangeRevisionAssets#key_prefixes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getKeyPrefixes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#keys DataexchangeRevisionAssets#keys}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getKeys() {
        return null;
    }

    /**
     * kms_keys_to_grant block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#kms_keys_to_grant DataexchangeRevisionAssets#kms_keys_to_grant}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getKmsKeysToGrant() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource> {
        java.lang.String bucket;
        java.util.List<java.lang.String> keyPrefixes;
        java.util.List<java.lang.String> keys;
        java.lang.Object kmsKeysToGrant;

        /**
         * Sets the value of {@link DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#bucket DataexchangeRevisionAssets#bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource#getKeyPrefixes}
         * @param keyPrefixes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#key_prefixes DataexchangeRevisionAssets#key_prefixes}.
         * @return {@code this}
         */
        public Builder keyPrefixes(java.util.List<java.lang.String> keyPrefixes) {
            this.keyPrefixes = keyPrefixes;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource#getKeys}
         * @param keys Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#keys DataexchangeRevisionAssets#keys}.
         * @return {@code this}
         */
        public Builder keys(java.util.List<java.lang.String> keys) {
            this.keys = keys;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource#getKmsKeysToGrant}
         * @param kmsKeysToGrant kms_keys_to_grant block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#kms_keys_to_grant DataexchangeRevisionAssets#kms_keys_to_grant}
         * @return {@code this}
         */
        public Builder kmsKeysToGrant(com.hashicorp.cdktf.IResolvable kmsKeysToGrant) {
            this.kmsKeysToGrant = kmsKeysToGrant;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource#getKmsKeysToGrant}
         * @param kmsKeysToGrant kms_keys_to_grant block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#kms_keys_to_grant DataexchangeRevisionAssets#kms_keys_to_grant}
         * @return {@code this}
         */
        public Builder kmsKeysToGrant(java.util.List<? extends imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSourceKmsKeysToGrant> kmsKeysToGrant) {
            this.kmsKeysToGrant = kmsKeysToGrant;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource {
        private final java.lang.String bucket;
        private final java.util.List<java.lang.String> keyPrefixes;
        private final java.util.List<java.lang.String> keys;
        private final java.lang.Object kmsKeysToGrant;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyPrefixes = software.amazon.jsii.Kernel.get(this, "keyPrefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.keys = software.amazon.jsii.Kernel.get(this, "keys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.kmsKeysToGrant = software.amazon.jsii.Kernel.get(this, "kmsKeysToGrant", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucket = java.util.Objects.requireNonNull(builder.bucket, "bucket is required");
            this.keyPrefixes = builder.keyPrefixes;
            this.keys = builder.keys;
            this.kmsKeysToGrant = builder.kmsKeysToGrant;
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        public final java.util.List<java.lang.String> getKeyPrefixes() {
            return this.keyPrefixes;
        }

        @Override
        public final java.util.List<java.lang.String> getKeys() {
            return this.keys;
        }

        @Override
        public final java.lang.Object getKmsKeysToGrant() {
            return this.kmsKeysToGrant;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucket", om.valueToTree(this.getBucket()));
            if (this.getKeyPrefixes() != null) {
                data.set("keyPrefixes", om.valueToTree(this.getKeyPrefixes()));
            }
            if (this.getKeys() != null) {
                data.set("keys", om.valueToTree(this.getKeys()));
            }
            if (this.getKmsKeysToGrant() != null) {
                data.set("kmsKeysToGrant", om.valueToTree(this.getKmsKeysToGrant()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataexchangeRevisionAssets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource.Jsii$Proxy that = (DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3BucketAssetSource.Jsii$Proxy) o;

            if (!bucket.equals(that.bucket)) return false;
            if (this.keyPrefixes != null ? !this.keyPrefixes.equals(that.keyPrefixes) : that.keyPrefixes != null) return false;
            if (this.keys != null ? !this.keys.equals(that.keys) : that.keys != null) return false;
            return this.kmsKeysToGrant != null ? this.kmsKeysToGrant.equals(that.kmsKeysToGrant) : that.kmsKeysToGrant == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucket.hashCode();
            result = 31 * result + (this.keyPrefixes != null ? this.keyPrefixes.hashCode() : 0);
            result = 31 * result + (this.keys != null ? this.keys.hashCode() : 0);
            result = 31 * result + (this.kmsKeysToGrant != null ? this.kmsKeysToGrant.hashCode() : 0);
            return result;
        }
    }
}
