package imports.aws.verifiedpermissions_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.582Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedpermissionsPolicy.VerifiedpermissionsPolicyDefinition")
@software.amazon.jsii.Jsii.Proxy(VerifiedpermissionsPolicyDefinition.Jsii$Proxy.class)
public interface VerifiedpermissionsPolicyDefinition extends software.amazon.jsii.JsiiSerializable {

    /**
     * static block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#static VerifiedpermissionsPolicy#static}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStaticValue() {
        return null;
    }

    /**
     * template_linked block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#template_linked VerifiedpermissionsPolicy#template_linked}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTemplateLinked() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedpermissionsPolicyDefinition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedpermissionsPolicyDefinition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedpermissionsPolicyDefinition> {
        java.lang.Object staticValue;
        java.lang.Object templateLinked;

        /**
         * Sets the value of {@link VerifiedpermissionsPolicyDefinition#getStaticValue}
         * @param staticValue static block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#static VerifiedpermissionsPolicy#static}
         * @return {@code this}
         */
        public Builder staticValue(com.hashicorp.cdktf.IResolvable staticValue) {
            this.staticValue = staticValue;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsPolicyDefinition#getStaticValue}
         * @param staticValue static block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#static VerifiedpermissionsPolicy#static}
         * @return {@code this}
         */
        public Builder staticValue(java.util.List<? extends imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionStatic> staticValue) {
            this.staticValue = staticValue;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsPolicyDefinition#getTemplateLinked}
         * @param templateLinked template_linked block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#template_linked VerifiedpermissionsPolicy#template_linked}
         * @return {@code this}
         */
        public Builder templateLinked(com.hashicorp.cdktf.IResolvable templateLinked) {
            this.templateLinked = templateLinked;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsPolicyDefinition#getTemplateLinked}
         * @param templateLinked template_linked block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#template_linked VerifiedpermissionsPolicy#template_linked}
         * @return {@code this}
         */
        public Builder templateLinked(java.util.List<? extends imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionTemplateLinked> templateLinked) {
            this.templateLinked = templateLinked;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedpermissionsPolicyDefinition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedpermissionsPolicyDefinition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedpermissionsPolicyDefinition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedpermissionsPolicyDefinition {
        private final java.lang.Object staticValue;
        private final java.lang.Object templateLinked;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.staticValue = software.amazon.jsii.Kernel.get(this, "static", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.templateLinked = software.amazon.jsii.Kernel.get(this, "templateLinked", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.staticValue = builder.staticValue;
            this.templateLinked = builder.templateLinked;
        }

        @Override
        public final java.lang.Object getStaticValue() {
            return this.staticValue;
        }

        @Override
        public final java.lang.Object getTemplateLinked() {
            return this.templateLinked;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getStaticValue() != null) {
                data.set("static", om.valueToTree(this.getStaticValue()));
            }
            if (this.getTemplateLinked() != null) {
                data.set("templateLinked", om.valueToTree(this.getTemplateLinked()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedpermissionsPolicy.VerifiedpermissionsPolicyDefinition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedpermissionsPolicyDefinition.Jsii$Proxy that = (VerifiedpermissionsPolicyDefinition.Jsii$Proxy) o;

            if (this.staticValue != null ? !this.staticValue.equals(that.staticValue) : that.staticValue != null) return false;
            return this.templateLinked != null ? this.templateLinked.equals(that.templateLinked) : that.templateLinked == null;
        }

        @Override
        public final int hashCode() {
            int result = this.staticValue != null ? this.staticValue.hashCode() : 0;
            result = 31 * result + (this.templateLinked != null ? this.templateLinked.hashCode() : 0);
            return result;
        }
    }
}
