import {
  CognitoUser,
  CognitoUserPool,
  ICognitoStorage,
} from "amazon-cognito-identity-js";

async function resendConfirmation(
  userPool: CognitoUserPool,
  storage: ICognitoStorage,
  emailAddress: string,
) {
  const user = new CognitoUser({
    Username: emailAddress,
    Pool: userPool,
    Storage: storage,
  });

  await new Promise<void>((resolve, reject) => {
    user.resendConfirmationCode((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export default resendConfirmation;
