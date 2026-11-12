async function main() {
  try {
    process.loadEnvFile(".env");
  } catch {
    /* environment may already be provided */
  }
  const { runJobs } = await import("../src/lib/server/email");
  const { closeDb } = await import("../src/lib/server/db");
  try {
    console.log(JSON.stringify(await runJobs(), null, 2));
  } finally {
    closeDb();
  }
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Job failed");
  process.exitCode = 1;
});
