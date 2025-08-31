package imports.aws.accessanalyzer_analyzer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.882Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.accessanalyzerAnalyzer.AccessanalyzerAnalyzerConfigurationOutputReference")
public class AccessanalyzerAnalyzerConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected AccessanalyzerAnalyzerConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AccessanalyzerAnalyzerConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public AccessanalyzerAnalyzerConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putUnusedAccess(final @org.jetbrains.annotations.NotNull imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccess value) {
        software.amazon.jsii.Kernel.call(this, "putUnusedAccess", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetUnusedAccess() {
        software.amazon.jsii.Kernel.call(this, "resetUnusedAccess", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessOutputReference getUnusedAccess() {
        return software.amazon.jsii.Kernel.get(this, "unusedAccess", software.amazon.jsii.NativeType.forClass(imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccessOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccess getUnusedAccessInput() {
        return software.amazon.jsii.Kernel.get(this, "unusedAccessInput", software.amazon.jsii.NativeType.forClass(imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfigurationUnusedAccess.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.accessanalyzer_analyzer.AccessanalyzerAnalyzerConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
