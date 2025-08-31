package imports.aws.fms_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.235Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fmsPolicy.FmsPolicyIncludeMap")
@software.amazon.jsii.Jsii.Proxy(FmsPolicyIncludeMap.Jsii$Proxy.class)
public interface FmsPolicyIncludeMap extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#account FmsPolicy#account}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAccount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#orgunit FmsPolicy#orgunit}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getOrgunit() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FmsPolicyIncludeMap}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FmsPolicyIncludeMap}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FmsPolicyIncludeMap> {
        java.util.List<java.lang.String> account;
        java.util.List<java.lang.String> orgunit;

        /**
         * Sets the value of {@link FmsPolicyIncludeMap#getAccount}
         * @param account Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#account FmsPolicy#account}.
         * @return {@code this}
         */
        public Builder account(java.util.List<java.lang.String> account) {
            this.account = account;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicyIncludeMap#getOrgunit}
         * @param orgunit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#orgunit FmsPolicy#orgunit}.
         * @return {@code this}
         */
        public Builder orgunit(java.util.List<java.lang.String> orgunit) {
            this.orgunit = orgunit;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FmsPolicyIncludeMap}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FmsPolicyIncludeMap build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FmsPolicyIncludeMap}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FmsPolicyIncludeMap {
        private final java.util.List<java.lang.String> account;
        private final java.util.List<java.lang.String> orgunit;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.account = software.amazon.jsii.Kernel.get(this, "account", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.orgunit = software.amazon.jsii.Kernel.get(this, "orgunit", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.account = builder.account;
            this.orgunit = builder.orgunit;
        }

        @Override
        public final java.util.List<java.lang.String> getAccount() {
            return this.account;
        }

        @Override
        public final java.util.List<java.lang.String> getOrgunit() {
            return this.orgunit;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAccount() != null) {
                data.set("account", om.valueToTree(this.getAccount()));
            }
            if (this.getOrgunit() != null) {
                data.set("orgunit", om.valueToTree(this.getOrgunit()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fmsPolicy.FmsPolicyIncludeMap"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FmsPolicyIncludeMap.Jsii$Proxy that = (FmsPolicyIncludeMap.Jsii$Proxy) o;

            if (this.account != null ? !this.account.equals(that.account) : that.account != null) return false;
            return this.orgunit != null ? this.orgunit.equals(that.orgunit) : that.orgunit == null;
        }

        @Override
        public final int hashCode() {
            int result = this.account != null ? this.account.hashCode() : 0;
            result = 31 * result + (this.orgunit != null ? this.orgunit.hashCode() : 0);
            return result;
        }
    }
}
