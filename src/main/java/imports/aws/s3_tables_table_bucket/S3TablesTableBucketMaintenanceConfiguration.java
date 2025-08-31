package imports.aws.s3_tables_table_bucket;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.294Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3TablesTableBucket.S3TablesTableBucketMaintenanceConfiguration")
@software.amazon.jsii.Jsii.Proxy(S3TablesTableBucketMaintenanceConfiguration.Jsii$Proxy.class)
public interface S3TablesTableBucketMaintenanceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table_bucket#iceberg_unreferenced_file_removal S3TablesTableBucket#iceberg_unreferenced_file_removal}.
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_tables_table_bucket.S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemoval getIcebergUnreferencedFileRemoval() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3TablesTableBucketMaintenanceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3TablesTableBucketMaintenanceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3TablesTableBucketMaintenanceConfiguration> {
        imports.aws.s3_tables_table_bucket.S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemoval icebergUnreferencedFileRemoval;

        /**
         * Sets the value of {@link S3TablesTableBucketMaintenanceConfiguration#getIcebergUnreferencedFileRemoval}
         * @param icebergUnreferencedFileRemoval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table_bucket#iceberg_unreferenced_file_removal S3TablesTableBucket#iceberg_unreferenced_file_removal}.
         * @return {@code this}
         */
        public Builder icebergUnreferencedFileRemoval(imports.aws.s3_tables_table_bucket.S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemoval icebergUnreferencedFileRemoval) {
            this.icebergUnreferencedFileRemoval = icebergUnreferencedFileRemoval;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3TablesTableBucketMaintenanceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3TablesTableBucketMaintenanceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3TablesTableBucketMaintenanceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3TablesTableBucketMaintenanceConfiguration {
        private final imports.aws.s3_tables_table_bucket.S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemoval icebergUnreferencedFileRemoval;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.icebergUnreferencedFileRemoval = software.amazon.jsii.Kernel.get(this, "icebergUnreferencedFileRemoval", software.amazon.jsii.NativeType.forClass(imports.aws.s3_tables_table_bucket.S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemoval.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.icebergUnreferencedFileRemoval = builder.icebergUnreferencedFileRemoval;
        }

        @Override
        public final imports.aws.s3_tables_table_bucket.S3TablesTableBucketMaintenanceConfigurationIcebergUnreferencedFileRemoval getIcebergUnreferencedFileRemoval() {
            return this.icebergUnreferencedFileRemoval;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIcebergUnreferencedFileRemoval() != null) {
                data.set("icebergUnreferencedFileRemoval", om.valueToTree(this.getIcebergUnreferencedFileRemoval()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3TablesTableBucket.S3TablesTableBucketMaintenanceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3TablesTableBucketMaintenanceConfiguration.Jsii$Proxy that = (S3TablesTableBucketMaintenanceConfiguration.Jsii$Proxy) o;

            return this.icebergUnreferencedFileRemoval != null ? this.icebergUnreferencedFileRemoval.equals(that.icebergUnreferencedFileRemoval) : that.icebergUnreferencedFileRemoval == null;
        }

        @Override
        public final int hashCode() {
            int result = this.icebergUnreferencedFileRemoval != null ? this.icebergUnreferencedFileRemoval.hashCode() : 0;
            return result;
        }
    }
}
