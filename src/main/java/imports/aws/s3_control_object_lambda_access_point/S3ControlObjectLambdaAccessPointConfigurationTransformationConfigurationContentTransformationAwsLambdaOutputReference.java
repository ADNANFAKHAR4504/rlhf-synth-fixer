package imports.aws.s3_control_object_lambda_access_point;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.283Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlObjectLambdaAccessPoint.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformationAwsLambdaOutputReference")
public class S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformationAwsLambdaOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformationAwsLambdaOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformationAwsLambdaOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformationAwsLambdaOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetFunctionPayload() {
        software.amazon.jsii.Kernel.call(this, "resetFunctionPayload", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFunctionArnInput() {
        return software.amazon.jsii.Kernel.get(this, "functionArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFunctionPayloadInput() {
        return software.amazon.jsii.Kernel.get(this, "functionPayloadInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFunctionArn() {
        return software.amazon.jsii.Kernel.get(this, "functionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFunctionArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "functionArn", java.util.Objects.requireNonNull(value, "functionArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFunctionPayload() {
        return software.amazon.jsii.Kernel.get(this, "functionPayload", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFunctionPayload(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "functionPayload", java.util.Objects.requireNonNull(value, "functionPayload is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformationAwsLambda getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformationAwsLambda.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformationAwsLambda value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
