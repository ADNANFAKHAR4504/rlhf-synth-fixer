package imports.aws.datazone_asset_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.955Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datazoneAssetType.DatazoneAssetTypeFormsInput")
@software.amazon.jsii.Jsii.Proxy(DatazoneAssetTypeFormsInput.Jsii$Proxy.class)
public interface DatazoneAssetTypeFormsInput extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_asset_type#map_block_key DatazoneAssetType#map_block_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMapBlockKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_asset_type#type_identifier DatazoneAssetType#type_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTypeIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_asset_type#type_revision DatazoneAssetType#type_revision}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTypeRevision();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_asset_type#required DatazoneAssetType#required}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequired() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatazoneAssetTypeFormsInput}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatazoneAssetTypeFormsInput}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatazoneAssetTypeFormsInput> {
        java.lang.String mapBlockKey;
        java.lang.String typeIdentifier;
        java.lang.String typeRevision;
        java.lang.Object required;

        /**
         * Sets the value of {@link DatazoneAssetTypeFormsInput#getMapBlockKey}
         * @param mapBlockKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_asset_type#map_block_key DatazoneAssetType#map_block_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder mapBlockKey(java.lang.String mapBlockKey) {
            this.mapBlockKey = mapBlockKey;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneAssetTypeFormsInput#getTypeIdentifier}
         * @param typeIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_asset_type#type_identifier DatazoneAssetType#type_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder typeIdentifier(java.lang.String typeIdentifier) {
            this.typeIdentifier = typeIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneAssetTypeFormsInput#getTypeRevision}
         * @param typeRevision Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_asset_type#type_revision DatazoneAssetType#type_revision}. This parameter is required.
         * @return {@code this}
         */
        public Builder typeRevision(java.lang.String typeRevision) {
            this.typeRevision = typeRevision;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneAssetTypeFormsInput#getRequired}
         * @param required Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_asset_type#required DatazoneAssetType#required}.
         * @return {@code this}
         */
        public Builder required(java.lang.Boolean required) {
            this.required = required;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneAssetTypeFormsInput#getRequired}
         * @param required Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_asset_type#required DatazoneAssetType#required}.
         * @return {@code this}
         */
        public Builder required(com.hashicorp.cdktf.IResolvable required) {
            this.required = required;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatazoneAssetTypeFormsInput}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatazoneAssetTypeFormsInput build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatazoneAssetTypeFormsInput}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatazoneAssetTypeFormsInput {
        private final java.lang.String mapBlockKey;
        private final java.lang.String typeIdentifier;
        private final java.lang.String typeRevision;
        private final java.lang.Object required;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mapBlockKey = software.amazon.jsii.Kernel.get(this, "mapBlockKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.typeIdentifier = software.amazon.jsii.Kernel.get(this, "typeIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.typeRevision = software.amazon.jsii.Kernel.get(this, "typeRevision", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.required = software.amazon.jsii.Kernel.get(this, "required", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mapBlockKey = java.util.Objects.requireNonNull(builder.mapBlockKey, "mapBlockKey is required");
            this.typeIdentifier = java.util.Objects.requireNonNull(builder.typeIdentifier, "typeIdentifier is required");
            this.typeRevision = java.util.Objects.requireNonNull(builder.typeRevision, "typeRevision is required");
            this.required = builder.required;
        }

        @Override
        public final java.lang.String getMapBlockKey() {
            return this.mapBlockKey;
        }

        @Override
        public final java.lang.String getTypeIdentifier() {
            return this.typeIdentifier;
        }

        @Override
        public final java.lang.String getTypeRevision() {
            return this.typeRevision;
        }

        @Override
        public final java.lang.Object getRequired() {
            return this.required;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("mapBlockKey", om.valueToTree(this.getMapBlockKey()));
            data.set("typeIdentifier", om.valueToTree(this.getTypeIdentifier()));
            data.set("typeRevision", om.valueToTree(this.getTypeRevision()));
            if (this.getRequired() != null) {
                data.set("required", om.valueToTree(this.getRequired()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datazoneAssetType.DatazoneAssetTypeFormsInput"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatazoneAssetTypeFormsInput.Jsii$Proxy that = (DatazoneAssetTypeFormsInput.Jsii$Proxy) o;

            if (!mapBlockKey.equals(that.mapBlockKey)) return false;
            if (!typeIdentifier.equals(that.typeIdentifier)) return false;
            if (!typeRevision.equals(that.typeRevision)) return false;
            return this.required != null ? this.required.equals(that.required) : that.required == null;
        }

        @Override
        public final int hashCode() {
            int result = this.mapBlockKey.hashCode();
            result = 31 * result + (this.typeIdentifier.hashCode());
            result = 31 * result + (this.typeRevision.hashCode());
            result = 31 * result + (this.required != null ? this.required.hashCode() : 0);
            return result;
        }
    }
}
