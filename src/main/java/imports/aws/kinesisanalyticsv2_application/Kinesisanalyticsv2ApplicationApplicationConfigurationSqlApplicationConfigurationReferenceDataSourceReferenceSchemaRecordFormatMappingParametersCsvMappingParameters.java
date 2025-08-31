package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.475Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationReferenceDataSourceReferenceSchemaRecordFormatMappingParametersCsvMappingParameters")
@software.amazon.jsii.Jsii.Proxy(Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationReferenceDataSourceReferenceSchemaRecordFormatMappingParametersCsvMappingParameters.Jsii$Proxy.class)
public interface Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationReferenceDataSourceReferenceSchemaRecordFormatMappingParametersCsvMappingParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#record_column_delimiter Kinesisanalyticsv2Application#record_column_delimiter}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRecordColumnDelimiter();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#record_row_delimiter Kinesisanalyticsv2Application#record_row_delimiter}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRecordRowDelimiter();

    /**
     * @return a {@link Builder} of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationReferenceDataSourceReferenceSchemaRecordFormatMappingParametersCsvMappingParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationReferenceDataSourceReferenceSchemaRecordFormatMappingParametersCsvMappingParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationReferenceDataSourceReferenceSchemaRecordFormatMappingParametersCsvMappingParameters> {
        java.lang.String recordColumnDelimiter;
        java.lang.String recordRowDelimiter;

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationReferenceDataSourceReferenceSchemaRecordFormatMappingParametersCsvMappingParameters#getRecordColumnDelimiter}
         * @param recordColumnDelimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#record_column_delimiter Kinesisanalyticsv2Application#record_column_delimiter}. This parameter is required.
         * @return {@code this}
         */
        public Builder recordColumnDelimiter(java.lang.String recordColumnDelimiter) {
            this.recordColumnDelimiter = recordColumnDelimiter;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationReferenceDataSourceReferenceSchemaRecordFormatMappingParametersCsvMappingParameters#getRecordRowDelimiter}
         * @param recordRowDelimiter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#record_row_delimiter Kinesisanalyticsv2Application#record_row_delimiter}. This parameter is required.
         * @return {@code this}
         */
        public Builder recordRowDelimiter(java.lang.String recordRowDelimiter) {
            this.recordRowDelimiter = recordRowDelimiter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationReferenceDataSourceReferenceSchemaRecordFormatMappingParametersCsvMappingParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationReferenceDataSourceReferenceSchemaRecordFormatMappingParametersCsvMappingParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationReferenceDataSourceReferenceSchemaRecordFormatMappingParametersCsvMappingParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationReferenceDataSourceReferenceSchemaRecordFormatMappingParametersCsvMappingParameters {
        private final java.lang.String recordColumnDelimiter;
        private final java.lang.String recordRowDelimiter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.recordColumnDelimiter = software.amazon.jsii.Kernel.get(this, "recordColumnDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.recordRowDelimiter = software.amazon.jsii.Kernel.get(this, "recordRowDelimiter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.recordColumnDelimiter = java.util.Objects.requireNonNull(builder.recordColumnDelimiter, "recordColumnDelimiter is required");
            this.recordRowDelimiter = java.util.Objects.requireNonNull(builder.recordRowDelimiter, "recordRowDelimiter is required");
        }

        @Override
        public final java.lang.String getRecordColumnDelimiter() {
            return this.recordColumnDelimiter;
        }

        @Override
        public final java.lang.String getRecordRowDelimiter() {
            return this.recordRowDelimiter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("recordColumnDelimiter", om.valueToTree(this.getRecordColumnDelimiter()));
            data.set("recordRowDelimiter", om.valueToTree(this.getRecordRowDelimiter()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationReferenceDataSourceReferenceSchemaRecordFormatMappingParametersCsvMappingParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationReferenceDataSourceReferenceSchemaRecordFormatMappingParametersCsvMappingParameters.Jsii$Proxy that = (Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationReferenceDataSourceReferenceSchemaRecordFormatMappingParametersCsvMappingParameters.Jsii$Proxy) o;

            if (!recordColumnDelimiter.equals(that.recordColumnDelimiter)) return false;
            return this.recordRowDelimiter.equals(that.recordRowDelimiter);
        }

        @Override
        public final int hashCode() {
            int result = this.recordColumnDelimiter.hashCode();
            result = 31 * result + (this.recordRowDelimiter.hashCode());
            return result;
        }
    }
}
