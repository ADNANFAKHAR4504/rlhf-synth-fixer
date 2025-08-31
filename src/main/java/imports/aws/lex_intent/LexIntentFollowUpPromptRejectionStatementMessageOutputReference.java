package imports.aws.lex_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.543Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexIntent.LexIntentFollowUpPromptRejectionStatementMessageOutputReference")
public class LexIntentFollowUpPromptRejectionStatementMessageOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LexIntentFollowUpPromptRejectionStatementMessageOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LexIntentFollowUpPromptRejectionStatementMessageOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public LexIntentFollowUpPromptRejectionStatementMessageOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetGroupNumber() {
        software.amazon.jsii.Kernel.call(this, "resetGroupNumber", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContentInput() {
        return software.amazon.jsii.Kernel.get(this, "contentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContentTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "contentTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getGroupNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "groupNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContent() {
        return software.amazon.jsii.Kernel.get(this, "content", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContent(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "content", java.util.Objects.requireNonNull(value, "content is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContentType() {
        return software.amazon.jsii.Kernel.get(this, "contentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContentType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contentType", java.util.Objects.requireNonNull(value, "contentType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getGroupNumber() {
        return software.amazon.jsii.Kernel.get(this, "groupNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setGroupNumber(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "groupNumber", java.util.Objects.requireNonNull(value, "groupNumber is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentFollowUpPromptRejectionStatementMessage value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
