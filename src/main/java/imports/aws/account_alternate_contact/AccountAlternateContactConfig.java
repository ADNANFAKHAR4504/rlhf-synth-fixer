package imports.aws.account_alternate_contact;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.887Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.accountAlternateContact.AccountAlternateContactConfig")
@software.amazon.jsii.Jsii.Proxy(AccountAlternateContactConfig.Jsii$Proxy.class)
public interface AccountAlternateContactConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_alternate_contact#alternate_contact_type AccountAlternateContact#alternate_contact_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAlternateContactType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_alternate_contact#email_address AccountAlternateContact#email_address}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEmailAddress();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_alternate_contact#name AccountAlternateContact#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_alternate_contact#phone_number AccountAlternateContact#phone_number}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPhoneNumber();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_alternate_contact#title AccountAlternateContact#title}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTitle();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_alternate_contact#account_id AccountAlternateContact#account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_alternate_contact#id AccountAlternateContact#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_alternate_contact#timeouts AccountAlternateContact#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.account_alternate_contact.AccountAlternateContactTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AccountAlternateContactConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AccountAlternateContactConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AccountAlternateContactConfig> {
        java.lang.String alternateContactType;
        java.lang.String emailAddress;
        java.lang.String name;
        java.lang.String phoneNumber;
        java.lang.String title;
        java.lang.String accountId;
        java.lang.String id;
        imports.aws.account_alternate_contact.AccountAlternateContactTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getAlternateContactType}
         * @param alternateContactType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_alternate_contact#alternate_contact_type AccountAlternateContact#alternate_contact_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder alternateContactType(java.lang.String alternateContactType) {
            this.alternateContactType = alternateContactType;
            return this;
        }

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getEmailAddress}
         * @param emailAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_alternate_contact#email_address AccountAlternateContact#email_address}. This parameter is required.
         * @return {@code this}
         */
        public Builder emailAddress(java.lang.String emailAddress) {
            this.emailAddress = emailAddress;
            return this;
        }

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_alternate_contact#name AccountAlternateContact#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getPhoneNumber}
         * @param phoneNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_alternate_contact#phone_number AccountAlternateContact#phone_number}. This parameter is required.
         * @return {@code this}
         */
        public Builder phoneNumber(java.lang.String phoneNumber) {
            this.phoneNumber = phoneNumber;
            return this;
        }

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getTitle}
         * @param title Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_alternate_contact#title AccountAlternateContact#title}. This parameter is required.
         * @return {@code this}
         */
        public Builder title(java.lang.String title) {
            this.title = title;
            return this;
        }

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getAccountId}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_alternate_contact#account_id AccountAlternateContact#account_id}.
         * @return {@code this}
         */
        public Builder accountId(java.lang.String accountId) {
            this.accountId = accountId;
            return this;
        }

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_alternate_contact#id AccountAlternateContact#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/account_alternate_contact#timeouts AccountAlternateContact#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.account_alternate_contact.AccountAlternateContactTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AccountAlternateContactConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AccountAlternateContactConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AccountAlternateContactConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AccountAlternateContactConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AccountAlternateContactConfig {
        private final java.lang.String alternateContactType;
        private final java.lang.String emailAddress;
        private final java.lang.String name;
        private final java.lang.String phoneNumber;
        private final java.lang.String title;
        private final java.lang.String accountId;
        private final java.lang.String id;
        private final imports.aws.account_alternate_contact.AccountAlternateContactTimeouts timeouts;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.alternateContactType = software.amazon.jsii.Kernel.get(this, "alternateContactType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.emailAddress = software.amazon.jsii.Kernel.get(this, "emailAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.phoneNumber = software.amazon.jsii.Kernel.get(this, "phoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.title = software.amazon.jsii.Kernel.get(this, "title", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accountId = software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.account_alternate_contact.AccountAlternateContactTimeouts.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.alternateContactType = java.util.Objects.requireNonNull(builder.alternateContactType, "alternateContactType is required");
            this.emailAddress = java.util.Objects.requireNonNull(builder.emailAddress, "emailAddress is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.phoneNumber = java.util.Objects.requireNonNull(builder.phoneNumber, "phoneNumber is required");
            this.title = java.util.Objects.requireNonNull(builder.title, "title is required");
            this.accountId = builder.accountId;
            this.id = builder.id;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAlternateContactType() {
            return this.alternateContactType;
        }

        @Override
        public final java.lang.String getEmailAddress() {
            return this.emailAddress;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getPhoneNumber() {
            return this.phoneNumber;
        }

        @Override
        public final java.lang.String getTitle() {
            return this.title;
        }

        @Override
        public final java.lang.String getAccountId() {
            return this.accountId;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.account_alternate_contact.AccountAlternateContactTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("alternateContactType", om.valueToTree(this.getAlternateContactType()));
            data.set("emailAddress", om.valueToTree(this.getEmailAddress()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("phoneNumber", om.valueToTree(this.getPhoneNumber()));
            data.set("title", om.valueToTree(this.getTitle()));
            if (this.getAccountId() != null) {
                data.set("accountId", om.valueToTree(this.getAccountId()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.accountAlternateContact.AccountAlternateContactConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AccountAlternateContactConfig.Jsii$Proxy that = (AccountAlternateContactConfig.Jsii$Proxy) o;

            if (!alternateContactType.equals(that.alternateContactType)) return false;
            if (!emailAddress.equals(that.emailAddress)) return false;
            if (!name.equals(that.name)) return false;
            if (!phoneNumber.equals(that.phoneNumber)) return false;
            if (!title.equals(that.title)) return false;
            if (this.accountId != null ? !this.accountId.equals(that.accountId) : that.accountId != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.alternateContactType.hashCode();
            result = 31 * result + (this.emailAddress.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.phoneNumber.hashCode());
            result = 31 * result + (this.title.hashCode());
            result = 31 * result + (this.accountId != null ? this.accountId.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
