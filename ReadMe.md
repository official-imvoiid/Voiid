# VOIID

Personal portfolio website of Voiid, a developer and cyber-security student.
Built with React and Vite, with a self-hosted Express backend.

## Features

- Portfolio pages: skills, development projects, art, literature, 3D models, certifications, music, games and learning roadmaps
- Notes library with folders, search and in-page PDF viewing
- 3D model viewer (VRM, GLB, FBX, OBJ)
- JavaScript coding game running in a sandboxed frame
- Contact form with server-side bot protection (no third-party services)
- Admin portal with two-factor authentication, encrypted inbox and content editor
- Separate layouts for desktop, mobile portrait and mobile landscape

## Tech Stack

- **Frontend:** React 19, React Router 7, Vite 6, Three.js
- **Backend:** Node.js, Express 4, Helmet, express-rate-limit
- **Storage:** Local files, messages and secrets encrypted with AES-256-GCM

## Setup

Requires Node.js 20 or later.

```bash
git clone https://github.com/official-imvoiid/Voiid.git
cd Voiid/Code
npm install
cp .env.example .env
```

Fill in `.env` as described in `.env.example`. Then start the backend and the dev server in separate terminals:

```bash
npm run server
npm run dev
```

The site runs at `http://localhost:5000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run server` | Start the backend |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Deployment

1. Run `npm run build`.
2. Run `server.js` with `NODE_ENV=production`.
3. Serve `dist/` through a reverse proxy over HTTPS, forwarding `/api`, `/uploads` and `/files` to the backend.
4. Set `TRUST_PROXY_HOPS` to the number of proxies in front of the server.

Never commit `.env` or the `data/` directory.

## Security

Please report vulnerabilities privately. See [SECURITY.md](SECURITY.md).

## License

This project is licensed under the [Voiid Personal & Educational License](LICENSE).

- Personal and educational use is permitted.
- Forks and redistribution are permitted, provided the license is kept and the changes made are recorded in `CHANGELOG.md`.
- Pull requests must describe what was changed, in which files and why, and include the matching `CHANGELOG.md` entry.
- Commercial use requires prior written permission.
- Personal content (artwork, music, writing, models, name and identity) is not licensed for reuse.

## Contact

- GitHub: [official-imvoiid](https://github.com/official-imvoiid)
- LinkedIn: [voiidnova](https://www.linkedin.com/in/voiidnova/)
- Instagram: [i.m.voiid](https://www.instagram.com/i.m.voiid/)
