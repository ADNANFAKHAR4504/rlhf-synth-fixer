package imports.aws.s3_bucket_analytics_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.250Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketAnalyticsConfiguration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport")
@software.amazon.jsii.Jsii.Proxy(S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport.Jsii$Proxy.class)
public interface S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport extends software.amazon.jsii.JsiiSerializable {

    /**
     * destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_analytics_configuration#destination S3BucketAnalyticsConfiguration#destination}
     */
    @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestination getDestination();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_analytics_configuration#output_schema_version S3BucketAnalyticsConfiguration#output_schema_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutputSchemaVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport> {
        imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestination destination;
        java.lang.String outputSchemaVersion;

        /**
         * Sets the value of {@link S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport#getDestination}
         * @param destination destination block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_analytics_configuration#destination S3BucketAnalyticsConfiguration#destination}
         * @return {@code this}
         */
        public Builder destination(imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestination destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport#getOutputSchemaVersion}
         * @param outputSchemaVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_analytics_configuration#output_schema_version S3BucketAnalyticsConfiguration#output_schema_version}.
         * @return {@code this}
         */
        public Builder outputSchemaVersion(java.lang.String outputSchemaVersion) {
            this.outputSchemaVersion = outputSchemaVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport {
        private final imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestination destination;
        private final java.lang.String outputSchemaVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destination = software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestination.class));
            this.outputSchemaVersion = software.amazon.jsii.Kernel.get(this, "outputSchemaVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destination = java.util.Objects.requireNonNull(builder.destination, "destination is required");
            this.outputSchemaVersion = builder.outputSchemaVersion;
        }

        @Override
        public final imports.aws.s3_bucket_analytics_configuration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExportDestination getDestination() {
            return this.destination;
        }

        @Override
        public final java.lang.String getOutputSchemaVersion() {
            return this.outputSchemaVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("destination", om.valueToTree(this.getDestination()));
            if (this.getOutputSchemaVersion() != null) {
                data.set("outputSchemaVersion", om.valueToTree(this.getOutputSchemaVersion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketAnalyticsConfiguration.S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport.Jsii$Proxy that = (S3BucketAnalyticsConfigurationStorageClassAnalysisDataExport.Jsii$Proxy) o;

            if (!destination.equals(that.destination)) return false;
            return this.outputSchemaVersion != null ? this.outputSchemaVersion.equals(that.outputSchemaVersion) : that.outputSchemaVersion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.destination.hashCode();
            result = 31 * result + (this.outputSchemaVersion != null ? this.outputSchemaVersion.hashCode() : 0);
            return result;
        }
    }
}
