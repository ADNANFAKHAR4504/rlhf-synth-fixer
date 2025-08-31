package imports.aws.mq_broker;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.903Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mqBroker.MqBrokerLdapServerMetadata")
@software.amazon.jsii.Jsii.Proxy(MqBrokerLdapServerMetadata.Jsii$Proxy.class)
public interface MqBrokerLdapServerMetadata extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#hosts MqBroker#hosts}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHosts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#role_base MqBroker#role_base}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleBase() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#role_name MqBroker#role_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#role_search_matching MqBroker#role_search_matching}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleSearchMatching() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#role_search_subtree MqBroker#role_search_subtree}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRoleSearchSubtree() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#service_account_password MqBroker#service_account_password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceAccountPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#service_account_username MqBroker#service_account_username}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceAccountUsername() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#user_base MqBroker#user_base}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserBase() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#user_role_name MqBroker#user_role_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserRoleName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#user_search_matching MqBroker#user_search_matching}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUserSearchMatching() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#user_search_subtree MqBroker#user_search_subtree}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUserSearchSubtree() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MqBrokerLdapServerMetadata}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MqBrokerLdapServerMetadata}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MqBrokerLdapServerMetadata> {
        java.util.List<java.lang.String> hosts;
        java.lang.String roleBase;
        java.lang.String roleName;
        java.lang.String roleSearchMatching;
        java.lang.Object roleSearchSubtree;
        java.lang.String serviceAccountPassword;
        java.lang.String serviceAccountUsername;
        java.lang.String userBase;
        java.lang.String userRoleName;
        java.lang.String userSearchMatching;
        java.lang.Object userSearchSubtree;

        /**
         * Sets the value of {@link MqBrokerLdapServerMetadata#getHosts}
         * @param hosts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#hosts MqBroker#hosts}.
         * @return {@code this}
         */
        public Builder hosts(java.util.List<java.lang.String> hosts) {
            this.hosts = hosts;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerLdapServerMetadata#getRoleBase}
         * @param roleBase Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#role_base MqBroker#role_base}.
         * @return {@code this}
         */
        public Builder roleBase(java.lang.String roleBase) {
            this.roleBase = roleBase;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerLdapServerMetadata#getRoleName}
         * @param roleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#role_name MqBroker#role_name}.
         * @return {@code this}
         */
        public Builder roleName(java.lang.String roleName) {
            this.roleName = roleName;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerLdapServerMetadata#getRoleSearchMatching}
         * @param roleSearchMatching Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#role_search_matching MqBroker#role_search_matching}.
         * @return {@code this}
         */
        public Builder roleSearchMatching(java.lang.String roleSearchMatching) {
            this.roleSearchMatching = roleSearchMatching;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerLdapServerMetadata#getRoleSearchSubtree}
         * @param roleSearchSubtree Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#role_search_subtree MqBroker#role_search_subtree}.
         * @return {@code this}
         */
        public Builder roleSearchSubtree(java.lang.Boolean roleSearchSubtree) {
            this.roleSearchSubtree = roleSearchSubtree;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerLdapServerMetadata#getRoleSearchSubtree}
         * @param roleSearchSubtree Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#role_search_subtree MqBroker#role_search_subtree}.
         * @return {@code this}
         */
        public Builder roleSearchSubtree(com.hashicorp.cdktf.IResolvable roleSearchSubtree) {
            this.roleSearchSubtree = roleSearchSubtree;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerLdapServerMetadata#getServiceAccountPassword}
         * @param serviceAccountPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#service_account_password MqBroker#service_account_password}.
         * @return {@code this}
         */
        public Builder serviceAccountPassword(java.lang.String serviceAccountPassword) {
            this.serviceAccountPassword = serviceAccountPassword;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerLdapServerMetadata#getServiceAccountUsername}
         * @param serviceAccountUsername Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#service_account_username MqBroker#service_account_username}.
         * @return {@code this}
         */
        public Builder serviceAccountUsername(java.lang.String serviceAccountUsername) {
            this.serviceAccountUsername = serviceAccountUsername;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerLdapServerMetadata#getUserBase}
         * @param userBase Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#user_base MqBroker#user_base}.
         * @return {@code this}
         */
        public Builder userBase(java.lang.String userBase) {
            this.userBase = userBase;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerLdapServerMetadata#getUserRoleName}
         * @param userRoleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#user_role_name MqBroker#user_role_name}.
         * @return {@code this}
         */
        public Builder userRoleName(java.lang.String userRoleName) {
            this.userRoleName = userRoleName;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerLdapServerMetadata#getUserSearchMatching}
         * @param userSearchMatching Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#user_search_matching MqBroker#user_search_matching}.
         * @return {@code this}
         */
        public Builder userSearchMatching(java.lang.String userSearchMatching) {
            this.userSearchMatching = userSearchMatching;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerLdapServerMetadata#getUserSearchSubtree}
         * @param userSearchSubtree Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#user_search_subtree MqBroker#user_search_subtree}.
         * @return {@code this}
         */
        public Builder userSearchSubtree(java.lang.Boolean userSearchSubtree) {
            this.userSearchSubtree = userSearchSubtree;
            return this;
        }

        /**
         * Sets the value of {@link MqBrokerLdapServerMetadata#getUserSearchSubtree}
         * @param userSearchSubtree Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mq_broker#user_search_subtree MqBroker#user_search_subtree}.
         * @return {@code this}
         */
        public Builder userSearchSubtree(com.hashicorp.cdktf.IResolvable userSearchSubtree) {
            this.userSearchSubtree = userSearchSubtree;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MqBrokerLdapServerMetadata}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MqBrokerLdapServerMetadata build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MqBrokerLdapServerMetadata}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MqBrokerLdapServerMetadata {
        private final java.util.List<java.lang.String> hosts;
        private final java.lang.String roleBase;
        private final java.lang.String roleName;
        private final java.lang.String roleSearchMatching;
        private final java.lang.Object roleSearchSubtree;
        private final java.lang.String serviceAccountPassword;
        private final java.lang.String serviceAccountUsername;
        private final java.lang.String userBase;
        private final java.lang.String userRoleName;
        private final java.lang.String userSearchMatching;
        private final java.lang.Object userSearchSubtree;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.hosts = software.amazon.jsii.Kernel.get(this, "hosts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.roleBase = software.amazon.jsii.Kernel.get(this, "roleBase", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleName = software.amazon.jsii.Kernel.get(this, "roleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleSearchMatching = software.amazon.jsii.Kernel.get(this, "roleSearchMatching", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleSearchSubtree = software.amazon.jsii.Kernel.get(this, "roleSearchSubtree", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.serviceAccountPassword = software.amazon.jsii.Kernel.get(this, "serviceAccountPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceAccountUsername = software.amazon.jsii.Kernel.get(this, "serviceAccountUsername", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userBase = software.amazon.jsii.Kernel.get(this, "userBase", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userRoleName = software.amazon.jsii.Kernel.get(this, "userRoleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userSearchMatching = software.amazon.jsii.Kernel.get(this, "userSearchMatching", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userSearchSubtree = software.amazon.jsii.Kernel.get(this, "userSearchSubtree", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.hosts = builder.hosts;
            this.roleBase = builder.roleBase;
            this.roleName = builder.roleName;
            this.roleSearchMatching = builder.roleSearchMatching;
            this.roleSearchSubtree = builder.roleSearchSubtree;
            this.serviceAccountPassword = builder.serviceAccountPassword;
            this.serviceAccountUsername = builder.serviceAccountUsername;
            this.userBase = builder.userBase;
            this.userRoleName = builder.userRoleName;
            this.userSearchMatching = builder.userSearchMatching;
            this.userSearchSubtree = builder.userSearchSubtree;
        }

        @Override
        public final java.util.List<java.lang.String> getHosts() {
            return this.hosts;
        }

        @Override
        public final java.lang.String getRoleBase() {
            return this.roleBase;
        }

        @Override
        public final java.lang.String getRoleName() {
            return this.roleName;
        }

        @Override
        public final java.lang.String getRoleSearchMatching() {
            return this.roleSearchMatching;
        }

        @Override
        public final java.lang.Object getRoleSearchSubtree() {
            return this.roleSearchSubtree;
        }

        @Override
        public final java.lang.String getServiceAccountPassword() {
            return this.serviceAccountPassword;
        }

        @Override
        public final java.lang.String getServiceAccountUsername() {
            return this.serviceAccountUsername;
        }

        @Override
        public final java.lang.String getUserBase() {
            return this.userBase;
        }

        @Override
        public final java.lang.String getUserRoleName() {
            return this.userRoleName;
        }

        @Override
        public final java.lang.String getUserSearchMatching() {
            return this.userSearchMatching;
        }

        @Override
        public final java.lang.Object getUserSearchSubtree() {
            return this.userSearchSubtree;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHosts() != null) {
                data.set("hosts", om.valueToTree(this.getHosts()));
            }
            if (this.getRoleBase() != null) {
                data.set("roleBase", om.valueToTree(this.getRoleBase()));
            }
            if (this.getRoleName() != null) {
                data.set("roleName", om.valueToTree(this.getRoleName()));
            }
            if (this.getRoleSearchMatching() != null) {
                data.set("roleSearchMatching", om.valueToTree(this.getRoleSearchMatching()));
            }
            if (this.getRoleSearchSubtree() != null) {
                data.set("roleSearchSubtree", om.valueToTree(this.getRoleSearchSubtree()));
            }
            if (this.getServiceAccountPassword() != null) {
                data.set("serviceAccountPassword", om.valueToTree(this.getServiceAccountPassword()));
            }
            if (this.getServiceAccountUsername() != null) {
                data.set("serviceAccountUsername", om.valueToTree(this.getServiceAccountUsername()));
            }
            if (this.getUserBase() != null) {
                data.set("userBase", om.valueToTree(this.getUserBase()));
            }
            if (this.getUserRoleName() != null) {
                data.set("userRoleName", om.valueToTree(this.getUserRoleName()));
            }
            if (this.getUserSearchMatching() != null) {
                data.set("userSearchMatching", om.valueToTree(this.getUserSearchMatching()));
            }
            if (this.getUserSearchSubtree() != null) {
                data.set("userSearchSubtree", om.valueToTree(this.getUserSearchSubtree()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mqBroker.MqBrokerLdapServerMetadata"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MqBrokerLdapServerMetadata.Jsii$Proxy that = (MqBrokerLdapServerMetadata.Jsii$Proxy) o;

            if (this.hosts != null ? !this.hosts.equals(that.hosts) : that.hosts != null) return false;
            if (this.roleBase != null ? !this.roleBase.equals(that.roleBase) : that.roleBase != null) return false;
            if (this.roleName != null ? !this.roleName.equals(that.roleName) : that.roleName != null) return false;
            if (this.roleSearchMatching != null ? !this.roleSearchMatching.equals(that.roleSearchMatching) : that.roleSearchMatching != null) return false;
            if (this.roleSearchSubtree != null ? !this.roleSearchSubtree.equals(that.roleSearchSubtree) : that.roleSearchSubtree != null) return false;
            if (this.serviceAccountPassword != null ? !this.serviceAccountPassword.equals(that.serviceAccountPassword) : that.serviceAccountPassword != null) return false;
            if (this.serviceAccountUsername != null ? !this.serviceAccountUsername.equals(that.serviceAccountUsername) : that.serviceAccountUsername != null) return false;
            if (this.userBase != null ? !this.userBase.equals(that.userBase) : that.userBase != null) return false;
            if (this.userRoleName != null ? !this.userRoleName.equals(that.userRoleName) : that.userRoleName != null) return false;
            if (this.userSearchMatching != null ? !this.userSearchMatching.equals(that.userSearchMatching) : that.userSearchMatching != null) return false;
            return this.userSearchSubtree != null ? this.userSearchSubtree.equals(that.userSearchSubtree) : that.userSearchSubtree == null;
        }

        @Override
        public final int hashCode() {
            int result = this.hosts != null ? this.hosts.hashCode() : 0;
            result = 31 * result + (this.roleBase != null ? this.roleBase.hashCode() : 0);
            result = 31 * result + (this.roleName != null ? this.roleName.hashCode() : 0);
            result = 31 * result + (this.roleSearchMatching != null ? this.roleSearchMatching.hashCode() : 0);
            result = 31 * result + (this.roleSearchSubtree != null ? this.roleSearchSubtree.hashCode() : 0);
            result = 31 * result + (this.serviceAccountPassword != null ? this.serviceAccountPassword.hashCode() : 0);
            result = 31 * result + (this.serviceAccountUsername != null ? this.serviceAccountUsername.hashCode() : 0);
            result = 31 * result + (this.userBase != null ? this.userBase.hashCode() : 0);
            result = 31 * result + (this.userRoleName != null ? this.userRoleName.hashCode() : 0);
            result = 31 * result + (this.userSearchMatching != null ? this.userSearchMatching.hashCode() : 0);
            result = 31 * result + (this.userSearchSubtree != null ? this.userSearchSubtree.hashCode() : 0);
            return result;
        }
    }
}
