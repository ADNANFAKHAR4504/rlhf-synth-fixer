package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.332Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineTriggerGitConfigurationOutputReference")
public class CodepipelineTriggerGitConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodepipelineTriggerGitConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodepipelineTriggerGitConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodepipelineTriggerGitConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putPullRequest(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequest>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequest> __cast_cd4240 = (java.util.List<imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequest>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequest __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPullRequest", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPush(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPush>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPush> __cast_cd4240 = (java.util.List<imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPush>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPush __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPush", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetPullRequest() {
        software.amazon.jsii.Kernel.call(this, "resetPullRequest", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPush() {
        software.amazon.jsii.Kernel.call(this, "resetPush", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestList getPullRequest() {
        return software.amazon.jsii.Kernel.get(this, "pullRequest", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPullRequestList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushList getPush() {
        return software.amazon.jsii.Kernel.get(this, "push", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfigurationPushList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPullRequestInput() {
        return software.amazon.jsii.Kernel.get(this, "pullRequestInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPushInput() {
        return software.amazon.jsii.Kernel.get(this, "pushInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceActionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceActionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceActionName() {
        return software.amazon.jsii.Kernel.get(this, "sourceActionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceActionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceActionName", java.util.Objects.requireNonNull(value, "sourceActionName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineTriggerGitConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineTriggerGitConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineTriggerGitConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
