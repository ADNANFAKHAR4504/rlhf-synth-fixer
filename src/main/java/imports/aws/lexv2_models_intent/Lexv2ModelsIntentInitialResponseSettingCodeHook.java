package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.717Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentInitialResponseSettingCodeHook")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentInitialResponseSettingCodeHook.Jsii$Proxy.class)
public interface Lexv2ModelsIntentInitialResponseSettingCodeHook extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getActive();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#enable_code_hook_invocation Lexv2ModelsIntent#enable_code_hook_invocation}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnableCodeHookInvocation();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#invocation_label Lexv2ModelsIntent#invocation_label}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInvocationLabel() {
        return null;
    }

    /**
     * post_code_hook_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#post_code_hook_specification Lexv2ModelsIntent#post_code_hook_specification}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPostCodeHookSpecification() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentInitialResponseSettingCodeHook}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentInitialResponseSettingCodeHook}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentInitialResponseSettingCodeHook> {
        java.lang.Object active;
        java.lang.Object enableCodeHookInvocation;
        java.lang.String invocationLabel;
        java.lang.Object postCodeHookSpecification;

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingCodeHook#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}. This parameter is required.
         * @return {@code this}
         */
        public Builder active(java.lang.Boolean active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingCodeHook#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}. This parameter is required.
         * @return {@code this}
         */
        public Builder active(com.hashicorp.cdktf.IResolvable active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingCodeHook#getEnableCodeHookInvocation}
         * @param enableCodeHookInvocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#enable_code_hook_invocation Lexv2ModelsIntent#enable_code_hook_invocation}. This parameter is required.
         * @return {@code this}
         */
        public Builder enableCodeHookInvocation(java.lang.Boolean enableCodeHookInvocation) {
            this.enableCodeHookInvocation = enableCodeHookInvocation;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingCodeHook#getEnableCodeHookInvocation}
         * @param enableCodeHookInvocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#enable_code_hook_invocation Lexv2ModelsIntent#enable_code_hook_invocation}. This parameter is required.
         * @return {@code this}
         */
        public Builder enableCodeHookInvocation(com.hashicorp.cdktf.IResolvable enableCodeHookInvocation) {
            this.enableCodeHookInvocation = enableCodeHookInvocation;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingCodeHook#getInvocationLabel}
         * @param invocationLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#invocation_label Lexv2ModelsIntent#invocation_label}.
         * @return {@code this}
         */
        public Builder invocationLabel(java.lang.String invocationLabel) {
            this.invocationLabel = invocationLabel;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingCodeHook#getPostCodeHookSpecification}
         * @param postCodeHookSpecification post_code_hook_specification block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#post_code_hook_specification Lexv2ModelsIntent#post_code_hook_specification}
         * @return {@code this}
         */
        public Builder postCodeHookSpecification(com.hashicorp.cdktf.IResolvable postCodeHookSpecification) {
            this.postCodeHookSpecification = postCodeHookSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingCodeHook#getPostCodeHookSpecification}
         * @param postCodeHookSpecification post_code_hook_specification block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#post_code_hook_specification Lexv2ModelsIntent#post_code_hook_specification}
         * @return {@code this}
         */
        public Builder postCodeHookSpecification(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecification> postCodeHookSpecification) {
            this.postCodeHookSpecification = postCodeHookSpecification;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentInitialResponseSettingCodeHook}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentInitialResponseSettingCodeHook build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentInitialResponseSettingCodeHook}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentInitialResponseSettingCodeHook {
        private final java.lang.Object active;
        private final java.lang.Object enableCodeHookInvocation;
        private final java.lang.String invocationLabel;
        private final java.lang.Object postCodeHookSpecification;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.active = software.amazon.jsii.Kernel.get(this, "active", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableCodeHookInvocation = software.amazon.jsii.Kernel.get(this, "enableCodeHookInvocation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.invocationLabel = software.amazon.jsii.Kernel.get(this, "invocationLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.postCodeHookSpecification = software.amazon.jsii.Kernel.get(this, "postCodeHookSpecification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.active = java.util.Objects.requireNonNull(builder.active, "active is required");
            this.enableCodeHookInvocation = java.util.Objects.requireNonNull(builder.enableCodeHookInvocation, "enableCodeHookInvocation is required");
            this.invocationLabel = builder.invocationLabel;
            this.postCodeHookSpecification = builder.postCodeHookSpecification;
        }

        @Override
        public final java.lang.Object getActive() {
            return this.active;
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
        public final java.lang.Object getPostCodeHookSpecification() {
            return this.postCodeHookSpecification;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("active", om.valueToTree(this.getActive()));
            data.set("enableCodeHookInvocation", om.valueToTree(this.getEnableCodeHookInvocation()));
            if (this.getInvocationLabel() != null) {
                data.set("invocationLabel", om.valueToTree(this.getInvocationLabel()));
            }
            if (this.getPostCodeHookSpecification() != null) {
                data.set("postCodeHookSpecification", om.valueToTree(this.getPostCodeHookSpecification()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentInitialResponseSettingCodeHook"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentInitialResponseSettingCodeHook.Jsii$Proxy that = (Lexv2ModelsIntentInitialResponseSettingCodeHook.Jsii$Proxy) o;

            if (!active.equals(that.active)) return false;
            if (!enableCodeHookInvocation.equals(that.enableCodeHookInvocation)) return false;
            if (this.invocationLabel != null ? !this.invocationLabel.equals(that.invocationLabel) : that.invocationLabel != null) return false;
            return this.postCodeHookSpecification != null ? this.postCodeHookSpecification.equals(that.postCodeHookSpecification) : that.postCodeHookSpecification == null;
        }

        @Override
        public final int hashCode() {
            int result = this.active.hashCode();
            result = 31 * result + (this.enableCodeHookInvocation.hashCode());
            result = 31 * result + (this.invocationLabel != null ? this.invocationLabel.hashCode() : 0);
            result = 31 * result + (this.postCodeHookSpecification != null ? this.postCodeHookSpecification.hashCode() : 0);
            return result;
        }
    }
}
