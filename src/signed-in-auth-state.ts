import { omit, partial } from "lodash-es";
import { sub, isFuture } from "date-fns";
import {
  InternalAuthStateSetter,
  SignedInInternalAuthState,
} from "./model/internal-state";
import refreshSession from "./model/refresh-session";
import resendEmailAddressVerification from "./model/resend-email-address-verification";
import verifyEmailAddress from "./model/verify-email-address";
import enableMfa from "./model/enable-mfa";
import disableMfa from "./model/disable-mfa";
import getMfaCodeUrl from "./model/get-mfa-code-url";
import changePassword from "./model/change-password";
import { UserParser } from "./model/get-current-user";

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
      const refreshTime = sub(accessExpiration, { minutes: 3 });

      // Refresh time in the future, use current access token.
      if (isFuture(refreshTime)) {
        return accessToken;
      }

      // New token is applied via CognitoUserPool refresh callback, but return the new
      // refreshed token for immediate use.
      return refreshSession(user, refreshToken);
    },
    signOut() {
      user.signOut();
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
    disableMfa: partial(disableMfa, setInternalAuthState, parseUser, user),
    getMfaCodeUrl: partial(getMfaCodeUrl, mfaIssuer, user),
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
