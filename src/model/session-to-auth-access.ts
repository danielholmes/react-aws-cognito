import { CognitoUserSession } from "amazon-cognito-identity-js";

type AuthAccess = {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly accessExpiration: Date;
};

function sessionToAuthAccess(session: CognitoUserSession): AuthAccess {
  return {
    accessToken: session.getAccessToken().getJwtToken(),
    refreshToken: session.getRefreshToken().getToken(),
    accessExpiration: new Date(session.getAccessToken().getExpiration() * 1000),
  };
}

export type { AuthAccess };
export default sessionToAuthAccess;
