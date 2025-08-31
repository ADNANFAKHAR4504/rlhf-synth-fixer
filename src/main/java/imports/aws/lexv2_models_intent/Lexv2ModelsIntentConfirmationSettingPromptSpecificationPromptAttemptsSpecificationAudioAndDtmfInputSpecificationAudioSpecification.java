package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.662Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationAudioSpecification")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationAudioSpecification.Jsii$Proxy.class)
public interface Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationAudioSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#end_timeout_ms Lexv2ModelsIntent#end_timeout_ms}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getEndTimeoutMs();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#max_length_ms Lexv2ModelsIntent#max_length_ms}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxLengthMs();

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationAudioSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationAudioSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationAudioSpecification> {
        java.lang.Number endTimeoutMs;
        java.lang.Number maxLengthMs;

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationAudioSpecification#getEndTimeoutMs}
         * @param endTimeoutMs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#end_timeout_ms Lexv2ModelsIntent#end_timeout_ms}. This parameter is required.
         * @return {@code this}
         */
        public Builder endTimeoutMs(java.lang.Number endTimeoutMs) {
            this.endTimeoutMs = endTimeoutMs;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationAudioSpecification#getMaxLengthMs}
         * @param maxLengthMs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#max_length_ms Lexv2ModelsIntent#max_length_ms}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxLengthMs(java.lang.Number maxLengthMs) {
            this.maxLengthMs = maxLengthMs;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationAudioSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationAudioSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationAudioSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationAudioSpecification {
        private final java.lang.Number endTimeoutMs;
        private final java.lang.Number maxLengthMs;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.endTimeoutMs = software.amazon.jsii.Kernel.get(this, "endTimeoutMs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxLengthMs = software.amazon.jsii.Kernel.get(this, "maxLengthMs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.endTimeoutMs = java.util.Objects.requireNonNull(builder.endTimeoutMs, "endTimeoutMs is required");
            this.maxLengthMs = java.util.Objects.requireNonNull(builder.maxLengthMs, "maxLengthMs is required");
        }

        @Override
        public final java.lang.Number getEndTimeoutMs() {
            return this.endTimeoutMs;
        }

        @Override
        public final java.lang.Number getMaxLengthMs() {
            return this.maxLengthMs;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("endTimeoutMs", om.valueToTree(this.getEndTimeoutMs()));
            data.set("maxLengthMs", om.valueToTree(this.getMaxLengthMs()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationAudioSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationAudioSpecification.Jsii$Proxy that = (Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationAudioSpecification.Jsii$Proxy) o;

            if (!endTimeoutMs.equals(that.endTimeoutMs)) return false;
            return this.maxLengthMs.equals(that.maxLengthMs);
        }

        @Override
        public final int hashCode() {
            int result = this.endTimeoutMs.hashCode();
            result = 31 * result + (this.maxLengthMs.hashCode());
            return result;
        }
    }
}
