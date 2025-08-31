package imports.aws.glue_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.296Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueJob.GlueJobCommandOutputReference")
public class GlueJobCommandOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueJobCommandOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueJobCommandOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueJobCommandOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPythonVersion() {
        software.amazon.jsii.Kernel.call(this, "resetPythonVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRuntime() {
        software.amazon.jsii.Kernel.call(this, "resetRuntime", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPythonVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "pythonVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRuntimeInput() {
        return software.amazon.jsii.Kernel.get(this, "runtimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScriptLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "scriptLocationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPythonVersion() {
        return software.amazon.jsii.Kernel.get(this, "pythonVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPythonVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pythonVersion", java.util.Objects.requireNonNull(value, "pythonVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRuntime() {
        return software.amazon.jsii.Kernel.get(this, "runtime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRuntime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "runtime", java.util.Objects.requireNonNull(value, "runtime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScriptLocation() {
        return software.amazon.jsii.Kernel.get(this, "scriptLocation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScriptLocation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scriptLocation", java.util.Objects.requireNonNull(value, "scriptLocation is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_job.GlueJobCommand getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_job.GlueJobCommand.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_job.GlueJobCommand value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
