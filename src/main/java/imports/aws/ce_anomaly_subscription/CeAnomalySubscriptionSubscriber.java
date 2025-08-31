package imports.aws.ce_anomaly_subscription;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.187Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ceAnomalySubscription.CeAnomalySubscriptionSubscriber")
@software.amazon.jsii.Jsii.Proxy(CeAnomalySubscriptionSubscriber.Jsii$Proxy.class)
public interface CeAnomalySubscriptionSubscriber extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_anomaly_subscription#address CeAnomalySubscription#address}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAddress();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_anomaly_subscription#type CeAnomalySubscription#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * @return a {@link Builder} of {@link CeAnomalySubscriptionSubscriber}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CeAnomalySubscriptionSubscriber}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CeAnomalySubscriptionSubscriber> {
        java.lang.String address;
        java.lang.String type;

        /**
         * Sets the value of {@link CeAnomalySubscriptionSubscriber#getAddress}
         * @param address Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_anomaly_subscription#address CeAnomalySubscription#address}. This parameter is required.
         * @return {@code this}
         */
        public Builder address(java.lang.String address) {
            this.address = address;
            return this;
        }

        /**
         * Sets the value of {@link CeAnomalySubscriptionSubscriber#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ce_anomaly_subscription#type CeAnomalySubscription#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CeAnomalySubscriptionSubscriber}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CeAnomalySubscriptionSubscriber build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CeAnomalySubscriptionSubscriber}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CeAnomalySubscriptionSubscriber {
        private final java.lang.String address;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.address = software.amazon.jsii.Kernel.get(this, "address", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.address = java.util.Objects.requireNonNull(builder.address, "address is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
        }

        @Override
        public final java.lang.String getAddress() {
            return this.address;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("address", om.valueToTree(this.getAddress()));
            data.set("type", om.valueToTree(this.getType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ceAnomalySubscription.CeAnomalySubscriptionSubscriber"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CeAnomalySubscriptionSubscriber.Jsii$Proxy that = (CeAnomalySubscriptionSubscriber.Jsii$Proxy) o;

            if (!address.equals(that.address)) return false;
            return this.type.equals(that.type);
        }

        @Override
        public final int hashCode() {
            int result = this.address.hashCode();
            result = 31 * result + (this.type.hashCode());
            return result;
        }
    }
}
