package imports.aws.quicksight_account_subscription;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.096Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightAccountSubscription.QuicksightAccountSubscriptionConfig")
@software.amazon.jsii.Jsii.Proxy(QuicksightAccountSubscriptionConfig.Jsii$Proxy.class)
public interface QuicksightAccountSubscriptionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#account_name QuicksightAccountSubscription#account_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAccountName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#authentication_method QuicksightAccountSubscription#authentication_method}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthenticationMethod();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#edition QuicksightAccountSubscription#edition}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEdition();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#notification_email QuicksightAccountSubscription#notification_email}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNotificationEmail();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#active_directory_name QuicksightAccountSubscription#active_directory_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getActiveDirectoryName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#admin_group QuicksightAccountSubscription#admin_group}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAdminGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#author_group QuicksightAccountSubscription#author_group}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAuthorGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#aws_account_id QuicksightAccountSubscription#aws_account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAwsAccountId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#contact_number QuicksightAccountSubscription#contact_number}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContactNumber() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#directory_id QuicksightAccountSubscription#directory_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDirectoryId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#email_address QuicksightAccountSubscription#email_address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEmailAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#first_name QuicksightAccountSubscription#first_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFirstName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#iam_identity_center_instance_arn QuicksightAccountSubscription#iam_identity_center_instance_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIamIdentityCenterInstanceArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#id QuicksightAccountSubscription#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#last_name QuicksightAccountSubscription#last_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLastName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#reader_group QuicksightAccountSubscription#reader_group}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getReaderGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#realm QuicksightAccountSubscription#realm}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRealm() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#timeouts QuicksightAccountSubscription#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_account_subscription.QuicksightAccountSubscriptionTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightAccountSubscriptionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightAccountSubscriptionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightAccountSubscriptionConfig> {
        java.lang.String accountName;
        java.lang.String authenticationMethod;
        java.lang.String edition;
        java.lang.String notificationEmail;
        java.lang.String activeDirectoryName;
        java.util.List<java.lang.String> adminGroup;
        java.util.List<java.lang.String> authorGroup;
        java.lang.String awsAccountId;
        java.lang.String contactNumber;
        java.lang.String directoryId;
        java.lang.String emailAddress;
        java.lang.String firstName;
        java.lang.String iamIdentityCenterInstanceArn;
        java.lang.String id;
        java.lang.String lastName;
        java.util.List<java.lang.String> readerGroup;
        java.lang.String realm;
        imports.aws.quicksight_account_subscription.QuicksightAccountSubscriptionTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getAccountName}
         * @param accountName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#account_name QuicksightAccountSubscription#account_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder accountName(java.lang.String accountName) {
            this.accountName = accountName;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getAuthenticationMethod}
         * @param authenticationMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#authentication_method QuicksightAccountSubscription#authentication_method}. This parameter is required.
         * @return {@code this}
         */
        public Builder authenticationMethod(java.lang.String authenticationMethod) {
            this.authenticationMethod = authenticationMethod;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getEdition}
         * @param edition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#edition QuicksightAccountSubscription#edition}. This parameter is required.
         * @return {@code this}
         */
        public Builder edition(java.lang.String edition) {
            this.edition = edition;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getNotificationEmail}
         * @param notificationEmail Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#notification_email QuicksightAccountSubscription#notification_email}. This parameter is required.
         * @return {@code this}
         */
        public Builder notificationEmail(java.lang.String notificationEmail) {
            this.notificationEmail = notificationEmail;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getActiveDirectoryName}
         * @param activeDirectoryName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#active_directory_name QuicksightAccountSubscription#active_directory_name}.
         * @return {@code this}
         */
        public Builder activeDirectoryName(java.lang.String activeDirectoryName) {
            this.activeDirectoryName = activeDirectoryName;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getAdminGroup}
         * @param adminGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#admin_group QuicksightAccountSubscription#admin_group}.
         * @return {@code this}
         */
        public Builder adminGroup(java.util.List<java.lang.String> adminGroup) {
            this.adminGroup = adminGroup;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getAuthorGroup}
         * @param authorGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#author_group QuicksightAccountSubscription#author_group}.
         * @return {@code this}
         */
        public Builder authorGroup(java.util.List<java.lang.String> authorGroup) {
            this.authorGroup = authorGroup;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getAwsAccountId}
         * @param awsAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#aws_account_id QuicksightAccountSubscription#aws_account_id}.
         * @return {@code this}
         */
        public Builder awsAccountId(java.lang.String awsAccountId) {
            this.awsAccountId = awsAccountId;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getContactNumber}
         * @param contactNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#contact_number QuicksightAccountSubscription#contact_number}.
         * @return {@code this}
         */
        public Builder contactNumber(java.lang.String contactNumber) {
            this.contactNumber = contactNumber;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getDirectoryId}
         * @param directoryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#directory_id QuicksightAccountSubscription#directory_id}.
         * @return {@code this}
         */
        public Builder directoryId(java.lang.String directoryId) {
            this.directoryId = directoryId;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getEmailAddress}
         * @param emailAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#email_address QuicksightAccountSubscription#email_address}.
         * @return {@code this}
         */
        public Builder emailAddress(java.lang.String emailAddress) {
            this.emailAddress = emailAddress;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getFirstName}
         * @param firstName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#first_name QuicksightAccountSubscription#first_name}.
         * @return {@code this}
         */
        public Builder firstName(java.lang.String firstName) {
            this.firstName = firstName;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getIamIdentityCenterInstanceArn}
         * @param iamIdentityCenterInstanceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#iam_identity_center_instance_arn QuicksightAccountSubscription#iam_identity_center_instance_arn}.
         * @return {@code this}
         */
        public Builder iamIdentityCenterInstanceArn(java.lang.String iamIdentityCenterInstanceArn) {
            this.iamIdentityCenterInstanceArn = iamIdentityCenterInstanceArn;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#id QuicksightAccountSubscription#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getLastName}
         * @param lastName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#last_name QuicksightAccountSubscription#last_name}.
         * @return {@code this}
         */
        public Builder lastName(java.lang.String lastName) {
            this.lastName = lastName;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getReaderGroup}
         * @param readerGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#reader_group QuicksightAccountSubscription#reader_group}.
         * @return {@code this}
         */
        public Builder readerGroup(java.util.List<java.lang.String> readerGroup) {
            this.readerGroup = readerGroup;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getRealm}
         * @param realm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#realm QuicksightAccountSubscription#realm}.
         * @return {@code this}
         */
        public Builder realm(java.lang.String realm) {
            this.realm = realm;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_account_subscription#timeouts QuicksightAccountSubscription#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.quicksight_account_subscription.QuicksightAccountSubscriptionTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getDependsOn}
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
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightAccountSubscriptionConfig#getProvisioners}
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
         * @return a new instance of {@link QuicksightAccountSubscriptionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightAccountSubscriptionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightAccountSubscriptionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightAccountSubscriptionConfig {
        private final java.lang.String accountName;
        private final java.lang.String authenticationMethod;
        private final java.lang.String edition;
        private final java.lang.String notificationEmail;
        private final java.lang.String activeDirectoryName;
        private final java.util.List<java.lang.String> adminGroup;
        private final java.util.List<java.lang.String> authorGroup;
        private final java.lang.String awsAccountId;
        private final java.lang.String contactNumber;
        private final java.lang.String directoryId;
        private final java.lang.String emailAddress;
        private final java.lang.String firstName;
        private final java.lang.String iamIdentityCenterInstanceArn;
        private final java.lang.String id;
        private final java.lang.String lastName;
        private final java.util.List<java.lang.String> readerGroup;
        private final java.lang.String realm;
        private final imports.aws.quicksight_account_subscription.QuicksightAccountSubscriptionTimeouts timeouts;
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
            this.accountName = software.amazon.jsii.Kernel.get(this, "accountName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authenticationMethod = software.amazon.jsii.Kernel.get(this, "authenticationMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.edition = software.amazon.jsii.Kernel.get(this, "edition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.notificationEmail = software.amazon.jsii.Kernel.get(this, "notificationEmail", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.activeDirectoryName = software.amazon.jsii.Kernel.get(this, "activeDirectoryName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.adminGroup = software.amazon.jsii.Kernel.get(this, "adminGroup", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.authorGroup = software.amazon.jsii.Kernel.get(this, "authorGroup", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.awsAccountId = software.amazon.jsii.Kernel.get(this, "awsAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contactNumber = software.amazon.jsii.Kernel.get(this, "contactNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.directoryId = software.amazon.jsii.Kernel.get(this, "directoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.emailAddress = software.amazon.jsii.Kernel.get(this, "emailAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.firstName = software.amazon.jsii.Kernel.get(this, "firstName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.iamIdentityCenterInstanceArn = software.amazon.jsii.Kernel.get(this, "iamIdentityCenterInstanceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lastName = software.amazon.jsii.Kernel.get(this, "lastName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.readerGroup = software.amazon.jsii.Kernel.get(this, "readerGroup", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.realm = software.amazon.jsii.Kernel.get(this, "realm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_account_subscription.QuicksightAccountSubscriptionTimeouts.class));
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
            this.accountName = java.util.Objects.requireNonNull(builder.accountName, "accountName is required");
            this.authenticationMethod = java.util.Objects.requireNonNull(builder.authenticationMethod, "authenticationMethod is required");
            this.edition = java.util.Objects.requireNonNull(builder.edition, "edition is required");
            this.notificationEmail = java.util.Objects.requireNonNull(builder.notificationEmail, "notificationEmail is required");
            this.activeDirectoryName = builder.activeDirectoryName;
            this.adminGroup = builder.adminGroup;
            this.authorGroup = builder.authorGroup;
            this.awsAccountId = builder.awsAccountId;
            this.contactNumber = builder.contactNumber;
            this.directoryId = builder.directoryId;
            this.emailAddress = builder.emailAddress;
            this.firstName = builder.firstName;
            this.iamIdentityCenterInstanceArn = builder.iamIdentityCenterInstanceArn;
            this.id = builder.id;
            this.lastName = builder.lastName;
            this.readerGroup = builder.readerGroup;
            this.realm = builder.realm;
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
        public final java.lang.String getAccountName() {
            return this.accountName;
        }

        @Override
        public final java.lang.String getAuthenticationMethod() {
            return this.authenticationMethod;
        }

        @Override
        public final java.lang.String getEdition() {
            return this.edition;
        }

        @Override
        public final java.lang.String getNotificationEmail() {
            return this.notificationEmail;
        }

        @Override
        public final java.lang.String getActiveDirectoryName() {
            return this.activeDirectoryName;
        }

        @Override
        public final java.util.List<java.lang.String> getAdminGroup() {
            return this.adminGroup;
        }

        @Override
        public final java.util.List<java.lang.String> getAuthorGroup() {
            return this.authorGroup;
        }

        @Override
        public final java.lang.String getAwsAccountId() {
            return this.awsAccountId;
        }

        @Override
        public final java.lang.String getContactNumber() {
            return this.contactNumber;
        }

        @Override
        public final java.lang.String getDirectoryId() {
            return this.directoryId;
        }

        @Override
        public final java.lang.String getEmailAddress() {
            return this.emailAddress;
        }

        @Override
        public final java.lang.String getFirstName() {
            return this.firstName;
        }

        @Override
        public final java.lang.String getIamIdentityCenterInstanceArn() {
            return this.iamIdentityCenterInstanceArn;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getLastName() {
            return this.lastName;
        }

        @Override
        public final java.util.List<java.lang.String> getReaderGroup() {
            return this.readerGroup;
        }

        @Override
        public final java.lang.String getRealm() {
            return this.realm;
        }

        @Override
        public final imports.aws.quicksight_account_subscription.QuicksightAccountSubscriptionTimeouts getTimeouts() {
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

            data.set("accountName", om.valueToTree(this.getAccountName()));
            data.set("authenticationMethod", om.valueToTree(this.getAuthenticationMethod()));
            data.set("edition", om.valueToTree(this.getEdition()));
            data.set("notificationEmail", om.valueToTree(this.getNotificationEmail()));
            if (this.getActiveDirectoryName() != null) {
                data.set("activeDirectoryName", om.valueToTree(this.getActiveDirectoryName()));
            }
            if (this.getAdminGroup() != null) {
                data.set("adminGroup", om.valueToTree(this.getAdminGroup()));
            }
            if (this.getAuthorGroup() != null) {
                data.set("authorGroup", om.valueToTree(this.getAuthorGroup()));
            }
            if (this.getAwsAccountId() != null) {
                data.set("awsAccountId", om.valueToTree(this.getAwsAccountId()));
            }
            if (this.getContactNumber() != null) {
                data.set("contactNumber", om.valueToTree(this.getContactNumber()));
            }
            if (this.getDirectoryId() != null) {
                data.set("directoryId", om.valueToTree(this.getDirectoryId()));
            }
            if (this.getEmailAddress() != null) {
                data.set("emailAddress", om.valueToTree(this.getEmailAddress()));
            }
            if (this.getFirstName() != null) {
                data.set("firstName", om.valueToTree(this.getFirstName()));
            }
            if (this.getIamIdentityCenterInstanceArn() != null) {
                data.set("iamIdentityCenterInstanceArn", om.valueToTree(this.getIamIdentityCenterInstanceArn()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLastName() != null) {
                data.set("lastName", om.valueToTree(this.getLastName()));
            }
            if (this.getReaderGroup() != null) {
                data.set("readerGroup", om.valueToTree(this.getReaderGroup()));
            }
            if (this.getRealm() != null) {
                data.set("realm", om.valueToTree(this.getRealm()));
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
            struct.set("fqn", om.valueToTree("aws.quicksightAccountSubscription.QuicksightAccountSubscriptionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightAccountSubscriptionConfig.Jsii$Proxy that = (QuicksightAccountSubscriptionConfig.Jsii$Proxy) o;

            if (!accountName.equals(that.accountName)) return false;
            if (!authenticationMethod.equals(that.authenticationMethod)) return false;
            if (!edition.equals(that.edition)) return false;
            if (!notificationEmail.equals(that.notificationEmail)) return false;
            if (this.activeDirectoryName != null ? !this.activeDirectoryName.equals(that.activeDirectoryName) : that.activeDirectoryName != null) return false;
            if (this.adminGroup != null ? !this.adminGroup.equals(that.adminGroup) : that.adminGroup != null) return false;
            if (this.authorGroup != null ? !this.authorGroup.equals(that.authorGroup) : that.authorGroup != null) return false;
            if (this.awsAccountId != null ? !this.awsAccountId.equals(that.awsAccountId) : that.awsAccountId != null) return false;
            if (this.contactNumber != null ? !this.contactNumber.equals(that.contactNumber) : that.contactNumber != null) return false;
            if (this.directoryId != null ? !this.directoryId.equals(that.directoryId) : that.directoryId != null) return false;
            if (this.emailAddress != null ? !this.emailAddress.equals(that.emailAddress) : that.emailAddress != null) return false;
            if (this.firstName != null ? !this.firstName.equals(that.firstName) : that.firstName != null) return false;
            if (this.iamIdentityCenterInstanceArn != null ? !this.iamIdentityCenterInstanceArn.equals(that.iamIdentityCenterInstanceArn) : that.iamIdentityCenterInstanceArn != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.lastName != null ? !this.lastName.equals(that.lastName) : that.lastName != null) return false;
            if (this.readerGroup != null ? !this.readerGroup.equals(that.readerGroup) : that.readerGroup != null) return false;
            if (this.realm != null ? !this.realm.equals(that.realm) : that.realm != null) return false;
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
            int result = this.accountName.hashCode();
            result = 31 * result + (this.authenticationMethod.hashCode());
            result = 31 * result + (this.edition.hashCode());
            result = 31 * result + (this.notificationEmail.hashCode());
            result = 31 * result + (this.activeDirectoryName != null ? this.activeDirectoryName.hashCode() : 0);
            result = 31 * result + (this.adminGroup != null ? this.adminGroup.hashCode() : 0);
            result = 31 * result + (this.authorGroup != null ? this.authorGroup.hashCode() : 0);
            result = 31 * result + (this.awsAccountId != null ? this.awsAccountId.hashCode() : 0);
            result = 31 * result + (this.contactNumber != null ? this.contactNumber.hashCode() : 0);
            result = 31 * result + (this.directoryId != null ? this.directoryId.hashCode() : 0);
            result = 31 * result + (this.emailAddress != null ? this.emailAddress.hashCode() : 0);
            result = 31 * result + (this.firstName != null ? this.firstName.hashCode() : 0);
            result = 31 * result + (this.iamIdentityCenterInstanceArn != null ? this.iamIdentityCenterInstanceArn.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.lastName != null ? this.lastName.hashCode() : 0);
            result = 31 * result + (this.readerGroup != null ? this.readerGroup.hashCode() : 0);
            result = 31 * result + (this.realm != null ? this.realm.hashCode() : 0);
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
