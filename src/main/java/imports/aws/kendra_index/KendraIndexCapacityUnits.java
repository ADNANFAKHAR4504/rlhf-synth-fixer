package imports.aws.kendra_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.434Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraIndex.KendraIndexCapacityUnits")
@software.amazon.jsii.Jsii.Proxy(KendraIndexCapacityUnits.Jsii$Proxy.class)
public interface KendraIndexCapacityUnits extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#query_capacity_units KendraIndex#query_capacity_units}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getQueryCapacityUnits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#storage_capacity_units KendraIndex#storage_capacity_units}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getStorageCapacityUnits() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraIndexCapacityUnits}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraIndexCapacityUnits}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraIndexCapacityUnits> {
        java.lang.Number queryCapacityUnits;
        java.lang.Number storageCapacityUnits;

        /**
         * Sets the value of {@link KendraIndexCapacityUnits#getQueryCapacityUnits}
         * @param queryCapacityUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#query_capacity_units KendraIndex#query_capacity_units}.
         * @return {@code this}
         */
        public Builder queryCapacityUnits(java.lang.Number queryCapacityUnits) {
            this.queryCapacityUnits = queryCapacityUnits;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexCapacityUnits#getStorageCapacityUnits}
         * @param storageCapacityUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#storage_capacity_units KendraIndex#storage_capacity_units}.
         * @return {@code this}
         */
        public Builder storageCapacityUnits(java.lang.Number storageCapacityUnits) {
            this.storageCapacityUnits = storageCapacityUnits;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraIndexCapacityUnits}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraIndexCapacityUnits build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraIndexCapacityUnits}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraIndexCapacityUnits {
        private final java.lang.Number queryCapacityUnits;
        private final java.lang.Number storageCapacityUnits;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.queryCapacityUnits = software.amazon.jsii.Kernel.get(this, "queryCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.storageCapacityUnits = software.amazon.jsii.Kernel.get(this, "storageCapacityUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.queryCapacityUnits = builder.queryCapacityUnits;
            this.storageCapacityUnits = builder.storageCapacityUnits;
        }

        @Override
        public final java.lang.Number getQueryCapacityUnits() {
            return this.queryCapacityUnits;
        }

        @Override
        public final java.lang.Number getStorageCapacityUnits() {
            return this.storageCapacityUnits;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getQueryCapacityUnits() != null) {
                data.set("queryCapacityUnits", om.valueToTree(this.getQueryCapacityUnits()));
            }
            if (this.getStorageCapacityUnits() != null) {
                data.set("storageCapacityUnits", om.valueToTree(this.getStorageCapacityUnits()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraIndex.KendraIndexCapacityUnits"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraIndexCapacityUnits.Jsii$Proxy that = (KendraIndexCapacityUnits.Jsii$Proxy) o;

            if (this.queryCapacityUnits != null ? !this.queryCapacityUnits.equals(that.queryCapacityUnits) : that.queryCapacityUnits != null) return false;
            return this.storageCapacityUnits != null ? this.storageCapacityUnits.equals(that.storageCapacityUnits) : that.storageCapacityUnits == null;
        }

        @Override
        public final int hashCode() {
            int result = this.queryCapacityUnits != null ? this.queryCapacityUnits.hashCode() : 0;
            result = 31 * result + (this.storageCapacityUnits != null ? this.storageCapacityUnits.hashCode() : 0);
            return result;
        }
    }
}
