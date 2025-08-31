package imports.aws.batch_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.131Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.batchJobDefinition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContextOutputReference")
public class BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContextOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContextOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContextOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContextOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetPrivileged() {
        software.amazon.jsii.Kernel.call(this, "resetPrivileged", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReadOnlyRootFileSystem() {
        software.amazon.jsii.Kernel.call(this, "resetReadOnlyRootFileSystem", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRunAsGroup() {
        software.amazon.jsii.Kernel.call(this, "resetRunAsGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRunAsNonRoot() {
        software.amazon.jsii.Kernel.call(this, "resetRunAsNonRoot", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRunAsUser() {
        software.amazon.jsii.Kernel.call(this, "resetRunAsUser", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPrivilegedInput() {
        return software.amazon.jsii.Kernel.get(this, "privilegedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getReadOnlyRootFileSystemInput() {
        return software.amazon.jsii.Kernel.get(this, "readOnlyRootFileSystemInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRunAsGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "runAsGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRunAsNonRootInput() {
        return software.amazon.jsii.Kernel.get(this, "runAsNonRootInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRunAsUserInput() {
        return software.amazon.jsii.Kernel.get(this, "runAsUserInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPrivileged() {
        return software.amazon.jsii.Kernel.get(this, "privileged", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPrivileged(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "privileged", java.util.Objects.requireNonNull(value, "privileged is required"));
    }

    public void setPrivileged(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "privileged", java.util.Objects.requireNonNull(value, "privileged is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getReadOnlyRootFileSystem() {
        return software.amazon.jsii.Kernel.get(this, "readOnlyRootFileSystem", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setReadOnlyRootFileSystem(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "readOnlyRootFileSystem", java.util.Objects.requireNonNull(value, "readOnlyRootFileSystem is required"));
    }

    public void setReadOnlyRootFileSystem(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "readOnlyRootFileSystem", java.util.Objects.requireNonNull(value, "readOnlyRootFileSystem is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRunAsGroup() {
        return software.amazon.jsii.Kernel.get(this, "runAsGroup", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRunAsGroup(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "runAsGroup", java.util.Objects.requireNonNull(value, "runAsGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRunAsNonRoot() {
        return software.amazon.jsii.Kernel.get(this, "runAsNonRoot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRunAsNonRoot(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "runAsNonRoot", java.util.Objects.requireNonNull(value, "runAsNonRoot is required"));
    }

    public void setRunAsNonRoot(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "runAsNonRoot", java.util.Objects.requireNonNull(value, "runAsNonRoot is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRunAsUser() {
        return software.amazon.jsii.Kernel.get(this, "runAsUser", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRunAsUser(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "runAsUser", java.util.Objects.requireNonNull(value, "runAsUser is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.batch_job_definition.BatchJobDefinitionEksPropertiesPodPropertiesInitContainersSecurityContext value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
