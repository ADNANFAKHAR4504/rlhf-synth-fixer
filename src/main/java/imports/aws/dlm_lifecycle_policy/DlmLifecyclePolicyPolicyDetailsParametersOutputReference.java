package imports.aws.dlm_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.005Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsParametersOutputReference")
public class DlmLifecyclePolicyPolicyDetailsParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DlmLifecyclePolicyPolicyDetailsParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DlmLifecyclePolicyPolicyDetailsParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DlmLifecyclePolicyPolicyDetailsParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetExcludeBootVolume() {
        software.amazon.jsii.Kernel.call(this, "resetExcludeBootVolume", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNoReboot() {
        software.amazon.jsii.Kernel.call(this, "resetNoReboot", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExcludeBootVolumeInput() {
        return software.amazon.jsii.Kernel.get(this, "excludeBootVolumeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNoRebootInput() {
        return software.amazon.jsii.Kernel.get(this, "noRebootInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getExcludeBootVolume() {
        return software.amazon.jsii.Kernel.get(this, "excludeBootVolume", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setExcludeBootVolume(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "excludeBootVolume", java.util.Objects.requireNonNull(value, "excludeBootVolume is required"));
    }

    public void setExcludeBootVolume(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "excludeBootVolume", java.util.Objects.requireNonNull(value, "excludeBootVolume is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getNoReboot() {
        return software.amazon.jsii.Kernel.get(this, "noReboot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setNoReboot(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "noReboot", java.util.Objects.requireNonNull(value, "noReboot is required"));
    }

    public void setNoReboot(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "noReboot", java.util.Objects.requireNonNull(value, "noReboot is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
