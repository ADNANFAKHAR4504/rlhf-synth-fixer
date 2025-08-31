package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.293Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerLakeFormationConfigurationOutputReference")
public class GlueCrawlerLakeFormationConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueCrawlerLakeFormationConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueCrawlerLakeFormationConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueCrawlerLakeFormationConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUseLakeFormationCredentials() {
        software.amazon.jsii.Kernel.call(this, "resetUseLakeFormationCredentials", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "accountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUseLakeFormationCredentialsInput() {
        return software.amazon.jsii.Kernel.get(this, "useLakeFormationCredentialsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAccountId() {
        return software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "accountId", java.util.Objects.requireNonNull(value, "accountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUseLakeFormationCredentials() {
        return software.amazon.jsii.Kernel.get(this, "useLakeFormationCredentials", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUseLakeFormationCredentials(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "useLakeFormationCredentials", java.util.Objects.requireNonNull(value, "useLakeFormationCredentials is required"));
    }

    public void setUseLakeFormationCredentials(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "useLakeFormationCredentials", java.util.Objects.requireNonNull(value, "useLakeFormationCredentials is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_crawler.GlueCrawlerLakeFormationConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_crawler.GlueCrawlerLakeFormationConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_crawler.GlueCrawlerLakeFormationConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
