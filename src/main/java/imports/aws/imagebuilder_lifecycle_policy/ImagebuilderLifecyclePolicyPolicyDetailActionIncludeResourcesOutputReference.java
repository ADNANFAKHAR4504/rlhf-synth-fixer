package imports.aws.imagebuilder_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.366Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderLifecyclePolicy.ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResourcesOutputReference")
public class ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResourcesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResourcesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResourcesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResourcesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetAmis() {
        software.amazon.jsii.Kernel.call(this, "resetAmis", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContainers() {
        software.amazon.jsii.Kernel.call(this, "resetContainers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshots() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshots", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAmisInput() {
        return software.amazon.jsii.Kernel.get(this, "amisInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getContainersInput() {
        return software.amazon.jsii.Kernel.get(this, "containersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSnapshotsInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAmis() {
        return software.amazon.jsii.Kernel.get(this, "amis", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAmis(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "amis", java.util.Objects.requireNonNull(value, "amis is required"));
    }

    public void setAmis(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "amis", java.util.Objects.requireNonNull(value, "amis is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getContainers() {
        return software.amazon.jsii.Kernel.get(this, "containers", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setContainers(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "containers", java.util.Objects.requireNonNull(value, "containers is required"));
    }

    public void setContainers(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "containers", java.util.Objects.requireNonNull(value, "containers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSnapshots() {
        return software.amazon.jsii.Kernel.get(this, "snapshots", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSnapshots(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "snapshots", java.util.Objects.requireNonNull(value, "snapshots is required"));
    }

    public void setSnapshots(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "snapshots", java.util.Objects.requireNonNull(value, "snapshots is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_lifecycle_policy.ImagebuilderLifecyclePolicyPolicyDetailActionIncludeResources value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
