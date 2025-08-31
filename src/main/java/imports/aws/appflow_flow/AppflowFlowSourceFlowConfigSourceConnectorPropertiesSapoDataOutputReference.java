package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.015Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataOutputReference")
public class AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putPaginationConfig(final @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig value) {
        software.amazon.jsii.Kernel.call(this, "putPaginationConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putParallelismConfig(final @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfig value) {
        software.amazon.jsii.Kernel.call(this, "putParallelismConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetPaginationConfig() {
        software.amazon.jsii.Kernel.call(this, "resetPaginationConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParallelismConfig() {
        software.amazon.jsii.Kernel.call(this, "resetParallelismConfig", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfigOutputReference getPaginationConfig() {
        return software.amazon.jsii.Kernel.get(this, "paginationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfigOutputReference getParallelismConfig() {
        return software.amazon.jsii.Kernel.get(this, "parallelismConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getObjectPathInput() {
        return software.amazon.jsii.Kernel.get(this, "objectPathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig getPaginationConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "paginationConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataPaginationConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfig getParallelismConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "parallelismConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getObjectPath() {
        return software.amazon.jsii.Kernel.get(this, "objectPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setObjectPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "objectPath", java.util.Objects.requireNonNull(value, "objectPath is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoData value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
