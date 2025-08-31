package imports.aws.appfabric_ingestion_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.996Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appfabricIngestionDestination.AppfabricIngestionDestinationProcessingConfigurationAuditLog")
@software.amazon.jsii.Jsii.Proxy(AppfabricIngestionDestinationProcessingConfigurationAuditLog.Jsii$Proxy.class)
public interface AppfabricIngestionDestinationProcessingConfigurationAuditLog extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#format AppfabricIngestionDestination#format}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFormat();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#schema AppfabricIngestionDestination#schema}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSchema();

    /**
     * @return a {@link Builder} of {@link AppfabricIngestionDestinationProcessingConfigurationAuditLog}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppfabricIngestionDestinationProcessingConfigurationAuditLog}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppfabricIngestionDestinationProcessingConfigurationAuditLog> {
        java.lang.String format;
        java.lang.String schema;

        /**
         * Sets the value of {@link AppfabricIngestionDestinationProcessingConfigurationAuditLog#getFormat}
         * @param format Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#format AppfabricIngestionDestination#format}. This parameter is required.
         * @return {@code this}
         */
        public Builder format(java.lang.String format) {
            this.format = format;
            return this;
        }

        /**
         * Sets the value of {@link AppfabricIngestionDestinationProcessingConfigurationAuditLog#getSchema}
         * @param schema Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#schema AppfabricIngestionDestination#schema}. This parameter is required.
         * @return {@code this}
         */
        public Builder schema(java.lang.String schema) {
            this.schema = schema;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppfabricIngestionDestinationProcessingConfigurationAuditLog}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppfabricIngestionDestinationProcessingConfigurationAuditLog build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppfabricIngestionDestinationProcessingConfigurationAuditLog}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppfabricIngestionDestinationProcessingConfigurationAuditLog {
        private final java.lang.String format;
        private final java.lang.String schema;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.format = software.amazon.jsii.Kernel.get(this, "format", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.schema = software.amazon.jsii.Kernel.get(this, "schema", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.format = java.util.Objects.requireNonNull(builder.format, "format is required");
            this.schema = java.util.Objects.requireNonNull(builder.schema, "schema is required");
        }

        @Override
        public final java.lang.String getFormat() {
            return this.format;
        }

        @Override
        public final java.lang.String getSchema() {
            return this.schema;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("format", om.valueToTree(this.getFormat()));
            data.set("schema", om.valueToTree(this.getSchema()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appfabricIngestionDestination.AppfabricIngestionDestinationProcessingConfigurationAuditLog"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppfabricIngestionDestinationProcessingConfigurationAuditLog.Jsii$Proxy that = (AppfabricIngestionDestinationProcessingConfigurationAuditLog.Jsii$Proxy) o;

            if (!format.equals(that.format)) return false;
            return this.schema.equals(that.schema);
        }

        @Override
        public final int hashCode() {
            int result = this.format.hashCode();
            result = 31 * result + (this.schema.hashCode());
            return result;
        }
    }
}
