package imports.aws.data_aws_elasticache_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.649Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsElasticacheUser.DataAwsElasticacheUserAuthenticationMode")
@software.amazon.jsii.Jsii.Proxy(DataAwsElasticacheUserAuthenticationMode.Jsii$Proxy.class)
public interface DataAwsElasticacheUserAuthenticationMode extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_user#password_count DataAwsElasticacheUser#password_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPasswordCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_user#type DataAwsElasticacheUser#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsElasticacheUserAuthenticationMode}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsElasticacheUserAuthenticationMode}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsElasticacheUserAuthenticationMode> {
        java.lang.Number passwordCount;
        java.lang.String type;

        /**
         * Sets the value of {@link DataAwsElasticacheUserAuthenticationMode#getPasswordCount}
         * @param passwordCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_user#password_count DataAwsElasticacheUser#password_count}.
         * @return {@code this}
         */
        public Builder passwordCount(java.lang.Number passwordCount) {
            this.passwordCount = passwordCount;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsElasticacheUserAuthenticationMode#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/elasticache_user#type DataAwsElasticacheUser#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsElasticacheUserAuthenticationMode}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsElasticacheUserAuthenticationMode build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsElasticacheUserAuthenticationMode}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsElasticacheUserAuthenticationMode {
        private final java.lang.Number passwordCount;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.passwordCount = software.amazon.jsii.Kernel.get(this, "passwordCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.passwordCount = builder.passwordCount;
            this.type = builder.type;
        }

        @Override
        public final java.lang.Number getPasswordCount() {
            return this.passwordCount;
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

            if (this.getPasswordCount() != null) {
                data.set("passwordCount", om.valueToTree(this.getPasswordCount()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsElasticacheUser.DataAwsElasticacheUserAuthenticationMode"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsElasticacheUserAuthenticationMode.Jsii$Proxy that = (DataAwsElasticacheUserAuthenticationMode.Jsii$Proxy) o;

            if (this.passwordCount != null ? !this.passwordCount.equals(that.passwordCount) : that.passwordCount != null) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.passwordCount != null ? this.passwordCount.hashCode() : 0;
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
