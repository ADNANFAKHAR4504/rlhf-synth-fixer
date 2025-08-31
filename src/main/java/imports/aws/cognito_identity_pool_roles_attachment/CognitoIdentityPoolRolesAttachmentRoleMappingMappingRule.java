package imports.aws.cognito_identity_pool_roles_attachment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.340Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoIdentityPoolRolesAttachment.CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule")
@software.amazon.jsii.Jsii.Proxy(CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule.Jsii$Proxy.class)
public interface CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#claim CognitoIdentityPoolRolesAttachment#claim}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClaim();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#match_type CognitoIdentityPoolRolesAttachment#match_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMatchType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#role_arn CognitoIdentityPoolRolesAttachment#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#value CognitoIdentityPoolRolesAttachment#value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getValue();

    /**
     * @return a {@link Builder} of {@link CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule> {
        java.lang.String claim;
        java.lang.String matchType;
        java.lang.String roleArn;
        java.lang.String value;

        /**
         * Sets the value of {@link CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule#getClaim}
         * @param claim Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#claim CognitoIdentityPoolRolesAttachment#claim}. This parameter is required.
         * @return {@code this}
         */
        public Builder claim(java.lang.String claim) {
            this.claim = claim;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule#getMatchType}
         * @param matchType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#match_type CognitoIdentityPoolRolesAttachment#match_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder matchType(java.lang.String matchType) {
            this.matchType = matchType;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#role_arn CognitoIdentityPoolRolesAttachment#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_identity_pool_roles_attachment#value CognitoIdentityPoolRolesAttachment#value}. This parameter is required.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule {
        private final java.lang.String claim;
        private final java.lang.String matchType;
        private final java.lang.String roleArn;
        private final java.lang.String value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.claim = software.amazon.jsii.Kernel.get(this, "claim", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.matchType = software.amazon.jsii.Kernel.get(this, "matchType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.claim = java.util.Objects.requireNonNull(builder.claim, "claim is required");
            this.matchType = java.util.Objects.requireNonNull(builder.matchType, "matchType is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.value = java.util.Objects.requireNonNull(builder.value, "value is required");
        }

        @Override
        public final java.lang.String getClaim() {
            return this.claim;
        }

        @Override
        public final java.lang.String getMatchType() {
            return this.matchType;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("claim", om.valueToTree(this.getClaim()));
            data.set("matchType", om.valueToTree(this.getMatchType()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            data.set("value", om.valueToTree(this.getValue()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cognitoIdentityPoolRolesAttachment.CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule.Jsii$Proxy that = (CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule.Jsii$Proxy) o;

            if (!claim.equals(that.claim)) return false;
            if (!matchType.equals(that.matchType)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            return this.value.equals(that.value);
        }

        @Override
        public final int hashCode() {
            int result = this.claim.hashCode();
            result = 31 * result + (this.matchType.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.value.hashCode());
            return result;
        }
    }
}
