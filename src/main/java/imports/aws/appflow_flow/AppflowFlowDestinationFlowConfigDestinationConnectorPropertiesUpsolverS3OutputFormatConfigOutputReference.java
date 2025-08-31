package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigOutputReference")
public class AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAggregationConfig(final @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigAggregationConfig value) {
        software.amazon.jsii.Kernel.call(this, "putAggregationConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPrefixConfig(final @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig value) {
        software.amazon.jsii.Kernel.call(this, "putPrefixConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAggregationConfig() {
        software.amazon.jsii.Kernel.call(this, "resetAggregationConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFileType() {
        software.amazon.jsii.Kernel.call(this, "resetFileType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigAggregationConfigOutputReference getAggregationConfig() {
        return software.amazon.jsii.Kernel.get(this, "aggregationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigAggregationConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfigOutputReference getPrefixConfig() {
        return software.amazon.jsii.Kernel.get(this, "prefixConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigAggregationConfig getAggregationConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "aggregationConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigAggregationConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "fileTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig getPrefixConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "prefixConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfigPrefixConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileType() {
        return software.amazon.jsii.Kernel.get(this, "fileType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileType", java.util.Objects.requireNonNull(value, "fileType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowDestinationFlowConfigDestinationConnectorPropertiesUpsolverS3OutputFormatConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
