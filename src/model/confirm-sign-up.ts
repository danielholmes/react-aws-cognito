import {
  CognitoUserPool,
  CognitoUser,
  ICognitoStorage,
} from "amazon-cognito-identity-js";

async function confirmSignUp(
  userPool: CognitoUserPool,
  storage: ICognitoStorage,
  emailAddress: string,
  code: string,
) {
  const user = new CognitoUser({
    Username: emailAddress,
    Pool: userPool,
    Storage: storage,
  });

  await new Promise<void>((resolve, reject) => {
    user.confirmRegistration(code, false, (error?: Error, result?: any) => {
      if (error) {
        reject(error);
        return;
      }
      if (result !== "SUCCESS") {
        reject(new Error("Error trying to confirm sign up"));
        return;
      }
      resolve();
    });
  });
}

export default confirmSignUp;
