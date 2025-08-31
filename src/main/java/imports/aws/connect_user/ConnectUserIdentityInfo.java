package imports.aws.connect_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.394Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectUser.ConnectUserIdentityInfo")
@software.amazon.jsii.Jsii.Proxy(ConnectUserIdentityInfo.Jsii$Proxy.class)
public interface ConnectUserIdentityInfo extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#email ConnectUser#email}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEmail() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#first_name ConnectUser#first_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFirstName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#last_name ConnectUser#last_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLastName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#secondary_email ConnectUser#secondary_email}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecondaryEmail() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConnectUserIdentityInfo}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectUserIdentityInfo}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectUserIdentityInfo> {
        java.lang.String email;
        java.lang.String firstName;
        java.lang.String lastName;
        java.lang.String secondaryEmail;

        /**
         * Sets the value of {@link ConnectUserIdentityInfo#getEmail}
         * @param email Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#email ConnectUser#email}.
         * @return {@code this}
         */
        public Builder email(java.lang.String email) {
            this.email = email;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserIdentityInfo#getFirstName}
         * @param firstName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#first_name ConnectUser#first_name}.
         * @return {@code this}
         */
        public Builder firstName(java.lang.String firstName) {
            this.firstName = firstName;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserIdentityInfo#getLastName}
         * @param lastName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#last_name ConnectUser#last_name}.
         * @return {@code this}
         */
        public Builder lastName(java.lang.String lastName) {
            this.lastName = lastName;
            return this;
        }

        /**
         * Sets the value of {@link ConnectUserIdentityInfo#getSecondaryEmail}
         * @param secondaryEmail Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_user#secondary_email ConnectUser#secondary_email}.
         * @return {@code this}
         */
        public Builder secondaryEmail(java.lang.String secondaryEmail) {
            this.secondaryEmail = secondaryEmail;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConnectUserIdentityInfo}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectUserIdentityInfo build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectUserIdentityInfo}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectUserIdentityInfo {
        private final java.lang.String email;
        private final java.lang.String firstName;
        private final java.lang.String lastName;
        private final java.lang.String secondaryEmail;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.email = software.amazon.jsii.Kernel.get(this, "email", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.firstName = software.amazon.jsii.Kernel.get(this, "firstName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lastName = software.amazon.jsii.Kernel.get(this, "lastName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secondaryEmail = software.amazon.jsii.Kernel.get(this, "secondaryEmail", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.email = builder.email;
            this.firstName = builder.firstName;
            this.lastName = builder.lastName;
            this.secondaryEmail = builder.secondaryEmail;
        }

        @Override
        public final java.lang.String getEmail() {
            return this.email;
        }

        @Override
        public final java.lang.String getFirstName() {
            return this.firstName;
        }

        @Override
        public final java.lang.String getLastName() {
            return this.lastName;
        }

        @Override
        public final java.lang.String getSecondaryEmail() {
            return this.secondaryEmail;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEmail() != null) {
                data.set("email", om.valueToTree(this.getEmail()));
            }
            if (this.getFirstName() != null) {
                data.set("firstName", om.valueToTree(this.getFirstName()));
            }
            if (this.getLastName() != null) {
                data.set("lastName", om.valueToTree(this.getLastName()));
            }
            if (this.getSecondaryEmail() != null) {
                data.set("secondaryEmail", om.valueToTree(this.getSecondaryEmail()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.connectUser.ConnectUserIdentityInfo"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectUserIdentityInfo.Jsii$Proxy that = (ConnectUserIdentityInfo.Jsii$Proxy) o;

            if (this.email != null ? !this.email.equals(that.email) : that.email != null) return false;
            if (this.firstName != null ? !this.firstName.equals(that.firstName) : that.firstName != null) return false;
            if (this.lastName != null ? !this.lastName.equals(that.lastName) : that.lastName != null) return false;
            return this.secondaryEmail != null ? this.secondaryEmail.equals(that.secondaryEmail) : that.secondaryEmail == null;
        }

        @Override
        public final int hashCode() {
            int result = this.email != null ? this.email.hashCode() : 0;
            result = 31 * result + (this.firstName != null ? this.firstName.hashCode() : 0);
            result = 31 * result + (this.lastName != null ? this.lastName.hashCode() : 0);
            result = 31 * result + (this.secondaryEmail != null ? this.secondaryEmail.hashCode() : 0);
            return result;
        }
    }
}
