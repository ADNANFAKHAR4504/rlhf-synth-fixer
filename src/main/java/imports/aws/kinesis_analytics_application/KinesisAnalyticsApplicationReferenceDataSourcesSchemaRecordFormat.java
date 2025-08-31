package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.448Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat")
@software.amazon.jsii.Jsii.Proxy(KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat.Jsii$Proxy.class)
public interface KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat extends software.amazon.jsii.JsiiSerializable {

    /**
     * mapping_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#mapping_parameters KinesisAnalyticsApplication#mapping_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters getMappingParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat> {
        imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters mappingParameters;

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat#getMappingParameters}
         * @param mappingParameters mapping_parameters block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#mapping_parameters KinesisAnalyticsApplication#mapping_parameters}
         * @return {@code this}
         */
        public Builder mappingParameters(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters mappingParameters) {
            this.mappingParameters = mappingParameters;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat {
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters mappingParameters;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mappingParameters = software.amazon.jsii.Kernel.get(this, "mappingParameters", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mappingParameters = builder.mappingParameters;
        }

        @Override
        public final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters getMappingParameters() {
            return this.mappingParameters;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMappingParameters() != null) {
                data.set("mappingParameters", om.valueToTree(this.getMappingParameters()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat.Jsii$Proxy that = (KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormat.Jsii$Proxy) o;

            return this.mappingParameters != null ? this.mappingParameters.equals(that.mappingParameters) : that.mappingParameters == null;
        }

        @Override
        public final int hashCode() {
            int result = this.mappingParameters != null ? this.mappingParameters.hashCode() : 0;
            return result;
        }
    }
}
