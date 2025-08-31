package imports.aws.sesv2_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSet.Sesv2ConfigurationSetSuppressionOptionsOutputReference")
public class Sesv2ConfigurationSetSuppressionOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Sesv2ConfigurationSetSuppressionOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Sesv2ConfigurationSetSuppressionOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Sesv2ConfigurationSetSuppressionOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetSuppressedReasons() {
        software.amazon.jsii.Kernel.call(this, "resetSuppressedReasons", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSuppressedReasonsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "suppressedReasonsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSuppressedReasons() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "suppressedReasons", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSuppressedReasons(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "suppressedReasons", java.util.Objects.requireNonNull(value, "suppressedReasons is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSuppressionOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSuppressionOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set.Sesv2ConfigurationSetSuppressionOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
