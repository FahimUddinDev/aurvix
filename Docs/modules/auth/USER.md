# Auth & RBAC — User Guide

## Getting Started

To access the Aurevix Hospital Management System, you must have an active staff user account. If you
do not have credentials, please contact your hospital administrator.

## Step-by-Step Instructions

### Logging In

1. Open your browser and navigate to the application URL (e.g. `http://localhost:3000/en/login`).
2. Enter your email and password.
3. Click **Sign In**.
4. If Multi-Factor Authentication is enabled, you will be prompted to enter a 6-digit verification
   code. Open your authenticator app (e.g., Google Authenticator) on your phone and copy the current
   code for your Aurevix account.

### Setting Up Multi-Factor Authentication (MFA)

1. Log in to the application and navigate to **Settings** &rarr; **Security** in the sidebar.
2. Click **Enable MFA**.
3. A QR code and a secret key will be displayed.
4. Open your authenticator app on your smartphone, select "Add Account", and scan the QR code.
5. Once scanned, the app will generate a 6-digit code that changes every 30 seconds.
6. Enter the current 6-digit code on the Aurevix screen and click **Verify and Enable**.

### Resetting a Forgotten Password

1. On the login screen, click **Forgot password?**.
2. Enter your registered email address and click **Send Reset Link**.
3. Check your email for a reset link. Click the link to open the reset password page.
4. Enter your new password and confirm it, then click **Reset Password**.
5. Once reset, you will be redirected to the login page to sign in with your new password.

## Troubleshooting / FAQ

#### Why is my account locked?

If you enter an incorrect password 5 times in a row, your account will be locked for 15 minutes as a
security precaution. Please wait for the cooldown timer to expire before trying again.

#### What if I lose my MFA device?

If you lose your MFA-enabled smartphone, contact your hospital's Super Admin. They can temporarily
disable MFA on your account through the User Management panel so you can log back in and re-setup
your device.

## Bengali Translation Notes

- The user interface fully supports Bengali language options. Click the language switcher in the
  TopBar to switch between English (EN) and Bengali (বাংলা).
- Errors, validation notices, and MFA verification messages are localized dynamically based on your
  chosen language preference.
