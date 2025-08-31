package imports.aws.s3_control_multi_region_access_point_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.283Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlMultiRegionAccessPointPolicy.S3ControlMultiRegionAccessPointPolicyDetails")
@software.amazon.jsii.Jsii.Proxy(S3ControlMultiRegionAccessPointPolicyDetails.Jsii$Proxy.class)
public interface S3ControlMultiRegionAccessPointPolicyDetails extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_multi_region_access_point_policy#name S3ControlMultiRegionAccessPointPolicy#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_multi_region_access_point_policy#policy S3ControlMultiRegionAccessPointPolicy#policy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPolicy();

    /**
     * @return a {@link Builder} of {@link S3ControlMultiRegionAccessPointPolicyDetails}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlMultiRegionAccessPointPolicyDetails}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlMultiRegionAccessPointPolicyDetails> {
        java.lang.String name;
        java.lang.String policy;

        /**
         * Sets the value of {@link S3ControlMultiRegionAccessPointPolicyDetails#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_multi_region_access_point_policy#name S3ControlMultiRegionAccessPointPolicy#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlMultiRegionAccessPointPolicyDetails#getPolicy}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_multi_region_access_point_policy#policy S3ControlMultiRegionAccessPointPolicy#policy}. This parameter is required.
         * @return {@code this}
         */
        public Builder policy(java.lang.String policy) {
            this.policy = policy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlMultiRegionAccessPointPolicyDetails}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlMultiRegionAccessPointPolicyDetails build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlMultiRegionAccessPointPolicyDetails}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlMultiRegionAccessPointPolicyDetails {
        private final java.lang.String name;
        private final java.lang.String policy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policy = software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.policy = java.util.Objects.requireNonNull(builder.policy, "policy is required");
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getPolicy() {
            return this.policy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("policy", om.valueToTree(this.getPolicy()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlMultiRegionAccessPointPolicy.S3ControlMultiRegionAccessPointPolicyDetails"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlMultiRegionAccessPointPolicyDetails.Jsii$Proxy that = (S3ControlMultiRegionAccessPointPolicyDetails.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            return this.policy.equals(that.policy);
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.policy.hashCode());
            return result;
        }
    }
}
