package imports.aws.glacier_vault;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.267Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glacierVault.GlacierVaultNotificationOutputReference")
public class GlacierVaultNotificationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlacierVaultNotificationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlacierVaultNotificationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlacierVaultNotificationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEventsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "eventsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnsTopicInput() {
        return software.amazon.jsii.Kernel.get(this, "snsTopicInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getEvents() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "events", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setEvents(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "events", java.util.Objects.requireNonNull(value, "events is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSnsTopic() {
        return software.amazon.jsii.Kernel.get(this, "snsTopic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSnsTopic(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "snsTopic", java.util.Objects.requireNonNull(value, "snsTopic is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glacier_vault.GlacierVaultNotification getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glacier_vault.GlacierVaultNotification.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glacier_vault.GlacierVaultNotification value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
