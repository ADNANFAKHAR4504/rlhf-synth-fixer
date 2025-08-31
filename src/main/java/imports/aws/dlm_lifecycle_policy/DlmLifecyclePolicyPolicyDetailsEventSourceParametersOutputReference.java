package imports.aws.dlm_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.005Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsEventSourceParametersOutputReference")
public class DlmLifecyclePolicyPolicyDetailsEventSourceParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DlmLifecyclePolicyPolicyDetailsEventSourceParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DlmLifecyclePolicyPolicyDetailsEventSourceParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DlmLifecyclePolicyPolicyDetailsEventSourceParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionRegexInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionRegexInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEventTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "eventTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSnapshotOwnerInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "snapshotOwnerInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescriptionRegex() {
        return software.amazon.jsii.Kernel.get(this, "descriptionRegex", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescriptionRegex(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "descriptionRegex", java.util.Objects.requireNonNull(value, "descriptionRegex is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEventType() {
        return software.amazon.jsii.Kernel.get(this, "eventType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEventType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eventType", java.util.Objects.requireNonNull(value, "eventType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSnapshotOwner() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "snapshotOwner", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSnapshotOwner(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "snapshotOwner", java.util.Objects.requireNonNull(value, "snapshotOwner is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsEventSourceParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsEventSourceParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsEventSourceParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
