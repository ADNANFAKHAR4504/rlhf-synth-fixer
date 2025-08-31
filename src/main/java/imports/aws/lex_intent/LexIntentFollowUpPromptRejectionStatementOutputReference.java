package imports.aws.lex_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.543Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexIntent.LexIntentFollowUpPromptRejectionStatementOutputReference")
public class LexIntentFollowUpPromptRejectionStatementOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LexIntentFollowUpPromptRejectionStatementOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LexIntentFollowUpPromptRejectionStatementOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LexIntentFollowUpPromptRejectionStatementOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putMessage(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lex_intent.LexIntentFollowUpPromptRejectionStatementMessage>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lex_intent.LexIntentFollowUpPromptRejectionStatementMessage> __cast_cd4240 = (java.util.List<imports.aws.lex_intent.LexIntentFollowUpPromptRejectionStatementMessage>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lex_intent.LexIntentFollowUpPromptRejectionStatementMessage __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putMessage", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetResponseCard() {
        software.amazon.jsii.Kernel.call(this, "resetResponseCard", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lex_intent.LexIntentFollowUpPromptRejectionStatementMessageList getMessage() {
        return software.amazon.jsii.Kernel.get(this, "message", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentFollowUpPromptRejectionStatementMessageList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMessageInput() {
        return software.amazon.jsii.Kernel.get(this, "messageInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResponseCardInput() {
        return software.amazon.jsii.Kernel.get(this, "responseCardInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResponseCard() {
        return software.amazon.jsii.Kernel.get(this, "responseCard", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResponseCard(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "responseCard", java.util.Objects.requireNonNull(value, "responseCard is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentFollowUpPromptRejectionStatement getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentFollowUpPromptRejectionStatement.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentFollowUpPromptRejectionStatement value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
