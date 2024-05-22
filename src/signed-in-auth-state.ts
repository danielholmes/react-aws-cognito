import { omit, partial } from "lodash-es";
import {
  InternalAuthStateSetter,
  SignedInInternalAuthState,
} from "./model/internal-state.ts";
import refreshSession from "./model/refresh-session.ts";
import resendEmailAddressVerification from "./model/resend-email-address-verification.ts";
import verifyEmailAddress from "./model/verify-email-address.ts";
import enableMfa from "./model/enable-mfa.ts";
import disableMfa from "./model/disable-mfa.ts";
import getMfaCodeInfo from "./model/get-mfa-code-info.ts";
import changePassword from "./model/change-password.ts";
import { UserParser } from "./model/get-current-user.ts";

type Options<TUser> = {
  readonly mfaIssuer: string;
  readonly mfaDeviceName: string;
  readonly authState: SignedInInternalAuthState<TUser>;
  readonly parseUser: UserParser<TUser>;
  readonly setInternalAuthState: InternalAuthStateSetter<TUser>;
  readonly refreshUser: () => void;
};

function createSignedInAuthState<TUser>({
  setInternalAuthState,
  parseUser,
  refreshUser,
  mfaIssuer,
  mfaDeviceName,
  authState: { user, authUser },
}: Options<TUser>) {
  return {
    type: "signedIn" as const,
    async getValidAccessToken() {
      const { accessToken, accessExpiration, refreshToken } = authUser;
      const refreshTime = accessExpiration.getTime() - 3 * 60 * 1000;

      // Refresh time in the future, use current access token.
      if (refreshTime > new Date().getTime()) {
        return accessToken;
      }

      // New token is applied via CognitoUserPool refresh callback, but return the new
      // refreshed token for immediate use.
      return refreshSession(user, refreshToken);
    },
    async signOut() {
      await new Promise<void>((resolve) => user.signOut(resolve));
      setInternalAuthState({
        type: "signedOut",
      });
    },
    user: omit(authUser, "refreshToken", "accessToken", "accessExpiration"),
    changePassword: partial(changePassword, user),
    enableMfa: partial(
      enableMfa,
      mfaDeviceName,
      setInternalAuthState,
      parseUser,
      user,
    ),
    disableMfa: async () => disableMfa(setInternalAuthState, parseUser, user),
    getMfaCodeInfo: partial(getMfaCodeInfo, mfaIssuer, user),
    refreshUser,
    verifyEmailAddress: partial(
      verifyEmailAddress,
      setInternalAuthState,
      parseUser,
      user,
    ),
    resendEmailAddressVerification: partial(
      resendEmailAddressVerification,
      user,
    ),
  };
}

type SignedInAuthState<TUser> = ReturnType<
  typeof createSignedInAuthState<TUser>
>;

export type { SignedInAuthState };
export { createSignedInAuthState };
