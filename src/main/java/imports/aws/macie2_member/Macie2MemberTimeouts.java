package imports.aws.macie2_member;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.856Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2Member.Macie2MemberTimeouts")
@software.amazon.jsii.Jsii.Proxy(Macie2MemberTimeouts.Jsii$Proxy.class)
public interface Macie2MemberTimeouts extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_member#create Macie2Member#create}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCreate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_member#update Macie2Member#update}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUpdate() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Macie2MemberTimeouts}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Macie2MemberTimeouts}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Macie2MemberTimeouts> {
        java.lang.String create;
        java.lang.String update;

        /**
         * Sets the value of {@link Macie2MemberTimeouts#getCreate}
         * @param create Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_member#create Macie2Member#create}.
         * @return {@code this}
         */
        public Builder create(java.lang.String create) {
            this.create = create;
            return this;
        }

        /**
         * Sets the value of {@link Macie2MemberTimeouts#getUpdate}
         * @param update Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_member#update Macie2Member#update}.
         * @return {@code this}
         */
        public Builder update(java.lang.String update) {
            this.update = update;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Macie2MemberTimeouts}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Macie2MemberTimeouts build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Macie2MemberTimeouts}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Macie2MemberTimeouts {
        private final java.lang.String create;
        private final java.lang.String update;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.create = software.amazon.jsii.Kernel.get(this, "create", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.update = software.amazon.jsii.Kernel.get(this, "update", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.create = builder.create;
            this.update = builder.update;
        }

        @Override
        public final java.lang.String getCreate() {
            return this.create;
        }

        @Override
        public final java.lang.String getUpdate() {
            return this.update;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCreate() != null) {
                data.set("create", om.valueToTree(this.getCreate()));
            }
            if (this.getUpdate() != null) {
                data.set("update", om.valueToTree(this.getUpdate()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.macie2Member.Macie2MemberTimeouts"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Macie2MemberTimeouts.Jsii$Proxy that = (Macie2MemberTimeouts.Jsii$Proxy) o;

            if (this.create != null ? !this.create.equals(that.create) : that.create != null) return false;
            return this.update != null ? this.update.equals(that.update) : that.update == null;
        }

        @Override
        public final int hashCode() {
            int result = this.create != null ? this.create.hashCode() : 0;
            result = 31 * result + (this.update != null ? this.update.hashCode() : 0);
            return result;
        }
    }
}
