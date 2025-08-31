package imports.aws.quicksight_dashboard;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.102Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptions")
@software.amazon.jsii.Jsii.Proxy(QuicksightDashboardDashboardPublishOptions.Jsii$Proxy.class)
public interface QuicksightDashboardDashboardPublishOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * ad_hoc_filtering_option block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#ad_hoc_filtering_option QuicksightDashboard#ad_hoc_filtering_option}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption getAdHocFilteringOption() {
        return null;
    }

    /**
     * data_point_drill_up_down_option block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_point_drill_up_down_option QuicksightDashboard#data_point_drill_up_down_option}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption getDataPointDrillUpDownOption() {
        return null;
    }

    /**
     * data_point_menu_label_option block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_point_menu_label_option QuicksightDashboard#data_point_menu_label_option}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption getDataPointMenuLabelOption() {
        return null;
    }

    /**
     * data_point_tooltip_option block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_point_tooltip_option QuicksightDashboard#data_point_tooltip_option}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption getDataPointTooltipOption() {
        return null;
    }

    /**
     * export_to_csv_option block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#export_to_csv_option QuicksightDashboard#export_to_csv_option}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportToCsvOption getExportToCsvOption() {
        return null;
    }

    /**
     * export_with_hidden_fields_option block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#export_with_hidden_fields_option QuicksightDashboard#export_with_hidden_fields_option}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption getExportWithHiddenFieldsOption() {
        return null;
    }

    /**
     * sheet_controls_option block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#sheet_controls_option QuicksightDashboard#sheet_controls_option}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetControlsOption getSheetControlsOption() {
        return null;
    }

    /**
     * sheet_layout_element_maximization_option block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#sheet_layout_element_maximization_option QuicksightDashboard#sheet_layout_element_maximization_option}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption getSheetLayoutElementMaximizationOption() {
        return null;
    }

    /**
     * visual_axis_sort_option block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#visual_axis_sort_option QuicksightDashboard#visual_axis_sort_option}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption getVisualAxisSortOption() {
        return null;
    }

    /**
     * visual_menu_option block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#visual_menu_option QuicksightDashboard#visual_menu_option}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualMenuOption getVisualMenuOption() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDashboardDashboardPublishOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDashboardDashboardPublishOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDashboardDashboardPublishOptions> {
        imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption adHocFilteringOption;
        imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption dataPointDrillUpDownOption;
        imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption dataPointMenuLabelOption;
        imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption dataPointTooltipOption;
        imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportToCsvOption exportToCsvOption;
        imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption exportWithHiddenFieldsOption;
        imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetControlsOption sheetControlsOption;
        imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption sheetLayoutElementMaximizationOption;
        imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption visualAxisSortOption;
        imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualMenuOption visualMenuOption;

        /**
         * Sets the value of {@link QuicksightDashboardDashboardPublishOptions#getAdHocFilteringOption}
         * @param adHocFilteringOption ad_hoc_filtering_option block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#ad_hoc_filtering_option QuicksightDashboard#ad_hoc_filtering_option}
         * @return {@code this}
         */
        public Builder adHocFilteringOption(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption adHocFilteringOption) {
            this.adHocFilteringOption = adHocFilteringOption;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardDashboardPublishOptions#getDataPointDrillUpDownOption}
         * @param dataPointDrillUpDownOption data_point_drill_up_down_option block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_point_drill_up_down_option QuicksightDashboard#data_point_drill_up_down_option}
         * @return {@code this}
         */
        public Builder dataPointDrillUpDownOption(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption dataPointDrillUpDownOption) {
            this.dataPointDrillUpDownOption = dataPointDrillUpDownOption;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardDashboardPublishOptions#getDataPointMenuLabelOption}
         * @param dataPointMenuLabelOption data_point_menu_label_option block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_point_menu_label_option QuicksightDashboard#data_point_menu_label_option}
         * @return {@code this}
         */
        public Builder dataPointMenuLabelOption(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption dataPointMenuLabelOption) {
            this.dataPointMenuLabelOption = dataPointMenuLabelOption;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardDashboardPublishOptions#getDataPointTooltipOption}
         * @param dataPointTooltipOption data_point_tooltip_option block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#data_point_tooltip_option QuicksightDashboard#data_point_tooltip_option}
         * @return {@code this}
         */
        public Builder dataPointTooltipOption(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption dataPointTooltipOption) {
            this.dataPointTooltipOption = dataPointTooltipOption;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardDashboardPublishOptions#getExportToCsvOption}
         * @param exportToCsvOption export_to_csv_option block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#export_to_csv_option QuicksightDashboard#export_to_csv_option}
         * @return {@code this}
         */
        public Builder exportToCsvOption(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportToCsvOption exportToCsvOption) {
            this.exportToCsvOption = exportToCsvOption;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardDashboardPublishOptions#getExportWithHiddenFieldsOption}
         * @param exportWithHiddenFieldsOption export_with_hidden_fields_option block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#export_with_hidden_fields_option QuicksightDashboard#export_with_hidden_fields_option}
         * @return {@code this}
         */
        public Builder exportWithHiddenFieldsOption(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption exportWithHiddenFieldsOption) {
            this.exportWithHiddenFieldsOption = exportWithHiddenFieldsOption;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardDashboardPublishOptions#getSheetControlsOption}
         * @param sheetControlsOption sheet_controls_option block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#sheet_controls_option QuicksightDashboard#sheet_controls_option}
         * @return {@code this}
         */
        public Builder sheetControlsOption(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetControlsOption sheetControlsOption) {
            this.sheetControlsOption = sheetControlsOption;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardDashboardPublishOptions#getSheetLayoutElementMaximizationOption}
         * @param sheetLayoutElementMaximizationOption sheet_layout_element_maximization_option block.
         *                                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#sheet_layout_element_maximization_option QuicksightDashboard#sheet_layout_element_maximization_option}
         * @return {@code this}
         */
        public Builder sheetLayoutElementMaximizationOption(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption sheetLayoutElementMaximizationOption) {
            this.sheetLayoutElementMaximizationOption = sheetLayoutElementMaximizationOption;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardDashboardPublishOptions#getVisualAxisSortOption}
         * @param visualAxisSortOption visual_axis_sort_option block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#visual_axis_sort_option QuicksightDashboard#visual_axis_sort_option}
         * @return {@code this}
         */
        public Builder visualAxisSortOption(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption visualAxisSortOption) {
            this.visualAxisSortOption = visualAxisSortOption;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDashboardDashboardPublishOptions#getVisualMenuOption}
         * @param visualMenuOption visual_menu_option block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#visual_menu_option QuicksightDashboard#visual_menu_option}
         * @return {@code this}
         */
        public Builder visualMenuOption(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualMenuOption visualMenuOption) {
            this.visualMenuOption = visualMenuOption;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDashboardDashboardPublishOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDashboardDashboardPublishOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDashboardDashboardPublishOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDashboardDashboardPublishOptions {
        private final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption adHocFilteringOption;
        private final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption dataPointDrillUpDownOption;
        private final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption dataPointMenuLabelOption;
        private final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption dataPointTooltipOption;
        private final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportToCsvOption exportToCsvOption;
        private final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption exportWithHiddenFieldsOption;
        private final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetControlsOption sheetControlsOption;
        private final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption sheetLayoutElementMaximizationOption;
        private final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption visualAxisSortOption;
        private final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualMenuOption visualMenuOption;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.adHocFilteringOption = software.amazon.jsii.Kernel.get(this, "adHocFilteringOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption.class));
            this.dataPointDrillUpDownOption = software.amazon.jsii.Kernel.get(this, "dataPointDrillUpDownOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption.class));
            this.dataPointMenuLabelOption = software.amazon.jsii.Kernel.get(this, "dataPointMenuLabelOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption.class));
            this.dataPointTooltipOption = software.amazon.jsii.Kernel.get(this, "dataPointTooltipOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption.class));
            this.exportToCsvOption = software.amazon.jsii.Kernel.get(this, "exportToCsvOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportToCsvOption.class));
            this.exportWithHiddenFieldsOption = software.amazon.jsii.Kernel.get(this, "exportWithHiddenFieldsOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption.class));
            this.sheetControlsOption = software.amazon.jsii.Kernel.get(this, "sheetControlsOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetControlsOption.class));
            this.sheetLayoutElementMaximizationOption = software.amazon.jsii.Kernel.get(this, "sheetLayoutElementMaximizationOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption.class));
            this.visualAxisSortOption = software.amazon.jsii.Kernel.get(this, "visualAxisSortOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption.class));
            this.visualMenuOption = software.amazon.jsii.Kernel.get(this, "visualMenuOption", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualMenuOption.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.adHocFilteringOption = builder.adHocFilteringOption;
            this.dataPointDrillUpDownOption = builder.dataPointDrillUpDownOption;
            this.dataPointMenuLabelOption = builder.dataPointMenuLabelOption;
            this.dataPointTooltipOption = builder.dataPointTooltipOption;
            this.exportToCsvOption = builder.exportToCsvOption;
            this.exportWithHiddenFieldsOption = builder.exportWithHiddenFieldsOption;
            this.sheetControlsOption = builder.sheetControlsOption;
            this.sheetLayoutElementMaximizationOption = builder.sheetLayoutElementMaximizationOption;
            this.visualAxisSortOption = builder.visualAxisSortOption;
            this.visualMenuOption = builder.visualMenuOption;
        }

        @Override
        public final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsAdHocFilteringOption getAdHocFilteringOption() {
            return this.adHocFilteringOption;
        }

        @Override
        public final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointDrillUpDownOption getDataPointDrillUpDownOption() {
            return this.dataPointDrillUpDownOption;
        }

        @Override
        public final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointMenuLabelOption getDataPointMenuLabelOption() {
            return this.dataPointMenuLabelOption;
        }

        @Override
        public final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsDataPointTooltipOption getDataPointTooltipOption() {
            return this.dataPointTooltipOption;
        }

        @Override
        public final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportToCsvOption getExportToCsvOption() {
            return this.exportToCsvOption;
        }

        @Override
        public final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsExportWithHiddenFieldsOption getExportWithHiddenFieldsOption() {
            return this.exportWithHiddenFieldsOption;
        }

        @Override
        public final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetControlsOption getSheetControlsOption() {
            return this.sheetControlsOption;
        }

        @Override
        public final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsSheetLayoutElementMaximizationOption getSheetLayoutElementMaximizationOption() {
            return this.sheetLayoutElementMaximizationOption;
        }

        @Override
        public final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualAxisSortOption getVisualAxisSortOption() {
            return this.visualAxisSortOption;
        }

        @Override
        public final imports.aws.quicksight_dashboard.QuicksightDashboardDashboardPublishOptionsVisualMenuOption getVisualMenuOption() {
            return this.visualMenuOption;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAdHocFilteringOption() != null) {
                data.set("adHocFilteringOption", om.valueToTree(this.getAdHocFilteringOption()));
            }
            if (this.getDataPointDrillUpDownOption() != null) {
                data.set("dataPointDrillUpDownOption", om.valueToTree(this.getDataPointDrillUpDownOption()));
            }
            if (this.getDataPointMenuLabelOption() != null) {
                data.set("dataPointMenuLabelOption", om.valueToTree(this.getDataPointMenuLabelOption()));
            }
            if (this.getDataPointTooltipOption() != null) {
                data.set("dataPointTooltipOption", om.valueToTree(this.getDataPointTooltipOption()));
            }
            if (this.getExportToCsvOption() != null) {
                data.set("exportToCsvOption", om.valueToTree(this.getExportToCsvOption()));
            }
            if (this.getExportWithHiddenFieldsOption() != null) {
                data.set("exportWithHiddenFieldsOption", om.valueToTree(this.getExportWithHiddenFieldsOption()));
            }
            if (this.getSheetControlsOption() != null) {
                data.set("sheetControlsOption", om.valueToTree(this.getSheetControlsOption()));
            }
            if (this.getSheetLayoutElementMaximizationOption() != null) {
                data.set("sheetLayoutElementMaximizationOption", om.valueToTree(this.getSheetLayoutElementMaximizationOption()));
            }
            if (this.getVisualAxisSortOption() != null) {
                data.set("visualAxisSortOption", om.valueToTree(this.getVisualAxisSortOption()));
            }
            if (this.getVisualMenuOption() != null) {
                data.set("visualMenuOption", om.valueToTree(this.getVisualMenuOption()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDashboardDashboardPublishOptions.Jsii$Proxy that = (QuicksightDashboardDashboardPublishOptions.Jsii$Proxy) o;

            if (this.adHocFilteringOption != null ? !this.adHocFilteringOption.equals(that.adHocFilteringOption) : that.adHocFilteringOption != null) return false;
            if (this.dataPointDrillUpDownOption != null ? !this.dataPointDrillUpDownOption.equals(that.dataPointDrillUpDownOption) : that.dataPointDrillUpDownOption != null) return false;
            if (this.dataPointMenuLabelOption != null ? !this.dataPointMenuLabelOption.equals(that.dataPointMenuLabelOption) : that.dataPointMenuLabelOption != null) return false;
            if (this.dataPointTooltipOption != null ? !this.dataPointTooltipOption.equals(that.dataPointTooltipOption) : that.dataPointTooltipOption != null) return false;
            if (this.exportToCsvOption != null ? !this.exportToCsvOption.equals(that.exportToCsvOption) : that.exportToCsvOption != null) return false;
            if (this.exportWithHiddenFieldsOption != null ? !this.exportWithHiddenFieldsOption.equals(that.exportWithHiddenFieldsOption) : that.exportWithHiddenFieldsOption != null) return false;
            if (this.sheetControlsOption != null ? !this.sheetControlsOption.equals(that.sheetControlsOption) : that.sheetControlsOption != null) return false;
            if (this.sheetLayoutElementMaximizationOption != null ? !this.sheetLayoutElementMaximizationOption.equals(that.sheetLayoutElementMaximizationOption) : that.sheetLayoutElementMaximizationOption != null) return false;
            if (this.visualAxisSortOption != null ? !this.visualAxisSortOption.equals(that.visualAxisSortOption) : that.visualAxisSortOption != null) return false;
            return this.visualMenuOption != null ? this.visualMenuOption.equals(that.visualMenuOption) : that.visualMenuOption == null;
        }

        @Override
        public final int hashCode() {
            int result = this.adHocFilteringOption != null ? this.adHocFilteringOption.hashCode() : 0;
            result = 31 * result + (this.dataPointDrillUpDownOption != null ? this.dataPointDrillUpDownOption.hashCode() : 0);
            result = 31 * result + (this.dataPointMenuLabelOption != null ? this.dataPointMenuLabelOption.hashCode() : 0);
            result = 31 * result + (this.dataPointTooltipOption != null ? this.dataPointTooltipOption.hashCode() : 0);
            result = 31 * result + (this.exportToCsvOption != null ? this.exportToCsvOption.hashCode() : 0);
            result = 31 * result + (this.exportWithHiddenFieldsOption != null ? this.exportWithHiddenFieldsOption.hashCode() : 0);
            result = 31 * result + (this.sheetControlsOption != null ? this.sheetControlsOption.hashCode() : 0);
            result = 31 * result + (this.sheetLayoutElementMaximizationOption != null ? this.sheetLayoutElementMaximizationOption.hashCode() : 0);
            result = 31 * result + (this.visualAxisSortOption != null ? this.visualAxisSortOption.hashCode() : 0);
            result = 31 * result + (this.visualMenuOption != null ? this.visualMenuOption.hashCode() : 0);
            return result;
        }
    }
}
