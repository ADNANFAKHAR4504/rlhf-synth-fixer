package imports.aws.lexv2_models_bot_version;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.550Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsBotVersion.Lexv2ModelsBotVersionLocaleSpecificationOutputReference")
public class Lexv2ModelsBotVersionLocaleSpecificationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Lexv2ModelsBotVersionLocaleSpecificationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Lexv2ModelsBotVersionLocaleSpecificationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectKey the key of this item in the map. This parameter is required.
     */
    public Lexv2ModelsBotVersionLocaleSpecificationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.String complexObjectKey) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectKey, "complexObjectKey is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceBotVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceBotVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceBotVersion() {
        return software.amazon.jsii.Kernel.get(this, "sourceBotVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceBotVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceBotVersion", java.util.Objects.requireNonNull(value, "sourceBotVersion is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lexv2_models_bot_version.Lexv2ModelsBotVersionLocaleSpecification value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
