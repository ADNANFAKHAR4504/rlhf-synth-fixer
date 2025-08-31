package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.447Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationOutputsSchema")
@software.amazon.jsii.Jsii.Proxy(KinesisAnalyticsApplicationOutputsSchema.Jsii$Proxy.class)
public interface KinesisAnalyticsApplicationOutputsSchema extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#record_format_type KinesisAnalyticsApplication#record_format_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRecordFormatType();

    /**
     * @return a {@link Builder} of {@link KinesisAnalyticsApplicationOutputsSchema}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisAnalyticsApplicationOutputsSchema}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisAnalyticsApplicationOutputsSchema> {
        java.lang.String recordFormatType;

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationOutputsSchema#getRecordFormatType}
         * @param recordFormatType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#record_format_type KinesisAnalyticsApplication#record_format_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder recordFormatType(java.lang.String recordFormatType) {
            this.recordFormatType = recordFormatType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisAnalyticsApplicationOutputsSchema}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisAnalyticsApplicationOutputsSchema build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisAnalyticsApplicationOutputsSchema}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisAnalyticsApplicationOutputsSchema {
        private final java.lang.String recordFormatType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.recordFormatType = software.amazon.jsii.Kernel.get(this, "recordFormatType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.recordFormatType = java.util.Objects.requireNonNull(builder.recordFormatType, "recordFormatType is required");
        }

        @Override
        public final java.lang.String getRecordFormatType() {
            return this.recordFormatType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("recordFormatType", om.valueToTree(this.getRecordFormatType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationOutputsSchema"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisAnalyticsApplicationOutputsSchema.Jsii$Proxy that = (KinesisAnalyticsApplicationOutputsSchema.Jsii$Proxy) o;

            return this.recordFormatType.equals(that.recordFormatType);
        }

        @Override
        public final int hashCode() {
            int result = this.recordFormatType.hashCode();
            return result;
        }
    }
}
