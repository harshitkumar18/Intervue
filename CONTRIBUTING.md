# Contributing to Live Polling System

Thank you for your interest in contributing to the Live Polling System! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ 
- npm or yarn
- Git

### Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/live-polling-system.git
   cd live-polling-system
   ```
3. Run the setup script:
   ```bash
   npm run setup
   ```
4. Start development servers:
   ```bash
   npm run dev
   ```

## 🛠️ Development

### Project Structure
```
live-polling-system/
├── frontend/          # React frontend application
├── backend/           # Express.js backend server
├── scripts/           # Setup and development scripts
├── .github/           # GitHub Actions workflows
└── docs/              # Documentation
```

### Available Scripts
- `npm run setup` - Initial project setup
- `npm run dev` - Start both frontend and backend
- `npm run server` - Start only backend
- `npm run client` - Start only frontend
- `npm run build` - Build frontend for production

### Code Style
- Use consistent indentation (2 spaces)
- Follow existing naming conventions
- Add comments for complex logic
- Use meaningful variable and function names

## 🐛 Reporting Issues

When reporting issues, please include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots if applicable

## 🔧 Making Changes

### Branch Naming
Use descriptive branch names:
- `feature/add-new-feature`
- `fix/resolve-bug-description`
- `docs/update-readme`

### Commit Messages
Use clear, descriptive commit messages:
- `feat: add real-time chat functionality`
- `fix: resolve timer synchronization issue`
- `docs: update deployment instructions`

### Pull Request Process
1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Update documentation if needed
5. Submit a pull request with:
   - Clear description of changes
   - Screenshots if UI changes
   - Testing instructions

## 🧪 Testing

### Manual Testing
Before submitting a PR, test:
- [ ] Frontend loads correctly
- [ ] Backend starts without errors
- [ ] Socket.io connection works
- [ ] Poll creation and participation
- [ ] Real-time updates
- [ ] Chat functionality
- [ ] Timer synchronization

### Testing Checklist
- [ ] Teacher can create polls
- [ ] Students can join and answer
- [ ] Results display correctly
- [ ] Timer works properly
- [ ] Chat messages send/receive
- [ ] Multiple browser tabs work
- [ ] Mobile responsiveness

## 📝 Documentation

When adding new features:
- Update README.md if needed
- Add comments to complex code
- Update API documentation
- Include usage examples

## 🚀 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## 📋 Code Review

All submissions require review. Please:
- Respond to feedback promptly
- Make requested changes
- Test changes after updates
- Keep PRs focused and small

## 🎯 Areas for Contribution

- UI/UX improvements
- Performance optimizations
- Additional features
- Bug fixes
- Documentation
- Testing
- Accessibility improvements

## 📞 Getting Help

- Check existing issues first
- Join discussions in issues
- Ask questions in pull requests
- Review documentation

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
