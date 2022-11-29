This is a placeholder README for the webdev-infra repo, which will contain
shared code for https://web.dev, https://developer.chrome.com and others.

## 🚨 Important

When you make a change to this repo be sure to push a new tag.

```bash
npm version patch
git push && git push --tags
```

This will cause CI to release a new version to npm.

## Workspaces
This repository makes use of NPM workspaces to leverage publishing multiple packages from one monorepo under the vendor namespace @webdev-infra (https://docs.npmjs.com/cli/v7/using-npm/workspaces)