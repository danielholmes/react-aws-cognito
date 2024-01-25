import { CognitoUserSession } from "amazon-cognito-identity-js";

function sessionToAuthAccess(session: CognitoUserSession) {
  return {
    accessToken: session.getAccessToken().getJwtToken(),
    refreshToken: session.getRefreshToken().getToken(),
    accessExpiration: new Date(session.getAccessToken().getExpiration() * 1000),
  };
}

type AuthAccess = ReturnType<typeof sessionToAuthAccess>;

export type { AuthAccess };
export default sessionToAuthAccess;
