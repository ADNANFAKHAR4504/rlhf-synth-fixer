package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.330Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineStageBeforeEntryOutputReference")
public class CodepipelineStageBeforeEntryOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodepipelineStageBeforeEntryOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodepipelineStageBeforeEntryOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodepipelineStageBeforeEntryOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCondition(final @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineStageBeforeEntryCondition value) {
        software.amazon.jsii.Kernel.call(this, "putCondition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineStageBeforeEntryConditionOutputReference getCondition() {
        return software.amazon.jsii.Kernel.get(this, "condition", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageBeforeEntryConditionOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageBeforeEntryCondition getConditionInput() {
        return software.amazon.jsii.Kernel.get(this, "conditionInput", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageBeforeEntryCondition.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageBeforeEntry getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageBeforeEntry.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageBeforeEntry value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
