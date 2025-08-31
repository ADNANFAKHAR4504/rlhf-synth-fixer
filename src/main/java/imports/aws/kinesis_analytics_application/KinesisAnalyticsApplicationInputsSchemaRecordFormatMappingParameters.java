package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.443Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters")
@software.amazon.jsii.Jsii.Proxy(KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters.Jsii$Proxy.class)
public interface KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * csv block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#csv KinesisAnalyticsApplication#csv}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersCsv getCsv() {
        return null;
    }

    /**
     * json block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#json KinesisAnalyticsApplication#json}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersJson getJson() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters> {
        imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersCsv csv;
        imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersJson json;

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters#getCsv}
         * @param csv csv block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#csv KinesisAnalyticsApplication#csv}
         * @return {@code this}
         */
        public Builder csv(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersCsv csv) {
            this.csv = csv;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters#getJson}
         * @param json json block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#json KinesisAnalyticsApplication#json}
         * @return {@code this}
         */
        public Builder json(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersJson json) {
            this.json = json;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters {
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersCsv csv;
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersJson json;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.csv = software.amazon.jsii.Kernel.get(this, "csv", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersCsv.class));
            this.json = software.amazon.jsii.Kernel.get(this, "json", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersJson.class));
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
        public final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersCsv getCsv() {
            return this.csv;
        }

        @Override
        public final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParametersJson getJson() {
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
            struct.set("fqn", om.valueToTree("aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters.Jsii$Proxy that = (KinesisAnalyticsApplicationInputsSchemaRecordFormatMappingParameters.Jsii$Proxy) o;

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
