package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.717Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentInitialResponseSetting")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentInitialResponseSetting.Jsii$Proxy.class)
public interface Lexv2ModelsIntentInitialResponseSetting extends software.amazon.jsii.JsiiSerializable {

    /**
     * code_hook block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#code_hook Lexv2ModelsIntent#code_hook}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCodeHook() {
        return null;
    }

    /**
     * conditional block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#conditional Lexv2ModelsIntent#conditional}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConditional() {
        return null;
    }

    /**
     * initial_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#initial_response Lexv2ModelsIntent#initial_response}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInitialResponse() {
        return null;
    }

    /**
     * next_step block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#next_step Lexv2ModelsIntent#next_step}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNextStep() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentInitialResponseSetting}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentInitialResponseSetting}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentInitialResponseSetting> {
        java.lang.Object codeHook;
        java.lang.Object conditional;
        java.lang.Object initialResponse;
        java.lang.Object nextStep;

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSetting#getCodeHook}
         * @param codeHook code_hook block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#code_hook Lexv2ModelsIntent#code_hook}
         * @return {@code this}
         */
        public Builder codeHook(com.hashicorp.cdktf.IResolvable codeHook) {
            this.codeHook = codeHook;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSetting#getCodeHook}
         * @param codeHook code_hook block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#code_hook Lexv2ModelsIntent#code_hook}
         * @return {@code this}
         */
        public Builder codeHook(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingCodeHook> codeHook) {
            this.codeHook = codeHook;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSetting#getConditional}
         * @param conditional conditional block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#conditional Lexv2ModelsIntent#conditional}
         * @return {@code this}
         */
        public Builder conditional(com.hashicorp.cdktf.IResolvable conditional) {
            this.conditional = conditional;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSetting#getConditional}
         * @param conditional conditional block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#conditional Lexv2ModelsIntent#conditional}
         * @return {@code this}
         */
        public Builder conditional(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingConditional> conditional) {
            this.conditional = conditional;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSetting#getInitialResponse}
         * @param initialResponse initial_response block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#initial_response Lexv2ModelsIntent#initial_response}
         * @return {@code this}
         */
        public Builder initialResponse(com.hashicorp.cdktf.IResolvable initialResponse) {
            this.initialResponse = initialResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSetting#getInitialResponse}
         * @param initialResponse initial_response block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#initial_response Lexv2ModelsIntent#initial_response}
         * @return {@code this}
         */
        public Builder initialResponse(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingInitialResponse> initialResponse) {
            this.initialResponse = initialResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSetting#getNextStep}
         * @param nextStep next_step block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#next_step Lexv2ModelsIntent#next_step}
         * @return {@code this}
         */
        public Builder nextStep(com.hashicorp.cdktf.IResolvable nextStep) {
            this.nextStep = nextStep;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSetting#getNextStep}
         * @param nextStep next_step block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#next_step Lexv2ModelsIntent#next_step}
         * @return {@code this}
         */
        public Builder nextStep(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingNextStep> nextStep) {
            this.nextStep = nextStep;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentInitialResponseSetting}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentInitialResponseSetting build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentInitialResponseSetting}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentInitialResponseSetting {
        private final java.lang.Object codeHook;
        private final java.lang.Object conditional;
        private final java.lang.Object initialResponse;
        private final java.lang.Object nextStep;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.codeHook = software.amazon.jsii.Kernel.get(this, "codeHook", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.conditional = software.amazon.jsii.Kernel.get(this, "conditional", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.initialResponse = software.amazon.jsii.Kernel.get(this, "initialResponse", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.nextStep = software.amazon.jsii.Kernel.get(this, "nextStep", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.codeHook = builder.codeHook;
            this.conditional = builder.conditional;
            this.initialResponse = builder.initialResponse;
            this.nextStep = builder.nextStep;
        }

        @Override
        public final java.lang.Object getCodeHook() {
            return this.codeHook;
        }

        @Override
        public final java.lang.Object getConditional() {
            return this.conditional;
        }

        @Override
        public final java.lang.Object getInitialResponse() {
            return this.initialResponse;
        }

        @Override
        public final java.lang.Object getNextStep() {
            return this.nextStep;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCodeHook() != null) {
                data.set("codeHook", om.valueToTree(this.getCodeHook()));
            }
            if (this.getConditional() != null) {
                data.set("conditional", om.valueToTree(this.getConditional()));
            }
            if (this.getInitialResponse() != null) {
                data.set("initialResponse", om.valueToTree(this.getInitialResponse()));
            }
            if (this.getNextStep() != null) {
                data.set("nextStep", om.valueToTree(this.getNextStep()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentInitialResponseSetting"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentInitialResponseSetting.Jsii$Proxy that = (Lexv2ModelsIntentInitialResponseSetting.Jsii$Proxy) o;

            if (this.codeHook != null ? !this.codeHook.equals(that.codeHook) : that.codeHook != null) return false;
            if (this.conditional != null ? !this.conditional.equals(that.conditional) : that.conditional != null) return false;
            if (this.initialResponse != null ? !this.initialResponse.equals(that.initialResponse) : that.initialResponse != null) return false;
            return this.nextStep != null ? this.nextStep.equals(that.nextStep) : that.nextStep == null;
        }

        @Override
        public final int hashCode() {
            int result = this.codeHook != null ? this.codeHook.hashCode() : 0;
            result = 31 * result + (this.conditional != null ? this.conditional.hashCode() : 0);
            result = 31 * result + (this.initialResponse != null ? this.initialResponse.hashCode() : 0);
            result = 31 * result + (this.nextStep != null ? this.nextStep.hashCode() : 0);
            return result;
        }
    }
}
