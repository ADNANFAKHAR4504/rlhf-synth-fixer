package imports.aws.s3_tables_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.293Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3TablesTable.S3TablesTableMaintenanceConfigurationIcebergCompactionSettings")
@software.amazon.jsii.Jsii.Proxy(S3TablesTableMaintenanceConfigurationIcebergCompactionSettings.Jsii$Proxy.class)
public interface S3TablesTableMaintenanceConfigurationIcebergCompactionSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#target_file_size_mb S3TablesTable#target_file_size_mb}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTargetFileSizeMb() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3TablesTableMaintenanceConfigurationIcebergCompactionSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3TablesTableMaintenanceConfigurationIcebergCompactionSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3TablesTableMaintenanceConfigurationIcebergCompactionSettings> {
        java.lang.Number targetFileSizeMb;

        /**
         * Sets the value of {@link S3TablesTableMaintenanceConfigurationIcebergCompactionSettings#getTargetFileSizeMb}
         * @param targetFileSizeMb Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3tables_table#target_file_size_mb S3TablesTable#target_file_size_mb}.
         * @return {@code this}
         */
        public Builder targetFileSizeMb(java.lang.Number targetFileSizeMb) {
            this.targetFileSizeMb = targetFileSizeMb;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3TablesTableMaintenanceConfigurationIcebergCompactionSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3TablesTableMaintenanceConfigurationIcebergCompactionSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3TablesTableMaintenanceConfigurationIcebergCompactionSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3TablesTableMaintenanceConfigurationIcebergCompactionSettings {
        private final java.lang.Number targetFileSizeMb;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetFileSizeMb = software.amazon.jsii.Kernel.get(this, "targetFileSizeMb", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetFileSizeMb = builder.targetFileSizeMb;
        }

        @Override
        public final java.lang.Number getTargetFileSizeMb() {
            return this.targetFileSizeMb;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTargetFileSizeMb() != null) {
                data.set("targetFileSizeMb", om.valueToTree(this.getTargetFileSizeMb()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3TablesTable.S3TablesTableMaintenanceConfigurationIcebergCompactionSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3TablesTableMaintenanceConfigurationIcebergCompactionSettings.Jsii$Proxy that = (S3TablesTableMaintenanceConfigurationIcebergCompactionSettings.Jsii$Proxy) o;

            return this.targetFileSizeMb != null ? this.targetFileSizeMb.equals(that.targetFileSizeMb) : that.targetFileSizeMb == null;
        }

        @Override
        public final int hashCode() {
            int result = this.targetFileSizeMb != null ? this.targetFileSizeMb.hashCode() : 0;
            return result;
        }
    }
}
