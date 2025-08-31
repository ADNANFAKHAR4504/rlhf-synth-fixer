package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.012Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigOutputReference")
public class AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAggregationConfig(final @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigAggregationConfig value) {
        software.amazon.jsii.Kernel.call(this, "putAggregationConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPrefixConfig(final @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigPrefixConfig value) {
        software.amazon.jsii.Kernel.call(this, "putPrefixConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAggregationConfig() {
        software.amazon.jsii.Kernel.call(this, "resetAggregationConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFileType() {
        software.amazon.jsii.Kernel.call(this, "resetFileType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrefixConfig() {
        software.amazon.jsii.Kernel.call(this, "resetPrefixConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreserveSourceDataTyping() {
        software.amazon.jsii.Kernel.call(this, "resetPreserveSourceDataTyping", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigAggregationConfigOutputReference getAggregationConfig() {
        return software.amazon.jsii.Kernel.get(this, "aggregationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigAggregationConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigPrefixConfigOutputReference getPrefixConfig() {
        return software.amazon.jsii.Kernel.get(this, "prefixConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigPrefixConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigAggregationConfig getAggregationConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "aggregationConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigAggregationConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "fileTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigPrefixConfig getPrefixConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "prefixConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfigPrefixConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPreserveSourceDataTypingInput() {
        return software.amazon.jsii.Kernel.get(this, "preserveSourceDataTypingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileType() {
        return software.amazon.jsii.Kernel.get(this, "fileType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileType", java.util.Objects.requireNonNull(value, "fileType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPreserveSourceDataTyping() {
        return software.amazon.jsii.Kernel.get(this, "preserveSourceDataTyping", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPreserveSourceDataTyping(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "preserveSourceDataTyping", java.util.Objects.requireNonNull(value, "preserveSourceDataTyping is required"));
    }

    public void setPreserveSourceDataTyping(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "preserveSourceDataTyping", java.util.Objects.requireNonNull(value, "preserveSourceDataTyping is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesS3S3OutputFormatConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
