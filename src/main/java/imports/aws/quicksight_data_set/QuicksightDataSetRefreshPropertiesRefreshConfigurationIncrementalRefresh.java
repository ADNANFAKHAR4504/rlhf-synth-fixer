package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.113Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh.Jsii$Proxy.class)
public interface QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh extends software.amazon.jsii.JsiiSerializable {

    /**
     * lookback_window block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#lookback_window QuicksightDataSet#lookback_window}
     */
    @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow getLookbackWindow();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh> {
        imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow lookbackWindow;

        /**
         * Sets the value of {@link QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh#getLookbackWindow}
         * @param lookbackWindow lookback_window block. This parameter is required.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#lookback_window QuicksightDataSet#lookback_window}
         * @return {@code this}
         */
        public Builder lookbackWindow(imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow lookbackWindow) {
            this.lookbackWindow = lookbackWindow;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh {
        private final imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow lookbackWindow;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.lookbackWindow = software.amazon.jsii.Kernel.get(this, "lookbackWindow", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.lookbackWindow = java.util.Objects.requireNonNull(builder.lookbackWindow, "lookbackWindow is required");
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow getLookbackWindow() {
            return this.lookbackWindow;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("lookbackWindow", om.valueToTree(this.getLookbackWindow()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh.Jsii$Proxy that = (QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh.Jsii$Proxy) o;

            return this.lookbackWindow.equals(that.lookbackWindow);
        }

        @Override
        public final int hashCode() {
            int result = this.lookbackWindow.hashCode();
            return result;
        }
    }
}
