package imports.aws.verifiedpermissions_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.582Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedpermissionsPolicy.VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal")
@software.amazon.jsii.Jsii.Proxy(VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal.Jsii$Proxy.class)
public interface VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#entity_id VerifiedpermissionsPolicy#entity_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEntityId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#entity_type VerifiedpermissionsPolicy#entity_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEntityType();

    /**
     * @return a {@link Builder} of {@link VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal> {
        java.lang.String entityId;
        java.lang.String entityType;

        /**
         * Sets the value of {@link VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal#getEntityId}
         * @param entityId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#entity_id VerifiedpermissionsPolicy#entity_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder entityId(java.lang.String entityId) {
            this.entityId = entityId;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal#getEntityType}
         * @param entityType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedpermissions_policy#entity_type VerifiedpermissionsPolicy#entity_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder entityType(java.lang.String entityType) {
            this.entityType = entityType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal {
        private final java.lang.String entityId;
        private final java.lang.String entityType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.entityId = software.amazon.jsii.Kernel.get(this, "entityId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.entityType = software.amazon.jsii.Kernel.get(this, "entityType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.entityId = java.util.Objects.requireNonNull(builder.entityId, "entityId is required");
            this.entityType = java.util.Objects.requireNonNull(builder.entityType, "entityType is required");
        }

        @Override
        public final java.lang.String getEntityId() {
            return this.entityId;
        }

        @Override
        public final java.lang.String getEntityType() {
            return this.entityType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("entityId", om.valueToTree(this.getEntityId()));
            data.set("entityType", om.valueToTree(this.getEntityType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedpermissionsPolicy.VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal.Jsii$Proxy that = (VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal.Jsii$Proxy) o;

            if (!entityId.equals(that.entityId)) return false;
            return this.entityType.equals(that.entityType);
        }

        @Override
        public final int hashCode() {
            int result = this.entityId.hashCode();
            result = 31 * result + (this.entityType.hashCode());
            return result;
        }
    }
}
