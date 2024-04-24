import {
  CognitoUserPool,
  ICognitoStorage,
  CognitoUser,
} from "amazon-cognito-identity-js";

async function confirmForgotPassword(
  {
    userPool,
    storage,
  }: { userPool: CognitoUserPool; storage: ICognitoStorage },
  email: string,
  code: string,
  newPassword: string,
) {
  const user = new CognitoUser({
    Username: email,
    Pool: userPool,
    Storage: storage,
  });
  return new Promise<void>((resolve, reject) => {
    user.confirmPassword(code, newPassword, {
      onSuccess() {
        resolve();
      },
      onFailure: reject,
    });
  });
}

export default confirmForgotPassword;
