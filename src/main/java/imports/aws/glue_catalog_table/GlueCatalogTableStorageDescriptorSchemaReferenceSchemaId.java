package imports.aws.glue_catalog_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.284Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogTable.GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId")
@software.amazon.jsii.Jsii.Proxy(GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId.Jsii$Proxy.class)
public interface GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#registry_name GlueCatalogTable#registry_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegistryName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#schema_arn GlueCatalogTable#schema_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSchemaArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#schema_name GlueCatalogTable#schema_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSchemaName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId> {
        java.lang.String registryName;
        java.lang.String schemaArn;
        java.lang.String schemaName;

        /**
         * Sets the value of {@link GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId#getRegistryName}
         * @param registryName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#registry_name GlueCatalogTable#registry_name}.
         * @return {@code this}
         */
        public Builder registryName(java.lang.String registryName) {
            this.registryName = registryName;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId#getSchemaArn}
         * @param schemaArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#schema_arn GlueCatalogTable#schema_arn}.
         * @return {@code this}
         */
        public Builder schemaArn(java.lang.String schemaArn) {
            this.schemaArn = schemaArn;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId#getSchemaName}
         * @param schemaName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#schema_name GlueCatalogTable#schema_name}.
         * @return {@code this}
         */
        public Builder schemaName(java.lang.String schemaName) {
            this.schemaName = schemaName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId {
        private final java.lang.String registryName;
        private final java.lang.String schemaArn;
        private final java.lang.String schemaName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.registryName = software.amazon.jsii.Kernel.get(this, "registryName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.schemaArn = software.amazon.jsii.Kernel.get(this, "schemaArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.schemaName = software.amazon.jsii.Kernel.get(this, "schemaName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.registryName = builder.registryName;
            this.schemaArn = builder.schemaArn;
            this.schemaName = builder.schemaName;
        }

        @Override
        public final java.lang.String getRegistryName() {
            return this.registryName;
        }

        @Override
        public final java.lang.String getSchemaArn() {
            return this.schemaArn;
        }

        @Override
        public final java.lang.String getSchemaName() {
            return this.schemaName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRegistryName() != null) {
                data.set("registryName", om.valueToTree(this.getRegistryName()));
            }
            if (this.getSchemaArn() != null) {
                data.set("schemaArn", om.valueToTree(this.getSchemaArn()));
            }
            if (this.getSchemaName() != null) {
                data.set("schemaName", om.valueToTree(this.getSchemaName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCatalogTable.GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId.Jsii$Proxy that = (GlueCatalogTableStorageDescriptorSchemaReferenceSchemaId.Jsii$Proxy) o;

            if (this.registryName != null ? !this.registryName.equals(that.registryName) : that.registryName != null) return false;
            if (this.schemaArn != null ? !this.schemaArn.equals(that.schemaArn) : that.schemaArn != null) return false;
            return this.schemaName != null ? this.schemaName.equals(that.schemaName) : that.schemaName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.registryName != null ? this.registryName.hashCode() : 0;
            result = 31 * result + (this.schemaArn != null ? this.schemaArn.hashCode() : 0);
            result = 31 * result + (this.schemaName != null ? this.schemaName.hashCode() : 0);
            return result;
        }
    }
}
