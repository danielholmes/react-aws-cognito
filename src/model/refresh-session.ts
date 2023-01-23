import {
  CognitoRefreshToken,
  CognitoUser,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

async function refreshSession(
  user: CognitoUser,
  refreshToken: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    user.refreshSession(
      new CognitoRefreshToken({ RefreshToken: refreshToken }),
      (error, data: CognitoUserSession) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(data.getAccessToken().getJwtToken());
      }
    );
  });
}

export default refreshSession;
