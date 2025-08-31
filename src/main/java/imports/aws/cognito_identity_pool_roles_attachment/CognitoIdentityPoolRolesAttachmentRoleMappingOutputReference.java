package imports.aws.cognito_identity_pool_roles_attachment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.340Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoIdentityPoolRolesAttachment.CognitoIdentityPoolRolesAttachmentRoleMappingOutputReference")
public class CognitoIdentityPoolRolesAttachmentRoleMappingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CognitoIdentityPoolRolesAttachmentRoleMappingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CognitoIdentityPoolRolesAttachmentRoleMappingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CognitoIdentityPoolRolesAttachmentRoleMappingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putMappingRule(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cognito_identity_pool_roles_attachment.CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cognito_identity_pool_roles_attachment.CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule> __cast_cd4240 = (java.util.List<imports.aws.cognito_identity_pool_roles_attachment.CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cognito_identity_pool_roles_attachment.CognitoIdentityPoolRolesAttachmentRoleMappingMappingRule __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMappingRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAmbiguousRoleResolution() {
        software.amazon.jsii.Kernel.call(this, "resetAmbiguousRoleResolution", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMappingRule() {
        software.amazon.jsii.Kernel.call(this, "resetMappingRule", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cognito_identity_pool_roles_attachment.CognitoIdentityPoolRolesAttachmentRoleMappingMappingRuleList getMappingRule() {
        return software.amazon.jsii.Kernel.get(this, "mappingRule", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_identity_pool_roles_attachment.CognitoIdentityPoolRolesAttachmentRoleMappingMappingRuleList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAmbiguousRoleResolutionInput() {
        return software.amazon.jsii.Kernel.get(this, "ambiguousRoleResolutionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdentityProviderInput() {
        return software.amazon.jsii.Kernel.get(this, "identityProviderInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMappingRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "mappingRuleInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAmbiguousRoleResolution() {
        return software.amazon.jsii.Kernel.get(this, "ambiguousRoleResolution", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAmbiguousRoleResolution(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ambiguousRoleResolution", java.util.Objects.requireNonNull(value, "ambiguousRoleResolution is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIdentityProvider() {
        return software.amazon.jsii.Kernel.get(this, "identityProvider", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIdentityProvider(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "identityProvider", java.util.Objects.requireNonNull(value, "identityProvider is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cognito_identity_pool_roles_attachment.CognitoIdentityPoolRolesAttachmentRoleMapping value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
