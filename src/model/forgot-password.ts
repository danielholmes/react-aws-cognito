import {
  CognitoUserPool,
  ICognitoStorage,
  CognitoUser,
} from "amazon-cognito-identity-js";

async function forgotPassword(
  {
    userPool,
    storage,
  }: { userPool: CognitoUserPool; storage: ICognitoStorage },
  email: string
): Promise<void> {
  const user = new CognitoUser({
    Username: email,
    Pool: userPool,
    Storage: storage,
  });
  // TODO: Look at source - use UserPool instead
  // https://github.com/aws-amplify/amplify-js/blob/master/packages/
  // amazon-cognito-identity-js/src/CognitoUser.js
  return new Promise<void>((resolve, reject) => {
    user.forgotPassword({
      onSuccess() {
        resolve();
      },
      onFailure: reject,
      inputVerificationCode() {
        resolve();
      },
    });
  });
}

export default forgotPassword;
