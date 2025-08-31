package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.775Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentInitialResponseSettingNextStep")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentInitialResponseSettingNextStep.Jsii$Proxy.class)
public interface Lexv2ModelsIntentInitialResponseSettingNextStep extends software.amazon.jsii.JsiiSerializable {

    /**
     * dialog_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#dialog_action Lexv2ModelsIntent#dialog_action}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDialogAction() {
        return null;
    }

    /**
     * intent block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#intent Lexv2ModelsIntent#intent}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIntent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#session_attributes Lexv2ModelsIntent#session_attributes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getSessionAttributes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentInitialResponseSettingNextStep}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentInitialResponseSettingNextStep}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentInitialResponseSettingNextStep> {
        java.lang.Object dialogAction;
        java.lang.Object intent;
        java.util.Map<java.lang.String, java.lang.String> sessionAttributes;

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingNextStep#getDialogAction}
         * @param dialogAction dialog_action block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#dialog_action Lexv2ModelsIntent#dialog_action}
         * @return {@code this}
         */
        public Builder dialogAction(com.hashicorp.cdktf.IResolvable dialogAction) {
            this.dialogAction = dialogAction;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingNextStep#getDialogAction}
         * @param dialogAction dialog_action block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#dialog_action Lexv2ModelsIntent#dialog_action}
         * @return {@code this}
         */
        public Builder dialogAction(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingNextStepDialogAction> dialogAction) {
            this.dialogAction = dialogAction;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingNextStep#getIntent}
         * @param intent intent block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#intent Lexv2ModelsIntent#intent}
         * @return {@code this}
         */
        public Builder intent(com.hashicorp.cdktf.IResolvable intent) {
            this.intent = intent;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingNextStep#getIntent}
         * @param intent intent block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#intent Lexv2ModelsIntent#intent}
         * @return {@code this}
         */
        public Builder intent(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingNextStepIntent> intent) {
            this.intent = intent;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingNextStep#getSessionAttributes}
         * @param sessionAttributes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#session_attributes Lexv2ModelsIntent#session_attributes}.
         * @return {@code this}
         */
        public Builder sessionAttributes(java.util.Map<java.lang.String, java.lang.String> sessionAttributes) {
            this.sessionAttributes = sessionAttributes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentInitialResponseSettingNextStep}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentInitialResponseSettingNextStep build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentInitialResponseSettingNextStep}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentInitialResponseSettingNextStep {
        private final java.lang.Object dialogAction;
        private final java.lang.Object intent;
        private final java.util.Map<java.lang.String, java.lang.String> sessionAttributes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dialogAction = software.amazon.jsii.Kernel.get(this, "dialogAction", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.intent = software.amazon.jsii.Kernel.get(this, "intent", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sessionAttributes = software.amazon.jsii.Kernel.get(this, "sessionAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dialogAction = builder.dialogAction;
            this.intent = builder.intent;
            this.sessionAttributes = builder.sessionAttributes;
        }

        @Override
        public final java.lang.Object getDialogAction() {
            return this.dialogAction;
        }

        @Override
        public final java.lang.Object getIntent() {
            return this.intent;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getSessionAttributes() {
            return this.sessionAttributes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDialogAction() != null) {
                data.set("dialogAction", om.valueToTree(this.getDialogAction()));
            }
            if (this.getIntent() != null) {
                data.set("intent", om.valueToTree(this.getIntent()));
            }
            if (this.getSessionAttributes() != null) {
                data.set("sessionAttributes", om.valueToTree(this.getSessionAttributes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentInitialResponseSettingNextStep"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentInitialResponseSettingNextStep.Jsii$Proxy that = (Lexv2ModelsIntentInitialResponseSettingNextStep.Jsii$Proxy) o;

            if (this.dialogAction != null ? !this.dialogAction.equals(that.dialogAction) : that.dialogAction != null) return false;
            if (this.intent != null ? !this.intent.equals(that.intent) : that.intent != null) return false;
            return this.sessionAttributes != null ? this.sessionAttributes.equals(that.sessionAttributes) : that.sessionAttributes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dialogAction != null ? this.dialogAction.hashCode() : 0;
            result = 31 * result + (this.intent != null ? this.intent.hashCode() : 0);
            result = 31 * result + (this.sessionAttributes != null ? this.sessionAttributes.hashCode() : 0);
            return result;
        }
    }
}
