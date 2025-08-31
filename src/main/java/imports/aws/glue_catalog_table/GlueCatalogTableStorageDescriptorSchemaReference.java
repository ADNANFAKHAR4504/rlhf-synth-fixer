package imports.aws.glue_catalog_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.284Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogTable.GlueCatalogTableStorageDescriptorSchemaReference")
@software.amazon.jsii.Jsii.Proxy(GlueCatalogTableStorageDescriptorSchemaReference.Jsii$Proxy.class)
public interface GlueCatalogTableStorageDescriptorSchemaReference extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#schema_version_number GlueCatalogTable#schema_version_number}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getSchemaVersionNumber();

    /**
     * schema_id block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#schema_id GlueCatalogTable#schema_id}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId getSchemaId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#schema_version_id GlueCatalogTable#schema_version_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSchemaVersionId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCatalogTableStorageDescriptorSchemaReference}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCatalogTableStorageDescriptorSchemaReference}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCatalogTableStorageDescriptorSchemaReference> {
        java.lang.Number schemaVersionNumber;
        imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId schemaId;
        java.lang.String schemaVersionId;

        /**
         * Sets the value of {@link GlueCatalogTableStorageDescriptorSchemaReference#getSchemaVersionNumber}
         * @param schemaVersionNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#schema_version_number GlueCatalogTable#schema_version_number}. This parameter is required.
         * @return {@code this}
         */
        public Builder schemaVersionNumber(java.lang.Number schemaVersionNumber) {
            this.schemaVersionNumber = schemaVersionNumber;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableStorageDescriptorSchemaReference#getSchemaId}
         * @param schemaId schema_id block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#schema_id GlueCatalogTable#schema_id}
         * @return {@code this}
         */
        public Builder schemaId(imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId schemaId) {
            this.schemaId = schemaId;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableStorageDescriptorSchemaReference#getSchemaVersionId}
         * @param schemaVersionId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#schema_version_id GlueCatalogTable#schema_version_id}.
         * @return {@code this}
         */
        public Builder schemaVersionId(java.lang.String schemaVersionId) {
            this.schemaVersionId = schemaVersionId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCatalogTableStorageDescriptorSchemaReference}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCatalogTableStorageDescriptorSchemaReference build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCatalogTableStorageDescriptorSchemaReference}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCatalogTableStorageDescriptorSchemaReference {
        private final java.lang.Number schemaVersionNumber;
        private final imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId schemaId;
        private final java.lang.String schemaVersionId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.schemaVersionNumber = software.amazon.jsii.Kernel.get(this, "schemaVersionNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.schemaId = software.amazon.jsii.Kernel.get(this, "schemaId", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId.class));
            this.schemaVersionId = software.amazon.jsii.Kernel.get(this, "schemaVersionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.schemaVersionNumber = java.util.Objects.requireNonNull(builder.schemaVersionNumber, "schemaVersionNumber is required");
            this.schemaId = builder.schemaId;
            this.schemaVersionId = builder.schemaVersionId;
        }

        @Override
        public final java.lang.Number getSchemaVersionNumber() {
            return this.schemaVersionNumber;
        }

        @Override
        public final imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId getSchemaId() {
            return this.schemaId;
        }

        @Override
        public final java.lang.String getSchemaVersionId() {
            return this.schemaVersionId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("schemaVersionNumber", om.valueToTree(this.getSchemaVersionNumber()));
            if (this.getSchemaId() != null) {
                data.set("schemaId", om.valueToTree(this.getSchemaId()));
            }
            if (this.getSchemaVersionId() != null) {
                data.set("schemaVersionId", om.valueToTree(this.getSchemaVersionId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCatalogTable.GlueCatalogTableStorageDescriptorSchemaReference"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCatalogTableStorageDescriptorSchemaReference.Jsii$Proxy that = (GlueCatalogTableStorageDescriptorSchemaReference.Jsii$Proxy) o;

            if (!schemaVersionNumber.equals(that.schemaVersionNumber)) return false;
            if (this.schemaId != null ? !this.schemaId.equals(that.schemaId) : that.schemaId != null) return false;
            return this.schemaVersionId != null ? this.schemaVersionId.equals(that.schemaVersionId) : that.schemaVersionId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.schemaVersionNumber.hashCode();
            result = 31 * result + (this.schemaId != null ? this.schemaId.hashCode() : 0);
            result = 31 * result + (this.schemaVersionId != null ? this.schemaVersionId.hashCode() : 0);
            return result;
        }
    }
}
