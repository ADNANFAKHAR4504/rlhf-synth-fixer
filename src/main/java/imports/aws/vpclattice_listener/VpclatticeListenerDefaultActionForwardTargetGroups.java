package imports.aws.vpclattice_listener;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.619Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeListener.VpclatticeListenerDefaultActionForwardTargetGroups")
@software.amazon.jsii.Jsii.Proxy(VpclatticeListenerDefaultActionForwardTargetGroups.Jsii$Proxy.class)
public interface VpclatticeListenerDefaultActionForwardTargetGroups extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener#target_group_identifier VpclatticeListener#target_group_identifier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetGroupIdentifier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener#weight VpclatticeListener#weight}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getWeight() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpclatticeListenerDefaultActionForwardTargetGroups}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeListenerDefaultActionForwardTargetGroups}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeListenerDefaultActionForwardTargetGroups> {
        java.lang.String targetGroupIdentifier;
        java.lang.Number weight;

        /**
         * Sets the value of {@link VpclatticeListenerDefaultActionForwardTargetGroups#getTargetGroupIdentifier}
         * @param targetGroupIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener#target_group_identifier VpclatticeListener#target_group_identifier}.
         * @return {@code this}
         */
        public Builder targetGroupIdentifier(java.lang.String targetGroupIdentifier) {
            this.targetGroupIdentifier = targetGroupIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeListenerDefaultActionForwardTargetGroups#getWeight}
         * @param weight Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener#weight VpclatticeListener#weight}.
         * @return {@code this}
         */
        public Builder weight(java.lang.Number weight) {
            this.weight = weight;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeListenerDefaultActionForwardTargetGroups}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeListenerDefaultActionForwardTargetGroups build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeListenerDefaultActionForwardTargetGroups}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeListenerDefaultActionForwardTargetGroups {
        private final java.lang.String targetGroupIdentifier;
        private final java.lang.Number weight;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetGroupIdentifier = software.amazon.jsii.Kernel.get(this, "targetGroupIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.weight = software.amazon.jsii.Kernel.get(this, "weight", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetGroupIdentifier = builder.targetGroupIdentifier;
            this.weight = builder.weight;
        }

        @Override
        public final java.lang.String getTargetGroupIdentifier() {
            return this.targetGroupIdentifier;
        }

        @Override
        public final java.lang.Number getWeight() {
            return this.weight;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTargetGroupIdentifier() != null) {
                data.set("targetGroupIdentifier", om.valueToTree(this.getTargetGroupIdentifier()));
            }
            if (this.getWeight() != null) {
                data.set("weight", om.valueToTree(this.getWeight()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeListener.VpclatticeListenerDefaultActionForwardTargetGroups"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeListenerDefaultActionForwardTargetGroups.Jsii$Proxy that = (VpclatticeListenerDefaultActionForwardTargetGroups.Jsii$Proxy) o;

            if (this.targetGroupIdentifier != null ? !this.targetGroupIdentifier.equals(that.targetGroupIdentifier) : that.targetGroupIdentifier != null) return false;
            return this.weight != null ? this.weight.equals(that.weight) : that.weight == null;
        }

        @Override
        public final int hashCode() {
            int result = this.targetGroupIdentifier != null ? this.targetGroupIdentifier.hashCode() : 0;
            result = 31 * result + (this.weight != null ? this.weight.hashCode() : 0);
            return result;
        }
    }
}
