package imports.aws.connect_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.394Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectUser.ConnectUserPhoneConfig")
@software.amazon.jsii.Jsii.Proxy(ConnectUserPhoneConfig.Jsii$Proxy.class)
public interface ConnectUserPhoneConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#phone_type ConnectUser#phone_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPhoneType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#after_contact_work_time_limit ConnectUser#after_contact_work_time_limit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAfterContactWorkTimeLimit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#auto_accept ConnectUser#auto_accept}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoAccept() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#desk_phone_number ConnectUser#desk_phone_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeskPhoneNumber() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConnectUserPhoneConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectUserPhoneConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectUserPhoneConfig> {
        java.lang.String phoneType;
        java.lang.Number afterContactWorkTimeLimit;
        java.lang.Object autoAccept;
        java.lang.String deskPhoneNumber;

        /**
         * Sets the value of {@link ConnectUserPhoneConfig#getPhoneType}
         * @param phoneType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#phone_type ConnectUser#phone_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder phoneType(java.lang.String phoneType) {
            this.phoneType = phoneType;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserPhoneConfig#getAfterContactWorkTimeLimit}
         * @param afterContactWorkTimeLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#after_contact_work_time_limit ConnectUser#after_contact_work_time_limit}.
         * @return {@code this}
         */
        public Builder afterContactWorkTimeLimit(java.lang.Number afterContactWorkTimeLimit) {
            this.afterContactWorkTimeLimit = afterContactWorkTimeLimit;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserPhoneConfig#getAutoAccept}
         * @param autoAccept Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#auto_accept ConnectUser#auto_accept}.
         * @return {@code this}
         */
        public Builder autoAccept(java.lang.Boolean autoAccept) {
            this.autoAccept = autoAccept;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserPhoneConfig#getAutoAccept}
         * @param autoAccept Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#auto_accept ConnectUser#auto_accept}.
         * @return {@code this}
         */
        public Builder autoAccept(com.hashicorp.cdktf.IResolvable autoAccept) {
            this.autoAccept = autoAccept;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserPhoneConfig#getDeskPhoneNumber}
         * @param deskPhoneNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#desk_phone_number ConnectUser#desk_phone_number}.
         * @return {@code this}
         */
        public Builder deskPhoneNumber(java.lang.String deskPhoneNumber) {
            this.deskPhoneNumber = deskPhoneNumber;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConnectUserPhoneConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectUserPhoneConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectUserPhoneConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectUserPhoneConfig {
        private final java.lang.String phoneType;
        private final java.lang.Number afterContactWorkTimeLimit;
        private final java.lang.Object autoAccept;
        private final java.lang.String deskPhoneNumber;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.phoneType = software.amazon.jsii.Kernel.get(this, "phoneType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.afterContactWorkTimeLimit = software.amazon.jsii.Kernel.get(this, "afterContactWorkTimeLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.autoAccept = software.amazon.jsii.Kernel.get(this, "autoAccept", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deskPhoneNumber = software.amazon.jsii.Kernel.get(this, "deskPhoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.phoneType = java.util.Objects.requireNonNull(builder.phoneType, "phoneType is required");
            this.afterContactWorkTimeLimit = builder.afterContactWorkTimeLimit;
            this.autoAccept = builder.autoAccept;
            this.deskPhoneNumber = builder.deskPhoneNumber;
        }

        @Override
        public final java.lang.String getPhoneType() {
            return this.phoneType;
        }

        @Override
        public final java.lang.Number getAfterContactWorkTimeLimit() {
            return this.afterContactWorkTimeLimit;
        }

        @Override
        public final java.lang.Object getAutoAccept() {
            return this.autoAccept;
        }

        @Override
        public final java.lang.String getDeskPhoneNumber() {
            return this.deskPhoneNumber;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("phoneType", om.valueToTree(this.getPhoneType()));
            if (this.getAfterContactWorkTimeLimit() != null) {
                data.set("afterContactWorkTimeLimit", om.valueToTree(this.getAfterContactWorkTimeLimit()));
            }
            if (this.getAutoAccept() != null) {
                data.set("autoAccept", om.valueToTree(this.getAutoAccept()));
            }
            if (this.getDeskPhoneNumber() != null) {
                data.set("deskPhoneNumber", om.valueToTree(this.getDeskPhoneNumber()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.connectUser.ConnectUserPhoneConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectUserPhoneConfig.Jsii$Proxy that = (ConnectUserPhoneConfig.Jsii$Proxy) o;

            if (!phoneType.equals(that.phoneType)) return false;
            if (this.afterContactWorkTimeLimit != null ? !this.afterContactWorkTimeLimit.equals(that.afterContactWorkTimeLimit) : that.afterContactWorkTimeLimit != null) return false;
            if (this.autoAccept != null ? !this.autoAccept.equals(that.autoAccept) : that.autoAccept != null) return false;
            return this.deskPhoneNumber != null ? this.deskPhoneNumber.equals(that.deskPhoneNumber) : that.deskPhoneNumber == null;
        }

        @Override
        public final int hashCode() {
            int result = this.phoneType.hashCode();
            result = 31 * result + (this.afterContactWorkTimeLimit != null ? this.afterContactWorkTimeLimit.hashCode() : 0);
            result = 31 * result + (this.autoAccept != null ? this.autoAccept.hashCode() : 0);
            result = 31 * result + (this.deskPhoneNumber != null ? this.deskPhoneNumber.hashCode() : 0);
            return result;
        }
    }
}
