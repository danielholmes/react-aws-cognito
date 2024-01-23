import {
  CognitoUserAttribute,
  CognitoUserPool,
  ISignUpResult,
} from "amazon-cognito-identity-js";
import { SignUpVariables } from "../state";

async function signUp(
  userPool: CognitoUserPool,
  { emailAddress, password, extraAttributes }: SignUpVariables,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    userPool.signUp(
      emailAddress,
      password,
      [
        new CognitoUserAttribute({
          Name: "email",
          Value: emailAddress,
        }),
        ...Object.entries(extraAttributes ?? {}).map(
          ([k, v]) =>
            new CognitoUserAttribute({
              Name: k,
              Value: v,
            }),
        ),
      ],
      [],
      (error?: Error, result?: ISignUpResult) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Error trying to sign up user"));
          return;
        }
        resolve();
      },
    );
  });
}

export default signUp;
