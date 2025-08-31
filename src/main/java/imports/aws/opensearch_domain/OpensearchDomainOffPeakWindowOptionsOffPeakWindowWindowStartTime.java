package imports.aws.opensearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.990Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchDomain.OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime")
@software.amazon.jsii.Jsii.Proxy(OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime.Jsii$Proxy.class)
public interface OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#hours OpensearchDomain#hours}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHours() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#minutes OpensearchDomain#minutes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinutes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime> {
        java.lang.Number hours;
        java.lang.Number minutes;

        /**
         * Sets the value of {@link OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime#getHours}
         * @param hours Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#hours OpensearchDomain#hours}.
         * @return {@code this}
         */
        public Builder hours(java.lang.Number hours) {
            this.hours = hours;
            return this;
        }

        /**
         * Sets the value of {@link OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime#getMinutes}
         * @param minutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opensearch_domain#minutes OpensearchDomain#minutes}.
         * @return {@code this}
         */
        public Builder minutes(java.lang.Number minutes) {
            this.minutes = minutes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime {
        private final java.lang.Number hours;
        private final java.lang.Number minutes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hours = software.amazon.jsii.Kernel.get(this, "hours", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minutes = software.amazon.jsii.Kernel.get(this, "minutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hours = builder.hours;
            this.minutes = builder.minutes;
        }

        @Override
        public final java.lang.Number getHours() {
            return this.hours;
        }

        @Override
        public final java.lang.Number getMinutes() {
            return this.minutes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHours() != null) {
                data.set("hours", om.valueToTree(this.getHours()));
            }
            if (this.getMinutes() != null) {
                data.set("minutes", om.valueToTree(this.getMinutes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opensearchDomain.OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime.Jsii$Proxy that = (OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime.Jsii$Proxy) o;

            if (this.hours != null ? !this.hours.equals(that.hours) : that.hours != null) return false;
            return this.minutes != null ? this.minutes.equals(that.minutes) : that.minutes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.hours != null ? this.hours.hashCode() : 0;
            result = 31 * result + (this.minutes != null ? this.minutes.hashCode() : 0);
            return result;
        }
    }
}
