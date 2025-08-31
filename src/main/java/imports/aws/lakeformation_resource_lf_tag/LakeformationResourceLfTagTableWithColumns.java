package imports.aws.lakeformation_resource_lf_tag;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.495Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationResourceLfTag.LakeformationResourceLfTagTableWithColumns")
@software.amazon.jsii.Jsii.Proxy(LakeformationResourceLfTagTableWithColumns.Jsii$Proxy.class)
public interface LakeformationResourceLfTagTableWithColumns extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#database_name LakeformationResourceLfTag#database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#name LakeformationResourceLfTag#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#catalog_id LakeformationResourceLfTag#catalog_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCatalogId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#column_names LakeformationResourceLfTag#column_names}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getColumnNames() {
        return null;
    }

    /**
     * column_wildcard block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#column_wildcard LakeformationResourceLfTag#column_wildcard}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getColumnWildcard() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LakeformationResourceLfTagTableWithColumns}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LakeformationResourceLfTagTableWithColumns}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LakeformationResourceLfTagTableWithColumns> {
        java.lang.String databaseName;
        java.lang.String name;
        java.lang.String catalogId;
        java.util.List<java.lang.String> columnNames;
        java.lang.Object columnWildcard;

        /**
         * Sets the value of {@link LakeformationResourceLfTagTableWithColumns#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#database_name LakeformationResourceLfTag#database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationResourceLfTagTableWithColumns#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#name LakeformationResourceLfTag#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationResourceLfTagTableWithColumns#getCatalogId}
         * @param catalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#catalog_id LakeformationResourceLfTag#catalog_id}.
         * @return {@code this}
         */
        public Builder catalogId(java.lang.String catalogId) {
            this.catalogId = catalogId;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationResourceLfTagTableWithColumns#getColumnNames}
         * @param columnNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#column_names LakeformationResourceLfTag#column_names}.
         * @return {@code this}
         */
        public Builder columnNames(java.util.List<java.lang.String> columnNames) {
            this.columnNames = columnNames;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationResourceLfTagTableWithColumns#getColumnWildcard}
         * @param columnWildcard column_wildcard block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#column_wildcard LakeformationResourceLfTag#column_wildcard}
         * @return {@code this}
         */
        public Builder columnWildcard(com.hashicorp.cdktf.IResolvable columnWildcard) {
            this.columnWildcard = columnWildcard;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationResourceLfTagTableWithColumns#getColumnWildcard}
         * @param columnWildcard column_wildcard block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_resource_lf_tag#column_wildcard LakeformationResourceLfTag#column_wildcard}
         * @return {@code this}
         */
        public Builder columnWildcard(java.util.List<? extends imports.aws.lakeformation_resource_lf_tag.LakeformationResourceLfTagTableWithColumnsColumnWildcard> columnWildcard) {
            this.columnWildcard = columnWildcard;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LakeformationResourceLfTagTableWithColumns}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LakeformationResourceLfTagTableWithColumns build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LakeformationResourceLfTagTableWithColumns}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LakeformationResourceLfTagTableWithColumns {
        private final java.lang.String databaseName;
        private final java.lang.String name;
        private final java.lang.String catalogId;
        private final java.util.List<java.lang.String> columnNames;
        private final java.lang.Object columnWildcard;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.catalogId = software.amazon.jsii.Kernel.get(this, "catalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.columnNames = software.amazon.jsii.Kernel.get(this, "columnNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.columnWildcard = software.amazon.jsii.Kernel.get(this, "columnWildcard", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.databaseName = java.util.Objects.requireNonNull(builder.databaseName, "databaseName is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.catalogId = builder.catalogId;
            this.columnNames = builder.columnNames;
            this.columnWildcard = builder.columnWildcard;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getCatalogId() {
            return this.catalogId;
        }

        @Override
        public final java.util.List<java.lang.String> getColumnNames() {
            return this.columnNames;
        }

        @Override
        public final java.lang.Object getColumnWildcard() {
            return this.columnWildcard;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getCatalogId() != null) {
                data.set("catalogId", om.valueToTree(this.getCatalogId()));
            }
            if (this.getColumnNames() != null) {
                data.set("columnNames", om.valueToTree(this.getColumnNames()));
            }
            if (this.getColumnWildcard() != null) {
                data.set("columnWildcard", om.valueToTree(this.getColumnWildcard()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lakeformationResourceLfTag.LakeformationResourceLfTagTableWithColumns"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LakeformationResourceLfTagTableWithColumns.Jsii$Proxy that = (LakeformationResourceLfTagTableWithColumns.Jsii$Proxy) o;

            if (!databaseName.equals(that.databaseName)) return false;
            if (!name.equals(that.name)) return false;
            if (this.catalogId != null ? !this.catalogId.equals(that.catalogId) : that.catalogId != null) return false;
            if (this.columnNames != null ? !this.columnNames.equals(that.columnNames) : that.columnNames != null) return false;
            return this.columnWildcard != null ? this.columnWildcard.equals(that.columnWildcard) : that.columnWildcard == null;
        }

        @Override
        public final int hashCode() {
            int result = this.databaseName.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.catalogId != null ? this.catalogId.hashCode() : 0);
            result = 31 * result + (this.columnNames != null ? this.columnNames.hashCode() : 0);
            result = 31 * result + (this.columnWildcard != null ? this.columnWildcard.hashCode() : 0);
            return result;
        }
    }
}
