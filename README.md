# Calls for Papers

## About

Calls for Papers shows you the latest calls for papers of academic journals in your discipline.

Calls for papers for special issues in academic journals are currently published in several different locations.
For example, calls for papers are distributed on mailing lists, on publisher websites, at conferences, and through personal networks.
With several academic journals in a discipline and even more special issues, it can be incredibly difficult to keep track of calls for papers.

**Calls for Papers solves this problem by collecting calls for papers and making them easily accessible in one location.**

This forked/customized version integrates the original [calls-for-papers](https://github.com/julianprester/calls-for-papers) project with a personal Special Issue Monitor, adding:

- **49 journals** across 5 fields (INFO MAN, OPS&TECH, OR&MANSCI, ORG STUD)
- **Research-profile based auto-rating** (🟢🟢🟢) for healthcare AI paradox research
- **Excel export** of monitored special issues
- Publisher-specific scraper factories for easier maintenance

## Usage

### Local development

```bash
# Install dependencies
npm install

# (Optional) Copy environment variables if you want to use Moonshot API instead of Kimi CLI
cp .env.example .env
# Edit .env with your OPENAI_API_KEY

# Scrape latest calls for papers
# By default this uses your local Kimi CLI (must be logged in).
# To use Moonshot API instead, set OPENAI_BASE_URL and OPENAI_API_KEY in .env.
npm run scrape

# Build the static website
npm run build

# Export Excel report from current data
npm run export-excel

# Start local dev server
npm start
```

## Project structure

```text
├── scrapers/
│   ├── journals/          # One scraper file per journal
│   │   └── utils/         # Publisher-specific scraper factories
│   ├── llmParser.mjs      # Parses raw HTML into structured call data
│   ├── rating.mjs         # Auto-rates calls against research_profile.json
│   └── diffChecker.mjs    # Merges new calls with existing calls.json
├── scripts/
│   └── export-excel.mjs   # Excel report generator
├── www/
│   ├── _data/
│   │   ├── calls.json     # Structured call data
│   │   ├── journals.json  # 49 journal metadata
│   │   └── research_profile.json  # Research profile + rating rules
│   └── _includes/         # Website templates
└── output/                # Generated Excel reports
```

## Configuration

### Research profile

Edit `www/_data/research_profile.json` to customize the auto-rating criteria:

```json
{
  "domain": "digital technologies or AI in healthcare",
  "focus": "paradox analysis and management strategies",
  "methodology": "qualitative research",
  "rating_rules": { "🟢🟢🟢": "...", "🟢🟢": "...", "🟢": "...", "🟡": "...", "🔴": "..." }
}
```

### Journals

The full journal list is in `www/_data/journals.json`. To add a new journal:

1. Add an entry to `www/_data/journals.json`
2. Create a scraper in `scrapers/journals/` (or use a publisher factory from `scrapers/journals/utils/`)
3. Run `npm run scrape` to collect data

## Available commands

| Command | Description |
|---|---|
| `npm start` | Start local dev server with hot reload |
| `npm run build` | Build production static site |
| `npm run scrape` | Run all journal scrapers, parse content, rate fit |
| `npm run rss` | Regenerate RSS feeds |
| `npm run export-excel` | Export current calls.json to Excel |

## Rating scale

Each special issue is automatically rated against the research profile:

| Rating | Meaning |
|---|---|
| 🟢🟢🟢 | Highly relevant |
| 🟢🟢 | Moderately relevant |
| 🟢 | Low relevance |
| 🟡 | Potentially relevant |
| 🔴 | Not relevant |

## Built With

### Scrapers

- [Node.js](https://nodejs.org/)
- [Puppeteer](https://pptr.dev/) / [Patchright](https://github.com/Kaliiiiiiiiii-Vinyzu/patchright)
- [Kimi Code CLI](https://kimi.moonshot.cn/) (default, for parsing and rating)
- [Moonshot API](https://platform.moonshot.cn/) (optional alternative)

### Website

- [Node.js](https://nodejs.org/)
- [11ty](https://www.11ty.dev/)
- [Alpine.js](https://alpinejs.dev/)
- [tailwindcss](https://tailwindcss.com/)
- [Moment.js](https://momentjs.com/)

## Support

Reach out to the maintainer at one of the following places:

- [GitHub issues](https://github.com/julianprester/calls-for-papers/issues)
- The email which is located [on this website](https://julianprester.com)

## Contributing

First off, thanks for taking the time to contribute!
Contributions are what make the open-source community such an amazing place to learn, inspire, and create.
Any contributions you make will benefit everybody else and are **greatly appreciated**.

We have set up a separate document containing our [contribution guidelines](CONTRIBUTING.md).

Thank you for being involved!

## Authors & contributors

The original setup of this repository is by [Julian Prester](https://julianprester.com).

For a full list of all authors and contributors, check [the contributor's page](https://github.com/julianprester/calls-for-papers/contributors).

## Security & Terms

Calls for Papers follows good practices of security, but 100% security can't be granted in software.
Calls for Papers is provided **"as is"** without any **warranty**. Use at your own risk.

## License

This project is licensed under the **MIT** license.

See [LICENSE](https://github.com/julianprester/calls-for-papers/blob/main/LICENSE) for more information.

## Acknowledgements

- [Git scraping](https://simonwillison.net/2020/Oct/9/git-scraping/)
