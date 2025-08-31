package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.293Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerRecrawlPolicyOutputReference")
public class GlueCrawlerRecrawlPolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueCrawlerRecrawlPolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueCrawlerRecrawlPolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueCrawlerRecrawlPolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetRecrawlBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetRecrawlBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRecrawlBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "recrawlBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRecrawlBehavior() {
        return software.amazon.jsii.Kernel.get(this, "recrawlBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRecrawlBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "recrawlBehavior", java.util.Objects.requireNonNull(value, "recrawlBehavior is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_crawler.GlueCrawlerRecrawlPolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_crawler.GlueCrawlerRecrawlPolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_crawler.GlueCrawlerRecrawlPolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
