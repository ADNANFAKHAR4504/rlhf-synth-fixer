package imports.aws.glue_catalog_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.279Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogTable.GlueCatalogTablePartitionIndex")
@software.amazon.jsii.Jsii.Proxy(GlueCatalogTablePartitionIndex.Jsii$Proxy.class)
public interface GlueCatalogTablePartitionIndex extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#index_name GlueCatalogTable#index_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIndexName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#keys GlueCatalogTable#keys}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getKeys();

    /**
     * @return a {@link Builder} of {@link GlueCatalogTablePartitionIndex}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCatalogTablePartitionIndex}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCatalogTablePartitionIndex> {
        java.lang.String indexName;
        java.util.List<java.lang.String> keys;

        /**
         * Sets the value of {@link GlueCatalogTablePartitionIndex#getIndexName}
         * @param indexName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#index_name GlueCatalogTable#index_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder indexName(java.lang.String indexName) {
            this.indexName = indexName;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTablePartitionIndex#getKeys}
         * @param keys Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#keys GlueCatalogTable#keys}. This parameter is required.
         * @return {@code this}
         */
        public Builder keys(java.util.List<java.lang.String> keys) {
            this.keys = keys;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueCatalogTablePartitionIndex}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCatalogTablePartitionIndex build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCatalogTablePartitionIndex}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCatalogTablePartitionIndex {
        private final java.lang.String indexName;
        private final java.util.List<java.lang.String> keys;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.indexName = software.amazon.jsii.Kernel.get(this, "indexName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keys = software.amazon.jsii.Kernel.get(this, "keys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.indexName = java.util.Objects.requireNonNull(builder.indexName, "indexName is required");
            this.keys = java.util.Objects.requireNonNull(builder.keys, "keys is required");
        }

        @Override
        public final java.lang.String getIndexName() {
            return this.indexName;
        }

        @Override
        public final java.util.List<java.lang.String> getKeys() {
            return this.keys;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("indexName", om.valueToTree(this.getIndexName()));
            data.set("keys", om.valueToTree(this.getKeys()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueCatalogTable.GlueCatalogTablePartitionIndex"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCatalogTablePartitionIndex.Jsii$Proxy that = (GlueCatalogTablePartitionIndex.Jsii$Proxy) o;

            if (!indexName.equals(that.indexName)) return false;
            return this.keys.equals(that.keys);
        }

        @Override
        public final int hashCode() {
            int result = this.indexName.hashCode();
            result = 31 * result + (this.keys.hashCode());
            return result;
        }
    }
}
