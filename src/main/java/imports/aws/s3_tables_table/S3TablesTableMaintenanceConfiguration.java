package imports.aws.s3_tables_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.293Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3TablesTable.S3TablesTableMaintenanceConfiguration")
@software.amazon.jsii.Jsii.Proxy(S3TablesTableMaintenanceConfiguration.Jsii$Proxy.class)
public interface S3TablesTableMaintenanceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#iceberg_compaction S3TablesTable#iceberg_compaction}.
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergCompaction getIcebergCompaction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#iceberg_snapshot_management S3TablesTable#iceberg_snapshot_management}.
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement getIcebergSnapshotManagement() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3TablesTableMaintenanceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3TablesTableMaintenanceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3TablesTableMaintenanceConfiguration> {
        imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergCompaction icebergCompaction;
        imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement icebergSnapshotManagement;

        /**
         * Sets the value of {@link S3TablesTableMaintenanceConfiguration#getIcebergCompaction}
         * @param icebergCompaction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#iceberg_compaction S3TablesTable#iceberg_compaction}.
         * @return {@code this}
         */
        public Builder icebergCompaction(imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergCompaction icebergCompaction) {
            this.icebergCompaction = icebergCompaction;
            return this;
        }

        /**
         * Sets the value of {@link S3TablesTableMaintenanceConfiguration#getIcebergSnapshotManagement}
         * @param icebergSnapshotManagement Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#iceberg_snapshot_management S3TablesTable#iceberg_snapshot_management}.
         * @return {@code this}
         */
        public Builder icebergSnapshotManagement(imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement icebergSnapshotManagement) {
            this.icebergSnapshotManagement = icebergSnapshotManagement;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3TablesTableMaintenanceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3TablesTableMaintenanceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3TablesTableMaintenanceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3TablesTableMaintenanceConfiguration {
        private final imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergCompaction icebergCompaction;
        private final imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement icebergSnapshotManagement;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.icebergCompaction = software.amazon.jsii.Kernel.get(this, "icebergCompaction", software.amazon.jsii.NativeType.forClass(imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergCompaction.class));
            this.icebergSnapshotManagement = software.amazon.jsii.Kernel.get(this, "icebergSnapshotManagement", software.amazon.jsii.NativeType.forClass(imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.icebergCompaction = builder.icebergCompaction;
            this.icebergSnapshotManagement = builder.icebergSnapshotManagement;
        }

        @Override
        public final imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergCompaction getIcebergCompaction() {
            return this.icebergCompaction;
        }

        @Override
        public final imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement getIcebergSnapshotManagement() {
            return this.icebergSnapshotManagement;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIcebergCompaction() != null) {
                data.set("icebergCompaction", om.valueToTree(this.getIcebergCompaction()));
            }
            if (this.getIcebergSnapshotManagement() != null) {
                data.set("icebergSnapshotManagement", om.valueToTree(this.getIcebergSnapshotManagement()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3TablesTable.S3TablesTableMaintenanceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3TablesTableMaintenanceConfiguration.Jsii$Proxy that = (S3TablesTableMaintenanceConfiguration.Jsii$Proxy) o;

            if (this.icebergCompaction != null ? !this.icebergCompaction.equals(that.icebergCompaction) : that.icebergCompaction != null) return false;
            return this.icebergSnapshotManagement != null ? this.icebergSnapshotManagement.equals(that.icebergSnapshotManagement) : that.icebergSnapshotManagement == null;
        }

        @Override
        public final int hashCode() {
            int result = this.icebergCompaction != null ? this.icebergCompaction.hashCode() : 0;
            result = 31 * result + (this.icebergSnapshotManagement != null ? this.icebergSnapshotManagement.hashCode() : 0);
            return result;
        }
    }
}
