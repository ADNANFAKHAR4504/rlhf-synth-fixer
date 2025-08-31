package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.012Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceErrorHandlingConfigOutputReference")
public class AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceErrorHandlingConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceErrorHandlingConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceErrorHandlingConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceErrorHandlingConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetBucketName() {
        software.amazon.jsii.Kernel.call(this, "resetBucketName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBucketPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetBucketPrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFailOnFirstDestinationError() {
        software.amazon.jsii.Kernel.call(this, "resetFailOnFirstDestinationError", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketNameInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBucketPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "bucketPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFailOnFirstDestinationErrorInput() {
        return software.amazon.jsii.Kernel.get(this, "failOnFirstDestinationErrorInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getFailOnFirstDestinationError() {
        return software.amazon.jsii.Kernel.get(this, "failOnFirstDestinationError", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setFailOnFirstDestinationError(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "failOnFirstDestinationError", java.util.Objects.requireNonNull(value, "failOnFirstDestinationError is required"));
    }

    public void setFailOnFirstDestinationError(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "failOnFirstDestinationError", java.util.Objects.requireNonNull(value, "failOnFirstDestinationError is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceErrorHandlingConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceErrorHandlingConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesSalesforceErrorHandlingConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
