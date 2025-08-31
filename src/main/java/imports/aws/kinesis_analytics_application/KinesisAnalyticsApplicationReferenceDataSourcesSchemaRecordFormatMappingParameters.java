package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.448Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters")
@software.amazon.jsii.Jsii.Proxy(KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters.Jsii$Proxy.class)
public interface KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * csv block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#csv KinesisAnalyticsApplication#csv}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersCsv getCsv() {
        return null;
    }

    /**
     * json block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#json KinesisAnalyticsApplication#json}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson getJson() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters> {
        imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersCsv csv;
        imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson json;

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters#getCsv}
         * @param csv csv block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#csv KinesisAnalyticsApplication#csv}
         * @return {@code this}
         */
        public Builder csv(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersCsv csv) {
            this.csv = csv;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters#getJson}
         * @param json json block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#json KinesisAnalyticsApplication#json}
         * @return {@code this}
         */
        public Builder json(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson json) {
            this.json = json;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters {
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersCsv csv;
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson json;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.csv = software.amazon.jsii.Kernel.get(this, "csv", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersCsv.class));
            this.json = software.amazon.jsii.Kernel.get(this, "json", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.csv = builder.csv;
            this.json = builder.json;
        }

        @Override
        public final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersCsv getCsv() {
            return this.csv;
        }

        @Override
        public final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParametersJson getJson() {
            return this.json;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCsv() != null) {
                data.set("csv", om.valueToTree(this.getCsv()));
            }
            if (this.getJson() != null) {
                data.set("json", om.valueToTree(this.getJson()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters.Jsii$Proxy that = (KinesisAnalyticsApplicationReferenceDataSourcesSchemaRecordFormatMappingParameters.Jsii$Proxy) o;

            if (this.csv != null ? !this.csv.equals(that.csv) : that.csv != null) return false;
            return this.json != null ? this.json.equals(that.json) : that.json == null;
        }

        @Override
        public final int hashCode() {
            int result = this.csv != null ? this.csv.hashCode() : 0;
            result = 31 * result + (this.json != null ? this.json.hashCode() : 0);
            return result;
        }
    }
}
