package imports.aws.keyspaces_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.441Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.keyspacesTable.KeyspacesTableSchemaDefinition")
@software.amazon.jsii.Jsii.Proxy(KeyspacesTableSchemaDefinition.Jsii$Proxy.class)
public interface KeyspacesTableSchemaDefinition extends software.amazon.jsii.JsiiSerializable {

    /**
     * column block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#column KeyspacesTable#column}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getColumn();

    /**
     * partition_key block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#partition_key KeyspacesTable#partition_key}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getPartitionKey();

    /**
     * clustering_key block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#clustering_key KeyspacesTable#clustering_key}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getClusteringKey() {
        return null;
    }

    /**
     * static_column block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#static_column KeyspacesTable#static_column}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStaticColumn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KeyspacesTableSchemaDefinition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KeyspacesTableSchemaDefinition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KeyspacesTableSchemaDefinition> {
        java.lang.Object column;
        java.lang.Object partitionKey;
        java.lang.Object clusteringKey;
        java.lang.Object staticColumn;

        /**
         * Sets the value of {@link KeyspacesTableSchemaDefinition#getColumn}
         * @param column column block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#column KeyspacesTable#column}
         * @return {@code this}
         */
        public Builder column(com.hashicorp.cdktf.IResolvable column) {
            this.column = column;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableSchemaDefinition#getColumn}
         * @param column column block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#column KeyspacesTable#column}
         * @return {@code this}
         */
        public Builder column(java.util.List<? extends imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionColumn> column) {
            this.column = column;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableSchemaDefinition#getPartitionKey}
         * @param partitionKey partition_key block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#partition_key KeyspacesTable#partition_key}
         * @return {@code this}
         */
        public Builder partitionKey(com.hashicorp.cdktf.IResolvable partitionKey) {
            this.partitionKey = partitionKey;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableSchemaDefinition#getPartitionKey}
         * @param partitionKey partition_key block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#partition_key KeyspacesTable#partition_key}
         * @return {@code this}
         */
        public Builder partitionKey(java.util.List<? extends imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionPartitionKey> partitionKey) {
            this.partitionKey = partitionKey;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableSchemaDefinition#getClusteringKey}
         * @param clusteringKey clustering_key block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#clustering_key KeyspacesTable#clustering_key}
         * @return {@code this}
         */
        public Builder clusteringKey(com.hashicorp.cdktf.IResolvable clusteringKey) {
            this.clusteringKey = clusteringKey;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableSchemaDefinition#getClusteringKey}
         * @param clusteringKey clustering_key block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#clustering_key KeyspacesTable#clustering_key}
         * @return {@code this}
         */
        public Builder clusteringKey(java.util.List<? extends imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionClusteringKey> clusteringKey) {
            this.clusteringKey = clusteringKey;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableSchemaDefinition#getStaticColumn}
         * @param staticColumn static_column block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#static_column KeyspacesTable#static_column}
         * @return {@code this}
         */
        public Builder staticColumn(com.hashicorp.cdktf.IResolvable staticColumn) {
            this.staticColumn = staticColumn;
            return this;
        }

        /**
         * Sets the value of {@link KeyspacesTableSchemaDefinition#getStaticColumn}
         * @param staticColumn static_column block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#static_column KeyspacesTable#static_column}
         * @return {@code this}
         */
        public Builder staticColumn(java.util.List<? extends imports.aws.keyspaces_table.KeyspacesTableSchemaDefinitionStaticColumn> staticColumn) {
            this.staticColumn = staticColumn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KeyspacesTableSchemaDefinition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KeyspacesTableSchemaDefinition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KeyspacesTableSchemaDefinition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KeyspacesTableSchemaDefinition {
        private final java.lang.Object column;
        private final java.lang.Object partitionKey;
        private final java.lang.Object clusteringKey;
        private final java.lang.Object staticColumn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.column = software.amazon.jsii.Kernel.get(this, "column", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.partitionKey = software.amazon.jsii.Kernel.get(this, "partitionKey", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.clusteringKey = software.amazon.jsii.Kernel.get(this, "clusteringKey", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.staticColumn = software.amazon.jsii.Kernel.get(this, "staticColumn", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.column = java.util.Objects.requireNonNull(builder.column, "column is required");
            this.partitionKey = java.util.Objects.requireNonNull(builder.partitionKey, "partitionKey is required");
            this.clusteringKey = builder.clusteringKey;
            this.staticColumn = builder.staticColumn;
        }

        @Override
        public final java.lang.Object getColumn() {
            return this.column;
        }

        @Override
        public final java.lang.Object getPartitionKey() {
            return this.partitionKey;
        }

        @Override
        public final java.lang.Object getClusteringKey() {
            return this.clusteringKey;
        }

        @Override
        public final java.lang.Object getStaticColumn() {
            return this.staticColumn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("column", om.valueToTree(this.getColumn()));
            data.set("partitionKey", om.valueToTree(this.getPartitionKey()));
            if (this.getClusteringKey() != null) {
                data.set("clusteringKey", om.valueToTree(this.getClusteringKey()));
            }
            if (this.getStaticColumn() != null) {
                data.set("staticColumn", om.valueToTree(this.getStaticColumn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.keyspacesTable.KeyspacesTableSchemaDefinition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KeyspacesTableSchemaDefinition.Jsii$Proxy that = (KeyspacesTableSchemaDefinition.Jsii$Proxy) o;

            if (!column.equals(that.column)) return false;
            if (!partitionKey.equals(that.partitionKey)) return false;
            if (this.clusteringKey != null ? !this.clusteringKey.equals(that.clusteringKey) : that.clusteringKey != null) return false;
            return this.staticColumn != null ? this.staticColumn.equals(that.staticColumn) : that.staticColumn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.column.hashCode();
            result = 31 * result + (this.partitionKey.hashCode());
            result = 31 * result + (this.clusteringKey != null ? this.clusteringKey.hashCode() : 0);
            result = 31 * result + (this.staticColumn != null ? this.staticColumn.hashCode() : 0);
            return result;
        }
    }
}
