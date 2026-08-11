'use strict';

module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXUS_RELEASE_SHA || 'unknown';
  const branch = process.env.VERCEL_GIT_COMMIT_REF || process.env.NEXUS_RELEASE_BRANCH || 'unknown';
  const deployment = process.env.VERCEL_URL || null;
  const expected = process.env.NEXUS_EXPECTED_RELEASE_SHA || null;
  const gitLinkedMain = commit !== 'unknown' && branch === 'main';
  const pinnedMatch = Boolean(expected && commit !== 'unknown' && commit.startsWith(expected));
  const inSync = expected ? pinnedMatch : gitLinkedMain;
  return res.status(200).json({
    contract:'operations.deployment-sync.v2',
    commit,
    branch,
    deployment,
    expected_release_sha: expected,
    sync_mode: expected ? 'pinned_release' : 'git_linked_main',
    git_linked_main: gitLinkedMain,
    pinned_match: pinnedMatch,
    in_sync: inSync,
    source_of_truth:'github:tmwe-dev/nexus:main',
    originals_modified:false
  });
};
