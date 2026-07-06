/**
 * Storage rules tests. Run via:
 *   firebase emulators:exec --only storage "npm --prefix rules test"
 */
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { getBytes, ref, uploadString } from "firebase/storage";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PROJECT_ID = "polaris-rules-test";

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: {
      rules: readFileSync(resolve(__dirname, "..", "storage.rules"), "utf8"),
    },
  });
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
  if (testEnv) await testEnv.clearStorage();
});

describe("storage.rules", () => {
  it("authed user can upload a small PDF under their own prefix", async () => {
    const alice = testEnv.authenticatedContext("alice").storage();
    await assertSucceeds(
      uploadString(
        ref(alice, "users/alice/doc1/notes.pdf"),
        "%PDF-1.4 fake",
        "raw",
        { contentType: "application/pdf" },
      ),
    );
  });

  it("authed user cannot upload to another user's prefix", async () => {
    const alice = testEnv.authenticatedContext("alice").storage();
    await assertFails(
      uploadString(
        ref(alice, "users/bob/doc1/notes.pdf"),
        "%PDF-1.4 fake",
        "raw",
        { contentType: "application/pdf" },
      ),
    );
  });

  it("rejects disallowed mime types", async () => {
    const alice = testEnv.authenticatedContext("alice").storage();
    await assertFails(
      uploadString(
        ref(alice, "users/alice/doc1/bad.exe"),
        "MZ",
        "raw",
        { contentType: "application/octet-stream" },
      ),
    );
  });

  it("unauthenticated read is denied", async () => {
    const anon = testEnv.unauthenticatedContext().storage();
    await assertFails(getBytes(ref(anon, "users/alice/doc1/notes.pdf")));
  });
});
