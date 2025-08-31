package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.448Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson")
@software.amazon.jsii.Jsii.Proxy(KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson.Jsii$Proxy.class)
public interface KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#record_row_path KinesisAnalyticsApplication#record_row_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRecordRowPath();

    /**
     * @return a {@link Builder} of {@link KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson> {
        java.lang.String recordRowPath;

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson#getRecordRowPath}
         * @param recordRowPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#record_row_path KinesisAnalyticsApplication#record_row_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder recordRowPath(java.lang.String recordRowPath) {
            this.recordRowPath = recordRowPath;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson {
        private final java.lang.String recordRowPath;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.recordRowPath = software.amazon.jsii.Kernel.get(this, "recordRowPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.recordRowPath = java.util.Objects.requireNonNull(builder.recordRowPath, "recordRowPath is required");
        }

        @Override
        public final java.lang.String getRecordRowPath() {
            return this.recordRowPath;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("recordRowPath", om.valueToTree(this.getRecordRowPath()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson.Jsii$Proxy that = (KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson.Jsii$Proxy) o;

            return this.recordRowPath.equals(that.recordRowPath);
        }

        @Override
        public final int hashCode() {
            int result = this.recordRowPath.hashCode();
            return result;
        }
    }
}
