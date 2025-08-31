package imports.aws.lex_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.542Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexIntent.LexIntentFollowUpPromptOutputReference")
public class LexIntentFollowUpPromptOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LexIntentFollowUpPromptOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LexIntentFollowUpPromptOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LexIntentFollowUpPromptOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putPrompt(final @org.jetbrains.annotations.NotNull imports.aws.lex_intent.LexIntentFollowUpPromptPrompt value) {
        software.amazon.jsii.Kernel.call(this, "putPrompt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRejectionStatement(final @org.jetbrains.annotations.NotNull imports.aws.lex_intent.LexIntentFollowUpPromptRejectionStatement value) {
        software.amazon.jsii.Kernel.call(this, "putRejectionStatement", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lex_intent.LexIntentFollowUpPromptPromptOutputReference getPrompt() {
        return software.amazon.jsii.Kernel.get(this, "prompt", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentFollowUpPromptPromptOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lex_intent.LexIntentFollowUpPromptRejectionStatementOutputReference getRejectionStatement() {
        return software.amazon.jsii.Kernel.get(this, "rejectionStatement", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentFollowUpPromptRejectionStatementOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentFollowUpPromptPrompt getPromptInput() {
        return software.amazon.jsii.Kernel.get(this, "promptInput", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentFollowUpPromptPrompt.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentFollowUpPromptRejectionStatement getRejectionStatementInput() {
        return software.amazon.jsii.Kernel.get(this, "rejectionStatementInput", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentFollowUpPromptRejectionStatement.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentFollowUpPrompt getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentFollowUpPrompt.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentFollowUpPrompt value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
