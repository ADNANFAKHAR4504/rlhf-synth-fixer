package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.634Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch.Jsii$Proxy.class)
public interface Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch extends software.amazon.jsii.JsiiSerializable {

    /**
     * next_step block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#next_step Lexv2ModelsIntent#next_step}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNextStep() {
        return null;
    }

    /**
     * response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#response Lexv2ModelsIntent#response}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getResponse() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch> {
        java.lang.Object nextStep;
        java.lang.Object response;

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch#getNextStep}
         * @param nextStep next_step block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#next_step Lexv2ModelsIntent#next_step}
         * @return {@code this}
         */
        public Builder nextStep(com.hashicorp.cdktf.IResolvable nextStep) {
            this.nextStep = nextStep;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch#getNextStep}
         * @param nextStep next_step block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#next_step Lexv2ModelsIntent#next_step}
         * @return {@code this}
         */
        public Builder nextStep(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranchNextStep> nextStep) {
            this.nextStep = nextStep;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch#getResponse}
         * @param response response block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#response Lexv2ModelsIntent#response}
         * @return {@code this}
         */
        public Builder response(com.hashicorp.cdktf.IResolvable response) {
            this.response = response;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch#getResponse}
         * @param response response block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#response Lexv2ModelsIntent#response}
         * @return {@code this}
         */
        public Builder response(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranchResponse> response) {
            this.response = response;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch {
        private final java.lang.Object nextStep;
        private final java.lang.Object response;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.nextStep = software.amazon.jsii.Kernel.get(this, "nextStep", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.response = software.amazon.jsii.Kernel.get(this, "response", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.nextStep = builder.nextStep;
            this.response = builder.response;
        }

        @Override
        public final java.lang.Object getNextStep() {
            return this.nextStep;
        }

        @Override
        public final java.lang.Object getResponse() {
            return this.response;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNextStep() != null) {
                data.set("nextStep", om.valueToTree(this.getNextStep()));
            }
            if (this.getResponse() != null) {
                data.set("response", om.valueToTree(this.getResponse()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch.Jsii$Proxy that = (Lexv2ModelsIntentConfirmationSettingDeclinationConditionalDefaultBranch.Jsii$Proxy) o;

            if (this.nextStep != null ? !this.nextStep.equals(that.nextStep) : that.nextStep != null) return false;
            return this.response != null ? this.response.equals(that.response) : that.response == null;
        }

        @Override
        public final int hashCode() {
            int result = this.nextStep != null ? this.nextStep.hashCode() : 0;
            result = 31 * result + (this.response != null ? this.response.hashCode() : 0);
            return result;
        }
    }
}
