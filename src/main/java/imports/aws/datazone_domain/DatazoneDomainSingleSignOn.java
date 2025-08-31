package imports.aws.datazone_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.955Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datazoneDomain.DatazoneDomainSingleSignOn")
@software.amazon.jsii.Jsii.Proxy(DatazoneDomainSingleSignOn.Jsii$Proxy.class)
public interface DatazoneDomainSingleSignOn extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#type DatazoneDomain#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#user_assignment DatazoneDomain#user_assignment}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserAssignment() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatazoneDomainSingleSignOn}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatazoneDomainSingleSignOn}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatazoneDomainSingleSignOn> {
        java.lang.String type;
        java.lang.String userAssignment;

        /**
         * Sets the value of {@link DatazoneDomainSingleSignOn#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#type DatazoneDomain#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link DatazoneDomainSingleSignOn#getUserAssignment}
         * @param userAssignment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datazone_domain#user_assignment DatazoneDomain#user_assignment}.
         * @return {@code this}
         */
        public Builder userAssignment(java.lang.String userAssignment) {
            this.userAssignment = userAssignment;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatazoneDomainSingleSignOn}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatazoneDomainSingleSignOn build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatazoneDomainSingleSignOn}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatazoneDomainSingleSignOn {
        private final java.lang.String type;
        private final java.lang.String userAssignment;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userAssignment = software.amazon.jsii.Kernel.get(this, "userAssignment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = builder.type;
            this.userAssignment = builder.userAssignment;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getUserAssignment() {
            return this.userAssignment;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }
            if (this.getUserAssignment() != null) {
                data.set("userAssignment", om.valueToTree(this.getUserAssignment()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datazoneDomain.DatazoneDomainSingleSignOn"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatazoneDomainSingleSignOn.Jsii$Proxy that = (DatazoneDomainSingleSignOn.Jsii$Proxy) o;

            if (this.type != null ? !this.type.equals(that.type) : that.type != null) return false;
            return this.userAssignment != null ? this.userAssignment.equals(that.userAssignment) : that.userAssignment == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type != null ? this.type.hashCode() : 0;
            result = 31 * result + (this.userAssignment != null ? this.userAssignment.hashCode() : 0);
            return result;
        }
    }
}
