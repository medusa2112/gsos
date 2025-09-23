# Tray.io Integration

- Inbound Webhooks: plan API Gateway route `/tray/webhook` to receive events.
- Outbound Actions: call Tray workflows using signed HTTP requests from `services/api`.
- Use AWS Secrets Manager for `TRAY_AUTH_TOKEN` and load via Lambda env.
