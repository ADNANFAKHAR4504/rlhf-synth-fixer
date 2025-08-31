package imports.aws.finspace_kx_dataview;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.223Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxDataview.FinspaceKxDataviewSegmentConfigurationsOutputReference")
public class FinspaceKxDataviewSegmentConfigurationsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FinspaceKxDataviewSegmentConfigurationsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FinspaceKxDataviewSegmentConfigurationsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public FinspaceKxDataviewSegmentConfigurationsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetOnDemand() {
        software.amazon.jsii.Kernel.call(this, "resetOnDemand", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDbPathsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "dbPathsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOnDemandInput() {
        return software.amazon.jsii.Kernel.get(this, "onDemandInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVolumeNameInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getDbPaths() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "dbPaths", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setDbPaths(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "dbPaths", java.util.Objects.requireNonNull(value, "dbPaths is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getOnDemand() {
        return software.amazon.jsii.Kernel.get(this, "onDemand", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setOnDemand(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "onDemand", java.util.Objects.requireNonNull(value, "onDemand is required"));
    }

    public void setOnDemand(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "onDemand", java.util.Objects.requireNonNull(value, "onDemand is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVolumeName() {
        return software.amazon.jsii.Kernel.get(this, "volumeName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVolumeName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "volumeName", java.util.Objects.requireNonNull(value, "volumeName is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_dataview.FinspaceKxDataviewSegmentConfigurations value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
