/**
 * Firestore rules tests. Run via:
 *   firebase emulators:exec --only firestore "npm --prefix rules test"
 *
 * Each test creates an authed or unauthed context and asserts allow/deny.
 */
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_ID = "polaris-rules-test";

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(__dirname, "..", "firestore.rules"), "utf8"),
    },
  });
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
  if (testEnv) await testEnv.clearFirestore();
});

describe("firestore.rules", () => {
  it("authed user can read their own user doc", async () => {
    const alice = testEnv.authenticatedContext("alice").firestore();
    await assertSucceeds(getDoc(doc(alice, "users/alice")));
  });

  it("authed user cannot read another user's doc", async () => {
    const alice = testEnv.authenticatedContext("alice").firestore();
    await assertFails(getDoc(doc(alice, "users/bob")));
  });

  it("unauthenticated read is denied", async () => {
    const anon = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anon, "users/alice")));
  });

  it("client cannot write document metadata directly (server-only)", async () => {
    const alice = testEnv.authenticatedContext("alice").firestore();
    await assertFails(
      setDoc(doc(alice, "users/alice/documents/doc1"), {
        filename: "x.pdf",
        status: "uploaded",
      }),
    );
  });

  it("default deny: arbitrary collections are blocked", async () => {
    const alice = testEnv.authenticatedContext("alice").firestore();
    await assertFails(getDoc(doc(alice, "secrets/anything")));
  });
});
