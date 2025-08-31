package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.301Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectLogsConfigOutputReference")
public class CodebuildProjectLogsConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodebuildProjectLogsConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodebuildProjectLogsConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodebuildProjectLogsConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudwatchLogs(final @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectLogsConfigCloudwatchLogs value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Logs(final @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectLogsConfigS3Logs value) {
        software.amazon.jsii.Kernel.call(this, "putS3Logs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchLogs() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Logs() {
        software.amazon.jsii.Kernel.call(this, "resetS3Logs", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectLogsConfigCloudwatchLogsOutputReference getCloudwatchLogs() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogs", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectLogsConfigCloudwatchLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codebuild_project.CodebuildProjectLogsConfigS3LogsOutputReference getS3Logs() {
        return software.amazon.jsii.Kernel.get(this, "s3Logs", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectLogsConfigS3LogsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectLogsConfigCloudwatchLogs getCloudwatchLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectLogsConfigCloudwatchLogs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectLogsConfigS3Logs getS3LogsInput() {
        return software.amazon.jsii.Kernel.get(this, "s3LogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectLogsConfigS3Logs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectLogsConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codebuild_project.CodebuildProjectLogsConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codebuild_project.CodebuildProjectLogsConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
