import { CognitoUser } from "amazon-cognito-identity-js";

type MfaCodeInfo = {
  readonly secretCode: string;
  readonly otpAuthUri: string;
};

async function getMfaCodeInfo(
  issuer: string,
  user: CognitoUser,
  emailAddress: string,
) {
  return new Promise<MfaCodeInfo>((resolve, reject) => {
    user.associateSoftwareToken({
      associateSecretCode: (secretCode: string) => {
        const encodedIssuer = encodeURIComponent(issuer);
        // Note: Encoding is a bit weird. When using URLSearchParams
        // the result puts a + in "Something with space" when we want a space.
        // When putting a space then something funky also happens.
        const otpAuthUri = `otpauth://totp/${encodedIssuer}:${encodeURIComponent(
          emailAddress,
        )}?secret=${encodeURIComponent(secretCode)}&issuer=${encodedIssuer}`;
        resolve({
          secretCode,
          otpAuthUri,
        });
      },
      onFailure: reject,
    });
  });
}

export default getMfaCodeInfo;
