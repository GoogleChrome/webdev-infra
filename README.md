This is a placeholder README for the webdev-infra repo, which will contain
shared code for https://web.dev, https://developer.chrome.com and others.

## 🚨 Important

When you make a change to this repo be sure to push a new tag.

```bash
npm version patch
git push && git push --tags
```

Then in your project install it again to grab the latest:

```bash
npm install --save-dev github:googlechrome/webdev-infra#semver:^1
```

Eventually we'll set this up to use GitHub Actions or something fancy, but for 
now make sure to you push a new tag.