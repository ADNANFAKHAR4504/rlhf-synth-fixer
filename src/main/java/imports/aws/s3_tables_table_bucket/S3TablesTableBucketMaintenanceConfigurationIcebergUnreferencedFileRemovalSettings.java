package imports.aws.s3_tables_table_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.294Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3TablesTableBucket.S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettings")
@software.amazon.jsii.Jsii.Proxy(S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettings.Jsii$Proxy.class)
public interface S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table_bucket#non_current_days S3TablesTableBucket#non_current_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNonCurrentDays() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table_bucket#unreferenced_days S3TablesTableBucket#unreferenced_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getUnreferencedDays() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettings> {
        java.lang.Number nonCurrentDays;
        java.lang.Number unreferencedDays;

        /**
         * Sets the value of {@link S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettings#getNonCurrentDays}
         * @param nonCurrentDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table_bucket#non_current_days S3TablesTableBucket#non_current_days}.
         * @return {@code this}
         */
        public Builder nonCurrentDays(java.lang.Number nonCurrentDays) {
            this.nonCurrentDays = nonCurrentDays;
            return this;
        }

        /**
         * Sets the value of {@link S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettings#getUnreferencedDays}
         * @param unreferencedDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table_bucket#unreferenced_days S3TablesTableBucket#unreferenced_days}.
         * @return {@code this}
         */
        public Builder unreferencedDays(java.lang.Number unreferencedDays) {
            this.unreferencedDays = unreferencedDays;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettings {
        private final java.lang.Number nonCurrentDays;
        private final java.lang.Number unreferencedDays;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.nonCurrentDays = software.amazon.jsii.Kernel.get(this, "nonCurrentDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.unreferencedDays = software.amazon.jsii.Kernel.get(this, "unreferencedDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.nonCurrentDays = builder.nonCurrentDays;
            this.unreferencedDays = builder.unreferencedDays;
        }

        @Override
        public final java.lang.Number getNonCurrentDays() {
            return this.nonCurrentDays;
        }

        @Override
        public final java.lang.Number getUnreferencedDays() {
            return this.unreferencedDays;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNonCurrentDays() != null) {
                data.set("nonCurrentDays", om.valueToTree(this.getNonCurrentDays()));
            }
            if (this.getUnreferencedDays() != null) {
                data.set("unreferencedDays", om.valueToTree(this.getUnreferencedDays()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3TablesTableBucket.S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettings.Jsii$Proxy that = (S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemovalSettings.Jsii$Proxy) o;

            if (this.nonCurrentDays != null ? !this.nonCurrentDays.equals(that.nonCurrentDays) : that.nonCurrentDays != null) return false;
            return this.unreferencedDays != null ? this.unreferencedDays.equals(that.unreferencedDays) : that.unreferencedDays == null;
        }

        @Override
        public final int hashCode() {
            int result = this.nonCurrentDays != null ? this.nonCurrentDays.hashCode() : 0;
            result = 31 * result + (this.unreferencedDays != null ? this.unreferencedDays.hashCode() : 0);
            return result;
        }
    }
}
