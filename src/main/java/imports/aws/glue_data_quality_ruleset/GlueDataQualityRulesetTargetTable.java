package imports.aws.glue_data_quality_ruleset;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.295Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueDataQualityRuleset.GlueDataQualityRulesetTargetTable")
@software.amazon.jsii.Jsii.Proxy(GlueDataQualityRulesetTargetTable.Jsii$Proxy.class)
public interface GlueDataQualityRulesetTargetTable extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_quality_ruleset#database_name GlueDataQualityRuleset#database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_quality_ruleset#table_name GlueDataQualityRuleset#table_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTableName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_quality_ruleset#catalog_id GlueDataQualityRuleset#catalog_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCatalogId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueDataQualityRulesetTargetTable}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueDataQualityRulesetTargetTable}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueDataQualityRulesetTargetTable> {
        java.lang.String databaseName;
        java.lang.String tableName;
        java.lang.String catalogId;

        /**
         * Sets the value of {@link GlueDataQualityRulesetTargetTable#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_quality_ruleset#database_name GlueDataQualityRuleset#database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link GlueDataQualityRulesetTargetTable#getTableName}
         * @param tableName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_quality_ruleset#table_name GlueDataQualityRuleset#table_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder tableName(java.lang.String tableName) {
            this.tableName = tableName;
            return this;
        }

        /**
         * Sets the value of {@link GlueDataQualityRulesetTargetTable#getCatalogId}
         * @param catalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_data_quality_ruleset#catalog_id GlueDataQualityRuleset#catalog_id}.
         * @return {@code this}
         */
        public Builder catalogId(java.lang.String catalogId) {
            this.catalogId = catalogId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueDataQualityRulesetTargetTable}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueDataQualityRulesetTargetTable build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueDataQualityRulesetTargetTable}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueDataQualityRulesetTargetTable {
        private final java.lang.String databaseName;
        private final java.lang.String tableName;
        private final java.lang.String catalogId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tableName = software.amazon.jsii.Kernel.get(this, "tableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.catalogId = software.amazon.jsii.Kernel.get(this, "catalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.databaseName = java.util.Objects.requireNonNull(builder.databaseName, "databaseName is required");
            this.tableName = java.util.Objects.requireNonNull(builder.tableName, "tableName is required");
            this.catalogId = builder.catalogId;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.lang.String getTableName() {
            return this.tableName;
        }

        @Override
        public final java.lang.String getCatalogId() {
            return this.catalogId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            data.set("tableName", om.valueToTree(this.getTableName()));
            if (this.getCatalogId() != null) {
                data.set("catalogId", om.valueToTree(this.getCatalogId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueDataQualityRuleset.GlueDataQualityRulesetTargetTable"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueDataQualityRulesetTargetTable.Jsii$Proxy that = (GlueDataQualityRulesetTargetTable.Jsii$Proxy) o;

            if (!databaseName.equals(that.databaseName)) return false;
            if (!tableName.equals(that.tableName)) return false;
            return this.catalogId != null ? this.catalogId.equals(that.catalogId) : that.catalogId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.databaseName.hashCode();
            result = 31 * result + (this.tableName.hashCode());
            result = 31 * result + (this.catalogId != null ? this.catalogId.hashCode() : 0);
            return result;
        }
    }
}
