package imports.aws.appfabric_ingestion_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.995Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appfabricIngestionDestination.AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationS3Bucket")
@software.amazon.jsii.Jsii.Proxy(AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationS3Bucket.Jsii$Proxy.class)
public interface AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationS3Bucket extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#bucket_name AppfabricIngestionDestination#bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#prefix AppfabricIngestionDestination#prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefix() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationS3Bucket}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationS3Bucket}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationS3Bucket> {
        java.lang.String bucketName;
        java.lang.String prefix;

        /**
         * Sets the value of {@link AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationS3Bucket#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#bucket_name AppfabricIngestionDestination#bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationS3Bucket#getPrefix}
         * @param prefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#prefix AppfabricIngestionDestination#prefix}.
         * @return {@code this}
         */
        public Builder prefix(java.lang.String prefix) {
            this.prefix = prefix;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationS3Bucket}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationS3Bucket build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationS3Bucket}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationS3Bucket {
        private final java.lang.String bucketName;
        private final java.lang.String prefix;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.prefix = software.amazon.jsii.Kernel.get(this, "prefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = java.util.Objects.requireNonNull(builder.bucketName, "bucketName is required");
            this.prefix = builder.prefix;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getPrefix() {
            return this.prefix;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketName", om.valueToTree(this.getBucketName()));
            if (this.getPrefix() != null) {
                data.set("prefix", om.valueToTree(this.getPrefix()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appfabricIngestionDestination.AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationS3Bucket"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationS3Bucket.Jsii$Proxy that = (AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationS3Bucket.Jsii$Proxy) o;

            if (!bucketName.equals(that.bucketName)) return false;
            return this.prefix != null ? this.prefix.equals(that.prefix) : that.prefix == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName.hashCode();
            result = 31 * result + (this.prefix != null ? this.prefix.hashCode() : 0);
            return result;
        }
    }
}
