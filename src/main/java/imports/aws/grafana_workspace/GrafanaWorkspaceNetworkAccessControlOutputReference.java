package imports.aws.grafana_workspace;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.309Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.grafanaWorkspace.GrafanaWorkspaceNetworkAccessControlOutputReference")
public class GrafanaWorkspaceNetworkAccessControlOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GrafanaWorkspaceNetworkAccessControlOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GrafanaWorkspaceNetworkAccessControlOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GrafanaWorkspaceNetworkAccessControlOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPrefixListIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "prefixListIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpceIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "vpceIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPrefixListIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "prefixListIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setPrefixListIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "prefixListIds", java.util.Objects.requireNonNull(value, "prefixListIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getVpceIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "vpceIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setVpceIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "vpceIds", java.util.Objects.requireNonNull(value, "vpceIds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.grafana_workspace.GrafanaWorkspaceNetworkAccessControl getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.grafana_workspace.GrafanaWorkspaceNetworkAccessControl.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.grafana_workspace.GrafanaWorkspaceNetworkAccessControl value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
