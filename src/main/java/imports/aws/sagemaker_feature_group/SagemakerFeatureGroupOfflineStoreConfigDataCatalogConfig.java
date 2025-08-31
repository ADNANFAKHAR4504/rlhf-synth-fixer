package imports.aws.sagemaker_feature_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.324Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFeatureGroup.SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig.Jsii$Proxy.class)
public interface SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#catalog SagemakerFeatureGroup#catalog}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCatalog() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#database SagemakerFeatureGroup#database}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatabase() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#table_name SagemakerFeatureGroup#table_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTableName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig> {
        java.lang.String catalog;
        java.lang.String database;
        java.lang.String tableName;

        /**
         * Sets the value of {@link SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig#getCatalog}
         * @param catalog Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#catalog SagemakerFeatureGroup#catalog}.
         * @return {@code this}
         */
        public Builder catalog(java.lang.String catalog) {
            this.catalog = catalog;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig#getDatabase}
         * @param database Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#database SagemakerFeatureGroup#database}.
         * @return {@code this}
         */
        public Builder database(java.lang.String database) {
            this.database = database;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig#getTableName}
         * @param tableName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_feature_group#table_name SagemakerFeatureGroup#table_name}.
         * @return {@code this}
         */
        public Builder tableName(java.lang.String tableName) {
            this.tableName = tableName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig {
        private final java.lang.String catalog;
        private final java.lang.String database;
        private final java.lang.String tableName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.catalog = software.amazon.jsii.Kernel.get(this, "catalog", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.database = software.amazon.jsii.Kernel.get(this, "database", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tableName = software.amazon.jsii.Kernel.get(this, "tableName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.catalog = builder.catalog;
            this.database = builder.database;
            this.tableName = builder.tableName;
        }

        @Override
        public final java.lang.String getCatalog() {
            return this.catalog;
        }

        @Override
        public final java.lang.String getDatabase() {
            return this.database;
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

            if (this.getCatalog() != null) {
                data.set("catalog", om.valueToTree(this.getCatalog()));
            }
            if (this.getDatabase() != null) {
                data.set("database", om.valueToTree(this.getDatabase()));
            }
            if (this.getTableName() != null) {
                data.set("tableName", om.valueToTree(this.getTableName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerFeatureGroup.SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig.Jsii$Proxy that = (SagemakerFeatureGroupOfflineStoreConfigDataCatalogConfig.Jsii$Proxy) o;

            if (this.catalog != null ? !this.catalog.equals(that.catalog) : that.catalog != null) return false;
            if (this.database != null ? !this.database.equals(that.database) : that.database != null) return false;
            return this.tableName != null ? this.tableName.equals(that.tableName) : that.tableName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.catalog != null ? this.catalog.hashCode() : 0;
            result = 31 * result + (this.database != null ? this.database.hashCode() : 0);
            result = 31 * result + (this.tableName != null ? this.tableName.hashCode() : 0);
            return result;
        }
    }
}
