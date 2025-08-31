package imports.aws.quicksight_dashboard;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.103Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsOutputReference")
public class QuicksightDashboardDashboardPublishOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected QuicksightDashboardDashboardPublishOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDashboardDashboardPublishOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public QuicksightDashboardDashboardPublishOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAdHocFilteringOption(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption value) {
        software.amazon.jsii.Kernel.call(this, "putAdHocFilteringOption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDataPointDrillUpDownOption(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption value) {
        software.amazon.jsii.Kernel.call(this, "putDataPointDrillUpDownOption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDataPointMenuLabelOption(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption value) {
        software.amazon.jsii.Kernel.call(this, "putDataPointMenuLabelOption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDataPointTooltipOption(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption value) {
        software.amazon.jsii.Kernel.call(this, "putDataPointTooltipOption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putExportToCsvOption(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportToCsvOption value) {
        software.amazon.jsii.Kernel.call(this, "putExportToCsvOption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putExportWithHiddenFieldsOption(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption value) {
        software.amazon.jsii.Kernel.call(this, "putExportWithHiddenFieldsOption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSheetControlsOption(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetControlsOption value) {
        software.amazon.jsii.Kernel.call(this, "putSheetControlsOption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSheetLayoutElementMaximizationOption(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption value) {
        software.amazon.jsii.Kernel.call(this, "putSheetLayoutElementMaximizationOption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVisualAxisSortOption(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption value) {
        software.amazon.jsii.Kernel.call(this, "putVisualAxisSortOption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVisualMenuOption(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualMenuOption value) {
        software.amazon.jsii.Kernel.call(this, "putVisualMenuOption", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdHocFilteringOption() {
        software.amazon.jsii.Kernel.call(this, "resetAdHocFilteringOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataPointDrillUpDownOption() {
        software.amazon.jsii.Kernel.call(this, "resetDataPointDrillUpDownOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataPointMenuLabelOption() {
        software.amazon.jsii.Kernel.call(this, "resetDataPointMenuLabelOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataPointTooltipOption() {
        software.amazon.jsii.Kernel.call(this, "resetDataPointTooltipOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExportToCsvOption() {
        software.amazon.jsii.Kernel.call(this, "resetExportToCsvOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExportWithHiddenFieldsOption() {
        software.amazon.jsii.Kernel.call(this, "resetExportWithHiddenFieldsOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSheetControlsOption() {
        software.amazon.jsii.Kernel.call(this, "resetSheetControlsOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSheetLayoutElementMaximizationOption() {
        software.amazon.jsii.Kernel.call(this, "resetSheetLayoutElementMaximizationOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVisualAxisSortOption() {
        software.amazon.jsii.Kernel.call(this, "resetVisualAxisSortOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVisualMenuOption() {
        software.amazon.jsii.Kernel.call(this, "resetVisualMenuOption", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsAdHocFilteringOptionOutputReference getAdHocFilteringOption() {
        return software.amazon.jsii.Kernel.get(this, "adHocFilteringOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsAdHocFilteringOptionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOptionOutputReference getDataPointDrillUpDownOption() {
        return software.amazon.jsii.Kernel.get(this, "dataPointDrillUpDownOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOptionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOptionOutputReference getDataPointMenuLabelOption() {
        return software.amazon.jsii.Kernel.get(this, "dataPointMenuLabelOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOptionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOptionOutputReference getDataPointTooltipOption() {
        return software.amazon.jsii.Kernel.get(this, "dataPointTooltipOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOptionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportToCsvOptionOutputReference getExportToCsvOption() {
        return software.amazon.jsii.Kernel.get(this, "exportToCsvOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportToCsvOptionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOptionOutputReference getExportWithHiddenFieldsOption() {
        return software.amazon.jsii.Kernel.get(this, "exportWithHiddenFieldsOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOptionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetControlsOptionOutputReference getSheetControlsOption() {
        return software.amazon.jsii.Kernel.get(this, "sheetControlsOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetControlsOptionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOptionOutputReference getSheetLayoutElementMaximizationOption() {
        return software.amazon.jsii.Kernel.get(this, "sheetLayoutElementMaximizationOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOptionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualAxisSortOptionOutputReference getVisualAxisSortOption() {
        return software.amazon.jsii.Kernel.get(this, "visualAxisSortOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualAxisSortOptionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualMenuOptionOutputReference getVisualMenuOption() {
        return software.amazon.jsii.Kernel.get(this, "visualMenuOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualMenuOptionOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption getAdHocFilteringOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "adHocFilteringOptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption getDataPointDrillUpDownOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "dataPointDrillUpDownOptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption getDataPointMenuLabelOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "dataPointMenuLabelOptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption getDataPointTooltipOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "dataPointTooltipOptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportToCsvOption getExportToCsvOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "exportToCsvOptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportToCsvOption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption getExportWithHiddenFieldsOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "exportWithHiddenFieldsOptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetControlsOption getSheetControlsOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "sheetControlsOptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetControlsOption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption getSheetLayoutElementMaximizationOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "sheetLayoutElementMaximizationOptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption getVisualAxisSortOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "visualAxisSortOptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualMenuOption getVisualMenuOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "visualMenuOptionInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualMenuOption.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
