package imports.aws.s3_tables_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.294Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3TablesTable.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement")
@software.amazon.jsii.Jsii.Proxy(S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement.Jsii$Proxy.class)
public interface S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#settings S3TablesTable#settings}.
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings getSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#status S3TablesTable#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement> {
        imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings settings;
        java.lang.String status;

        /**
         * Sets the value of {@link S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement#getSettings}
         * @param settings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#settings S3TablesTable#settings}.
         * @return {@code this}
         */
        public Builder settings(imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings settings) {
            this.settings = settings;
            return this;
        }

        /**
         * Sets the value of {@link S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#status S3TablesTable#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement {
        private final imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings settings;
        private final java.lang.String status;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.settings = software.amazon.jsii.Kernel.get(this, "settings", software.amazon.jsii.NativeType.forClass(imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.settings = builder.settings;
            this.status = builder.status;
        }

        @Override
        public final imports.aws.s3_tables_table.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings getSettings() {
            return this.settings;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSettings() != null) {
                data.set("settings", om.valueToTree(this.getSettings()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3TablesTable.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement.Jsii$Proxy that = (S3TablesTableMaintenanceConfigurationIcebergSnapshotManagement.Jsii$Proxy) o;

            if (this.settings != null ? !this.settings.equals(that.settings) : that.settings != null) return false;
            return this.status != null ? this.status.equals(that.status) : that.status == null;
        }

        @Override
        public final int hashCode() {
            int result = this.settings != null ? this.settings.hashCode() : 0;
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            return result;
        }
    }
}
