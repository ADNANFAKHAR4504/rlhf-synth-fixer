package imports.aws.codepipeline_custom_action_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.336Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipelineCustomActionType.CodepipelineCustomActionTypeInputArtifactDetailsOutputReference")
public class CodepipelineCustomActionTypeInputArtifactDetailsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodepipelineCustomActionTypeInputArtifactDetailsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodepipelineCustomActionTypeInputArtifactDetailsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodepipelineCustomActionTypeInputArtifactDetailsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumCountInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinimumCountInput() {
        return software.amazon.jsii.Kernel.get(this, "minimumCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumCount() {
        return software.amazon.jsii.Kernel.get(this, "maximumCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumCount", java.util.Objects.requireNonNull(value, "maximumCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinimumCount() {
        return software.amazon.jsii.Kernel.get(this, "minimumCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinimumCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minimumCount", java.util.Objects.requireNonNull(value, "minimumCount is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeInputArtifactDetails getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeInputArtifactDetails.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codepipeline_custom_action_type.CodepipelineCustomActionTypeInputArtifactDetails value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
