package imports.aws.dataexchange_revision_assets;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.937Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataexchangeRevisionAssets.DataexchangeRevisionAssetsAsset")
@software.amazon.jsii.Jsii.Proxy(DataexchangeRevisionAssetsAsset.Jsii$Proxy.class)
public interface DataexchangeRevisionAssetsAsset extends software.amazon.jsii.JsiiSerializable {

    /**
     * create_s3_data_access_from_s3_bucket block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#create_s3_data_access_from_s3_bucket DataexchangeRevisionAssets#create_s3_data_access_from_s3_bucket}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCreateS3DataAccessFromS3Bucket() {
        return null;
    }

    /**
     * import_assets_from_s3 block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#import_assets_from_s3 DataexchangeRevisionAssets#import_assets_from_s3}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getImportAssetsFromS3() {
        return null;
    }

    /**
     * import_assets_from_signed_url block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#import_assets_from_signed_url DataexchangeRevisionAssets#import_assets_from_signed_url}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getImportAssetsFromSignedUrl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataexchangeRevisionAssetsAsset}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataexchangeRevisionAssetsAsset}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataexchangeRevisionAssetsAsset> {
        java.lang.Object createS3DataAccessFromS3Bucket;
        java.lang.Object importAssetsFromS3;
        java.lang.Object importAssetsFromSignedUrl;

        /**
         * Sets the value of {@link DataexchangeRevisionAssetsAsset#getCreateS3DataAccessFromS3Bucket}
         * @param createS3DataAccessFromS3Bucket create_s3_data_access_from_s3_bucket block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#create_s3_data_access_from_s3_bucket DataexchangeRevisionAssets#create_s3_data_access_from_s3_bucket}
         * @return {@code this}
         */
        public Builder createS3DataAccessFromS3Bucket(com.hashicorp.cdktf.IResolvable createS3DataAccessFromS3Bucket) {
            this.createS3DataAccessFromS3Bucket = createS3DataAccessFromS3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeRevisionAssetsAsset#getCreateS3DataAccessFromS3Bucket}
         * @param createS3DataAccessFromS3Bucket create_s3_data_access_from_s3_bucket block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#create_s3_data_access_from_s3_bucket DataexchangeRevisionAssets#create_s3_data_access_from_s3_bucket}
         * @return {@code this}
         */
        public Builder createS3DataAccessFromS3Bucket(java.util.List<? extends imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetCreateS3DataAccessFromS3Bucket> createS3DataAccessFromS3Bucket) {
            this.createS3DataAccessFromS3Bucket = createS3DataAccessFromS3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeRevisionAssetsAsset#getImportAssetsFromS3}
         * @param importAssetsFromS3 import_assets_from_s3 block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#import_assets_from_s3 DataexchangeRevisionAssets#import_assets_from_s3}
         * @return {@code this}
         */
        public Builder importAssetsFromS3(com.hashicorp.cdktf.IResolvable importAssetsFromS3) {
            this.importAssetsFromS3 = importAssetsFromS3;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeRevisionAssetsAsset#getImportAssetsFromS3}
         * @param importAssetsFromS3 import_assets_from_s3 block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#import_assets_from_s3 DataexchangeRevisionAssets#import_assets_from_s3}
         * @return {@code this}
         */
        public Builder importAssetsFromS3(java.util.List<? extends imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetImportAssetsFromS3> importAssetsFromS3) {
            this.importAssetsFromS3 = importAssetsFromS3;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeRevisionAssetsAsset#getImportAssetsFromSignedUrl}
         * @param importAssetsFromSignedUrl import_assets_from_signed_url block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#import_assets_from_signed_url DataexchangeRevisionAssets#import_assets_from_signed_url}
         * @return {@code this}
         */
        public Builder importAssetsFromSignedUrl(com.hashicorp.cdktf.IResolvable importAssetsFromSignedUrl) {
            this.importAssetsFromSignedUrl = importAssetsFromSignedUrl;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeRevisionAssetsAsset#getImportAssetsFromSignedUrl}
         * @param importAssetsFromSignedUrl import_assets_from_signed_url block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#import_assets_from_signed_url DataexchangeRevisionAssets#import_assets_from_signed_url}
         * @return {@code this}
         */
        public Builder importAssetsFromSignedUrl(java.util.List<? extends imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetImportAssetsFromSignedUrl> importAssetsFromSignedUrl) {
            this.importAssetsFromSignedUrl = importAssetsFromSignedUrl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataexchangeRevisionAssetsAsset}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataexchangeRevisionAssetsAsset build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataexchangeRevisionAssetsAsset}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataexchangeRevisionAssetsAsset {
        private final java.lang.Object createS3DataAccessFromS3Bucket;
        private final java.lang.Object importAssetsFromS3;
        private final java.lang.Object importAssetsFromSignedUrl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.createS3DataAccessFromS3Bucket = software.amazon.jsii.Kernel.get(this, "createS3DataAccessFromS3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.importAssetsFromS3 = software.amazon.jsii.Kernel.get(this, "importAssetsFromS3", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.importAssetsFromSignedUrl = software.amazon.jsii.Kernel.get(this, "importAssetsFromSignedUrl", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.createS3DataAccessFromS3Bucket = builder.createS3DataAccessFromS3Bucket;
            this.importAssetsFromS3 = builder.importAssetsFromS3;
            this.importAssetsFromSignedUrl = builder.importAssetsFromSignedUrl;
        }

        @Override
        public final java.lang.Object getCreateS3DataAccessFromS3Bucket() {
            return this.createS3DataAccessFromS3Bucket;
        }

        @Override
        public final java.lang.Object getImportAssetsFromS3() {
            return this.importAssetsFromS3;
        }

        @Override
        public final java.lang.Object getImportAssetsFromSignedUrl() {
            return this.importAssetsFromSignedUrl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCreateS3DataAccessFromS3Bucket() != null) {
                data.set("createS3DataAccessFromS3Bucket", om.valueToTree(this.getCreateS3DataAccessFromS3Bucket()));
            }
            if (this.getImportAssetsFromS3() != null) {
                data.set("importAssetsFromS3", om.valueToTree(this.getImportAssetsFromS3()));
            }
            if (this.getImportAssetsFromSignedUrl() != null) {
                data.set("importAssetsFromSignedUrl", om.valueToTree(this.getImportAssetsFromSignedUrl()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataexchangeRevisionAssets.DataexchangeRevisionAssetsAsset"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataexchangeRevisionAssetsAsset.Jsii$Proxy that = (DataexchangeRevisionAssetsAsset.Jsii$Proxy) o;

            if (this.createS3DataAccessFromS3Bucket != null ? !this.createS3DataAccessFromS3Bucket.equals(that.createS3DataAccessFromS3Bucket) : that.createS3DataAccessFromS3Bucket != null) return false;
            if (this.importAssetsFromS3 != null ? !this.importAssetsFromS3.equals(that.importAssetsFromS3) : that.importAssetsFromS3 != null) return false;
            return this.importAssetsFromSignedUrl != null ? this.importAssetsFromSignedUrl.equals(that.importAssetsFromSignedUrl) : that.importAssetsFromSignedUrl == null;
        }

        @Override
        public final int hashCode() {
            int result = this.createS3DataAccessFromS3Bucket != null ? this.createS3DataAccessFromS3Bucket.hashCode() : 0;
            result = 31 * result + (this.importAssetsFromS3 != null ? this.importAssetsFromS3.hashCode() : 0);
            result = 31 * result + (this.importAssetsFromSignedUrl != null ? this.importAssetsFromSignedUrl.hashCode() : 0);
            return result;
        }
    }
}
