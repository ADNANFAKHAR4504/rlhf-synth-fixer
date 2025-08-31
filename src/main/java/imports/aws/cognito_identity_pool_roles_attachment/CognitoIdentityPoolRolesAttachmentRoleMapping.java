package imports.aws.cognito_identity_pool_roles_attachment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.340Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoIdentityPoolRolesAttachment.CognitoIdentityPoolRolesAttachmentRoleMapping")
@software.amazon.jsii.Jsii.Proxy(CognitoIdentityPoolRolesAttachmentRoleMapping.Jsii$Proxy.class)
public interface CognitoIdentityPoolRolesAttachmentRoleMapping extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#identity_provider CognitoIdentityPoolRolesAttachment#identity_provider}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIdentityProvider();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#type CognitoIdentityPoolRolesAttachment#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#ambiguous_role_resolution CognitoIdentityPoolRolesAttachment#ambiguous_role_resolution}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAmbiguousRoleResolution() {
        return null;
    }

    /**
     * mapping_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#mapping_rule CognitoIdentityPoolRolesAttachment#mapping_rule}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMappingRule() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoIdentityPoolRolesAttachmentRoleMapping}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoIdentityPoolRolesAttachmentRoleMapping}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoIdentityPoolRolesAttachmentRoleMapping> {
        java.lang.String identityProvider;
        java.lang.String type;
        java.lang.String ambiguousRoleResolution;
        java.lang.Object mappingRule;

        /**
         * Sets the value of {@link CognitoIdentityPoolRolesAttachmentRoleMapping#getIdentityProvider}
         * @param identityProvider Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#identity_provider CognitoIdentityPoolRolesAttachment#identity_provider}. This parameter is required.
         * @return {@code this}
         */
        public Builder identityProvider(java.lang.String identityProvider) {
            this.identityProvider = identityProvider;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolRolesAttachmentRoleMapping#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#type CognitoIdentityPoolRolesAttachment#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolRolesAttachmentRoleMapping#getAmbiguousRoleResolution}
         * @param ambiguousRoleResolution Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#ambiguous_role_resolution CognitoIdentityPoolRolesAttachment#ambiguous_role_resolution}.
         * @return {@code this}
         */
        public Builder ambiguousRoleResolution(java.lang.String ambiguousRoleResolution) {
            this.ambiguousRoleResolution = ambiguousRoleResolution;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolRolesAttachmentRoleMapping#getMappingRule}
         * @param mappingRule mapping_rule block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#mapping_rule CognitoIdentityPoolRolesAttachment#mapping_rule}
         * @return {@code this}
         */
        public Builder mappingRule(com.hashicorp.cdktf.IResolvable mappingRule) {
            this.mappingRule = mappingRule;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolRolesAttachmentRoleMapping#getMappingRule}
         * @param mappingRule mapping_rule block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#mapping_rule CognitoIdentityPoolRolesAttachment#mapping_rule}
         * @return {@code this}
         */
        public Builder mappingRule(java.util.List<? extends imports.aws.cognito_identity_pool_roles_attachment.CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule> mappingRule) {
            this.mappingRule = mappingRule;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoIdentityPoolRolesAttachmentRoleMapping}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoIdentityPoolRolesAttachmentRoleMapping build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoIdentityPoolRolesAttachmentRoleMapping}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoIdentityPoolRolesAttachmentRoleMapping {
        private final java.lang.String identityProvider;
        private final java.lang.String type;
        private final java.lang.String ambiguousRoleResolution;
        private final java.lang.Object mappingRule;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.identityProvider = software.amazon.jsii.Kernel.get(this, "identityProvider", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ambiguousRoleResolution = software.amazon.jsii.Kernel.get(this, "ambiguousRoleResolution", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mappingRule = software.amazon.jsii.Kernel.get(this, "mappingRule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.identityProvider = java.util.Objects.requireNonNull(builder.identityProvider, "identityProvider is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.ambiguousRoleResolution = builder.ambiguousRoleResolution;
            this.mappingRule = builder.mappingRule;
        }

        @Override
        public final java.lang.String getIdentityProvider() {
            return this.identityProvider;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getAmbiguousRoleResolution() {
            return this.ambiguousRoleResolution;
        }

        @Override
        public final java.lang.Object getMappingRule() {
            return this.mappingRule;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("identityProvider", om.valueToTree(this.getIdentityProvider()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getAmbiguousRoleResolution() != null) {
                data.set("ambiguousRoleResolution", om.valueToTree(this.getAmbiguousRoleResolution()));
            }
            if (this.getMappingRule() != null) {
                data.set("mappingRule", om.valueToTree(this.getMappingRule()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoIdentityPoolRolesAttachment.CognitoIdentityPoolRolesAttachmentRoleMapping"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoIdentityPoolRolesAttachmentRoleMapping.Jsii$Proxy that = (CognitoIdentityPoolRolesAttachmentRoleMapping.Jsii$Proxy) o;

            if (!identityProvider.equals(that.identityProvider)) return false;
            if (!type.equals(that.type)) return false;
            if (this.ambiguousRoleResolution != null ? !this.ambiguousRoleResolution.equals(that.ambiguousRoleResolution) : that.ambiguousRoleResolution != null) return false;
            return this.mappingRule != null ? this.mappingRule.equals(that.mappingRule) : that.mappingRule == null;
        }

        @Override
        public final int hashCode() {
            int result = this.identityProvider.hashCode();
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.ambiguousRoleResolution != null ? this.ambiguousRoleResolution.hashCode() : 0);
            result = 31 * result + (this.mappingRule != null ? this.mappingRule.hashCode() : 0);
            return result;
        }
    }
}
