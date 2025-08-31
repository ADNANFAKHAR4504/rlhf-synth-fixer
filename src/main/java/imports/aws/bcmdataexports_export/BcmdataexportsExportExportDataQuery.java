package imports.aws.bcmdataexports_export;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.137Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bcmdataexportsExport.BcmdataexportsExportExportDataQuery")
@software.amazon.jsii.Jsii.Proxy(BcmdataexportsExportExportDataQuery.Jsii$Proxy.class)
public interface BcmdataexportsExportExportDataQuery extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#query_statement BcmdataexportsExport#query_statement}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getQueryStatement();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#table_configurations BcmdataexportsExport#table_configurations}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTableConfigurations() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BcmdataexportsExportExportDataQuery}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BcmdataexportsExportExportDataQuery}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BcmdataexportsExportExportDataQuery> {
        java.lang.String queryStatement;
        java.lang.Object tableConfigurations;

        /**
         * Sets the value of {@link BcmdataexportsExportExportDataQuery#getQueryStatement}
         * @param queryStatement Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#query_statement BcmdataexportsExport#query_statement}. This parameter is required.
         * @return {@code this}
         */
        public Builder queryStatement(java.lang.String queryStatement) {
            this.queryStatement = queryStatement;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExportDataQuery#getTableConfigurations}
         * @param tableConfigurations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#table_configurations BcmdataexportsExport#table_configurations}.
         * @return {@code this}
         */
        public Builder tableConfigurations(com.hashicorp.cdktf.IResolvable tableConfigurations) {
            this.tableConfigurations = tableConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link BcmdataexportsExportExportDataQuery#getTableConfigurations}
         * @param tableConfigurations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bcmdataexports_export#table_configurations BcmdataexportsExport#table_configurations}.
         * @return {@code this}
         */
        public Builder tableConfigurations(java.util.Map<java.lang.String, ? extends java.util.Map<java.lang.String, java.lang.String>> tableConfigurations) {
            this.tableConfigurations = tableConfigurations;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BcmdataexportsExportExportDataQuery}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BcmdataexportsExportExportDataQuery build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BcmdataexportsExportExportDataQuery}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BcmdataexportsExportExportDataQuery {
        private final java.lang.String queryStatement;
        private final java.lang.Object tableConfigurations;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.queryStatement = software.amazon.jsii.Kernel.get(this, "queryStatement", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tableConfigurations = software.amazon.jsii.Kernel.get(this, "tableConfigurations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.queryStatement = java.util.Objects.requireNonNull(builder.queryStatement, "queryStatement is required");
            this.tableConfigurations = builder.tableConfigurations;
        }

        @Override
        public final java.lang.String getQueryStatement() {
            return this.queryStatement;
        }

        @Override
        public final java.lang.Object getTableConfigurations() {
            return this.tableConfigurations;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("queryStatement", om.valueToTree(this.getQueryStatement()));
            if (this.getTableConfigurations() != null) {
                data.set("tableConfigurations", om.valueToTree(this.getTableConfigurations()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bcmdataexportsExport.BcmdataexportsExportExportDataQuery"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BcmdataexportsExportExportDataQuery.Jsii$Proxy that = (BcmdataexportsExportExportDataQuery.Jsii$Proxy) o;

            if (!queryStatement.equals(that.queryStatement)) return false;
            return this.tableConfigurations != null ? this.tableConfigurations.equals(that.tableConfigurations) : that.tableConfigurations == null;
        }

        @Override
        public final int hashCode() {
            int result = this.queryStatement.hashCode();
            result = 31 * result + (this.tableConfigurations != null ? this.tableConfigurations.hashCode() : 0);
            return result;
        }
    }
}
