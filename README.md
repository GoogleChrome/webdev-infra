> [!IMPORTANT]
> As of 6 December, 2023, this project is no longer maintained as upstream projects have moved to another platform. See the [migration announcement](https://web.dev/blog/webdev-migration?hl=en) for more info.

---

# webdev-infra

This package contains code used for https://web.dev and https://developer.chrome.com.

## Publish

To publish a new version, update the version in the package.json and create a new tag.

```bash
npm version patch
git push && git push --tags
```

This will cause CI to release a new version to npm.
