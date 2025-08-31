package imports.aws.s3_control_object_lambda_access_point;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.284Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlObjectLambdaAccessPoint.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationOutputReference")
public class S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putContentTransformation(final @org.jetbrains.annotations.NotNull imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformation value) {
        software.amazon.jsii.Kernel.call(this, "putContentTransformation", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformationOutputReference getContentTransformation() {
        return software.amazon.jsii.Kernel.get(this, "contentTransformation", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getActionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "actionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformation getContentTransformationInput() {
        return software.amazon.jsii.Kernel.get(this, "contentTransformationInput", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationContentTransformation.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getActions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "actions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setActions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "actions", java.util.Objects.requireNonNull(value, "actions is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
