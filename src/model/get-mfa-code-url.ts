import { CognitoUser } from "amazon-cognito-identity-js";

async function getMfaCodeUrl(user: CognitoUser, emailAddress: string) {
  return new Promise<string>((resolve, reject) => {
    user.associateSoftwareToken({
      associateSecretCode: (secretCode: string) => {
        const encodedIssuer = encodeURIComponent("Diagno Energy");
        // Note: Encoding is a bit weird. When using URLSearchParams
        // the result puts a + in "Diagno Energy" when we want a space.
        // When putting a space then something funky also happens.
        const qrCodeUri = `otpauth://totp/${encodedIssuer}:${encodeURIComponent(
          emailAddress,
        )}?secret=${encodeURIComponent(secretCode)}&issuer=${encodedIssuer}`;
        resolve(qrCodeUri);
      },
      onFailure: reject,
    });
  });
}

export default getMfaCodeUrl;
