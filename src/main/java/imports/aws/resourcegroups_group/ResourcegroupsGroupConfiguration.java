package imports.aws.resourcegroups_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.192Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.resourcegroupsGroup.ResourcegroupsGroupConfiguration")
@software.amazon.jsii.Jsii.Proxy(ResourcegroupsGroupConfiguration.Jsii$Proxy.class)
public interface ResourcegroupsGroupConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resourcegroups_group#type ResourcegroupsGroup#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resourcegroups_group#parameters ResourcegroupsGroup#parameters}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ResourcegroupsGroupConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ResourcegroupsGroupConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ResourcegroupsGroupConfiguration> {
        java.lang.String type;
        java.lang.Object parameters;

        /**
         * Sets the value of {@link ResourcegroupsGroupConfiguration#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resourcegroups_group#type ResourcegroupsGroup#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link ResourcegroupsGroupConfiguration#getParameters}
         * @param parameters parameters block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resourcegroups_group#parameters ResourcegroupsGroup#parameters}
         * @return {@code this}
         */
        public Builder parameters(com.hashicorp.cdktf.IResolvable parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link ResourcegroupsGroupConfiguration#getParameters}
         * @param parameters parameters block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/resourcegroups_group#parameters ResourcegroupsGroup#parameters}
         * @return {@code this}
         */
        public Builder parameters(java.util.List<? extends imports.aws.resourcegroups_group.ResourcegroupsGroupConfigurationParameters> parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ResourcegroupsGroupConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ResourcegroupsGroupConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ResourcegroupsGroupConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ResourcegroupsGroupConfiguration {
        private final java.lang.String type;
        private final java.lang.Object parameters;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.parameters = builder.parameters;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.Object getParameters() {
            return this.parameters;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.resourcegroupsGroup.ResourcegroupsGroupConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ResourcegroupsGroupConfiguration.Jsii$Proxy that = (ResourcegroupsGroupConfiguration.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            return this.parameters != null ? this.parameters.equals(that.parameters) : that.parameters == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            return result;
        }
    }
}
