package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.662Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification.Jsii$Proxy.class)
public interface Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#map_block_key Lexv2ModelsIntent#map_block_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMapBlockKey();

    /**
     * allowed_input_types block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#allowed_input_types Lexv2ModelsIntent#allowed_input_types}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowedInputTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#allow_interrupt Lexv2ModelsIntent#allow_interrupt}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowInterrupt() {
        return null;
    }

    /**
     * audio_and_dtmf_input_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#audio_and_dtmf_input_specification Lexv2ModelsIntent#audio_and_dtmf_input_specification}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAudioAndDtmfInputSpecification() {
        return null;
    }

    /**
     * text_input_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#text_input_specification Lexv2ModelsIntent#text_input_specification}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTextInputSpecification() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification> {
        java.lang.String mapBlockKey;
        java.lang.Object allowedInputTypes;
        java.lang.Object allowInterrupt;
        java.lang.Object audioAndDtmfInputSpecification;
        java.lang.Object textInputSpecification;

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification#getMapBlockKey}
         * @param mapBlockKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#map_block_key Lexv2ModelsIntent#map_block_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder mapBlockKey(java.lang.String mapBlockKey) {
            this.mapBlockKey = mapBlockKey;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification#getAllowedInputTypes}
         * @param allowedInputTypes allowed_input_types block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#allowed_input_types Lexv2ModelsIntent#allowed_input_types}
         * @return {@code this}
         */
        public Builder allowedInputTypes(com.hashicorp.cdktf.IResolvable allowedInputTypes) {
            this.allowedInputTypes = allowedInputTypes;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification#getAllowedInputTypes}
         * @param allowedInputTypes allowed_input_types block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#allowed_input_types Lexv2ModelsIntent#allowed_input_types}
         * @return {@code this}
         */
        public Builder allowedInputTypes(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAllowedInputTypes> allowedInputTypes) {
            this.allowedInputTypes = allowedInputTypes;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification#getAllowInterrupt}
         * @param allowInterrupt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#allow_interrupt Lexv2ModelsIntent#allow_interrupt}.
         * @return {@code this}
         */
        public Builder allowInterrupt(java.lang.Boolean allowInterrupt) {
            this.allowInterrupt = allowInterrupt;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification#getAllowInterrupt}
         * @param allowInterrupt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#allow_interrupt Lexv2ModelsIntent#allow_interrupt}.
         * @return {@code this}
         */
        public Builder allowInterrupt(com.hashicorp.cdktf.IResolvable allowInterrupt) {
            this.allowInterrupt = allowInterrupt;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification#getAudioAndDtmfInputSpecification}
         * @param audioAndDtmfInputSpecification audio_and_dtmf_input_specification block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#audio_and_dtmf_input_specification Lexv2ModelsIntent#audio_and_dtmf_input_specification}
         * @return {@code this}
         */
        public Builder audioAndDtmfInputSpecification(com.hashicorp.cdktf.IResolvable audioAndDtmfInputSpecification) {
            this.audioAndDtmfInputSpecification = audioAndDtmfInputSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification#getAudioAndDtmfInputSpecification}
         * @param audioAndDtmfInputSpecification audio_and_dtmf_input_specification block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#audio_and_dtmf_input_specification Lexv2ModelsIntent#audio_and_dtmf_input_specification}
         * @return {@code this}
         */
        public Builder audioAndDtmfInputSpecification(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationAudioAndDtmfInputSpecification> audioAndDtmfInputSpecification) {
            this.audioAndDtmfInputSpecification = audioAndDtmfInputSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification#getTextInputSpecification}
         * @param textInputSpecification text_input_specification block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#text_input_specification Lexv2ModelsIntent#text_input_specification}
         * @return {@code this}
         */
        public Builder textInputSpecification(com.hashicorp.cdktf.IResolvable textInputSpecification) {
            this.textInputSpecification = textInputSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification#getTextInputSpecification}
         * @param textInputSpecification text_input_specification block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#text_input_specification Lexv2ModelsIntent#text_input_specification}
         * @return {@code this}
         */
        public Builder textInputSpecification(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecificationTextInputSpecification> textInputSpecification) {
            this.textInputSpecification = textInputSpecification;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification {
        private final java.lang.String mapBlockKey;
        private final java.lang.Object allowedInputTypes;
        private final java.lang.Object allowInterrupt;
        private final java.lang.Object audioAndDtmfInputSpecification;
        private final java.lang.Object textInputSpecification;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mapBlockKey = software.amazon.jsii.Kernel.get(this, "mapBlockKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.allowedInputTypes = software.amazon.jsii.Kernel.get(this, "allowedInputTypes", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.allowInterrupt = software.amazon.jsii.Kernel.get(this, "allowInterrupt", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.audioAndDtmfInputSpecification = software.amazon.jsii.Kernel.get(this, "audioAndDtmfInputSpecification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.textInputSpecification = software.amazon.jsii.Kernel.get(this, "textInputSpecification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mapBlockKey = java.util.Objects.requireNonNull(builder.mapBlockKey, "mapBlockKey is required");
            this.allowedInputTypes = builder.allowedInputTypes;
            this.allowInterrupt = builder.allowInterrupt;
            this.audioAndDtmfInputSpecification = builder.audioAndDtmfInputSpecification;
            this.textInputSpecification = builder.textInputSpecification;
        }

        @Override
        public final java.lang.String getMapBlockKey() {
            return this.mapBlockKey;
        }

        @Override
        public final java.lang.Object getAllowedInputTypes() {
            return this.allowedInputTypes;
        }

        @Override
        public final java.lang.Object getAllowInterrupt() {
            return this.allowInterrupt;
        }

        @Override
        public final java.lang.Object getAudioAndDtmfInputSpecification() {
            return this.audioAndDtmfInputSpecification;
        }

        @Override
        public final java.lang.Object getTextInputSpecification() {
            return this.textInputSpecification;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("mapBlockKey", om.valueToTree(this.getMapBlockKey()));
            if (this.getAllowedInputTypes() != null) {
                data.set("allowedInputTypes", om.valueToTree(this.getAllowedInputTypes()));
            }
            if (this.getAllowInterrupt() != null) {
                data.set("allowInterrupt", om.valueToTree(this.getAllowInterrupt()));
            }
            if (this.getAudioAndDtmfInputSpecification() != null) {
                data.set("audioAndDtmfInputSpecification", om.valueToTree(this.getAudioAndDtmfInputSpecification()));
            }
            if (this.getTextInputSpecification() != null) {
                data.set("textInputSpecification", om.valueToTree(this.getTextInputSpecification()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification.Jsii$Proxy that = (Lexv2ModelsIntentConfirmationSettingPromptSpecificationPromptAttemptsSpecification.Jsii$Proxy) o;

            if (!mapBlockKey.equals(that.mapBlockKey)) return false;
            if (this.allowedInputTypes != null ? !this.allowedInputTypes.equals(that.allowedInputTypes) : that.allowedInputTypes != null) return false;
            if (this.allowInterrupt != null ? !this.allowInterrupt.equals(that.allowInterrupt) : that.allowInterrupt != null) return false;
            if (this.audioAndDtmfInputSpecification != null ? !this.audioAndDtmfInputSpecification.equals(that.audioAndDtmfInputSpecification) : that.audioAndDtmfInputSpecification != null) return false;
            return this.textInputSpecification != null ? this.textInputSpecification.equals(that.textInputSpecification) : that.textInputSpecification == null;
        }

        @Override
        public final int hashCode() {
            int result = this.mapBlockKey.hashCode();
            result = 31 * result + (this.allowedInputTypes != null ? this.allowedInputTypes.hashCode() : 0);
            result = 31 * result + (this.allowInterrupt != null ? this.allowInterrupt.hashCode() : 0);
            result = 31 * result + (this.audioAndDtmfInputSpecification != null ? this.audioAndDtmfInputSpecification.hashCode() : 0);
            result = 31 * result + (this.textInputSpecification != null ? this.textInputSpecification.hashCode() : 0);
            return result;
        }
    }
}
