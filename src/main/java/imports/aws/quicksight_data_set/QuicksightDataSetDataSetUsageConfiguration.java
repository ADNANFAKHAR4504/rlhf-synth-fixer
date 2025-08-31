package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.106Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetDataSetUsageConfiguration")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetDataSetUsageConfiguration.Jsii$Proxy.class)
public interface QuicksightDataSetDataSetUsageConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#disable_use_as_direct_query_source QuicksightDataSet#disable_use_as_direct_query_source}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableUseAsDirectQuerySource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#disable_use_as_imported_source QuicksightDataSet#disable_use_as_imported_source}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableUseAsImportedSource() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetDataSetUsageConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetDataSetUsageConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetDataSetUsageConfiguration> {
        java.lang.Object disableUseAsDirectQuerySource;
        java.lang.Object disableUseAsImportedSource;

        /**
         * Sets the value of {@link QuicksightDataSetDataSetUsageConfiguration#getDisableUseAsDirectQuerySource}
         * @param disableUseAsDirectQuerySource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#disable_use_as_direct_query_source QuicksightDataSet#disable_use_as_direct_query_source}.
         * @return {@code this}
         */
        public Builder disableUseAsDirectQuerySource(java.lang.Boolean disableUseAsDirectQuerySource) {
            this.disableUseAsDirectQuerySource = disableUseAsDirectQuerySource;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetDataSetUsageConfiguration#getDisableUseAsDirectQuerySource}
         * @param disableUseAsDirectQuerySource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#disable_use_as_direct_query_source QuicksightDataSet#disable_use_as_direct_query_source}.
         * @return {@code this}
         */
        public Builder disableUseAsDirectQuerySource(com.hashicorp.cdktf.IResolvable disableUseAsDirectQuerySource) {
            this.disableUseAsDirectQuerySource = disableUseAsDirectQuerySource;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetDataSetUsageConfiguration#getDisableUseAsImportedSource}
         * @param disableUseAsImportedSource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#disable_use_as_imported_source QuicksightDataSet#disable_use_as_imported_source}.
         * @return {@code this}
         */
        public Builder disableUseAsImportedSource(java.lang.Boolean disableUseAsImportedSource) {
            this.disableUseAsImportedSource = disableUseAsImportedSource;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetDataSetUsageConfiguration#getDisableUseAsImportedSource}
         * @param disableUseAsImportedSource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#disable_use_as_imported_source QuicksightDataSet#disable_use_as_imported_source}.
         * @return {@code this}
         */
        public Builder disableUseAsImportedSource(com.hashicorp.cdktf.IResolvable disableUseAsImportedSource) {
            this.disableUseAsImportedSource = disableUseAsImportedSource;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetDataSetUsageConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetDataSetUsageConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetDataSetUsageConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetDataSetUsageConfiguration {
        private final java.lang.Object disableUseAsDirectQuerySource;
        private final java.lang.Object disableUseAsImportedSource;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.disableUseAsDirectQuerySource = software.amazon.jsii.Kernel.get(this, "disableUseAsDirectQuerySource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.disableUseAsImportedSource = software.amazon.jsii.Kernel.get(this, "disableUseAsImportedSource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.disableUseAsDirectQuerySource = builder.disableUseAsDirectQuerySource;
            this.disableUseAsImportedSource = builder.disableUseAsImportedSource;
        }

        @Override
        public final java.lang.Object getDisableUseAsDirectQuerySource() {
            return this.disableUseAsDirectQuerySource;
        }

        @Override
        public final java.lang.Object getDisableUseAsImportedSource() {
            return this.disableUseAsImportedSource;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDisableUseAsDirectQuerySource() != null) {
                data.set("disableUseAsDirectQuerySource", om.valueToTree(this.getDisableUseAsDirectQuerySource()));
            }
            if (this.getDisableUseAsImportedSource() != null) {
                data.set("disableUseAsImportedSource", om.valueToTree(this.getDisableUseAsImportedSource()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetDataSetUsageConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetDataSetUsageConfiguration.Jsii$Proxy that = (QuicksightDataSetDataSetUsageConfiguration.Jsii$Proxy) o;

            if (this.disableUseAsDirectQuerySource != null ? !this.disableUseAsDirectQuerySource.equals(that.disableUseAsDirectQuerySource) : that.disableUseAsDirectQuerySource != null) return false;
            return this.disableUseAsImportedSource != null ? this.disableUseAsImportedSource.equals(that.disableUseAsImportedSource) : that.disableUseAsImportedSource == null;
        }

        @Override
        public final int hashCode() {
            int result = this.disableUseAsDirectQuerySource != null ? this.disableUseAsDirectQuerySource.hashCode() : 0;
            result = 31 * result + (this.disableUseAsImportedSource != null ? this.disableUseAsImportedSource.hashCode() : 0);
            return result;
        }
    }
}
