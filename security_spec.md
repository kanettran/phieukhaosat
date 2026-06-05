# Security Spec: TOLUCK Firebase Security Hardening

## 1. Data Invariants
1. A regular user cannot edit their own `role` or privilege levels.
2. Only an authenticated user with `ADMIN` or correct privilege can edit general configs or manage other user privileges.
3. Every write log or login history must be immutable; deletions or updates to logs are strictly blocked.
4. Any survey created must assign its creator as the logged-in user.
5. All critical fields (`createdAt`/`updatedAt`) must rely on server trusted parameters.

## 2. The "Dirty Dozen" Exploit Payloads
1. **User Role Privilege Escalation**: Regular user trying to set their own role to `ADMIN`.
2. **Anonymous Creation**: Attempting to write a CRM Lead document or settings check without authentication.
3. **Ghost Fields Injection**: Sending random shadow parameters (e.g., `ghost_field: "injected"`) during survey config update.
4. **Log State Update Attack**: Standard user attempting to modify history log contents.
5. **Log Deletion Attack**: Malicious attacker attempting to clear logs or login history.
6. **Config Tampering**: Non-admin attempting to fetch or modify system-wide SMTP or API keys configuration doc.
7. **Spoof Email Attack**: Standard user authenticating but claiming another admin's email.
8. **Resource Poisoning ID Inject**: Attempt to write a document with an ID exceeding 128 characters or containing illegal invalid chars.
9. **Null Auth Leak**: Read/write requests targeting client profile information when not authenticated at all.
10. **State Shortcutting**: Skipping status transitions inside CRM leads without authentication context.
11. **Bypassing Server Timestamps**: User attempting to inject a historical or spoofed client-provided timestamp instead of `request.time`.
12. **Blanket Query Scraping**: A user trying to request other clients' private lead reports through blanket query sweeps in client environments.

## 3. Safe Test Runner Reference (Verification Plan)
The following Firestore rules blocks prevent unauthorized operations. All operations matching these exploit vectors are fully barred by matching rule assertions.
