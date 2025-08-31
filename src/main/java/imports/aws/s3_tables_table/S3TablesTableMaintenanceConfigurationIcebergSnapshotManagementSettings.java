package imports.aws.s3_tables_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.294Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3TablesTable.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings")
@software.amazon.jsii.Jsii.Proxy(S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings.Jsii$Proxy.class)
public interface S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#max_snapshot_age_hours S3TablesTable#max_snapshot_age_hours}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxSnapshotAgeHours() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#min_snapshots_to_keep S3TablesTable#min_snapshots_to_keep}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinSnapshotsToKeep() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings> {
        java.lang.Number maxSnapshotAgeHours;
        java.lang.Number minSnapshotsToKeep;

        /**
         * Sets the value of {@link S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings#getMaxSnapshotAgeHours}
         * @param maxSnapshotAgeHours Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#max_snapshot_age_hours S3TablesTable#max_snapshot_age_hours}.
         * @return {@code this}
         */
        public Builder maxSnapshotAgeHours(java.lang.Number maxSnapshotAgeHours) {
            this.maxSnapshotAgeHours = maxSnapshotAgeHours;
            return this;
        }

        /**
         * Sets the value of {@link S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings#getMinSnapshotsToKeep}
         * @param minSnapshotsToKeep Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#min_snapshots_to_keep S3TablesTable#min_snapshots_to_keep}.
         * @return {@code this}
         */
        public Builder minSnapshotsToKeep(java.lang.Number minSnapshotsToKeep) {
            this.minSnapshotsToKeep = minSnapshotsToKeep;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings {
        private final java.lang.Number maxSnapshotAgeHours;
        private final java.lang.Number minSnapshotsToKeep;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxSnapshotAgeHours = software.amazon.jsii.Kernel.get(this, "maxSnapshotAgeHours", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minSnapshotsToKeep = software.amazon.jsii.Kernel.get(this, "minSnapshotsToKeep", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxSnapshotAgeHours = builder.maxSnapshotAgeHours;
            this.minSnapshotsToKeep = builder.minSnapshotsToKeep;
        }

        @Override
        public final java.lang.Number getMaxSnapshotAgeHours() {
            return this.maxSnapshotAgeHours;
        }

        @Override
        public final java.lang.Number getMinSnapshotsToKeep() {
            return this.minSnapshotsToKeep;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMaxSnapshotAgeHours() != null) {
                data.set("maxSnapshotAgeHours", om.valueToTree(this.getMaxSnapshotAgeHours()));
            }
            if (this.getMinSnapshotsToKeep() != null) {
                data.set("minSnapshotsToKeep", om.valueToTree(this.getMinSnapshotsToKeep()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3TablesTable.S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings.Jsii$Proxy that = (S3TablesTableMaintenanceConfigurationIcebergSnapshotManagementSettings.Jsii$Proxy) o;

            if (this.maxSnapshotAgeHours != null ? !this.maxSnapshotAgeHours.equals(that.maxSnapshotAgeHours) : that.maxSnapshotAgeHours != null) return false;
            return this.minSnapshotsToKeep != null ? this.minSnapshotsToKeep.equals(that.minSnapshotsToKeep) : that.minSnapshotsToKeep == null;
        }

        @Override
        public final int hashCode() {
            int result = this.maxSnapshotAgeHours != null ? this.maxSnapshotAgeHours.hashCode() : 0;
            result = 31 * result + (this.minSnapshotsToKeep != null ? this.minSnapshotsToKeep.hashCode() : 0);
            return result;
        }
    }
}
