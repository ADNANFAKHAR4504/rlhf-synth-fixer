package imports.aws.appflow_flow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.015Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appflowFlow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfigOutputReference")
public class AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxPageSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "maxPageSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxPageSize() {
        return software.amazon.jsii.Kernel.get(this, "maxPageSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxPageSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxPageSize", java.util.Objects.requireNonNull(value, "maxPageSize is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.appflow_flow.AppflowFlowSourceFlowConfigSourceConnectorPropertiesSapoDataParallelismConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
