package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.015Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesS3OutputReference")
public class AppflowFlowSourceFlowConfigSourceConnectorPropertiesS3OutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowFlowSourceFlowConfigSourceConnectorPropertiesS3OutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowFlowSourceFlowConfigSourceConnectorPropertiesS3OutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowFlowSourceFlowConfigSourceConnectorPropertiesS3OutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putS3InputFormatConfig(final @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesS3S3InputFormatConfig value) {
        software.amazon.jsii.Kernel.call(this, "putS3InputFormatConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetS3InputFormatConfig() {
        software.amazon.jsii.Kernel.call(this, "resetS3InputFormatConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesS3S3InputFormatConfigOutputReference getS3InputFormatConfig() {
        return software.amazon.jsii.Kernel.get(this, "s3InputFormatConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesS3S3InputFormatConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketNameInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesS3S3InputFormatConfig getS3InputFormatConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "s3InputFormatConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesS3S3InputFormatConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketName() {
        return software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketName", java.util.Objects.requireNonNull(value, "bucketName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBucketPrefix() {
        return software.amazon.jsii.Kernel.get(this, "bucketPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBucketPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bucketPrefix", java.util.Objects.requireNonNull(value, "bucketPrefix is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesS3 getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesS3.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesS3 value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
