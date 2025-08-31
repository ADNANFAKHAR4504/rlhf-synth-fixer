package imports.aws.glue_crawler;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.294Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCrawler.GlueCrawlerS3TargetOutputReference")
public class GlueCrawlerS3TargetOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GlueCrawlerS3TargetOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GlueCrawlerS3TargetOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public GlueCrawlerS3TargetOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetConnectionName() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDlqEventQueueArn() {
        software.amazon.jsii.Kernel.call(this, "resetDlqEventQueueArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEventQueueArn() {
        software.amazon.jsii.Kernel.call(this, "resetEventQueueArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExclusions() {
        software.amazon.jsii.Kernel.call(this, "resetExclusions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSampleSize() {
        software.amazon.jsii.Kernel.call(this, "resetSampleSize", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConnectionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDlqEventQueueArnInput() {
        return software.amazon.jsii.Kernel.get(this, "dlqEventQueueArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEventQueueArnInput() {
        return software.amazon.jsii.Kernel.get(this, "eventQueueArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExclusionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "exclusionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPathInput() {
        return software.amazon.jsii.Kernel.get(this, "pathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSampleSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "sampleSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectionName() {
        return software.amazon.jsii.Kernel.get(this, "connectionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConnectionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "connectionName", java.util.Objects.requireNonNull(value, "connectionName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDlqEventQueueArn() {
        return software.amazon.jsii.Kernel.get(this, "dlqEventQueueArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDlqEventQueueArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dlqEventQueueArn", java.util.Objects.requireNonNull(value, "dlqEventQueueArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEventQueueArn() {
        return software.amazon.jsii.Kernel.get(this, "eventQueueArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEventQueueArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eventQueueArn", java.util.Objects.requireNonNull(value, "eventQueueArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getExclusions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "exclusions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setExclusions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "exclusions", java.util.Objects.requireNonNull(value, "exclusions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPath() {
        return software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "path", java.util.Objects.requireNonNull(value, "path is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSampleSize() {
        return software.amazon.jsii.Kernel.get(this, "sampleSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSampleSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "sampleSize", java.util.Objects.requireNonNull(value, "sampleSize is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.glue_crawler.GlueCrawlerS3Target value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
