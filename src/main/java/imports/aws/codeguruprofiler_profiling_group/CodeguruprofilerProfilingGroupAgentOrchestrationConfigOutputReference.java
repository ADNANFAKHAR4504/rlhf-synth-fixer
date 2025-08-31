package imports.aws.codeguruprofiler_profiling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.327Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codeguruprofilerProfilingGroup.CodeguruprofilerProfilingGroupAgentOrchestrationConfigOutputReference")
public class CodeguruprofilerProfilingGroupAgentOrchestrationConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodeguruprofilerProfilingGroupAgentOrchestrationConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodeguruprofilerProfilingGroupAgentOrchestrationConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CodeguruprofilerProfilingGroupAgentOrchestrationConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProfilingEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "profilingEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getProfilingEnabled() {
        return software.amazon.jsii.Kernel.get(this, "profilingEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setProfilingEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "profilingEnabled", java.util.Objects.requireNonNull(value, "profilingEnabled is required"));
    }

    public void setProfilingEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "profilingEnabled", java.util.Objects.requireNonNull(value, "profilingEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codeguruprofiler_profiling_group.CodeguruprofilerProfilingGroupAgentOrchestrationConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
