package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.551Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentClosingSetting")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentClosingSetting.Jsii$Proxy.class)
public interface Lexv2ModelsIntentClosingSetting extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getActive() {
        return null;
    }

    /**
     * closing_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#closing_response Lexv2ModelsIntent#closing_response}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getClosingResponse() {
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
     * next_step block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#next_step Lexv2ModelsIntent#next_step}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNextStep() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentClosingSetting}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentClosingSetting}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentClosingSetting> {
        java.lang.Object active;
        java.lang.Object closingResponse;
        java.lang.Object conditional;
        java.lang.Object nextStep;

        /**
         * Sets the value of {@link Lexv2ModelsIntentClosingSetting#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}.
         * @return {@code this}
         */
        public Builder active(java.lang.Boolean active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentClosingSetting#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}.
         * @return {@code this}
         */
        public Builder active(com.hashicorp.cdktf.IResolvable active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentClosingSetting#getClosingResponse}
         * @param closingResponse closing_response block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#closing_response Lexv2ModelsIntent#closing_response}
         * @return {@code this}
         */
        public Builder closingResponse(com.hashicorp.cdktf.IResolvable closingResponse) {
            this.closingResponse = closingResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentClosingSetting#getClosingResponse}
         * @param closingResponse closing_response block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#closing_response Lexv2ModelsIntent#closing_response}
         * @return {@code this}
         */
        public Builder closingResponse(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingClosingResponse> closingResponse) {
            this.closingResponse = closingResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentClosingSetting#getConditional}
         * @param conditional conditional block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#conditional Lexv2ModelsIntent#conditional}
         * @return {@code this}
         */
        public Builder conditional(com.hashicorp.cdktf.IResolvable conditional) {
            this.conditional = conditional;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentClosingSetting#getConditional}
         * @param conditional conditional block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#conditional Lexv2ModelsIntent#conditional}
         * @return {@code this}
         */
        public Builder conditional(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingConditional> conditional) {
            this.conditional = conditional;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentClosingSetting#getNextStep}
         * @param nextStep next_step block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#next_step Lexv2ModelsIntent#next_step}
         * @return {@code this}
         */
        public Builder nextStep(com.hashicorp.cdktf.IResolvable nextStep) {
            this.nextStep = nextStep;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentClosingSetting#getNextStep}
         * @param nextStep next_step block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#next_step Lexv2ModelsIntent#next_step}
         * @return {@code this}
         */
        public Builder nextStep(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingNextStep> nextStep) {
            this.nextStep = nextStep;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentClosingSetting}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentClosingSetting build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentClosingSetting}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentClosingSetting {
        private final java.lang.Object active;
        private final java.lang.Object closingResponse;
        private final java.lang.Object conditional;
        private final java.lang.Object nextStep;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.active = software.amazon.jsii.Kernel.get(this, "active", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.closingResponse = software.amazon.jsii.Kernel.get(this, "closingResponse", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.conditional = software.amazon.jsii.Kernel.get(this, "conditional", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.nextStep = software.amazon.jsii.Kernel.get(this, "nextStep", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.active = builder.active;
            this.closingResponse = builder.closingResponse;
            this.conditional = builder.conditional;
            this.nextStep = builder.nextStep;
        }

        @Override
        public final java.lang.Object getActive() {
            return this.active;
        }

        @Override
        public final java.lang.Object getClosingResponse() {
            return this.closingResponse;
        }

        @Override
        public final java.lang.Object getConditional() {
            return this.conditional;
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

            if (this.getActive() != null) {
                data.set("active", om.valueToTree(this.getActive()));
            }
            if (this.getClosingResponse() != null) {
                data.set("closingResponse", om.valueToTree(this.getClosingResponse()));
            }
            if (this.getConditional() != null) {
                data.set("conditional", om.valueToTree(this.getConditional()));
            }
            if (this.getNextStep() != null) {
                data.set("nextStep", om.valueToTree(this.getNextStep()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentClosingSetting"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentClosingSetting.Jsii$Proxy that = (Lexv2ModelsIntentClosingSetting.Jsii$Proxy) o;

            if (this.active != null ? !this.active.equals(that.active) : that.active != null) return false;
            if (this.closingResponse != null ? !this.closingResponse.equals(that.closingResponse) : that.closingResponse != null) return false;
            if (this.conditional != null ? !this.conditional.equals(that.conditional) : that.conditional != null) return false;
            return this.nextStep != null ? this.nextStep.equals(that.nextStep) : that.nextStep == null;
        }

        @Override
        public final int hashCode() {
            int result = this.active != null ? this.active.hashCode() : 0;
            result = 31 * result + (this.closingResponse != null ? this.closingResponse.hashCode() : 0);
            result = 31 * result + (this.conditional != null ? this.conditional.hashCode() : 0);
            result = 31 * result + (this.nextStep != null ? this.nextStep.hashCode() : 0);
            return result;
        }
    }
}
