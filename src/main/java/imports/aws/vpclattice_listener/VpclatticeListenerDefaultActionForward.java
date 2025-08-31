package imports.aws.vpclattice_listener;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.619Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeListener.VpclatticeListenerDefaultActionForward")
@software.amazon.jsii.Jsii.Proxy(VpclatticeListenerDefaultActionForward.Jsii$Proxy.class)
public interface VpclatticeListenerDefaultActionForward extends software.amazon.jsii.JsiiSerializable {

    /**
     * target_groups block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener#target_groups VpclatticeListener#target_groups}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTargetGroups() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpclatticeListenerDefaultActionForward}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeListenerDefaultActionForward}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeListenerDefaultActionForward> {
        java.lang.Object targetGroups;

        /**
         * Sets the value of {@link VpclatticeListenerDefaultActionForward#getTargetGroups}
         * @param targetGroups target_groups block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener#target_groups VpclatticeListener#target_groups}
         * @return {@code this}
         */
        public Builder targetGroups(com.hashicorp.cdktf.IResolvable targetGroups) {
            this.targetGroups = targetGroups;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeListenerDefaultActionForward#getTargetGroups}
         * @param targetGroups target_groups block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener#target_groups VpclatticeListener#target_groups}
         * @return {@code this}
         */
        public Builder targetGroups(java.util.List<? extends imports.aws.vpclattice_listener.VpclatticeListenerDefaultActionForwardTargetGroups> targetGroups) {
            this.targetGroups = targetGroups;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeListenerDefaultActionForward}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeListenerDefaultActionForward build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeListenerDefaultActionForward}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeListenerDefaultActionForward {
        private final java.lang.Object targetGroups;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetGroups = software.amazon.jsii.Kernel.get(this, "targetGroups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetGroups = builder.targetGroups;
        }

        @Override
        public final java.lang.Object getTargetGroups() {
            return this.targetGroups;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTargetGroups() != null) {
                data.set("targetGroups", om.valueToTree(this.getTargetGroups()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeListener.VpclatticeListenerDefaultActionForward"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeListenerDefaultActionForward.Jsii$Proxy that = (VpclatticeListenerDefaultActionForward.Jsii$Proxy) o;

            return this.targetGroups != null ? this.targetGroups.equals(that.targetGroups) : that.targetGroups == null;
        }

        @Override
        public final int hashCode() {
            int result = this.targetGroups != null ? this.targetGroups.hashCode() : 0;
            return result;
        }
    }
}
