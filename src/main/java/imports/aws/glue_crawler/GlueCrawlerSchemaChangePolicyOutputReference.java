package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.294Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerSchemaChangePolicyOutputReference")
public class GlueCrawlerSchemaChangePolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueCrawlerSchemaChangePolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueCrawlerSchemaChangePolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GlueCrawlerSchemaChangePolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDeleteBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetDeleteBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUpdateBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetUpdateBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeleteBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "deleteBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUpdateBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "updateBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeleteBehavior() {
        return software.amazon.jsii.Kernel.get(this, "deleteBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeleteBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deleteBehavior", java.util.Objects.requireNonNull(value, "deleteBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUpdateBehavior() {
        return software.amazon.jsii.Kernel.get(this, "updateBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUpdateBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "updateBehavior", java.util.Objects.requireNonNull(value, "updateBehavior is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.glue_crawler.GlueCrawlerSchemaChangePolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.glue_crawler.GlueCrawlerSchemaChangePolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_crawler.GlueCrawlerSchemaChangePolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
