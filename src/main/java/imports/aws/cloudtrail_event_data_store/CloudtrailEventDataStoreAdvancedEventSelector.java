package imports.aws.cloudtrail_event_data_store;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.263Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudtrailEventDataStore.CloudtrailEventDataStoreAdvancedEventSelector")
@software.amazon.jsii.Jsii.Proxy(CloudtrailEventDataStoreAdvancedEventSelector.Jsii$Proxy.class)
public interface CloudtrailEventDataStoreAdvancedEventSelector extends software.amazon.jsii.JsiiSerializable {

    /**
     * field_selector block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail_event_data_store#field_selector CloudtrailEventDataStore#field_selector}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFieldSelector() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail_event_data_store#name CloudtrailEventDataStore#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudtrailEventDataStoreAdvancedEventSelector}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudtrailEventDataStoreAdvancedEventSelector}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudtrailEventDataStoreAdvancedEventSelector> {
        java.lang.Object fieldSelector;
        java.lang.String name;

        /**
         * Sets the value of {@link CloudtrailEventDataStoreAdvancedEventSelector#getFieldSelector}
         * @param fieldSelector field_selector block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail_event_data_store#field_selector CloudtrailEventDataStore#field_selector}
         * @return {@code this}
         */
        public Builder fieldSelector(com.hashicorp.cdktf.IResolvable fieldSelector) {
            this.fieldSelector = fieldSelector;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailEventDataStoreAdvancedEventSelector#getFieldSelector}
         * @param fieldSelector field_selector block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail_event_data_store#field_selector CloudtrailEventDataStore#field_selector}
         * @return {@code this}
         */
        public Builder fieldSelector(java.util.List<? extends imports.aws.cloudtrail_event_data_store.CloudtrailEventDataStoreAdvancedEventSelectorFieldSelector> fieldSelector) {
            this.fieldSelector = fieldSelector;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailEventDataStoreAdvancedEventSelector#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail_event_data_store#name CloudtrailEventDataStore#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudtrailEventDataStoreAdvancedEventSelector}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudtrailEventDataStoreAdvancedEventSelector build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudtrailEventDataStoreAdvancedEventSelector}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudtrailEventDataStoreAdvancedEventSelector {
        private final java.lang.Object fieldSelector;
        private final java.lang.String name;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fieldSelector = software.amazon.jsii.Kernel.get(this, "fieldSelector", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fieldSelector = builder.fieldSelector;
            this.name = builder.name;
        }

        @Override
        public final java.lang.Object getFieldSelector() {
            return this.fieldSelector;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFieldSelector() != null) {
                data.set("fieldSelector", om.valueToTree(this.getFieldSelector()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudtrailEventDataStore.CloudtrailEventDataStoreAdvancedEventSelector"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudtrailEventDataStoreAdvancedEventSelector.Jsii$Proxy that = (CloudtrailEventDataStoreAdvancedEventSelector.Jsii$Proxy) o;

            if (this.fieldSelector != null ? !this.fieldSelector.equals(that.fieldSelector) : that.fieldSelector != null) return false;
            return this.name != null ? this.name.equals(that.name) : that.name == null;
        }

        @Override
        public final int hashCode() {
            int result = this.fieldSelector != null ? this.fieldSelector.hashCode() : 0;
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            return result;
        }
    }
}
