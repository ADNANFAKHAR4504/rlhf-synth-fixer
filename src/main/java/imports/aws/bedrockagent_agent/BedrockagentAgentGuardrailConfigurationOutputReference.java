package imports.aws.bedrockagent_agent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.151Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgent.BedrockagentAgentGuardrailConfigurationOutputReference")
public class BedrockagentAgentGuardrailConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentAgentGuardrailConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentAgentGuardrailConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentAgentGuardrailConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetGuardrailIdentifier() {
        software.amazon.jsii.Kernel.call(this, "resetGuardrailIdentifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGuardrailVersion() {
        software.amazon.jsii.Kernel.call(this, "resetGuardrailVersion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGuardrailIdentifierInput() {
        return software.amazon.jsii.Kernel.get(this, "guardrailIdentifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGuardrailVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "guardrailVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGuardrailIdentifier() {
        return software.amazon.jsii.Kernel.get(this, "guardrailIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGuardrailIdentifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "guardrailIdentifier", java.util.Objects.requireNonNull(value, "guardrailIdentifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGuardrailVersion() {
        return software.amazon.jsii.Kernel.get(this, "guardrailVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGuardrailVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "guardrailVersion", java.util.Objects.requireNonNull(value, "guardrailVersion is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_agent.BedrockagentAgentGuardrailConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
