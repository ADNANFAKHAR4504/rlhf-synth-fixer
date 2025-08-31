package imports.aws.appfabric_ingestion_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.995Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appfabricIngestionDestination.AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination")
@software.amazon.jsii.Jsii.Proxy(AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination.Jsii$Proxy.class)
public interface AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * firehose_stream block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#firehose_stream AppfabricIngestionDestination#firehose_stream}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFirehoseStream() {
        return null;
    }

    /**
     * s3_bucket block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#s3_bucket AppfabricIngestionDestination#s3_bucket}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getS3Bucket() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination> {
        java.lang.Object firehoseStream;
        java.lang.Object s3Bucket;

        /**
         * Sets the value of {@link AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination#getFirehoseStream}
         * @param firehoseStream firehose_stream block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#firehose_stream AppfabricIngestionDestination#firehose_stream}
         * @return {@code this}
         */
        public Builder firehoseStream(com.hashicorp.cdktf.IResolvable firehoseStream) {
            this.firehoseStream = firehoseStream;
            return this;
        }

        /**
         * Sets the value of {@link AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination#getFirehoseStream}
         * @param firehoseStream firehose_stream block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#firehose_stream AppfabricIngestionDestination#firehose_stream}
         * @return {@code this}
         */
        public Builder firehoseStream(java.util.List<? extends imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationFirehoseStream> firehoseStream) {
            this.firehoseStream = firehoseStream;
            return this;
        }

        /**
         * Sets the value of {@link AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination#getS3Bucket}
         * @param s3Bucket s3_bucket block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#s3_bucket AppfabricIngestionDestination#s3_bucket}
         * @return {@code this}
         */
        public Builder s3Bucket(com.hashicorp.cdktf.IResolvable s3Bucket) {
            this.s3Bucket = s3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination#getS3Bucket}
         * @param s3Bucket s3_bucket block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#s3_bucket AppfabricIngestionDestination#s3_bucket}
         * @return {@code this}
         */
        public Builder s3Bucket(java.util.List<? extends imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationDestinationConfigurationAuditLogDestinationS3Bucket> s3Bucket) {
            this.s3Bucket = s3Bucket;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination {
        private final java.lang.Object firehoseStream;
        private final java.lang.Object s3Bucket;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.firehoseStream = software.amazon.jsii.Kernel.get(this, "firehoseStream", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.s3Bucket = software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.firehoseStream = builder.firehoseStream;
            this.s3Bucket = builder.s3Bucket;
        }

        @Override
        public final java.lang.Object getFirehoseStream() {
            return this.firehoseStream;
        }

        @Override
        public final java.lang.Object getS3Bucket() {
            return this.s3Bucket;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFirehoseStream() != null) {
                data.set("firehoseStream", om.valueToTree(this.getFirehoseStream()));
            }
            if (this.getS3Bucket() != null) {
                data.set("s3Bucket", om.valueToTree(this.getS3Bucket()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appfabricIngestionDestination.AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination.Jsii$Proxy that = (AppfabricIngestionDestinationDestinationConfigurationAuditLogDestination.Jsii$Proxy) o;

            if (this.firehoseStream != null ? !this.firehoseStream.equals(that.firehoseStream) : that.firehoseStream != null) return false;
            return this.s3Bucket != null ? this.s3Bucket.equals(that.s3Bucket) : that.s3Bucket == null;
        }

        @Override
        public final int hashCode() {
            int result = this.firehoseStream != null ? this.firehoseStream.hashCode() : 0;
            result = 31 * result + (this.s3Bucket != null ? this.s3Bucket.hashCode() : 0);
            return result;
        }
    }
}
