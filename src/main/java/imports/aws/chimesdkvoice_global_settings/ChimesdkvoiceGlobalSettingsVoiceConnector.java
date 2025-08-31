package imports.aws.chimesdkvoice_global_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.210Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimesdkvoiceGlobalSettings.ChimesdkvoiceGlobalSettingsVoiceConnector")
@software.amazon.jsii.Jsii.Proxy(ChimesdkvoiceGlobalSettingsVoiceConnector.Jsii$Proxy.class)
public interface ChimesdkvoiceGlobalSettingsVoiceConnector extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkvoice_global_settings#cdr_bucket ChimesdkvoiceGlobalSettings#cdr_bucket}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCdrBucket() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ChimesdkvoiceGlobalSettingsVoiceConnector}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ChimesdkvoiceGlobalSettingsVoiceConnector}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ChimesdkvoiceGlobalSettingsVoiceConnector> {
        java.lang.String cdrBucket;

        /**
         * Sets the value of {@link ChimesdkvoiceGlobalSettingsVoiceConnector#getCdrBucket}
         * @param cdrBucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chimesdkvoice_global_settings#cdr_bucket ChimesdkvoiceGlobalSettings#cdr_bucket}.
         * @return {@code this}
         */
        public Builder cdrBucket(java.lang.String cdrBucket) {
            this.cdrBucket = cdrBucket;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ChimesdkvoiceGlobalSettingsVoiceConnector}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ChimesdkvoiceGlobalSettingsVoiceConnector build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ChimesdkvoiceGlobalSettingsVoiceConnector}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ChimesdkvoiceGlobalSettingsVoiceConnector {
        private final java.lang.String cdrBucket;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cdrBucket = software.amazon.jsii.Kernel.get(this, "cdrBucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cdrBucket = builder.cdrBucket;
        }

        @Override
        public final java.lang.String getCdrBucket() {
            return this.cdrBucket;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCdrBucket() != null) {
                data.set("cdrBucket", om.valueToTree(this.getCdrBucket()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.chimesdkvoiceGlobalSettings.ChimesdkvoiceGlobalSettingsVoiceConnector"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ChimesdkvoiceGlobalSettingsVoiceConnector.Jsii$Proxy that = (ChimesdkvoiceGlobalSettingsVoiceConnector.Jsii$Proxy) o;

            return this.cdrBucket != null ? this.cdrBucket.equals(that.cdrBucket) : that.cdrBucket == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cdrBucket != null ? this.cdrBucket.hashCode() : 0;
            return result;
        }
    }
}
