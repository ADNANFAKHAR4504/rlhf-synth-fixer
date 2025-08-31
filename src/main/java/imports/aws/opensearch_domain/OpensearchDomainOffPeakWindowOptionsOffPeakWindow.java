package imports.aws.opensearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.990Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchDomain.OpensearchDomainOffPeakWindowOptionsOffPeakWindow")
@software.amazon.jsii.Jsii.Proxy(OpensearchDomainOffPeakWindowOptionsOffPeakWindow.Jsii$Proxy.class)
public interface OpensearchDomainOffPeakWindowOptionsOffPeakWindow extends software.amazon.jsii.JsiiSerializable {

    /**
     * window_start_time block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#window_start_time OpensearchDomain#window_start_time}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime getWindowStartTime() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpensearchDomainOffPeakWindowOptionsOffPeakWindow}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpensearchDomainOffPeakWindowOptionsOffPeakWindow}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpensearchDomainOffPeakWindowOptionsOffPeakWindow> {
        imports.aws.opensearch_domain.OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime windowStartTime;

        /**
         * Sets the value of {@link OpensearchDomainOffPeakWindowOptionsOffPeakWindow#getWindowStartTime}
         * @param windowStartTime window_start_time block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#window_start_time OpensearchDomain#window_start_time}
         * @return {@code this}
         */
        public Builder windowStartTime(imports.aws.opensearch_domain.OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime windowStartTime) {
            this.windowStartTime = windowStartTime;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpensearchDomainOffPeakWindowOptionsOffPeakWindow}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpensearchDomainOffPeakWindowOptionsOffPeakWindow build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpensearchDomainOffPeakWindowOptionsOffPeakWindow}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpensearchDomainOffPeakWindowOptionsOffPeakWindow {
        private final imports.aws.opensearch_domain.OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime windowStartTime;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.windowStartTime = software.amazon.jsii.Kernel.get(this, "windowStartTime", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.windowStartTime = builder.windowStartTime;
        }

        @Override
        public final imports.aws.opensearch_domain.OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime getWindowStartTime() {
            return this.windowStartTime;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getWindowStartTime() != null) {
                data.set("windowStartTime", om.valueToTree(this.getWindowStartTime()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opensearchDomain.OpensearchDomainOffPeakWindowOptionsOffPeakWindow"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpensearchDomainOffPeakWindowOptionsOffPeakWindow.Jsii$Proxy that = (OpensearchDomainOffPeakWindowOptionsOffPeakWindow.Jsii$Proxy) o;

            return this.windowStartTime != null ? this.windowStartTime.equals(that.windowStartTime) : that.windowStartTime == null;
        }

        @Override
        public final int hashCode() {
            int result = this.windowStartTime != null ? this.windowStartTime.hashCode() : 0;
            return result;
        }
    }
}
