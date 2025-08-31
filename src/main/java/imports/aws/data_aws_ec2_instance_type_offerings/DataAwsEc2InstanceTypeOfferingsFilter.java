package imports.aws.data_aws_ec2_instance_type_offerings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.577Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEc2InstanceTypeOfferings.DataAwsEc2InstanceTypeOfferingsFilter")
@software.amazon.jsii.Jsii.Proxy(DataAwsEc2InstanceTypeOfferingsFilter.Jsii$Proxy.class)
public interface DataAwsEc2InstanceTypeOfferingsFilter extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_instance_type_offerings#name DataAwsEc2InstanceTypeOfferings#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_instance_type_offerings#values DataAwsEc2InstanceTypeOfferings#values}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getValues();

    /**
     * @return a {@link Builder} of {@link DataAwsEc2InstanceTypeOfferingsFilter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsEc2InstanceTypeOfferingsFilter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsEc2InstanceTypeOfferingsFilter> {
        java.lang.String name;
        java.util.List<java.lang.String> values;

        /**
         * Sets the value of {@link DataAwsEc2InstanceTypeOfferingsFilter#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_instance_type_offerings#name DataAwsEc2InstanceTypeOfferings#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsEc2InstanceTypeOfferingsFilter#getValues}
         * @param values Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_instance_type_offerings#values DataAwsEc2InstanceTypeOfferings#values}. This parameter is required.
         * @return {@code this}
         */
        public Builder values(java.util.List<java.lang.String> values) {
            this.values = values;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsEc2InstanceTypeOfferingsFilter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsEc2InstanceTypeOfferingsFilter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsEc2InstanceTypeOfferingsFilter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsEc2InstanceTypeOfferingsFilter {
        private final java.lang.String name;
        private final java.util.List<java.lang.String> values;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.values = software.amazon.jsii.Kernel.get(this, "values", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.values = java.util.Objects.requireNonNull(builder.values, "values is required");
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.util.List<java.lang.String> getValues() {
            return this.values;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("values", om.valueToTree(this.getValues()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsEc2InstanceTypeOfferings.DataAwsEc2InstanceTypeOfferingsFilter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsEc2InstanceTypeOfferingsFilter.Jsii$Proxy that = (DataAwsEc2InstanceTypeOfferingsFilter.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            return this.values.equals(that.values);
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.values.hashCode());
            return result;
        }
    }
}
