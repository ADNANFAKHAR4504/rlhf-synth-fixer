package imports.aws.data_aws_ssoadmin_application_providers;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.893Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsSsoadminApplicationProviders.DataAwsSsoadminApplicationProvidersApplicationProviders")
@software.amazon.jsii.Jsii.Proxy(DataAwsSsoadminApplicationProvidersApplicationProviders.Jsii$Proxy.class)
public interface DataAwsSsoadminApplicationProvidersApplicationProviders extends software.amazon.jsii.JsiiSerializable {

    /**
     * display_data block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssoadmin_application_providers#display_data DataAwsSsoadminApplicationProviders#display_data}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisplayData() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsSsoadminApplicationProvidersApplicationProviders}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsSsoadminApplicationProvidersApplicationProviders}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsSsoadminApplicationProvidersApplicationProviders> {
        java.lang.Object displayData;

        /**
         * Sets the value of {@link DataAwsSsoadminApplicationProvidersApplicationProviders#getDisplayData}
         * @param displayData display_data block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssoadmin_application_providers#display_data DataAwsSsoadminApplicationProviders#display_data}
         * @return {@code this}
         */
        public Builder displayData(com.hashicorp.cdktf.IResolvable displayData) {
            this.displayData = displayData;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsSsoadminApplicationProvidersApplicationProviders#getDisplayData}
         * @param displayData display_data block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ssoadmin_application_providers#display_data DataAwsSsoadminApplicationProviders#display_data}
         * @return {@code this}
         */
        public Builder displayData(java.util.List<? extends imports.aws.data_aws_ssoadmin_application_providers.DataAwsSsoadminApplicationProvidersApplicationProvidersDisplayData> displayData) {
            this.displayData = displayData;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsSsoadminApplicationProvidersApplicationProviders}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsSsoadminApplicationProvidersApplicationProviders build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsSsoadminApplicationProvidersApplicationProviders}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsSsoadminApplicationProvidersApplicationProviders {
        private final java.lang.Object displayData;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.displayData = software.amazon.jsii.Kernel.get(this, "displayData", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.displayData = builder.displayData;
        }

        @Override
        public final java.lang.Object getDisplayData() {
            return this.displayData;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDisplayData() != null) {
                data.set("displayData", om.valueToTree(this.getDisplayData()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsSsoadminApplicationProviders.DataAwsSsoadminApplicationProvidersApplicationProviders"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsSsoadminApplicationProvidersApplicationProviders.Jsii$Proxy that = (DataAwsSsoadminApplicationProvidersApplicationProviders.Jsii$Proxy) o;

            return this.displayData != null ? this.displayData.equals(that.displayData) : that.displayData == null;
        }

        @Override
        public final int hashCode() {
            int result = this.displayData != null ? this.displayData.hashCode() : 0;
            return result;
        }
    }
}
