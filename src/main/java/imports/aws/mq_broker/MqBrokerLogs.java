package imports.aws.mq_broker;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.903Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mqBroker.MqBrokerLogs")
@software.amazon.jsii.Jsii.Proxy(MqBrokerLogs.Jsii$Proxy.class)
public interface MqBrokerLogs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#audit MqBroker#audit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAudit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#general MqBroker#general}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGeneral() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MqBrokerLogs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MqBrokerLogs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MqBrokerLogs> {
        java.lang.String audit;
        java.lang.Object general;

        /**
         * Sets the value of {@link MqBrokerLogs#getAudit}
         * @param audit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#audit MqBroker#audit}.
         * @return {@code this}
         */
        public Builder audit(java.lang.String audit) {
            this.audit = audit;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerLogs#getGeneral}
         * @param general Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#general MqBroker#general}.
         * @return {@code this}
         */
        public Builder general(java.lang.Boolean general) {
            this.general = general;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerLogs#getGeneral}
         * @param general Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#general MqBroker#general}.
         * @return {@code this}
         */
        public Builder general(com.hashicorp.cdktf.IResolvable general) {
            this.general = general;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MqBrokerLogs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MqBrokerLogs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MqBrokerLogs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MqBrokerLogs {
        private final java.lang.String audit;
        private final java.lang.Object general;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.audit = software.amazon.jsii.Kernel.get(this, "audit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.general = software.amazon.jsii.Kernel.get(this, "general", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.audit = builder.audit;
            this.general = builder.general;
        }

        @Override
        public final java.lang.String getAudit() {
            return this.audit;
        }

        @Override
        public final java.lang.Object getGeneral() {
            return this.general;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAudit() != null) {
                data.set("audit", om.valueToTree(this.getAudit()));
            }
            if (this.getGeneral() != null) {
                data.set("general", om.valueToTree(this.getGeneral()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mqBroker.MqBrokerLogs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MqBrokerLogs.Jsii$Proxy that = (MqBrokerLogs.Jsii$Proxy) o;

            if (this.audit != null ? !this.audit.equals(that.audit) : that.audit != null) return false;
            return this.general != null ? this.general.equals(that.general) : that.general == null;
        }

        @Override
        public final int hashCode() {
            int result = this.audit != null ? this.audit.hashCode() : 0;
            result = 31 * result + (this.general != null ? this.general.hashCode() : 0);
            return result;
        }
    }
}
