#!/bin/bash
# Assignment 4 Bronze: Generate self-signed SSL certificate for HTTPS
# Run this script from the backend directory, then uncomment SSL lines in application.properties

echo "Generating self-signed SSL certificate for PharmaConnect..."

keytool -genkeypair \
  -alias pharmaconnect \
  -keyalg RSA \
  -keysize 2048 \
  -storetype PKCS12 \
  -keystore src/main/resources/pharmaconnect.p12 \
  -validity 365 \
  -storepass pharmaconnect \
  -keypass pharmaconnect \
  -dname "CN=PharmaConnect, OU=Dev, O=PharmaConnect, L=Cluj-Napoca, ST=Cluj, C=RO"

echo ""
echo "Certificate generated at: src/main/resources/pharmaconnect.p12"
echo ""
echo "To enable HTTPS, uncomment the SSL lines in application.properties:"
echo "  server.ssl.enabled=true"
echo "  server.ssl.key-store=classpath:pharmaconnect.p12"
echo "  server.ssl.key-store-password=pharmaconnect"
echo "  server.ssl.key-store-type=PKCS12"
echo "  server.ssl.key-alias=pharmaconnect"
echo ""
echo "Also update frontend API_BASE in src/app/api.ts:"
echo "  export const API_BASE = 'https://<SERVER_IP>:3001';"
