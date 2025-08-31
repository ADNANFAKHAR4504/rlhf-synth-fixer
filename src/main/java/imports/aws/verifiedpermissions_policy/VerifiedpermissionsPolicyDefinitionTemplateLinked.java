package imports.aws.verifiedpermissions_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.582Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedpermissionsPolicy.VerifiedpermissionsPolicyDefinitionTemplateLinked")
@software.amazon.jsii.Jsii.Proxy(VerifiedpermissionsPolicyDefinitionTemplateLinked.Jsii$Proxy.class)
public interface VerifiedpermissionsPolicyDefinitionTemplateLinked extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#policy_template_id VerifiedpermissionsPolicy#policy_template_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPolicyTemplateId();

    /**
     * principal block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#principal VerifiedpermissionsPolicy#principal}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPrincipal() {
        return null;
    }

    /**
     * resource block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#resource VerifiedpermissionsPolicy#resource}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getResource() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedpermissionsPolicyDefinitionTemplateLinked}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedpermissionsPolicyDefinitionTemplateLinked}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedpermissionsPolicyDefinitionTemplateLinked> {
        java.lang.String policyTemplateId;
        java.lang.Object principal;
        java.lang.Object resource;

        /**
         * Sets the value of {@link VerifiedpermissionsPolicyDefinitionTemplateLinked#getPolicyTemplateId}
         * @param policyTemplateId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#policy_template_id VerifiedpermissionsPolicy#policy_template_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder policyTemplateId(java.lang.String policyTemplateId) {
            this.policyTemplateId = policyTemplateId;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsPolicyDefinitionTemplateLinked#getPrincipal}
         * @param principal principal block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#principal VerifiedpermissionsPolicy#principal}
         * @return {@code this}
         */
        public Builder principal(com.hashicorp.cdktf.IResolvable principal) {
            this.principal = principal;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsPolicyDefinitionTemplateLinked#getPrincipal}
         * @param principal principal block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#principal VerifiedpermissionsPolicy#principal}
         * @return {@code this}
         */
        public Builder principal(java.util.List<? extends imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal> principal) {
            this.principal = principal;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsPolicyDefinitionTemplateLinked#getResource}
         * @param resource resource block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#resource VerifiedpermissionsPolicy#resource}
         * @return {@code this}
         */
        public Builder resource(com.hashicorp.cdktf.IResolvable resource) {
            this.resource = resource;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsPolicyDefinitionTemplateLinked#getResource}
         * @param resource resource block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#resource VerifiedpermissionsPolicy#resource}
         * @return {@code this}
         */
        public Builder resource(java.util.List<? extends imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionTemplateLinkedResource> resource) {
            this.resource = resource;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedpermissionsPolicyDefinitionTemplateLinked}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedpermissionsPolicyDefinitionTemplateLinked build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedpermissionsPolicyDefinitionTemplateLinked}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedpermissionsPolicyDefinitionTemplateLinked {
        private final java.lang.String policyTemplateId;
        private final java.lang.Object principal;
        private final java.lang.Object resource;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.policyTemplateId = software.amazon.jsii.Kernel.get(this, "policyTemplateId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.principal = software.amazon.jsii.Kernel.get(this, "principal", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.resource = software.amazon.jsii.Kernel.get(this, "resource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.policyTemplateId = java.util.Objects.requireNonNull(builder.policyTemplateId, "policyTemplateId is required");
            this.principal = builder.principal;
            this.resource = builder.resource;
        }

        @Override
        public final java.lang.String getPolicyTemplateId() {
            return this.policyTemplateId;
        }

        @Override
        public final java.lang.Object getPrincipal() {
            return this.principal;
        }

        @Override
        public final java.lang.Object getResource() {
            return this.resource;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("policyTemplateId", om.valueToTree(this.getPolicyTemplateId()));
            if (this.getPrincipal() != null) {
                data.set("principal", om.valueToTree(this.getPrincipal()));
            }
            if (this.getResource() != null) {
                data.set("resource", om.valueToTree(this.getResource()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedpermissionsPolicy.VerifiedpermissionsPolicyDefinitionTemplateLinked"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedpermissionsPolicyDefinitionTemplateLinked.Jsii$Proxy that = (VerifiedpermissionsPolicyDefinitionTemplateLinked.Jsii$Proxy) o;

            if (!policyTemplateId.equals(that.policyTemplateId)) return false;
            if (this.principal != null ? !this.principal.equals(that.principal) : that.principal != null) return false;
            return this.resource != null ? this.resource.equals(that.resource) : that.resource == null;
        }

        @Override
        public final int hashCode() {
            int result = this.policyTemplateId.hashCode();
            result = 31 * result + (this.principal != null ? this.principal.hashCode() : 0);
            result = 31 * result + (this.resource != null ? this.resource.hashCode() : 0);
            return result;
        }
    }
}
