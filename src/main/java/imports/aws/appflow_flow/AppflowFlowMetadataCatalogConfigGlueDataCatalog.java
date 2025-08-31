package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowMetadataCatalogConfigGlueDataCatalog")
@software.amazon.jsii.Jsii.Proxy(AppflowFlowMetadataCatalogConfigGlueDataCatalog.Jsii$Proxy.class)
public interface AppflowFlowMetadataCatalogConfigGlueDataCatalog extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#database_name AppflowFlow#database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#role_arn AppflowFlow#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#table_prefix AppflowFlow#table_prefix}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTablePrefix();

    /**
     * @return a {@link Builder} of {@link AppflowFlowMetadataCatalogConfigGlueDataCatalog}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppflowFlowMetadataCatalogConfigGlueDataCatalog}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppflowFlowMetadataCatalogConfigGlueDataCatalog> {
        java.lang.String databaseName;
        java.lang.String roleArn;
        java.lang.String tablePrefix;

        /**
         * Sets the value of {@link AppflowFlowMetadataCatalogConfigGlueDataCatalog#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#database_name AppflowFlow#database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowMetadataCatalogConfigGlueDataCatalog#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#role_arn AppflowFlow#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link AppflowFlowMetadataCatalogConfigGlueDataCatalog#getTablePrefix}
         * @param tablePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appflow_flow#table_prefix AppflowFlow#table_prefix}. This parameter is required.
         * @return {@code this}
         */
        public Builder tablePrefix(java.lang.String tablePrefix) {
            this.tablePrefix = tablePrefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppflowFlowMetadataCatalogConfigGlueDataCatalog}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppflowFlowMetadataCatalogConfigGlueDataCatalog build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppflowFlowMetadataCatalogConfigGlueDataCatalog}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppflowFlowMetadataCatalogConfigGlueDataCatalog {
        private final java.lang.String databaseName;
        private final java.lang.String roleArn;
        private final java.lang.String tablePrefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tablePrefix = software.amazon.jsii.Kernel.get(this, "tablePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.databaseName = java.util.Objects.requireNonNull(builder.databaseName, "databaseName is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.tablePrefix = java.util.Objects.requireNonNull(builder.tablePrefix, "tablePrefix is required");
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getTablePrefix() {
            return this.tablePrefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            data.set("tablePrefix", om.valueToTree(this.getTablePrefix()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appflowFlow.AppflowFlowMetadataCatalogConfigGlueDataCatalog"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppflowFlowMetadataCatalogConfigGlueDataCatalog.Jsii$Proxy that = (AppflowFlowMetadataCatalogConfigGlueDataCatalog.Jsii$Proxy) o;

            if (!databaseName.equals(that.databaseName)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            return this.tablePrefix.equals(that.tablePrefix);
        }

        @Override
        public final int hashCode() {
            int result = this.databaseName.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.tablePrefix.hashCode());
            return result;
        }
    }
}
