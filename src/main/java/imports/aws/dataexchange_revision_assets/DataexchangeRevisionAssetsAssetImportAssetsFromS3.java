package imports.aws.dataexchange_revision_assets;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.938Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataexchangeRevisionAssets.DataexchangeRevisionAssetsAssetImportAssetsFromS3")
@software.amazon.jsii.Jsii.Proxy(DataexchangeRevisionAssetsAssetImportAssetsFromS3.Jsii$Proxy.class)
public interface DataexchangeRevisionAssetsAssetImportAssetsFromS3 extends software.amazon.jsii.JsiiSerializable {

    /**
     * asset_source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#asset_source DataexchangeRevisionAssets#asset_source}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAssetSource() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataexchangeRevisionAssetsAssetImportAssetsFromS3}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataexchangeRevisionAssetsAssetImportAssetsFromS3}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataexchangeRevisionAssetsAssetImportAssetsFromS3> {
        java.lang.Object assetSource;

        /**
         * Sets the value of {@link DataexchangeRevisionAssetsAssetImportAssetsFromS3#getAssetSource}
         * @param assetSource asset_source block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#asset_source DataexchangeRevisionAssets#asset_source}
         * @return {@code this}
         */
        public Builder assetSource(com.hashicorp.cdktf.IResolvable assetSource) {
            this.assetSource = assetSource;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeRevisionAssetsAssetImportAssetsFromS3#getAssetSource}
         * @param assetSource asset_source block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_revision_assets#asset_source DataexchangeRevisionAssets#asset_source}
         * @return {@code this}
         */
        public Builder assetSource(java.util.List<? extends imports.aws.dataexchange_revision_assets.DataexchangeRevisionAssetsAssetImportAssetsFromS3AssetSource> assetSource) {
            this.assetSource = assetSource;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataexchangeRevisionAssetsAssetImportAssetsFromS3}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataexchangeRevisionAssetsAssetImportAssetsFromS3 build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataexchangeRevisionAssetsAssetImportAssetsFromS3}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataexchangeRevisionAssetsAssetImportAssetsFromS3 {
        private final java.lang.Object assetSource;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.assetSource = software.amazon.jsii.Kernel.get(this, "assetSource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.assetSource = builder.assetSource;
        }

        @Override
        public final java.lang.Object getAssetSource() {
            return this.assetSource;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAssetSource() != null) {
                data.set("assetSource", om.valueToTree(this.getAssetSource()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataexchangeRevisionAssets.DataexchangeRevisionAssetsAssetImportAssetsFromS3"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataexchangeRevisionAssetsAssetImportAssetsFromS3.Jsii$Proxy that = (DataexchangeRevisionAssetsAssetImportAssetsFromS3.Jsii$Proxy) o;

            return this.assetSource != null ? this.assetSource.equals(that.assetSource) : that.assetSource == null;
        }

        @Override
        public final int hashCode() {
            int result = this.assetSource != null ? this.assetSource.hashCode() : 0;
            return result;
        }
    }
}
