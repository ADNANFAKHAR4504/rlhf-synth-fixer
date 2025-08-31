package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.644Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingElicitationCodeHook")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentConfirmationSettingElicitationCodeHook.Jsii$Proxy.class)
public interface Lexv2ModelsIntentConfirmationSettingElicitationCodeHook extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#enable_code_hook_invocation Lexv2ModelsIntent#enable_code_hook_invocation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableCodeHookInvocation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#invocation_label Lexv2ModelsIntent#invocation_label}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInvocationLabel() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentConfirmationSettingElicitationCodeHook}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentConfirmationSettingElicitationCodeHook}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentConfirmationSettingElicitationCodeHook> {
        java.lang.Object enableCodeHookInvocation;
        java.lang.String invocationLabel;

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingElicitationCodeHook#getEnableCodeHookInvocation}
         * @param enableCodeHookInvocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#enable_code_hook_invocation Lexv2ModelsIntent#enable_code_hook_invocation}.
         * @return {@code this}
         */
        public Builder enableCodeHookInvocation(java.lang.Boolean enableCodeHookInvocation) {
            this.enableCodeHookInvocation = enableCodeHookInvocation;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingElicitationCodeHook#getEnableCodeHookInvocation}
         * @param enableCodeHookInvocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#enable_code_hook_invocation Lexv2ModelsIntent#enable_code_hook_invocation}.
         * @return {@code this}
         */
        public Builder enableCodeHookInvocation(com.hashicorp.cdktf.IResolvable enableCodeHookInvocation) {
            this.enableCodeHookInvocation = enableCodeHookInvocation;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentConfirmationSettingElicitationCodeHook#getInvocationLabel}
         * @param invocationLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#invocation_label Lexv2ModelsIntent#invocation_label}.
         * @return {@code this}
         */
        public Builder invocationLabel(java.lang.String invocationLabel) {
            this.invocationLabel = invocationLabel;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentConfirmationSettingElicitationCodeHook}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentConfirmationSettingElicitationCodeHook build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentConfirmationSettingElicitationCodeHook}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentConfirmationSettingElicitationCodeHook {
        private final java.lang.Object enableCodeHookInvocation;
        private final java.lang.String invocationLabel;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enableCodeHookInvocation = software.amazon.jsii.Kernel.get(this, "enableCodeHookInvocation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.invocationLabel = software.amazon.jsii.Kernel.get(this, "invocationLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enableCodeHookInvocation = builder.enableCodeHookInvocation;
            this.invocationLabel = builder.invocationLabel;
        }

        @Override
        public final java.lang.Object getEnableCodeHookInvocation() {
            return this.enableCodeHookInvocation;
        }

        @Override
        public final java.lang.String getInvocationLabel() {
            return this.invocationLabel;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnableCodeHookInvocation() != null) {
                data.set("enableCodeHookInvocation", om.valueToTree(this.getEnableCodeHookInvocation()));
            }
            if (this.getInvocationLabel() != null) {
                data.set("invocationLabel", om.valueToTree(this.getInvocationLabel()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentConfirmationSettingElicitationCodeHook"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentConfirmationSettingElicitationCodeHook.Jsii$Proxy that = (Lexv2ModelsIntentConfirmationSettingElicitationCodeHook.Jsii$Proxy) o;

            if (this.enableCodeHookInvocation != null ? !this.enableCodeHookInvocation.equals(that.enableCodeHookInvocation) : that.enableCodeHookInvocation != null) return false;
            return this.invocationLabel != null ? this.invocationLabel.equals(that.invocationLabel) : that.invocationLabel == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enableCodeHookInvocation != null ? this.enableCodeHookInvocation.hashCode() : 0;
            result = 31 * result + (this.invocationLabel != null ? this.invocationLabel.hashCode() : 0);
            return result;
        }
    }
}
