import { CognitoUser } from "amazon-cognito-identity-js";

async function changePassword(
  user: CognitoUser,
  currentPassword: string,
  newPassword: string,
) {
  return new Promise<void>((resolve, reject) => {
    user.changePassword(currentPassword, newPassword, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export default changePassword;
