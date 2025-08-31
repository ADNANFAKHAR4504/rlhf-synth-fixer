package imports.aws.lambda_function;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.504Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaFunction.LambdaFunctionLoggingConfigOutputReference")
public class LambdaFunctionLoggingConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LambdaFunctionLoggingConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LambdaFunctionLoggingConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LambdaFunctionLoggingConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetApplicationLogLevel() {
        software.amazon.jsii.Kernel.call(this, "resetApplicationLogLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogGroup() {
        software.amazon.jsii.Kernel.call(this, "resetLogGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSystemLogLevel() {
        software.amazon.jsii.Kernel.call(this, "resetSystemLogLevel", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApplicationLogLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "applicationLogLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "logFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "logGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSystemLogLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "systemLogLevelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApplicationLogLevel() {
        return software.amazon.jsii.Kernel.get(this, "applicationLogLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApplicationLogLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "applicationLogLevel", java.util.Objects.requireNonNull(value, "applicationLogLevel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogFormat() {
        return software.amazon.jsii.Kernel.get(this, "logFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logFormat", java.util.Objects.requireNonNull(value, "logFormat is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogGroup() {
        return software.amazon.jsii.Kernel.get(this, "logGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logGroup", java.util.Objects.requireNonNull(value, "logGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSystemLogLevel() {
        return software.amazon.jsii.Kernel.get(this, "systemLogLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSystemLogLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "systemLogLevel", java.util.Objects.requireNonNull(value, "systemLogLevel is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionLoggingConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lambda_function.LambdaFunctionLoggingConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lambda_function.LambdaFunctionLoggingConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
