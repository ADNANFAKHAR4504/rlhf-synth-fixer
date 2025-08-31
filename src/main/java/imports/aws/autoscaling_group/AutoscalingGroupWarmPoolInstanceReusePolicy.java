package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.099Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupWarmPoolInstanceReusePolicy")
@software.amazon.jsii.Jsii.Proxy(AutoscalingGroupWarmPoolInstanceReusePolicy.Jsii$Proxy.class)
public interface AutoscalingGroupWarmPoolInstanceReusePolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#reuse_on_scale_in AutoscalingGroup#reuse_on_scale_in}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReuseOnScaleIn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingGroupWarmPoolInstanceReusePolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingGroupWarmPoolInstanceReusePolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingGroupWarmPoolInstanceReusePolicy> {
        java.lang.Object reuseOnScaleIn;

        /**
         * Sets the value of {@link AutoscalingGroupWarmPoolInstanceReusePolicy#getReuseOnScaleIn}
         * @param reuseOnScaleIn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#reuse_on_scale_in AutoscalingGroup#reuse_on_scale_in}.
         * @return {@code this}
         */
        public Builder reuseOnScaleIn(java.lang.Boolean reuseOnScaleIn) {
            this.reuseOnScaleIn = reuseOnScaleIn;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupWarmPoolInstanceReusePolicy#getReuseOnScaleIn}
         * @param reuseOnScaleIn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#reuse_on_scale_in AutoscalingGroup#reuse_on_scale_in}.
         * @return {@code this}
         */
        public Builder reuseOnScaleIn(com.hashicorp.cdktf.IResolvable reuseOnScaleIn) {
            this.reuseOnScaleIn = reuseOnScaleIn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingGroupWarmPoolInstanceReusePolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingGroupWarmPoolInstanceReusePolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingGroupWarmPoolInstanceReusePolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingGroupWarmPoolInstanceReusePolicy {
        private final java.lang.Object reuseOnScaleIn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.reuseOnScaleIn = software.amazon.jsii.Kernel.get(this, "reuseOnScaleIn", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.reuseOnScaleIn = builder.reuseOnScaleIn;
        }

        @Override
        public final java.lang.Object getReuseOnScaleIn() {
            return this.reuseOnScaleIn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getReuseOnScaleIn() != null) {
                data.set("reuseOnScaleIn", om.valueToTree(this.getReuseOnScaleIn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingGroup.AutoscalingGroupWarmPoolInstanceReusePolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingGroupWarmPoolInstanceReusePolicy.Jsii$Proxy that = (AutoscalingGroupWarmPoolInstanceReusePolicy.Jsii$Proxy) o;

            return this.reuseOnScaleIn != null ? this.reuseOnScaleIn.equals(that.reuseOnScaleIn) : that.reuseOnScaleIn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.reuseOnScaleIn != null ? this.reuseOnScaleIn.hashCode() : 0;
            return result;
        }
    }
}
