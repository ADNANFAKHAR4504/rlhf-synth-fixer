package imports.aws.datasync_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.954Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncTask.DatasyncTaskTaskReportConfigOutputReference")
public class DatasyncTaskTaskReportConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DatasyncTaskTaskReportConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatasyncTaskTaskReportConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DatasyncTaskTaskReportConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putReportOverrides(final @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskTaskReportConfigReportOverrides value) {
        software.amazon.jsii.Kernel.call(this, "putReportOverrides", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Destination(final @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskTaskReportConfigS3Destination value) {
        software.amazon.jsii.Kernel.call(this, "putS3Destination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetOutputType() {
        software.amazon.jsii.Kernel.call(this, "resetOutputType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReportLevel() {
        software.amazon.jsii.Kernel.call(this, "resetReportLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReportOverrides() {
        software.amazon.jsii.Kernel.call(this, "resetReportOverrides", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3ObjectVersioning() {
        software.amazon.jsii.Kernel.call(this, "resetS3ObjectVersioning", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskTaskReportConfigReportOverridesOutputReference getReportOverrides() {
        return software.amazon.jsii.Kernel.get(this, "reportOverrides", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskTaskReportConfigReportOverridesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskTaskReportConfigS3DestinationOutputReference getS3Destination() {
        return software.amazon.jsii.Kernel.get(this, "s3Destination", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskTaskReportConfigS3DestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutputTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "outputTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReportLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "reportLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskTaskReportConfigReportOverrides getReportOverridesInput() {
        return software.amazon.jsii.Kernel.get(this, "reportOverridesInput", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskTaskReportConfigReportOverrides.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskTaskReportConfigS3Destination getS3DestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "s3DestinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskTaskReportConfigS3Destination.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3ObjectVersioningInput() {
        return software.amazon.jsii.Kernel.get(this, "s3ObjectVersioningInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutputType() {
        return software.amazon.jsii.Kernel.get(this, "outputType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutputType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outputType", java.util.Objects.requireNonNull(value, "outputType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReportLevel() {
        return software.amazon.jsii.Kernel.get(this, "reportLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReportLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "reportLevel", java.util.Objects.requireNonNull(value, "reportLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3ObjectVersioning() {
        return software.amazon.jsii.Kernel.get(this, "s3ObjectVersioning", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3ObjectVersioning(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3ObjectVersioning", java.util.Objects.requireNonNull(value, "s3ObjectVersioning is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskTaskReportConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskTaskReportConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskTaskReportConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
