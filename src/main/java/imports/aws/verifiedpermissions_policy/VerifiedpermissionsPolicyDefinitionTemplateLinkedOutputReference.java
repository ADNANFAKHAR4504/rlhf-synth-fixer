package imports.aws.verifiedpermissions_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.582Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedpermissionsPolicy.VerifiedpermissionsPolicyDefinitionTemplateLinkedOutputReference")
public class VerifiedpermissionsPolicyDefinitionTemplateLinkedOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected VerifiedpermissionsPolicyDefinitionTemplateLinkedOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VerifiedpermissionsPolicyDefinitionTemplateLinkedOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public VerifiedpermissionsPolicyDefinitionTemplateLinkedOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putPrincipal(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal> __cast_cd4240 = (java.util.List<imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipal __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPrincipal", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResource(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionTemplateLinkedResource>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionTemplateLinkedResource> __cast_cd4240 = (java.util.List<imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionTemplateLinkedResource>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionTemplateLinkedResource __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetPrincipal() {
        software.amazon.jsii.Kernel.call(this, "resetPrincipal", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResource() {
        software.amazon.jsii.Kernel.call(this, "resetResource", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipalList getPrincipal() {
        return software.amazon.jsii.Kernel.get(this, "principal", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionTemplateLinkedPrincipalList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionTemplateLinkedResourceList getResource() {
        return software.amazon.jsii.Kernel.get(this, "resource", software.amazon.jsii.NativeType.forClass(imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionTemplateLinkedResourceList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyTemplateIdInput() {
        return software.amazon.jsii.Kernel.get(this, "policyTemplateIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPrincipalInput() {
        return software.amazon.jsii.Kernel.get(this, "principalInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResourceInput() {
        return software.amazon.jsii.Kernel.get(this, "resourceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicyTemplateId() {
        return software.amazon.jsii.Kernel.get(this, "policyTemplateId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicyTemplateId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policyTemplateId", java.util.Objects.requireNonNull(value, "policyTemplateId is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.verifiedpermissions_policy.VerifiedpermissionsPolicyDefinitionTemplateLinked value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
