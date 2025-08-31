package imports.aws.cloudtrail;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.262Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudtrail.CloudtrailAdvancedEventSelector")
@software.amazon.jsii.Jsii.Proxy(CloudtrailAdvancedEventSelector.Jsii$Proxy.class)
public interface CloudtrailAdvancedEventSelector extends software.amazon.jsii.JsiiSerializable {

    /**
     * field_selector block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#field_selector Cloudtrail#field_selector}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getFieldSelector();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#name Cloudtrail#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudtrailAdvancedEventSelector}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudtrailAdvancedEventSelector}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudtrailAdvancedEventSelector> {
        java.lang.Object fieldSelector;
        java.lang.String name;

        /**
         * Sets the value of {@link CloudtrailAdvancedEventSelector#getFieldSelector}
         * @param fieldSelector field_selector block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#field_selector Cloudtrail#field_selector}
         * @return {@code this}
         */
        public Builder fieldSelector(com.hashicorp.cdktf.IResolvable fieldSelector) {
            this.fieldSelector = fieldSelector;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailAdvancedEventSelector#getFieldSelector}
         * @param fieldSelector field_selector block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#field_selector Cloudtrail#field_selector}
         * @return {@code this}
         */
        public Builder fieldSelector(java.util.List<? extends imports.aws.cloudtrail.CloudtrailAdvancedEventSelectorFieldSelector> fieldSelector) {
            this.fieldSelector = fieldSelector;
            return this;
        }

        /**
         * Sets the value of {@link CloudtrailAdvancedEventSelector#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudtrail#name Cloudtrail#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudtrailAdvancedEventSelector}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudtrailAdvancedEventSelector build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudtrailAdvancedEventSelector}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudtrailAdvancedEventSelector {
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
            this.fieldSelector = java.util.Objects.requireNonNull(builder.fieldSelector, "fieldSelector is required");
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

            data.set("fieldSelector", om.valueToTree(this.getFieldSelector()));
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudtrail.CloudtrailAdvancedEventSelector"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudtrailAdvancedEventSelector.Jsii$Proxy that = (CloudtrailAdvancedEventSelector.Jsii$Proxy) o;

            if (!fieldSelector.equals(that.fieldSelector)) return false;
            return this.name != null ? this.name.equals(that.name) : that.name == null;
        }

        @Override
        public final int hashCode() {
            int result = this.fieldSelector.hashCode();
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            return result;
        }
    }
}
