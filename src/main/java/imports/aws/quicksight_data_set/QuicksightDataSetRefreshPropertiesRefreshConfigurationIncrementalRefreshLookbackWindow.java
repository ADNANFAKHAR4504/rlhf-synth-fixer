package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.113Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow.Jsii$Proxy.class)
public interface QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getColumnName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#size QuicksightDataSet#size}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getSize();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#size_unit QuicksightDataSet#size_unit}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSizeUnit();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow> {
        java.lang.String columnName;
        java.lang.Number size;
        java.lang.String sizeUnit;

        /**
         * Sets the value of {@link QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow#getColumnName}
         * @param columnName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_name QuicksightDataSet#column_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder columnName(java.lang.String columnName) {
            this.columnName = columnName;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow#getSize}
         * @param size Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#size QuicksightDataSet#size}. This parameter is required.
         * @return {@code this}
         */
        public Builder size(java.lang.Number size) {
            this.size = size;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow#getSizeUnit}
         * @param sizeUnit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#size_unit QuicksightDataSet#size_unit}. This parameter is required.
         * @return {@code this}
         */
        public Builder sizeUnit(java.lang.String sizeUnit) {
            this.sizeUnit = sizeUnit;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow {
        private final java.lang.String columnName;
        private final java.lang.Number size;
        private final java.lang.String sizeUnit;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.columnName = software.amazon.jsii.Kernel.get(this, "columnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.size = software.amazon.jsii.Kernel.get(this, "size", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.sizeUnit = software.amazon.jsii.Kernel.get(this, "sizeUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.columnName = java.util.Objects.requireNonNull(builder.columnName, "columnName is required");
            this.size = java.util.Objects.requireNonNull(builder.size, "size is required");
            this.sizeUnit = java.util.Objects.requireNonNull(builder.sizeUnit, "sizeUnit is required");
        }

        @Override
        public final java.lang.String getColumnName() {
            return this.columnName;
        }

        @Override
        public final java.lang.Number getSize() {
            return this.size;
        }

        @Override
        public final java.lang.String getSizeUnit() {
            return this.sizeUnit;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("columnName", om.valueToTree(this.getColumnName()));
            data.set("size", om.valueToTree(this.getSize()));
            data.set("sizeUnit", om.valueToTree(this.getSizeUnit()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow.Jsii$Proxy that = (QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefreshLookbackWindow.Jsii$Proxy) o;

            if (!columnName.equals(that.columnName)) return false;
            if (!size.equals(that.size)) return false;
            return this.sizeUnit.equals(that.sizeUnit);
        }

        @Override
        public final int hashCode() {
            int result = this.columnName.hashCode();
            result = 31 * result + (this.size.hashCode());
            result = 31 * result + (this.sizeUnit.hashCode());
            return result;
        }
    }
}
