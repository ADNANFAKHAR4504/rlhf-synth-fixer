package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.662Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification.Jsii$Proxy.class)
public interface Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#deletion_character Lexv2ModelsIntent#deletion_character}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeletionCharacter();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#end_character Lexv2ModelsIntent#end_character}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEndCharacter();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#end_timeout_ms Lexv2ModelsIntent#end_timeout_ms}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getEndTimeoutMs();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#max_length Lexv2ModelsIntent#max_length}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxLength();

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification> {
        java.lang.String deletionCharacter;
        java.lang.String endCharacter;
        java.lang.Number endTimeoutMs;
        java.lang.Number maxLength;

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification#getDeletionCharacter}
         * @param deletionCharacter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#deletion_character Lexv2ModelsIntent#deletion_character}. This parameter is required.
         * @return {@code this}
         */
        public Builder deletionCharacter(java.lang.String deletionCharacter) {
            this.deletionCharacter = deletionCharacter;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification#getEndCharacter}
         * @param endCharacter Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#end_character Lexv2ModelsIntent#end_character}. This parameter is required.
         * @return {@code this}
         */
        public Builder endCharacter(java.lang.String endCharacter) {
            this.endCharacter = endCharacter;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification#getEndTimeoutMs}
         * @param endTimeoutMs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#end_timeout_ms Lexv2ModelsIntent#end_timeout_ms}. This parameter is required.
         * @return {@code this}
         */
        public Builder endTimeoutMs(java.lang.Number endTimeoutMs) {
            this.endTimeoutMs = endTimeoutMs;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification#getMaxLength}
         * @param maxLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#max_length Lexv2ModelsIntent#max_length}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxLength(java.lang.Number maxLength) {
            this.maxLength = maxLength;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification {
        private final java.lang.String deletionCharacter;
        private final java.lang.String endCharacter;
        private final java.lang.Number endTimeoutMs;
        private final java.lang.Number maxLength;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.deletionCharacter = software.amazon.jsii.Kernel.get(this, "deletionCharacter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endCharacter = software.amazon.jsii.Kernel.get(this, "endCharacter", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endTimeoutMs = software.amazon.jsii.Kernel.get(this, "endTimeoutMs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxLength = software.amazon.jsii.Kernel.get(this, "maxLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.deletionCharacter = java.util.Objects.requireNonNull(builder.deletionCharacter, "deletionCharacter is required");
            this.endCharacter = java.util.Objects.requireNonNull(builder.endCharacter, "endCharacter is required");
            this.endTimeoutMs = java.util.Objects.requireNonNull(builder.endTimeoutMs, "endTimeoutMs is required");
            this.maxLength = java.util.Objects.requireNonNull(builder.maxLength, "maxLength is required");
        }

        @Override
        public final java.lang.String getDeletionCharacter() {
            return this.deletionCharacter;
        }

        @Override
        public final java.lang.String getEndCharacter() {
            return this.endCharacter;
        }

        @Override
        public final java.lang.Number getEndTimeoutMs() {
            return this.endTimeoutMs;
        }

        @Override
        public final java.lang.Number getMaxLength() {
            return this.maxLength;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("deletionCharacter", om.valueToTree(this.getDeletionCharacter()));
            data.set("endCharacter", om.valueToTree(this.getEndCharacter()));
            data.set("endTimeoutMs", om.valueToTree(this.getEndTimeoutMs()));
            data.set("maxLength", om.valueToTree(this.getMaxLength()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification.Jsii$Proxy that = (Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification.Jsii$Proxy) o;

            if (!deletionCharacter.equals(that.deletionCharacter)) return false;
            if (!endCharacter.equals(that.endCharacter)) return false;
            if (!endTimeoutMs.equals(that.endTimeoutMs)) return false;
            return this.maxLength.equals(that.maxLength);
        }

        @Override
        public final int hashCode() {
            int result = this.deletionCharacter.hashCode();
            result = 31 * result + (this.endCharacter.hashCode());
            result = 31 * result + (this.endTimeoutMs.hashCode());
            result = 31 * result + (this.maxLength.hashCode());
            return result;
        }
    }
}
