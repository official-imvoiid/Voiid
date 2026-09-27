# Security Policy

## Reporting a vulnerability

If you find a security issue in this project or in the live VOIID website,
**please report it privately. Do not open a public GitHub issue.**

- Use GitHub's **[private vulnerability reporting](https://github.com/official-imvoiid/Voiid/security/advisories/new)**, or
- Send a message through the contact page of the official website.

Please include:

- what the issue is and where (file, route or page);
- steps to reproduce, or a proof of concept;
- the impact you think it has.

I'll aim to acknowledge reports within **7 days** and let you know when a fix
ships. Reporters who want credit will be thanked in the [CHANGELOG](CHANGELOG.md).

## Rules for testing

Good-faith research is welcome. Please:

- test against **your own local copy** (`npm run server` + `npm run dev`) wherever possible;
- **do not** run automated scanners, brute-force the admin login, load-test,
  or send spam through the contact form on the live site;
- **do not** access, change or delete data that isn't yours, and stop as soon
  as you've confirmed an issue;
- give reasonable time for a fix before disclosing publicly.

## Scope

In scope: the code in this repository and the live site built from it.
Out of scope: third-party libraries (report those upstream), social-media
accounts, and issues that only exist in forks.

## Running your own copy safely

If you deploy a fork, you are responsible for its security. At minimum:

- keep `.env` and `Code/data/` out of git, and use long random secrets;
- serve the site over **HTTPS** with `NODE_ENV=production`;
- enable two-factor authentication in the admin panel;
- keep dependencies updated (`npm audit`, `npm outdated`).
