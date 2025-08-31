package imports.aws.imagebuilder_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.367Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderLifecyclePolicy.ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmisOutputReference")
public class ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmisOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmisOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmisOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmisOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putLastLaunched(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.imagebuilder_lifecycle_policy.ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmisLastLaunched>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.imagebuilder_lifecycle_policy.ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmisLastLaunched> __cast_cd4240 = (java.util.List<imports.aws.imagebuilder_lifecycle_policy.ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmisLastLaunched>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.imagebuilder_lifecycle_policy.ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmisLastLaunched __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLastLaunched", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetIsPublic() {
        software.amazon.jsii.Kernel.call(this, "resetIsPublic", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLastLaunched() {
        software.amazon.jsii.Kernel.call(this, "resetLastLaunched", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegions() {
        software.amazon.jsii.Kernel.call(this, "resetRegions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSharedAccounts() {
        software.amazon.jsii.Kernel.call(this, "resetSharedAccounts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagMap() {
        software.amazon.jsii.Kernel.call(this, "resetTagMap", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_lifecycle_policy.ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmisLastLaunchedList getLastLaunched() {
        return software.amazon.jsii.Kernel.get(this, "lastLaunched", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_lifecycle_policy.ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmisLastLaunchedList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIsPublicInput() {
        return software.amazon.jsii.Kernel.get(this, "isPublicInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLastLaunchedInput() {
        return software.amazon.jsii.Kernel.get(this, "lastLaunchedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "regionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSharedAccountsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "sharedAccountsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagMapInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagMapInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIsPublic() {
        return software.amazon.jsii.Kernel.get(this, "isPublic", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIsPublic(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "isPublic", java.util.Objects.requireNonNull(value, "isPublic is required"));
    }

    public void setIsPublic(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "isPublic", java.util.Objects.requireNonNull(value, "isPublic is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getRegions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "regions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRegions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "regions", java.util.Objects.requireNonNull(value, "regions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSharedAccounts() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "sharedAccounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSharedAccounts(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "sharedAccounts", java.util.Objects.requireNonNull(value, "sharedAccounts is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagMap() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagMap", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagMap(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagMap", java.util.Objects.requireNonNull(value, "tagMap is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_lifecycle_policy.ImagebuilderLifecyclePolicyPolicyDetailExclusionRulesAmis value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
