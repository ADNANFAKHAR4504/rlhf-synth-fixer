package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.569Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSetting")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentConfirmationSetting.Jsii$Proxy.class)
public interface Lexv2ModelsIntentConfirmationSetting extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getActive() {
        return null;
    }

    /**
     * code_hook block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#code_hook Lexv2ModelsIntent#code_hook}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCodeHook() {
        return null;
    }

    /**
     * confirmation_conditional block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#confirmation_conditional Lexv2ModelsIntent#confirmation_conditional}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConfirmationConditional() {
        return null;
    }

    /**
     * confirmation_next_step block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#confirmation_next_step Lexv2ModelsIntent#confirmation_next_step}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConfirmationNextStep() {
        return null;
    }

    /**
     * confirmation_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#confirmation_response Lexv2ModelsIntent#confirmation_response}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConfirmationResponse() {
        return null;
    }

    /**
     * declination_conditional block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#declination_conditional Lexv2ModelsIntent#declination_conditional}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeclinationConditional() {
        return null;
    }

    /**
     * declination_next_step block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#declination_next_step Lexv2ModelsIntent#declination_next_step}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeclinationNextStep() {
        return null;
    }

    /**
     * declination_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#declination_response Lexv2ModelsIntent#declination_response}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeclinationResponse() {
        return null;
    }

    /**
     * elicitation_code_hook block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#elicitation_code_hook Lexv2ModelsIntent#elicitation_code_hook}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getElicitationCodeHook() {
        return null;
    }

    /**
     * failure_conditional block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_conditional Lexv2ModelsIntent#failure_conditional}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFailureConditional() {
        return null;
    }

    /**
     * failure_next_step block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_next_step Lexv2ModelsIntent#failure_next_step}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFailureNextStep() {
        return null;
    }

    /**
     * failure_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_response Lexv2ModelsIntent#failure_response}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFailureResponse() {
        return null;
    }

    /**
     * prompt_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#prompt_specification Lexv2ModelsIntent#prompt_specification}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPromptSpecification() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentConfirmationSetting}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentConfirmationSetting}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentConfirmationSetting> {
        java.lang.Object active;
        java.lang.Object codeHook;
        java.lang.Object confirmationConditional;
        java.lang.Object confirmationNextStep;
        java.lang.Object confirmationResponse;
        java.lang.Object declinationConditional;
        java.lang.Object declinationNextStep;
        java.lang.Object declinationResponse;
        java.lang.Object elicitationCodeHook;
        java.lang.Object failureConditional;
        java.lang.Object failureNextStep;
        java.lang.Object failureResponse;
        java.lang.Object promptSpecification;

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}.
         * @return {@code this}
         */
        public Builder active(java.lang.Boolean active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}.
         * @return {@code this}
         */
        public Builder active(com.hashicorp.cdktf.IResolvable active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getCodeHook}
         * @param codeHook code_hook block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#code_hook Lexv2ModelsIntent#code_hook}
         * @return {@code this}
         */
        public Builder codeHook(com.hashicorp.cdktf.IResolvable codeHook) {
            this.codeHook = codeHook;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getCodeHook}
         * @param codeHook code_hook block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#code_hook Lexv2ModelsIntent#code_hook}
         * @return {@code this}
         */
        public Builder codeHook(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingCodeHook> codeHook) {
            this.codeHook = codeHook;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getConfirmationConditional}
         * @param confirmationConditional confirmation_conditional block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#confirmation_conditional Lexv2ModelsIntent#confirmation_conditional}
         * @return {@code this}
         */
        public Builder confirmationConditional(com.hashicorp.cdktf.IResolvable confirmationConditional) {
            this.confirmationConditional = confirmationConditional;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getConfirmationConditional}
         * @param confirmationConditional confirmation_conditional block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#confirmation_conditional Lexv2ModelsIntent#confirmation_conditional}
         * @return {@code this}
         */
        public Builder confirmationConditional(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingConfirmationConditional> confirmationConditional) {
            this.confirmationConditional = confirmationConditional;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getConfirmationNextStep}
         * @param confirmationNextStep confirmation_next_step block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#confirmation_next_step Lexv2ModelsIntent#confirmation_next_step}
         * @return {@code this}
         */
        public Builder confirmationNextStep(com.hashicorp.cdktf.IResolvable confirmationNextStep) {
            this.confirmationNextStep = confirmationNextStep;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getConfirmationNextStep}
         * @param confirmationNextStep confirmation_next_step block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#confirmation_next_step Lexv2ModelsIntent#confirmation_next_step}
         * @return {@code this}
         */
        public Builder confirmationNextStep(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingConfirmationNextStep> confirmationNextStep) {
            this.confirmationNextStep = confirmationNextStep;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getConfirmationResponse}
         * @param confirmationResponse confirmation_response block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#confirmation_response Lexv2ModelsIntent#confirmation_response}
         * @return {@code this}
         */
        public Builder confirmationResponse(com.hashicorp.cdktf.IResolvable confirmationResponse) {
            this.confirmationResponse = confirmationResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getConfirmationResponse}
         * @param confirmationResponse confirmation_response block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#confirmation_response Lexv2ModelsIntent#confirmation_response}
         * @return {@code this}
         */
        public Builder confirmationResponse(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingConfirmationResponse> confirmationResponse) {
            this.confirmationResponse = confirmationResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getDeclinationConditional}
         * @param declinationConditional declination_conditional block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#declination_conditional Lexv2ModelsIntent#declination_conditional}
         * @return {@code this}
         */
        public Builder declinationConditional(com.hashicorp.cdktf.IResolvable declinationConditional) {
            this.declinationConditional = declinationConditional;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getDeclinationConditional}
         * @param declinationConditional declination_conditional block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#declination_conditional Lexv2ModelsIntent#declination_conditional}
         * @return {@code this}
         */
        public Builder declinationConditional(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingDeclinationConditional> declinationConditional) {
            this.declinationConditional = declinationConditional;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getDeclinationNextStep}
         * @param declinationNextStep declination_next_step block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#declination_next_step Lexv2ModelsIntent#declination_next_step}
         * @return {@code this}
         */
        public Builder declinationNextStep(com.hashicorp.cdktf.IResolvable declinationNextStep) {
            this.declinationNextStep = declinationNextStep;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getDeclinationNextStep}
         * @param declinationNextStep declination_next_step block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#declination_next_step Lexv2ModelsIntent#declination_next_step}
         * @return {@code this}
         */
        public Builder declinationNextStep(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingDeclinationNextStep> declinationNextStep) {
            this.declinationNextStep = declinationNextStep;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getDeclinationResponse}
         * @param declinationResponse declination_response block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#declination_response Lexv2ModelsIntent#declination_response}
         * @return {@code this}
         */
        public Builder declinationResponse(com.hashicorp.cdktf.IResolvable declinationResponse) {
            this.declinationResponse = declinationResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getDeclinationResponse}
         * @param declinationResponse declination_response block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#declination_response Lexv2ModelsIntent#declination_response}
         * @return {@code this}
         */
        public Builder declinationResponse(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingDeclinationResponse> declinationResponse) {
            this.declinationResponse = declinationResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getElicitationCodeHook}
         * @param elicitationCodeHook elicitation_code_hook block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#elicitation_code_hook Lexv2ModelsIntent#elicitation_code_hook}
         * @return {@code this}
         */
        public Builder elicitationCodeHook(com.hashicorp.cdktf.IResolvable elicitationCodeHook) {
            this.elicitationCodeHook = elicitationCodeHook;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getElicitationCodeHook}
         * @param elicitationCodeHook elicitation_code_hook block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#elicitation_code_hook Lexv2ModelsIntent#elicitation_code_hook}
         * @return {@code this}
         */
        public Builder elicitationCodeHook(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingElicitationCodeHook> elicitationCodeHook) {
            this.elicitationCodeHook = elicitationCodeHook;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getFailureConditional}
         * @param failureConditional failure_conditional block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_conditional Lexv2ModelsIntent#failure_conditional}
         * @return {@code this}
         */
        public Builder failureConditional(com.hashicorp.cdktf.IResolvable failureConditional) {
            this.failureConditional = failureConditional;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getFailureConditional}
         * @param failureConditional failure_conditional block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_conditional Lexv2ModelsIntent#failure_conditional}
         * @return {@code this}
         */
        public Builder failureConditional(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingFailureConditional> failureConditional) {
            this.failureConditional = failureConditional;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getFailureNextStep}
         * @param failureNextStep failure_next_step block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_next_step Lexv2ModelsIntent#failure_next_step}
         * @return {@code this}
         */
        public Builder failureNextStep(com.hashicorp.cdktf.IResolvable failureNextStep) {
            this.failureNextStep = failureNextStep;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getFailureNextStep}
         * @param failureNextStep failure_next_step block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_next_step Lexv2ModelsIntent#failure_next_step}
         * @return {@code this}
         */
        public Builder failureNextStep(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingFailureNextStep> failureNextStep) {
            this.failureNextStep = failureNextStep;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getFailureResponse}
         * @param failureResponse failure_response block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_response Lexv2ModelsIntent#failure_response}
         * @return {@code this}
         */
        public Builder failureResponse(com.hashicorp.cdktf.IResolvable failureResponse) {
            this.failureResponse = failureResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getFailureResponse}
         * @param failureResponse failure_response block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_response Lexv2ModelsIntent#failure_response}
         * @return {@code this}
         */
        public Builder failureResponse(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingFailureResponse> failureResponse) {
            this.failureResponse = failureResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getPromptSpecification}
         * @param promptSpecification prompt_specification block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#prompt_specification Lexv2ModelsIntent#prompt_specification}
         * @return {@code this}
         */
        public Builder promptSpecification(com.hashicorp.cdktf.IResolvable promptSpecification) {
            this.promptSpecification = promptSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSetting#getPromptSpecification}
         * @param promptSpecification prompt_specification block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#prompt_specification Lexv2ModelsIntent#prompt_specification}
         * @return {@code this}
         */
        public Builder promptSpecification(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingPromptSpecification> promptSpecification) {
            this.promptSpecification = promptSpecification;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentConfirmationSetting}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentConfirmationSetting build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentConfirmationSetting}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentConfirmationSetting {
        private final java.lang.Object active;
        private final java.lang.Object codeHook;
        private final java.lang.Object confirmationConditional;
        private final java.lang.Object confirmationNextStep;
        private final java.lang.Object confirmationResponse;
        private final java.lang.Object declinationConditional;
        private final java.lang.Object declinationNextStep;
        private final java.lang.Object declinationResponse;
        private final java.lang.Object elicitationCodeHook;
        private final java.lang.Object failureConditional;
        private final java.lang.Object failureNextStep;
        private final java.lang.Object failureResponse;
        private final java.lang.Object promptSpecification;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.active = software.amazon.jsii.Kernel.get(this, "active", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.codeHook = software.amazon.jsii.Kernel.get(this, "codeHook", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.confirmationConditional = software.amazon.jsii.Kernel.get(this, "confirmationConditional", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.confirmationNextStep = software.amazon.jsii.Kernel.get(this, "confirmationNextStep", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.confirmationResponse = software.amazon.jsii.Kernel.get(this, "confirmationResponse", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.declinationConditional = software.amazon.jsii.Kernel.get(this, "declinationConditional", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.declinationNextStep = software.amazon.jsii.Kernel.get(this, "declinationNextStep", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.declinationResponse = software.amazon.jsii.Kernel.get(this, "declinationResponse", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.elicitationCodeHook = software.amazon.jsii.Kernel.get(this, "elicitationCodeHook", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.failureConditional = software.amazon.jsii.Kernel.get(this, "failureConditional", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.failureNextStep = software.amazon.jsii.Kernel.get(this, "failureNextStep", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.failureResponse = software.amazon.jsii.Kernel.get(this, "failureResponse", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.promptSpecification = software.amazon.jsii.Kernel.get(this, "promptSpecification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.active = builder.active;
            this.codeHook = builder.codeHook;
            this.confirmationConditional = builder.confirmationConditional;
            this.confirmationNextStep = builder.confirmationNextStep;
            this.confirmationResponse = builder.confirmationResponse;
            this.declinationConditional = builder.declinationConditional;
            this.declinationNextStep = builder.declinationNextStep;
            this.declinationResponse = builder.declinationResponse;
            this.elicitationCodeHook = builder.elicitationCodeHook;
            this.failureConditional = builder.failureConditional;
            this.failureNextStep = builder.failureNextStep;
            this.failureResponse = builder.failureResponse;
            this.promptSpecification = builder.promptSpecification;
        }

        @Override
        public final java.lang.Object getActive() {
            return this.active;
        }

        @Override
        public final java.lang.Object getCodeHook() {
            return this.codeHook;
        }

        @Override
        public final java.lang.Object getConfirmationConditional() {
            return this.confirmationConditional;
        }

        @Override
        public final java.lang.Object getConfirmationNextStep() {
            return this.confirmationNextStep;
        }

        @Override
        public final java.lang.Object getConfirmationResponse() {
            return this.confirmationResponse;
        }

        @Override
        public final java.lang.Object getDeclinationConditional() {
            return this.declinationConditional;
        }

        @Override
        public final java.lang.Object getDeclinationNextStep() {
            return this.declinationNextStep;
        }

        @Override
        public final java.lang.Object getDeclinationResponse() {
            return this.declinationResponse;
        }

        @Override
        public final java.lang.Object getElicitationCodeHook() {
            return this.elicitationCodeHook;
        }

        @Override
        public final java.lang.Object getFailureConditional() {
            return this.failureConditional;
        }

        @Override
        public final java.lang.Object getFailureNextStep() {
            return this.failureNextStep;
        }

        @Override
        public final java.lang.Object getFailureResponse() {
            return this.failureResponse;
        }

        @Override
        public final java.lang.Object getPromptSpecification() {
            return this.promptSpecification;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getActive() != null) {
                data.set("active", om.valueToTree(this.getActive()));
            }
            if (this.getCodeHook() != null) {
                data.set("codeHook", om.valueToTree(this.getCodeHook()));
            }
            if (this.getConfirmationConditional() != null) {
                data.set("confirmationConditional", om.valueToTree(this.getConfirmationConditional()));
            }
            if (this.getConfirmationNextStep() != null) {
                data.set("confirmationNextStep", om.valueToTree(this.getConfirmationNextStep()));
            }
            if (this.getConfirmationResponse() != null) {
                data.set("confirmationResponse", om.valueToTree(this.getConfirmationResponse()));
            }
            if (this.getDeclinationConditional() != null) {
                data.set("declinationConditional", om.valueToTree(this.getDeclinationConditional()));
            }
            if (this.getDeclinationNextStep() != null) {
                data.set("declinationNextStep", om.valueToTree(this.getDeclinationNextStep()));
            }
            if (this.getDeclinationResponse() != null) {
                data.set("declinationResponse", om.valueToTree(this.getDeclinationResponse()));
            }
            if (this.getElicitationCodeHook() != null) {
                data.set("elicitationCodeHook", om.valueToTree(this.getElicitationCodeHook()));
            }
            if (this.getFailureConditional() != null) {
                data.set("failureConditional", om.valueToTree(this.getFailureConditional()));
            }
            if (this.getFailureNextStep() != null) {
                data.set("failureNextStep", om.valueToTree(this.getFailureNextStep()));
            }
            if (this.getFailureResponse() != null) {
                data.set("failureResponse", om.valueToTree(this.getFailureResponse()));
            }
            if (this.getPromptSpecification() != null) {
                data.set("promptSpecification", om.valueToTree(this.getPromptSpecification()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSetting"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentConfirmationSetting.Jsii$Proxy that = (Lexv2ModelsIntentConfirmationSetting.Jsii$Proxy) o;

            if (this.active != null ? !this.active.equals(that.active) : that.active != null) return false;
            if (this.codeHook != null ? !this.codeHook.equals(that.codeHook) : that.codeHook != null) return false;
            if (this.confirmationConditional != null ? !this.confirmationConditional.equals(that.confirmationConditional) : that.confirmationConditional != null) return false;
            if (this.confirmationNextStep != null ? !this.confirmationNextStep.equals(that.confirmationNextStep) : that.confirmationNextStep != null) return false;
            if (this.confirmationResponse != null ? !this.confirmationResponse.equals(that.confirmationResponse) : that.confirmationResponse != null) return false;
            if (this.declinationConditional != null ? !this.declinationConditional.equals(that.declinationConditional) : that.declinationConditional != null) return false;
            if (this.declinationNextStep != null ? !this.declinationNextStep.equals(that.declinationNextStep) : that.declinationNextStep != null) return false;
            if (this.declinationResponse != null ? !this.declinationResponse.equals(that.declinationResponse) : that.declinationResponse != null) return false;
            if (this.elicitationCodeHook != null ? !this.elicitationCodeHook.equals(that.elicitationCodeHook) : that.elicitationCodeHook != null) return false;
            if (this.failureConditional != null ? !this.failureConditional.equals(that.failureConditional) : that.failureConditional != null) return false;
            if (this.failureNextStep != null ? !this.failureNextStep.equals(that.failureNextStep) : that.failureNextStep != null) return false;
            if (this.failureResponse != null ? !this.failureResponse.equals(that.failureResponse) : that.failureResponse != null) return false;
            return this.promptSpecification != null ? this.promptSpecification.equals(that.promptSpecification) : that.promptSpecification == null;
        }

        @Override
        public final int hashCode() {
            int result = this.active != null ? this.active.hashCode() : 0;
            result = 31 * result + (this.codeHook != null ? this.codeHook.hashCode() : 0);
            result = 31 * result + (this.confirmationConditional != null ? this.confirmationConditional.hashCode() : 0);
            result = 31 * result + (this.confirmationNextStep != null ? this.confirmationNextStep.hashCode() : 0);
            result = 31 * result + (this.confirmationResponse != null ? this.confirmationResponse.hashCode() : 0);
            result = 31 * result + (this.declinationConditional != null ? this.declinationConditional.hashCode() : 0);
            result = 31 * result + (this.declinationNextStep != null ? this.declinationNextStep.hashCode() : 0);
            result = 31 * result + (this.declinationResponse != null ? this.declinationResponse.hashCode() : 0);
            result = 31 * result + (this.elicitationCodeHook != null ? this.elicitationCodeHook.hashCode() : 0);
            result = 31 * result + (this.failureConditional != null ? this.failureConditional.hashCode() : 0);
            result = 31 * result + (this.failureNextStep != null ? this.failureNextStep.hashCode() : 0);
            result = 31 * result + (this.failureResponse != null ? this.failureResponse.hashCode() : 0);
            result = 31 * result + (this.promptSpecification != null ? this.promptSpecification.hashCode() : 0);
            return result;
        }
    }
}
