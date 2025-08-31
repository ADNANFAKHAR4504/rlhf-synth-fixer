package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.718Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional.Jsii$Proxy.class)
public interface Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getActive();

    /**
     * conditional_branch block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#conditional_branch Lexv2ModelsIntent#conditional_branch}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConditionalBranch() {
        return null;
    }

    /**
     * default_branch block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#default_branch Lexv2ModelsIntent#default_branch}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDefaultBranch() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional> {
        java.lang.Object active;
        java.lang.Object conditionalBranch;
        java.lang.Object defaultBranch;

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}. This parameter is required.
         * @return {@code this}
         */
        public Builder active(java.lang.Boolean active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}. This parameter is required.
         * @return {@code this}
         */
        public Builder active(com.hashicorp.cdktf.IResolvable active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional#getConditionalBranch}
         * @param conditionalBranch conditional_branch block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#conditional_branch Lexv2ModelsIntent#conditional_branch}
         * @return {@code this}
         */
        public Builder conditionalBranch(com.hashicorp.cdktf.IResolvable conditionalBranch) {
            this.conditionalBranch = conditionalBranch;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional#getConditionalBranch}
         * @param conditionalBranch conditional_branch block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#conditional_branch Lexv2ModelsIntent#conditional_branch}
         * @return {@code this}
         */
        public Builder conditionalBranch(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditionalConditionalBranch> conditionalBranch) {
            this.conditionalBranch = conditionalBranch;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional#getDefaultBranch}
         * @param defaultBranch default_branch block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#default_branch Lexv2ModelsIntent#default_branch}
         * @return {@code this}
         */
        public Builder defaultBranch(com.hashicorp.cdktf.IResolvable defaultBranch) {
            this.defaultBranch = defaultBranch;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional#getDefaultBranch}
         * @param defaultBranch default_branch block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#default_branch Lexv2ModelsIntent#default_branch}
         * @return {@code this}
         */
        public Builder defaultBranch(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditionalDefaultBranch> defaultBranch) {
            this.defaultBranch = defaultBranch;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional {
        private final java.lang.Object active;
        private final java.lang.Object conditionalBranch;
        private final java.lang.Object defaultBranch;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.active = software.amazon.jsii.Kernel.get(this, "active", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.conditionalBranch = software.amazon.jsii.Kernel.get(this, "conditionalBranch", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.defaultBranch = software.amazon.jsii.Kernel.get(this, "defaultBranch", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.active = java.util.Objects.requireNonNull(builder.active, "active is required");
            this.conditionalBranch = builder.conditionalBranch;
            this.defaultBranch = builder.defaultBranch;
        }

        @Override
        public final java.lang.Object getActive() {
            return this.active;
        }

        @Override
        public final java.lang.Object getConditionalBranch() {
            return this.conditionalBranch;
        }

        @Override
        public final java.lang.Object getDefaultBranch() {
            return this.defaultBranch;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("active", om.valueToTree(this.getActive()));
            if (this.getConditionalBranch() != null) {
                data.set("conditionalBranch", om.valueToTree(this.getConditionalBranch()));
            }
            if (this.getDefaultBranch() != null) {
                data.set("defaultBranch", om.valueToTree(this.getDefaultBranch()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional.Jsii$Proxy that = (Lexv2ModelsIntentInitialResponseSettingCodeHookPostCodeHookSpecificationFailureConditional.Jsii$Proxy) o;

            if (!active.equals(that.active)) return false;
            if (this.conditionalBranch != null ? !this.conditionalBranch.equals(that.conditionalBranch) : that.conditionalBranch != null) return false;
            return this.defaultBranch != null ? this.defaultBranch.equals(that.defaultBranch) : that.defaultBranch == null;
        }

        @Override
        public final int hashCode() {
            int result = this.active.hashCode();
            result = 31 * result + (this.conditionalBranch != null ? this.conditionalBranch.hashCode() : 0);
            result = 31 * result + (this.defaultBranch != null ? this.defaultBranch.hashCode() : 0);
            return result;
        }
    }
}
