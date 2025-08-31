package imports.aws.mq_broker;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.903Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mqBroker.MqBrokerUser")
@software.amazon.jsii.Jsii.Proxy(MqBrokerUser.Jsii$Proxy.class)
public interface MqBrokerUser extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#password MqBroker#password}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPassword();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#username MqBroker#username}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUsername();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#console_access MqBroker#console_access}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConsoleAccess() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#groups MqBroker#groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#replication_user MqBroker#replication_user}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReplicationUser() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MqBrokerUser}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MqBrokerUser}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MqBrokerUser> {
        java.lang.String password;
        java.lang.String username;
        java.lang.Object consoleAccess;
        java.util.List<java.lang.String> groups;
        java.lang.Object replicationUser;

        /**
         * Sets the value of {@link MqBrokerUser#getPassword}
         * @param password Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#password MqBroker#password}. This parameter is required.
         * @return {@code this}
         */
        public Builder password(java.lang.String password) {
            this.password = password;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerUser#getUsername}
         * @param username Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#username MqBroker#username}. This parameter is required.
         * @return {@code this}
         */
        public Builder username(java.lang.String username) {
            this.username = username;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerUser#getConsoleAccess}
         * @param consoleAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#console_access MqBroker#console_access}.
         * @return {@code this}
         */
        public Builder consoleAccess(java.lang.Boolean consoleAccess) {
            this.consoleAccess = consoleAccess;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerUser#getConsoleAccess}
         * @param consoleAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#console_access MqBroker#console_access}.
         * @return {@code this}
         */
        public Builder consoleAccess(com.hashicorp.cdktf.IResolvable consoleAccess) {
            this.consoleAccess = consoleAccess;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerUser#getGroups}
         * @param groups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#groups MqBroker#groups}.
         * @return {@code this}
         */
        public Builder groups(java.util.List<java.lang.String> groups) {
            this.groups = groups;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerUser#getReplicationUser}
         * @param replicationUser Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#replication_user MqBroker#replication_user}.
         * @return {@code this}
         */
        public Builder replicationUser(java.lang.Boolean replicationUser) {
            this.replicationUser = replicationUser;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerUser#getReplicationUser}
         * @param replicationUser Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#replication_user MqBroker#replication_user}.
         * @return {@code this}
         */
        public Builder replicationUser(com.hashicorp.cdktf.IResolvable replicationUser) {
            this.replicationUser = replicationUser;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MqBrokerUser}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MqBrokerUser build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MqBrokerUser}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MqBrokerUser {
        private final java.lang.String password;
        private final java.lang.String username;
        private final java.lang.Object consoleAccess;
        private final java.util.List<java.lang.String> groups;
        private final java.lang.Object replicationUser;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.password = software.amazon.jsii.Kernel.get(this, "password", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.username = software.amazon.jsii.Kernel.get(this, "username", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.consoleAccess = software.amazon.jsii.Kernel.get(this, "consoleAccess", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.groups = software.amazon.jsii.Kernel.get(this, "groups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.replicationUser = software.amazon.jsii.Kernel.get(this, "replicationUser", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.password = java.util.Objects.requireNonNull(builder.password, "password is required");
            this.username = java.util.Objects.requireNonNull(builder.username, "username is required");
            this.consoleAccess = builder.consoleAccess;
            this.groups = builder.groups;
            this.replicationUser = builder.replicationUser;
        }

        @Override
        public final java.lang.String getPassword() {
            return this.password;
        }

        @Override
        public final java.lang.String getUsername() {
            return this.username;
        }

        @Override
        public final java.lang.Object getConsoleAccess() {
            return this.consoleAccess;
        }

        @Override
        public final java.util.List<java.lang.String> getGroups() {
            return this.groups;
        }

        @Override
        public final java.lang.Object getReplicationUser() {
            return this.replicationUser;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("password", om.valueToTree(this.getPassword()));
            data.set("username", om.valueToTree(this.getUsername()));
            if (this.getConsoleAccess() != null) {
                data.set("consoleAccess", om.valueToTree(this.getConsoleAccess()));
            }
            if (this.getGroups() != null) {
                data.set("groups", om.valueToTree(this.getGroups()));
            }
            if (this.getReplicationUser() != null) {
                data.set("replicationUser", om.valueToTree(this.getReplicationUser()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mqBroker.MqBrokerUser"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MqBrokerUser.Jsii$Proxy that = (MqBrokerUser.Jsii$Proxy) o;

            if (!password.equals(that.password)) return false;
            if (!username.equals(that.username)) return false;
            if (this.consoleAccess != null ? !this.consoleAccess.equals(that.consoleAccess) : that.consoleAccess != null) return false;
            if (this.groups != null ? !this.groups.equals(that.groups) : that.groups != null) return false;
            return this.replicationUser != null ? this.replicationUser.equals(that.replicationUser) : that.replicationUser == null;
        }

        @Override
        public final int hashCode() {
            int result = this.password.hashCode();
            result = 31 * result + (this.username.hashCode());
            result = 31 * result + (this.consoleAccess != null ? this.consoleAccess.hashCode() : 0);
            result = 31 * result + (this.groups != null ? this.groups.hashCode() : 0);
            result = 31 * result + (this.replicationUser != null ? this.replicationUser.hashCode() : 0);
            return result;
        }
    }
}
