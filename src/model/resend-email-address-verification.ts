import { CognitoUser } from "amazon-cognito-identity-js";

async function resendEmailAddressVerification(user: CognitoUser) {
  return new Promise<void>((resolve, reject) => {
    user.getAttributeVerificationCode("email", {
      onSuccess() {
        resolve();
      },
      onFailure: reject,
    });
  });
}

export default resendEmailAddressVerification;
