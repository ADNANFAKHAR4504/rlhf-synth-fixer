package imports.aws.cloudwatch_event_target;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.281Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventTarget.CloudwatchEventTargetSagemakerPipelineTargetOutputReference")
public class CloudwatchEventTargetSagemakerPipelineTargetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudwatchEventTargetSagemakerPipelineTargetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudwatchEventTargetSagemakerPipelineTargetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudwatchEventTargetSagemakerPipelineTargetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putPipelineParameterList(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cloudwatch_event_target.CloudwatchEventTargetSagemakerPipelineTargetPipelineParameterListStruct>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cloudwatch_event_target.CloudwatchEventTargetSagemakerPipelineTargetPipelineParameterListStruct> __cast_cd4240 = (java.util.List<imports.aws.cloudwatch_event_target.CloudwatchEventTargetSagemakerPipelineTargetPipelineParameterListStruct>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cloudwatch_event_target.CloudwatchEventTargetSagemakerPipelineTargetPipelineParameterListStruct __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPipelineParameterList", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetPipelineParameterList() {
        software.amazon.jsii.Kernel.call(this, "resetPipelineParameterList", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudwatch_event_target.CloudwatchEventTargetSagemakerPipelineTargetPipelineParameterListStructList getPipelineParameterList() {
        return software.amazon.jsii.Kernel.get(this, "pipelineParameterList", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_target.CloudwatchEventTargetSagemakerPipelineTargetPipelineParameterListStructList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPipelineParameterListInput() {
        return software.amazon.jsii.Kernel.get(this, "pipelineParameterListInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetSagemakerPipelineTarget getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudwatch_event_target.CloudwatchEventTargetSagemakerPipelineTarget.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudwatch_event_target.CloudwatchEventTargetSagemakerPipelineTarget value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
