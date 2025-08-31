package imports.aws.s3_control_object_lambda_access_point;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.283Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlObjectLambdaAccessPoint.S3ControlObjectLambdaAccessPointConfigurationOutputReference")
public class S3ControlObjectLambdaAccessPointConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3ControlObjectLambdaAccessPointConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3ControlObjectLambdaAccessPointConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3ControlObjectLambdaAccessPointConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putTransformationConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration> __cast_cd4240 = (java.util.List<imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTransformationConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllowedFeatures() {
        software.amazon.jsii.Kernel.call(this, "resetAllowedFeatures", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudWatchMetricsEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetCloudWatchMetricsEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationList getTransformationConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "transformationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfigurationTransformationConfigurationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowedFeaturesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "allowedFeaturesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCloudWatchMetricsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudWatchMetricsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSupportingAccessPointInput() {
        return software.amazon.jsii.Kernel.get(this, "supportingAccessPointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTransformationConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "transformationConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAllowedFeatures() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "allowedFeatures", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAllowedFeatures(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "allowedFeatures", java.util.Objects.requireNonNull(value, "allowedFeatures is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCloudWatchMetricsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "cloudWatchMetricsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCloudWatchMetricsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "cloudWatchMetricsEnabled", java.util.Objects.requireNonNull(value, "cloudWatchMetricsEnabled is required"));
    }

    public void setCloudWatchMetricsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "cloudWatchMetricsEnabled", java.util.Objects.requireNonNull(value, "cloudWatchMetricsEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSupportingAccessPoint() {
        return software.amazon.jsii.Kernel.get(this, "supportingAccessPoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSupportingAccessPoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "supportingAccessPoint", java.util.Objects.requireNonNull(value, "supportingAccessPoint is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_control_object_lambda_access_point.S3ControlObjectLambdaAccessPointConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
