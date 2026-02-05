# Contributing to Pi Vertex Anthropic

Thank you for considering contributing to this project! 🎉

## How to Contribute

### Reporting Bugs

If you find a bug, please [open an issue](https://github.com/skyfallsin/pi-vertex-anthropic/issues/new) with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your environment:
  - Pi version
  - Node.js version
  - gcloud SDK version
  - Operating system
- Relevant logs or error messages

### Suggesting Features

Feature requests are welcome! Please [open an issue](https://github.com/skyfallsin/pi-vertex-anthropic/issues/new) describing:

- The problem you're trying to solve
- Your proposed solution
- Any alternative solutions you've considered
- How this benefits other users

### Pull Requests

1. **Fork the repository**
   ```bash
   gh repo fork skyfallsin/pi-vertex-anthropic --clone
   cd pi-vertex-anthropic
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clear, commented code
   - Follow the existing code style
   - Test your changes thoroughly

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add feature: brief description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Go to the [repository](https://github.com/skyfallsin/pi-vertex-anthropic)
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template
   - Submit!

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Pi coding agent installed
- Google Cloud SDK with gcloud CLI
- Git

### Local Development

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/pi-vertex-anthropic.git
cd pi-vertex-anthropic

# Install dependencies
npm install

# Link for local testing
mkdir -p ~/.pi/agent/extensions/vertex-anthropic-dev
ln -s $(pwd)/index.ts ~/.pi/agent/extensions/vertex-anthropic-dev/index.ts
ln -s $(pwd)/package.json ~/.pi/agent/extensions/vertex-anthropic-dev/package.json
```

### Testing Your Changes

1. Update your Pi settings to use the dev extension
2. Start Pi with debug logging: `pi --debug`
3. Test various scenarios:
   - Simple text requests
   - Multi-turn conversations
   - Tool calls
   - Image inputs
   - Extended thinking
   - Error handling (abort requests, etc.)

### Code Style

- Use TypeScript
- Follow the existing naming conventions
- Add comments for complex logic
- Keep functions focused and modular
- Use meaningful variable names

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other unethical or unprofessional conduct

## Questions?

- 💬 [GitHub Discussions](https://github.com/skyfallsin/pi-vertex-anthropic/discussions)
- 🐛 [Issue Tracker](https://github.com/skyfallsin/pi-vertex-anthropic/issues)
- 📧 Contact maintainer via GitHub

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make this project better! 🚀
