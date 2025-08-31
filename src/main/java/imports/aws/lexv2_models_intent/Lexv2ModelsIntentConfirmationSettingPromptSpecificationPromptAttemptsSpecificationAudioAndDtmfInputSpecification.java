package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.662Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification.Jsii$Proxy.class)
public interface Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#start_timeout_ms Lexv2ModelsIntent#start_timeout_ms}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getStartTimeoutMs();

    /**
     * audio_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#audio_specification Lexv2ModelsIntent#audio_specification}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAudioSpecification() {
        return null;
    }

    /**
     * dtmf_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#dtmf_specification Lexv2ModelsIntent#dtmf_specification}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDtmfSpecification() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification> {
        java.lang.Number startTimeoutMs;
        java.lang.Object audioSpecification;
        java.lang.Object dtmfSpecification;

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification#getStartTimeoutMs}
         * @param startTimeoutMs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#start_timeout_ms Lexv2ModelsIntent#start_timeout_ms}. This parameter is required.
         * @return {@code this}
         */
        public Builder startTimeoutMs(java.lang.Number startTimeoutMs) {
            this.startTimeoutMs = startTimeoutMs;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification#getAudioSpecification}
         * @param audioSpecification audio_specification block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#audio_specification Lexv2ModelsIntent#audio_specification}
         * @return {@code this}
         */
        public Builder audioSpecification(com.hashicorp.cdktf.IResolvable audioSpecification) {
            this.audioSpecification = audioSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification#getAudioSpecification}
         * @param audioSpecification audio_specification block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#audio_specification Lexv2ModelsIntent#audio_specification}
         * @return {@code this}
         */
        public Builder audioSpecification(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationAudioSpecification> audioSpecification) {
            this.audioSpecification = audioSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification#getDtmfSpecification}
         * @param dtmfSpecification dtmf_specification block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#dtmf_specification Lexv2ModelsIntent#dtmf_specification}
         * @return {@code this}
         */
        public Builder dtmfSpecification(com.hashicorp.cdktf.IResolvable dtmfSpecification) {
            this.dtmfSpecification = dtmfSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification#getDtmfSpecification}
         * @param dtmfSpecification dtmf_specification block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#dtmf_specification Lexv2ModelsIntent#dtmf_specification}
         * @return {@code this}
         */
        public Builder dtmfSpecification(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecificationDtmfSpecification> dtmfSpecification) {
            this.dtmfSpecification = dtmfSpecification;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification {
        private final java.lang.Number startTimeoutMs;
        private final java.lang.Object audioSpecification;
        private final java.lang.Object dtmfSpecification;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.startTimeoutMs = software.amazon.jsii.Kernel.get(this, "startTimeoutMs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.audioSpecification = software.amazon.jsii.Kernel.get(this, "audioSpecification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dtmfSpecification = software.amazon.jsii.Kernel.get(this, "dtmfSpecification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.startTimeoutMs = java.util.Objects.requireNonNull(builder.startTimeoutMs, "startTimeoutMs is required");
            this.audioSpecification = builder.audioSpecification;
            this.dtmfSpecification = builder.dtmfSpecification;
        }

        @Override
        public final java.lang.Number getStartTimeoutMs() {
            return this.startTimeoutMs;
        }

        @Override
        public final java.lang.Object getAudioSpecification() {
            return this.audioSpecification;
        }

        @Override
        public final java.lang.Object getDtmfSpecification() {
            return this.dtmfSpecification;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("startTimeoutMs", om.valueToTree(this.getStartTimeoutMs()));
            if (this.getAudioSpecification() != null) {
                data.set("audioSpecification", om.valueToTree(this.getAudioSpecification()));
            }
            if (this.getDtmfSpecification() != null) {
                data.set("dtmfSpecification", om.valueToTree(this.getDtmfSpecification()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification.Jsii$Proxy that = (Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification.Jsii$Proxy) o;

            if (!startTimeoutMs.equals(that.startTimeoutMs)) return false;
            if (this.audioSpecification != null ? !this.audioSpecification.equals(that.audioSpecification) : that.audioSpecification != null) return false;
            return this.dtmfSpecification != null ? this.dtmfSpecification.equals(that.dtmfSpecification) : that.dtmfSpecification == null;
        }

        @Override
        public final int hashCode() {
            int result = this.startTimeoutMs.hashCode();
            result = 31 * result + (this.audioSpecification != null ? this.audioSpecification.hashCode() : 0);
            result = 31 * result + (this.dtmfSpecification != null ? this.dtmfSpecification.hashCode() : 0);
            return result;
        }
    }
}
