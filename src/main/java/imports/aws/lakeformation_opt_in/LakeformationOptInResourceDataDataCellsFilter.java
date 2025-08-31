package imports.aws.lakeformation_opt_in;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.486Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationOptIn.LakeformationOptInResourceDataDataCellsFilter")
@software.amazon.jsii.Jsii.Proxy(LakeformationOptInResourceDataDataCellsFilter.Jsii$Proxy.class)
public interface LakeformationOptInResourceDataDataCellsFilter extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#database_name LakeformationOptIn#database_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatabaseName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#name LakeformationOptIn#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#table_catalog_id LakeformationOptIn#table_catalog_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTableCatalogId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#table_name LakeformationOptIn#table_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTableName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LakeformationOptInResourceDataDataCellsFilter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LakeformationOptInResourceDataDataCellsFilter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LakeformationOptInResourceDataDataCellsFilter> {
        java.lang.String databaseName;
        java.lang.String name;
        java.lang.String tableCatalogId;
        java.lang.String tableName;

        /**
         * Sets the value of {@link LakeformationOptInResourceDataDataCellsFilter#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#database_name LakeformationOptIn#database_name}.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceDataDataCellsFilter#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#name LakeformationOptIn#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceDataDataCellsFilter#getTableCatalogId}
         * @param tableCatalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#table_catalog_id LakeformationOptIn#table_catalog_id}.
         * @return {@code this}
         */
        public Builder tableCatalogId(java.lang.String tableCatalogId) {
            this.tableCatalogId = tableCatalogId;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationOptInResourceDataDataCellsFilter#getTableName}
         * @param tableName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_opt_in#table_name LakeformationOptIn#table_name}.
         * @return {@code this}
         */
        public Builder tableName(java.lang.String tableName) {
            this.tableName = tableName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LakeformationOptInResourceDataDataCellsFilter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LakeformationOptInResourceDataDataCellsFilter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LakeformationOptInResourceDataDataCellsFilter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LakeformationOptInResourceDataDataCellsFilter {
        private final java.lang.String databaseName;
        private final java.lang.String name;
        private final java.lang.String tableCatalogId;
        private final java.lang.String tableName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tableCatalogId = software.amazon.jsii.Kernel.get(this, "tableCatalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tableName = software.amazon.jsii.Kernel.get(this, "tableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.databaseName = builder.databaseName;
            this.name = builder.name;
            this.tableCatalogId = builder.tableCatalogId;
            this.tableName = builder.tableName;
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
        public final java.lang.String getTableCatalogId() {
            return this.tableCatalogId;
        }

        @Override
        public final java.lang.String getTableName() {
            return this.tableName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDatabaseName() != null) {
                data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getTableCatalogId() != null) {
                data.set("tableCatalogId", om.valueToTree(this.getTableCatalogId()));
            }
            if (this.getTableName() != null) {
                data.set("tableName", om.valueToTree(this.getTableName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lakeformationOptIn.LakeformationOptInResourceDataDataCellsFilter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LakeformationOptInResourceDataDataCellsFilter.Jsii$Proxy that = (LakeformationOptInResourceDataDataCellsFilter.Jsii$Proxy) o;

            if (this.databaseName != null ? !this.databaseName.equals(that.databaseName) : that.databaseName != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.tableCatalogId != null ? !this.tableCatalogId.equals(that.tableCatalogId) : that.tableCatalogId != null) return false;
            return this.tableName != null ? this.tableName.equals(that.tableName) : that.tableName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.databaseName != null ? this.databaseName.hashCode() : 0;
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.tableCatalogId != null ? this.tableCatalogId.hashCode() : 0);
            result = 31 * result + (this.tableName != null ? this.tableName.hashCode() : 0);
            return result;
        }
    }
}
